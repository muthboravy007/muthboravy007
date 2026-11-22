// Infographic (classic theme): Numerical methods for the 3D neutron transport equation.
// node .claude/skills/image-gen/scripts/infographic.cjs images/src/neutron-transport.cjs images/infographics/neutron-transport.png --scale 1.5
module.exports = ({ fig2d: F, fig3d: { Scene, ramp, vec } }) => {
  const C = '#b8432c', T = '#1d5a4b', G = '#a86f12', SL = '#3e5f73', PL = '#7a3a64', INK = '#1d1a17';
  let seed = 11; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

  // ---------- phase space: a point r in a 3D region, direction Ω, energy ----------
  const ps = new Scene({ width: 430, height: 350, offset: [0, 14], scale: 72, elevation: 22, azimuth: 232, center: [0, 0, 1.1] });
  ps.box([-1.3, -1.3, 0], [1.3, 1.3, 2.4], { color: '#a59d94' }).axes({ origin: [-1.3, -1.3, 0], x: 3.1, y: 3.1, z: 2.6, size: 22 });
  const r0 = [0.1, -0.2, 1.0];
  ps.wireSphere(r0, .62, { color: '#9fc3b6', meridians: [0] });
  ps.arrow(r0, [0.65, 0.9, 1.75], { color: C, width: 3.4, label: '\\boldsymbol\\Omega', labelSize: 26 });
  ps.point(r0, { r: 7, fill: INK }).label(r0, '\\mathbf r', { dx: -18, dy: 14, size: 24 });

  // ---------- S_N: level-symmetric S8 directions on the unit sphere ----------
  const mu = [0.2182179, 0.5773503, 0.7867958, 0.9511897];
  const sn = new Scene({ width: 330, height: 300, scale: 108, elevation: 20, azimuth: 232, center: [0, 0, 0] });
  sn.surface((a, b) => [Math.sin(a) * Math.cos(b), Math.sin(a) * Math.sin(b), Math.cos(a)], { u: [0, Math.PI], v: [0, 2 * Math.PI], nu: 20, nv: 40, cmap: ramp(['#eef4f1', '#cfe2da']), grid: 0, opacity: .55, lit: true });
  for (const sx of [1, -1]) for (const sy of [1, -1]) for (const sz of [1, -1]) for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    const k = 6 - (i + 1) - (j + 1) - 1; if (k < 0 || k > 3) continue;
    const p = [sx * mu[i], sy * mu[j], sz * mu[k]], front = sn.depth(p) < 0;
    sn.point(p, { r: front ? 5 : 3.5, fill: front ? T : '#9fc3b6', stroke: front ? '#fff' : 'none', width: 1.2, onTop: front });
  }
  sn.arrow([0, 0, 0], [mu[1], mu[1], mu[1]].map(v => v * 1.35), { color: C, width: 2.6, label: '\\boldsymbol\\Omega_m', labelSize: 20 });

  // ---------- S_N spatial sweep on a mesh ----------
  const sweep = (() => {
    const n = 7, s = 38, x0 = 30, y0 = 20; let g = '';
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const d = i + (n - 1 - j), done = d < 6, front = d === 6;
      g += `<rect x="${x0 + i * s}" y="${y0 + j * s}" width="${s}" height="${s}" fill="${front ? '#f2b38f' : done ? '#cfe2da' : '#fff'}" stroke="#b9b0a4" stroke-width="1.2"/>`;
    }
    g += F.arrow(x0 + 20, y0 + n * s + 22, x0 + 120, y0 + n * s - 60, { color: C, width: 3, head: 13 }) + F.texSVG(x0 + 132, y0 + n * s - 72, '\\boldsymbol\\Omega_m', { size: 20, color: C, anchor: 'start' });
    g += `<text x="${x0 + n * s + 10}" y="${y0 + 40}" font-size="15" font-family="Inter" fill="#3b3733">swept</text><rect x="${x0 + n * s + 62}" y="${y0 + 28}" width="16" height="16" fill="#cfe2da" stroke="#b9b0a4"/>`;
    g += `<text x="${x0 + n * s + 10}" y="${y0 + 70}" font-size="15" font-family="Inter" fill="#3b3733">front</text><rect x="${x0 + n * s + 62}" y="${y0 + 58}" width="16" height="16" fill="#f2b38f" stroke="#b9b0a4"/>`;
    return F.wrap(380, 330, g);
  })();

  // ---------- MOC: pin cell with characteristic tracks ----------
  const moc = (() => {
    const L = 260, x0 = 40, y0 = 20, cx = x0 + L / 2, cy = y0 + L / 2; let g = `<defs><clipPath id="pc"><rect x="${x0}" y="${y0}" width="${L}" height="${L}"/></clipPath></defs>`;
    g += `<rect x="${x0}" y="${y0}" width="${L}" height="${L}" fill="#d6e6f0" stroke="#3e5f73" stroke-width="2"/>`;
    g += `<circle cx="${cx}" cy="${cy}" r="84" fill="#e9b9a6" stroke="#8a4a38" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="70" fill="#d77b62"/><circle cx="${cx}" cy="${cy}" r="45" fill="#c8553a"/>`;
    const th = 0.52, ux = Math.cos(th), uy = -Math.sin(th);
    for (let k = -8; k <= 8; k++) { const ox = cx - uy * k * 18, oy = cy + ux * k * 18; g += `<line clip-path="url(#pc)" x1="${ox - ux * 400}" y1="${oy - uy * 400}" x2="${ox + ux * 400}" y2="${oy + uy * 400}" stroke="${k === 1 ? INK : 'rgba(29,26,23,.35)'}" stroke-width="${k === 1 ? 2.6 : 1.1}"/>`; }
    // segment boundaries on the highlighted track
    const ox = cx - uy * 18, oy = cy + ux * 18;
    for (const R of [84, 70, 45]) { const b = ux * (ox - cx) + uy * (oy - cy), c = (ox - cx) ** 2 + (oy - cy) ** 2 - R * R, d = b * b - c; if (d > 0) for (const sg of [-1, 1]) { const t = -b + sg * Math.sqrt(d); g += `<circle cx="${ox + ux * t}" cy="${oy + uy * t}" r="4.5" fill="#fff" stroke="${INK}" stroke-width="1.6"/>`; } }
    g += F.arrow(x0 + 18, y0 + L + 28, x0 + 110, y0 + L - 25, { color: C, width: 2.6, head: 11 }) + F.texSVG(x0 + 120, y0 + L - 34, 's', { size: 20, color: C, anchor: 'start' });
    g += `<text x="${x0 + L + 12}" y="${cy - 30}" font-size="15" font-family="Inter" fill="#8a4a38">fuel</text><text x="${x0 + L + 12}" y="${y0 + 30}" font-size="15" font-family="Inter" fill="#3e5f73">moderator</text>`;
    return F.wrap(390, 330, g);
  })();

  // ---------- diffusion / nodal: 3D core power shape φ ∝ cos(πx/2a) cos(πy/2a) ----------
  const core = new Scene({ width: 420, height: 300, scale: 118, elevation: 28, azimuth: 225, center: [0, 0, .5] });
  core.graph((x, y) => 1.2 * Math.cos(PI2(x)) * Math.cos(PI2(y)), { x: [-1, 1], y: [-1, 1], nu: 8, nv: 8, cmap: 'jet', grid: 1, gridColor: 'rgba(20,20,40,.55)', gridWidth: 1.2 });
  function PI2(v) { return Math.PI * v / 2.2; }

  // ---------- Monte Carlo: neutron histories in a 3D box ----------
  const mc = new Scene({ width: 420, height: 330, scale: 74, elevation: 20, azimuth: 232, center: [0, 0, 1.1] });
  mc.box([-1.5, -1.5, 0], [1.5, 1.5, 2.3], { color: '#a59d94' });
  const hist = (start, steps, col) => {
    let p = start; const pts = [p];
    for (let k = 0; k < steps; k++) {
      const u = 2 * rnd() - 1, ph = 2 * Math.PI * rnd(), s = .35 - Math.log(rnd()) * .45;
      const d = [Math.sqrt(1 - u * u) * Math.cos(ph), Math.sqrt(1 - u * u) * Math.sin(ph), u];
      const q = vec.add(p, vec.mul(d, s)); pts.push(q);
      if (Math.abs(q[0]) > 1.5 || Math.abs(q[1]) > 1.5 || q[2] < 0 || q[2] > 2.3) { mc.curve(pts, { color: col, width: 2, onTop: true }); mc.point(q, { r: 5, fill: '#fff', stroke: col, width: 2.2 }); return pts; }
      p = q;
    }
    mc.curve(pts, { color: col, width: 2, onTop: true }); pts.slice(1, -1).forEach(q => mc.point(q, { r: 3.5, fill: col, stroke: 'none' })); mc.point(p, { r: 7, fill: '#e0322a', stroke: '#fff' });
    return pts;
  };
  hist([0, 0, 1.1], 9, SL); hist([0, 0, 1.1], 6, G); hist([0, 0, 1.1], 12, PL); hist([.3, -.2, 1.3], 7, T);
  mc.point([0, 0, 1.1], { r: 8, fill: INK });
  mc.text(20, 300, '\\bullet\\ \\text{source}\\quad {\\color{#e0322a}\\bullet}\\ \\text{absorbed}\\quad \\circ\\ \\text{leaked}', { size: 16, anchor: 'start' });

  // ---------- P_N: sphere coloured by a real spherical harmonic (l=3, m=2) ----------
  const pn = new Scene({ width: 300, height: 230, scale: 92, elevation: 22, azimuth: 232 });
  pn.surface((a, b) => [Math.sin(a) * Math.cos(b), Math.sin(a) * Math.sin(b), Math.cos(a)], { u: [0, Math.PI], v: [0, 2 * Math.PI], nu: 36, nv: 64, cmap: 'rdbu', range: [-1, 1],
    colorBy: (p) => 3.2 * p[2] * (p[0] * p[0] - p[1] * p[1]), grid: 0 });
  pn.label([0, 0, 1.25], 'Y_{3,2}(\\boldsymbol\\Omega)', { size: 18 });

  // ---------- CP: neutron born in region j, first collision in region i ----------
  const cp = (() => {
    const cx = 150, cy = 115; let g = `<rect x="40" y="10" width="220" height="210" fill="#d6e6f0" stroke="${SL}" stroke-width="2"/>`;
    g += `<circle cx="${cx}" cy="${cy}" r="80" fill="#e9b9a6" stroke="#8a4a38" stroke-width="1.6"/><circle cx="${cx}" cy="${cy}" r="48" fill="#d77b62" stroke="#8a4a38" stroke-width="1.6"/>`;
    g += `<circle cx="${cx - 18}" cy="${cy + 10}" r="6" fill="${INK}"/>` + F.arrow(cx - 18, cy + 10, cx + 70, cy - 66, { color: INK, width: 2.4, dash: '6 4' }) + `<text x="${cx + 64}" y="${cy - 70}" font-size="26" fill="#e0322a" font-family="Inter" font-weight="700">✕</text>`;
    g += F.texSVG(cx - 24, cy + 32, 'j', { size: 22 }) + F.texSVG(cx + 96, cy - 50, 'i', { size: 22 }) + F.texSVG(cx + 10, cy - 18, 'P_{j\\to i}', { size: 18, anchor: 'start' });
    return F.wrap(300, 230, g);
  })();

  // ---------- convergence: source iteration vs accelerated ----------
  const conv = F.plot({ w: 380, h: 240, origin: [0, -8.5], x: [0, 62], y: [-8.5, .5], xlabel: '\\text{iteration}', ylabel: '\\log_{10}\\text{error}', ticks: { y: [[0, '0'], [-2, '-2'], [-4, '-4'], [-6, '-6']], x: [[20, '20'], [40, '40']] }, font: 15, pad: [44, 16, 22, 30],
    fns: [{ f: (n) => n * Math.log10(.93), color: C, width: 3, label: '\\text{SI }(c\\to1)', lx: 46, ly: -3.1 }, { f: (n) => n * Math.log10(.42), color: T, width: 3, label: '\\text{DSA / CMFD}', lx: 24, ly: -6.9, anchor: 'start' }],
    hlines: [{ y: -6, color: '#8b847c' }] });

  // ---------- HTML helpers ----------
  const chip = (t, c) => `<span class="chip" style="background:${c}">${t}</span>`;
  const loop = `<div class="loop"><div class="lv l1"><b>Outer: power iteration</b><span>update fission source &amp; \\(k\\)</span>
    <div class="lv l2"><b>Energy groups \\(g=1\\dots G\\)</b><span>Gauss–Seidel down-scatter, iterate up-scatter</span>
    <div class="lv l3"><b>Inner: source iteration</b><span>scattering source \\(\\to\\) transport sweep \\(\\to\\) new \\(\\phi\\)</span></div></div></div></div>`;
  const flow = ['ENDF nuclear data', 'NJOY: multigroup cross sections', 'Lattice code (2D MOC / CP): homogenise, few-group XS, discontinuity factors', '3D core nodal diffusion: \\(k_{\\text{eff}}\\), power, burnup', 'Pin-power reconstruction & safety limits'];
  const flowHtml = `<div class="flow">${flow.map((s, i) => `<div class="fb${i === 3 ? ' hl' : ''}"><span>${s}</span></div>`).join('<div class="fa">→</div>')}</div>`;
  const rows = [
    ['Monte Carlo', 'continuous', 'exact (CSG)', 'continuous', 'reference', 'very high', 'benchmarks, shielding, validation'],
    ['MOC', 'discrete \\(\\Omega_m\\)', 'rays, exact geometry', 'multigroup', 'high', 'high', 'lattice physics, 2D/1D whole core'],
    ['\\(S_N\\)', 'discrete \\(\\Omega_m\\)', 'mesh (DD, DFEM)', 'multigroup', 'high (ray effects)', 'high', 'shielding, fixed source, full core'],
    ['Collision prob.', 'integrated out', 'regions (integral form)', 'multigroup', 'high, small cells', 'grows \\(\\propto N^2\\)', 'pin-cell / assembly lattice'],
    ['\\(P_N/SP_N\\)', 'harmonic moments', 'FE / FD mesh', 'multigroup', 'medium–high', 'medium', 'full core with transport effects'],
    ['Diffusion / nodal', 'isotropic (\\(P_1\\))', 'coarse nodes', 'few-group', 'good if homogenised', 'low', 'core design, depletion, transients'],
  ];
  const table = `<table class="cmp"><tr><th>Method</th><th>Angle</th><th>Space</th><th>Energy</th><th>Accuracy</th><th>Cost</th><th>Typical use</th></tr>${rows.map(r => `<tr>${r.map((c, i) => `<td${i === 0 ? ' class="m"' : ''}>${c}</td>`).join('')}</tr>`).join('')}</table>`;

  const method = (title, tone, sub, how, eqs, fig, solves) => ({ title, tone, sub, body: [{ fig }, ...eqs.map(e => ({ tex: e, bg: '#f3ede6', size: 25 })), { p: how, small: true }, { note: `<b>Solves for:</b> ${solves}`, tone }] });

  return {
    theme: 'classic', header: 'bar', title: 'Numerical Methods for 3D Neutron Transport', titleSize: 64,
    subtitle: 'How reactor physicists solve the Boltzmann transport equation for the neutron population in a 3D core: what is discretised, which methods exist, and what each one computes.', subtitleSize: 29,
    cardTitleSize: 36, cardSubSize: 23, textSize: 24, formulaSize: 28,
    rows: [
      { cols: [1.55, 1], gap: 24, cards: [
        { title: 'The equation (steady state, eigenvalue form)', tone: 'ink', header: 'plain', body: [
          { tex: String.raw`\underbrace{\boldsymbol\Omega\cdot\nabla\psi}_{\text{streaming}}+\underbrace{\Sigma_t\,\psi}_{\text{collisions}}=\underbrace{\int_0^\infty\!\!\int_{4\pi}\Sigma_s(E'\!\to\!E,\boldsymbol\Omega'\!\cdot\!\boldsymbol\Omega)\,\psi'\,d\Omega'dE'}_{\text{scattering in}}+\underbrace{\frac{\chi(E)}{4\pi k_{\text{eff}}}\int_0^\infty\!\nu\Sigma_f\,\phi'\,dE'}_{\text{fission}}`, bg: '#efebe5', size: 27 },
          { cols: [[{ legend: [['\\(\\psi(\\mathbf r,\\boldsymbol\\Omega,E)\\)', 'angular flux (6 variables in 3D, 7 with time)'], ['\\(\\phi=\\int_{4\\pi}\\psi\\,d\\Omega\\)', 'scalar flux'], ['\\(\\Sigma_t,\\Sigma_s,\\nu\\Sigma_f\\)', 'total, scattering, fission cross sections'], ['\\(\\chi(E)\\)', 'fission spectrum'], ['\\(k_{\\text{eff}}\\)', 'multiplication factor (eigenvalue)']] }],
            [{ h: 'What is solved for', tone: 'coral' }, { list: ['\\(k_{\\text{eff}}\\): is the core critical?', 'flux \\(\\phi\\) and power / pin-power maps', 'reaction rates, burnup (depletion)', 'shielding dose (fixed source)', 'kinetics: \\(\\phi(t)\\) in transients'] }]], widths: [1.15, 1], align: 'start' },
        ] },
        { title: 'Phase space: \\(\\mathbf r\\), \\(\\boldsymbol\\Omega\\), \\(E\\)', tone: 'teal', header: 'plain', body: [
          { fig: ps.svg() },
          { p: 'Each neutron has a position (3), a direction (2) and an energy (1): too many variables to solve directly, so <b>every</b> variable is discretised.', small: true },
        ] },
      ] },
      { heading: '1 · Discretise each variable', cols: [1, 1, 1, 1], gap: 20, cards: [
        { title: 'Energy', sub: 'multigroup', tone: 'gold', body: [
          { tex: String.raw`\psi_g=\int_{E_g}^{E_{g-1}}\psi\,dE,\quad g=1\dots G`, bg: '#fbf1dc', size: 24 },
          { p: 'Cross sections are flux-weighted into \\(G\\) groups (NJOY), with resonance self-shielding. Lattice codes use 50–300+ groups; core codes 2–8.', small: true } ] },
        { title: 'Angle', sub: '\\(S_N\\), \\(P_N\\), diffusion', tone: 'teal', body: [
          { fig: sn.svg() },
          { p: '\\(S_N\\): quadrature \\(\\phi\\approx\\sum_m w_m\\psi_m\\) (\\(S_8\\): 80 directions). \\(P_N\\): spherical-harmonic moments. Diffusion keeps only \\(P_1\\).', small: true } ] },
        { title: 'Space', sub: 'mesh or rays', tone: 'coral', body: [
          { list: ['<b>Finite difference</b> / diamond difference', '<b>Discontinuous FEM</b> (unstructured 3D)', '<b>Characteristics</b>: integrate along rays', '<b>Nodal</b>: polynomial / analytic in large nodes', '<b>CSG</b> exact geometry (Monte Carlo)'] } ] },
        { title: 'Time', sub: 'kinetics', tone: 'slate', body: [
          { tex: String.raw`\frac{1}{v}\frac{\partial\psi}{\partial t}+\dots+\sum_i\lambda_iC_i`, bg: '#e6eef2', size: 24 },
          { p: 'Implicit Euler / θ-method, <b>point kinetics</b> or <b>quasi-static</b> (shape × amplitude) with delayed-neutron precursors \\(C_i\\).', small: true } ] },
      ] },
      { heading: '2 · Deterministic transport solvers', cols: [1, 1, 1], gap: 22, cards: [
        method('Discrete ordinates (\\(S_N\\))', 'teal', 'sweep each direction across the mesh', 'For each direction \\(m\\) the equation is a first-order PDE solved by a <b>sweep</b> from the incoming boundary, cell by cell (diamond difference \\(\\psi_c=\\tfrac12(\\psi_{in}+\\psi_{out})\\)). Watch for ray effects.',
          [String.raw`\boldsymbol\Omega_m\!\cdot\!\nabla\psi_m+\Sigma_t\psi_m=q_m,\quad \phi=\sum_m w_m\psi_m`], sweep, 'angular & scalar flux on a mesh; shielding, full-core fixed source and eigenvalue'),
        method('Method of characteristics', 'coral', 'integrate along straight tracks', 'Lay parallel tracks over the exact geometry. Along each segment of length \\(s\\) with flat source \\(q\\) the ODE has a closed-form solution; segment averages build \\(\\phi\\) in every region.',
          [String.raw`\psi_{out}=\psi_{in}e^{-\Sigma_t s}+\frac{q}{\Sigma_t}\left(1-e^{-\Sigma_t s}\right)`], moc, 'heterogeneous pin-by-pin flux; lattice cross sections; 2D/1D whole-core'),
        method('Diffusion & nodal', 'gold', 'Fick’s law closure, coarse nodes', 'Assume nearly isotropic flux, \\(\\mathbf J=-D\\nabla\\phi\\). Solve on whole assemblies (nodes) with polynomial / analytic flux shapes (NEM, ANM) and discontinuity factors from the lattice code.',
          [String.raw`\begin{aligned}-\nabla\!\cdot\!D_g\nabla\phi_g+\Sigma_{r,g}\phi_g&=\sum_{g'\ne g}\Sigma_{s,g'\to g}\phi_{g'}\\&\quad+\frac{\chi_g}{k}\sum_{g'}\nu\Sigma_{f,g'}\phi_{g'}\end{aligned}`], core.svg(), '3D core \\(k_{\\text{eff}}\\), assembly power, burnup, control-rod worth, transients'),
      ] },
      { cols: [1, 1, 1], gap: 22, cards: [
        { title: 'Spherical harmonics (\\(P_N\\), \\(SP_N\\))', tone: 'plum', titleSize: 32, body: [
          { fig: pn.svg() },
          { tex: String.raw`\psi(\mathbf r,\boldsymbol\Omega)\approx\sum_{l=0}^{N}\sum_{m=-l}^{l}\phi_{lm}(\mathbf r)\,Y_{lm}(\boldsymbol\Omega)`, bg: '#f5e8f0', size: 26 },
          { p: 'Projecting onto \\(Y_{lm}\\) gives coupled PDEs for the moments (no ray effects). \\(SP_3\\) is a cheap diffusion-like upgrade used in core codes.', small: true },
          { note: '<b>Solves for:</b> flux moments; full-core with transport corrections', tone: 'plum' } ] },
        { title: 'Collision probability (CP)', tone: 'slate', body: [
          { fig: cp },
          { tex: String.raw`\Sigma_{t,i}\phi_iV_i=\sum_j P_{j\to i}\,q_jV_j`, bg: '#e6eef2', size: 26 },
          { p: 'Integral form of the equation: \\(P_{j\\to i}\\) is the chance a neutron born in region \\(j\\) first collides in \\(i\\). Exact for small cells, but the matrix grows as \\(N^2\\).', small: true },
          { note: '<b>Solves for:</b> pin-cell and assembly flux for cross-section homogenisation', tone: 'slate' } ] },
        { title: 'Monte Carlo (stochastic)', tone: 'coral', body: [
          { fig: mc.svg() },
          { tex: String.raw`s=-\frac{\ln\xi}{\Sigma_t},\qquad \hat\phi=\frac{1}{VN}\sum\ell,\qquad \sigma\propto\frac{1}{\sqrt N}`, bg: '#fbebe6', size: 24 },
          { p: 'Simulate individual neutron histories: sample flight distance, collision type, new direction and energy; tally track lengths. Continuous energy and exact geometry.', small: true },
          { note: '<b>Solves for:</b> reference \\(k_{\\text{eff}}\\) and tallies with error bars; deep-penetration shielding with CADIS weight windows', tone: 'coral' } ] },
      ] },
      { heading: '3 · Iterations and acceleration', cols: [1.05, 1, 1], gap: 22, cards: [
        { title: 'Nested iterations', tone: 'ink', body: [loop,
          { tex: String.raw`\phi^{(n+1)}=\frac{1}{k^{(n)}}\mathbf M^{-1}\mathbf F\phi^{(n)},\qquad k^{(n+1)}=k^{(n)}\frac{\langle\mathbf F\phi^{(n+1)}\rangle}{\langle\mathbf F\phi^{(n)}\rangle}`, bg: '#efebe5', size: 25 } ] },
        { title: 'Why acceleration?', tone: 'teal', body: [
          { fig: conv },
          { p: 'Source iteration converges like \\(c^n\\) with \\(c=\\Sigma_s/\\Sigma_t\\to1\\) in water-moderated reactors; power iteration slows when the dominance ratio \\(\\to1\\).', small: true } ] },
        { title: 'Acceleration tools', tone: 'gold', body: [
          { legend: [['DSA', 'diffusion synthetic acceleration of the scattering source'], ['CMFD', 'coarse-mesh diffusion solve that rebalances the flux and \\(k\\)'], ['Krylov', 'GMRES / Bi-CGSTAB on the within-group system'], ['Wielandt', 'shifted power iteration, faster \\(k\\) convergence'], ['Parallel', 'KBA sweeps, domain decomposition, GPUs']] } ] },
      ] },
      { cols: [1], cards: [
        { title: 'The multi-level calculation chain', tone: 'slate', header: 'plain', body: [flowHtml] },
      ] },
      { cols: [1], cards: [
        { title: 'Comparing the methods', tone: 'coral', header: 'plain', body: [table,
          { p: 'In practice: lattice MOC/CP + 3D nodal diffusion for design; whole-core MOC, \\(S_N\\) or Monte Carlo for high-fidelity and validation.', small: true }] },
      ] },
    ],
    css: `.rowhead{text-align:left;margin-bottom:-12px}.rowhead span{font-family:'Inter Display',Inter,sans-serif;font-size:40px;font-weight:800;color:#1d1a17;padding:0}
.legend td{font-size:21px}.legend td.k{font-weight:700;color:#1d1a17}
.note{font-size:21px}
.chip{color:#fff;border-radius:8px;padding:2px 8px}
.loop .lv{border:2px solid;border-radius:12px;padding:10px 14px;margin-top:6px;display:flex;flex-direction:column;gap:2px}
.loop b{font-size:22px}.loop span{font-size:19px;color:#3b3733}
.l1{border-color:#b8432c;background:#fbebe6}.l1>b{color:#b8432c}.l2{border-color:#a86f12;background:#fbf1dc}.l2>b{color:#a86f12}.l3{border-color:#1d5a4b;background:#e7f0ec}.l3>b{color:#1d5a4b}
.flow{display:flex;align-items:stretch;gap:8px}
.fb{flex:1;background:#fff;border:2px solid #a9c3d0;border-radius:12px;padding:12px 10px;text-align:center;font-size:20px;line-height:1.3;display:flex;align-items:center;justify-content:center}
.fb.hl{background:#e6eef2;border-color:#3e5f73;font-weight:600}.fa{display:flex;align-items:center;font-size:30px;color:#3e5f73}
.cmp{width:100%;border-collapse:collapse;font-size:20px}
.cmp th{background:#b8432c;color:#fff;padding:9px 8px;text-align:left}
.cmp td{padding:8px;border-bottom:1.5px solid #e6dfd5;vertical-align:top}
.cmp tr:nth-child(even) td{background:#f3ede6}.cmp td.m{font-weight:800;color:#1d1a17;white-space:nowrap}`,
  };
};
