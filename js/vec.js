/* EE-Toolkit – Vektoren, lineare Abbildung, 3D-Achsen, Zeiger, Kräfte, schiefe Ebene */
(function (g) {
  'use strict';
  const E = g.EET, U = E.u, D = Math.PI / 180;
  const { rd, niceStep, vecLabel } = U;

  /* ---------- Vektoren 2D ---------- */
  E.add({
    id: 'vektoren', g: 2, name: 'Vektoren 2D',
    fields: [
      { k: 'list', label: 'Vektoren: Name; x; y (optional: ; Start x; Start y)', type: 'area', def: 'a; 3; 1\nb; 1; 2', wide: true },
      { k: 'sum', label: 'Summe der ersten zwei (Parallelogramm)', type: 'chk', def: true },
      { k: 'sname', label: 'Name der Summe', def: 'a+b' },
      { k: 'pfeil', label: 'Pfeil über den Namen', type: 'chk', def: true },
      { k: 'komp', label: 'Komponenten anschreiben', type: 'chk' },
      { k: 'grid', label: 'Raster', type: 'chk', def: true }
    ],
    draw(p, c) {
      const S = c.S, rws = U.rows(p.list, 3, 'Vektoren');
      if (!rws.length) throw new Error('Mindestens einen Vektor eingeben, z. B. "a; 3; 1"');
      const vs = rws.map((q, i) => ({ n: q[0], x: U.num(q[1], 'x'), y: U.num(q[2], 'y'), x0: q[3] ? U.num(q[3], 'Start x') : 0, y0: q[4] ? U.num(q[4], 'Start y') : 0, col: c.col(i) }));
      const pts = [[0, 0]]; vs.forEach(v => { pts.push([v.x0, v.y0], [v.x0 + v.x, v.y0 + v.y]); });
      let sum = null;
      if (p.sum && vs.length >= 2) { sum = { x0: vs[0].x0, y0: vs[0].y0, x: vs[0].x + vs[1].x, y: vs[0].y + vs[1].y }; pts.push([sum.x0 + sum.x, sum.y0 + sum.y]); }
      const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
      const pad = niceStep(Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) || 1, 4);
      const xmin = Math.floor(Math.min(...xs) / pad) * pad - pad, xmax = Math.ceil(Math.max(...xs) / pad) * pad + pad;
      const ymin = Math.floor(Math.min(...ys) / pad) * pad - pad, ymax = Math.ceil(Math.max(...ys) / pad) * pad + pad;
      const u = Math.min(60, 400 / Math.max(xmax - xmin, ymax - ymin)), bx = { x: 0, y: 0, w: (xmax - xmin) * u, h: (ymax - ymin) * u };
      const st = pad;
      const m = E.plot.axesCross(S, bx, { xmin, xmax, ymin, ymax, xstep: st, ystep: st, grid: p.grid ? 1 : 0, nums: true, xlabel: 'x', ylabel: 'y' });
      const arrow = (v, col, w, name) => {
        const A = [m.X(v.x0), m.Y(v.y0)], B = [m.X(v.x0 + v.x), m.Y(v.y0 + v.y)], L = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1;
        S.arrow(A[0], A[1], B[0], B[1], { c: col, w });
        const nx = (B[1] - A[1]) / L, ny = -(B[0] - A[0]) / L, t = p.komp ? ' = (' + rd(v.x) + ' | ' + rd(v.y) + ')' : '';
        const mx = (A[0] + B[0]) / 2 + nx * 15, my = (A[1] + B[1]) / 2 + ny * 15;
        vecLabel(S, mx, my, name, col, p.pfeil);
        if (t) S.text(mx + U.textW(name, S.fs) / 2 + 3, my, t, { a: 'start', c: col, s: 0.85 });
      };
      if (sum) {
        const a = vs[0], b = vs[1];
        S.line(m.X(a.x0 + a.x), m.Y(a.y0 + a.y), m.X(sum.x0 + sum.x), m.Y(sum.y0 + sum.y), { dash: [4, 3], c: b.col, w: 0.8 });
        S.line(m.X(a.x0 + b.x), m.Y(a.y0 + b.y), m.X(sum.x0 + sum.x), m.Y(sum.y0 + sum.y), { dash: [4, 3], c: a.col, w: 0.8 });
      }
      vs.forEach(v => arrow(v, v.col, 1.5, v.n));
      if (sum) arrow(sum, c.t.fg, 1.5, p.sname || 'a+b');
    }
  });

  /* ---------- Lineare Abbildung ---------- */
  E.add({
    id: 'abbildung', g: 2, name: 'Lineare Abbildung (2×2-Matrix)',
    fields: [
      { k: 'a11', label: 'a₁₁', def: '1' }, { k: 'a12', label: 'a₁₂', def: '1' },
      { k: 'a21', label: 'a₂₁', def: '0' }, { k: 'a22', label: 'a₂₂', def: '1.5' },
      { k: 'n', label: 'Bereich ±', type: 'sel', def: '3', opts: [['2', '2'], ['3', '3'], ['4', '4'], ['6', '6']] },
      { k: 'gitter', label: 'Abgebildetes Gitter', type: 'chk', def: true }
    ],
    presets: {
      'Scherung': { a11: '1', a12: '1', a21: '0', a22: '1' },
      'Drehung 30°': { a11: 'cos(pi/6)', a12: '-sin(pi/6)', a21: 'sin(pi/6)', a22: 'cos(pi/6)' },
      'Streckung': { a11: '2', a12: '0', a21: '0', a22: '0.5' },
      'Spiegelung an y = x': { a11: '0', a12: '1', a21: '1', a22: '0' },
      'Projektion auf x': { a11: '1', a12: '0', a21: '0', a22: '0' }
    },
    draw(p, c) {
      const S = c.S, a = c.N('a11'), b = c.N('a12'), cc = c.N('a21'), d = c.N('a22'), n = +p.n, W = 380, bx = { x: 0, y: 0, w: W, h: W };
      const m = E.plot.axesCross(S, bx, { xmin: -n, xmax: n, ymin: -n, ymax: n, xstep: 1, ystep: 1, grid: 1, nums: true, xlabel: 'x', ylabel: 'y' });
      const M = (x, y) => [m.X(a * x + b * y), m.Y(cc * x + d * y)], id = S.clipRect(0, 0, W, W), r = U.r;
      if (p.gitter) {
        let dd = ''; const Lg = 4 * n;
        for (let i = -Lg; i <= Lg; i++) {
          const A = M(i, -Lg), B = M(i, Lg), C = M(-Lg, i), F = M(Lg, i);
          dd += `M${r(A[0])} ${r(A[1])}L${r(B[0])} ${r(B[1])}M${r(C[0])} ${r(C[1])}L${r(F[0])} ${r(F[1])}`;
        }
        S.add(`<path d="${dd}" clip-path="url(#${id})" ${S.st({ c: c.col(0), w: 0.6, op: 0.75 })}/>`);
      }
      const sq = [M(0, 0), M(1, 0), M(1, 1), M(0, 1)].map(q => r(q[0]) + ' ' + r(q[1])).join('L');
      S.add(`<path d="M${sq}Z" clip-path="url(#${id})" ${S.st({ c: c.col(0), fill: c.col(0), fop: 0.25, w: 0.8 })}/>`);
      const O = M(0, 0), e1 = M(1, 0), e2 = M(0, 1);
      S.arrow(O[0], O[1], e1[0], e1[1], { c: c.col(1), w: 1.6 }); S.arrow(O[0], O[1], e2[0], e2[1], { c: c.col(2), w: 1.6 });
      const lp = (q, t, col) => { const L = Math.hypot(q[0] - O[0], q[1] - O[1]) || 1; S.text(q[0] + (q[0] - O[0]) / L * 14, q[1] + (q[1] - O[1]) / L * 14, t, { c: col, bold: true }); };
      lp(e1, "e_1'", c.col(1)); lp(e2, "e_2'", c.col(2));
      const sp = '\u00a0\u00a0';
      S.text(0, -34, 'A = [' + rd(a) + sp + rd(b) + ' ; ' + rd(cc) + sp + rd(d) + ']' + sp + sp + sp + 'det A = ' + rd(a * d - b * cc, 3), { a: 'start', b: 'bottom', s: 0.9 });
    }
  });

  /* ---------- 3D-Koordinatensystem ---------- */
  E.add({
    id: 'ks3d', g: 1, name: '3D-Koordinatensystem',
    fields: [
      { k: 'xmax', label: 'x max', def: '4' }, { k: 'ymax', label: 'y max', def: '4' }, { k: 'zmax', label: 'z max', def: '4' },
      { k: 'step', label: 'Schritt', def: '1' },
      { k: 'xl', label: 'Name x', def: 'x' }, { k: 'yl', label: 'Name y', def: 'y' }, { k: 'zl', label: 'Name z', def: 'z' },
      { k: 'nums', label: 'Zahlen an den Achsen', type: 'chk', def: true },
      { k: 'neg', label: 'Negative Achsen (gestrichelt)', type: 'chk' },
      { k: 'list', label: 'Punkte / Vektoren: Name; x; y; z', type: 'area', def: 'P; 2; 3; 2', wide: true },
      { k: 'mode', label: 'Darstellen als', type: 'sel', def: 'vek', opts: [['pkt', 'Punkte'], ['vek', 'Ortsvektoren']] },
      { k: 'hilf', label: 'Hilfslinien', type: 'chk', def: true }
    ],
    draw(p, c) {
      const S = c.S, xm = c.N('xmax'), ym = c.N('ymax'), zm = c.N('zmax'), st = c.N('step');
      if (!(xm > 0 && ym > 0 && zm > 0 && st > 0)) throw new Error('Achsenlängen und Schritt müssen grösser als 0 sein');
      if (Math.max(xm, ym, zm) / st > 40) throw new Error('Schritt zu klein');
      const u = Math.min(46, 300 / Math.max(xm * 0.5, ym, zm)), q = 0.5 * Math.SQRT1_2;
      const P = (x, y, z) => [(y - q * x) * u, (-z + q * x) * u], O = P(0, 0, 0);
      const axes = [[xm, 0, 0, p.xl], [0, ym, 0, p.yl], [0, 0, zm, p.zl]];
      axes.forEach(([x, y, z, l], i) => {
        const L = Math.hypot(x, y, z), k = (L + 0.7 * st) / L, T = P(x * k, y * k, z * k);
        if (p.neg) { const N = P(-x * 0.6, -y * 0.6, -z * 0.6); S.line(O[0], O[1], N[0], N[1], { dash: [4, 3], w: 0.7 }); }
        S.arrow(O[0], O[1], T[0], T[1], {});
        S.text(T[0] + [-10, 4, 11][i], T[1] + [8, -12, 0][i], l, { a: i === 2 ? 'start' : 'middle' });
        for (let v = st; v <= L + 1e-9; v += st) {
          const A = P(x * v / L, y * v / L, z * v / L);
          if (i === 1) S.line(A[0], A[1] - 3.5, A[0], A[1] + 3.5, { w: 0.8 }); else S.line(A[0] - 3.5, A[1], A[0] + 3.5, A[1], { w: 0.8 });
          if (p.nums) { if (i === 1) S.text(A[0], A[1] + 7, U.fmt(v), { b: 'top', s: 0.72 }); else S.text(A[0] - 7, A[1] + (i === 0 ? -1 : 0), U.fmt(v), { a: 'end', s: 0.72 }); }
        }
      });
      U.rows(p.list, 4, 'Punkte').forEach((w, i) => {
        const x = U.num(w[1], 'x'), y = U.num(w[2], 'y'), z = U.num(w[3], 'z'), col = c.col(i), T = P(x, y, z);
        if (p.hilf) {
          const h = { dash: [4, 3], c: c.t.grid, w: 0.8 }, A = P(x, 0, 0), B = P(x, y, 0), C = P(0, y, 0);
          S.poly([A, B, C], h); S.line(B[0], B[1], T[0], T[1], h);
          S.line(O[0], O[1], B[0], B[1], { dash: [2, 3], c: c.t.grid, w: 0.7 });
        }
        if (p.mode === 'vek') { S.arrow(O[0], O[1], T[0], T[1], { c: col, w: 1.5 }); vecLabel(S, T[0] + 14, T[1] - 12, w[0], col, true); }
        else { S.dot(T[0], T[1], 3.4, col); S.text(T[0] + 9, T[1] - 9, w[0] + ' (' + rd(x) + ' | ' + rd(y) + ' | ' + rd(z) + ')', { a: 'start', c: col, s: 0.9 }); }
      });
    }
  });

  /* ---------- Zeiger / Kräfte ---------- */
  function pointers(p, c, body) {
    const S = c.S, rws = U.rows(p.list, 3, body ? 'Kräfte' : 'Zeiger');
    if (!rws.length) throw new Error('Mindestens eine Zeile eingeben, z. B. "U; 5; 30"');
    const vs = rws.map((q, i) => {
      const a = U.num(q[1], q[0]), b = U.num(q[2], q[0]);
      const v = p.inp === 'kart' ? { x: a, y: b } : { x: a * Math.cos(b * D), y: a * Math.sin(b * D) };
      v.n = q[0]; v.col = c.col(i); v.B = Math.hypot(v.x, v.y); v.ang = Math.atan2(v.y, v.x); return v;
    });
    let cx = 0, cy = 0; const chain = p.chain && !body;
    vs.forEach(v => { v.x0 = chain ? cx : 0; v.y0 = chain ? cy : 0; cx += v.x; cy += v.y; });
    const pts = [[0, 0]]; vs.forEach(v => pts.push([v.x0 + v.x, v.y0 + v.y])); if (p.sum) pts.push([cx, cy]);
    const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
    const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) || 1, k = 300 / span;
    const P = (x, y) => [x * k, -y * k];
    if (body) { S.rect(-38, -25, 76, 50, { fill: c.t.fill, w: 1.2 }); }
    if (p.axes && p.axes !== 'none' && !body) {
      const pad = 0.1 * span, lo = v => Math.min(v, -0.18 * span) - pad, hi = v => Math.max(v, 0.18 * span) + pad;
      const A = P(lo(Math.min(...xs)), 0), B = P(hi(Math.max(...xs)), 0), C = P(0, lo(Math.min(...ys))), F = P(0, hi(Math.max(...ys)));
      S.arrow(A[0], A[1], B[0], B[1], { w: 0.7 }); S.arrow(C[0], C[1], F[0], F[1], { w: 0.7 });
      S.text(B[0], B[1] + 15, p.axes === 're' ? 'Re' : 'x', { a: 'end', s: 0.85 }); S.text(F[0] - 9, F[1] + 4, p.axes === 're' ? 'Im' : 'y', { a: 'end', s: 0.85 });
    }
    const draw = (v, col, w, name) => {
      const A = P(v.x0, v.y0), B = P(v.x0 + v.x, v.y0 + v.y), L = Math.hypot(B[0] - A[0], B[1] - A[1]);
      if (L < 0.5) return;
      S.arrow(A[0], A[1], B[0], B[1], { c: col, w });
      const t = p.vals ? name + ' = ' + rd(v.B) + ' ∠ ' + rd(v.ang / D, 1) + '°' : name;
      const tw = U.textW(t, S.fs * 0.95) / 2, ux = (B[0] - A[0]) / L, uy = (B[1] - A[1]) / L;
      if (body) S.text(B[0] + ux * (10 + tw * Math.abs(ux)), B[1] + uy * 13, t, { c: col, s: 0.95 });
      else U.besideLine(S, A, B, null, t, { c: col, s: 0.95 });
    };
    if (p.arcs && !chain) vs.forEach((v, i) => {
      if (Math.abs(v.ang) < 0.03) return;
      S.poly(U.arcPts(0, 0, 26 + i * 9, 0, v.ang), { c: v.col, w: 0.7 });
    });
    if (p.sum && !chain && vs.length === 2) {
      const T = P(cx, cy), A = P(vs[0].x, vs[0].y), B = P(vs[1].x, vs[1].y);
      S.line(A[0], A[1], T[0], T[1], { dash: [4, 3], c: vs[1].col, w: 0.8 }); S.line(B[0], B[1], T[0], T[1], { dash: [4, 3], c: vs[0].col, w: 0.8 });
    }
    vs.forEach(v => draw(v, v.col, 1.5, v.n));
    if (p.sum) draw({ x0: 0, y0: 0, x: cx, y: cy, B: Math.hypot(cx, cy), ang: Math.atan2(cy, cx) }, c.t.fg, 1.7, p.sname || (body ? 'F_{res}' : 'U'));
    if (body) S.dot(0, 0, 2.6);
  }
  E.add({
    id: 'zeiger', g: 4, name: 'Zeigerdiagramm / komplexe Ebene',
    fields: [
      { k: 'inp', label: 'Eingabe', type: 'sel', def: 'polar', opts: [['polar', 'Name; Betrag; Winkel (°)'], ['kart', 'Name; Realteil; Imaginärteil']] },
      { k: 'list', label: 'Zeiger (eine Zeile pro Zeiger)', type: 'area', def: 'U_R; 4; 0\nU_L; 3; 90', wide: true },
      { k: 'chain', label: 'Zeiger aneinanderhängen', type: 'chk', def: true },
      { k: 'sum', label: 'Summe einzeichnen', type: 'chk', def: true },
      { k: 'sname', label: 'Name der Summe', def: 'U' },
      { k: 'axes', label: 'Achsen', type: 'sel', def: 're', opts: [['re', 'Re / Im'], ['xy', 'x / y'], ['none', 'keine']] },
      { k: 'arcs', label: 'Winkelbögen (nur ohne Aneinanderhängen)', type: 'chk' },
      { k: 'vals', label: 'Betrag und Winkel anschreiben', type: 'chk' }
    ],
    presets: {
      'RL-Serie': { inp: 'polar', list: 'U_R; 4; 0\nU_L; 3; 90', chain: true, sum: true, sname: 'U', axes: 're' },
      'RLC-Serie': { inp: 'polar', list: 'U_R; 4; 0\nU_L; 5; 90\nU_C; 2; -90', chain: true, sum: true, sname: 'U', axes: 're' },
      'Drehstrom': { inp: 'polar', list: 'U_1; 230; 90\nU_2; 230; -30\nU_3; 230; -150', chain: false, sum: false, axes: 'none', arcs: false },
      'Komplexe Zahlen': { inp: 'kart', list: 'z_1; 3; 2\nz_2; -2; 1.5\nz_3; 1; -2', chain: false, sum: false, axes: 're', arcs: true }
    },
    draw(p, c) { pointers(p, c, false); }
  });
  E.add({
    id: 'kraefte', g: 3, name: 'Kräfte (Freikörperbild)',
    fields: [
      { k: 'inp', label: 'Eingabe', type: 'sel', def: 'polar', opts: [['polar', 'Name; Betrag; Winkel (°)'], ['kart', 'Name; F_x; F_y']] },
      { k: 'list', label: 'Kräfte (eine Zeile pro Kraft)', type: 'area', def: 'F_G; 40; -90\nF_N; 40; 90\nF; 30; 20\nF_R; 15; 180', wide: true },
      { k: 'sum', label: 'Resultierende einzeichnen', type: 'chk' },
      { k: 'sname', label: 'Name der Resultierenden', def: 'F_{res}' },
      { k: 'vals', label: 'Betrag und Winkel anschreiben', type: 'chk' }
    ],
    draw(p, c) { pointers(p, c, true); }
  });

  /* ---------- Schiefe Ebene ---------- */
  E.add({
    id: 'ebene', g: 3, name: 'Schiefe Ebene',
    fields: [
      { k: 'al', label: 'Neigungswinkel α (°)', def: '30' },
      { k: 'fg', label: 'Gewichtskraft F_G', type: 'chk', def: true },
      { k: 'zer', label: 'Zerlegung in Hangabtrieb und Normalkomponente', type: 'chk', def: true },
      { k: 'fn', label: 'Normalkraft F_N', type: 'chk' },
      { k: 'fr', label: 'Reibungskraft F_R', type: 'chk' },
      { k: 'vals', label: 'Winkel als Zahl', type: 'chk' }
    ],
    draw(p, c) {
      const S = c.S, ad = c.N('al'), al = ad * D;
      if (!(ad >= 5 && ad <= 70)) throw new Error('Winkel α zwischen 5° und 70° wählen');
      const s = 340 / Math.max(1, Math.tan(al)), base = s, hgt = s * Math.tan(al);
      const P = q => [q[0], -q[1]], u = [Math.cos(al), Math.sin(al)], n = [-Math.sin(al), Math.cos(al)];
      const add = (a, v, k) => [a[0] + v[0] * k, a[1] + v[1] * k];
      S.poly([P([0, 0]), P([base, 0]), P([base, hgt])], { w: 1.3, fill: c.t.fill, fop: 0.5 }, true);
      S.line(-30, 0, base + 30, 0, { w: 1.3 });
      const m = [base / 2, hgt / 2], bw = 78, bh = 46;
      const blk = [add(m, u, -bw / 2), add(m, u, bw / 2), add(add(m, u, bw / 2), n, bh), add(add(m, u, -bw / 2), n, bh)].map(P);
      S.poly(blk, { w: 1.3, fill: c.t.bg }, true);
      const ce = add(m, n, bh / 2), C = P(ce), G = 125;
      const arr = (v, k, col, name, dx, dy, o) => { const T = P(add(ce, v, k)); S.arrow(C[0], C[1], T[0], T[1], Object.assign({ c: col, w: 1.5 }, o || {})); S.text(T[0] + dx, T[1] + dy, name, { c: col, s: 0.95 }); return T; };
      if (p.zer) {
        const T = P(add(ce, [0, -1], G));
        const h = arr(u, -G * Math.sin(al), c.col(1), 'F_{GH}', -22, 10), q = arr(n, -G * Math.cos(al), c.col(2), 'F_{GN}', 24, 12);
        S.line(h[0], h[1], T[0], T[1], { dash: [4, 3], w: 0.7 }); S.line(q[0], q[1], T[0], T[1], { dash: [4, 3], w: 0.7 });
        S.poly(U.arcPts(C[0], C[1], 34, -Math.PI / 2, -Math.PI / 2 + al).map(z => z), { w: 0.7 });
        S.text(C[0] + 45 * Math.cos(-Math.PI / 2 + al / 2), C[1] - 45 * Math.sin(-Math.PI / 2 + al / 2), 'α', { s: 0.85 });
      }
      if (p.fg) arr([0, -1], G, c.col(0), 'F_G', -18, 6);
      if (p.fn) arr(n, G * Math.cos(al), c.col(3), 'F_N', -16, -6);
      if (p.fr) arr(u, G * Math.sin(al), c.col(4), 'F_R', 12, -12);
      S.dot(C[0], C[1], 2.6);
      U.angleMark(S, [0, 0], [base, 0], P([base, hgt]), p.vals ? 'α = ' + rd(ad, 1) + '°' : 'α', { R: 46 });
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
