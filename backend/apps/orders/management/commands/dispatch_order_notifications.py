"""Dispatch durable order-notification jobs outside checkout requests."""

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.orders.models import OrderNotificationJob
from apps.orders.notifications import dispatch_order_notifications


class Command(BaseCommand):
    help = "Dispatch pending order notifications."

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=20)

    def handle(self, *args, **options):
        job_ids = list(
            OrderNotificationJob.objects.filter(
                status__in=[
                    OrderNotificationJob.Status.PENDING,
                    OrderNotificationJob.Status.FAILED,
                ],
                attempts__lt=3,
            )
            .order_by("created_at")
            .values_list("pk", flat=True)[: options["limit"]]
        )
        for job_id in job_ids:
            self._dispatch_job(job_id)

    def _dispatch_job(self, job_id: int) -> None:
        job = self._claim_job(job_id)
        if job is None:
            return
        try:
            dispatch_order_notifications(job.order)
        except Exception as exc:  # recovery boundary: preserve the order and record the failure
            job.status = OrderNotificationJob.Status.FAILED
            job.last_error = str(exc)[:2000]
        else:
            job.status = OrderNotificationJob.Status.DONE
            job.last_error = ""
        job.save(update_fields=["status", "last_error", "updated_at"])

    @staticmethod
    def _claim_job(job_id: int) -> OrderNotificationJob | None:
        with transaction.atomic():
            job = (
                OrderNotificationJob.objects.select_for_update()
                .select_related("order")
                .get(pk=job_id)
            )
            if job.status not in {
                OrderNotificationJob.Status.PENDING,
                OrderNotificationJob.Status.FAILED,
            }:
                return None
            job.status = OrderNotificationJob.Status.PROCESSING
            job.attempts += 1
            job.last_error = ""
            job.save(update_fields=["status", "attempts", "last_error", "updated_at"])
            return job
