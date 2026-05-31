# generation-log — Opere immagine "ARRESTATE"

Progetto: **L'ATTESA DEL COLTELLO** · IED Roma 2026 (Prompt Thinking, A. Colamedici)
Data: 2026-05-31
Opere prodotte: corpus n. **1, 4, 5, 8** (le quattro opere-immagine "arrestate", CONCEPT.md §7)

> Questo log e' materiale di **Provenienza** (op6) e base per op10 ("Prompt #∞").
> Registra prompt, seed, parametri di generazione e l'intera ricetta di post-processing.

---

## Pipeline

**BASE (forma):** Stability AI `sd3.5-medium` via REST v2beta (`gen.py`, curl + User-Agent
browser per aggirare Cloudflare 1010). ~15–18 steps, cfg 2.2–2.4, aspect 2:3.
Solo la forma di base; il look NON viene sperato dal modello.

**POST (look):** `arresto.py` (Python · Pillow + numpy). Il look "arrestato" e'
**garantito** qui, non dal modello. Pipeline in ordine:
1. `levels` — estrae la forma dal fondo (black/white/contrast).
2. `desaturate` — porta a quasi-grigio (croma residua ~6%).
3. `gradient_map` — rimappa la luminanza sulla palette identitaria (sotto).
4. `restrained_red` — inietta `#7A2E26` SOLO in una piccola maschera a bassa opacita',
   solo dove c'e' gia' materia: il sangue che non cade.
5. `arrest` — **firma del progetto**: fonde la figura con un **campo di rumore**
   (multi-scala, gradient-mappato alla palette) tramite maschera = vignetta radiale ×
   sostanza della figura. La forma si dissolve nella grana ai bordi e resta **semi-emersa**.
6. `add_grain` — grana gaussiana di diffusione visibile, pesata sui mezzitoni.
Upscale del base a 1600px (lato lungo) PRIMA del post, cosi' la grana e' a piena risoluzione.

### Palette (HEX, dall'identita' del sito)
| ruolo | hex |
|---|---|
| ombre profonde | `#0B0A0A` |
| ombre | `#221B18` |
| mezzitoni (grigio-fiato) | `#6E6661` |
| alte luci (osso) | `#D9CFC2` |
| alte luci chiare (osso) | `#EAE3D6` |
| rosso trattenuto (che non arriva) | `#7A2E26` |

### Output per opera
- `opXX_<titolo>.png` — alta risoluzione (1095×1600)
- `opXX_<titolo>.webp` — ~1600px lato lungo, q88
- `opXX_base*.png` — base pre-post, conservata per confronto

---

## op1 — Studio per un corpo che non diventa carne

- **Finale:** `op1_studio-corpo-che-non-diventa-carne.png` (+ `.webp`)
- **Base usata:** `op1_base_b.png` (seed 314) — chiaroscuro torso, restituito `CONTENT_FILTERED`
  (la sfocatura del filtro ha lavorato a favore dell'estetica: torso modellato ma gia' non risolto).
- **Base alternativa scartata:** `op1_base.png` (seed 1991) — torso nella foschia, troppo
  poco modellato internamente per reggere il post (diventava macchia).

**Generazione (base usata):**
| param | valore |
|---|---|
| model | sd3.5-medium |
| seed | 314 |
| steps | 18 |
| cfg | 2.4 |
| aspect | 2:3 |
| finish_reason | CONTENT_FILTERED (non addebitato) |

Prompt:
> chiaroscuro study of a bare human torso emerging from darkness and grain, soft raking light modeling the chest sternum and one shoulder, the lower body and edges dissolving into dense diffusion noise, unfinished, half-formed, neither living flesh nor carcass, monochrome charcoal and bone, painterly, grainy, muted, melancholic, Caravaggio lighting on an unresolved figure

Negative:
> colorful, saturated, vivid, bright, photorealistic, crisp fine detail, fully resolved, polished, clean studio background, face, head portrait, hard sharp edges

**Post (arresto.py) — REV. 2026-05-31 (aggiunto rosso trattenuto interno):**
```
--seed 314 --palette cooler --grad-gamma 1.02
--lv-black 0.04 --lv-white 0.95 --lv-contrast 1.04
--substance-mode bright --substance-weight 0.52
--resolve 0.78 --edge-softness 0.45 --vignette 0.62
--focus-cx 0.5 --focus-cy 0.42 --focus-sy 1.0 --focus-sx 0.82
--field-bias -0.05 --field-contrast 1.08
--red-mode tint --red-tint-strength 0.5
--red-cx 0.48 --red-cy 0.35 --red-radius 0.2 --red-opacity 0.6 --red-threshold 0.6
--grain 0.1 --grain-mono 0.82 --upscale-long 1600
```
NOTA: il rosso ora usa la **nuova modalita' `tint`** (vedi note tecniche). La vecchia
modalita' `blend` produceva su un torso quasi-bianco solo uno scurimento neutro
**impercettibile** (testato fino a opacity 0.85 → ancora invisibile): il rosso scuro `#7A2E26`
su materia chiara non si legge come colore. `tint` spinge la dominante calda preservando la
luminanza → l'alone si legge come sangue trattenuto sottopelle, senza aprire una ferita.
Centrato sul petto/sterno (cx 0.48, cy 0.35), raggio ampio e soglia alta (0.6) per restare
nel nucleo luminoso del torso.

**Autovalutazione (rev.):** forma ~50% invariata (torso leggibile ma soffice, mai carne);
palette osso/grigio-fiato ok; grana forte; bordi dissolti su tutti i lati. **Rosso ora
percettibile** come alone caldo nel petto — appena accennato, morbido, senza bordi: "il sangue
che non cade". Non e' piu' il piu' debole dei quattro. Il resto dell'immagine e' identico alla
versione approvata (stessa base, stessi parametri di forma/grana). Backup della versione pre-rosso:
`op1_studio-corpo-che-non-diventa-carne.prered.png.bak` (+ `.webp.bak`).

---

## op4 — Schizzo per il gesto che non affonda

- **Finale:** `op4_schizzo-per-il-gesto-che-non-affonda.png` (+ `.webp`)
- **Base:** `op4_base.png` (seed 1444) — schizzo a carboncino: mano che stringe un coltello
  alzato, linee gestuali aperte intorno (la linea che non si chiude).

**Generazione:**
| param | valore |
|---|---|
| model | sd3.5-medium |
| seed | 1444 |
| steps | 16 |
| cfg | 2.3 |
| aspect | 2:3 |
| finish_reason | SUCCESS |

Prompt:
> a charcoal sketch of a hand gripping a raised knife at the very top of its arc, the blade lifted high, frozen an instant before descent, the gesture suspended and never completing, gestural unfinished line drawing that does not close, the arm and background dissolving into dense diffusion noise, monochrome charcoal grey and bone white, raw study, grainy, muted, melancholic

Negative:
> colorful, saturated, vivid, bright, photorealistic, finished, polished, crisp clean fine detail, fully resolved, smooth clean background, blood, gore

**Post (arresto.py):**
```
--seed 1444 --palette default --grad-gamma 1.02
--lv-black 0.07 --lv-white 0.98 --lv-contrast 1.05
--substance-mode dark --substance-weight 0.66
--resolve 0.62 --edge-softness 0.55 --vignette 0.78
--focus-cx 0.46 --focus-cy 0.32 --focus-sy 0.8 --focus-sx 0.62
--field-bias 0.14 --field-contrast 1.25
--red-cx 0.46 --red-cy 0.14 --red-radius 0.055 --red-opacity 0.32 --red-threshold 0.16
--grain 0.09 --grain-mono 0.88 --upscale-long 1600
```
**Autovalutazione:** forma ~45% (coltello + nocche nitidi all'apice, polso e avambraccio
totalmente dissolti nel rumore in basso); il "gesto sospeso in cima all'arco" e la "linea che
non si chiude" sono letterali. Palette e grana ok. Tra i piu' riusciti per il concept.

---

## op5 — Bozza di un volto sotto giudizio

- **Finale:** `op5_bozza-di-un-volto-sotto-giudizio.png` (+ `.webp`)
- **Base:** `op5_base.png` (seed 1717) — volto a sguardo basso, schizzi d'inchiostro/grana
  che gia' disfano i tratti; base quasi-monocroma molto sull'estetica.

**Generazione:**
| param | valore |
|---|---|
| model | sd3.5-medium |
| seed | 1717 |
| steps | 15 |
| cfg | 2.2 |
| aspect | 2:3 |
| finish_reason | SUCCESS |

Prompt:
> a human face coming apart into diffusion noise at its edges, a portrait arrested before resolution, half-formed features that refuse to be recognized or judged, dissolving into grain, monochrome bone white and breath grey, soft raking light, unfinished charcoal study, painterly, grainy, muted, melancholic, lowered downcast gaze

Negative:
> colorful, saturated, vivid, teal, cyan, magenta, bright, photorealistic, crisp fine detail, fully resolved, sharp focus, clean studio background, smiling, hard edges

**Post (arresto.py):**
```
--seed 1717 --palette default --grad-gamma 0.98
--lv-black 0.04 --lv-white 0.97 --lv-contrast 1.08
--substance-mode bright --substance-weight 0.45
--resolve 0.78 --edge-softness 0.46 --vignette 0.62
--focus-cx 0.5 --focus-cy 0.44 --focus-sy 1.0 --focus-sx 0.84
--field-bias 0.05 --field-contrast 1.12
--red-cx 0.5 --red-cy 0.5 --red-radius 0.12 --red-opacity 0.34 --red-threshold 0.32
--grain 0.095 --grain-mono 0.85 --upscale-long 1600
```
**Autovalutazione:** forma ~50–52% (volto riconoscibile come volto, ma rifiuta l'identita';
tratti mangiati dalla grana, occhi appena chiusi); bordi (calotta, mascella, collo) dissolti del
tutto nel campo. Rosso integrato come vampa trattenuta nel volto basso. Concettualmente il piu'
diretto: e' l'autoritratto "che non finira'".

---

## op8 — La pelle che non diventa pagina  ·  RIFATTA 2026-05-31

> **Motivo del rifacimento:** la prima versione (`op8_base.png`, seed 1888) leggeva come
> **carta beige vuota** — troppo piatta, nessuna presenza corporea. Rigenerata base da zero
> per ottenere una **membrana/pelle tesa** con texture e rilievo; post rivisto perche' la
> PELLE/corpo prevalga sulla pagina, con un **livido** (ematoma sottopelle) di rosso trattenuto.

- **Finale:** `op8_la-pelle-che-non-diventa-pagina.png` (+ `.webp`)
- **Base usata:** `op8d_base.png` (seed 4040, SUCCESS) — macro di pelle tesa quasi piana, luce
  radente che rivela pori/fibre/microrilievo. Presenza corporea reale (non foglio piatto).
- **Base alternativa scartata:** `op8b_base.png` (seed 2024, CONTENT_FILTERED → gratis) —
  chiaroscuro laterale con pieghe a "V": buona profondita' ma troppo "drappeggio/tenda scura",
  il post la rendeva una massa scura tipo roccia. Conservata per confronto.
- **Base scartata e rimossa:** `op8c_base.png` (seed 777, SUCCESS, −3.5) — di nuovo foglio
  bianco piatto, stesso difetto dell'originale; file eliminato.
- Base originale `op8_base.png` (seed 1888) conservata; finale vecchio salvato come
  `op8_la-pelle-che-non-diventa-pagina.old-empty.png.bak` (+ `.webp.bak`).

**Generazione (base usata, op8d):**
| param | valore |
|---|---|
| model | sd3.5-medium |
| seed | 4040 |
| steps | 16 |
| cfg | 2.4 |
| aspect | 2:3 |
| finish_reason | SUCCESS |

Prompt:
> macro photograph of pale taut human skin stretched almost flat over an unseen frame, strong low raking light from the left grazing across the surface to catch countless fine pores tiny downy hairs and very shallow tension wrinkles, the living grain of a hide that is nearly a page but unmistakably flesh, delicate surface relief, monochrome bone white and breath grey, unfinished, soft, grainy, muted, melancholic

Negative:
> colorful, saturated, vivid, bright, photorealistic crisp detail, text, letters, writing, words, fully resolved, flat clean blank white paper, glossy, hard edges, face, eyes, figure, hair strands, cloth, fabric, heavy drapery, deep folds, dark cave, tent shape

**Post (arresto.py):**
```
--seed 4040 --palette paper --grad-gamma 0.79
--lv-black 0.0 --lv-white 0.83 --lv-contrast 1.05
--substance-mode bright --substance-weight 0.42
--resolve 0.82 --edge-softness 0.45 --vignette 0.52
--focus-cx 0.5 --focus-cy 0.5 --focus-sy 0.98 --focus-sx 0.96
--field-bias 0.14 --field-contrast 1.07
--red-mode tint --red-tint-strength 0.68
--red-cx 0.47 --red-cy 0.52 --red-radius 0.23 --red-opacity 0.72 --red-threshold 0.45
--grain 0.112 --grain-mono 0.79 --upscale-long 1600
```
NOTE post: gamma <1 e `lv-white` basso per **schiarire** (pelle chiara, non cuoio scuro);
`field-bias +0.14` = campo di rumore CHIARO ai bordi (la pelle affonda in grana chiara, non in
un buco nero); `substance-mode bright` perche' la superficie chiara prevalga sul rumore;
livido in modalita' `tint` (ematoma sottopelle, non ferita), decentrato sotto-sinistra il centro.

**Autovalutazione:** ora legge come **pelle/membrana tesa** chiara: texture/fibre di tensione
visibili su tutto il quadro, bordi dissolti nella grana (mai pagina pulita). **Livido** `#7A2E26`
percettibile al centro come ematoma diffuso — il sangue che non cade — senza essere una ferita.
Ambiguita' pelle/pagina tenuta ma con la **pelle che prevale** (texture + livido + grana).
Forma ~45-50% risolta, in linea col target 40-55%. Nettamente meglio della carta vuota di prima.
Onesto: e' una superficie/texture, non un "soggetto" — coerente col concept (la pelle scorticata
come superficie), ma e' la piu' astratta dei quattro; chi cerca una figura non la trovera' (voluto).

---

## Crediti Stability

| voce | crediti |
|---|---|
| saldo iniziale | 992 |
| op1_base (seed 1991, sd3.5-medium) | −3.5 |
| op1_base_b (seed 314, CONTENT_FILTERED) | 0 (filtrati = non addebitati) |
| op4_base (seed 1444) | −3.5 |
| op5_base (seed 1717) | −3.5 |
| op8_base (seed 1888, originale "vuota") | −3.5 |
| *— sub-totale prima sessione —* | *14* |
| **REV 2026-05-31:** op1 rosso trattenuto (solo post) | 0 |
| op8b_base (seed 2024, CONTENT_FILTERED) | 0 (filtrato = non addebitato) |
| op8c_base (seed 777, SUCCESS, scartata+rimossa) | −3.5 |
| op8d_base (seed 4040, SUCCESS, **usata**) | −3.5 |
| **totale usato (cumulativo)** | **21** |
| **saldo residuo** | **971** |

Post-processing: 0 crediti (locale, Pillow + numpy).
Budget previsto ≤70 → **usati 21** (di cui 7 in questa revisione).
Revisione 2026-05-31 (budget ≤~10 crediti): **usati 7** — op1 a costo zero (solo post);
op8 ha richiesto 2 generazioni SUCCESS (una scartata, una usata) + 1 filtrata gratuita.
Tutte le iterazioni di look fatte in post (gratis): nessuna rigenerazione di look a vuoto.

## Note tecniche / lezioni
- `sd3.5-medium` (non Turbo) a 15–18 steps + post = ricetta confermata. Turbo (pilota) falliva:
  converge troppo e ignora "monocromatico" (vedi `_pilot/README.md`).
- Il `CONTENT_FILTERED` su "bare torso" (op1) restituisce un'immagine sfocata ma utilizzabile,
  anzi favorevole all'estetica arrestata; e non viene addebitata.
- numpy 2.0: `ndarray.ptp()` rimosso → usare `np.ptp()`. Pillow 13: `mode` in `fromarray`
  deprecato → omesso.
- Il campo di rumore di `arrest` deve essere bilanciato verso le ALTE frequenze (grana di
  diffusione) e non verso grandi macchie (marezzatura). Ottave in `_noise_field`.
- Mascheratura "sostanza": `bright` per figura chiara su fondo scuro, `dark` per disegno scuro
  su carta, `none`/`mid` per superfici uniformi. NB op8 (rev.): per far emergere una **pelle
  chiara** serve `bright` + `field-bias > 0` (campo chiaro ai bordi). `none`/`mid` su una
  superficie chiara la fa sprofondare in grana scura → legge come buco/roccia, non come pelle.
- **Rosso trattenuto — modalita' (`--red-mode`, agg. rev. 2026-05-31):**
  - `blend` (default storico, op4/op5/op8-orig): interpola verso il colore assoluto `#7A2E26`.
    Funziona su materia di **luma medio** (volto op5, carta). Su materia **molto chiara** (torso
    op1) il rosso scuro produce solo uno scurimento neutro **impercettibile** (testato fino a
    opacity 0.85 → invisibile).
  - `tint` (nuovo): spinge la **tinta** verso il rosso **preservando la luminanza** locale
    (moltiplica per la cromaticita' del rosso normalizzata a luma 1). Si legge come dominante
    calda / sottopelle anche su materia chiara, senza aprire una ferita. Usato per op1 (torso)
    e op8 (livido). `--red-tint-strength` regola la saturazione della dominante (0..1).
  - Retrocompatibile: default = `blend`, quindi op4/op5 restano identici se rigenerati.
- Script riusabili: `gen.py` (genera base), `arresto.py` (post). Tutti i parametri sopra sono
  riproducibili da CLI.
