#!/usr/bin/env python3
"""Generate the downloadable CV PDF from the static /print.html page.

Requires the local dev server running (run_local_server.sh or the workspace
start_local_servers.sh) and playwright with the system chromium (workspace
.venv already has it, same setup as presentations/build_pdf.py).

Usage:
    ../.venv/bin/python _scripts/build_cv_pdf.py [--url URL] [--out PATH]

Decorative running strips (real gitgraph, transparent PNGs from build_cv_footer.py):
  - Footer: on every page, in the bottom margin, flipped so its trunk is the bottom
    baseline and branches rise toward the content.
  - Header: the SAME asset unflipped (trunk on top, branches hanging down) in the top
    margin, but only on the continuation pages (2+), not on page 1 which already has
    its own elaborate header. Chromium's margin templates can't skip page 1, so we
    render twice at the same margin (identical pagination) and merge: page 1 from the
    no-header pass + pages 2+ from the with-header pass. --no-running-header disables it.

Output (committed with the site): pdf/EnriqueHerediaAguado_CV.pdf
"""

import argparse
import base64
import os
import sys
import tempfile

import pypdf
from playwright.sync_api import sync_playwright

DEFAULT_URL = "http://127.0.0.1:4000/print.html"
CHROMIUM = "/usr/bin/chromium"


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    default_out = os.path.join(project_dir, "pdf", "EnriqueHerediaAguado_CV.pdf")

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default=DEFAULT_URL)
    parser.add_argument("--out", default=default_out)
    parser.add_argument("--margin-top", default="10mm",
                        help="Top margin for page 1 (the compact core); 10mm is the max that keeps "
                             "it on one page.")
    parser.add_argument("--margin-top-cont", default="15mm",
                        help="Top margin for the continuation pages (2+). Slightly larger than page 1 "
                             "so their TEXT starts a bit lower while the header graph strip stays put "
                             "in the margin. Only used with the running header (two-pass merge).")
    parser.add_argument("--header-img", default=None,
                        help="PNG for the running header strip on continuation pages "
                             "(default: reuse img/cv_footer_graph.png, unflipped). See --no-running-header.")
    parser.add_argument("--no-running-header", dest="running_header", action="store_false",
                        help="Disable the continuation-page header strip (footer-only PDF).")
    args = parser.parse_args()

    os.makedirs(os.path.dirname(args.out), exist_ok=True)

    def img_strip(png_path, flip):
        """Base64-embed png_path as a full-width margin strip; flip=True mirrors it
        vertically (used for the footer so its trunk becomes the bottom baseline)."""
        with open(png_path, "rb") as fh:
            b64 = base64.b64encode(fh.read()).decode("ascii")
        transform = " transform:scaleY(-1);" if flip else ""
        return (
            '<div style="width:100%; margin:0; padding:0 13mm;'
            ' -webkit-print-color-adjust:exact; print-color-adjust:exact;">'
            '<img src="data:image/png;base64,' + b64 + '"'
            ' style="display:block; width:100%; height:auto;' + transform + '"></div>'
        )

    # Footer strip: flipped so the trunk reads as the bottom baseline (branches rise).
    footer_png = os.path.join(project_dir, "img", "cv_footer_graph.png")
    footer_tpl = img_strip(footer_png, flip=True) if os.path.exists(footer_png) else "<span></span>"

    # Header strip: the same asset unflipped (trunk on top, branches hanging down).
    header_png = args.header_img or footer_png
    header_strip = (img_strip(header_png, flip=False)
                    if (args.running_header and os.path.exists(header_png)) else None)
    # An empty template suppresses Chromium's default date/title/page-number chrome.
    EMPTY = "<span></span>"

    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROMIUM)
        page = browser.new_page()
        try:
            page.goto(args.url, wait_until="networkidle", timeout=30000)
        except Exception as exc:
            print(f"[error] Could not load {args.url}: {exc}")
            print("        Is the local server running? (./run_local_server.sh)")
            sys.exit(1)
        page.wait_for_timeout(500)

        def render(out_path, header_tpl, margin_top):
            page.pdf(
                path=out_path,
                format="A4",
                print_background=True,
                display_header_footer=True,
                header_template=header_tpl,
                footer_template=footer_tpl,
                margin={"top": margin_top, "bottom": "14mm", "left": "13mm", "right": "13mm"},
            )

        if header_strip is None:
            # Footer-only: single pass.
            render(args.out, EMPTY, args.margin_top)
        else:
            # Two-pass merge so the header strip lands only on continuation pages, and
            # so page 1 and the continuation pages can use different top margins:
            #   - page 1  comes from the no-header pass at --margin-top (compact core);
            #   - pages 2+ come from the with-header pass at --margin-top-cont, whose
            #     larger top margin drops the TEXT a little lower (the strip stays put
            #     in the margin).
            # The continuation content is the tail of each pass; the no-header pass at
            # the smaller margin gives the canonical page count, so we take that many
            # pages from the end of the with-header pass (robust if the bigger margin
            # shifts where the core ends).
            with tempfile.TemporaryDirectory() as td:
                no_hdr = os.path.join(td, "no_header.pdf")
                with_hdr = os.path.join(td, "with_header.pdf")
                render(no_hdr, EMPTY, args.margin_top)
                render(with_hdr, header_strip, args.margin_top_cont)
                base = pypdf.PdfReader(no_hdr)
                hdr = pypdf.PdfReader(with_hdr)
                cont = len(base.pages) - 1          # continuation page count (canonical)
                writer = pypdf.PdfWriter()
                writer.add_page(base.pages[0])
                for pg in hdr.pages[len(hdr.pages) - cont:]:
                    writer.add_page(pg)
                with open(args.out, "wb") as fh:
                    writer.write(fh)
        browser.close()

    size_kb = os.path.getsize(args.out) // 1024
    print(f"PDF written: {args.out} ({size_kb} KB)")


if __name__ == "__main__":
    main()
