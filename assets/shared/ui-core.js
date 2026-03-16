(function () {
  if (window.SharedUiCore) return;

  function getPreferredTheme() {
    var saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  function readLangFromUrl(fallback) {
    var params = new URLSearchParams(window.location.search || '');
    var lang = (params.get('lang') || '').toLowerCase();
    if (lang === 'en' || lang === 'es') return lang;
    return fallback === 'es' ? 'es' : 'en';
  }

  function syncLangInUrl(lang) {
    var normalized = lang === 'es' ? 'es' : 'en';
    var url = new URL(window.location.href);
    url.searchParams.set('lang', normalized);
    window.history.replaceState({}, '', url.toString());
  }

  function applyBodyTheme(theme) {
    var isDark = theme === 'dark';
    document.body.classList.toggle('dark', isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }

  function toggleThemeValue(theme) {
    return theme === 'dark' ? 'light' : 'dark';
  }

  function animateThemeButton(button, duration) {
    if (!button) return;
    var ms = Number.isFinite(duration) ? duration : 280;
    button.classList.remove('is-animating');
    void button.offsetWidth;
    button.classList.add('is-animating');
    window.setTimeout(function () {
      button.classList.remove('is-animating');
    }, ms);
  }

  function bindHeaderControls(config) {
    var opts = config || {};
    var themeButton = document.getElementById(opts.themeButtonId || 'btn-theme');
    var langSwitcher = document.querySelector(opts.langSwitcherSelector || '.lang-switcher');

    if (themeButton && typeof opts.onToggleTheme === 'function') {
      themeButton.addEventListener('click', opts.onToggleTheme);
    }

    if (langSwitcher && typeof opts.onToggleLang === 'function') {
      langSwitcher.addEventListener('click', opts.onToggleLang);
    }
  }

  window.SharedUiCore = {
    getPreferredTheme: getPreferredTheme,
    readLangFromUrl: readLangFromUrl,
    syncLangInUrl: syncLangInUrl,
    applyBodyTheme: applyBodyTheme,
    toggleThemeValue: toggleThemeValue,
    animateThemeButton: animateThemeButton,
    bindHeaderControls: bindHeaderControls,
  };
})();
