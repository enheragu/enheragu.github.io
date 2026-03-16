(function () {
  function initHamburgerMenu() {
    var btn = document.getElementById('hamburgerBtn');
    var menu = document.getElementById('navMenu');
    var overlay = document.getElementById('navOverlay');
    if (!btn || !menu || !overlay) return;

    btn.addEventListener('click', function () {
      menu.classList.toggle('open');
      overlay.classList.toggle('open');
      btn.classList.toggle('open');
    });

    overlay.addEventListener('click', function () {
      menu.classList.remove('open');
      overlay.classList.remove('open');
      btn.classList.remove('open');
    });

    var path = window.location.pathname;
    var links = menu.querySelectorAll('a');
    for (var index = 0; index < links.length; index++) {
      var href = links[index].getAttribute('href');
      if (href === '/') {
        if (path === '/' || path === '/index.html') links[index].classList.add('active');
      } else if (path.indexOf(href.replace(/\/$/, '')) === 0) {
        links[index].classList.add('active');
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHamburgerMenu);
  } else {
    initHamburgerMenu();
  }
})();
