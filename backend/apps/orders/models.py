"""Orders, order lines, CRM client capture and contact messages (plan §4, P3).

Everything on an order is frozen at checkout: product names, unit prices and
totals are copied onto the order so later catalog edits never rewrite history
(the reference read the live price at checkout instead). ``city`` uses the
deduped city tuple imported at module top — never inside a class body.
"""

from __future__ import annotations

from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.db.models import F
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from simple_history.models import HistoricalRecords

from apps.catalog.models import Product
from apps.core.constants import (
    DEFAULT_CITY,
    LIBYAN_CITIES,
    ORDER_STATUS_APPROVED,
    ORDER_STATUS_CHOICES,
    ORDER_STATUS_PENDING,
    ORDER_STATUS_REJECTED,
    ORDER_STATUS_TRANSITIONS,
)
from apps.core.models import TimeStampedModel


class Client(TimeStampedModel):
    """CRM contact captured at checkout. Orders join it by a real FK."""

    phone = models.CharField(_("الهاتف"), max_length=20, unique=True, db_index=True)
    name = models.CharField(_("الاسم"), max_length=120)
    email = models.EmailField(_("البريد الإلكتروني"), blank=True, default="")
    city = models.CharField(
        _("المدينة"), max_length=20, choices=LIBYAN_CITIES, default=DEFAULT_CITY
    )

    class Meta:
        verbose_name = _("عميل")
        verbose_name_plural = _("العملاء")
        ordering = ["-updated_at"]

    def __str__(self) -> str:
        return f"{self.name} ({self.phone})"

    def save(self, *args, **kwargs):
        if self.email:
            self.email = self.email.strip().lower()
        super().save(*args, **kwargs)


class Order(TimeStampedModel):
    """A cash-on-delivery or bank-transfer order. Created PENDING; the lifecycle (approve /
    complete / reject) is enforced by ``transition_to`` in P4."""

    PAYMENT_CASH = "CASH_ON_DELIVERY"
    PAYMENT_BANK = "BANK_TRANSFER"
    PAYMENT_METHOD_CHOICES = [
        (PAYMENT_CASH, _("دفع عند الاستلام (كاش)")),
        (PAYMENT_BANK, _("تحويل مصرفي عبر واتساب")),
    ]

    number = models.CharField(
        _("رقم الطلب"), max_length=24, unique=True, blank=True, editable=False
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="orders",
        verbose_name=_("المستخدم"),
    )
    client = models.ForeignKey(
        Client,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="orders",
        verbose_name=_("العميل"),
    )
    full_name = models.CharField(_("الاسم الكامل"), max_length=120)
    phone = models.CharField(_("الهاتف"), max_length=20)
    email = models.EmailField(_("البريد الإلكتروني"), blank=True, default="")
    city = models.CharField(_("المدينة"), max_length=20, choices=LIBYAN_CITIES, default=DEFAULT_CITY)
    address = models.TextField(_("العنوان"))
    note = models.TextField(_("ملاحظات"), blank=True)
    payment_method = models.CharField(
        _("طريقة الدفع"),
        max_length=30,
        choices=PAYMENT_METHOD_CHOICES,
        default=PAYMENT_CASH,
    )

    status = models.CharField(
        _("الحالة"),
        max_length=10,
        choices=ORDER_STATUS_CHOICES,
        default=ORDER_STATUS_PENDING,
        db_index=True,
    )
    is_seen = models.BooleanField(
        _("تمت المشاهدة"),
        default=False,
        db_index=True,
        help_text=_("طلب جديد لم تتم مشاهدته بعد من لوحة التحكم"),
    )

    subtotal = models.DecimalField(
        _("المجموع الفرعي"), max_digits=12, decimal_places=2, default=Decimal("0.00")
    )
    shipping = models.DecimalField(
        _("الشحن"), max_digits=12, decimal_places=2, default=Decimal("0.00")
    )
    total = models.DecimalField(
        _("الإجمالي"), max_digits=12, decimal_places=2, default=Decimal("0.00")
    )

    history = HistoricalRecords()

    class Meta:
        verbose_name = _("طلب")
        verbose_name_plural = _("الطلبات")
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.number or f"طلب #{self.pk}"

    # ------------------------------------------------------------- lifecycle

    def transition_to(self, new_status: str) -> None:
        """Move the order along its lifecycle — or refuse (plan §5, P4).

        Legal moves live in ``core.constants.ORDER_STATUS_TRANSITIONS``:
        ``PENDING → APPROVED → COMPLETED``, ``PENDING|APPROVED → REJECTED``,
        ``REJECTED → PENDING`` (reopen), ``COMPLETED`` terminal. Approving
        reserves stock exactly once (and releasing it if the approval is later
        rejected), so rejected orders never strand units. Each accepted move is
        atomic and lands in the simple-history trail.
        """
        allowed = ORDER_STATUS_TRANSITIONS.get(self.status, frozenset())
        if new_status not in allowed:
            raise ValidationError(
                _("لا يمكن نقل الطلب من «%(from)s» إلى «%(to)s».")
                % {
                    "from": self.get_status_display(),
                    "to": dict(ORDER_STATUS_CHOICES)[new_status],
                },
                code="invalid_transition",
            )
        with transaction.atomic():
            if new_status == ORDER_STATUS_APPROVED:
                self._reserve_stock()
            elif new_status == ORDER_STATUS_REJECTED and self.status == ORDER_STATUS_APPROVED:
                self._release_stock()
            self.status = new_status
            self.save(update_fields=["status", "updated_at"])

    def _reserve_stock(self) -> None:
        """Decrement every line's stock under row locks — all lines or none."""
        items = list(self.items.select_related("product").select_for_update())
        for item in items:
            stock = item.product.stock_quantity
            if stock is not None and stock < item.quantity:
                raise ValidationError(
                    _("«%(name)s»: المخزون الحالي (%(stock)s) لا يكفي لكمية الطلب (%(qty)s).")
                    % {"name": item.product.name, "stock": stock, "qty": item.quantity},
                    code="insufficient_stock",
                )
        for item in items:
            if item.product.stock_quantity is not None:
                Product.objects.filter(pk=item.product_id).update(
                    stock_quantity=F("stock_quantity") - item.quantity
                )

    def _release_stock(self) -> None:
        """Give back the units reserved by a since-rejected approval."""
        for item in self.items.select_related("product").select_for_update():
            if item.product.stock_quantity is not None:
                Product.objects.filter(pk=item.product_id).update(
                    stock_quantity=F("stock_quantity") + item.quantity
                )

    def save(self, *args, **kwargs):
        """Assign the human order number on first save: H2O-<year>-<pk:06d>.

        The pk only exists after the INSERT, so this is a two-phase save inside
        the caller's transaction.
        """
        created = self.pk is None
        super().save(*args, **kwargs)
        if created and not self.number:
            self.number = f"H2O-{timezone.localdate().year}-{self.pk:06d}"
            super().save(update_fields=["number"])


class OrderItem(models.Model):
    """A frozen line: what was ordered, at what price, forever."""

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey("catalog.Product", on_delete=models.PROTECT, related_name="order_items")
    product_name = models.CharField(max_length=200)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField()
    line_total = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        verbose_name = _("عنصر طلب")
        verbose_name_plural = _("عناصر الطلبات")
        ordering = ["id"]

    def __str__(self) -> str:
        return f"{self.product_name} × {self.quantity}"


class ContactMessage(TimeStampedModel):
    """A storefront contact submission, throttled at the API layer."""

    name = models.CharField(_("الاسم"), max_length=120)
    email = models.EmailField(_("البريد الإلكتروني"), blank=True)
    phone = models.CharField(_("الهاتف"), max_length=20, blank=True)
    message = models.TextField(_("الرسالة"))
    is_handled = models.BooleanField(_("تمت المعالجة"), default=False)

    class Meta:
        verbose_name = _("رسالة تواصل")
        verbose_name_plural = _("رسائل التواصل")
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.name}: {self.message[:40]}"
