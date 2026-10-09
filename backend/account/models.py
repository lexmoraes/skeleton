from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _

from account import managers
from core import models as core_models


class AccountUser(AbstractUser, core_models.BaseModel):
    email = models.EmailField(_('Email address'), unique=True)
    cellphone = models.CharField(max_length=15, blank=True, null=True)
    registration_number = models.CharField(_('Registration number'), max_length=30, unique=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'registration_number']
    objects = managers.AccountUserManager()

    def __str__(self):
        return self.email
