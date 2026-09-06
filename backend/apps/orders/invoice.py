"""Arabic invoice PDF generation for H2O Floss orders.

Pure-Python: fpdf2 with its HarfBuzz text-shaping engine (uharfbuzz) and an
embedded Tajawal TTF. HarfBuzz does the Arabic contextual shaping and bidi
ordering, so text is written in natural logical order. No system libraries →
runs on shared hosting. Returns raw PDF bytes.
"""

from __future__ import annotations

from pathlib import Path

from fpdf import FPDF

from apps.orders.models import Order

ASSETS = Path(__file__).resolve().parent / "assets"
FONT_REGULAR = ASSETS / "fonts" / "Tajawal-Regular.ttf"
FONT_BOLD = ASSETS / "fonts" / "Tajawal-Bold.ttf"
LOGO = ASSETS / "img" / "logo.png"

# Brand palette (matches the storefront).
BRAND = (14, 116, 144)      # teal
DARK = (15, 23, 42)         # slate-900
MUTED = (100, 116, 139)     # slate-500

PAGE_W = 210  # A4 mm
MARGIN = 15


class InvoicePDF(FPDF):
    def header(self):  # noqa: D401 - fpdf hook, runs on add_page()
        if LOGO.exists():
            self.image(str(LOGO), x=MARGIN, y=12, w=45)  # 405x189 → ~45mm wide
        self.set_xy(0, 14)
        self.set_font("Tajawal", "B", 20)
        self.set_text_color(*BRAND)
        self.cell(PAGE_W - MARGIN, 8, "فاتورة", align="R")
        self.set_xy(0, 24)
        self.set_font("Tajawal", "", 10)
        self.set_text_color(*MUTED)
        self.cell(PAGE_W - MARGIN, 6, "متجر H2O Floss ليبيا", align="R")
        self.ln(18)


def _rtl_line(pdf: InvoicePDF, label: str, value: str) -> None:
    """One right-aligned 'label: value' line in natural (logical) order."""
    pdf.set_font("Tajawal", "", 10)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 7, f"{label}: {value}", align="R",
             new_x="LMARGIN", new_y="NEXT")


def build_invoice_pdf(order: Order) -> bytes:
    """Render a one-page Arabic invoice for ``order`` and return PDF bytes."""
    pdf = InvoicePDF(orientation="P", unit="mm", format="A4")
    pdf.add_font("Tajawal", "", str(FONT_REGULAR))
    pdf.add_font("Tajawal", "B", str(FONT_BOLD))
    pdf.set_text_shaping(True)  # HarfBuzz shaping + bidi
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.set_margins(MARGIN, MARGIN, MARGIN)
    pdf.add_page()

    content_w = PAGE_W - 2 * MARGIN
    is_bank = order.payment_method == Order.PAYMENT_BANK
    pay_label = "تحويل مصرفي" if is_bank else "كاش عند الاستلام"

    # --- Order + customer meta ---
    city_name = order.get_city_display() if hasattr(order, "get_city_display") else str(order.city)
    _rtl_line(pdf, "رقم الطلب", order.number)
    _rtl_line(pdf, "التاريخ", order.created_at.strftime("%Y-%m-%d %H:%M"))
    _rtl_line(pdf, "طريقة الدفع", pay_label)
    pdf.ln(2)
    _rtl_line(pdf, "العميل", order.full_name)
    _rtl_line(pdf, "الهاتف", order.phone)
    _rtl_line(pdf, "المدينة", city_name)
    _rtl_line(pdf, "العنوان", order.address)
    pdf.ln(4)

    # --- Items table (columns right→left: product, qty, unit price, total) ---
    col_product = content_w * 0.46
    col_qty = content_w * 0.14
    col_price = content_w * 0.20
    col_total = content_w * 0.20

    pdf.set_font("Tajawal", "B", 10)
    pdf.set_fill_color(*BRAND)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(col_product, 9, "المنتج", align="C", fill=True)
    pdf.cell(col_qty, 9, "الكمية", align="C", fill=True)
    pdf.cell(col_price, 9, "سعر الوحدة", align="C", fill=True)
    pdf.cell(col_total, 9, "الإجمالي", align="C", fill=True, new_x="LMARGIN", new_y="NEXT")

    pdf.set_font("Tajawal", "", 10)
    pdf.set_text_color(*DARK)
    fill = False
    for item in order.items.all():
        pdf.set_fill_color(248, 250, 252)
        pdf.cell(col_product, 8, item.product_name, align="R", fill=fill)
        pdf.cell(col_qty, 8, f"{item.quantity}", align="C", fill=fill)
        pdf.cell(col_price, 8, f"{item.unit_price}", align="C", fill=fill)
        pdf.cell(col_total, 8, f"{item.line_total}", align="C", fill=fill,
                 new_x="LMARGIN", new_y="NEXT")
        fill = not fill

    pdf.ln(3)

    # --- Totals ---
    shipping_txt = "مجاني" if str(order.shipping) == "0.00" else f"{order.shipping} د.ل"
    for label, value, bold in [
        ("المجموع الفرعي", f"{order.subtotal} د.ل", False),
        ("الشحن", shipping_txt, False),
        ("الإجمالي", f"{order.total} د.ل", True),
    ]:
        pdf.set_font("Tajawal", "B" if bold else "", 12 if bold else 10)
        pdf.set_text_color(*(BRAND if bold else DARK))
        pdf.cell(0, 8, f"{label}: {value}", align="R",
                 new_x="LMARGIN", new_y="NEXT")

    pdf.ln(8)
    pdf.set_font("Tajawal", "", 9)
    pdf.set_text_color(*MUTED)
    pdf.cell(0, 6, "شكراً لتسوقكم من متجر H2O Floss ليبيا", align="C")

    return bytes(pdf.output())
