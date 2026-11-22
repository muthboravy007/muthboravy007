---
name: image-gen
description: Create or generate images for free, with no API key or credits needed. Also builds math/science infographic posters (titled card layouts with LaTeX formulas, shaded 3D surfaces, vector fields, graphs, neural-network diagrams) like textbook explainer sheets. Also writes text as realistic handwriting on A4 paper (ruled, grid, dotted or plain) in 12 handwriting fonts, splitting long text across A4 pages and columns, saved as PNG pages and PDF. Use when the user asks to create, draw, generate, render or design an image, picture, photo, illustration, logo, icon, poster, banner, thumbnail, social post, sticker, wallpaper, mockup or diagram-style graphic, or to edit/restyle one. Use it for handwritten notes, handwriting copies, worksheets or homework pages too. Uses a free AI image service (Pollinations/Flux) when reachable and otherwise draws the image offline as SVG/HTML rendered to PNG with local Chromium. Optional OpenAI GPT Image engine only if the user has OPENAI_API_KEY.
---

# Free image generation

Five engines, all driven from `scripts/`. Run commands from the repo root (paths below are relative to it).

| Engine | Cost | Needs | Best for |
|---|---|---|---|
| **free-ai** (`free_ai.py`) | Free, no key | Network access to `image.pollinations.ai` | Photos, realistic scenes, painterly art, characters, landscapes |
| **draw** (`render.cjs`) | Free, offline | Local Chromium + Playwright (preinstalled in Claude Code cloud) | Logos, icons, posters, banners, thumbnails, infographics, anything with exact text, flat/vector/geometric art |
| **infographic** (`infographic.cjs`) | Free, offline | Local Chromium + Playwright; KaTeX and fonts bundled | Explainer posters: title + cards with formulas, 3D surfaces, fields, plots, icons (math/physics/ML topics) |
| **handwrite** (`handwrite.cjs`) | Free, offline | Local Chromium + Playwright; fonts are bundled in `fonts/` | Handwritten copies of text/notes on A4 paper, split over pages and columns, PNG + PDF |
| **openai** (`openai_image.py`) | Paid | `OPENAI_API_KEY` | Only when the user has credits and asks for it |

## Choosing the engine
0a. Concept poster / "infographic like this" / explainer sheet with formulas and 3D diagrams → **infographic**.
0. Handwritten copy / notes / homework page / "write this by hand" → **handwrite** (A4, splits into pages and columns).
1. Exact text, logos, icons, UI, charts, flat/vector/minimal styles → **draw** (AI models misspell text; drawing is precise).
2. Photorealistic or painterly subjects → **free-ai**. If it exits with code 3 (service unreachable/blocked), tell the user in one line and switch to **draw**, producing the best illustrated version you can (layered gradients, shapes, filters).
3. Use **openai** only if `OPENAI_API_KEY` is set and the user wants it.

Don't ask the user which engine or size to use; pick sensible defaults and say what you chose.

## Engine: free-ai
```bash
python3 .claude/skills/image-gen/scripts/free_ai.py \
  --prompt "..." --size landscape --out images/fox.jpg [--n 3] [--seed 42] [--model flux]
```
- `--size`: `square` 1024², `landscape` 1344×768, `portrait` 768×1344, `wide` 1536×640, `story` 720×1280, or `WxH`.
- `--n` gives variations with different seeds; `--seed` makes results reproducible (reuse the seed and tweak the prompt to refine).
- Writes the image(s) plus a `.json` sidecar with prompt and seeds.
- Optional `POLLINATIONS_TOKEN` env var for higher rate limits. On HTTP 429 it retries automatically.

Prompt recipe (comma-separated art brief): **subject + action**, **setting/composition**, **style/medium**, **lighting/colour**, **quality cues** ("highly detailed, sharp focus"). Avoid asking it for text; add text afterwards with the draw engine (see "Combine").

## Engine: draw (offline)
1. Write an SVG (preferred) or a self-contained HTML file in the scratchpad or `images/src/`. Set `width`, `height` and `viewBox` on the `<svg>`.
2. Render it:
   ```bash
   node .claude/skills/image-gen/scripts/render.cjs images/src/logo.svg images/logo.png [--width 1024 --height 1024] [--scale 2] [--transparent]
   ```
   `--transparent` keeps the background clear (PNG). `--full` captures the whole height of a tall HTML page. If the page defines `window.__fit()`, it is called after fonts load (use it to shrink wide formulas to fit). `--scale 2` gives a sharper, double-resolution image. `.jpg` output also works.

Drawing guidance, so results look designed rather than clip-art:
- Start with a clear composition: one focal subject, a background layer, generous margins.
- Use a palette of 3–5 harmonious colours; build depth with `linearGradient`/`radialGradient`, soft shadows (`feDropShadow`/`feGaussianBlur`) and overlapping translucent shapes.
- Texture and atmosphere: `feTurbulence` noise for grain, clouds or paper; blurred blobs for glow; `pattern` for repeats.
- Text: use system font stacks (`Inter, Helvetica, Arial, sans-serif`, `Georgia, serif`) or embed a Google Font in HTML only when network allows. Keep headline text large, high contrast, and inside safe margins.
- HTML mode is handy for posters/social cards with CSS layout (flex/grid), CSS gradients, `backdrop-filter`, and emoji.
- Common sizes: social post 1080×1080, story 1080×1920, YouTube thumbnail 1280×720, OG/banner 1200×630, icon 512×512, wallpaper 1920×1080.

## Engine: infographic (explainer posters)
Write a spec file (CommonJS) and render it:
```bash
node .claude/skills/image-gen/scripts/infographic.cjs my-poster.cjs images/my-poster.png [--scale 1.5] [--html debug.html]
```
Start by copying the closest example in `examples/` (each renders in about 1 s):
| Example | Theme | Shows |
|---|---|---|
| `gradient-divergence-curl.cjs` | `classic`, bar headers | 3D bump with gradient arrow, radial source, curl rings, contour plot, lit cube, tube (blood vessel) |
| `types-of-integrals.cjs` | `paper` (graph paper, serif title) | area under curve, surface over region, blob in box, line integral in a field, flux arrows, measure bars, icon strip |
| `coordinate-systems.cjs` | `classic`, tinted headers | Cartesian box, cylinder, wire sphere with θ/φ arcs, aligned conversion formulas, cube/cylinder/sphere icons |
| `math-behind-ai.cjs` | `sketch` (marker font, pastel pills) | jet-coloured loss surface with gradient-descent path, neural nets, neuron flow, ReLU/sigmoid plots |

**Spec shape** (`module.exports = ({ fig2d, fig3d, tex }) => ({ ... })`):
- Page: `theme` (`classic` | `paper` | `sketch` | custom object), `title`, `subtitle`, `header` (default card header: `bar` | `tint` | `plain` | `pill` | `none`), `width` (1600), `height` (`'a4'` or px to force a page size), `footer` (default `'Muth Boravy'`, `false` to hide), `footerStyle` (`line` | `script`), sizes `titleSize subtitleSize cardTitleSize textSize formulaSize`, extra `css`, `logo` (SVG/HTML).
- `rows: [{ cols: [1, 1, 1], gap, heading?, cards: [card…] }]`. Card: `{ title, sub, tone, header, titleSize, bg, flat, body: [block…] }`. Tones per theme: classic `coral teal gold slate plum ink`; paper `rust green crimson slate orange indigo sand`; sketch `pink blue yellow green lavender peach sky`.
- Blocks: `{p}` text (inline math `\( \)`), `{h}` small heading, `{tex, box?, bg?, size?}` display formula (auto-shrinks to fit), `{fig, caption?}` any SVG, `{cols:[[blocks],[blocks]], widths}`, `{list}`, `{legend:[[sym, meaning]]}`, `{note}`, `{space}`, `{divider}`, or a raw HTML string.

**Figures** (all return SVG strings; labels are LaTeX):
- `fig3d.Scene({width,height,scale,azimuth,elevation,center})`: `.graph(f,{x,y,cmap})`, `.surface(S(u,v),{u,v,cmap|color,grid,opacity,colorBy})` (lit + depth-sorted), `.polygon`, `.curve(points,{dash,dashBack})`, `.circle`, `.arrow(p,q,{color,label})`, `.axes({x,y,z,labels})`, `.point`, `.label(p,tex)`, `.box`, `.cylinder`, `.wireSphere`, `.arc(center,from,to,r,{fill,arrow})`, `.svg()`. Helpers `revolve(profile)` (pots, vases), `tube(curve, radius)` (handles, vessels, wires). Colour maps `warm coral teal mint rdbu jet pink sand slate` or `ramp([...hex])`.
- `fig2d`: `plot({fns,fills,rects,vlines,hlines,points,ticks})`, `field({F})`, `radial({inward})` (source/sink), `swirl()` (rotation), `contours({f,levels})`, `nnet({layers,inputs,outputs,gapAfter})`, `ball`, `cube`, `cylinderIcon`, `icon('segment'|'area'|'volume'|'surface'|'curve')`, `arrow(x1,y1,x2,y2)`, `wrap(w,h,svgBody)`.

**Multi-page A4**: give the spec `pages: [{ rows, title?, subtitle?, …overrides }, …]` instead of `rows`. Shared fields (theme, sizes, css, footer) come from the top level; each page is A4 (1600×2263 css px), footer pinned to the bottom, `Page n / N` top-right (`pageLabels: false` to hide). Output: `out-1.png`, `out-2.png`, …; add `--pdf out.pdf` for one A4 PDF. Split long topics into logical pages instead of squeezing, and render once at `--scale 1` to check nothing overflows (a warning is printed if a page is too tall).

Workflow: build the spec, render at `--scale 1`, look at it, fix overlaps (move labels with `dx/dy`, change `azimuth/elevation`, adjust `cols` widths), then render the final at `--scale 1.5`–`2`. Do not copy watermarks/brand names from reference images; the footer carries the user's name.

## Engine: handwrite (A4 handwriting)
Write the text to a `.txt`/`.md` file (keep the user's wording and line breaks), then:
```bash
node .claude/skills/image-gen/scripts/handwrite.cjs notes.md --out images/notes \
  [--font caveat|kalam|patrick-hand|indie-flower|homemade-apple|shadows-into-light|gloria-hallelujah|dancing-script|architects-daughter|nanum-pen-script|reenie-beanie|just-another-hand|random] \
  [--paper ruled|grid|dotted|plain] [--columns 2] [--ink blue|black|red|green|purple|pencil|#hex] \
  [--header "Name: ...   Date: ..."] [--title "..."] [--line 34] [--size 1.1] [--jitter 1] [--seed 7] [--pdf] [--scale 2] [--texture] [--katex <node_modules dir>]
node .claude/skills/image-gen/scripts/handwrite.cjs --list-fonts      # names of all fonts and inks
node .claude/skills/image-gen/scripts/handwrite.cjs --sample --out images/font-sample   # every font on one sheet
```
- **A4 splitting**: text flows automatically onto as many A4 pages as needed (`notes-1.png`, `notes-2.png`, …; one page → `notes.png`). `--columns 2` splits each A4 sheet into two columns. Long lines wrap and continue in the next column/page mid-paragraph. Force breaks with a line containing only `\newpage` or `\columnbreak`.
- **Paper**: `ruled` (blue lines + red margin, default), `grid` (squared maths paper), `dotted`, `plain`. Letters sit on the lines; `--line` sets line spacing in px (34 ≈ 9 mm).
- **Realism**: each word gets a small random tilt, baseline drift, size change and ink-pressure variation; `--jitter 0` is neat, `2` is messy. `--seed` changes the "handwriting take" while staying reproducible.
- **Several fonts / inks in one document**: put `@font kalam`, `@ink red` or `@size 1.2` on their own line; they apply to the lines below.
- **Formatting**: `# Heading` / `## Sub` (underlined), `- bullet`, `1. numbered`, blank line = empty ruled line, `**bold**`, `~~crossed out~~`, `==highlighter==`.
- **Handwritten maths** (stays in the handwriting font): `\frac{1}{4}` → stacked fraction, `A^{-1}`, `x^2`, `a_{n}`, `a_n` → super/subscripts. Use this for a fully handwritten look.
- **Printed maths**: `\( … \)` inline and `\[ … \]` display are typeset with KaTeX when `--katex <dir containing katex>` is given (or KaTeX is installed); otherwise they are written as plain text. KaTeX is printed math in ink colour, not handwriting, so for a fully handwritten look write simple maths as text (`x² + 2x = 1`, `½`, `√2`).
- `--texture` adds a subtle paper grain (looks more like a photo of paper, but PNGs get ~4× larger).
- `--pdf` also writes a real multi-page A4 PDF (`notes.pdf`), ready to print. `--scale 2` (default) gives ~190 dpi PNGs; use `--scale 3` for print-quality images.
- Header (every page) and title (first page) sit above the first line; page numbers `1 / 3` are added bottom-right (`--no-numbers` to hide).

## Combine (AI photo + exact text)
Generate the photo with free-ai, then make an HTML/SVG that uses it as a background `<image href="fox.jpg">` (relative path next to the HTML/SVG file) and overlay the text, and render with `render.cjs`.

## Editing an existing image
- Restyle or retouch: put it in an SVG/HTML as `<image>` and apply CSS filters (`brightness`, `contrast`, `saturate`, `hue-rotate`, `blur`, `grayscale`, `sepia`), crops, frames, overlays and text, then render.
- Simple pixel work (resize, crop, convert, add border) can be done with Python Pillow if installed.

## Always finish by
1. Opening the output with the Read tool to look at it; fix anything off (cropped text, low contrast, wrong size) and re-render.
2. Telling the user the saved path(s), the engine used and, for free-ai, the seed so they can ask for tweaks.
3. Keeping the source SVG/HTML so later edits are quick.

## Limits
- Don't make images impersonating real people, real brands' official logos, or copyrighted characters.
- free-ai is a public community service: it can be slow, rate limited or down; don't send private or sensitive information in prompts.
