#!/usr/bin/env python3
"""
arresto.py — Post-processing "ARRESTO" per «L'ATTESA DEL COLTELLO» (IED Roma 2026)

Il look NON si spera dal modello: si GARANTISCE qui.
Pipeline (CONCEPT.md §6, brief):
  a. desatura a quasi-grigio
  b. gradient-map alla palette osso/grigio-fiato (shadow->midtone->highlight)
  c. rosso trattenuto #7A2E26 SOLO in una piccola maschera a bassa opacita'
     (il sangue che non cade)
  d. grana gaussiana 8-15% (grana di diffusione visibile)
  e. ARRESTO: fonde la figura con un CAMPO DI RUMORE tramite maschera a
     gradiente/vignetta -> la forma si dissolve nella grana ai bordi e resta
     semi-emersa (~40-55% risolta, mai di piu'). Firma del progetto.

Uso:
    python3 arresto.py --in base.png --out finale.png [opzioni]

Dipendenze: Pillow, numpy
"""

import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


# ---------------------------------------------------------------------------
# Palette identita' del sito (HEX dal brief)
# ---------------------------------------------------------------------------
PALETTE = {
    "shadow_deep": "#0B0A0A",   # ombre profonde
    "shadow":      "#221B18",   # ombre
    "midtone":     "#6E6661",   # mezzitoni grigio-fiato
    "highlight":   "#D9CFC2",   # alte luci osso
    "highlight_hi":"#EAE3D6",   # alte luci osso chiare
    "red":         "#7A2E26",   # rosso trattenuto che non arriva
}


def hex_to_rgb(h: str) -> tuple:
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


# ---------------------------------------------------------------------------
# Utility
# ---------------------------------------------------------------------------
def _to_float(img: Image.Image) -> np.ndarray:
    """RGB uint8 PIL -> float array [0,1], shape (H,W,3)."""
    return np.asarray(img.convert("RGB"), dtype=np.float32) / 255.0


def _to_img(arr: np.ndarray) -> Image.Image:
    arr = np.clip(arr, 0.0, 1.0)
    return Image.fromarray((arr * 255.0 + 0.5).astype(np.uint8))


def _luma(arr: np.ndarray) -> np.ndarray:
    """Luminanza percettiva, shape (H,W)."""
    return arr[..., 0] * 0.2126 + arr[..., 1] * 0.7152 + arr[..., 2] * 0.0722


def _smoothstep(x: np.ndarray) -> np.ndarray:
    x = np.clip(x, 0.0, 1.0)
    return x * x * (3.0 - 2.0 * x)


# ---------------------------------------------------------------------------
# a. Desaturazione a quasi-grigio
# ---------------------------------------------------------------------------
def desaturate(arr: np.ndarray, keep: float = 0.06) -> np.ndarray:
    """Riduce la croma quasi a zero. `keep` = frazione di colore residuo."""
    l = _luma(arr)[..., None]
    return l * (1.0 - keep) + arr * keep


# ---------------------------------------------------------------------------
# b. Gradient map alla palette
# ---------------------------------------------------------------------------
def _build_lut(stops, n=256) -> np.ndarray:
    """
    stops: lista di (pos in [0,1], "#hex"). Costruisce LUT (n,3) in [0,1]
    interpolando linearmente tra gli stop ordinati.
    """
    stops = sorted(stops, key=lambda s: s[0])
    pos = np.array([s[0] for s in stops], dtype=np.float32)
    cols = np.array([hex_to_rgb(s[1]) for s in stops], dtype=np.float32) / 255.0
    xs = np.linspace(0.0, 1.0, n, dtype=np.float32)
    lut = np.empty((n, 3), dtype=np.float32)
    for c in range(3):
        lut[:, c] = np.interp(xs, pos, cols[:, c])
    return lut


def gradient_map(arr: np.ndarray, stops, amount: float = 1.0,
                 gamma: float = 1.0) -> np.ndarray:
    """
    Mappa la luminanza sulla LUT della palette. `amount` miscela col
    desaturato originale; `gamma` ridistribuisce i toni (>1 scurisce
    i mezzitoni -> piu' aria/respiro).
    """
    l = _luma(arr)
    if gamma != 1.0:
        l = np.power(np.clip(l, 0, 1), gamma)
    idx = np.clip(l * 255.0, 0, 255).astype(np.int32)
    lut = _build_lut(stops)
    mapped = lut[idx]
    return arr * (1.0 - amount) + mapped * amount


# ---------------------------------------------------------------------------
# c. Rosso trattenuto — piccola maschera, bassa opacita'
# ---------------------------------------------------------------------------
def restrained_red(arr: np.ndarray, *, seed: int, center=(0.5, 0.5),
                   radius: float = 0.14, opacity: float = 0.22,
                   threshold: float = 0.32, mode: str = "blend",
                   tint_strength: float = 0.5) -> np.ndarray:
    """
    Inietta #7A2E26 SOLO in una piccola zona, a bassa opacita', e solo dove
    c'e' gia' un minimo di sostanza (luma>threshold) cosi' tinge la materia,
    non il vuoto. Il sangue che non cade.

    `mode`:
        - "blend": interpola verso il colore assoluto #7A2E26 (default storico).
          Funziona su materia di luma medio (volto, carta), ma su materia molto
          CHIARA il rosso scuro produce solo uno scurimento neutro impercettibile.
        - "tint": spinge la TINTA verso il rosso PRESERVANDO la luminanza locale
          (sottopelle / ematoma che non cade). Si legge come dominante calda anche
          su materia chiara, senza aprire una "ferita". Per op1 (torso quasi bianco).
    `tint_strength`: in modalita' "tint", quanto satura la dominante (0..1).
    """
    h, w = arr.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    cy, cx = center[1] * h, center[0] * w
    r_px = radius * min(h, w)
    d = np.sqrt(((xx - cx) / r_px) ** 2 + ((yy - cy) / r_px) ** 2)
    blob = _smoothstep(1.0 - d)                       # 1 al centro -> 0 al bordo

    # leggera irregolarita' organica
    rng = np.random.default_rng(seed + 7)
    noise = rng.normal(0.0, 1.0, (h, w)).astype(np.float32)
    # sfoca il rumore per macchie morbide
    noise_img = Image.fromarray(((noise - noise.min()) /
                                 (np.ptp(noise) + 1e-6) * 255).astype(np.uint8))
    noise_img = noise_img.filter(ImageFilter.GaussianBlur(radius=min(h, w) * 0.02))
    noise = np.asarray(noise_img, dtype=np.float32) / 255.0
    blob = blob * (0.55 + 0.45 * noise)

    l = _luma(arr)
    substance = _smoothstep((l - threshold) / max(1e-3, (1.0 - threshold)))
    mask = blob * substance * opacity

    red = np.array(hex_to_rgb(PALETTE["red"]), dtype=np.float32) / 255.0
    m = mask[..., None]

    if mode == "tint":
        # Dominante cromatica del rosso a luminanza unitaria: cosi' moltiplicando
        # la materia chiara la TINGE (caldo/rosato) senza scurirla in modo neutro.
        red_luma = float(_luma(red[None, None, :])[0, 0]) + 1e-6
        red_chroma = red[None, None, :] / red_luma          # ~ (1.46, 0.55, 0.49)
        ones = np.ones_like(red_chroma)
        tint = ones * (1.0 - tint_strength) + red_chroma * tint_strength
        tinted = np.clip(arr * tint, 0.0, 1.0)
        return arr * (1.0 - m) + tinted * m

    # "blend": soft-light-ish: tinge verso il rosso senza schiarire (default storico)
    return arr * (1.0 - m) + (arr * (1.0 - 0.35) + red * 0.35) * m


# ---------------------------------------------------------------------------
# d. Grana gaussiana di diffusione
# ---------------------------------------------------------------------------
def add_grain(arr: np.ndarray, *, seed: int, amount: float = 0.11,
              mono: float = 0.85) -> np.ndarray:
    """
    Grana gaussiana visibile. `amount` ~ sigma del rumore. `mono`=1 grana
    in luminanza (filmica), 0 grana cromatica.
    """
    h, w = arr.shape[:2]
    rng = np.random.default_rng(seed + 13)
    mono_n = rng.normal(0.0, 1.0, (h, w, 1)).astype(np.float32)
    chroma_n = rng.normal(0.0, 1.0, (h, w, 3)).astype(np.float32)
    n = mono_n * mono + chroma_n * (1.0 - mono)
    # piu' grana nei mezzitoni (come pellicola/diffusione), meno nei neri puri
    l = _luma(arr)[..., None]
    weight = 1.0 - np.abs(l - 0.5) * 0.9
    return arr + n * amount * weight


# ---------------------------------------------------------------------------
# e. ARRESTO — fusione con campo di rumore (la firma)
# ---------------------------------------------------------------------------
def _noise_field(h: int, w: int, seed: int, palette_stops,
                 bias: float = 0.0, contrast: float = 1.0) -> np.ndarray:
    """
    Campo di rumore multi-scala (cloudy), gradient-mappato alla palette ->
    sembra 'latente non risolto' invece di neve TV.
    `bias` sposta la distribuzione tonale del campo: >0 verso le alte luci
    (mist/osso), <0 verso le ombre. `contrast` allarga/comprime il campo.
    """
    rng = np.random.default_rng(seed + 101)
    acc = np.zeros((h, w), dtype=np.float32)
    total = 0.0
    # ottave ribilanciate verso le ALTE frequenze: look "grana di diffusione /
    # latente non risolto" invece di marezzatura a grandi macchie.
    for octave, weight in [
        (0.06, 0.45),    # nuvolosita' morbida di fondo (un po' di profondita')
        (0.02, 0.50),
        (0.008, 0.60),
        (0.0035, 0.80),  # grana fine
        (0.0015, 1.0),   # grana finissima (dominante)
    ]:
        base = rng.normal(0.0, 1.0, (h, w)).astype(np.float32)
        bimg = Image.fromarray(((base - base.min()) /
                                (np.ptp(base) + 1e-6) * 255).astype(np.uint8))
        rad = max(0.6, min(h, w) * octave)
        bimg = bimg.filter(ImageFilter.GaussianBlur(radius=rad))
        layer = np.asarray(bimg, dtype=np.float32) / 255.0
        acc += layer * weight
        total += weight
    acc /= total
    acc = (acc - acc.min()) / (np.ptp(acc) + 1e-6)
    # contrasto attorno alla media, poi bias additivo
    acc = (acc - 0.5) * contrast + 0.5 + bias
    acc = np.clip(acc, 0.0, 1.0)
    # gradient-map del campo alla stessa palette (toni osso/grigio)
    idx = np.clip(acc * 255.0, 0, 255).astype(np.int32)
    lut = _build_lut(palette_stops)
    field = lut[idx]
    # un filo di grana fine sul campo
    fine = rng.normal(0.0, 1.0, (h, w, 1)).astype(np.float32) * 0.05
    return np.clip(field + fine, 0, 1)


def arrest(arr: np.ndarray, *, seed: int, palette_stops,
           resolve: float = 0.5, edge_softness: float = 0.55,
           vignette: float = 0.6, focus_center=(0.5, 0.46),
           focus_scale=(1.0, 1.0), substance_mode: str = "bright",
           substance_weight: float = 0.55, field_bias: float = 0.0,
           field_contrast: float = 1.0) -> np.ndarray:
    """
    Dissolve la figura nel campo di rumore ai bordi.
    `resolve` ~ frazione max di figura visibile al centro (0.40-0.55).
    `edge_softness` ampiezza della transizione figura->rumore.
    `vignette` quanto i bordi sprofondano nel rumore.
    `substance_mode`: quale parte e' "figura" da preservare:
        - "bright": la materia chiara resta (figura chiara su fondo scuro)
        - "dark":   la materia scura resta (figura scura su fondo chiaro)
        - "mid":    cio' che si discosta dal grigio medio resta
        - "none":   solo la vignetta radiale decide
    `substance_weight`: quanto la sostanza pesa rispetto alla vignetta (0..1).
    La maschera di emersione combina vignetta radiale + sostanza.
    """
    h, w = arr.shape[:2]
    field = _noise_field(h, w, seed, palette_stops,
                         bias=field_bias, contrast=field_contrast)

    # vignetta radiale ellittica
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    cy, cx = focus_center[1] * h, focus_center[0] * w
    ry = (h * 0.62) * focus_scale[1]
    rx = (w * 0.62) * focus_scale[0]
    d = np.sqrt(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2)
    radial = _smoothstep(1.0 - (d - (1.0 - edge_softness)) / max(1e-3, edge_softness))
    radial = radial * vignette + (1.0 - vignette)  # mai del tutto a zero al centro

    # sostanza: quale materia e' "figura" e va preservata dal rumore
    l = _luma(arr)
    lo, hi = np.percentile(l, 4), np.percentile(l, 96)
    ln = np.clip((l - lo) / max(1e-3, (hi - lo)), 0, 1)
    if substance_mode == "dark":
        substance = _smoothstep(1.0 - ln)
    elif substance_mode == "mid":
        substance = _smoothstep(1.0 - np.abs(ln - 0.5) * 2.0)
    elif substance_mode == "none":
        substance = np.ones_like(ln)
    else:  # bright
        substance = _smoothstep(ln)

    sw = float(np.clip(substance_weight, 0.0, 1.0))
    emerge = radial * ((1.0 - sw) + sw * substance)
    emerge = np.clip(emerge, 0, 1) * resolve

    # un po' di micro-rumore sulla maschera stessa -> bordi sfrangiati, non netti
    rng = np.random.default_rng(seed + 211)
    jitter = rng.normal(0.0, 1.0, (h, w)).astype(np.float32)
    jimg = Image.fromarray(((jitter - jitter.min()) /
                            (np.ptp(jitter) + 1e-6) * 255).astype(np.uint8))
    jimg = jimg.filter(ImageFilter.GaussianBlur(radius=min(h, w) * 0.006))
    jitter = (np.asarray(jimg, dtype=np.float32) / 255.0 - 0.5) * 0.18
    emerge = np.clip(emerge + jitter * substance, 0, 1)

    m = emerge[..., None]
    out = field * (1.0 - m) + arr * m
    return out


# ---------------------------------------------------------------------------
# Pipeline completa
# ---------------------------------------------------------------------------
def apply_levels(arr: np.ndarray, black: float = 0.0, white: float = 1.0,
                 contrast: float = 1.0) -> np.ndarray:
    """Livelli semplici: rimappa [black,white]->[0,1], poi contrasto attorno a 0.5."""
    out = (arr - black) / max(1e-3, (white - black))
    out = np.clip(out, 0, 1)
    if contrast != 1.0:
        out = (out - 0.5) * contrast + 0.5
    return np.clip(out, 0, 1)


def process(
    in_path: Path,
    out_path: Path,
    *,
    seed: int = 42,
    # palette / toni
    desat_keep: float = 0.06,
    grad_gamma: float = 1.12,
    grad_amount: float = 1.0,
    palette_variant: str = "default",
    # livelli pre-palette (per estrarre la forma dal fondo)
    lv_black: float = 0.0,
    lv_white: float = 1.0,
    lv_contrast: float = 1.0,
    # rosso
    red_center=(0.5, 0.5),
    red_radius: float = 0.14,
    red_opacity: float = 0.22,
    red_threshold: float = 0.32,
    red_mode: str = "blend",
    red_tint_strength: float = 0.5,
    # grana
    grain: float = 0.11,
    grain_mono: float = 0.85,
    # arresto
    resolve: float = 0.5,
    edge_softness: float = 0.55,
    vignette: float = 0.6,
    focus_center=(0.5, 0.46),
    focus_scale=(1.0, 1.0),
    substance_mode: str = "bright",
    substance_weight: float = 0.55,
    field_bias: float = 0.0,
    field_contrast: float = 1.0,
    # output
    upscale_long: int = 0,
    webp_px: int = 1600,
) -> dict:
    img = Image.open(in_path).convert("RGB")
    # upscale del base PRIMA del processing: grana e rumore renderizzati a piena ris.
    if upscale_long and max(img.size) < upscale_long:
        w0, h0 = img.size
        s = upscale_long / max(w0, h0)
        img = img.resize((round(w0 * s), round(h0 * s)), Image.LANCZOS)
    arr = _to_float(img)

    stops = _palette_stops(palette_variant)

    arr = apply_levels(arr, black=lv_black, white=lv_white, contrast=lv_contrast)
    arr = desaturate(arr, keep=desat_keep)
    arr = gradient_map(arr, stops, amount=grad_amount, gamma=grad_gamma)
    arr = restrained_red(arr, seed=seed, center=red_center, radius=red_radius,
                         opacity=red_opacity, threshold=red_threshold,
                         mode=red_mode, tint_strength=red_tint_strength)
    arr = arrest(arr, seed=seed, palette_stops=stops, resolve=resolve,
                 edge_softness=edge_softness, vignette=vignette,
                 focus_center=focus_center, focus_scale=focus_scale,
                 substance_mode=substance_mode, substance_weight=substance_weight,
                 field_bias=field_bias, field_contrast=field_contrast)
    arr = add_grain(arr, seed=seed, amount=grain, mono=grain_mono)

    final = _to_img(arr)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    final.save(out_path, "PNG")

    # webp ~webp_px sul lato lungo
    webp_path = out_path.with_suffix(".webp")
    w, h = final.size
    scale = webp_px / max(w, h)
    if scale < 1.0:
        small = final.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
    else:
        small = final
    small.save(webp_path, "WEBP", quality=88, method=6)

    return {
        "png": str(out_path),
        "webp": str(webp_path),
        "size": final.size,
        "webp_size": small.size,
    }


def _palette_stops(variant: str):
    """Varianti di gradient-map per differenziare le opere mantenendo l'identita'."""
    p = PALETTE
    if variant == "cooler":   # piu' grigio-fiato, meno osso caldo
        return [
            (0.00, p["shadow_deep"]),
            (0.30, p["shadow"]),
            (0.58, p["midtone"]),
            (0.85, p["highlight"]),
            (1.00, p["highlight_hi"]),
        ]
    if variant == "paper":    # eco pelle/carta: alte luci piu' presenti, contrasto morbido
        return [
            (0.00, p["shadow"]),
            (0.34, "#3A312C"),
            (0.60, p["midtone"]),
            (0.80, p["highlight"]),
            (1.00, p["highlight_hi"]),
        ]
    if variant == "deep":     # piu' buio, figura che affiora dal nero
        return [
            (0.00, p["shadow_deep"]),
            (0.40, p["shadow"]),
            (0.66, p["midtone"]),
            (0.88, p["highlight"]),
            (1.00, p["highlight_hi"]),
        ]
    # default
    return [
        (0.00, p["shadow_deep"]),
        (0.26, p["shadow"]),
        (0.55, p["midtone"]),
        (0.82, p["highlight"]),
        (1.00, p["highlight_hi"]),
    ]


def main():
    ap = argparse.ArgumentParser(description="Post-processing ARRESTO")
    ap.add_argument("--in", dest="in_path", required=True)
    ap.add_argument("--out", dest="out_path", required=True)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--desat-keep", type=float, default=0.06)
    ap.add_argument("--grad-gamma", type=float, default=1.12)
    ap.add_argument("--palette", default="default",
                    choices=["default", "cooler", "paper", "deep"])
    ap.add_argument("--lv-black", type=float, default=0.0)
    ap.add_argument("--lv-white", type=float, default=1.0)
    ap.add_argument("--lv-contrast", type=float, default=1.0)
    ap.add_argument("--red-cx", type=float, default=0.5)
    ap.add_argument("--red-cy", type=float, default=0.5)
    ap.add_argument("--red-radius", type=float, default=0.14)
    ap.add_argument("--red-opacity", type=float, default=0.22)
    ap.add_argument("--red-threshold", type=float, default=0.32)
    ap.add_argument("--red-mode", default="blend", choices=["blend", "tint"],
                    help="blend=colore assoluto (storico); tint=tinta a luminanza "
                         "preservata, per materia chiara (es. torso op1)")
    ap.add_argument("--red-tint-strength", type=float, default=0.5,
                    help="In --red-mode tint: saturazione della dominante calda (0..1)")
    ap.add_argument("--grain", type=float, default=0.11)
    ap.add_argument("--grain-mono", type=float, default=0.85)
    ap.add_argument("--resolve", type=float, default=0.5)
    ap.add_argument("--edge-softness", type=float, default=0.55)
    ap.add_argument("--vignette", type=float, default=0.6)
    ap.add_argument("--focus-cx", type=float, default=0.5)
    ap.add_argument("--focus-cy", type=float, default=0.46)
    ap.add_argument("--focus-sx", type=float, default=1.0)
    ap.add_argument("--focus-sy", type=float, default=1.0)
    ap.add_argument("--substance-mode", default="bright",
                    choices=["bright", "dark", "mid", "none"])
    ap.add_argument("--substance-weight", type=float, default=0.55)
    ap.add_argument("--field-bias", type=float, default=0.0)
    ap.add_argument("--field-contrast", type=float, default=1.0)
    ap.add_argument("--upscale-long", type=int, default=0,
                    help="Upscala il lato lungo del base a N px prima del post (es. 1600)")
    ap.add_argument("--webp-px", type=int, default=1600)
    args = ap.parse_args()

    res = process(
        Path(args.in_path), Path(args.out_path),
        seed=args.seed,
        desat_keep=args.desat_keep,
        grad_gamma=args.grad_gamma,
        palette_variant=args.palette,
        lv_black=args.lv_black,
        lv_white=args.lv_white,
        lv_contrast=args.lv_contrast,
        red_center=(args.red_cx, args.red_cy),
        red_radius=args.red_radius,
        red_opacity=args.red_opacity,
        red_threshold=args.red_threshold,
        red_mode=args.red_mode,
        red_tint_strength=args.red_tint_strength,
        grain=args.grain,
        grain_mono=args.grain_mono,
        resolve=args.resolve,
        edge_softness=args.edge_softness,
        vignette=args.vignette,
        focus_center=(args.focus_cx, args.focus_cy),
        focus_scale=(args.focus_sx, args.focus_sy),
        substance_mode=args.substance_mode,
        substance_weight=args.substance_weight,
        field_bias=args.field_bias,
        field_contrast=args.field_contrast,
        upscale_long=args.upscale_long,
        webp_px=args.webp_px,
    )
    print(res)


if __name__ == "__main__":
    main()
