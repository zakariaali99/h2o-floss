"""Public catalog endpoints (plan §5, P2).

All reads are anonymous and only ever touch ``is_active`` products (the
reference leaked inactive products to authenticated callers — guardrail §9/14).
The only mutation is the POST view beacon, which uses an ``F()`` expression so
concurrent visitors cannot lose increments, and writes just the one column.
"""

from __future__ import annotations

from django.db.models import Count, F, Q
from django_filters import rest_framework as filters
from rest_framework import generics
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsStoreAdmin

from .models import Category, Product
from .serializers import (
    CategorySerializer,
    ProductCardSerializer,
    ProductDetailSerializer,
)


class ProductFilter(filters.FilterSet):
    """?kind=&category=&featured= — the three listing knobs from plan §5."""

    kind = filters.ChoiceFilter(choices=Product.Kind.choices)
    category = filters.CharFilter(field_name="category__slug")
    featured = filters.BooleanFilter(field_name="is_featured")

    class Meta:
        model = Product
        fields = ["kind", "category", "featured"]


class CategoryListView(generics.ListAPIView):
    """Nav + parts grouping: every category with a live product count."""

    permission_classes = (AllowAny,)
    queryset = Category.objects.annotate(
        product_count=Count("products", filter=Q(products__is_active=True))
    ).order_by("order", "name")
    serializer_class = CategorySerializer
    pagination_class = None  # nav rails need the whole list


class ProductListView(generics.ListAPIView):
    """Paginated listing, active products only, filterable by kind / category
    slug / featured."""

    permission_classes = (AllowAny,)
    queryset = Product.objects.active().select_related("category")
    serializer_class = ProductCardSerializer
    filterset_class = ProductFilter


class ProductDetailView(generics.RetrieveAPIView):
    permission_classes = (AllowAny,)
    queryset = Product.objects.active().select_related("category").prefetch_related("images")
    serializer_class = ProductDetailSerializer
    lookup_field = "slug"


class ProductPartsView(generics.RetrieveAPIView):
    """GET /products/<slug>/parts/ — the parts/accessories that attach to a row.

    A device returns its compatible parts, a kit its contents, anything else an
    empty list. Feeds the storefront's "أجزاء وملحقات الجهاز" section.

    Visibility comes from ``Product.attached_products`` — the same single source the
    detail rails use. Reading ``compatible_parts``/``kit_contents`` straight off the
    instance here would leak products staff had deactivated (guardrail §9).
    """

    permission_classes = (AllowAny,)
    queryset = Product.objects.active()
    lookup_field = "slug"

    def retrieve(self, request, *args, **kwargs):
        product = self.get_object()
        data = ProductCardSerializer(
            product.attached_products().select_related("category").order_by("order", "name"),
            many=True,
            context=self.get_serializer_context(),
        ).data
        return Response(data)


class ProductViewBeaconView(APIView):
    """POST-only view counter. A GET on this URL is 405 (guardrail: no
    state-changing GETs). The bump is an atomic ``F()`` update on one column,
    then the new value is re-read from the database."""

    permission_classes = (AllowAny,)
    throttle_scope = "view_beacon"

    def post(self, request, slug):
        try:
            product = Product.objects.get(slug=slug, is_active=True)
        except Product.DoesNotExist:
            raise NotFound("المنتج غير موجود.") from None
        Product.objects.filter(pk=product.pk).update(views_count=F("views_count") + 1)
        product.refresh_from_db(fields=["views_count"])
        return Response({"views_count": product.views_count})


class AdminProductListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/v1/admin/products/ — List all products or create a new one."""

    permission_classes = (IsStoreAdmin,)
    queryset = Product.objects.all().select_related("category").order_by("order", "-created_at")

    def get_serializer_class(self):
        from .serializers import AdminProductSerializer
        return AdminProductSerializer


class AdminProductDetailUpdateView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/v1/admin/products/<int:pk>/"""

    permission_classes = (IsStoreAdmin,)
    queryset = Product.objects.all().select_related("category")

    def get_serializer_class(self):
        from .serializers import AdminProductSerializer
        return AdminProductSerializer

