---
title: CV — Print version
layout: print
sitemap: false
---
<!--
  Static, linear version of the CV used to generate the downloadable PDF.
  No canvas/JS: section headings come from _data/cv_sections.yml (group/label),
  the same single source used by the interactive graph on the index page.
  Regenerate the PDF with: .venv/bin/python _scripts/build_cv_pdf.py
-->
<header class="print-header">
    <img class="print-header-graph" src="{{ '/img/cv_header_graph.png' | relative_url }}" alt="">
    <div class="print-header-text">
    <h1>Enrique Heredia Aguado</h1>
    <p class="print-subtitle">Robotics, Computer Vision and AI · PhD Student</p>
    <p class="print-contact">
        <a class="obf-mail" data-u="e.heredia" data-d="umh.es" data-show href="#"><svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/></svg>e.heredia [at] umh.es</a> ·
        <a href="https://enheragu.github.io"><svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm7.93 9h-3.02a15.7 15.7 0 0 0-1.2-5.3A8.02 8.02 0 0 1 19.93 11zM12 4.04c.83 1.2 1.62 3.05 1.9 6.96h-3.8c.28-3.91 1.07-5.76 1.9-6.96zM4.07 13h3.02c.14 1.93.55 3.73 1.2 5.3A8.02 8.02 0 0 1 4.07 13zm3.02-2H4.07a8.02 8.02 0 0 1 4.22-5.3 15.7 15.7 0 0 0-1.2 5.3zM12 19.96c-.83-1.2-1.62-3.05-1.9-6.96h3.8c-.28 3.91-1.07 5.76-1.9 6.96zm3.71-1.66c.65-1.57 1.06-3.37 1.2-5.3h3.02a8.02 8.02 0 0 1-4.22 5.3z"/></svg>enheragu.github.io</a>
    </p>
    </div>
</header>
{%- comment -%}
  The PDF is split into page-groups by the print_page flag in _data/cv_sections.yml
  (1 = compact core, 2 = Publications+Awards, 3 = Projects+Courses). Items keep
  their web order within each group; print_compact entries render heading-only.
{%- endcomment -%}
{%- assign page1 = site.data.cv_sections.items | where: "print_page", 1 -%}
{%- assign page2 = site.data.cv_sections.items | where: "print_page", 2 -%}
{%- assign page3 = site.data.cv_sections.items | where: "print_page", 3 -%}
{%- assign ordered = page1 | concat: page2 | concat: page3 -%}
{%- assign cur_page = 0 -%}
{%- assign pbranch_open = false -%}
{%- for item in ordered -%}
  {%- if item.print_page != cur_page -%}
    {%- unless forloop.first -%}
      </div>
    </section>
  </section>
    {%- endunless -%}
  <section class="print-cv{% unless forloop.first %} print-newpage{% endunless %}">
    {%- assign cur_page = item.print_page -%}
    {%- assign pbranch_open = false -%}
  {%- endif -%}
  {%- if item.group -%}
    {%- if pbranch_open -%}
      </div>
    </section>
    {%- endif -%}
    {%- comment -%} Section colour mirrors SECTION_COLORS in js/index.js so the PDF
       matches the web (set inline per section — nth-of-type would reset per page). {%- endcomment -%}
    {%- case item.group -%}
      {%- when "Education" -%}{%- assign bcolor = "#1a73e8" -%}
      {%- when "Work Experience" -%}{%- assign bcolor = "#c9950c" -%}
      {%- when "Publications" -%}{%- assign bcolor = "#1e8e3e" -%}
      {%- when "Awards" -%}{%- assign bcolor = "#c9950c" -%}
      {%- when "Projects" -%}{%- assign bcolor = "#d93025" -%}
      {%- when "Courses and Workshops" -%}{%- assign bcolor = "#8430ce" -%}
      {%- when "Skills" -%}{%- assign bcolor = "#1a73e8" -%}
      {%- else -%}{%- assign bcolor = "#57606a" -%}
    {%- endcase -%}
    <section class="pbranch" style="--branch: {{ bcolor }};">
      <h2 class="print-section"><span>{{ item.group }}</span></h2>
      <div class="pbranch-body">
    {%- assign pbranch_open = true -%}
  {%- endif -%}
      {%- if item.edu or item.label -%}
        {%- if item.edu -%}{%- assign e = site.data.education[item.edu] -%}{%- capture label_str -%}[{{ e.dates }}] · {{ e.degree }} · {{ e.institution }}{%- endcapture -%}{%- else -%}{%- assign label_str = item.label -%}{%- endif -%}
        {%- if label_str contains "]" -%}
          {%- assign hdate = label_str | split: "]" | first | append: "]" -%}
          {%- assign hrest = label_str | remove_first: hdate | remove_first: " · " -%}
          <h3 class="print-entry"><span class="print-date">{{ hdate }}</span>{%- if hrest != "" %} · {{ hrest }}{% endif -%}</h3>
        {%- else -%}
          <h3 class="print-entry">{{ label_str }}</h3>
        {%- endif -%}
      {%- endif -%}
    {%- unless item.print_compact -%}
      <div id="{{ item.id }}" class="print-panel">
        {% include_relative {{ site.data.cv_sections.content_path }}/{{ item.id | replace: '-', '_' }}.html %}
      </div>
    {%- endunless -%}
{%- endfor -%}
      </div>
    </section>
  </section>
<script>
    // Same obfuscated-email resolution as the main layout (print layout is standalone).
    document.querySelectorAll('.obf-mail').forEach(function(a) {
        var u = a.getAttribute('data-u'), d = a.getAttribute('data-d');
        if (!u || !d) return;
        var addr = u + '@' + d;
        a.setAttribute('href', 'mailto:' + addr);
        if (a.hasAttribute('data-show')) a.textContent = addr;
    });

    // Site-relative links do not work from inside a PDF: point them at the
    // published site instead.
    document.querySelectorAll('a[href^="/"]').forEach(function(a) {
        a.href = '{{ site.url }}' + a.getAttribute('href');
    });

    // Long author lists: the web shows everyone, but the PDF summarises —
    // more than MAX authors collapses to the first KEEP (always including
    // Enrique, re-highlighted) + "et al.".
    (function() {
        var MAX_AUTHORS = 8, KEEP = 6;
        var isSelf = function(a) { return a.indexOf('Heredia') !== -1; };
        document.querySelectorAll('[data-pub-actions]').forEach(function(s) {
            var authors = (s.getAttribute('data-pub-authors') || '').split('||').filter(Boolean);
            if (authors.length <= MAX_AUTHORS) return;
            var li = s.closest('li');
            var small = li && li.querySelector('cite small');
            if (!small) return;
            var selfIdx = authors.findIndex(isSelf);
            // Authorship position is sacred: Enrique is always shown, and if
            // authors before him are omitted, an APA-style ellipsis marks it
            // ("A, B, …, Enrique Heredia-Aguado, et al.").
            var shown, ellipsisBeforeSelf = false;
            if (selfIdx < KEEP) {
                shown = authors.slice(0, KEEP);
            } else {
                shown = authors.slice(0, KEEP - 1).concat(authors[selfIdx]);
                ellipsisBeforeSelf = true;
            }
            var moreAfter = (selfIdx < KEEP) ? (authors.length > KEEP) : (selfIdx < authors.length - 1);
            small.textContent = '';
            shown.forEach(function(a, i) {
                if (i) small.appendChild(document.createTextNode(', '));
                if (isSelf(a)) {
                    if (ellipsisBeforeSelf) small.appendChild(document.createTextNode('… '));
                    var span = document.createElement('span');
                    span.className = 'pub-self';
                    span.textContent = a;
                    small.appendChild(span);
                } else {
                    small.appendChild(document.createTextNode(a));
                }
            });
            small.appendChild(document.createTextNode(moreAfter ? ', et al. ' : '. '));
        });
    })();

    // Publication actions: render DOI / link as plain anchors (the interactive
    // widget from publication-ui.js is not loaded in the print version).
    document.querySelectorAll('[data-pub-actions]').forEach(function(s) {
        var doi = s.getAttribute('data-pub-doi');
        var url = s.getAttribute('data-pub-url');
        var a = document.createElement('a');
        if (doi) {
            a.href = 'https://doi.org/' + doi;
            a.textContent = 'doi:' + doi;
        } else if (url) {
            // Skip if the surrounding entry already links this same URL
            var li = s.closest('li');
            if (li && li.querySelector('a[href="' + url + '"]')) return;
            a.href = url;
            a.textContent = '[link]';
        } else {
            return;
        }
        a.className = 'link-badge';
        s.appendChild(a);
    });
</script>
