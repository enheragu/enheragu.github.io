// =====================================================================
// gitgraph-common.js  —  Shared helpers for all gitgraph pages
// Must be loaded AFTER gitgraph.1.0.0.min.js and BEFORE page-specific JS
// =====================================================================

var GitGraphCommon = (function() {

  // ---- Responsive detection ----
  var screenWidth = window.innerWidth;
  var isMobile  = screenWidth <= 768;
  var isTablet  = !isMobile && screenWidth <= 1200;

  // ---- Theme detection ----
  // Same resolution as SharedUiCore.initThemeToggle (which loads after page
  // scripts): explicit localStorage choice first, otherwise system preference.
  function isLightTheme() {
    try {
      var saved = localStorage.getItem('theme');
      if (saved === 'light') return true;
      if (saved === 'dark') return false;
    } catch (e) { /* private mode */ }
    return !(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  // ---- Shared color palette (canvas colors, themed) ----
  // Pairs of [dark-bg color, light-bg color] — GitHub-style hues; the light
  // variants keep WCAG-AA contrast on white (the dark palette did not).
  var COLOR_PAIRS = {
    gray:   ["#6e7681", "#57606a"],
    blue:   ["#58a6ff", "#0969da"],
    amber:  ["#d29922", "#9a6700"],
    green:  ["#3fb950", "#1a7f37"],
    red:    ["#f85149", "#cf222e"],
    purple: ["#bc8cff", "#8250df"]
  };

  var themeIsLight = isLightTheme();
  var themeIdx = themeIsLight ? 1 : 0;

  var palette = {};
  for (var pKey in COLOR_PAIRS) {
    if (Object.prototype.hasOwnProperty.call(COLOR_PAIRS, pKey)) {
      palette[pKey] = COLOR_PAIRS[pKey][themeIdx];
    }
  }

  var defaultColors = [
    palette.gray, palette.blue, palette.amber, palette.green, palette.red,
    palette.purple, palette.blue, palette.amber, palette.green, palette.red,
    palette.purple, palette.blue, palette.amber, palette.green, palette.red
  ];

  // ---- Live recolor when the theme toggle flips data-theme ----
  // Colors are baked into branch/commit objects at build time; swap them via
  // the dark↔light pairs and re-render, without rebuilding the graph.
  function recolorForTheme(gitgraph, toLight) {
    var map = {};
    for (var k in COLOR_PAIRS) {
      if (Object.prototype.hasOwnProperty.call(COLOR_PAIRS, k)) {
        map[COLOR_PAIRS[k][toLight ? 0 : 1]] = COLOR_PAIRS[k][toLight ? 1 : 0];
      }
    }
    function sw(c) { return map[c] || c; }

    var i;
    for (i = 0; i < gitgraph.branches.length; i++) {
      var b = gitgraph.branches[i];
      b.color = sw(b.color);
      if (b.commitDefaultOptions) b.commitDefaultOptions.color = sw(b.commitDefaultOptions.color);
    }
    for (i = 0; i < gitgraph.commits.length; i++) {
      var c = gitgraph.commits[i];
      c.color = sw(c.color);
      c.dotColor = sw(c.dotColor);
      c.messageColor = sw(c.messageColor);
      c.tagColor = sw(c.tagColor);
      c.labelColor = sw(c.labelColor);
    }
    if (gitgraph.template && gitgraph.template.colors) {
      for (i = 0; i < gitgraph.template.colors.length; i++) {
        gitgraph.template.colors[i] = sw(gitgraph.template.colors[i]);
      }
    }
    gitgraph.render();
    tintPanels(gitgraph);
  }

  // Expose each panel's branch colour as a CSS var (--branch) on the panel
  // element, so panel subheadings (and anything else) can echo their section's
  // colour. Single source of truth: the graph's own commit colours (so it
  // stays in sync with the graph and with the light/dark recolor).
  function tintPanels(gitgraph) {
    for (var i = 0; i < gitgraph.commits.length; i++) {
      var c = gitgraph.commits[i];
      // The commit's colour lives on dotColor (and the branch), not on .color;
      // both are swapped by recolorForTheme, so this stays theme-correct.
      var col = c.dotColor || (c.branch && c.branch.color);
      if (c.detail && col) c.detail.style.setProperty('--branch', col);
    }
  }

  function watchTheme(gitgraph) {
    if (typeof MutationObserver === 'undefined') return;
    var observer = new MutationObserver(function() {
      var nowLight = document.documentElement.getAttribute('data-theme') === 'light';
      if (nowLight !== themeIsLight) {
        themeIsLight = nowLight;
        recolorForTheme(gitgraph, nowLight);
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }

  // ---- Color cycler ----
  function createColorCycler(colors) {
    var _colors = colors || defaultColors;
    var _idx = 0;
    return {
      next: function() { return _colors[_idx++]; },
      reset: function() { _idx = 0; }
    };
  }

  // ---- Build a responsive template with consistent settings ----
  function createTemplate(opts) {
    var colors = (opts && opts.colors) || defaultColors;
    return new GitGraph.Template({
      colors: colors,
      branch: {
        lineWidth: isMobile ? 2 : 3,
        spacingX: isMobile ? 18 : (isTablet ? 35 : 55),
        labelRotation: 0
      },
      commit: {
        spacingY: isMobile ? -25 : -40,
        dot: {
          size: isMobile ? 3 : 6,
          strokeWidth: isMobile ? 1 : 2
        },
        message: {
          display: true,
          // Commit messages act as the section/entry HEADINGS of the panels
          // (16px prose): keep them one step above, not below.
          font: isMobile ? "bold 12px 'Inter', sans-serif"
              : (isTablet ? "bold 14px 'Inter', sans-serif"
              : "bold 15px 'Inter', sans-serif"),
          displayBranch: false,
          displayHash: false,
          displayAuthor: false
        },
        tag: {
          font: isMobile ? "bold 11px 'Inter', sans-serif"
              : (isTablet ? "bold 13px 'Inter', sans-serif"
              : "bold 14px 'Inter', sans-serif")
        }
      }
    });
  }

  // ---- Merge style constants ----
  var mergeFont  = "italic 11px 'Inter', sans-serif";
  var mergeColor = palette.gray;

  // ---- Section label lookup ----
  // Labels live in _data/*.yml and are injected by the page as window.cvLabels
  // (single source shared with /print and the hidden accessibility headings).
  // The inline fallback keeps the graph working if the page defines no labels.
  function label(id, fallback) {
    return (window.cvLabels && window.cvLabels[id]) || fallback;
  }

  // ---- Dynamic widthExtension: prevents tag clipping ----
  function applyWidthExtension(gitgraph, template) {
    var canvas = document.getElementById("gitGraph");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var tagFont = template.commit.tag.font || "bold 13px 'Inter', sans-serif";
    ctx.font = tagFont;
    var maxTagWidth = 0;
    for (var i = 0; i < gitgraph.commits.length; i++) {
      var c = gitgraph.commits[i];
      if (c.tag) {
        var w = ctx.measureText(c.tag).width;
        if (w > maxTagWidth) maxTagWidth = w;
      }
    }
    if (maxTagWidth > 0) {
      template.commit.widthExtension = maxTagWidth + 50;
      gitgraph.render();
    }
  }

  // ---- Measure panel height even if hidden ----
  function measurePanelHeight(panel) {
    var computed = window.getComputedStyle(panel);
    if (computed.display !== 'none') return panel.offsetHeight;
    var prevDisplay = panel.style.display;
    var prevVisibility = panel.style.visibility;
    panel.style.visibility = 'hidden';
    panel.style.display = 'block';
    var h = panel.offsetHeight;
    panel.style.display = prevDisplay;
    panel.style.visibility = prevVisibility;
    return h;
  }

  // ---- recalculateYPositions: fix canvas positions after async growth ----
  //
  // When async content (repo cards, images) makes panels taller than what
  // the engine measured at commit-creation time, canvas-drawn commit dots
  // and messages end up overlapping panels above them.
  //
  // This function:
  //   1. Walks commits top→bottom, checks if the current panel's actual
  //      height exceeds the space the engine reserved.
  //   2. If so, pushes the commit (and all subsequent ones) down.
  //   3. Updates ALL branch.path points using an interpolation mapping
  //      (old Y → new Y), so lines stay aligned with dots.
  //   4. Re-renders the canvas.
  //
  // The mapping ensures routing joints between commits are shifted
  // proportionally, keeping merge lines visually correct.
  function recalculateYPositions(gitgraph) {
    var commits = gitgraph.commits;
    if (!commits || !commits.length) return;
    var canvas = document.getElementById("gitGraph");
    if (!canvas) return;

    var absSpacingY = Math.abs(gitgraph.template.commit.spacingY);
    var PANEL_TOP_OFFSET = isMobile ? 20 : 30;
    var PANEL_STACK_GAP = isMobile ? 14 : 24;

    // Snapshot the pristine engine layout on the first pass and RESTORE it at
    // the start of every later pass. This makes the relayout idempotent: it
    // can react to panels that shrink (collapsible sections) as well as grow,
    // instead of only ever pushing commits further down.
    if (!gitgraph._layoutSnapshot) {
      var snapBranchPaths = [];
      var snapStartPoints = [];
      for (var sb = 0; sb < gitgraph.branches.length; sb++) {
        var sPath = gitgraph.branches[sb].path;
        var sYs = [];
        for (var sp = 0; sp < sPath.length; sp++) sYs.push(sPath[sp].y);
        snapBranchPaths.push(sYs);
        snapStartPoints.push(gitgraph.branches[sb].startPoint ? gitgraph.branches[sb].startPoint.y : null);
      }
      var snapCommitYs = [];
      for (var sc = 0; sc < commits.length; sc++) snapCommitYs.push(commits[sc].y);
      gitgraph._layoutSnapshot = {
        commitYs: snapCommitYs,
        branchPaths: snapBranchPaths,
        startPoints: snapStartPoints,
        commitOffsetY: gitgraph.commitOffsetY
      };
    }

    // Restore pristine positions (no-op right after taking the snapshot)
    var restoredFromSnapshot = false;
    if (gitgraph._layoutSnapshot) {
      var snap = gitgraph._layoutSnapshot;
      for (var rc = 0; rc < commits.length; rc++) commits[rc].y = snap.commitYs[rc];
      for (var rb = 0; rb < gitgraph.branches.length; rb++) {
        var rPath = gitgraph.branches[rb].path;
        var rYs = snap.branchPaths[rb];
        for (var rp = 0; rp < rPath.length; rp++) rPath[rp].y = rYs[rp];
        if (gitgraph.branches[rb].startPoint && snap.startPoints[rb] !== null) {
          gitgraph.branches[rb].startPoint.y = snap.startPoints[rb];
        }
      }
      gitgraph.commitOffsetY = snap.commitOffsetY;
      restoredFromSnapshot = true;
    }

    // Sort commits by y (ascending = top to bottom)
    var sorted = commits.slice().sort(function(a, b) { return a.y - b.y; });

    // Save original y values
    var originals = [];
    for (var i = 0; i < sorted.length; i++) {
      originals.push(sorted[i].y);
    }

    // Walk through and push commits down when needed.
    // Key rule: once a detail panel sets a "bottom floor", all subsequent
    // commits must stay below that floor even if there are non-detail commits
    // (e.g., merge/helper nodes) in between.
    var changed = false;
    var detailFloorY = -Infinity;

    if (sorted[0].detail) {
      detailFloorY = sorted[0].y + PANEL_TOP_OFFSET + measurePanelHeight(sorted[0].detail) + PANEL_STACK_GAP;
    }

    for (var i = 1; i < sorted.length; i++) {
      var prev = sorted[i - 1];
      var curr = sorted[i];

      var minY;
      if (prev.detail) {
        var panelH = measurePanelHeight(prev.detail);
        // Keep panel stacking gap consistent: next commit anchor must sit
        // enough below previous panel content to avoid overlap.
        minY = prev.y + PANEL_TOP_OFFSET + panelH + PANEL_STACK_GAP;
      } else {
        minY = prev.y + absSpacingY;
      }

      // Ensure at least absSpacingY between any two commits
      minY = Math.max(minY, prev.y + absSpacingY);
      // Ensure we never go above the latest detail panel floor.
      minY = Math.max(minY, detailFloorY);

      if (curr.y < minY) {
        var delta = minY - curr.y;
        // Push this commit and all subsequent ones down by delta
        for (var j = i; j < sorted.length; j++) {
          sorted[j].y += delta;
        }
        if (isFinite(detailFloorY)) {
          detailFloorY += delta;
        }
        changed = true;
      }

      if (curr.detail) {
        var currPanelH = measurePanelHeight(curr.detail);
        detailFloorY = Math.max(detailFloorY, curr.y + PANEL_TOP_OFFSET + currPanelH + PANEL_STACK_GAP);
      }
    }

    if (!changed) {
      // Positions may have been restored from the snapshot (e.g. after a
      // panel collapsed back): repaint so the canvas matches them.
      if (restoredFromSnapshot) gitgraph.render();
      return;
    }

    // Build full Y mapping (old → new) for path interpolation
    var fullMap = [];
    for (var i = 0; i < sorted.length; i++) {
      fullMap.push({ oldY: originals[i], newY: sorted[i].y });
    }

    // Interpolation function: maps old Y → new Y
    function mapY(y) {
      // Exact match (within 0.5px tolerance)
      for (var i = 0; i < fullMap.length; i++) {
        if (Math.abs(y - fullMap[i].oldY) < 0.5) return fullMap[i].newY;
      }
      // Before first commit: apply first commit's delta
      if (y < fullMap[0].oldY) {
        return y + (fullMap[0].newY - fullMap[0].oldY);
      }
      // After last commit: apply last commit's delta
      if (y > fullMap[fullMap.length - 1].oldY) {
        return y + (fullMap[fullMap.length - 1].newY - fullMap[fullMap.length - 1].oldY);
      }
      // Between two commits: linear interpolation
      for (var i = 0; i < fullMap.length - 1; i++) {
        if (y >= fullMap[i].oldY && y <= fullMap[i + 1].oldY) {
          var range = fullMap[i + 1].oldY - fullMap[i].oldY;
          if (range < 0.5) return fullMap[i].newY;
          var t = (y - fullMap[i].oldY) / range;
          return fullMap[i].newY + t * (fullMap[i + 1].newY - fullMap[i].newY);
        }
      }
      return y;
    }

    // Update ALL branch path points
    for (var b = 0; b < gitgraph.branches.length; b++) {
      var branch = gitgraph.branches[b];
      for (var p = 0; p < branch.path.length; p++) {
        branch.path[p].y = mapY(branch.path[p].y);
      }
      if (branch.startPoint) {
        // Use the exact parent commit anchor when available to avoid
        // split calculations between startPoint and commit coordinates.
        if (branch.parentCommit) {
          branch.startPoint.x = branch.parentCommit.x;
          branch.startPoint.y = branch.parentCommit.y;
        } else {
          branch.startPoint.y = mapY(branch.startPoint.y);
        }
      }
    }

    // Update commitOffsetY for canvas sizing
    var lastY = sorted[sorted.length - 1].y;
    if (sorted[sorted.length - 1].detail) {
      lastY += measurePanelHeight(sorted[sorted.length - 1].detail) + PANEL_STACK_GAP;
    }
    gitgraph.commitOffsetY = -lastY;

    // Re-render canvas with corrected positions
    gitgraph.render();
  }

  // ---- relayoutPanels: post-render CSS fix for panel positions ----
  //
  // The gitgraph engine computes commit Y positions and reserves vertical
  // space based on panel clientHeight at commit-creation time.  It also
  // sets detail.style.top/left during Commit.prototype.render().
  //
  // This function runs AFTER render() and:
  //   1. Recalculates left & width (handles resize)
  //   2. Overrides top with overlap prevention: if panel N would overlap
  //      the bottom of panel N-1, it is pushed down.
  //   3. Grows the <section> to fit everything.
  //
  // IMPORTANT: This function NEVER modifies commit.y or branch.path.
  // Doing so would desynchronise canvas-drawn lines from commit dots.
  function relayoutPanels(gitgraph) {
    var canvas = document.getElementById("gitGraph");
    if (!canvas) return;
    var section = canvas.closest("section");
    if (!section) return;

    var commits = gitgraph.commits;
    var sortedCommits = commits.slice().sort(function(a, b) { return a.y - b.y; });
    var sf = gitgraph.scalingFactor || 1;
    var cssMarginX = gitgraph.marginX / sf;
    var cssMarginY = gitgraph.marginY / sf;
    // Distance from commit anchor to panel top and desired inter-panel gap.
    var PANEL_TOP_OFFSET = isMobile ? 20 : 30;
    var PANEL_STACK_GAP = isMobile ? 14 : 24;
    var prevBottom = 0;
    var maxBottom = 0;

    // Read CSS 'right' from first visible panel
    var cssRight = 0;
    for (var k = 0; k < sortedCommits.length; k++) {
      if (sortedCommits[k].detail) {
        cssRight = parseFloat(window.getComputedStyle(sortedCommits[k].detail).right) || 0;
        break;
      }
    }

    for (var i = 0; i < sortedCommits.length; i++) {
      var c = sortedCommits[i];
      if (!c.detail) continue;

      // Left: just past the commit dot
      var left = canvas.offsetLeft + cssMarginX + c.x + c.dotSize + 20;
      c.detail.style.left = left + "px";

      // Width: fill available space
      var availW = section.clientWidth - left - cssRight;
      if (availW > 50) c.detail.style.width = availW + "px";

      // Top: aligned with commit dot, push down if overlapping previous
      var idealTop = canvas.offsetTop + cssMarginY + c.y + PANEL_TOP_OFFSET;
      c.detail.style.top = idealTop + "px";

      // Track bottom for next overlap check
      var panelHeight = measurePanelHeight(c.detail);
      prevBottom = idealTop + panelHeight;
      if (prevBottom > maxBottom) maxBottom = prevBottom;
    }

    // Fit the section to the content: grows when panels expand and shrinks
    // back when they collapse (the stylesheet min-height only reserves the
    // initial space before this runs).
    var needed = Math.max(maxBottom, canvas.offsetTop + canvas.clientHeight);
    section.style.minHeight = (needed + 40) + "px";
  }

  // ---- Lock an initial section min-height to reduce late CLS ----
  // Uses current panel top/height after the first relayout pass.
  function lockSectionMinHeight(gitgraph) {
    var canvas = document.getElementById("gitGraph");
    if (!canvas) return;
    var section = canvas.closest("section");
    if (!section) return;

    var maxBottom = canvas.offsetTop + canvas.clientHeight;
    var panels = section.querySelectorAll('.gitgraph-detail');
    for (var i = 0; i < panels.length; i++) {
      var panel = panels[i];
      var top = parseFloat(panel.style.top);
      if (!isFinite(top)) continue;
      var panelBottom = top + measurePanelHeight(panel);
      if (panelBottom > maxBottom) maxBottom = panelBottom;
    }

    var target = Math.ceil(maxBottom + 40);
    if (target > section.clientHeight) {
      section.style.minHeight = target + "px";
    }
  }

  // ---- Wire up relayout to run after gitgraph's own resize handler ----
  function hookResize(gitgraph) {
    recalculateYPositions(gitgraph);
    relayoutPanels(gitgraph);
    var _origOnResize = window.onresize;
    window.onresize = function() {
      if (_origOnResize) _origOnResize.call(window);
      recalculateYPositions(gitgraph);
      relayoutPanels(gitgraph);
    };
  }

  // ---- Collapsible panels (marked with data-collapsible) ----
  // Adds a show/hide toggle; content visibility is CSS-driven (.collapsed).
  // The MutationObserver in finalize() picks up the class change and
  // re-runs the relayout, so the graph adapts to the new panel height.
  function initCollapsiblePanels() {
    var panels = document.querySelectorAll('.gitgraph-detail[data-collapsible]');
    for (var i = 0; i < panels.length; i++) {
      (function(panel) {
        if (panel.dataset.collapsibleBound === '1') return;
        panel.dataset.collapsibleBound = '1';
        var count = panel.querySelectorAll('.pub-list > li').length;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'collapse-toggle';
        function refresh() {
          var collapsed = panel.classList.contains('collapsed');
          btn.textContent = collapsed
            ? '▸ show ' + (count ? count + ' entries' : 'content')
            : '▾ hide';
          btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        }
        btn.addEventListener('click', function() {
          panel.classList.toggle('collapsed');
          refresh();
        });
        panel.insertBefore(btn, panel.firstChild);
        refresh();
      })(panels[i]);
    }
  }

  // ---- Handle anchor link: scroll to & highlight targeted panel ----
  function handleAnchor() {
    var hash = window.location.hash;
    if (!hash) return;
    var target = document.querySelector(hash);
    if (!target || !target.classList.contains('gitgraph-detail')) return;

    // Expand a collapsed panel before revealing it
    if (target.classList.contains('collapsed')) {
      var toggle = target.querySelector('.collapse-toggle');
      if (toggle) toggle.click();
      else target.classList.remove('collapsed');
    }

    target.style.display = 'block';
    target.style.outline = '2px solid var(--accent)';
    target.style.outlineOffset = '2px';
    setTimeout(function() {
      target.style.outline = '';
      target.style.outlineOffset = '';
    }, 2500);
    setTimeout(function() {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  }

  // ---- Convenience: run widthExtension + relayout + resize hook ----
  function finalize(gitgraph, template) {
    var relayoutTimer = null;
    function scheduleRelayout(delay) {
      var ms = typeof delay === 'number' ? delay : 80;
      clearTimeout(relayoutTimer);
      relayoutTimer = setTimeout(function() {
        // Pass 1: ensure panel widths are up to date before measuring heights.
        relayoutPanels(gitgraph);
        // Pass 2: recompute commit Y with measured panel heights.
        recalculateYPositions(gitgraph);
        // Pass 3: apply final panel positions from updated Y values.
        relayoutPanels(gitgraph);
        lockSectionMinHeight(gitgraph);
      }, ms);
    }

    // On mobile, bump marginY so the first commit title isn't clipped
    if (isMobile) {
      gitgraph.marginY = (gitgraph.marginY || 0) + 16;
      gitgraph.render();
    }

    applyWidthExtension(gitgraph, template);
    tintPanels(gitgraph);   // expose each panel's branch colour as --branch
    hookResize(gitgraph);
    lockSectionMinHeight(gitgraph);
    initCollapsiblePanels();
    handleAnchor();
    watchTheme(gitgraph);

    // Expose instance so async content (repo cards) can trigger relayout
    window._gitgraphInstance = gitgraph;

    // One early reflow pass after initial paint
    requestAnimationFrame(function() {
      scheduleRelayout(30);
    });

    // Re-layout after web fonts finish loading (fixes first-load sizing)
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function() {
        scheduleRelayout(40);
      });
    }

    // MutationObserver: re-layout on style/content changes (open/close panels,
    // injected widgets, text updates), debounced for performance.
    if (typeof MutationObserver !== 'undefined') {
      var observer = new MutationObserver(function() {
        scheduleRelayout(70);
      });
      var panels = document.querySelectorAll('.gitgraph-detail');
      for (var p = 0; p < panels.length; p++) {
        observer.observe(panels[p], {
          attributes: true,
          attributeFilter: ['style', 'class'],
          childList: true,
          subtree: true,
          characterData: true
        });
      }
    }

    // ResizeObserver: track panel size changes (line wraps, image loads, widget
    // hydration) and keep stacking non-overlapping.
    if (typeof ResizeObserver !== 'undefined') {
      var ro = new ResizeObserver(function() {
        scheduleRelayout(60);
      });
      var observedPanels = document.querySelectorAll('.gitgraph-detail');
      for (var rp = 0; rp < observedPanels.length; rp++) {
        ro.observe(observedPanels[rp]);
      }
    }
  }

  // ---- Public API ----
  return {
    isMobile:           isMobile,
    isTablet:           isTablet,
    isLightTheme:       isLightTheme,
    palette:            palette,
    defaultColors:      defaultColors,
    createColorCycler:  createColorCycler,
    createTemplate:     createTemplate,
    mergeFont:          mergeFont,
    mergeColor:         mergeColor,
    label:              label,
    applyWidthExtension: applyWidthExtension,
    recalculateYPositions: recalculateYPositions,
    relayoutPanels:     relayoutPanels,
    lockSectionMinHeight: lockSectionMinHeight,
    hookResize:         hookResize,
    finalize:           finalize
  };

})();
