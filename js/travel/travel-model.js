// ----------------------- TRAVEL MAP · DATA MODEL ----------------------- //
// Pure functions over _data/travels.yml (inlined as JSON by travel.md): no DOM,
// no d3. Answers "what is visible for these modes and categories, up to this
// date": pins per place, arcs and the hero stats.
//   mode "been": events I attended -> journeys from the home of their date
//                (arcs + km).
//   mode "away": events where my work was presented without me -> one arc
//                from home each, no km.
// Category (filter) = colour; mode = pin/arc style. Never mixed.
// Works in the browser (window.TravelModel) and in node (module.exports).

(function (root) {
  'use strict';

  var EARTH_RADIUS_KM = 6371;
  var RAD = Math.PI / 180;

  // "YYYY", "YYYY-MM" or "YYYY-MM-DD" -> sortable YYYYMMDD (missing parts = 0)
  function dateKey(s) {
    var p = String(s || '').split('-');
    return (Number(p[0]) || 0) * 10000 + (Number(p[1]) || 0) * 100 + (Number(p[2]) || 0);
  }

  // Month index (continuous timeline) <-> last dateKey of that month
  function monthIndex(key) { return Math.floor(key / 10000) * 12 + Math.max(1, Math.floor(key / 100) % 100) - 1; }
  function monthEnd(index) { return Math.floor(index / 12) * 10000 + (index % 12 + 1) * 100 + 31; }

  // Great-circle distance between two {lat, lon} points
  function distanceKm(a, b) {
    var dLat = (b.lat - a.lat) * RAD;
    var dLon = (b.lon - a.lon) * RAD;
    var h = Math.pow(Math.sin(dLat / 2), 2) +
      Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.pow(Math.sin(dLon / 2), 2);
    return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
  }

  function create(raw) {
    var placeById = {};
    raw.places.forEach(function (p) { placeById[p.id] = p; });

    var filterByKind = {};
    raw.filters.forEach(function (f) {
      f.kinds.forEach(function (k) { filterByKind[k] = f; });
    });

    var homes = raw.places
      .filter(function (p) { return p.home; })
      .sort(function (a, b) { return dateKey(a.home.from) - dateKey(b.home.from); });

    var events = raw.events.map(function (e, i) {
      var filter = filterByKind[e.kind] || {};
      return {
        index: i,
        kind: e.kind,
        filter: filter.id,
        color: filter.color,
        mode: e.attended === false ? 'away' : 'been',
        place: placeById[e.place],
        start: dateKey(e.from),
        trip: e.trip || null,
        online: !!e.online,
        title: e.title,
        contributions: (e.pubs || []).length
      };
    }).filter(function (e) { return e.place; });

    var months = events.map(function (e) { return monthIndex(e.start); });
    var monthRange = [Math.min.apply(null, months), Math.max.apply(null, months)];

    // Home on a date: the latest one that started on or before it
    // (dates before the first home fall back to the first home).
    function homeAt(key) {
      var found = homes[0] || null;
      homes.forEach(function (h) { if (dateKey(h.home.from) <= key) found = h; });
      return found;
    }

    // Journeys ("been"): events sharing a `trip` are one journey (stops in
    // date order); every other non-online event is a journey of its own.
    function journeys(visible) {
      var byId = {};
      var list = [];
      visible.forEach(function (e) {
        if (e.online) return;
        var id = e.trip || ('event-' + e.index);
        if (!byId[id]) { byId[id] = { id: id, stops: [] }; list.push(byId[id]); }
        byId[id].stops.push(e);
      });
      list.forEach(function (j) {
        j.stops.sort(function (a, b) { return a.start - b.start; });
        j.home = homeAt(j.stops[0].start);
        j.legs = [];
        var prev = j.home;
        j.stops.forEach(function (s) {
          if (prev && prev !== s.place) {
            j.legs.push({ id: j.id + ':' + s.index, from: prev, to: s.place, color: s.color, event: s });
          }
          prev = s.place;
        });
        // Round trip: outbound legs + the way back home
        j.km = j.legs.reduce(function (sum, l) { return sum + distanceKm(l.from, l.to); }, 0);
        if (j.home && prev !== j.home) j.km += distanceKm(prev, j.home);
      });
      return list;
    }

    // Everything the page needs: opts = {modes, active (Sets of ids), until (dateKey)}
    function view(opts) {
      var until = opts.until || Infinity;
      var visible = events.filter(function (e) {
        return opts.modes.has(e.mode) && opts.active.has(e.filter) && e.start <= until;
      });

      var pinById = {};
      var pins = [];
      function pinFor(place) {
        if (!pinById[place.id]) {
          pinById[place.id] = { id: place.id, place: place, home: !!place.home, events: [], count: 0, been: 0, away: 0, byFilter: {} };
          pins.push(pinById[place.id]);
        }
        return pinById[place.id];
      }
      homes.forEach(function (h) { if (dateKey(h.home.from) <= until) pinFor(h); });   // homes always shown
      visible.forEach(function (e) {
        var pin = pinFor(e.place);
        pin.events.push(e);
        pin.count += 1;
        pin[e.mode] += 1;   // been / away: the globe picks the pin shape
        pin.byFilter[e.filter] = (pin.byFilter[e.filter] || 0) + 1;
      });
      // Donut segments by category (colour), in YAML filter order
      pins.forEach(function (pin) {
        pin.segments = raw.filters
          .filter(function (f) { return pin.byFilter[f.id]; })
          .map(function (f) { return { id: f.id, color: f.color, count: pin.byFilter[f.id] }; });
      });

      var legs = [];
      var km = 0;
      journeys(visible.filter(function (e) { return e.mode === 'been'; }))
        .forEach(function (j) { legs.push.apply(legs, j.legs); km += j.km; });
      visible.forEach(function (e) {
        var home = homeAt(e.start);
        if (e.mode === 'away' && !e.online && home && home !== e.place) {
          legs.push({ id: 'away:' + e.index, from: home, to: e.place, color: e.color, away: true, event: e });
        }
      });

      // Stats count places with events in this view (homes alone do not)
      var visited = pins.filter(function (p) { return p.count > 0; });
      var countries = {};
      visited.forEach(function (p) { countries[p.place.country] = true; });

      return {
        events: visible,
        pins: pins,
        legs: legs,
        stats: {
          places: visited.length,
          countries: Object.keys(countries).length,
          km: km,
          contributions: visible.reduce(function (sum, e) { return sum + e.contributions; }, 0)
        }
      };
    }

    return {
      places: raw.places,
      placeById: placeById,
      filters: raw.filters,
      modes: raw.modes,
      events: events,
      monthRange: monthRange,
      homeAt: homeAt,
      view: view
    };
  }

  var api = { create: create, dateKey: dateKey, distanceKm: distanceKm, monthIndex: monthIndex, monthEnd: monthEnd };
  root.TravelModel = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
