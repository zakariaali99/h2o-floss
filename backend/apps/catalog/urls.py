from django.urls import path

from . import views

app_name = "catalog"

urlpatterns = [
    path("admin/products/", views.AdminProductListCreateView.as_view(), name="admin-product-list"),
    path("admin/products/<int:pk>/", views.AdminProductDetailUpdateView.as_view(), name="admin-product-detail"),
    path("categories/", views.CategoryListView.as_view(), name="category-list"),
    path("products/", views.ProductListView.as_view(), name="product-list"),
    # Order matters: the static suffixes must be matched before <slug:slug>.
    path("products/<slug:slug>/parts/", views.ProductPartsView.as_view(), name="product-parts"),
    path("products/<slug:slug>/view/", views.ProductViewBeaconView.as_view(), name="product-view"),
    path("products/<slug:slug>/", views.ProductDetailView.as_view(), name="product-detail"),
]
