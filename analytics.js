// /analytics.js — ORLO unified analytics: Meta Pixel + TikTok Pixel + CAPI helpers
// Deferred so it does not affect LCP. Loads after window.load + browser idle.
// Customer-flow (cart, checkout, Stripe, account) is 100% independent of this file —
// if it fails to load, the site keeps working, only ad-tracking is lost.
(function () {
  'use strict';

  var META_PIXEL_ID = '4275846289322000';
  var TIKTOK_PIXEL_ID = 'D6LC3SJC77UFDH5VO920';
  var COOKIE_MAX_AGE = 90 * 24 * 60 * 60; // Meta default

  // ---- Cookie helpers ----
  function readCookie(name) {
    try {
      var m = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
      return m ? decodeURIComponent(m[1]) : null;
    } catch (e) { return null; }
  }
  function writeCookie(name, value) {
    try {
      document.cookie = name + '=' + encodeURIComponent(value) +
        '; max-age=' + COOKIE_MAX_AGE + '; path=/; SameSite=Lax';
    } catch (e) {}
  }

  // Seed _fbp before the Pixel snippet runs so the very first PageView CAPI
  // ping (which fires inside loadMetaPixel before fbevents.js lands) carries it.
  // Format matches Meta's spec exactly: fb.<subdomain>.<ts_ms>.<random10>.
  // Pixel preserves an existing _fbp instead of overwriting, so values stay aligned.
  function ensureFbp() {
    if (readCookie('_fbp')) return;
    var rand = Math.floor(1000000000 + Math.random() * 9000000000);
    writeCookie('_fbp', 'fb.1.' + Date.now() + '.' + rand);
  }
  // Capture click-id from ?fbclid= even if the user lands before Pixel loads.
  function syncFbcFromUrl() {
    try {
      var m = (window.location.search || '').match(/[?&]fbclid=([^&#]+)/);
      if (!m || readCookie('_fbc')) return;
      writeCookie('_fbc', 'fb.1.' + Date.now() + '.' + decodeURIComponent(m[1]));
    } catch (e) {}
  }
  ensureFbp();
  syncFbcFromUrl();

  // ---- Stable anonymous device id, used as external_id when logged-out ----
  // Persists across visits so Meta can stitch sessions for the same device.
  // Logged-in users still send email-as-external_id (matches webhook.js Purchase).
  function getOrCreateAnonId() {
    try {
      var id = localStorage.getItem('orlo_anon_id');
      if (id) return id;
      if (window.crypto && typeof crypto.randomUUID === 'function') {
        id = crypto.randomUUID();
      } else {
        id = 'anon_' + Date.now() + '_' + Math.random().toString(36).slice(2, 14);
      }
      localStorage.setItem('orlo_anon_id', id);
      return id;
    } catch (e) { return null; }
  }

  // ---- Advanced Matching: pull logged-in user from localStorage if present ----
  // Pixel hashes plain values automatically. external_id MUST equal the value
  // webhook.js uses (sha256 of lowercased email) so server↔browser dedup matches.
  function getAdvancedMatching() {
    var am = {};
    try {
      var raw = localStorage.getItem('orlo_customer') || sessionStorage.getItem('orlo_customer');
      if (raw) {
        var u = JSON.parse(raw);
        if (u.email) {
          var em = String(u.email).toLowerCase().trim();
          am.em = em;
          am.external_id = em; // server side hashes the same email — matches in Meta
        }
        if (u.phone) am.ph = String(u.phone).replace(/\D/g, '');
        if (u.name) {
          var parts = String(u.name).trim().toLowerCase().split(/\s+/);
          if (parts[0]) am.fn = parts[0];
          if (parts.length > 1) am.ln = parts[parts.length - 1];
        }
        if (u.city) am.ct = String(u.city).toLowerCase().replace(/\s+/g, '');
        if (u.country) am.country = String(u.country).toLowerCase();
      }
    } catch (e) {}
    if (!am.external_id) {
      var anon = getOrCreateAnonId();
      if (anon) am.external_id = anon;
    }
    return am;
  }

  function makeEventId(prefix) {
    return (prefix || 'evt') + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
  }

  // ---- CAPI relay: server-side mirror of any browser event for dedup ----
  function capi(eventName, eventId, customData) {
    try {
      var am = getAdvancedMatching();
      var userData = {};
      if (am.em) userData.em = am.em;
      if (am.ph) userData.ph = am.ph;
      if (am.fn) userData.fn = am.fn;
      if (am.ln) userData.ln = am.ln;
      if (am.ct) userData.ct = am.ct;
      if (am.country) userData.country = am.country;
      if (am.external_id) userData.external_id = am.external_id;

      fetch('/api/capi-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_name: eventName,
          event_id: eventId,
          event_source_url: window.location.href,
          user_data: userData,
          custom_data: customData || {}
        }),
        keepalive: true
      }).catch(function () {});
    } catch (e) {}
  }

  // Pixel snippet may not be on the page yet when orloTrack is called (we lazy-load
  // it on idle). Queue Pixel-side calls and replay after loadMetaPixel() runs.
  // CAPI is independent and always fires immediately.
  var pendingFbq = [];
  function flushPendingFbq() {
    if (typeof window.fbq !== 'function') return;
    while (pendingFbq.length) {
      var c = pendingFbq.shift();
      try { window.fbq('track', c.eventName, c.params, { eventID: c.eventId }); } catch (e) {}
    }
  }

  // ---- Public helper: fires Pixel + CAPI with shared event_id ----
  // Usage: orloTrack('ViewContent', { content_ids:['slug'], value:99, currency:'AED' });
  window.orloTrack = function (eventName, params) {
    params = params || {};
    var eventId = makeEventId(eventName);
    if (typeof window.fbq === 'function') {
      window.fbq('track', eventName, params, { eventID: eventId });
    } else {
      pendingFbq.push({ eventName: eventName, params: params, eventId: eventId });
    }
    capi(eventName, eventId, params);
    return eventId;
  };

  function loadMetaPixel() {
    if (window.fbq) return;
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
      n.queue = []; t = b.createElement(e); t.async = !0;
      t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    var am = getAdvancedMatching();
    if (Object.keys(am).length) window.fbq('init', META_PIXEL_ID, am);
    else window.fbq('init', META_PIXEL_ID);

    // Replay any orloTrack calls that landed before the snippet ran.
    flushPendingFbq();

    // PageView with shared event_id so CAPI dedups it
    var pvId = makeEventId('pv');
    window.fbq('track', 'PageView', {}, { eventID: pvId });
    capi('PageView', pvId, {});
  }

  function loadTikTokPixel() {
    if (window.ttq && window.ttq._loaded) return;
    !function (w, d, t) {
      w.TiktokAnalyticsObject = t; var ttq = w[t] = w[t] || [];
      ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie', 'holdConsent', 'revokeConsent', 'grantConsent'];
      ttq.setAndDefer = function (t, e) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); }; };
      for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
      ttq.instance = function (t) { for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]); return e; };
      ttq.load = function (e, n) {
        var r = 'https://analytics.tiktok.com/i18n/pixel/events.js';
        ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = r;
        ttq._t = ttq._t || {}; ttq._t[e] = +new Date;
        ttq._o = ttq._o || {}; ttq._o[e] = n || {};
        var s = document.createElement('script'); s.type = 'text/javascript'; s.async = !0;
        s.src = r + '?sdkid=' + e + '&lib=' + t;
        var f = document.getElementsByTagName('script')[0]; f.parentNode.insertBefore(s, f);
      };
    }(window, document, 'ttq');

    window.ttq.load(TIKTOK_PIXEL_ID);
    var am = getAdvancedMatching();
    if (am.em || am.ph || am.external_id) {
      window.ttq.identify({
        email: am.em || undefined,
        phone_number: am.ph ? '+' + am.ph : undefined,
        external_id: am.external_id || undefined
      });
    }
    window.ttq.page();
    window.ttq._loaded = true;
  }

  function loadPixels() {
    loadMetaPixel();
    loadTikTokPixel();
  }

  // Load pixels after page interactive — protects LCP/FCP.
  // Safari's requestIdleCallback can be unreliable, so cap fallback to 1000ms
  // so the pixel is ready before users typically click AddToCart.
  function schedule() {
    var idle = window.requestIdleCallback || function (cb) { return setTimeout(cb, 1000); };
    idle(loadPixels);
  }

  if (document.readyState === 'complete') {
    schedule();
  } else {
    window.addEventListener('load', schedule, { once: true });
  }
})();
