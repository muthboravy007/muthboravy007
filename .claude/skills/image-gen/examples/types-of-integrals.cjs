// Example (paper theme): Types of Integrals.
// node .claude/skills/image-gen/scripts/infographic.cjs .claude/skills/image-gen/examples/types-of-integrals.cjs images/infographics/types-of-integrals.png
module.exports = ({ fig2d: F, fig3d: { Scene, ramp } }) => {
  const W = 400, H = 300;

  // 2. double integral: surface above a region R
  const d = new Scene({ width: W, height: H, scale: 62, elevation: 22, center: [0, 0, 1.1] });
  const R = []; for (let k = 0; k < 60; k++) { const t = 2 * Math.PI * k / 60; R.push([0.3 + 1.05 * Math.cos(t) + .15 * Math.cos(2 * t), 0.2 + 1.35 * Math.sin(t), 0]); }
  d.polygon(R, { fill: '#9fbfaa', stroke: '#3f6e4a', width: 1.6, depthBias: 5 });
  d.graph((x, y) => 1.9 + .45 * Math.sin(1.3 * x) * Math.cos(1.1 * y), { x: [-1.4, 1.8], y: [-1.7, 2.1], nu: 26, nv: 26, cmap: 'mint', grid: 1, gridColor: 'rgba(63,110,74,.55)', opacity: .9 });
  d.curve([[0.3, 0.2, 0], [0.3, 0.2, 1.9 + .45 * Math.sin(.39) * Math.cos(.22)]], { color: '#1f1a16', width: 1.3, dash: '5 4', onTop: true });
  d.axes({ x: 2.4, y: 2.8, z: 3.1, size: 20 }).label([0.3, 0.2, 0], 'R', { size: 22, dy: 26 }).label([1.6, 2.2, 2.4], 'z=f(x,y)', { size: 18 });

  // 3. triple integral: blob E inside a dashed box
  const t = new Scene({ width: W, height: H, scale: 66, elevation: 22, center: [0, 0, 1] });
  t.box([-1.2, -1.2, 0], [1.2, 1.2, 2.2], { color: '#8e7f8a', dash: '4 4' });
  t.surface((u, v) => { const r = 1 + .14 * Math.sin(3 * u) * Math.cos(2 * v); return [1.0 * r * Math.sin(u) * Math.cos(v), 1.05 * r * Math.sin(u) * Math.sin(v), 1.1 + .85 * r * Math.cos(u)]; }, { u: [0, Math.PI], v: [0, 2 * Math.PI], nu: 30, nv: 48, cmap: ramp(['#f6cdb6', '#e79bb0', '#c06aa6', '#8f4790']), colorBy: 'depth', grid: 0, opacity: .92 });
  t.axes({ x: 2.2, y: 2.4, z: 3, size: 20 }).label([0.1, 0.2, 1.3], 'E', { size: 24 });

  // 4. line integral: vector field in a plane, curve C from A to B
  const l = new Scene({ width: W, height: H, scale: 70, elevation: 22, center: [0, .3, .7] });
  for (let i = -2; i <= 2; i++) for (let j = -2; j <= 1; j++) for (const z of [.35, 1.15]) l.arrow([i * .75, j * .9, z], [i * .75 - .1, j * .9 + .55, z + .25], { color: '#b6c6d3', width: 1.5, head: 7 });
  const C = (s) => [1.3 - 2.2 * s, -1.9 + 3.9 * s, 0.4 + 0.8 * Math.sin(Math.PI * s) + .35 * s];
  const pts = []; for (let k = 0; k <= 60; k++) pts.push(C(k / 60));
  l.curve(pts, { color: '#4d7385', width: 4, onTop: true }).arrow(C(.5), C(.56), { color: '#4d7385', width: 4, head: 14 });
  l.axes({ x: 2.2, y: 2.6, z: 2.3, size: 20 }).point(C(0), { r: 7 }).point(C(1), { r: 7 }).label(C(0), 'A', { dx: -16, dy: -18, size: 22 }).label(C(1), 'B', { dx: 12, dy: -18, size: 22 }).label(C(.45), 'C', { dy: -22, size: 22 });

  // 5. surface integral: surface S with flux arrows
  const s = new Scene({ width: W, height: H, scale: 64, elevation: 24, center: [0, 0, .6] });
  const g = (x, y) => .9 * Math.exp(-(x * x + y * y) / 2.2) + .25 * Math.sin(1.5 * x);
  s.graph(g, { x: [-2, 2], y: [-2, 2], nu: 30, nv: 30, cmap: ramp(['#6a9fb2', '#a9cdd4', '#efd8c2', '#f2c3a0']), grid: 3, gridColor: 'rgba(40,70,90,.4)' });
  for (const [x, y] of [[-1, -1], [0, -1.2], [-.6, .2], [.5, -.2], [.4, 1], [1.2, .4], [-1.2, 1.1]]) { const z = g(x, y); s.arrow([x, y, z], [x, y, z + .95], { color: '#c8622c', width: 2.6, head: 11 }); }
  s.label([1.6, -1.8, 0], 'S', { size: 24, dy: 20 });

  const fig1 = F.plot({ w: W, h: H, x: [-.3, 4.2], y: [-.25, 3.2], xlabel: 'x', ylabel: 'y', ticks: { x: [[0, '0'], [1, 'a'], [3.6, 'b']] },
    fills: [{ f: (x) => 1.6 + .7 * Math.sin(1.4 * x - .6) + .1 * x, from: 1, to: 3.6, colors: ['#f2a48a', '#f5cf8f'], opacity: .9 }],
    fns: [{ f: (x) => 1.6 + .7 * Math.sin(1.4 * x - .6) + .1 * x, from: 0, to: 4.2, color: '#c8622c', width: 3.2, label: 'y=f(x)', lx: 2.9, ly: 3.0 }],
    vlines: [{ x: 1, f: (x) => 1.6 + .7 * Math.sin(1.4 * x - .6) + .1 * x }, { x: 3.6, f: (x) => 1.6 + .7 * Math.sin(1.4 * x - .6) + .1 * x }] });
  const fl = (x) => 1.3 + .9 * Math.exp(-((x - 1.4) ** 2) / .7) - .3 * Math.exp(-((x - 3.4) ** 2) / .5);
  const fig6 = F.plot({ w: W, h: H - 40, x: [-.3, 4.6], y: [-.4, 2.6], xlabel: 'x', ylabel: '',
    rects: [{ x0: .3, x1: .9, y: 1.55, fill: '#b9bbd8', stroke: '#3a3d6e' }, { x0: 1.3, x1: 1.95, y: 2.15, fill: '#c5c7e0', stroke: '#3a3d6e' }, { x0: 1.95, x1: 2.6, y: 1.62, fill: '#8e91bf', stroke: '#3a3d6e' }, { x0: 3.5, x1: 4.2, y: .8, fill: '#3a3d6e' }],
    fns: [{ f: fl, from: .3, to: 4.3, color: '#3a3d6e', width: 3 }], points: [{ x: 1.1, y: 0, hollow: true, color: '#1f1a16', r: 7 }, { x: 3.0, y: 0, hollow: true, color: '#1f1a16', r: 7 }] });
  const legend6 = `<div style="display:flex;gap:22px;justify-content:center;font-size:19px;white-space:nowrap;color:#3a332d;margin-top:-4px"><span><span style="display:inline-block;width:26px;height:20px;background:linear-gradient(135deg,#c5c7e0 50%,#8e91bf 50%);border:1.5px solid #3a3d6e;vertical-align:middle;margin-right:6px"></span>measurable set</span><span><span style="display:inline-block;width:16px;height:16px;border:2.5px solid #1f1a16;border-radius:50%;vertical-align:middle;margin-right:6px"></span>null set (measure 0)</span></div>`;

  const card = (n, title, tone, tex, fig, text, extra) => ({ title: `${n}. ${title}`, tone, body: [{ tex, box: false, size: 40 }, { fig }, ...(extra ? [extra] : []), { p: text, small: true }] });
  const icon = (kind, l1, l2, sign) => `<div style="text-align:center;font-size:24px;line-height:1.25;color:#3a332d">${F.icon(kind, { w: 120, h: 74, color: '#c8622c' })}<div>${l1}<br>${l2}</div><div style="font-size:30px;margin-top:4px">\\(${sign}\\)</div></div>`;

  return {
    theme: 'paper', header: 'bar', title: 'Types of Integrals', subtitle: 'The same idea, from curves to volumes and beyond', cardTitleSize: 34, textSize: 27,
    rows: [
      { cols: [1, 1, 1], gap: 24, cards: [
        card(1, 'Single-variable integral', 'rust', String.raw`\int_a^b f(x)\,dx`, fig1, 'Integrates a function over an interval. Gives the area under the curve.'),
        card(2, 'Double integral', 'green', String.raw`\iint_R f(x,y)\,dA`, d.svg(), 'Integrates over a region in the plane. Gives the volume under \\(z=f(x,y)\\).'),
        card(3, 'Triple integral', 'crimson', String.raw`\iiint_E f(x,y,z)\,dV`, t.svg(), 'Integrates over a region in space. Gives the total amount inside a volume.'),
      ] },
      { cols: [1, 1, 1], gap: 24, cards: [
        card(4, 'Line integral', 'slate', String.raw`\int_C \vec F\cdot d\vec r`, l.svg(), 'Integrates a function or vector field along a curve. Gives work, circulation or accumulated change.'),
        card(5, 'Surface integral', 'orange', String.raw`\iint_S \vec F\cdot d\vec S`, s.svg(), 'Integrates a vector field over a surface. Gives the flux through the surface.'),
        card(6, 'Lebesgue integral', 'indigo', String.raw`\int_X f\,d\mu`, fig6, 'Integrates with respect to a measure \\(\\mu\\). A rigorous foundation for probability and modern analysis.', legend6),
      ] },
      { cols: [1], cards: [
        { title: 'A unifying idea', tone: 'sand', header: 'tint', bg: '#f6e6d6', body: [
          { cols: [[{ p: 'All these integrals add up a quantity over a set: length, area, volume, a curve, a surface, or a more general measurable set, with the right notion of "size".' }],
            [`<div style="display:flex;justify-content:space-between;border-left:2px dashed #cdb89c;padding-left:22px">${icon('segment', '1D', 'length', '\\int')}${icon('area', '2D', 'area', '\\iint')}${icon('volume', '3D', 'volume', '\\iiint')}${icon('surface', 'surface', 'flux', '\\iint')}${icon('curve', 'curve', 'work', '\\int')}</div>`]], widths: [1, 1.55] },
        ] },
      ] },
    ],
    css: '.chead.tint h3{font-size:40px}',
  };
};
