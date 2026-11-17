---
name: image-gen
description: Create or generate images for free, with no API key or credits needed. Use when the user asks to create, draw, generate, render or design an image, picture, photo, illustration, logo, icon, poster, banner, thumbnail, social post, sticker, wallpaper, mockup or diagram-style graphic, or to edit/restyle one. Uses a free AI image service (Pollinations/Flux) when reachable and otherwise draws the image offline as SVG/HTML rendered to PNG with local Chromium. Optional OpenAI GPT Image engine only if the user has OPENAI_API_KEY.
---

# Free image generation

Three engines, all driven from `scripts/`. Run commands from the repo root (paths below are relative to it).

| Engine | Cost | Needs | Best for |
|---|---|---|---|
| **free-ai** (`free_ai.py`) | Free, no key | Network access to `image.pollinations.ai` | Photos, realistic scenes, painterly art, characters, landscapes |
| **draw** (`render.cjs`) | Free, offline | Local Chromium + Playwright (preinstalled in Claude Code cloud) | Logos, icons, posters, banners, thumbnails, infographics, anything with exact text, flat/vector/geometric art |
| **openai** (`openai_image.py`) | Paid | `OPENAI_API_KEY` | Only when the user has credits and asks for it |

## Choosing the engine
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
