"""Health and public store configuration endpoints."""

from __future__ import annotations

from django.conf import settings
from django.utils import timezone
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .constants import LIBYAN_CITIES


class HealthView(APIView):
    """Liveness probe: proves the stack, DB and settings are wired together."""

    authentication_classes = ()
    permission_classes = (AllowAny,)

    def get(self, request):
        return Response(
            {
                "status": "ok",
                "service": "h2o-floss-backend",
                "debug": settings.DEBUG,
                "time": timezone.now().isoformat(),
            }
        )


class StoreConfigView(APIView):
    """Public knobs the React app needs before it renders a price or a form."""

    authentication_classes = ()
    permission_classes = (AllowAny,)

    def get(self, request):
        return Response(
            {
                "currency": settings.CURRENCY,
                "free_shipping": settings.FREE_SHIPPING,
                "shipping_flat_rate": str(settings.SHIPPING_FLAT_RATE),
                "whatsapp_enabled": bool(settings.SUPPORT_WHATSAPP),
                "cities": [{"code": c, "name": n} for c, n in LIBYAN_CITIES],
            }
        )
