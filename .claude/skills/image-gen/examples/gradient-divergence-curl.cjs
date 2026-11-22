// Example (classic theme): Gradient, Divergence and Curl.
// node .claude/skills/image-gen/scripts/infographic.cjs .claude/skills/image-gen/examples/gradient-divergence-curl.cjs images/infographics/gradient-divergence-curl.png
module.exports = ({ fig2d: F, fig3d: { Scene, tube } }) => {
  const C = '#b8432c', T = '#1d5a4b';

  // Gradient: bump surface drawn in polar coordinates, so the mesh shows level circles
  const g = new Scene({ width: 440, height: 330, scale: 92, elevation: 22, center: [0, 0, .55] });
  g.surface((r, t) => [r * Math.cos(t), r * Math.sin(t), 1.35 * Math.exp(-r * r * 1.6)], { u: [0, 2.1], v: [0, 2 * Math.PI], nu: 30, nv: 60, cmap: 'coral', grid: 3, gridColor: 'rgba(150,60,40,.35)' });
  g.axes({ length: 0, x: 2.4, y: 2.5, z: 0 }).arrow([-1.9, -2.2, 0], [-1.9, -2.2, 1.25], { color: '#1d1a17', width: 1.8, head: 10 }).label([-1.9, -2.2, 1.25], 'z', { size: 22, dx: 14 });
  g.arrow([0.15, 0.45, 1.0], [0.55, 1.45, 2.2], { color: C, width: 3.2, label: '\\nabla\\phi', labelSize: 26 });

  // Curl: rings of arrows in the xy-plane around the z axis
  const c = new Scene({ width: 440, height: 330, scale: 78, elevation: 26, center: [0, 0, .5] });
  c.axes({ x: 2.6, y: 2.6, z: 2.2, neg: 0 });
  for (const r of [0.55, 1.0, 1.45, 1.9]) {
    const n = Math.round(6 + r * 6), P = (t) => [r * Math.cos(t), r * Math.sin(t), 0.45];
    for (let k = 0; k < n; k++) { const t = 2 * Math.PI * k / n; c.arrow(P(t), P(t + 2 * Math.PI / n * .62), { color: C, width: 2, head: 9 }); }
  }

  // Divergence example: lit cube with arrows leaving every face
  const d = new Scene({ width: 300, height: 260, scale: 70, elevation: 22, azimuth: 235 });
  d.box([-.75, -.75, -.75], [.75, .75, .75], { fill: '#a9cdbf', color: 'rgba(29,90,75,.35)', dash: null, width: 1 });
  const out = [[1, 0, 0], [0, 1, 0], [0, 0, 1], [-1, 0, 0], [0, -1, 0], [0, 0, -1], [1, 1, 1], [-1, 1, 1], [1, -1, 1], [1, 1, -1], [-1, -1, 1], [1, -1, -1]];
  for (const v of out) { const n = Math.hypot(...v), u = v.map(x => x / n); d.arrow(u.map(x => x * 1.0), u.map(x => x * 1.75), { color: T, width: 2.2, head: 10 }); }

  // Application: a blood vessel as a lit tube, with flow arrows and a swirl at the open end
  const vessel = (t) => [-3 + 6 * t, 0.5 * Math.sin(2.4 * t), 0.35 * Math.sin(3 * t)];
  const v = new Scene({ width: 760, height: 280, scale: 112, elevation: 16, azimuth: 352, center: [0, 0, 0] });
  v.surface(tube(vessel, (t) => 0.62 + 0.06 * Math.sin(5 * t)), { u: [0, 1], v: [0, 2 * Math.PI], nu: 70, nv: 30, color: '#d77b62', grid: 0, opacity: .96 });
  for (const lane of [-0.25, 0, 0.25]) for (let k = 0; k < 9; k++) { const t = .06 + k * .1, p = vessel(t), q = vessel(t + .05); v.arrow([p[0], p[1], p[2] + lane * 1.4], [q[0], q[1], q[2] + lane * 1.4], { color: '#fff4ee', width: 1.8, head: 9 }); }
  const end = vessel(1);
  v.circle(end, [1, 0.25, 0], 0.64, { color: '#8e2f22', width: 3, onTop: true });
  for (const r of [0.18, 0.34, 0.5]) for (let k = 0; k < 6; k++) { const t = 2 * Math.PI * k / 6, P = (s) => [end[0] + 0.02, end[1] + r * Math.cos(s), end[2] + r * Math.sin(s)]; v.arrow(P(t), P(t + .7), { color: '#fff4ee', width: 1.6, head: 7 }); }

  const ex = (body) => ({ h: 'Example', tone: undefined, ...body });
  return {
    theme: 'classic', header: 'bar', title: 'Gradient, Divergence and Curl',
    subtitle: 'Three operators that reveal how fields change in space.',
    rows: [
      { cols: [1, 1, 1], gap: 26, cards: [
        { title: 'Gradient', sub: 'Direction of steepest increase of a scalar field.', tone: 'coral', body: [
          { fig: g.svg() },
          { tex: String.raw`\nabla\phi=\left(\frac{\partial\phi}{\partial x},\frac{\partial\phi}{\partial y},\frac{\partial\phi}{\partial z}\right)`, bg: '#f3ede6' },
          { p: 'Points toward the direction of maximum increase of \\(\\phi\\). Its magnitude gives the rate of increase.' },
          ex({ h: 'Example', tone: 'coral' }), { p: '\\(\\phi(x,y,z)=x^2+y^2\\)' },
          { cols: [[{ fig: F.contours({ w: 210, h: 200, f: (x, y) => x * x + y * y, levels: [.15, .45, .9, 1.5, 2.3, 3.2], color: C, axes: true, extra: [0, 1, 2, 3, 4, 5, 6, 7].map(k => { const t = k * Math.PI / 4, cx = 105, cy = 100; return F.arrow(cx + 30 * Math.cos(t), cy - 30 * Math.sin(t), cx + 62 * Math.cos(t), cy - 62 * Math.sin(t), { color: C, width: 1.8, head: 7 }); }).join('') }) }],
            [{ p: '\\(\\nabla\\phi=(2x,2y,0)\\)' }, { p: 'Gradient vectors point radially outward and are longer farther from the origin.', small: true }]], widths: [1, 1.1] },
        ] },
        { title: 'Divergence', sub: 'Net outward flow from a point.', tone: 'teal', body: [
          { fig: F.radial({ w: 400, h: 330, n: 20, r: 52, len: 86, color: T, ball: '#a9cdbf' }) },
          { tex: String.raw`\nabla\cdot\mathbf F=\frac{\partial F_x}{\partial x}+\frac{\partial F_y}{\partial y}+\frac{\partial F_z}{\partial z}`, bg: '#f3ede6' },
          { p: 'Measures the net outward flux per unit volume. Positive: source (outflow). Negative: sink (inflow). Zero: neither.' },
          { h: 'Example', tone: 'teal' }, { p: '\\(\\mathbf F(x,y,z)=(x,y,z)\\)' },
          { cols: [[{ fig: d.svg() }], [{ p: '\\(\\nabla\\cdot\\mathbf F=3\\)' }, { p: 'A positive divergence indicates a source.', small: true }]], widths: [1.2, 1] },
        ] },
        { title: 'Curl', sub: 'Local rotation of a vector field around a point.', tone: 'coral', body: [
          { fig: c.svg() },
          { tex: String.raw`\begin{aligned}\nabla\times\mathbf F=\Big(&\frac{\partial F_z}{\partial y}-\frac{\partial F_y}{\partial z},\\&\frac{\partial F_x}{\partial z}-\frac{\partial F_z}{\partial x},\ \frac{\partial F_y}{\partial x}-\frac{\partial F_x}{\partial y}\Big)\end{aligned}`, bg: '#f3ede6', size: 27 },
          { p: 'Measures the local rotational strength of the field. Direction by the right-hand rule. Zero: no local rotation.' },
          { h: 'Example', tone: 'coral' }, { p: '\\(\\mathbf F(x,y,z)=(-y,x,0)\\)' },
          { cols: [[{ fig: F.swirl({ w: 230, h: 190, rings: 4, rmin: 22, rmax: 100, tilt: .62, per: 8, axes: true }) }], [{ p: '\\(\\nabla\\times\\mathbf F=(0,0,2)\\)' }, { p: 'A positive curl indicates rotation around the \\(z\\) axis.', small: true }]], widths: [1.15, 1] },
        ] },
      ] },
      { cols: [1], cards: [
        { title: 'Application: Blood flow in the body', tone: 'teal', header: 'plain', body: [
          { cols: [[{ p: 'These operators help analyse blood circulation in vessels. Divergence identifies regions of inflow and outflow, and curl highlights rotational patterns that can signal irregular or disturbed flow.' }], [{ fig: v.svg() }]], widths: [1, 1.25] },
        ] },
      ] },
    ],
  };
};
