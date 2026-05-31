# Integrazione — Wave 2 "opere vive" (op7 · op9 · op2)

Questa wave aggiunge **solo nuovi file**. Niente è stato collegato: `denoise.js`,
`main.js`, `opere.js`, `corpus.js` sono **intatti**. Qui sotto le istruzioni
precise per agganciare i tre moduli nella fase successiva.

> Regola d'oro invariata: se un effetto si risolve in qualcosa di pulito è
> sbagliato. Tutti e tre i moduli sono già progettati per **non risolvere mai**
> (morph clampato, respiro con jitter, note che non fanno melodia). Non
> "aggiustarli" verso la risoluzione.

---

## File creati in questa wave

| Opera | Tipo | File |
|---|---|---|
| **07** Interpolazione | scena WebGL (Three.js) | `src/scenes/interpolate.js` + `src/scenes/interpolate.glsl.js` |
| **09** Respiro a 35,9° | audio generativo (Web Audio) | `src/audio/respiro.js` |
| **02** Lamento mai cantato | audio generativo (Web Audio) | `src/audio/lamento.js` |
| (verso sussurrato op02) | asset | `public/opere/lamento-sussurro.mp3` (ElevenLabs, ~3 s) |

Nessuna dipendenza nuova: solo `three` (già in `package.json`) e Web Audio nativo.

---

## Contratto delle API (tutte uguali nello spirito)

### op7 — `createInterpolateScene(canvas, fallbackEl)`
Stessa identica firma e ciclo di vita di `createDenoiseScene` (è il gemello).
```js
import { createInterpolateScene } from './scenes/interpolate.js';
const op7 = createInterpolateScene(canvasEl, fallbackEl);
// parte già da sola (init on-view). Controllo opzionale:
op7.start();  op7.stop();  op7.destroy();
```
- Vuole un `<canvas>` proprio (NON quello della home: è una seconda scena).
- `fallbackEl` opzionale: se manca WebGL viene mostrato e il canvas nascosto.
- Già gestiti: resize, pausa fuori vista (`IntersectionObserver`), pausa a tab
  nascosta, `prefers-reduced-motion` (morph fermo a metà), cleanup in `destroy()`.

### op9 — `createRespiro({ target, volume })` e op2 — `createLamento({ target, whisperUrl, volume })`
Identico contratto per entrambi gli audio:
```js
import { createRespiro } from './audio/respiro.js';
import { createLamento } from './audio/lamento.js';

const op9 = createRespiro({ target: cardOrOverlayEl });          // target opzionale (per l'IO)
const op2 = createLamento({ target: cardOrOverlayEl,
                            whisperUrl: '/opere/lamento-sussurro.mp3' });

await op9.start();   // ⚠️ SOLO da un gesto utente (click/tap)
op9.setVolume(0.18); // 0..1 — resta "ambiente": tetto basso consigliato
op9.stop();          // sospende il contesto, riprendibile con un altro start()
op9.destroy();       // libera tutto
```
- **Non partono senza gesto utente**: l'`AudioContext` nasce al primo `start()`,
  che DEVE essere dentro un handler di `click`/`pointerup` (altrimenti il browser
  lo tiene sospeso e non si sente nulla — comportamento corretto, non un bug).
- `target` (consigliato): l'elemento da osservare; quando esce dalla vista
  l'audio si **sospende** da solo (parità con le scene 3D). A tab nascosta idem.
- `prefers-reduced-motion`: niente respiro vivo / niente sequenza di note. Resta
  solo un velo di presenza (calore fermo / una singola nota a volume minimo).
- `whisperUrl` (solo op2): se il file manca, **fallback automatico a sole note**,
  nessun errore. Il verso sussurrato è raro e sepolto sotto le note (di design).

---

## Dove agganciarli — due opzioni

I tre moduli sono **scene/sorgenti a sé**, non "provini di griglia". La griglia
(`corpus.js` + `plate.js`) resta com'è: mostra il provino arrestato statico. Le
opere vive si attivano in una **vista dedicata della singola opera** (overlay o
pagina), che è il lavoro di questa fase. Due strade:

### Opzione A — overlay "scheda opera" (consigliata, minimo impatto)
Quando si apre la scheda a 6 voci di un'opera, se è una delle tre vive si monta
il modulo e si offre un avvio esplicito.

1. **Marca le opere vive nel dato.** In `src/data/opere.js`, aggiungi un campo
   `live` (nuovo, non rompe nulla — i campi `audio`/`video` esistenti restano):
   ```js
   // op 02
   { no: '02', /* ... */ live: 'lamento' },
   // op 07
   { no: '07', /* ... */ live: 'interpolate' },
   // op 09
   { no: '09', /* ... */ live: 'respiro' },
   ```
2. **Apertura della scheda** (nuovo modulo, es. `src/ui/opera-overlay.js`):
   ```js
   import { createInterpolateScene } from '../scenes/interpolate.js';
   import { createRespiro }   from '../audio/respiro.js';
   import { createLamento }   from '../audio/lamento.js';

   let live = null; // handle del modulo attivo, per il cleanup

   function openOpera(op, overlayEl) {
     // ...render delle 6 voci...

     if (op.live === 'interpolate') {
       const canvas = overlayEl.querySelector('.opera__canvas');   // <canvas> dedicato
       const fb     = overlayEl.querySelector('.opera__fallback'); // opzionale
       live = createInterpolateScene(canvas, fb);                  // parte da sola
     }

     if (op.live === 'respiro' || op.live === 'lamento') {
       const make = op.live === 'respiro' ? createRespiro : createLamento;
       live = make({ target: overlayEl, whisperUrl: '/opere/lamento-sussurro.mp3' });
       // l'audio NON parte qui: serve un gesto. Mostra un controllo:
       const btn = overlayEl.querySelector('.opera__listen'); // es. «ascolta — quasi-silenzio»
       btn.addEventListener('click', async () => {
         if (live.isRunning) { live.stop();  btn.textContent = 'ascolta — quasi-silenzio'; }
         else                { await live.start(); btn.textContent = 'in respiro… (ferma)'; }
       });
     }
   }

   function closeOpera() {
     if (live) { live.destroy(); live = null; } // SEMPRE distruggere alla chiusura
   }
   ```
3. **Microcopy** dei controlli al grado sospeso (CONCEPT §6.6): mai "Play".
   Es. «ascolta — quasi-silenzio», «resta nel respiro», «le note, non la canzone».

### Opzione B — montaggio inline nella card (più invasivo, sconsigliato ora)
Se invece si vuole la scena viva direttamente nella griglia, in `corpus.js`
sostituire il `createPlate(op)` con un `<canvas>` per op07 e un bottone d'ascolto
per op02/op09. Sconsigliato finché non c'è gestione del numero di contesti
audio/WebGL contemporanei (vedi "Performance" sotto).

---

## Aggancio a `main.js` (solo se servono handle globali)

`main.js` oggi monta denoise + corpus + reveal + cursore. Le opere vive **non**
vanno avviate qui (sono on-demand dalla scheda). Se la fase successiva introduce
un `opera-overlay.js`, l'unico ritocco a `main.js` è inizializzarlo e teardown:
```js
import { initOperaOverlay } from './ui/opera-overlay.js';
// dentro boot():
const overlay = initOperaOverlay(document);
// nel beforeunload:
window.addEventListener('beforeunload', () => {
  if (scene)   scene.destroy();
  if (overlay) overlay.destroy();   // chiude eventuali moduli vivi
});
```
> Se si resta sull'Opzione A con overlay autonomo, si può anche NON toccare
> `main.js`: basta che `opera-overlay.js` si auto-inizializzi. Decidere in fase.

---

## HTML minimo per l'overlay (riferimento)

Per op07 serve un `<canvas>` dedicato; per gli audio un bottone d'avvio. Esempio
di scaffold da inserire nel template dell'overlay:
```html
<div class="opera" role="dialog" aria-modal="true">
  <!-- solo per op07 (interpolazione) -->
  <canvas class="opera__canvas" aria-hidden="true"></canvas>
  <div class="opera__fallback" aria-hidden="true"></div>

  <!-- solo per op02 / op09 (audio) -->
  <button class="opera__listen" type="button">ascolta — quasi-silenzio</button>

  <!-- ...le 6 voci della scheda (Workstream A)... -->
</div>
```
Stili: riusare i token (`design-tokens.css`); il canvas dell'opera può stare in
un riquadro 3:4 o a tutta area dell'overlay. Il bottone è UI vera → reattivo e
breve (`--dur-ui`), non lento.

---

## Performance & accessibilità (già rispettate dai moduli)

- **Un contesto per volta, idealmente.** Tre `AudioContext` + due scene WebGL
  insieme pesano. Con l'Opzione A (una scheda aperta alla volta) il problema non
  si pone: alla chiusura si chiama `destroy()`. Evitare di tenere op02 e op09
  attivi insieme se non voluto (sono due soundscape distinti).
- **Pausa automatica**: tutti e tre si fermano fuori vista e a tab nascosta.
- **`prefers-reduced-motion`**: morph fermo (op7), nessun respiro animato (op9),
  nessuna sequenza di note (op2) — solo presenza statica a volume minimo.
- **Fallback WebGL** (op7): se assente, mostra il fallback e non rompe la pagina.
- **Gesto utente per l'audio**: i due moduli audio espongono `start()` apposta;
  l'integrazione deve chiamarlo da un click. Non tentare autoplay.
- **Volume**: default basso (op9 ≈ 0.18, op2 ≈ 0.16). È *soglia*, non concerto.

---

## Il verso sussurrato (op02) — provenienza dell'asset

- File: `public/opere/lamento-sussurro.mp3` (mp3 44.1 kHz, ~3 s, mono).
- Generato con **ElevenLabs** (`eleven_multilingual_v2`, voce grave, stability
  bassa per un timbro fragile/sussurrato), testo:
  `"... la voce resta scritta ... mai messa in aria ..."` (eco del `verso` di
  op02 in `opere.js`, §6.5).
- **Costo: 51 caratteri/crediti** (budget ≤1000 ampiamente rispettato; piano
  free, 10.000 caratteri/mese).
- È volutamente sepolto: riprodotto raro e a volume bassissimo dentro `lamento.js`.
  Se si vuole rigenerarlo con un'altra riga/voce, è un singolo POST a
  `api.elevenlabs.io/v1/text-to-speech/{voice_id}` con `xi-api-key` da `.env`.
- Se il file viene rimosso, op02 continua a funzionare a sole note (fallback).

---

## Checklist di collaudo (fase successiva)

- [ ] Aprire la scheda op07 → il morph deriva tra due volti e **non si ferma** su
      nessuno; chiudere → `destroy()` chiamato (niente RAF orfani).
- [ ] op09: click su «ascolta» → respiro lento ~14/min, caldissimo, quasi muto;
      cambiare tab → si sospende; tornare → riprende.
- [ ] op02: click → note isolate, **mai una melodia**, silenzi lunghi; ogni tanto
      il verso sussurrato affiora appena.
- [ ] `prefers-reduced-motion` attivo → tutto fermo/statico, ancora inquietante.
- [ ] Nessun `AudioContext`/scena WebGL resta attivo dopo la chiusura dell'overlay.
- [ ] WebGL disattivato → op07 mostra il fallback, pagina integra.
