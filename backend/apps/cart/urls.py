from django.urls import path

from . import views

app_name = "cart"

urlpatterns = [
    path("", views.CartView.as_view(), name="cart-detail"),
    path("items/", views.CartItemCreateView.as_view(), name="cart-item-create"),
    path("items/<int:pk>/", views.CartItemView.as_view(), name="cart-item-detail"),
]
