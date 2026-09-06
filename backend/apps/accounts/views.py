"""Admin authentication views (JWT login / refresh / me)."""

from __future__ import annotations

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import AdminTokenObtainPairSerializer, AdminUserSerializer


class AdminLoginView(TokenObtainPairView):
    """POST /api/v1/auth/login/ — email + password → {access, refresh, user}."""

    serializer_class = AdminTokenObtainPairSerializer


class MeView(APIView):
    """GET /api/v1/auth/me/ — the authenticated admin, for session restore."""

    permission_classes = (IsAuthenticated,)

    def get(self, request):
        return Response(AdminUserSerializer(request.user).data)
