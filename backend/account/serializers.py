from django.contrib.auth import authenticate
from django.contrib.auth.models import update_last_login
from django.utils.translation import gettext_lazy as _
from rest_framework import exceptions, serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.settings import api_settings

from account import models


class AccountUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.AccountUser
        fields = [
            'id', 'email', 'username', 'registration_number',
            'first_name', 'last_name', 'cellphone', 'is_staff',
        ]
        read_only_fields = fields


class LoginSerializer(TokenObtainPairSerializer):
    """Accepts email, username or registration_number as the login identifier
    and returns the JWT pair plus the serialized user."""

    username_field = 'identifier'

    default_error_messages = {
        'no_active_account': _('Invalid credentials or inactive user.'),
    }

    def validate(self, attrs):
        identifier = attrs[self.username_field]
        user = models.AccountUser.objects.get_by_identifier(identifier)
        # An unknown identifier still goes through authenticate(): Django's
        # ModelBackend then runs the password hasher anyway, so response time
        # doesn't reveal which accounts exist.
        self.user = authenticate(
            self.context.get('request'),
            email=user.email if user else identifier,
            password=attrs['password'],
        )
        if not api_settings.USER_AUTHENTICATION_RULE(self.user):
            raise exceptions.AuthenticationFailed(self.error_messages['no_active_account'], 'no_active_account')

        refresh = self.get_token(self.user)
        if api_settings.UPDATE_LAST_LOGIN:
            update_last_login(None, self.user)

        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': AccountUserSerializer(self.user).data,
        }
