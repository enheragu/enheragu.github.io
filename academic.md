---
title: Academic Work
description: Academic background of Enrique Heredia Aguado, including PhD, Master's and Bachelor's studies in robotics, computer vision and AI.
layout: default
permalink: /academic/
custom_css: /css/gitgraph.css
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
    </div>
    <div class="gitgraph-container">
        <canvas id="gitGraph"></canvas>
    </div>
    {% for item in site.data.academic.items %}
    <div id="{{ item.id }}" class="gitgraph-detail">
        {% include_relative {{ site.data.academic.content_path }}/{{item.id | downcase | replace: '-', '_'}}.html %}
    </div>
    {% endfor %}
</section>
