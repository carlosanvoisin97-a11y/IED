/* =============================================================================
   MAIN — entry point del sito
   Wiring di: scena 3D denoise (home), griglia corpus, reveal allo scroll,
   cursore custom. Tutto difensivo: se un pezzo manca, il resto regge
   (progressive enhancement, CONCEPT §8 strato 1-2 / principi 3D §5).
   ============================================================================= */

import './styles/design-tokens.css';
import './styles/base.css';
import './styles/layout.css';

import { createDenoiseScene } from './scenes/denoise.js';
import { renderCorpus } from './ui/corpus.js';
import { initReveal } from './ui/reveal.js';
import { initCursor } from './ui/cursor.js';

function boot() {
  // 1. scena 3D della home: il denoise sospeso
  const canvas = document.getElementById('scene-denoise');
  const fallback = document.querySelector('.scene-fallback');
  let scene = null;
  if (canvas) {
    scene = createDenoiseScene(canvas, fallback);
  }

  // 2. griglia delle 10 opere (dal dato)
  const corpusMount = document.getElementById('corpus-grid');
  renderCorpus(corpusMount);

  // 3. ingressi allo scroll (dopo aver montato il corpus, così li osserva)
  initReveal(document);

  // 4. cursore custom (no-op su touch / reduced-motion)
  initCursor();

  // teardown su unload (igiene memoria, principi 3D §1)
  window.addEventListener('beforeunload', () => {
    if (scene) scene.destroy();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
