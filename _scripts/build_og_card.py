#!/usr/bin/env python3
"""Render og_card.html into img/og_card.png (social-share preview image).

Standalone static HTML (no Jekyll templating, no dev server needed) rendered
at 2x device scale for crisp text/lines, then downsampled to the standard
1200x630 OG image size. Same tooling as build_cv_pdf.py (Playwright + system
chromium, workspace .venv).

Usage:
    ../.venv/bin/python _scripts/build_og_card.py

Regenerate after editing _scripts/og_card.html (name, tagline, palette, ...).
Output (committed with the site): img/og_card.png
"""

import os

from PIL import Image
from playwright.sync_api import sync_playwright

CHROMIUM = "/usr/bin/chromium"
OUT_SIZE = (1200, 630)
SCALE = 2


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    html_path = os.path.join(script_dir, "og_card.html")
    raw_path = os.path.join(script_dir, ".og_card_raw.png")
    out_path = os.path.join(project_dir, "img", "og_card.png")

    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROMIUM)
        context = browser.new_context(
            viewport={"width": OUT_SIZE[0], "height": OUT_SIZE[1]},
            device_scale_factor=SCALE,
        )
        page = context.new_page()
        page.goto(f"file://{html_path}")
        page.evaluate("document.fonts.ready")
        page.wait_for_timeout(200)
        page.locator(".stage").screenshot(path=raw_path)
        browser.close()

    im = Image.open(raw_path).resize(OUT_SIZE, Image.LANCZOS).convert("RGB")
    im.save(out_path)
    os.remove(raw_path)

    size_kb = os.path.getsize(out_path) // 1024
    print(f"OG card written: {out_path} ({size_kb} KB)")


if __name__ == "__main__":
    main()
