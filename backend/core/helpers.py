from datetime import timedelta
from functools import cache

import boto3
from asgiref.sync import async_to_sync
from botocore.client import Config
from botocore.exceptions import ClientError
from channels.db import database_sync_to_async
from channels.layers import get_channel_layer
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils.text import get_valid_filename, slugify
from django.utils.translation import gettext_lazy as _
from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.settings import api_settings as jwt_settings
from rest_framework_simplejwt.tokens import AccessToken


# --- Errors -----------------------------------------------------------------

class RequiredFieldsError(APIException):
    """One or more required fields are missing from the request.

    raise RequiredFieldsError(['name', 'email']) -> 400 with
    {"name": ["This field is required."], "email": ["This field is required."]}
    """

    status_code = status.HTTP_400_BAD_REQUEST
    default_code = 'required_fields'

    def __init__(self, fields):
        detail = {field: [_('This field is required.')] for field in fields}
        super().__init__(detail=detail)


# --- WebSocket (Channels) ---------------------------------------------------

BROADCAST_GROUP = 'broadcast'


def user_group_name(user_id: int) -> str:
    """Group every socket of one user joins (see core/consumers.py)."""
    return f'user_{user_id}'


def send_group_message(group: str, content: dict) -> None:
    """Pushes `content` as JSON to every socket in `group`. Safe to call from
    sync code: viewsets, actions, Celery tasks."""
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(group, {
        'type': 'group.message',
        'content': content,
    })


def send_user_message(user_id: int, content: dict) -> None:
    send_group_message(user_group_name(user_id), content)


def send_broadcast_message(content: dict) -> None:
    send_group_message(BROADCAST_GROUP, content)


@database_sync_to_async
def get_user_from_token(token: str | None):
    """Resolves a JWT access token (the same one the REST API uses) to an
    active user, or None when the token is missing, invalid or expired."""
    if not token:
        return None
    try:
        access = AccessToken(token)
    except TokenError:
        return None
    return get_user_model().objects.active().filter(pk=access[jwt_settings.USER_ID_CLAIM]).first()


# --- Object storage (SeaweedFS S3 gateway) -----------------------------------
#
# Objects are namespaced by an "owner" (any object with a `.name` attribute,
# or a plain string/slug) and a "category" (any string you choose, e.g.
# "avatars", "invoices", "reports") — layout:
#
#   <owner-slug>/<category>/<filename>
#
# One bucket is used for the whole application; owner/category are just path
# segments, not separate buckets. Configure SEAWEEDFS_* in config/settings.py
# (see env_or_config) before using these.

_ensured_buckets: set[str] = set()


@cache
def get_storage_client():
    return boto3.client(
        's3',
        endpoint_url=settings.SEAWEEDFS_S3_ENDPOINT,
        aws_access_key_id=settings.SEAWEEDFS_ACCESS_KEY,
        aws_secret_access_key=settings.SEAWEEDFS_SECRET_KEY,
        region_name=settings.SEAWEEDFS_REGION,
        config=Config(signature_version='s3v4', s3={'addressing_style': 'path'}),
    )


def ensure_bucket(bucket: str | None = None) -> None:
    """Creates the bucket on first use; checked once per process."""
    bucket = bucket or settings.SEAWEEDFS_BUCKET
    if bucket in _ensured_buckets:
        return
    client = get_storage_client()
    try:
        client.head_bucket(Bucket=bucket)
    except ClientError as error:
        if error.response.get('Error', {}).get('Code') not in ('404', 'NoSuchBucket'):
            raise
        client.create_bucket(Bucket=bucket)
    _ensured_buckets.add(bucket)


def build_object_path(owner, category: str, filename: str) -> str:
    owner_slug = slugify(owner.name if hasattr(owner, 'name') else owner)
    return f'{owner_slug}/{category}/{get_valid_filename(filename)}'


def upload_fileobj(file_obj, owner, category: str, filename: str, content_type=None) -> str:
    """Uploads a Django UploadedFile (or any binary stream), multipart when large."""
    ensure_bucket()
    object_path = build_object_path(owner, category, filename)
    file_obj.seek(0)
    get_storage_client().upload_fileobj(
        file_obj,
        settings.SEAWEEDFS_BUCKET,
        object_path,
        ExtraArgs={'ContentType': content_type or 'application/octet-stream'},
    )
    return object_path


def upload_bytes(data: bytes, owner, category: str, filename: str, content_type=None) -> str:
    ensure_bucket()
    object_path = build_object_path(owner, category, filename)
    get_storage_client().put_object(
        Bucket=settings.SEAWEEDFS_BUCKET,
        Key=object_path,
        Body=data,
        ContentType=content_type or 'application/octet-stream',
    )
    return object_path


def get_bytes(object_path: str) -> bytes:
    response = get_storage_client().get_object(Bucket=settings.SEAWEEDFS_BUCKET, Key=object_path)
    with response['Body'] as body:
        return body.read()


def get_presigned_url(object_path: str, expires: timedelta = timedelta(hours=1)) -> str:
    return get_storage_client().generate_presigned_url(
        'get_object',
        Params={'Bucket': settings.SEAWEEDFS_BUCKET, 'Key': object_path},
        ExpiresIn=int(expires.total_seconds()),
    )


def delete_object(object_path: str) -> None:
    """Idempotent: deleting a missing key is not an error in S3."""
    get_storage_client().delete_object(Bucket=settings.SEAWEEDFS_BUCKET, Key=object_path)
