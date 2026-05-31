/* =============================================================================
   OPERA OVERLAY — vista singola opera (la scheda a 6 voci + il lavoro)
   Opzione A di INTEGRATION-wave2.md: overlay autonomo, minimo impatto su main.js.

   Per ogni opera mostra:
   - IL LAVORO: immagine (op 1/4/5/8) · canvas WebGL vivo (op07 interpolate) ·
     pulsante d'ascolto su gesto utente (op02 lamento / op09 respiro) ·
     l'Archivio Provenienza (op06) · il prompt mai eseguito (op10) ·
     la formula non miscelata (op03).
   - LA SCHEDA A 6 VOCI: Titolo · Anno · Tecnica · Dimensioni · Didascalia ·
     Testo di parete. Righello mono a sinistra, da cartiglio museale.

   Regola d'oro: niente si risolve. Le opere vive restano clampate/non risolte.
   Gli audio NON partono senza gesto (start() dentro un click). Alla chiusura
   ogni modulo vivo viene SEMPRE distrutto (niente RAF/AudioContext orfani).
   ============================================================================= */

import { opere, versiAbbandonati, provenienza } from '../data/opere.js';
import { createInterpolateScene } from '../scenes/interpolate.js';
import { createRespiro } from '../audio/respiro.js';
import { createLamento } from '../audio/lamento.js';

const PLATE_ALT = {
  '01': 'Torso emerso a metà dal rumore, né corpo né carcassa.',
  '04': 'Mano che alza un coltello all’apice dell’arco, la lama che non discende.',
  '05': 'Volto che si disfa in grana ai bordi, autoritratto che rifiuta di risolversi.',
  '08': 'Superficie indecisa tra pelle e carta, con un livido di rosso trattenuto.',
};

export function initOperaOverlay(root = document) {
  // --- struttura dell'overlay (una sola istanza, riusata) ------------------
  const backdrop = document.createElement('div');
  backdrop.className = 'opera-overlay';
  backdrop.setAttribute('aria-hidden', 'true');
  backdrop.innerHTML = `
    <div class="opera" role="dialog" aria-modal="true" aria-labelledby="opera-title" tabindex="-1">
      <button class="opera__close" type="button" aria-label="chiudi — resta sulla soglia">
        <span aria-hidden="true">×</span>
      </button>
      <div class="opera__inner">
        <div class="opera__stage"></div>
        <div class="opera__sheet"></div>
      </div>
    </div>`;
  document.body.appendChild(backdrop);

  const dialog = backdrop.querySelector('.opera');
  const closeBtn = backdrop.querySelector('.opera__close');
  const stage = backdrop.querySelector('.opera__stage');
  const sheet = backdrop.querySelector('.opera__sheet');

  let live = null; // handle del modulo vivo attivo (per il cleanup)
  let lastFocus = null; // elemento a cui restituire il focus alla chiusura
  let isOpen = false;

  // --- apertura -------------------------------------------------------------
  function openOpera(op, triggerEl) {
    if (!op) return;
    closeLive(); // igiene: mai due moduli vivi insieme
    lastFocus = triggerEl || document.activeElement;

    stage.innerHTML = '';
    sheet.innerHTML = '';

    renderStage(op, stage);
    renderSheet(op, sheet);

    backdrop.classList.add('is-open');
    backdrop.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('overlay-lock');
    isOpen = true;

    // focus al dialog (gestione tastiera)
    dialog.scrollTop = 0;
    dialog.focus({ preventScroll: true });
  }

  // --- chiusura -------------------------------------------------------------
  function closeOpera() {
    if (!isOpen) return;
    closeLive();
    backdrop.classList.remove('is-open');
    backdrop.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('overlay-lock');
    isOpen = false;
    stage.innerHTML = '';
    sheet.innerHTML = '';
    if (lastFocus && typeof lastFocus.focus === 'function') {
      lastFocus.focus({ preventScroll: true });
    }
  }

  function closeLive() {
    if (live) {
      try { live.destroy(); } catch (e) { /* già distrutto */ }
      live = null;
    }
  }

  /* ===========================================================================
     IL LAVORO (stage) — varia per tipo di opera
     ========================================================================= */
  function renderStage(op, mount) {
    // op07 — interpolazione: canvas WebGL vivo (parte da solo, non risolve)
    if (op.live === 'interpolate') {
      const frame = el('div', 'opera__canvas-wrap');
      const canvas = document.createElement('canvas');
      canvas.className = 'opera__canvas';
      canvas.setAttribute('aria-hidden', 'true');
      const fb = el('div', 'opera__fallback');
      fb.setAttribute('aria-hidden', 'true');
      frame.append(canvas, fb);
      mount.appendChild(frame);
      mount.appendChild(stateLine('interpolazione latente · loop non risolto'));
      // monta la scena (parte da sola; pausa/cleanup gestiti dal modulo)
      live = createInterpolateScene(canvas, fb);
      return;
    }

    // op02 / op09 — audio: superficie d'ascolto + pulsante (gesto utente)
    if (op.live === 'respiro' || op.live === 'lamento') {
      const make = op.live === 'respiro' ? createRespiro : createLamento;
      const labelIdle =
        op.live === 'respiro' ? 'ascolta — quasi-silenzio' : 'ascolta — le note, non la canzone';
      const labelLive =
        op.live === 'respiro' ? 'in respiro… (ferma)' : 'le note isolate… (ferma)';

      const aud = el('div', 'opera__audio');
      const viz = el('div', 'opera__audio-viz');
      viz.appendChild(el('span', 'opera__audio-glyph', op.live === 'respiro' ? '◍' : '┊ ┊ ┊'));
      const hint = el(
        'p',
        'opera__audio-hint',
        op.live === 'respiro'
          ? 'l’aria del recinto a 35,9°. Premi per restare nel respiro.'
          : 'lo spartito esiste, la voce no. Premi: note sole, mai una melodia.'
      );
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'opera__listen';
      btn.textContent = labelIdle;
      aud.append(viz, btn, hint);
      mount.appendChild(aud);
      mount.appendChild(stateLine(op.live === 'respiro' ? '35,9 °C · durata indefinita' : 'non sintetizzato · durata indefinita'));

      // il modulo nasce ma NON parte: serve il gesto sul pulsante
      live = make({ target: backdrop, whisperUrl: '/opere/lamento-sussurro.mp3' });

      btn.addEventListener('click', async () => {
        if (!live) return;
        if (live.isRunning) {
          live.stop();
          btn.textContent = labelIdle;
          aud.classList.remove('is-live');
        } else {
          btn.disabled = true;
          try {
            await live.start();
            if (op.live === 'respiro') live.setVolume(0.18);
            else live.setVolume(0.16);
          } catch (e) { /* avvio negato: resta in soglia */ }
          btn.disabled = false;
          btn.textContent = labelLive;
          aud.classList.add('is-live');
        }
      });
      return;
    }

    // op06 — Archivio Provenienza
    if (op.archivio) {
      mount.appendChild(renderArchivio());
      return;
    }

    // op10 — il prompt mai eseguito (opera testuale)
    if (op.prompt) {
      const pr = el('div', 'opera__prompt');
      pr.appendChild(el('span', 'meta held', 'prompt mai eseguito · la lama completamente alzata'));
      const pre = document.createElement('pre');
      pre.className = 'opera__prompt-text';
      pre.textContent = op.prompt;
      pr.appendChild(pre);
      mount.appendChild(pr);
      return;
    }

    // op03 — la formula non miscelata (l'opera È la formula)
    if (op.formula) {
      const fo = el('div', 'opera__formula');
      fo.appendChild(el('span', 'meta', 'formula non miscelata · la temperatura del prima'));
      const list = document.createElement('dl');
      list.className = 'opera__formula-list';
      op.formula.forEach((row) => {
        const head = document.createElement('div');
        head.className = 'opera__formula-row';
        const dt = el('dt', 'opera__formula-nota', row.nota);
        const part = el('span', 'opera__formula-parte', row.parte);
        const dd = el('dd', 'opera__formula-dett', row.dett);
        const top = document.createElement('div');
        top.className = 'opera__formula-top';
        top.append(dt, part);
        head.append(top, dd);
        list.appendChild(head);
      });
      fo.appendChild(list);
      mount.appendChild(fo);
      return;
    }

    // op 1/4/5/8 — immagine (provino arrestato ad alta risoluzione)
    if (op.plate) {
      const wrap = el('div', 'opera__image');
      const img = document.createElement('img');
      img.src = op.plate;
      img.alt = PLATE_ALT[op.no] || '';
      img.decoding = 'async';
      wrap.appendChild(img);
      mount.appendChild(wrap);
      mount.appendChild(stateLine(op.stato || 'non risolto'));
      return;
    }

    // fallback generico (non dovrebbe accadere): provino di rumore
    const fb = el('div', 'opera__image');
    fb.appendChild(el('p', 'meta', 'provino arrestato'));
    mount.appendChild(fb);
  }

  /* ===========================================================================
     LA SCHEDA A 6 VOCI (cartiglio museale)
     ========================================================================= */
  function renderSheet(op, mount) {
    mount.appendChild(el('span', 'opera__no meta', `№ ${op.no} · ${op.medium}`));

    const h = el('h2', 'opera__title', op.titolo);
    h.id = 'opera-title';
    mount.appendChild(h);

    const dl = document.createElement('dl');
    dl.className = 'opera__voci';
    addVoce(dl, 'Anno', op.anno);
    addVoce(dl, 'Tecnica', op.tecnica);
    addVoce(dl, 'Dimensioni', op.dimensioni);
    addVoce(dl, 'Didascalia', op.didascalia);
    mount.appendChild(dl);

    const wall = el('div', 'opera__wall');
    wall.appendChild(el('span', 'meta', 'Testo di parete'));
    wall.appendChild(el('p', 'opera__wall-text', op.testoParete));
    mount.appendChild(wall);

    // verso sepolto: provenienza, in grigio-fiato (§6.5)
    if (op.verso) {
      const v = el('p', 'opera__verso', `« ${op.verso} »`);
      v.appendChild(document.createComment(` provenienza: ${op.verso} `));
      mount.appendChild(v);
    }
  }

  /* --- Archivio Provenienza (op06) ----------------------------------------- */
  function renderArchivio() {
    const arc = el('div', 'opera__archive');

    const a = el('section', 'opera__archive-block');
    a.appendChild(el('span', 'meta held', 'prompt & seed · il punto in cui ogni opera è stata fermata'));
    provenienza.forEach((r) => {
      const row = el('div', 'opera__prov');
      row.appendChild(el('span', 'opera__prov-no meta', `№ ${r.op}`));
      row.appendChild(el('span', 'opera__prov-titolo', r.titolo));
      row.appendChild(el('span', 'opera__prov-params meta', r.params));
      const q = el('p', 'opera__prov-prompt', `“${r.prompt}”`);
      row.appendChild(q);
      a.appendChild(row);
    });
    arc.appendChild(a);

    const b = el('section', 'opera__archive-block');
    b.appendChild(el('span', 'meta', 'versi abbandonati · la materia umana sotto la grana'));
    versiAbbandonati.forEach((vv) => {
      const row = el('div', 'opera__verso-block');
      row.appendChild(el('span', 'opera__verso-titolo meta', vv.titolo));
      const pre = document.createElement('pre');
      pre.className = 'opera__verso-text';
      pre.textContent = vv.testo;
      row.appendChild(pre);
      b.appendChild(row);
    });
    arc.appendChild(b);

    return arc;
  }

  function addVoce(dl, term, val) {
    if (!val) return;
    dl.appendChild(el('dt', 'opera__voce-term meta', term));
    dl.appendChild(el('dd', 'opera__voce-val', val));
  }

  function stateLine(text) {
    const s = el('div', 'opera__stage-state');
    s.appendChild(el('span', 'meta held', text));
    return s;
  }

  /* --- eventi: chiusura, Esc, click sul backdrop, focus trap --------------- */
  closeBtn.addEventListener('click', closeOpera);
  backdrop.addEventListener('mousedown', (e) => {
    if (e.target === backdrop) closeOpera();
  });
  document.addEventListener('keydown', (e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') { closeOpera(); return; }
    if (e.key === 'Tab') trapFocus(e);
  });

  function trapFocus(e) {
    const focusables = dialog.querySelectorAll(
      'button, [href], canvas, [tabindex]:not([tabindex="-1"])'
    );
    const list = Array.from(focusables).filter((n) => n.offsetParent !== null || n === dialog);
    if (!list.length) return;
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  function destroy() {
    closeLive();
    backdrop.remove();
  }

  return { openOpera, closeOpera, destroy };
}

/* helper DOM */
function el(tag, className, text) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text != null) n.textContent = text;
  return n;
}

/** Ritrova l'opera dal numero (usato da corpus.js per l'apertura). */
export function findOpera(no) {
  return opere.find((o) => o.no === no) || null;
}
