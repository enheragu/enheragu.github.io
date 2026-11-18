// ----------------------- TRAVEL MAP · GLOBE ----------------------- //
// Interactive globe: d3 orthographic projection painted on a <canvas> (stars,
// sea, land seen through the glass, borders) plus an <svg> overlay for arcs and
// pins (real DOM: clickable, focusable, styled by CSS). It knows nothing about
// the page: it is given a view {pins, legs} built by TravelModel and reports pin
// activation through opts.onSelect(placeId). Colours come from the --globe-*
// tokens in css/travel.css, so it follows the theme (light/dark, palette).
// TravelGlobe.load() fetches what it needs (d3, topojson, the world) in
// parallel, so the page can render everything else before it arrives.
// Painting per frame is only what turns (land, borders, grid); stars and the
// sphere shading are cached layers redrawn only when size or zoom change.

(function (root) {
  'use strict';

  var LIBS = [
    'https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js',
    'https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js'
  ];
  var WORLD_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-{res}.json';
  var K_MAX = 40;          // max zoom: pins ~30 km apart still separate
  var FIT_K_MAX = 6;       // "show all" never zooms in further than this
  var DETAIL_K = 2.5;      // above this zoom the 50m world is used (lazy-loaded)
  var TILT = 30;           // latitude at the centre before anything is framed
  var PIN_GAP = 4;         // px between pins before they merge into a cluster
  var DONUT = 3.5;         // donut ring thickness (px)
  var IDLE_MS = 150;       // after this pause the detailed world is painted
  var SPIN_DEG_S = 3;      // idle spin speed
  var SPIN_EASE_MS = 1500; // the spin speeds up gently over this time
  var SPIN_RESUME_MS = 6000;   // idle time before the spin resumes
  var SPIN_FRAME_MS = 33;  // the slow spin repaints at most ~30 times a second
  var GROW_MS = 900;       // new arcs draw themselves in this time
  var PRECISION = 0.4;     // adaptive resampling (px) at rest...
  var PRECISION_MOVING = 1.5;   // ...and while turning: fewer points per frame
  var TOKENS = ['sea', 'sea-deep', 'land', 'back', 'border', 'coast', 'grid', 'halo', 'light', 'shade', 'star'];
  var DEG = 180 / Math.PI;

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function wrap180(a) { return ((a + 180) % 360 + 360) % 360 - 180; }
  function lonLat(place) { return [place.lon, place.lat]; }

  // Pin radius grows with the number of trips (sqrt: area ~ count)
  function pinRadius(count) { return count ? 8 + 3 * Math.sqrt(count) : 7; }

  // ── Loading (no d3 needed): scripts and world data, all in parallel ─────
  var worldFetches = {};
  function fetchWorld(res) {
    if (!worldFetches[res]) {
      worldFetches[res] = fetch(WORLD_URL.replace('{res}', res)).then(function (r) {
        if (!r.ok) throw new Error('world ' + res + ': ' + r.status);
        return r.json();
      });
    }
    return worldFetches[res];
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var el = document.createElement('script');
      el.src = src;
      el.onload = resolve;
      el.onerror = reject;
      document.head.appendChild(el);
    });
  }

  function load() {
    fetchWorld('110m');   // starts now, alongside the scripts
    if (root.d3 && root.topojson) return Promise.resolve();
    return Promise.all(LIBS.map(loadScript));
  }

  // Small seeded PRNG: the same starfield / sea grain on every load
  function prng(seed) {
    return function () {
      seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function create(container, opts) {
    var d3 = root.d3;
    var topojson = root.topojson;
    var reduceMotion = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ── Surfaces ───────────────────────────────────────────────────────────
    var canvas = document.createElement('canvas');
    canvas.className = 'travel-globe-canvas';
    container.insertBefore(canvas, container.firstChild);
    var ctx = canvas.getContext('2d');
    var svg = d3.select(container).append('svg').attr('class', 'travel-globe-svg');
    var gLegs = svg.append('g').attr('class', 'travel-legs');
    var gPins = svg.append('g').attr('class', 'travel-pins');

    var front = d3.geoOrthographic().clipAngle(90).precision(PRECISION);
    var back = d3.geoOrthographic().clipAngle(90).precision(PRECISION_MOVING).reflectX(true);   // far side, seen through
    var svgPath = d3.geoPath(front);
    var frontPath = d3.geoPath(front, ctx);
    var backPath = d3.geoPath(back, ctx);
    var graticule = d3.geoGraticule10();

    // ── State ──────────────────────────────────────────────────────────────
    var W = 0, H = 0, R = 1;          // surface size; globe radius at zoom 1
    var k = 1;                        // zoom factor
    var rotation = [0, -TILT, 0];
    var pad = { top: 0, right: 0, bottom: 0, left: 0 };   // covered by floating cards
    var view = { pins: [], legs: [] };
    var selected = null;
    var colors = null;                // resolved --globe-* tokens
    var starLayer = null;             // stars, painted once per size
    var sphereLayers = null;          // {key, under, over}: halo + sea / light + shade
    var grain = null;                 // sea grain tile (canvas)
    var worlds = {};                  // '110m' | '50m' -> {land, borders}
    var loading = {};
    var moving = false;
    var idleTimer = null;
    var spin = null;
    var resumeTimer = null;
    var visible = true;               // stage on screen (IntersectionObserver)
    var spinWhenVisible = false;
    var growth = {};                  // leg id -> drawn fraction 0..1
    var growStart = {};               // leg id -> time it started drawing
    var growTimer = null;
    var zoomState = d3.zoomIdentity;

    function centre() { return [(pad.left + W - pad.right) / 2, (pad.top + H - pad.bottom) / 2]; }
    function centreLonLat() { return [-rotation[0], -rotation[1]]; }

    // ── Interaction: drag rotates, pinch / Ctrl+wheel zooms ────────────────
    var zoom = d3.zoom()
      .scaleExtent([1, K_MAX])
      .filter(function (ev) {
        if (ev.type.indexOf('touch') === 0) return false;   // see touch handler below
        if (ev.type === 'wheel') {
          if (ev.ctrlKey || ev.metaKey) return true;
          if (opts.onHint) opts.onHint('wheel');   // plain wheel scrolls the page
          return false;
        }
        return !ev.button;
      })
      .on('start', function (ev) {
        if (!ev.sourceEvent) return;
        stopSpin();
        svg.interrupt('turn');
      })
      .on('end', function (ev) { if (ev.sourceEvent) resumeSpinSoon(); })
      .on('zoom', function (ev) {
        var t = ev.transform;
        if (t.k !== zoomState.k) {
          k = t.k;
        } else if (ev.sourceEvent) {
          var f = DEG / (R * k);
          rotation = [rotation[0] + (t.x - zoomState.x) * f, clamp(rotation[1] - (t.y - zoomState.y) * f, -85, 85), 0];
        }
        zoomState = t;
        changed();
      });
    svg.call(zoom).on('dblclick.zoom', null);

    // Touch, like Google Maps: one finger scrolls the page (touch-action in
    // CSS), two fingers turn and pinch-zoom the globe
    var pinch = null;
    function twoFingers(ev) {
      var a = ev.touches[0], b = ev.touches[1];
      return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2,
               d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) || 1 };
    }
    var surface = svg.node();
    surface.addEventListener('touchstart', function (ev) {
      if (ev.touches.length !== 2) return;
      ev.preventDefault();
      stopSpin();
      svg.interrupt('turn');
      var t = twoFingers(ev);
      pinch = { x: t.x, y: t.y, d: t.d, k: k };
    }, { passive: false });
    surface.addEventListener('touchmove', function (ev) {
      if (!pinch || ev.touches.length !== 2) {
        if (ev.touches.length === 1 && opts.onHint) opts.onHint('touch');
        return;
      }
      ev.preventDefault();
      var t = twoFingers(ev);
      var f = DEG / (R * k);
      rotation = [rotation[0] + (t.x - pinch.x) * f, clamp(rotation[1] - (t.y - pinch.y) * f, -85, 85), 0];
      k = clamp(pinch.k * t.d / pinch.d, 1, K_MAX);
      pinch.x = t.x;
      pinch.y = t.y;
      syncZoom();
      changed();
    }, { passive: false });
    surface.addEventListener('touchend', function (ev) {
      if (pinch && ev.touches.length < 2) { pinch = null; resumeSpinSoon(); }
    });

    // A click on the globe itself (not a pin, not after a drag) = background
    svg.on('click.background', function (ev) {
      if (!ev.target.closest('.travel-pin') && opts.onBackground) opts.onBackground();
    });

    // Keep d3.zoom's internal transform in sync after programmatic moves
    function syncZoom() {
      zoomState = d3.zoomIdentity.translate(zoomState.x, zoomState.y).scale(k);
      svg.property('__zoom', zoomState);
    }

    // Animate to centre `ll` at zoom `kTarget`
    function turnTo(ll, kTarget, ms) {
      stopSpin();
      var r0 = rotation.slice();
      var r1 = [r0[0] + wrap180(-ll[0] - r0[0]), clamp(-ll[1], -85, 85), 0];
      var k0 = k;
      var k1 = clamp(kTarget, 1, K_MAX);
      svg.interrupt('turn');
      if (reduceMotion || !ms) {
        rotation = r1; k = k1; syncZoom(); changed();
        return;
      }
      var ir = d3.interpolate(r0, r1);
      svg.transition('turn').duration(ms).ease(d3.easeCubicInOut)
        .on('end', resumeSpinSoon)
        .tween('turn', function () {
          return function (t) {
            rotation = ir(t);
            k = k0 * Math.pow(k1 / k0, t);   // geometric: zoom feels uniform
            syncZoom();
            changed();
          };
        });
    }

    // Slow idle spin; it eases in, and resumes on its own after a pause
    function startSpin() {
      clearTimeout(resumeTimer);
      if (reduceMotion || spin) return;
      if (!visible) { spinWhenVisible = true; return; }
      var lon0 = rotation[0];
      var v = SPIN_DEG_S / 1000;
      var last = -Infinity;
      spin = d3.timer(function (t) {
        if (t - last < SPIN_FRAME_MS) return;
        last = t;
        var turned = t < SPIN_EASE_MS ? v * t * t / (2 * SPIN_EASE_MS) : v * (t - SPIN_EASE_MS / 2);
        rotation = [lon0 + turned, rotation[1], 0];
        moving = true;
        render();
      });
    }

    function stopSpin() {
      clearTimeout(resumeTimer);
      if (!spin) return;
      spin.stop();
      spin = null;
      changed();
    }

    function resumeSpinSoon() {
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(function () {
        if (!opts.canSpin || opts.canSpin()) startSpin();
      }, SPIN_RESUME_MS);
    }

    // ── Layout & painting ──────────────────────────────────────────────────
    function layout() {
      W = container.clientWidth;
      H = container.clientHeight;
      var dpr = root.devicePixelRatio || 1;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      svg.attr('width', W).attr('height', H).attr('viewBox', '0 0 ' + W + ' ' + H);
      R = Math.max(80, Math.min(W - pad.left - pad.right, H - pad.top - pad.bottom) / 2 * 0.86);
      zoom.extent([[0, 0], [W, H]]);
      starLayer = null;
      sphereLayers = null;
    }

    function layer() {
      var dpr = root.devicePixelRatio || 1;
      var c = document.createElement('canvas');
      c.width = canvas.width;
      c.height = canvas.height;
      var g = c.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { canvas: c, ctx: g };
    }

    function paintStars() {
      var l = layer();
      var rnd = prng(7);
      l.ctx.fillStyle = colors.star;
      for (var i = Math.round((W * H) / 1800); i > 0; i--) {
        var big = rnd() > 0.94;
        var r = big ? 0.9 + rnd() * 0.8 : 0.3 + rnd() * 0.5;
        l.ctx.globalAlpha = 0.3 + rnd() * 0.7;
        l.ctx.fillRect(rnd() * W, rnd() * H, r * 2, r * 2);
      }
      return l.canvas;
    }

    // Halo + sea under the land, light + shade over it: they only depend on
    // the globe's size and centre, so they are cached while it just turns
    function paintSphere(s, cx, cy) {
      var under = layer();
      var over = layer();
      var g = under.ctx;
      if (s < Math.max(W, H)) {   // atmosphere glow while the whole globe is in view
        var halo = g.createRadialGradient(cx, cy, s * 0.95, cx, cy, s * 1.22);
        halo.addColorStop(0, colors.halo);
        halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
        g.fillStyle = halo;
        g.beginPath(); g.arc(cx, cy, s * 1.22, 0, 2 * Math.PI); g.fill();
      }
      var sea = g.createRadialGradient(cx - s * 0.3, cy - s * 0.35, 0, cx, cy, s);
      sea.addColorStop(0, colors.sea);
      sea.addColorStop(1, colors['sea-deep']);
      g.beginPath(); g.arc(cx, cy, s, 0, 2 * Math.PI);
      g.fillStyle = sea; g.fill();
      g.fillStyle = g.createPattern(grain || (grain = makeGrain()), 'repeat'); g.fill();

      g = over.ctx;
      var light = g.createRadialGradient(cx - s * 0.45, cy - s * 0.5, 0, cx - s * 0.45, cy - s * 0.5, s * 1.3);
      light.addColorStop(0, colors.light);
      light.addColorStop(1, 'rgba(0, 0, 0, 0)');
      var shade = g.createRadialGradient(cx, cy, s * 0.55, cx, cy, s);
      shade.addColorStop(0, 'rgba(0, 0, 0, 0)');
      shade.addColorStop(1, colors.shade);
      g.beginPath(); g.arc(cx, cy, s, 0, 2 * Math.PI);
      g.fillStyle = light; g.fill();
      g.fillStyle = shade; g.fill();
      return { key: [s, cx, cy].join('|'), under: under.canvas, over: over.canvas };
    }

    function readColors() {
      var probe = document.createElement('span');
      probe.style.display = 'none';
      container.appendChild(probe);
      var out = {};
      TOKENS.forEach(function (name) {
        probe.style.color = 'var(--globe-' + name + ')';
        out[name] = getComputedStyle(probe).color;
      });
      probe.remove();
      return out;
    }

    // Fine sea grain (screen-aligned), generated once instead of a photo texture
    function makeGrain() {
      var c = document.createElement('canvas');
      c.width = c.height = 160;
      var g = c.getContext('2d');
      var rnd = prng(11);
      for (var i = 0; i < 2600; i++) {
        g.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,10,30,0.07)';
        g.fillRect(rnd() * 160, rnd() * 160, 1 + rnd() * 2, 1);
      }
      return c;
    }

    function world() {
      return (!moving && k > DETAIL_K && worlds['50m']) || worlds['110m'] || null;
    }

    function paint() {
      if (!colors) { colors = readColors(); starLayer = null; sphereLayers = null; }
      var dpr = root.devicePixelRatio || 1;
      var s = R * k;
      var c = centre();
      var key = [s, c[0], c[1]].join('|');
      if (!starLayer) starLayer = paintStars();
      if (!sphereLayers || sphereLayers.key !== key) sphereLayers = paintSphere(s, c[0], c[1]);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // stars drift a little as the globe turns (layer tiled with wrap-around)
      var ox = ((rotation[0] * 1.5 * dpr) % canvas.width + canvas.width) % canvas.width;
      var oy = ((-rotation[1] * 1.5 * dpr) % canvas.height + canvas.height) % canvas.height;
      ctx.drawImage(starLayer, ox - canvas.width, oy - canvas.height);
      ctx.drawImage(starLayer, ox, oy - canvas.height);
      ctx.drawImage(starLayer, ox - canvas.width, oy);
      ctx.drawImage(starLayer, ox, oy);
      ctx.drawImage(sphereLayers.under, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var w = world();
      if (w) {
        ctx.beginPath(); backPath(w.land); ctx.fillStyle = colors.back; ctx.fill();
      }
      ctx.beginPath(); frontPath(graticule); ctx.lineWidth = 0.6; ctx.strokeStyle = colors.grid; ctx.stroke();
      if (w) {
        // one projection for land and coast: fill it, then stroke its outline
        ctx.lineJoin = 'round';
        ctx.beginPath(); frontPath(w.land);
        ctx.fillStyle = colors.land; ctx.fill();
        ctx.lineWidth = 0.9; ctx.strokeStyle = colors.coast; ctx.stroke();
        ctx.beginPath(); frontPath(w.borders); ctx.lineWidth = 0.6; ctx.strokeStyle = colors.border; ctx.stroke();
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(sphereLayers.over, 0, 0);
    }

    // ── Overlay: arcs ──────────────────────────────────────────────────────
    function legPath(d) {
      var a = lonLat(d.from);
      var b = lonLat(d.to);
      var t = growth[d.id] === undefined ? 1 : growth[d.id];
      if (t < 1) b = d3.geoInterpolate(a, b)(t);
      return svgPath({ type: 'LineString', coordinates: [a, b] });
    }

    function drawLegs() {
      gLegs.selectAll('g.travel-leg')
        .data(view.legs, function (d) { return d.id; })
        .join(function (enter) {
          var g = enter.append('g').attr('class', 'travel-leg');
          g.append('path').attr('class', 'travel-leg-halo');
          g.append('path').attr('class', 'travel-leg-line');
          return g;
        })
        .classed('is-away', function (d) { return !!d.away; })
        .each(function (d) {
          var p = legPath(d);
          d3.select(this).selectAll('path').attr('d', p);
        });
    }

    // New legs draw themselves from their origin, each on its own clock, so
    // legs appearing one after another (journey playback) flow continuously
    function growNewLegs(previous) {
      var known = {};
      previous.forEach(function (l) { known[l.id] = true; });
      var fresh = view.legs.filter(function (l) { return !known[l.id]; });
      if (reduceMotion || !fresh.length) return;
      var now = d3.now();
      fresh.forEach(function (l) { growth[l.id] = 0; growStart[l.id] = now; });
      if (growTimer) return;
      growTimer = d3.timer(function () {
        var t = d3.now();
        var pending = 0;
        Object.keys(growStart).forEach(function (id) {
          var f = Math.min(1, (t - growStart[id]) / GROW_MS);
          growth[id] = d3.easeCubicOut(f);
          if (f >= 1) delete growStart[id]; else pending++;
        });
        drawLegs();
        if (!pending) { growTimer.stop(); growTimer = null; }
      });
    }

    // ── Overlay: pins ──────────────────────────────────────────────────────
    // Greedy screen-space clustering: pins that would overlap merge into one
    function clusterize(items) {
      var out = [];
      items.sort(function (a, b) { return b.r - a.r; });
      items.forEach(function (it) {
        var hit = null;
        out.forEach(function (c) {
          if (!hit && Math.hypot(c.x - it.x, c.y - it.y) < c.r + it.r + PIN_GAP) hit = c;
        });
        if (hit) hit.members.push(it);
        else out.push({ x: it.x, y: it.y, r: it.r, members: [it] });
      });
      out.forEach(function (c) {
        c.pins = c.members.map(function (m) { return m.pin; });
        c.lead = c.pins[0];   // the biggest one names the cluster
        c.id = c.pins.map(function (p) { return p.id; }).sort().join('+');
        c.count = d3.sum(c.pins, function (p) { return p.count; });
        c.been = d3.sum(c.pins, function (p) { return p.been; });
        var byColor = {};
        c.segments = [];
        c.pins.forEach(function (p) {
          p.segments.forEach(function (s) {
            if (!byColor[s.id]) { byColor[s.id] = { id: s.id, color: s.color, count: 0 }; c.segments.push(byColor[s.id]); }
            byColor[s.id].count += s.count;
          });
        });
        if (c.pins.length > 1) {
          c.x = d3.mean(c.members, function (m) { return m.x; });
          c.y = d3.mean(c.members, function (m) { return m.y; });
          c.r = pinRadius(c.count);
        }
      });
      return out;
    }

    function pinName(c) {
      var name = c.lead.place.name;
      return c.pins.length > 1 ? name + ' and ' + (c.pins.length - 1) + ' more' : name;
    }

    function pinLabel(c) {
      if (c.pins.length > 1) return pinName(c) + ' (' + c.pins.map(function (p) { return p.place.name; }).join(', ') + ') — zoom in';
      var p = c.lead;
      var parts = [];
      if (p.home) parts.push('home');
      if (p.been) parts.push(p.been + (p.been === 1 ? ' trip' : ' trips'));
      if (p.away) parts.push(p.away + ' without me');
      return p.place.name + ', ' + p.place.country + (parts.length ? ' — ' + parts.join(', ') : '');
    }

    var pie = d3.pie().sort(null).value(function (s) { return s.count; }).padAngle(0.06);

    // Greedy label placement, biggest pins first: each name goes to the right
    // of its pin, else to the left, else it is hidden (hover / zoom shows it).
    // Obstacles are every pin and the labels already placed; text width is
    // estimated (no DOM measuring, it runs on every frame).
    function placeLabels(clusters) {
      var boxes = clusters.map(function (c) { return [c.x - c.r, c.y - c.r, c.x + c.r, c.y + c.r]; });
      function free(b, own) {
        if (b[0] < 4 || b[2] > W - 4) return false;
        return boxes.every(function (o, i) {
          return i === own || o[2] <= b[0] || o[0] >= b[2] || o[3] <= b[1] || o[1] >= b[3];
        });
      }
      clusters.forEach(function (c, i) {
        c.name = pinName(c);
        var w = c.name.length * 7.2;
        var gap = c.r + 6;
        var right = [c.x + gap, c.y - 8, c.x + gap + w, c.y + 8];
        var left = [c.x - gap - w, c.y - 8, c.x - gap, c.y + 8];
        c.label = free(right, i) ? 'right' : free(left, i) ? 'left' : null;
        if (c.label) boxes.push(c.label === 'right' ? right : left);
      });
    }


    function drawPins() {
      var c0 = centreLonLat();
      var items = [];
      view.pins.forEach(function (pin) {
        var ll = lonLat(pin.place);
        if (d3.geoDistance(ll, c0) > Math.PI / 2 - 0.02) return;   // far side
        var xy = front(ll);
        items.push({ pin: pin, x: xy[0], y: xy[1], r: pinRadius(pin.count) });
      });

      var clusters = clusterize(items);
      placeLabels(clusters);
      gPins.selectAll('g.travel-pin')
        .data(clusters, function (d) { return d.id; })
        .join(function (enter) {
          var g = enter.append('g')
            .attr('class', 'travel-pin')
            .attr('tabindex', 0)
            .attr('role', 'button')
            .on('click', function (ev, d) { activate(d); })
            .on('keydown', function (ev, d) {
              if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); activate(d); }
            });
          g.append('circle').attr('class', 'travel-pin-ring');
          g.append('circle').attr('class', 'travel-pin-disc');
          g.append('path').attr('class', 'travel-pin-diamond');
          g.append('g').attr('class', 'travel-pin-donut');
          g.append('text').attr('class', 'travel-pin-count').attr('dy', '0.36em');
          var house = g.append('g').attr('class', 'travel-pin-home');
          house.append('circle').attr('r', 6.5);
          house.append('path').attr('d', 'M-3.6,0.4 L0,-3 L3.6,0.4 M-2.6,-0.5 V3 H2.6 V-0.5');
          g.append('text').attr('class', 'travel-pin-name').attr('dy', '0.36em');
          g.append('title');
          return g;
        })
        .attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')'; })
        .attr('aria-label', pinLabel)
        .classed('is-cluster', function (d) { return d.pins.length > 1; })
        .classed('is-home', function (d) { return d.pins.length === 1 && d.lead.home; })
        .classed('is-away', function (d) { return d.count > 0 && d.been === 0; })
        .classed('is-selected', function (d) { return d.pins.some(function (p) { return p.id === selected; }); })
        .each(function (d) {
          var g = d3.select(this);
          var arc = d3.arc().innerRadius(d.r - DONUT).outerRadius(d.r);
          g.select('.travel-pin-ring').attr('r', d.r + 4);
          // only "without me": a diamond in the category colour, no donut
          var away = d.count > 0 && d.been === 0;
          var h = d.r * 1.2;
          g.select('.travel-pin-disc').attr('r', away ? 0 : d.r);
          g.select('.travel-pin-diamond')
            .attr('d', away ? 'M0,' + (-h) + 'L' + h + ',0L0,' + h + 'L' + (-h) + ',0Z' : null)
            .style('--travel-color', away && d.segments[0] ? d.segments[0].color : null);
          g.select('.travel-pin-donut').selectAll('path')
            .data(away ? [] : pie(d.segments))
            .join('path')
            .attr('d', arc)
            .style('--travel-color', function (s) { return s.data.color; });
          g.select('.travel-pin-count').text(d.count || '');
          // house: inside an empty home pin, as a badge on a busy one
          var homeOnly = d.pins.length === 1 && d.lead.home;
          var badge = homeOnly && d.count ? 'translate(' + (d.r * 0.75) + ',' + (-d.r * 0.75) + ')' : null;
          g.select('.travel-pin-home')
            .attr('display', homeOnly ? null : 'none')
            .classed('is-badge', !!badge)
            .attr('transform', badge);
          var left = d.label === 'left';
          g.select('.travel-pin-name')
            .classed('is-hidden', !d.label)
            .attr('x', left ? -(d.r + 6) : d.r + 6)
            .attr('text-anchor', left ? 'end' : 'start')
            .text(d.name);
          g.select('title').text(pinLabel(d));
        });
    }

    // A pin selects its place; a cluster zooms in until its pins separate
    function activate(c) {
      if (c.pins.length === 1) {
        if (opts.onSelect) opts.onSelect(c.lead.id);
        return;
      }
      var lls = c.pins.map(function (p) { return lonLat(p.place); });
      var mid = d3.geoCentroid({ type: 'MultiPoint', coordinates: lls });
      var dMin = Infinity;
      lls.forEach(function (a, i) {
        lls.slice(i + 1).forEach(function (b) { dMin = Math.min(dMin, d3.geoDistance(a, b)); });
      });
      turnTo(mid, Math.max(k * 1.5, zoomToSeparate(dMin)), 900);
    }

    // Zoom at which two pins `angle` radians apart stop overlapping
    function zoomToSeparate(angle) {
      var gap = 2 * pinRadius(4) + PIN_GAP + 6;
      return isFinite(angle) && angle > 0 ? gap / (R * Math.sin(Math.min(angle, Math.PI / 2))) : 1;
    }

    // ── Render loop ────────────────────────────────────────────────────────
    function render() {
      var s = R * k;
      var c = centre();
      front.scale(s).translate(c).rotate(rotation).precision(moving ? PRECISION_MOVING : PRECISION);
      back.scale(s).translate(c).rotate([rotation[0] + 180, -rotation[1], -rotation[2]]);
      paint();
      drawLegs();
      drawPins();
    }

    // While moving, paint the light world; when idle, the detailed one
    function changed() {
      moving = true;
      clearTimeout(idleTimer);
      idleTimer = setTimeout(function () {
        moving = false;
        if (k > DETAIL_K) loadWorld('50m');
        render();
      }, IDLE_MS);
      render();
    }

    function loadWorld(res) {
      if (worlds[res] || loading[res]) return loading[res];
      loading[res] = fetchWorld(res).then(function (w) {
        var countries = w.objects.countries;
        worlds[res] = {
          land: topojson.merge(w, countries.geometries),
          borders: topojson.mesh(w, countries, function (a, b) { return a !== b; })
        };
        paint();
        return worlds[res];
      });
      return loading[res];
    }

    // Repaint with fresh colours when the theme changes
    function themeChanged() { colors = null; paint(); }
    new MutationObserver(themeChanged)
      .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });

    if (root.ResizeObserver) {
      new ResizeObserver(function () { layout(); render(); }).observe(container);
    }

    // No spinning (no work) while the globe is scrolled out of view
    if (root.IntersectionObserver) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (!visible && spin) { stopSpin(); spinWhenVisible = true; }
        if (visible && spinWhenVisible) {
          spinWhenVisible = false;
          if (!opts.canSpin || opts.canSpin()) startSpin();
        }
      }).observe(container);
    }

    // ── Public API ─────────────────────────────────────────────────────────
    function setView(v) {
      var previous = view.legs;
      view = v;
      growNewLegs(previous);
      drawLegs();
      drawPins();
    }

    function select(id) {
      selected = id || null;
      if (selected) stopSpin(); else resumeSpinSoon();
      drawPins();
    }

    // Centre a place, zoomed just enough to separate it from its neighbours
    function focus(id) {
      var pin = view.pins.filter(function (p) { return p.id === id; })[0];
      if (!pin) return;
      var ll = lonLat(pin.place);
      var dMin = Infinity;
      view.pins.forEach(function (p) {
        if (p !== pin) dMin = Math.min(dMin, d3.geoDistance(ll, lonLat(p.place)));
      });
      turnTo(ll, clamp(zoomToSeparate(dMin) * 1.1, 1, K_MAX), 1000);
    }

    // Frame every visible place: centre between the two farthest apart and
    // zoom so both fit (capped, so a single region still shows its context)
    function fit(ms) {
      var lls = view.pins.map(function (p) { return lonLat(p.place); });
      var a = null, b = null, dMax = 0;
      lls.forEach(function (p, i) {
        lls.slice(i + 1).forEach(function (q) {
          var d = d3.geoDistance(p, q);
          if (d > dMax) { dMax = d; a = p; b = q; }
        });
      });
      var mid = a ? d3.geoInterpolate(a, b)(0.5) : (lls[0] || [0, TILT]);
      var kFit = dMax > 0 ? 0.8 / Math.sin(Math.min(dMax / 2, Math.PI / 2)) : FIT_K_MAX;
      turnTo(mid, clamp(kFit, 1, FIT_K_MAX), ms);
    }

    // Turn towards a place keeping the zoom (journey playback)
    function lookAt(id, ms) {
      var pin = view.pins.filter(function (p) { return p.id === id; })[0];
      if (pin) turnTo(lonLat(pin.place), k, ms);
    }

    function zoomBy(factor) {
      turnTo(centreLonLat(), k * factor, 350);
    }

    // Floating cards cover part of the stage: keep the globe in the free area
    function setPadding(p) {
      pad = { top: p.top || 0, right: p.right || 0, bottom: p.bottom || 0, left: p.left || 0 };
      layout();
      render();
    }

    layout();
    render();
    loadWorld('110m').then(function () {
      container.classList.add('is-ready');
      if (opts.onReady) opts.onReady();
    }).catch(function () {
      if (opts.onError) opts.onError();
    });

    return {
      setView: setView, select: select, focus: focus, fit: fit, zoomBy: zoomBy, lookAt: lookAt,
      setPadding: setPadding, startSpin: startSpin, stopSpin: stopSpin
    };
  }

  root.TravelGlobe = { load: load, create: create };
})(window);
