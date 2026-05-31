/* =============================================================================
   "L'ultima riga" — opera viva 12 (testo generativo)
   CONCEPT §6.1 (arresto prima della risoluzione) reso LINGUAGGIO: una riga di
   poesia si scrive carattere per carattere e si arresta UN CARATTERE prima della
   fine. La parola resta aperta, la frase non si chiude; poi cancella e ricomincia
   con un altro verso. La riga non sarà mai "l'ultima", perché non finisce.

   Non è WebGL: è testo nel DOM (un cartiglio che si scrive). Segue però le stesse
   convenzioni delle altre opere vive (denoise / interpolate / respiro / lamento):
   - costruisce la propria UI dentro un mount passato dall'overlay;
   - parte da sola, ma si mette in PAUSA fuori vista (IntersectionObserver) e a
     tab nascosta (visibilitychange) — niente timer orfani;
   - `prefers-reduced-motion`: niente battitura animata, mostra il verso fermo
     (sempre privato dell'ultimo carattere: anche da fermo resta non concluso);
   - API: start() · stop() · destroy(), come gli altri moduli vivi.

   I versi sono varianti di un solo frammento abbandonato (versi-abbandonati.md,
   III — la misura): "la distanza tra quello che sento e quello che resta sulla
   riga". La provenienza umana sepolta sotto la macchina (§6.5).
   ============================================================================= */

import { prefersReducedMotion } from '../utils/env.js';

// Varianti di un verso: ciascuna è una riga che NON si concluderà mai.
// (Stesso seme di verso III; ogni riga vira appena, come una bozza ripresa.)
const RIGHE = [
  'volevo dire una cosa così esatta che nessuno potesse rifarla',
  'ho contato la distanza tra quello che sentivo e la riga rimasta',
  'la mano sa quale segno manca, e si trattiene dal posarlo',
  'ti tengo al caldo un grado sotto il vivo, e non ti chiudo',
  'la crosta non si è ancora aperta, il pane non è ancora rotto',
  'resta aperta la parola: un millimetro, forse meno, e non lo dico',
];

// Ritmi (ms). La battitura è di chi PENSA mentre scrive: irregolare, mai meccanica.
const TYPE_MIN = 58;      // intervallo minimo tra due caratteri
const TYPE_MAX = 132;     // intervallo massimo
const PAUSE_COMMA = 280;  // sosta extra dopo virgola / spazio "di respiro"
const HOLD_ARREST = 2600; // quanto resta ferma sull'arresto (un char prima della fine)
const ERASE_STEP = 26;    // velocità di cancellazione
const HOLD_EMPTY = 620;   // breve vuoto prima di ricominciare

export function createUltimaRiga(mount) {
  if (!mount) return { start() {}, stop() {}, destroy() {}, isRunning: false };

  const reduced = prefersReducedMotion();

  // --- UI: un cartiglio che si scrive --------------------------------------
  const wrap = document.createElement('div');
  wrap.className = 'ultimariga';

  const meta = document.createElement('span');
  meta.className = 'meta held';
  meta.textContent = 'testo generativo · si ferma un carattere prima della fine';

  const line = document.createElement('p');
  line.className = 'ultimariga__line';
  line.setAttribute('aria-live', 'off'); // si riscrive di continuo: non assillare lo screen reader

  const text = document.createElement('span');
  text.className = 'ultimariga__text';

  const caret = document.createElement('span');
  caret.className = 'ultimariga__caret';
  caret.setAttribute('aria-hidden', 'true');

  line.append(text, caret);
  wrap.append(meta, line);
  mount.appendChild(wrap);

  // --- stato della macchina da scrivere ------------------------------------
  let timer = null;        // setTimeout corrente (un solo timer vivo)
  let running = false;
  let visible = true;
  let idx = Math.floor(Math.random() * RIGHE.length); // riga corrente
  let phase = 'type';      // 'type' | 'hold' | 'erase'
  let pos = 0;             // quanti caratteri scritti

  function currentLine() {
    return RIGHE[idx];
  }

  // L'ARRESTO: il bersaglio della battitura è (lunghezza - 1). L'ultimo
  // carattere non viene MAI scritto: la riga resta aperta di un segno.
  function arrestLength() {
    return Math.max(1, currentLine().length - 1);
  }

  function render() {
    text.textContent = currentLine().slice(0, pos);
  }

  function schedule(fn, ms) {
    clearTimer();
    timer = setTimeout(fn, ms);
  }
  function clearTimer() {
    if (timer) { clearTimeout(timer); timer = null; }
  }

  function typeDelay(ch) {
    let d = TYPE_MIN + Math.random() * (TYPE_MAX - TYPE_MIN);
    if (ch === ' ') d += PAUSE_COMMA * 0.4;       // micro-sosta sugli spazi
    if (ch === ',' || ch === ':') d += PAUSE_COMMA; // respiro sulla punteggiatura
    return d;
  }

  function tick() {
    if (!running) return;
    if (!visible) { return; } // in pausa: ripartirà da start() quando torna in vista

    if (phase === 'type') {
      const target = arrestLength();
      if (pos < target) {
        const ch = currentLine()[pos];
        pos += 1;
        render();
        schedule(tick, typeDelay(ch));
      } else {
        // ARRESTO raggiunto: tiene la riga aperta (manca l'ultimo carattere)
        phase = 'hold';
        wrap.classList.add('is-arrested');
        schedule(tick, HOLD_ARREST);
      }
    } else if (phase === 'hold') {
      phase = 'erase';
      wrap.classList.remove('is-arrested');
      schedule(tick, ERASE_STEP);
    } else if (phase === 'erase') {
      if (pos > 0) {
        pos -= 1;
        render();
        schedule(tick, ERASE_STEP);
      } else {
        // ricomincia con un altro verso (mai lo stesso due volte di fila)
        let next = Math.floor(Math.random() * RIGHE.length);
        if (next === idx) next = (next + 1) % RIGHE.length;
        idx = next;
        phase = 'type';
        schedule(tick, HOLD_EMPTY);
      }
    }
  }

  // --- visibilità: pausa fuori vista e a tab nascosta (parità con le scene) -
  const io = new IntersectionObserver(
    (entries) => {
      const wasVisible = visible;
      visible = entries[0].isIntersecting;
      if (visible && !wasVisible && running) tick(); // riprende dal punto esatto
    },
    { threshold: 0.01 }
  );
  io.observe(wrap);

  function onVisibility() {
    if (document.hidden) {
      clearTimer();
    } else if (running && visible) {
      tick();
    }
  }
  document.addEventListener('visibilitychange', onVisibility);

  // --- API ------------------------------------------------------------------
  function start() {
    if (running) return;
    running = true;
    api.isRunning = true;

    if (reduced) {
      // versione calma: niente battitura. Mostra il verso fermo, sempre privato
      // dell'ultimo carattere (resta non concluso anche da fermo).
      wrap.classList.add('is-static', 'is-arrested');
      pos = arrestLength();
      render();
      return;
    }
    tick();
  }

  function stop() {
    running = false;
    api.isRunning = false;
    clearTimer();
  }

  function destroy() {
    stop();
    io.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
  }

  const api = { start, stop, destroy, isRunning: false };

  // parte da sola (come le altre opere vive nello stage); l'overlay può comunque
  // chiamare start()/stop()/destroy().
  start();

  return api;
}
