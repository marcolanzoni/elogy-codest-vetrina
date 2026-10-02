/* eLogy · landing «scegli»: porte dei paesi → scheda del paese.
   Più paesi insieme; il bottone della scheda (e ogni bottone del modulo) mette la spunta
   sui paesi scelti. ?paese=romania,bulgaria apre le schede da subito (utile per gli annunci). */
(function () {
  'use strict';
  window.SCEGLI = 1;
  var doc = document.documentElement;
  var en = doc.lang === 'en';
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var doors = $$('.p-scegli .door');
  var box = document.getElementById('schede');
  if (!doors.length || !box) return;
  doc.classList.add('sj');

  var cards = {}, names = {}, order = [];
  $$('.scheda', box).forEach(function (c) { cards[c.dataset.p] = c; });
  doors.forEach(function (d) {
    var p = d.dataset.p;
    names[p] = d.querySelector('.dn').textContent;
    order.push(p);
    d.setAttribute('role', 'button');
    d.setAttribute('aria-pressed', 'false');
    d.setAttribute('aria-controls', 'p-' + p);
  });
  var multi = box.querySelector('.sc-multi');
  var countEl = box.querySelector('.sc-n');
  var tabs = box.querySelector('.sc-tabs');
  var recap = document.querySelector('.p-scegli .sc-recap');
  var sel = [], cur = null;

  function plural(n) { return en ? n + ' markets' : n + ' mercati'; }
  function listNames() {
    var l = sel.map(function (p) { return names[p]; });
    if (l.length < 2) return l.join('');
    return l.slice(0, -1).join(', ') + (en ? ' and ' : ' e ') + l[l.length - 1];
  }

  function render() {
    doors.forEach(function (d) {
      var p = d.dataset.p;
      d.setAttribute('aria-pressed', sel.indexOf(p) > -1 ? 'true' : 'false');
      d.classList.toggle('cur', p === cur);
    });
    for (var p in cards) cards[p].classList.toggle('on', p === cur);
    box.classList.toggle('has', !!cur);
    box.classList.toggle('multi', sel.length > 1);
    if (countEl) countEl.textContent = plural(sel.length);
    if (tabs) {
      tabs.innerHTML = '';
      if (sel.length > 1) sel.forEach(function (p) {
        var b = document.createElement('button');
        b.type = 'button'; b.textContent = names[p];
        b.setAttribute('aria-current', p === cur ? 'true' : 'false');
        b.addEventListener('click', function () { cur = p; render(); });
        tabs.appendChild(b);
      });
    }
    if (recap) {
      recap.hidden = !sel.length;
      recap.querySelector('b').textContent = listNames();
    }
  }

  // porta toccata: se non era scelta la sceglie e la mostra; se era scelta ma non in vista la mostra;
  // se era quella in vista la toglie.
  function tocca(p) {
    var i = sel.indexOf(p);
    if (i === -1) { sel.push(p); cur = p; }
    else if (cur !== p) cur = p;
    else { sel.splice(i, 1); cur = sel.length ? sel[sel.length - 1] : null; }
    sel.sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); });
    render();
  }

  // sul telefono porta la scheda in vista, lasciando sopra l'ultima fila di porte
  function avvicina() {
    if (!cur || window.innerWidth >= 900) return;
    var r = cards[cur].getBoundingClientRect(), vh = window.innerHeight;
    var target = multi && sel.length > 1 ? multi.getBoundingClientRect().top : r.top;
    if (target > vh * 0.55 || target < 0) {
      var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollBy({ top: target - vh * 0.3, behavior: calm ? 'auto' : 'smooth' });
    }
  }

  doors.forEach(function (d) {
    d.addEventListener('click', function (e) {
      e.preventDefault();
      tocca(d.dataset.p);
      avvicina();
    });
    d.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); d.click(); }
    });
  });

  // ogni bottone che apre il modulo porta con sé i paesi scelti (gira prima di app.js)
  $$('a[href="#modulo"]').forEach(function (a) {
    a.addEventListener('click', function () {
      if (!window.ESTpreseleziona) return;
      var lista = sel.slice();
      if (a.dataset.parti && lista.indexOf(a.dataset.parti) === -1) lista.push(a.dataset.parti);
      lista.forEach(function (p) { window.ESTpreseleziona(p); });
    });
  });

  // apertura da link: ?paese=romania,bulgaria oppure #p-romania
  var q = /[?&]paese=([^&#]+)/.exec(location.search);
  var dalLink = q ? decodeURIComponent(q[1]).split(/[,+ ]+/) : [];
  var h = /^#p-([a-z_]+)$/.exec(location.hash);
  if (h) dalLink.push(h[1]);
  dalLink.forEach(function (p) { p = p.toLowerCase(); if (cards[p] && sel.indexOf(p) === -1) tocca(p); });
  render();
})();
