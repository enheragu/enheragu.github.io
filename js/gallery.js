// ===== Gallery Lightbox with Arrow Navigation =====

var allGalleryItems = [];
var currentLightboxIndex = -1;

// Collect all gallery-item elements for sequential navigation
function collectGalleryItems() {
  allGalleryItems = Array.prototype.slice.call(
    document.querySelectorAll('.gallery-item')
  );

  // Wire up click handlers using data attributes
  allGalleryItems.forEach(function(item, idx) {
    item.addEventListener('click', function() {
      openLightboxByIndex(idx);
    });
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

  img.src = src;
  img.alt = text;

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
  document.body.style.overflow = 'hidden';
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
  lb.classList.remove('active');
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