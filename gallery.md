---
title: Gallery
description: Photo gallery of Enrique Heredia Aguado with snapshots from robotics field tests, conferences and laboratory work and other nice photos I like :).
layout: default
permalink: /gallery/
custom_css:
    - /css/gitgraph.css
    - /assets/shared/gallery-primitives.css
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
                                data-date="{{ image.date }}"
                                data-wide="{{ image.wide | default: '' }}"
                                data-tall="{{ image.tall | default: '' }}"
                                data-layout="{{ image.layout | default: '' }}">
                            <img src="{{ site.data.galleries.thumnaifolder }}/{{ image.name }}" alt="{{ image.text }}" loading="lazy"{% if image.thumb_position %} style="object-position: {{ image.thumb_position }};"{% endif %}>
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
        <div class="shared-corner-controls" onclick="event.stopPropagation();">
            <button class="lightbox-close shared-icon-btn shared-close-btn" onclick="closeLightbox(event); event.stopPropagation();" aria-label="Close" title="Close">
                <span aria-hidden="true" class="icon-close">
                    <svg viewBox="0 0 24 24" role="presentation" focusable="false">
                        <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </span>
            </button>
        </div>
        <div class="lightbox-stage shared-lightbox-stage" onclick="event.stopPropagation();">
            <button class="lightbox-nav lightbox-prev shared-icon-btn shared-nav-btn" onclick="navigateLightbox(-1); event.stopPropagation();" aria-label="Previous image" title="Previous image">
                <span aria-hidden="true" class="icon-arrow icon-arrow-left">
                    <svg viewBox="0 0 24 24" role="presentation" focusable="false">
                        <path d="M14.5 6 8.5 12l6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </span>
            </button>
            <img id="lightbox-img" class="lightbox-content shared-lightbox-media shared-lightbox-frame" alt="">
            <button class="lightbox-nav lightbox-next shared-icon-btn shared-nav-btn" onclick="navigateLightbox(1); event.stopPropagation();" aria-label="Next image" title="Next image">
                <span aria-hidden="true" class="icon-arrow icon-arrow-right">
                    <svg viewBox="0 0 24 24" role="presentation" focusable="false">
                        <path d="M9.5 6 15.5 12l-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </span>
            </button>
        </div>
        <div id="lightbox-caption" class="lightbox-caption"></div>
        <div class="lightbox-counter" id="lightbox-counter"></div>
    </div>
</section>