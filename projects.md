---
title: Research Projects
description: Research projects by Enrique Heredia Aguado in robotics, computer vision and AI, including funded collaborations and applied research work.
layout: default
permalink: /projects/
custom_js: 
- /js/gitgraph.1.0.0.min.js
- /js/gitgraph-common.js
- /js/projects.js
---

<section class="expanded-panels">
    <div class="page-header">
        <div class="page-brand-muted">{{ site.title }}</div>
        <h1>Research Projects</h1>
        <span class="page-subtitle">Projects I have been involved in during my career</span>
        {% include page_nav.html %}
    </div>
    <h2 class="visually-hidden">Timeline details</h2>
    <div class="gitgraph-container">
        <canvas id="gitGraph" role="img" aria-label="Interactive git-graph timeline of research projects. The same content follows as text panels."></canvas>
    </div>
    <script>
    window.cvLabels = {
      {% for item in site.data.projects.items %}{% unless item.panel == false %}"{{ item.id }}": {{ "[" | append: item.dates | append: "] · " | append: item.name | jsonify }},
      {% endunless %}{% endfor %}
    };
    </script>
    {% for item in site.data.projects.items %}{% unless item.panel == false %}
    <div id="{{ item.id }}" class="gitgraph-detail">
        <h3 class="visually-hidden">[{{ item.dates }}] · {{ item.name }}</h3>
        {% include_relative {{ site.data.projects.content_path }}/{{item.id | downcase | replace: '-', '_'}}.html %}
    </div>
    {% endunless %}{% endfor %}
</section>