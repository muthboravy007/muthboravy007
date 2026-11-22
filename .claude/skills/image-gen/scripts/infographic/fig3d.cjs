// 3D figure engine for infographics: orthographic camera, lit/shaded parametric surfaces with mesh lines,
// polygons, arrows, axes, curves, circles (dashed back halves), boxes, labels. Output: an SVG string.
// Painter's algorithm: every face/segment is depth-sorted, so surfaces, planes and arrows occlude correctly.
const { texSVG, esc } = require('./tex.cjs');

const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a) => { const n = Math.hypot(...a) || 1; return mul(a, 1 / n); };
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));

// ---------- colour maps (t in [0,1]) ----------
const hex = (h) => { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
const ramp = (stops) => (t) => {
  t = clamp(t); const n = stops.length - 1, i = Math.min(n - 1, Math.floor(t * n)), f = t * n - i;
  const a = hex(stops[i]), b = hex(stops[i + 1]); return a.map((v, k) => v + (b[k] - v) * f);
};
const CMAPS = {
  warm: ramp(['#5b8fa8', '#a9c6cf', '#f1dcc0', '#f3b97f', '#e9955c']),        // teal → cream → orange
  coral: ramp(['#f6e4da', '#eab39d', '#d97a5c', '#b8432c']),
  teal: ramp(['#e3efe9', '#a9cdbf', '#5f9a87', '#1d5a4b']),
  mint: ramp(['#eef4f1', '#bcd8cc', '#7fae9c']),
  rdbu: ramp(['#3d6fb0', '#9ec0e0', '#f3ece4', '#efb08f', '#c8553a']),        // blue → cream → red
  jet: ramp(['#1f4fd8', '#2aa8f0', '#7fe0c8', '#f6ee5a', '#f59a2d', '#e0322a']),
  pink: ramp(['#f3d5e7', '#e7a0c9', '#c86aa8', '#9a3d86']),
  sand: ramp(['#efe1cd', '#d9b993', '#b08a61', '#7d5a3a']),
  slate: ramp(['#dfe9ee', '#a9c3d0', '#6f94a8', '#3e6478']),
};
const rgb = (c) => `rgb(${c.map(v => Math.round(clamp(v, 0, 255))).join(',')})`;

class Scene {
  // azimuth: rotation about z (degrees). Default 240 → x axis comes toward the viewer (down-left), y goes right.
  // elevation: camera height (degrees). scale: px per unit. center: world point at the SVG centre.
  constructor({ width = 520, height = 420, azimuth = 240, elevation = 24, scale = 60, center = [0, 0, 0], offset = [0, 0],
    light = [-0.35, -0.55, 0.75], ambient = 0.62, diffuse = 0.48, specular = 0.18, bg = null } = {}) {
    Object.assign(this, { width, height, scale, center, offset, ambient, diffuse, specular, bg });
    this.a = azimuth * Math.PI / 180; this.e = elevation * Math.PI / 180;
    this.L = unit(light); this.items = []; this.top = []; this.defs = []; this.uid = Math.random().toString(36).slice(2, 7);
  }
  view(p) { // world → [screenRight, depth(away +), up]
    const [x, y, z] = sub(p, this.center), ca = Math.cos(this.a), sa = Math.sin(this.a), ce = Math.cos(this.e), se = Math.sin(this.e);
    const xr = x * ca - y * sa, yr = x * sa + y * ca;
    return [xr, yr * ce - z * se, z * ce + yr * se];
  }
  P(p) { const v = this.view(p); return [this.width / 2 + this.offset[0] + this.scale * v[0], this.height / 2 + this.offset[1] - this.scale * v[2], v[1]]; }
  depth(p) { return this.view(p)[1]; }
  _push(depth, svg) { this.items.push({ depth, svg }); return this; }
  over(svg) { this.top.push(svg); return this; } // always drawn last (labels, annotations)

  shade(baseRGB, nWorld) {
    let n = this.view(add(nWorld, this.center)); n = unit(n); // rotate normal into view space
    if (n[1] > 0) n = mul(n, -1);                              // two-sided: face the camera
    const L = [this.L[0], this.L[1], this.L[2]];
    const d = Math.max(0, dot(n, L));
    const h = unit(add(L, [0, -1, 0])), s = Math.pow(Math.max(0, dot(n, h)), 24) * this.specular;
    const k = this.ambient + this.diffuse * d;
    return baseRGB.map(v => v * k + 255 * s);
  }

  // Parametric surface S(u,v) → [x,y,z]
  surface(S, { u = [0, 1], v = [0, 1], nu = 40, nv = 40, cmap = 'warm', color = null, colorBy = 'z', range = null, opacity = 1,
    grid = 4, gridColor = 'rgba(40,30,25,.38)', gridWidth = 0.7, seam = true, lit = true, closedU = false } = {}) {
    const pts = [];
    for (let i = 0; i <= nu; i++) { pts.push([]); for (let j = 0; j <= nv; j++) pts[i].push(S(u[0] + (u[1] - u[0]) * i / nu, v[0] + (v[1] - v[0]) * j / nv)); }
    const cm = typeof cmap === 'function' ? cmap : CMAPS[cmap] || CMAPS.warm;
    let vals = [];
    const val = (p, i, j) => typeof colorBy === 'function' ? colorBy(p, i / nu, j / nv) : colorBy === 'u' ? i / nu : colorBy === 'v' ? j / nv : colorBy === 'depth' ? -this.depth(p) : p[2];
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) vals.push(val(pts[i][j], i + .5, j + .5));
    const [lo, hi] = range || [Math.min(...vals), Math.max(...vals)];
    let q = 0;
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
      const a = pts[i][j], b = pts[i + 1][j], c = pts[i + 1][j + 1], d = pts[i][j + 1];
      const nrm = unit(cross(sub(c, a), sub(d, b)));
      const t = (vals[q++] - lo) / ((hi - lo) || 1);
      let col = color ? hex(color) : cm(t);
      if (lit) col = this.shade(col, nrm);
      const P = [a, b, c, d].map(p => this.P(p)), dep = (P[0][2] + P[1][2] + P[2][2] + P[3][2]) / 4;
      const poly = P.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
      let s = `<polygon points="${poly}" fill="${rgb(col)}"${opacity < 1 ? ` fill-opacity="${opacity}"` : ''}${seam ? ` stroke="${rgb(col)}" stroke-width=".6"${opacity < 1 ? ` stroke-opacity="${opacity}"` : ''}` : ''}/>`;
      if (grid) { // mesh lines every `grid` cells, drawn with the face so occlusion stays right
        const e = [];
        if (i % grid === 0) e.push([P[0], P[3]]); if (j % grid === 0) e.push([P[0], P[1]]);
        if (i === nu - 1 && !closedU) e.push([P[1], P[2]]); if (j === nv - 1) e.push([P[3], P[2]]);
        for (const [p1, p2] of e) s += `<line x1="${p1[0].toFixed(1)}" y1="${p1[1].toFixed(1)}" x2="${p2[0].toFixed(1)}" y2="${p2[1].toFixed(1)}" stroke="${gridColor}" stroke-width="${gridWidth}"/>`;
      }
      this._push(dep, s);
    }
    return this;
  }
  graph(f, { x = [-2, 2], y = [-2, 2], ...o } = {}) { return this.surface((a, b) => [a, b, f(a, b)], { u: x, v: y, ...o }); }

  polygon(points, { fill = 'rgba(0,0,0,.1)', stroke = 'none', width = 1, dash = null, lit = false, depthBias = 0 } = {}) {
    const P = points.map(p => this.P(p)), dep = P.reduce((m, p) => m + p[2], 0) / P.length + depthBias;
    let f = fill;
    if (lit && fill.startsWith('#')) f = rgb(this.shade(hex(fill), unit(cross(sub(points[1], points[0]), sub(points[2], points[0])))));
    return this._push(dep, `<polygon points="${P.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')}" fill="${f}" stroke="${stroke}" stroke-width="${width}"${dash ? ` stroke-dasharray="${dash}"` : ''} stroke-linejoin="round"/>`);
  }
  // polyline in 3D, split into depth-sorted segments; dashBack: draw parts behind `pivot` depth dashed
  curve(points, { color = '#1d1a17', width = 2, dash = null, opacity = 1, onTop = false, dashBack = null, pivot = null, cap = 'round' } = {}) {
    const P = points.map(p => this.P(p)), pd = pivot ? this.P(pivot)[2] : 0;
    const seg = (a, b, d) => `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${color}" stroke-width="${width}" stroke-linecap="${cap}"${d ? ` stroke-dasharray="${d}"` : ''}${opacity < 1 ? ` stroke-opacity="${opacity}"` : ''}/>`;
    if (dashBack || !onTop) {
      // group consecutive segments with the same front/back state so dash patterns stay continuous
      let run = [P[0]], state = null; const flush = () => {
        if (run.length < 2) return; const d = state === 'back' ? dashBack : dash;
        const svg = `<polyline points="${run.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="${cap}" stroke-linejoin="round"${d ? ` stroke-dasharray="${d}"` : ''}${opacity < 1 ? ` stroke-opacity="${opacity}"` : ''}/>`;
        if (onTop) this.over(svg); else this._push(run.reduce((m, p) => m + p[2], 0) / run.length, svg);
      };
      for (let i = 1; i < P.length; i++) {
        const st = dashBack && (P[i - 1][2] + P[i][2]) / 2 > pd ? 'back' : 'front';
        if (state !== null && (st !== state || (!onTop && !dashBack && run.length > 6))) { flush(); run = [P[i - 1]]; }
        state = st; run.push(P[i]);
      }
      flush(); return this;
    }
    return this.over(`<polyline points="${P.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="${cap}" stroke-linejoin="round"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`);
  }
  circle(center, normal, r, o = {}) {
    const n = unit(normal), t1 = unit(Math.abs(n[2]) < .9 ? cross(n, [0, 0, 1]) : cross(n, [1, 0, 0])), t2 = cross(n, t1);
    const pts = []; for (let k = 0; k <= 96; k++) { const t = 2 * Math.PI * k / 96; pts.push(add(center, add(mul(t1, r * Math.cos(t)), mul(t2, r * Math.sin(t))))); }
    return this.curve(pts, { pivot: center, ...o });
  }
  // arrow from p to q (world). headSize in px. onTop: skip depth sorting.
  arrow(p, q, { color = '#b8432c', width = 3, head = 13, dash = null, onTop = true, label = null, labelOffset = [10, -6], labelSize = 22, labelColor = null, bold = false } = {}) {
    const A = this.P(p), B = this.P(q), dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    const bx = B[0] - ux * head * .85, by = B[1] - uy * head * .85;
    const svg = `<g><line x1="${A[0].toFixed(1)}" y1="${A[1].toFixed(1)}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" stroke="${color}" stroke-width="${width}" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`
      + `<polygon points="${B[0].toFixed(1)},${B[1].toFixed(1)} ${(B[0] - ux * head - uy * head * .42).toFixed(1)},${(B[1] - uy * head + ux * head * .42).toFixed(1)} ${(B[0] - ux * head + uy * head * .42).toFixed(1)},${(B[1] - uy * head - ux * head * .42).toFixed(1)}" fill="${color}"/></g>`;
    if (onTop) this.over(svg); else this._push((A[2] + B[2]) / 2, svg);
    if (label) this.over(texSVG(B[0] + labelOffset[0], B[1] + labelOffset[1], label, { color: labelColor || color, size: labelSize, anchor: 'start', bold }));
    return this;
  }
  axes({ length = 2.2, x = null, y = null, z = null, labels = ['x', 'y', 'z'], color = '#1d1a17', width = 1.8, head = 10, origin = [0, 0, 0], neg = 0, size = 22 } = {}) {
    const lens = [x ?? length, y ?? length, z ?? length], dirs = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    dirs.forEach((d, i) => {
      if (!lens[i]) return;
      if (neg) this.curve([add(origin, mul(d, -neg)), origin], { color, width, onTop: true });
      const tip = add(origin, mul(d, lens[i]));
      this.arrow(origin, tip, { color, width, head, onTop: true });
      const T = this.P(tip), O = this.P(origin), ux = T[0] - O[0], uy = T[1] - O[1], L = Math.hypot(ux, uy) || 1;
      if (labels[i]) this.over(texSVG(T[0] + ux / L * 16, T[1] + uy / L * 16, labels[i], { color, size, anchor: 'middle' }));
    });
    return this;
  }
  point(p, { r = 6, fill = '#1d1a17', stroke = '#fff', width = 2, onTop = true } = {}) {
    const P = this.P(p), svg = `<circle cx="${P[0].toFixed(1)}" cy="${P[1].toFixed(1)}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
    return onTop ? this.over(svg) : this._push(P[2] - 1e-3, svg);
  }
  label(p, tex, { dx = 0, dy = 0, ...o } = {}) { const P = this.P(p); return this.over(texSVG(P[0] + dx, P[1] + dy, tex, o)); }
  text(x, y, tex, o = {}) { return this.over(texSVG(x, y, tex, o)); } // screen coordinates
  // dashed wire box between corners
  box(a, b, { color = '#6b645c', width = 1.2, dash = '5 4', fill = null } = {}) {
    const c = (i, j, k) => [[a[0], b[0]][i], [a[1], b[1]][j], [a[2], b[2]][k]];
    if (fill) for (const f of [[c(0,0,0),c(1,0,0),c(1,1,0),c(0,1,0)],[c(0,0,1),c(1,0,1),c(1,1,1),c(0,1,1)],[c(0,0,0),c(1,0,0),c(1,0,1),c(0,0,1)],[c(0,1,0),c(1,1,0),c(1,1,1),c(0,1,1)],[c(0,0,0),c(0,1,0),c(0,1,1),c(0,0,1)],[c(1,0,0),c(1,1,0),c(1,1,1),c(1,0,1)]]) this.polygon(f, { fill, lit: fill.startsWith('#') });
    const E = [];
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { E.push([c(0, i, j), c(1, i, j)], [c(i, 0, j), c(i, 1, j)], [c(i, j, 0), c(i, j, 1)]); }
    E.forEach(([p, q]) => this.curve([p, q], { color, width, dash, onTop: true }));
    return this;
  }
  // vertical cylinder outline: top/bottom circles (dashed back halves) + silhouette lines
  cylinder(c, r, h, { color = '#6b645c', width = 1.4, dash = '6 5', fill = null } = {}) {
    const top = add(c, [0, 0, h]);
    if (fill) this.over(this._cylFill(c, r, h, fill));
    this.circle(c, [0, 0, 1], r, { color, width, dashBack: dash, dash: null, onTop: true });
    this.circle(top, [0, 0, 1], r, { color, width, dash, onTop: true });
    let best = [], ts = []; for (let k = 0; k < 360; k++) { const t = k * Math.PI / 180, p = add(c, [r * Math.cos(t), r * Math.sin(t), 0]); ts.push([this.P(p)[0], p]); }
    ts.sort((m, n) => m[0] - n[0]); best = [ts[0][1], ts[ts.length - 1][1]];
    best.forEach(p => this.curve([p, add(p, [0, 0, h])], { color, width, dash, onTop: true }));
    return this;
  }
  _cylFill(c, r, h, fill) { const pts = []; for (let k = 0; k <= 64; k++) { const t = 2 * Math.PI * k / 64; pts.push(this.P(add(c, [r * Math.cos(t), r * Math.sin(t), 0]))); } return `<polygon points="${pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')}" fill="${fill}"/>`; }
  // wire sphere: silhouette + equator and one meridian with dashed back halves
  wireSphere(c, r, { color = '#8b847c', width = 1.2, dash = '5 4', meridians = [90], equator = true } = {}) {
    const C = this.P(c);
    this.over(`<circle cx="${C[0].toFixed(1)}" cy="${C[1].toFixed(1)}" r="${(r * this.scale).toFixed(1)}" fill="none" stroke="${color}" stroke-width="${width}"/>`);
    if (equator) this.circle(c, [0, 0, 1], r, { color, width, dashBack: dash, onTop: true });
    for (const m of meridians) { const t = m * Math.PI / 180; this.circle(c, [Math.cos(t), Math.sin(t), 0], r, { color, width, dashBack: dash, onTop: true }); }
    return this;
  }
  // arc for angles (e.g. θ between z axis and OP, φ in the xy plane)
  arc(center, from, to, r, { color = '#b8432c', width = 2, fill = null, steps = 40, arrow = false } = {}) {
    const a = unit(from), b0 = unit(to), n = unit(cross(a, b0)), b = cross(n, a), ang = Math.acos(clamp(dot(a, b0), -1, 1));
    const pts = []; for (let k = 0; k <= steps; k++) { const t = ang * k / steps; pts.push(add(center, add(mul(a, r * Math.cos(t)), mul(b, r * Math.sin(t))))); }
    if (fill) { const P = [center, ...pts].map(p => this.P(p)); this.over(`<polygon points="${P.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')}" fill="${fill}"/>`); }
    this.curve(pts, { color, width, onTop: true });
    if (arrow) this.arrow(pts[steps - 3], pts[steps], { color, width, head: 10 });
    return this;
  }
  svg({ cls = 'fig', style = '' } = {}) {
    const body = this.items.sort((m, n) => n.depth - m.depth).map(i => i.svg).join('');
    return `<svg class="${cls}" viewBox="0 0 ${this.width} ${this.height}" width="${this.width}" height="${this.height}" style="${style}" xmlns="http://www.w3.org/2000/svg"><defs>${this.defs.join('')}</defs>${this.bg ? `<rect width="100%" height="100%" fill="${this.bg}"/>` : ''}${body}${this.top.join('')}</svg>`;
  }
}

// surfaces of revolution (vases, pots): profile r(t), z(t) for t in [0,1]
const revolve = (profile, { theta = [0, 2 * Math.PI] } = {}) => (t, th) => { const [r, z] = profile(t); return [r * Math.cos(th), r * Math.sin(th), z]; };
// tube of radius rad around a 3D curve C(t)
const tube = (C, rad) => (t, th) => {
  const e = 1e-3, p = C(t), T = unit(sub(C(Math.min(1, t + e)), C(Math.max(0, t - e))));
  const N = unit(Math.abs(T[2]) < .9 ? cross(T, [0, 0, 1]) : cross(T, [1, 0, 0])), B = cross(T, N), R = typeof rad === 'function' ? rad(t) : rad;
  return add(p, add(mul(N, R * Math.cos(th)), mul(B, R * Math.sin(th))));
};

module.exports = { Scene, CMAPS, ramp, revolve, tube, vec: { add, sub, mul, dot, cross, unit } };
