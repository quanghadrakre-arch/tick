(function () {
    var DEFAULT_LANG = 'en';
    var SUPPORTED = ['en', 'vi', 'es', 'pt', 'fr', 'de', 'it', 'ja', 'ko', 'zh', 'th', 'id', 'ms', 'ar', 'hi', 'tr', 'ru', 'pl', 'nl', 'tl'];
    var currentLang = DEFAULT_LANG;

    function applyTranslations(translations) {
        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            var key = el.getAttribute('data-i18n');
            if (translations[key]) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.setAttribute('placeholder', translations[key]);
                } else {
                    el.innerHTML = translations[key];
                }
            }
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
            var key = el.getAttribute('data-i18n-placeholder');
            if (translations[key]) el.setAttribute('placeholder', translations[key]);
        });
    }

    function highlightActiveLang(lang) {
        // Footer language links
        document.querySelectorAll('.footer-lang-link.lang-link').forEach(function (el) {
            var elLang = el.getAttribute('data-lang');
            if (elLang === lang) {
                el.classList.add('footer-lang-active');
            } else {
                el.classList.remove('footer-lang-active');
            }
        });
        // Modal language links
        document.querySelectorAll('.lang-modal-lang').forEach(function (el) {
            var elLang = el.getAttribute('data-lang');
            if (elLang === lang) {
                el.classList.add('current-lang');
            } else {
                el.classList.remove('current-lang');
            }
        });
    }

    function loadLang(lang, callback) {
        if (!window._i18nOriginals) {
            saveOriginals();
        }

        var basePath = document.querySelector('meta[name="i18n-base"]');
        var base = basePath ? basePath.getAttribute('content') : '.';
        fetch(base + '/lang/' + lang + '.json')
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (data) {
                if (data) {
                    applyTranslations(data);
                    currentLang = lang;
                    document.documentElement.lang = lang;
                    if (data._dir) {
                        document.documentElement.dir = data._dir;
                    } else {
                        document.documentElement.removeAttribute('dir');
                    }
                    sessionStorage.setItem('i18n_lang', lang);
                    highlightActiveLang(lang);
                }
                if (callback) callback();
            })
            .catch(function () {
                if (callback) callback();
            });
    }

    function saveOriginals() {
        window._i18nOriginals = {};
        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            window._i18nOriginals[el.getAttribute('data-i18n')] = el.innerHTML;
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
            window._i18nOriginals[el.getAttribute('data-i18n-placeholder')] = el.getAttribute('placeholder');
        });
    }

    var COUNTRY_TO_LANG = {
        VN: 'vi', ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es', PE: 'es',
        BR: 'pt', PT: 'pt', FR: 'fr', DE: 'de', AT: 'de', CH: 'de',
        IT: 'it', JP: 'ja', KR: 'ko', CN: 'zh', TW: 'zh', HK: 'zh',
        TH: 'th', ID: 'id', MY: 'ms', SA: 'ar', EG: 'ar', AE: 'ar',
        IN: 'hi', TR: 'tr', RU: 'ru', PL: 'pl', NL: 'nl', PH: 'tl',
        SG: 'en', US: 'en', GB: 'en', AU: 'en', CA: 'en', NZ: 'en', IE: 'en',
    };

    function detectAndApply() {
        saveOriginals();
        if (sessionStorage.getItem('i18n_scrollTop')) {
            sessionStorage.removeItem('i18n_scrollTop');
            if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
            window.scrollTo(0, 0);
            setTimeout(function () { window.scrollTo(0, 0); }, 0);
            setTimeout(function () { window.scrollTo(0, 0); }, 50);
            setTimeout(function () { window.scrollTo(0, 0); }, 150);
        }
        var userChosen = sessionStorage.getItem('i18n_user_chosen');
        if (userChosen && SUPPORTED.indexOf(userChosen) !== -1) {
            loadLang(userChosen);
            return;
        }
        var lang = DEFAULT_LANG;
        if (window.Utils && window.Utils.userLoc && window.Utils.userLoc.countryCode && window.Utils.userLoc.countryCode !== 'Unknown') {
            var ipLang = COUNTRY_TO_LANG[window.Utils.userLoc.countryCode.toUpperCase()];
            if (ipLang && SUPPORTED.indexOf(ipLang) !== -1) {
                lang = ipLang;
            }
        }
        loadLang(lang);
    }

    // Expose switchLang globally for footer language links
    window.switchLang = function (lang) {
        if (SUPPORTED.indexOf(lang) === -1) lang = DEFAULT_LANG;
        sessionStorage.setItem('i18n_user_chosen', lang);
        sessionStorage.setItem('i18n_lang', lang);
        sessionStorage.setItem('i18n_scrollTop', '1');
        window.location.reload();
    };

    // "More languages" → open the Select a Language modal
    window.toggleMoreLangs = function () {
        var overlay = document.getElementById('lang-modal-overlay');
        if (overlay) overlay.classList.add('show');
    };

    // Close the language modal
    window.closeLangModal = function () {
        var overlay = document.getElementById('lang-modal-overlay');
        if (overlay) overlay.classList.remove('show');
    };

    // Filter languages by region in the modal
    window.filterLangRegion = function (region) {
        // Highlight active region tab
        document.querySelectorAll('.lang-modal-region').forEach(function (el) {
            if (el.getAttribute('data-region') === region) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });
        // Show/hide language links based on region
        document.querySelectorAll('.lang-modal-lang').forEach(function (el) {
            var regions = (el.getAttribute('data-regions') || '').split(',');
            if (region === 'all' || regions.indexOf(region) !== -1) {
                el.style.display = '';
            } else {
                el.style.display = 'none';
            }
        });
    };

    // Run after IP location is ready
    function waitForLocationAndApply() {
        if (window._ipReady && window.Utils && window.Utils.userLoc && window.Utils.userLoc.countryCode && window.Utils.userLoc.countryCode !== 'Unknown') {
            detectAndApply();
        } else {
            window.addEventListener('ip-ready', function () {
                detectAndApply();
            }, { once: true });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForLocationAndApply);
    } else {
        waitForLocationAndApply();
    }
    
})();
