#!/usr/bin/env python3
"""Generate or edit images with OpenAI's GPT Image models (stdlib only).

Generation: POST https://api.openai.com/v1/images/generations (JSON)
Edits:      POST https://api.openai.com/v1/images/edits (multipart, when --image is given)
"""
import argparse
import base64
import json
import mimetypes
import os
import sys
import urllib.error
import urllib.request
import uuid
from pathlib import Path

API_BASE = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
DEFAULT_MODEL = os.environ.get("OPENAI_IMAGE_MODEL", "gpt-image-1")


def parse_args():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--prompt", required=True, help="Text prompt (or @file.txt to read it from a file)")
    p.add_argument("--out", default="images/image.png", help="Output path; numbered when --n > 1")
    p.add_argument("--model", default=DEFAULT_MODEL)
    p.add_argument("--size", default="auto", choices=["auto", "1024x1024", "1536x1024", "1024x1536"])
    p.add_argument("--quality", default="medium", choices=["auto", "low", "medium", "high"])
    p.add_argument("--background", default="auto", choices=["auto", "transparent", "opaque"])
    p.add_argument("--format", dest="output_format", default=None, choices=["png", "jpeg", "webp"],
                   help="Defaults to the --out file extension")
    p.add_argument("--compression", type=int, default=None, help="0-100, for jpeg/webp")
    p.add_argument("--n", type=int, default=1, help="Number of images (1-10)")
    p.add_argument("--moderation", default=None, choices=["auto", "low"])
    p.add_argument("--image", action="append", default=[], help="Input image for editing (repeatable)")
    p.add_argument("--mask", default=None, help="PNG mask; transparent pixels are repainted")
    p.add_argument("--input-fidelity", default=None, choices=["low", "high"],
                   help="Edits only: how closely to preserve input details such as faces")
    p.add_argument("--timeout", type=int, default=300)
    p.add_argument("--dry-run", action="store_true", help="Print the request and exit")
    return p.parse_args()


def build_fields(a):
    prompt = a.prompt
    if prompt.startswith("@"):
        prompt = Path(prompt[1:]).read_text(encoding="utf-8").strip()
    fmt = a.output_format or {".jpg": "jpeg", ".jpeg": "jpeg", ".webp": "webp"}.get(Path(a.out).suffix.lower(), "png")
    if a.background == "transparent" and fmt == "jpeg":
        sys.exit("error: transparent background needs png or webp output")
    if not 1 <= a.n <= 10:
        sys.exit("error: --n must be between 1 and 10")
    fields = {"model": a.model, "prompt": prompt, "n": a.n, "size": a.size,
              "quality": a.quality, "background": a.background, "output_format": fmt}
    if a.compression is not None:
        fields["output_compression"] = a.compression
    if a.moderation:
        fields["moderation"] = a.moderation
    if a.image and a.input_fidelity:
        fields["input_fidelity"] = a.input_fidelity
    return fields, fmt


def multipart(fields, files):
    boundary = "----imagegen" + uuid.uuid4().hex
    body = bytearray()
    for k, v in fields.items():
        body += f"--{boundary}\r\nContent-Disposition: form-data; name=\"{k}\"\r\n\r\n{v}\r\n".encode()
    for name, path in files:
        data = Path(path).read_bytes()
        ctype = mimetypes.guess_type(path)[0] or "application/octet-stream"
        body += (f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"; "
                 f"filename=\"{Path(path).name}\"\r\nContent-Type: {ctype}\r\n\r\n").encode()
        body += data + b"\r\n"
    body += f"--{boundary}--\r\n".encode()
    return bytes(body), f"multipart/form-data; boundary={boundary}"


def main():
    a = parse_args()
    fields, fmt = build_fields(a)
    editing = bool(a.image)
    url = f"{API_BASE}/images/{'edits' if editing else 'generations'}"

    if a.dry_run:
        print(json.dumps({"url": url, "fields": fields, "images": a.image, "mask": a.mask}, indent=2))
        return

    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        sys.exit("error: OPENAI_API_KEY is not set")

    if editing:
        files = [("image[]" if len(a.image) > 1 else "image", p) for p in a.image]
        if a.mask:
            files.append(("mask", a.mask))
        data, ctype = multipart(fields, files)
    else:
        data, ctype = json.dumps(fields).encode(), "application/json"

    req = urllib.request.Request(url, data=data, method="POST",
                                 headers={"Authorization": f"Bearer {key}", "Content-Type": ctype})
    try:
        with urllib.request.urlopen(req, timeout=a.timeout) as r:
            resp = json.load(r)
    except urllib.error.HTTPError as e:
        detail = e.read().decode(errors="replace")
        try:
            detail = json.loads(detail)["error"]["message"]
        except Exception:
            pass
        sys.exit(f"error: API returned {e.code}: {detail}")

    out = Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    ext = "jpg" if fmt == "jpeg" else fmt
    saved = []
    for i, item in enumerate(resp.get("data", []), 1):
        path = out.with_suffix(f".{ext}") if a.n == 1 else out.with_name(f"{out.stem}-{i}.{ext}")
        if item.get("b64_json"):
            path.write_bytes(base64.b64decode(item["b64_json"]))
        elif item.get("url"):
            urllib.request.urlretrieve(item["url"], path)
        else:
            continue
        saved.append({"path": str(path), "revised_prompt": item.get("revised_prompt")})

    meta = {"request": fields, "images": a.image, "mask": a.mask, "outputs": saved, "usage": resp.get("usage")}
    out.with_suffix(".json").write_text(json.dumps(meta, indent=2))
    for s in saved:
        print(s["path"])
    if not saved:
        sys.exit("error: no images in response")


if __name__ == "__main__":
    main()
