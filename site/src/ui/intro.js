/* =============================================================================
   INTRO LOADER — il loader a parole (riadattato VANILLA, palette fredda)
   Overlay full-screen #0d0d0b; tre parole in sequenza, serif sottile, osso:
       «Il taglio.» → «Il prima.» → «L'attesa.»
   ~1400ms ciascuna. Entrata: opacity + translateY (ease-out). Uscita: silenziosa
   (l'overlay svanisce, nessuna parola "esce" rumorosamente; nessuna label "salta").
   Nessun alone caldo/arancione: solo osso su fondo quasi nero.

   - dismiss su click / wheel / qualunque tasto → l'overlay svanisce.
   - UNA volta per sessione (sessionStorage 'intro-v1').
   - skip totale con prefers-reduced-motion (e se WebGL/JS bastano: è progressive
     enhancement, il contenuto è già nel DOM sotto).
   ============================================================================= */

import { prefersReducedMotion } from '../utils/env.js';

const KEY = 'intro-v1';
const PAROLE = ['Il taglio.', 'Il prima.', 'L’attesa.'];
const WORD_MS = 1400;   // permanenza di ciascuna parola
const FADE_MS = 520;    // (fallback) dissolvenza finale dell'overlay
const PART_MS = 2300;   // apertura lenta e teatrale delle due ante: l'ingresso «nella sala»

export function initIntro() {
  // skip: reduced-motion, già vista in questa sessione, o ambiente senza sessionStorage
  if (prefersReducedMotion()) return null;
  let seen = false;
  try { seen = sessionStorage.getItem(KEY) === '1'; } catch (e) { /* storage negato */ }
  if (seen) return null;
  try { sessionStorage.setItem(KEY, '1'); } catch (e) { /* ignora */ }

  // --- overlay --------------------------------------------------------------
  const root = document.createElement('div');
  root.className = 'intro';
  root.setAttribute('aria-hidden', 'true'); // puramente atmosferico: il contenuto è già sotto

  // due ante scure che, all'uscita, si separano come una soglia: si «entra nella sala»
  root.innerHTML =
    '<div class="intro__pane intro__pane--l" aria-hidden="true"></div>' +
    '<div class="intro__pane intro__pane--r" aria-hidden="true"></div>';

  const wordEl = document.createElement('span');
  wordEl.className = 'intro__word';
  root.appendChild(wordEl);
  document.body.appendChild(root);

  // blocca lo scroll del fondo mentre l'intro è visibile
  document.documentElement.classList.add('intro-lock');

  let i = -1;
  let timers = [];
  let done = false;

  function clearTimers() {
    timers.forEach((t) => clearTimeout(t));
    timers = [];
  }

  function showNext() {
    i += 1;
    if (i >= PAROLE.length) { finish(); return; }

    // entrata: opacity + translateY (la classe is-in fa la transizione in CSS)
    wordEl.textContent = PAROLE[i];
    wordEl.classList.remove('is-in', 'is-out');
    // force reflow così la transizione riparte a ogni parola
    void wordEl.offsetWidth;
    wordEl.classList.add('is-in');

    // dopo WORD_MS la parola si attenua e arriva la successiva (uscita morbida,
    // ma l'overlay resta: la "vera" uscita è quella silenziosa finale)
    timers.push(setTimeout(() => {
      wordEl.classList.remove('is-in');
      wordEl.classList.add('is-out');
    }, WORD_MS - 260));

    timers.push(setTimeout(showNext, WORD_MS));
  }

  // --- uscita silenziosa ----------------------------------------------------
  function finish() {
    if (done) return;
    done = true;
    clearTimers();
    detach();
    // uscita = apertura della soglia: le due ante si separano e si entra nella sala
    root.classList.add('is-opening');
    document.documentElement.classList.remove('intro-lock');
    setTimeout(() => { if (root.parentNode) root.parentNode.removeChild(root); }, PART_MS + 60);
  }

  // dismiss su interazione: click, wheel, tasto, touch
  function onDismiss() { finish(); }
  function attach() {
    window.addEventListener('click', onDismiss, { once: false });
    window.addEventListener('wheel', onDismiss, { passive: true });
    window.addEventListener('keydown', onDismiss);
    window.addEventListener('touchstart', onDismiss, { passive: true });
  }
  function detach() {
    window.removeEventListener('click', onDismiss);
    window.removeEventListener('wheel', onDismiss);
    window.removeEventListener('keydown', onDismiss);
    window.removeEventListener('touchstart', onDismiss);
  }

  attach();
  // primo frame: parte la sequenza
  timers.push(setTimeout(showNext, 80));

  return { destroy: finish };
}
