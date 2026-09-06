from __future__ import annotations

import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.fixture
def staff_user(db):
    return User.objects.create_user(
        email="staff@h2ofloss.ly", password="Str0ng!Pass1", role=User.Role.STAFF, is_staff=True
    )


@pytest.fixture
def admin_user(db):
    return User.objects.create_superuser(
        email="admin@h2ofloss.ly", password="Str0ng!Pass1", first_name="Zakaria"
    )


@pytest.fixture
def customer_user(db):
    return User.objects.create_user(email="shopper@example.com", password="Str0ng!Pass1")


@pytest.fixture
def seeded(db, tmp_path, settings):
    """Seed twice into a throwaway media root, so tests never touch backend/media."""
    from django.core.management import call_command

    settings.MEDIA_ROOT = tmp_path / "media"
    call_command("seed_store", verbosity=0)
    call_command("seed_store", verbosity=0)


@pytest.fixture
def api_client():
    from rest_framework.test import APIClient

    return APIClient()


@pytest.fixture
def admin_api_client(admin_user):
    """A DRF APIClient authenticated as an admin — for the gated /api/v1/admin/* endpoints.

    (Named distinctly so it does not shadow pytest-django's built-in ``admin_client``,
    which the Django-admin lifecycle tests use.)
    """
    from rest_framework.test import APIClient

    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client


@pytest.fixture
def django_client():
    from django.test import Client

    return Client()
