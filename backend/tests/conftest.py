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
def api_client():
    from rest_framework.test import APIClient

    return APIClient()


@pytest.fixture
def django_client():
    from django.test import Client

    return Client()
