---
title: Around the World
description: Where research has taken Enrique Heredia Aguado, and where it reached — conferences, research stays and robotics field campaigns on an interactive globe.
layout: default
permalink: /travel/
custom_css:
    - /css/travel.css
custom_js:
    - /js/travel/travel-model.js
    - /js/travel/travel-globe.js
    - /js/travel/travel-page.js
---
{% comment %}
  Content (place cards, travel log) is rendered here from _data/travels.yml;
  js/travel/* only adds the globe, modes, filters, journey and selection.
    travel-model.js  pure data: modes, homes by date, arcs, pins, stats
    travel-globe.js  d3 globe (canvas) + pins/arcs (svg), no page knowledge;
                     loads d3, topojson and the world itself, in parallel
    travel-page.js   wiring: modes, filters, journey, selection, cards, log
  data-mode / data-filter on events (travel_event_filters.html) drive what shows.
  The stage (globe) is the immersive part; the travel log below uses the CV's
  own panel + publication-list widgets (pub-list, pub-type-badge) on a git-style
  trunk (the CV's gitgraph look, no branches): one commit per trip, disc = I was
  there, diamond = without me, colour = category. Each row is one button.
{% endcomment %}
{% assign tv = site.data.travels %}
{% capture house_icon %}<svg class="travel-house" viewBox="-5 -5 10 10" aria-hidden="true"><path d="M-3.6,0.4 L0,-3 L3.6,0.4 M-2.6,-0.5 V3 H2.6 V-0.5"/></svg>{% endcapture %}
<div class="travel-page">
    <section class="travel-top">
        <div class="page-header travel-header">
            <div class="page-brand-muted">{{ site.title }}</div>
            {% include page_nav.html %}
        </div>
    </section>

    <div class="travel-stage" data-travel-stage>
        <div class="travel-globe" data-travel-globe role="application" aria-label="Interactive globe with the places of the travel log below.">
            <p class="travel-globe-msg" data-travel-globe-msg>The interactive globe needs JavaScript. The travel log below lists every trip.</p>
        </div>

        <header class="travel-hero" data-travel-hero>
            <h1><span>Around</span> <span>the World</span></h1>
            <div class="travel-modes" role="group" aria-label="What the globe shows (both can be on)">
                {% for m in tv.modes %}
                <button type="button" class="travel-mode" data-mode="{{ m.id }}" aria-pressed="true"><span class="travel-mode-mark" aria-hidden="true"></span><span class="travel-mode-label">{{ m.label }}</span><span class="travel-mode-stats" data-mode-stats="{{ m.id }}"></span></button>
                {% endfor %}
            </div>
        </header>

        <div class="travel-float travel-controls" data-travel-controls>
            <div class="travel-chips" role="group" aria-label="Show on the globe">
                {% for f in tv.filters %}
                <button type="button" class="travel-chip" data-filter="{{ f.id }}" aria-pressed="true" style="--travel-color: {{ f.color }}">
                    <span class="travel-dot" aria-hidden="true"></span>{{ f.label }}
                </button>
                {% endfor %}
                <span class="travel-legend-home">{{ house_icon }}Home</span>
            </div>
            <div class="travel-journey" data-travel-journey>
                <button type="button" class="travel-row-head" data-travel-journey-toggle aria-expanded="true">
                    <span>Journey</span>
                    <span class="travel-year" data-travel-year></span>
                </button>
                <div class="travel-journey-row">
                    <button type="button" class="travel-play" data-travel-play aria-label="Play the journey" title="Play the journey">
                        <svg viewBox="0 0 16 16" aria-hidden="true"><path class="travel-play-icon" d="M5 3.5v9l7-4.5z"/><path class="travel-pause-icon" d="M4.5 3.5h2.5v9H4.5zM9 3.5h2.5v9H9z"/></svg>
                    </button>
                    <input type="range" class="travel-range" data-travel-time step="1" aria-label="Show trips up to this month">
                </div>
            </div>
            <div class="travel-controls-foot">
                <div class="travel-zoom">
                    <button type="button" class="travel-icon-btn" data-travel-zoom="out" aria-label="Zoom out" title="Zoom out">−</button>
                    <button type="button" class="travel-icon-btn" data-travel-zoom="in" aria-label="Zoom in" title="Zoom in">+</button>
                    <button type="button" class="travel-icon-btn" data-travel-zoom="reset" aria-label="Show all" title="Show all">
                        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.2 8a4.8 4.8 0 1 0 1.5-3.5M3.2 2.6v2.6h2.6"/></svg>
                    </button>
                </div>
                <span class="travel-drag-hint" data-travel-drag-hint>Drag to spin</span>
                <a class="travel-log-link" href="#travel-log">Travel log ↓</a>
            </div>
        </div>

        <aside class="travel-float travel-card" data-travel-panel hidden>
            {% for place in tv.places %}
            {% assign place_events = tv.events | where: "place", place.id %}
            <article class="travel-place" id="place-{{ place.id }}" data-place="{{ place.id }}" aria-labelledby="place-{{ place.id }}-name" hidden>
                <header class="travel-place-head">
                    <div>
                        <h2 id="place-{{ place.id }}-name" tabindex="-1">{{ place.name }}</h2>
                        <p class="travel-place-sub">{{ place.country }}<span data-place-summary></span></p>
                    </div>
                    <button type="button" class="travel-icon-btn" data-travel-close aria-label="Close" title="Close">×</button>
                </header>
                {% if place.home %}
                <p class="travel-home-note">{{ house_icon }}Home · {% include travel_date.html from=place.home.from to=place.home.to %}{% unless place.home.to %} – present{% endunless %} · {{ place.home.label }}</p>
                {% endif %}
                {% for ev in place_events %}{% include travel_event.html event=ev %}{% endfor %}
            </article>
            {% endfor %}
        </aside>

        <p class="travel-hint" data-travel-hint aria-live="polite"></p>
    </div>

    <section class="travel-log-wrap">
        <div class="travel-log-panel">
            <h2 class="travel-log-title" id="travel-log">Travel log</h2>
            <p class="travel-log-lead">Pick a trip to find it on the globe.</p>
            <p class="travel-log-legend">Sometimes I took the research there myself <span class="travel-log-key">(<span class="travel-log-key-mark" aria-hidden="true"></span>)</span>; other times colleagues carried it further <span class="travel-log-key is-away">(<span class="travel-log-key-mark" aria-hidden="true"></span>)</span>.</p>
            {% assign tv_years = tv.events | group_by_exp: "ev", "ev.from | slice: 0, 4" %}
            {% for year in tv_years %}
            <div class="travel-log-year">
                <h3>{{ year.name }}</h3>
                <ul class="pub-list travel-log">
                    {% for ev in year.items %}
                    {% assign ev_place = tv.places | where: "id", ev.place | first %}
                    {% include travel_event_filters.html event=ev %}
                    <li {{ tef_attrs }} data-place="{{ ev.place }}">
                        <button type="button" class="travel-log-item" data-place="{{ ev.place }}">
                            <span class="travel-log-commit" aria-hidden="true"></span>
                            <span class="travel-log-date">{% include travel_date.html from=ev.from to=ev.to noyear=true %}</span>
                            <span class="travel-log-body">
                                <span class="travel-log-text">{{ ev.title }}</span>
                                <span class="travel-log-meta"><span class="pub-type-badge">{{ tv.kinds[ev.kind] }}</span><em>{{ ev_place.name }}, {{ ev_place.country }}</em>{% if ev.online %}<span class="travel-log-note">online</span>{% endif %}{% if ev.attended == false %}<span class="visually-hidden">presented without me</span>{% endif %}</span>
                            </span>
                            <span class="travel-log-go" aria-hidden="true">→</span>
                        </button>
                    </li>
                    {% endfor %}
                </ul>
            </div>
            {% endfor %}
        </div>
    </section>
</div>

<script type="application/json" id="travel-data">{{ tv | jsonify }}</script>
