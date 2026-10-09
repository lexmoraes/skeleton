from django.apps import AppConfig


class AccountConfig(AppConfig):
    name = 'account'

    def ready(self):
        from account import receivers  # noqa: F401
        super().ready()
