"""Shared DRF permissions."""

from __future__ import annotations

from rest_framework.permissions import BasePermission


class IsStoreAdmin(BasePermission):
    """Allow only authenticated staff/admin accounts (the dashboard audience)."""

    message = "يتطلب هذا الإجراء صلاحية إدارية."

    def has_permission(self, request, view) -> bool:
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.is_staff or user.is_superuser or getattr(user, "is_admin_role", False))
        )
