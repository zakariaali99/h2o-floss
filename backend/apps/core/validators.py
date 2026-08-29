"""Reusable field validators."""

from __future__ import annotations

import re

from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

from .constants import CITY_CODES

# Libyan mobile: 09 + 8 digits (e.g. 0914076123). Stored normalised to that form.
LIBYAN_MOBILE_RE = re.compile(r"^09\d{8}$")


def validate_libyan_phone(value: str) -> str:
    """Normalise and validate a Libyan mobile number.

    Accepts ``+218 91 407 6123``, ``00218914076123``, ``0914076123`` — all become
    ``0914076123``. Anything else raises.
    """
    digits = re.sub(r"\D", "", value or "")
    if digits.startswith("00218"):
        digits = "0" + digits[5:]
    elif digits.startswith("218"):
        digits = "0" + digits[3:]
    if not LIBYAN_MOBILE_RE.match(digits):
        raise ValidationError(_("رقم الهاتف يجب أن يكون ليبياً، مثال: 0914076123"), code="invalid")
    return digits


def validate_city(value: str) -> str:
    if value not in CITY_CODES:
        raise ValidationError(_("اختر مدينة من القائمة المعتمدة"), code="invalid")
    return value
