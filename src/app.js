/* ===== UI: one shared patient state, one renderer for every score ===== */
(function () {
  var F = DEF.F, $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var EXAMPLE = { age: '62', sex: 'male', wt: '84', ht: '172', sbp: '148', dbp: '88', hr: '78', tc: '232', hdl: '41', tg: '178', cr: '1.1', hb: '13.8', hct: '41', wbc: '7.2', plt: '240',
    smoker: true, htn: true, bptx: true, famhx: true };
  var S = {}, isExample = true, units = 'conv', view = 'scores', scen = 'all', q = '', favs = [], last = null;
  function store(k, v) { try { localStorage.setItem('cs.' + k, JSON.stringify(v)); } catch (e) { } }
  function load(k, d) { try { var v = localStorage.getItem('cs.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  favs = load('favs', ['score2', 'cha2ds2va', 'hasbled', 'doac', 'rcri']); units = load('units', 'conv');
  Object.keys(EXAMPLE).forEach(function (k) { S[k] = EXAMPLE[k]; });

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function si(k) { return units === 'si' && F[k].si && !F[k].nosi ? F[k].si : null; }
  function shown(k) { var c = si(k); if (S[k] == null || S[k] === '') return ''; if (!c) return S[k]; var n = parseFloat(S[k]) * c.f; return isNaN(n) ? '' : +n.toFixed(c.dp + 1); }
  function unitOf(k) { var c = si(k); return c ? c.unit : F[k].unit; }
  var nid = 0;

  /* ---------- field widgets ---------- */
  function field(k, o) {
    o = o || {}; var f = F[k], id = 'i' + (++nid) + '_' + k, cls = 'f' + (o.need ? ' need' : '');
    if (f.type === 'num') return '<div class="' + cls + '"><label for="' + id + '">' + esc(f.label) + '</label><div class="box"><input id="' + id + '" data-k="' + k + '" type="number" inputmode="decimal" step="any" value="' + esc(shown(k)) + '">' + (unitOf(k) ? '<span class="u">' + esc(unitOf(k)) + '</span>' : '') + '</div></div>';
    if (f.type === 'choice' && f.opts.length > 5) return '<div class="' + cls + ' wide"><label for="' + id + '">' + esc(f.label) + '</label><div class="box"><select id="' + id + '" data-sel="' + k + '">' + f.opts.map(function (op) {
      return '<option value="' + esc(op[0]) + '"' + (DEF.val(S, k) === op[0] || (!DEF.val(S, k) && op[0] === '') ? ' selected' : '') + '>' + esc(op[1]) + '</option>'; }).join('') + '</select></div></div>';
    if (f.type === 'choice') return '<div class="' + cls + '"><span class="lb">' + esc(f.label) + '</span><div class="seg" role="group" aria-label="' + esc(f.label) + '">' + f.opts.map(function (op) {
      return '<button type="button" data-ch="' + k + '" data-v="' + op[0] + '" aria-pressed="' + (DEF.val(S, k) === op[0]) + '">' + esc(op[1]) + '</button>'; }).join('') + '</div></div>';
    var on = DEF.val(S, k), au = DEF.isAuto(S, k);
    return '<button type="button" class="chip' + (au ? ' auto' : '') + '" data-b="' + k + '" aria-pressed="' + on + '"' + (au ? ' title="Ticked automatically from the profile; tap to override"' : '') + '>' + esc(f.label) + (au ? '<span class="tag">auto</span>' : '') + '</button>';
  }
  function fields(keys, needSet) {
    var nums = keys.filter(function (k) { return F[k].type !== 'bool'; }), bools = keys.filter(function (k) { return F[k].type === 'bool'; }), h = '';
    var ch = nums.filter(function (k) { return F[k].type === 'choice'; }), nn = nums.filter(function (k) { return F[k].type === 'num'; });
    ch.forEach(function (k) { h += field(k, { need: needSet && needSet[k] }); });
    if (nn.length) h += '<div class="grid">' + nn.map(function (k) { return field(k, { need: needSet && needSet[k] }); }).join('') + '</div>';
    if (bools.length) h += '<div class="chips">' + bools.map(function (k) { return field(k); }).join('') + '</div>';
    return h;
  }

  /* ---------- profile ---------- */
  var openGroups = load('open', { demo: 1, vit: 1, lip: 1, ren: 1, bld: 0, rf: 1, hx: 1, rx: 0, acs: 0 });
  function renderProfile() {
    var h = isExample ? '<div class="example"><span>Showing an <b>example patient</b>. Edit any value or start a new patient.</span><button type="button" class="btn ghost" data-act="new">New patient</button></div>' : '';
    DEF.GROUPS.forEach(function (g) {
      var keys = Object.keys(F).filter(function (k) { return F[k].g === g[0] && !F[k].local && (!F[k].show || F[k].show(S)); });
      var filled = keys.filter(function (k) { return F[k].type === 'bool' ? S[k] === true : S[k] != null && S[k] !== ''; }).length;
      h += '<details class="grp" data-g="' + g[0] + '"' + (openGroups[g[0]] ? ' open' : '') + '><summary><span>' + g[1] + '</span><span class="cnt">' + (filled ? filled + ' entered' : '') + '</span></summary><div class="body">' +
        fields(keys) + '<div class="derived" data-der="' + g[0] + '"></div></div></details>';
    });
    $('#profile').innerHTML = h;
  }
  function f0(x) { return String(Math.round(x)); }
  function chol(x) { return units === 'si' ? (x / 38.67).toFixed(2) + ' mmol/L' : f0(x) + ' mg/dL'; }
  function renderDerived(d) {
    var m = {
      demo: (d.bmi ? '<span class="pill">BMI ' + d.bmi.toFixed(1) + '</span><span class="pill">BSA ' + d.bsa.toFixed(2) + ' m²</span>' : ''),
      vit: d.map ? '<span class="pill">MAP ' + f0(d.map) + '</span><span class="pill">PP ' + f0(d.pp) + '</span>' : '',
      lip: (d.nonhdl != null ? '<span class="pill">Non-HDL ' + chol(d.nonhdl) + '</span>' : '') + (d.ldlS != null ? '<span class="pill">LDL calc ' + chol(d.ldlS) + '</span>' : d.ldlF != null ? '<span class="pill">LDL calc ' + chol(d.ldlF) + '</span>' : ''),
      ren: (d.egfr ? '<span class="pill">eGFR ' + f0(d.egfr) + ' · ' + RS.gStage(d.egfr) + '</span>' : '') + (d.crcl ? '<span class="pill">CrCl ' + f0(d.crcl) + ' mL/min</span>' : ''),
      hx: d.ascvd ? '<span class="pill">Established ASCVD</span>' : ''
    };
    $$('[data-der]').forEach(function (el) { el.innerHTML = m[el.getAttribute('data-der')] || ''; });
  }

  /* ---------- score cards ---------- */
  var STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17.2l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>';
  var STATUS = { ported: 'Ported from your clinic tool; matches it in automated tests. Official-calculator check pending.', new: 'New; hand-checked test cases. Official-calculator check pending.', verified: 'Verified against the official calculator.' };
  function visible() {
    var t = q.trim().toLowerCase();
    return DEF.SCORES.filter(function (s) {
      if (scen === 'fav' && favs.indexOf(s.id) < 0) return false;
      if (scen !== 'all' && scen !== 'fav' && s.scen.indexOf(scen) < 0) return false;
      if (t && (s.name + ' ' + s.blurb + ' ' + s.domain).toLowerCase().indexOf(t) < 0) return false;
      return true;
    });
  }
  function renderScores() {
    $('#scen').innerHTML = DEF.SCEN.map(function (c) { return '<button type="button" data-scen="' + c[0] + '" aria-pressed="' + (scen === c[0]) + '">' + c[1] + (c[0] === 'fav' ? ' (' + favs.length + ')' : '') + '</button>'; }).join('');
    var list = visible(), h = '', dom = null;
    if (!list.length) h = '<div class="empty">' + (scen === 'fav' ? 'No favourites yet. Tap the star on any score to add it here.' : 'No score matches “' + esc(q) + '”.') + '</div>';
    else {
      h = '';
      list.forEach(function (s) {
        if (s.domain !== dom) { if (dom !== null) h += '</div>'; dom = s.domain; h += '<h2 class="dom-h">' + esc(dom) + '</h2><div class="cards">'; }
        h += '<article class="sc" data-id="' + s.id + '"><header><div class="tt"><h3>' + esc(s.name) + '</h3></div><button type="button" class="fav" data-fav="' + s.id + '" aria-pressed="' + (favs.indexOf(s.id) > -1) + '" aria-label="Favourite ' + esc(s.name) + '">' + STAR + '</button></header>' +
          '<p class="blurb">' + esc(s.blurb) + '</p><div class="res" data-res="' + s.id + '"></div><div class="ins" data-ins="' + s.id + '"></div>' +
          (s.inputs.length || s.source ? '<details class="more"><summary>All inputs and source</summary><div class="mb" data-all="' + s.id + '"></div></details>' : '') + '</article>';
      });
      h += '</div>';
    }
    $('#cards').innerHTML = h;
    renderIns(); renderAll(); update();
  }
  function renderIns() {
    var R = DEF.compute(S).r;
    $$('[data-ins]').forEach(function (el) {
      var s = DEF.SCORES.filter(function (x) { return x.id === el.getAttribute('data-ins'); })[0], r = R[s.id];
      if (r.na) { el.innerHTML = ''; return; }
      var miss = (r.missing || []).filter(function (k) { return !F[k].local; }), need = {};
      miss.forEach(function (k) { need[k] = 1; });
      (s.local || []).forEach(function (k) { if (F[k].type === 'num' && r.missing && r.missing.indexOf(k) > -1) need[k] = 1; });
      el.innerHTML = fields(miss.concat(s.local || []), need);
    });
  }
  function renderAll() {
    $$('[data-all]').forEach(function (el) {
      var s = DEF.SCORES.filter(function (x) { return x.id === el.getAttribute('data-all'); })[0];
      el.innerHTML = (s.inputs.length ? fields(s.inputs.filter(function (k) { return !F[k].show || F[k].show(S); })) : '') +
        '<p class="src">' + esc(s.source) + '</p><p class="src"><span class="badge">' + esc(s.status === 'verified' && s.verifiedBy ? 'Verified against ' + s.verifiedBy + '.' : STATUS[s.status]) + '</span> Checked ' + s.checked + '.</p>';
    });
  }
  function fmt(r) {
    if (r.text) return String(r.value);
    var dp = r.dp != null ? r.dp : (r.unit === '%' ? 1 : (Math.abs(r.value) < 10 && r.value % 1 ? 1 : 0));
    return Number(r.value).toFixed(dp);
  }
  function resHTML(r) {
    if (r.error) return '<p class="wn">Could not calculate: ' + esc(r.error) + '</p>';
    if (r.na) return '<p class="na">' + esc(r.na) + '</p>';
    if (!r.ok && r.hint && !r.missing.length) return '<p class="na">' + esc(r.hint) + '</p>';
    if (!r.ok) return r.missing.length ? '<p class="needs">Needs ' + r.missing.map(function (k) { return esc(F[k].label); }).join(', ') + '</p>' : '';
    var h = '<div class="big"><span class="v' + (r.text ? ' txt' : '') + '">' + esc(fmt(r)) + '</span>' + (r.unit ? '<span class="un">' + esc(r.unit) + '</span>' : '') +
      (r.catLabel && r.cat != null ? '<span class="cat c' + r.cat + '">' + esc(r.catLabel) + '</span>' : '') + '</div>';
    r.lines.forEach(function (l) { h += '<p class="ln mut">' + esc(l) + '</p>'; });
    r.warn.forEach(function (w) { h += '<p class="wn">' + esc(w) + '</p>'; });
    if (r.action) h += '<p class="act">' + esc(r.action) + '</p>';
    return h;
  }
  function update() {
    var C = DEF.compute(S); last = C;
    renderDerived(C.d);
    $$('[data-res]').forEach(function (el) {
      var id = el.getAttribute('data-res'), r = C.r[id];
      el.innerHTML = resHTML(r);
      el.closest('.sc').setAttribute('data-cat', r.ok ? (r.cat == null ? 'x' : r.cat) : '');
    });
    if (view === 'summary') renderSummary();
  }

  /* ---------- summary ---------- */
  function summaryText() {
    var C = last || DEF.compute(S), p = C.p, d = C.d, L = [];
    var date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    L.push('Cardiac risk scores · ' + date);
    var pt = [];
    if (p.age) pt.push(p.age + ' y'); if (p.sex) pt.push(p.sex);
    if (p.sbp) pt.push('BP ' + p.sbp + (p.dbp ? '/' + p.dbp : '')); if (p.tc) pt.push('TC ' + chol(p.tc)); if (p.hdl) pt.push('HDL ' + chol(p.hdl));
    if (d.egfr) pt.push('eGFR ' + f0(d.egfr));
    var rf = ['smoker', 'dm', 'htn', 'famhx', 'cad', 'cevd', 'pad', 'hf'].filter(function (k) { return p[k]; }).map(function (k) { return F[k].label; });
    if (pt.length) L.push('Patient: ' + pt.join(', ') + (rf.length ? '; ' + rf.join(', ') : ''));
    L.push('');
    var list = scen === 'all' ? DEF.SCORES : visible(), n = 0;
    list.forEach(function (s) { var r = C.r[s.id]; if (r && r.ok && r.summary && !s.noSummary) { L.push('• ' + r.summary); n++; } });
    if (!n) L.push('No scores calculated yet.');
    L.push('', 'Scores support, and do not replace, clinical judgement.');
    return L.join('\n');
  }
  function renderSummary() {
    var t = summaryText();
    $('#summary').innerHTML = '<div class="colhead"><div class="note">' + (scen === 'all' ? 'All calculated scores' : 'Scores in “' + esc(DEF.SCEN.filter(function (c) { return c[0] === scen; })[0][1]) + '”') + '</div>' +
      '<div class="vt" role="group" aria-label="View"><button type="button" data-view="scores" aria-pressed="false">Scores</button><button type="button" data-view="summary" aria-pressed="true">Summary</button></div></div>' +
      '<div class="sum"><h2>Summary for the report</h2><pre id="sumtext">' + esc(t) + '</pre><div class="row"><button type="button" class="btn" data-act="copy">Copy summary</button><span class="note" id="copied" aria-live="polite"></span></div>' +
      '<p class="note">Paste into your echo, Holter or pre-op report. Choose a scenario first to copy only that set.</p></div>';
  }

  /* ---------- events ---------- */
  function setView(v) {
    view = v; document.body.setAttribute('data-view', v);
    $$('.views button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-view') === v); });
    $$('#scorecol .vt button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-view') === v); });
    if (v === 'summary') renderSummary();
    window.scrollTo(0, 0);
  }
  function refreshForms() { renderProfile(); renderIns(); renderAll(); update(); }
  function leaveExample() { if (isExample) { isExample = false; var ex = $('.example'); if (ex) ex.remove(); } }

  document.addEventListener('input', function (e) {
    var k = e.target.getAttribute && e.target.getAttribute('data-k');
    if (k) {
      var c = si(k), v = e.target.value;
      S[k] = v === '' ? '' : (c ? String(parseFloat(v) / c.f) : v);
      leaveExample();
      $$('input[data-k="' + k + '"]').forEach(function (el) { if (el !== e.target) el.value = shown(k); });
      var fd = F[k], n = parseFloat(S[k]), out = fd.min != null && !isNaN(n) && (n < fd.min || n > fd.max);
      e.target.closest('.f').classList.toggle('out', !!out);
      update();
    } else if (e.target.id === 'q') { q = e.target.value; renderScores(); }
  });
  document.addEventListener('change', function (e) {
    var sk = e.target.getAttribute && e.target.getAttribute('data-sel');
    if (sk) { S[sk] = e.target.value; leaveExample(); refreshForms(); return; }
    // Deferred: 'change' fires while focus is still moving, and re-rendering then would destroy the field being clicked into.
    if (e.target.getAttribute && e.target.getAttribute('data-k')) setTimeout(function () { var a = document.activeElement; if (!a || !a.closest || !a.closest('.ins')) renderIns(); }, 0);
  });
  document.addEventListener('focusout', function (e) {
    if (e.target.closest && e.target.closest('.ins') && e.target.getAttribute('data-k')) setTimeout(function () { var a = document.activeElement; if (!a || !a.closest || !a.closest('.ins')) renderIns(); }, 0);
  });
  document.addEventListener('toggle', function (e) {
    var g = e.target.getAttribute && e.target.getAttribute('data-g'); if (g) { openGroups[g] = e.target.open ? 1 : 0; store('open', openGroups); }
  }, true);
  document.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var k;
    if ((k = b.getAttribute('data-b'))) { S[k] = !DEF.val(S, k); leaveExample(); refreshForms(); return; }
    if ((k = b.getAttribute('data-ch'))) { S[k] = b.getAttribute('data-v'); leaveExample(); refreshForms(); return; }
    if ((k = b.getAttribute('data-fav'))) { var i = favs.indexOf(k); if (i > -1) favs.splice(i, 1); else favs.push(k); store('favs', favs); if (scen === 'fav') renderScores(); else { b.setAttribute('aria-pressed', i < 0); $('[data-scen="fav"]').textContent = 'Favourites (' + favs.length + ')'; } return; }
    if ((k = b.getAttribute('data-scen'))) { scen = k; renderScores(); return; }
    if ((k = b.getAttribute('data-view'))) { setView(k); return; }
    if ((k = b.getAttribute('data-units'))) { units = k; store('units', units); $$('[data-units]').forEach(function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-units') === units); }); refreshForms(); return; }
    var act = b.getAttribute('data-act');
    if (act === 'new') { S = {}; isExample = false; refreshForms(); if (window.innerWidth <= 900) setView('patient'); var f = $('#profile input'); if (f) f.focus(); }
    else if (act === 'example') { S = {}; Object.keys(EXAMPLE).forEach(function (x) { S[x] = EXAMPLE[x]; }); isExample = true; refreshForms(); }
    else if (act === 'reload') { location.reload(); }
    else if (act === 'copy') {
      var t = summaryText(), msg = $('#copied');
      var sel = function () { var el = $('#sumtext'), r = document.createRange(); r.selectNodeContents(el); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); msg.textContent = 'Text selected: press Ctrl+C (or Copy) to finish.'; };
      try { navigator.clipboard.writeText(t).then(function () { msg.textContent = 'Copied.'; }, sel); } catch (er) { sel(); }
    }
  });

  /* ---------- boot ---------- */
  $$('[data-units]').forEach(function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-units') === units); });
  renderProfile(); renderScores(); setView('scores');
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost') && !/claude|claudeusercontent/.test(location.hostname)) {
    try {
      // When an update has been downloaded: reload straight away if nothing has been entered, otherwise offer it.
      var hadCtl = !!navigator.serviceWorker.controller;
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (!hadCtl) { hadCtl = true; return; }
        if (isExample) { location.reload(); return; }
        var b = $('#updbar'); if (b) b.hidden = false;
      });
      navigator.serviceWorker.register('sw.js').catch(function () { });
    } catch (e) { }
  }
})();
