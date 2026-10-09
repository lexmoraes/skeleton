from django.core.management import call_command

from account import models, serializers
from core import helpers


class AccountUserActions:
    @staticmethod
    def notify_account_updated(user: 'models.AccountUser'):
        """Pushes the fresh profile to every open socket of that user."""
        helpers.send_user_message(user.id, {
            'event': 'account.updated',
            'user': serializers.AccountUserSerializer(user).data,
        })


class AccountTokenActions:
    @staticmethod
    def flush_expired_tokens():
        """Drops expired refresh tokens from the simplejwt blacklist tables."""
        call_command('flushexpiredtokens')
