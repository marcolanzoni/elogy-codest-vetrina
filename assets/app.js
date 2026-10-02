/* eLogy · campagna contrassegno Est · provenienza, consenso, pixel, modulo.
   Preso dal funnel Black Friday 2026 (elogy-landing-bf26/site/assets/app.js) e adattato:
   - il pixel di Meta parte SOLO dopo il consenso (banner);
   - ogni evento ha un event_id: lo stesso arriva a Meta dal browser e dal server (niente doppioni);
   - dopo l'invio si va alla pagina di ringraziamento, che manda Lead e QualifiedLead. */
(function () {
  var C = window.EST || {};
  var IT = C.lang !== 'en';
  var T = IT ? {
    err1: 'Scegli una risposta per ogni domanda.',
    errCampi: 'Controlla i campi evidenziati.',
    errPrivacy: 'Serve la conferma sull\'informativa privacy.',
    errInvio: 'Non siamo riusciti a inviare la richiesta. Riprova tra qualche istante.',
    invio: 'Invio…'
  } : {
    err1: 'Please pick an answer for each question.',
    errCampi: 'Please check the highlighted fields.',
    errPrivacy: 'Please confirm you have read the privacy notice.',
    errInvio: 'We could not send your request. Please try again in a moment.',
    invio: 'Sending…'
  };
  var LS = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  var SS = {
    get: function (k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del: function (k) { try { sessionStorage.removeItem(k); } catch (e) {} }
  };
  function uid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }
  function cookie(n) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + n + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  // --- provenienza: prima e ultima visita (UTM e id degli annunci) -----------
  // Senza consenso ai cookie di misura, provenienza e id del visitatore restano solo per la visita
  // (sessionStorage, spariscono chiudendo la scheda). Con il consenso passano in localStorage.
  var consent = LS.get('est_consent'); // 'yes' | 'no' | null
  var ST = consent === 'yes' ? LS : SS;
  var KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id', 'campaign_id', 'adset_id', 'ad_id', 'fbclid'];
  var qs = new URLSearchParams(location.search);
  var now = {};
  KEYS.forEach(function (k) { if (qs.get(k)) now[k] = qs.get(k).slice(0, 200); });
  if (Object.keys(now).length) {
    now.at = new Date().toISOString();
    now.landing_url = location.href.slice(0, 500);
    if (!ST.get('est_first')) ST.set('est_first', now);
    ST.set('est_last', now);
  }
  var first = ST.get('est_first') || {};
  var last = ST.get('est_last') || {};
  var visitor = ST.get('est_vid') || uid();
  ST.set('est_vid', visitor);
  function passaALocale() {
    LS.set('est_first', first); LS.set('est_last', last); LS.set('est_vid', visitor);
  }
  function togliDaLocale() {
    try { ['est_first', 'est_last', 'est_vid'].forEach(function (k) { localStorage.removeItem(k); }); } catch (e) {}
  }
  var session = uid();
  var fbclid = now.fbclid || last.fbclid;
  function calcolaFbc() { return consent === 'yes' ? (cookie('_fbc') || (fbclid ? 'fb.1.' + Date.now() + '.' + fbclid : null)) : null; }
  var fbc = calcolaFbc();

  // --- consenso e pixel ------------------------------------------------------
  var pixelOn = false;
  // In anteprima locale il pixel vero non parte: le chiamate si registrano in window.ESTpixelLog
  // (così si controllano nomi ed event_id senza sporcare i dati di Meta). ?pixel=1 lo accende davvero.
  var locale = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && !/[?&]pixel=1/.test(location.search);
  function loadPixel() {
    if (pixelOn || !C.pixel || consent !== 'yes') return;
    pixelOn = true;
    if (locale) { window.ESTpixelLog = []; window.fbq = function () { window.ESTpixelLog.push(Array.prototype.slice.call(arguments)); }; return; }
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', C.pixel);
  }
  function pixel(name, data, eventId, custom) {
    if (consent !== 'yes' || !C.pixel) return;
    loadPixel();
    fbq(custom ? 'trackCustom' : 'track', name, data || {}, { eventID: eventId });
  }
  function contenuto(extra) {
    return Object.assign({ content_name: 'codest_' + C.variant + '_' + (C.lang || 'it'), content_category: 'codest_landing' }, extra || {});
  }

  // --- invio al nostro server --------------------------------------------------
  function base() {
    return {
      variant: C.variant, lang: C.lang || 'it', visitor_id: visitor, session_id: session,
      consent: consent === 'yes', page_url: location.href.slice(0, 500), referrer: document.referrer.slice(0, 300),
      first_touch: first, last_touch: last, fbp: consent === 'yes' ? cookie('_fbp') : null, fbc: calcolaFbc()
    };
  }
  function send(type, extra, beacon) {
    if (!C.endpoint) return Promise.resolve(null);
    var json = JSON.stringify(Object.assign(base(), { type: type }, extra || {}));
    if (beacon && navigator.sendBeacon) {
      navigator.sendBeacon(C.endpoint, new Blob([json], { type: 'text/plain' }));
      return Promise.resolve(null);
    }
    return fetch(C.endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: json, keepalive: true })
      .then(function (r) { return r.json(); });
  }
  function track(name, pixelName, data, custom) {
    var id = name + '.' + uid();
    if (pixelName) pixel(pixelName, contenuto(data), id, custom);
    send('event', { event: name, event_id: id, pixel_event: pixelName && consent === 'yes' ? pixelName : null }, true);
    return id;
  }

  // --- banner del consenso -----------------------------------------------------
  var banner = $('.consent');
  var thanks = SS.get('est_grazie');
  function primaVista() {
    if (C.page === 'grazie') track('thanks_view', null);
    else { track('page_view', 'PageView'); track('view_content', 'ViewContent'); }
  }
  if (consent) primaVista();
  else {
    if (banner) banner.hidden = false;
    send('event', { event: C.page === 'grazie' ? 'thanks_view' : 'page_view', event_id: 'pv.' + uid(), pixel_event: null }, true);
  }
  function decidi(v) {
    var eraNullo = consent == null;
    consent = v; LS.set('est_consent', v);
    if (v === 'yes') passaALocale(); else togliDaLocale();
    if (banner) banner.hidden = true;
    if (v === 'yes' && eraNullo && C.page !== 'grazie') { track('consent_view', 'PageView'); track('view_content', 'ViewContent'); }
    if (v === 'yes' && C.page === 'grazie') segnaleGrazie();
    if (v === 'no' && pixelOn) location.reload(); // revoca: si ricarica la pagina senza pixel
  }
  $$('[data-consent]').forEach(function (b) {
    b.addEventListener('click', function () { decidi(b.dataset.consent); });
  });
  var salva = $('[data-consent-save]');
  if (salva) salva.addEventListener('click', function () { decidi($('#c-misura').checked ? 'yes' : 'no'); });
  $$('[data-cookie-settings]').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.preventDefault();
      if (!banner) return;
      var c = $('#c-misura'); if (c) c.checked = consent === 'yes';
      var o = $('.consent .opts'); if (o) o.hidden = false;
      banner.hidden = false;
    });
  });
  var pers = $('[data-consent-more]');
  if (pers) pers.addEventListener('click', function () { var o = $('.consent .opts'); o.hidden = !o.hidden; });

  // --- pagina di ringraziamento: Lead e QualifiedLead dal browser ---------------
  function segnaleGrazie() {
    if (!thanks || thanks.inviato) return;
    pixel('Lead', contenuto({ content_name: 'codest_' + thanks.variant + '_' + (C.lang || 'it') }), thanks.lead);
    if (thanks.qualified) pixel('QualifiedLead', contenuto({ content_name: 'codest_' + thanks.variant + '_' + (C.lang || 'it'), lead_tier: thanks.tier }), thanks.qual, true);
    thanks.inviato = true; SS.set('est_grazie', thanks);
  }
  if (C.page === 'grazie') {
    if (consent === 'yes') segnaleGrazie();
    var back = $('[data-back-landing]');
    if (back && thanks && thanks.from) back.href = thanks.from;
    return; // nella pagina di ringraziamento non c'è il modulo
  }

  // --- modulo in finestra ----------------------------------------------------------
  var form = document.getElementById('lead-form');
  var pop = document.getElementById('form-pop');
  if (!form || !pop) return;
  function openForm(origine) {
    if (pop.showModal) { if (!pop.open) pop.showModal(); } else pop.setAttribute('open', '');
    document.documentElement.classList.add('pop-open');
    pop.querySelector('.card').scrollTop = 0;
    send('event', { event: 'form_open', event_id: 'form_open.' + uid(), cta: origine || '' }, true);
  }
  function closeForm() {
    if (pop.close && pop.open) pop.close(); else pop.removeAttribute('open');
    document.documentElement.classList.remove('pop-open');
  }
  pop.addEventListener('close', function () { document.documentElement.classList.remove('pop-open'); });
  pop.addEventListener('click', function (e) { if (e.target === pop) closeForm(); });
  pop.querySelector('[data-close-form]').addEventListener('click', closeForm);
  $$('a[href="#modulo"]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); openForm(a.dataset.cta); });
  });
  window.ESTapriModulo = openForm;
  if (location.hash === '#modulo') openForm('hash');

  var answers = { paesi: [] };
  var started = false;
  function formStart() {
    if (started) return; started = true;
    track('form_start', 'FormStart', {}, true);
  }
  $$('.chips', form).forEach(function (g) {
    var multi = g.classList.contains('multi');
    g.setAttribute('role', multi ? 'group' : 'radiogroup');
    $$('button', g).forEach(function (b) {
      b.setAttribute('role', multi ? 'checkbox' : 'radio'); b.setAttribute('aria-checked', 'false');
      b.addEventListener('click', function () {
        formStart();
        var errEl = $('[data-err="1"]', form); if (errEl) errEl.textContent = '';
        if (multi) {
          var on = b.getAttribute('aria-checked') !== 'true';
          var esclusivo = b.dataset.v === 'non_so';
          if (on && esclusivo) $$('button', g).forEach(function (x) { x.setAttribute('aria-checked', 'false'); });
          if (on && !esclusivo) { var ns = $('button[data-v="non_so"]', g); if (ns) ns.setAttribute('aria-checked', 'false'); }
          b.setAttribute('aria-checked', on ? 'true' : 'false');
          answers[g.dataset.name] = $$('button[aria-checked="true"]', g).map(function (x) { return x.dataset.v; });
        } else {
          $$('button', g).forEach(function (x) { x.setAttribute('aria-checked', 'false'); });
          b.setAttribute('aria-checked', 'true');
          answers[g.dataset.name] = b.dataset.v;
        }
      });
    });
  });
  // un paese scelto prima di aprire il modulo (es. landing «scegli il paese»)
  window.ESTpreseleziona = function (v) {
    var b = $('.chips[data-name="paesi"] button[data-v="' + v + '"]', form);
    if (b && b.getAttribute('aria-checked') !== 'true') b.click();
  };
  form.addEventListener('focusin', formStart);
  var steps = $$('.st', form);
  var bar = $('.progress i', form);
  function show(n) {
    steps.forEach(function (s) { s.hidden = s.dataset.step !== String(n); });
    bar.style.width = n === 1 ? '50%' : '100%';
    pop.querySelector('.card').scrollTop = 0;
  }
  $('[data-next]', form).addEventListener('click', function () {
    var miss = ['ordini_mese', 'oggi'].filter(function (k) { return !answers[k]; });
    if (!answers.paesi.length) miss.push('paesi');
    if (miss.length) { $('[data-err="1"]', form).textContent = T.err1; return; }
    if (answers.oggi === 'cerco_lavoro') {
      steps.forEach(function (s) { s.hidden = true; });
      $('.job', form).hidden = false;
      send('event', { event: 'cerca_lavoro', event_id: 'cerca_lavoro.' + uid() }, true);
      return;
    }
    show(2);
    send('event', { event: 'form_step2', event_id: 'form_step2.' + uid() }, true);
  });
  $('[data-back]', form).addEventListener('click', function () { show(1); });
  $('[data-job-back]', form).addEventListener('click', function () { $('.job', form).hidden = true; show(1); });

  function cleanSite(s) {
    s = (s || '').trim().toLowerCase();
    if (!s) return '';
    if (!/^https?:\/\//.test(s)) s = 'https://' + s;
    try { var u = new URL(s); return u.hostname.indexOf('.') > 0 ? u.origin : ''; } catch (e) { return ''; }
  }
  var sending = false;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (sending) return;
    var err = $('[data-err="2"]', form);
    var nome = form.nome.value.trim(), email = form.email.value.trim(), sito = cleanSite(form.sito.value), tel = form.telefono.value.trim();
    [form.nome, form.email, form.sito].forEach(function (i) { i.classList.remove('bad'); });
    var bad = [];
    if (nome.length < 2) bad.push(form.nome);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) bad.push(form.email);
    if (form.sito.value.trim() && !sito) bad.push(form.sito);
    if (bad.length) { bad.forEach(function (i) { i.classList.add('bad'); }); err.textContent = T.errCampi; bad[0].focus(); return; }
    if (!answers.piattaforma) { err.textContent = T.err1; return; }
    if (!form.privacy.checked) { err.textContent = T.errPrivacy; return; }
    err.textContent = '';
    sending = true;
    var btn = $('button[type=submit]', form); var label = btn.textContent; btn.textContent = T.invio; btn.disabled = true;
    var leadEventId = 'lead.' + uid();
    var qualEventId = 'qualified_lead.' + uid();
    send('lead', {
      event_id: leadEventId, qualified_event_id: qualEventId,
      nome: nome, email: email, sito: sito, telefono: tel,
      ordini_mese: answers.ordini_mese, paesi: answers.paesi, oggi: answers.oggi, piattaforma: answers.piattaforma,
      hp: form.azienda_web.value, privacy: true, marketing: !!(form.marketing && form.marketing.checked)
    }).then(function (r) {
      if (!C.endpoint) r = { ok: true, qualified: false, tier: 'C' }; if (!r || !r.ok) throw new Error((r && r.error) || 'errore');
      SS.set('est_grazie', { lead: leadEventId, qual: qualEventId, qualified: !!r.qualified, tier: r.tier, variant: C.variant, from: location.pathname + location.search });
      location.href = C.thanks || ((IT ? '/elogy-codest-vetrina/it/grazie/' : '/elogy-codest-vetrina/en/thanks/'));
    }).catch(function () {
      err.textContent = T.errInvio;
      btn.textContent = label; btn.disabled = false;
    }).then(function () { sending = false; });
  });

  // --- bottone fisso e clic sui bottoni ----------------------------------------------
  $$('[data-cta]').forEach(function (a) {
    a.addEventListener('click', function () { send('event', { event: 'cta_click', event_id: 'cta.' + uid(), cta: a.dataset.cta }, true); });
  });
  var sticky = $('.sticky-cta');
  if (sticky) {
    var finale = document.getElementById('modulo');
    var finaleIn = false;
    var upd = function () { sticky.classList.toggle('show', !finaleIn && window.scrollY > window.innerHeight * 0.5); };
    window.addEventListener('scroll', upd, { passive: true });
    if (finale && 'IntersectionObserver' in window) new IntersectionObserver(function (es) { finaleIn = es[0].isIntersecting; upd(); }, { threshold: 0.2 }).observe(finale);
    upd();
  }
  // metà pagina letta (serve a capire quale landing tiene)
  var meta = false;
  window.addEventListener('scroll', function () {
    if (meta) return;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (h > 0 && window.scrollY / h > 0.5) { meta = true; send('event', { event: 'scroll_50', event_id: 'scroll_50.' + uid() }, true); }
  }, { passive: true });
})();
