from celery import shared_task

from core import helpers


@shared_task(queue='default')
def delete_storage_object(object_path: str):
    """Removes an object from storage off the request cycle — e.g. from a
    post_delete receiver: tasks.delete_storage_object.delay(instance.file_path)."""
    helpers.delete_object(object_path)
