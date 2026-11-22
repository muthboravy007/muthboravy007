#!/usr/bin/env node
// One-page A4 worksheet: determinant of a 3x3 matrix (Sarrus, cofactor expansion, row operations).
// Usage: NODE_PATH=<dir with katex> node images/src/determinant-3x3.build.cjs <out.html> <layout 1|2|3>
//   1 = single column, 2 = two columns (problem | solution), 3 = problem band + three methods side by side
const fs = require('fs');
const path = require('path');
const katex = require('katex');
const out = process.argv[2] || path.join(__dirname, 'determinant-3x3.html');
const layout = Number(process.argv[3] || 1);
const tex = (s) => s
  .replace(/\\\[([\s\S]+?)\\\]/g, (_, m) => katex.renderToString(m, { displayMode: true, throwOnError: true }))
  .replace(/\\\(([\s\S]+?)\\\)/g, (_, m) => katex.renderToString(m, { throwOnError: true }));
const R = String.raw;
const C = '#b8432c', T = '#1d5a4b';

// ---------- Sarrus diagram: 3x3 block + first two columns repeated, coloured diagonals ----------
function sarrus(M, { cw = 40, ch = 32, fs = 19, italic = false } = {}) {
  const padX = 16, padY = 26, W = padX * 2 + cw * 5 + 10, H = padY * 2 + ch * 3;
  const x = (c) => padX + cw * c + cw / 2 + (c >= 3 ? 10 : 0), y = (r) => padY + ch * r + ch / 2;
  let s = `<svg class="sarrus" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`;
  // determinant bars
  for (const bx of [padX + 2, padX + cw * 3 - 2]) s += `<line x1="${bx}" y1="${padY - 2}" x2="${bx}" y2="${padY + ch * 3 + 2}" stroke="#1d1a17" stroke-width="1.6"/>`;
  for (let c = 0; c < 3; c++) {
    const ox = 9, oy = 9 * ch / cw;
    s += `<line x1="${x(c) - ox}" y1="${y(0) - oy}" x2="${x(c + 2) + ox}" y2="${y(2) + oy}" stroke="${C}" stroke-width="2" opacity=".7"/>`;
    s += `<text x="${x(c + 2) + ox + 2}" y="${y(2) + oy + 12}" class="sg" fill="${C}">+</text>`;
    s += `<line x1="${x(c) - ox}" y1="${y(2) + oy}" x2="${x(c + 2) + ox}" y2="${y(0) - oy}" stroke="${T}" stroke-width="2" stroke-dasharray="5 4" opacity=".7"/>`;
    s += `<text x="${x(c + 2) + ox + 2}" y="${y(0) - oy - 2}" class="sg" fill="${T}">−</text>`;
  }
  for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) {
    const v = M[r][c % 3];
    s += `<rect x="${x(c) - 12}" y="${y(r) - 11}" width="24" height="22" rx="5" fill="${c >= 3 ? '#efe9e0' : '#fff'}" opacity=".92"/>`;
    s += `<text x="${x(c)}" y="${y(r) + fs * 0.36}" text-anchor="middle" font-size="${fs}" class="se${italic ? ' it' : ''}"${c >= 3 ? ' fill="#6b645c"' : ''}>${String(v).replace('-', '−')}</text>`;
  }
  return s + '</svg>';
}
const A = [[1, -2, 3], [0, 1, 4], [2, 0, 1]];
const letters = [['a', 'b', 'c'], ['d', 'e', 'f'], ['g', 'h', 'i']];

// ---------- content blocks ----------
const MAT = R`A=\begin{pmatrix*}[r]1&-2&3\\0&1&4\\2&0&1\end{pmatrix*}`;
const blocks = {
  example: (h) => `<div class="box ex"><h2><span class="tag">Example</span><span>Calculate the determinant of matrix \\(A\\) below</span></h2>
    <div class="exrow">\\[${MAT}\\]</div></div>`,

  sarrusNote: (narrow) => `<div class="box nt"><h2><span class="tag">Note</span><span>Sarrus' rule <small>(3×3 only)</small></span></h2>
    <div class="${narrow ? 'col' : 'row'}">${sarrus(letters, layout === 3 ? { italic: true, cw: 40, ch: 32, fs: 19 } : { italic: true, cw: 34, ch: 28, fs: 17 })}
    <div class="grow"><p>Copy the first two columns to the right. Add the products on the <b class="cr">down diagonals</b>, subtract the products on the <b class="tl">up diagonals</b>.</p></div></div>
    <div class="fit">\\[\\det(A)=(aei+bfg+cdh)-(ceg+afh+bdi)\\]</div></div>`,

  cofactorNote: (narrow) => `<div class="box nt"><h2><span class="tag">Note</span><span>Cofactor expansion</span></h2>
    <p>Consider \\(A=(a_{ij})_n\\), with minor \\(M_{ij}\\) (delete row \\(i\\) and column \\(j\\)) and cofactor \\(C_{ij}=(-1)^{i+j}M_{ij}\\).</p>
    <div class="two${narrow ? ' one' : ''}"><div><p class="lab">Along row \\(i\\)</p><div class="fit">\\[\\det(A)=\\sum_{j=1}^n a_{ij}C_{ij}=a_{i1}C_{i1}+\\cdots+a_{in}C_{in}\\]</div></div>
    <div><p class="lab">Along column \\(j\\)</p><div class="fit">\\[\\det(A)=\\sum_{i=1}^n a_{ij}C_{ij}=a_{1j}C_{1j}+\\cdots+a_{nj}C_{nj}\\]</div></div></div></div>`,

  solSarrus: (narrow) => `<div class="item"><div class="ih"><b>1</b><span>Sarrus method</span></div>
    <div class="${narrow ? 'col' : 'row'}">${sarrus(A, layout === 3 ? { cw: 40, ch: 32, fs: 19 } : { cw: 34, ch: 28, fs: 17 })}
    <div class="grow fit">${narrow
      ? R`\[\begin{aligned}\textcolor{${C}}{+}&:\ 1-16+0=-15\\\textcolor{${T}}{-}&:\ 6+0+0=6\end{aligned}\]`
      : R`\[\begin{aligned}\textcolor{${C}}{+}&:\ 1\cdot1\cdot1+(-2)\cdot4\cdot2+3\cdot0\cdot0=1-16+0\\\textcolor{${T}}{-}&:\ 3\cdot1\cdot2+1\cdot4\cdot0+(-2)\cdot0\cdot1=6+0+0\end{aligned}\]`}
    ${narrow ? '' : R`<div class="fit res">\[\det(A)=(1-16+0)-(6+0+0)=\boxed{-21}\]</div>`}</div></div>
    ${narrow ? R`<div class="fit res">\[\det(A)=-15-6=\boxed{-21}\]</div>` : ''}</div>`,

  solCofactor: (narrow) => `<div class="item"><div class="ih"><b>2</b><span>Cofactor (Laplace) expansion along row 1</span></div>
    <div class="fit">${narrow
      ? R`\[\begin{aligned}\det(A)&=\sum_{j=1}^3 a_{1j}C_{1j}\\&=a_{11}C_{11}+a_{12}C_{12}+a_{13}C_{13}\end{aligned}\]`
      : R`\[\det(A)=\sum_{j=1}^3 a_{1j}C_{1j}=a_{11}C_{11}+a_{12}C_{12}+a_{13}C_{13}\]`}</div>
    <div class="fit">${narrow
      ? R`\[\begin{aligned}&=1(-1)^{1+1}\begin{vmatrix*}[r]1&4\\0&1\end{vmatrix*}\\&\quad+(-2)(-1)^{1+2}\begin{vmatrix*}[r]0&4\\2&1\end{vmatrix*}\\&\quad+3(-1)^{1+3}\begin{vmatrix*}[r]0&1\\2&0\end{vmatrix*}\end{aligned}\]`
      : R`\[=1(-1)^{1+1}\begin{vmatrix*}[r]1&4\\0&1\end{vmatrix*}+(-2)(-1)^{1+2}\begin{vmatrix*}[r]0&4\\2&1\end{vmatrix*}+3(-1)^{1+3}\begin{vmatrix*}[r]0&1\\2&0\end{vmatrix*}\]`}</div>
    <div class="fit res">${narrow ? R`\[\begin{aligned}&=1(1)+2(-8)+3(-2)\\&=1-16-6=\boxed{-21}\end{aligned}\]` : R`\[=1(1)+2(-8)+3(-2)=1-16-6=\boxed{-21}\]`}</div></div>`,

  solRowOps: (narrow) => `<div class="item"><div class="ih"><b>3</b><span>Elementary row operations</span></div>
    <p class="small">Reduce \\(A\\) to a triangular matrix; \\(R_i\\leftarrow R_i+kR_j\\) does not change the determinant. Then multiply the diagonal.</p>
    <div class="fit">${narrow
      ? R`\[\begin{aligned}&\xrightarrow{R_3-2R_1}\begin{pmatrix*}[r]1&-2&3\\0&1&4\\0&4&-5\end{pmatrix*}\\&\xrightarrow{R_3-4R_2}\begin{pmatrix*}[r]1&-2&3\\0&1&4\\0&0&-21\end{pmatrix*}\end{aligned}\]`
      : R`\[A\xrightarrow{R_3-2R_1}\begin{pmatrix*}[r]1&-2&3\\0&1&4\\0&4&-5\end{pmatrix*}\xrightarrow{R_3-4R_2}\begin{pmatrix*}[r]1&-2&3\\0&1&4\\0&0&-21\end{pmatrix*}\]`}</div>
    <div class="fit res">\\[\\det(A)=1\\cdot1\\cdot(-21)=\\boxed{-21}\\]</div></div>`,
};

const header = `<div class="top"><h1>Determinant of a 3 × 3 Matrix</h1><div class="meta">Matrices · Example &amp; solution<br>Three methods, one answer</div></div>
<p class="lead">Compute \\(\\det(A)\\) three ways (Sarrus, cofactor expansion, row operations) and check they agree.</p>`;
const solHead = `<div class="solh"><h2>Solution</h2><small>All three methods give \\(\\det(A)=-21\\).</small></div>`;

let body;
if (layout === 1) {
  body = `${header}
  <div class="pair">${blocks.example()}${blocks.sarrusNote()}</div>
  ${blocks.cofactorNote(false)}
  ${solHead}
  ${blocks.solSarrus(false)}${blocks.solCofactor(false)}${blocks.solRowOps(false)}`;
} else if (layout === 2) {
  body = `${header}
  <div class="cols2"><div class="stack">${blocks.example()}${blocks.sarrusNote(true)}${blocks.cofactorNote(true)}</div>
  <div class="stack">${solHead}${blocks.solSarrus(true)}${blocks.solCofactor(true)}${blocks.solRowOps(true)}</div></div>`;
} else {
  body = `${header}
  <div class="band"><div class="stack">${blocks.example()}</div><div class="stack">${blocks.sarrusNote()}</div></div>
  ${blocks.cofactorNote(false)}
  ${solHead}
  <div class="cols3">${blocks.solSarrus(true)}${blocks.solCofactor(true)}${blocks.solRowOps(true)}</div>`;
}

const kdir = path.dirname(require.resolve('katex/package.json'));
const kcss = fs.readFileSync(path.join(kdir, 'dist/katex.min.css'), 'utf8').replace(/src:url\(fonts\/([^)]+?)\.woff2\)[^;}]*/g, (_, f) =>
  `src:url(data:font/woff2;base64,${fs.readFileSync(path.join(kdir, 'dist/fonts', f + '.woff2')).toString('base64')}) format("woff2")`);

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${kcss}
:root{--ink:#1d1a17;--coral:#b8432c;--coral-bg:#fbebe6;--coral-line:#e2a596;--teal:#1d5a4b;--teal-bg:#e7f0ec;--teal-line:#9fc3b6;--gold:#c98a12}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:794px;height:1123px;background:#fbf9f5;color:var(--ink);font-family:Inter,'Liberation Sans',sans-serif;overflow:hidden}
.page{padding:30px 38px 0;height:1123px;position:relative}
.top{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2.5px solid var(--ink);padding-bottom:9px}
h1{font-family:'Inter Display',Inter,sans-serif;font-weight:900;font-size:${layout === 1 ? 34 : 34}px;letter-spacing:-1px;line-height:1}
.meta{font-size:12px;color:#5f5952;text-align:right;line-height:1.5}
.lead{font-size:13.5px;color:#3b3733;margin:8px 0 0}
.box{border-radius:13px;padding:${layout === 3 ? '14px 16px' : '10px 14px'};margin-top:${layout === 3 ? 16 : 11}px;min-width:0}
.box h2{font-family:'Inter Display',Inter,sans-serif;font-size:17px;font-weight:800;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.box h2 small{font-family:Inter,sans-serif;font-size:12px;font-weight:500;opacity:.8}
.box h2 .tag{font-family:Inter,sans-serif;font-size:10.5px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;padding:3px 8px;border-radius:999px;color:#fff}
.ex{background:var(--coral-bg);border:1.6px solid var(--coral-line)} .ex h2{color:var(--coral)} .ex .tag{background:var(--coral)}
.nt{background:var(--teal-bg);border:1.6px solid var(--teal-line)} .nt h2{color:var(--teal)} .nt .tag{background:var(--teal)}
.box p,.item p{font-size:${layout === 1 ? 13 : 14}px;line-height:1.5;margin-top:5px;color:#2e2a26}
.box p .katex,.item p .katex{font-size:1.08em}
.cr{color:var(--coral)} .tl{color:var(--teal)}
.lab{font-weight:600;color:var(--teal)!important}
.exrow{display:flex;justify-content:center}
.exrow .katex-display{margin:6px 0 2px;font-size:19px}
.row{display:flex;align-items:center;gap:14px;margin-top:4px}
.col{display:flex;flex-direction:column;align-items:center;gap:2px;margin-top:2px}
.grow{flex:1;min-width:0}
.col>.grow{align-self:stretch;width:100%}
.stack,.band>*{min-width:0}
.two{display:grid;grid-template-columns:1fr 1fr;gap:4px 16px}
.two.one{grid-template-columns:1fr}
.two>div{min-width:0}
.katex-display{margin:${layout === 3 ? 7 : 4}px 0;font-size:${[0, 14.5, 14.5, 17.5][layout]}px}
.fit{overflow:hidden;min-width:0}
.fit .katex-display>.katex{white-space:nowrap}
.sarrus{flex:0 0 auto;display:block}
.se{font-family:'Liberation Serif',serif;fill:var(--ink)} .se.it{font-style:italic}
.sg{font-family:'Liberation Serif',serif;font-size:16px;font-weight:700}
.pair,.band{display:grid;grid-template-columns:${layout === 3 ? 'minmax(0,.62fr) minmax(0,1.38fr)' : 'minmax(0,.72fr) minmax(0,1.28fr)'};gap:12px;align-items:stretch}
.pair>.box,.band .box{height:calc(100% - 12px)}
.band .stack{display:flex;flex-direction:column}
.cols2{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px;align-items:start}
.cols2 .stack{display:flex;flex-direction:column;min-width:0}
.cols3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:8px;align-items:stretch}
.cols3 .item{margin-top:0}
.solh{display:flex;align-items:baseline;gap:12px;margin-top:${layout === 3 ? 22 : 12}px}
.solh h2{font-family:'Inter Display',Inter,sans-serif;font-size:22px;font-weight:800}
.solh small{font-size:12.5px;color:#5f5952}
.solh small .katex{font-size:1.05em}
.item{background:#fff;border:1.4px solid #e4ded5;border-radius:12px;padding:${layout === 3 ? '12px 14px 10px' : '7px 13px 5px'};margin-top:${layout === 3 ? 10 : 7}px;display:flex;flex-direction:column;min-width:0}
.ih{display:flex;align-items:center;gap:8px}
.ih b{flex:0 0 22px;height:22px;border-radius:50%;background:var(--ink);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px}
.ih span{font-size:10.5px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:var(--teal);background:var(--teal-bg);padding:3px 9px;border-radius:999px}
.small{font-size:12px!important;color:#5f5952!important}
.res{margin-top:auto}
.res .katex-display{margin:4px 0 2px}
.res .fbox{border-color:var(--gold)!important;border-width:2px!important;border-radius:4px}
.res .boxpad{color:var(--coral);font-weight:700}
.author{position:absolute;left:0;right:0;bottom:16px;text-align:center;font-family:'Inter Display',Inter,sans-serif;font-size:22px;font-weight:800;color:#000;letter-spacing:.5px}
.author:before,.author:after{content:"";display:inline-block;width:90px;height:2px;background:#000;vertical-align:middle;margin:0 16px}
</style></head><body><div class="page">
${body}
<div class="author">Muth Boravy</div>
</div>
<script>
// called by render.cjs once fonts are loaded: shrink formulas wider than their box, then report overflow
window.__fit = () => {
  const inkWidth = (k) => { let l = Infinity, r = -Infinity; for (const n of k.querySelectorAll('*')) { if (n.children.length || !n.textContent.trim()) continue; const b = n.getBoundingClientRect(); if (b.width) { l = Math.min(l, b.left); r = Math.max(r, b.right); } } return r - l; };
  for (const el of document.querySelectorAll('.fit .katex-display, .exrow .katex-display')) {
    const avail = el.parentElement.clientWidth - 2;
    const k = el.querySelector('.katex-html'); if (!k) continue;
    for (let i = 0; i < 25; i++) { const w = inkWidth(k); if (w <= avail) break; el.style.fontSize = (parseFloat(getComputedStyle(el).fontSize) * Math.max(.6, avail / w) * .985) + 'px'; }
  }
  const last = [...document.querySelectorAll('.page > *:not(.author), .cols2, .cols3')].reduce((m, e) => Math.max(m, e.getBoundingClientRect().bottom), 0);
  document.title = 'content-bottom:' + Math.round(last);
};
</script></body></html>`;
fs.writeFileSync(out, tex(html));
console.log(out);
