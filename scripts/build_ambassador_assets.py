from pathlib import Path

import fitz
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from reportlab.graphics import renderPDF
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"

PROGRAM_PDF = ASSETS / "Nuria_Ambassador_Program.pdf"
TERMS_PDF = ASSETS / "Nuria_Ambassador_Terms.pdf"
COVER_JPG = ASSETS / "ambassador-cover.jpg"
OG_JPG = ASSETS / "ambassador-og.jpg"

APP_STORE_URL = "https://apps.apple.com/se/app/nuria-islamisk-v%C3%A4gledning/id6760123913"
GOOGLE_PLAY_URL = "https://play.google.com/store/apps/details?id=com.oakdev.nuria&hl=sv"
CONTACT_EMAIL = "hello@oakdev.app"
SITE_URL = "nuria.oakdev.app/ambassador"

PAGE_W, PAGE_H = A4
MARGIN = 42

CREAM = HexColor("#f7efdf")
BEIGE = HexColor("#eadcc3")
STONE = HexColor("#ded0b5")
GREEN = HexColor("#343d24")
MILITARY = HexColor("#4b5320")
GOLD = HexColor("#ad842e")
GOLD_LIGHT = HexColor("#d3b46b")
INK = HexColor("#1a1a15")
MUTED = HexColor("#4e3b18")
WHITE = HexColor("#fffaf0")


def register_fonts():
    fonts = {
        "Segoe": "C:/Windows/Fonts/segoeui.ttf",
        "SegoeBold": "C:/Windows/Fonts/segoeuib.ttf",
        "SegoeItalic": "C:/Windows/Fonts/segoeuii.ttf",
        "Bahnschrift": "C:/Windows/Fonts/bahnschrift.ttf",
    }
    for name, path in fonts.items():
        if Path(path).exists():
            pdfmetrics.registerFont(TTFont(name, path))


def font(name):
    registered = pdfmetrics.getRegisteredFontNames()
    if name in registered:
        return name
    if name == "SegoeBold":
        return "Helvetica-Bold"
    if name == "SegoeItalic":
        return "Helvetica-Oblique"
    return "Helvetica"


def y(top):
    return PAGE_H - top


def rect_top(c, x, top, w, h, fill=None, stroke=None, radius=0, line_width=1):
    c.saveState()
    c.setLineWidth(line_width)
    if fill:
        c.setFillColor(fill)
    if stroke:
        c.setStrokeColor(stroke)
    if radius:
        c.roundRect(x, y(top + h), w, h, radius, stroke=1 if stroke else 0, fill=1 if fill else 0)
    else:
        c.rect(x, y(top + h), w, h, stroke=1 if stroke else 0, fill=1 if fill else 0)
    c.restoreState()


def line_top(c, x1, top1, x2, top2, color=GOLD, width=1):
    c.saveState()
    c.setStrokeColor(color)
    c.setLineWidth(width)
    c.line(x1, y(top1), x2, y(top2))
    c.restoreState()


def text_top(c, text, x, top, font_name="Segoe", size=10, color=INK, tracking=0):
    c.saveState()
    c.setFillColor(color)
    c.setFont(font(font_name), size)
    c.drawString(x, y(top + size), text)
    c.restoreState()


def wrap_text(text, max_width, font_name, size):
    words = str(text).split()
    lines = []
    current = ""
    face = font(font_name)
    for word in words:
        candidate = word if not current else f"{current} {word}"
        if pdfmetrics.stringWidth(candidate, face, size) <= max_width:
            current = candidate
            continue
        if current:
            lines.append(current)
        if pdfmetrics.stringWidth(word, face, size) <= max_width:
            current = word
        else:
            chunk = ""
            for char in word:
                candidate = chunk + char
                if pdfmetrics.stringWidth(candidate, face, size) <= max_width:
                    chunk = candidate
                else:
                    if chunk:
                        lines.append(chunk)
                    chunk = char
            current = chunk
    if current:
        lines.append(current)
    return lines


def paragraph(c, text, x, top, width, font_name="Segoe", size=10, leading=14, color=MUTED):
    current_top = top
    for raw_para in str(text).split("\n"):
        if not raw_para.strip():
            current_top += leading * 0.6
            continue
        for line in wrap_text(raw_para, width, font_name, size):
            text_top(c, line, x, current_top, font_name, size, color)
            current_top += leading
        current_top += leading * 0.35
    return current_top


def section_label(c, text, x, top, color=GOLD):
    text_top(c, text.upper(), x, top, "SegoeBold", 7.6, color, tracking=1.7)


def draw_background(c, dark=False):
    base = MILITARY if dark else BEIGE
    c.setFillColor(base)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    if dark:
        c.setFillColor(HexColor("#3d462a"))
        c.rect(0, 0, PAGE_W * 0.66, PAGE_H, stroke=0, fill=1)
        c.setFillColor(HexColor("#515b2d"))
        c.rect(PAGE_W * 0.66, 0, PAGE_W * 0.34, PAGE_H, stroke=0, fill=1)
        c.setStrokeColor(HexColor("#6d744b"))
        c.setLineWidth(0.28)
        for offset in range(-40, 700, 180):
            c.line(offset, 0, offset + 190, PAGE_H)
    else:
        c.setFillColor(CREAM)
        c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
        c.setFillColor(BEIGE)
        c.rect(0, 0, PAGE_W, PAGE_H * 0.30, stroke=0, fill=1)
        c.setStrokeColor(HexColor("#d8c69f"))
        c.setLineWidth(0.28)
        for offset in range(-80, 720, 170):
            c.line(offset, 0, offset + 175, PAGE_H)
        c.setStrokeColor(HexColor("#eee4cf"))
        for offset in range(90, 760, 230):
            c.line(offset, 0, offset - 125, PAGE_H)


def draw_header(c, title, page, total, dark=False):
    color = CREAM if dark else GREEN
    muted = GOLD_LIGHT if dark else GOLD
    text_top(c, "NURIA", MARGIN, 28, "SegoeBold", 8.5, color, tracking=1.2)
    text_top(c, title.upper(), PAGE_W - MARGIN - 210, 28, "Segoe", 7.4, muted, tracking=1.1)
    text_top(c, f"{page} / {total}", PAGE_W - MARGIN - 28, 28, "SegoeBold", 8, muted)
    line_top(c, MARGIN, 49, PAGE_W - MARGIN, 49, muted, 0.8)


def draw_footer(c, dark=False):
    color = HexColor("#eadfbf") if dark else MUTED
    line_top(c, MARGIN, PAGE_H - 56, PAGE_W - MARGIN, PAGE_H - 56, GOLD_LIGHT if dark else GOLD, 0.6)
    text_top(c, CONTACT_EMAIL, MARGIN, PAGE_H - 42, "SegoeBold", 8.2, color)
    text_top(c, SITE_URL, PAGE_W - MARGIN - 112, PAGE_H - 42, "Segoe", 8.2, color)


def draw_cover_footer(c):
    line_top(c, MARGIN, PAGE_H - 56, PAGE_W - MARGIN, PAGE_H - 56, GOLD, 0.6)
    text_top(c, CONTACT_EMAIL, MARGIN, PAGE_H - 42, "SegoeBold", 8.2, GOLD_LIGHT)
    text_top(c, SITE_URL, PAGE_W - MARGIN - 112, PAGE_H - 42, "Segoe", 8.2, MUTED)


def draw_logo(c, x, top, size):
    logo_path = ASSETS / "Nuria Logo.png"
    if not logo_path.exists():
        return
    rect_top(c, x - 7, top - 7, size + 14, size + 14, fill=WHITE, stroke=HexColor("#c9a858"), radius=8, line_width=0.9)
    c.drawImage(ImageReader(str(logo_path)), x, y(top + size), size, size, preserveAspectRatio=True, mask="auto")


def draw_qr(c, url, x, top, size):
    padding = 10
    rect_top(c, x, top, size, size, fill=WHITE, stroke=HexColor("#c9a858"), radius=6, line_width=0.8)
    qr = QrCodeWidget(url)
    qr.barFillColor = GREEN
    qr.barStrokeColor = GREEN
    bounds = qr.getBounds()
    qr_w = bounds[2] - bounds[0]
    qr_h = bounds[3] - bounds[1]
    inner = size - padding * 2
    scale = min(inner / qr_w, inner / qr_h)
    drawing = Drawing(inner, inner, transform=[scale, 0, 0, scale, 0, 0])
    drawing.add(qr)
    renderPDF.draw(drawing, c, x + padding, y(top + size - padding))


def build_program_pdf():
    c = canvas.Canvas(str(PROGRAM_PDF), pagesize=A4, pageCompression=1)

    # Page 1
    draw_background(c)
    rect_top(c, 0, 0, 164, PAGE_H, fill=GREEN)
    rect_top(c, 164, 0, 5, PAGE_H, fill=GOLD)
    draw_logo(c, 46, 74, 76)
    text_top(c, "Ambassador", 205, 92, "Bahnschrift", 44, GREEN)
    text_top(c, "Program", 205, 142, "Bahnschrift", 44, GREEN)
    line_top(c, 205, 210, PAGE_W - MARGIN, 210, GOLD, 1.2)
    paragraph(
        c,
        "Share Nuria with sincerity. Earn alongside our community through a transparent recurring referral program.",
        205,
        236,
        315,
        "Segoe",
        14,
        20,
        MUTED,
    )
    metric_top = 382
    metrics = [
        ("50%", "of Net Revenue"),
        ("EUR 100", "payout threshold"),
        ("Recurring", "while renewals continue"),
    ]
    for i, (value, label) in enumerate(metrics):
        x = 205 + i * 112
        rect_top(c, x, metric_top, 98, 78, fill=HexColor("#f3ead0"), stroke=HexColor("#ccb16c"), radius=6)
        text_top(c, value, x + 12, metric_top + 16, "SegoeBold", 16, GREEN)
        paragraph(c, label, x + 12, metric_top + 43, 74, "Segoe", 8.4, 10.5, MUTED)
    rect_top(c, 205, 520, 320, 114, fill=HexColor("#35482c"), stroke=GOLD, radius=8, line_width=0.9)
    section_label(c, "Edition 2026", 227, 546, GOLD_LIGHT)
    paragraph(c, f"Request your ambassador code through {CONTACT_EMAIL}. We aim to reply within 48 hours.", 227, 570, 270, "Segoe", 11.2, 15.6, CREAM)
    text_top(c, "Khayran katheeran", 46, 680, "SegoeBold", 12, CREAM)
    paragraph(c, "May abundant good come of it.", 46, 704, 82, "SegoeItalic", 8.4, 11, HexColor("#eadfbf"))
    draw_cover_footer(c)
    c.showPage()

    # Page 2
    draw_background(c)
    draw_header(c, "Ambassador Program", 2, 4)
    section_label(c, "Section 01", MARGIN, 82)
    text_top(c, "How it works", MARGIN, 106, "Bahnschrift", 32, GREEN)
    paragraph(
        c,
        "The program is built to be easy to explain: one code, one clear attribution path, and recurring earnings while a referred subscription remains active.",
        MARGIN,
        154,
        430,
        "Segoe",
        11,
        15.5,
        MUTED,
    )
    steps = [
        ("01", "Request your code", f"Email {CONTACT_EMAIL} and we issue a unique referral code tied to your profile."),
        ("02", "Share Nuria", "Introduce Nuria in person, in your community, or on social media together with your code."),
        ("03", "Earn 50%", "When a referred user subscribes with your code, you receive 50% of Net Revenue."),
        ("04", "Keep earning", "Your share continues automatically every month while the subscription stays active."),
    ]
    card_w = (PAGE_W - MARGIN * 2 - 18) / 2
    card_h = 150
    for i, (num, title, body) in enumerate(steps):
        col = i % 2
        row = i // 2
        x = MARGIN + col * (card_w + 18)
        top = 250 + row * (card_h + 18)
        rect_top(c, x, top, card_w, card_h, fill=HexColor("#f3ead0"), stroke=HexColor("#c7a960"), radius=8)
        text_top(c, num, x + 16, top + 16, "SegoeBold", 12, GOLD)
        text_top(c, title, x + 16, top + 45, "SegoeBold", 17, GREEN)
        paragraph(c, body, x + 16, top + 77, card_w - 32, "Segoe", 9.4, 12.8, MUTED)
    rect_top(c, MARGIN, 612, PAGE_W - MARGIN * 2, 92, fill=GREEN, stroke=GOLD, radius=8)
    paragraph(c, "Whoever guides someone to good is like the one who does it.", MARGIN + 28, 640, PAGE_W - MARGIN * 2 - 56, "SegoeBold", 15, 20, CREAM)
    paragraph(c, "A simple reminder to share with sincerity first, and let the reward structure stay transparent in the background.", MARGIN + 28, 679, PAGE_W - MARGIN * 2 - 56, "Segoe", 9.2, 12.2, HexColor("#eadfbf"))
    draw_footer(c)
    c.showPage()

    # Page 3
    draw_background(c)
    draw_header(c, "Reward Structure", 3, 4)
    section_label(c, "Section 02", MARGIN, 82)
    text_top(c, "Reward structure", MARGIN, 106, "Bahnschrift", 31, GREEN)
    paragraph(
        c,
        "Earnings are calculated on Net Revenue: the amount Nuria receives after the Apple App Store or Google Play platform fee has been deducted. Of that net amount, 50% is yours each active billing cycle.",
        MARGIN,
        153,
        500,
        "Segoe",
        10.5,
        15,
        MUTED,
    )
    rect_top(c, MARGIN, 246, 255, 282, fill=HexColor("#f3ead0"), stroke=HexColor("#c7a960"), radius=8)
    section_label(c, "Worked example", MARGIN + 18, 270)
    text_top(c, "EUR 9.99 monthly subscription", MARGIN + 18, 298, "SegoeBold", 15.5, GREEN)
    rows = [
        ("Subscriber pays", "EUR 9.99"),
        ("Platform fee, approx. 30%", "- EUR 3.00"),
        ("Net Revenue to Nuria", "EUR 6.99"),
        ("Your 50% share", "EUR 3.50 / month"),
    ]
    row_top = 344
    for label, value in rows:
        line_top(c, MARGIN + 18, row_top - 10, MARGIN + 237, row_top - 10, HexColor("#d2bd7d"), 0.5)
        text_top(c, label, MARGIN + 18, row_top, "Segoe", 9.5, MUTED)
        value_width = pdfmetrics.stringWidth(value, font("SegoeBold"), 10.5)
        text_top(c, value, MARGIN + 237 - value_width, row_top, "SegoeBold", 10.5, GREEN if label.startswith("Your") else INK)
        row_top += 40
    essentials = [
        ("Payout threshold", "Balances are paid once the Accrued Balance reaches EUR 100."),
        ("Payment cadence", "After the threshold is crossed, payout is initiated within 30 days of month close."),
        ("Fees at cost", "Bank, PayPal, Wise, SWIFT, or intermediary fees may be passed through at cost."),
        ("Tax responsibility", "Ambassadors are independent and responsible for their own tax declarations."),
        ("Transparency", "Statements list gross revenue, platform fees, and accrued ambassador share."),
    ]
    x2 = 332
    section_label(c, "Section 03", x2, 246)
    text_top(c, "Essentials", x2, 270, "Bahnschrift", 24, GREEN)
    top = 316
    for title, body in essentials:
        rect_top(c, x2, top, 220, 58, fill=HexColor("#f6eed9"), stroke=HexColor("#d6be7b"), radius=6, line_width=0.5)
        text_top(c, title, x2 + 12, top + 10, "SegoeBold", 9.6, GREEN)
        paragraph(c, body, x2 + 12, top + 29, 194, "Segoe", 7.8, 9.2, MUTED)
        top += 68
    draw_footer(c)
    c.showPage()

    # Page 4
    draw_background(c, dark=True)
    draw_header(c, "Get Started", 4, 4, dark=True)
    section_label(c, "Section 04", MARGIN, 84, GOLD_LIGHT)
    text_top(c, "Get started", MARGIN, 110, "Bahnschrift", 38, CREAM)
    paragraph(
        c,
        f"Download Nuria, request your code, and share the app with people you believe will benefit. For support and enrolment, contact {CONTACT_EMAIL}.",
        MARGIN,
        166,
        470,
        "Segoe",
        11.2,
        16,
        HexColor("#eadfbf"),
    )
    tile_w = 236
    tile_h = 300
    for i, (title, subtitle, url) in enumerate([
        ("App Store", "iOS", APP_STORE_URL),
        ("Google Play", "Android", GOOGLE_PLAY_URL),
    ]):
        x = MARGIN + i * (tile_w + 38)
        top = 278
        rect_top(c, x, top, tile_w, tile_h, fill=HexColor("#f8f1df"), stroke=GOLD_LIGHT, radius=8)
        text_top(c, title, x + 22, top + 24, "SegoeBold", 20, GREEN)
        text_top(c, subtitle, x + 22, top + 55, "Segoe", 9, GOLD, tracking=1.2)
        draw_qr(c, url, x + 48, top + 92, 140)
        paragraph(c, "Scan the code or use the direct app-store link from the website.", x + 22, top + 254, tile_w - 44, "Segoe", 8.5, 11.5, MUTED)
    rect_top(c, MARGIN, 630, PAGE_W - MARGIN * 2, 86, fill=HexColor("#f8f1df"), stroke=GOLD_LIGHT, radius=8)
    section_label(c, "Become an ambassador", MARGIN + 22, 654)
    text_top(c, "Request your code today", MARGIN + 22, 682, "SegoeBold", 19, GREEN)
    text_top(c, CONTACT_EMAIL, PAGE_W - MARGIN - 150, 686, "SegoeBold", 12, GOLD)
    draw_footer(c, dark=True)
    c.showPage()
    c.save()


TERM_SECTIONS = [
    (
        "1",
        "Definitions",
        "Subscription means a paid recurring subscription to the Nuria mobile app sold through the Apple App Store or Google Play. Net Revenue means the gross subscription price actually received by Nuria, after deduction of Apple or Google platform fees. Referred Subscriber means a person whose first subscription is attributed to the Ambassador code by the relevant store. Accrued Balance means unpaid Ambassador Share accumulated over time.",
    ),
    (
        "2",
        "Eligibility and enrolment",
        "The Ambassador must be at least 18 years old and legally permitted to receive payments in their country of residence. Enrolment becomes effective when Nuria issues a unique ambassador code and the Ambassador first uses or shares it. Nuria may refuse or revoke enrolment where conduct conflicts with brand values, store policies, or applicable law.",
    ),
    (
        "3",
        "Ambassador share",
        "The Ambassador is entitled to 50% of Net Revenue generated by each Referred Subscriber for each active billing cycle, including renewals, until terminated under Section 8. Refunds, chargebacks, grace-period reversals, or store adjustments are deducted from the next Accrued Balance calculation.",
    ),
    (
        "4",
        "Payout threshold and cadence",
        "Payouts are released only when Accrued Balance reaches EUR 100. Below the threshold, balances carry forward indefinitely without expiry. Once the threshold is reached, Nuria initiates transfer within 30 days of the close of the calendar month in which the threshold was crossed. On termination, any remaining Accrued Balance of at least EUR 25 is paid within 60 days.",
    ),
    (
        "5",
        "Currency, fees and taxes",
        "All amounts are denominated and paid in Euro. Receiving-account currency conversion is handled by the receiving bank or service. Bank, intermediary, PayPal, Wise, SWIFT, or processor fees may be passed through at cost and shown on the payout statement. The Ambassador acts as an independent contractor and is responsible for declaring and paying any taxes, duties, or social charges.",
    ),
    (
        "6",
        "Reporting",
        "Nuria may provide monthly or periodic statements showing anonymised referred subscriber activity, gross revenue, platform fees, Net Revenue, Ambassador Share, deductions, and Accrued Balance. Store attribution records are the controlling source for referral and subscription status.",
    ),
    (
        "7",
        "Brand, conduct and promotion",
        "The Ambassador receives a limited, non-exclusive, revocable licence to use approved Nuria names, marks, and materials only to promote the app. The Ambassador may not alter marks, imply employment or agency, use misleading claims, spam, incentivised installs, deceptive endorsements, paid search bidding on Nuria-branded terms, or conduct that breaches App Store, Google Play, advertising, consumer-protection, or platform rules.",
    ),
    (
        "8",
        "Termination",
        "Either party may terminate the agreement on seven days written notice by email. Nuria may terminate immediately for material breach, fraud, abuse, store-policy risk, legal risk, or reputational harm. On termination, the ambassador code may be deactivated, accrued amounts are settled under Section 4, and future earnings cease from the next billing cycle unless forfeiture applies for cause.",
    ),
    (
        "9",
        "Confidentiality",
        "The Ambassador must treat non-public commercial, financial, operational, product, or customer information received from Nuria as confidential and may not disclose it without prior written consent, except where required by law.",
    ),
    (
        "10",
        "Liability and disclaimers",
        "The Program is provided as is. Nuria does not guarantee any revenue level, subscription volume, platform approval, uninterrupted attribution, or availability of a specific payout method. To the maximum extent permitted by law, Nuria is not liable for indirect, incidental, consequential, special, punitive, or lost-profit damages arising from the Program.",
    ),
    (
        "11",
        "Governing law and contact",
        f"These terms are governed by Swedish law, with disputes submitted to the competent courts of Stockholm, Sweden, unless mandatory consumer or local law provides otherwise. Questions, notices, payout details, and support requests should be sent to {CONTACT_EMAIL}.",
    ),
]


def draw_term_card(c, x, top, w, number, title, body, dark=False):
    title_color = GREEN
    fill = HexColor("#f8f1df")
    stroke = HexColor("#cfb36e")
    rect_top(c, x, top, w, 28, fill=MILITARY if dark else fill, stroke=stroke, radius=6, line_width=0.7)
    text_top(c, f"SECTION {number}", x + 10, top + 8, "SegoeBold", 7.6, GOLD_LIGHT if dark else GOLD, tracking=1.3)
    text_top(c, title, x + 88, top + 7, "SegoeBold", 9.2, CREAM if dark else title_color)
    body_top = top + 38
    body_end = paragraph(c, body, x + 10, body_top, w - 20, "Segoe", 7.6, 9.6, CREAM if dark else MUTED)
    return body_end + 8


def build_terms_pdf():
    c = canvas.Canvas(str(TERMS_PDF), pagesize=A4, pageCompression=1)
    chunks = [TERM_SECTIONS[:3], TERM_SECTIONS[3:6], TERM_SECTIONS[6:]]
    titles = ["Terms and Conditions", "Payments and Reporting", "Conduct and Legal"]
    for page_index, sections in enumerate(chunks, start=1):
        dark = page_index == 1
        draw_background(c, dark=dark)
        draw_header(c, "Ambassador Terms", page_index, 3, dark=dark)
        text_color = CREAM if dark else GREEN
        muted = HexColor("#eadfbf") if dark else MUTED
        section_label(c, "Nuria Ambassador Program", MARGIN, 82, GOLD_LIGHT if dark else GOLD)
        text_top(c, titles[page_index - 1], MARGIN, 106, "Bahnschrift", 30, text_color)
        if page_index == 1:
            paragraph(
                c,
                "These terms set out how ambassador earnings are calculated, paid, and governed. By requesting or using a Nuria ambassador code, the Ambassador accepts these terms in full.",
                MARGIN,
                152,
                480,
                "Segoe",
                9.2,
                13,
                muted,
            )
            start_top = 226
        else:
            start_top = 154
        col_w = (PAGE_W - MARGIN * 2 - 18) / 2
        if page_index == 1:
            positions = [(0, start_top), (0, start_top + 128), (0, start_top + 272)]
        elif page_index == 2:
            positions = [(0, start_top), (1, start_top), (0, start_top + 238)]
        else:
            positions = [(0, start_top), (0, start_top + 168), (1, start_top), (1, start_top + 138), (1, start_top + 306)]
        for (number, title, body), (col, top) in zip(sections, positions):
            x = MARGIN + col * (col_w + 18)
            draw_term_card(c, x, top, col_w, number, title, body, dark=dark)
        if page_index == 3:
            rect_top(c, MARGIN, 704, PAGE_W - MARGIN * 2, 48, fill=HexColor("#f8f1df"), stroke=HexColor("#cfb36e"), radius=6)
            text_top(c, "Contact", MARGIN + 14, 718, "SegoeBold", 8.4, GOLD, tracking=1.2)
            text_top(c, CONTACT_EMAIL, MARGIN + 78, 716, "SegoeBold", 10.5, GREEN)
            text_top(c, "Edition 2026 - v1.1", PAGE_W - MARGIN - 120, 716, "Segoe", 8.6, MUTED)
        draw_footer(c, dark=dark)
        c.showPage()
    c.save()


def render_cover_and_og():
    doc = fitz.open(str(PROGRAM_PDF))
    page = doc.load_page(0)
    pix = page.get_pixmap(matrix=fitz.Matrix(2.6, 2.6), alpha=False)
    cover = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    cover.thumbnail((860, 1200), Image.Resampling.LANCZOS)
    cover.save(COVER_JPG, quality=88, optimize=True, progressive=True)

    w, h = 1200, 630
    olive = (52, 61, 36)
    olive_band = (75, 83, 32)
    gold = (173, 132, 46)
    muted = (64, 53, 31)
    img = Image.new("RGB", (w, h), "#eadcc3")
    draw = ImageDraw.Draw(img)
    for yy in range(h):
        ratio = yy / (h - 1)
        r = int(247 * (1 - ratio) + 222 * ratio)
        g = int(239 * (1 - ratio) + 208 * ratio)
        b = int(223 * (1 - ratio) + 181 * ratio)
        draw.line([(0, yy), (w, yy)], fill=(r, g, b))
    for x in range(-120, w, 180):
        draw.line([(x, 0), (x + 190, h)], fill=(216, 198, 159), width=1)
    draw.rounded_rectangle((56, 62, 668, 564), radius=8, fill=(247, 239, 223), outline=gold, width=2)
    draw.rectangle((56, 62, 72, 564), fill=olive_band)
    draw.line((104, 118, 624, 118), fill=gold, width=2)

    def pil_font(paths, size):
        for p in paths:
            if Path(p).exists():
                return ImageFont.truetype(p, size)
        return ImageFont.load_default(size=size)

    title_font = pil_font(["C:/Windows/Fonts/bahnschrift.ttf", "C:/Windows/Fonts/segoeuib.ttf"], 78)
    body_font = pil_font(["C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/arial.ttf"], 30)
    bold_font = pil_font(["C:/Windows/Fonts/segoeuib.ttf", "C:/Windows/Fonts/arialbd.ttf"], 30)
    small_font = pil_font(["C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/arial.ttf"], 22)

    draw.text((104, 82), "NURIA", fill=olive, font=bold_font)
    draw.text((104, 145), "Ambassador", fill=olive, font=title_font)
    draw.text((104, 224), "Program", fill=olive, font=title_font)
    lines = ["Share Nuria with sincerity.", "Earn 50% of net subscription revenue", "while your referrals renew."]
    yy = 336
    for line in lines:
        draw.text((104, yy), line, fill=muted, font=body_font)
        yy += 39
    stats = [
        ("50%", "Net Revenue share", 104),
        ("EUR 100", "payout threshold", 306),
        ("Recurring", "renewal rewards", 500),
    ]
    for value, label, sx in stats:
        draw.text((sx, 470), value, fill=olive, font=bold_font)
        draw.text((sx, 508), label, fill=muted, font=small_font)

    shadow = Image.new("RGBA", (420, 560), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((30, 26, 390, 536), radius=8, fill=(61, 45, 17, 70))
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    img.paste(shadow, (728, 42), shadow)
    cover2 = cover.copy()
    cover2.thumbnail((340, 486), Image.Resampling.LANCZOS)
    frame = Image.new("RGB", (cover2.width + 18, cover2.height + 18), (248, 241, 223))
    fd = ImageDraw.Draw(frame)
    fd.rectangle((0, 0, frame.width - 1, frame.height - 1), outline=gold, width=2)
    frame.paste(cover2, (9, 9))
    img.paste(frame, (815, 58))
    draw.line((744, 564, 1138, 564), fill=gold, width=2)
    draw.text((812, 584), SITE_URL, fill=olive, font=small_font)
    img.save(OG_JPG, quality=88, optimize=True, progressive=True)


def main():
    register_fonts()
    build_program_pdf()
    build_terms_pdf()
    render_cover_and_og()
    print(f"Wrote {PROGRAM_PDF.relative_to(ROOT)}")
    print(f"Wrote {TERMS_PDF.relative_to(ROOT)}")
    print(f"Wrote {COVER_JPG.relative_to(ROOT)}")
    print(f"Wrote {OG_JPG.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
