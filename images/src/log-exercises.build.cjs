#!/usr/bin/env node
// Builds images/src/log-exercises.html (Chapter 7, Exercises 3–7, with solutions).
// Math is typeset with KaTeX and its fonts are inlined so the page renders offline.
// Usage: NODE_PATH=<dir with katex> node images/src/log-exercises.build.cjs <out.html>
const fs = require('fs');
const path = require('path');
const katex = require('katex');

const out = process.argv[2] || path.join(__dirname, 'log-exercises.html');

// ---------- math: \( … \) inline, \[ … \] display ----------
const tex = (s) => s
  .replace(/\\\[([\s\S]+?)\\\]/g, (_, m) => katex.renderToString(m, { displayMode: true, throwOnError: true }))
  .replace(/\\\(([\s\S]+?)\\\)/g, (_, m) => katex.renderToString(m, { throwOnError: true }));

// ---------- small function plots ----------
function plot({ w = 640, h = 300, x0, x1, y0, y1, fns = [], pts = [], hl = [], vl = [], xl = 'x', yl = 'y', shade, ticks = {}, fx = v => v, fy = v => v, yTickLeft = false }) {
  const pad = { l: 46, r: 22, t: 22, b: 40 };
  const X = (x) => pad.l + (x - x0) / (x1 - x0) * (w - pad.l - pad.r);
  const Y = (y) => h - pad.b - (y - y0) / (y1 - y0) * (h - pad.t - pad.b);
  const ax = Math.min(Math.max(0, x0), x1), ay = Math.min(Math.max(0, y0), y1);
  let s = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" class="plot">`;
  s += `<defs><marker id="pa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0L10 5L0 10z" fill="#1d1a17"/></marker></defs>`;
  if (shade) s += `<rect x="${X(shade[0])}" y="${pad.t - 10}" width="${X(shade[1]) - X(shade[0])}" height="${h - pad.t - pad.b + 10}" fill="#9a948c" opacity=".13"/>` +
    `<text x="${(X(shade[0]) + X(shade[1])) / 2}" y="${pad.t + 14}" text-anchor="middle" class="pc">${shade[2]}</text>`;
  // grid
  for (const gx of ticks.x || []) s += `<line x1="${X(gx)}" y1="${pad.t - 6}" x2="${X(gx)}" y2="${h - pad.b}" stroke="#000" opacity=".06"/>` +
    `<text x="${X(gx)}" y="${Y(ay) + 24}" text-anchor="middle" class="pt">${fx(gx)}</text>`;
  for (const gy of ticks.y || []) s += `<line x1="${pad.l}" y1="${Y(gy)}" x2="${w - pad.r}" y2="${Y(gy)}" stroke="#000" opacity=".06"/>` +
    `<text x="${yTickLeft ? pad.l - 4 : X(ax) - 8}" y="${Y(gy) + 6}" text-anchor="end" class="pt">${fy(gy)}</text>`;
  s += `<line x1="${pad.l - 10}" y1="${Y(ay)}" x2="${w - 6}" y2="${Y(ay)}" stroke="#1d1a17" stroke-width="2" marker-end="url(#pa)"/>`;
  s += `<line x1="${X(ax)}" y1="${h - pad.b + 12}" x2="${X(ax)}" y2="6" stroke="#1d1a17" stroke-width="2" marker-end="url(#pa)"/>`;
  s += `<text x="${w - 14}" y="${Y(ay) - 10}" text-anchor="end" class="pl">${xl}</text><text x="${X(ax) + 10}" y="20" class="pl">${yl}</text>`;
  for (const l of hl) s += `<line x1="${pad.l}" y1="${Y(l.y)}" x2="${w - pad.r}" y2="${Y(l.y)}" stroke="${l.c}" stroke-width="2.5" stroke-dasharray="8 6"/>` +
    (l.label ? `<text x="${w - pad.r - 4}" y="${Y(l.y) + (l.below ? 26 : -10)}" text-anchor="end" class="pl" fill="${l.c}">${l.label}</text>` : '');
  for (const l of vl) s += `<line x1="${X(l.x)}" y1="${pad.t}" x2="${X(l.x)}" y2="${h - pad.b}" stroke="${l.c}" stroke-width="1.5" stroke-dasharray="5 5"/>`;
  for (const f of fns) {
    let d = '', pen = false;
    const a = f.from ?? x0, b = f.to ?? x1, N = 400;
    for (let i = 0; i <= N; i++) {
      const x = a + (b - a) * i / N, y = f.f(x);
      if (!isFinite(y) || y < y0 - (y1 - y0) || y > y1 + (y1 - y0)) { pen = false; continue; }
      d += `${pen ? 'L' : 'M'}${X(x).toFixed(1)} ${Y(Math.min(Math.max(y, y0 - 2), y1 + 2)).toFixed(1)}`; pen = true;
    }
    s += `<clipPath id="c${f.id}"><rect x="${pad.l}" y="${pad.t - 10}" width="${w - pad.l - pad.r}" height="${h - pad.t - pad.b + 10}"/></clipPath>`;
    s += `<path d="${d}" fill="none" stroke="${f.c}" stroke-width="${f.sw || 4}" ${f.dash ? `stroke-dasharray="${f.dash}"` : ''} clip-path="url(#c${f.id})" stroke-linecap="round"/>`;
    if (f.label) s += `<text x="${X(f.lx)}" y="${Y(f.ly)}" class="pl" fill="${f.c}" ${f.anchor ? `text-anchor="${f.anchor}"` : ''}>${f.label}</text>`;
  }
  for (const p of pts) {
    s += p.x_ ? `<g stroke="${p.c}" stroke-width="4" stroke-linecap="round"><line x1="${X(p.x) - 9}" y1="${Y(p.y) - 9}" x2="${X(p.x) + 9}" y2="${Y(p.y) + 9}"/><line x1="${X(p.x) - 9}" y1="${Y(p.y) + 9}" x2="${X(p.x) + 9}" y2="${Y(p.y) - 9}"/></g>`
      : `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="9" fill="${p.hollow ? '#fff' : p.c}" stroke="${p.c}" stroke-width="3"/>`;
    if (p.label) s += `<text x="${X(p.x) + (p.dx ?? 14)}" y="${Y(p.y) + (p.dy ?? -14)}" class="pl" fill="${p.c}" ${p.anchor ? `text-anchor="${p.anchor}"` : ''}>${p.label}</text>`;
  }
  return s + '</svg>';
}

const C = '#b8432c', T = '#1d5a4b', G = '#8b847c';
const L = Math.log;

const plot3 = (() => {
  // number line: (√2+1) + (√2−1) = 2√2
  const a = Math.SQRT2 + 1, b = Math.SQRT2 - 1, W = 640, s = 175, o = 60;
  const X = (x) => o + x * s;
  return `<svg viewBox="0 0 ${W} 210" width="${W}" height="210" class="plot">
  <defs><marker id="pa3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0L10 5L0 10z" fill="#1d1a17"/></marker></defs>
  <line x1="40" y1="150" x2="${W - 10}" y2="150" stroke="#1d1a17" stroke-width="2" marker-end="url(#pa3)"/>
  ${[0, 1, 2, 3].map(t => `<line x1="${X(t)}" y1="143" x2="${X(t)}" y2="157" stroke="#1d1a17" stroke-width="2"/><text x="${X(t)}" y="184" text-anchor="middle" class="pt">${t}</text>`).join('')}
  <rect x="${X(0)}" y="96" width="${a * s}" height="34" rx="6" fill="${C}" opacity=".88"/>
  <rect x="${X(a)}" y="96" width="${b * s}" height="34" rx="6" fill="${T}" opacity=".9"/>
  <text x="${X(a / 2)}" y="120" text-anchor="middle" class="pw">√(3+2√2) = √2 + 1 ≈ 2.414</text>
  <text x="${X(a + b / 2)}" y="84" text-anchor="middle" class="pl" fill="${T}">√2 − 1</text>
  <path d="M${X(0)} 60 V50 H${X(a + b)} V60" fill="none" stroke="#1d1a17" stroke-width="2"/>
  <text x="${X((a + b) / 2)}" y="38" text-anchor="middle" class="pl">x = 2√2 = 2<tspan dy="-10" font-size="17">3/2</tspan><tspan dy="10"> ≈ 2.828</tspan></text>
  <circle cx="${X(a + b)}" cy="150" r="8" fill="${C}"/>
</svg>`;
})();

const p = Math.log(4) / Math.log(3); // log_3 4
const plot4 = plot({ x0: 0, x1: 16, y0: 0, y1: 34, xl: 'x', yl: 'y', ticks: { x: [3, 9, 15], y: [16, 32] },
  fns: [{ id: 41, f: x => Math.pow(x, p), c: C, label: 'y = 4^{log₃x}', lx: 11.3, ly: 29, anchor: 'end' },
        { id: 42, f: x => 32 - Math.pow(x, p), c: T, label: 'y = 32 − x^{log₃4}', lx: 1.2, ly: 21 }],
  pts: [{ x: 9, y: 16, c: '#1d1a17', label: '(9, 16)', dx: 18, dy: 8 }], vl: [{ x: 9, c: G }] })
  .replace(/\^\{log₃x\}/, '<tspan dy="-10" font-size="17">log₃x</tspan>').replace(/\^\{log₃4\}/, '<tspan dy="-10" font-size="17">log₃4</tspan>');

const plot5 = plot({ x0: 0, x1: 10, y0: -2.2, y1: 0.6, xl: 'x', yl: 'y', ticks: { x: [1, 4, 8] , y: [-1, -2] },
  fns: [{ id: 51, f: x => -L(2) / L(x), from: 1.02, to: 10, c: T, label: 'y = log_x(½)', lx: 6.6, ly: -1.45, anchor: 'middle' }],
  hl: [{ y: -0.5, c: C, label: 'y = −½', below: true }], vl: [{ x: 1, c: G }],
  pts: [{ x: 4, y: -0.5, c: '#1d1a17', label: '(4, −½)', dx: 14, dy: 30 }] })
  .replace('log_x(½)', 'log<tspan dy="8" font-size="17">x</tspan><tspan dy="-8">(½)</tspan>');

const plot6 = plot({ x0: -2.5, x1: 2.2, y0: -0.5, y1: 9, xl: 'x', yl: 'y', ticks: { x: [-2, -1, 1, 2], y: [6] },
  fns: [{ id: 61, f: x => Math.pow(2, x) * (Math.pow(2, x) + 1), c: C, label: 'y = 2<tspan dy="-10" font-size="17">x</tspan><tspan dy="10">(2</tspan><tspan dy="-10" font-size="17">x</tspan><tspan dy="10"> + 1)</tspan>', lx: -2.3, ly: 2.2 }],
  hl: [{ y: 6, c: T, label: 'y = 6' }], pts: [{ x: 1, y: 6, c: '#1d1a17', label: '(1, 6)', dx: -16, dy: -16, anchor: 'end' }] });

const pow2 = v => { const m = { '-3': '⅛', '-2': '¼', '-1': '½' }; return m[v] ?? String(2 ** v); };
const plot8 = plot({ w: 560, h: 470, yTickLeft: true, x0: -3.5, x1: 4.6, y0: -0.6, y1: 7.2, xl: 'x', yl: 'y', fx: pow2, fy: pow2,
  ticks: { x: [-2, 1, 3], y: [1, 4, 6] },
  fns: [{ id: 81, f: X => 4 - X, c: T, label: 'xy = 16', lx: 1.1, ly: 3.7 },
        { id: 82, f: X => X / 3, c: C, label: 'x = y³', lx: 4.55, ly: 2.1, anchor: 'end' },
        { id: 83, f: X => -3 * X, c: C, dash: '10 7', label: 'x = y<tspan dy="-10" font-size="17">−1/3</tspan>', lx: -1.85, ly: 4.6, anchor: 'end' }],
  pts: [{ x: 3, y: 1, c: '#1d1a17', label: '(8, 2)', dx: 0, dy: -22, anchor: 'middle' }, { x: -2, y: 6, c: '#1d1a17', label: '(¼, 64)', dx: 16, dy: 2 }] });

const plot7 = plot({ w: 560, h: 420, x0: -3, x1: 3.2, y0: -20, y1: 15, xl: 'u', yl: 'g(u) = 4u² − u − 18', ticks: { x: [1, 2], y: [10] },
  shade: [-3, 0, 'u ≤ 0: impossible'],
  fns: [{ id: 71, f: u => 4 * u * u - u - 18, c: T }],
  pts: [{ x: -2, y: 0, c: C, x_: true, label: 'u = −2 ✗', dx: -12, dy: 32, anchor: 'end' },
        { x: 2.25, y: 0, c: C, label: 'u = 9/4 ✓', dx: -10, dy: -18, anchor: 'end' }] });

// ---------- content ----------
const step = (n, rule, body) => `<div class="step"><span class="sn">Step ${n}</span> <span class="rule">[${rule}]</span> ${body}</div>`;
const card = ({ n, stars, tone, tag, statement, steps, why, result, check, fig, cap, wide }) => `
<section class="card ${tone}${wide ? ' wide' : ''}">
  <div class="head"><h2>Exercise ${n}</h2><span class="stars">${'★'.repeat(stars)}</span><span class="tag">${tag}</span></div>
  <div class="stmt">${statement}</div>
  <div class="body">
    <div class="sol">
      <h3>Solution</h3>
      ${steps.map((s, i) => step(i + 1, s[0], s[1])).join('')}
      ${why ? `<div class="why"><b>Why?</b> ${why}</div>` : ''}
      <div class="result">${result}</div>
      <div class="check"><b>Check ✓</b> ${check}</div>
    </div>
    <figure>${fig}<figcaption>${cap}</figcaption></figure>
  </div>
</section>`;

const cards = [
  card({ n: 3, stars: 2, tone: 'coral', tag: 'Find a value',
    statement: String.raw`Find the value of \(4\log_2 x\) where \[x=\sqrt{3+2\sqrt2}+\sqrt{3-2\sqrt2}.\]`,
    why: String.raw`A nested root \(\sqrt{p\pm2\sqrt q}\) opens up when \(p=a+b\) and \(q=ab\): here \(3=2+1,\ 2=2\cdot1\), so \(\sqrt{3\pm2\sqrt2}=\sqrt2\pm1\).`,
    steps: [
      [String.raw`recognise squares: \((a\pm b)^2=a^2\pm2ab+b^2\) with \(a=\sqrt2,\ b=1\)`, String.raw`\(3+2\sqrt2=(\sqrt2+1)^2,\quad 3-2\sqrt2=(\sqrt2-1)^2\).`],
      [String.raw`\(\sqrt{u^2}=|u|\); both \(\sqrt2+1\) and \(\sqrt2-1\) are positive`, String.raw`\(x=(\sqrt2+1)+(\sqrt2-1)=2\sqrt2=2^{3/2}\).`],
      [String.raw`Def. 9: \(\log_2 2^r=\frac{r\ln2}{\ln2}=r\)`, String.raw`\(\log_2 x=\tfrac32,\quad 4\log_2x=6\).`],
    ],
    result: String.raw`\(4\log_2 x = 6\)`,
    check: String.raw`other method: \(x^2=(3+2\sqrt2)+(3-2\sqrt2)+2\sqrt{9-8}=8\), so \(x=2\sqrt2\).`,
    fig: plot3, cap: 'The two square roots add up to 2√2 = 2<sup>3/2</sup>.' }),
  card({ n: 4, stars: 3, tone: 'teal', tag: 'Exponential equation',
    statement: String.raw`Solve the equation \(4^{\log_3 x}=32-x^{\log_3 4}\).`,
    steps: [
      ['domain', String.raw`\(x>0\) (needed for \(\log_3x\) and \(x^{\log_3 4}\)).`],
      ['key identity: write both powers with e (Def. 11, 12)', String.raw`\(x^{\log_3 4}=e^{\log_3 4\cdot\ln x}=e^{\frac{\ln4\,\ln x}{\ln3}}\) and \(4^{\log_3 x}=e^{\log_3x\cdot\ln4}=e^{\frac{\ln x\,\ln 4}{\ln3}}\): they are equal.`],
      ['substitute', String.raw`\(4^{\log_3x}=32-4^{\log_3x}\iff 2\cdot4^{\log_3x}=32\iff 4^{\log_3x}=16=4^2\).`],
      [String.raw`\(4^t\) is injective`, String.raw`\(\log_3x=2\iff x=3^2=9\).`],
    ],
    why: String.raw`The identity \(a^{\log_b c}=c^{\log_b a}\) (here \(a=4,\ b=3,\ c=x\)) is the whole trick: both sides equal \(e^{\ln a\ln c/\ln b}\).`,
    result: String.raw`\(x=9\)`,
    check: String.raw`\(4^{\log_3 9}=4^2=16;\ \ 9^{\log_3 4}=(3^{\log_3 4})^2=4^2=16;\ \ 32-16=16\).`,
    fig: plot4, cap: 'Both sides of the equation meet at x = 9.' }),
  card({ n: 5, stars: 2, tone: 'teal', tag: 'Logarithmic equation',
    statement: String.raw`Solve the equation \(\log_x\!\big(\log_{18}(\sqrt2+\sqrt8)\big)=-\tfrac12\).`,
    steps: [
      [String.raw`simplify the inside: \(\sqrt8=2\sqrt2\)`, String.raw`\(\sqrt2+\sqrt8=3\sqrt2=\sqrt{18}=18^{1/2}\).`],
      ['Def. 9', String.raw`\(\log_{18}18^{1/2}=\tfrac12\).`],
      [String.raw`the equation becomes; domain \(x>0,\ x\neq1\)`, String.raw`\(\log_x\tfrac12=-\tfrac12\iff\dfrac{\ln\frac12}{\ln x}=-\dfrac12\iff\dfrac{-\ln2}{\ln x}=-\dfrac12\iff\ln x=2\ln2=\ln4\).`],
    ],
    result: String.raw`\(x=4\)`,
    check: String.raw`\(\log_4\tfrac12=\dfrac{-\ln2}{2\ln2}=-\tfrac12\).`,
    fig: plot5, cap: 'The curve y = log<sub>x</sub>(½) reaches −½ exactly at x = 4.' }),
  card({ n: 6, stars: 2, tone: 'coral', tag: 'Mixed equation',
    statement: String.raw`Solve the equation \(x+\log_{10}(2^x+1)=\log_{10}6+x\log_{10}5\).`,
    steps: [
      [String.raw`group the terms in \(x\); \(x=x\log_{10}10\)`, String.raw`\(x\log_{10}10-x\log_{10}5=x\log_{10}\tfrac{10}{5}=x\log_{10}2=\log_{10}2^x\).`],
      ['move terms; Th. 1.1', String.raw`\(\log_{10}2^x+\log_{10}(2^x+1)=\log_{10}6\iff\log_{10}\big(2^x(2^x+1)\big)=\log_{10}6\).`],
      [String.raw`\(\log_{10}\) is injective; put \(t=2^x>0\)`, String.raw`\(t(t+1)=6\iff t^2+t-6=0\iff(t+3)(t-2)=0\).`],
      [String.raw`\(t>0\)`, String.raw`\(t=2\), so \(2^x=2,\ x=1\).`],
    ],
    result: String.raw`\(x=1\)`,
    check: String.raw`left: \(1+\log_{10}3=\log_{10}30\); right: \(\log_{10}6+\log_{10}5=\log_{10}30\).`,
    fig: plot6, cap: 'y = 2<sup>x</sup>(2<sup>x</sup>+1) is increasing, so it hits 6 only once: x = 1.' }),
  card({ n: 7, stars: 3, tone: 'coral', tag: 'Substitution', wide: true,
    statement: String.raw`Solve the equation \(4^{1+\log_{10}x}-6^{\log_{10}x}-2\cdot3^{2+\log_{10}x^2}=0\).`,
    steps: [
      [String.raw`domain \(x>0\); put \(t=\log_{10}x\) (any real); \(\log_{10}x^2=2t\)`, String.raw`\(4\cdot4^t-6^t-2\cdot9\cdot9^t=0,\)&nbsp;i.e.&nbsp;\(4\cdot4^t-6^t-18\cdot9^t=0\).`],
      [String.raw`divide by \(9^t>0\); \(\frac{4^t}{9^t}=\left(\tfrac23\right)^{2t},\ \frac{6^t}{9^t}=\left(\tfrac23\right)^{t}\)`, String.raw`with \(u=\left(\tfrac23\right)^t>0\): \(\ 4u^2-u-18=0\).`],
      ['quadratic formula', String.raw`\(u=\dfrac{1\pm\sqrt{1+288}}{8}=\dfrac{1\pm17}{8}\): \(\ u=\dfrac94\) or \(u=-2\) (rejected, \(u>0\)).`],
      [String.raw`\(\frac94=\left(\tfrac32\right)^2=\left(\tfrac23\right)^{-2}\)`, String.raw`\(\left(\tfrac23\right)^t=\left(\tfrac23\right)^{-2}\iff t=-2\iff\log_{10}x=-2\iff x=10^{-2}\).`],
    ],
    result: String.raw`\(x=\dfrac{1}{100}\)`,
    check: String.raw`\(t=-2:\ 4\cdot4^{-2}-6^{-2}-18\cdot9^{-2}=\tfrac14-\tfrac1{36}-\tfrac{18}{81}=\tfrac{81-9-72}{324}=0\).`,
    fig: plot7, cap: 'Only the positive root u = 9/4 is allowed, because u = (2/3)<sup>t</sup> > 0.' }),
  card({ n: 8, stars: 3, tone: 'teal', tag: 'System of equations', wide: true,
    statement: String.raw`Solve the system \(\ \log_y x-\log_x y=\dfrac83,\quad xy=16.\)`,
    steps: [
      ['domain', String.raw`\(x,y>0,\ x\neq1,\ y\neq1\).`],
      [String.raw`\(\log_x y=\frac{1}{\log_y x}\) (both equal \(\frac{\ln y}{\ln x}\) and its inverse); put \(u=\log_y x\)`, String.raw`\(u-\dfrac1u=\dfrac83\iff3u^2-8u-3=0\iff(3u+1)(u-3)=0\).`],
      [String.raw`case \(u=3\): \(\log_y x=3\iff x=y^3\)`, String.raw`\(xy=y^4=16,\ y>0\): \(\ y=2,\ x=8\).`],
      [String.raw`case \(u=-\frac13\): \(x=y^{-1/3}\)`, String.raw`\(xy=y^{2/3}=16\iff y=16^{3/2}=64,\ \ x=64^{-1/3}=\tfrac14\).`],
    ],
    why: String.raw`The two logs are reciprocals, so one substitution \(u=\log_y x\) turns the first equation into a quadratic. Each root \(u\) gives a relation between \(x\) and \(y\); then \(xy=16\) fixes the values.`,
    result: String.raw`\((x,y)=(8,2)\ \text{ or }\ (x,y)=\left(\tfrac14,64\right)\)`,
    check: String.raw`\((8,2)\): \(\log_2 8-\log_8 2=3-\tfrac13=\tfrac83\);&nbsp; \(\left(\tfrac14,64\right)\): \(\log_{64}\tfrac14-\log_{1/4}64=-\tfrac13-(-3)=\tfrac83\).`,
    fig: plot8, cap: 'Log scale on both axes: xy = 16 becomes a straight line and meets x = y³ at (8, 2) and x = y<sup>−1/3</sup> at (¼, 64).' }),
];
const pick = (process.argv[3] || '3,4,5,6,7').split(',').map(Number);
const chosen = cards.filter(h => pick.some(n => h.includes(`<h2>Exercise ${n}</h2>`)));

const rules = [
  [String.raw`\(\log_b b^r = r\)`, 'Def. 9', [3, 5]],
  [String.raw`\(\log(xy)=\log x+\log y\)`, 'Th. 1.1', [6]],
  [String.raw`\(a^{\log_b c}=c^{\log_b a}\)`, 'swap identity', [4]],
  [String.raw`\(\sqrt{u^2}=|u|\)`, 'square roots', [3]],
  [String.raw`\(t=\log_{10}x,\ u=a^t>0\)`, 'substitution', [7]],
  [String.raw`\(\log_x y=\dfrac{1}{\log_y x}\)`, 'reciprocal logs', [8]],
  [String.raw`\(\log_y x=k\iff x=y^k\)`, 'definition of log', [8]],
  [String.raw`\(u-\tfrac1u=c\ \Rightarrow\ \text{quadratic in }u\)`, 'substitution', [8]],
].filter(r => !r[2] || r[2].some(n => pick.includes(n)));
const answers = [['3', String.raw`4\log_2x=6`], ['4', 'x=9'], ['5', 'x=4'], ['6', 'x=1'], ['7', String.raw`x=\tfrac1{100}`],
  ['8', String.raw`(8,2)\ \text{or}\ \left(\tfrac14,64\right)`]].filter(a => pick.includes(+a[0]));
const exLabel = pick.length > 1 ? `Exercises ${Math.min(...pick)}–${Math.max(...pick)}` : `Exercise ${pick[0]}`;
const solLabel = pick.length > 1 ? 'step-by-step solutions' : 'a step-by-step solution';

// ---------- page ----------
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
h1{font-family:'Inter Display',Inter,sans-serif;font-weight:900;font-size:80px;letter-spacing:-2.5px;text-align:center;line-height:1.02}
.sub{text-align:center;font-size:36px;line-height:1.3;margin:20px auto 0;width:1350px;color:#1f1c19}
.chip{display:inline-block;margin-top:18px;font-size:22px;font-weight:600;letter-spacing:.5px;color:#fff;background:var(--ink);border-radius:999px;padding:6px 18px}
.center{text-align:center}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:34px}
.card{border-radius:22px;padding:28px 34px 26px;display:flex;flex-direction:column}
.card.wide{grid-column:1/-1}
.coral{background:var(--coral-bg);border:2px solid var(--coral-line)} .teal{background:var(--teal-bg);border:2px solid var(--teal-line)}
.head{display:flex;align-items:baseline;gap:16px}
.head h2{font-family:'Inter Display',Inter,sans-serif;font-size:54px;font-weight:800;letter-spacing:-1px}
.coral h2,.coral .sn,.coral h3{color:var(--coral)} .teal h2,.teal .sn,.teal h3{color:var(--teal)}
.stars{color:#d98b1f;font-size:30px;letter-spacing:2px}
.tag{margin-left:auto;font-size:21px;font-weight:600;padding:6px 14px;border-radius:999px;background:#fff;opacity:.85}
.coral .tag{color:var(--coral)} .teal .tag{color:var(--teal)}
.stmt{margin-top:16px;border-radius:14px;padding:18px 22px;font-size:28px;line-height:1.45}
.coral .stmt{background:var(--coral-box)} .teal .stmt{background:var(--teal-box)}
.stmt .katex{font-size:1.12em}
.body{display:flex;flex-direction:column;flex:1}
.wide .body{flex-direction:row;gap:34px;align-items:flex-start}
.wide .sol{flex:1}
h3{font-size:30px;font-weight:700;margin:20px 0 6px}
.step{font-size:24px;line-height:1.55;color:var(--ink);margin-top:10px}
.step .katex{font-size:1.1em}
.sn{font-weight:700}
.rule{font-size:19px;color:#6b645c}
.rule .katex{font-size:1.05em}
.why{margin-top:14px;font-size:22px;line-height:1.5;color:#4b4f7a;background:rgba(255,255,255,.6);border-left:4px solid #6c71a8;padding:8px 14px;border-radius:6px}
.result{display:table;margin:20px auto 6px;font-size:30px;padding:10px 26px;border-radius:12px;background:#fff;border:3px solid currentColor}
.coral .result{color:var(--coral)} .teal .result{color:var(--teal)}
.result .katex{color:var(--ink)}
.check{font-size:22px;line-height:1.5;color:var(--muted);margin-top:8px}
.check b{color:#2c7a3f}
figure{margin-top:auto;padding-top:20px;text-align:center}
.wide figure{margin-top:46px;padding-top:0;flex:0 0 560px}
figure svg{display:block;margin:0 auto;background:rgba(255,255,255,.55);border-radius:14px}
figcaption{font-size:20px;color:#5f5952;margin-top:10px;font-style:italic}
.pt{font-family:'Liberation Serif',serif;font-size:20px;fill:#4a453f;paint-order:stroke;stroke:#fbf8f5;stroke-width:5px}
.pl{font-family:'Liberation Serif',serif;font-style:italic;font-size:24px;fill:var(--ink);paint-order:stroke;stroke:#fbf8f5;stroke-width:6px;stroke-linejoin:round}
.pc{font-family:Inter,sans-serif;font-size:18px;fill:#6b645c}
.pw{font-family:'Liberation Serif',serif;font-size:19px;fill:#fff;font-weight:700}
.bottom{margin-top:30px;border:2px solid #b9c9c2;border-radius:22px;display:flex;padding:26px 36px;background:#fbf9f6}
.bottom h2{font-family:'Inter Display',Inter,sans-serif;font-size:42px;font-weight:800;color:var(--teal);letter-spacing:-.5px;margin-bottom:16px}
.rules{flex:1.25;display:flex;flex-wrap:wrap;gap:12px;align-content:flex-start}
.rulebox{flex:1 1 40%}
.rchip{display:flex;justify-content:space-between;align-items:center;gap:12px;background:var(--teal-bg);border-radius:12px;padding:10px 16px;font-size:25px;width:100%}
.rchip:nth-child(even){background:var(--coral-bg)}
.rchip .rl{font-size:18px;color:#6b645c;white-space:nowrap}
.ans{flex:1;border-left:2px dashed #b8b2aa;padding-left:36px;margin-left:30px}
.ans h2{color:var(--coral)}
.arow{display:flex;align-items:center;gap:16px;font-size:26px;margin:9px 0}
.arow b{display:inline-flex;align-items:center;justify-content:center;width:46px;height:46px;border-radius:50%;background:var(--ink);color:#fff;font-size:22px}
.author{margin-top:34px;text-align:center;font-family:'Inter Display',Inter,sans-serif;font-size:48px;font-weight:800;color:#000;letter-spacing:1px}
.author:before,.author:after{content:"";display:inline-block;width:220px;height:3px;background:#000;vertical-align:middle;margin:0 28px}
</style></head><body><div class="wrap">
<h1>Logarithms &amp; Exponential Equations</h1>
<div class="sub"><b>${exLabel}</b> with ${solLabel}: <b>simplify</b>, <b>change the base</b>, <b>substitute</b>, then <b>check</b>.</div>
<div class="center"><span class="chip">CHAPTER 7 · SOLUTIONS OF THE LECTURE-NOTE EXERCISES</span></div>
<div class="grid">${chosen.join('')}</div>
<div class="bottom">
  <div class="rulebox"><h2>Key rules used</h2><div class="rules">${rules.map(r => `<div class="rchip">${r[0]}<span class="rl">${r[1]}</span></div>`).join('')}</div></div>
  <div class="ans"><h2>${pick.length > 1 ? 'Answers at a glance' : 'Answer'}</h2>${answers.map(a => `<div class="arow"><b>${a[0]}</b>\\(${a[1]}\\)</div>`).join('')}</div>
</div>
<div class="author">Muth Boravy</div>
</div></body></html>`;

fs.writeFileSync(out, tex(html));
console.log(out);
