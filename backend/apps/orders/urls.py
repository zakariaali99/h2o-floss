from django.urls import path

from apps.catalog.views import (
    AdminProductDetailUpdateView,
    AdminProductListCreateView,
)

from . import views

app_name = "orders"

urlpatterns = [
    path("checkout/", views.CheckoutView.as_view(), name="checkout"),
    path("orders/lookup/", views.OrderLookupView.as_view(), name="order-lookup"),
    path("contact/", views.ContactView.as_view(), name="contact"),
    path("admin/orders/", views.AdminOrderListView.as_view(), name="admin-orders-list"),
    path("admin/orders/new-count/", views.AdminNewOrdersCountView.as_view(), name="admin-orders-new-count"),
    path("admin/orders/seen-all/", views.AdminOrdersMarkAllSeenView.as_view(), name="admin-orders-seen-all"),
    path("admin/orders/<str:number>/seen/", views.AdminOrderMarkSeenView.as_view(), name="admin-order-seen"),
    path("admin/orders/<str:number>/invoice.pdf", views.AdminOrderInvoiceView.as_view(), name="admin-order-invoice"),
    path("admin/orders/<str:number>/status/", views.AdminOrderStatusUpdateView.as_view(), name="admin-order-status"),
    path("admin/orders/<str:number>/note/", views.AdminOrderNoteUpdateView.as_view(), name="admin-order-note"),
    path("admin/customers/", views.AdminCustomerListView.as_view(), name="admin-customers-list"),
    path("admin/settings/", views.StoreSettingsView.as_view(), name="admin-settings"),
    path("store/settings/", views.PublicStoreSettingsView.as_view(), name="store-settings"),
    path("admin/products/", AdminProductListCreateView.as_view(), name="admin-products-list"),
    path("admin/products/<int:pk>/", AdminProductDetailUpdateView.as_view(), name="admin-product-detail"),
]
