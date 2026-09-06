"""HTML sanitisation for staff-authored product copy.

The reference app rendered ``description|safe`` straight from the database, so any
compromised staff account was a stored-XSS vector on every product page.
"""

from __future__ import annotations

import bleach

ALLOWED_TAGS = [
    "a", "p", "br", "strong", "em", "b", "i", "u", "ul", "ol", "li",
    "h2", "h3", "h4", "h5", "span", "div", "img", "table", "thead",
    "tbody", "tr", "td", "th", "figure", "figcaption",
]
ALLOWED_ATTRS = {
    "a": ["href", "title", "target", "rel"],
    "img": ["src", "alt", "title", "width", "height"],
    "span": ["class"],
    "div": ["class"],
    "td": ["colspan", "rowspan"],
    "th": ["colspan", "rowspan"],
}


def clean_html(value: str) -> str:
    if not value:
        return ""
    cleaned = bleach.clean(
        value, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRS, strip=True
    )
    # External links opened in a new tab must not be able to reach back via window.opener.
    return bleach.clean(
        cleaned.replace('target="_blank"', 'target="_blank" rel="noopener noreferrer"'),
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRS,
        strip=True,
    )
