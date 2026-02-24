// =====================================================================
// gitgraph-common.js  —  Shared helpers for all gitgraph pages
// Must be loaded AFTER gitgraph.1.0.0.min.js and BEFORE page-specific JS
// =====================================================================

var GitGraphCommon = (function() {

  // ---- Responsive detection ----
  var screenWidth = window.innerWidth;
  var isMobile  = screenWidth <= 768;
  var isTablet  = !isMobile && screenWidth <= 1200;

  // ---- Shared color palette ----
  var defaultColors = [
    "#6e7681", "#58a6ff", "#d29922", "#3fb950", "#f85149",
    "#bc8cff", "#58a6ff", "#d29922", "#3fb950", "#f85149",
    "#bc8cff", "#58a6ff", "#d29922", "#3fb950", "#f85149"
  ];

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
          font: isMobile ? "bold 11px 'Inter', sans-serif"
              : (isTablet ? "bold 12px 'Inter', sans-serif"
              : "bold 13px 'Inter', sans-serif"),
          displayBranch: false,
          displayHash: false,
          displayAuthor: false
        },
        tag: {
          font: isMobile ? "bold 10px 'Inter', sans-serif"
              : (isTablet ? "bold 11px 'Inter', sans-serif"
              : "bold 13px 'Inter', sans-serif")
        }
      }
    });
  }

  // ---- Merge style constants ----
  var mergeFont  = "italic 11px 'Inter', sans-serif";
  var mergeColor = "#6e7681";

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
    var DETAIL_BUFFER = 40; // must match engine's detailSpace buffer

    // Sort commits by y (ascending = top to bottom)
    var sorted = commits.slice().sort(function(a, b) { return a.y - b.y; });

    // Save original y values
    var originals = [];
    for (var i = 0; i < sorted.length; i++) {
      originals.push(sorted[i].y);
    }

    // Walk through and push commits down if previous panel grew
    var changed = false;
    for (var i = 1; i < sorted.length; i++) {
      var prev = sorted[i - 1];
      var curr = sorted[i];

      var minY;
      if (prev.detail) {
        var panelH = measurePanelHeight(prev.detail);
        // The panel bottom is at prev.y + OFFSET_TOP + panelH (CSS).
        // But in canvas space, commit.y is the dot centre. The engine
        // reserved |spacingY| + (clientHeight + BUFFER). We need
        // commit-to-commit distance >= panelH + DETAIL_BUFFER + absSpacingY
        // to avoid the next commit label sitting inside the panel.
        minY = prev.y + panelH + DETAIL_BUFFER;
      } else {
        minY = prev.y + absSpacingY;
      }

      // Ensure at least absSpacingY between any two commits
      minY = Math.max(minY, prev.y + absSpacingY);

      if (curr.y < minY) {
        var delta = minY - curr.y;
        // Push this commit and all subsequent ones down by delta
        for (var j = i; j < sorted.length; j++) {
          sorted[j].y += delta;
        }
        changed = true;
      }
    }

    if (!changed) return;

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
        branch.startPoint.y = mapY(branch.startPoint.y);
      }
    }

    // Update commitOffsetY for canvas sizing
    var lastY = sorted[sorted.length - 1].y;
    if (sorted[sorted.length - 1].detail) {
      lastY += measurePanelHeight(sorted[sorted.length - 1].detail) + DETAIL_BUFFER;
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
    var sf = gitgraph.scalingFactor || 1;
    var cssMarginX = gitgraph.marginX / sf;
    var cssMarginY = gitgraph.marginY / sf;
    // Distance from commit dot centre to panel top edge.
    // Smaller on mobile so titles stay closer to their panels.
    var OFFSET_TOP = isMobile ? 20 : 30;
    var GAP = isMobile ? 12 : 20;
    var prevBottom = 0;
    var maxBottom = 0;

    // Read CSS 'right' from first visible panel
    var cssRight = 0;
    for (var k = 0; k < commits.length; k++) {
      if (commits[k].detail) {
        cssRight = parseFloat(window.getComputedStyle(commits[k].detail).right) || 0;
        break;
      }
    }

    for (var i = 0; i < commits.length; i++) {
      var c = commits[i];
      if (!c.detail) continue;

      // Left: just past the commit dot
      var left = canvas.offsetLeft + cssMarginX + c.x + c.dotSize + 20;
      c.detail.style.left = left + "px";

      // Width: fill available space
      var availW = section.clientWidth - left - cssRight;
      if (availW > 50) c.detail.style.width = availW + "px";

      // Top: aligned with commit dot, push down if overlapping previous
      var idealTop = canvas.offsetTop + cssMarginY + c.y + OFFSET_TOP;
      if (prevBottom > 0 && idealTop < prevBottom + GAP) {
        idealTop = prevBottom + GAP;
      }
      c.detail.style.top = idealTop + "px";

      // Track bottom for next overlap check
      var panelHeight = measurePanelHeight(c.detail);
      prevBottom = idealTop + panelHeight;
      if (prevBottom > maxBottom) maxBottom = prevBottom;
    }

    // Ensure section is tall enough
    var needed = Math.max(maxBottom, canvas.offsetTop + canvas.clientHeight);
    if (needed + 40 > section.clientHeight) {
      section.style.minHeight = (needed + 40) + "px";
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

  // ---- Handle anchor link: scroll to & highlight targeted panel ----
  function handleAnchor() {
    var hash = window.location.hash;
    if (!hash) return;
    var target = document.querySelector(hash);
    if (!target || !target.classList.contains('gitgraph-detail')) return;

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
    // On mobile, bump marginY so the first commit title isn't clipped
    if (isMobile) {
      gitgraph.marginY = (gitgraph.marginY || 0) + 16;
      gitgraph.render();
    }

    applyWidthExtension(gitgraph, template);
    hookResize(gitgraph);
    handleAnchor();

    // Expose instance so async content (repo cards) can trigger relayout
    window._gitgraphInstance = gitgraph;

    // Delayed re-layouts for async content (repo cards, font swap)
    var delays = [200, 600, 1500, 3000];
    for (var d = 0; d < delays.length; d++) {
      (function(ms) {
        setTimeout(function() {
          recalculateYPositions(gitgraph);
          relayoutPanels(gitgraph);
        }, ms);
      })(delays[d]);
    }

    // Re-layout after web fonts finish loading (fixes first-load sizing)
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function() {
        recalculateYPositions(gitgraph);
        relayoutPanels(gitgraph);
      });
    }

    // MutationObserver: re-layout when panel children change (async loads)
    if (typeof MutationObserver !== 'undefined') {
      var _relayoutTimer = null;
      var observer = new MutationObserver(function() {
        clearTimeout(_relayoutTimer);
        _relayoutTimer = setTimeout(function() {
          recalculateYPositions(gitgraph);
          relayoutPanels(gitgraph);
        }, 100);
      });
      var panels = document.querySelectorAll('.gitgraph-detail');
      for (var p = 0; p < panels.length; p++) {
        observer.observe(panels[p], { childList: true, subtree: true, characterData: true });
      }
    }
  }

  // ---- Public API ----
  return {
    isMobile:           isMobile,
    isTablet:           isTablet,
    defaultColors:      defaultColors,
    createColorCycler:  createColorCycler,
    createTemplate:     createTemplate,
    mergeFont:          mergeFont,
    mergeColor:         mergeColor,
    applyWidthExtension: applyWidthExtension,
    recalculateYPositions: recalculateYPositions,
    relayoutPanels:     relayoutPanels,
    hookResize:         hookResize,
    finalize:           finalize
  };

})();
