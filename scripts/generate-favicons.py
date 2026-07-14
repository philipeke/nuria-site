"""Favicons from the Nuria logo MARK only (crescent + dome), excluding the
"NURIA" wordmark below it. Tab icons: tight alpha trim. Apple touch: mark with margin."""
from __future__ import annotations

import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "assets")
SRC = os.path.join(ASSETS, "Nuria Logo.png")

ALPHA_THRESH = 16


def mark_only(im: Image.Image) -> Image.Image:
    """Crop to the top alpha band (the logo mark), dropping the wordmark below.

    The source is a vertical lockup: mark on top, "NURIA" text underneath,
    separated by a fully transparent gap. We keep only the topmost content band.
    """
    alpha = im.split()[3]
    w, h = im.size
    ap = alpha.load()
    # per-row coverage
    covered = []
    for y in range(h):
        for x in range(0, w, 4):
            if ap[x, y] > ALPHA_THRESH:
                covered.append(y)
                break
    if not covered:
        return im
    # walk from the first covered row until the first all-empty gap -> end of mark
    top = covered[0]
    covered_set = set(covered)
    bottom = top
    y = top
    while y in covered_set:
        bottom = y
        y += 1
    mark = im.crop((0, top, w, bottom + 1))
    # tight horizontal trim
    bbox = mark.split()[3].point(lambda p: 255 if p > ALPHA_THRESH else 0).getbbox()
    if bbox:
        mark = mark.crop(bbox)
    return mark


def square(im: Image.Image) -> Image.Image:
    w, h = im.size
    side = max(w, h)
    sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    sq.paste(im, ((side - w) // 2, (side - h) // 2), im)
    return sq


def apple_touch(mark: Image.Image, size: int = 180, margin_frac: float = 0.12) -> Image.Image:
    sq = square(mark)
    inner = int(size * (1.0 - 2 * margin_frac))
    sq_r = sq.resize((inner, inner), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    off = (size - inner) // 2
    out.paste(sq_r, (off, off), sq_r)
    return out


def main() -> None:
    base = Image.open(SRC).convert("RGBA")
    mark = mark_only(base)
    tab = square(mark)
    for name, px in [
        ("favicon-tab.png", 256),
        ("favicon-64.png", 64),
        ("favicon-48.png", 48),
        ("favicon-32.png", 32),
    ]:
        tab.resize((px, px), Image.Resampling.LANCZOS).save(
            os.path.join(ASSETS, name), optimize=True
        )
    apple_touch(mark, 180, 0.12).save(
        os.path.join(ASSETS, "apple-touch-icon.png"), optimize=True
    )
    print("OK mark:", mark.size, "-> favicon-*.png + apple-touch-icon.png")


if __name__ == "__main__":
    main()
