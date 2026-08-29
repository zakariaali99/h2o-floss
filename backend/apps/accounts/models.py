"""Custom user: email login, one permission source of truth.

The reference app carried six boolean flags (``can_manage_orders`` …) that the
REST layer honoured and the HTML dashboard ignored — two permission systems that
disagreed. Here access is Django's own ``is_staff`` / ``is_superuser`` plus model
permissions and groups. ``role`` is a display label for the admin, never a gate.
"""

from __future__ import annotations

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _

from .managers import UserManager


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", _("مدير")
        STAFF = "STAFF", _("موظف")

    email = models.EmailField(_("البريد الإلكتروني"), unique=True)
    role = models.CharField(
        max_length=10, choices=Role.choices, default=Role.STAFF, verbose_name=_("الدور")
    )
    phone = models.CharField(max_length=20, blank=True, verbose_name=_("هاتف التواصل"))

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    objects = UserManager()

    class Meta:
        verbose_name = _("مستخدم")
        verbose_name_plural = _("المستخدمين")
        ordering = ["-date_joined"]

    def __str__(self) -> str:
        return self.email

    @property
    def is_admin_role(self) -> bool:
        return self.role == self.Role.ADMIN or self.is_superuser

    def save(self, *args, **kwargs):
        if self.email:
            self.email = self.email.lower()
        super().save(*args, **kwargs)
