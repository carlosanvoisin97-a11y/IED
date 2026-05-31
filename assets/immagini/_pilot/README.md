# _pilot — Immagini test per l'estetica "ARRESTATA"

Progetto: **L'ATTESA DEL COLTELLO** · IED Roma 2026  
Generato: 2026-05-31  
Modello: `sd3-large-turbo` via Stability AI REST v2beta  
Crediti usati in questo pilota: **8** (4 × 2 immagini)  
Crediti residui dopo il pilota: **992**

---

## Immagine 1 — Studio per un corpo che non diventa carne

**File:** `studio_corpo_non_diventa_carne_s08_seed1991.png`  
**Opera di riferimento:** Corpus n.1 (CONCEPT.md §7)

| Parametro | Valore |
|---|---|
| model | sd3-large-turbo |
| steps | 8 |
| seed | 1991 |
| cfg_scale | 2.5 |
| aspect_ratio | 2:3 |
| crediti | 4 |

**Prompt:**
> a human torso half-emerging from dense diffusion noise, form arrested mid-process, bone white and breath grey tones, a restrained red trace barely visible, visible diffusion grain texture, unresolved threshold, neither flesh nor void, melancholic, monochromatic

**Negative prompt:**
> sharp edges, crisp details, resolved anatomy, colorful, vivid, clean, finished, photorealistic, bright

**Valutazione estetica:**  
- Forma: risolta circa al 70% — il corpo è troppo leggibile. SD3 Turbo converge velocemente anche a 8 steps.
- Palette: FALLISCE — rosso/giallo brillante, luce alogena. Lontana dalla palette osso/grigio-fiato/rosso-trattenuto.
- Grana: non visibile come texture di diffusione; blur morbido.
- Look "arrestato": parziale — c'è una qualità astratta ai bordi ma non è il latente semi-emerso cercato.

**Nota tecnica:** SD3 Turbo è addestrato per convergere rapidamente; la semantica del prompt "mono-cromatico" viene ignorata perché il modello priorizza la leggibilità.

---

## Immagine 2 — Bozza di un volto sotto giudizio

**File:** `bozza_volto_sotto_giudizio_s12_seed1714.png`  
**Opera di riferimento:** Corpus n.5 (CONCEPT.md §7)

| Parametro | Valore |
|---|---|
| model | sd3-large-turbo |
| steps | 12 |
| seed | 1714 |
| cfg_scale | 3.0 |
| aspect_ratio | 2:3 |
| crediti | 4 |

**Prompt:**
> a human face dissolving into diffusion noise at its edges, portrait arrested before resolution, bone white pale skin barely formed, breath grey shadows, a single restrained dark red mark on the cheek, grain of diffusion visible, unfinished threshold, refusing to be recognized or judged, melancholic study

**Negative prompt:**
> sharp focus, crisp, fully resolved, clean background, colorful, vivid, finished portrait, photorealistic, bright

**Valutazione estetica:**  
- Forma: volto riconoscibile al ~85% — troppo risolto per il gesto "arrestato".
- Palette: FALLISCE — verde-teal, azzurro, luce artificiale. Nessuna delle tonalità del brief.
- Bordi: leggero dissolving ai margini — questo è l'unico elemento utile.
- Look "arrestato": minimo.

**Nota tecnica:** Con 12 steps il modello ha ancor più margine per risolvere. Paradossalmente per SD3 Turbo, passare da 8 a 12 step aumenta la risoluzione invece di aiutare.

---

## Diagnosi: perché SD3 Turbo non produce il look "arrestato"

SD3 Large Turbo è un modello distillato (consistency distillation) che converge in 4-8 step con qualità "finita". Non mantiene i latenti intermedi grezzi nel senso di DDPM classico. L'approccio "step bassi" funziona con:

- **SDXL via DDPM scheduler** (non distillato): ogni step è un'iterazione di denoising vera, e fermarsi a 10/50 lascia rumore strutturale visibile.
- **Stable Diffusion 1.5** con scheduler DDIM a steps bassi (4-8/50) produce esattamente il look di "latente semi-risolto".

---

## Parametri raccomandati per il look "arrestato" (prossima iterazione)

### Strategia A — Stability SDXL (non Turbo) con steps ultrabassi
```
model: stable-diffusion-xl-1024-v1-0  (via v1 engines API)
steps: 10  (su un totale normale di 30-50)
cfg_scale: 4-5
sampler: DDIM o Euler
seed: fisso per riproducibilità
```
Costo: ~6.5 crediti/immagine (API v1 SDXL)

### Strategia B — SD3 Medium (non Turbo) con steps bassi
```
model: sd3-medium
steps: 15 (su 50 normali)
cfg_scale: 2.0
```
Costo: 3.5 crediti/immagine

### Strategia C — Post-processing palette forzata
Generare con SD3 (qualsiasi step) + applicare LUT/color grading in Python (Pillow) per:
- Desaturazione totale → ritonatura in osso/grigio
- Maschera rosso trattenuto con curva di Bezier
- Aggiunta grana sintetica (rumore gaussiano 8-15%)

Costo: 0 crediti extra

### Strategia raccomandata per la produzione
**Combinare B + C**: SD3 Medium a 15 steps (forma semi-risolta) + post-processing palette in Python. Risultato controllabile, costo 3.5 crediti/immagine, aspetto differenziato per ogni opera.

---

## Stima costo corpus completo

| Scenario | Immagini | Crediti/img | Iterazioni | Totale crediti |
|---|---|---|---|---|
| Produzione finale (4 opere immagine) | 4 | 4 (turbo) o 3.5 (medium) | 2-3x | ~40-50 |
| Con sperimentazione palette | +8 test | 4 | — | ~32 |
| **Stima totale** | | | | **~70-80 crediti** |

Su 992 crediti residui: budget più che sufficiente per l'intero progetto.

---

## Raccomandazione finale: Stability vs Gemini Imagen

| Criterio | Stability SD3 Turbo | Gemini Imagen (Nano) |
|---|---|---|
| Look "arrestato" (rumore visibile) | Scarso (distillato) | Scarso (converge sempre) |
| Controllo palette | Basso via prompt | Basso via prompt |
| Controllabilità steps | Sì (ma turbo ignora) | No |
| Costo | 4 cr/img | — |
| **Raccomandazione** | Usare SD3 Medium 15 steps + post-processing | Per pezzi "quasi-finiti" (opere 6,10: testo/archivio) |

**Per le opere immagine "arrestate" (1,4,5,8):** Stability SD3 Medium con steps 12-18 + LUT palette Python.  
**Per opere descrittive/di archivio:** Gemini Flash Image per realismo fotografico nelle schede catalogo.
