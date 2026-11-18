#!/usr/bin/env node
// Handwriting engine: writes a text/markdown file as handwriting on A4 paper,
// splits it across as many A4 pages (and columns) as needed, and saves PNG pages and/or a PDF.
// Offline: fonts are bundled in ../fonts, rendering uses the local Chromium (Playwright).
//
// Usage:
//   node handwrite.cjs <input.txt|.md> [--out images/notes] [--font caveat] [--paper ruled]
//        [--ink blue] [--line 34] [--size 1] [--columns 1] [--header "Name ... Date ..."]
//        [--title "..."] [--jitter 1] [--seed 7] [--scale 2] [--pdf] [--no-png] [--no-numbers]
//        [--texture] (paper grain; larger PNGs)  [--katex <node_modules dir>]   (optional: typeset \\( \\) and \\[ \\] math with KaTeX)
//   node handwrite.cjs --list-fonts
//   node handwrite.cjs --sample [--out images/font-sample]     (one page showing every font)
//
// Input syntax (one input line = one written line; long lines wrap):
//   # Heading / ## Subheading     - bullet / 1. numbered     (blank line) = empty ruled line
//   **bold**   ~~crossed out~~   ==highlight==   \( inline math \)   \[ display math \] (KaTeX, optional)
//   \newpage = next page   \columnbreak = next column
//   @font kalam   @ink red   @size 1.2   (directives on their own line; apply to the lines below)
const fs = require('fs');
const path = require('path');

const FONT_DIR = path.join(__dirname, '..', 'fonts');
// scale: font-size relative to the ruled line height; dy: vertical nudge so letters sit on the line
const FONTS = {
  'caveat':              { family: 'Caveat',              scale: 0.98, dy: 0.04 },
  'kalam':               { family: 'Kalam',               scale: 0.74, dy: 0.10 },
  'patrick-hand':        { family: 'Patrick Hand',        scale: 0.84, dy: 0.06 },
  'indie-flower':        { family: 'Indie Flower',        scale: 0.78, dy: 0.06 },
  'homemade-apple':      { family: 'Homemade Apple',      scale: 0.60, dy: 0.14 },
  'shadows-into-light':  { family: 'Shadows Into Light',  scale: 0.88, dy: 0.06 },
  'gloria-hallelujah':   { family: 'Gloria Hallelujah',   scale: 0.66, dy: 0.14 },
  'dancing-script':      { family: 'Dancing Script',      scale: 0.90, dy: 0.05 },
  'architects-daughter': { family: 'Architects Daughter', scale: 0.76, dy: 0.08 },
  'nanum-pen-script':    { family: 'Nanum Pen Script',    scale: 1.12, dy: 0.02 },
  'reenie-beanie':       { family: 'Reenie Beanie',       scale: 1.08, dy: 0.02 },
  'just-another-hand':   { family: 'Just Another Hand',   scale: 1.18, dy: 0.02 },
};
const INKS = { blue: '#1f3a93', black: '#1b1b1f', red: '#b3261e', green: '#1f6b3a', purple: '#5b2a86', pencil: '#4a4a4a' };

// ---------- args ----------
const argv = process.argv.slice(2);
const flag = (k) => argv.includes(`--${k}`);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : d; };
const valued = new Set(['katex', 'out', 'font', 'paper', 'ink', 'line', 'size', 'columns', 'header', 'title', 'jitter', 'seed', 'scale', 'margin']);
const positional = argv.filter((a, i) => !a.startsWith('--') && !(argv[i - 1] && valued.has(argv[i - 1].slice(2))));

if (flag('list-fonts')) {
  for (const [k, v] of Object.entries(FONTS)) console.log(`${k.padEnd(22)} ${v.family}`);
  console.log('\nrandom  (pick one at random, reproducible with --seed)\nInks: ' + Object.keys(INKS).join(', ') + ', or any #hex');
  process.exit(0);
}

const sample = flag('sample');
let input = positional[0];
if (!input && !sample) { console.error('usage: node handwrite.cjs <input.txt|.md> [--out images/notes] [--font caveat] [--paper ruled|grid|dotted|plain] [--columns 2] [--pdf]   (or --list-fonts / --sample)'); process.exit(2); }

const seed = Number(opt('seed', 7));
let rnd = (() => { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();
let fontName = opt('font', 'caveat');
if (fontName === 'random') fontName = Object.keys(FONTS)[Math.floor(rnd() * Object.keys(FONTS).length)];
if (!FONTS[fontName]) { console.error(`error: unknown font "${fontName}". Run --list-fonts.`); process.exit(2); }

const cfg = {
  font: fontName,
  paper: opt('paper', 'ruled'),
  ink: INKS[opt('ink', 'blue')] || opt('ink', 'blue'),
  line: Number(opt('line', 34)),
  size: Number(opt('size', 1)),
  columns: Math.max(1, Number(opt('columns', 1))),
  header: opt('header', ''),
  title: opt('title', ''),
  jitter: Number(opt('jitter', 1)),
  numbers: !flag('no-numbers'),
  margin: Number(opt('margin', 0)),
};
if (!['ruled', 'grid', 'dotted', 'plain'].includes(cfg.paper)) { console.error('error: --paper must be ruled, grid, dotted or plain'); process.exit(2); }
const out = opt('out', sample ? 'images/font-sample' : path.join('images', path.basename(input).replace(/\.[^.]+$/, '') + '-handwritten'));
const scale = Number(opt('scale', 2));
const wantPdf = flag('pdf'), wantPng = !flag('no-png');

// ---------- source text ----------
let src;
if (sample) {
  src = Object.keys(FONTS).map(k => `@font ${k}\n## ${k}\nThe quick brown fox jumps over the lazy dog. 0123456789 (a+b)^2 = a^2 + 2ab + b^2`).join('\n\n');
  cfg.title = cfg.title || 'Handwriting fonts';
} else src = fs.readFileSync(input, 'utf8');

// ---------- markdown-ish -> blocks ----------
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// KaTeX is optional: found via require(), or a node_modules dir passed with --katex <dir>
let katex = null, katexDir = null;
for (const base of [opt('katex', null), process.cwd()].filter(Boolean)) {
  try { const p = require.resolve('katex/package.json', { paths: [base] }); katex = require(path.dirname(p)); katexDir = path.dirname(p); break; } catch { /* try next */ }
}
if (!katex) { try { katexDir = path.dirname(require.resolve('katex/package.json')); katex = require('katex'); } catch { /* math stays as plain text */ } }
const mathHTML = (m, display) => katex
  ? katex.renderToString(m, { displayMode: display, throwOnError: false, output: 'html' })
  : `<span class="rawmath">${esc(m)}</span>`;
const inline = (s) => {
  const parts = [];
  s = s.replace(/\\\(([\s\S]+?)\\\)/g, (_, m) => { parts.push(mathHTML(m, false)); return `\u0000${parts.length - 1}\u0000`; });
  s = esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/~~(.+?)~~/g, '<s>$1</s>')
    .replace(/==(.+?)==/g, '<mark>$1</mark>');
  // wrap words for per-word wobble (never inside tags or math placeholders)
  s = s.replace(/(<[^>]+>)|(\u0000\d+\u0000)|([^\s<\u0000]+)/g, (m, tag, ph, word) => tag || ph || `<w>${word}</w>`);
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<w class="m">${parts[+i]}</w>`);
};

const blocks = [];
let state = { font: cfg.font, ink: cfg.ink, size: 1 };
const lines = src.replace(/\r/g, '').split('\n');
for (let i = 0; i < lines.length; i++) {
  let L = lines[i];
  const t = L.trim();
  let m;
  if ((m = t.match(/^@font\s+(\S+)/))) { if (!FONTS[m[1]]) { console.error(`error: unknown font "${m[1]}" on line ${i + 1}`); process.exit(2); } state = { ...state, font: m[1] }; continue; }
  if ((m = t.match(/^@ink\s+(\S+)/))) { state = { ...state, ink: INKS[m[1]] || m[1] }; continue; }
  if ((m = t.match(/^@size\s+([\d.]+)/))) { state = { ...state, size: Number(m[1]) }; continue; }
  if (t === '\\newpage') { blocks.push({ kind: 'page' }); continue; }
  if (t === '\\columnbreak') { blocks.push({ kind: 'col' }); continue; }
  if (t.startsWith('\\[')) {
    let body = t.slice(2);
    while (!body.includes('\\]') && i + 1 < lines.length) body += '\n' + lines[++i];
    blocks.push({ kind: 'math', html: mathHTML(body.replace(/\\\][\s\S]*$/, ''), true), ...state });
    continue;
  }
  if (t === '') { blocks.push({ kind: 'blank' }); continue; }
  let cls = 'p', text = L.replace(/\s+$/, '');
  if ((m = t.match(/^(#{1,3})\s+(.*)$/))) { cls = 'h' + m[1].length; text = m[2]; }
  else if ((m = L.match(/^(\s*)[-*]\s+(.*)$/))) { cls = 'li'; text = m[2]; }
  else if ((m = L.match(/^(\s*)(\d+[.)])\s+(.*)$/))) { cls = 'ol'; text = `<num>${m[2]}</num> ` + m[3]; }
  const indent = (L.match(/^\s*/)[0].length >= 2 && cls === 'p') ? 1 : 0;
  const html = cls === 'ol' ? text.replace(/^<num>(.*?)<\/num> (.*)$/, (_, n, rest) => `<w class="num">${esc(n)}</w> ${inline(rest)}`) : inline(text);
  blocks.push({ kind: 'text', cls, html, indent, ...state });
}

// ---------- page html ----------
const fontFaces = Object.entries(FONTS).map(([k, v]) =>
  `@font-face{font-family:'${v.family}';src:url(data:font/woff2;base64,${fs.readFileSync(path.join(FONT_DIR, k + '.woff2')).toString('base64')}) format('woff2');font-display:block}`).join('\n');
let katexCss = '';
if (katex && blocks.some(b => /class="katex/.test(b.html || ''))) {
  const kdir = katexDir;
  katexCss = fs.readFileSync(path.join(kdir, 'dist/katex.min.css'), 'utf8').replace(/src:url\(fonts\/([^)]+?)\.woff2\)[^;}]*/g, (_, f) =>
    `src:url(data:font/woff2;base64,${fs.readFileSync(path.join(kdir, 'dist/fonts', f + '.woff2')).toString('base64')}) format("woff2")`);
}

const W = 794, H = 1123; // A4 at 96 dpi
const Lh = cfg.line;
const M = { top: 3 * Lh + cfg.margin, bottom: 2 * Lh, left: 92 + cfg.margin, right: 46 + cfg.margin };
const paperBg = {
  ruled: `repeating-linear-gradient(to bottom, transparent 0 ${Lh - 1.4}px, rgba(84,140,205,.55) ${Lh - 1.4}px ${Lh}px)`,
  grid: `repeating-linear-gradient(to bottom, transparent 0 ${Lh / 2 - 1}px, rgba(84,140,205,.35) ${Lh / 2 - 1}px ${Lh / 2}px), repeating-linear-gradient(to right, transparent 0 ${Lh / 2 - 1}px, rgba(84,140,205,.35) ${Lh / 2 - 1}px ${Lh / 2}px)`,
  dotted: `radial-gradient(circle at ${Lh / 2}px ${Lh - 1}px, rgba(84,140,205,.7) 1.3px, transparent 1.6px)`,
  plain: 'none',
}[cfg.paper];
const grain = `url("data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .45 0 0 0 0 .4 0 0 0 0 .3 0 0 0 .06 0"/></filter><rect width="300" height="300" filter="url(#n)"/></svg>')}")`;

const blockHTML = (b) => {
  if (b.kind === 'blank') return '<div class="blk blank" data-kind="blank"></div>';
  if (b.kind === 'page' || b.kind === 'col') return `<div class="blk" data-kind="${b.kind}"></div>`;
  const f = FONTS[b.font];
  const style = `font-family:'${f.family}';color:${b.ink};--fs:${(Lh * f.scale * cfg.size * b.size).toFixed(2)}px;--dy:${(Lh * f.dy).toFixed(2)}px`;
  if (b.kind === 'math') return `<div class="blk math" data-kind="math" style="${style}">${b.html}</div>`;
  return `<div class="blk ${b.cls}${b.indent ? ' ind' : ''}" data-kind="text" style="${style}">${b.html}</div>`;
};

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
${fontFaces}
${katexCss}
@page{size:A4;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#d9d6cf}
body{display:flex;flex-direction:column;align-items:center;gap:24px;padding:24px 0}
.page{position:relative;width:${W}px;height:${H}px;overflow:hidden;background-color:#fdfcf6;background-image:${flag('texture') ? grain : 'none'};box-shadow:0 2px 10px rgba(0,0,0,.18)}
.rules{position:absolute;left:0;right:0;top:${M.top}px;bottom:${M.bottom - Lh}px;background-image:${paperBg};background-size:${cfg.paper === 'dotted' ? `${Lh}px ${Lh}px` : 'auto'}}
.page.grid .rules,.page.dotted .rules{left:${Lh / 2}px;right:${Lh / 2}px}
.marginline{position:absolute;top:0;bottom:0;left:${M.left - 14}px;width:1.6px;background:rgba(214,72,72,.6)}
.cols{position:absolute;left:${M.left}px;right:${M.right}px;top:${M.top}px;display:flex;gap:${Lh}px}
.col{flex:1;min-width:0;overflow:hidden;position:relative}
.col+.col:before{content:"";position:absolute;left:-${Lh / 2}px;top:0;bottom:0;border-left:1.5px dashed rgba(60,60,60,.25)}
.colrule{position:absolute;top:${M.top}px;width:0;border-left:1.6px solid rgba(60,60,60,.35)}
.blk{min-height:${Lh}px;line-height:${Lh}px;font-size:var(--fs);overflow-wrap:anywhere}
.blk w{display:inline-block;position:relative;top:var(--dy)}
.blk w.m{top:calc(var(--dy) * .3)}
.blk.ind{padding-left:${Lh}px}
.blk.h1{font-size:calc(var(--fs) * 1.45);line-height:${2 * Lh}px;min-height:${2 * Lh}px}
.blk.h1 w,.blk.h2 w{text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:5px}
.blk.h2{font-size:calc(var(--fs) * 1.18)}
.blk.h3{font-size:calc(var(--fs) * 1.08)}
.blk.li{padding-left:${Lh * 0.9}px;position:relative}
.blk.li:before{content:"•";position:absolute;left:${Lh * 0.25}px;top:var(--dy)}
.blk.ol{padding-left:${Lh * 0.1}px}
.blk b{text-shadow:.6px 0 0 currentColor,-.3px 0 0 currentColor}
.blk s{text-decoration:none;background:linear-gradient(transparent 52%,currentColor 52%,currentColor 60%,transparent 60%)}
.blk mark{background:linear-gradient(transparent 30%,rgba(255,226,92,.75) 30%,rgba(255,226,92,.75) 88%,transparent 88%);color:inherit}
.blk .katex{font-size:calc(var(--fs) * .8);color:inherit}
.blk.math .katex{font-size:calc(var(--fs) * .85)}
.blk.math{display:flex;justify-content:center;align-items:center}
.blk.math .katex-display{margin:0}
.rawmath{font-style:italic}
.header{white-space:pre;position:absolute;left:${M.left}px;right:${M.right}px;top:${M.top - 2 * Lh}px;height:${Lh}px;line-height:${Lh}px}
.title{position:absolute;left:${M.left}px;right:${M.right}px;top:${M.top - Lh}px;height:${Lh}px;line-height:${Lh}px;text-align:center}
.pnum{position:absolute;right:${M.right}px;bottom:${Lh * 0.55}px;height:${Lh}px;line-height:${Lh}px}
.header,.title,.pnum{font-family:'${FONTS[cfg.font].family}';color:${cfg.ink};font-size:${(Lh * FONTS[cfg.font].scale * cfg.size).toFixed(2)}px}
.title{font-size:${(Lh * FONTS[cfg.font].scale * cfg.size * 1.3).toFixed(2)}px}
#src{display:none}
@media print{html,body{background:none}body{display:block;padding:0}.page{box-shadow:none;break-after:page}}
</style></head><body>
<div id="src">${blocks.map(blockHTML).join('\n')}</div>
<script>
const CFG = ${JSON.stringify({ columns: cfg.columns, header: cfg.header, title: cfg.title, numbers: cfg.numbers, jitter: cfg.jitter, seed, paper: cfg.paper, Lh, M, H })};
window.__layout = () => {
  let a = CFG.seed * 9973 >>> 0;
  const r = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const J = CFG.jitter, Lh = CFG.Lh, M = CFG.M;
  const colH = Math.floor((CFG.H - M.top - M.bottom) / Lh) * Lh;
  const pages = []; let cols = [], ci = 0;
  const newPage = () => {
    const p = document.createElement('div'); p.className = 'page ' + CFG.paper;
    p.innerHTML = '<div class="rules"></div>' + (CFG.paper === 'ruled' ? '<div class="marginline"></div>' : '') + '<div class="cols"></div>';
    const wrap = p.querySelector('.cols'); cols = [];
    for (let i = 0; i < CFG.columns; i++) { const c = document.createElement('div'); c.className = 'col'; c.style.height = colH + 'px'; wrap.appendChild(c); cols.push(c); }
    const rules = p.querySelector('.rules'); rules.style.bottom = 'auto'; rules.style.height = colH + 'px';
    document.body.appendChild(p); pages.push(p); ci = 0;
  };
  const next = () => { if (ci + 1 < cols.length) ci++; else newPage(); };
  const over = (c) => c.scrollHeight > c.clientHeight + 1;
  newPage();
  const queue = [...document.getElementById('src').children];
  while (queue.length) {
    const b = queue.shift(), kind = b.dataset.kind;
    if (kind === 'page') { newPage(); continue; }
    if (kind === 'col') { next(); continue; }
    let c = cols[ci];
    if (kind === 'blank' && !c.children.length) continue; // no empty line at the top of a column
    c.appendChild(b);
    if (kind === 'math') {
      // shrink display math that is wider than the column, then snap its height to whole ruled lines
      const k = b.querySelector('.katex-html');
      if (k) { let w = 0; for (const n of k.children) w += n.getBoundingClientRect().width;
        if (w > c.clientWidth) b.style.setProperty('--fs', (parseFloat(getComputedStyle(b).getPropertyValue('--fs')) * c.clientWidth / w * .97) + 'px'); }
      b.style.minHeight = Math.ceil(b.scrollHeight / Lh) * Lh + 'px';
    } else if (kind === 'text' && b.querySelector('.katex')) {
      // tall inline math (fractions): give those lines 2+ ruled lines so nothing overlaps
      let h = 0; b.querySelectorAll('.katex').forEach(k => { h = Math.max(h, k.getBoundingClientRect().height); });
      if (h > Lh * .95) b.style.lineHeight = Math.ceil(h / Lh + .2) * Lh + 'px';
    }
    if (!over(c)) continue;
    c.removeChild(b);
    const parts = [...b.childNodes];
    if (kind === 'text' && parts.length > 1) {
      // put as many words as fit here, carry the rest to the next column/page
      let lo = 0, hi = parts.length;
      const head = b.cloneNode(false); c.appendChild(head);
      while (lo < hi) { const mid = Math.ceil((lo + hi) / 2); head.replaceChildren(...parts.slice(0, mid).map(n => n.cloneNode(true))); if (over(c)) hi = mid - 1; else lo = mid; }
      head.replaceChildren(...parts.slice(0, lo).map(n => n.cloneNode(true)));
      if (!lo) c.removeChild(head);
      const tail = b.cloneNode(false); tail.classList.remove('h1', 'h2', 'h3');
      tail.replaceChildren(...parts.slice(lo)); if (b.classList.contains('li')) { tail.classList.remove('li'); tail.style.paddingLeft = (Lh * .9) + 'px'; }
      next(); queue.unshift(lo ? tail : b);
    } else { next(); cols[ci].appendChild(b); }
  }
  // drop empty trailing page
  const last = pages[pages.length - 1];
  if (pages.length > 1 && ![...last.querySelectorAll('.col')].some(c => c.children.length)) { last.remove(); pages.pop(); }
  // per-word and per-line wobble: small rotation, baseline drift and size changes
  document.querySelectorAll('.page .blk').forEach(blk => {
    const tilt = (r() - .5) * .5 * J;
    blk.style.transform = 'rotate(' + tilt + 'deg)';
    blk.querySelectorAll('w').forEach(w => {
      const rot = (r() - .5) * 2.4 * J, dy = (r() - .5) * 2.6 * J, sc = 1 + (r() - .5) * .07 * J;
      w.style.transform = 'translateY(' + dy + 'px) rotate(' + rot + 'deg) scale(' + sc + ')';
      w.style.opacity = (0.86 + r() * .14).toFixed(2);
    });
  });
  // header, title, page numbers
  pages.forEach((p, i) => {
    if (CFG.header) p.insertAdjacentHTML('beforeend', '<div class="header"></div>'), p.querySelector('.header').textContent = CFG.header;
    if (CFG.title && i === 0) p.insertAdjacentHTML('beforeend', '<div class="title"></div>'), p.querySelector('.title').textContent = CFG.title;
    if (CFG.numbers) p.insertAdjacentHTML('beforeend', '<div class="pnum">' + (i + 1) + ' / ' + pages.length + '</div>');
  });
  return pages.length;
};
</script></body></html>`;

// ---------- render ----------
if (process.env.HW_HTML) fs.writeFileSync(process.env.HW_HTML, html); // debug: save the generated page
let chromium;
try { ({ chromium } = require('playwright')); } catch { console.error('error: playwright is not installed'); process.exit(1); }
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W + 60, height: H + 60 }, deviceScaleFactor: scale });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.fonts].map(f => f.load().catch(() => {}))); });
  const n = await page.evaluate(() => window.__layout());
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  const written = [];
  if (wantPng) {
    const els = await page.$$('.page');
    for (let i = 0; i < els.length; i++) {
      const f = n === 1 ? `${out}.png` : `${out}-${i + 1}.png`;
      await els[i].screenshot({ path: f }); written.push(f);
    }
  }
  if (wantPdf) {
    await page.emulateMedia({ media: 'print' });
    await page.pdf({ path: `${out}.pdf`, format: 'A4', printBackground: true, preferCSSPageSize: true });
    written.push(`${out}.pdf`);
  }
  await browser.close();
  console.log(`${n} A4 page(s), font ${cfg.font}, paper ${cfg.paper}, ${cfg.columns} column(s)`);
  written.forEach(f => console.log(f));
})().catch(e => { console.error('error:', e.message); process.exit(1); });
