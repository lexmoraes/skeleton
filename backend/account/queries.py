from account import models


def get_user_by_id(user_id: int):
    """The user with this id, or None (e.g. deleted before a task ran)."""
    return models.AccountUser.objects.filter(pk=user_id).first()


def filter_active_users(search: str = None):
    queryset = models.AccountUser.objects.active()
    if search:
        queryset = queryset.by_identifier(search)
    return queryset
