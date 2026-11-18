/* EE-Toolkit – Oberfläche, Export, OneNote-Anbindung */
(function () {
  'use strict';
  const E = window.EET, $ = s => document.querySelector(s);
  const LS = 'eet.v1', ADDIN = /[?&]addin=1/.test(location.search);
  const st = { tool: 'kartesisch', theme: 'hell', size: '1', set: { mono: false, transparent: false, lw: 1.6, fs: 15, res: 3 }, p: {}, hist: [] };
  try {
    const s = JSON.parse(localStorage.getItem(LS) || '{}');
    Object.assign(st, s); st.set = Object.assign({ mono: false, transparent: false, lw: 1.6, fs: 15, res: 3 }, s.set || {});
    st.p = s.p || {}; st.hist = Array.isArray(s.hist) ? s.hist : [];
  } catch (e) { /* kein Speicher verfügbar: läuft ohne Merken */ }
  const save = () => { try { localStorage.setItem(LS, JSON.stringify(st)); } catch (e) { } };

  let tool = E.tools.find(t => t.id === st.tool) || E.tools[0], params = {}, lastSvg = '', timer = 0;
  const loadParams = () => { params = Object.assign(E.defaults(tool), st.p[tool.id] || {}); };

  /* ---------- Navigation ---------- */
  function buildNav() {
    const nav = $('#nav'), sel = $('#navSel'); nav.textContent = ''; sel.textContent = '';
    E.groups.forEach((gname, gi) => {
      const list = E.tools.filter(t => t.g === gi); if (!list.length) return;
      const h = document.createElement('h3'); h.textContent = gname; nav.appendChild(h);
      const og = document.createElement('optgroup'); og.label = gname; sel.appendChild(og);
      list.forEach(t => {
        const b = document.createElement('button'); b.type = 'button'; b.textContent = t.name; b.dataset.id = t.id;
        b.addEventListener('click', () => pick(t.id)); nav.appendChild(b);
        const o = document.createElement('option'); o.value = t.id; o.textContent = t.name; og.appendChild(o);
      });
    });
    sel.addEventListener('change', () => pick(sel.value));
  }
  function pick(id, keep) {
    tool = E.tools.find(t => t.id === id) || E.tools[0]; st.tool = tool.id;
    if (!keep) loadParams();
    document.querySelectorAll('#nav button').forEach(b => b.setAttribute('aria-current', b.dataset.id === tool.id ? 'true' : 'false'));
    $('#navSel').value = tool.id; $('#toolName').textContent = tool.name;
    buildForm(); render(); save();
  }

  /* ---------- Formular ---------- */
  function buildForm() {
    const form = $('#form'), pr = $('#presets'); form.textContent = ''; pr.textContent = '';
    if (tool.presets) {
      const s = document.createElement('span'); s.textContent = 'Vorlagen:'; pr.appendChild(s);
      Object.keys(tool.presets).forEach(name => {
        const b = document.createElement('button'); b.type = 'button'; b.textContent = name;
        b.addEventListener('click', () => { Object.assign(params, tool.presets[name]); st.p[tool.id] = params; buildForm(); render(); save(); });
        pr.appendChild(b);
      });
    }
    tool.fields.forEach(f => {
      const w = document.createElement('div'), type = f.type || 'text';
      w.className = 'f' + (f.wide || type === 'area' ? ' wide' : '') + (type === 'chk' ? ' chk' : ''); w.dataset.k = f.k;
      const lb = document.createElement('label'); let inp;
      if (type === 'sel') {
        inp = document.createElement('select');
        f.opts.forEach(o => { const op = document.createElement('option'); op.value = o[0]; op.textContent = o[1]; inp.appendChild(op); });
        inp.value = params[f.k];
      } else if (type === 'chk') { inp = document.createElement('input'); inp.type = 'checkbox'; inp.checked = !!params[f.k]; }
      else if (type === 'area') { inp = document.createElement('textarea'); inp.value = params[f.k]; inp.spellcheck = false; }
      else { inp = document.createElement('input'); inp.type = 'text'; inp.value = params[f.k]; inp.spellcheck = false; inp.autocapitalize = 'off'; if (f.ph) inp.placeholder = f.ph; }
      inp.addEventListener(type === 'sel' || type === 'chk' ? 'change' : 'input', () => {
        params[f.k] = type === 'chk' ? inp.checked : inp.value; st.p[tool.id] = params; applyShow(); schedule();
      });
      if (type === 'chk') { lb.appendChild(inp); lb.appendChild(document.createTextNode(f.label.replace(/_\{?(\w+)\}?/g, '$1'))); }
      else { lb.appendChild(document.createTextNode(f.label)); lb.appendChild(inp); }
      w.appendChild(lb); form.appendChild(w);
    });
    applyShow();
  }
  function applyShow() {
    tool.fields.forEach(f => { if (f.show) { const w = document.querySelector('#form .f[data-k="' + f.k + '"]'); if (w) w.hidden = !f.show(params); } });
  }
  function schedule() { clearTimeout(timer); timer = setTimeout(() => { render(); save(); }, 80); }

  /* ---------- Zeichnen ---------- */
  function render() {
    const err = $('#err'), pv = $('#preview');
    try {
      lastSvg = E.render(tool, params, { theme: st.theme, mono: st.set.mono, transparent: st.set.transparent, lw: +st.set.lw, fs: +st.set.fs, scale: +st.size });
      pv.innerHTML = lastSvg; pv.classList.remove('stale'); err.hidden = true;
    } catch (e) {
      lastSvg = ''; pv.classList.add('stale'); err.textContent = e.message; err.hidden = false;
    }
    $('#stage').className = st.theme;
    ['#btnCopy', '#btnPng', '#btnSvg', '#btnShare', '#btnInsert'].forEach(s => { $(s).disabled = !lastSvg; });
  }

  /* ---------- Export ---------- */
  const toast = t => { $('#toast').textContent = t; };
  const fileName = ext => 'ee-' + tool.id + '-' + new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '') + '.' + ext;
  function toPng() {
    return new Promise((res, rej) => {
      if (!lastSvg) return rej(new Error('Keine Zeichnung vorhanden'));
      const m = lastSvg.match(/width="([\d.]+)" height="([\d.]+)"/), w = +m[1], h = +m[2], k = +st.set.res, img = new Image();
      img.onload = () => {
        const cv = document.createElement('canvas'); cv.width = Math.round(w * k); cv.height = Math.round(h * k);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        cv.toBlob(b => b ? res({ blob: b, w, h, cv }) : rej(new Error('PNG konnte nicht erzeugt werden')), 'image/png');
      };
      img.onerror = () => rej(new Error('PNG konnte nicht erzeugt werden'));
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(lastSvg);
    });
  }
  function download(blob, name) {
    const a = document.createElement('a'), url = URL.createObjectURL(blob);
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
  function remember() {
    const entry = { id: tool.id, name: tool.name, p: JSON.parse(JSON.stringify(params)), t: Date.now() };
    const same = st.hist[0] && st.hist[0].id === entry.id && JSON.stringify(st.hist[0].p) === JSON.stringify(entry.p);
    if (!same) { st.hist.unshift(entry); st.hist = st.hist.slice(0, 30); }
    save();
  }
  async function copy() {
    try {
      if (!navigator.clipboard || !window.ClipboardItem) throw new Error('Zwischenablage nicht verfügbar');
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': toPng().then(r => r.blob) })]);
      remember(); toast('Kopiert. Jetzt in OneNote einfügen (Ctrl+V oder lange tippen → Einfügen).');
    } catch (e) { toast('Kopieren ging nicht (' + e.message + '). Nimm «PNG speichern» oder «Teilen».'); }
  }
  async function share() {
    try {
      const r = await toPng(), f = new File([r.blob], fileName('png'), { type: 'image/png' });
      await navigator.share({ files: [f] }); remember(); toast('Geteilt.');
    } catch (e) { if (e.name !== 'AbortError') toast('Teilen ging nicht (' + e.message + ').'); }
  }
  async function savePng() {
    try { const r = await toPng(); download(r.blob, fileName('png')); remember(); toast('PNG gespeichert.'); }
    catch (e) { toast(e.message); }
  }
  function saveSvg() { if (!lastSvg) return; download(new Blob([lastSvg], { type: 'image/svg+xml' }), fileName('svg')); remember(); toast('SVG gespeichert.'); }

  /* ---------- OneNote Web (Add-in) ---------- */
  async function insertOneNote() {
    try {
      const r = await toPng(), b64 = r.cv.toDataURL('image/png').split(',')[1];
      const viaSelection = () => new Promise((res, rej) => {
        Office.context.document.setSelectedDataAsync(b64, { coercionType: Office.CoercionType.Image, imageWidth: r.w, imageHeight: r.h },
          a => a.status === Office.AsyncResultStatus.Succeeded ? res() : rej(new Error(a.error && a.error.message || 'Einfügen fehlgeschlagen')));
      });
      const viaOutline = () => OneNote.run(async ctx => {
        const outline = ctx.application.getActivePage().addOutline(60, 140, '<p></p>');
        outline.appendImage(b64, r.w, r.h); await ctx.sync();
      });
      try { await viaSelection(); } catch (e1) { await viaOutline(); }
      remember(); toast('In die Seite eingefügt.');
    } catch (e) { toast('Einfügen ging nicht (' + e.message + '). Nimm «Kopieren» und füge mit Ctrl+V ein.'); }
  }
  function manifestXml(base) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<OfficeApp xmlns="http://schemas.microsoft.com/office/appforoffice/1.1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="TaskPaneApp">
  <Id>7c1f4a52-9b3e-4d6a-8f21-5e0c3a9d7b14</Id>
  <Version>1.0.0.0</Version>
  <ProviderName>EE-Toolkit</ProviderName>
  <DefaultLocale>de-CH</DefaultLocale>
  <DisplayName DefaultValue="EE-Toolkit"/>
  <Description DefaultValue="Geometrie, Koordinatensysteme, Schaltungen und Diagramme als Bild in die Seite einfügen."/>
  <IconUrl DefaultValue="${base}icons/icon-32.png"/>
  <HighResolutionIconUrl DefaultValue="${base}icons/icon-80.png"/>
  <SupportUrl DefaultValue="${base}"/>
  <Hosts>
    <Host Name="Notebook"/>
  </Hosts>
  <DefaultSettings>
    <SourceLocation DefaultValue="${base}index.html?addin=1"/>
  </DefaultSettings>
  <Permissions>ReadWriteDocument</Permissions>
</OfficeApp>
`;
  }
  function downloadManifest() {
    if (location.protocol !== 'https:') { toast('Das Manifest braucht eine https-Adresse. Öffne die App zuerst über GitHub Pages.'); $('#dlgSet').close(); return; }
    const base = location.href.replace(/[?#].*$/, '').replace(/[^/]*$/, '');
    download(new Blob([manifestXml(base)], { type: 'application/xml' }), 'ee-toolkit-onenote-manifest.xml');
  }

  /* ---------- Dialoge ---------- */
  function openHist() {
    const ul = $('#histList'); ul.textContent = '';
    if (!st.hist.length) { const li = document.createElement('li'); li.textContent = 'Noch nichts exportiert.'; ul.appendChild(li); }
    st.hist.forEach(h => {
      const li = document.createElement('li'), b = document.createElement('button'), sm = document.createElement('small');
      b.type = 'button'; b.textContent = h.name; sm.textContent = new Date(h.t).toLocaleString('de-CH', { dateStyle: 'short', timeStyle: 'short' });
      b.appendChild(sm);
      b.addEventListener('click', () => {
        const t = E.tools.find(x => x.id === h.id); if (!t) return;
        tool = t; params = Object.assign(E.defaults(t), h.p); st.p[t.id] = params; pick(t.id, true); $('#dlgHist').close();
      });
      li.appendChild(b); ul.appendChild(li);
    });
    $('#dlgHist').showModal();
  }
  function bindSettings() {
    const map = [['#setMono', 'mono', v => v === '1', v => v ? '1' : '0'], ['#setTr', 'transparent', v => v === '1', v => v ? '1' : '0'],
      ['#setLw', 'lw', Number, String], ['#setFs', 'fs', Number, String], ['#setRes', 'res', Number, String]];
    map.forEach(([sel, key, inF, outF]) => {
      const el = $(sel); el.value = outF(st.set[key]);
      el.addEventListener('change', () => { st.set[key] = inF(el.value); render(); save(); });
    });
  }

  /* ---------- Start ---------- */
  buildNav(); bindSettings();
  document.querySelectorAll('.seg button').forEach(b => {
    b.addEventListener('click', () => { st.theme = b.dataset.theme; setTheme(); render(); save(); });
  });
  function setTheme() { document.querySelectorAll('.seg button').forEach(b => b.setAttribute('aria-pressed', b.dataset.theme === st.theme ? 'true' : 'false')); }
  setTheme();
  $('#size').value = st.size; if (!$('#size').value) { st.size = '1'; $('#size').value = '1'; }
  $('#size').addEventListener('change', () => { st.size = $('#size').value; render(); save(); });
  $('#btnReset').addEventListener('click', () => { delete st.p[tool.id]; loadParams(); buildForm(); render(); save(); });
  $('#btnCopy').addEventListener('click', copy); $('#btnPng').addEventListener('click', savePng); $('#btnSvg').addEventListener('click', saveSvg);
  $('#btnShare').addEventListener('click', share); $('#btnInsert').addEventListener('click', insertOneNote);
  $('#btnSet').addEventListener('click', () => $('#dlgSet').showModal());
  $('#btnHelp').addEventListener('click', () => $('#dlgHelp').showModal());
  $('#btnHist').addEventListener('click', openHist);
  $('#btnHistClear').addEventListener('click', () => { st.hist = []; save(); openHist(); });
  $('#btnManifest').addEventListener('click', downloadManifest);
  document.querySelectorAll('dialog [data-close]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));
  document.querySelectorAll('dialog').forEach(d => d.addEventListener('click', e => { if (e.target === d) d.close(); }));

  try {
    const probe = new File([new Blob(['x'], { type: 'image/png' })], 'x.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [probe] })) $('#btnShare').hidden = false;
  } catch (e) { }
  if (ADDIN && window.Office) {
    Office.onReady(() => { $('#btnInsert').hidden = false; $('#btnCopy').classList.remove('primary'); });
  }
  loadParams(); pick(tool.id, true);

  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { });
})();
