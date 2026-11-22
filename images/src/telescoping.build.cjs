#!/usr/bin/env node
// Builds the "Telescoping sums and products" poster (4 solutions, 2 columns).
// Usage: NODE_PATH=<dir with katex> node images/src/telescoping.build.cjs <out.html>
const fs = require('fs');
const path = require('path');
const katex = require('katex');

const out = process.argv[2] || path.join(__dirname, 'telescoping.html');
const tex = (s) => s
  .replace(/\\\[([\s\S]+?)\\\]/g, (_, m) => katex.renderToString(m, { displayMode: true, throwOnError: true }))
  .replace(/\\\(([\s\S]+?)\\\)([.,;:]?)/g, (_, m, p) => p
    ? `<span class="nb">${katex.renderToString(m, { throwOnError: true })}${p}</span>`
    : katex.renderToString(m, { throwOnError: true }));
const R = String.raw;

const card = ({ id, tone, title, statement, body, result }) => `
<section class="card ${tone}">
  <div class="head"><span class="num">${id}</span><h2>${title}</h2></div>
  <div class="stmt">${statement}</div>
  <h3>Solution</h3>
  <div class="body">${body}</div>
  <div class="result">${result}</div>
</section>`;

const cards = [
  card({ id: 'a', tone: 'coral', title: 'Telescoping square roots',
    statement: R`\[\sum_{k=1}^n\dfrac{k\sqrt{k}-(k+1)\sqrt{k-1}}{k(k+1)}\]`,
    body: R`<p>Split the fraction and cancel the common factors:</p>
\[\begin{aligned}
\sum_{k=1}^n\dfrac{k\sqrt{k}-(k+1)\sqrt{k-1}}{k(k+1)} &= \sum_{k=1}^n\left[\dfrac{k\sqrt{k}}{k(k+1)}-\dfrac{(k+1)\sqrt{k-1}}{k(k+1)}\right]\\
&=\sum_{k=1}^n\left[\dfrac{\sqrt{k}}{k+1}-\dfrac{\sqrt{k-1}}{k}\right]\\
&=\left(\dfrac{1}{2}-\dfrac{0}{1}\right)+\left(\dfrac{\sqrt{2}}{3}-\dfrac{1}{2}\right)+\left(\dfrac{\sqrt{3}}{4}-\dfrac{\sqrt{2}}{3}\right)+\cdots\\
&\quad+\left(\dfrac{\sqrt{n-1}}{n}-\dfrac{\sqrt{n-2}}{n-1}\right)+\left(\dfrac{\sqrt{n}}{n+1}-\dfrac{\sqrt{n-1}}{n}\right)
\end{aligned}\]
<p>Each negative term cancels the positive term just before it, so only the last positive term survives.</p>`,
    result: R`\(\displaystyle\sum_{k=1}^n\dfrac{k\sqrt{k}-(k+1)\sqrt{k-1}}{k(k+1)}=\dfrac{\sqrt{n}}{n+1}\ \ \blacksquare\)` }),

  card({ id: 'b', tone: 'teal', title: 'A sum of logarithms',
    statement: R`\[\sum_{k=2}^n\ln\left(\dfrac{k(k+2)}{(k+1)^2}\right)\]`,
    body: R`<p>We have \(\ln\left(\prod_{i=1}^n a_i\right)=\sum_{i=1}^n\ln(a_i)\), then we can simplify as follows:</p>
\[\begin{aligned}
\sum_{k=2}^n\ln\left(\dfrac{k(k+2)}{(k+1)^2}\right) &= \ln\left[\prod_{k=2}^n\dfrac{k(k+2)}{(k+1)^2}\right]\\
&=\ln\left[\dfrac{2(2+2)}{(2+1)^2}\cdot\dfrac{3(3+2)}{(3+1)^2}\cdots\dfrac{(n-1)(n+1)}{n^2}\cdot\dfrac{n(n+2)}{(n+1)^2}\right]\\
&=\ln\left[\dfrac{2\cdot4}{3^2}\cdot\dfrac{3\cdot5}{4^2}\cdot\dfrac{4\cdot6}{5^2}\cdots\dfrac{(n-1)(n+1)}{n^2}\cdot\dfrac{n(n+2)}{(n+1)^2}\right]\\
&=\ln\left[\dfrac{2}{3}\cdot\dfrac{n+2}{n+1}\right]
\end{aligned}\]
<p>Every middle factor cancels: only \(\tfrac23\) from the start and \(\tfrac{n+2}{n+1}\) from the end remain.</p>`,
    result: R`\(\displaystyle\sum_{k=2}^n\ln\dfrac{k(k+2)}{(k+1)^2}=\ln\left(\dfrac{2}{3}\right)+\ln\left(\dfrac{n+2}{n+1}\right)\ \ \blacksquare\)` }),

  card({ id: 'c', tone: 'teal', title: 'Doubling angles in tangent',
    statement: R`\[\prod_{k=0}^n\left(1+\dfrac{1}{\cos(2^kx)}\right)\]`,
    body: R`<p>Let us consider</p>
\[\begin{aligned}
1+\dfrac{1}{\cos x} &= \dfrac{1+\cos x}{\cos x} = \dfrac{2\cos^2\dfrac{x}{2}}{\cos x} = \dfrac{2\cos\dfrac{x}{2}\cos\dfrac{x}{2}}{\cos x}\\
&=\dfrac{2\cos\dfrac{x}{2}\sin x}{2\cos x\sin\dfrac{x}{2}} = \dfrac{\tan x}{\tan\dfrac{x}{2}}\\
1+\dfrac{1}{\cos(2^kx)} &= \dfrac{\tan(2^kx)}{\tan(2^{k-1}x)}
\end{aligned}\]
<p>Then we can simplify as follows:</p>
\[\begin{aligned}
\prod_{k=0}^n\left(1+\dfrac{1}{\cos(2^kx)}\right) &=\prod_{k=0}^n\dfrac{\tan(2^kx)}{\tan(2^{k-1}x)}\\
&=\dfrac{\tan x}{\tan\dfrac{x}{2}}\cdot\dfrac{\tan(2x)}{\tan x}\cdot\dfrac{\tan(2^2x)}{\tan(2x)}\cdots\dfrac{\tan(2^{n-1}x)}{\tan(2^{n-2}x)}\cdot\dfrac{\tan(2^nx)}{\tan(2^{n-1}x)}
\end{aligned}\]`,
    result: R`\(\displaystyle\prod_{k=0}^n\left(1+\dfrac{1}{\cos(2^kx)}\right)=\dfrac{\tan(2^nx)}{\tan(2^{-1}x)}\ \ \blacksquare\)` }),

  card({ id: 'd', tone: 'coral', title: 'Tripling angles in cos³',
    statement: R`\[\sum_{k=0}^n\dfrac{(-1)^k\cos^3(3^kx)}{3^k}\]`,
    body: R`<p>We have the identity \(\cos3x=4\cos^3x-3\cos x\implies4\cos^3x=\cos(3x)+3\cos x\), then</p>
\[\begin{aligned}
4\cos^3(3^kx) &= \cos(3^{k+1}x)+3\cos(3^kx)\\
\dfrac{(-1)^k\cos^3(3^kx)}{3^k} &= \dfrac{1}{4}\left[\dfrac{(-1)^k}{3^k}\cos(3^{k+1}x)+\dfrac{(-1)^k}{3^{k-1}}\cos(3^kx)\right]
\end{aligned}\]
<p>Then we can simplify as follows:</p>
\[\begin{aligned}
\sum_{k=0}^n\dfrac{(-1)^k\cos^3(3^kx)}{3^k} &= \dfrac{1}{4}\sum_{k=0}^n\left[\dfrac{(-1)^k}{3^k}\cos(3^{k+1}x)+\dfrac{(-1)^k}{3^{k-1}}\cos(3^kx)\right]\\
&=\dfrac{1}{4}\Bigg[\big(\cos(3x)+3\cos x\big)+\left(\dfrac{(-1)^1}{3^1}\cos(3^2x)+\dfrac{(-1)^1}{3^0}\cos(3x)\right)\\
&\quad+\left(\dfrac{(-1)^2}{3^2}\cos(3^3x)+\dfrac{(-1)^2}{3^1}\cos(3^2x)\right)+\cdots\\
&\quad+\left(\dfrac{(-1)^{n-1}}{3^{n-1}}\cos(3^{n}x)+\dfrac{(-1)^{n-1}}{3^{n-2}}\cos(3^{n-1}x)\right)\\
&\quad+\left(\dfrac{(-1)^{n}}{3^{n}}\cos(3^{n+1}x)+\dfrac{(-1)^{n}}{3^{n-1}}\cos(3^{n}x)\right)\Bigg]\\
&=\dfrac{1}{4}\left[\dfrac{(-1)^{n}}{3^{n}}\cos(3^{n+1}x)+3\cos x\right]
\end{aligned}\]`,
    result: R`\(\displaystyle\sum_{k=0}^n\dfrac{(-1)^k\cos^3(3^kx)}{3^k}=\dfrac{(-1)^{n}}{4\cdot3^{n}}\cos(3^{n+1}x)+\dfrac{3}{4}\cos x\ \ \blacksquare\)` }),
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
h1{font-family:'Inter Display',Inter,sans-serif;font-weight:900;font-size:92px;letter-spacing:-3px;text-align:center;line-height:1.02}
.sub{text-align:center;font-size:36px;line-height:1.3;margin:20px auto 0;width:1300px;color:#1f1c19}
.grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:30px;margin-top:38px}
.card{border-radius:22px;padding:28px 32px 26px;display:flex;flex-direction:column;min-width:0}
.coral{background:var(--coral-bg);border:2px solid var(--coral-line)} .teal{background:var(--teal-bg);border:2px solid var(--teal-line)}
.head{display:flex;align-items:center;gap:18px}
.num{flex:0 0 64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-family:'Liberation Serif',serif;font-style:italic;font-weight:700;font-size:38px;padding-bottom:4px}
.coral .num{background:var(--coral)} .teal .num{background:var(--teal)}
.head h2{font-family:'Inter Display',Inter,sans-serif;font-size:46px;font-weight:800;letter-spacing:-1px;line-height:1.05}
.coral h2,.coral h3{color:var(--coral)} .teal h2,.teal h3{color:var(--teal)}
.stmt{margin-top:18px;border-radius:14px;padding:4px 16px;font-size:30px}
.coral .stmt{background:var(--coral-box)} .teal .stmt{background:var(--teal-box)}
.stmt .katex-display{margin:.6em 0}
h3{font-size:28px;font-weight:700;margin:20px 0 4px}
.body p{font-size:23px;line-height:1.55;color:var(--muted);margin-top:8px}
.body p .katex{font-size:1.1em;color:var(--ink)}
.body .katex-display{margin:14px 0;font-size:24px;background:rgba(255,255,255,.55);border-radius:12px;padding:14px 12px;text-align:left}
.body .katex-display>.katex{text-align:left}
.result{display:block;margin:auto 0 0;padding:16px 18px;border-radius:14px;background:#fff;border:3px solid currentColor;text-align:center;font-size:26px}
.body+.result{margin-top:20px}
.coral .result{color:var(--coral)} .teal .result{color:var(--teal)}
.result .katex{color:var(--ink)}
.nb{white-space:nowrap}
.author{margin-top:40px;text-align:center;font-family:'Inter Display',Inter,sans-serif;font-size:50px;font-weight:800;color:#000;letter-spacing:1px}
.author:before,.author:after{content:"";display:inline-block;width:220px;height:3px;background:#000;vertical-align:middle;margin:0 28px}
</style></head><body><div class="wrap">
<h1>Telescoping Sums &amp; Products</h1>
<div class="sub"><b>Calculate or simplify.</b> Rewrite each term as a <b>difference</b> or a <b>ratio</b> of consecutive pieces, and almost everything <b>cancels</b>.</div>
<div class="grid">${cards.join('')}</div>
<div class="author">Muth Boravy</div>
</div>
<script>
// called by render.cjs after fonts load: scale each formula block so it fits its box
window.__fit = () => {
  for (const el of document.querySelectorAll('.katex-display, .result')) {
    const cs = getComputedStyle(el);
    const avail = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const html = el.querySelector('.katex-html');
    if (!html) continue;
    let w = 0; for (const b of html.children) w += b.getBoundingClientRect().width;
    if (w > avail) el.style.fontSize = (parseFloat(cs.fontSize) * avail / w * 0.97) + 'px';
  }
};
</script>
</body></html>`;

fs.writeFileSync(out, tex(html));
console.log(out);
