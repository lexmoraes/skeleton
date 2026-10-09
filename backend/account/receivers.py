from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from account import models, tasks


@receiver(post_save, sender=models.AccountUser, dispatch_uid='notify_account_updated')
def notify_account_updated(sender, **kwargs):
    user = kwargs.get('instance')
    update_fields = kwargs.get('update_fields')
    # Skip sign-up and the last_login bump every login does — only real
    # profile edits are worth a push.
    if kwargs.get('created') or (update_fields and set(update_fields) <= {'last_login'}):
        return
    transaction.on_commit(lambda: tasks.notify_account_updated.delay(user.pk))
