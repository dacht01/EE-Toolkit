/* EE-Toolkit – Schaltzeichen (IEC) und Schaltungs-Vorlagen */
(function (g) {
  'use strict';
  const E = g.EET, U = E.u;

  /* Symbole in lokalen Koordinaten: u entlang der Leitung, v quer dazu. hl = halbe Länge, hh = halbe Höhe */
  const SYM = {
    W: { hl: 0, hh: 0, d() {} },
    R: { hl: 30, hh: 11, d(S, G) { S.poly([G(-30, -11), G(30, -11), G(30, 11), G(-30, 11)], { w: 1.2 }, true); } },
    C: { hl: 5, hh: 17, d(S, G) { S.poly([G(-5, -17), G(-5, 17)], { w: 1.6 }); S.poly([G(5, -17), G(5, 17)], { w: 1.6 }); } },
    L: {
      hl: 30, hh: 9, d(S, G) {
        const pts = [];
        for (let k = 0; k < 4; k++) for (let i = 0; i <= 12; i++) { const a = Math.PI * (1 - i / 12); pts.push(G(-22.5 + 15 * k + 7.5 * Math.cos(a), 7.5 * Math.sin(a))); }
        S.poly(pts, { w: 1.2 });
      }
    },
    U: { hl: 17, hh: 17, d(S, G) { const o = G(0, 0); S.circle(o[0], o[1], 17, { w: 1.2 }); S.poly([G(-17, 0), G(17, 0)], {}); } },
    I: { hl: 17, hh: 17, d(S, G) { const o = G(0, 0); S.circle(o[0], o[1], 17, { w: 1.2 }); S.poly([G(0, -17), G(0, 17)], {}); } },
    AC: {
      hl: 17, hh: 17, d(S, G) {
        const o = G(0, 0), pts = []; S.circle(o[0], o[1], 17, { w: 1.2 });
        for (let i = -10; i <= 10; i++) pts.push([o[0] + i, o[1] - 5.5 * Math.sin(i / 10 * Math.PI)]);
        S.poly(pts, {});
      }
    },
    B: { hl: 4, hh: 16, d(S, G) { S.poly([G(-4, -16), G(-4, 16)], { w: 1.1 }); S.poly([G(4, -8), G(4, 8)], { w: 2.6 }); } },
    D: { hl: 11, hh: 11, d(S, G) { S.poly([G(-11, -11), G(-11, 11), G(11, 0)], { w: 1.2 }, true); S.poly([G(11, -11), G(11, 11)], { w: 1.2 }); } },
    LED: {
      hl: 11, hh: 22, d(S, G) {
        SYM.D.d(S, G);
        [[-5, 15, 3, 25], [5, 15, 13, 25]].forEach(q => { const a = G(q[0], q[1]), b = G(q[2], q[3]); S.arrow(a[0], a[1], b[0], b[1], { w: 0.7, head: 5 }); });
      }
    },
    ZD: { hl: 11, hh: 11, d(S, G) { SYM.D.d(S, G); S.poly([G(11, 11), G(6, 11)], { w: 1.2 }); } },
    S: {
      hl: 20, hh: 13, d(S, G, o, t) {
        const a = G(-20, 0), b = G(20, 0);
        S.poly([a, G(17, 14)], { w: 1.2 });
        S.circle(a[0], a[1], 2.6, { fill: t.bg, w: 0.9 }); S.circle(b[0], b[1], 2.6, { fill: t.bg, w: 0.9 });
      }
    },
    LAMP: { hl: 15, hh: 15, d(S, G) { const o = G(0, 0); S.circle(o[0], o[1], 15, { w: 1.2 }); S.poly([G(-10.6, -10.6), G(10.6, 10.6)], {}); S.poly([G(-10.6, 10.6), G(10.6, -10.6)], {}); } },
    VM: { hl: 16, hh: 16, d(S, G) { const o = G(0, 0); S.circle(o[0], o[1], 16, { w: 1.2 }); S.text(o[0], o[1], 'V', { bold: true }); } },
    AM: { hl: 16, hh: 16, d(S, G) { const o = G(0, 0); S.circle(o[0], o[1], 16, { w: 1.2 }); S.text(o[0], o[1], 'A', { bold: true }); } }
  };

  /* Bauteil zwischen zwei Punkten. o: {label, value, u (Spannungspfeil-Name), side (-1 = Beschriftung auf die andere Seite), urev} */
  function comp(S, type, x1, y1, x2, y2, o, c) {
    o = o || {};
    const L = Math.hypot(x2 - x1, y2 - y1), dx = (x2 - x1) / L, dy = (y2 - y1) / L, nx = dy, ny = -dx, cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
    const G = (u, v) => [cx + u * dx + v * nx, cy + u * dy + v * ny], sym = SYM[type] || SYM.R;
    if (L > 2 * sym.hl) { const a = G(-sym.hl, 0), b = G(sym.hl, 0); S.line(x1, y1, a[0], a[1], {}); S.line(b[0], b[1], x2, y2, {}); }
    sym.d(S, G, o, S.t);
    let sd = (nx < -0.01 || (Math.abs(nx) <= 0.01 && ny > 0)) ? -1 : 1; if (o.side) sd *= o.side;
    const place = (dist, sgn, text, opt) => {
      const sx = sgn * nx, sy = sgn * ny, q = G(0, sgn * dist);
      if (Math.abs(sx) > 0.4) S.text(q[0] + (sx > 0 ? 3 : -3), q[1], text, Object.assign({ a: sx > 0 ? 'start' : 'end' }, opt));
      else S.text(q[0], q[1], text, Object.assign({ b: sy < 0 ? 'bottom' : 'top' }, opt));
    };
    const vert = Math.abs(nx) > 0.4;
    if (o.label && o.value && vert) {
      const q = G(0, sd * (sym.hh + 7)), a = sd * nx > 0 ? 'start' : 'end';
      S.text(q[0], q[1] - 9, o.label, { a }); S.text(q[0], q[1] + 9, o.value, { a, s: 0.85 });
    } else if (o.label || o.value) place(sym.hh + 6, sd, o.label && o.value ? o.label + ' = ' + o.value : (o.label || o.value));
    if (o.u) {
      const col = c ? c.col(0) : S.t.fg, v = -sd * (sym.hh + 13), ua = Math.max(sym.hl + 3, 22) * (o.urev ? -1 : 1);
      const a = G(-ua, v), b = G(ua, v); S.arrow(a[0], a[1], b[0], b[1], { c: col, w: 0.9 });
      place(sym.hh + 19, -sd, o.u, { c: col, s: 0.9 });
    }
  }
  function curArrow(S, x, y, dx, dy, label, c, side) {
    const col = c.col(1), h = 6, nx = dy, ny = -dx;
    S.add(`<path d="M${U.r(x + dx * h)} ${U.r(y + dy * h)}L${U.r(x - dx * h + nx * 4.5)} ${U.r(y - dy * h + ny * 4.5)}L${U.r(x - dx * h - nx * 4.5)} ${U.r(y - dy * h - ny * 4.5)}Z" fill="${col}"/>`);
    const s = side || 1;
    if (Math.abs(nx) > 0.4) S.text(x + s * nx * 10, y, label, { c: col, s: 0.9, a: s * nx > 0 ? 'start' : 'end' });
    else S.text(x, y + s * ny * 9, label, { c: col, s: 0.9, b: s * ny < 0 ? 'bottom' : 'top' });
  }
  const node = (S, x, y) => S.dot(x, y, 3);
  const term = (S, x, y) => S.circle(x, y, 3.6, { fill: S.t.bg, w: 1 });
  function uArrow(S, x1, y1, x2, y2, label, c, left) {
    S.arrow(x1, y1, x2, y2, { c: c.col(0), w: 0.9 });
    S.text((x1 + x2) / 2 + (left ? -7 : 7), (y1 + y2) / 2, label, { c: c.col(0), s: 0.9, a: left ? 'end' : 'start' });
  }

  function parseEl(s) {
    s = s.trim(); let value = ''; const k = s.indexOf('=');
    if (k >= 0) { value = s.slice(k + 1).trim(); s = s.slice(0, k).trim(); }
    const up = s.toUpperCase(); let type = 'R';
    if (up.startsWith('LED')) type = 'LED'; else if (up.startsWith('LA') || up[0] === 'H') type = 'LAMP';
    else if (up[0] === 'L') type = 'L'; else if (up[0] === 'C') type = 'C'; else if (up.startsWith('ZD')) type = 'ZD'; else if (up[0] === 'D') type = 'D';
    else if (up[0] === 'S') type = 'S'; else if (up[0] === 'V') type = 'VM'; else if (up[0] === 'A') type = 'AM';
    return { type, label: s, value };
  }
  const els = (text, n, what) => {
    const a = String(text || '').split(';').map(s => s.trim()).filter(Boolean).map(parseEl);
    if (n && a.length !== n) throw new Error(what + ': genau ' + n + ' Bauteile angeben, getrennt mit ;');
    if (!a.length) throw new Error(what + ': mindestens ein Bauteil angeben');
    if (a.length > 8) throw new Error(what + ': höchstens 8 Bauteile');
    return a;
  };
  const sub = l => { const i = l.indexOf('_'); return i >= 0 ? l.slice(i + 1).replace(/[{}]/g, '') : l; };
  const uN = l => 'U_{' + sub(l) + '}';
  /* Pfeilnamen für eine Liste: gleiche Bauteilart -> Index (U_1), gemischt -> ganzer Name (U_{R1}) */
  const names = (e, pre) => { const same = e.every(q => q.label[0] === e[0].label[0]); return e.map(q => pre + '_{' + (same ? sub(q.label) : q.label.replace(/[_{}]/g, '')) + '}'); };

  const SRC = [['U', 'Spannungsquelle'], ['AC', 'Wechselspannungsquelle'], ['I', 'Stromquelle'], ['B', 'Batterie']];
  const KIND = [['reihe', 'Reihenschaltung'], ['parallel', 'Parallelschaltung'], ['teiler', 'Spannungsteiler'], ['quelle', 'Reale Quelle mit Last'], ['filter', 'Vierpol / Filter (Längs- und Querelement)'], ['bruecke', 'Wheatstone-Brücke']];

  E.add({
    id: 'schaltung', g: 4, name: 'Schaltungen (Vorlagen)',
    fields: [
      { k: 'kind', label: 'Schaltung', type: 'sel', def: 'reihe', opts: KIND, wide: true },
      { k: 'src', label: 'Quelle', type: 'sel', def: 'U', opts: SRC, show: p => p.kind !== 'filter' },
      { k: 'sl', label: 'Name der Quelle', def: 'U_q', show: p => p.kind !== 'filter' },
      { k: 'el', label: 'Bauteile (mit ; trennen, Wert mit =)', def: 'R_1; R_2; R_3', wide: true, show: p => p.kind === 'reihe' || p.kind === 'parallel', ph: 'z. B. R_1 = 1 kΩ; L; C' },
      { k: 'et', label: 'Bauteile oben; unten', def: 'R_1; R_2', wide: true, show: p => p.kind === 'teiler' },
      { k: 'eq', label: 'Innenwiderstand; Last', def: 'R_i; R_L', wide: true, show: p => p.kind === 'quelle' },
      { k: 'fs', label: 'Längselement', def: 'R', show: p => p.kind === 'filter' },
      { k: 'fq', label: 'Querelement', def: 'C', show: p => p.kind === 'filter' },
      { k: 'eb', label: 'Brückenwiderstände (4)', def: 'R_1; R_2; R_3; R_4', wide: true, show: p => p.kind === 'bruecke' },
      { k: 'arr', label: 'Spannungs- und Strompfeile', type: 'chk', def: true }
    ],
    presets: {
      'Reihenschaltung': { kind: 'reihe', src: 'U', el: 'R_1; R_2; R_3' },
      'Parallelschaltung': { kind: 'parallel', src: 'U', el: 'R_1; R_2; R_3' },
      'Spannungsteiler': { kind: 'teiler', src: 'U', et: 'R_1; R_2' },
      'RC-Tiefpass': { kind: 'filter', fs: 'R', fq: 'C' },
      'RC-Hochpass': { kind: 'filter', fs: 'C', fq: 'R' },
      'RLC-Serie': { kind: 'reihe', src: 'AC', el: 'R; L; C' },
      'RLC-Parallel': { kind: 'parallel', src: 'AC', el: 'R; L; C' }
    },
    draw(p, c) {
      const S = c.S, A = p.arr, W = (x1, y1, x2, y2) => S.line(x1, y1, x2, y2, {});
      const source = (x, y1, y2) => comp(S, p.src, x, y1, x, y2, A ? { u: p.sl } : { label: p.sl, side: -1 }, c);
      const C = (e, x1, y1, x2, y2, o) => comp(S, e.type, x1, y1, x2, y2, Object.assign({ label: e.label, value: e.value }, o || {}), c);
      if (p.kind === 'reihe') {
        const e = els(p.el, 0, 'Bauteile'), H = 150, seg = 124, x0 = 52, xe = x0 + e.length * seg + 14;
        source(0, 0, H); W(0, 0, x0, 0);
        const un = names(e, 'U');
        e.forEach((q, i) => C(q, x0 + i * seg, 0, x0 + (i + 1) * seg, 0, A ? { u: un[i] } : null));
        S.poly([[x0 + e.length * seg, 0], [xe, 0], [xe, H], [0, H]], {});
        if (A) curArrow(S, 28, 0, 1, 0, 'I', c);
      } else if (p.kind === 'parallel') {
        const e = els(p.el, 0, 'Bauteile'), H = 160, x0 = 110, dx = 104, xl = x0 + (e.length - 1) * dx;
        const inn = names(e, 'I');
        source(0, 0, H); W(0, 0, xl, 0); W(0, H, xl, H);
        e.forEach((q, i) => {
          const x = x0 + i * dx; C(q, x, 0, x, H);
          if (i < e.length - 1) { node(S, x, 0); node(S, x, H); }
          if (A) curArrow(S, x, 25, 0, 1, inn[i], c, -1);
        });
        if (A) curArrow(S, 52, 0, 1, 0, 'I', c);
      } else if (p.kind === 'teiler') {
        const e = els(p.et, 2, 'Spannungsteiler'), x = 150;
        source(0, 0, 250); W(0, 0, x, 0); W(0, 250, x, 250);
        C(e[0], x, 0, x, 125, A ? { u: uN(e[0].label) } : null); C(e[1], x, 125, x, 250);
        W(x, 125, x + 110, 125); W(x, 250, x + 110, 250); node(S, x, 125); node(S, x, 250);
        term(S, x + 110, 125); term(S, x + 110, 250);
        uArrow(S, x + 110, 139, x + 110, 236, uN(e[1].label), c);
        if (A) curArrow(S, 70, 0, 1, 0, 'I', c);
      } else if (p.kind === 'quelle') {
        const e = els(p.eq, 2, 'Reale Quelle'), H = 150;
        source(0, 0, H); C(e[0], 20, 0, 170, 0, A ? { u: uN(e[0].label) } : null); W(0, 0, 20, 0);
        W(170, 0, 290, 0); W(0, H, 290, H); C(e[1], 290, 0, 290, H);
        node(S, 200, 0); node(S, 200, H); S.text(200, -9, 'A', { b: 'bottom', bold: true, s: 0.9 }); S.text(200, H + 9, 'B', { b: 'top', bold: true, s: 0.9 });
        if (A) { uArrow(S, 200, 14, 200, H - 14, 'U_{KL}', c); curArrow(S, 248, 0, 1, 0, 'I', c); }
      } else if (p.kind === 'filter') {
        const s = parseEl(p.fs || 'R'), q = parseEl(p.fq || 'C'), H = 140;
        C(s, 30, 0, 180, 0); W(0, 0, 30, 0); W(180, 0, 270, 0); W(0, H, 270, H);
        C(q, 200, 0, 200, H); node(S, 200, 0); node(S, 200, H);
        [[0, 0], [0, H], [270, 0], [270, H]].forEach(z => term(S, z[0], z[1]));
        uArrow(S, 0, 14, 0, H - 14, 'U_e', c, true); uArrow(S, 270, 14, 270, H - 14, 'U_a', c);
      } else {
        const e = els(p.eb, 4, 'Brücke'), T = [150, -115], B = [150, 115], Lf = [35, 0], Rt = [265, 0];
        source(-80, -115, 115); W(-80, -115, T[0], T[1]); W(-80, 115, B[0], B[1]);
        C(e[0], T[0], T[1], Lf[0], Lf[1], { side: -1 }); C(e[1], Lf[0], Lf[1], B[0], B[1], { side: -1 });
        C(e[2], T[0], T[1], Rt[0], Rt[1]); C(e[3], Rt[0], Rt[1], B[0], B[1]);
        [T, B, Lf, Rt].forEach(z => node(S, z[0], z[1]));
        S.text(Lf[0] - 10, 0, 'A', { bold: true, s: 0.9, a: 'end' }); S.text(Rt[0] + 10, 0, 'B', { bold: true, s: 0.9, a: 'start' });
        S.arrow(Lf[0] + 22, 0, Rt[0] - 22, 0, { c: c.col(0), w: 0.9 }); S.text(150, 13, 'U_{AB}', { c: c.col(0), s: 0.9 });
        if (A) curArrow(S, 20, -115, 1, 0, 'I', c);
      }
    }
  });

  const SYMS = [['R', 'Widerstand'], ['C', 'Kondensator'], ['L', 'Spule'], ['U', 'Spannungsquelle'], ['I', 'Stromquelle'], ['AC', 'Wechselspannungsquelle'], ['B', 'Batterie'],
    ['D', 'Diode'], ['LED', 'Leuchtdiode'], ['ZD', 'Z-Diode'], ['S', 'Schalter'], ['LAMP', 'Lampe'], ['VM', 'Voltmeter'], ['AM', 'Amperemeter'], ['GND', 'Masse'], ['OPV', 'Operationsverstärker'], ['NPN', 'Transistor NPN']];
  E.add({
    id: 'symbol', g: 4, name: 'Schaltzeichen (IEC)',
    fields: [
      { k: 'sym', label: 'Symbol', type: 'sel', def: 'R', opts: SYMS },
      { k: 'dir', label: 'Ausrichtung', type: 'sel', def: 'h', opts: [['h', 'waagrecht'], ['v', 'senkrecht']], show: p => !['GND', 'OPV', 'NPN'].includes(p.sym) },
      { k: 'label', label: 'Name', def: 'R_1' }, { k: 'value', label: 'Wert', def: '', ph: 'z. B. 10 kΩ', show: p => !['GND', 'OPV', 'NPN'].includes(p.sym) },
      { k: 'u', label: 'Spannungspfeil (Name, leer = keiner)', def: '', show: p => !['GND', 'OPV', 'NPN'].includes(p.sym) },
      { k: 'kl', label: 'Anschlussklemmen', type: 'chk', def: true, show: p => !['GND', 'OPV', 'NPN'].includes(p.sym) }
    ],
    draw(p, c) {
      const S = c.S, t = S.t;
      if (p.sym === 'GND') {
        S.line(0, 0, 0, 22, {}); S.line(-17, 22, 17, 22, { w: 1.3 }); S.line(-11, 29, 11, 29, { w: 1.3 }); S.line(-5, 36, 5, 36, { w: 1.3 });
        if (p.label) S.text(24, 26, p.label, { a: 'start' });
      } else if (p.sym === 'OPV') {
        S.poly([[0, -46], [0, 46], [80, 0]], { w: 1.3 }, true);
        S.line(-34, -22, 0, -22, {}); S.line(-34, 22, 0, 22, {}); S.line(80, 0, 114, 0, {});
        S.text(12, -22, '−', { bold: true }); S.text(12, 22, '+', { bold: true });
        [[-34, -22], [-34, 22], [114, 0]].forEach(z => term(S, z[0], z[1]));
        if (p.label) S.text(34, -48, p.label, { b: 'bottom' });
      } else if (p.sym === 'NPN') {
        S.circle(4, 0, 30, { w: 1.2 }); S.line(-46, 0, -10, 0, {}); S.line(-10, -17, -10, 17, { w: 2.2 });
        S.poly([[-10, -8], [16, -24], [16, -52]], {}); S.arrow(-10, 8, 16, 24, {}); S.line(16, 24, 16, 52, {});
        [[-46, 0], [16, -52], [16, 52]].forEach(z => term(S, z[0], z[1]));
        S.text(-46, -11, 'B', { s: 0.85 }); S.text(27, -50, 'C', { s: 0.85 }); S.text(27, 50, 'E', { s: 0.85 });
        if (p.label) S.text(44, 0, p.label, { a: 'start' });
      } else {
        const o = { label: p.label, value: p.value, u: String(p.u || '').trim() || null }, L = 150;
        if (p.dir === 'v') { comp(S, p.sym, 0, 0, 0, L, o, c); if (p.kl) { term(S, 0, 0); term(S, 0, L); } }
        else { comp(S, p.sym, 0, 0, L, 0, o, c); if (p.kl) { term(S, 0, 0); term(S, L, 0); } }
      }
      void t;
    }
  });
  E.circ = { comp, SYM };
})(typeof window !== 'undefined' ? window : globalThis);
