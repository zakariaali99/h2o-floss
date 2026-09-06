"""Back-office registration for orders, clients and contact messages.

The order is a frozen financial record: money and contact fields are
read-only, and the status can only change through ``Order.transition_to`` —
exposed to staff as changelist actions. ``django-simple-history`` records every
move together with the staff user who made it.
"""

from __future__ import annotations

from django.contrib import admin, messages
from django.core.exceptions import ValidationError
from django.utils.html import format_html
from simple_history.admin import SimpleHistoryAdmin

from apps.core.constants import (
    ORDER_STATUS_APPROVED,
    ORDER_STATUS_COMPLETED,
    ORDER_STATUS_PENDING,
    ORDER_STATUS_REJECTED,
)

from .models import Client, ContactMessage, Order, OrderItem

STATUS_COLORS = {
    ORDER_STATUS_PENDING: "#f59e0b",
    ORDER_STATUS_APPROVED: "#0ea5e9",
    ORDER_STATUS_COMPLETED: "#10b981",
    ORDER_STATUS_REJECTED: "#ef4444",
}


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    can_delete = False
    readonly_fields = ("product_name", "unit_price", "quantity", "line_total")

    def has_add_permission(self, request, obj=None) -> bool:
        return False  # lines are frozen at checkout


@admin.register(Order)
class OrderAdmin(SimpleHistoryAdmin):
    list_display = ("number", "full_name", "phone", "city", "total", "status_badge", "created_at")
    list_filter = ("status", "city")
    search_fields = ("number", "full_name", "phone", "email")
    date_hierarchy = "created_at"
    inlines = (OrderItemInline,)
    history_in_columns = True
    actions = ("mark_approved", "mark_completed", "mark_rejected", "mark_pending")
    readonly_fields = (
        "number",
        "status",
        "user",
        "client",
        "full_name",
        "phone",
        "email",
        "city",
        "address",
        "subtotal",
        "shipping",
        "total",
    )
    fieldsets = (
        ("الطلب", {"fields": ("number", "status", "user", "client")}),
        ("بيانات العميل", {"fields": ("full_name", "phone", "email", "city", "address", "note")}),
        ("المبالغ المجمّدة", {"fields": ("subtotal", "shipping", "total")}),
    )

    @admin.display(description="الحالة", ordering="status")
    def status_badge(self, obj):
        colour = STATUS_COLORS.get(obj.status, "#334155")
        return format_html(
            '<span style="color:{};font-weight:600">{}</span>', colour, obj.get_status_display()
        )

    # ------------------------------------------------------- state-machine UI

    @admin.action(description="موافقة على الطلبات المحددة")
    def mark_approved(self, request, queryset):
        self._apply(request, queryset, ORDER_STATUS_APPROVED)

    @admin.action(description="إتمام الطلبات المحددة")
    def mark_completed(self, request, queryset):
        self._apply(request, queryset, ORDER_STATUS_COMPLETED)

    @admin.action(description="رفض الطلبات المحددة")
    def mark_rejected(self, request, queryset):
        self._apply(request, queryset, ORDER_STATUS_REJECTED)

    @admin.action(description="إعادة فتح الطلبات المرفوضة")
    def mark_pending(self, request, queryset):
        self._apply(request, queryset, ORDER_STATUS_PENDING)

    def _apply(self, request, queryset, target: str) -> None:
        """Drive each selected order through ``transition_to`` — the form view
        cannot bypass the machine because status is read-only here too."""
        moved, blocked = 0, []
        for order in queryset:
            try:
                order.transition_to(target)
                moved += 1
            except ValidationError as exc:
                blocked.append(f"{order.number}: {exc.messages[0]}")
        if moved:
            self.message_user(request, f"تم تحديث حالة {moved} طلب.", level=messages.SUCCESS)
        for line in blocked:
            self.message_user(request, line, level=messages.ERROR)


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "phone", "city", "order_count", "updated_at")
    search_fields = ("name", "email", "phone")

    @admin.display(description="الطلبات")
    def order_count(self, obj):
        return obj.orders.count()


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "phone", "is_handled", "created_at")
    list_filter = ("is_handled",)
    search_fields = ("name", "email", "phone", "message")
    readonly_fields = ("name", "email", "phone", "message")
