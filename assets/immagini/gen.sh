#!/usr/bin/env bash
# gen.sh — wrapper bash+curl per Stability AI SD3
# Legge STABILITY_API_KEY da ../../.env (relativo a questo script)
# Uso: ./gen.sh --prompt "..." --seed 42 --steps 8 --output ./out.png [--model sd3-large-turbo]
#
# Parametri disponibili:
#   --prompt   testo del prompt (obbligatorio)
#   --negative testo del negative prompt
#   --seed     seed intero
#   --steps    numero di step (basso = look arrestato: 6-12)
#   --output   percorso file output .png (obbligatorio)
#   --model    modello Stability (default: sd3-large-turbo, 4 cr/img)
#   --aspect   aspect ratio (default: 1:1)
#   --cfg      cfg_scale (default: 3.5)
#
# Richiede: curl, python3 (solo per decodifica base64 via gen.py)
# Oppure: usare direttamente gen.py che gestisce tutto in Python.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../../.env"

# Carica .env
if [[ -f "$ENV_FILE" ]]; then
  while IFS='=' read -r key val; do
    key=$(echo "$key" | xargs)
    val=$(echo "$val" | xargs)
    [[ -z "$key" || "$key" == \#* ]] && continue
    export "$key"="$val"
  done < <(grep -v '^#' "$ENV_FILE")
fi

if [[ -z "${STABILITY_API_KEY:-}" ]]; then
  echo "ERRORE: STABILITY_API_KEY non trovata in $ENV_FILE" >&2
  exit 1
fi

# Defaults
PROMPT=""
NEGATIVE="sharp, crisp, resolved, detailed, colorful, vivid"
SEED=42
STEPS=8
OUTPUT=""
MODEL="sd3-large-turbo"
ASPECT="1:1"
CFG="3.5"

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --prompt)   PROMPT="$2";   shift 2 ;;
    --negative) NEGATIVE="$2"; shift 2 ;;
    --seed)     SEED="$2";     shift 2 ;;
    --steps)    STEPS="$2";    shift 2 ;;
    --output)   OUTPUT="$2";   shift 2 ;;
    --model)    MODEL="$2";    shift 2 ;;
    --aspect)   ASPECT="$2";   shift 2 ;;
    --cfg)      CFG="$2";      shift 2 ;;
    *) echo "Argomento sconosciuto: $1" >&2; exit 1 ;;
  esac
done

[[ -z "$PROMPT" ]] && { echo "ERRORE: --prompt obbligatorio" >&2; exit 1; }
[[ -z "$OUTPUT" ]] && { echo "ERRORE: --output obbligatorio" >&2; exit 1; }

echo "[INFO] model=$MODEL steps=$STEPS seed=$SEED aspect=$ASPECT cfg=$CFG"
echo "[INFO] output=$OUTPUT"

mkdir -p "$(dirname "$OUTPUT")"

# Crediti prima
UA_BAL="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
BALANCE=$(curl -sf \
  "https://api.stability.ai/v1/user/balance" \
  -H "Authorization: Bearer ${STABILITY_API_KEY}" \
  -A "$UA_BAL" 2>/dev/null || echo '{}')
echo "[INFO] Crediti prima: $(echo "$BALANCE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('credits','N/A'))" 2>/dev/null || echo 'N/A')"

# Genera (risposta JSON con image in base64)
MAX_ATTEMPTS=3
ATTEMPT=0
SUCCESS=false

until [[ "$ATTEMPT" -ge "$MAX_ATTEMPTS" ]]; do
  ATTEMPT=$((ATTEMPT + 1))
  echo "[${ATTEMPT}/${MAX_ATTEMPTS}] Invio richiesta a Stability AI..."

  # Nota: -A browser UA necessario per superare Cloudflare 1010
  UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
  HTTP_CODE=$(curl -s -w "%{http_code}" -o /tmp/stability_resp.json \
    "https://api.stability.ai/v2beta/stable-image/generate/sd3" \
    -H "Authorization: Bearer ${STABILITY_API_KEY}" \
    -H "Accept: application/json" \
    -A "$UA" \
    -F "prompt=${PROMPT}" \
    -F "negative_prompt=${NEGATIVE}" \
    -F "model=${MODEL}" \
    -F "seed=${SEED}" \
    -F "steps=${STEPS}" \
    -F "aspect_ratio=${ASPECT}" \
    -F "cfg_scale=${CFG}" \
    -F "output_format=png" 2>/dev/null)

  if [[ "$HTTP_CODE" == "200" ]]; then
    # Estrai e decodifica base64
    python3 -c "
import json, base64, sys
with open('/tmp/stability_resp.json') as f:
    d = json.load(f)
if 'image' not in d:
    print('[ERRORE] Nessun campo image:', d, file=sys.stderr)
    sys.exit(1)
img = base64.b64decode(d['image'])
with open('${OUTPUT}', 'wb') as out:
    out.write(img)
print(f'[OK] Salvata: ${OUTPUT} ({len(img)//1024} KB)')
print(f'[INFO] finish_reason={d.get(\"finish_reason\",\"\")} seed={d.get(\"seed\",\"\")}')
"
    SUCCESS=true
    break
  else
    echo "[ERRORE HTTP $HTTP_CODE]" >&2
    cat /tmp/stability_resp.json >&2
    if [[ "$ATTEMPT" -lt "$MAX_ATTEMPTS" ]]; then
      echo "Nuovo tentativo tra 3s..." >&2
      sleep 3
    fi
  fi
done

if [[ "$SUCCESS" != "true" ]]; then
  echo "FALLITO dopo $MAX_ATTEMPTS tentativi" >&2
  exit 1
fi

# Crediti dopo
BALANCE2=$(curl -sf \
  "https://api.stability.ai/v1/user/balance" \
  -H "Authorization: Bearer ${STABILITY_API_KEY}" \
  -A "$UA_BAL" 2>/dev/null || echo '{}')
echo "[INFO] Crediti dopo: $(echo "$BALANCE2" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('credits','N/A'))" 2>/dev/null || echo 'N/A')"
