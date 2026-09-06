"""Admin authentication serializers (JWT)."""

from __future__ import annotations

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class AdminUserSerializer(serializers.Serializer):
    """The current admin user as the dashboard needs it."""

    email = serializers.EmailField()
    username = serializers.CharField()
    name = serializers.SerializerMethodField()
    role = serializers.CharField()
    is_staff = serializers.BooleanField()
    is_superuser = serializers.BooleanField()

    def get_name(self, obj) -> str:
        return obj.get_full_name() or obj.username or obj.email


class AdminTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Only staff/admin accounts may obtain a dashboard token."""

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        if not (user.is_staff or user.is_superuser or getattr(user, "is_admin_role", False)):
            raise serializers.ValidationError(
                {"detail": "هذا الحساب لا يملك صلاحية الدخول إلى لوحة التحكم."}
            )
        data["user"] = AdminUserSerializer(user).data
        return data
