// ===== Gallery Lightbox with Arrow Navigation =====

var allGalleryItems = [];
var currentLightboxIndex = -1;
var lightboxImageCache = Object.create(null);

function isTruthyData(value) {
  var v = String(value || '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

function preloadLightboxImage(src) {
  if (!src || lightboxImageCache[src]) return;
  var pre = new Image();
  pre.src = src;
  lightboxImageCache[src] = pre;
}

function preloadAdjacentLightboxImages(idx) {
  if (!allGalleryItems.length) return;
  var prev = (idx - 1 + allGalleryItems.length) % allGalleryItems.length;
  var next = (idx + 1) % allGalleryItems.length;
  [prev, next].forEach(function(i) {
    var item = allGalleryItems[i];
    if (!item) return;
    preloadLightboxImage(item.getAttribute('data-src') || '');
  });
}

function classifyGalleryItem(item) {
  var img = item ? item.querySelector('img') : null;
  if (!img) return;

  var layoutHint = (item.getAttribute('data-layout') || '').trim().toLowerCase();
  var forceWide = isTruthyData(item.getAttribute('data-wide'));
  var forceTall = isTruthyData(item.getAttribute('data-tall'));

  function applyClass() {
    var w = Number(img.naturalWidth || img.width || 0);
    var h = Number(img.naturalHeight || img.height || 0);

    var autoWide = false;
    if (w && h) {
      var ratio = w / h;
      autoWide = ratio >= 1.95;
    }

    var useWide = false;
    var useTall = false;
    if (layoutHint === 'normal' || layoutHint === 'none') {
      useWide = false;
      useTall = false;
    } else if (layoutHint === 'wide') useWide = true;
    else if (layoutHint === 'tall') useTall = true;
    else if (forceWide) useWide = true;
    else if (forceTall) useTall = true;
    else {
      useWide = autoWide;
      useTall = false;
    }

    // Prevent sparse endings: tall items look odd when there are no following tiles.
    if (useTall && !item.nextElementSibling) useTall = false;

    item.classList.toggle('gallery-item--wide', useWide);
    item.classList.toggle('gallery-item--tall', useTall);
  }

  if (img.complete) applyClass();
  else img.addEventListener('load', applyClass, { once: true });
}

// Collect all gallery-item elements for sequential navigation
function collectGalleryItems() {
  allGalleryItems = Array.prototype.slice.call(
    document.querySelectorAll('.gallery-item')
  );

  // Wire up click handlers using data attributes
  allGalleryItems.forEach(function(item, idx) {
    classifyGalleryItem(item);
    if (item.dataset.lightboxBound !== '1') {
      item.addEventListener('click', function() {
        openLightboxByIndex(idx);
      });
      item.dataset.lightboxBound = '1';
    }
  });
}

function openLightboxByIndex(idx) {
  if (idx < 0 || idx >= allGalleryItems.length) return;
  currentLightboxIndex = idx;
  var item = allGalleryItems[idx];

  var src    = item.getAttribute('data-src')    || '';
  var text   = item.getAttribute('data-text')   || '';
  var author = item.getAttribute('data-author') || '';
  var camera = item.getAttribute('data-camera') || '';
  var date   = item.getAttribute('data-date')   || '';

  var lb      = document.getElementById('lightbox');
  var img     = document.getElementById('lightbox-img');
  var caption = document.getElementById('lightbox-caption');
  var counter = document.getElementById('lightbox-counter');

  // Clear previous image immediately to avoid showing stale content while loading.
  img.style.visibility = 'hidden';
  img.style.opacity = '0';
  img.removeAttribute('src');
  img.alt = '';

  var parts = [text];
  var meta = [];
  if (author && author.trim()) meta.push(author.trim());
  if (camera && camera.trim()) meta.push(camera.trim());
  if (date && date.trim())     meta.push(date.trim());
  if (meta.length) parts.push('<br><small>' + meta.join(' · ') + '</small>');

  caption.innerHTML = parts.join('');
  if (counter) {
    counter.textContent = (idx + 1) + ' / ' + allGalleryItems.length;
  }

  lb.classList.add('active');
  lb.classList.add('is-loading');
  document.body.style.overflow = 'hidden';

  var loader = new Image();
  loader.decoding = 'async';
  loader.onload = function() {
    if (currentLightboxIndex !== idx) return;
    img.alt = text;
    img.src = src;
    img.style.visibility = '';
    img.style.opacity = '';
    lb.classList.remove('is-loading');
    preloadAdjacentLightboxImages(idx);
  };
  loader.onerror = function() {
    if (currentLightboxIndex !== idx) return;
    img.alt = text;
    img.src = src;
    img.style.visibility = '';
    img.style.opacity = '';
    lb.classList.remove('is-loading');
  };
  loader.src = src;
}

function navigateLightbox(direction) {
  if (allGalleryItems.length === 0) return;
  var next = currentLightboxIndex + direction;
  // Wrap around
  if (next < 0) next = allGalleryItems.length - 1;
  if (next >= allGalleryItems.length) next = 0;
  openLightboxByIndex(next);
}

function closeLightbox(e) {
  // Only close if clicking overlay or close button, not the image/nav
  if (e && (e.target.id === 'lightbox-img' ||
            e.target.classList.contains('lightbox-nav'))) return;
  var lb = document.getElementById('lightbox');
  var img = document.getElementById('lightbox-img');
  lb.classList.remove('active');
  lb.classList.remove('is-loading');
  if (img) {
    img.style.visibility = '';
    img.style.opacity = '';
    img.removeAttribute('src');
    img.alt = '';
  }
  document.body.style.overflow = '';
  currentLightboxIndex = -1;
}

// Keyboard navigation
document.addEventListener('keydown', function(e) {
  var lb = document.getElementById('lightbox');
  if (!lb || !lb.classList.contains('active')) return;

  if (e.key === 'Escape')     closeLightbox();
  if (e.key === 'ArrowLeft')  navigateLightbox(-1);
  if (e.key === 'ArrowRight') navigateLightbox(1);
});

// Collect items once DOM is ready (called again from gallery-graph.js after layout)
document.addEventListener('DOMContentLoaded', collectGalleryItems);