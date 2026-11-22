// Example (classic theme, tinted headers): Coordinate Systems in 3D.
// node .claude/skills/image-gen/scripts/infographic.cjs .claude/skills/image-gen/examples/coordinate-systems.cjs images/infographics/coordinate-systems.png
module.exports = ({ fig2d: F, fig3d: { Scene } }) => {
  const C = '#b8432c', T = '#1d5a4b', W = 450, H = 430;
  const scene = () => new Scene({ width: W, height: H, scale: 98, elevation: 20, azimuth: 232, center: [0, 0, 1.05] });

  const P = [1.4, 1.6, 1.6];
  const cart = scene();
  cart.polygon([[0, 0, 0], [P[0], 0, 0], [P[0], P[1], 0], [0, P[1], 0]], { fill: 'rgba(184,67,44,.12)', depthBias: 20 });
  cart.box([0, 0, 0], P, { color: '#a59d94' }).axes({ x: 2.4, y: 2.6, z: 2.6, size: 26 }).curve([[P[0], P[1], 0], P], { color: '#1d1a17', dash: '6 5', width: 1.6, onTop: true })
    .point(P, { r: 9, fill: C }).label(P, 'P(x,y,z)', { dx: 66, dy: -4, size: 24 });

  const cyl = scene(), phi = 0.95, rho = 1.35, Pc = [rho * Math.cos(phi), rho * Math.sin(phi), 1.7];
  cyl.cylinder([0, 0, 0], 1.75, 2.6, { fill: 'rgba(29,90,75,.13)' }).axes({ x: 2.5, y: 2.7, z: 3.1, size: 26 })
    .curve([[0, 0, 0], [Pc[0], Pc[1], 0]], { color: '#1d1a17', width: 1.6, dash: '6 5', onTop: true }).curve([[Pc[0], Pc[1], 0], Pc], { color: '#1d1a17', width: 1.6, dash: '6 5', onTop: true })
    .arc([0, 0, 0], [1, 0, 0], [Math.cos(phi), Math.sin(phi), 0], .9, { color: C, width: 2.6, arrow: true })
    .point([Pc[0], Pc[1], 0], { r: 7, fill: T }).point(Pc, { r: 9, fill: C })
    .label(Pc, 'P(\\rho,\\phi,z)', { dx: 66, dy: -6, size: 24 }).label([rho * .55 * Math.cos(phi), rho * .55 * Math.sin(phi), 0], '\\rho', { dy: -16, size: 24 }).label([.95, .45, 0], '\\phi', { dx: 6, dy: 22, size: 26, color: C });

  const sph = scene(), th = 0.62, ph = 0.95, r = 1.6, Ps = [r * Math.sin(th) * Math.cos(ph), r * Math.sin(th) * Math.sin(ph), 1.0 + r * Math.cos(th)], O = [0, 0, 1.0];
  sph.center = [0, 0, 1.0]; sph.wireSphere(O, r, { meridians: [ph * 180 / Math.PI + 90] }).axes({ x: 2.4, y: 2.6, z: 2.25, origin: [0, 0, 1.0], size: 26 })
    .arc(O, [0, 0, 1], [Ps[0], Ps[1], Ps[2] - 1], .75, { color: T, fill: 'rgba(29,90,75,.45)', width: 1.5 })
    .arc(O, [1, 0, 0], [Math.cos(ph), Math.sin(ph), 0], 1.05, { color: C, width: 2.6, arrow: true })
    .curve([O, Ps], { color: '#1d1a17', width: 2.2, onTop: true }).curve([Ps, [Ps[0], Ps[1], 1.0]], { color: '#1d1a17', width: 1.6, dash: '6 5', onTop: true })
    .point(Ps, { r: 9, fill: C }).label(Ps, 'P(r,\\theta,\\phi)', { dx: 60, dy: -16, size: 24 })
    .label([Ps[0] * .55, Ps[1] * .55, 1 + (Ps[2] - 1) * .55], 'r', { dx: 14, size: 24 }).label([0.12, 0.3, 1.8], '\\theta', { size: 26, color: T }).label([1.1, .7, 1.0], '\\phi', { dy: 24, size: 26, color: C });

  const conv = (a, b) => ({ tex: a, box: false, size: 28 });
  return {
    theme: 'classic', header: 'tint', title: 'Coordinate Systems in 3D', titleSize: 88, cardTitleSize: 46,
    subtitle: 'The same point in space can be described in Cartesian, cylindrical, or spherical coordinates, with variables matched to symmetry.', subtitleSize: 32,
    rows: [
      { cols: [1, 1, 1], gap: 24, cards: [
        { title: 'Cartesian', tone: 'coral', flat: true, body: [{ p: '\\((x,y,z)\\)', style: 'font-size:38px;color:#1d1a17' }, { p: 'Three perpendicular linear coordinates.', small: true }, { fig: cart.svg() }] },
        { title: 'Cylindrical', tone: 'teal', flat: true, body: [{ p: '\\((\\rho,\\phi,z)\\)', style: 'font-size:38px;color:#1d1a17' }, { p: 'Radial distance \\(\\rho\\) and angle \\(\\phi\\) in the horizontal plane, with \\(z\\).', small: true }, { fig: cyl.svg() }] },
        { title: 'Spherical', tone: 'coral', flat: true, body: [{ p: '\\((r,\\theta,\\phi)\\)', style: 'font-size:38px;color:#1d1a17' }, { p: 'Radial distance \\(r\\), polar angle \\(\\theta\\) (from the \\(z\\) axis) and azimuthal angle \\(\\phi\\).', small: true }, { fig: sph.svg() }] },
      ] },
      { heading: undefined, cols: [1, 1, 1], gap: 24, cards: [
        { title: 'Cartesian ↔ Cylindrical', titleSize: 34, tone: 'coral', body: [conv(String.raw`\begin{aligned}x&=\rho\cos\phi\\y&=\rho\sin\phi\\z&=z\end{aligned}`), conv(String.raw`\begin{aligned}\rho&=\sqrt{x^2+y^2}\\\phi&=\operatorname{atan2}(y,x)\\z&=z\end{aligned}`)] },
        { title: 'Cartesian ↔ Spherical', titleSize: 34, tone: 'teal', body: [conv(String.raw`\begin{aligned}x&=r\sin\theta\cos\phi\\y&=r\sin\theta\sin\phi\\z&=r\cos\theta\end{aligned}`), conv(String.raw`\begin{aligned}r&=\sqrt{x^2+y^2+z^2}\\\theta&=\arccos\left(\tfrac{z}{r}\right)\\\phi&=\operatorname{atan2}(y,x)\end{aligned}`)] },
        { title: 'Cylindrical ↔ Spherical', titleSize: 34, tone: 'coral', body: [conv(String.raw`\begin{aligned}\rho&=r\sin\theta\\z&=r\cos\theta\\\phi&=\phi\end{aligned}`), conv(String.raw`\begin{aligned}r&=\sqrt{\rho^2+z^2}\\\theta&=\operatorname{atan2}(\rho,z)\\\phi&=\phi\end{aligned}`)] },
      ] },
      { heading: 'Each system is useful when there is symmetry', cols: [1, 1, 1], gap: 24, cards: [
        { title: 'Cartesian', tone: 'coral', header: 'plain', bg: '#f6e4de', body: [{ cols: [{ fig: F.cube({ w: 150, h: 140, s: 80, color: '#e6a08d' }) }, { p: 'Useful for problems with no special symmetry.', small: true }], widths: [1, 1.3] }] },
        { title: 'Cylindrical', tone: 'teal', header: 'plain', bg: '#e2ece7', body: [{ cols: [{ fig: F.cylinderIcon({ w: 130, h: 150, color: '#6f9c90' }) }, { p: 'Suited to cylindrical symmetry, such as cylinders and long wires.', small: true }], widths: [1, 1.3] }] },
        { title: 'Spherical', tone: 'coral', header: 'plain', bg: '#f6e4de', body: [{ cols: [{ fig: F.ball({ w: 140, h: 140, r: 58, color: '#df8f7a', grid: true }) }, { p: 'Suited to spherical symmetry, such as spheres and point sources.', small: true }], widths: [1, 1.3] }] },
      ] },
    ],
    css: '.rowhead{text-align:left;margin-bottom:-14px}.rowhead span{font-size:36px;color:#1d5a4b;padding:0;font-family:Inter,sans-serif;font-weight:800}',
  };
};
