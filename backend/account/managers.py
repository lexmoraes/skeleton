from django.contrib.auth.base_user import BaseUserManager
from django.db.models import Q
from django.utils.translation import gettext_lazy as _

from core import managers as core_managers


class AccountUserQuerySet(core_managers.BaseQuerySet):
    def by_identifier(self, identifier: str):
        """Users whose email, username or registration_number matches (case-insensitive)."""
        return self.filter(
            Q(email__iexact=identifier)
            | Q(username__iexact=identifier)
            | Q(registration_number__iexact=identifier)
        )


class AccountUserManager(BaseUserManager):
    def get_queryset(self):
        return AccountUserQuerySet(self.model, using=self._db)

    def active(self):
        return self.get_queryset().active()

    def by_identifier(self, identifier: str):
        return self.get_queryset().by_identifier(identifier)

    def get_by_identifier(self, identifier: str):
        """The single user matching `identifier`, or None. An ambiguous match
        (e.g. one user's username equals another's registration number) also
        returns None rather than guessing which account was meant."""
        matches = list(self.by_identifier(identifier)[:2])
        return matches[0] if len(matches) == 1 else None

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('Email is required'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        return self.create_user(email, password, **extra_fields)
