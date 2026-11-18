/* EE-Toolkit – Kern: SVG-Builder, Formel-Parser, Hilfsfunktionen */
(function (g) {
  'use strict';
  const EET = g.EET = {
    tools: [],
    groups: ['Geometrie', 'Koordinatensysteme', 'Analysis & Lineare Algebra', 'Physik', 'Elektrotechnik']
  };

  const THEMES = {
    hell: { fg: '#000000', bg: '#ffffff', grid: '#9aa0a6', minor: '#dfe1e5', fill: '#dbe7fb',
      col: ['#1558b0', '#c5221f', '#188038', '#b06000', '#8430ce', '#007b83'] },
    dunkel: { fg: '#ffffff', bg: '#000000', grid: '#80868b', minor: '#3c4043', fill: '#22324d',
      col: ['#8ab4f8', '#f28b82', '#81c995', '#fdd663', '#d7aefb', '#78d9ec'] }
  };
  EET.THEMES = THEMES;

  const r = v => Math.round(v * 100) / 100;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* Text mit Tief-/Hochstellung: U_1, U_{ab}, m/s^2, 10^{-3} */
  function segs(str) {
    const out = []; let i = 0, buf = '';
    const isAl = ch => /[A-Za-z0-9Ͱ-Ͽ]/.test(ch);
    while (i < str.length) {
      const ch = str[i];
      if ((ch === '_' || ch === '^') && i + 1 < str.length) {
        let seg = null, j = i + 1;
        if (str[j] === '{') { const k = str.indexOf('}', j + 1); if (k > 0) { seg = str.slice(j + 1, k); j = k + 1; } }
        else if (isAl(str[j]) || str[j] === '-' || str[j] === '−') {
          let k = j + 1; while (k < str.length && isAl(str[k])) k++;
          seg = str.slice(j, k); j = k;
        }
        if (seg != null) { if (buf) out.push({ t: buf }); buf = ''; out.push({ t: seg, s: ch === '_' ? 1 : -1 }); i = j; continue; }
      }
      buf += ch; i++;
    }
    if (buf) out.push({ t: buf });
    return out;
  }
  function rich(str) {
    let out = '', pend = 0;
    for (const s of segs(String(str))) {
      if (s.s) {
        const own = s.s > 0 ? 0.22 : -0.34, tot = pend + own;
        out += `<tspan dy="${r(tot / 0.72)}em" font-size="72%">${esc(s.t)}</tspan>`; pend = -own;
      } else {
        out += pend ? `<tspan dy="${r(pend)}em">${esc(s.t)}</tspan>` : esc(s.t); pend = 0;
      }
    }
    return out;
  }
  function textW(str, sz) {
    let w = 0;
    for (const s of segs(String(str))) w += s.t.length * sz * 0.56 * (s.s ? 0.72 : 1);
    return w;
  }

  function dpath(pts, close) {
    let d = '';
    pts.forEach((p, i) => { d += (i ? 'L' : 'M') + r(p[0]) + ' ' + r(p[1]); });
    return d + (close ? 'Z' : '');
  }

  class Svg {
    constructor(c) {
      this.t = c.theme; this.lw = c.lw; this.fs = c.fs; this.tr = c.transparent; this.scale = c.scale || 1;
      this.p = []; this.defs = []; this.bb = [Infinity, Infinity, -Infinity, -Infinity]; this.n = 0; this.m = 14;
      this.uid = 'c' + Math.random().toString(36).slice(2, 8);
    }
    tk(x, y, pad) {
      pad = pad || 0; const b = this.bb;
      if (x - pad < b[0]) b[0] = x - pad; if (y - pad < b[1]) b[1] = y - pad;
      if (x + pad > b[2]) b[2] = x + pad; if (y + pad > b[3]) b[3] = y + pad;
    }
    add(s) { this.p.push(s); return this; }
    st(o) {
      o = o || {}; const w = (o.w || 1) * this.lw;
      let s = `stroke="${o.c || this.t.fg}" stroke-width="${r(w)}" fill="${o.fill || 'none'}"`;
      if (o.dash) {
        const d = o.dash === true ? [6, 4] : o.dash;
        s += ` stroke-dasharray="${d.map(v => r(v * this.lw / 1.6)).join(' ')}" stroke-linecap="butt"`;
      } else s += ' stroke-linecap="round"';
      s += ' stroke-linejoin="round"';
      if (o.op != null) s += ` opacity="${o.op}"`;
      if (o.fop != null) s += ` fill-opacity="${o.fop}"`;
      return s;
    }
    line(x1, y1, x2, y2, o) {
      this.tk(x1, y1); this.tk(x2, y2);
      return this.add(`<line x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}" ${this.st(o)}/>`);
    }
    poly(pts, o, close) {
      pts.forEach(p => this.tk(p[0], p[1]));
      return this.add(`<path d="${dpath(pts, close)}" ${this.st(o)}/>`);
    }
    circle(x, y, R, o) {
      this.tk(x, y, R);
      return this.add(`<circle cx="${r(x)}" cy="${r(y)}" r="${r(R)}" ${this.st(o)}/>`);
    }
    dot(x, y, R, c) {
      R = R || 3; this.tk(x, y, R);
      return this.add(`<circle cx="${r(x)}" cy="${r(y)}" r="${r(R)}" fill="${c || this.t.fg}"/>`);
    }
    rect(x, y, w, h, o) { return this.poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], o, true); }
    text(x, y, str, o) {
      o = o || {}; str = String(str);
      const sz = this.fs * (o.s || 1), a = o.a || 'middle';
      const dy = ({ middle: 0.35, top: 0.85, bottom: -0.25, base: 0 })[o.b || 'middle'] * sz;
      const w = textW(str, sz), x0 = a === 'middle' ? x - w / 2 : a === 'end' ? x - w : x;
      this.tk(x0, y + dy - sz * 0.85); this.tk(x0 + w, y + dy + sz * 0.3);
      return this.add(`<text x="${r(x)}" y="${r(y + dy)}" font-size="${r(sz)}" text-anchor="${a}" fill="${o.c || this.t.fg}"${o.it ? ' font-style="italic"' : ''}${o.bold ? ' font-weight="600"' : ''}>${rich(str)}</text>`);
    }
    arrow(x1, y1, x2, y2, o) {
      o = o || {};
      const L = Math.hypot(x2 - x1, y2 - y1); if (L < 1e-6) return this;
      const ux = (x2 - x1) / L, uy = (y2 - y1) / L;
      const hs = Math.min(o.head || (6 + 3 * this.lw * (o.w || 1)), L), hw = hs * 0.36;
      const bx = x2 - ux * hs, by = y2 - uy * hs;
      if (L > hs * 0.7) this.line(x1, y1, x2 - ux * hs * 0.7, y2 - uy * hs * 0.7, o);
      this.tk(x2, y2);
      return this.add(`<path d="M${r(x2)} ${r(y2)}L${r(bx - uy * hw)} ${r(by + ux * hw)}L${r(bx + uy * hw)} ${r(by - ux * hw)}Z" fill="${o.c || this.t.fg}"${o.op != null ? ` opacity="${o.op}"` : ''}/>`);
    }
    clipRect(x, y, w, h) {
      const id = this.uid + (++this.n);
      this.defs.push(`<clipPath id="${id}"><rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}"/></clipPath>`);
      return id;
    }
    clipCircle(x, y, R) {
      const id = this.uid + (++this.n);
      this.defs.push(`<clipPath id="${id}"><circle cx="${r(x)}" cy="${r(y)}" r="${r(R)}"/></clipPath>`);
      return id;
    }
    toString() {
      let b = this.bb; if (!isFinite(b[0])) b = [0, 0, 100, 100];
      const m = this.m, x = Math.floor(b[0] - m), y = Math.floor(b[1] - m);
      const w = Math.ceil(b[2] + m) - x, h = Math.ceil(b[3] + m) - y;
      const bg = this.tr ? '' : `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${this.t.bg}"/>`;
      const defs = this.defs.length ? `<defs>${this.defs.join('')}</defs>` : '';
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${r(w * this.scale)}" height="${r(h * this.scale)}" viewBox="${x} ${y} ${w} ${h}" font-family="'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif">${defs}${bg}${this.p.join('')}</svg>`;
    }
  }
  EET.Svg = Svg;

  /* ---------- Formel-Parser ---------- */
  const sinc = x => x === 0 ? 1 : Math.sin(x) / x;
  const FN = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan,
    arcsin: Math.asin, arccos: Math.acos, arctan: Math.atan, atan2: Math.atan2,
    sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh, exp: Math.exp, ln: Math.log,
    log: Math.log10, lg: Math.log10, log10: Math.log10, log2: Math.log2,
    sqrt: Math.sqrt, wurzel: Math.sqrt, abs: Math.abs, sgn: Math.sign, sign: Math.sign,
    floor: Math.floor, ceil: Math.ceil, round: Math.round, min: Math.min, max: Math.max,
    step: x => x >= 0 ? 1 : 0, sigma: x => x >= 0 ? 1 : 0,
    rect: x => Math.abs(x) <= 0.5 ? 1 : 0, tri: x => Math.max(0, 1 - Math.abs(x)), sinc
  };
  const CONST = { pi: Math.PI, 'π': Math.PI, e: Math.E };

  function tokenize(src) {
    const s = String(src).replace(/[·×]/g, '*').replace(/−/g, '-').replace(/²/g, '^2').replace(/³/g, '^3').replace(/÷/g, '/');
    const re = /\s*(?:(\d+(?:\.\d*)?(?:[eE][+-]?\d+)?|\.\d+(?:[eE][+-]?\d+)?)|([A-Za-z_Ͱ-Ͽ][A-Za-z0-9_Ͱ-Ͽ]*)|(\S))/y;
    const out = []; let m;
    while (re.lastIndex < s.length) {
      m = re.exec(s); if (!m) break;
      if (m[1] != null) out.push({ k: 'n', v: parseFloat(m[1]) });
      else if (m[2] != null) out.push({ k: 'i', v: m[2] });
      else out.push({ k: 'o', v: m[3] });
    }
    return out;
  }
  function parse(src) {
    const tk = tokenize(src); let i = 0;
    const isop = v => tk[i] && tk[i].k === 'o' && tk[i].v === v;
    function expr() { let a = term(); while (isop('+') || isop('-')) { const op = tk[i++].v; a = { t: 'b', op, a, b: term() }; } return a; }
    function term() {
      let a = unary();
      for (;;) {
        if (isop('*') || isop('/')) { const op = tk[i++].v; a = { t: 'b', op, a, b: unary() }; }
        else if (tk[i] && (tk[i].k === 'n' || tk[i].k === 'i' || isop('('))) a = { t: 'b', op: '*', a, b: power() };
        else break;
      }
      return a;
    }
    function unary() { if (isop('-')) { i++; return { t: 'u', a: unary() }; } if (isop('+')) { i++; return unary(); } return power(); }
    function power() { const a = prim(); if (isop('^')) { i++; return { t: 'b', op: '^', a, b: unary() }; } return a; }
    function prim() {
      const t = tk[i]; if (!t) throw new Error('Ausdruck unvollständig');
      if (t.k === 'n') { i++; return { t: 'n', v: t.v }; }
      if (t.k === 'i') {
        i++;
        if (isop('(') && Object.prototype.hasOwnProperty.call(FN, t.v)) {
          i++; const args = [];
          if (!isop(')')) { args.push(expr()); while (isop(',') || isop(';')) { i++; args.push(expr()); } }
          if (!isop(')')) throw new Error('")" fehlt'); i++;
          return { t: 'f', n: t.v, args };
        }
        return { t: 'v', n: t.v };
      }
      if (isop('(')) { i++; const a = expr(); if (!isop(')')) throw new Error('")" fehlt'); i++; return a; }
      throw new Error('Unerwartetes Zeichen "' + t.v + '"');
    }
    const a = expr();
    if (i < tk.length) throw new Error('Unerwartetes Zeichen "' + tk[i].v + '"');
    return a;
  }
  function check(ast, known) {
    (function chk(n) {
      if (n.t === 'v' && !known(n.n)) throw new Error('Unbekannt: "' + n.n + '"');
      if (n.a) chk(n.a); if (n.b) chk(n.b); if (n.args) n.args.forEach(chk);
    })(ast);
  }
  /* reell: compile('2*sin(x)', ['x']) -> f({x: 1}) */
  function compile(src, vars) {
    const ast = parse(src), vs = new Set(vars || []);
    check(ast, n => vs.has(n) || n in CONST);
    const ev = (n, e) => {
      switch (n.t) {
        case 'n': return n.v;
        case 'v': return vs.has(n.n) ? e[n.n] : CONST[n.n];
        case 'u': return -ev(n.a, e);
        case 'f': return FN[n.n].apply(null, n.args.map(a => ev(a, e)));
        default: {
          const a = ev(n.a, e), b = ev(n.b, e);
          switch (n.op) { case '+': return a + b; case '-': return a - b; case '*': return a * b; case '/': return a / b; default: return Math.pow(a, b); }
        }
      }
    };
    return e => ev(ast, e || {});
  }
  /* komplex: Werte als [re, im]; j und i sind die imaginäre Einheit */
  function compileC(src, vars) {
    const ast = parse(src), vs = new Set(vars || []);
    const CC = { pi: [Math.PI, 0], 'π': [Math.PI, 0], e: [Math.E, 0], j: [0, 1], i: [0, 1] };
    check(ast, n => vs.has(n) || n in CC);
    const C = {
      mul: (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]],
      div: (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; },
      exp: a => { const m = Math.exp(a[0]); return [m * Math.cos(a[1]), m * Math.sin(a[1])]; },
      ln: a => [Math.log(Math.hypot(a[0], a[1])), Math.atan2(a[1], a[0])],
      pow: (a, b) => {
        if (b[1] === 0 && Number.isInteger(b[0]) && Math.abs(b[0]) <= 64) {
          let n = Math.abs(b[0]), q = [1, 0]; while (n--) q = C.mul(q, a);
          return b[0] < 0 ? C.div([1, 0], q) : q;
        }
        if (a[0] === 0 && a[1] === 0) return [0, 0];
        return C.exp(C.mul(b, C.ln(a)));
      }
    };
    const fn = (name, args) => {
      if (name === 'exp') return C.exp(args[0]);
      if (name === 'ln') return C.ln(args[0]);
      if (name === 'sqrt' || name === 'wurzel') return C.pow(args[0], [0.5, 0]);
      if (name === 'abs') return [Math.hypot(args[0][0], args[0][1]), 0];
      if (args.some(a => Math.abs(a[1]) > 1e-12)) throw new Error('Funktion "' + name + '" geht hier nur mit reellen Werten');
      return [FN[name].apply(null, args.map(a => a[0])), 0];
    };
    const ev = (n, e) => {
      switch (n.t) {
        case 'n': return [n.v, 0];
        case 'v': return vs.has(n.n) ? e[n.n] : CC[n.n];
        case 'u': { const a = ev(n.a, e); return [-a[0], -a[1]]; }
        case 'f': return fn(n.n, n.args.map(a => ev(a, e)));
        default: {
          const a = ev(n.a, e), b = ev(n.b, e);
          switch (n.op) {
            case '+': return [a[0] + b[0], a[1] + b[1]]; case '-': return [a[0] - b[0], a[1] - b[1]];
            case '*': return C.mul(a, b); case '/': return C.div(a, b); default: return C.pow(a, b);
          }
        }
      }
    };
    return e => ev(ast, e || {});
  }
  function num(v, label) {
    if (typeof v === 'number') return v;
    const s = String(v == null ? '' : v).trim().replace(/,/g, '.');
    const L = label || 'Wert';
    if (!s) throw new Error(L + ': Eingabe fehlt');
    let x;
    try { x = compile(s, [])(); } catch (e) { throw new Error(L + ': ' + e.message); }
    if (!isFinite(x)) throw new Error(L + ': keine gültige Zahl');
    return x;
  }

  /* ---------- Zahlen & Hilfen ---------- */
  function niceStep(range, n) {
    const raw = range / Math.max(1, n), p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
    return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p;
  }
  function fmt(v) {
    if (Math.abs(v) < 1e-12) return '0';
    const a = Math.abs(v);
    if (a >= 1e5 || a < 1e-4) {
      const s = v.toExponential(3), k = s.indexOf('e');
      let m = String(parseFloat(s.slice(0, k))); const ex = parseInt(s.slice(k + 1), 10);
      m = m === '1' ? '' : m === '-1' ? '−' : m.replace('-', '−') + '·';
      return m + '10^{' + String(ex).replace('-', '−') + '}';
    }
    return String(parseFloat(v.toPrecision(6))).replace('-', '−');
  }
  const rd = (v, d) => String(parseFloat(v.toFixed(d == null ? 2 : d))).replace('-', '−');
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a || 1; }
  /* v als Vielfaches von π, z. B. 3π/2 */
  function piLab(v) {
    const n0 = Math.round(v / Math.PI * 12); if (n0 === 0) return '0';
    const q = gcd(n0, 12), n = n0 / q, d = 12 / q;
    return (n === 1 ? '' : n === -1 ? '−' : String(n).replace('-', '−')) + 'π' + (d > 1 ? '/' + d : '');
  }
  function si(v) {
    if (v === 0) return '0 ';
    const P = { '-4': 'p', '-3': 'n', '-2': 'µ', '-1': 'm', '0': '', '1': 'k', '2': 'M', '3': 'G' };
    const e = Math.max(-4, Math.min(3, Math.floor(Math.log10(Math.abs(v)) / 3 + 1e-9)));
    return parseFloat((v / Math.pow(10, 3 * e)).toPrecision(3)) + ' ' + P[e];
  }
  function rows(text, minCols, what) {
    const out = [];
    String(text || '').split('\n').forEach(line => {
      if (!line.trim()) return;
      const c = line.split(';').map(s => s.trim());
      if (c.length < minCols) throw new Error((what || 'Liste') + ': Zeile "' + line.trim() + '" braucht ' + minCols + ' Angaben, getrennt mit ;');
      out.push(c);
    });
    return out;
  }
  /* Punkte eines Bogens (Winkel mathematisch, y nach oben; Ausgabe in Pixeln) */
  function arcPts(cx, cy, R, a0, a1) {
    const n = Math.max(6, Math.ceil(Math.abs(a1 - a0) * R / 4)), pts = [];
    for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; pts.push([cx + R * Math.cos(a), cy - R * Math.sin(a)]); }
    return pts;
  }
  /* Winkelmarke bei V zwischen den Richtungen nach P und Q (Pixelpunkte) */
  function angleMark(S, V, P, Q, label, o) {
    o = o || {};
    const a0 = Math.atan2(-(P[1] - V[1]), P[0] - V[0]), a1 = Math.atan2(-(Q[1] - V[1]), Q[0] - V[0]);
    let d = a1 - a0; while (d > Math.PI) d -= 2 * Math.PI; while (d <= -Math.PI) d += 2 * Math.PI;
    const R = o.R || 28, mid = a0 + d / 2, right = Math.abs(Math.abs(d) - Math.PI / 2) < 2e-3;
    S.poly(arcPts(V[0], V[1], R, a0, a0 + d), { w: 0.7, c: o.c });
    if (right) S.dot(V[0] + R * 0.5 * Math.cos(mid), V[1] - R * 0.5 * Math.sin(mid), 1.8, o.c);
    if (label) {
      const inside = !right && textW(label, S.fs * 0.85) < 14 && Math.abs(d) > 0.65;
      const rr = inside ? R * 0.58 : R + 6 + textW(label, S.fs * 0.85) / 2;
      S.text(V[0] + rr * Math.cos(mid), V[1] - rr * Math.sin(mid), label, { s: 0.85, c: o.c });
    }
  }
  /* Text neben der Strecke AB, auf der von 'away' abgewandten Seite, ohne die Strecke zu berühren */
  function besideLine(S, A, B, away, text, o) {
    o = o || {}; const L = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1; let nx = (B[1] - A[1]) / L, ny = -(B[0] - A[0]) / L;
    const t = o.t == null ? 0.5 : o.t, mx = A[0] + (B[0] - A[0]) * t, my = A[1] + (B[1] - A[1]) * t;
    if (away && (mx - away[0]) * nx + (my - away[1]) * ny < 0) { nx = -nx; ny = -ny; }
    const sz = S.fs * (o.s || 1), d = textW(text, sz) / 2 * Math.abs(nx) + sz * 0.55 * Math.abs(ny) + 6;
    S.text(mx + nx * d, my + ny * d, text, o);
  }
  const off = (p, from, d) => { const L = Math.hypot(p[0] - from[0], p[1] - from[1]) || 1; return [p[0] + (p[0] - from[0]) / L * d, p[1] + (p[1] - from[1]) / L * d]; };
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  /* Beschriftung nach Modus: none | name | val | both */
  function lab(mode, name, val, unit) {
    const v = () => rd(val) + (unit ? ' ' + unit : '');
    return mode === 'name' ? name : mode === 'val' ? v() : mode === 'both' ? name + ' = ' + v() : null;
  }
  /* Name mit Vektorpfeil darüber */
  function vecLabel(S, x, y, name, c, withArrow) {
    S.text(x, y, name, { c });
    if (withArrow) { const w = Math.max(9, textW(name, S.fs)); S.arrow(x - w / 2, y - S.fs * 0.72, x + w / 2 + 2, y - S.fs * 0.72, { c, w: 0.6, head: 5 }); }
  }

  EET.LBL = [['none', 'keine'], ['name', 'Namen'], ['val', 'Werte'], ['both', 'Name = Wert']];
  EET.u = { besideLine, r, esc, niceStep, fmt, rd, piLab, si, rows, arcPts, angleMark, off, mid, lab, vecLabel, textW, num, compile, compileC, gcd };

  EET.add = function (tool) { EET.tools.push(tool); };
  EET.defaults = function (tool) {
    const p = {};
    tool.fields.forEach(f => { p[f.k] = f.def != null ? f.def : (f.type === 'chk' ? false : ''); });
    return p;
  };
  EET.render = function (tool, p, o) {
    o = o || {};
    const th = Object.assign({}, THEMES[o.theme] || THEMES.hell);
    if (o.mono) th.col = th.col.map(() => th.fg);
    const S = new Svg({ theme: th, lw: o.lw || 1.6, fs: o.fs || 15, transparent: o.transparent, scale: o.scale || 1 });
    const lb = k => { const f = tool.fields.find(f => f.k === k); return f ? f.label : k; };
    const blank = k => p[k] == null || String(p[k]).trim() === '';
    const c = {
      S, t: th, p, col: i => th.col[i % th.col.length],
      N: k => num(p[k], lb(k)),
      O: k => blank(k) ? null : num(p[k], lb(k)),
      F: (k, vars) => { if (blank(k)) return null; try { return compile(String(p[k]), vars); } catch (e) { throw new Error(lb(k) + ': ' + e.message); } }
    };
    tool.draw(p, c);
    return S.toString();
  };
})(typeof window !== 'undefined' ? window : globalThis);
