#!/usr/bin/env node
// Infographic engine CLI: renders a poster spec (a .cjs file) to PNG.
//   node .claude/skills/image-gen/scripts/infographic.cjs <spec.cjs> <out.png> [--scale 1.5] [--html out.html]
// The spec module exports either a spec object or a function (lib) => spec, where lib gives access to
// { fig2d, fig3d, tex, THEMES }. See SKILL.md "Engine: infographic" and the examples/ folder.
const path = require('path');
const lib = {
  fig2d: require('./infographic/fig2d.cjs'),
  fig3d: require('./infographic/fig3d.cjs'),
  tex: require('./infographic/tex.cjs'),
  ...require('./infographic/layout.cjs'),
};
module.exports = lib;

if (require.main === module) {
  const argv = process.argv.slice(2);
  const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
  const pos = argv.filter((a, i) => !a.startsWith('--') && !(argv[i - 1] || '').startsWith('--'));
  if (pos.length < 2) { console.error('usage: node infographic.cjs <spec.cjs> <out.png> [--scale 1.5] [--html out.html] [--pdf out.pdf]'); process.exit(2); }
  let spec = require(path.resolve(pos[0]));
  if (typeof spec === 'function') spec = spec(lib);
  const o = { scale: Number(opt('scale', 1.5)), html: opt('html', null), pdf: opt('pdf', null) };
  (spec.pages ? lib.renderPages(spec, pos[1], o).then(fs => { fs.forEach(f => console.log(`${f.file}  (${f.width}×${f.height} css px)`)); if (o.pdf) console.log(o.pdf); })
    : lib.render(spec, pos[1], o).then(({ width, height }) => console.log(`${pos[1]}  (${width}×${height} css px, scale ${o.scale})`)))
    .catch(e => { console.error('error:', e.message); process.exit(1); });
}
