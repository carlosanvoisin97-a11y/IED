#!/usr/bin/env python3
"""
veo_gen.py — Genera op7 "Interpolazione (il verdetto tra due volti)" con Veo
(ULTIMO modello) via Gemini API. Long-running operation + polling.

Tenta in ordine i modelli piu' recenti; max 3 tentativi totali. Una sola clip.
Salva il primo MP4 ottenuto in --out. NON stampa la API key.
"""
from __future__ import annotations

import base64
import json
import os
import subprocess
import sys
import time
from pathlib import Path

API_ROOT = "https://generativelanguage.googleapis.com/v1beta"

# Modelli da tentare, dal piu' recente. Max 3 tentativi (sotto).
MODELS = [
    "veo-3.1-generate-preview",
    "veo-3.1-fast-generate-preview",
    "veo-3.0-generate-001",
]

PROMPT = (
    "Extreme slow continuous morph between two human faces interpolating in latent "
    "space, the features endlessly dissolving and reforming and never settling on a "
    "single resolved face, an unfinished portrait caught between two identities, "
    "ambiguous and suspended, the verdict never reached. Monochrome bone white and "
    "breath grey palette with a single restrained dark red that never fully arrives, "
    "heavy diffusion film grain, soft raking light, painterly, muted, melancholic, "
    "very slow almost frozen motion, held breath, no resolution, faces drifting in "
    "noise. Cold sterile air of an empty slaughterhouse, threshold before the knife."
)
NEGATIVE = (
    "colorful, saturated, vivid, bright, sharp crisp resolved photoreal face, "
    "fast motion, cuts, text, captions, logo, smiling, cheerful, clean studio"
)


def load_key() -> str:
    # estratto senza stampare; passato anche via env dal chiamante
    k = os.environ.get("GEMINI_API_KEY", "").strip()
    if k:
        return k
    env = Path("/Users/carlosanvoisin/Desktop/IED/.env")
    for line in env.read_text().splitlines():
        if line.startswith("GEMINI_API_KEY="):
            return line.split("=", 1)[1].strip()
    sys.exit("ERRORE: GEMINI_API_KEY non trovata")


def _curl_json(method: str, url: str, payload: dict | None = None) -> tuple[int, str]:
    cmd = ["curl", "-s", "-w", "\n%{http_code}", "-X", method, url,
           "-H", "Content-Type: application/json"]
    if payload is not None:
        cmd += ["-d", json.dumps(payload)]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    lines = r.stdout.strip().split("\n")
    code = int(lines[-1]) if lines[-1].isdigit() else 0
    body = "\n".join(lines[:-1])
    return code, body


def start_op(key: str, model: str) -> tuple[int, str]:
    url = f"{API_ROOT}/models/{model}:predictLongRunning?key={key}"
    payload = {
        "instances": [{"prompt": PROMPT}],
        "parameters": {
            "aspectRatio": "16:9",
            "negativePrompt": NEGATIVE,
        },
    }
    return _curl_json("POST", url, payload)


def poll(key: str, op_name: str, timeout_s: int = 360) -> dict:
    url = f"{API_ROOT}/{op_name}?key={key}"
    t0 = time.time()
    while time.time() - t0 < timeout_s:
        code, body = _curl_json("GET", url)
        if code != 200:
            print(f"[poll HTTP {code}] {body[:300]}", file=sys.stderr)
            time.sleep(8)
            continue
        data = json.loads(body)
        if data.get("done"):
            return data
        print(f"  ...running ({int(time.time()-t0)}s)")
        time.sleep(10)
    return {"done": False, "error": "timeout"}


def extract_and_save(key: str, result: dict, out: Path) -> bool:
    """Cerca il video nel result dell'operazione e lo salva. Gestisce sia
    bytesBase64Encoded sia un URI (file/download) da scaricare con la key."""
    resp = result.get("response", {})
    # vari schemi possibili a seconda della versione
    candidates = []
    for key_path in ("generateVideoResponse", "generatedVideos", "predictions"):
        v = resp.get(key_path)
        if v:
            candidates.append((key_path, v))
    blob = json.dumps(resp)
    print(f"[debug] response keys: {list(resp.keys())}", file=sys.stderr)

    # 1) prova a trovare un URI
    import re
    uris = re.findall(r'"(?:uri|videoUri|video)"\s*:\s*"([^"]+)"', blob)
    uris = [u for u in uris if u.startswith("http")]
    for uri in uris:
        sep = "&" if "?" in uri else "?"
        dl = f"{uri}{sep}key={key}"
        r = subprocess.run(["curl", "-s", "-L", "-o", str(out), "-w", "%{http_code}", dl],
                           capture_output=True, text=True, timeout=300)
        if out.exists() and out.stat().st_size > 10000:
            print(f"[OK] scaricato da URI ({out.stat().st_size//1024} KB)")
            return True

    # 2) prova base64 inline
    b64s = re.findall(r'"bytesBase64Encoded"\s*:\s*"([^"]+)"', blob)
    if b64s:
        out.write_bytes(base64.b64decode(b64s[0]))
        print(f"[OK] salvato da base64 ({out.stat().st_size//1024} KB)")
        return True

    print("[ERR] nessun video trovato nel response", file=sys.stderr)
    print(blob[:800], file=sys.stderr)
    return False


def main():
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(
        "/Users/carlosanvoisin/Desktop/IED/assets/video/op7_veo.mp4")
    key = load_key()
    tried = []
    attempts = 0
    for model in MODELS:
        if attempts >= 3:
            break
        attempts += 1
        tried.append(model)
        print(f"\n=== Tentativo {attempts}/3: {model} ===")
        code, body = start_op(key, model)
        if code != 200:
            print(f"[start HTTP {code}] {body[:400]}", file=sys.stderr)
            continue
        op = json.loads(body)
        op_name = op.get("name", "")
        print(f"[op] {op_name}")
        result = poll(key, op_name)
        if not result.get("done"):
            print(f"[FAIL] operazione non completata: {result}", file=sys.stderr)
            continue
        if "error" in result:
            print(f"[op error] {json.dumps(result['error'])[:400]}", file=sys.stderr)
            continue
        if extract_and_save(key, result, out):
            print(json.dumps({"success": True, "model": model, "out": str(out),
                              "tried": tried}))
            return
    print(json.dumps({"success": False, "tried": tried}))
    sys.exit(2)


if __name__ == "__main__":
    main()
