"""User manager: email is the identity, username is derived and always unique."""

from __future__ import annotations

import re

from django.contrib.auth.base_user import BaseUserManager

USERNAME_SAFE_RE = re.compile(r"[^a-zA-Z0-9._@+-]")


class UserManager(BaseUserManager):
    use_in_migrations = True

    @staticmethod
    def _local_part(email: str) -> str:
        raw = email.split("@")[0] or "user"
        cleaned = USERNAME_SAFE_RE.sub("", raw).strip(".-_") or "user"
        return cleaned[:120]

    def _unique_username(self, email: str) -> str:
        """Derive a username from the email without ever colliding.

        The reference build let two accounts share an empty username (unique
        constraint on ``username`` + ``ACCOUNT_USERNAME_REQUIRED=False``), and
        relied on allauth to paper over it. Here the manager owns it.
        """
        base = self._local_part(email)
        candidate, suffix = base, 1
        while self.get_queryset().filter(username=candidate).exists():
            suffix += 1
            candidate = f"{base}{suffix}"
        return candidate

    def create_user(self, email: str, password: str | None = None, **extra):
        if not email:
            raise ValueError("مستخدم بلا بريد إلكتروني لا يمكن إنشاؤه.")
        email = self.normalize_email(email).lower()
        extra.setdefault("username", self._unique_username(email))
        extra.setdefault("role", self.model.Role.STAFF)
        user = self.model(email=email, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email: str, password: str | None = None, **extra):
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        extra.setdefault("role", self.model.Role.ADMIN)
        if extra.get("is_staff") is not True or extra.get("is_superuser") is not True:
            raise ValueError("المسؤول الخارق يحتاج is_staff و is_superuser معاً.")
        return self.create_user(email, password, **extra)
