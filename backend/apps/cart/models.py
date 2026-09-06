"""Session/token-bound cart, anonymous-safe (plan §4).

A cart is addressable three ways — a stable UUID token (so a cookieless API
client can keep one), the signed-in user, or the browser session — and every
write goes through POST/PATCH/DELETE. Line quantity is capped by
``MAX_QUANTITY_PER_ITEM`` at the model level, not just in serializers.
"""

from __future__ import annotations

import uuid
from decimal import Decimal, ROUND_HALF_UP

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.core.constants import MAX_QUANTITY_PER_ITEM
from apps.core.models import TimeStampedModel

TWO_PLACES = Decimal("0.01")


class Cart(TimeStampedModel):
    """A purchase in progress: token-addressed, optionally user/session-bound."""

    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="carts",
    )
    session_key = models.CharField(max_length=40, null=True, blank=True, db_index=True)

    class Meta:
        verbose_name = _("سلة")
        verbose_name_plural = _("السلال")

    def __str__(self) -> str:
        return f"سلة {self.token.hex[:8]}"

    @property
    def count(self) -> int:
        """Total units across lines — the badge number."""
        return self.items.aggregate(total=models.Sum("quantity"))["total"] or 0

    @property
    def subtotal(self) -> Decimal:
        result = self.items.aggregate(
            total=models.Sum(
                models.F("quantity") * models.F("product__price"),
                output_field=models.DecimalField(max_digits=12, decimal_places=2),
            )
        )["total"]
        # SQLite's SUM comes back unquantized (450, not 450.00) — normalize here.
        return (result if result is not None else Decimal("0.00")).quantize(
            TWO_PLACES, rounding=ROUND_HALF_UP
        )


class CartItem(TimeStampedModel):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey("catalog.Product", on_delete=models.PROTECT, related_name="+")
    quantity = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(MAX_QUANTITY_PER_ITEM)]
    )

    class Meta:
        verbose_name = _("عنصر سلة")
        verbose_name_plural = _("عناصر السلة")
        constraints = [
            models.UniqueConstraint(fields=["cart", "product"], name="cart_one_line_per_product")
        ]
        ordering = ["id"]

    def __str__(self) -> str:
        return f"{self.product.name} × {self.quantity}"

    @property
    def line_total(self) -> Decimal:
        return self.product.price * self.quantity
