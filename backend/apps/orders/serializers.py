"""Checkout / lookup / contact payloads."""

from __future__ import annotations

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from apps.core.constants import LIBYAN_CITIES
from apps.core.validators import validate_city, validate_libyan_phone

from .models import ContactMessage, Order, OrderItem


class CheckoutItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1, max_value=50)


class CheckoutSerializer(serializers.Serializer):
    """Guest checkout contact + shipping details. The phone is
    normalised to ``09XXXXXXXX`` and the city validated against the deduped
    city tuple — both before anything touches the database."""

    full_name = serializers.CharField(max_length=120, min_length=2)
    phone = serializers.CharField(max_length=20)
    email = serializers.EmailField(required=False, allow_blank=True, default="")
    city = serializers.CharField(max_length=64)
    address = serializers.CharField(min_length=5, max_length=500)
    note = serializers.CharField(required=False, allow_blank=True, max_length=1000, default="")
    payment_method = serializers.ChoiceField(
        choices=Order.PAYMENT_METHOD_CHOICES,
        default=Order.PAYMENT_CASH,
        required=False,
    )
    items = CheckoutItemSerializer(many=True, required=False)

    def validate_phone(self, value: str) -> str:
        try:
            return validate_libyan_phone(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages) from exc

    def validate_email(self, value: str) -> str:
        return value.strip().lower() if value else ""

    def validate_city(self, value: str) -> str:
        try:
            return validate_city(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages) from exc


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ("product_name", "unit_price", "quantity", "line_total")


class OrderSerializer(serializers.ModelSerializer):
    """The order as the customer sees it: status timeline inputs, frozen totals,
    frozen lines. Guest orders carry their own email — never ``user.email``."""

    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    payment_method_display = serializers.CharField(source="get_payment_method_display", read_only=True)
    city_name = serializers.CharField(source="get_city_display", read_only=True)
    whatsapp_notifications = serializers.SerializerMethodField()

    def get_whatsapp_notifications(self, obj) -> list:
        from apps.core.models import WhatsAppMessageLog

        logs = WhatsAppMessageLog.objects.filter(order_number=obj.number).order_by("created_at")
        return [
            {
                "recipient_type": log.recipient_type,
                "recipient_type_display": log.get_recipient_type_display(),
                "phone": log.recipient_phone,
                "status": log.status,
                "status_display": log.get_status_display(),
                "created_at": log.created_at.isoformat(),
            }
            for log in logs
        ]

    class Meta:
        model = Order
        fields = (
            "number",
            "status",
            "status_display",
            "is_seen",
            "payment_method",
            "payment_method_display",
            "full_name",
            "phone",
            "email",
            "city",
            "city_name",
            "address",
            "note",
            "subtotal",
            "shipping",
            "total",
            "created_at",
            "items",
            "whatsapp_notifications",
        )


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ("name", "email", "phone", "message")
        extra_kwargs = {
            "name": {"min_length": 2},
            "message": {"min_length": 5},
            "email": {"required": False, "allow_blank": True},
            "phone": {"required": False, "allow_blank": True},
        }


class StoreSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        from apps.core.models import StoreSettings

        model = StoreSettings
        fields = (
            "store_whatsapp",
            "manager_phones",
            "whatsapp_auto_send",
            "whatsapp_gateway_url",
            "whatsapp_gateway_token",
            "bank_name",
            "bank_account_holder",
            "bank_account_number",
            "bank_iban",
            "telegram_enabled",
            "telegram_bot_token",
            "telegram_chat_ids",
        )
        # These are live secrets (bot tokens). This endpoint is public (AllowAny),
        # so never return them in responses — write-only.
        extra_kwargs = {
            "whatsapp_gateway_token": {"write_only": True},
            "telegram_bot_token": {"write_only": True},
        }


class ClientSerializer(serializers.ModelSerializer):
    orders_count = serializers.IntegerField(read_only=True, default=0)
    total_spent = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True, default=0)
    last_order_date = serializers.DateTimeField(read_only=True, allow_null=True, default=None)
    last_order_status = serializers.CharField(read_only=True, allow_null=True, default=None)
    city_name = serializers.CharField(source="get_city_display", read_only=True)

    class Meta:
        from .models import Client

        model = Client
        fields = (
            "id",
            "name",
            "phone",
            "email",
            "city",
            "city_name",
            "orders_count",
            "total_spent",
            "last_order_date",
            "last_order_status",
            "created_at",
        )
