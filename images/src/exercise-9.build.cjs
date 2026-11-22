#!/usr/bin/env node
// Builds the Exercise 9 (Chapter 7) poster: four parts, prose solutions, one diagram each.
// Usage: NODE_PATH=<dir with katex> node images/src/exercise-9.build.cjs <out.html>
const fs = require('fs');
const path = require('path');
const katex = require('katex');

const out = process.argv[2] || path.join(__dirname, 'exercise-9.html');
const tex = (s) => s
  .replace(/\\\[([\s\S]+?)\\\]/g, (_, m) => katex.renderToString(m, { displayMode: true, throwOnError: true }))
  .replace(/\\\(([\s\S]+?)\\\)([.,;:]?)/g, (_, m, p) => p
    ? `<span class="nb">${katex.renderToString(m, { throwOnError: true })}${p}</span>`
    : katex.renderToString(m, { throwOnError: true }));

const C = '#b8432c', T = '#1d5a4b', G = '#8b847c', PI = Math.PI;

function plot({ w = 640, h = 300, x0, x1, y0, y1, fns = [], pts = [], hl = [], vl = [], bands = [], xl = 'x', yl = 'y', ticks = {}, fx = v => v, fy = v => v }) {
  const pad = { l: 46, r: 22, t: 22, b: 40 };
  const X = (x) => pad.l + (x - x0) / (x1 - x0) * (w - pad.l - pad.r);
  const Y = (y) => h - pad.b - (y - y0) / (y1 - y0) * (h - pad.t - pad.b);
  const ax = Math.min(Math.max(0, x0), x1), ay = Math.min(Math.max(0, y0), y1);
  let s = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" class="plot">`;
  s += `<defs><marker id="pa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0L10 5L0 10z" fill="#1d1a17"/></marker></defs>`;
  for (const [a, b, c] of bands) s += `<rect x="${X(Math.max(a, x0))}" y="${pad.t - 10}" width="${X(Math.min(b, x1)) - X(Math.max(a, x0))}" height="${h - pad.t - pad.b + 10}" fill="${c}" opacity=".16"/>`;
  for (const gx of ticks.x || []) s += `<line x1="${X(gx)}" y1="${pad.t - 6}" x2="${X(gx)}" y2="${h - pad.b}" stroke="#000" opacity=".07"/>` +
    `<text x="${X(gx)}" y="${Y(ay) + 26}" text-anchor="middle" class="pt">${fx(gx)}</text>`;
  for (const gy of ticks.y || []) s += `<line x1="${pad.l}" y1="${Y(gy)}" x2="${w - pad.r}" y2="${Y(gy)}" stroke="#000" opacity=".07"/>` +
    `<text x="${X(ax) - 8}" y="${Y(gy) + 6}" text-anchor="end" class="pt">${fy(gy)}</text>`;
  s += `<line x1="${pad.l - 10}" y1="${Y(ay)}" x2="${w - 6}" y2="${Y(ay)}" stroke="#1d1a17" stroke-width="2" marker-end="url(#pa)"/>`;
  s += `<line x1="${X(ax)}" y1="${h - pad.b + 12}" x2="${X(ax)}" y2="6" stroke="#1d1a17" stroke-width="2" marker-end="url(#pa)"/>`;
  s += `<text x="${w - 14}" y="${Y(ay) - 10}" text-anchor="end" class="pl">${xl}</text><text x="${X(ax) + 10}" y="20" class="pl">${yl}</text>`;
  for (const l of vl) s += `<line x1="${X(l.x)}" y1="${pad.t}" x2="${X(l.x)}" y2="${h - pad.b}" stroke="${l.c}" stroke-width="1.5" stroke-dasharray="5 5"/>`;
  for (const l of hl) s += `<line x1="${pad.l}" y1="${Y(l.y)}" x2="${w - pad.r}" y2="${Y(l.y)}" stroke="${l.c}" stroke-width="2.5" stroke-dasharray="8 6"/>` +
    (l.label ? `<text x="${w - pad.r - 4}" y="${Y(l.y) + (l.below ? 26 : -10)}" text-anchor="end" class="pl" fill="${l.c}">${l.label}</text>` : '');
  fns.forEach((f, k) => {
    let d = '';
    const a = f.from ?? x0, b = f.to ?? x1, N = 600;
    for (let i = 0; i <= N; i++) { const x = a + (b - a) * i / N; d += `${i ? 'L' : 'M'}${X(x).toFixed(1)} ${Y(f.f(x)).toFixed(1)}`; }
    s += `<clipPath id="cp${k}"><rect x="${pad.l}" y="${pad.t - 10}" width="${w - pad.l - pad.r}" height="${h - pad.t - pad.b + 10}"/></clipPath>`;
    s += `<path d="${d}" fill="none" stroke="${f.c}" stroke-width="4" clip-path="url(#cp${k})" stroke-linecap="round"/>`;
    if (f.label) s += `<text x="${X(f.lx)}" y="${Y(f.ly)}" class="pl" fill="${f.c}" ${f.anchor ? `text-anchor="${f.anchor}"` : ''}>${f.label}</text>`;
  });
  for (const p of pts) {
    s += `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="8.5" fill="${p.c}" stroke="#fff" stroke-width="2.5"/>`;
    if (p.label) s += `<text x="${X(p.x) + (p.dx ?? 0)}" y="${Y(p.y) + (p.dy ?? -16)}" class="pl" fill="${p.c}" text-anchor="${p.anchor || 'middle'}">${p.label}</text>`;
  }
  return s + '</svg>';
}

// ---------- (1) ----------
const h1 = x => Math.sin(x + PI / 3) - Math.cos(2 * x + PI / 4);
const fam1 = [-25, -1, 23].map(n => n * PI / 36), fam2 = [-5 * PI / 12];
for (const r of [...fam1, ...fam2]) if (Math.abs(h1(r)) > 1e-9) throw new Error('part 1 root check failed');
const piLab = { '-3.14': '−π', '-1.57': '−π/2', '1.57': 'π/2', '3.14': 'π' };
const fig1 = plot({ x0: -PI - 0.15, x1: PI + 0.15, y0: -2.2, y1: 2.3, yl: 'y',
  ticks: { x: [-PI, PI / 2, PI] }, fx: v => piLab[v.toFixed(2)],
  fns: [{ f: h1, c: '#3b3733' }],
  pts: [...fam1.map((x, i) => ({ x, y: 0, c: C, label: ['−25π/36', '−π/36', '23π/36'][i], dy: i === 1 ? 30 : -16, dx: i === 1 ? 10 : 0, anchor: i === 1 ? 'start' : 'middle' })),
        ...fam2.map(x => ({ x, y: 0, c: T, label: '−5π/12', dy: 30 }))] });

// ---------- (2) ----------
const lo = k => (1 + 2 * k * PI) / 3, hi = k => (1 + PI + 2 * k * PI) / 3;
const fig2 = plot({ x0: -1.7, x1: 3.7, y0: -1.45, y1: 1.6, yl: 'y',
  bands: [-1, 0, 1].map(k => [lo(k), hi(k), T]),
  ticks: { x: [lo(0), hi(0)] }, fx: v => (Math.abs(v - lo(0)) < 1e-9 ? '1/3' : '(1+π)/3'),
  fns: [{ f: x => Math.sin(3 * x - 1), c: C, label: 'y = sin(3x − 1)', lx: 2.05, ly: 1.25 }] });

// ---------- (3) ----------
const fig3 = plot({ x0: 0, x1: 17.5, y0: 0, y1: 38, xl: 't', yl: 'y', ticks: { x: [1, 2, 4, 8, 16], y: [20] },
  bands: [[1, 16, '#9a948c']],
  fns: [{ f: t => 2 * t + 32 / t, from: 1, to: 16, c: C, label: 'y = 2t + 32/t', lx: 11.2, ly: 34.5, anchor: 'middle' }],
  hl: [{ y: 20, c: T, label: 'y = 20', below: true }],
  pts: [{ x: 2, y: 20, c: '#1d1a17', label: 't = 2', dx: 10, dy: -16, anchor: 'start' }, { x: 8, y: 20, c: '#1d1a17', label: 't = 8', dy: -16 }] });

// ---------- (4) ----------
const fig4 = (() => {
  const W = 640, H = 330, cx = 300, cy = 165, R = 120;
  const P = a => [cx + R * Math.cos(a), cy - R * Math.sin(a)];
  const angs = [[PI / 3, 'π/3', C], [2 * PI / 3, '2π/3', T], [-2 * PI / 3, '−2π/3', C], [-PI / 3, '−π/3', T]];
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="plot">
  <defs><marker id="pa4" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0L10 5L0 10z" fill="#1d1a17"/></marker></defs>
  <line x1="120" y1="${cy}" x2="480" y2="${cy}" stroke="#1d1a17" stroke-width="2" marker-end="url(#pa4)"/>
  <line x1="${cx}" y1="${H - 10}" x2="${cx}" y2="10" stroke="#1d1a17" stroke-width="2" marker-end="url(#pa4)"/>
  <circle cx="${cx}" cy="${cy}" r="${R}" fill="#fff" fill-opacity=".55" stroke="#5f9384" stroke-width="2" stroke-dasharray="6 6"/>`;
  // lines through the origin: the same tangent value repeats every π
  for (const [a, c] of [[PI / 3, C], [2 * PI / 3, T]]) {
    const [x1, y1] = P(a), [x2, y2] = P(a + PI);
    s += `<line x1="${x2}" y1="${y2}" x2="${x1}" y2="${y1}" stroke="${c}" stroke-width="3.5"/>`;
  }
  s += `<path d="M${cx + 38} ${cy}A38 38 0 0 0 ${P(PI / 3).map((v, i) => i ? cy - 38 * Math.sin(PI / 3) : cx + 38 * Math.cos(PI / 3)).join(' ')}" fill="none" stroke="#1d1a17" stroke-width="2"/>`;
  s += `<text x="${cx + 44}" y="${cy - 12}" class="pt">60°</text>`;
  for (const [a, lab, c] of angs) {
    const [x, y] = P(a), [lx, ly] = [cx + (R + 34) * Math.cos(a), cy - (R + 30) * Math.sin(a) + 8];
    s += `<circle cx="${x}" cy="${y}" r="9" fill="${c}" stroke="#fff" stroke-width="2.5"/><text x="${lx}" y="${ly}" text-anchor="middle" class="pl" fill="${c}">${lab}</text>`;
  }
  s += `<g transform="translate(486,70)"><rect width="146" height="190" rx="14" fill="#fff" opacity=".75"/>
    <text x="16" y="46" class="pl" fill="${C}">tan x = √3</text><text x="16" y="76" class="pc">x = π/3 + kπ</text>
    <line x1="16" y1="98" x2="130" y2="98" stroke="#9fc3b6" stroke-width="2"/>
    <text x="16" y="136" class="pl" fill="${T}">tan x = −√3</text><text x="16" y="166" class="pc">x = −π/3 + kπ</text></g>`;
  return s + '</svg>';
})();

// ---------- cards ----------
const part = ({ n, tone, title, statement, paras, result, fig, cap }) => `
<section class="card ${tone}">
  <div class="head"><span class="num">${n}</span><h2>${title}</h2></div>
  <div class="stmt">${statement}</div>
  <h3>Solution</h3>
  ${paras.map(p => `<p class="para">${p}</p>`).join('')}
  <div class="result">${result}</div>
  <figure>${fig}<figcaption>${cap}</figcaption></figure>
</section>`;

const R = String.raw;
const parts = [
  part({ n: 1, tone: 'coral', title: 'Sine equals sine',
    statement: R`\(\sin\!\left(x+\tfrac{\pi}{3}\right)-\cos\!\left(2x+\tfrac{\pi}{4}\right)=0\)`,
    paras: [
      R`Turn the cosine into a sine with \(\cos\theta=\sin\!\left(\tfrac\pi2-\theta\right)\): \(\cos\!\left(2x+\tfrac\pi4\right)=\sin\!\left(\tfrac\pi4-2x\right)\), so the equation reads \(\sin\!\left(x+\tfrac\pi3\right)=\sin\!\left(\tfrac\pi4-2x\right)\).`,
      R`Two sines are equal when \(A=B+2k\pi\) or \(A=\pi-B+2k\pi\). The first family gives \(x+\tfrac\pi3=\tfrac\pi4-2x+2k\pi\), so \(3x=-\tfrac{\pi}{12}+2k\pi\) and \(x=-\tfrac{\pi}{36}+\tfrac{2k\pi}{3}\).`,
      R`The second family gives \(x+\tfrac\pi3=\tfrac{3\pi}4+2x+2k\pi\), so \(x=-\tfrac{5\pi}{12}-2k\pi\), which is the same set as \(x=-\tfrac{5\pi}{12}+2k\pi\ (k\in\mathbb Z)\).`,
    ],
    result: R`\(x=-\dfrac{\pi}{36}+\dfrac{2k\pi}{3}\ \text{ or }\ x=-\dfrac{5\pi}{12}+2k\pi,\ k\in\mathbb Z\)`,
    fig: fig1, cap: 'y = sin(x+π/3) − cos(2x+π/4) on [−π, π]: coral dots are the first family, the teal dot is the second.' }),
  part({ n: 2, tone: 'teal', title: 'A sine inequality',
    statement: R`\(\sin(3x-1)>0\)`,
    paras: [
      R`The sine is positive exactly on the upper half of each turn: \(\sin\theta>0\iff\theta\in\,]2k\pi,\ \pi+2k\pi[\). With \(\theta=3x-1\) this means \(2k\pi<3x-1<\pi+2k\pi\).`,
      R`Adding 1 and dividing by \(3>0\) keeps the direction of the inequalities, so \(\dfrac{1+2k\pi}{3}<x<\dfrac{1+\pi+2k\pi}{3}\). The solution is a union of open intervals of length \(\tfrac\pi3\), repeating every \(\tfrac{2\pi}{3}\).`,
    ],
    result: R`\(x\in\displaystyle\bigcup_{k\in\mathbb Z}\left]\frac{1+2k\pi}{3},\ \frac{1+\pi+2k\pi}{3}\right[\)`,
    fig: fig2, cap: 'Shaded bands: where sin(3x − 1) > 0. The band for k = 0 runs from 1/3 to (1+π)/3.' }),
  part({ n: 3, tone: 'teal', title: 'Powers of 2',
    statement: R`\(2^{4\cos^2x+1}+16\cdot2^{4\sin^2x-3}=20\)`,
    paras: [
      R`Replace \(\sin^2x=1-\cos^2x\): \(16\cdot2^{4\sin^2x-3}=2^4\cdot2^{4-4\cos^2x-3}=2^{5-4\cos^2x}\). Put \(t=2^{4\cos^2x}\in[1,16]\); then \(2^{4\cos^2x+1}=2t\) and \(2^{5-4\cos^2x}=\tfrac{32}{t}\).`,
      R`The equation becomes \(2t+\tfrac{32}{t}=20\iff t^2-10t+16=0\iff t=2\) or \(t=8\), both inside \([1,16]\).`,
      R`For \(t=2\): \(4\cos^2x=1\), so \(\cos2x=2\cos^2x-1=-\tfrac12\), \(2x=\pm\tfrac{2\pi}3+2k\pi\) and \(x=\pm\tfrac\pi3+k\pi\). For \(t=8\): \(4\cos^2x=3\), so \(\cos2x=\tfrac12\) and \(x=\pm\tfrac\pi6+k\pi\).`,
    ],
    result: R`\(x=\pm\dfrac{\pi}{3}+k\pi\ \text{ or }\ x=\pm\dfrac{\pi}{6}+k\pi,\ k\in\mathbb Z\)`,
    fig: fig3, cap: 'On the allowed range t ∈ [1, 16] (shaded), 2t + 32/t equals 20 at t = 2 and t = 8.' }),
  part({ n: 4, tone: 'coral', title: 'A tangent equation',
    statement: R`\(\dfrac{\tan x}{\tan 2x}+\dfrac{\tan 2x}{\tan x}+2=0\)`,
    paras: [
      R`We need \(\tan x\) and \(\tan2x\) defined and nonzero. Put \(a=\dfrac{\tan x}{\tan2x}\neq0\): \(a+\tfrac1a+2=0\iff\dfrac{a^2+2a+1}{a}=0\), that is \((a+1)^2=0\), so \(a=-1\).`,
      R`So \(\tan2x=-\tan x\). With \(\tan2x=\dfrac{2T}{1-T^2}\) and \(T=\tan x\neq0\): \(\dfrac{2T}{1-T^2}=-T\iff2=-(1-T^2)\iff T^2=3\).`,
      R`Hence \(\tan x=\pm\sqrt3\) and \(x=\pm\tfrac\pi3+k\pi\); at these points \(\tan2x=\mp\sqrt3\) is defined and nonzero, so they all satisfy the domain conditions.`,
    ],
    result: R`\(x=\pm\dfrac{\pi}{3}+k\pi,\ k\in\mathbb Z\)`,
    fig: fig4, cap: 'tan x = ±√3 at four points per turn; each line through 0 is one family repeating every π.' }),
];

const kdir = path.dirname(require.resolve('katex/package.json'));
let kcss = fs.readFileSync(path.join(kdir, 'dist/katex.min.css'), 'utf8');
kcss = kcss.replace(/src:url\(fonts\/([^)]+?)\.woff2\)[^;}]*/g, (_, f) =>
  `src:url(data:font/woff2;base64,${fs.readFileSync(path.join(kdir, 'dist/fonts', f + '.woff2')).toString('base64')}) format("woff2")`);

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${kcss}
:root{--page:#f7f3ee;--ink:#1d1a17;--muted:#3b3733;--coral:#b8432c;--coral-bg:#fbebe6;--coral-box:#f6d6cd;--coral-line:#e2a596;
--teal:#1d5a4b;--teal-bg:#e7f0ec;--teal-box:#d2e5dd;--teal-line:#9fc3b6}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1600px;background:var(--page);color:var(--ink);font-family:Inter,'Liberation Sans',sans-serif}
.wrap{padding:44px 50px 36px}
h1{font-family:'Inter Display',Inter,sans-serif;font-weight:900;font-size:96px;letter-spacing:-3px;text-align:center;line-height:1.02}
.sub{text-align:center;font-size:36px;line-height:1.3;margin:20px auto 0;width:1300px;color:#1f1c19}
.center{text-align:center}
.chip{display:inline-block;margin-top:18px;font-size:22px;font-weight:600;letter-spacing:.5px;color:#fff;background:var(--ink);border-radius:999px;padding:6px 18px}
.chip .s{color:#f0b14a;letter-spacing:2px}
.grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:30px;margin-top:34px}
.card{border-radius:22px;padding:28px 34px 24px;display:flex;flex-direction:column}
.coral{background:var(--coral-bg);border:2px solid var(--coral-line)} .teal{background:var(--teal-bg);border:2px solid var(--teal-line)}
.head{display:flex;align-items:center;gap:18px}
.num{flex:0 0 64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-family:'Inter Display',Inter,sans-serif;font-weight:800;font-size:36px}
.coral .num{background:var(--coral)} .teal .num{background:var(--teal)}
.head h2{font-family:'Inter Display',Inter,sans-serif;font-size:46px;font-weight:800;letter-spacing:-1px;line-height:1.05}
.coral h2,.coral h3{color:var(--coral)} .teal h2,.teal h3{color:var(--teal)}
.stmt{margin-top:18px;border-radius:14px;padding:18px 16px;text-align:center;font-size:34px}
.coral .stmt{background:var(--coral-box)} .teal .stmt{background:var(--teal-box)}
h3{font-size:28px;font-weight:700;margin:20px 0 2px}
.para{font-size:23px;line-height:1.6;color:var(--muted);margin-top:10px}
.para .katex{font-size:1.1em;color:var(--ink)}
.result{display:table;margin:22px auto 4px;font-size:27px;padding:12px 24px;border-radius:12px;background:#fff;border:3px solid currentColor}
.coral .result{color:var(--coral)} .teal .result{color:var(--teal)}
.result .katex{color:var(--ink);white-space:nowrap}
.nb{white-space:nowrap}
figure{margin-top:auto;padding-top:22px;text-align:center}
figure svg{display:block;margin:0 auto;background:rgba(255,255,255,.55);border-radius:14px}
figcaption{font-size:20px;color:#5f5952;margin-top:10px;font-style:italic}
.pt{font-family:'Liberation Serif',serif;font-size:21px;fill:#4a453f;paint-order:stroke;stroke:#fbf8f5;stroke-width:5px}
.pl{font-family:'Liberation Serif',serif;font-style:italic;font-size:23px;fill:var(--ink);paint-order:stroke;stroke:#fbf8f5;stroke-width:6px;stroke-linejoin:round}
.pc{font-family:'Liberation Serif',serif;font-size:21px;fill:#4a453f}
.author{margin-top:40px;text-align:center;font-family:'Inter Display',Inter,sans-serif;font-size:50px;font-weight:800;color:#000;letter-spacing:1px}
.author:before,.author:after{content:"";display:inline-block;width:220px;height:3px;background:#000;vertical-align:middle;margin:0 28px}
</style></head><body><div class="wrap">
<h1>Trigonometric Equations</h1>
<div class="sub"><b>Exercise 9</b>: four problems solved with <b>sine families</b>, <b>intervals</b>, a <b>substitution</b> and the <b>double-angle</b> formula for tangent.</div>
<div class="center"><span class="chip">CHAPTER 7 · EXERCISE 9 <span class="s">★★★</span></span></div>
<div class="grid">${parts.join('')}</div>
<div class="author">Muth Boravy</div>
</div></body></html>`;

fs.writeFileSync(out, tex(html));
console.log(out);
