// Poster/infographic layout: title, subtitle, rows of cards with coloured headers, formula boxes,
// figures, side-by-side columns, lists, legends and a footer. Three themes: classic, paper, sketch.
const fs = require('fs');
const path = require('path');
const { texify, katexCSS, esc } = require('./tex.cjs');
const FONT_DIR = path.join(__dirname, '..', '..', 'fonts');

const THEMES = {
  // cream page, coral + teal (Jacobian / Coordinate systems / Gradient–Divergence–Curl style)
  classic: {
    bg: '#f7f3ee', ink: '#1d1a17', muted: '#3b3733', card: '#fbf9f6', cardBorder: '#e6dfd5', radius: 16, shadow: 'none',
    title: "'Inter Display',Inter,sans-serif", titleWeight: 900, titleSize: 96, titleSpacing: '-2.5px', body: "Inter,'Liberation Sans',sans-serif", handTitle: false,
    tones: { coral: ['#b8432c', '#fbebe6'], teal: ['#1d5a4b', '#e7f0ec'], gold: ['#a86f12', '#fbf1dc'], slate: ['#3e5f73', '#e6eef2'], plum: ['#7a3a64', '#f5e8f0'], ink: ['#1d1a17', '#efebe5'] },
    page: '',
  },
  // graph-paper page, serif title, multicolour header bars (Types of Integrals style)
  paper: {
    bg: '#f6eee2', ink: '#1f1a16', muted: '#3a332d', card: '#fbf6ee', cardBorder: '#eadfce', radius: 14, shadow: '0 6px 14px rgba(70,50,30,.16)',
    title: "'Bitstream Charter','Liberation Serif',serif", titleWeight: 700, titleSize: 104, titleSpacing: '-1px', body: "Inter,'Liberation Sans',sans-serif", handTitle: false,
    tones: { rust: ['#c0532f', '#fbe9df'], green: ['#3f6e4a', '#e4efe5'], crimson: ['#8e1f45', '#f6e2e9'], slate: ['#4d7385', '#e3edf1'], orange: ['#c8622c', '#fbe7da'], indigo: ['#3a3d6e', '#e6e6f2'], sand: ['#b08a61', '#f1e3cf'], coral: ['#c0532f', '#fbe9df'], teal: ['#3f6e4a', '#e4efe5'] },
    page: 'background-image:linear-gradient(rgba(150,120,90,.13) 1px,transparent 1px),linear-gradient(90deg,rgba(150,120,90,.13) 1px,transparent 1px);background-size:32px 32px;',
  },
  // hand-drawn marker look with pastel pills (Mathematics Behind AI style)
  sketch: {
    bg: '#fdfdfb', ink: '#111', muted: '#222', card: '#fff', cardBorder: '#d6dbe8', radius: 20, shadow: 'none',
    title: "'Patrick Hand','Architects Daughter',cursive", titleWeight: 400, titleSize: 104, titleSpacing: '1px', body: "'Patrick Hand','Kalam',cursive", handTitle: true,
    tones: { pink: ['#111', '#fbd9ec'], blue: ['#111', '#dde7fb'], yellow: ['#111', '#fbeeb0'], green: ['#111', '#dcf6d4'], lavender: ['#111', '#e8ddfa'], peach: ['#111', '#fde3d2'], sky: ['#111', '#d6f0fb'], coral: ['#111', '#fbd9ec'], teal: ['#111', '#dcf6d4'] },
    page: '',
  },
};

const fontFace = (name, file) => fs.existsSync(path.join(FONT_DIR, file)) ? `@font-face{font-family:'${name}';src:url(data:font/woff2;base64,${fs.readFileSync(path.join(FONT_DIR, file)).toString('base64')}) format('woff2')}` : '';

function block(b, ctx) {
  if (b == null) return '';
  if (typeof b === 'string') return `<div class="html">${b}</div>`;
  if (b.p !== undefined) return `<p class="p${b.small ? ' small' : ''}" style="${b.style || ''}">${b.p}</p>`;
  if (b.h !== undefined) return `<h4 class="bh" style="color:${tone(ctx, b.tone || ctx.tone)[0]}">${b.h}</h4>`;
  if (b.tex !== undefined) {
    const t = tone(ctx, b.tone || ctx.tone), boxed = b.box === undefined ? true : b.box;
    return `<div class="formula fit${boxed ? ' boxed' : ''}" style="${boxed ? `background:${b.bg || t[1]};` : ''}font-size:${b.size || ctx.formulaSize}px;text-align:${b.align || 'center'};${b.style || ''}">\\[${b.tex}\\]</div>`;
  }
  if (b.fig !== undefined) return `<figure style="text-align:${b.align || 'center'};${b.style || ''}">${b.fig}${b.caption ? `<figcaption>${b.caption}</figcaption>` : ''}</figure>`;
  if (b.cols) {
    const w = b.widths || b.cols.map(() => 1);
    return `<div class="cols" style="grid-template-columns:${w.map(x => typeof x === 'number' ? `minmax(0,${x}fr)` : x).join(' ')};gap:${b.gap ?? 18}px;align-items:${b.align || 'center'}">${b.cols.map(c => `<div class="col">${(Array.isArray(c) ? c : [c]).map(x => block(x, ctx)).join('')}</div>`).join('')}</div>`;
  }
  if (b.list) return `<${b.ordered ? 'ol' : 'ul'} class="list">${b.list.map(i => `<li>${i}</li>`).join('')}</${b.ordered ? 'ol' : 'ul'}>`;
  if (b.legend) return `<table class="legend">${b.legend.map(([k, v]) => `<tr><td class="k">${k}</td><td>${v}</td></tr>`).join('')}</table>`;
  if (b.note !== undefined) { const t = tone(ctx, b.tone || ctx.tone); return `<div class="note" style="border-color:${t[0]};background:${t[1]}">${b.note}</div>`; }
  if (b.space !== undefined) return `<div style="height:${b.space}px"></div>`;
  if (b.divider) return `<hr class="divider"/>`;
  throw new Error('unknown block: ' + JSON.stringify(Object.keys(b)));
}
const tone = (ctx, name) => ctx.theme.tones[name] || Object.values(ctx.theme.tones)[0];

function card(c, ctx) {
  const t = tone(ctx, c.tone), header = c.header || ctx.defaultHeader;
  const cctx = { ...ctx, tone: c.tone };
  let head = '';
  const ts = c.titleSize ? ` style="font-size:${c.titleSize}px"` : '';
  if (c.title !== undefined && header !== 'none') {
    const sub = c.sub ? `<div class="csub">${c.sub}</div>` : '';
    if (header === 'bar') head = `<div class="chead bar" style="background:${t[0]}"><h3${ts}>${c.title}</h3>${sub}</div>`;
    else if (header === 'tint') head = `<div class="chead tint" style="background:${t[1]};color:${t[0]}"><h3${ts}>${c.title}</h3>${sub}</div>`;
    else if (header === 'pill') head = `<div class="chead pill"><h3 style="background:${t[1]};${c.titleSize ? `font-size:${c.titleSize}px` : ''}">${c.title}</h3>${sub}</div>`;
    else head = `<div class="chead plain" style="color:${t[0]}"><h3${ts}>${c.title}</h3>${sub}</div>`;
  }
  const style = `${c.bg ? `background:${c.bg};` : ''}${c.border === false ? 'border:none;' : ''}${c.style || ''}`;
  return `<section class="card h-${header}${c.flat ? ' flat' : ''}" style="${style}">${head}<div class="cbody" style="${c.center ? 'justify-content:center;' : ''}${c.bodyStyle || ''}">${(c.body || []).map(b => block(b, cctx)).join('')}</div></section>`;
}

function build(spec) {
  const theme = typeof spec.theme === 'object' ? spec.theme : THEMES[spec.theme || 'classic'];
  if (!theme) throw new Error('unknown theme ' + spec.theme);
  const W = spec.width || 1600, ctx = { theme, defaultHeader: spec.header || (spec.theme === 'sketch' ? 'pill' : spec.theme === 'paper' ? 'bar' : 'plain'), formulaSize: spec.formulaSize || 30, tone: null };
  const rows = (spec.rows || []).map(r => {
    const cols = r.cols || r.cards.map(() => 1);
    const heading = r.heading ? `<div class="rowhead${theme.handTitle ? ' hand' : ''}"><span style="${r.headingBg ? `background:${r.headingBg}` : ''}">${r.heading}</span></div>` : '';
    return `${heading}<div class="row" style="grid-template-columns:${cols.map(x => typeof x === 'number' ? `minmax(0,${x}fr)` : x).join(' ')};gap:${r.gap ?? 28}px;align-items:${r.align || 'stretch'}">${r.cards.map(c => card(c, ctx)).join('')}</div>`;
  }).join('');
  const footer = spec.footer === false ? '' : spec.footer ?? 'Muth Boravy';
  const tn = theme.tones, firstTone = Object.values(tn)[0];
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
${katexCSS()}
${fontFace('Patrick Hand', 'patrick-hand.woff2')}${fontFace('Architects Daughter', 'architects-daughter.woff2')}${fontFace('Kalam', 'kalam.woff2')}${fontFace('Caveat', 'caveat.woff2')}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${W}px;background:${theme.bg};color:${theme.ink};font-family:${theme.body}}
body{${theme.page}}
.wrap{padding:${spec.padding ?? '50px 50px 34px'}}
.logo{position:absolute;left:24px;top:20px}
h1{font-family:${theme.title};font-weight:${theme.titleWeight};font-size:${spec.titleSize || theme.titleSize}px;letter-spacing:${theme.titleSpacing};text-align:center;line-height:1.02}
${theme.handTitle ? `h1 span{background:linear-gradient(transparent 18%,#fbe98a 18%,#fbe98a 88%,transparent 88%);padding:0 28px;border-radius:30px;-webkit-text-stroke:2px ${theme.ink}}` : ''}
.sub{text-align:center;font-size:${spec.subtitleSize || 40}px;line-height:1.3;margin:20px auto 0;max-width:${W - 260}px;color:${theme.muted}}
.row{display:grid;margin-top:${spec.rowGap ?? 30}px}
.rowhead{text-align:center;margin-top:34px;margin-bottom:-10px}
.rowhead span{display:inline-block;font-family:${theme.title};font-size:56px;font-weight:${theme.titleWeight};padding:2px 34px;border-radius:24px;${theme.handTitle ? `background:#e8ddfa;-webkit-text-stroke:1.2px ${theme.ink};` : ''}}
.card{background:${theme.card};border:2px solid ${theme.cardBorder};border-radius:${theme.radius}px;box-shadow:${theme.shadow};display:flex;flex-direction:column;overflow:hidden;min-width:0}
.card.flat{background:transparent;border:none;box-shadow:none}
.chead h3{font-family:${theme.handTitle ? theme.title : theme.title.includes('Charter') ? theme.body : theme.title};font-weight:${theme.handTitle ? 400 : 800};font-size:${spec.cardTitleSize || 46}px;letter-spacing:${theme.handTitle ? '.5px' : '-.8px'};line-height:1.08}
${theme.handTitle ? `.chead h3{-webkit-text-stroke:.9px ${theme.ink}}` : ''}
.chead.bar{color:#fff;padding:18px 30px 16px}
.chead.bar .csub{color:rgba(255,255,255,.92)}
.chead.tint{margin:22px 22px 0;padding:14px 22px;border-radius:12px}
.chead.plain{padding:26px 32px 0}
.chead.pill{padding:22px 24px 0;text-align:center}
.chead.pill h3{display:inline-block;padding:4px 22px;border-radius:16px}
.csub{font-size:${spec.cardSubSize || 30}px;line-height:1.3;margin-top:6px;font-weight:500;letter-spacing:0}
.chead.plain .csub,.chead.tint .csub{color:inherit;font-weight:700;font-size:${(spec.cardSubSize || 30) - 2}px}
.cbody{padding:16px 32px 26px;display:flex;flex-direction:column;gap:14px;flex:1;min-width:0}
.p{font-size:${spec.textSize || 29}px;line-height:1.38;color:${theme.muted}}
.p.small{font-size:${(spec.textSize || 29) - 5}px}
.p .katex,.list .katex,.legend .katex,.csub .katex,.sub .katex,.note .katex{font-size:1.1em}
.bh{font-size:${(spec.textSize || 29) + 1}px;font-weight:700;margin-top:4px}
.formula{border-radius:12px;padding:6px 14px;overflow:hidden;min-width:0}
.formula .katex-display{margin:.45em 0}
.formula .katex-display>.katex{white-space:nowrap}
figure{min-width:0}
figure svg.fig{max-width:100%;height:auto;display:inline-block;overflow:visible}
figcaption{font-size:${(spec.textSize || 29) - 6}px;color:${theme.muted};margin-top:6px;line-height:1.3}
.cols{display:grid;min-width:0}
.col{display:flex;flex-direction:column;gap:12px;min-width:0}
.list{font-size:${spec.textSize || 29}px;line-height:1.4;color:${theme.muted};padding-left:1.1em}
.legend{border-collapse:collapse;font-size:${(spec.textSize || 29) - 3}px;color:${theme.muted}}
.legend td{padding:5px 18px 5px 0;vertical-align:middle}
.legend td.k{color:${theme.ink};white-space:nowrap}
.note{border-left:5px solid;border-radius:10px;padding:12px 18px;font-size:${(spec.textSize || 29) - 3}px;line-height:1.4}
.divider{border:none;border-top:2px solid ${theme.cardBorder};margin:4px 0}
.nb{white-space:nowrap}
.footer{text-align:center;margin-top:34px;font-family:'Inter Display',Inter,sans-serif;font-size:42px;font-weight:800;color:#000;letter-spacing:1px}
.footer.line:before,.footer.line:after{content:"";display:inline-block;width:200px;height:3px;background:#000;vertical-align:middle;margin:0 26px}
.footer.script{font-family:'Caveat',cursive;font-weight:400;font-size:48px;color:#6b645c;letter-spacing:2px}
${spec.css || ''}
</style></head><body><div class="wrap">
${spec.logo ? `<div class="logo">${spec.logo}</div>` : ''}
${spec.title ? `<h1><span>${spec.title}</span></h1>` : ''}
${spec.subtitle ? `<div class="sub">${spec.subtitle}</div>` : ''}
${rows}
${footer ? `<div class="footer ${spec.footerStyle || 'line'}">${esc(footer)}</div>` : ''}
</div>
<script>
// called by the renderer after fonts load: shrink any formula wider than its box
window.__fit = () => {
  const ink = (k) => { let l = Infinity, r = -Infinity; for (const n of k.querySelectorAll('*')) { if (n.children.length || !n.textContent.trim()) continue; const b = n.getBoundingClientRect(); if (b.width) { l = Math.min(l, b.left); r = Math.max(r, b.right); } } return r - l; };
  for (const el of document.querySelectorAll('.fit')) {
    const k = el.querySelector('.katex-html'); if (!k) continue;
    const cs = getComputedStyle(el), avail = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 2;
    for (let i = 0; i < 25; i++) { const w = ink(k); if (w <= avail) break; el.style.fontSize = (parseFloat(getComputedStyle(el).fontSize) * Math.max(.6, avail / w) * .985) + 'px'; }
  }
};
</script></body></html>`;
  return texify(html);
}

async function render(spec, out, { scale = 1.5, html = null } = {}) {
  const page_html = build(spec);
  if (html) fs.writeFileSync(html, page_html);
  const { chromium } = require('playwright');
  const W = spec.width || 1600;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: 1000 }, deviceScaleFactor: scale });
  await page.setContent(page_html, { waitUntil: 'load' });
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.evaluate(() => window.__fit && window.__fit());
  let H = await page.evaluate(() => Math.ceil(document.documentElement.scrollHeight));
  if (spec.height === 'a4' || typeof spec.height === 'number') {
    const target = spec.height === 'a4' ? Math.round(W * Math.SQRT2) : spec.height;
    if (H > target) console.warn(`warning: content is ${H}px tall, more than the ${target}px page; it will be cut off`);
    H = target;
  }
  await page.setViewportSize({ width: W, height: H });
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: W, height: H } });
  await browser.close();
  return { width: W, height: H };
}

module.exports = { build, render, THEMES };
