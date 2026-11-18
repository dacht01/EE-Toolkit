/* EE-Toolkit – Geometrie: Dreieck, Viereck, Kreis, Körper */
(function (g) {
  'use strict';
  const E = g.EET, U = E.u, D = Math.PI / 180;
  const { angleMark, off, mid, lab, rd } = U;

  function sideLabel(S, A, B, ce, text) {
    if (!text) return;
    U.besideLine(S, A, B, ce, text);
  }

  /* ---------- Dreieck ---------- */
  E.add({
    id: 'dreieck', g: 0, name: 'Dreieck',
    fields: [
      { k: 'mode', label: 'Gegeben', type: 'sel', wide: true, def: 'sss', opts: [['sss', '3 Seiten (SSS)'], ['sws', '2 Seiten + Winkel (SWS)'], ['wsw', 'Seite + 2 Winkel (WSW)'], ['rw', 'rechtwinklig (2 Katheten)']] },
      { k: 'a', label: 'Seite a', def: '4', show: p => p.mode === 'sss' || p.mode === 'rw' },
      { k: 'b', label: 'Seite b', def: '3', show: p => p.mode !== 'wsw' },
      { k: 'c', label: 'Seite c', def: '5', show: p => p.mode !== 'rw' },
      { k: 'al', label: 'Winkel α (°)', def: '60', show: p => p.mode === 'sws' || p.mode === 'wsw' },
      { k: 'be', label: 'Winkel β (°)', def: '45', show: p => p.mode === 'wsw' },
      { k: 'unit', label: 'Einheit', def: 'cm' },
      { k: 'ls', label: 'Seiten beschriften', type: 'sel', def: 'name', opts: E.LBL },
      { k: 'lw', label: 'Winkel beschriften', type: 'sel', def: 'name', opts: E.LBL },
      { k: 'ecken', label: 'Ecken A, B, C', type: 'chk', def: true },
      { k: 'h', label: 'Höhe h_c', type: 'chk' },
      { k: 'um', label: 'Umkreis', type: 'chk' },
      { k: 'ink', label: 'Inkreis', type: 'chk' }
    ],
    draw(p, c) {
      const S = c.S; let a, b, cc;
      if (p.mode === 'sss') { a = c.N('a'); b = c.N('b'); cc = c.N('c'); }
      else if (p.mode === 'rw') { a = c.N('a'); b = c.N('b'); cc = Math.hypot(a, b); }
      else if (p.mode === 'sws') { b = c.N('b'); cc = c.N('c'); const al = c.N('al') * D; a = Math.sqrt(b * b + cc * cc - 2 * b * cc * Math.cos(al)); }
      else {
        cc = c.N('c'); const al = c.N('al') * D, be = c.N('be') * D, ga = Math.PI - al - be;
        if (!(al > 0 && be > 0 && ga > 0)) throw new Error('α + β muss kleiner als 180° sein');
        a = cc * Math.sin(al) / Math.sin(ga); b = cc * Math.sin(be) / Math.sin(ga);
      }
      if (!(a > 0 && b > 0 && cc > 0) || a + b <= cc || a + cc <= b || b + cc <= a) throw new Error('Diese Werte ergeben kein Dreieck.');
      const al = Math.acos((b * b + cc * cc - a * a) / (2 * b * cc)), be = Math.acos((a * a + cc * cc - b * b) / (2 * a * cc)), ga = Math.PI - al - be;
      const k = 300 / Math.max(a, b, cc), area = 0.5 * b * cc * Math.sin(al);
      const A = [0, 0], B = [cc * k, 0], C = [b * Math.cos(al) * k, -b * Math.sin(al) * k];
      const ce = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3];
      if (p.um) {
        const ux = B[0] / 2, uy = (C[0] * C[0] + C[1] * C[1] - B[0] * C[0]) / (2 * C[1]);
        S.circle(ux, uy, Math.hypot(ux, uy), { c: c.col(2), w: 0.8 }); S.dot(ux, uy, 2.2, c.col(2));
      }
      if (p.ink) {
        const s = a + b + cc, ix = (a * A[0] + b * B[0] + cc * C[0]) / s, iy = (a * A[1] + b * B[1] + cc * C[1]) / s;
        S.circle(ix, iy, 2 * area / s * k, { c: c.col(3), w: 0.8 }); S.dot(ix, iy, 2.2, c.col(3));
      }
      if (p.h) {
        const F = [C[0], 0];
        if (F[0] < 0) S.line(A[0], 0, F[0], 0, { dash: true, w: 0.7 });
        if (F[0] > B[0]) S.line(B[0], 0, F[0], 0, { dash: true, w: 0.7 });
        S.line(C[0], C[1], F[0], F[1], { dash: true, c: c.col(1) });
        angleMark(S, F, C, F[0] > B[0] / 2 ? A : B, null, { R: 13, c: c.col(1) });
        S.text(F[0] + (F[0] > B[0] / 2 ? 9 : -9), C[1] * 0.42, 'h_c', { a: F[0] > B[0] / 2 ? 'start' : 'end', c: c.col(1), s: 0.9 });
      }
      S.poly([A, B, C], { w: 1.3 }, true);
      const u = p.unit;
      sideLabel(S, B, C, ce, lab(p.ls, 'a', a, u)); sideLabel(S, C, A, ce, lab(p.ls, 'b', b, u)); sideLabel(S, A, B, ce, lab(p.ls, 'c', cc, u));
      const wl = (n, v) => p.lw === 'name' ? n : p.lw === 'val' ? rd(v / D, 1) + '°' : p.lw === 'both' ? n + ' = ' + rd(v / D, 1) + '°' : null;
      if (p.lw !== 'none' || p.mode === 'rw') {
        angleMark(S, A, B, C, wl('α', al)); angleMark(S, B, C, A, wl('β', be)); angleMark(S, C, A, B, wl('γ', ga));
      }
      if (p.ecken) [['A', A], ['B', B], ['C', C]].forEach(([n, P]) => { const q = off(P, ce, 15); S.text(q[0], q[1], n, { bold: true }); });
    }
  });

  /* ---------- Viereck ---------- */
  E.add({
    id: 'viereck', g: 0, name: 'Viereck',
    fields: [
      { k: 'typ', label: 'Form', type: 'sel', def: 'rect', opts: [['quad', 'Quadrat'], ['rect', 'Rechteck'], ['para', 'Parallelogramm'], ['raute', 'Raute'], ['trapez', 'Trapez']] },
      { k: 'a', label: 'Seite a (unten)', def: '5' },
      { k: 'b', label: 'Seite b', def: '3', show: p => p.typ === 'rect' || p.typ === 'para' },
      { k: 'c', label: 'Seite c (oben)', def: '3', show: p => p.typ === 'trapez' },
      { k: 'h', label: 'Höhe h', def: '2.5', show: p => p.typ === 'trapez' },
      { k: 'x', label: 'Versatz oben (leer = symmetrisch)', def: '', show: p => p.typ === 'trapez' },
      { k: 'al', label: 'Winkel α (°)', def: '65', show: p => p.typ === 'para' || p.typ === 'raute' },
      { k: 'unit', label: 'Einheit', def: 'cm' },
      { k: 'ls', label: 'Seiten beschriften', type: 'sel', def: 'name', opts: E.LBL },
      { k: 'lw', label: 'Winkel beschriften', type: 'sel', def: 'none', opts: E.LBL },
      { k: 'ecken', label: 'Ecken A–D', type: 'chk', def: true },
      { k: 'diag', label: 'Diagonalen e, f', type: 'chk' },
      { k: 'hh', label: 'Höhe einzeichnen', type: 'chk', show: p => p.typ !== 'quad' && p.typ !== 'rect' }
    ],
    draw(p, c) {
      const S = c.S, a = c.N('a'); let Cm, Dm;
      if (!(a > 0)) throw new Error('Seite a muss grösser als 0 sein');
      if (p.typ === 'quad') { Cm = [a, a]; Dm = [0, a]; }
      else if (p.typ === 'rect') { const b = c.N('b'); Cm = [a, b]; Dm = [0, b]; }
      else if (p.typ === 'para' || p.typ === 'raute') {
        const b = p.typ === 'raute' ? a : c.N('b'), al = c.N('al') * D;
        if (!(al > 0 && al < Math.PI)) throw new Error('Winkel α zwischen 0° und 180° wählen');
        Dm = [b * Math.cos(al), b * Math.sin(al)]; Cm = [Dm[0] + a, Dm[1]];
      } else {
        const cc = c.N('c'), h = c.N('h'), x = c.O('x'), x0 = x == null ? (a - cc) / 2 : x;
        Dm = [x0, h]; Cm = [x0 + cc, h];
      }
      if (!(Dm[1] > 0)) throw new Error('Die Höhe muss grösser als 0 sein');
      const xs = [0, a, Cm[0], Dm[0]], k = 300 / Math.max(Math.max(...xs) - Math.min(...xs), Dm[1]);
      const P = q => [q[0] * k, -q[1] * k], V = [P([0, 0]), P([a, 0]), P(Cm), P(Dm)];
      const ce = [(V[0][0] + V[1][0] + V[2][0] + V[3][0]) / 4, (V[0][1] + V[1][1] + V[2][1] + V[3][1]) / 4];
      const len = (i, j) => Math.hypot(V[i][0] - V[j][0], V[i][1] - V[j][1]) / k, u = p.unit;
      if (p.diag) {
        S.line(V[0][0], V[0][1], V[2][0], V[2][1], { dash: true, c: c.col(0) }); S.line(V[1][0], V[1][1], V[3][0], V[3][1], { dash: true, c: c.col(1) });
        const e = [V[0][0] + (V[2][0] - V[0][0]) * 0.3, V[0][1] + (V[2][1] - V[0][1]) * 0.3], f = [V[1][0] + (V[3][0] - V[1][0]) * 0.3, V[1][1] + (V[3][1] - V[1][1]) * 0.3];
        S.text(e[0], e[1] - 11, lab(p.ls === 'none' ? 'name' : p.ls, 'e', len(0, 2), u), { c: c.col(0), s: 0.9 });
        S.text(f[0], f[1] - 11, lab(p.ls === 'none' ? 'name' : p.ls, 'f', len(1, 3), u), { c: c.col(1), s: 0.9 });
      }
      if (p.hh && p.typ !== 'quad' && p.typ !== 'rect') {
        const F = [V[3][0], 0];
        if (F[0] < 0) S.line(0, 0, F[0], 0, { dash: true, w: 0.7 });
        if (F[0] > V[1][0]) S.line(V[1][0], 0, F[0], 0, { dash: true, w: 0.7 });
        if (Math.abs(F[0]) > 1) {
          S.line(V[3][0], V[3][1], F[0], 0, { dash: true, c: c.col(2) });
          angleMark(S, F, V[3], [F[0] + 50, 0], null, { R: 13, c: c.col(2) });
          S.text(F[0] + 8, V[3][1] / 2, lab(p.ls === 'none' ? 'name' : p.ls, 'h', Dm[1], u), { a: 'start', c: c.col(2), s: 0.9 });
        }
      }
      S.poly(V, { w: 1.3 }, true);
      ['a', 'b', 'c', 'd'].forEach((n, i) => sideLabel(S, V[i], V[(i + 1) % 4], ce, lab(p.ls, n, len(i, (i + 1) % 4), u)));
      const rightAll = p.typ === 'quad' || p.typ === 'rect';
      if (p.lw !== 'none' || rightAll) ['α', 'β', 'γ', 'δ'].forEach((n, i) => {
        const A = V[i], B = V[(i + 1) % 4], Z = V[(i + 3) % 4];
        const v1 = [B[0] - A[0], B[1] - A[1]], v2 = [Z[0] - A[0], Z[1] - A[1]];
        const ang = Math.acos((v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(...v1) * Math.hypot(...v2))) / D;
        const t = p.lw === 'name' ? n : p.lw === 'val' ? rd(ang, 1) + '°' : p.lw === 'both' ? n + ' = ' + rd(ang, 1) + '°' : null;
        angleMark(S, A, B, Z, rightAll && p.lw === 'none' ? null : t, { R: rightAll ? 18 : 28 });
      });
      if (p.ecken) ['A', 'B', 'C', 'D'].forEach((n, i) => { const q = off(V[i], ce, 15); S.text(q[0], q[1], n, { bold: true }); });
    }
  });

  /* ---------- Kreis ---------- */
  E.add({
    id: 'kreis', g: 0, name: 'Kreis, Sektor, n-Eck',
    fields: [
      { k: 'r', label: 'Radius r', def: '3' },
      { k: 'unit', label: 'Einheit', def: 'cm' },
      { k: 'ls', label: 'Beschriftung', type: 'sel', def: 'name', opts: E.LBL },
      { k: 'rad', label: 'Radius einzeichnen', type: 'chk', def: true },
      { k: 'dia', label: 'Durchmesser einzeichnen', type: 'chk' },
      { k: 'sek', label: 'Sektorwinkel (°), leer = keiner', def: '' },
      { k: 'n', label: 'Einbeschriebenes n-Eck (n), leer = keines', def: '' }
    ],
    draw(p, c) {
      const S = c.S, rr = c.N('r'), R = 150, sek = c.O('sek'), n = c.O('n'), u = p.unit;
      if (!(rr > 0)) throw new Error('Radius muss grösser als 0 sein');
      if (sek != null) {
        if (!(sek > 0 && sek <= 360)) throw new Error('Sektorwinkel zwischen 0° und 360° wählen');
        const pts = [[0, 0]].concat(U.arcPts(0, 0, R, 0, sek * D));
        S.poly(pts, { c: c.col(0), fill: c.col(0), fop: 0.18 }, true);
        S.poly(U.arcPts(0, 0, 30, 0, sek * D), { w: 0.7, c: c.col(0) });
        const m = sek * D / 2, t = rd(sek, 1) + '°', q = 36 + U.textW(t, S.fs * 0.85) / 2;
        S.text(q * Math.cos(m), -q * Math.sin(m), t, { s: 0.85, c: c.col(0) });
      }
      if (n != null) {
        if (!(n >= 3 && n <= 60 && Number.isInteger(n))) throw new Error('n muss eine ganze Zahl von 3 bis 60 sein');
        const pts = []; for (let i = 0; i < n; i++) { const a = Math.PI / 2 + i * 2 * Math.PI / n; pts.push([R * Math.cos(a), -R * Math.sin(a)]); }
        S.poly(pts, { c: c.col(1) }, true);
      }
      S.circle(0, 0, R, { w: 1.3 });
      if (p.dia) {
        const a = -20 * D, x = R * Math.cos(a), y = -R * Math.sin(a);
        S.line(-x, -y, x, y, { c: c.col(2) });
        U.besideLine(S, [-x, -y], [x, y], [0, -R], lab(p.ls === 'none' ? 'name' : p.ls, 'd', 2 * rr, u), { c: c.col(2), s: 0.9, t: 0.25 });
      }
      if (p.rad) {
        const a = (sek != null ? Math.min(-25, -sek / 2 % 90) : 35) * D, x = R * Math.cos(a), y = -R * Math.sin(a);
        S.line(0, 0, x, y, {});
        U.besideLine(S, [0, 0], [x, y], [0, a < 0 ? -R : R], lab(p.ls === 'none' ? 'name' : p.ls, 'r', rr, u), { s: 0.9, t: 0.6 });
      }
      S.dot(0, 0, 2.6); S.text(-9, 10, 'M', { s: 0.85 });
    }
  });

  /* ---------- Körper (Schrägbild, Kavalierprojektion 45°, Tiefe ×0.5) ---------- */
  const KQ = 0.5 * Math.SQRT1_2;
  E.add({
    id: 'koerper', g: 0, name: 'Körper (Würfel, Quader …)',
    fields: [
      { k: 'typ', label: 'Körper', type: 'sel', def: 'wuerfel', opts: [['wuerfel', 'Würfel'], ['quader', 'Quader'], ['zyl', 'Zylinder'], ['kegel', 'Kegel'], ['pyr', 'Pyramide'], ['kugel', 'Kugel']] },
      { k: 'a', label: 'Kante a (Breite)', def: '4', show: p => ['wuerfel', 'quader', 'pyr'].includes(p.typ) },
      { k: 'b', label: 'Kante b (Tiefe)', def: '3', show: p => ['quader', 'pyr'].includes(p.typ) },
      { k: 'c', label: 'Kante c (Höhe)', def: '2', show: p => p.typ === 'quader' },
      { k: 'r', label: 'Radius r', def: '2', show: p => ['zyl', 'kegel', 'kugel'].includes(p.typ) },
      { k: 'h', label: 'Höhe h', def: '4', show: p => ['zyl', 'kegel', 'pyr'].includes(p.typ) },
      { k: 'unit', label: 'Einheit', def: 'cm' },
      { k: 'ls', label: 'Beschriftung', type: 'sel', def: 'name', opts: E.LBL },
      { k: 'diag', label: 'Raumdiagonale', type: 'chk', show: p => ['wuerfel', 'quader'].includes(p.typ) }
    ],
    draw(p, c) {
      const S = c.S, u = p.unit, L = (n, v) => lab(p.ls, n, v, u), T = 250;
      const pos = (k, v) => { if (!(v > 0)) throw new Error(k + ' muss grösser als 0 sein'); return v; };
      const half = (R, ry, cy) => {
        const f = [], bk = [];
        for (let i = 0; i <= 40; i++) { const t = Math.PI * i / 40; f.push([R * Math.cos(t), cy + ry * Math.sin(t)]); bk.push([R * Math.cos(t), cy - ry * Math.sin(t)]); }
        return [f, bk];
      };
      if (p.typ === 'wuerfel' || p.typ === 'quader' || p.typ === 'pyr') {
        const a = pos('a', c.N('a')), b = p.typ === 'wuerfel' ? a : pos('b', c.N('b'));
        const hh = p.typ === 'wuerfel' ? a : p.typ === 'quader' ? pos('c', c.N('c')) : pos('h', c.N('h'));
        const k = T / Math.max(a + KQ * b, hh + KQ * b);
        const P = (x, y, z) => [(x + KQ * y) * k, -(z + KQ * y) * k];
        const ln = (A, B, hid, o) => S.line(A[0], A[1], B[0], B[1], Object.assign({ w: hid ? 0.9 : 1.3, dash: hid ? [5, 4] : null }, o || {}));
        const base = [P(0, 0, 0), P(a, 0, 0), P(a, b, 0), P(0, b, 0)];
        if (p.typ === 'pyr') {
          const ap = P(a / 2, b / 2, hh), m = P(a / 2, b / 2, 0);
          base.forEach((A, i) => { ln(A, base[(i + 1) % 4], i >= 2); ln(A, ap, i === 3); });
          S.line(m[0], m[1], ap[0], ap[1], { dash: [3, 3], c: c.col(1), w: 0.9 }); S.dot(m[0], m[1], 2, c.col(1));
          const t = L('h', hh); if (t) S.text(m[0] + 7, m[1] + (ap[1] - m[1]) * 0.22, t, { a: 'start', c: c.col(1), s: 0.9 });
        } else {
          const top = [P(0, 0, hh), P(a, 0, hh), P(a, b, hh), P(0, b, hh)];
          for (let i = 0; i < 4; i++) { ln(base[i], base[(i + 1) % 4], i >= 2); ln(top[i], top[(i + 1) % 4]); ln(base[i], top[i], i === 3); }
          if (p.diag) {
            ln(base[0], top[2], false, { c: c.col(1), w: 1.1 });
            U.besideLine(S, base[0], top[2], [base[0][0], top[2][1]], L('d', Math.hypot(a, b, hh)) || 'd', { c: c.col(1), s: 0.9, t: 0.62 });
          }
          const t = L(p.typ === 'wuerfel' ? 'a' : 'c', hh); if (t) S.text(-9, -hh * k / 2, t, { a: 'end' });
        }
        const ta = L('a', a), tb = L(p.typ === 'wuerfel' ? 'a' : 'b', b);
        if (ta) S.text(a * k / 2, 16, ta);
        if (tb) { const m = mid(base[1], base[2]); S.text(m[0] + 9, m[1] + 9, tb, { a: 'start' }); }
        return;
      }
      const rr = pos('r', c.N('r'));
      if (p.typ === 'kugel') {
        const R = 130, [f, bk] = half(R, R * 0.3, 0);
        S.circle(0, 0, R, { w: 1.3 }); S.poly(f, { w: 0.9 }); S.poly(bk, { w: 0.9, dash: [5, 4] });
        S.line(0, 0, R, 0, { c: c.col(1) }); S.dot(0, 0, 2.4);
        const t = L('r', rr); if (t) S.text(R / 2, -10, t, { c: c.col(1), s: 0.9 });
        S.text(-9, 10, 'M', { s: 0.85 });
        return;
      }
      const h = pos('h', c.N('h')), k = T / Math.max(2 * rr, h + 0.6 * rr), R = rr * k, ry = R * 0.3, H = h * k;
      const [f, bk] = half(R, ry, 0);
      S.poly(bk, { w: 0.9, dash: [5, 4] }); S.poly(f, { w: 1.3 });
      if (p.typ === 'zyl') {
        const [f2, b2] = half(R, ry, -H);
        S.poly(f2.concat(b2.slice().reverse()), { w: 1.3 }, true);
        S.line(-R, 0, -R, -H, { w: 1.3 }); S.line(R, 0, R, -H, { w: 1.3 });
        S.line(0, -H, R, -H, { c: c.col(1) }); S.dot(0, -H, 2.2, c.col(1));
        const t = L('r', rr), th = L('h', h);
        if (t) S.text(R / 2, -H - 9, t, { c: c.col(1), s: 0.9 });
        if (th) S.text(R + 9, -H / 2, th, { a: 'start' });
      } else {
        S.line(-R, 0, 0, -H, { w: 1.3 }); S.line(R, 0, 0, -H, { w: 1.3 });
        S.line(0, 0, 0, -H, { dash: [3, 3], c: c.col(1), w: 0.9 }); S.line(0, 0, R, 0, { dash: [3, 3], c: c.col(2), w: 0.9 });
        S.dot(0, 0, 2.2);
        const t = L('r', rr), th = L('h', h);
        if (t) S.text(R / 2, Math.min(13, ry * 0.5), t, { c: c.col(2), s: 0.9 });
        if (th) S.text(R + 12, -H * 0.5, th, { a: 'start', c: c.col(1), s: 0.9 });
      }
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
