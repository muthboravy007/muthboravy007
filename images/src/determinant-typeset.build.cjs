#!/usr/bin/env node
// Typeset A4 worksheet (no handwriting): determinant exercise, note and solution.
// Usage: NODE_PATH=<dir with katex> node images/src/determinant-typeset.build.cjs <out.html>
const fs = require('fs');
const path = require('path');
const katex = require('katex');
const out = process.argv[2] || path.join(__dirname, 'determinant-typeset.html');
const tex = (s) => s
  .replace(/\\\[([\s\S]+?)\\\]/g, (_, m) => katex.renderToString(m, { displayMode: true, throwOnError: true }))
  .replace(/\\\(([\s\S]+?)\\\)/g, (_, m) => katex.renderToString(m, { throwOnError: true }));
const R = String.raw;

const exercise = [R`|3A|`, R`|A^{-1}|`, R`|\operatorname{adj}(A)|`, R`|A^{-1}+2\operatorname{adj}(A)|`, R`|A^{T}|`, R`|3A^{-1}|`, R`|(3A)^{-1}|`];
const note = [R`|I_n|=1`, R`|A^T|=|A|`, R`|\alpha A|=\alpha^n|A|`, R`|AB|=|A|\times|B|`, R`|A^{-1}|=\dfrac{1}{|A|}`, R`\operatorname{adj}(A)=|A|\cdot A^{-1}`, R`|\operatorname{adj}(A)|=|A|^{n-1}`];
const sol = [
  ['Rule 3', R`|3A|=3^3|A|=27\cdot4`, R`108`],
  ['Rule 5', R`|A^{-1}|=\dfrac{1}{|A|}`, R`\dfrac14`],
  ['Rule 7', R`|\operatorname{adj}(A)|=|A|^{3-1}=4^2`, R`16`],
  ['Rules 6, 3, 5', R`|9A^{-1}|=9^3|A^{-1}|=\dfrac{9^3}{|A|}`, R`\dfrac{729}{4}`, R`A^{-1}+2\operatorname{adj}(A)=A^{-1}+2|A|\,A^{-1}=9A^{-1}`],
  ['Rule 2', R`|A^T|=|A|`, R`4`],
  ['Rules 3, 5', R`|3A^{-1}|=3^3|A^{-1}|=\dfrac{3^3}{|A|}`, R`\dfrac{27}{4}`],
  ['Rules 5, 3', R`|(3A)^{-1}|=\dfrac{1}{|3A|}=\dfrac{1}{3^3\cdot|A|}`, R`\dfrac{1}{108}`],
];

const kdir = path.dirname(require.resolve('katex/package.json'));
const kcss = fs.readFileSync(path.join(kdir, 'dist/katex.min.css'), 'utf8').replace(/src:url\(fonts\/([^)]+?)\.woff2\)[^;}]*/g, (_, f) =>
  `src:url(data:font/woff2;base64,${fs.readFileSync(path.join(kdir, 'dist/fonts', f + '.woff2')).toString('base64')}) format("woff2")`);

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${kcss}
:root{--ink:#1d1a17;--coral:#b8432c;--coral-bg:#fbebe6;--coral-line:#e2a596;--teal:#1d5a4b;--teal-bg:#e7f0ec;--teal-line:#9fc3b6;--gold:#c98a12}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:794px;height:1123px;background:#fbf9f5;color:var(--ink);font-family:Inter,'Liberation Sans',sans-serif;overflow:hidden}
.page{padding:34px 40px 0;height:1123px;position:relative}
.top{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2.5px solid var(--ink);padding-bottom:10px}
h1{font-family:'Inter Display',Inter,sans-serif;font-weight:900;font-size:40px;letter-spacing:-1.2px;line-height:1}
.meta{font-size:13px;color:#5f5952;text-align:right;line-height:1.5}
.lead{font-size:14.5px;color:#3b3733;margin:10px 0 0}
.box{border-radius:14px;padding:14px 18px 14px;margin-top:16px;position:relative}
.box h2{font-family:'Inter Display',Inter,sans-serif;font-size:20px;font-weight:800;display:flex;align-items:center;gap:8px}
.box h2 .tag{font-family:Inter,sans-serif;font-size:11px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;padding:3px 8px;border-radius:999px;color:#fff}
.ex{background:var(--coral-bg);border:1.6px solid var(--coral-line)} .ex h2{color:var(--coral)} .ex .tag{background:var(--coral)}
.nt{background:var(--teal-bg);border:1.6px solid var(--teal-line)} .nt h2{color:var(--teal)} .nt .tag{background:var(--teal)}
.box p{font-size:15px;margin-top:6px}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:6px 14px;margin-top:10px;counter-reset:n}
.grid3 div{font-size:15px;display:flex;align-items:center;gap:8px;min-height:30px}
.grid3 div:before{counter-increment:n;content:counter(n);flex:0 0 22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff}
.ex .grid3 div:before{background:var(--coral)} .nt .grid3 div:before{background:var(--teal)}
.grid3 .katex{font-size:1.12em}
.sol{margin-top:18px}
.sol h2{font-family:'Inter Display',Inter,sans-serif;font-size:24px;font-weight:800;display:flex;align-items:baseline;gap:12px}
.sol h2 small{font-family:Inter,sans-serif;font-size:13.5px;font-weight:500;color:#5f5952}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:10px;align-items:start}
.stack{display:flex;flex-direction:column;gap:10px}
.key{border-radius:12px;padding:10px 14px;background:var(--coral-bg);border:1.4px dashed var(--coral-line);font-size:13.5px;line-height:1.5;color:#3b3733}
.key b{color:var(--coral)}
.item{background:#fff;border:1.4px solid #e4ded5;border-radius:12px;padding:9px 12px 10px;display:flex;flex-direction:column;gap:6px}
.pre{font-size:15px}.pre .katex{font-size:1.05em}
.ih{display:flex;align-items:center;gap:8px}
.ih b{flex:0 0 22px;height:22px;border-radius:50%;background:var(--ink);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px}
.ih span{font-size:11px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:var(--teal);background:var(--teal-bg);padding:2px 8px;border-radius:999px}
.work{display:flex;align-items:center;flex-wrap:wrap;gap:6px;font-size:15px}
.work .katex{font-size:1.1em}
.ans{display:inline-flex;align-items:center;padding:2px 10px;border-radius:8px;background:#fff6dc;border:1.8px solid var(--gold)}
.fix{margin-top:12px;font-size:11.5px;color:#6b645c;line-height:1.45}
.author{position:absolute;left:0;right:0;bottom:22px;text-align:center;font-family:'Inter Display',Inter,sans-serif;font-size:24px;font-weight:800;color:#000;letter-spacing:.5px}
.author:before,.author:after{content:"";display:inline-block;width:90px;height:2px;background:#000;vertical-align:middle;margin:0 16px}
</style></head><body><div class="page">
<div class="top"><h1>Determinant Properties</h1><div class="meta">Matrices · Exercise &amp; solution<br>A is a 3 × 3 matrix</div></div>
<p class="lead">Use the properties of the determinant to evaluate each expression without knowing the entries of \\(A\\).</p>
<div class="box ex"><h2><span class="tag">Exercise</span><span>Let \\(A\\) be a \\(3\\times3\\) matrix with \\(|A|=4\\). Find</span></h2>
  <div class="grid3">${exercise.map(e => `<div>\\(${e}\\)</div>`).join('')}</div></div>
<div class="box nt"><h2><span class="tag">Note</span><span>Let \\(A\\in\\mathcal{M}_n\\), then</span></h2>
  <div class="grid3">${note.map(e => `<div>\\(${e}\\)</div>`).join('')}</div></div>
<div class="sol"><h2>Solution <small>Here \\(n=3\\) and \\(|A|=4\\); the rule numbers refer to the Note.</small></h2>
  <div class="cols">${[[0, 1, 2, 3], [4, 5, 6]].map((ids, c) => `<div class="stack">${ids.map(i => { const x = sol[i]; return `<div class="item"><div class="ih"><b>${i + 1}</b><span>${x[0]}</span></div>
    ${x[3] ? `<div class="pre">\\(${x[3]}\\)</div>` : ''}<div class="work">\\(${x[1]}=\\)<span class="ans">\\(${x[2]}\\)</span></div></div>`; }).join('')}${c ? `<div class="key"><b>Key idea.</b> \\(|\\alpha A|=\\alpha^n|A|\\) because each of the \\(n\\) rows of \\(A\\) is multiplied by \\(\\alpha\\). With \\(n=3\\), the factor is \\(\\alpha^3\\), not \\(\\alpha^2\\).</div>` : ''}</div>`).join('')}</div>
</div>
<div class="author">Muth Boravy</div>
</div></body></html>`;
fs.writeFileSync(out, tex(html));
console.log(out);
