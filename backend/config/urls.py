"""URL configuration for the H2o-floss backend.

The storefront is a separate React app; this project serves JSON under /api/v1/
and the staff back office under /admin/.
"""
from django.conf import settings
from django.contrib import admin
from django.urls import include, path
from django.views.static import serve

from apps.core.urls import urlpatterns as core_urlpatterns

admin.site.site_header = "إدارة متجر H2O Floss"
admin.site.site_title = "H2O Floss"
admin.site.index_title = "لوحة التحكم"

v1_patterns = [
    path("", include(core_urlpatterns)),
    # P2: path("catalog/", include("apps.catalog.urls")),
    # P3: path("cart/", include("apps.cart.urls")), path("orders/", include("apps.orders.urls")),
]

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include(v1_patterns)),
    path("media/<path:path>", serve, {"document_root": settings.MEDIA_ROOT}),
]
