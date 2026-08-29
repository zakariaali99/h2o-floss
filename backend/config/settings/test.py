"""Settings used by pytest. Fast, isolated, no network or real email."""
from .base import *  # noqa: F403

DEBUG = False
SECRET_KEY = "test-only-key"  # noqa: S105
ALLOWED_HOSTS = ["testserver"]

DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}}
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

# Throttling would make the suite order-dependent; tests assert rates where needed.
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"] = {  # noqa: F405
    "cart_write": "10000/min",
    "checkout": "10000/min",
    "contact": "10000/min",
    "view_beacon": "10000/min",
    "order_lookup": "10000/min",
}
