---
title: Academic Work
description: Academic background of Enrique Heredia Aguado, including PhD, Master's and Bachelor's studies in robotics, computer vision and AI.
layout: default
permalink: /academic/
custom_js:
- /js/gitgraph.1.0.0.min.js
- /js/gitgraph-common.js
- /js/academic.js
---

<section class="expanded-panels">
    <div class="page-header">
        <div class="page-brand-muted">{{ site.title }}</div>
        <h1>Academic Work</h1>
        <span class="page-subtitle">PhD · Master's · Bachelor's</span>
        {% include page_nav.html %}
    </div>
    <h2 class="visually-hidden">Timeline details</h2>
    <div class="gitgraph-container">
        <canvas id="gitGraph" role="img" aria-label="Interactive git-graph timeline of my academic journey. The same content follows as text panels."></canvas>
    </div>
    <script>
    window.cvLabels = {
      {% for item in site.data.academic.items %}{% if item.edu %}{% assign e = site.data.education[item.edu] %}"{{ item.id }}": {{ "[" | append: e.dates | append: "] · " | append: e.degree | append: " · " | append: e.institution | jsonify }},
      {% elsif item.label %}"{{ item.id }}": {{ item.label | jsonify }},
      {% endif %}{% endfor %}
    };
    </script>
    {% for item in site.data.academic.items %}
    <div id="{{ item.id }}" class="gitgraph-detail">
        {% if item.edu %}{% assign e = site.data.education[item.edu] %}<h3 class="visually-hidden">[{{ e.dates }}] · {{ e.degree }} · {{ e.institution }}</h3>{% elsif item.label %}<h3 class="visually-hidden">{{ item.label }}</h3>{% endif %}
        {% include_relative {{ site.data.academic.content_path }}/{{item.id | downcase | replace: '-', '_'}}.html %}
    </div>
    {% endfor %}
</section>
