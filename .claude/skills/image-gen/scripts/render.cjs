#!/usr/bin/env node
// Offline, free image engine: renders an .svg or .html file to PNG/JPEG/WebP-less PNG
// with the local headless Chromium (Playwright). No network, no API key.
//
// Usage: node render.cjs <input.svg|input.html> <output.png|.jpg> [--width 1024] [--height 1024] [--scale 1] [--transparent] [--full]
// --full: capture the whole page height (for tall HTML posters); --height is then ignored.
const fs = require('fs');
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); }
catch { console.error('error: playwright is not installed (npm i -g playwright && npx playwright install chromium)'); process.exit(1); }

const args = process.argv.slice(2);
const pos = args.filter((a, i) => !a.startsWith('--') && !(args[i - 1] || '').match(/^--(width|height|scale)$/));
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? Number(args[i + 1]) : d; };
const [input, output] = pos;
if (!input || !output) { console.error('usage: node render.cjs <in.svg|in.html> <out.png|out.jpg> [--width W] [--height H] [--scale S] [--transparent]'); process.exit(2); }
const transparent = args.includes('--transparent');
const full = args.includes('--full');
const src = fs.readFileSync(input, 'utf8');
const isSvg = input.toLowerCase().endsWith('.svg');

let width = opt('width', 0), height = opt('height', 0);
if (isSvg && (!width || !height)) {
  const vb = src.match(/viewBox\s*=\s*["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/);
  const w = src.match(/<svg[^>]*\swidth\s*=\s*["']([\d.]+)/), h = src.match(/<svg[^>]*\sheight\s*=\s*["']([\d.]+)/);
  width = width || Number(w?.[1] || vb?.[1] || 1024);
  height = height || Number(h?.[1] || vb?.[2] || 1024);
}
width = width || 1024; height = height || 1024;

const bg = transparent ? 'transparent' : 'white';
const html = isSvg
  ? `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:${bg};overflow:hidden}svg{display:block;width:${width}px;height:${height}px}</style></head><body>${src}</body></html>`
  : src;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: opt('scale', 1) });
  await page.setContent(html, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.evaluate(() => document.fonts && document.fonts.ready);
  // optional page hook: lets a page fit/measure itself once fonts are loaded
  await page.evaluate(() => (typeof window.__fit === 'function' ? window.__fit() : null));
  if (full) {
    height = await page.evaluate(() => Math.ceil(document.documentElement.scrollHeight));
    await page.setViewportSize({ width, height });
  }
  fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
  const jpeg = /\.jpe?g$/i.test(output);
  await page.screenshot({ path: output, type: jpeg ? 'jpeg' : 'png', quality: jpeg ? 92 : undefined,
    omitBackground: transparent && !jpeg, clip: { x: 0, y: 0, width, height } });
  await browser.close();
  console.log(output);
})().catch(e => { console.error('error:', e.message); process.exit(1); });
