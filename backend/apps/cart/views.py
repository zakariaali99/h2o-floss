"""Cart endpoints (plan §5). Every mutation returns the full cart payload;
reads never create carts; item access is scoped to the caller's own cart."""

from __future__ import annotations

from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CartItem
from .serializers import (
    CartItemCreateSerializer,
    CartItemUpdateSerializer,
    CartSerializer,
)
from .services import resolve_cart


class CartView(APIView):
    """GET /api/v1/cart/ — the current cart, or the empty-cart payload."""

    permission_classes = (AllowAny,)

    def get(self, request):
        cart = resolve_cart(request)
        return Response(CartSerializer(cart).data if cart else CartSerializer.empty())


class CartItemCreateView(APIView):
    """POST /api/v1/cart/items/ — {product, quantity} → 201 + cart."""

    permission_classes = (AllowAny,)
    throttle_scope = "cart_write"

    def post(self, request):
        cart = resolve_cart(request, create=True)
        serializer = CartItemCreateSerializer(data=request.data, context={"cart": cart})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(CartSerializer(cart).data, status=201)


class CartItemView(APIView):
    """PATCH / DELETE /api/v1/cart/items/{id}/ — lines of the caller's cart only."""

    permission_classes = (AllowAny,)
    throttle_scope = "cart_write"

    def _item(self, request, pk: int) -> CartItem:
        cart = resolve_cart(request)
        item = cart.items.filter(pk=pk).first() if cart is not None else None
        if item is None:
            raise NotFound("هذا العنصر غير موجود في سلتك.")
        return item

    def patch(self, request, pk: int):
        item = self._item(request, pk)
        serializer = CartItemUpdateSerializer(item, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(CartSerializer(item.cart).data)

    def delete(self, request, pk: int):
        item = self._item(request, pk)
        cart = item.cart
        item.delete()
        return Response(CartSerializer(cart).data)
