/* =============================================================================
   CURSORE custom — un segno osso che vira al rosso vicino alle zone "calde"
   (la lama che "sente" l'animale). Disattivato su touch / reduced-motion
   (gestito anche via CSS). Movimento smorzato, solo transform (§2, §3).
   ============================================================================= */

import { isTouch, prefersReducedMotion } from '../utils/env.js';

export function initCursor() {
  if (isTouch() || prefersReducedMotion()) return;

  // 1. il segno osso (la lama che "sente"): ring piccolo, deriva rapida
  const dot = document.createElement('div');
  dot.className = 'cursor';
  dot.setAttribute('aria-hidden', 'true');

  // 2. l'alone: una luce larga, quasi incolore, che insegue con lerp più morbido.
  //    Ridotto e trattenuto (~320×200px): solo lieve schiarimento + traccia di
  //    rosso a opacità minima. Off su touch / reduced-motion (qui e via CSS).
  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  glow.setAttribute('aria-hidden', 'true');

  document.body.append(glow, dot);

  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  let tx = x;
  let ty = y;
  // l'alone insegue più lento del segno (parallasse morbido, sensazione sospesa)
  let gx = x;
  let gy = y;

  window.addEventListener('pointermove', (e) => {
    tx = e.clientX;
    ty = e.clientY;
  }, { passive: true });

  // nasconde segno + alone quando il mouse esce dalla finestra
  document.addEventListener('mouseleave', () => {
    dot.classList.add('is-hidden');
    glow.classList.add('is-hidden');
  });
  document.addEventListener('mouseenter', () => {
    dot.classList.remove('is-hidden');
    glow.classList.remove('is-hidden');
  });

  // zone "calde": elementi con data-hot (es. le schede opera, i link rossi)
  document.querySelectorAll('[data-hot], a, button').forEach((el) => {
    el.addEventListener('pointerenter', () => dot.classList.add('is-hot'));
    el.addEventListener('pointerleave', () => dot.classList.remove('is-hot'));
  });

  let raf;
  function loop() {
    // lerp: deriva morbida, solo translate (animare trasformazioni, §2)
    x += (tx - x) * 0.18;
    y += (ty - y) * 0.18;
    dot.style.transform = `translate(${x}px, ${y}px)`;

    // l'alone segue con un lerp più morbido (più sospeso del segno)
    gx += (tx - gx) * 0.085;
    gy += (ty - gy) * 0.085;
    glow.style.transform = `translate(${gx}px, ${gy}px)`;

    raf = requestAnimationFrame(loop);
  }
  loop();

  // (in questo sito la home è persistente; niente teardown necessario)
  return () => cancelAnimationFrame(raf);
}
