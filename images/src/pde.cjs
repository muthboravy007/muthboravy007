// Infographic (classic theme): Partial Differential Equations.
// node .claude/skills/image-gen/scripts/infographic.cjs images/src/pde.cjs images/infographics/pde.png --scale 1.5
module.exports = ({ fig2d: F, fig3d: { Scene, ramp } }) => {
  const C = '#b8432c', T = '#1d5a4b', G = '#a86f12', SL = '#3e5f73', PI = Math.PI;
  const W = 440, H = 320;
  // map x∈[0,1] and the second variable to a box around the origin
  const box = (fz, { yr = 1, zs = 1 } = {}) => (x, y) => [2.4 * x - 1.2, 2.4 * y / yr - 1.2, zs * fz(x, y)];

  // Heat: u = e^{-π² k t} sin πx + 0.4 e^{-9π² k t} sin 3πx  (k chosen so it visibly decays)
  const kh = .06, heat = (x, t) => Math.exp(-PI * PI * kh * t) * Math.sin(PI * x) + .4 * Math.exp(-9 * PI * PI * kh * t) * Math.sin(3 * PI * x);
  const sh = new Scene({ width: W, height: H, scale: 82, elevation: 24, azimuth: 228, center: [0, 0, .6] });
  sh.surface(box(heat, { yr: 2, zs: 1.3 }), { u: [0, 1], v: [0, 2], nu: 36, nv: 36, cmap: ramp(['#f4e6d6', '#f2b38f', '#d9654a', '#9c2f1e']), grid: 4, gridColor: 'rgba(120,40,20,.3)' });
  sh.curve(Array.from({ length: 41 }, (_, i) => box(heat, { yr: 2, zs: 1.3 })(i / 40, 0)), { color: '#7a1d10', width: 3, onTop: true });
  sh.axes({ origin: [-1.2, -1.2, 0], x: 2.9, y: 2.9, z: 2.1, labels: ['x', 't', 'u'], size: 22 });
  sh.label(box(heat, { yr: 2, zs: 1.3 })(.25, 0), 'u(x,0)', { dx: -30, dy: -18, size: 18, color: '#7a1d10' });

  // Wave: standing wave u = sin πx cos πt
  const wave = (x, t) => Math.sin(PI * x) * Math.cos(PI * t) * .8;
  const sw = new Scene({ width: W, height: H, scale: 82, elevation: 24, azimuth: 228, center: [0, 0, 0] });
  sw.surface(box(wave, { yr: 2 }), { u: [0, 1], v: [0, 2], nu: 32, nv: 56, cmap: 'rdbu', grid: 4, gridColor: 'rgba(30,40,70,.3)' });
  sw.axes({ origin: [-1.2, -1.2, 0], x: 2.9, y: 2.9, z: 1.3, labels: ['x', 't', 'u'], size: 22 });

  // Laplace: u = sinh(πy) sin(πx) / sinh(π) on the unit square (hot edge at y = 1)
  const lap = (x, y) => Math.sinh(PI * y) * Math.sin(PI * x) / Math.sinh(PI);
  const sl = new Scene({ width: W, height: H, scale: 82, elevation: 30, azimuth: 318, center: [0, 0, .5] });
  sl.surface(box(lap, { zs: 1.4 }), { u: [0, 1], v: [0, 1], nu: 34, nv: 34, cmap: ramp(['#e3efe9', '#a9cdbf', '#5f9a87', '#1d5a4b']), grid: 4, gridColor: 'rgba(20,60,50,.3)' });
  sl.curve(Array.from({ length: 41 }, (_, i) => box(lap, { zs: 1.4 })(i / 40, 1)), { color: '#0f3a30', width: 3, onTop: true });
  sl.axes({ origin: [-1.2, -1.2, 0], x: 2.9, y: 0, z: 1.9, labels: ['x', '', 'u'], size: 22 });
  sl.arrow([-1.2, -1.2, 0], [-1.2, 1.75, 0], { color: '#1d1a17', width: 1.8, head: 10, onTop: false });
  sl.label(box(lap, { zs: 1.4 })(.5, 1), 'u=\\sin\\pi x', { dx: 10, dy: -22, size: 18, color: '#0f3a30' });

  // Conics for the classification
  const conic = (kind, color) => {
    let d = '';
    if (kind === 'e') d = `<ellipse cx="60" cy="40" rx="42" ry="24" fill="none" stroke="${color}" stroke-width="3"/>`;
    if (kind === 'p') d = `<path d="M18 10 Q60 110 102 10" fill="none" stroke="${color}" stroke-width="3"/>`;
    if (kind === 'h') d = `<path d="M14 6 Q48 40 14 74 M106 6 Q72 40 106 74" fill="none" stroke="${color}" stroke-width="3"/>`;
    return F.wrap(120, 80, d);
  };
  const cls = (name, cond, eq, kind, color, bg) => `<div class="cl" style="background:${bg}">${conic(kind, color)}<b style="color:${color}">${name}</b><div class="cc">\\(${cond}\\)</div><div class="ce">\\(${eq}\\)</div></div>`;

  // Boundary/initial conditions: a heated rod
  const rod = F.wrap(440, 190, `<defs><linearGradient id="rodg" x1="0" x2="1"><stop offset="0" stop-color="#5f8fb0"/><stop offset=".5" stop-color="#e2553c"/><stop offset="1" stop-color="#f2c08a"/></linearGradient></defs>
    <rect x="70" y="78" width="300" height="36" rx="18" fill="url(#rodg)" stroke="#5a3a30" stroke-width="1.6"/>
    <line x1="70" y1="60" x2="70" y2="132" stroke="${SL}" stroke-width="5"/><line x1="370" y1="60" x2="370" y2="132" stroke="${G}" stroke-width="5" stroke-dasharray="7 5"/>
    ${F.arrow(220, 30, 220, 72, { color: C, width: 2.4 })}
    <text x="220" y="20" text-anchor="middle" font-size="16" fill="${C}" font-family="Inter">initial state u(x,0)=f(x)</text>
    <text x="70" y="160" text-anchor="middle" font-size="16" fill="${SL}" font-family="Inter" font-weight="700">Dirichlet</text><text x="70" y="180" text-anchor="middle" font-size="15" fill="${SL}" font-family="Inter">value fixed</text>
    <text x="370" y="160" text-anchor="middle" font-size="16" fill="${G}" font-family="Inter" font-weight="700">Neumann</text><text x="370" y="180" text-anchor="middle" font-size="15" fill="${G}" font-family="Inter">flux fixed</text>
    <text x="40" y="102" text-anchor="end" font-size="17" fill="#3b3733" font-family="Inter">x=0</text><text x="400" y="102" font-size="17" fill="#3b3733" font-family="Inter">x=L</text>`);

  // Finite-difference stencil
  const stencil = (() => {
    const x0 = 50, y0 = 200, dx = 52, dy = 46; let g = '';
    for (let j = 0; j < 7; j++) g += `<line x1="${x0 + j * dx}" y1="${y0 - 3.4 * dy}" x2="${x0 + j * dx}" y2="${y0 + 6}" stroke="#d9d1c6" stroke-width="1.2"/>`;
    for (let n = 0; n < 4; n++) g += `<line x1="${x0 - 6}" y1="${y0 - n * dy}" x2="${x0 + 6 * dx + 6}" y2="${y0 - n * dy}" stroke="#d9d1c6" stroke-width="1.2"/>`;
    for (let j = 0; j < 7; j++) for (let n = 0; n < 4; n++) g += `<circle cx="${x0 + j * dx}" cy="${y0 - n * dy}" r="4" fill="#bdb3a6"/>`;
    const P = (j, n) => [x0 + j * dx, y0 - n * dy];
    for (const j of [2, 3, 4]) { const [a, b] = P(j, 1), [c, d] = P(3, 2); g += F.arrow(a, b, c + (a - c) * .18, d + (b - d) * .18, { color: T, width: 2.2, head: 9 }); g += `<circle cx="${a}" cy="${b}" r="9" fill="${T}"/>`; }
    const [cx, cy] = P(3, 2); g += `<circle cx="${cx}" cy="${cy}" r="11" fill="${C}"/>`;
    g += F.texSVG(P(2, 1)[0], P(2, 1)[1] + 24, 'u_{j-1}^n', { size: 17, color: T }) + F.texSVG(P(3, 1)[0], P(3, 1)[1] + 24, 'u_{j}^n', { size: 17, color: T }) + F.texSVG(P(4, 1)[0], P(4, 1)[1] + 24, 'u_{j+1}^n', { size: 17, color: T }) + F.texSVG(cx + 22, cy - 18, 'u_j^{n+1}', { size: 18, color: C, anchor: 'start' });
    g += F.arrow(x0 - 30, y0, x0 - 30, y0 - 3.6 * dy, { width: 1.8, head: 8 }) + F.texSVG(x0 - 30, y0 - 3.6 * dy - 12, 't', { size: 18 }) + F.arrow(x0, y0 + 24, x0 + 6.4 * dx, y0 + 24, { width: 1.8, head: 8 }) + F.texSVG(x0 + 6.4 * dx + 14, y0 + 24, 'x', { size: 18 });
    return F.wrap(420, 240, g);
  })();

  const eqCard = (title, sub, tone, eq, fig, rows) => ({ title, sub, tone, body: [{ tex: eq, bg: '#f3ede6', size: 34 }, { fig }, { legend: rows }] });

  return {
    theme: 'classic', header: 'bar', title: 'Partial Differential Equations', titleSize: 90,
    subtitle: 'Equations that relate the rates of change of a quantity in space and time, the language of heat, waves, fields and flow.', subtitleSize: 32,
    cardTitleSize: 40, cardSubSize: 25, textSize: 26, formulaSize: 30,
    rows: [
      { cols: [1.05, 1], gap: 26, cards: [
        { title: 'What is a PDE?', tone: 'teal', header: 'plain', body: [
          { p: 'An equation for an unknown function of <b>two or more</b> variables, \\(u(x,y,\\dots,t)\\), that involves its <b>partial derivatives</b>.' },
          { tex: String.raw`F\big(x,t,u,\,u_x,\,u_t,\,u_{xx},\,u_{xt},\,u_{tt},\dots\big)=0`, bg: '#e7f0ec' },
          { legend: [['\\(u_x=\\dfrac{\\partial u}{\\partial x}\\)', 'rate of change in one variable, others held fixed'], ['<b>Order</b>', 'highest derivative that appears (heat and wave: 2)'], ['<b>Linear</b>', '\\(u\\) and its derivatives appear only to the first power'], ['<b>ODE vs PDE</b>', 'ODE: one variable \\(y(t)\\). PDE: several, \\(u(x,t)\\)']] },
        ] },
        { title: 'Classification (2nd order)', tone: 'coral', header: 'plain', body: [
          { tex: String.raw`A\,u_{xx}+2B\,u_{xy}+C\,u_{yy}+\dots=0`, bg: '#fbebe6' },
          { p: 'The sign of \\(B^2-AC\\) decides the type, just like the conic \\(Ax^2+2Bxy+Cy^2\\):', small: true },
          `<div class="cls">${cls('Elliptic', 'B^2-AC<0', '\\nabla^2u=0', 'e', T, '#e7f0ec')}${cls('Parabolic', 'B^2-AC=0', 'u_t=k\\,u_{xx}', 'p', G, '#fbf1dc')}${cls('Hyperbolic', 'B^2-AC>0', 'u_{tt}=c^2u_{xx}', 'h', C, '#fbebe6')}</div>`,
          { p: 'Elliptic: equilibrium. Parabolic: diffusion, smoothing. Hyperbolic: waves that travel at finite speed.', small: true },
        ] },
      ] },
      { heading: 'The three classic equations', cols: [1, 1, 1], gap: 24, cards: [
        eqCard('Heat equation', 'Parabolic: diffusion', 'gold', String.raw`\frac{\partial u}{\partial t}=k\,\frac{\partial^2 u}{\partial x^2}`, sh.svg(),
          [['\\(u\\)', 'temperature'], ['\\(k\\)', 'diffusivity'], ['Meaning', 'heat flows from hot to cold; peaks flatten, sharp parts (high modes) fade fastest']]),
        eqCard('Wave equation', 'Hyperbolic: vibration', 'coral', String.raw`\frac{\partial^2 u}{\partial t^2}=c^2\,\frac{\partial^2 u}{\partial x^2}`, sw.svg(),
          [['\\(u\\)', 'displacement'], ['\\(c\\)', 'wave speed'], ['Meaning', 'a plucked string oscillates; energy is kept, shapes travel at speed \\(c\\)']]),
        eqCard('Laplace equation', 'Elliptic: equilibrium', 'teal', String.raw`\nabla^2u=\frac{\partial^2 u}{\partial x^2}+\frac{\partial^2 u}{\partial y^2}=0`, sl.svg(),
          [['\\(u\\)', 'steady temperature / potential'], ['Rule', 'each point is the average of its neighbours'], ['Meaning', 'no time: the final state set by the boundary values']]),
      ] },
      { cols: [1, 1.15, 1], gap: 24, cards: [
        { title: 'Conditions make it solvable', tone: 'slate', body: [
          { fig: rod },
          { legend: [['Initial', '\\(u(x,0)=f(x)\\) (and \\(u_t(x,0)\\) for waves)'], ['Dirichlet', '\\(u=g\\) on the boundary'], ['Neumann', '\\(\\partial u/\\partial n=h\\) on the boundary']] },
          { p: 'A <b>well-posed</b> problem has a solution that exists, is unique, and depends continuously on the data.', small: true },
        ] },
        { title: 'Separation of variables', tone: 'gold', body: [
          { p: 'Heat equation on \\([0,L]\\) with \\(u(0,t)=u(L,t)=0\\). Try \\(u=X(x)\\,T(t)\\):', small: true },
          { tex: String.raw`\frac{T'}{k\,T}=\frac{X''}{X}=-\lambda`, bg: '#fbf1dc', size: 28 },
          { tex: String.raw`X_n=\sin\frac{n\pi x}{L},\qquad T_n=e^{-k\left(\frac{n\pi}{L}\right)^2t}`, bg: '#fbf1dc', size: 28 },
          { tex: String.raw`u(x,t)=\sum_{n=1}^{\infty} b_n\,\sin\frac{n\pi x}{L}\,e^{-k\left(\frac{n\pi}{L}\right)^2t}`, bg: '#fbf1dc', size: 28 },
          { p: 'with Fourier coefficients \\(b_n=\\dfrac{2}{L}\\displaystyle\\int_0^L f(x)\\sin\\frac{n\\pi x}{L}\\,dx\\).', small: true },
        ] },
        { title: 'Solving numerically', tone: 'teal', body: [
          { fig: stencil },
          { tex: String.raw`u_j^{n+1}=u_j^n+r\left(u_{j+1}^n-2u_j^n+u_{j-1}^n\right)`, bg: '#e7f0ec', size: 27 },
          { p: 'Finite differences replace derivatives on a grid, \\(r=k\\,\\Delta t/\\Delta x^2\\). This explicit scheme is stable when \\(r\\le\\tfrac12\\).', small: true },
        ] },
      ] },
      { cols: [1], cards: [
        { title: 'Where PDEs appear', tone: 'ink', header: 'plain', body: [
          `<div class="apps">${[['Heat & diffusion', 'u_t=k\\nabla^2u', 'cooling, chemical spread, option pricing (Black–Scholes)'], ['Waves', 'u_{tt}=c^2\\nabla^2u', 'sound, light, earthquakes, guitar strings'], ['Potentials', '\\nabla^2\\phi=-\\rho/\\varepsilon_0', 'electrostatics, gravity, steady flow'], ['Fluids', '\\rho\\,\\tfrac{D\\mathbf v}{Dt}=-\\nabla p+\\mu\\nabla^2\\mathbf v', 'Navier–Stokes: weather, aircraft, blood'], ['Quantum', 'i\\hbar\\,\\psi_t=-\\tfrac{\\hbar^2}{2m}\\nabla^2\\psi+V\\psi', 'Schrödinger: atoms, molecules, chips']].map(([a, b, c]) => `<div class="app"><b>${a}</b><div>\\(${b}\\)</div><span>${c}</span></div>`).join('')}</div>`,
        ] },
      ] },
    ],
    css: `.rowhead span{font-family:'Inter Display',Inter,sans-serif;font-size:42px;font-weight:800;color:#1d1a17}
.cls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.cl{border-radius:12px;padding:10px 8px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:4px}
.cl b{font-size:25px}.cc{font-size:21px}.ce{font-size:21px;color:#3b3733}
.legend td{font-size:23px}.legend td.k{font-weight:700}
.apps{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px}
.app{background:#efebe5;border-radius:12px;padding:12px 12px;text-align:center;display:flex;flex-direction:column;gap:6px}
.app b{font-size:24px;color:#b8432c}.app div{font-size:22px;white-space:nowrap}.app span{font-size:19px;color:#3b3733;line-height:1.3}`,
  };
};
