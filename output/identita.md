# IDENTITÀ VISIVA — *L'attesa del coltello*

Sistema visivo per il microsito e per le "opere vive". Tutto deriva da una sola
posizione: **l'arresto prima della risoluzione**. Il sito non è una vetrina; è un
recinto. Lo spettatore è tenuto sulla soglia. Niente si compie davvero — né i colori
saturano, né il rosso cade, né le figure si formano.

> Riferimento normativo: `CONCEPT.md` §6 (Grammatica del corpus), §5 (anti-Black
> Mirror). Ogni scelta qui sotto è una traduzione di una di quelle regole.

---

## 1. Tono e direzione (il "perché" estetico)

**Minimalismo clinico, caldo, trattenuto.** Non distopia, non sci-fi, non "tech".
La pagina deve sembrare **l'aria di un recinto a 35,9°C**: tiepida, ferma, in allerta.
L'estetica di riferimento non è Black Mirror ma il **referto autoptico**, il
**cartiglio museale**, la **lastra**, il foglio mai tagliato. Rigore curatoriale
impeccabile (la cornice è perfetta) attorno a contenuti che rifiutano di finire
(l'opera non si risolve). Questa tensione — cornice esatta / centro irrisolto — è
l'intera identità.

Una cosa, una sola, deve restare in mente: **il rosso che non arriva mai**. È l'unico
accento; appare come pulsazione lenta, sempre sul punto di saturare, e si ritrae.

---

## 2. Palette

Costruita per essere **quasi acromatica**: ossa e fiato. Il colore è quasi assente,
così la più piccola comparsa del rosso pesa. Valori scelti per coppie di contrasto
leggibili (testo osso su fondo carne-cenere ≈ 9:1).

### Neutri — "osso e fiato"

| Token | HEX | Ruolo |
|---|---|---|
| `--ink-void` | `#0B0A0A` | Fondo più profondo (quasi nero, mai `#000`: ha un soffio caldo) |
| `--ink-ash` | `#15110F` | Fondo base della pagina / scena 3D |
| `--ink-pelt` | `#221B18` | Superfici sollevate, pannelli, bordi del recinto |
| `--breath-grey` | `#6E6661` | **Grigio-fiato**: testo secondario, didascalie, linee |
| `--breath-haze` | `#9A918B` | Stati hover del testo secondario, foschia |
| `--bone` | `#D9CFC2` | **Osso**: testo primario, titoli, tratto |
| `--bone-raw` | `#EAE3D6` | Osso più chiaro: titoli display, highlight rari |

### Accento — "il rosso trattenuto"

Mai pieno, mai brillante. È sangue **sotto la pelle**, non sangue versato. Usato a
bassissima area (< 5% dello schermo), quasi sempre in transizione o a bassa opacità.

| Token | HEX | Ruolo |
|---|---|---|
| `--held-red` | `#7A2E26` | Rosso trattenuto, desaturato e cupo: micro-accenti, foco |
| `--held-red-deep` | `#4A1C18` | Variante che "si ritira" nel buio (fine pulsazione) |
| `--held-red-veil` | `rgba(122,46,38,0.14)` | Velo: bagliore che non diventa mai colore pieno |

> **Regola del rosso (anti-kitsch):** il rosso non è mai statico a piena opacità su
> un'area ampia, non vira mai verso l'arancio/magenta acceso, non "splende". Pulsa
> lento (ciclo ~8–11 s, vedi §4) e **non chiude mai il ciclo sulla saturazione
> massima**: si arresta a ~70% e torna indietro. Il sangue non cade.

### Temperatura — "35,9°C"

Un solo gradiente ambientale, caldissimo ma scurissimo, usato come alone dietro i
contenuti per dare la sensazione di calore corporeo senza colore riconoscibile.

```
--warmth-core:  radial-gradient da #1C1512 (centro) a #0B0A0A (bordi)
```

### Grana di diffusione

La "grana di diffusione visibile" (§6.3) è strutturale, non decorativa: è il residuo
del denoise mai completato. Due livelli:
- **Grana statica** film/ISO su tutta la pagina (overlay fisso, `mix-blend: overlay`,
  opacità 4–7%).
- **Grana viva** nello shader 3D (rumore che *vorrebbe* dissolversi in figura e non ci
  riesce — è il cuore della home, §3 dello scaffold).

---

## 3. Tipografia

Niente font "di sistema", niente Inter/Roboto/Space Grotesk. Coppia editoriale da
catalogo d'arte: una **serif da incisione** (didascalica, lapidaria) per il display, e
un **grottesco/mono stretto** per l'apparato curatoriale (numeri d'inventario, seed,
metadati) — così la pagina sembra un catalogo + un referto.

### Display / titoli — **Fraunces**
- Serif "old-style" con opsz alto, tagli affilati, aria da frontespizio. Variable
  font: si usano pesi leggeri (300–400) e `opsz` alto per i titoli grandi.
- Da Google Fonts (`Fraunces`, variable, italic incluso). Fallback: `Spectral`, poi
  `Georgia, serif`.
- Uso: titolo della sala, titoli delle opere ("Studio per…"), citazioni dei versi.

### Apparato / metadati — **Newsreader** (testo lungo) + **IBM Plex Mono** (dati)
- **Newsreader** (Google Fonts, variable, ottimo in italico) per i testi di parete e
  le schede: una transitional dal sapore da quotidiano/archivio, leggibile e umana.
  Fallback: `Spectral`, `Georgia, serif`.
- **IBM Plex Mono** (Google Fonts) per ciò che è "macchina/provenienza": numero
  d'opera, `seed`, `step 14/50`, prompt-bozza, coordinate. Fallback:
  `ui-monospace, "SF Mono", monospace`.

> **Perché questa coppia.** Fraunces porta la mano dell'incisore (l'arte, l'umano);
> Plex Mono porta lo strumento (l'IA, il referto); Newsreader è la voce neutra del
> curatore che "finisce la documentazione in modo impeccabile" (§4). La tensione
> tipografica replica la tesi: umano vs strumento, arrestati insieme.

### Scala (modular, ratio 1.25 — minor third, da catalogo)

```
--step--1: 0.80rem   metadati mono, cartigli
--step-0:  1.00rem   corpo
--step-1:  1.25rem   sottotitoli
--step-2:  1.563rem  titoli opera (piccoli)
--step-3:  1.953rem  titoli opera
--step-4:  3.052rem  titolo sezione
--step-5:  clamp(3.5rem, 9vw, 7.5rem)  titolo-sala display
```

- **Tracking:** display in serif → tracking negativo leggero (`-0.01em`); mono e
  caps-metadati → tracking positivo (`0.08em`–`0.12em`), tutto maiuscolo, da etichetta
  d'inventario.
- **Misura di riga:** 60–72ch sui testi di parete (lettura lenta, da museo).
- **Leading ampio** (1.7–1.8) sui testi: il respiro, ancora.

---

## 4. Principi di motion — *lentezza, non-risoluzione, respiro*

Il movimento del sito **non è UX brillante**: è la temperatura del prima. Tre leggi.

### Legge 1 — Lentezza (tutto respira)
- Le transizioni ambientali (pulsazione del rosso, deriva della grana, alone di
  calore) hanno cicli **lunghissimi**: 8–14 s, mai percepibili come "loop".
- La UI vera (link, bottoni) resta invece **reattiva e breve** (vedi §motion 3D
  principles): feedback 120–160 ms, cambi di stato 220–280 ms. La lentezza è
  dell'*atmosfera*, non dell'*interazione* — altrimenti il sito sembra rotto, non
  sospeso.
- Curve: ease-out morbide e personalizzate. Mai `linear` (tranne i loop ambientali
  continui), mai `bounce`/elastico (sarebbe giocoso = kitsch).
  - Ingressi: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out espressivo).
  - Ambiente/respiro: `cubic-bezier(0.37, 0, 0.63, 1)` (sinusoidale, dentro-fuori).

### Legge 2 — Non-risoluzione (niente si compie)
- **Nessuna animazione raggiunge il suo stato finale "pulito".** La figura nel denoise
  non si forma; il rosso non satura; il morphing tra volti non si ferma su un volto
  (eco dell'opera 7). Dove un'animazione *sembra* convergere, all'85–90% **inverte o
  deriva**.
- Gli ingressi partono da **opacità + 8px di slittamento verticale + leggera sfocatura
  che si dissolve**, MA si fermano a opacità ~0.92 sui testi secondari: anche la
  comparsa resta "non finita".
- Nessun bottone compare da scala 0; si parte ~0.96 (vedi principi 3D §3).

### Legge 3 — Respiro (il sito è vivo a 35,9°C)
- Un unico "battito" ambientale a ~**13–15 cicli/min** (≈ respiro a riposo) regge la
  pulsazione del rosso e l'alone di calore: lega visivamente il sito al corpo
  dell'animale nel recinto.
- Reveal allo scroll **a durata propria e costante** (non legati alla velocità di
  scroll), via `IntersectionObserver`. Niente parallax classico.
- `prefers-reduced-motion`: si **spengono** denoise animato, pulsazione e grana viva;
  resta una versione ferma (rumore statico a bassa opacità, rosso fisso a bassa
  opacità). Il sito resta pienamente leggibile e inquietante anche da fermo.

---

## 5. Traduzione della "grammatica del corpus" (§6) sul web

Mappa esplicita: ogni regola del corpus → un comportamento del sito.

| § | Regola del corpus | Traduzione sul web |
|---|---|---|
| 6.1 | **Arresto prima della risoluzione** | Lo shader della home porta il rumore *verso* una figura e lo **arresta** (denoise interrotto). Tutte le animazioni invertono prima di compiersi (Legge 2). Le opere si caricano partendo dallo "step basso" e non raggiungono mai la versione nitida. |
| 6.2 | **Soggetto: recinto, animale-uomo, lama alzata** | Layout "a recinto": cornice/bordo (`--ink-pelt`) sempre presente che chiude lo spazio. Un elemento verticale fisso (linea/lama) sul bordo, mai discendente. Spazio negativo = il vuoto del recinto. |
| 6.3 | **Palette: osso, grigio-fiato, rosso trattenuto, grana** | Vedi §2. Quasi acromatico + grana strutturale + rosso < 5% in pulsazione che non satura. |
| 6.4 | **Aria ~35,9°C, calda come respiro** | Fondo mai nero puro (`#0B0A0A`), alone di calore radiale, battito ambientale a ritmo di respiro (§4 Legge 3). Micro-indicatore "35,9°C" in mono come firma climatica. |
| 6.5 | **Verso sepolto (provenienza nascosta)** | Frammenti dei versi abbandonati come **provenienza nascosta**: in `<!-- commenti HTML -->`, in attributi `data-verso`, e rivelati solo all'hover lungo / al passaggio su certe zone. Mai in chiaro come "decorazione". |
| 6.6 | **Titoli al grado incompiuto** | Tutta la nomenclatura UI usa il grado incompiuto: sezioni come "Studio per…", "Note per…", stati di caricamento come "in attesa…", "non risolto", "step 14/50". Nessuna label "Completato/Fatto/Scopri di più". |

### Tono di voce (microcopy)
- Sempre al **grado sospeso/incompiuto**. Mai imperativi commerciali ("Scopri",
  "Inizia ora"). Preferire: *"resta sulla soglia"*, *"non ancora tagliato"*,
  *"l'opera non si risolve"*.
- Lingua primaria **italiano**; metadati tecnici in italiano + mono (es. `seed`,
  `passo 14/50`).
- Numerazione opere in cifre romane o `0X` mono, da inventario di catalogo.

---

## 6. Componenti chiave e loro comportamento

- **Hero / Home:** scena 3D a tutto schermo (denoise sospeso, §3 dello scaffold) +
  titolo-sala in Fraunces sovrapposto su pannello semitrasparente leggibile
  (`--ink-ash` @ 0.55 + blur leggero solo su livello fisso). Micro-firma climatica
  "≈ 35,9°C" in mono in un angolo.
- **Griglia delle 10 opere:** schede da catalogo. Ogni scheda: numero `0X` (mono),
  titolo incompiuto (Fraunces), medium (mono, es. *immagine · diffusione interrotta*),
  e un **provino visivo arrestato** (immagine a step basso, o canvas di rumore finché
  l'asset non esiste). Hover: il rosso-velo affiora e si ritrae; il verso sepolto
  appare in `--breath-grey`.
- **Cartiglio / scheda a 6 voci:** impaginazione da museo, righello mono a sinistra,
  testo Newsreader. Bordo `--ink-pelt`. (Le 6 voci arrivano da Workstream A.)
- **Archivio Provenienza (opera 6):** elenco di seed/prompt-bozza/frammenti in mono,
  come reliquiario. Tiene insieme la sala.
- **Cursore:** custom discreto — un piccolo segno osso, che vicino alle zone-rosso
  vira appena verso `--held-red` (la lama che "sente" l'animale). Disabilitato su
  touch e con reduced-motion.

---

## 7. Accessibilità e fallback (non negoziabili)

- **Contrasto:** testo primario osso su fondo cenere ≈ 9:1; il grigio-fiato è usato
  solo per testo ≥ `--step-0` e mai per informazione critica da solo.
- **`prefers-reduced-motion`:** versione calma e statica (vedi §4 Legge 3).
- **Fallback 3D:** se manca WebGL → la home mostra un fermo-immagine in grana statica
  (poster) con lo stesso titolo. Mai pagina rotta. (WebGPU non richiesto.)
- **Miglioramento progressivo:** tutti i contenuti (titolo, statement, opere, versi
  rivelabili) sono nel DOM e leggibili senza JS. Il 3D è un *di più*.
- **Tastiera:** focus visibile in `--held-red` su sfondo scuro; ordine di
  tabulazione coerente con la lettura del catalogo.

---

## 8. Sintesi operativa (per chi sviluppa)

- Variabili tutte in `/site/src/styles/design-tokens.css` (fonte unica di verità).
- Three.js/WebGL **solo** per le scene (denoise, interpolazione); Framer Motion / CSS
  per la UI. Non mescolare i due motori nello stesso componente (principi 3D §1).
- Una scena 3D = un componente isolato, init on-view, pausa off-view, cleanup su
  unmount.
- Un solo accento (`--held-red`), area minima. Niente glow viola/blu generici.
- Regola d'oro: **se un effetto si "risolve" in qualcosa di pulito e soddisfacente,
  è sbagliato.** Va arrestato un attimo prima.
