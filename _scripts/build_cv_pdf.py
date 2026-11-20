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
import re
import subprocess
import sys
import tempfile

import pypdf
from pypdf.annotations import Link
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
    parser.add_argument("--short-out", default=None,
                        help="One-page CV (the core page alone, internal links pointing to the full "
                             "PDF online). Default: <out> with a _short suffix; 'none' to skip.")
    parser.add_argument("--cvn-out", default=None,
                        help="Full-data CV (_fulldata): prints the /cvn/ page (its @media print layout). "
                             "Default: <out> with an _fulldata suffix; 'none' to skip.")
    args = parser.parse_args()
    if args.cvn_out is None:
        args.cvn_out = os.path.splitext(args.out)[0] + "_fulldata.pdf"
    if args.short_out is None:
        args.short_out = os.path.splitext(args.out)[0] + "_short.pdf"

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

        def render(out_path, header_tpl, margin_top, only_css=None):
            # only_css: injected for this render only, to keep just one part of the
            # CV (see the two-pass merge below), then removed.
            style = page.add_style_tag(content=only_css) if only_css else None
            page.pdf(
                path=out_path,
                format="A4",
                print_background=True,
                display_header_footer=True,
                header_template=header_tpl,
                footer_template=footer_tpl,
                margin={"top": margin_top, "bottom": "14mm", "left": "13mm", "right": "13mm"},
            )
            if style:
                style.evaluate("e => e.remove()")

        # Parts of print.html kept by each render (injected CSS, removed afterwards).
        CORE_ONLY = ".print-cv:not(.print-page-1) { display: none !important; }"
        CONT_ONLY = ".print-header, .print-page-1 { display: none !important; }"
        SHORT_ONLY = CORE_ONLY + " .print-short-only { display: inline !important; }"

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
            # Each pass renders ONLY its part (CSS injected for that render), so the
            # merge is simply every page of pass 1 + every page of pass 2 and nothing
            # can be dropped. (Before 2026-11-19 both passes rendered everything and the
            # merge took "the last N pages" of pass 2: when the bigger margin made pass 2
            # one page longer, the first continuation page was silently lost.)
            with tempfile.TemporaryDirectory() as td:
                no_hdr = os.path.join(td, "no_header.pdf")
                with_hdr = os.path.join(td, "with_header.pdf")
                render(no_hdr, EMPTY, args.margin_top, CORE_ONLY)
                render(with_hdr, header_strip, args.margin_top_cont, CONT_ONLY)
                base = pypdf.PdfReader(no_hdr)
                hdr = pypdf.PdfReader(with_hdr)
                if len(base.pages) != 1:
                    print(f"[warn] The core (page group 1) takes {len(base.pages)} pages, not 1: "
                          "all of them are kept; trim it in css/print.css if it should fit one page.")
                writer = pypdf.PdfWriter()
                kept = [(base, pg) for pg in base.pages] + [(hdr, pg) for pg in hdr.pages]
                out_ref = {}                         # (pass, source page id) -> output page
                for reader, pg in kept:
                    out_ref[(id(reader), pg.indirect_reference.idnum)] = writer.add_page(pg).indirect_reference
                # In-document links (e.g. the Work summary's "[details]" -> Teaching)
                # are named destinations in the catalog /Dests, which the merge would
                # drop: carry over every one whose target page made it into the
                # output (page 1 from the no-header pass first), re-pointed there.
                dests = pypdf.generic.DictionaryObject()
                for reader in (base, hdr):
                    for name, arr in reader.trailer["/Root"].get("/Dests", {}).items():
                        arr = arr.get_object()
                        ref = out_ref.get((id(reader), arr[0].idnum))
                        if ref is not None and name not in dests:
                            dests[pypdf.generic.NameObject(name)] = pypdf.generic.ArrayObject([ref] + list(arr[1:]))
                if dests:
                    writer._root_object[pypdf.generic.NameObject("/Dests")] = dests
                writer.add_metadata({"/Title": "Enrique Heredia Aguado - CV", "/Author": "Enrique Heredia Aguado"})
                with open(args.out, "wb") as fh:
                    writer.write(fh)

        if args.short_out.lower() != "none":
            # One-page CV: the core alone. Its in-document links ("[details]" ->
            # Teaching / Publications) have no target there, so they point to the
            # full PDF online for this render only (restored afterwards).
            full_url = "https://enheragu.github.io/pdf/" + os.path.basename(default_out)
            page.evaluate("""u => document.querySelectorAll('a[href^="#"]').forEach(a => {
                a.dataset.inDoc = a.getAttribute('href'); a.setAttribute('href', u); })""", full_url)
            page.evaluate("document.title = 'Enrique Heredia Aguado - CV (one page)'")
            render(args.short_out, EMPTY, args.margin_top, SHORT_ONLY)
            page.evaluate("""() => document.querySelectorAll('a[data-in-doc]').forEach(a => {
                a.setAttribute('href', a.dataset.inDoc); delete a.dataset.inDoc; })""")
            n_short = len(pypdf.PdfReader(args.short_out).pages)
            if n_short != 1:
                print(f"[warn] The one-page CV takes {n_short} pages: trim the core in css/print.css.")
        if args.cvn_out.lower() != "none":
            build_cvn_pdf(browser, args, project_dir)
        browser.close()

    size_kb = os.path.getsize(args.out) // 1024
    print(f"PDF written: {args.out} ({size_kb} KB)")
    if args.short_out.lower() != "none":
        print(f"PDF written: {args.short_out} ({os.path.getsize(args.short_out) // 1024} KB)")
    if args.cvn_out.lower() != "none":
        print(f"PDF written: {args.cvn_out} ({os.path.getsize(args.cvn_out) // 1024} KB)")


FOOTER_LINK_TEXT = "enheragu.github.io"   # the main site, not /cvn/ (an internal tool; Enrique, 2026-11-20)
FOOTER_LINK_URL = "https://enheragu.github.io/"


def link_footer(pdf_path, text, url):
    """Make `text` clickable on every page. Chromium's header/footer templates
    produce no link annotations, so the word is located with `pdftotext -bbox`
    (poppler) and a Link annotation is added over it. Skipped with a warning if
    pdftotext is missing or the word is not found."""
    try:
        bbox = subprocess.run(["pdftotext", "-bbox", pdf_path, "-"], check=True,
                              capture_output=True, text=True).stdout
    except (OSError, subprocess.CalledProcessError) as e:
        print(f"[warn] footer link skipped ({e})")
        return
    words = []  # every occurrence (page 1 also has it in its own header, already linked: harmless)
    for i, chunk in enumerate(bbox.split("<page ")[1:]):
        h = float(re.search(r'height="([\d.]+)"', chunk).group(1))
        for m in re.finditer(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>', chunk):
            if m.group(5) == text:
                x0, y0, x1, y1 = map(float, m.groups()[:4])
                words.append((i, (x0 - 1, h - y1 - 1, x1 + 1, h - y0 + 1)))
    if not words:
        print(f"[warn] footer link skipped ('{text}' not found)")
        return
    w = pypdf.PdfWriter(clone_from=pypdf.PdfReader(pdf_path))
    for i, rect in words:
        w.add_annotation(page_number=i, annotation=Link(rect=rect, url=url, border=[0, 0, 0]))
    with open(pdf_path, "wb") as fh:
        w.write(fh)


def build_cvn_pdf(browser, args, project_dir):
    """Full-data CV (_fulldata): the /cvn/ page printed with its own @media print
    layout (css/cvn.css): our own layout of the CVN sections, no FECYT branding. The dev server also serves the LOCAL
    working data (_data/cvn_local.yml: «Revisar» notes, private fields) and
    PENDIENTE markers; the print CSS hides them, and this function refuses to
    write the PDF if any of them shows up in its text."""
    url = args.url.rsplit("/", 1)[0] + "/cvn/"
    page = browser.new_page()
    page.goto(url, wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(500)
    page.evaluate("document.title = 'Enrique Heredia Aguado - CV (datos completos)'")
    footer = ('<div style="width:100%; font-size:7pt; color:#666; padding:0 13mm; display:flex; '
              'justify-content:space-between; font-family:Helvetica, Arial, sans-serif;">'
              f'<span>Documento generado desde {FOOTER_LINK_TEXT}</span>'
              '<span><span class="pageNumber"></span>/<span class="totalPages"></span></span></div>')
    tmp = args.cvn_out + ".tmp"
    page.pdf(path=tmp, format="A4", print_background=True, display_header_footer=True,
             header_template="<span></span>", footer_template=footer,
             margin={"top": "14mm", "bottom": "16mm", "left": "15mm", "right": "15mm"})
    page.close()
    link_footer(tmp, FOOTER_LINK_TEXT, FOOTER_LINK_URL)
    # Safety: nothing private or work-in-progress may reach the public PDF.
    text = " ".join(pg.extract_text() or "" for pg in pypdf.PdfReader(tmp).pages)
    forbidden = ["PENDIENTE", "Revisar:"]
    local = os.path.join(project_dir, "_data", "cvn_local.yml")
    if os.path.exists(local):
        in_private = False
        for line in open(local, encoding="utf-8"):
            if line.startswith("private:"):
                in_private = True
            elif in_private and line.startswith("    ") and ":" in line:
                value = line.split(":", 1)[1].strip().strip('"')
                if value:
                    forbidden.append(value)
    leaked = [f for f in forbidden if f in text]
    if leaked:
        os.remove(tmp)
        sys.exit(f"[error] The CVN-structure PDF would contain private/working data {leaked}: not written.")
    os.replace(tmp, args.cvn_out)


if __name__ == "__main__":
    main()
