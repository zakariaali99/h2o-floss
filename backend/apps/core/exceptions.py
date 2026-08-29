"""One error envelope for every API response.

The reference app leaked Django's debug HTML on 500s and returned bare strings
from hand-rolled views. Here every handled failure is JSON with a stable shape:

    {"error": "<code>", "detail": "<human message>", "fields": {"<name>": ["..."]}}
"""

from __future__ import annotations

from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import Http404
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler


def _field_errors(detail) -> dict:
    """Pull per-field messages out of a DRF error payload."""
    if not isinstance(detail, dict):
        return {}
    return {k: v for k, v in detail.items() if k not in {"detail", "non_field_errors"}}


def _flatten(detail) -> str:
    """Best-effort single human-readable line for any DRF error shape."""
    if isinstance(detail, dict):
        if "detail" in detail:
            return str(detail["detail"])
        parts: list[str] = []
        for value in detail.values():
            parts.append(_flatten(value))
        return "; ".join(p for p in parts if p)
    if isinstance(detail, (list, tuple)):
        return "; ".join(_flatten(d) for d in detail)
    return str(detail)


def api_exception_handler(exc, context):
    """DRF handler that also absorbs plain Django validation and Http404."""
    if isinstance(exc, DjangoValidationError):
        exc = ValidationError(getattr(exc, "message_dict", None) or exc.messages)
    elif isinstance(exc, Http404):
        exc = NotFound("العنصر المطلوب غير موجود.")

    response = drf_exception_handler(exc, context)
    if response is None:
        # Unhandled exception: let Django's normal 500 handling take over.
        return None

    return Response(
        {
            "error": getattr(exc, "default_code", "error"),
            "detail": _flatten(response.data),
            "fields": _field_errors(response.data),
        },
        status=response.status_code,
    )
