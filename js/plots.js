/* EE-Toolkit – Koordinatensysteme und Funktionsplots */
(function (g) {
  'use strict';
  const E = g.EET, U = E.u, D = Math.PI / 180;
  const { niceStep, fmt, piLab, r } = U;

  function tickList(min, max, step) {
    if ((max - min) / step > 400) throw new Error('Schrittweite zu klein für diesen Bereich');
    const out = [];
    for (let i = Math.ceil(min / step - 1e-9); i * step <= max + step * 1e-9; i++) out.push(i * step);
    return out;
  }
  function piStep(range) {
    for (const k of [1 / 4, 1 / 2, 1, 2, 4, 8, 16]) if (range / (k * Math.PI) <= 9) return k * Math.PI;
    return 32 * Math.PI;
  }

  /* Achsenkreuz durch den Ursprung (Schul-Darstellung). Gibt Abbildung X(), Y() zurück. */
  function axesCross(S, bx, ax) {
    const { xmin, xmax, ymin, ymax } = ax, t = S.t;
    if (!(xmax > xmin) || !(ymax > ymin)) throw new Error('Maximum muss grösser als Minimum sein');
    const X = x => bx.x + (x - xmin) / (xmax - xmin) * bx.w, Y = y => bx.y + bx.h - (y - ymin) / (ymax - ymin) * bx.h;
    const xs = ax.xstep || (ax.pi ? piStep(xmax - xmin) : niceStep(xmax - xmin, Math.max(4, bx.w / 55)));
    const ys = ax.ystep || niceStep(ymax - ymin, Math.max(3, bx.h / 45));
    if (!(xs > 0) || !(ys > 0)) throw new Error('Schrittweite muss grösser als 0 sein');
    const xt = tickList(xmin, xmax, xs), yt = tickList(ymin, ymax, ys);
    const ay = Y(Math.min(Math.max(0, ymin), ymax)), axx = X(Math.min(Math.max(0, xmin), xmax));
    const x1 = bx.x, x2 = bx.x + bx.w, y1 = bx.y, y2 = bx.y + bx.h;
    if (ax.grid >= 2) {
      const sub = n => { const l = n / Math.pow(10, Math.floor(Math.log10(n) + 1e-9)); return Math.abs(l - 2) < 0.01 ? 4 : 5; };
      tickList(xmin, xmax, xs / (ax.pi ? 2 : sub(xs))).forEach(v => S.line(X(v), y1, X(v), y2, { c: t.minor, w: 0.5 }));
      tickList(ymin, ymax, ys / sub(ys)).forEach(v => S.line(x1, Y(v), x2, Y(v), { c: t.minor, w: 0.5 }));
    }
    if (ax.grid >= 1) {
      xt.forEach(v => S.line(X(v), y1, X(v), y2, { c: t.grid, w: 0.55 }));
      yt.forEach(v => S.line(x1, Y(v), x2, Y(v), { c: t.grid, w: 0.55 }));
    }
    S.arrow(x1, ay, x2 + 20, ay, {}); S.arrow(axx, y2, axx, y1 - 20, {});
    const org = xmin <= 0 && xmax >= 0 && ymin <= 0 && ymax >= 0, z = v => Math.abs(v) < 1e-9 * Math.max(1, xs, ys);
    xt.forEach(v => {
      if (!(org && z(v))) S.line(X(v), ay - 3.5, X(v), ay + 3.5, { w: 0.8 });
      if (ax.nums && !(org && z(v))) S.text(X(v), ay + 7, ax.pi ? piLab(v) : fmt(v), { b: 'top', s: 0.8 });
    });
    yt.forEach(v => {
      if (!(org && z(v))) S.line(axx - 3.5, Y(v), axx + 3.5, Y(v), { w: 0.8 });
      if (ax.nums && !(org && z(v))) S.text(axx - 7, Y(v), fmt(v), { a: 'end', s: 0.8 });
    });
    if (ax.nums && org) S.text(axx - 6, ay + 6, '0', { a: 'end', b: 'top', s: 0.8 });
    if (ax.xlabel) S.text(x2 + 20, ay - 9, ax.xlabel, { a: 'end', b: 'bottom' });
    if (ax.ylabel) S.text(axx + 10, y1 - 20, ax.ylabel, { a: 'start', b: 'top' });
    return { X, Y };
  }

  function mkScale(a, p0, p1) {
    if (a.log) { const l0 = Math.log10(a.min), l1 = Math.log10(a.max); return v => p0 + (Math.log10(v) - l0) / (l1 - l0) * (p1 - p0); }
    return v => p0 + (v - a.min) / (a.max - a.min) * (p1 - p0);
  }
  function boxTicks(a, px) {
    if (a.log) {
      if (!(a.min > 0)) throw new Error('Logarithmische Achse: Minimum muss grösser als 0 sein');
      const maj = [], min = [];
      for (let e = Math.floor(Math.log10(a.min) + 1e-9); e <= Math.ceil(Math.log10(a.max) - 1e-9); e++) for (let k = 1; k < 10; k++) {
        const v = k * Math.pow(10, e); if (v < a.min * (1 - 1e-9) || v > a.max * (1 + 1e-9)) continue;
        if (k === 1) maj.push({ v, l: e >= -3 && e <= 4 ? String(parseFloat(Math.pow(10, e).toPrecision(3))) : '10^{' + String(e).replace('-', '−') + '}' }); else min.push(v);
      }
      if (maj.length + min.length > 600) throw new Error('Zu viele Dekaden');
      return { maj, min };
    }
    const st = a.step || niceStep(a.max - a.min, Math.max(3, px / 50));
    return { maj: tickList(a.min, a.max, st).map(v => ({ v, l: fmt(v) })), min: [] };
  }
  /* Rahmen-Diagramm (für log-Achsen, Bode). ax = {x:{min,max,log,step,label,nums}, y:{…}} */
  function axesBox(S, bx, ax) {
    const t = S.t;
    if (!(ax.x.max > ax.x.min) || !(ax.y.max > ax.y.min)) throw new Error('Maximum muss grösser als Minimum sein');
    const X = mkScale(ax.x, bx.x, bx.x + bx.w), Y = mkScale(ax.y, bx.y + bx.h, bx.y);
    const xt = boxTicks(ax.x, bx.w), yt = boxTicks(ax.y, bx.h);
    xt.min.forEach(v => S.line(X(v), bx.y, X(v), bx.y + bx.h, { c: t.minor, w: 0.5 }));
    yt.min.forEach(v => S.line(bx.x, Y(v), bx.x + bx.w, Y(v), { c: t.minor, w: 0.5 }));
    xt.maj.forEach(q => S.line(X(q.v), bx.y, X(q.v), bx.y + bx.h, { c: t.grid, w: 0.6 }));
    yt.maj.forEach(q => S.line(bx.x, Y(q.v), bx.x + bx.w, Y(q.v), { c: t.grid, w: 0.6 }));
    S.rect(bx.x, bx.y, bx.w, bx.h, { w: 1.1 });
    if (ax.x.nums !== false) xt.maj.forEach(q => S.text(X(q.v), bx.y + bx.h + 7, q.l, { b: 'top', s: 0.8 }));
    yt.maj.forEach(q => S.text(bx.x - 7, Y(q.v), q.l, { a: 'end', s: 0.8 }));
    if (ax.x.label) S.text(bx.x + bx.w / 2, bx.y + bx.h + 28, ax.x.label, { b: 'top', s: 0.9 });
    if (ax.y.label) S.text(bx.x, bx.y - 8, ax.y.label, { a: 'start', b: 'bottom', s: 0.9 });
    return { X, Y };
  }

  /* Kurve y = f(x) zeichnen, auf die Box beschnitten; pts(i) liefert [x, y] in Achsenwerten */
  function plotCurve(S, m, bx, pts, n, o) {
    const id = S.clipRect(bx.x - 1, bx.y - 1, bx.w + 2, bx.h + 2), top = bx.y, bot = bx.y + bx.h;
    let d = '', pen = false, prev = null;
    for (let i = 0; i <= n; i++) {
      const q = pts(i), px = m.X(q[0]); let py = m.Y(q[1]);
      if (!isFinite(px) || !isFinite(py)) { pen = false; prev = null; continue; }
      if (prev != null && ((prev < top && py > bot) || (prev > bot && py < top))) pen = false;
      prev = py; py = Math.max(top - 4 * bx.h, Math.min(bot + 4 * bx.h, py));
      d += (pen ? 'L' : 'M') + r(px) + ' ' + r(py); pen = true;
    }
    if (d) S.add(`<path d="${d}" clip-path="url(#${id})" ${S.st(o)}/>`);
  }
  const plotFn = (S, m, bx, f, x0, x1, o, log) => {
    const n = Math.max(300, Math.round(bx.w * 2)), l0 = Math.log10(x0), l1 = Math.log10(x1);
    plotCurve(S, m, bx, i => { const x = log ? Math.pow(10, l0 + (l1 - l0) * i / n) : x0 + (x1 - x0) * i / n; return [x, f(x)]; }, n, o);
  };
  function legend(S, x, y, items) {
    items.forEach((it, i) => {
      const yy = y + i * (S.fs + 5);
      S.line(x, yy, x + 22, yy, { c: it.c, w: 1.4 }); S.text(x + 29, yy, it.t, { a: 'start', s: 0.85 });
    });
  }
  E.plot = { axesCross, axesBox, plotFn, plotCurve, tickList };

  const GRID = [['0', 'kein Raster'], ['1', 'Hauptraster'], ['2', 'Haupt- und Feinraster']];

  /* ---------- Kartesisch + Funktionen ---------- */
  E.add({
    id: 'kartesisch', g: 1, name: 'Kartesisch + Funktionsplot',
    fields: [
      { k: 'xmin', label: 'x min', def: '-5' }, { k: 'xmax', label: 'x max', def: '5' },
      { k: 'ymin', label: 'y min', def: '-4' }, { k: 'ymax', label: 'y max', def: '4' },
      { k: 'xstep', label: 'Schritt x (leer = auto)', def: '' }, { k: 'ystep', label: 'Schritt y (leer = auto)', def: '' },
      { k: 'xlabel', label: 'Name x-Achse', def: 'x' }, { k: 'ylabel', label: 'Name y-Achse', def: 'y' },
      { k: 'grid', label: 'Raster', type: 'sel', def: '1', opts: GRID },
      { k: 'form', label: 'Format', type: 'sel', def: '0.75', opts: [['eq', 'gleiche Skalierung (1:1)'], ['1', 'quadratisch'], ['0.75', '4:3'], ['0.5', '2:1 (breit)'], ['0.33', '3:1 (sehr breit)']] },
      { k: 'nums', label: 'Zahlen an den Achsen', type: 'chk', def: true },
      { k: 'pi', label: 'x-Achse in Vielfachen von π', type: 'chk' },
      { k: 'f1', label: 'Funktion 1: f(x) =', def: '', wide: true, ph: 'z. B. 2*sin(x) oder x^2 - 1' },
      { k: 'f2', label: 'Funktion 2', def: '', wide: true },
      { k: 'f3', label: 'Funktion 3', def: '', wide: true },
      { k: 'leg', label: 'Legende', type: 'chk' }
    ],
    presets: {
      'Leer': { xmin: '-5', xmax: '5', ymin: '-4', ymax: '4', xstep: '', ystep: '', xlabel: 'x', ylabel: 'y', pi: false, f1: '', f2: '', f3: '', form: '0.75', leg: false },
      '1. Quadrant': { xmin: '0', xmax: '10', ymin: '0', ymax: '8', xstep: '', ystep: '', xlabel: 'x', ylabel: 'y', pi: false, f1: '', f2: '', f3: '', form: '0.75', leg: false },
      'Sinus u(t), i(t)': { xmin: '0', xmax: '4*pi', ymin: '-4', ymax: '4', xstep: '', ystep: '', xlabel: 'ωt', ylabel: 'u, i', pi: true, f1: '3*sin(x)', f2: '2*sin(x - pi/3)', f3: '', form: '0.5', leg: false },
      'Ladekurve (e-Funktion)': { xmin: '0', xmax: '5', ymin: '0', ymax: '1.2', xstep: '1', ystep: '0.2', xlabel: 't/τ', ylabel: 'u_C/U_0', pi: false, f1: '1 - exp(-x)', f2: 'exp(-x)', f3: '', form: '0.5', leg: true },
      'Parabel & Ableitung': { xmin: '-4', xmax: '4', ymin: '-4', ymax: '6', xstep: '', ystep: '', xlabel: 'x', ylabel: 'y', pi: false, f1: 'x^2 - 2', f2: '2x', f3: '', form: '0.75', leg: true }
    },
    draw(p, c) {
      const S = c.S, xmin = c.N('xmin'), xmax = c.N('xmax'), ymin = c.N('ymin'), ymax = c.N('ymax');
      if (!(xmax > xmin) || !(ymax > ymin)) throw new Error('Maximum muss grösser als Minimum sein');
      const W = 440, H = Math.max(90, Math.min(1100, p.form === 'eq' ? W * (ymax - ymin) / (xmax - xmin) : W * parseFloat(p.form)));
      const bx = { x: 0, y: 0, w: W, h: H };
      const fs = ['f1', 'f2', 'f3'].map(k => c.F(k, ['x', 't']));
      const m = axesCross(S, bx, { xmin, xmax, ymin, ymax, xstep: c.O('xstep'), ystep: c.O('ystep'), xlabel: p.xlabel, ylabel: p.ylabel, grid: +p.grid, nums: p.nums, pi: p.pi });
      const items = [];
      fs.forEach((f, i) => { if (f) { plotFn(S, m, bx, x => f({ x, t: x }), xmin, xmax, { c: c.col(i), w: 1.4 }); items.push({ c: c.col(i), t: String(p['f' + (i + 1)]).trim() }); } });
      if (p.leg && items.length) legend(S, 4, H + (p.nums ? 38 : 20), items);
    }
  });

  /* ---------- Logarithmisch ---------- */
  E.add({
    id: 'log', g: 1, name: 'Logarithmisches Papier',
    fields: [
      { k: 'mode', label: 'Achsen', type: 'sel', def: 'x', opts: [['x', 'x logarithmisch'], ['y', 'y logarithmisch'], ['xy', 'beide logarithmisch']] },
      { k: 'form', label: 'Format', type: 'sel', def: '0.6', opts: [['1', 'quadratisch'], ['0.75', '4:3'], ['0.6', '5:3'], ['0.45', 'breit']] },
      { k: 'xmin', label: 'x min', def: '1' }, { k: 'xmax', label: 'x max', def: '1e5' },
      { k: 'ymin', label: 'y min', def: '-40' }, { k: 'ymax', label: 'y max', def: '20' },
      { k: 'ystep', label: 'Schritt lineare Achse (leer = auto)', def: '' },
      { k: 'xlabel', label: 'Name x-Achse', def: 'f / Hz' }, { k: 'ylabel', label: 'Name y-Achse', def: 'A / dB' },
      { k: 'f1', label: 'Funktion f(x) = (optional)', def: '', wide: true }
    ],
    presets: {
      'Halblog. (x log)': { mode: 'x', xmin: '1', xmax: '1e5', ymin: '-40', ymax: '20', ystep: '', xlabel: 'f / Hz', ylabel: 'A / dB', f1: '' },
      'Doppelt log.': { mode: 'xy', xmin: '1', xmax: '1e4', ymin: '0.01', ymax: '100', ystep: '', xlabel: 'x', ylabel: 'y', f1: '' },
      'Halblog. (y log)': { mode: 'y', xmin: '0', xmax: '10', ymin: '0.01', ymax: '100', ystep: '', xlabel: 't', ylabel: 'y', f1: '10*exp(-x/2)' }
    },
    draw(p, c) {
      const S = c.S, lx = p.mode !== 'y', ly = p.mode !== 'x', W = 440, bx = { x: 0, y: 0, w: W, h: W * parseFloat(p.form) };
      const ax = { x: { min: c.N('xmin'), max: c.N('xmax'), log: lx, label: p.xlabel, step: lx ? null : c.O('ystep') }, y: { min: c.N('ymin'), max: c.N('ymax'), log: ly, label: p.ylabel, step: ly ? null : c.O('ystep') } };
      const f = c.F('f1', ['x', 't', 'f']);
      const m = axesBox(S, bx, ax);
      if (f) plotFn(S, m, bx, x => f({ x, t: x, f: x }), ax.x.min, ax.x.max, { c: c.col(0), w: 1.4 }, lx);
    }
  });

  /* ---------- Bode-Diagramm ---------- */
  E.add({
    id: 'bode', g: 4, name: 'Bode-Diagramm',
    fields: [
      { k: 'H', label: 'Übertragungsfunktion H(s) =', def: '1/(1 + s/(2*pi*1000))', wide: true },
      { k: 'var', label: 'x-Achse', type: 'sel', def: 'f', opts: [['f', 'Frequenz f in Hz'], ['w', 'Kreisfrequenz ω in rad/s']] },
      { k: 'show', label: 'Anzeigen', type: 'sel', def: 'both', opts: [['both', 'Betrag und Phase'], ['mag', 'nur Betrag'], ['ph', 'nur Phase']] },
      { k: 'min', label: 'von', def: '10' }, { k: 'max', label: 'bis', def: '1e6' }
    ],
    presets: {
      'Tiefpass 1. Ordnung': { H: '1/(1 + s/(2*pi*1000))', min: '10', max: '1e6', var: 'f' },
      'Hochpass 1. Ordnung': { H: '(s/(2*pi*1000))/(1 + s/(2*pi*1000))', min: '10', max: '1e6', var: 'f' },
      'Tiefpass 2. Ordnung (Resonanz)': { H: '1/(1 + 0.2*s/1000 + (s/1000)^2)', min: '10', max: '1e5', var: 'w' },
      'Bandpass': { H: '(s/1000)/(1 + s/1000 + (s/1000)^2)', min: '10', max: '1e5', var: 'w' }
    },
    draw(p, c) {
      const S = c.S, min = c.N('min'), max = c.N('max');
      if (!(min > 0) || !(max > min)) throw new Error('Bereich: 0 < von < bis');
      let H; try { H = U.compileC(String(p.H), ['s']); } catch (e) { throw new Error('H(s): ' + e.message); }
      const n = 500, l0 = Math.log10(min), l1 = Math.log10(max), xs = [], db = [], ph = []; let prev = null, offs = 0;
      for (let i = 0; i <= n; i++) {
        const x = Math.pow(10, l0 + (l1 - l0) * i / n), w = p.var === 'f' ? 2 * Math.PI * x : x, v = H({ s: [0, w] });
        let a = Math.atan2(v[1], v[0]) / D;
        if (prev != null) { while (a + offs - prev > 180) offs -= 360; while (a + offs - prev < -180) offs += 360; }
        a += offs; prev = a; xs.push(x); db.push(20 * Math.log10(Math.hypot(v[0], v[1]))); ph.push(a);
      }
      const rng = (arr, st, minSpan) => {
        const f = arr.filter(isFinite); if (!f.length) throw new Error('H(s) liefert keine gültigen Werte');
        let lo = Math.floor(Math.min(...f) / st + 1e-9) * st, hi = Math.ceil(Math.max(...f) / st - 1e-9) * st;
        if (hi - lo < minSpan) { hi += st; lo -= st; }
        return [lo, hi];
      };
      const W = 440, xl = p.var === 'f' ? 'f / Hz' : 'ω / (rad/s)'; let y = 0;
      const one = (arr, st, label, col, last) => {
        const [lo, hi] = rng(arr, st, st), step = (hi - lo) / st > 8 ? st * 2 : st, bx = { x: 0, y, w: W, h: 190 };
        const m = E.plot.axesBox(S, bx, { x: { min, max, log: true, label: last ? xl : '', nums: last }, y: { min: lo, max: hi, step, label } });
        plotCurve(S, m, bx, i => [xs[i], arr[i]], n, { c: col, w: 1.5 });
        y += 190 + 34;
      };
      if (p.show !== 'ph') one(db, 20, '|H| / dB', c.col(0), p.show === 'mag');
      if (p.show !== 'mag') one(ph, 45, 'φ / °', c.col(1), true);
    }
  });

  /* ---------- Polar ---------- */
  E.add({
    id: 'polar', g: 1, name: 'Polarkoordinaten',
    fields: [
      { k: 'rmax', label: 'r max', def: '4' }, { k: 'rstep', label: 'Schritt r (leer = auto)', def: '' },
      { k: 'ang', label: 'Winkelraster', type: 'sel', def: '30', opts: [['15', '15°'], ['30', '30°'], ['45', '45°'], ['90', '90°']] },
      { k: 'unit', label: 'Winkel in', type: 'sel', def: 'deg', opts: [['deg', 'Grad'], ['rad', 'Bogenmass (π)']] },
      { k: 'f', label: 'Kurve r(φ) = (optional)', def: '', wide: true, ph: 'z. B. 2*(1 + cos(phi))' },
      { k: 'pmax', label: 'φ bis (Vielfache von π)', def: '2' }
    ],
    draw(p, c) {
      const S = c.S, t = S.t, rmax = c.N('rmax'), R = 190, st = c.O('rstep') || niceStep(rmax, 4), da = +p.ang;
      if (!(rmax > 0) || !(st > 0) || rmax / st > 60) throw new Error('r max und Schritt prüfen');
      for (let a = 0; a < 360; a += da) {
        const x = Math.cos(a * D), y = -Math.sin(a * D), main = a % 90 === 0;
        S.line(0, 0, R * x, R * y, { c: main ? t.fg : t.grid, w: main ? 0.9 : 0.55 });
        const l = p.unit === 'deg' ? a + '°' : piLab(a * D);
        S.text((R + 9) * x + (Math.abs(x) < 0.3 ? 0 : 0), (R + 12) * y + (Math.abs(x) < 0.3 ? (y < 0 ? -2 : 2) : 0), l, { a: x > 0.3 ? 'start' : x < -0.3 ? 'end' : 'middle', s: 0.8 });
      }
      for (let k = 1; k * st <= rmax + 1e-9; k++) {
        const rr = k * st / rmax * R;
        S.circle(0, 0, rr, { c: t.grid, w: 0.55 });
        S.text(rr - 3, 6, fmt(k * st), { a: 'end', b: 'top', s: 0.72 });
      }
      S.circle(0, 0, R, { w: 1.1 });
      const f = c.F('f', ['phi', 'φ', 'x', 't']);
      if (f) {
        const pm = c.N('pmax') * Math.PI, n = 900, id = S.clipCircle(0, 0, R + 0.5); let d = '', pen = false;
        for (let i = 0; i <= n; i++) {
          const a = pm * i / n, rr = f({ phi: a, 'φ': a, x: a, t: a }) / rmax * R;
          if (!isFinite(rr)) { pen = false; continue; }
          d += (pen ? 'L' : 'M') + r(rr * Math.cos(a)) + ' ' + r(-rr * Math.sin(a)); pen = true;
        }
        if (d) S.add(`<path d="${d}" clip-path="url(#${id})" ${S.st({ c: c.col(0), w: 1.5 })}/>`);
      }
    }
  });

  /* ---------- Oszilloskop ---------- */
  E.add({
    id: 'oszi', g: 4, name: 'Oszilloskop-Raster',
    fields: [
      { k: 'td', label: 'Zeit pro div (s)', def: '200e-6' },
      { k: 'f1', label: 'CH1: u(t) = (optional)', def: '2*sin(2*pi*1000*t)', wide: true },
      { k: 'v1', label: 'CH1: V pro div', def: '1' },
      { k: 'f2', label: 'CH2: u(t) = (optional)', def: '', wide: true },
      { k: 'v2', label: 'CH2: V pro div', def: '1' }
    ],
    presets: {
      'Leeres Raster': { f1: '', f2: '' },
      'Sinus 1 kHz': { td: '200e-6', f1: '2*sin(2*pi*1000*t)', v1: '1', f2: '' },
      'Rechteck': { td: '1e-3', f1: '2*sgn(sin(2*pi*200*t))', v1: '1', f2: '', v2: '1' },
      'u und i phasenverschoben': { td: '2e-3', f1: '3*sin(2*pi*50*t)', v1: '1', f2: '2*sin(2*pi*50*t - pi/3)', v2: '1' }
    },
    draw(p, c) {
      const S = c.S, t = S.t, dv = 44, W = 10 * dv, H = 8 * dv, td = c.N('td');
      if (!(td > 0)) throw new Error('Zeit pro div muss grösser als 0 sein');
      for (let i = 1; i < 10; i++) S.line(i * dv, 0, i * dv, H, { c: t.grid, w: i === 5 ? 0.9 : 0.5 });
      for (let i = 1; i < 8; i++) S.line(0, i * dv, W, i * dv, { c: t.grid, w: i === 4 ? 0.9 : 0.5 });
      for (let i = 1; i < 50; i++) if (i % 5) S.line(i * dv / 5, H / 2 - 3, i * dv / 5, H / 2 + 3, { c: t.grid, w: 0.5 });
      for (let i = 1; i < 40; i++) if (i % 5) S.line(W / 2 - 3, i * dv / 5, W / 2 + 3, i * dv / 5, { c: t.grid, w: 0.5 });
      S.rect(0, 0, W, H, { w: 1.2 });
      const bx = { x: 0, y: 0, w: W, h: H }, foot = [];
      [['f1', 'v1', 'CH1'], ['f2', 'v2', 'CH2']].forEach(([fk, vk, name], i) => {
        const f = c.F(fk, ['t', 'x']); if (!f) return;
        const vd = c.N(vk); if (!(vd > 0)) throw new Error(name + ': V pro div muss grösser als 0 sein');
        plotFn(S, { X: x => x / (10 * td) * W, Y: v => H / 2 - v / vd * dv }, bx, x => f({ t: x, x }), 0, 10 * td, { c: c.col(i), w: 1.5 });
        foot.push({ t: name + ': ' + U.si(vd) + 'V/div', c: c.col(i) });
      });
      let x = 0; foot.forEach(q => { S.text(x, H + 9, q.t, { a: 'start', b: 'top', s: 0.82, c: q.c }); x += U.textW(q.t, S.fs * 0.82) + 18; });
      S.text(W, H + 9, U.si(td) + 's/div', { a: 'end', b: 'top', s: 0.82 });
    }
  });

  /* ---------- Einheitskreis ---------- */
  E.add({
    id: 'einheitskreis', g: 2, name: 'Einheitskreis',
    fields: [
      { k: 'phi', label: 'Winkel φ (°)', def: '40' },
      { k: 'tan', label: 'Tangens einzeichnen', type: 'chk' },
      { k: 'vals', label: 'Werte anzeigen', type: 'chk' }
    ],
    draw(p, c) {
      const S = c.S, ph = c.N('phi') * D, co = Math.cos(ph), si = Math.sin(ph), L = 1.35;
      const bx = { x: 0, y: 0, w: 330, h: 330 };
      const m = axesCross(S, bx, { xmin: -L, xmax: L, ymin: -L, ymax: L, xstep: 1, ystep: 1, grid: 0, nums: true, xlabel: 'x', ylabel: 'y' });
      const O = [m.X(0), m.Y(0)], P = [m.X(co), m.Y(si)], R = m.X(1) - m.X(0);
      S.circle(O[0], O[1], R, { w: 1.2 });
      S.line(O[0], O[1], P[0], P[1], { w: 1.2 });
      S.line(O[0], O[1], P[0], O[1], { c: c.col(0), w: 2.2 }); S.line(P[0], O[1], P[0], P[1], { c: c.col(1), w: 2.2 });
      const v = (n, x) => p.vals ? n + ' = ' + U.rd(x, 3) : n;
      S.text((O[0] + P[0]) / 2, O[1] + (si >= 0 ? 22 : -22), v('cos φ', co), { c: c.col(0), s: 0.85 });
      const ta = Math.tan(ph), tanOn = p.tan && Math.abs(ta) <= L && co > 1e-6, sr = co >= 0 && !tanOn;
      S.text(P[0] + (sr ? 7 : -7), (O[1] + P[1]) / 2, v('sin φ', si), { c: c.col(1), s: 0.85, a: sr ? 'start' : 'end' });
      if (tanOn) {
        const T = [m.X(1), m.Y(ta)];
        S.line(P[0], P[1], T[0], T[1], { dash: [4, 3], w: 0.8 }); S.line(T[0], O[1], T[0], T[1], { c: c.col(2), w: 2.2 });
        S.text(T[0] + 7, (O[1] + T[1]) / 2 + (ta >= 0 ? -12 : 12), v('tan φ', ta), { c: c.col(2), s: 0.85, a: 'start' });
      }
      let a = ph % (2 * Math.PI); if (a < 0) a += 2 * Math.PI;
      if (a > 0.05) {
        S.poly(U.arcPts(O[0], O[1], 30, 0, a), { w: 0.8 });
        S.text(O[0] + 43 * Math.cos(a / 2), O[1] - 43 * Math.sin(a / 2), p.vals ? 'φ = ' + U.rd(a / D, 1) + '°' : 'φ', { s: 0.85, a: p.vals && Math.cos(a / 2) > 0 ? 'start' : 'middle' });
      }
      S.dot(P[0], P[1], 3.2); S.text(P[0] + (co >= 0 ? 10 : -10), P[1] + (si >= 0 ? -11 : 11), 'P', { bold: true });
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
