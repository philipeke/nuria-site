"""Tab favicons: tight alpha trim. Apple touch: full icon with margin (not tab-only)."""
from __future__ import annotations

import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "assets")
SRC = os.path.join(ASSETS, "Nuria Logo.png")


def tight_square_for_tab(im: Image.Image, alpha_thresh: int = 16) -> Image.Image:
    alpha = im.split()[3]
    mask = alpha.point(lambda p: 255 if p > alpha_thresh else 0)
    bbox = mask.getbbox()
    if bbox:
        im = im.crop(bbox)
    w, h = im.size
    side = max(w, h)
    sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    sq.paste(im, ((side - w) // 2, (side - h) // 2), im)
    return sq


def apple_touch_from_full(im: Image.Image, size: int = 180, margin_frac: float = 0.12) -> Image.Image:
    w, h = im.size
    side = max(w, h)
    sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    sq.paste(im, ((side - w) // 2, (side - h) // 2), im)
    inner = int(size * (1.0 - 2 * margin_frac))
    sq_r = sq.resize((inner, inner), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    off = (size - inner) // 2
    out.paste(sq_r, (off, off), sq_r)
    return out


def main() -> None:
    base = Image.open(SRC).convert("RGBA")
    tab = tight_square_for_tab(base)
    for name, px in [
        ("favicon-tab.png", 256),
        ("favicon-64.png", 64),
        ("favicon-48.png", 48),
        ("favicon-32.png", 32),
    ]:
        tab.resize((px, px), Image.Resampling.LANCZOS).save(
            os.path.join(ASSETS, name), optimize=True
        )
    apple_touch_from_full(base, 180, 0.12).save(
        os.path.join(ASSETS, "apple-touch-icon.png"), optimize=True
    )
    print("OK tab:", tab.size, "files:", "favicon-*.png + apple-touch-icon.png")


if __name__ == "__main__":
    main()
