from django.db import models

from core import managers


class BaseModel(models.Model):
    """Extend this from every concrete model in the project: gives you a
    64-bit auto-increment id (DEFAULT_AUTO_FIELD), created/updated
    timestamps, and a soft is_active flag (with `.active()`/`.inactive()` on
    the manager) for free."""

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    objects = managers.BaseManager()

    class Meta:
        abstract = True
