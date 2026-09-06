"""P2 exit gate (plan §10): the catalog read surface.

Covers the curl matrix (200/403/404/405), anonymous-writes-rejected, active-only
visibility (guardrail §9/14), and the POST view beacon with no lost updates.
"""

from __future__ import annotations

import pytest

from apps.catalog.models import Product

ALL_PART_SLUGS = {
    "nozzle-set-6",
    "water-tank-300",
    "usb-charging-cable",
    "magnetic-stand",
    "travel-case",
    "battery-2500mah",
}


def _assert_error_envelope(response, code=None, status=404):
    assert response.status_code == status
    data = response.json()
    assert {"error", "detail", "fields"} <= set(data)
    if code:
        assert data["error"] == code


# ------------------------------------------------------------------- reads


@pytest.mark.django_db
def test_categories_list(seeded, api_client):
    response = api_client.get("/api/v1/catalog/categories/")
    assert response.status_code == 200
    categories = response.json()
    assert isinstance(categories, list)  # nav rail: not paginated
    by_slug = {c["slug"]: c for c in categories}
    assert by_slug["water-flossers"]["is_parts_group"] is False
    assert by_slug["nozzle-heads"]["is_parts_group"] is True
    assert by_slug["water-flossers"]["product_count"] == 1
    assert by_slug["kits"]["product_count"] == 1


@pytest.mark.django_db
def test_products_list_paginated_and_active_only(seeded, api_client):
    Product.objects.filter(slug="nozzle-set-6").update(is_active=False)
    response = api_client.get("/api/v1/catalog/products/")
    assert response.status_code == 200
    payload = response.json()
    assert {"count", "next", "previous", "results"} <= set(payload)
    slugs = {p["slug"] for p in payload["results"]}
    assert "h2o-floss" in slugs
    assert "nozzle-set-6" not in slugs  # inactive hidden from anon listing


@pytest.mark.django_db
@pytest.mark.parametrize(
    "query, expected",
    [
        ("?kind=DEVICE", {"h2o-floss"}),
        ("?kind=KIT", {"family-kit"}),
        ("?category=nozzle-heads", {"nozzle-set-6"}),
        ("?featured=true", {"h2o-floss", "nozzle-set-6", "family-kit"}),
        ("?kind=PART&category=spare-parts", {"water-tank-300", "battery-2500mah"}),
    ],
)
def test_products_list_filters(seeded, api_client, query, expected):
    response = api_client.get(f"/api/v1/catalog/products/{query}")
    assert response.status_code == 200
    assert {p["slug"] for p in response.json()["results"]} == expected


@pytest.mark.django_db
def test_product_detail_device(seeded, api_client):
    response = api_client.get("/api/v1/catalog/products/h2o-floss/")
    assert response.status_code == 200
    data = response.json()
    assert data["kind"] == "DEVICE"
    assert data["price"] == "225.00"  # money stays a decimal string
    assert data["currency"] == "LYD"
    assert data["main_image"].startswith("/media/products/")  # relative, proxy-friendly
    assert data["specifications"]["الخزان"] == "300 مل"
    assert len(data["images"]) == 3
    assert {p["slug"] for p in data["related_parts"]} == ALL_PART_SLUGS
    assert data["related_parts"][0]["category"]["slug"]  # card shape inside rails
    assert data["compatible_devices"] == []
    assert data["kit_contents"] == []


@pytest.mark.django_db
def test_product_detail_part_shows_compatible_device(seeded, api_client):
    response = api_client.get("/api/v1/catalog/products/nozzle-set-6/")
    assert response.status_code == 200
    data = response.json()
    assert data["kind"] == "PART"
    assert [d["slug"] for d in data["compatible_devices"]] == ["h2o-floss"]  # "يعمل مع"
    # a part's related rail is the rest of its own category
    assert "nozzle-set-6" not in {p["slug"] for p in data["related_parts"]}


@pytest.mark.django_db
def test_product_detail_kit_shows_contents(seeded, api_client):
    data = api_client.get("/api/v1/catalog/products/family-kit/").json()
    assert {p["slug"] for p in data["kit_contents"]} == {"h2o-floss", "nozzle-set-6", "travel-case"}
    assert len(data["related_parts"]) == 3


@pytest.mark.django_db
def test_product_detail_unknown_slug_404(seeded, api_client):
    response = api_client.get("/api/v1/catalog/products/does-not-exist/")
    _assert_error_envelope(response, code="not_found")


@pytest.mark.django_db
def test_parts_endpoint_per_kind(seeded, api_client):
    device = api_client.get("/api/v1/catalog/products/h2o-floss/parts/")
    assert device.status_code == 200
    assert {p["slug"] for p in device.json()} == ALL_PART_SLUGS

    kit = api_client.get("/api/v1/catalog/products/family-kit/parts/")
    assert {p["slug"] for p in kit.json()} == {"h2o-floss", "nozzle-set-6", "travel-case"}

    part = api_client.get("/api/v1/catalog/products/usb-charging-cable/parts/")
    assert part.status_code == 200
    assert part.json() == []


# ------------------------------------------------------------- anon writes


@pytest.mark.django_db
def test_anonymous_writes_rejected(seeded, api_client):
    assert api_client.post("/api/v1/catalog/products/", {}, format="json").status_code == 405
    assert api_client.post("/api/v1/catalog/categories/", {}, format="json").status_code == 405
    for method in ("patch", "put", "delete"):
        response = getattr(api_client, method)(
            "/api/v1/catalog/products/h2o-floss/", {}, format="json"
        )
        assert response.status_code == 405


# -------------------------------------------------------------- view beacon


@pytest.mark.django_db
def test_view_beacon_increments_and_is_post_only(seeded, api_client):
    before = Product.objects.get(slug="h2o-floss").views_count
    assert api_client.post("/api/v1/catalog/products/h2o-floss/view/").json() == {
        "views_count": before + 1
    }
    # second bump does not lose the first (F() update, not read-modify-write)
    assert api_client.post("/api/v1/catalog/products/h2o-floss/view/").json() == {
        "views_count": before + 2
    }
    assert Product.objects.get(slug="h2o-floss").views_count == before + 2
    # GET is not a state changer
    assert api_client.get("/api/v1/catalog/products/h2o-floss/view/").status_code == 405


@pytest.mark.django_db
def test_view_beacon_unknown_or_inactive_404(seeded, api_client):
    response = api_client.post("/api/v1/catalog/products/does-not-exist/view/")
    _assert_error_envelope(response, code="not_found")

    Product.objects.filter(slug="h2o-floss").update(is_active=False)
    response = api_client.post("/api/v1/catalog/products/h2o-floss/view/")
    _assert_error_envelope(response, code="not_found")


# ------------------------------------------------- active-only visibility (§9)


def _rail_slugs(api_client, url, key):
    """Slugs on one cross-sell rail; ``key=None`` means the response *is* the list."""
    data = api_client.get(url).json()
    return {p["slug"] for p in (data if key is None else data[key])}


#: (url, key into the payload, product that must disappear once deactivated)
INACTIVE_SURFACES = [
    ("/api/v1/catalog/products/h2o-floss/parts/", None, "usb-charging-cable"),
    ("/api/v1/catalog/products/family-kit/parts/", None, "travel-case"),
    ("/api/v1/catalog/products/h2o-floss/", "related_parts", "usb-charging-cable"),
    ("/api/v1/catalog/products/family-kit/", "kit_contents", "travel-case"),
    ("/api/v1/catalog/products/family-kit/", "related_parts", "travel-case"),
]


@pytest.mark.django_db
@pytest.mark.parametrize("url, key, victim", INACTIVE_SURFACES)
def test_inactive_products_invisible_on_every_rail(seeded, api_client, url, key, victim):
    """Deactivating a product hides it from *every* cross-sell surface.

    ``/parts/`` used to read the raw M2M managers and leaked inactive rows, while the
    detail rails looked safe only because a narrowed prefetch happened to cover them.
    Both now funnel through ``Product.attached_products()``, so this pins the rule per
    surface rather than per implementation.
    """
    assert victim in _rail_slugs(api_client, url, key)  # present while active
    Product.objects.filter(slug=victim).update(is_active=False)
    assert victim not in _rail_slugs(api_client, url, key)  # gone once deactivated


@pytest.mark.django_db
def test_parts_endpoint_empty_when_all_parts_inactive(seeded, api_client):
    Product.objects.filter(kind=Product.Kind.PART).update(is_active=False)
    response = api_client.get("/api/v1/catalog/products/h2o-floss/parts/")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.django_db
def test_compatible_devices_rail_hides_inactive_device(seeded, api_client):
    """A part's "يعمل مع" rail must not advertise a deactivated device."""
    url = "/api/v1/catalog/products/nozzle-set-6/"
    assert [d["slug"] for d in api_client.get(url).json()["compatible_devices"]] == ["h2o-floss"]
    Product.objects.filter(slug="h2o-floss").update(is_active=False)
    assert api_client.get(url).json()["compatible_devices"] == []


@pytest.mark.django_db
def test_uncategorised_part_gets_no_related_rail(seeded, api_client):
    """Two uncategorised parts must not be suggested to each other.

    ``filter(category=obj.category)`` with a null category matches "every product with
    no category", which surfaces unrelated rows in the "ما يناسب" rail.
    """
    Product.objects.filter(slug__in=["usb-charging-cable", "magnetic-stand"]).update(
        category=None
    )
    data = api_client.get("/api/v1/catalog/products/usb-charging-cable/").json()
    assert data["related_parts"] == []
