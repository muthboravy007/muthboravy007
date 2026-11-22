#!/usr/bin/env node
// Builds the "Hyperbolic identities" poster (4 proofs, 2 columns).
// Usage: NODE_PATH=<dir with katex> node images/src/hyperbolic.build.cjs <out.html>
const fs = require('fs');
const path = require('path');
const katex = require('katex');

const out = process.argv[2] || path.join(__dirname, 'hyperbolic.html');
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
  card({ id: 'a', tone: 'coral', title: 'The basic identity',
    statement: R`\[\cosh^2 x-\sinh^2 x=1\]`,
    body: R`<p>We know that \(\cosh x=\dfrac{e^x+e^{-x}}{2}\) and \(\sinh x=\dfrac{e^{x}-e^{-x}}{2}\), so</p>
\[\begin{aligned}
\cosh^2 x-\sinh^2 x &= \left(\dfrac{e^x+e^{-x}}{2}\right)^2-\left(\dfrac{e^{x}-e^{-x}}{2}\right)^2\\
&=\dfrac{1}{4}\left[(e^x+e^{-x})^2-(e^x-e^{-x})^2\right]\\
&=\dfrac{1}{4}\left(e^{2x}+e^{-2x}+2-e^{2x}-e^{-2x}+2\right)
\end{aligned}\]
<p>The \(e^{\pm2x}\) terms cancel and only \(\tfrac14(2+2)\) is left.</p>`,
    result: R`\(\cosh^2 x-\sinh^2 x=1\ \ \blacksquare\)` }),

  card({ id: 'b', tone: 'teal', title: 'Tangent of a difference',
    statement: R`\[\tanh(a-b)=\dfrac{\tanh a-\tanh b}{1-\tanh a\tanh b}\]`,
    body: R`<p>Use the subtraction formulas for \(\sinh\) and \(\cosh\), then divide top and bottom by \(\cosh a\cosh b\):</p>
\[\begin{aligned}
\tanh(a-b) &= \dfrac{\sinh(a-b)}{\cosh(a-b)} = \dfrac{\sinh a\cosh b-\cosh a\sinh b}{\cosh a\cosh b-\sinh a\sinh b}\\
&=\dfrac{\dfrac{\sinh a\cosh b-\cosh a\sinh b}{\cosh a\cosh b}}{\dfrac{\cosh a\cosh b-\sinh a\sinh b}{\cosh a\cosh b}}
\end{aligned}\]
<p>Each quotient \(\tfrac{\sinh}{\cosh}\) becomes a \(\tanh\).</p>`,
    result: R`\(\tanh(a-b)=\dfrac{\tanh a-\tanh b}{1-\tanh a\tanh b}\ \ \blacksquare\)` }),

  card({ id: 'c', tone: 'teal', title: 'Double angle for cosh',
    statement: R`\[\cosh^2 a+\sinh^2 a=\cosh(2a)\]`,
    body: R`<p>Expand both squares with the exponential definitions:</p>
\[\begin{aligned}
\cosh^2 a+\sinh^2 a &= \left(\dfrac{e^a+e^{-a}}{2}\right)^2+\left(\dfrac{e^a-e^{-a}}{2}\right)^2\\
&=\dfrac{1}{4}\left(2e^{2a}+2e^{-2a}\right) = \dfrac{e^{2a}+e^{-2a}}{2}
\end{aligned}\]
<p>This time the constant terms \(+2\) and \(-2\) cancel, and what remains is the definition of \(\cosh(2a)\).</p>`,
    result: R`\(\cosh^2 a+\sinh^2 a=\cosh(2a)\ \ \blacksquare\)` }),

  card({ id: 'd', tone: 'coral', title: 'A power of a ratio',
    statement: R`\[\left(\dfrac{1+\tanh x}{1-\tanh x}\right)^n=\dfrac{1+\tanh(nx)}{1-\tanh(nx)}\]`,
    body: R`<p>We have \(\tanh x=\dfrac{\sinh x}{\cosh x}=\dfrac{e^{2x}-1}{e^{2x}+1}\implies\tanh(nx)=\dfrac{e^{2nx}-1}{e^{2nx}+1}\).</p>
\[\begin{aligned}
\left(\dfrac{1+\tanh x}{1-\tanh x}\right)^n &= \left[\dfrac{1+\dfrac{e^{2x}-1}{e^{2x}+1}}{1-\dfrac{e^{2x}-1}{e^{2x}+1}}\right]^n = \left[\dfrac{2e^{2x}}{2}\right]^n = e^{2nx}\qquad(1)
\end{aligned}\]
\[\begin{aligned}
\dfrac{1+\tanh(nx)}{1-\tanh(nx)} &= \dfrac{1+\dfrac{e^{2nx}-1}{e^{2nx}+1}}{1-\dfrac{e^{2nx}-1}{e^{2nx}+1}} = \dfrac{2e^{2nx}}{2} = e^{2nx}\qquad(2)
\end{aligned}\]
<p>Both sides equal \(e^{2nx}\), so by (1) and (2):</p>`,
    result: R`\(\left(\dfrac{1+\tanh x}{1-\tanh x}\right)^n=\dfrac{1+\tanh(nx)}{1-\tanh(nx)}\ \ \blacksquare\)` }),
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
<h1>Hyperbolic Identities</h1>
<div class="sub"><b>Show the following identities.</b> Write <b>cosh</b>, <b>sinh</b> and <b>tanh</b> with exponentials, expand, and watch the terms <b>cancel</b>.</div>
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
