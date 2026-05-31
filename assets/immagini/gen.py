#!/usr/bin/env python3
"""
gen.py — Stability AI image generator per il progetto «L'ATTESA DEL COLTELLO»
Estetica "ARRESTATA": forma semi-emersa dal rumore, mai risolta.

Uso:
    python3 gen.py \
        --prompt "..." \
        --seed 42 \
        --steps 8 \
        --output /path/to/out.png \
        [--model sd3-large-turbo] \
        [--aspect 1:1] \
        [--negative "..."] \
        [--cfg 3.5]

Legge STABILITY_API_KEY da .env nella stessa cartella dello script
o dalla variabile d'ambiente già impostata.
"""

import argparse
import os
import sys
import json
import time
import base64
from pathlib import Path

def load_env(env_path: Path) -> dict:
    """Legge coppie KEY=VALUE da un file .env; ignora commenti."""
    env = {}
    if not env_path.exists():
        return env
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" in line:
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip()
    return env


UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)


def get_api_key(env: dict) -> str:
    key = os.environ.get("STABILITY_API_KEY") or env.get("STABILITY_API_KEY", "")
    if not key:
        sys.exit("ERRORE: STABILITY_API_KEY non trovata in .env né nelle variabili d'ambiente.")
    return key


def _curl_get_json(api_key: str, url: str) -> dict:
    """GET JSON via curl (aggira il blocco Cloudflare 1010 su urllib)."""
    import subprocess
    r = subprocess.run(
        [
            "curl", "-s", "-w", "\n%{http_code}",
            "-H", f"Authorization: Bearer {api_key}",
            "-H", "Accept: application/json",
            "-A", UA,
            url,
        ],
        capture_output=True, text=True, timeout=20,
    )
    lines = r.stdout.strip().split("\n")
    code = int(lines[-1]) if lines[-1].isdigit() else 0
    body = "\n".join(lines[:-1])
    if code == 200:
        return json.loads(body)
    raise RuntimeError(f"HTTP {code}: {body[:200]}")


def check_credits(api_key: str):
    """Interroga l'account Stability AI per crediti residui."""
    for url in [
        "https://api.stability.ai/v1/user/balance",
        "https://api.stability.ai/v1/user/account",
    ]:
        try:
            return _curl_get_json(api_key, url)
        except Exception as e:
            print(f"[WARN] {url} → {e}", file=sys.stderr)
    return None


def generate_image(
    api_key: str,
    prompt: str,
    negative_prompt: str,
    seed: int,
    steps: int,
    output_path: Path,
    model: str = "sd3-large-turbo",
    aspect: str = "1:1",
    cfg_scale: float = 3.5,
) -> dict:
    """
    Chiama Stability AI Stable Diffusion 3 (REST v2beta) e salva il PNG.
    Restituisce un dict con esito e metadati.

    Modello scelto: sd3-large-turbo — 4 crediti/immagine, supporta steps liberi.
    Con steps bassi (6-10) la denoising si arresta sul latente semi-risolto:
    forma accennata, grana visibile — look "arrestato" del progetto.
    """
    import subprocess

    url = "https://api.stability.ai/v2beta/stable-image/generate/sd3"
    tmp_out = Path("/tmp/stability_resp.json")

    max_attempts = 3
    for attempt in range(1, max_attempts + 1):
        print(f"[{attempt}/{max_attempts}] POST {url} — steps={steps} seed={seed} model={model}")

        cmd = [
            "curl", "-s", "-w", "\n%{http_code}",
            "-o", str(tmp_out),
            "-H", f"Authorization: Bearer {api_key}",
            "-H", "Accept: application/json",
            "-A", UA,
            "-F", f"prompt={prompt}",
            "-F", f"negative_prompt={negative_prompt}",
            "-F", f"model={model}",
            "-F", f"seed={seed}",
            "-F", f"steps={steps}",
            "-F", f"aspect_ratio={aspect}",
            "-F", f"cfg_scale={cfg_scale}",
            "-F", "output_format=png",
            url,
        ]

        try:
            r = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
            http_code_str = r.stdout.strip().split("\n")[-1]
            http_code = int(http_code_str) if http_code_str.isdigit() else 0

            if http_code == 200:
                resp_body = tmp_out.read_bytes()
                data = json.loads(resp_body)
                if "image" in data:
                    img_bytes = base64.b64decode(data["image"])
                    output_path.parent.mkdir(parents=True, exist_ok=True)
                    output_path.write_bytes(img_bytes)
                    print(f"[OK] Salvata: {output_path} ({len(img_bytes)//1024} KB)")
                    return {
                        "success": True,
                        "path": str(output_path),
                        "finish_reason": data.get("finish_reason", ""),
                        "seed": data.get("seed", seed),
                    }
                else:
                    err = str(data)
                    print(f"[WARN] risposta senza 'image': {err}", file=sys.stderr)
                    return {"success": False, "error": err}
            else:
                body_err = tmp_out.read_text(errors="replace") if tmp_out.exists() else r.stderr
                print(f"[ERRORE HTTP {http_code}]: {body_err[:300]}", file=sys.stderr)
                if attempt < max_attempts:
                    time.sleep(4)
                else:
                    return {"success": False, "error": f"HTTP {http_code}: {body_err[:300]}"}

        except Exception as e:
            print(f"[ERRORE] {type(e).__name__}: {e}", file=sys.stderr)
            if attempt < max_attempts:
                time.sleep(4)
            else:
                return {"success": False, "error": str(e)}


def main():
    parser = argparse.ArgumentParser(description="Stability AI generator — estetica ARRESTATA")
    parser.add_argument("--prompt", required=True)
    parser.add_argument("--negative", default="sharp, crisp, resolved, detailed, colorful, vivid")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--steps", type=int, default=8)
    parser.add_argument("--output", required=True)
    parser.add_argument("--model", default="sd3-large-turbo")
    parser.add_argument(
        "--aspect",
        default="1:1",
        choices=["21:9","16:9","3:2","5:4","1:1","4:5","2:3","9:16","9:21"],
        help="Aspect ratio supportati da SD3"
    )
    parser.add_argument("--cfg", type=float, default=3.5)
    parser.add_argument("--check-credits", action="store_true", help="Mostra solo crediti residui ed esci")
    args = parser.parse_args()

    # Trova .env risalendo da questo script
    script_dir = Path(__file__).resolve().parent
    env_candidates = [
        script_dir / ".env",
        script_dir.parent / ".env",
        script_dir.parent.parent / ".env",
        Path("/Users/carlosanvoisin/Desktop/IED/.env"),
    ]
    env = {}
    for p in env_candidates:
        if p.exists():
            env = load_env(p)
            break

    api_key = get_api_key(env)

    # Controllo crediti
    balance = check_credits(api_key)
    if balance:
        credits = balance.get("credits", "?")
        print(f"[INFO] Crediti residui prima della generazione: {credits}")

    if args.check_credits:
        return

    result = generate_image(
        api_key=api_key,
        prompt=args.prompt,
        negative_prompt=args.negative,
        seed=args.seed,
        steps=args.steps,
        output_path=Path(args.output),
        model=args.model,
        aspect=args.aspect,
        cfg_scale=args.cfg,
    )

    # Crediti dopo
    balance_after = check_credits(api_key)
    if balance_after:
        print(f"[INFO] Crediti residui dopo la generazione: {balance_after.get('credits', '?')}")

    if not result["success"]:
        sys.exit(f"Generazione fallita: {result.get('error')}")

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
