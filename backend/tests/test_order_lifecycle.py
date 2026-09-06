"""P4 exit gate (plan §10): the order lifecycle.

Invalid transitions are refused, every accepted move writes a history row,
approving reserves stock exactly once (rejecting an approval releases it, and
the whole reservation is all-or-nothing), and staff drive the lifecycle from
the admin actions with the audit trail recording who did what.
"""

from __future__ import annotations

import pytest
from django.core.exceptions import ValidationError
from django.urls import reverse

from apps.catalog.models import Product
from apps.core.constants import (
    ORDER_STATUS_APPROVED,
    ORDER_STATUS_COMPLETED,
    ORDER_STATUS_PENDING,
    ORDER_STATUS_REJECTED,
)
from apps.orders.models import Order, OrderItem

SEEDED_DEVICE_STOCK = 25


@pytest.fixture
def device(seeded):
    return Product.objects.get(slug="h2o-floss")


def make_order(device, quantity: int = 2) -> Order:
    """A PENDING order straight from the model layer, with one frozen line."""
    order = Order.objects.create(
        full_name="زبون الاختبار",
        phone="0914076123",
        email="guest@example.com",
        city="tripoli",
        address="شارع الجرابة، مبنى 12",
        subtotal=device.price * quantity,
        total=device.price * quantity,
    )
    OrderItem.objects.create(
        order=order,
        product=device,
        product_name=device.name,
        unit_price=device.price,
        quantity=quantity,
        line_total=device.price * quantity,
    )
    return order


@pytest.fixture
def order(seeded, device):
    return make_order(device)


def stock_of(product) -> int | None:
    product.refresh_from_db(fields=["stock_quantity"])
    return product.stock_quantity


# ------------------------------------------------------------- state machine


@pytest.mark.django_db
def test_approve_then_complete(order, device):
    base_rows = order.history.count()

    order.transition_to(ORDER_STATUS_APPROVED)
    assert order.status == ORDER_STATUS_APPROVED
    assert stock_of(device) == SEEDED_DEVICE_STOCK - 2  # reserved exactly once
    assert order.history.count() == base_rows + 1  # every move writes history
    assert order.history.latest("history_date").status == ORDER_STATUS_APPROVED

    order.transition_to(ORDER_STATUS_COMPLETED)
    assert order.status == ORDER_STATUS_COMPLETED
    assert stock_of(device) == SEEDED_DEVICE_STOCK - 2  # completion moves no stock
    assert order.history.count() == base_rows + 2


@pytest.mark.django_db
@pytest.mark.parametrize(
    "start, target",
    [
        (ORDER_STATUS_PENDING, ORDER_STATUS_COMPLETED),  # must pass through APPROVED
        (ORDER_STATUS_COMPLETED, ORDER_STATUS_APPROVED),  # terminal
        (ORDER_STATUS_COMPLETED, ORDER_STATUS_REJECTED),  # terminal
        (ORDER_STATUS_APPROVED, ORDER_STATUS_PENDING),  # no undo
    ],
)
def test_invalid_transitions_are_refused(seeded, device, start, target):
    order = make_order(device)
    if start != ORDER_STATUS_PENDING:
        Order.objects.filter(pk=order.pk).update(status=start)  # force the state
        order.refresh_from_db()

    with pytest.raises(ValidationError):
        order.transition_to(target)

    order.refresh_from_db()
    assert order.status == start  # nothing moved, nothing written
    assert order.history.count() == 2  # insert + number-fill only


@pytest.mark.django_db
def test_reject_from_pending_never_touches_stock(order, device):
    order.transition_to(ORDER_STATUS_REJECTED)
    assert order.status == ORDER_STATUS_REJECTED
    assert stock_of(device) == SEEDED_DEVICE_STOCK


@pytest.mark.django_db
def test_rejecting_an_approval_releases_stock_then_reopen(order, device):
    order.transition_to(ORDER_STATUS_APPROVED)
    assert stock_of(device) == SEEDED_DEVICE_STOCK - 2

    order.transition_to(ORDER_STATUS_REJECTED)
    assert stock_of(device) == SEEDED_DEVICE_STOCK  # released

    order.transition_to(ORDER_STATUS_PENDING)  # reopen
    assert order.status == ORDER_STATUS_PENDING

    order.transition_to(ORDER_STATUS_APPROVED)  # reserve again, exactly once
    assert stock_of(device) == SEEDED_DEVICE_STOCK - 2


@pytest.mark.django_db
def test_approval_is_all_or_nothing_across_lines(seeded, device):
    nozzle = Product.objects.get(slug="nozzle-set-6")
    Product.objects.filter(pk=device.pk).update(stock_quantity=1)
    order = make_order(device, quantity=2)  # device line cannot ship
    OrderItem.objects.create(
        order=order, product=nozzle, product_name=nozzle.name,
        unit_price=nozzle.price, quantity=1, line_total=nozzle.price,
    )

    with pytest.raises(ValidationError):
        order.transition_to(ORDER_STATUS_APPROVED)

    order.refresh_from_db()
    assert order.status == ORDER_STATUS_PENDING
    assert stock_of(device) == 1  # no partial decrement…
    assert stock_of(nozzle) == 40  # …across any line


@pytest.mark.django_db
def test_unlimited_stock_lines_skip_reservation(seeded, device):
    order = make_order(device)
    Product.objects.filter(pk=device.pk).update(stock_quantity=None)  # «عند الطلب»
    order.transition_to(ORDER_STATUS_APPROVED)
    assert order.status == ORDER_STATUS_APPROVED
    assert stock_of(device) is None


# -------------------------------------------------------------------- admin


ACTION_URL = "/admin/orders/order/"


def run_action(admin_client, action: str, *orders):
    return admin_client.post(
        ACTION_URL,
        {"action": action, "_selected_action": [str(o.pk) for o in orders]},  # admin checkbox
        follow=True,
    )


@pytest.mark.django_db
def test_admin_actions_drive_the_lifecycle(seeded, admin_client, admin_user, device):
    order = make_order(device)

    response = run_action(admin_client, "mark_approved", order)
    assert response.status_code == 200
    order.refresh_from_db()
    assert order.status == ORDER_STATUS_APPROVED
    assert stock_of(device) == SEEDED_DEVICE_STOCK - 2
    record = order.history.latest("history_date")
    assert record.history_user_id == admin_user.pk  # the trail records who

    run_action(admin_client, "mark_completed", order)
    order.refresh_from_db()
    assert order.status == ORDER_STATUS_COMPLETED

    # terminal orders refuse further moves, and the admin stays usable
    response = run_action(admin_client, "mark_rejected", order)
    assert response.status_code == 200
    order.refresh_from_db()
    assert order.status == ORDER_STATUS_COMPLETED


@pytest.mark.django_db
def test_admin_reopen_action(seeded, admin_client, device):
    order = make_order(device)
    order.transition_to(ORDER_STATUS_APPROVED)
    order.transition_to(ORDER_STATUS_REJECTED)

    run_action(admin_client, "mark_pending", order)
    order.refresh_from_db()
    assert order.status == ORDER_STATUS_PENDING


@pytest.mark.django_db
def test_admin_form_cannot_bypass_the_state_machine(seeded, admin_client, device):
    """Status is read-only in the form: a forged POST must not change it."""
    order = make_order(device)
    url = reverse("admin:orders_order_change", args=[order.pk])

    response = admin_client.post(url, {})
    assert response.status_code in (200, 302)
    order.refresh_from_db()
    assert order.status == ORDER_STATUS_PENDING
