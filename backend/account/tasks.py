from celery import shared_task

from account import actions, queries


@shared_task(queue='default')
def notify_account_updated(user_id: int):
    user = queries.get_user_by_id(user_id)
    if user is not None:
        actions.AccountUserActions.notify_account_updated(user)


@shared_task()
def flush_expired_tokens():
    actions.AccountTokenActions.flush_expired_tokens()
