(function () {
  function detectLang() {
    var htmlLang = (document.documentElement.getAttribute('lang') || '').toLowerCase();
    return htmlLang.startsWith('es') ? 'es' : 'en';
  }

  function init() {
    if (!window.SharedPublicationUI) return;
    window.SharedPublicationUI.hydratePlaceholders(document, {
      lang: detectLang(),
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
