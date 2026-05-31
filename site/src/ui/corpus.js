/* =============================================================================
   CORPUS — costruisce la griglia delle 12 opere dal dato (data/opere.js)
   Ogni scheda è un cartiglio da catalogo. Il "verso sepolto" (CONCEPT §6.5) è
   messo in attributo data-verso E reso visibile solo all'hover/focus (vedi CSS),
   non in chiaro come decorazione. La nomenclatura resta al grado incompiuto.
   ============================================================================= */

import { opere } from '../data/opere.js';
import { createPlate } from './plate.js';

/* Tilt 3D al passaggio del cursore — solo con mouse fine e senza reduced-motion.
   Durante il tilt la classe is-tilt ferma il galleggiamento (niente conflitto di
   transform); all'uscita il transform inline si azzera e il float riprende. */
const canTilt =
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function attachTilt(card) {
  let raf = 0;
  card.addEventListener('mouseenter', () => card.classList.add('is-tilt'));
  card.addEventListener('mousemove', (e) => {
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;   // -0.5 .. 0.5
    const py = (e.clientY - r.top) / r.height - 0.5;
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      card.style.transform = `rotateX(${(-py * 5).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg)`;
    });
  });
  card.addEventListener('mouseleave', () => {
    if (raf) cancelAnimationFrame(raf);
    card.classList.remove('is-tilt');
    card.style.transform = ''; // torna al galleggiamento
  });
}

/**
 * Costruisce la griglia. `onOpen(op, cardEl)` (opzionale) viene chiamato quando
 * una scheda è attivata (click / Enter / Spazio): apre la vista singola opera.
 */
export function renderCorpus(mountEl, onOpen) {
  if (!mountEl) return;
  const frag = document.createDocumentFragment();

  opere.forEach((op, idx) => {
    const card = document.createElement('article');
    card.className = 'work';
    card.setAttribute('tabindex', '0'); // focus da tastiera → rivela il verso
    card.setAttribute('data-hot', '');   // zona "calda" per il cursore
    card.setAttribute('data-reveal', '');
    card.setAttribute('data-reveal-delay', String((idx % 3) * 90));
    card.dataset.no = op.no;
    card.style.setProperty('--i', String(idx)); // sfasa il galleggiamento delle schede
    // provenienza nascosta: il verso vive anche come attributo + commento
    card.setAttribute('data-verso', op.verso || '');

    // la scheda apre la vista singola opera
    if (typeof onOpen === 'function') {
      card.setAttribute('role', 'button');
      card.setAttribute('aria-haspopup', 'dialog');
      card.setAttribute('aria-label', `Opera ${op.no}: ${op.titolo} — apri la scheda`);
      card.addEventListener('click', () => onOpen(op, card));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          onOpen(op, card);
        }
      });
    }

    // provino arrestato (immagine reale se presente, altrimenti rumore)
    card.appendChild(createPlate(op));

    const no = el('span', 'work__no', `№ ${op.no}`);
    const medium = el('span', 'work__medium', op.medium);
    const title = el('h3', 'work__title', op.titolo);
    const state = el('span', 'work__state', op.stato || 'non risolto');
    const verso = el('p', 'work__verso', `« ${op.verso} »`);

    // riga meta: stato + seed (mono, da inventario/provenienza)
    const meta = document.createElement('div');
    meta.style.display = 'flex';
    meta.style.justifyContent = 'space-between';
    meta.style.gap = 'var(--space-s)';
    meta.appendChild(state);
    if (op.seed) meta.appendChild(el('span', 'work__medium', op.seed));

    card.append(no, medium, title, verso, meta);
    if (canTilt) attachTilt(card);

    // commento HTML con la provenienza (verso sepolto, leggibile solo nel sorgente)
    card.appendChild(document.createComment(` provenienza: ${op.verso} `));

    frag.appendChild(card);
  });

  mountEl.appendChild(frag);
}

function el(tag, className, text) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text != null) n.textContent = text;
  return n;
}
