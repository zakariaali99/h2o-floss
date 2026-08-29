from __future__ import annotations

import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.mark.django_db
def test_username_is_derived_from_email():
    user = User.objects.create_user(email="Zakaria.Ali@Example.com", password="x")
    assert user.email == "zakaria.ali@example.com"  # normalised
    assert user.username == "zakaria.ali"  # lower-cased with the email


@pytest.mark.django_db
def test_duplicate_email_local_parts_get_unique_usernames():
    a = User.objects.create_user(email="same@one.ly", password="x")
    b = User.objects.create_user(email="same@two.ly", password="x")
    c = User.objects.create_user(email="same@three.ly", password="x")
    assert {a.username, b.username, c.username} == {"same", "same2", "same3"}


@pytest.mark.django_db
def test_superuser_gets_admin_role_and_flags():
    admin = User.objects.create_superuser(email="root@h2ofloss.ly", password="x")
    assert admin.is_staff and admin.is_superuser
    assert admin.role == User.Role.ADMIN and admin.is_admin_role


def test_role_is_a_label_not_a_gate():
    """Guardrail: nothing in the codebase may branch on `role` for access."""
    import subprocess
    from pathlib import Path

    root = Path(__file__).resolve().parent.parent
    hits = subprocess.run(
        ["grep", "-rn", r"\.role ==", str(root / "apps"), "--include=*.py"],
        capture_output=True, text=True,
    ).stdout
    # The label helper on the model itself is allowed; gates are not.
    offenders = [
        line for line in hits.splitlines()
        if "accounts/models.py" not in line and "test" not in line
    ]
    assert not offenders, f"role-based access control crept back in: {offenders}"
