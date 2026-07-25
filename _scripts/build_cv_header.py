#!/usr/bin/env python3
"""Render _scripts/cv_graph_header.html into img/cv_header_graph.png.

A decorative header banner drawn with the REAL gitgraph engine (light theme,
transparent background), embedded at the top of the print/PDF header. Same
tooling as build_og_card.py (Playwright + system chromium, workspace .venv).

Usage:
    ../.venv/bin/python _scripts/build_cv_header.py

Regenerate after editing _scripts/cv_graph_header.html.
Output (committed with the site): img/cv_header_graph.png
"""

import os

from playwright.sync_api import sync_playwright

CHROMIUM = "/usr/bin/chromium"
STAGE = (1000, 88)
SCALE = 2


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    html_path = os.path.join(script_dir, "cv_graph_header.html")
    out_path = os.path.join(project_dir, "img", "cv_header_graph.png")

    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROMIUM)
        context = browser.new_context(
            viewport={"width": STAGE[0], "height": STAGE[1]},
            device_scale_factor=SCALE,
        )
        page = context.new_page()
        page.goto(f"file://{html_path}")
        page.wait_for_timeout(250)
        page.locator(".stage").screenshot(path=out_path, omit_background=True)
        browser.close()

    size_kb = os.path.getsize(out_path) // 1024
    print(f"Header graph written: {out_path} ({size_kb} KB)")


if __name__ == "__main__":
    main()
