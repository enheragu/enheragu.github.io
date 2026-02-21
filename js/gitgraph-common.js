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

  // ---- relayoutPanels: single post-render truth for panel positions ----
  function relayoutPanels(gitgraph) {
    var canvas = document.getElementById("gitGraph");
    if (!canvas) return;
    var section = canvas.closest("section");
    if (!section) return;

    var commits = gitgraph.commits;
    var sf = gitgraph.scalingFactor || 1;
    var cssMarginX = gitgraph.marginX / sf;
    var cssMarginY = gitgraph.marginY / sf;
    var OFFSET_TOP = 30;
    var GAP = 15;
    var prevBottom = 0;

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

      // Top: aligned with commit dot, avoiding overlap
      var idealTop = canvas.offsetTop + cssMarginY + c.y + OFFSET_TOP;
      if (prevBottom > 0 && idealTop < prevBottom + GAP) {
        idealTop = prevBottom + GAP;
      }
      c.detail.style.top = idealTop + "px";

      // Force reflow for accurate height
      void c.detail.offsetHeight;
      prevBottom = idealTop + c.detail.clientHeight;
    }

    // Ensure section accommodates all panels
    if (prevBottom > section.scrollHeight) {
      section.style.minHeight = (prevBottom + 40) + "px";
    }
  }

  // ---- Wire up relayout to run after gitgraph's own resize handler ----
  function hookResize(gitgraph) {
    relayoutPanels(gitgraph);
    var _origOnResize = window.onresize;
    window.onresize = function() {
      if (_origOnResize) _origOnResize.call(window);
      relayoutPanels(gitgraph);
    };
  }

  // ---- Handle anchor link: scroll to & highlight targeted panel ----
  function handleAnchor() {
    var hash = window.location.hash;
    if (!hash) return;
    var target = document.querySelector(hash);
    if (!target || !target.classList.contains('gitgraph-detail')) return;

    // Show the panel
    target.style.display = 'block';

    // Brief highlight effect
    target.style.outline = '2px solid var(--accent)';
    target.style.outlineOffset = '2px';
    setTimeout(function() {
      target.style.outline = '';
      target.style.outlineOffset = '';
    }, 2500);

    // Scroll into view after layout settles
    setTimeout(function() {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  }

  // ---- Convenience: run widthExtension + relayout + resize hook ----
  function finalize(gitgraph, template) {
    applyWidthExtension(gitgraph, template);
    hookResize(gitgraph);
    handleAnchor();
    // Expose instance so async content (repo cards) can trigger relayout
    window._gitgraphInstance = gitgraph;
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
    relayoutPanels:     relayoutPanels,
    hookResize:         hookResize,
    finalize:           finalize
  };

})();
