"""P1 exit gate (plan §10): migrate + seed twice is idempotent, the catalog
shape is 1 DEVICE + ≥6 PARTs + 1 KIT, the §9 guardrails hold, and everything
is visible in the admin."""

from __future__ import annotations

from pathlib import Path

import pytest
from django.core.management import call_command
from django.db import IntegrityError, transaction

from apps.catalog.models import Category, Product, ProductImage

# --------------------------------------------------------------------- seed


@pytest.mark.django_db
def test_seed_creates_expected_shape(seeded):
    assert Product.objects.devices().count() == 1
    assert Product.objects.parts().count() >= 6
    assert Product.objects.filter(kind=Product.Kind.KIT).count() == 1
    assert Product.objects.count() >= 8
    assert Category.objects.filter(is_parts_group=True).count() >= 5


@pytest.mark.django_db
def test_seed_is_idempotent(seeded):
    snapshot = {
        "categories": Category.objects.count(),
        "products": Product.objects.count(),
        "images": ProductImage.objects.count(),
        "device_name": Product.objects.get(hero=True).name,
        "device_price": str(Product.objects.get(hero=True).price),
    }
    call_command("seed_store", verbosity=0)
    assert {
        "categories": Category.objects.count(),
        "products": Product.objects.count(),
        "images": ProductImage.objects.count(),
        "device_name": Product.objects.get(hero=True).name,
        "device_price": str(Product.objects.get(hero=True).price),
    } == snapshot


@pytest.mark.django_db
def test_seed_copies_reference_media(seeded, settings):
    device = Product.objects.get(hero=True)
    assert device.main_image.name == "products/h2ofloss-device-main.jpg"
    assert (Path(settings.MEDIA_ROOT) / device.main_image.name).exists()
    assert device.images.count() == 3
    assert device.images.filter(is_feature=True).count() == 1


@pytest.mark.django_db
def test_parts_are_linked_to_the_device(seeded):
    device = Product.objects.get(hero=True)
    nozzle = Product.objects.get(slug="nozzle-set-6")
    assert nozzle.devices.filter(pk=device.pk).exists()
    assert device.compatible_parts.filter(pk=nozzle.pk).exists()
    assert device.compatible_parts.count() == 6


@pytest.mark.django_db
def test_kit_composes_device_and_parts(seeded):
    kit = Product.objects.get(slug="family-kit")
    contents = set(kit.kit_contents.values_list("slug", flat=True))
    assert contents == {"h2o-floss", "nozzle-set-6", "travel-case"}


# --------------------------------------------------------------- guardrails


@pytest.mark.django_db
def test_hero_is_a_unique_device(seeded):
    device = Product.objects.get(hero=True)
    assert device.kind == Product.Kind.DEVICE

    with pytest.raises(IntegrityError), transaction.atomic():
        Product.objects.create(
            name="منتج هيرو ثانٍ", kind=Product.Kind.DEVICE, price=1, hero=True,
            category=device.category,
        )

    with pytest.raises(IntegrityError), transaction.atomic():
        Product.objects.create(
            name="قطعة تدّعي الهيرو", kind=Product.Kind.PART, price=1, hero=True,
            category=device.category,
        )


@pytest.mark.django_db
def test_in_stock_derivation(seeded):
    device = Product.objects.get(hero=True)
    device.stock_quantity = 0
    device.save()
    assert not device.in_stock
    device.stock_quantity = None
    device.save()
    assert device.in_stock  # "متوفر عند الطلب"
    device.stock_quantity = 3
    device.save()
    assert device.in_stock


@pytest.mark.django_db
def test_description_is_sanitized_on_save(seeded):
    device = Product.objects.get(hero=True)
    dirty = Product.objects.create(
        name="اختبار تنقية",
        price=5,
        category=device.category,
        description='<p>سلام</p><script>alert(1)</script><a href="javascript:evil()">رابط</a>',
    )
    assert "<script>" not in dirty.description
    assert "javascript:" not in dirty.description
    assert "<p>سلام</p>" in dirty.description
    assert dirty.description == Product.objects.get(pk=dirty.pk).description  # stable under re-save


@pytest.mark.django_db
def test_slug_autogenerates_for_arabic_names(seeded):
    device = Product.objects.get(hero=True)
    first = Product.objects.create(name="قطعة اختبار", price=5, category=device.category)
    second = Product.objects.create(name="قطعة اختبار", price=5, category=device.category)
    assert first.slug and second.slug and first.slug != second.slug


@pytest.mark.django_db
def test_history_rows_are_written(seeded):
    device = Product.objects.get(hero=True)
    device.tagline = "سطر محدّث"
    device.save()
    assert device.history.count() >= 2  # seed create + seed refresh / manual update


# ----------------------------------------------------------------- admin


@pytest.mark.django_db
def test_catalog_is_visible_in_admin(seeded, client, admin_user):
    client.force_login(admin_user)
    device = Product.objects.get(hero=True)
    for url in (
        "/admin/catalog/product/",
        f"/admin/catalog/product/{device.pk}/change/",
        f"/admin/catalog/product/{device.pk}/history/",
        "/admin/catalog/category/",
    ):
        response = client.get(url)
        assert response.status_code == 200, url
