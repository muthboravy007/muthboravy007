#!/usr/bin/env node
// One-page A4: prove that cos(sin x) = sin(cos x) has no real roots (step by step, with diagrams).
// Usage: NODE_PATH=<dir with katex> node images/src/cos-sin-no-roots.build.cjs <out.html>
const fs = require('fs');
const path = require('path');
const katex = require('katex');
const out = process.argv[2] || path.join(__dirname, 'cos-sin-no-roots.html');
const tex = (s) => s
  .replace(/\\\[([\s\S]+?)\\\]/g, (_, m) => katex.renderToString(m, { displayMode: true, throwOnError: true }))
  .replace(/\\\(([\s\S]+?)\\\)/g, (_, m) => katex.renderToString(m, { throwOnError: true }));
const R = String.raw;
const C = '#b8432c', T = '#1d5a4b', G = '#c98a12', PI = Math.PI;

// ---------- diagram 1: number line, |sin x ± cos x| <= √2 vs targets ±π/2 + 2kπ ----------
const numberLine = (() => {
  const W = 330, H = 132, x0 = -5.2, x1 = 5.2, pad = 18;
  const X = (v) => pad + (v - x0) / (x1 - x0) * (W - 2 * pad), y = 62;
  const r2 = Math.SQRT2;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="fig">
  <defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#1d1a17"/></marker></defs>
  <rect x="${X(-r2)}" y="${y - 16}" width="${X(r2) - X(-r2)}" height="32" rx="6" fill="${T}" opacity=".16"/>
  <line x1="${X(-r2)}" y1="${y - 16}" x2="${X(-r2)}" y2="${y + 16}" stroke="${T}" stroke-width="2.5"/>
  <line x1="${X(r2)}" y1="${y - 16}" x2="${X(r2)}" y2="${y + 16}" stroke="${T}" stroke-width="2.5"/>
  <line x1="${pad - 6}" y1="${y}" x2="${W - 6}" y2="${y}" stroke="#1d1a17" stroke-width="1.8" marker-end="url(#ar)"/>
  <text x="${X(-r2)}" y="${y - 24}" text-anchor="middle" class="ft" fill="${T}">−√2</text>
  <text x="${X(r2)}" y="${y - 24}" text-anchor="middle" class="ft" fill="${T}">√2</text>
  <line x1="${X(0)}" y1="${y - 5}" x2="${X(0)}" y2="${y + 5}" stroke="#1d1a17" stroke-width="1.5"/><text x="${X(0)}" y="${y - 24}" text-anchor="middle" class="ft">0</text>`;
  for (const [v, lab] of [[-3 * PI / 2, '−3π/2'], [-PI / 2, '−π/2'], [PI / 2, 'π/2'], [3 * PI / 2, '3π/2']]) {
    s += `<circle cx="${X(v)}" cy="${y}" r="6" fill="${C}" stroke="#fff" stroke-width="2"/><text x="${X(v)}" y="${y + 34}" text-anchor="middle" class="ft" fill="${C}">${lab}</text>`;
  }
  return s + '</svg>';
})();

// ---------- diagram 2: graphs of cos(sin x) and sin(cos x) ----------
const graph = (() => {
  const W = 330, H = 140, pl = 26, pr = 8, pt = 6, pb = 18, x0 = -2 * PI, x1 = 2 * PI, y0 = -1.05, y1 = 1.45;
  const X = (v) => pl + (v - x0) / (x1 - x0) * (W - pl - pr), Y = (v) => H - pb - (v - y0) / (y1 - y0) * (H - pt - pb);
  const path = (f) => { let d = ''; for (let i = 0; i <= 400; i++) { const x = x0 + (x1 - x0) * i / 400; d += `${i ? 'L' : 'M'}${X(x).toFixed(1)} ${Y(f(x)).toFixed(1)}`; } return d; };
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="fig">`;
  for (const v of [-1, 1]) s += `<line x1="${pl}" y1="${Y(v)}" x2="${W - pr}" y2="${Y(v)}" stroke="#000" opacity=".07"/><text x="${pl - 6}" y="${Y(v) + 4}" text-anchor="end" class="ft">${v === 1 ? '1' : '−1'}</text>`;
  s += `<line x1="${pl}" y1="${Y(0)}" x2="${W - pr}" y2="${Y(0)}" stroke="#1d1a17" stroke-width="1.3"/>`;
  s += `<line x1="${X(0)}" y1="${pt}" x2="${X(0)}" y2="${H - pb}" stroke="#1d1a17" stroke-width="1.3"/>`;
  for (const [v, lab] of [[-2 * PI, '−2π'], [-PI, '−π'], [PI, 'π'], [2 * PI, '2π']]) s += `<text x="${X(v)}" y="${H - 6}" text-anchor="middle" class="ft">${lab}</text>`;
  s += `<path d="${path(x => Math.cos(Math.sin(x)))}" fill="none" stroke="${C}" stroke-width="2.6"/>`;
  s += `<path d="${path(x => Math.sin(Math.cos(x)))}" fill="none" stroke="${T}" stroke-width="2.6" stroke-dasharray="6 4"/>`;
  s += `<text x="${X(-PI * 1.9)}" y="${Y(1.2)}" class="fl" fill="${C}">y = cos(sin x)</text>`;
  s += `<text x="${X(PI * 0.62)}" y="${Y(1.2)}" class="fl" fill="${T}">y = sin(cos x)</text>`;
  return s + '</svg>';
})();
// numeric sanity check: the gap never closes
let minGap = Infinity; for (let i = 0; i <= 200000; i++) { const x = -PI + 2 * PI * i / 200000; minGap = Math.min(minGap, Math.cos(Math.sin(x)) - Math.sin(Math.cos(x))); }
if (!(minGap > 0)) throw new Error('gap check failed');

const steps = [
  ['Rewrite the sine as a cosine',
    R`Use the co-function identity \(\sin\theta=\cos\!\left(\tfrac{\pi}{2}-\theta\right)\) with \(\theta=\cos x\). Then both sides are cosines:`,
    R`\[\cos(\sin x)=\sin(\cos x)\iff\cos(\sin x)=\cos\!\left(\tfrac{\pi}{2}-\cos x\right)\]`],
  ['Solve "cosine = cosine"',
    R`Two cosines are equal exactly when the angles are equal or opposite, up to a multiple of \(2\pi\): \(\cos A=\cos B\iff A=\pm B+2k\pi,\ k\in\mathbb Z\). So, for some integer \(k\),`,
    R`\[\sin x=\tfrac{\pi}{2}-\cos x+2k\pi\quad\text{or}\quad\sin x=-\tfrac{\pi}{2}+\cos x+2k\pi\]`,
    R`\[\text{(I)}\ \ \sin x+\cos x=\tfrac{\pi}{2}+2k\pi\qquad\qquad\text{(II)}\ \ \sin x-\cos x=-\tfrac{\pi}{2}+2k\pi\]`],
  ['Bound the left-hand sides',
    R`Combine sine and cosine into one sine (see the box below): \(\sin x\pm\cos x=\sqrt2\,\sin\!\left(x\pm\tfrac{\pi}{4}\right)\). Since \(|\sin|\le1\),`,
    R`\[|\sin x+\cos x|\le\sqrt2\approx1.414\qquad|\sin x-\cos x|\le\sqrt2\approx1.414\]`],
  ['The right-hand sides are too big',
    R`For every integer \(k\), the numbers \(\pm\tfrac{\pi}{2}+2k\pi\) are \(\dots,-\tfrac{3\pi}{2},-\tfrac{\pi}{2},\tfrac{\pi}{2},\tfrac{3\pi}{2},\dots\). The closest to \(0\) are \(\pm\tfrac{\pi}{2}\), so`,
    R`\[\left|\pm\tfrac{\pi}{2}+2k\pi\right|\ \ge\ \tfrac{\pi}{2}\approx1.571\ >\ \sqrt2\approx1.414\]`],
];

const kdir = path.dirname(require.resolve('katex/package.json'));
const kcss = fs.readFileSync(path.join(kdir, 'dist/katex.min.css'), 'utf8').replace(/src:url\(fonts\/([^)]+?)\.woff2\)[^;}]*/g, (_, f) =>
  `src:url(data:font/woff2;base64,${fs.readFileSync(path.join(kdir, 'dist/fonts', f + '.woff2')).toString('base64')}) format("woff2")`);

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${kcss}
:root{--ink:#1d1a17;--coral:#b8432c;--coral-bg:#fbebe6;--coral-line:#e2a596;--teal:#1d5a4b;--teal-bg:#e7f0ec;--teal-line:#9fc3b6;--gold:#c98a12}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:794px;height:1123px;background:#fbf9f5;color:var(--ink);font-family:Inter,'Liberation Sans',sans-serif;overflow:hidden}
.page{padding:30px 38px 0;height:1123px;position:relative}
.top{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2.5px solid var(--ink);padding-bottom:9px}
h1{font-family:'Inter Display',Inter,sans-serif;font-weight:900;font-size:34px;letter-spacing:-1px;line-height:1}
.meta{font-size:12px;color:#5f5952;text-align:right;line-height:1.5}
.box{border-radius:13px;padding:9px 14px;margin-top:10px}
.box h2{font-family:'Inter Display',Inter,sans-serif;font-size:17px;font-weight:800;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.box h2 .tag{font-family:Inter,sans-serif;font-size:10.5px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;padding:3px 8px;border-radius:999px;color:#fff}
.ex{background:var(--coral-bg);border:1.6px solid var(--coral-line)} .ex h2{color:var(--coral)} .ex .tag{background:var(--coral)}
.nt{background:var(--teal-bg);border:1.6px solid var(--teal-line)} .nt h2{color:var(--teal)} .nt .tag{background:var(--teal)}
.ex h2 .katex{font-size:1.15em;color:var(--ink)}
.tools{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:8px}
.tools div{background:rgba(255,255,255,.65);border-radius:9px;padding:6px 9px;font-size:12px;color:#3b3733;line-height:1.35}
.tools div b{display:block;color:var(--teal);font-size:11px;letter-spacing:.4px;text-transform:uppercase;margin-bottom:2px}
.tools .katex{font-size:1.1em;color:var(--ink)}
.solh{display:flex;align-items:baseline;gap:12px;margin-top:10px}
.solh h2{font-family:'Inter Display',Inter,sans-serif;font-size:22px;font-weight:800}
.solh small{font-size:12.5px;color:#5f5952}
.step{display:grid;grid-template-columns:30px minmax(0,1fr);gap:10px;background:#fff;border:1.4px solid #e4ded5;border-radius:12px;padding:7px 13px 4px;margin-top:6px}
.step .n{width:26px;height:26px;border-radius:50%;background:var(--ink);color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;margin-top:1px}
.step h3{font-size:13.5px;font-weight:700;color:var(--teal)}
.step p{font-size:13px;line-height:1.5;color:#2e2a26;margin-top:2px}
.step p .katex{font-size:1.08em}
.katex-display{margin:4px 0 2px;font-size:15px}
.fit{overflow:hidden;min-width:0}
.fit .katex-display>.katex{white-space:nowrap}
.pics{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px;margin-top:10px}
.pic{background:#fff;border:1.4px solid #e4ded5;border-radius:12px;padding:8px 10px 8px;text-align:center}
.pic h4{font-size:11px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:var(--coral);text-align:left;margin-bottom:2px}
.pic p{font-size:11.5px;color:#5f5952;line-height:1.4;text-align:left;margin-top:2px}
.pic p .katex{font-size:1.05em}
.fig{display:block;margin:0 auto}
.ft{font-family:'Liberation Serif',serif;font-size:13px;fill:#4a453f}
.fl{font-family:'Liberation Serif',serif;font-style:italic;font-size:13.5px;paint-order:stroke;stroke:#fff;stroke-width:4px}
.why{margin-top:10px;display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:10px;align-items:stretch}
.whyb{border-radius:12px;padding:8px 13px;background:#eef0f8;border-left:4px solid #6c71a8;font-size:12.5px;color:#3d4170;line-height:1.45}
.whyb .katex{color:var(--ink)}
.whyb .katex-display{font-size:14px;margin:4px 0 0}
.concl{border-radius:12px;padding:10px 14px;background:#fff6dc;border:2px solid var(--gold);display:flex;flex-direction:column;justify-content:center}
.concl b{font-size:11px;letter-spacing:.6px;text-transform:uppercase;color:var(--gold)}
.concl small{font-size:11.5px;color:#5f5952;line-height:1.4;margin-top:2px}
.concl p{font-size:13.5px;font-weight:700;margin-top:4px;line-height:1.35}
.concl .katex{font-size:1.05em}
.author{position:absolute;left:0;right:0;bottom:16px;text-align:center;font-family:'Inter Display',Inter,sans-serif;font-size:22px;font-weight:800;color:#000;letter-spacing:.5px}
.author:before,.author:after{content:"";display:inline-block;width:90px;height:2px;background:#000;vertical-align:middle;margin:0 16px}
</style></head><body><div class="page">
<div class="top"><h1>An Equation with No Real Roots</h1><div class="meta">Trigonometry · Exercise 11<br>Proof by bounding both sides</div></div>
<div class="box ex"><h2><span class="tag">Exercise</span><span>Prove that the equation \\(\\cos(\\sin x)=\\sin(\\cos x)\\) does not possess real roots.</span></h2></div>
<div class="box nt"><h2><span class="tag">Tools</span><span>Three facts we will use</span></h2>
  <div class="tools">
    <div><b>Co-function</b>\\(\\sin\\theta=\\cos\\!\\left(\\tfrac{\\pi}{2}-\\theta\\right)\\)</div>
    <div><b>Equal cosines</b>\\(\\cos A=\\cos B\\iff A=\\pm B+2k\\pi\\)</div>
    <div><b>Combine sin and cos</b>\\(\\sin x\\pm\\cos x=\\sqrt2\\sin\\!\\left(x\\pm\\tfrac{\\pi}{4}\\right)\\)</div>
  </div></div>
<div class="solh"><h2>Solution</h2><small>Idea: turn the equation into "something small = something big".</small></div>
${steps.map((st, i) => `<div class="step"><div class="n">${i + 1}</div><div style="min-width:0"><h3>${st[0]}</h3><p>${st[1]}</p>${st.slice(2).map(m => `<div class="fit">${m}</div>`).join('')}</div></div>`).join('')}
<div class="why">
  <div class="whyb"><b>Why is \\(\\sin x+\\cos x=\\sqrt2\\sin\\!\\left(x+\\tfrac{\\pi}{4}\\right)\\)?</b> Expand with \\(\\sin(a+b)=\\sin a\\cos b+\\cos a\\sin b\\) and \\(\\cos\\tfrac{\\pi}{4}=\\sin\\tfrac{\\pi}{4}=\\tfrac{\\sqrt2}{2}\\):
    <div class="fit">\\[\\sqrt2\\sin\\!\\left(x+\\tfrac{\\pi}{4}\\right)=\\sqrt2\\left(\\tfrac{\\sqrt2}{2}\\sin x+\\tfrac{\\sqrt2}{2}\\cos x\\right)=\\sin x+\\cos x\\]</div>
    The same with \\(x-\\tfrac{\\pi}{4}\\) gives \\(\\sin x-\\cos x\\).</div>
  <div class="concl"><b>Conclusion</b><small>The left sides of (I), (II) stay in \\([-\\sqrt2,\\sqrt2]\\); the right sides never do. So (I) and (II) are impossible for every \\(x\\) and \\(k\\):</small><p>\\(\\cos(\\sin x)=\\sin(\\cos x)\\) has no real root. \\(\\ \\blacksquare\\)</p></div>
</div>
<div class="pics">
  <div class="pic"><h4>Step 4 in a picture</h4>${numberLine}<p>Left sides live in the <b style="color:#1d5a4b">teal band</b> \\([-\\sqrt2,\\sqrt2]\\); right sides are the <b style="color:#b8432c">red dots</b> \\(\\pm\\tfrac{\\pi}{2}+2k\\pi\\). They never meet.</p></div>
  <div class="pic"><h4>Check with the graphs</h4>${graph}<p>\\(\\cos(\\sin x)\\) (solid) always stays above \\(\\sin(\\cos x)\\) (dashed): the curves never meet (smallest gap \\(\\approx${minGap.toFixed(2)}\\)).</p></div>
</div>
<div class="author">Muth Boravy</div>
</div>
<script>
window.__fit = () => {
  const ink = (k) => { let l = Infinity, r = -Infinity; for (const n of k.querySelectorAll('*')) { if (n.children.length || !n.textContent.trim()) continue; const b = n.getBoundingClientRect(); if (b.width) { l = Math.min(l, b.left); r = Math.max(r, b.right); } } return r - l; };
  for (const el of document.querySelectorAll('.fit .katex-display')) {
    const avail = el.parentElement.clientWidth - 2, k = el.querySelector('.katex-html'); if (!k) continue;
    for (let i = 0; i < 25; i++) { const w = ink(k); if (w <= avail) break; el.style.fontSize = (parseFloat(getComputedStyle(el).fontSize) * Math.max(.6, avail / w) * .985) + 'px'; }
  }
  const last = [...document.querySelectorAll('.page > *:not(.author)')].reduce((m, e) => Math.max(m, e.getBoundingClientRect().bottom), 0);
  document.title = 'content-bottom:' + Math.round(last);
};
</script></body></html>`;
fs.writeFileSync(out, tex(html));
console.log(out, 'min gap', minGap.toFixed(4));
