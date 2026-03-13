(function () {
  if (window.SharedRelatedWork) return;

  var DEFAULT_SOURCE = '/assets/shared/related-work.json';
  var LOCAL_JEKYLL_SOURCE = 'http://127.0.0.1:4000/assets/shared/related-work.json';
  var FALLBACK_SOURCE = 'https://enheragu.github.io/assets/shared/related-work.json';
  var EMPTY_DATASET = { tools: {}, publications: [] };

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function resolveLang(options) {
    if (options && (options.lang === 'en' || options.lang === 'es')) return options.lang;
    var docLang = (document.documentElement.lang || '').toLowerCase();
    if (docLang.startsWith('es')) return 'es';
    return 'en';
  }

  function pickLangText(multilang, lang, fallback) {
    if (!multilang || typeof multilang !== 'object') return fallback || '';
    if (typeof multilang[lang] === 'string' && multilang[lang].trim()) return multilang[lang];
    if (typeof multilang.en === 'string' && multilang.en.trim()) return multilang.en;
    if (typeof multilang.es === 'string' && multilang.es.trim()) return multilang.es;
    return fallback || '';
  }

  function fetchJson(url) {
    return fetch(url).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
  }

  function candidateSources(sourceUrl) {
    var sources = [];
    var primary = sourceUrl || DEFAULT_SOURCE;
    sources.push(primary);

    var isLocalHost = /^(127\.0\.0\.1|localhost)$/.test(window.location.hostname || '');
    var notJekyllPort = String(window.location.port || '') !== '4000';
    if (isLocalHost && notJekyllPort && primary !== LOCAL_JEKYLL_SOURCE) {
      sources.push(LOCAL_JEKYLL_SOURCE);
    }

    if (primary !== FALLBACK_SOURCE) {
      sources.push(FALLBACK_SOURCE);
    }
    return sources;
  }

  function loadDataset(sourceUrl) {
    var sources = candidateSources(sourceUrl);
    var index = 0;

    function attempt() {
      if (index >= sources.length) {
        throw new Error('Could not load related-work dataset');
      }
      var current = sources[index++];
      return fetchJson(current).catch(attempt);
    }

    return attempt();
  }

  function normalizeDataset(data) {
    if (data && data.tools && typeof data.tools === 'object') {
      return data;
    }
    if (data && typeof data === 'object') {
      return { tools: data, publications: [] };
    }
    return { tools: {}, publications: [] };
  }

  function buildPublicationIndex(categories) {
    var index = {};
    (Array.isArray(categories) ? categories : []).forEach(function (category) {
      (category && Array.isArray(category.entries) ? category.entries : []).forEach(function (entry) {
        if (entry && entry.key) {
          index[entry.key] = {
            category: category.category || '',
            entry: entry,
          };
        }
      });
    });
    return index;
  }

  function renderPublicationItem(pub) {
    var category = escapeHtml(pub.category || 'Work');
    var entry = pub.entry || {};
    var authors = Array.isArray(entry.authors) ? entry.authors.join(', ') : '';
    var authorsHtml = authors
      ? '<cite><small>' + escapeHtml(authors) + '. </small></cite>'
      : '';
    var yearTitle = (entry.year ? '(' + escapeHtml(entry.year) + '). ' : '') + escapeHtml(entry.title || 'Untitled publication');
    var venueHtml = entry.venue ? ' <em>' + escapeHtml(entry.venue) + '</em>.' : '';
    var linkHtml = entry.url
      ? ' <a class="related-work-inline-link" href="' + escapeHtml(entry.url) + '" target="_blank" rel="noopener noreferrer">[link]</a>'
      : '';

    return '' +
      '<li class="related-work-item related-work-item-pub">' +
      '<span class="related-work-type-badge">' + category + '</span>' +
      authorsHtml + 
      '<strong>' + yearTitle + '</strong>.' +
      venueHtml +
      linkHtml +
      '</li>';
  }

  function render(container, toolId, options) {
    var rawData = options && options.data;
    var data = normalizeDataset(rawData);
    var lang = resolveLang(options || {});
    var tools = data && data.tools;
    var item = tools && tools[toolId];

    if (!item || typeof item !== 'object') {
      container.innerHTML = '';
      return;
    }

    var title = pickLangText(item.title, lang, 'Related Work');
    var links = Array.isArray(item.links) ? item.links : [];
    var publicationKeys = Array.isArray(item.publication_keys) ? item.publication_keys : [];
    var publicationIndex = buildPublicationIndex(data.publications);
    var publications = publicationKeys
      .map(function (key) { return publicationIndex[key]; })
      .filter(Boolean);

    if (!links.length && !publications.length) {
      container.innerHTML = '';
      return;
    }

    var heading = '<h3 class="related-work-title">' + escapeHtml(title) + '</h3>';
    var list = links.map(function (entry) {
      var label = escapeHtml(entry && entry.label ? entry.label : 'Related link');
      var url = escapeHtml(entry && entry.url ? entry.url : '#');
      var desc = pickLangText(entry && entry.description, lang, '');
      var descHtml = desc ? '<span class="related-work-link-desc"> — ' + escapeHtml(desc) + '</span>' : '';
      return '<li class="related-work-item related-work-item-link"><a class="related-work-link" href="' + url + '" target="_blank" rel="noopener noreferrer">' + label + '</a>' + descHtml + '</li>';
    }).join('');

    var relatedLinksTitle = lang === 'es' ? 'Otros recursos' : 'Other resources';
    var relatedPubsTitle = lang === 'es' ? 'Trabajos académicos' : 'Academic work';

    var linksSection = links.length
      ? '<h4 class="related-work-subtitle">' + relatedLinksTitle + '</h4><ul class="related-work-list">' + list + '</ul>'
      : '';

    var pubsSection = publications.length
      ? '<h4 class="related-work-subtitle">' + relatedPubsTitle + '</h4><ul class="related-work-list related-work-list-pubs">' + publications.map(renderPublicationItem).join('') + '</ul>'
      : '';

    container.innerHTML = '<section class="related-work-block">' + heading + pubsSection + linksSection + '</section>';
  }

  function init(params) {
    var options = params || {};
    var container = options.container;
    var toolId = options.toolId;
    var fallbackData = normalizeDataset(options.fallbackData || EMPTY_DATASET);

    if (!container || !toolId) {
      throw new Error('SharedRelatedWork.init requires { container, toolId }');
    }

    return loadDataset(options.sourceUrl)
      .then(function (data) {
        render(container, toolId, {
          data: data,
          lang: options.lang,
        });
        return data;
      })
      .catch(function () {
        render(container, toolId, {
          data: fallbackData,
          lang: options.lang,
        });
      });
  }

  window.SharedRelatedWork = {
    init: init,
    render: render,
    loadDataset: loadDataset,
  };
})();
