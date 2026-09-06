"""Catalog serializers for the public storefront API (plan §5).

Read-only for anonymous visitors. The card payload is kept small for rails and
listings; the detail payload adds the full description, the specification
table, the gallery and the cross-sell rails (related parts / compatible devices
/ kit contents). Money is serialized as decimal strings — never floats — so the
React app formats LYD itself. Media URLs stay relative (``/media/...``) so the
Vite proxy serves them from the same origin as the API.
"""

from __future__ import annotations

from rest_framework import serializers

from .models import Category, Product, ProductImage


class RelativeImageField(serializers.ImageField):
    """Return the storage-relative URL (``/media/...``), never an absolute one.

    DRF builds ``request.build_absolute_uri()`` when a request is in the
    serializer context, which would point the storefront at the Django origin
    instead of through the single-origin Vite proxy.
    """

    def to_representation(self, value):
        if not value:
            return None
        try:
            return value.url
        except AttributeError:
            return None


class ProductImageSerializer(serializers.ModelSerializer):
    image = RelativeImageField()

    class Meta:
        model = ProductImage
        fields = ("id", "image", "caption", "is_feature")


class CategoryBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("slug", "name")


class CategorySerializer(serializers.ModelSerializer):
    image = RelativeImageField()
    product_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = ("id", "name", "slug", "image", "order", "is_parts_group", "product_count")


class ProductCardSerializer(serializers.ModelSerializer):
    """Compact payload shared by list views and every cross-sell rail."""

    category = CategoryBriefSerializer(read_only=True)
    main_image = RelativeImageField()
    discount_percent = serializers.IntegerField(read_only=True)
    in_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "slug",
            "name",
            "tagline",
            "kind",
            "badge",
            "price",
            "old_price",
            "currency",
            "discount_percent",
            "main_image",
            "category",
            "in_stock",
            "is_featured",
            "views_count",
        )


class ProductDetailSerializer(ProductCardSerializer):
    """Full payload for /products/<slug>/. Cross-sell rails are computed so the
    "ما يناسب هذا المنتج" section works for every kind of row."""

    images = ProductImageSerializer(many=True, read_only=True)
    related_parts = serializers.SerializerMethodField()
    compatible_devices = serializers.SerializerMethodField()
    kit_contents = serializers.SerializerMethodField()

    class Meta(ProductCardSerializer.Meta):
        fields = ProductCardSerializer.Meta.fields + (
            "description",
            "specifications",
            "warranty_months",
            "weight_grams",
            "images",
            "related_parts",
            "compatible_devices",
            "kit_contents",
        )

    def _cards(self, products):
        return ProductCardSerializer(products, many=True, context=self.context).data

    def get_related_parts(self, obj) -> list:
        # A device lists its compatible parts, a kit its contents, and a part
        # the rest of its own category — one "ما يناسب" rail for all kinds.
        # attached_products() owns the active-only rule for the first two.
        if obj.kind in (Product.Kind.DEVICE, Product.Kind.KIT):
            products = obj.attached_products()
        elif obj.category_id:
            products = Product.objects.active().filter(category_id=obj.category_id)
        else:
            # An uncategorised row has no siblings to suggest; never fall back to
            # "everything else with no category", which would list unrelated products.
            return []
        return self._cards(products.exclude(pk=obj.pk).order_by("order", "name"))

    def get_compatible_devices(self, obj) -> list:
        # For a part/accessory/kit: the devices it works with ("يعمل مع").
        if obj.kind == Product.Kind.DEVICE:
            return []
        return self._cards(obj.devices.active())

    def get_kit_contents(self, obj) -> list:
        if obj.kind != Product.Kind.KIT:
            return []
        return self._cards(obj.kit_contents.active())


class AdminProductSerializer(serializers.ModelSerializer):
    category = CategoryBriefSerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source="category",
        write_only=True,
        required=False,
        allow_null=True,
    )
    main_image = RelativeImageField(required=False, allow_null=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "tagline",
            "kind",
            "badge",
            "price",
            "old_price",
            "stock_quantity",
            "currency",
            "is_active",
            "is_featured",
            "hero",
            "description",
            "specifications",
            "main_image",
            "category",
            "category_id",
            "views_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at", "views_count")

