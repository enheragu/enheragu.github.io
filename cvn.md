---
title: CVN import data
description: Curriculum data with the fields of the Spanish CVN (FECYT), ready to import into its editor; generated from the same data as this CV.
layout: default
permalink: /cvn/
noindex: true
sitemap: false
custom_css:
    - /css/cvn.css
---
{% comment %}
  CVN (FECYT Curriculum Vitae Normalizado) view of the CV data — the single
  place that formats it; nothing here is stored twice. Built by Jekyll on every
  deploy, so it is always current (no local tooling). Linked from the menu
  ("Downloads"), hidden from search engines.

  Where each CVN section comes from (optional `cvn:` blocks are CVN-only data):
    Situación profesional / Cargos ..... _data/employment.yml
    Titulación universitaria ........... _data/education.yml
    Formación / cursos docentes ........ _data/courses.yml
    Formación académica impartida ...... _data/teaching.yml
    Proyectos .......................... _data/projects.yml
    Publicaciones, congresos, premios .. _data/publications.yml (from the .bib,
                                         cvn_* fields) + conference events of
                                         _data/travels.yml (dates, city)
    Estancias / ayudas ................. stay events of _data/travels.yml
    Identificadores .................... _data/profile.yml
  Each item: "Nuevo" unless its data carries `listed: <date of the CVN that
  already includes it>` (in the .bib: cvn_listed). Personal data never lives in
  the repo (it is public): it stays in the FECYT editor. Working notes
  («Revisar») and private fields (contract type) come from the local,
  git-ignored _data/cvn_local.yml, and PENDIENTE markers only render in
  development: the published page shows the data alone.
{% endcomment %}
{%- assign pubs = site.data.publications -%}
{%- assign trav = site.data.travels -%}
<section class="cvn-page">
    <div class="page-header">
        <div class="page-brand-muted">{{ site.title }}</div>
        <h1>CVN import data</h1>
        <span class="page-subtitle">Datos del CV con los campos del CVN, para importarlos en el editor de FECYT</span>
        {% include page_nav.html %}
    </div>
    {%- comment -%} Printed version only (the downloadable full-data CV PDF, pdf/…_CV_fulldata.pdf).
       No FECYT branding anywhere: it is our own layout of the CVN sections. {%- endcomment %}
    <div class="cvn-print-head">
        <h1>Enrique Heredia Aguado</h1>
        <p>Currículum vitae · actualizado el {{ site.time | date: "%d/%m/%Y" }} · generado de <a href="https://enheragu.github.io/">enheragu.github.io</a></p>
    </div>

    <div class="cvn-intro">
        <p>Generado con cada actualización de la web a partir de los mismos datos que el CV. Para actualizar el CVN en el <a href="https://cvn.fecyt.es/editor/" target="_blank" rel="noopener noreferrer">editor de FECYT</a>:</p>
        <ol>
            <li><strong>Publicaciones:</strong> importarlas desde ORCID o desde el BibTeX de Scopus (Importar, en «Publicaciones, documentos científicos y técnicos»); después completar a mano los indicios de calidad que aparecen aquí.</li>
            <li><strong>Resto de apartados:</strong> «Copiar nuevos» (o «Copiar» en un elemento) y pegarlo en el botón Importar del mismo apartado del editor, formato «CICYT o personalizado»; revisar cada campo antes de añadir. Si el reconocimiento falla, los campos sirven para rellenarlo a mano.</li>
            <li>Al terminar, añadir <code>listed: "AAAA-MM-DD"</code> (fecha del nuevo CVN) a lo importado, para que deje de salir como nuevo.</li>
        </ol>
        <p class="cvn-legend"><span class="cvn-tag">Nuevo</span> no está en el último CVN · <span class="cvn-tag cvn-tag-in">En CVN</span> ya está{% if jekyll.environment != "production" %} · <span class="cvn-pend">PENDIENTE</span> dato que falta (no se copia) · «Revisar» = nota de trabajo (de <code>_data/cvn_local.yml</code>; ambos solo en local, nunca en la web publicada){% endif %}. Los datos personales no se guardan aquí: siguen en el editor.</p>
        <p><a href="{{ '/pdf/EnriqueHerediaAguado_CV.pdf' | relative_url }}">CV (PDF) ⤓</a></p>
    </div>

    {%- assign ids = site.data.profile.identifiers %}
    <section class="cvn-section" style="--sec: #57606a; --sec-text: #ffffff;">
        <h2>Datos de identificación</h2>
        {%- comment -%} ORCID (linked), then the curated public profiles, shown/printed but not
           copied to the FECYT editor (skip). ScopusID/ResearcherID hidden while those profiles
           are not curated (Enrique, 2026-11-20; the IDs stay in _data/profile.yml):
           {% include cvn_f.html k="ScopusID" v=ids.scopus_id %}{% include cvn_f.html k="ResearcherID" v=ids.researcher_id %}
        {%- endcomment %}
        {%- assign prof = site.data.profile.profiles %}
        {%- capture id_orcid %}https://orcid.org/{{ ids.orcid }}{% endcapture %}
        <pre class="cvn-fields">{% include cvn_f.html k="ORCID" v=ids.orcid url=id_orcid %}{% include cvn_f.html k="ResearchGate" v="researchgate.net" url=prof.researchgate skip=true %}{% include cvn_f.html k="Google Scholar" v="scholar.google.es" url=prof.google_scholar skip=true %}{% include cvn_f.html k="Portal de investigación UMH" v="portalinvestigacion.umh.es" url=prof.umh_portal skip=true %}</pre>
    </section>

    {%- comment -%} ===== Employment (a job, or each of its cvn.contracts) ===== {%- endcomment %}
    <section class="cvn-section" style="--sec: #d29922;">
        <h2>Situación profesional actual <button type="button" class="cvn-copy" data-cvn-copy="new">Copiar nuevos</button></h2>
        {%- for pair in site.data.employment %}{% assign j = pair[1] %}{% if j.cvn == false %}{% continue %}{% endif %}{% assign jk = pair[0] %}
        {%- if j.cvn.contracts %}{% for k in j.cvn.contracts %}{% if k.ongoing %}{% include cvn_job.html key=jk k=k current=true %}{% endif %}{% endfor %}
        {%- elsif j.ongoing %}{% include cvn_job.html key=jk current=true %}{% endif %}
        {%- endfor %}
    </section>
    <section class="cvn-section" style="--sec: #d29922;">
        <h2>Cargos y actividades desempeñados con anterioridad <button type="button" class="cvn-copy" data-cvn-copy="new">Copiar nuevos</button></h2>
        {%- comment -%} newest first: "start~key~contract index" strings, sorted {%- endcomment %}
        {%- assign prev = "" | split: "" %}
        {%- for pair in site.data.employment %}{% assign j = pair[1] %}{% if j.cvn == false %}{% continue %}{% endif %}
        {%- if j.cvn.contracts %}{% for k in j.cvn.contracts %}{% unless k.ongoing %}{% capture e %}{{ k.start }}~{{ pair[0] }}~{{ forloop.index0 }}{% endcapture %}{% assign prev = prev | push: e %}{% endunless %}{% endfor %}
        {%- elsif j.ongoing != true %}{% capture e %}{{ j.start }}~{{ pair[0] }}~x{% endcapture %}{% assign prev = prev | push: e %}{% endif %}
        {%- endfor %}
        {%- assign prev = prev | sort | reverse %}
        {%- for e in prev %}{% assign ep = e | split: "~" %}{% assign jk = ep[1] %}
        {%- if ep[2] == "x" %}{% include cvn_job.html key=jk current=false %}{% else %}{% assign ki = ep[2] | plus: 0 %}{% assign k = site.data.employment[jk].cvn.contracts[ki] %}{% include cvn_job.html key=jk k=k current=false %}{% endif %}
        {%- endfor %}
    </section>

    {%- comment -%} ===== Education ===== {%- endcomment %}
    <section class="cvn-section" style="--sec: #58a6ff;">
        <h2>Formación académica recibida · Titulación universitaria <button type="button" class="cvn-copy" data-cvn-copy="new">Copiar nuevos</button></h2>
        {%- assign edu_keys = "bsc,msc" | split: "," %}
        {%- for k in edu_keys %}{% assign e = site.data.education[k] %}{% assign c = e.cvn %}
        {%- capture f -%}
        {%- include cvn_f.html k="Titulación universitaria" v=c.level -%}
        {%- include cvn_f.html k="Nombre del título" v=c.title -%}
        {%- include cvn_f.html k="Entidad de titulación" v=c.entity -%}
        {%- include cvn_f.html k="Tipo de entidad" v=c.entity_type -%}
        {%- if c.centre %}{% include cvn_f.html k="Facultad, instituto, centro" v=c.centre %}{% endif -%}
        {%- include cvn_f.html k="Fecha de titulación" v=c.date date=true -%}
        {%- endcapture %}
        {% include cvn_item.html title=c.title listed=c.listed fields=f %}
        {%- endfor %}
        {%- assign phd = site.data.education.phd.cvn %}
        {%- comment -%} PhD in progress: a regular item for readers ("En curso", not
           copied: the CVN only takes it as «Doctorados» once defended). {%- endcomment %}
        {%- capture f -%}
        {%- include cvn_f.html k="Programa de doctorado" v=phd.programme -%}
        {%- include cvn_f.html k="Entidad" v=phd.entity -%}
        {%- include cvn_f.html k="Tipo de entidad" v=phd.entity_type -%}
        {%- include cvn_f.html k="Fecha de inicio" v=phd.start date=true -%}
        {%- capture phd_dirs %}{{ site.data.education.phd.directors | replace: " and ", " y " }}{% endcapture %}{% include cvn_f.html k="Dirección de la tesis" v=phd_dirs -%}
        {%- endcapture %}
        {% assign note = site.data.cvn_local.notes["education:phd"] %}{% include cvn_item.html title="Doctorado (en curso)" status="En curso" check=note fields=f %}
    </section>

    {%- comment -%} ===== Courses received ===== {%- endcomment %}
    {%- assign crs_groups = "false,true" | split: "," %}
    {%- for g in crs_groups %}
    <section class="cvn-section" style="--sec: #bc8cff;">
        <h2>{% if g == "true" %}Cursos y seminarios recibidos de perfeccionamiento, innovación y mejora docente{% else %}Formación especializada, continuada, técnica, profesionalizada, de reciclaje y actualización{% endif %} <button type="button" class="cvn-copy" data-cvn-copy="new">Copiar nuevos</button></h2>
        {%- for cr in site.data.courses %}{% assign tt = cr.teacher_training | default: false | append: "" %}{% if tt != g %}{% continue %}{% endif %}{% assign c = cr.cvn %}{% assign ctitle = c.title | default: cr.title %}
        {%- capture f -%}
        {%- if g == "true" -%}
        {%- include cvn_f.html k="Título del curso/seminario" v=ctitle -%}
        {%- include cvn_f.html k="Objetivos del curso/seminario" v=c.objectives -%}
        {%- include cvn_f.html k="Entidad organizadora" v=c.entity -%}
        {%- include cvn_f.html k="Tipo de entidad" v=c.entity_type -%}
        {%- include cvn_f.html k="Fecha de inicio-fin" v=cr.start v2=cr.end date=true range=true -%}
        {%- else -%}
        {%- include cvn_f.html k="Título de la formación" v=ctitle -%}
        {%- include cvn_f.html k="Entidad de titulación" v=c.entity -%}
        {%- include cvn_f.html k="Tipo de entidad" v=c.entity_type -%}
        {%- if cr.instructor %}{% include cvn_f.html k="Responsable de la formación" v=cr.instructor %}{% endif -%}
        {%- if c.city %}{% include cvn_f.html k="Ciudad entidad titulación" v=c.city %}{% endif -%}
        {%- include cvn_f.html k="Fecha de finalización" v=cr.end date=true -%}
        {%- endif -%}
        {%- capture hrs %}{% if cr.hours %}{{ cr.hours | append: "" | replace: ".", "," }} {% if cr.hours == 1 %}hora{% else %}horas{% endif %}{% endif %}{% endcapture %}{% include cvn_f.html k="Duración en horas" v=hrs -%}
        {%- endcapture %}
        {% assign nk = "courses:" | append: cr.title %}{% assign note = site.data.cvn_local.notes[nk] %}{% include cvn_item.html title=ctitle listed=c.listed check=note source=c.source fields=f %}
        {%- endfor %}
    </section>
    {%- endfor %}

    {%- comment -%} ===== Teaching ===== {%- endcomment %}
    <section class="cvn-section" style="--sec: #bc8cff;">
        <h2>Actividad docente · Formación académica impartida <button type="button" class="cvn-copy" data-cvn-copy="new">Copiar nuevos</button></h2>
        {%- for tch in site.data.teaching %}{% assign c = tch.cvn %}{% assign nk = "teaching:" | append: c.code | append: "/" | append: tch.year %}{% assign ects = tch.ects | append: "" | replace: ".", "," %}
        {%- capture f -%}
        {%- include cvn_f.html k="Tipo de docencia" v="Docencia oficial" -%}
        {%- include cvn_f.html k="Nombre de la asignatura/curso" v=c.course -%}
        {%- include cvn_f.html k="Tipo de programa" v=c.programme_type -%}
        {%- include cvn_f.html k="Tipo de docencia" v=c.teaching_type -%}
        {%- include cvn_f.html k="Tipo de asignatura" v=c.subject_type -%}
        {%- include cvn_f.html k="Titulación universitaria" v=c.degree -%}
        {%- include cvn_f.html k="Curso que se imparte" v=c.course_year -%}
        {%- include cvn_f.html k="Fecha de inicio" v=c.start date=true -%}
        {%- include cvn_f.html k="Fecha de finalización" v=c.end date=true -%}
        {%- include cvn_f.html k="Tipo de horas/créditos ECTS" v="Créditos" -%}
        {%- include cvn_f.html k="Nº de horas/créditos ECTS" v=ects -%}
        {%- include cvn_f.html k="Entidad de realización" v="Universidad Miguel Hernández de Elche" -%}
        {%- include cvn_f.html k="Tipo de entidad" v="Universidad" -%}
        {%- include cvn_f.html k="Facultad, instituto, centro" v=c.centre -%}
        {%- include cvn_f.html k="Departamento" v=c.department -%}
        {%- include cvn_f.html k="Idioma de la asignatura" v=c.language -%}
        {%- endcapture %}
        {%- capture t %}{{ c.course | default: tch.course }} · {{ tch.year }} · {{ ects }} ECTS{% endcapture %}
        {%- comment -%} The UMH subject code only means something at UMH, so the title shows it
           as a link to the official subject page (not a CVN field: the editor has no URL for teaching). {%- endcomment -%}
        {%- if c.code %}{% capture t_url %}https://www.umh.es/contenido/Estudios/:asi_g_{{ c.code }}_S1/datos_es.html{% endcapture %}{% capture t_code %}cód. {{ c.code }}{% endcapture %}{% else %}{% assign t_url = nil %}{% assign t_code = nil %}{% endif %}
        {% assign note = site.data.cvn_local.notes[nk] %}{% include cvn_item.html title=t link=t_url link_text=t_code listed=c.listed check=note source=c.source fields=f %}
        {%- endfor %}
    </section>

    {%- comment -%} ===== Projects ===== {%- endcomment %}
    <section class="cvn-section" style="--sec: #f85149;">
        <h2>Proyectos de I+D+i financiados en convocatorias competitivas <button type="button" class="cvn-copy" data-cvn-copy="new">Copiar nuevos</button></h2>
        <p class="cvn-note">Fechas = las del proyecto (manual CVN 1.4.3, campos 050.020.010.270 y .410); tu periodo de participación va en «Explicación narrativa de la aportación». Valores admitidos (Anexo I del manual): Tipo de participación = Investigador principal / Miembro de equipo / Colaborador / Coordinador / Otros; Grado de contribución = Investigador/a, Técnico/a, Titulado/a universitario/a en formación, coordinación… u Otros.</p>
        {%- assign n_proj = 0 %}
        {%- for p in site.data.projects.items %}{% assign c = p.cvn %}{% unless c %}{% continue %}{% endunless %}{% assign n_proj = n_proj | plus: 1 %}
        {%- capture pname %}{{ p.name }}{% if p.title %} - {{ p.title }}{% endif %}{% endcapture %}
        {%- capture f -%}
        {%- include cvn_f.html k="Nombre del proyecto" v=pname -%}
        {%- include cvn_f.html k="Cód. según financiadora" v=p.code -%}
        {%- include cvn_f.html k="Entidad/es financiadora/s" v=c.funder -%}
        {%- include cvn_f.html k="Nombre del programa" v=c.programme -%}
        {%- include cvn_f.html k="Entidad de realización" v=c.entity -%}
        {%- include cvn_f.html k="Ciudad entidad realización" v=c.city -%}
        {%- include cvn_f.html k="Nombres investigadores principales" v=c.pi -%}
        {%- include cvn_f.html k="Nº de investigadores/as" v=c.researchers -%}
        {%- include cvn_f.html k="Tipo de participación" v=c.participation -%}
        {%- include cvn_f.html k="Grado de contribución" v=c.contribution -%}
        {%- include cvn_f.html k="Fecha de inicio-fin" v=c.start v2=c.end date=true range=true -%}
        {%- include cvn_f.html k="Cuantía total" v=c.amount -%}
        {%- comment -%} The narrative also names every contract charged to the project (the cvn.contracts
           of _data/employment.yml whose funding starts with its code): the documentary evidence. {%- endcomment -%}
        {%- capture pk %}{% for j in site.data.employment %}{% for k in j[1].cvn.contracts %}{% assign kf = k.funding | split: " " | first %}{% if p.code and kf == p.code %} Contrato con cargo al proyecto: {{ k.start | split: "-" | reverse | join: "/" }} – {% if k.end %}{{ k.end | split: "-" | reverse | join: "/" }}{% else %}actualidad{% endif %}.{% endif %}{% endfor %}{% endfor %}{% endcapture %}
        {%- if p.from %}{% capture narr %}Participación en el proyecto: {% include date_span.html from=p.from to=p.to ongoing=p.ongoing style="num" present="actualidad" %}.{{ pk }}{% endcapture %}{% include cvn_f.html k="Explicación narrativa de la aportación" v=narr %}{% endif -%}
        {%- endcapture %}
        {% assign nk = "projects:" | append: p.id %}{% assign note = site.data.cvn_local.notes[nk] %}{% include cvn_item.html title=pname listed=c.listed check=note source=c.source fields=f %}
        {%- endfor %}
        {%- if n_proj == 0 %}<p class="cvn-note">Pendiente: datos de proyectos en <code>_data/projects.yml</code>.</p>{% endif %}
    </section>

    {%- comment -%} ===== Publications ===== {%- endcomment %}
    <section class="cvn-section" style="--sec: #3fb950;">
        <h2>Publicaciones, documentos científicos y técnicos <button type="button" class="cvn-copy" data-cvn-copy="new">Copiar nuevos</button></h2>
        <p class="cvn-note">Mejor importarlas desde ORCID o Scopus (ver arriba); aquí, los datos para completar tras importar.</p>
        {%- assign pub_kinds = "journal,book_chapter" | split: "," %}
        {%- for kind in pub_kinds %}{% assign cat = pubs | where: "type_key", kind | first %}
        {%- for e in cat.entries %}{% assign c = e.cvn %}
        {%- assign pos = "" %}{% for a in e.authors %}{% if a contains "Heredia" %}{% assign pos = forloop.index %}{% break %}{% endif %}{% endfor %}
        {%- capture f -%}
        {%- capture au %}{{ e.authors | join: "; " }}{% endcapture %}{% include cvn_f.html k="Autores" v=au -%}
        {%- include cvn_f.html k="Título" v=e.title -%}
        {%- include cvn_f.html k="Nombre de la publicación" v=e.venue -%}
        {%- if e.volume %}{% capture vn %}{{ e.volume }}{% if e.number %} - {{ e.number }}{% endif %}{% endcapture %}{% include cvn_f.html k="Volumen - Número" v=vn %}{% endif -%}
        {%- if e.pages %}{% include cvn_f.html k="Páginas" v=e.pages %}{% endif -%}
        {%- if e.publisher %}{% include cvn_f.html k="Editorial" v=e.publisher %}{% endif -%}
        {%- include cvn_f.html k="Fecha" v=e.year -%}
        {%- include cvn_f.html k="DOI" v=e.doi -%}
        {%- if kind == "journal" -%}
        {%- include cvn_f.html k="Tipo de producción" v="Artículo científico" -%}{%- include cvn_f.html k="Tipo de soporte" v="Revista" -%}
        {%- else -%}
        {%- include cvn_f.html k="Tipo de producción" v="Capítulo de libro" -%}{%- include cvn_f.html k="Tipo de soporte" v="Libro" -%}
        {%- endif -%}
        {%- include cvn_f.html k="Posición de firma" v=pos -%}
        {%- include cvn_f.html k="Nº total de autores" v=e.authors.size -%}
        {%- if c.corresponding %}{% include cvn_f.html k="Autor de correspondencia" v=c.corresponding %}{% endif -%}
        {%- if kind == "journal" -%}
        {%- include cvn_f.html k="Fuente de impacto" v=c.impact_source -%}
        {%- capture iy %}{% if c.impact_factor %}{{ c.impact_factor }}{% if c.impact_year %} (JCR {{ c.impact_year }}){% endif %}{% endif %}{% endcapture %}{% include cvn_f.html k="Índice de impacto" v=iy -%}
        {%- include cvn_f.html k="Categoría" v=c.category -%}
        {%- include cvn_f.html k="Cuartil" v=c.quartile -%}
        {%- include cvn_f.html k="Posición de publicación / Num. revistas en cat." v=c.rank -%}
        {%- include cvn_f.html k="Revista dentro del 25%" v=c.top25 -%}
        {%- endif -%}
        {%- endcapture %}
        {% assign nk = "pubs:" | append: e.key %}{% assign note = site.data.cvn_local.notes[nk] %}{% include cvn_item.html title=e.title listed=c.listed check=note source=c.impact_note fields=f %}
        {%- endfor %}{% endfor %}
    </section>

    {%- comment -%} ===== Congresses (dates and city from the travel events) ===== {%- endcomment %}
    <section class="cvn-section" style="--sec: #3fb950;">
        <h2>Trabajos presentados en congresos nacionales o internacionales <button type="button" class="cvn-copy" data-cvn-copy="new">Copiar nuevos</button></h2>
        {%- assign conf_kinds = "conference_paper,presentation,poster" | split: "," %}
        {%- for kind in conf_kinds %}{% assign cat = pubs | where: "type_key", kind | first %}
        {%- for e in cat.entries %}{% assign c = e.cvn %}
        {%- assign cev = nil %}{% for ev in trav.events %}{% if ev.pubs contains e.key %}{% assign cev = ev %}{% break %}{% endif %}{% endfor %}
        {%- assign cpl = nil %}{% if cev %}{% assign cpl = trav.places | where: "id", cev.place | first %}{% endif %}
        {%- if kind == "presentation" %}{% assign part = "Participativo - Ponencia oral (comunicación oral)" %}{% elsif kind == "poster" %}{% assign part = "Participativo - Póster" %}{% else %}{% assign part = c.participation %}{% endif %}
        {%- capture f -%}
        {%- capture au %}{{ e.authors | join: "; " }}{% endcapture %}{% include cvn_f.html k="Autores" v=au -%}
        {%- include cvn_f.html k="Título del trabajo" v=e.title -%}
        {%- capture cname %}{% if cev %}{{ cev.title }}{% else %}{{ e.venue }}{% endif %}{% endcapture %}{% include cvn_f.html k="Nombre del congreso" v=cname -%}
        {%- include cvn_f.html k="Tipo de participación" v=part -%}
        {%- capture city %}{% if cpl %}{{ cpl.name }}, {% include cvn_country.html c=cpl.country %}{% if cev.online %} (online){% endif %}{% else %}{{ c.city }}{% endif %}{% endcapture %}{% include cvn_f.html k="Ciudad de celebración" v=city -%}
        {%- assign cfrom = cev.from | default: c.from %}{% include cvn_f.html k="Fecha de celebración" v=cfrom date=true -%}
        {%- assign cto = cev.to | default: cev.from | default: c.to | default: c.from %}{% include cvn_f.html k="Fecha de finalización" v=cto date=true -%}
        {%- assign corg = cev.cvn.organizer | default: c.organizer %}{% include cvn_f.html k="Entidad organizadora" v=corg -%}
        {%- assign cscope = cev.cvn.scope | default: c.scope %}{% include cvn_f.html k="Ámbito geográfico" v=cscope -%}
        {%- if kind == "conference_paper" -%}
        {%- include cvn_f.html k="Forma de contribución" v="Artículo científico" -%}
        {%- capture pubtxt %}{{ e.venue }}{% if e.publisher %} · {{ e.publisher }}{% endif %}{% if e.pages %} · pp. {{ e.pages }}{% endif %}{% endcapture %}{% include cvn_f.html k="Publicación" v=pubtxt -%}
        {%- endif -%}
        {%- if e.doi %}{% include cvn_f.html k="DOI" v=e.doi %}{% endif -%}
        {%- if cev.cvn.proceedings %}{% include cvn_f.html k="Actas / libro de resúmenes" v=cev.cvn.proceedings %}{% endif -%}
        {%- endcapture %}
        {%- capture csrc %}{{ cev.cvn.source }}{% if cev.cvn.source and c.source %} · {% endif %}{{ c.source }}{% endcapture %}
        {%- assign nk = "pubs:" | append: e.key %}{%- capture chk %}{% if jekyll.environment != "production" %}{% if cev and cev.attended == false %}Presentado por un coautor (no asistí). {% endif %}{{ site.data.cvn_local.notes[nk] }}{% endif %}{% endcapture %}
        {% include cvn_item.html title=e.title listed=c.listed check=chk source=csrc fields=f %}
        {%- endfor %}{% endfor %}
    </section>

    {%- comment -%} ===== Awards ===== {%- endcomment %}
    <section class="cvn-section" style="--sec: #d29922;">
        <h2>Premios, menciones y distinciones <button type="button" class="cvn-copy" data-cvn-copy="new">Copiar nuevos</button></h2>
        {%- assign cat = pubs | where: "type_key", "award" | first %}
        {%- for e in cat.entries %}{% assign c = e.cvn %}
        {%- capture f -%}
        {%- include cvn_f.html k="Descripción" v=e.title -%}
        {%- include cvn_f.html k="Entidad concesionaria" v=e.venue -%}
        {%- include cvn_f.html k="Fecha de concesión" v=e.year -%}
        {%- assign co_list = e.authors | where_exp: "a", "a != 'Enrique Heredia-Aguado'" | where_exp: "a", "a != 'Enrique Heredia'" %}{% assign co = co_list | join: "; " %}{% include cvn_f.html k="Otros premiados" v=co -%}
        {%- endcapture %}
        {% assign nk = "pubs:" | append: e.key %}{% assign note = site.data.cvn_local.notes[nk] %}{% include cvn_item.html title=e.title listed=c.listed check=note fields=f %}
        {%- endfor %}
    </section>

    {%- comment -%} ===== Stays and their grants ===== {%- endcomment %}
    {%- assign stays = trav.events | where: "kind", "stay" %}
    <section class="cvn-section" style="--sec: #d29922;">
        <h2>Estancias en centros públicos o privados <button type="button" class="cvn-copy" data-cvn-copy="new">Copiar nuevos</button></h2>
        {%- for s in stays %}{% assign c = s.cvn %}{% assign pl = trav.places | where: "id", s.place | first %}
        {%- assign s_from = s.certified.from | default: s.from %}{% assign s_to = s.certified.to | default: s.to %}
        {%- capture f -%}
        {%- include cvn_f.html k="Entidad de realización" v=c.entity -%}
        {%- include cvn_f.html k="Tipo de entidad" v=c.entity_type -%}
        {%- include cvn_f.html k="Facultad, instituto, centro" v=c.centre -%}
        {%- capture city %}{{ pl.name }}, {% include cvn_country.html c=pl.country %}{% endcapture %}{% include cvn_f.html k="Ciudad entidad realización" v=city -%}
        {%- include cvn_f.html k="Fecha de inicio-fin" v=s_from v2=s_to date=true range=true -%}
        {%- include cvn_f.html k="Objetivos de la estancia" v=c.objective -%}
        {%- include cvn_f.html k="Tareas contrastables" v=c.tasks -%}
        {%- include cvn_f.html k="Tipo Estancia" v=c.type -%}
        {%- endcapture %}
        {%- capture t %}{{ s.title }} ({{ s_from | split: "-" | reverse | join: "/" }} – {{ s_to | split: "-" | reverse | join: "/" }}){% endcapture %}
        {% include cvn_item.html title=t listed=c.listed fields=f %}
        {%- endfor %}
    </section>
    <section class="cvn-section" style="--sec: #d29922;">
        <h2>Ayudas y becas obtenidas <button type="button" class="cvn-copy" data-cvn-copy="new">Copiar nuevos</button></h2>
        {%- assign granted_events = trav.events | where_exp: "ev", "ev.grant" %}
        {%- for s in granted_events %}{% assign g = s.grant %}{% assign c = s.cvn %}
        {%- capture f -%}
        {%- include cvn_f.html k="Nombre de la ayuda" v=g.name -%}
        {%- include cvn_f.html k="Finalidad" v=g.purpose -%}
        {%- include cvn_f.html k="Entidad que la concede" v=g.entity -%}
        {%- assign gnk = "grants:" | append: g.name -%}{%- assign gamount = site.data.cvn_local.private[gnk].amount | default: g.amount -%}
        <span data-private>{% include cvn_f.html k="Importe" v=gamount %}</span>
        {%- include cvn_f.html k="Fecha de concesión" v=g.granted date=true -%}
        {%- include cvn_f.html k="Fecha de finalización" v=g.end date=true -%}
        {%- if s.kind == "stay" -%}
        {%- include cvn_f.html k="Entidad de realización" v=c.entity -%}
        {%- include cvn_f.html k="Facultad, instituto, centro" v=c.centre -%}
        {%- endif -%}
        {%- endcapture %}
        {%- capture t %}{{ g.name }} ({{ s.title | strip_html }}){% endcapture %}
        {% assign nk = "grants:" | append: g.name %}{% assign note = site.data.cvn_local.notes[nk] %}{% assign gsrc = site.data.cvn_local.sources[nk] | default: g.source %}{% include cvn_item.html title=t listed=g.listed check=note source=gsrc fields=f %}
        {%- endfor %}
    </section>

    {%- comment -%} ===== Outputs without a direct CVN section ===== {%- endcomment %}
    <section class="cvn-section" style="--sec: #3fb950;">
        <h2>Software, datos, código y preprints</h2>
        <p class="cvn-note">Sin apartado CVN directo: revisar en el editor dónde encajan (los preprints no se suelen incluir hasta su publicación).</p>
        {%- assign other_kinds = "software,research_data,analysis_code,preprint" | split: "," %}
        {%- for kind in other_kinds %}{% assign cat = pubs | where: "type_key", kind | first %}
        {%- for e in cat.entries %}{% assign c = e.cvn %}
        {%- capture f -%}
        {%- capture au %}{{ e.authors | join: "; " }}{% endcapture %}{% include cvn_f.html k="Autores" v=au -%}
        {%- include cvn_f.html k="Título" v=e.title -%}
        {%- include cvn_f.html k="Fecha" v=e.year -%}
        {%- if e.venue %}{% include cvn_f.html k="Publicado en" v=e.venue %}{% endif -%}
        {%- if e.doi %}{% include cvn_f.html k="DOI" v=e.doi %}{% endif -%}
        {%- endcapture %}
        {%- case kind %}{% when "software" %}{% assign kind_es = "Software" %}{% when "research_data" %}{% assign kind_es = "Datos de investigación" %}{% when "analysis_code" %}{% assign kind_es = "Código de análisis" %}{% else %}{% assign kind_es = "Preprint" %}{% endcase %}
        {%- capture t %}{{ kind_es }}: {{ e.title }}{% endcapture %}
        {% assign nk = "pubs:" | append: e.key %}{% assign note = site.data.cvn_local.notes[nk] %}{% include cvn_item.html title=t listed=c.listed check=note fields=f %}
        {%- endfor %}{% endfor %}
    </section>
</section>

<script>
// Copy buttons: an item's fields, or every "Nuevo" item of a section joined
// with "---" (the separator the editor's text import accepts between records).
// PENDIENTE lines (data-skip) are left out of the copied text.
(function () {
    function text(pre) {
        var c = pre.cloneNode(true);
        c.querySelectorAll('[data-skip]').forEach(function (n) { n.remove(); });
        return c.textContent.trim();
    }
    document.addEventListener('click', function (ev) {
        var b = ev.target.closest('[data-cvn-copy]');
        if (!b) return;
        var pres = b.getAttribute('data-cvn-copy') === 'item'
            ? [b.parentNode.querySelector('pre')]
            : Array.prototype.slice.call(b.closest('.cvn-section').querySelectorAll('.cvn-item.is-new pre'));
        if (!pres.length) { b.textContent = 'Nada nuevo'; return; }
        navigator.clipboard.writeText(pres.map(text).join('\n\n---\n\n')).then(function () {
            var old = b.textContent;
            b.textContent = 'Copiado' + (pres.length > 1 ? ' (' + pres.length + ')' : '');
            setTimeout(function () { b.textContent = old; }, 1500);
        });
    });
})();
</script>
