"""P3 exit gate: cart CRUD over the API.

The cart is session-scoped and anonymous-safe; every mutation is
POST/PATCH/DELETE and returns the full cart payload; a session can only touch
its own lines.
"""

from __future__ import annotations

import pytest
from rest_framework.test import APIClient

from apps.catalog.models import Product


@pytest.fixture
def device(seeded):
    return Product.objects.get(slug="h2o-floss")


@pytest.fixture
def nozzle(seeded):
    return Product.objects.get(slug="nozzle-set-6")


def add(client: APIClient, product: Product, quantity: int = 1):
    return client.post(
        "/api/v1/cart/items/", {"product": product.pk, "quantity": quantity}, format="json"
    )


def test_add_then_get_roundtrip(seeded, api_client, device):
    response = add(api_client, device, 2)
    assert response.status_code == 201
    cart = response.json()
    assert cart["count"] == 2
    assert cart["items"][0]["product"]["slug"] == "h2o-floss"
    assert cart["subtotal"] == "450.00"
    assert cart["total"] == "450.00"  # free shipping
    assert cart["token"]  # cookieless clients can persist this

    fetched = api_client.get("/api/v1/cart/").json()  # same session → same cart
    assert fetched["token"] == cart["token"]
    assert fetched["count"] == 2


def test_add_same_product_increments_one_line(seeded, api_client, device):
    assert add(api_client, device, 1).status_code == 201
    assert add(api_client, device, 2).status_code == 201
    cart = api_client.get("/api/v1/cart/").json()
    assert len(cart["items"]) == 1
    assert cart["items"][0]["quantity"] == 3


def test_quantity_ceiling_is_enforced(seeded, api_client, device):
    assert add(api_client, device, 11).status_code == 400  # above MAX_QUANTITY_PER_ITEM
    assert add(api_client, device, 8).status_code == 201
    assert add(api_client, device, 3).status_code == 400  # 8 + 3 > 10
    assert add(api_client, device, 2).status_code == 201  # 8 + 2 = 10 ok


def test_add_inactive_product_rejected(seeded, api_client, device):
    Product.objects.filter(pk=device.pk).update(is_active=False)
    response = add(api_client, device)
    assert response.status_code == 400


def test_add_beyond_stock_rejected(seeded, api_client, nozzle):
    Product.objects.filter(pk=nozzle.pk).update(stock_quantity=2)
    response = add(api_client, nozzle, 3)
    assert response.status_code == 400
    assert response.json()["fields"]["quantity"]


def test_patch_and_delete_line(seeded, api_client, device):
    item_id = add(api_client, device).json()["items"][0]["id"]

    patched = api_client.patch(f"/api/v1/cart/items/{item_id}/", {"quantity": 4}, format="json")
    assert patched.status_code == 200
    assert patched.json()["count"] == 4

    Product.objects.filter(pk=device.pk).update(stock_quantity=3)
    over = api_client.patch(f"/api/v1/cart/items/{item_id}/", {"quantity": 5}, format="json")
    assert over.status_code == 400  # live stock re-checked

    zero = api_client.patch(f"/api/v1/cart/items/{item_id}/", {"quantity": 0}, format="json")
    assert zero.status_code == 400

    deleted = api_client.delete(f"/api/v1/cart/items/{item_id}/")
    assert deleted.status_code == 200
    assert deleted.json()["items"] == []


def test_cannot_touch_another_sessions_cart(seeded, api_client, device):
    item_id = add(api_client, device).json()["items"][0]["id"]

    stranger = APIClient()  # no shared session or token
    assert stranger.get("/api/v1/cart/").json()["items"] == []
    for method, data in (("patch", {"quantity": 9}), ("delete", None)):
        response = getattr(stranger, method)(
            f"/api/v1/cart/items/{item_id}/", data, format="json"
        )
        assert response.status_code == 404
    assert api_client.get("/api/v1/cart/").json()["count"] == 1  # untouched


def test_get_with_no_cart_is_an_empty_payload(seeded, api_client):
    cart = api_client.get("/api/v1/cart/").json()
    assert cart == {
        "token": None,
        "items": [],
        "count": 0,
        "subtotal": "0.00",
        "shipping": "0.00",
        "total": "0.00",
    }
