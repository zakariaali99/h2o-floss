"""Cart API payloads. Money stays decimal strings; the cart shape is
``{token, items[], count, subtotal, shipping, total}`` on every response so the
React store can replace its state wholesale."""

from __future__ import annotations

from rest_framework import serializers

from apps.catalog.models import Product
from apps.catalog.serializers import ProductCardSerializer
from apps.core.constants import MAX_QUANTITY_PER_ITEM

from .models import Cart, CartItem
from .services import shipping_rate


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductCardSerializer(read_only=True)
    line_total = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ("id", "product", "quantity", "line_total")

    def get_line_total(self, obj) -> str:
        return str(obj.line_total)


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    count = serializers.SerializerMethodField()
    subtotal = serializers.SerializerMethodField()
    shipping = serializers.SerializerMethodField()
    total = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ("token", "items", "count", "subtotal", "shipping", "total")

    @classmethod
    def empty(cls) -> dict:
        """Payload for a session with no cart yet — GET never creates one."""
        shipping = shipping_rate()
        return {
            "token": None,
            "items": [],
            "count": 0,
            "subtotal": "0.00",
            "shipping": str(shipping),
            "total": str(shipping),
        }

    def get_count(self, obj) -> int:
        return obj.count

    def get_subtotal(self, obj) -> str:
        return str(obj.subtotal)

    def get_shipping(self, obj) -> str:
        return str(shipping_rate())

    def get_total(self, obj) -> str:
        return str(obj.subtotal + shipping_rate())


class CartItemCreateSerializer(serializers.ModelSerializer):
    """POST /cart/items/ — adding a product already in the cart increments its
    line (never duplicates it), within the per-item ceiling and live stock."""

    product = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.active(), error_messages={"does_not_exist": "هذا المنتج غير متاح حالياً."}
    )

    class Meta:
        model = CartItem
        fields = ("product", "quantity")
        extra_kwargs = {
            "quantity": {"default": 1, "min_value": 1, "max_value": MAX_QUANTITY_PER_ITEM}
        }

    def validate(self, attrs):
        cart = self.context["cart"]
        product = attrs["product"]
        quantity = attrs["quantity"]
        existing = cart.items.filter(product=product).first()
        merged = (existing.quantity if existing else 0) + quantity
        if merged > MAX_QUANTITY_PER_ITEM:
            raise serializers.ValidationError(
                {"quantity": f"الحد الأقصى {MAX_QUANTITY_PER_ITEM} وحدات لكل منتج في السلة."}
            )
        if product.stock_quantity is not None and merged > product.stock_quantity:
            raise serializers.ValidationError({"quantity": "الكمية المطلوبة تتجاوز المخزون المتاح."})
        attrs["merged_quantity"] = merged
        return attrs

    def create(self, validated_data) -> CartItem:
        merged = validated_data.pop("merged_quantity")
        item, _ = CartItem.objects.update_or_create(
            cart=self.context["cart"],
            product=validated_data["product"],
            defaults={"quantity": merged},
        )
        return item


class CartItemUpdateSerializer(serializers.ModelSerializer):
    """PATCH /cart/items/{id}/ — quantity only, 1..MAX, never above stock."""

    class Meta:
        model = CartItem
        fields = ("quantity",)
        extra_kwargs = {
            "quantity": {"min_value": 1, "max_value": MAX_QUANTITY_PER_ITEM}
        }

    def validate_quantity(self, value) -> int:
        stock = self.instance.product.stock_quantity
        if stock is not None and value > stock:
            raise serializers.ValidationError("الكمية المطلوبة تتجاوز المخزون المتاح.")
        return value
