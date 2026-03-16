(function () {
  if (window.SharedRelatedWork) return;

  var DEFAULT_SOURCE = '/assets/shared/related-work.json';
  var LOCAL_JEKYLL_SOURCE = 'http://127.0.0.1:4000/assets/shared/related-work.json';
  var FALLBACK_SOURCE = 'https://enheragu.github.io/assets/shared/related-work.json';
  var DEFAULT_PUBLICATIONS_SOURCE = 'https://raw.githubusercontent.com/enheragu/enheragu.github.io/main/_data/publications.yml';
  var LOCAL_PUBLICATIONS_SOURCE = '/enheragu_github_web_cv/_data/publications.yml';
  var JEKYLL_PUBLICATIONS_SOURCE = 'http://127.0.0.1:4000/_data/publications.yml';
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

  function fetchText(url) {
    return fetch(url).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.text();
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

    if (!isLocalHost && primary !== FALLBACK_SOURCE) {
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

  function candidatePublicationSources(sourceUrl) {
    var sources = [];
    if (sourceUrl) sources.push(sourceUrl);

    var isLocalHost = /^(127\.0\.0\.1|localhost)$/.test(window.location.hostname || '');
    if (isLocalHost) {
      sources.push(LOCAL_PUBLICATIONS_SOURCE);
      sources.push(JEKYLL_PUBLICATIONS_SOURCE);
    }
    sources.push(DEFAULT_PUBLICATIONS_SOURCE);

    return sources.filter(function (value, index, self) {
      return value && self.indexOf(value) === index;
    });
  }

  function parseScalar(value) {
    var text = String(value == null ? '' : value).trim();
    if (!text) return '';
    if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
      return text.slice(1, -1);
    }
    if (/^-?\d+$/.test(text)) return Number(text);
    return text;
  }

  function parsePublicationsYaml(yamlText) {
    var categories = [];
    var currentCategory = null;
    var currentEntry = null;
    var inAuthors = false;
    var lines = String(yamlText || '').split(/\r?\n/);

    lines.forEach(function (line) {
      if (!line || !line.trim()) return;
      var indent = (line.match(/^\s*/) || [''])[0].length;
      var trimmed = line.trim();

      if (indent === 0 && /^-\s+category:/.test(trimmed)) {
        currentCategory = {
          category: parseScalar(trimmed.replace(/^-\s+category:\s*/, '')),
          entries: [],
        };
        categories.push(currentCategory);
        currentEntry = null;
        inAuthors = false;
        return;
      }

      if (!currentCategory) return;

      if (indent === 4 && /^-\s+key:/.test(trimmed)) {
        currentEntry = {
          key: parseScalar(trimmed.replace(/^-\s+key:\s*/, '')),
        };
        currentCategory.entries.push(currentEntry);
        inAuthors = false;
        return;
      }

      if (!currentEntry) return;

      if (indent === 6 && /^authors:\s*$/.test(trimmed)) {
        currentEntry.authors = [];
        inAuthors = true;
        return;
      }

      if (inAuthors && indent === 8 && /^-\s+/.test(trimmed)) {
        currentEntry.authors.push(parseScalar(trimmed.replace(/^-\s+/, '')));
        return;
      }

      if (indent === 6 && /^([a-zA-Z0-9_]+):/.test(trimmed)) {
        var splitIndex = trimmed.indexOf(':');
        var field = trimmed.slice(0, splitIndex).trim();
        var value = parseScalar(trimmed.slice(splitIndex + 1));
        currentEntry[field] = value;
        inAuthors = false;
        return;
      }

      if (indent <= 6) inAuthors = false;
    });

    return categories;
  }

  function loadPublicationsFromYaml(sourceUrl) {
    var sources = candidatePublicationSources(sourceUrl);
    var index = 0;

    function attempt() {
      if (index >= sources.length) {
        return Promise.resolve([]);
      }
      var current = sources[index++];
      return fetchText(current)
        .then(parsePublicationsYaml)
        .catch(attempt);
    }

    return attempt();
  }

  function normalizeDataset(data) {
    if (data && data.tools && typeof data.tools === 'object') {
      if (!data.global || typeof data.global !== 'object') data.global = {};
      if (!data.categories || typeof data.categories !== 'object') data.categories = {};
      if (!Array.isArray(data.publications)) data.publications = [];
      return data;
    }
    if (data && typeof data === 'object') {
      return { global: {}, categories: {}, tools: data, publications: [] };
    }
    return { global: {}, categories: {}, tools: {}, publications: [] };
  }

  function shallowMerge(base, override) {
    var result = {};
    if (base && typeof base === 'object') {
      Object.keys(base).forEach(function (key) {
        result[key] = base[key];
      });
    }
    if (override && typeof override === 'object') {
      Object.keys(override).forEach(function (key) {
        result[key] = override[key];
      });
    }
    return result;
  }

  function mergeSupport(base, override) {
    var merged = shallowMerge(base || {}, override || {});
    merged.title = shallowMerge((base && base.title) || {}, (override && override.title) || {});
    merged.repo = shallowMerge((base && base.repo) || {}, (override && override.repo) || {});
    merged.citation = shallowMerge((base && base.citation) || {}, (override && override.citation) || {});
    return merged;
  }

  function resolveItem(data, toolId) {
    var tools = data && data.tools;
    var categories = data && data.categories;
    var global = (data && data.global) || {};
    var tool = tools && tools[toolId];
    if (!tool || typeof tool !== 'object') return null;

    var categoryId = tool.category_id || tool.category || '';
    var category = (categoryId && categories && categories[categoryId]) || {};

    var resolved = {
      title: shallowMerge(global.title || {}, category.title || {}),
      links: []
        .concat(Array.isArray(global.links) ? global.links : [])
        .concat(Array.isArray(category.links) ? category.links : [])
        .concat(Array.isArray(tool.links) ? tool.links : []),
      publication_keys: []
        .concat(Array.isArray(global.publication_keys) ? global.publication_keys : [])
        .concat(Array.isArray(category.publication_keys) ? category.publication_keys : [])
        .concat(Array.isArray(tool.publication_keys) ? tool.publication_keys : []),
      support: mergeSupport(mergeSupport(global.support || {}, category.support || {}), tool.support || {}),
    };

    if (tool.title && typeof tool.title === 'object') {
      resolved.title = shallowMerge(resolved.title, tool.title);
    }

    return resolved;
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

  function renderPublicationActions(entry, lang) {
    if (window.SharedPublicationUI && typeof window.SharedPublicationUI.renderActions === 'function') {
      return window.SharedPublicationUI.renderActions(entry, {
        lang: lang,
        variant: 'related',
      });
    }

    var links = [];
    if (entry.url) {
      links.push('<a class="related-work-inline-link" href="' + escapeHtml(entry.url) + '" target="_blank" rel="noopener noreferrer">[link]</a>');
    }
    if (entry.doi) {
      var doiHref = /^https?:\/\//i.test(String(entry.doi)) ? String(entry.doi) : ('https://doi.org/' + String(entry.doi));
      links.push('<a class="related-work-inline-link" href="' + escapeHtml(doiHref) + '" target="_blank" rel="noopener noreferrer">[doi]</a>');
    }
    var linkHtml = links.length ? (' ' + links.join(' ')) : '';
    return linkHtml;
  }

  function renderPublicationItem(pub, lang) {
    var locale = (lang === 'es') ? 'es' : 'en';
    var category = escapeHtml(pub.category || (locale === 'es' ? 'Trabajo' : 'Work'));
    var entry = pub.entry || {};
    var authors = Array.isArray(entry.authors) ? entry.authors.join(', ') : '';
    var authorsHtml = authors
      ? '<cite><small>' + escapeHtml(authors) + '. </small></cite>'
      : '';
    var yearTitle = (entry.year ? '(' + escapeHtml(entry.year) + '). ' : '') + escapeHtml(entry.title || 'Untitled publication');
    var venueHtml = entry.venue ? ' <em>' + escapeHtml(entry.venue) + '</em>.' : '';
    var actionsHtml = renderPublicationActions(entry, locale);

    return '' +
      '<li class="related-work-item related-work-item-pub">' +
      '<span class="related-work-type-badge">' + category + '</span>' +
      authorsHtml +
      '<strong>' + yearTitle + '</strong>.' +
      venueHtml +
      actionsHtml +
      '</li>';
  }

  function renderSupportPublicationItem(pub, lang) {
    var locale = (lang === 'es') ? 'es' : 'en';
    var entry = pub.entry || {};
    var category = escapeHtml(pub.category || (locale === 'es' ? 'Trabajo' : 'Work'));
    var authors = Array.isArray(entry.authors) ? entry.authors.join(', ') : '';
    var authorsHtml = authors
      ? '<cite><small>' + escapeHtml(authors) + '. </small></cite>'
      : '';
    var title = escapeHtml(entry.title || 'Untitled work');
    var yearPrefix = entry.year ? ('(' + escapeHtml(entry.year) + ') ') : '';
    var versionHtml = entry.version
      ? (' <small class="related-work-meta">' + (locale === 'es' ? 'Versión ' : 'Version ') + escapeHtml(String(entry.version)) + '</small>')
      : '';
    var actionsHtml = renderPublicationActions(entry, locale);

    return '' +
      '<li class="related-work-item related-work-item-pub related-work-item-cite">' +
      '<span class="related-work-type-badge">' + category + '</span>' +
      authorsHtml +
      '<strong>' + yearPrefix + title + '</strong>' +
      versionHtml +
      actionsHtml +
      '</li>';
  }

  function renderIntroWithRepoLink(template, repoUrl, repoText) {
    var safeTemplate = escapeHtml(template || '');
    var safeRepoText = escapeHtml(repoText || 'repository');
    var repoAnchor = repoUrl
      ? '<a class="related-work-link" href="' + escapeHtml(repoUrl) + '" target="_blank" rel="noopener noreferrer">' + safeRepoText + '</a>'
      : safeRepoText;

    if (safeTemplate.indexOf('{repo_link}') >= 0) {
      return safeTemplate.replace('{repo_link}', repoAnchor);
    }
    return safeTemplate;
  }

  function render(container, toolId, options) {
    var rawData = options && options.data;
    var data = normalizeDataset(rawData);
    var lang = resolveLang(options || {});
    var item = resolveItem(data, toolId);

    if (!item) {
      container.innerHTML = '';
      return;
    }

    var links = Array.isArray(item.links) ? item.links : [];
    var publicationKeys = Array.isArray(item.publication_keys) ? item.publication_keys : [];
    var dedupPublicationKeys = [];
    var publicationSeen = {};
    publicationKeys.forEach(function (key) {
      if (!key || publicationSeen[key]) return;
      publicationSeen[key] = true;
      dedupPublicationKeys.push(key);
    });
    var publicationIndex = buildPublicationIndex(data.publications);
    var publications = dedupPublicationKeys
      .map(function (key) { return publicationIndex[key]; })
      .filter(Boolean);

    var support = item.support && typeof item.support === 'object' ? item.support : null;
    var supportRepoUrl = support && support.repo ? support.repo.url : '';
    var supportRepoLabel = support && support.repo
      ? pickLangText(support.repo.link_text || support.repo.label, lang, (lang === 'es' ? 'repositorio' : 'repository'))
      : (lang === 'es' ? 'repositorio' : 'repository');
    var supportIntroText = support && support.intro ? pickLangText(support.intro, lang, '') : '';
    var supportDoiLinks = support && Array.isArray(support.doi_links) ? support.doi_links : [];
    var supportPublicationKeys = support && Array.isArray(support.publication_keys) ? support.publication_keys : [];
    var dedupSupportPublicationKeys = [];
    var supportPublicationSeen = {};
    supportPublicationKeys.forEach(function (key) {
      if (!key || supportPublicationSeen[key]) return;
      supportPublicationSeen[key] = true;
      dedupSupportPublicationKeys.push(key);
    });
    var supportPublications = dedupSupportPublicationKeys
      .map(function (key) { return publicationIndex[key]; })
      .filter(Boolean);

    var supportDoiItems = supportDoiLinks.map(function (entry) {
      var label = pickLangText(entry && entry.label, lang, 'DOI');
      var href = entry && entry.url ? String(entry.url) : '';
      if (!href) return '';
      return '<li class="related-work-item related-work-item-link"><a class="related-work-link" href="' + escapeHtml(href) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(label) + '</a></li>';
    }).filter(Boolean).join('');

    if (!links.length && !publications.length && !supportRepoUrl && !supportIntroText && !supportDoiItems && !supportPublications.length) {
      container.innerHTML = '';
      return;
    }

    var title = pickLangText(item.title, lang, (lang === 'es' ? 'Citas y trabajos relacionados' : 'Citing and related work'));
    var heading = '<h3 class="related-work-title">' + escapeHtml(title) + '</h3>';

    var list = links.map(function (entry) {
      var label = escapeHtml(entry && entry.label ? entry.label : 'Related link');
      var url = escapeHtml(entry && entry.url ? entry.url : '#');
      var desc = pickLangText(entry && entry.description, lang, '');
      var descHtml = desc ? '<span class="related-work-link-desc"> — ' + escapeHtml(desc) + '</span>' : '';
      return '<li class="related-work-item related-work-item-link"><a class="related-work-link" href="' + url + '" target="_blank" rel="noopener noreferrer">' + label + '</a>' + descHtml + '</li>';
    }).join('');

    var supportDefaultIntro = lang === 'es'
      ? 'Si este trabajo te ha resultado útil, considera dar una estrella al {repo_link} o citar estos trabajos:'
      : 'If this work was useful to you, consider giving a star to the {repo_link} or citing these works:';
    var relatedTitle = lang === 'es' ? 'Trabajos relacionados (si los hay)' : 'Related work (if any)';

    var supportCitationItems = supportDoiItems;
    if (supportPublications.length) {
      supportCitationItems += supportPublications.map(function (pub) {
        return renderSupportPublicationItem(pub, lang);
      }).join('');
    }

    var introHtml = renderIntroWithRepoLink(supportIntroText || supportDefaultIntro, supportRepoUrl, supportRepoLabel);

    var supportBlock = (supportRepoUrl || supportIntroText || supportCitationItems)
      ?
        '<div class="related-work-support">' +
        '<p class="related-work-intro">' + introHtml + '</p>' +
        (supportCitationItems ? '<ul class="related-work-list">' + supportCitationItems + '</ul>' : '') +
        '</div>'
      : '';

    var relatedItemsHtml = '';
    if (publications.length) {
      relatedItemsHtml += publications.map(function (pub) {
        return renderPublicationItem(pub, lang);
      }).join('');
    }
    if (links.length) {
      relatedItemsHtml += list;
    }

    var relatedSection = relatedItemsHtml
      ? '<h4 class="related-work-subtitle">' + relatedTitle + '</h4><ul class="related-work-list related-work-list-pubs">' + relatedItemsHtml + '</ul>'
      : '';

    container.innerHTML = '<section class="related-work-block">' + heading + supportBlock + relatedSection + '</section>';
    if (window.SharedPublicationUI && typeof window.SharedPublicationUI.bind === 'function') {
      window.SharedPublicationUI.bind(container);
    }
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
        var dataset = normalizeDataset(data);
        if (Array.isArray(dataset.publications) && dataset.publications.length) {
          return dataset;
        }
        return loadPublicationsFromYaml(options.publicationsSourceUrl).then(function (publications) {
          dataset.publications = Array.isArray(publications) ? publications : [];
          return dataset;
        });
      })
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
