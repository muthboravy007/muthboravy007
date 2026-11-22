// Infographic (paper theme): The Laplace Transform.
// node .claude/skills/image-gen/scripts/infographic.cjs images/src/laplace-transform.cjs images/infographics/laplace-transform.png --scale 1.5
module.exports = ({ fig2d: F, fig3d: { Scene, ramp } }) => {
  const RUST = '#c0532f', GREEN = '#3f6e4a', CRIM = '#8e1f45', SLATE = '#4d7385', ORANGE = '#c8622c', INDIGO = '#3a3d6e';
  const W = 400, H = 280;

  // 1. Definition: f(t), the kernel e^{-st}, and their product (shaded area = F(s))
  const f = (t) => 1 + .6 * Math.sin(2.2 * t), k = (t) => Math.exp(-.7 * t);
  const fig1 = F.plot({ w: W, h: H, x: [-.2, 5.2], y: [-.15, 1.9], xlabel: 't', ylabel: '',
    fills: [{ f: (t) => f(t) * k(t), from: 0, to: 5.2, colors: ['#f2a48a', '#f5d7a8'], opacity: .85 }],
    fns: [{ f, color: SLATE, width: 2.6, label: 'f(t)', lx: 4.55, ly: 1.75 },
      { f: k, color: '#8a7f73', width: 2.2, dash: '7 5', label: 'e^{-st}', lx: 4.6, ly: .32 },
      { f: (t) => f(t) * k(t), color: RUST, width: 3.2, label: 'f(t)\\,e^{-st}', lx: 1.75, ly: 1.62 }] });

  // 2. s-plane surface |F(s)| for F(s) = 1/((s+0.6)^2 + 1.5^2): two poles = two peaks
  const mag = (sg, w) => { const a = sg + .6, re = a * a - w * w + 2.25, im = 2 * a * w; return Math.min(2.2, 1.1 / Math.sqrt(re * re + im * im)); };
  const s = new Scene({ width: W, height: 330, scale: 66, elevation: 26, azimuth: 222, center: [0, 0, .7] });
  s.graph(mag, { x: [-2.2, 1.6], y: [-2.6, 2.6], nu: 44, nv: 52, cmap: ramp(['#6a9fb2', '#a9cdd4', '#efd8c2', '#f2a07a', '#c0532f']), grid: 4, gridColor: 'rgba(60,50,40,.3)' });
  s.axes({ x: 2.0, y: 3.0, z: 2.8, neg: 0, labels: ['\\sigma', 'j\\omega', '|F(s)|'], size: 21 });
  for (const w of [1.5, -1.5]) s.point([-.6, w, 2.2], { r: 6, fill: CRIM }).curve([[-.6, w, 0], [-.6, w, 2.2]], { color: CRIM, width: 1.4, dash: '4 4', onTop: true });
  s.label([-.6, 1.5, 2.2], '\\text{pole}', { dx: 34, dy: -14, size: 18, color: CRIM });

  // 5. pole positions and the responses they produce
  const sp = F.plot({ w: 440, h: 250, x: [-3, 1.6], y: [-2.2, 2.2], xlabel: '\\sigma', ylabel: 'j\\omega', grid: false,
    points: [{ x: -2, y: 0, color: GREEN, r: 8, label: '\\text{A}', dy: -18 }, { x: -.8, y: 1.4, color: SLATE, r: 8, label: '\\text{B}', dx: 16, dy: -10 }, { x: -.8, y: -1.4, color: SLATE, r: 8 }, { x: .8, y: 0, color: CRIM, r: 8, label: '\\text{C}', dy: -18 }],
    labels: [{ x: -1.9, y: -1.85, tex: '\\text{stable}', size: 16, color: GREEN }, { x: 1.0, y: -1.85, tex: '\\text{unstable}', size: 16, color: CRIM }] })
    .replace('</svg>', '');
  const spFig = sp.replace(/<svg([^>]*)>/, (m) => m) + `<rect x="${34 + 3 / 4.6 * 388}" y="18" width="${1.6 / 4.6 * 388}" height="202" fill="${CRIM}" opacity=".07"/></svg>`;
  const mini = (fn, color, lab) => F.plot({ w: 160, h: 100, x: [0, 6], y: [-1.15, 1.6], pad: [10, 6, 6, 8], xlabel: '', ylabel: '', fns: [{ f: fn, color, width: 2.6 }], labels: [{ x: 5.2, y: 1.25, tex: lab, size: 16, color }] });

  const row = (a, b) => `<tr><td>\\(${a}\\)</td><td>\\(${b}\\)</td></tr>`;
  const table = `<table class="lt"><tr><th>\\(f(t)\\)</th><th>\\(F(s)\\)</th></tr>${[
    ['1', '\\dfrac{1}{s}'], ['t^n', '\\dfrac{n!}{s^{n+1}}'], ['e^{at}', '\\dfrac{1}{s-a}'], ['\\sin\\omega t', '\\dfrac{\\omega}{s^2+\\omega^2}'], ['\\cos\\omega t', '\\dfrac{s}{s^2+\\omega^2}'], ['\\delta(t)', '1'], ['u(t-c)', '\\dfrac{e^{-cs}}{s}']].map(r => row(...r)).join('')}</table>`;

  // 6. worked example: y'' + 3y' + 2y = 0, y(0)=1, y'(0)=0  →  y = 2e^{-t} − e^{-2t}
  const y = (t) => 2 * Math.exp(-t) - Math.exp(-2 * t);
  const ex = F.plot({ w: 360, h: 230, x: [-.2, 5.2], y: [-.1, 1.25], xlabel: 't', ylabel: 'y', ticks: { y: [[1, '1']] },
    fills: [{ f: y, from: 0, to: 5.2, colors: ['#f6c9a8', '#f8e6cf'], opacity: .7 }],
    fns: [{ f: y, color: ORANGE, width: 3.4, label: 'y=2e^{-t}-e^{-2t}', lx: 3.4, ly: .78 }], points: [{ x: 0, y: 1, color: ORANGE, r: 6 }] });
  const stepBox = (n, title, texs, tone) => `<div class="step"><div class="sn" style="background:${tone}">${n}</div><div class="st"><b style="color:${tone}">${title}</b>${texs.map(t => `<div class="fit">\\[${t}\\]</div>`).join('')}</div></div>`;

  return {
    theme: 'paper', header: 'bar', title: 'The Laplace Transform', subtitle: 'Turn differential equations in time into algebra in \\(s\\).', cardTitleSize: 34, textSize: 26, formulaSize: 30,
    rows: [
      { cols: [1, 1, 1], gap: 24, cards: [
        { title: '1. Definition', tone: 'rust', body: [
          { tex: String.raw`F(s)=\mathcal{L}\{f(t)\}=\int_0^{\infty} f(t)\,e^{-st}\,dt`, box: false, size: 31 },
          { fig: fig1 },
          { p: 'Multiply \\(f\\) by the decaying kernel \\(e^{-st}\\) and add up the area. Each value of \\(s\\) gives one number \\(F(s)\\).', small: true },
        ] },
        { title: '2. The s-plane', tone: 'green', body: [
          { tex: String.raw`s=\sigma+j\omega\in\mathbb C`, box: false, size: 31 },
          { fig: s.svg() },
          { p: 'For \\(F(s)=\\dfrac{1}{(s+0.6)^2+1.5^2}\\) the magnitude rises to peaks at the two poles \\(s=-0.6\\pm1.5j\\).', small: true },
        ] },
        { title: '3. Key properties', tone: 'crimson', body: [
          `<div class="props">${[
            ['Linearity', String.raw`\mathcal L\{af+bg\}=aF+bG`],
            ['Derivative', String.raw`\mathcal L\{f'\}=sF(s)-f(0)`],
            ['Second derivative', String.raw`\mathcal L\{f''\}=s^2F-sf(0)-f'(0)`],
            ['Shift in s', String.raw`\mathcal L\{e^{at}f\}=F(s-a)`],
            ['Time delay', String.raw`\mathcal L\{f(t-c)\,u(t-c)\}=e^{-cs}F(s)`],
            ['Convolution', String.raw`\mathcal L\{f*g\}=F(s)\,G(s)`],
          ].map(([k, v]) => `<div class="pr"><b>${k}</b><div class="fit">\\[${v}\\]</div></div>`).join('')}</div>`,
          { note: '<b>Why it works:</b> differentiation in \\(t\\) becomes multiplication by \\(s\\), so a differential equation becomes an algebraic one.', tone: 'crimson' },
        ] },
      ] },
      { cols: [.9, 1.1, 1.25], gap: 24, cards: [
        { title: '4. Common transforms', tone: 'slate', titleSize: 31, body: [table, { p: 'Valid for \\(\\operatorname{Re}(s)\\) large enough (the region of convergence).', small: true }] },
        { title: '5. Poles predict behaviour', tone: 'indigo', body: [
          { fig: spFig },
          { cols: [{ fig: mini((t) => Math.exp(-1.4 * t), GREEN, '\\text{A}') }, { fig: mini((t) => Math.exp(-.35 * t) * Math.cos(2.6 * t), SLATE, '\\text{B}') }, { fig: mini((t) => .08 * Math.exp(.55 * t), CRIM, '\\text{C}') }], gap: 8 },
          { list: ['<b style="color:#3f6e4a">A</b> real pole, \\(\\sigma<0\\): smooth decay', '<b style="color:#4d7385">B</b> complex pair: decaying oscillation', '<b style="color:#8e1f45">C</b> \\(\\sigma>0\\): grows without bound'], },
        ] },
        { title: '6. Worked example', tone: 'orange', body: [
          { p: 'Solve \\(y\'\'+3y\'+2y=0,\\ y(0)=1,\\ y\'(0)=0\\).' },
          stepBox(1, 'Transform', [String.raw`s^2Y-s+3(sY-1)+2Y=0`], RUST),
          stepBox(2, 'Solve for \\(Y\\)', [String.raw`Y(s)=\frac{s+3}{(s+1)(s+2)}=\frac{2}{s+1}-\frac{1}{s+2}`], GREEN),
          stepBox(3, 'Invert with the table', [String.raw`y(t)=2e^{-t}-e^{-2t}`], ORANGE),
          { fig: ex },
        ] },
      ] },
      { cols: [1], cards: [
        { title: 'The big picture', tone: 'sand', header: 'tint', bg: '#f6e6d6', body: [
          `<div class="flow"><div class="fb"><b>Time domain</b><span>differential equation in \\(t\\)</span></div><div class="fa">\\(\\xrightarrow{\\ \\mathcal L\\ }\\)</div><div class="fb"><b>s-domain</b><span>algebraic equation in \\(s\\)</span></div><div class="fa">\\(\\xrightarrow{\\text{solve}}\\)</div><div class="fb"><b>Partial fractions</b><span>simple terms \\(\\frac{A}{s-p}\\)</span></div><div class="fa">\\(\\xrightarrow{\\ \\mathcal L^{-1}\\ }\\)</div><div class="fb hl"><b>Solution \\(y(t)\\)</b><span>back in time</span></div></div>`,
          { p: 'Used in circuit analysis, control systems, vibrations and signal processing: anywhere a linear system responds to an input over time.', small: true, style: 'text-align:center' },
        ] },
      ] },
    ],
    css: `.chead.tint h3{font-size:38px}
.lt{width:100%;border-collapse:collapse;font-size:25px}
.lt th{background:#e3edf1;color:#4d7385;padding:8px;font-weight:700}
.lt td{padding:6px 10px;text-align:center;border-bottom:1.5px solid #e6ddd0}
.lt tr:nth-child(odd) td{background:rgba(255,255,255,.55)}
.step{display:flex;gap:12px;align-items:flex-start;background:rgba(255,255,255,.65);border-radius:10px;padding:6px 12px}
.sn{flex:0 0 30px;height:30px;border-radius:50%;color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center;font-size:17px;margin-top:6px}
.st{flex:1;min-width:0;font-size:22px}.st .fit{font-size:23px}.st .katex-display{margin:4px 0}
.flow{display:flex;align-items:center;justify-content:space-between;gap:10px}
.fb{flex:1;background:#fff;border:2px solid #d9b993;border-radius:12px;padding:12px 10px;text-align:center;display:flex;flex-direction:column;gap:4px}
.fb b{font-size:27px;color:#7d5a3a}.fb span{font-size:20px;color:#5a4a3c}.fb.hl{background:#fbe7da;border-color:#c8622c}
.fa{font-size:28px;color:#7d5a3a}
.props{display:flex;flex-direction:column;gap:6px}.pr b{color:#8e1f45;font-size:21px}.pr .fit{font-size:23px}.pr .katex-display{margin:2px 0 4px;text-align:left}.pr .katex-display>.katex{text-align:left;white-space:nowrap}`,
  };
};
