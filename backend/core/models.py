from django.db import models

from core import managers


class BaseModel(models.Model):
    """Extend this from every concrete model in the project: gives you an
    explicit auto-increment id, created/updated timestamps, and a soft
    is_active flag (with `.active()`/`.inactive()` on the manager) for free."""

    id = models.AutoField(primary_key=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    objects = managers.BaseManager()

    class Meta:
        abstract = True
