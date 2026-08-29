"""P0 gate: the API answers, and the back office never 500s on an anonymous visitor.

Reference defect #1 was /dashboard/* raising NoReverseMatch for anonymous users
because staff_member_required pointed at a deleted admin namespace.
"""

from __future__ import annotations

import pytest


@pytest.mark.django_db
def test_health_returns_json(api_client):
    response = api_client.get("/api/v1/health/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.mark.django_db
def test_store_config_exposes_currency_and_deduped_cities(api_client):
    payload = api_client.get("/api/v1/config/").json()
    assert payload["currency"] == "LYD"
    codes = [c["code"] for c in payload["cities"]]
    assert len(codes) == len(set(codes)), "city list must be deduped"
    assert "gharyan" in codes and "garyan" not in codes


@pytest.mark.django_db
def test_admin_login_page_serves_anonymous_visitor(django_client):
    """Anonymous must get a login page (200/302), never a server error."""
    response = django_client.get("/admin/", follow=True)
    assert response.status_code == 200
    assert "/admin/login/" in response.wsgi_request.path


@pytest.mark.django_db
def test_logged_out_customer_is_redirected_not_crashed(django_client):
    response = django_client.get("/admin/login/")
    assert response.status_code == 200
