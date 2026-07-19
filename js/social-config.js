/**
 * OEO Solution — social profile URLs (single place to edit).
 *
 * Paste full profile URLs when ready. Leave empty to hide that button
 * (or keep placeholders as # until live).
 */
(function (global) {
  var SOCIAL = {
    youtube: '',   // e.g. 'https://www.youtube.com/@OEOSolution'
    facebook: '',  // e.g. 'https://www.facebook.com/oeosolution'
    x: '',         // e.g. 'https://x.com/oeosolution'
    instagram: '', // e.g. 'https://www.instagram.com/oeosolution'
  };

  function apply(root) {
    var scope = root || document;
    Object.keys(SOCIAL).forEach(function (key) {
      var url = (SOCIAL[key] || '').trim();
      scope.querySelectorAll('[data-social="' + key + '"]').forEach(function (el) {
        if (url) {
          el.setAttribute('href', url);
          el.removeAttribute('aria-disabled');
          el.classList.remove('is-disabled');
        } else {
          el.setAttribute('href', '#');
          el.setAttribute('aria-disabled', 'true');
          el.classList.add('is-disabled');
          el.addEventListener('click', function (e) {
            e.preventDefault();
          });
        }
      });
    });
  }

  global.OEO_SOCIAL = { urls: SOCIAL, apply: apply };
})(typeof window !== 'undefined' ? window : globalThis);
