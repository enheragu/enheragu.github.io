// ----------------------- TRAVEL MAP · PAGE ----------------------- //
// Wires /travel/ together: mode switches (been / away), category chips, journey
// (continuous month timeline + play), selected place, floating place card,
// travel log, hero stats and the globe. Content (cards, log) is rendered by
// travel.md; this only shows/hides it. Stats, log and cards work at once; the
// globe is built when TravelGlobe.load() brings d3 + the world (or never).

(function () {
  'use strict';

  var dataEl = document.getElementById('travel-data');
  if (!dataEl || !window.TravelModel) return;

  var TM = window.TravelModel;
  var model = TM.create(JSON.parse(dataEl.textContent));
  var num = new Intl.NumberFormat('en-GB');
  var MONTHS = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'];
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var wide = window.matchMedia('(min-width: 900px)');
  var landscape = window.matchMedia('(max-width: 899px) and (orientation: landscape) and (max-height: 520px)');
  var coarse = window.matchMedia('(pointer: coarse)');
  var MONTH_MS = 85;         // playback speed: time per month of the timeline
  var LOOK_GAP_MS = 900;     // min time between globe turns while playing

  function $(sel) { return document.querySelector(sel); }
  function $$(sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); }

  var els = {
    page: $('.travel-page'),
    stage: $('[data-travel-stage]'),
    hero: $('[data-travel-hero]'),
    globe: $('[data-travel-globe]'),
    msg: $('[data-travel-globe-msg]'),
    hint: $('[data-travel-hint]'),
    controls: $('[data-travel-controls]'),
    card: $('[data-travel-panel]'),
    time: $('[data-travel-time]'),
    timeLabel: $('[data-travel-year]'),
    play: $('[data-travel-play]'),
    journeyToggle: $('[data-travel-journey-toggle]'),
    dragHint: $('[data-travel-drag-hint]'),
    modes: $$('.travel-mode'),
    chips: $$('.travel-chip[data-filter]'),
    places: $$('.travel-place'),
    logButtons: $$('.travel-log-item')
  };

  var state = {
    modes: new Set(els.modes.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; })
      .map(function (b) { return b.dataset.mode; })),
    active: new Set(model.filters.map(function (f) { return f.id; })),
    month: model.monthRange[1],
    selected: null
  };
  var globe = null;
  var current = null;        // last view
  var hintTimer = null;
  var playing = null;        // {raf, t0, m0, lastLook}
  var opener = null;         // element that opened the card (focus returns there)

  function count(n, unit) { return num.format(n) + ' ' + (n === 1 ? unit[0] : unit[1]); }
  function monthLabel(m) { return MONTHS[m % 12] + ' ' + Math.floor(m / 12); }

  // ── State → stats, chips, log, cards, globe ─────────────────────────────
  function shown(el) {
    return state.modes.has(el.dataset.mode) && state.active.has(el.dataset.filter);
  }

  function update() {
    var v = model.view({ modes: state.modes, active: state.active, until: TM.monthEnd(state.month) });
    var previous = current;
    current = v;

    renderModeStats();

    var first = Math.floor(model.monthRange[0] / 12);
    els.timeLabel.textContent = state.month >= model.monthRange[1]
      ? first + '–' + Math.floor(model.monthRange[1] / 12)
      : 'up to ' + monthLabel(state.month);
    els.time.value = state.month;

    $$('.travel-log li[data-mode], .travel-event[data-mode]').forEach(function (el) { el.hidden = !shown(el); });
    var years = $$('.travel-log-year');
    years.forEach(function (block) {
      block.hidden = !$$('li', block).some(function (li) { return !li.hidden; });
    });
    // the git trunk ends at the last visible year
    var visibleYears = years.filter(function (block) { return !block.hidden; });
    var lastYear = visibleYears[visibleYears.length - 1];
    years.forEach(function (block) { block.classList.toggle('is-last', block === lastYear); });
    updateSummary();

    if (globe) {
      globe.setView(v);
      if (playing) lookAtNewest(previous, v);
    }
  }

  // Each mode switch carries its own figures, whether it is on or not:
  //   Research has taken me / to 9 places · 4 countries · 44,800 km
  //   Research went without me / to 11 places · 6 countries
  function renderModeStats() {
    var until = TM.monthEnd(state.month);
    $$('[data-mode-stats]').forEach(function (el) {
      var mode = el.dataset.modeStats;
      var s = model.view({ modes: new Set([mode]), active: state.active, until: until }).stats;
      var text = 'to ' + count(s.places, ['place', 'places']) + ' · ' + count(s.countries, ['country', 'countries']);
      if (mode === 'been') text += ' · ' + num.format(Math.round(s.km / 100) * 100) + ' km';
      el.textContent = text;
    });
  }

  // "· 6 trips · 2018–2026" under the open card's title, for the current mode
  function updateSummary() {
    if (!state.selected || !current) return;
    var el = $('#place-' + state.selected + ' [data-place-summary]');
    var pin = current.pins.filter(function (p) { return p.id === state.selected; })[0];
    if (!el) return;
    if (!pin || !pin.count) { el.textContent = ''; return; }
    var years = pin.events.map(function (e) { return Math.floor(e.start / 10000); });
    var lo = Math.min.apply(null, years);
    var hi = Math.max.apply(null, years);
    var parts = [];
    if (pin.been) parts.push(count(pin.been, ['trip', 'trips']));
    if (pin.away) parts.push(num.format(pin.away) + ' without me');
    parts.push(lo === hi ? lo : lo + '–' + hi);
    el.textContent = ' · ' + parts.join(' · ');
  }

  // Mode switches combine; the last one on cannot be switched off
  function toggleMode(btn) {
    var mode = btn.dataset.mode;
    var on = !state.modes.has(mode);
    if (!on && state.modes.size === 1) return;
    var next = new Set(state.modes);
    if (on) next.add(mode); else next['delete'](mode);
    state.modes = next;
    stopPlay();
    btn.setAttribute('aria-pressed', String(on));
    update();
    if (state.selected) select(state.selected);   // refresh card for the new mode
    if (globe) globe.fit(900);
  }

  function toggleFilter(btn) {
    var id = btn.dataset.filter;
    if (state.active.has(id)) state.active.delete(id); else state.active.add(id);
    btn.setAttribute('aria-pressed', String(state.active.has(id)));
    update();
  }

  // ── Journey: continuous month timeline ──────────────────────────────────
  function setMonth(m) {
    m = Math.max(model.monthRange[0], Math.min(model.monthRange[1], m));
    if (m === state.month) return;
    state.month = m;
    update();
  }

  // While playing, turn the globe towards the newest place that appeared
  function lookAtNewest(previous, v) {
    var seen = {};
    (previous ? previous.events : []).forEach(function (e) { seen[e.index] = true; });
    var fresh = v.events.filter(function (e) { return !seen[e.index] && !e.online; });
    var now = performance.now();
    if (!fresh.length || now - playing.lastLook < LOOK_GAP_MS) return;
    playing.lastLook = now;
    var newest = fresh.reduce(function (a, b) { return b.start > a.start ? b : a; });
    globe.lookAt(newest.place.id, 1100);
  }

  function stopPlay() {
    if (!playing) return;
    cancelAnimationFrame(playing.raf);
    playing = null;
    els.play.classList.remove('is-playing');
    els.play.setAttribute('aria-label', 'Play the journey');
  }

  function play() {
    if (playing) { stopPlay(); return; }
    select(null);
    if (globe) { globe.stopSpin(); globe.fit(700); }   // frame everything first
    els.play.classList.add('is-playing');
    els.play.setAttribute('aria-label', 'Pause');
    var start = model.monthRange[0] - 1;
    state.month = start;
    update();
    playing = { t0: performance.now(), m0: start, lastLook: 0, raf: 0 };
    var step = reduceMotion ? MONTH_MS / 4 : MONTH_MS;
    (function frame(now) {
      if (!playing) return;
      var m = playing.m0 + Math.floor((now - playing.t0) / step);
      setMonth(m);
      if (m >= model.monthRange[1]) { stopPlay(); return; }
      playing.raf = requestAnimationFrame(frame);
    })(performance.now());
  }

  // ── Selection + floating card ───────────────────────────────────────────
  // opts: focus (turn the globe to it), reveal (scroll the stage into view),
  // user (opened by the visitor: move keyboard focus into the card)
  function select(id, opts) {
    opts = opts || {};
    var closing = !!state.selected && !id;
    if (!state.selected && id && opts.user) opener = document.activeElement;
    state.selected = id && model.placeById[id] ? id : null;
    els.places.forEach(function (a) { a.hidden = a.dataset.place !== state.selected; });
    els.card.hidden = !state.selected;
    els.card.scrollTop = 0;
    els.stage.classList.toggle('has-card', !!state.selected);
    $$('.travel-log li[data-place]').forEach(function (li) {
      li.classList.toggle('is-current', li.dataset.place === state.selected);
    });
    updateSummary();
    if (state.selected && opts.user) {
      var heading = $('#place-' + state.selected + ' h2');
      if (heading) heading.focus({ preventScroll: true });
    }
    if (closing && opener && document.contains(opener)) opener.focus({ preventScroll: true });
    if (closing) opener = null;
    updatePadding();
    if (globe) {
      globe.select(state.selected);
      if (state.selected && opts.focus) globe.focus(state.selected);
      if (closing) globe.fit(800);   // closing the card frames everything again
    }
    var url = state.selected ? '#place-' + state.selected : location.pathname + location.search;
    if (history.replaceState) history.replaceState(null, '', url);
    if (opts.reveal) els.stage.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }

  // Keep the globe in the part of the stage the floating parts leave free:
  // desktop centred (the compact hero sits in the corner), shifted left only
  // for an open card; phone landscape between the left column and the card;
  // phone portrait between the hero (top) and the controls / card (bottom)
  function updatePadding() {
    if (!globe) return;
    if (wide.matches) {
      globe.setPadding({ right: els.card.hidden ? 0 : els.card.offsetWidth + 32 });
    } else if (landscape.matches) {
      globe.setPadding({
        left: Math.max(els.hero.offsetWidth, els.controls.offsetWidth) + 16,
        right: els.card.hidden ? 0 : els.card.offsetWidth + 24
      });
    } else {
      var below = els.card.hidden ? els.controls : els.card;
      globe.setPadding({ top: els.hero.offsetHeight + 8, bottom: below.offsetHeight + 16 });
    }
  }

  function showHint(text) {
    els.hint.textContent = text;
    els.hint.classList.add('is-on');
    clearTimeout(hintTimer);
    hintTimer = setTimeout(function () { els.hint.classList.remove('is-on'); }, 1600);
  }

  // ── Events ──────────────────────────────────────────────────────────────
  els.modes.forEach(function (btn) {
    btn.addEventListener('click', function () { toggleMode(btn); });
  });
  els.chips.forEach(function (btn) {
    btn.addEventListener('click', function () { toggleFilter(btn); });
  });
  els.time.min = model.monthRange[0];
  els.time.max = model.monthRange[1];
  els.time.addEventListener('input', function () { stopPlay(); setMonth(Number(els.time.value)); });
  els.play.addEventListener('click', play);
  els.logButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      stopPlay();
      setMonth(model.monthRange[1]);
      select(btn.dataset.place, { focus: true, reveal: true, user: true });
    });
  });
  // Journey folds behind its heading on phones (open by default elsewhere)
  els.journeyToggle.setAttribute('aria-expanded', String(wide.matches));
  els.journeyToggle.addEventListener('click', function () {
    if (wide.matches) return;
    var open = els.journeyToggle.getAttribute('aria-expanded') !== 'true';
    els.journeyToggle.setAttribute('aria-expanded', String(open));
    updatePadding();
  });
  if (coarse.matches) els.dragHint.textContent = 'Two fingers to spin';
  $$('[data-travel-close]').forEach(function (btn) {
    btn.addEventListener('click', function () { select(null); });
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && state.selected) select(null);
  });

  // ── Globe (optional: the page works without it) ─────────────────────────
  function globeFailed() {
    els.stage.classList.add('is-error');
    els.msg.hidden = false;
    els.msg.textContent = 'The globe could not be loaded. The travel log below lists every trip.';
  }

  function startGlobe() {
    globe = window.TravelGlobe.create(els.globe, {
      onSelect: function (id) {
        stopPlay();
        select(id === state.selected ? null : id, { focus: id !== state.selected, user: true });
      },
      onBackground: function () { if (state.selected) select(null); },
      onHint: function (kind) {
        if (kind === 'wheel') showHint('Use Ctrl + scroll to zoom the globe');
        if (kind === 'touch') showHint('Use two fingers to move the globe');
      },
      onReady: function () { els.msg.hidden = true; },
      onError: globeFailed,
      canSpin: function () { return !playing && !state.selected; }
    });
    $$('[data-travel-zoom]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var how = btn.dataset.travelZoom;
        if (how === 'reset') globe.fit(800);
        else globe.zoomBy(how === 'in' ? 2 : 0.5);
      });
    });
    if (window.ResizeObserver) new ResizeObserver(updatePadding).observe(els.stage);
    update();
    updatePadding();
    if (state.selected) {
      globe.select(state.selected);
      globe.focus(state.selected);
    } else {
      globe.fit(0);
      globe.startSpin();
    }
  }

  // Everything but the globe is ready now
  els.msg.textContent = 'Loading globe…';
  update();
  var fromHash = /^#place-(.+)$/.exec(location.hash);
  if (fromHash) select(decodeURIComponent(fromHash[1]));

  if (window.TravelGlobe) window.TravelGlobe.load().then(startGlobe, globeFailed);
  else globeFailed();
})();
