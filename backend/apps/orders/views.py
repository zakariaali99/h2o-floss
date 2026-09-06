"""Checkout, order lookup and contact endpoints (plan §5, P3).

All anonymous. Every mutation is a POST; the lookup GET changes nothing and
requires both the order number and the phone so the endpoint cannot be used to
enumerate orders.
"""

from __future__ import annotations

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import models
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.cart.services import resolve_cart
from apps.core.permissions import IsStoreAdmin
from apps.core.validators import validate_libyan_phone

from .models import ContactMessage, Order
from .serializers import CheckoutSerializer, ContactSerializer, OrderSerializer
from .services import create_order_from_cart


class CheckoutView(APIView):
    """POST /api/v1/checkout/ — cart in, PENDING order out (201)."""

    permission_classes = (AllowAny,)
    throttle_scope = "checkout"

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cart = resolve_cart(request)
        order = create_order_from_cart(
            cart,
            serializer.validated_data,
            user=request.user if request.user.is_authenticated else None,
        )
        return Response(OrderSerializer(order).data, status=201)


class OrderLookupView(APIView):
    """GET /api/v1/orders/lookup/?number=&phone= — flexible status lookup by phone or order number."""

    permission_classes = (AllowAny,)
    throttle_scope = "order_lookup"

    def get(self, request):
        number = (request.query_params.get("number") or "").strip().upper()
        phone = (request.query_params.get("phone") or "").strip()
        if not number and not phone:
            raise ValidationError(
                {"detail": "أدخل رقم الطلب أو رقم الهاتف لتتبع الطلب."}
            )

        qs = Order.objects.all().prefetch_related("items")
        if phone:
            try:
                norm_phone = validate_libyan_phone(phone)
                qs = qs.filter(models.Q(phone=norm_phone) | models.Q(phone=phone))
            except DjangoValidationError as exc:
                if not number:
                    raise ValidationError({"phone": exc.messages}) from exc
        if number:
            qs = qs.filter(number=number)

        order = qs.order_by("-created_at").first()
        if order is None:
            raise NotFound("لا يوجد طلب مطابق لهذه البيانات.")
        return Response(OrderSerializer(order).data)


class ContactView(APIView):
    """POST /api/v1/contact/ — store a contact message (throttled)."""

    permission_classes = (AllowAny,)
    throttle_scope = "contact"

    def post(self, request):
        serializer = ContactSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"detail": "تم استلام رسالتك، سنعاود التواصل معك قريباً."}, status=201
        )


class AdminOrderListView(APIView):
    """GET /api/v1/admin/orders/ — live order list for admin dashboard."""

    permission_classes = (IsStoreAdmin,)

    def get(self, request):
        qs = Order.objects.all().prefetch_related("items").order_by("-created_at")
        status_filter = request.query_params.get("status")
        if status_filter and status_filter != "ALL":
            qs = qs.filter(status=status_filter)

        if request.query_params.get("unseen") in ("1", "true", "True"):
            qs = qs.filter(is_seen=False)

        search = request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                models.Q(number__icontains=search)
                | models.Q(full_name__icontains=search)
                | models.Q(phone__icontains=search)
                | models.Q(city__icontains=search)
            )

        serializer = OrderSerializer(qs, many=True)
        return Response(serializer.data)


class AdminNewOrdersCountView(APIView):
    """GET /api/v1/admin/orders/new-count/ — number of unseen (new) orders."""

    permission_classes = (IsStoreAdmin,)

    def get(self, request):
        return Response({"count": Order.objects.filter(is_seen=False).count()})


class AdminOrderMarkSeenView(APIView):
    """POST /api/v1/admin/orders/<number>/seen/ — mark one order as seen (no longer new)."""

    permission_classes = (IsStoreAdmin,)

    def post(self, request, number: str):
        order = Order.objects.filter(number=number).prefetch_related("items").first()
        if not order:
            raise NotFound("الطلب غير موجود.")
        if not order.is_seen:
            order.is_seen = True
            order.save(update_fields=["is_seen", "updated_at"])
        return Response(OrderSerializer(order).data)


class AdminOrdersMarkAllSeenView(APIView):
    """POST /api/v1/admin/orders/seen-all/ — mark every unseen order as seen."""

    permission_classes = (IsStoreAdmin,)

    def post(self, request):
        updated = Order.objects.filter(is_seen=False).update(is_seen=True)
        return Response({"updated": updated})


class AdminOrderStatusUpdateView(APIView):
    """PATCH /api/v1/admin/orders/<number>/status/ — transition order status with atomic stock sync."""

    permission_classes = (IsStoreAdmin,)

    def patch(self, request, number: str):
        order = Order.objects.filter(number=number).prefetch_related("items").first()
        if not order:
            raise NotFound("الطلب غير موجود.")

        new_status = request.data.get("status")
        if not new_status:
            raise ValidationError({"status": "حالة الطلب الجديدة مطلوبة."})

        try:
            order.transition_to(new_status)
        except DjangoValidationError as exc:
            raise ValidationError({"status": exc.messages}) from exc

        return Response(OrderSerializer(order).data)


class AdminOrderNoteUpdateView(APIView):
    """POST /api/v1/admin/orders/<number>/note/ — update admin note on order."""

    permission_classes = (IsStoreAdmin,)

    def post(self, request, number: str):
        order = Order.objects.filter(number=number).prefetch_related("items").first()
        if not order:
            raise NotFound("الطلب غير موجود.")

        note = request.data.get("note", "")
        order.note = note
        order.save(update_fields=["note", "updated_at"])
        return Response(OrderSerializer(order).data)


class StoreSettingsView(APIView):
    """GET/PATCH /api/v1/admin/settings/ — full store settings, admin only."""

    permission_classes = (IsStoreAdmin,)

    def get(self, request):
        from apps.core.models import StoreSettings
        from .serializers import StoreSettingsSerializer

        settings = StoreSettings.get_settings()
        return Response(StoreSettingsSerializer(settings).data)

    def patch(self, request):
        from apps.core.models import StoreSettings
        from .serializers import StoreSettingsSerializer

        settings = StoreSettings.get_settings()
        serializer = StoreSettingsSerializer(settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class AdminOrderInvoiceView(APIView):
    """GET /api/v1/admin/orders/<number>/invoice.pdf — the order's Arabic invoice PDF."""

    permission_classes = (IsStoreAdmin,)

    def get(self, request, number: str):
        from django.http import HttpResponse

        from .invoice import build_invoice_pdf

        order = Order.objects.filter(number=number).prefetch_related("items").first()
        if not order:
            raise NotFound("الطلب غير موجود.")
        pdf = build_invoice_pdf(order)
        response = HttpResponse(pdf, content_type="application/pdf")
        response["Content-Disposition"] = f'inline; filename="invoice-{order.number}.pdf"'
        return response


class PublicStoreSettingsView(APIView):
    """GET /api/v1/store/settings/ — storefront-safe fields only (no bank/secrets)."""

    permission_classes = (AllowAny,)

    def get(self, request):
        from apps.core.models import StoreSettings

        settings = StoreSettings.get_settings()
        return Response({"store_whatsapp": settings.store_whatsapp})


class AdminCustomerListView(APIView):
    """GET /api/v1/admin/customers/ — CRM clients list with order aggregates."""

    permission_classes = (IsStoreAdmin,)

    def get(self, request):
        from .models import Client

        # Synchronize any orders missing client FK
        orders_without_client = Order.objects.filter(client__isnull=True)
        for ord_obj in orders_without_client:
            cl, _ = Client.objects.update_or_create(
                phone=ord_obj.phone,
                defaults={
                    "name": ord_obj.full_name,
                    "city": ord_obj.city,
                    "email": ord_obj.email or "",
                },
            )
            ord_obj.client = cl
            ord_obj.save(update_fields=["client"])

        qs = Client.objects.annotate(
            orders_count=models.Count("orders"),
            total_spent=models.Sum("orders__total"),
            last_order_date=models.Max("orders__created_at"),
        ).order_by("-updated_at")

        search = request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                models.Q(name__icontains=search)
                | models.Q(phone__icontains=search)
                | models.Q(city__icontains=search)
            )

        data = []
        for client in qs:
            last_ord = client.orders.order_by("-created_at").first()
            data.append({
                "id": client.id,
                "name": client.name,
                "phone": client.phone,
                "email": client.email,
                "city": client.city,
                "city_name": client.get_city_display(),
                "orders_count": client.orders_count or 0,
                "total_spent": str(client.total_spent or 0),
                "last_order_date": client.last_order_date,
                "last_order_status": last_ord.status if last_ord else None,
                "last_order_status_display": last_ord.get_status_display() if last_ord else None,
                "created_at": client.created_at,
            })
        return Response(data)

