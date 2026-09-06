"""Catalog: one hero device plus the parts and accessories that attach to it.

Guardrails carried from the plan (§9): ``description`` is bleach-sanitized on
every save (the reference rendered ``description|safe`` raw), exactly one
product may be the hero and it must be a DEVICE, and slugs auto-generate from
Arabic names instead of silently coming out empty.
"""

from __future__ import annotations

import uuid
from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Q
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _
from simple_history.models import HistoricalRecords

from apps.core.constants import MAX_QUANTITY_PER_ITEM
from apps.core.models import TimeStampedModel

from .sanitize import clean_html


def _unique_slug(model: type[models.Model], base: str, *, instance: models.Model, max_length: int) -> str:
    """Return ``base`` made unique among ``model`` rows, never exceeding max_length."""
    base = (base or f"{model.__name__.lower()}-{uuid.uuid4().hex[:8]}")[:max_length]
    candidate, suffix = base, 1
    while model._default_manager.filter(slug=candidate).exclude(pk=instance.pk).exists():
        suffix += 1
        candidate = f"{base[: max_length - 4]}-{suffix}"
    return candidate


class Category(TimeStampedModel):
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    image = models.ImageField(upload_to="categories/", blank=True, null=True)
    order = models.PositiveIntegerField(default=0, db_index=True)
    is_parts_group = models.BooleanField(
        default=False, help_text="تُعرض ضمن قسم «أجزاء وملحقات الجهاز»."
    )

    class Meta:
        verbose_name = _("قسم")
        verbose_name_plural = _("الأقسام")
        ordering = ["order", "name"]

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name, allow_unicode=True)
            self.slug = _unique_slug(Category, base, instance=self, max_length=120)
        super().save(*args, **kwargs)


class ProductQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_active=True)

    def devices(self):
        return self.filter(kind=Product.Kind.DEVICE)

    def parts(self):
        return self.filter(kind__in=[Product.Kind.PART, Product.Kind.ACCESSORY])


class Product(TimeStampedModel):
    """A sellable row. Exactly one row is the hero DEVICE; everything else is a part."""

    class Kind(models.TextChoices):
        DEVICE = "DEVICE", _("الجهاز الرئيسي")
        PART = "PART", _("قطعة غيار")
        ACCESSORY = "ACCESSORY", _("ملحق")
        KIT = "KIT", _("طقم")

    class Badge(models.TextChoices):
        NONE = "", _("بدون شارة")
        NEW = "NEW", _("جديد")
        HOT = "HOT", _("الأكثر مبيعاً")
        SALE = "SALE", _("تخفيض")

    category = models.ForeignKey(
        Category, related_name="products", on_delete=models.PROTECT, null=True, blank=True
    )
    kind = models.CharField(max_length=10, choices=Kind.choices, default=Kind.PART, db_index=True)
    hero = models.BooleanField(
        default=False, db_index=True, help_text="منتج الصفحة الرئيسي — واحد فقط في المتجر."
    )

    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    tagline = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True, help_text="HTML مُنقّى تلقائياً عند الحفظ.")
    specifications = models.JSONField(
        default=dict, blank=True, help_text='مثال: {"الخزان": "300 مل", "الأوضاع": "5"}'
    )

    price = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0"))]
    )
    old_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(Decimal("0"))]
    )
    currency = models.CharField(max_length=3, default="LYD")

    stock_quantity = models.PositiveIntegerField(
        null=True, blank=True, help_text="اتركه فارغاً = «متوفر عند الطلب» بلا سقف."
    )
    weight_grams = models.PositiveIntegerField(null=True, blank=True)
    warranty_months = models.PositiveIntegerField(default=24)

    main_image = models.ImageField(upload_to="products/", blank=True, null=True)
    order = models.PositiveIntegerField(default=0, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)
    is_featured = models.BooleanField(default=False, help_text="يظهر في الصفحة الرئيسية.")
    badge = models.CharField(max_length=4, choices=Badge.choices, blank=True, default=Badge.NONE)

    views_count = models.PositiveIntegerField(default=0)
    kit_contents = models.ManyToManyField(
        "self", symmetrical=False, blank=True, related_name="included_in",
        help_text="للأطقم فقط: القطع المضمونة في الطقم.",
    )
    devices = models.ManyToManyField(
        "self", symmetrical=False, blank=True, related_name="compatible_parts",
        limit_choices_to={"kind": Kind.DEVICE},
        help_text="الأجهزة التي تعمل مع هذه القطعة.",
    )

    history = HistoricalRecords()
    objects = ProductQuerySet.as_manager()

    class Meta:
        verbose_name = _("منتج")
        verbose_name_plural = _("المنتجات")
        ordering = ["order", "-created_at"]
        constraints = [
            models.CheckConstraint(
                condition=~Q(old_price__isnull=False, old_price__lte=models.F("price")),
                name="catalog_old_price_above_price",
            ),
            # Exactly one hero in the whole store, and it must be a DEVICE.
            # ("DEVICE" as a raw value: a nested class body cannot see Kind.)
            models.UniqueConstraint(fields=["hero"], condition=Q(hero=True), name="catalog_hero_product_unique"),
            models.CheckConstraint(condition=Q(hero=False) | Q(kind="DEVICE"), name="catalog_hero_is_device"),
        ]

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name, allow_unicode=True)
            self.slug = _unique_slug(Product, base, instance=self, max_length=220)
        self.description = clean_html(self.description)
        super().save(*args, **kwargs)

    @property
    def in_stock(self) -> bool:
        return self.stock_quantity is None or self.stock_quantity > 0

    @property
    def discount_percent(self) -> int:
        if not self.old_price or self.old_price <= self.price:
            return 0
        return int(round((self.old_price - self.price) / self.old_price * 100))

    def can_fulfil(self, quantity: int) -> bool:
        if quantity < 1 or quantity > MAX_QUANTITY_PER_ITEM:
            return False
        return self.stock_quantity is None or self.stock_quantity >= quantity

    def attached_products(self):
        """Active rows attached to this product: a device's compatible parts, a kit's
        contents, nothing for a standalone part or accessory.

        The ``is_active`` rule lives here — not in each caller — so every surface that
        renders an attachment rail inherits the same visibility guarantee (guardrail
        §9: inactive products must be invisible to the API). Callers that reach for
        ``compatible_parts`` / ``kit_contents`` directly re-introduce the leak.
        """
        if self.kind == self.Kind.DEVICE:
            return self.compatible_parts.active()
        if self.kind == self.Kind.KIT:
            return self.kit_contents.active()
        return Product.objects.none()


class ProductImage(TimeStampedModel):
    product = models.ForeignKey(Product, related_name="images", on_delete=models.CASCADE)
    image = models.ImageField(upload_to="products/")
    caption = models.CharField(max_length=150, blank=True)
    order = models.PositiveIntegerField(default=0)
    is_feature = models.BooleanField(default=False, help_text="تظهر في بطاقة المنتج.")

    class Meta:
        verbose_name = _("صورة منتج")
        verbose_name_plural = _("صور المنتجات")
        ordering = ["order", "id"]

    def __str__(self) -> str:
        return f"{self.product.name} — صورة {self.order + 1}"
