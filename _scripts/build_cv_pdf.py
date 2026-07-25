#!/usr/bin/env python3
"""Generate the downloadable CV PDF from the static /print.html page.

Requires the local dev server running (run_local_server.sh or the workspace
start_local_servers.sh) and playwright with the system chromium (workspace
.venv already has it, same setup as presentations/build_pdf.py).

Usage:
    ../.venv/bin/python _scripts/build_cv_pdf.py [--url URL] [--out PATH]

Output (committed with the site): pdf/EnriqueHerediaAguado_CV.pdf
"""

import argparse
import os
import sys

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
    args = parser.parse_args()

    os.makedirs(os.path.dirname(args.out), exist_ok=True)

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
        page.pdf(
            path=args.out,
            format="A4",
            print_background=True,
            margin={"top": "12mm", "bottom": "12mm", "left": "13mm", "right": "13mm"},
        )
        browser.close()

    size_kb = os.path.getsize(args.out) // 1024
    print(f"PDF written: {args.out} ({size_kb} KB)")


if __name__ == "__main__":
    main()
