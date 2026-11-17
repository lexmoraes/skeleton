from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models.functions import Lower
from django.utils.translation import gettext_lazy as _

from account import managers
from core import models as core_models


class AccountUser(AbstractUser, core_models.BaseModel):
    email = models.EmailField(_('Email address'), unique=True)
    cellphone = models.CharField(max_length=15, blank=True, null=True)  # noqa: DJ001 — kept nullable to avoid a data migration
    registration_number = models.CharField(_('Registration number'), max_length=30, unique=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'registration_number']
    objects = managers.AccountUserManager()

    class Meta(AbstractUser.Meta):
        # Login matches these case-insensitively (managers.by_identifier), so
        # uniqueness must be case-insensitive too — otherwise "Ana@x.com" and
        # "ana@x.com" could coexist and neither could log in (ambiguous match).
        constraints = [
            models.UniqueConstraint(
                Lower('email'), name='account_user_email_ci_unique',
                violation_error_message=_('A user with that email address already exists.'),
            ),
            models.UniqueConstraint(
                Lower('username'), name='account_user_username_ci_unique',
                violation_error_message=_('A user with that username already exists.'),
            ),
            models.UniqueConstraint(
                Lower('registration_number'), name='account_user_registration_number_ci_unique',
                violation_error_message=_('A user with that registration number already exists.'),
            ),
        ]

    def __str__(self):
        return self.email
