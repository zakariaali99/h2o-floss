"""Fail early when commands run outside the supported backend environment."""

import sys

import django

# Minimum supported versions. We check a floor (>=), not an exact match, so the
# app still boots on newer runtimes — production (LibyanSpider shared hosting)
# runs Python 3.13.x, and pinning to exactly 3.12 would 500 the whole site on
# every WSGI boot.
MIN_PYTHON = (3, 12)
MIN_DJANGO = (5, 2)


def ensure_supported_runtime() -> None:
    if sys.version_info[:2] < MIN_PYTHON:
        raise RuntimeError(
            "H2o-floss requires Python 3.12 or newer; activate backend/.venv before running commands."
        )
    if django.VERSION[:2] < MIN_DJANGO:
        raise RuntimeError(
            "H2o-floss requires Django 5.2 or newer; install backend/requirements.txt in backend/.venv."
        )
