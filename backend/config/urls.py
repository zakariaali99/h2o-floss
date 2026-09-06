"""URL configuration for the H2o-floss backend.

Serves the JSON API under /api/v1/, the staff Django admin under /admin/, uploaded
media under /media/, and the built React SPA (backend/dist) for everything else.
"""
from django.conf import settings
from django.contrib import admin
from django.http import HttpResponse, HttpResponseNotFound
from django.urls import include, path, re_path
from django.views.decorators.cache import never_cache
from django.views.static import serve

from apps.core.urls import urlpatterns as core_urlpatterns

admin.site.site_header = "إدارة متجر H2O Floss"
admin.site.site_title = "H2O Floss"
admin.site.index_title = "لوحة التحكم"

v1_patterns = [
    path("", include(core_urlpatterns)),
    path("auth/", include("apps.accounts.urls")),
    path("catalog/", include("apps.catalog.urls")),
    path("cart/", include("apps.cart.urls")),
    path("", include("apps.orders.urls")),
]


@never_cache
def spa_index(request):
    """Return the SPA shell so React Router can resolve client-side routes.

    Static assets (/assets, /brand, /images, /video) are served by WhiteNoise
    before requests reach this view; this only catches app routes like
    /dashboard or /product/<slug>.
    """
    index_file = settings.BASE_DIR / "dist" / "index.html"
    if not index_file.exists():
        return HttpResponseNotFound(
            "Frontend build not found. Build it (npm run build) into backend/dist."
        )
    return HttpResponse(index_file.read_bytes(), content_type="text/html")


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include(v1_patterns)),
    path("media/<path:path>", serve, {"document_root": settings.MEDIA_ROOT}),
    # SPA fallback — anything not under api/, admin/, media/, static/ returns index.html.
    re_path(r"^(?!api/|admin/|media/|static/).*$", spa_index),
]
