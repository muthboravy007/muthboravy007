// 2D figure library for infographics. Every function returns an SVG string.
const { texSVG } = require('./tex.cjs');
const f1 = (v) => (+v).toFixed(1);
let _id = 0; const uid = (p) => `${p}${++_id}`;

function arrowHead(x, y, ux, uy, size, color) {
  return `<polygon points="${f1(x)},${f1(y)} ${f1(x - ux * size - uy * size * .42)},${f1(y - uy * size + ux * size * .42)} ${f1(x - ux * size + uy * size * .42)},${f1(y - uy * size - ux * size * .42)}" fill="${color}"/>`;
}
// straight arrow in screen coordinates
function arrow(x1, y1, x2, y2, { color = '#1d1a17', width = 2, head = 10, dash = null, opacity = 1 } = {}) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
  return `<g opacity="${opacity}"><line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2 - ux * head * .8)}" y2="${f1(y2 - uy * head * .8)}" stroke="${color}" stroke-width="${width}" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ''}/>${arrowHead(x2, y2, ux, uy, head, color)}</g>`;
}
const wrap = (w, h, body, defs = '') => `<svg class="fig" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>${body}</svg>`;

// ---------- function plot ----------
// fns: [{f, color, width, dash, from, to, label, lx, ly}]  fills: [{f, g?, from, to, colors:[c1,c2] | color, opacity}]
// rects: [{x0,x1,y,fill}]  vlines/hlines: [{x|y, color, dash}]  points: [{x,y,color,hollow,label}]  labels: [{x,y,tex,...}]
function plot({ w = 360, h = 240, x = [0, 1], y = [0, 1], pad = [34, 18, 18, 30], axes = true, arrows = true, origin = null,
  xlabel = 'x', ylabel = 'y', ticks = { x: [], y: [] }, grid = false, fns = [], fills = [], rects = [], vlines = [], hlines = [], points = [], labels = [], axisColor = '#1d1a17', font = 18 } = {}) {
  const [pl, pr, pt, pb] = pad, X = (v) => pl + (v - x[0]) / (x[1] - x[0]) * (w - pl - pr), Y = (v) => h - pb - (v - y[0]) / (y[1] - y[0]) * (h - pt - pb);
  const ox = origin ? origin[0] : Math.min(Math.max(0, x[0]), x[1]), oy = origin ? origin[1] : Math.min(Math.max(0, y[0]), y[1]);
  let defs = '', s = '';
  if (grid) { for (let gx = Math.ceil(x[0]); gx <= x[1]; gx++) s += `<line x1="${f1(X(gx))}" y1="${pt}" x2="${f1(X(gx))}" y2="${h - pb}" stroke="#000" opacity=".06"/>`; for (let gy = Math.ceil(y[0]); gy <= y[1]; gy++) s += `<line x1="${pl}" y1="${f1(Y(gy))}" x2="${w - pr}" y2="${f1(Y(gy))}" stroke="#000" opacity=".06"/>`; }
  for (const F of fills) {
    const a = F.from ?? x[0], b = F.to ?? x[1], N = 160, g = F.g || (() => oy);
    let d = ''; for (let i = 0; i <= N; i++) { const t = a + (b - a) * i / N; d += `${i ? 'L' : 'M'}${f1(X(t))} ${f1(Y(F.f(t)))}`; }
    for (let i = N; i >= 0; i--) { const t = a + (b - a) * i / N; d += `L${f1(X(t))} ${f1(Y(g(t)))}`; }
    let fill = F.color || '#f2b8a2';
    if (F.colors) { const id = uid('lg'); defs += `<linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="${F.colors[0]}"/><stop offset="1" stop-color="${F.colors[1]}"/></linearGradient>`; fill = `url(#${id})`; }
    s += `<path d="${d}Z" fill="${fill}" opacity="${F.opacity ?? .85}"/>`;
  }
  for (const r of rects) s += `<rect x="${f1(X(r.x0))}" y="${f1(Y(r.y))}" width="${f1(X(r.x1) - X(r.x0))}" height="${f1(Y(oy) - Y(r.y))}" fill="${r.fill || '#9aa0c8'}" stroke="${r.stroke || 'none'}" opacity="${r.opacity ?? 1}"/>`;
  for (const v of vlines) s += `<line x1="${f1(X(v.x))}" y1="${f1(Y(v.y0 ?? oy))}" x2="${f1(X(v.x))}" y2="${f1(Y(v.y1 ?? (v.f ? v.f(v.x) : y[1])))}" stroke="${v.color || '#1d1a17'}" stroke-width="${v.width || 1.4}" stroke-dasharray="${v.dash ?? '5 4'}"/>`;
  for (const v of hlines) s += `<line x1="${f1(X(v.x0 ?? x[0]))}" y1="${f1(Y(v.y))}" x2="${f1(X(v.x1 ?? x[1]))}" y2="${f1(Y(v.y))}" stroke="${v.color || '#1d1a17'}" stroke-width="${v.width || 1.4}" stroke-dasharray="${v.dash ?? '5 4'}"/>`;
  if (axes) {
    s += arrows ? arrow(X(x[0]) - 4, Y(oy), w - 4, Y(oy), { color: axisColor, width: 1.8, head: 9 }) + arrow(X(ox), h - pb + 8, X(ox), 4, { color: axisColor, width: 1.8, head: 9 })
      : `<line x1="${X(x[0])}" y1="${f1(Y(oy))}" x2="${w - pr}" y2="${f1(Y(oy))}" stroke="${axisColor}" stroke-width="1.6"/><line x1="${f1(X(ox))}" y1="${h - pb}" x2="${f1(X(ox))}" y2="${pt}" stroke="${axisColor}" stroke-width="1.6"/>`;
    if (xlabel) s += texSVG(w - 10, Y(oy) + 14, xlabel, { size: font, color: axisColor });
    if (ylabel) s += texSVG(X(ox) - 14, 12, ylabel, { size: font, color: axisColor });
    for (const t of ticks.x || []) { const [v, lab] = Array.isArray(t) ? t : [t, String(t)]; s += texSVG(X(v), Y(oy) + 16, lab, { size: font * .85 }); }
    for (const t of ticks.y || []) { const [v, lab] = Array.isArray(t) ? t : [t, String(t)]; s += texSVG(X(ox) - 8, Y(v), lab, { size: font * .85, anchor: 'end' }); }
  }
  for (const F of fns) {
    const a = F.from ?? x[0], b = F.to ?? x[1], N = F.n || 240; let d = '', pen = false;
    for (let i = 0; i <= N; i++) { const t = a + (b - a) * i / N, v = F.f(t); if (!isFinite(v) || v < y[0] - 3 * (y[1] - y[0]) || v > y[1] + 3 * (y[1] - y[0])) { pen = false; continue; } d += `${pen ? 'L' : 'M'}${f1(X(t))} ${f1(Y(v))}`; pen = true; }
    const cid = uid('cp'); defs += `<clipPath id="${cid}"><rect x="${pl - 2}" y="${pt - 6}" width="${w - pl - pr + 4}" height="${h - pt - pb + 8}"/></clipPath>`;
    s += `<path d="${d}" fill="none" stroke="${F.color || '#c8553a'}" stroke-width="${F.width || 3}" stroke-linecap="round" stroke-linejoin="round"${F.dash ? ` stroke-dasharray="${F.dash}"` : ''} clip-path="url(#${cid})"/>`;
    if (F.label) s += texSVG(X(F.lx), Y(F.ly), F.label, { color: F.labelColor || F.color || '#c8553a', size: font, anchor: F.anchor || 'middle' });
    if (F.arrowEnd) { const t1 = b - (b - a) / N * 3, x2 = X(b), y2 = Y(F.f(b)), dx = x2 - X(t1), dy = y2 - Y(F.f(t1)), L = Math.hypot(dx, dy); s += arrowHead(x2, y2, dx / L, dy / L, 11, F.color || '#c8553a'); }
  }
  for (const p of points) { s += `<circle cx="${f1(X(p.x))}" cy="${f1(Y(p.y))}" r="${p.r || 6}" fill="${p.hollow ? '#fff' : p.color || '#1d1a17'}" stroke="${p.color || '#1d1a17'}" stroke-width="${p.hollow ? 2.5 : 2}"/>`; if (p.label) s += texSVG(X(p.x) + (p.dx ?? 0), Y(p.y) + (p.dy ?? -16), p.label, { size: font, color: p.labelColor || p.color || '#1d1a17', anchor: p.anchor || 'middle' }); }
  for (const l of labels) s += texSVG(X(l.x), Y(l.y), l.tex, { size: l.size || font, color: l.color || '#1d1a17', anchor: l.anchor || 'middle', plain: l.plain });
  return wrap(w, h, s, defs);
}

// ---------- vector fields ----------
// arrows of F on a grid; scaleByMag: arrow length grows with |F|
function field({ w = 300, h = 240, F, x = [-2, 2], y = [-2, 2], n = [9, 7], len = 22, color = '#1d5a4b', scaleByMag = true, axes = false, opacity = 1, width = 1.8, head = 7 }) {
  const X = (v) => (v - x[0]) / (x[1] - x[0]) * w, Y = (v) => h - (v - y[0]) / (y[1] - y[0]) * h;
  let s = '', max = 0; const pts = [];
  for (let i = 0; i < n[0]; i++) for (let j = 0; j < n[1]; j++) { const px = x[0] + (x[1] - x[0]) * (i + .5) / n[0], py = y[0] + (y[1] - y[0]) * (j + .5) / n[1], [u, v] = F(px, py); const m = Math.hypot(u, v); max = Math.max(max, m); pts.push([px, py, u, v, m]); }
  if (axes) s += arrow(0, h / 2, w, h / 2, { width: 1.5, head: 8 }) + arrow(w / 2, h, w / 2, 0, { width: 1.5, head: 8 });
  for (const [px, py, u, v, m] of pts) { if (!m) continue; const L = len * (scaleByMag ? .35 + .65 * m / max : 1), cx = X(px), cy = Y(py), ux = u / m, uy = -v / m; s += arrow(cx - ux * L / 2, cy - uy * L / 2, cx + ux * L / 2, cy + uy * L / 2, { color, width, head, opacity }); }
  return wrap(w, h, s);
}
// shaded ball with arrows pointing out (source) or in (sink)
function radial({ w = 280, h = 260, n = 16, inward = false, color = '#1d5a4b', ball = '#7fae9c', r = 44, len = 70, rings = 1, width = 2.4 } = {}) {
  const cx = w / 2, cy = h / 2, id = uid('rg');
  let s = '';
  for (let k = 0; k < rings; k++) for (let i = 0; i < n; i++) {
    const t = 2 * Math.PI * (i + k * .5) / n, a = r + 10 + k * len * .9, b = a + len * (k ? .7 : 1);
    const [x1, y1, x2, y2] = inward ? [cx + b * Math.cos(t), cy + b * Math.sin(t), cx + a * Math.cos(t), cy + a * Math.sin(t)] : [cx + a * Math.cos(t), cy + a * Math.sin(t), cx + b * Math.cos(t), cy + b * Math.sin(t)];
    s += arrow(x1, y1, x2, y2, { color, width, head: 11 });
  }
  return wrap(w, h, s + sphere2d(cx, cy, r, ball, id), sphereGrad(id, ball));
}
// concentric rings of arrows (rotation / curl), optionally tilted into perspective
function swirl({ w = 300, h = 220, rings = 4, rmin = 20, rmax = 110, tilt = .45, per = 10, color = '#b8432c', width = 1.8, cw = false, axes = false, labels = true } = {}) {
  const cx = w / 2, cy = h / 2; let s = '';
  if (axes) s += arrow(cx - rmax * 1.15, cy, cx + rmax * 1.2, cy, { width: 1.5, head: 8 }) + arrow(cx, cy + rmax * tilt * 1.4, cx, cy - rmax * tilt * 1.6, { width: 1.5, head: 8 });
  for (let k = 0; k < rings; k++) {
    const r = rmin + (rmax - rmin) * k / Math.max(1, rings - 1), m = Math.round(per * (0.6 + k * .45));
    for (let i = 0; i < m; i++) {
      const t0 = 2 * Math.PI * i / m, t1 = t0 + 2 * Math.PI / m * .62, sg = cw ? -1 : 1;
      const p = (t) => [cx + r * Math.cos(sg * t), cy - r * tilt * Math.sin(sg * t)];
      const [x0, y0] = p(t0), [x1, y1] = p(t1), [xm, ym] = p((t0 + t1) / 2);
      const dx = x1 - xm, dy = y1 - ym, L = Math.hypot(dx, dy) || 1;
      s += `<path d="M${f1(x0)} ${f1(y0)} Q${f1(xm + (xm - (x0 + x1) / 2))} ${f1(ym + (ym - (y0 + y1) / 2))} ${f1(x1)} ${f1(y1)}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>` + arrowHead(x1, y1, dx / L, dy / L, 8, color);
    }
  }
  return wrap(w, h, s);
}
// level curves of f via marching squares
function contours({ w = 280, h = 240, f, x = [-2, 2], y = [-2, 2], levels = [], color = '#b8432c', width = 1.4, dash = null, n = 90, axes = false, extra = '' }) {
  const X = (v) => (v - x[0]) / (x[1] - x[0]) * w, Y = (v) => h - (v - y[0]) / (y[1] - y[0]) * h;
  const gx = (i) => x[0] + (x[1] - x[0]) * i / n, gy = (j) => y[0] + (y[1] - y[0]) * j / n;
  const V = []; for (let i = 0; i <= n; i++) { V.push([]); for (let j = 0; j <= n; j++) V[i].push(f(gx(i), gy(j))); }
  let s = axes ? arrow(0, Y(0), w, Y(0), { width: 1.5, head: 8 }) + arrow(X(0), h, X(0), 0, { width: 1.5, head: 8 }) : '';
  for (const c of levels) {
    let d = '';
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const v = [V[i][j], V[i + 1][j], V[i + 1][j + 1], V[i][j + 1]], P = [[gx(i), gy(j)], [gx(i + 1), gy(j)], [gx(i + 1), gy(j + 1)], [gx(i), gy(j + 1)]], hits = [];
      for (let e = 0; e < 4; e++) { const a = v[e] - c, b = v[(e + 1) % 4] - c; if ((a < 0) !== (b < 0)) { const t = a / (a - b), p = P[e], q = P[(e + 1) % 4]; hits.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); } }
      for (let k = 0; k + 1 < hits.length; k += 2) d += `M${f1(X(hits[k][0]))} ${f1(Y(hits[k][1]))}L${f1(X(hits[k + 1][0]))} ${f1(Y(hits[k + 1][1]))}`;
    }
    s += `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
  }
  return wrap(w, h, s + extra);
}

// ---------- neural network ----------
// layers: node counts; colors per layer; gap: insert "…" between layers [i, i+1]
function nnet({ w = 520, h = 280, layers = [4, 5, 3, 5, 2], colors = ['#3fd05a', '#3f6ef5', '#3f6ef5', '#3f6ef5', '#f0505a'], r = 16, gapAfter = null, edge = 'rgba(30,30,40,.55)', inputs = null, outputs = null, font = 17, fontFamily = null } = {}) {
  const L = layers.length, padX = inputs ? 90 : 30, padR = outputs ? 100 : 30, xs = layers.map((_, i) => padX + (w - padX - padR) * i / (L - 1)), pos = [];
  layers.forEach((n, i) => { pos.push([]); for (let k = 0; k < n; k++) pos[i].push([xs[i], h / 2 + (k - (n - 1) / 2) * Math.min(52, (h - 2 * r - 10) / Math.max(1, n - 1))]); });
  let s = '';
  for (let i = 0; i + 1 < L; i++) { if (gapAfter === i) continue; for (const a of pos[i]) for (const b of pos[i + 1]) s += `<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" stroke="${edge}" stroke-width="1"/>`; }
  if (gapAfter !== null) s += `<text x="${f1((xs[gapAfter] + xs[gapAfter + 1]) / 2)}" y="${h / 2 + 10}" text-anchor="middle" font-size="46" font-weight="700" fill="#1d1a17" font-family="Inter,sans-serif">…</text>`;
  pos.forEach((col, i) => col.forEach(([x, y]) => { const c = colors[i % colors.length], id = uid('ng'); s += `<defs>${sphereGrad(id, c)}</defs>` + sphere2d(x, y, r, c, id); }));
  const ff = fontFamily ? ` font-family="${fontFamily}"` : '';
  if (inputs) pos[0].forEach(([x, y], k) => { s += `<text x="${x - r - 34}" y="${y + 6}" text-anchor="end" font-size="${font}"${ff}>${inputs[k] ?? ''}</text>` + arrow(x - r - 30, y, x - r - 4, y, { width: 1.8, head: 8 }); });
  if (outputs) pos[L - 1].forEach(([x, y], k) => { s += arrow(x + r + 4, y, x + r + 30, y, { width: 1.8, head: 8 }) + `<text x="${x + r + 34}" y="${y + 6}" font-size="${font}"${ff}>${outputs[k] ?? ''}</text>`; });
  return wrap(w, h, s);
}

// ---------- shaded primitives & icons ----------
const shade = (hex, k) => { const c = hex.replace('#', '').match(/../g).map(v => parseInt(v, 16)); return '#' + c.map(v => Math.round(Math.max(0, Math.min(255, k > 0 ? v + (255 - v) * k : v * (1 + k)))).toString(16).padStart(2, '0')).join(''); };
const sphereGrad = (id, c) => `<radialGradient id="${id}" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="${shade(c, .7)}"/><stop offset=".55" stop-color="${c}"/><stop offset="1" stop-color="${shade(c, -.35)}"/></radialGradient>`;
const sphere2d = (cx, cy, r, c, id) => `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${r}" fill="url(#${id})"/>`;
function ball({ w = 120, h = 120, r = 46, color = '#d9876a', grid = false }) { const id = uid('bg'); let s = sphere2d(w / 2, h / 2, r, color, id); if (grid) s += `<ellipse cx="${w / 2}" cy="${h / 2}" rx="${r}" ry="${r * .28}" fill="none" stroke="${shade(color, -.45)}" stroke-width="1.4"/><ellipse cx="${w / 2}" cy="${h / 2}" rx="${r * .28}" ry="${r}" fill="none" stroke="${shade(color, -.45)}" stroke-width="1.4" stroke-dasharray="4 3"/>`; return wrap(w, h, s, sphereGrad(id, color)); }
function cube({ w = 130, h = 120, s: a = 62, color = '#d9876a', stroke = null, opacity = 1 } = {}) {
  const x = (w - a * 1.35) / 2, y = (h - a * 1.35) / 2 + a * .35, d = a * .35, st = stroke || shade(color, -.45);
  return wrap(w, h, `<g opacity="${opacity}" stroke="${st}" stroke-width="1.6" stroke-linejoin="round"><polygon points="${x},${y} ${x + a},${y} ${x + a},${y + a} ${x},${y + a}" fill="${color}"/><polygon points="${x},${y} ${x + d},${y - d} ${x + a + d},${y - d} ${x + a},${y}" fill="${shade(color, .3)}"/><polygon points="${x + a},${y} ${x + a + d},${y - d} ${x + a + d},${y + a - d} ${x + a},${y + a}" fill="${shade(color, -.18)}"/></g>`);
}
function cylinderIcon({ w = 110, h = 130, rx = 40, ry = 12, height = 86, color = '#5f8f84', axis = true } = {}) {
  const cx = w / 2, top = (h - height) / 2, id = uid('cy'), st = shade(color, -.4);
  return wrap(w, h, `<rect x="${cx - rx}" y="${top}" width="${2 * rx}" height="${height}" fill="url(#${id})"/><ellipse cx="${cx}" cy="${top + height}" rx="${rx}" ry="${ry}" fill="url(#${id})" stroke="${st}" stroke-width="1.6"/><rect x="${cx - rx}" y="${top}" width="${2 * rx}" height="${height}" fill="url(#${id})"/><line x1="${cx - rx}" y1="${top}" x2="${cx - rx}" y2="${top + height}" stroke="${st}" stroke-width="1.6"/><line x1="${cx + rx}" y1="${top}" x2="${cx + rx}" y2="${top + height}" stroke="${st}" stroke-width="1.6"/><path d="M${cx - rx} ${top + height} A${rx} ${ry} 0 0 0 ${cx + rx} ${top + height}" fill="none" stroke="${st}" stroke-width="1.6"/><ellipse cx="${cx}" cy="${top}" rx="${rx}" ry="${ry}" fill="${shade(color, .35)}" stroke="${st}" stroke-width="1.6"/>${axis ? `<line x1="${cx}" y1="${top - 6}" x2="${cx}" y2="${top + height + 6}" stroke="${st}" stroke-width="1.3" stroke-dasharray="4 3"/>` : ''}`,
    `<linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="${shade(color, -.15)}"/><stop offset=".4" stop-color="${shade(color, .25)}"/><stop offset="1" stop-color="${shade(color, -.3)}"/></linearGradient>`);
}
// tiny line-art icons for "unifying idea" strips
function icon(kind, { w = 110, h = 70, color = '#c8553a' } = {}) {
  const fill = shade(color, .55), st = color;
  const k = {
    segment: `<line x1="16" y1="${h / 2}" x2="${w - 16}" y2="${h / 2}" stroke="${st}" stroke-width="3"/><circle cx="16" cy="${h / 2}" r="5" fill="${st}"/><circle cx="${w - 16}" cy="${h / 2}" r="5" fill="${st}"/>`,
    area: `<polygon points="30,${h - 14} ${w - 8},${h - 14} ${w - 30},14 8,14" fill="${fill}" stroke="${st}" stroke-width="1.6" transform="translate(0,0)"/>`,
    volume: cube({ w, h, s: 40, color: fill, stroke: st }).replace(/^<svg[^>]*>|<\/svg>$/g, ''),
    surface: `<path d="M12 ${h - 18} Q${w * .3} 10 ${w * .55} 20 T${w - 10} 26 L${w - 22} ${h - 10} Q${w * .55} ${h - 18} ${w * .35} ${h - 14} Z" fill="${fill}" stroke="${st}" stroke-width="1.6"/>` + [0.25, 0.5, 0.75].map(t => `<path d="M${12 + (w - 34) * t} ${h - 16 + 4 * t} Q${w * .3 + 20 * t} ${20 + 10 * t} ${w * .55 + 30 * t} ${22}" fill="none" stroke="${st}" stroke-width=".8" opacity=".6"/>`).join(''),
    curve: `<path d="M10 ${h - 16} C${w * .3} ${h - 50} ${w * .5} ${h} ${w - 22} 16" fill="none" stroke="${st}" stroke-width="3" stroke-linecap="round"/>` + arrowHead(w - 16, 10, .55, -.83, 12, st),
  }[kind] || '';
  return wrap(w, h, k);
}

module.exports = { plot, field, radial, swirl, contours, nnet, ball, cube, cylinderIcon, icon, arrow, arrowHead, sphereGrad, sphere2d, shade, wrap, texSVG };
