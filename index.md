---
title: CV
layout: default
custom_css: /css/gitgraph.css
custom_js: 
- /js/gitgraph.1.0.0.min.js
- /js/index.js
- /js/gitgraph_nav.js
---

<section>
    <!-- GitGraph canvas -->
    <canvas id="gitGraph"></canvas>
    {% for item in site.data.cv_sections.items %}
    <div id="{{ item.id }}" class="gitgraph-detail">
        {% include_relative {{ site.data.cv_sections.content_path }}/{{item.id  | replace: '-', '_'}}.html %}
    </div>
    {% endfor %}
</section>