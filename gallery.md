---
title: Gallery
description: Photo gallery of Enrique Heredia Aguado with snapshots from robotics field tests, conferences and laboratory work and other nice photos I like :).
layout: default
permalink: /gallery/
custom_css:
  - /css/gitgraph.css
  - /css/gallery.css
custom_js:
  - /js/gitgraph.1.0.0.min.js
  - /js/gitgraph-common.js
  - /js/gallery.js
  - /js/gallery-graph.js
---

<section class="expanded-panels">
    <div class="page-header">
        <div class="page-brand-muted">{{ site.title }}</div>
        <h1>Photo Gallery</h1>
        <span class="page-subtitle">A small peek into field tests, conferences & lab life</span>
    </div>

    <div class="gitgraph-container">
        <canvas id="gitGraph"></canvas>

        {% for branch in site.data.galleries.branches %}
            {% for campaign in branch.campaigns %}
                <div id="{{ campaign.id }}" class="gitgraph-detail gallery-panel">
                    <div class="gallery-grid gallery-panel-grid">
                    {% for image in campaign.images %}
                        <div class="gallery-item"
                             data-src="{{ site.data.galleries.imagefolder }}/{{ image.name }}"
                             data-text="{{ image.text }}"
                             data-author="{{ image.author }}"
                             data-camera="{{ image.camera }}"
                             data-date="{{ image.date }}">
                            <img src="{{ site.data.galleries.thumnaifolder }}/{{ image.name }}" alt="{{ image.text }}" loading="lazy">
                            <div class="gallery-item-overlay">
                                <span>{{ image.text }}</span>
                            </div>
                        </div>
                    {% endfor %}
                    </div>
                </div>
            {% endfor %}
        {% endfor %}
    </div>

    <!-- Lightbox overlay -->
    <div id="lightbox" class="lightbox" onclick="closeLightbox(event)">
        <button class="lightbox-nav lightbox-prev" onclick="navigateLightbox(-1); event.stopPropagation();">&#10094;</button>
        <span class="lightbox-close">&times;</span>
        <img id="lightbox-img" class="lightbox-content" alt="">
        <div id="lightbox-caption" class="lightbox-caption"></div>
        <button class="lightbox-nav lightbox-next" onclick="navigateLightbox(1); event.stopPropagation();">&#10095;</button>
        <div class="lightbox-counter" id="lightbox-counter"></div>
    </div>
</section>