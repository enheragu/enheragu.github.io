---
title: Research Projects
layout: default
permalink: /projects/
custom_css: /css/gitgraph.css
custom_js: 
- /js/gitgraph.1.0.0.min.js
- /js/gitgraph-common.js
- /js/projects.js
---

<section class="expanded-panels">
    <div class="page-header">
        <h1>Research Projects</h1>
        <span class="page-subtitle">Projects I have been involved in during my career</span>
    </div>
    <div class="gitgraph-container">
        <canvas id="gitGraph"></canvas>
    </div>
    {% for item in site.data.projects.items %}
    <div id="{{ item.id }}" class="gitgraph-detail">
        {% include_relative {{ site.data.projects.content_path }}/{{item.id | downcase | replace: '-', '_'}}.html %}
    </div>
    {% endfor %}
</section>