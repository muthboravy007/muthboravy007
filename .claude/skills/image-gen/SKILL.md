---
name: image-gen
description: Generate or edit images with OpenAI's GPT Image models (the engine behind ChatGPT image generation). Use when the user asks to create, draw, render, design or edit an image, logo, icon, illustration, mockup, poster, thumbnail, sticker or photo, or to change an existing image (inpainting with a mask, style changes, combining reference images). Saves PNG/JPEG/WebP files locally.
---

# Image generation (GPT Image / ChatGPT engine)

This skill calls the OpenAI Images API directly with `scripts/generate.py` (Python 3 standard library only, no `pip install`).

## Requirements
- `OPENAI_API_KEY` must be set in the environment. Never ask the user to paste it into chat.
- Network access to `api.openai.com`.
- Optional: `OPENAI_IMAGE_MODEL` overrides the default model (`gpt-image-1`). For cheaper drafts use `gpt-image-1-mini`, and use a newer GPT Image model if the account has one.

## Workflow
1. **Turn the request into a strong prompt** (see "Prompt recipe" below). Keep the user's intent; add the missing details yourself instead of asking unless the subject itself is unclear.
2. **Pick settings:**
   - `--size`: `1024x1024` square, `1536x1024` landscape, `1024x1536` portrait, or `auto`.
   - `--quality`: `low` for drafts and iterations, `medium` by default, `high` for finals or images with a lot of text.
   - `--background transparent` with `--format png` or `webp` for logos, icons, stickers.
   - `--n` for variations (1–10).
3. **Run** from the repo root:
   ```bash
   python3 .claude/skills/image-gen/scripts/generate.py \
     --prompt "..." --size 1536x1024 --quality medium --out images/hero.png
   ```
   For an edit, pass one or more `--image` files (and optionally `--mask`, a PNG whose transparent area is what gets repainted):
   ```bash
   python3 .claude/skills/image-gen/scripts/generate.py \
     --prompt "Replace the sky with a pink sunset" --image photo.png --mask sky_mask.png --out images/sunset.png
   ```
4. **Check the result:** open the saved file with the Read tool to look at it, compare with the request, and iterate with a revised prompt if anything is wrong (wrong text, extra fingers, wrong layout).
5. **Report** the saved file paths, the final prompt used and the settings. The script also writes a `.json` sidecar with the prompt, revised prompt (when returned) and token usage.

Use `--dry-run` to print the request without calling the API (no key needed).

## Prompt recipe
Write prompts as a short art brief, in this order:
1. **Subject**: who or what, doing what. Be concrete ("a red fox curled asleep on a mossy log").
2. **Setting / composition**: background, camera angle, framing, where things sit ("centered, low angle, shallow depth of field, empty space on the left for a headline").
3. **Style / medium**: photo, 3D render, flat vector, watercolor, isometric, pixel art, film photo, etc. Describe the style in your own words rather than naming a living artist.
4. **Lighting and colour**: "soft golden-hour light", "neon magenta and teal palette".
5. **Text in the image**: put exact text in quotes and name the font feel and placement ("the words \"OPEN DAILY\" in bold white sans-serif at the top"). Use `--quality high` for text.
6. **Constraints**: what must not appear ("no watermark, no extra text, plain white background").

For edits, say what changes and what must stay the same ("Keep the person's face, pose and clothing identical; only change the background to a beach").

## Safety and limits
- OpenAI's usage policy applies; the API will refuse some prompts. If it does, tell the user plainly and suggest a rephrase that keeps their goal.
- Don't generate images that imitate a real person's likeness in a deceptive way, real brands' logos as if official, or copyrighted characters.
- Every call costs money on the user's OpenAI account; prefer `--quality low` while iterating and confirm before large batches (`--n` above 4 or many calls).
