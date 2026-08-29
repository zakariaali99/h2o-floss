from __future__ import annotations

import pytest
from django.core.exceptions import ValidationError

from apps.core.constants import LIBYAN_CITIES, city_label
from apps.core.validators import validate_city, validate_libyan_phone


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("0914076123", "0914076123"),
        ("+218 91 407 6123", "0914076123"),
        ("00218914076123", "0914076123"),
        ("218914076123", "0914076123"),
        ("091-407-6123", "0914076123"),
    ],
)
def test_libyan_phone_normalisation(raw, expected):
    assert validate_libyan_phone(raw) == expected


@pytest.mark.parametrize("bad", ["", "12345", "0912", "+1 555 0100", "91407612"])
def test_libyan_phone_rejects_garbage(bad):
    with pytest.raises(ValidationError):
        validate_libyan_phone(bad)


def test_city_validation_accepts_codes_only():
    assert validate_city("tripoli") == "tripoli"
    with pytest.raises(ValidationError):
        validate_city("طرابلس")


def test_city_labels_are_arabic_and_unique():
    codes = [code for code, _ in LIBYAN_CITIES]
    assert len(codes) == len(set(codes))
    assert city_label("misrata") == "مصراتة"
    assert city_label("unknown") == "unknown"
