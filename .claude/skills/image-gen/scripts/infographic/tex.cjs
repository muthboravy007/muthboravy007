// LaTeX helpers using the KaTeX copy bundled in ../../vendor/katex (no npm install needed).
const fs = require('fs');
const path = require('path');
const KDIR = path.join(__dirname, '..', '..', 'vendor', 'katex');
const katex = require(path.join(KDIR, 'katex.min.js'));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const render = (t, display = false) => katex.renderToString(t, { displayMode: display, throwOnError: true, strict: 'ignore', trust: true });

// Replace \( … \) and \[ … \] in an HTML string with typeset maths.
const texify = (html) => html
  .replace(/\\\[([\s\S]+?)\\\]/g, (_, m) => render(m, true))
  .replace(/\\\(([\s\S]+?)\\\)([.,;:]?)/g, (_, m, p) => p ? `<span class="nb">${render(m)}${p}</span>` : render(m));

// A label inside an SVG figure. `tex` is LaTeX unless plain:true. anchor: start | middle | end.
function texSVG(x, y, tex, { size = 20, color = '#1d1a17', anchor = 'middle', plain = false, bold = false, font = null, bg = null } = {}) {
  const tx = anchor === 'start' ? '0' : anchor === 'end' ? '-100%' : '-50%';
  const inner = plain ? esc(tex) : render(bold ? `\\boldsymbol{${tex}}` : tex);
  return `<foreignObject x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="1" height="1" style="overflow:visible"><div xmlns="http://www.w3.org/1999/xhtml" style="position:absolute;left:0;top:0;transform:translate(${tx},-50%);white-space:nowrap;font-size:${size}px;color:${color};line-height:1.1;${font ? `font-family:${font};` : ''}${bg ? `background:${bg};padding:0 3px;border-radius:4px;` : ''}">${inner}</div></foreignObject>`;
}

// KaTeX stylesheet with fonts inlined as data URIs, so pages render offline.
let _css = null;
function katexCSS() {
  if (_css) return _css;
  _css = fs.readFileSync(path.join(KDIR, 'katex.min.css'), 'utf8').replace(/src:url\(fonts\/([^)]+?)\.woff2\)[^;}]*/g, (_, f) =>
    `src:url(data:font/woff2;base64,${fs.readFileSync(path.join(KDIR, 'fonts', f + '.woff2')).toString('base64')}) format("woff2")`);
  return _css;
}

module.exports = { katex, render, texify, texSVG, katexCSS, esc, KDIR };
