#!/usr/bin/env python3
"""Free AI image generation with Pollinations (no API key, no credits).

Calls GET https://image.pollinations.ai/prompt/{prompt}?width=&height=&model=&seed=&nologo=true
and saves the returned image. If POLLINATIONS_TOKEN is set it is sent as a Bearer token
(optional; gives higher rate limits). Exit code 3 means the service could not be reached,
so the caller should fall back to the offline "draw" engine.
"""
import argparse
import json
import os
import random
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ENDPOINTS = [
    "https://image.pollinations.ai/prompt/{p}",
    "https://gen.pollinations.ai/image/{p}",
]
SIZES = {"square": (1024, 1024), "landscape": (1344, 768), "portrait": (768, 1344),
         "wide": (1536, 640), "story": (720, 1280)}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--prompt", required=True, help="Prompt text, or @file.txt")
    ap.add_argument("--out", default="images/image.jpg")
    ap.add_argument("--size", default="square", help=f"{', '.join(SIZES)} or WxH (e.g. 1280x720)")
    ap.add_argument("--model", default="flux", help="flux (default), turbo, or another Pollinations model")
    ap.add_argument("--seed", type=int, default=None, help="Fixed seed for reproducible results")
    ap.add_argument("--n", type=int, default=1, help="Number of variations (different seeds)")
    ap.add_argument("--enhance", action="store_true", help="Let the service expand the prompt")
    ap.add_argument("--timeout", type=int, default=180)
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    prompt = Path(a.prompt[1:]).read_text().strip() if a.prompt.startswith("@") else a.prompt
    if a.size in SIZES:
        w, h = SIZES[a.size]
    else:
        try:
            w, h = (int(x) for x in a.size.lower().split("x"))
        except ValueError:
            sys.exit(f"error: bad --size {a.size!r}")

    out = Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    headers = {"User-Agent": "image-gen-skill/1.0"}
    if os.environ.get("POLLINATIONS_TOKEN"):
        headers["Authorization"] = f"Bearer {os.environ['POLLINATIONS_TOKEN']}"

    saved, unreachable = [], False
    for i in range(a.n):
        seed = a.seed + i if a.seed is not None else random.randint(1, 2**31 - 1)
        q = urllib.parse.urlencode({"width": w, "height": h, "model": a.model, "seed": seed,
                                    "nologo": "true", "enhance": str(a.enhance).lower()})
        enc = urllib.parse.quote(prompt, safe="")
        path = out if a.n == 1 else out.with_name(f"{out.stem}-{i + 1}{out.suffix}")
        if a.dry_run:
            print(ENDPOINTS[0].format(p=enc) + "?" + q)
            continue
        data, last_err = None, None
        for ep in ENDPOINTS:
            for attempt in range(2):
                try:
                    req = urllib.request.Request(ep.format(p=enc) + "?" + q, headers=headers)
                    with urllib.request.urlopen(req, timeout=a.timeout) as r:
                        if not r.headers.get("Content-Type", "").startswith("image/"):
                            raise ValueError(f"not an image: {r.headers.get('Content-Type')}")
                        data = r.read()
                    break
                except urllib.error.HTTPError as e:
                    last_err = f"HTTP {e.code}"
                    if e.code == 429:
                        time.sleep(5 * (attempt + 1))
                        continue
                    break
                except (urllib.error.URLError, OSError, ValueError) as e:
                    last_err = str(e)
                    break
            if data:
                break
        if not data:
            unreachable = True
            print(f"error: free AI service failed ({last_err})", file=sys.stderr)
            break
        path.write_bytes(data)
        saved.append({"path": str(path), "seed": seed})
        print(path)

    if saved:
        out.with_suffix(".json").write_text(json.dumps(
            {"engine": "pollinations", "prompt": prompt, "size": [w, h], "model": a.model, "outputs": saved}, indent=2))
    if unreachable:
        print("hint: use the offline draw engine (render.cjs) instead", file=sys.stderr)
        sys.exit(3)


if __name__ == "__main__":
    main()
