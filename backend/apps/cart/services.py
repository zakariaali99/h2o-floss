"""Cart resolution and store-wide money helpers."""

from __future__ import annotations

from decimal import Decimal

from django.conf import settings

from .models import Cart

CART_TOKEN_HEADER = "X-Cart-Token"


def shipping_rate() -> Decimal:
    """v1 ships free everywhere (plan §10.1 #4); per-city fees become config."""
    return Decimal("0.00") if settings.FREE_SHIPPING else settings.SHIPPING_FLAT_RATE


def resolve_cart(request, *, create: bool = False) -> Cart | None:
    """Return the cart this request talks to, or ``None``.

    Resolution order: ``X-Cart-Token`` header (cookieless API clients) → the
    signed-in user's latest cart → the browser session's cart. A new cart is
    only ever created on a write path (``create=True``), never on a GET.
    """
    token = request.headers.get(CART_TOKEN_HEADER, "")
    if token:
        cart = Cart.objects.filter(token=token).first()
        if cart is not None:
            return cart

    if request.user.is_authenticated:
        if create:
            cart = Cart.objects.filter(user=request.user).first()
            return cart if cart is not None else Cart.objects.create(user=request.user)
        return Cart.objects.filter(user=request.user).first()

    session = request.session
    if session.session_key:
        cart = Cart.objects.filter(session_key=session.session_key).first()
        if cart is not None:
            return cart
    if not create:
        return None
    if not session.session_key:
        session.create()
    return Cart.objects.create(session_key=session.session_key)
