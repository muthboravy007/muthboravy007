// Example (sketch theme): Mathematics Behind AI.
// node .claude/skills/image-gen/scripts/infographic.cjs .claude/skills/image-gen/examples/math-behind-ai.cjs images/infographics/math-behind-ai.png
module.exports = ({ fig2d: F, fig3d: { Scene, CMAPS } }) => {
  const HAND = "'Patrick Hand',cursive";

  // loss landscape + gradient-descent path
  const loss = (x, y) => 1.55 - 1.35 * Math.exp(-((x - .9) ** 2 + (y - .6) ** 2) / 2.2) + .32 * Math.sin(1.3 * x + .5) * Math.cos(.9 * y);
  const s = new Scene({ width: 640, height: 430, scale: 82, elevation: 26, azimuth: 236, center: [0, 0, .7] });
  s.polygon([[-3, -3, -.25], [3, -3, -.25], [3, 3, -.25], [-3, 3, -.25]], { fill: '#d6d6d6', depthBias: 50 });
  s.graph(loss, { x: [-2.6, 2.6], y: [-2.6, 2.6], nu: 40, nv: 40, cmap: (t) => CMAPS.jet(1 - t), grid: 4, gridColor: 'rgba(20,40,120,.35)' });
  let p = [-2.0, 2.2]; const path = [];
  for (let k = 0; k < 260; k++) { path.push([p[0], p[1], loss(p[0], p[1]) + .03]); const e = 1e-3, gx = (loss(p[0] + e, p[1]) - loss(p[0] - e, p[1])) / 2 / e, gy = (loss(p[0], p[1] + e) - loss(p[0], p[1] - e)) / 2 / e; p = [p[0] - .06 * gx, p[1] - .06 * gy]; }
  s.curve(path, { color: '#111', width: 2.4, onTop: true });
  path.filter((_, k) => k % 18 === 0 && k < 200).forEach(q => s.point(q, { r: 5, fill: '#111', stroke: '#111' }));
  s.point(path[path.length - 1], { r: 11, fill: '#f02a2a', stroke: '#fff', width: 2 });
  s.arrow([0, 0, -.25], [0, -3.3, -.25], { color: '#1b8a2e', width: 2.4 }).arrow([0, 0, -.25], [3.2, 0, -.25], { color: '#e0322a', width: 2.4 }).arrow([0, 0, -.25], [0, 0, 2.9], { color: '#2340c8', width: 2.4 });
  const sk = (x, y, t, c = '#111', size = 26, anchor = 'start') => s.text(x, y, t, { plain: true, size, color: c, font: HAND, anchor });
  sk(352, 30, 'Loss', '#2340c8', 34); sk(30, 412, 'x (weight 1)', '#1b8a2e', 32); sk(450, 420, 'y (weight 2)', '#e0322a', 32);
  const end = s.P(path[path.length - 1]); sk(end[0] + 40, end[1] + 46, 'Lower loss', '#111', 28); sk(end[0] + 40, end[1] + 76, '(minimum)', '#111', 28);
  s.over(F.arrow(end[0] + 36, end[1] + 40, end[0] + 12, end[1] + 10, { width: 2.2, head: 10 }));

  // single neuron flow (one SVG so arrows can cross columns)
  const flow = (() => {
    const w = 1440, h = 330, ys = [70, 170, 270], xs = { in: 130, mul: 420, sum: 735, act: 1035, out: 1330 };
    let g = '';
    const t = (x, y, str, size = 34, c = '#1d2bb0', anchor = 'middle') => `<text x="${x}" y="${y}" font-size="${size}" fill="${c}" text-anchor="${anchor}" font-family="${HAND}">${str}</text>`;
    [['0.2', '0.4', '0.080'], ['0.5', '0.26', '0.130'], ['0.43', '0.3', '0.129']].forEach(([v, wgt, prod], i) => {
      g += F.arrow(30, ys[i], 82, ys[i], { width: 2.4, head: 11 }) + `<circle cx="${xs.in}" cy="${ys[i]}" r="42" fill="#a63bdb"/>` + t(xs.in, ys[i] + 12, v, 32, '#fff');
      g += F.arrow(190, ys[i], 280, ys[i], { color: '#1d2bb0', width: 2.4, head: 11 }) + t(xs.mul, ys[i] + 12, `× ${wgt} = ${prod}`, 36);
      g += F.arrow(560, ys[i] - (i - 1) * 4, 640, 170 + (i - 1) * 40, { color: '#1d2bb0', width: 2.4, head: 12 });
    });
    g += `<rect x="645" y="40" width="180" height="250" rx="10" fill="#fff" stroke="#1d2bb0" stroke-width="2.5"/>` + ['0.080', '0.130', '0.129', '+ 0.100'].map((v, i) => t(xs.sum + 10, 85 + i * 46, v, 34, '#111')).join('') + `<line x1="665" y1="240" x2="805" y2="240" stroke="#111" stroke-width="2.4"/>` + t(xs.sum + 10, 276, '<tspan font-weight="700">0.439</tspan>', 36, '#111');
    g += `<rect x="665" y="300" width="140" height="0" />`;
    g += F.arrow(845, 170, 925, 170, { color: '#1d2bb0', width: 2.4, head: 12 }) + `<rect x="935" y="90" width="170" height="160" rx="8" fill="#fff" stroke="#1d2bb0" stroke-width="2.5"/>`;
    g += `<line x1="955" y1="215" x2="1090" y2="215" stroke="#111" stroke-width="2"/><line x1="1020" y1="230" x2="1020" y2="105" stroke="#111" stroke-width="2"/><path d="${Array.from({ length: 41 }, (_, k) => { const x = -4 + 8 * k / 40; return `${k ? 'L' : 'M'}${(1022 + x * 15).toFixed(1)} ${(212 - 95 / (1 + Math.exp(-x * 1.3))).toFixed(1)}`; }).join('')}" fill="none" stroke="#1f6fd0" stroke-width="3.5"/>`;
    g += t(1180, 182, '= 0.608', 36);
    [70, 170, 270].forEach((y) => { g += F.arrow(1240, 170 + (y - 170) * .3, 1300, y + (y - 170) * .05, { color: '#1d2bb0', width: 2.4, head: 12 }) + `<circle cx="${xs.out + 10}" cy="${y}" r="38" fill="#f55bd3"/>`; });
    return F.wrap(w, h, g);
  })();
  const stepHead = (n, title, desc, bg) => [`<div style="text-align:center"><span style="display:inline-block;background:${bg};border-radius:14px;padding:2px 16px;font-size:34px;-webkit-text-stroke:.6px #111">${n}. ${title}</span></div>`, { p: desc, style: 'text-align:center;font-size:27px;line-height:1.2' }];

  const relu = F.plot({ w: 330, h: 250, x: [-2, 2.2], y: [-.4, 2.2], xlabel: '', ylabel: '', fns: [{ f: (x) => Math.max(0, x), color: '#1f4fd8', width: 4 }] });
  const sigm = F.plot({ w: 300, h: 250, x: [-4, 4.4], y: [-.15, 1.25], xlabel: '', ylabel: '', ticks: { y: [[1, '1'], [0, '0']] }, hlines: [{ y: 1, x0: -4, x1: 4.4, color: '#555', dash: '6 5' }], fns: [{ f: (x) => 1 / (1 + Math.exp(-x * 1.2)), color: '#e8304f', width: 4 }] });

  return {
    theme: 'sketch', title: 'Mathematics Behind AI', titleSize: 100, cardTitleSize: 44, textSize: 30, footerStyle: 'line',
    logo: `<svg width="110" height="90" viewBox="0 0 110 90">${[[20, 20], [55, 10], [90, 25], [35, 50], [75, 55]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#f08a3c"/>`).join('')}<path d="M20 20L55 10L90 25L75 55L35 50Z M20 20L35 50 M55 10L75 55" stroke="#f08a3c" stroke-width="2" fill="none"/></svg>`,
    css: `.fig text{font-family:${HAND}} .card{border-width:2px} .legend td{font-size:26px}`,
    rows: [
      { cols: [1.05, 1], gap: 26, cards: [
        { title: 'Learning by Minimizing Loss', tone: 'pink', flat: true, body: [
          { cols: [[{ p: 'Learn the parameters (weights and biases) to minimize loss.', style: 'font-size:30px;line-height:1.25;color:#111' }], [{ fig: s.svg() }]], widths: [.42, 1.35], align: 'start' },
        ] },
        { title: 'Neural Network (High Level)', tone: 'blue', flat: true, body: [
          { fig: F.nnet({ w: 690, h: 330, layers: [4, 5, 3, 4, 2], colors: ['#33cc4d', '#3f63f0', '#3f63f0', '#3f63f0', '#f03a3a'], gapAfter: 2, inputs: ['Input 1', 'Input 2', 'Input 3', 'Input 4'], outputs: ['Output 1', 'Output 2'], font: 26, fontFamily: HAND }) },
          { cols: [[{ tex: String.raw`\min_{w,b}\ \frac{1}{n}\sum_{i=1}^{n}\mathcal L\big(h(x_i;w,b),\,y_i\big)`, bg: '#fbd9ec', size: 30 }], [{ legend: [['\\(w\\)', '= weights'], ['\\(b\\)', '= biases'], ['\\(\\mathcal L\\)', '= loss function']] }]], widths: [1.6, 1] },
        ] },
      ] },
      { heading: 'How a Single Artificial Neuron Works', headingBg: '#e8ddfa', cols: [1], cards: [
        { title: undefined, header: 'none', body: [
          { cols: [stepHead(1, 'Inputs', 'Input values from the previous layer', '#fbd9ec'), stepHead(2, 'Multiply by weights', 'Each input is multiplied by a learned weight', '#dde7fb'), stepHead(3, 'Sum and add bias', 'Sum the weighted inputs and add a bias term', '#fbeeb0'), stepHead(4, 'Apply activation', 'Adds non-linearity (e.g. ReLU, Sigmoid)', '#dcf6d4'), stepHead(5, 'Output', 'Passes output to the next layer', '#fbd9ec')], widths: [1, 1.25, 1.1, 1.15, .95], align: 'start', gap: 10 },
          { fig: flow },
          `<div style="text-align:center;margin-top:-6px"><span style="display:inline-block;background:#1d3fb0;color:#fff;border-radius:14px;padding:4px 22px;font-size:30px;margin-left:-120px">bias = 0.1</span></div>`,
        ] },
      ] },
      { cols: [1, 1.05], gap: 26, cards: [
        { title: 'Common Activation Functions', tone: 'sky', body: [
          { cols: [[`<div style="text-align:center"><span style="background:#fbeeb0;border-radius:10px;padding:0 12px;font-size:25px;white-space:nowrap">ReLU (Rectified Linear Unit)</span></div>`, { tex: 'f(x)=\\max(0,x)', box: false, size: 28 }, { fig: relu }],
            [`<div style="text-align:center"><span style="background:#fbeeb0;border-radius:10px;padding:0 12px;font-size:30px">Sigmoid</span></div>`, { tex: 'f(x)=\\dfrac{1}{1+e^{-x}}', box: false, size: 28 }, { fig: sigm }]], align: 'start' },
        ] },
        { title: 'Neural Network Flow (Big Picture)', tone: 'lavender', body: [
          { fig: F.nnet({ w: 700, h: 300, layers: [3, 2, 3, 3, 2, 1], colors: ['#a63bdb', '#3f63f0', '#3f63f0', '#3f63f0', '#3f63f0', '#f55bd3'], gapAfter: 2 }) },
          { cols: [{ p: 'Features (x)', style: 'text-align:center' }, { p: 'Hidden layers learn complex patterns with weights, biases and activation functions', style: 'text-align:center;font-size:25px' }, { p: 'Prediction (ŷ)', style: 'text-align:center' }], widths: [1, 2.2, 1] },
        ] },
      ] },
    ],
  };
};
