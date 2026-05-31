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
import { initOperaOverlay } from './ui/opera-overlay.js';
import { initIntro } from './ui/intro.js';

function boot() {
  // 0. loader a parole («Il taglio. / Il prima. / L'attesa.»): una volta per
  //    sessione, salta con reduced-motion. Atmosferico, non blocca il DOM sotto.
  initIntro();

  // 1. scena 3D della home: il denoise sospeso
  const canvas = document.getElementById('scene-denoise');
  const fallback = document.querySelector('.scene-fallback');
  let scene = null;
  if (canvas) {
    scene = createDenoiseScene(canvas, fallback);
  }

  // 2. vista singola opera (overlay): scheda a 6 voci + il lavoro (immagine /
  //    canvas vivo / audio / archivio / prompt). Inizializzata prima del corpus
  //    così la griglia può agganciare l'apertura.
  const overlay = initOperaOverlay(document);

  // 3. griglia delle 12 opere (dal dato); ogni scheda apre l'overlay
  const corpusMount = document.getElementById('corpus-grid');
  renderCorpus(corpusMount, (op, cardEl) => overlay.openOpera(op, cardEl));

  // 4. ingressi allo scroll (dopo aver montato il corpus, così li osserva)
  initReveal(document);

  // 5. cursore custom (no-op su touch / reduced-motion)
  initCursor();

  // teardown su unload (igiene memoria, principi 3D §1)
  window.addEventListener('beforeunload', () => {
    if (scene) scene.destroy();
    if (overlay) overlay.destroy(); // chiude eventuali moduli vivi (RAF/audio)
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
