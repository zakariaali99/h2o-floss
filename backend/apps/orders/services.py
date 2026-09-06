"""Checkout: turn a cart into an order, atomically (plan §5, P3 gate).

Stock is re-validated under ``select_for_update`` row locks so two concurrent
checkouts cannot both take the last unit; names, unit prices and totals are
frozen onto the order; the CRM client is upserted; the cart is cleared — which
is also what makes a double submit fail closed.
"""

from __future__ import annotations

from decimal import Decimal

from django.db import transaction
from rest_framework.exceptions import ValidationError

from apps.cart.models import Cart
from apps.cart.services import shipping_rate
from apps.catalog.models import Product

from .models import Client, Order, OrderItem


@transaction.atomic
def create_order_from_cart(cart: Cart | None, data: dict, *, user=None) -> Order:
    """Freeze ``cart`` (or direct payload items) into a PENDING order and return it."""
    direct_items = data.get("items") or []
    
    if direct_items:
        # Build normalized item pairs from direct payload
        line_specs = [(item["product_id"], item["quantity"]) for item in direct_items]
    elif cart and cart.items.exists():
        line_specs = [(item.product_id, item.quantity) for item in cart.items.order_by("id")]
    else:
        line_specs = []

    if not line_specs:
        raise ValidationError({"cart": "سلتك فارغة — أضف منتجات أولاً."})

    product_ids = [pid for pid, _ in line_specs]
    products = {
        product.pk: product
        for product in Product.objects.select_for_update().filter(pk__in=product_ids)
    }

    for pid, qty in line_specs:
        product = products.get(pid)
        if not product or not product.is_active or not product.can_fulfil(qty):
            prod_name = product.name if product else f"#{pid}"
            raise ValidationError(
                {"cart": f"«{prod_name}»: الكمية المطلوبة غير متوفرة حالياً."}
            )

    client, _ = Client.objects.update_or_create(
        phone=data["phone"],
        defaults={
            "name": data["full_name"],
            "email": data.get("email", ""),
            "city": data["city"],
        },
    )

    subtotal = sum(
        (products[pid].price * qty for pid, qty in line_specs), Decimal("0.00")
    )
    shipping = shipping_rate()
    order = Order.objects.create(
        user=user,
        client=client,
        full_name=data["full_name"],
        phone=data["phone"],
        email=data.get("email", ""),
        city=data["city"],
        address=data["address"],
        note=data.get("note", ""),
        payment_method=data.get("payment_method", Order.PAYMENT_CASH),
        subtotal=subtotal,
        shipping=shipping,
        total=subtotal + shipping,
    )
    OrderItem.objects.bulk_create(
        OrderItem(
            order=order,
            product=products[pid],
            product_name=products[pid].name,
            unit_price=products[pid].price,
            quantity=qty,
            line_total=products[pid].price * qty,
        )
        for pid, qty in line_specs
    )
    if cart:
        cart.delete()  # clear session cart once finalized

    _dispatch_notifications(order)
    return order


def _dispatch_notifications(order: Order) -> None:
    """Fire manager notifications (Telegram, and WhatsApp if a gateway is wired).

    Never let a notification failure roll back or break a saved order.
    """
    import logging

    log = logging.getLogger(__name__)

    # Telegram — the working path on shared hosting.
    try:
        from .telegram import send_order_telegram_notifications

        send_order_telegram_notifications(order)
    except Exception as exc:
        log.warning("Telegram dispatch error: %s", exc)

    # WhatsApp — only if a self-hosted gateway is actually configured.
    try:
        from apps.core.models import StoreSettings
        from .whatsapp import send_automatic_order_notifications

        if (StoreSettings.get_settings().whatsapp_gateway_url or "").strip():
            send_automatic_order_notifications(order)
    except Exception as exc:
        log.warning("WhatsApp automated dispatch error: %s", exc)
