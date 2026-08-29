"""Domain constants shared across apps.

The reference store shipped a city list with both ``Gharyan`` and ``Garyan``
pointing at the same Arabic name (غريان). This list is deduped and ordered by
population so the checkout <select> reads naturally.
"""

from __future__ import annotations

LIBYAN_CITIES: tuple[tuple[str, str], ...] = (
    ("tripoli", "طرابلس"),
    ("benghazi", "بنغازي"),
    ("misrata", "مصراتة"),
    ("zawiya", "الزاوية"),
    ("zliten", "زليتن"),
    ("ajdabiya", "أجدابيا"),
    ("bayda", "البيضاء"),
    ("tobruk", "طبرق"),
    ("khoms", "الخمس"),
    ("sirt", "سرت"),
    ("derna", "درنة"),
    ("sabha", "سبها"),
    ("sabratha", "صبراتة"),
    ("zuwara", "زوارة"),
    ("tarhuna", "ترهونة"),
    ("gharyan", "غريان"),
    ("bani_walid", "بني وليد"),
    ("marj", "المرج"),
    ("kufra", "الكفرة"),
    ("nalut", "نالوت"),
    ("yafran", "يفرن"),
    ("msallata", "مسلاتة"),
)

CITY_CODES = {code for code, _ in LIBYAN_CITIES}
CITY_LABELS = dict(LIBYAN_CITIES)

DEFAULT_CITY = "tripoli"

ORDER_STATUS_PENDING = "PENDING"
ORDER_STATUS_APPROVED = "APPROVED"
ORDER_STATUS_COMPLETED = "COMPLETED"
ORDER_STATUS_REJECTED = "REJECTED"

ORDER_STATUS_CHOICES: tuple[tuple[str, str], ...] = (
    (ORDER_STATUS_PENDING, "قيد المراجعة"),
    (ORDER_STATUS_APPROVED, "تمت الموافقة"),
    (ORDER_STATUS_COMPLETED, "مكتمل"),
    (ORDER_STATUS_REJECTED, "مرفوض"),
)

#: Legal moves. A transition not listed here is rejected by Order.transition_to().
ORDER_STATUS_TRANSITIONS: dict[str, frozenset[str]] = {
    ORDER_STATUS_PENDING: frozenset({ORDER_STATUS_APPROVED, ORDER_STATUS_REJECTED}),
    ORDER_STATUS_APPROVED: frozenset({ORDER_STATUS_COMPLETED, ORDER_STATUS_REJECTED}),
    ORDER_STATUS_REJECTED: frozenset({ORDER_STATUS_PENDING}),
    ORDER_STATUS_COMPLETED: frozenset(),
}

MAX_QUANTITY_PER_ITEM = 10


def city_label(code: str) -> str:
    """Arabic display name for a city code, falling back to the raw value."""
    return CITY_LABELS.get(code, code)
