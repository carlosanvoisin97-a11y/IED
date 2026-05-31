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
import { createUltimaRiga } from '../scenes/ultimariga.js';
import { createRespiro } from '../audio/respiro.js';
import { createLamento } from '../audio/lamento.js';

// Gancio video op07: se il file Veo esiste in /opere lo mostriamo come opera
// (loop, muted, playsinline), con lo shader interpolate come fallback. I file
// NON sono presenti ora: vanno solo droppati qui e l'overlay li userà.
const OP07_VIDEO = '/opere/op07-veo.mp4';
const OP07_POSTER = '/opere/op07-veo-poster.jpg';

const PLATE_ALT = {
  '01': 'Torso emerso a metà dal rumore, né corpo né carcassa.',
  '04': 'Mano che alza un coltello all’apice dell’arco, la lama che non discende.',
  '05': 'Volto che si disfa in grana ai bordi, autoritratto che rifiuta di risolversi.',
  '08': 'Superficie indecisa tra pelle e carta, con un livido di rosso trattenuto.',
  '11': 'Alone di un respiro su una superficie fredda, fermato prima di chiudersi in forma.',
};

/** Verifica non bloccante che un asset esista DAVVERO (HEAD).
 *  Molti dev/preview server (Vite) rispondono 200 + text/html (SPA fallback)
 *  ai file mancanti: `r.ok` non basta. Controlliamo che il Content-Type combaci
 *  col tipo atteso (es. 'video/' o 'image/'); se è html, l'asset è assente. */
function assetExists(url, typePrefix) {
  return fetch(url, { method: 'HEAD' })
    .then((r) => {
      if (!r.ok) return false;
      const ct = (r.headers.get('content-type') || '').toLowerCase();
      if (ct.includes('text/html')) return false;          // SPA fallback → non c'è
      if (typePrefix && !ct.startsWith(typePrefix)) return false; // tipo sbagliato
      return true;
    })
    .catch(() => false);
}

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
      <nav class="opera__nav" aria-label="percorso tra le opere">
        <button class="opera__nav-btn opera__prev" type="button" aria-label="opera precedente">‹</button>
        <span class="opera__pos meta" aria-hidden="true"></span>
        <button class="opera__nav-btn opera__next" type="button" aria-label="opera successiva">›</button>
      </nav>
    </div>`;
  document.body.appendChild(backdrop);

  const dialog = backdrop.querySelector('.opera');
  const closeBtn = backdrop.querySelector('.opera__close');
  const stage = backdrop.querySelector('.opera__stage');
  const sheet = backdrop.querySelector('.opera__sheet');
  const prevBtn = backdrop.querySelector('.opera__prev');
  const nextBtn = backdrop.querySelector('.opera__next');
  const posEl = backdrop.querySelector('.opera__pos');

  let live = null; // handle del modulo vivo attivo (per il cleanup)
  let lastFocus = null; // elemento a cui restituire il focus alla chiusura
  let isOpen = false;
  let currentIndex = -1; // posizione nel corpus, per scorrere tra le opere
  let openToken = 0; // invalida i controlli asincroni (es. HEAD del video) al cambio opera

  // --- apertura -------------------------------------------------------------
  // mostra una specifica opera nell'overlay (usato all'apertura E nello scorrere)
  function showOpera(op) {
    openToken += 1; // invalida eventuali HEAD/async della precedente
    closeLive(); // igiene: mai due moduli vivi insieme
    currentIndex = opere.findIndex((o) => o.no === op.no);

    stage.innerHTML = '';
    sheet.innerHTML = '';
    renderStage(op, stage);
    renderSheet(op, sheet);

    if (posEl) posEl.textContent = `№ ${op.no} / ${String(opere.length).padStart(2, '0')}`;
    dialog.scrollTop = 0;
  }

  function openOpera(op, triggerEl) {
    if (!op) return;
    lastFocus = triggerEl || document.activeElement;
    showOpera(op);

    backdrop.classList.add('is-open');
    backdrop.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('overlay-lock');
    isOpen = true;

    dialog.focus({ preventScroll: true }); // focus al dialog (tastiera)
  }

  // scorrere tra le opere senza chiudere: distrugge il modulo vivo corrente e
  // monta la nuova; wrap agli estremi (il recinto è un anello)
  function goTo(delta) {
    if (!isOpen || currentIndex < 0) return;
    const n = opere.length;
    showOpera(opere[(currentIndex + delta + n) % n]);
    dialog.focus({ preventScroll: true });
  }

  // --- chiusura -------------------------------------------------------------
  function closeOpera() {
    if (!isOpen) return;
    openToken += 1; // invalida eventuali HEAD/async ancora in volo
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
    // op07 — interpolazione. Gancio video Veo: SE /opere/op07-veo.mp4 esiste,
    // mostriamo il VIDEO come opera (loop, muted, playsinline); ALTRIMENTI lo
    // shader interpolate (canvas WebGL vivo, mai risolto). Stessa cornice 3:4.
    if (op.live === 'interpolate') {
      const frame = el('div', 'opera__canvas-wrap');
      mount.appendChild(frame);
      const state = stateLine('interpolazione latente · loop non risolto');
      mount.appendChild(state);

      // token d'apertura: se l'utente chiude prima che l'HEAD risponda, non
      // montiamo nulla nel frattempo.
      const token = ++openToken;

      // monta lo shader interpolate (fallback): canvas + poster di grana
      const mountShader = () => {
        if (token !== openToken) return;
        closeLive();
        frame.innerHTML = '';
        const canvas = document.createElement('canvas');
        canvas.className = 'opera__canvas';
        canvas.setAttribute('aria-hidden', 'true');
        const fb = el('div', 'opera__fallback');
        fb.setAttribute('aria-hidden', 'true');
        frame.append(canvas, fb);
        state.querySelector('.meta').textContent = 'interpolazione latente · loop non risolto';
        // monta la scena (parte da sola; pausa/cleanup gestiti dal modulo)
        live = createInterpolateScene(canvas, fb);
      };

      assetExists(OP07_VIDEO, 'video/').then((hasVideo) => {
        if (token !== openToken) return; // overlay chiuso o riaperto su altra opera
        if (hasVideo) {
          const video = document.createElement('video');
          video.className = 'opera__canvas opera__video';
          video.src = OP07_VIDEO;
          video.poster = OP07_POSTER;
          video.loop = true;
          video.muted = true;
          video.defaultMuted = true;
          video.autoplay = true;
          video.playsInline = true;
          video.setAttribute('playsinline', '');
          video.setAttribute('aria-hidden', 'true');
          // se il video fallisce comunque (codec/rete), si ricade sullo shader
          video.addEventListener('error', mountShader, { once: true });
          frame.appendChild(video);
          state.querySelector('.meta').textContent = 'video generativo · loop · il verdetto che non si posa';
          const p = video.play();
          if (p && typeof p.catch === 'function') p.catch(() => {});
        } else {
          mountShader(); // nessun file Veo: lo shader
        }
      });
      return;
    }

    // op12 — "L'ultima riga": testo generativo che si arresta un char prima
    if (op.live === 'ultimariga') {
      const frame = el('div', 'opera__text-live');
      mount.appendChild(frame);
      mount.appendChild(stateLine('mai conclusa · un carattere prima della fine'));
      live = createUltimaRiga(frame);
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
  prevBtn.addEventListener('click', () => goTo(-1));
  nextBtn.addEventListener('click', () => goTo(1));
  backdrop.addEventListener('mousedown', (e) => {
    if (e.target === backdrop) closeOpera();
  });
  document.addEventListener('keydown', (e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') { closeOpera(); return; }
    if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(-1); return; }
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(1); return; }
    if (e.key === 'Tab') trapFocus(e);
  });

  // swipe orizzontale (touch): scorrere tra le opere
  let touchX = null;
  backdrop.addEventListener('touchstart', (e) => { touchX = e.changedTouches[0].clientX; }, { passive: true });
  backdrop.addEventListener('touchend', (e) => {
    if (touchX == null || !isOpen) return;
    const dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 56) goTo(dx < 0 ? 1 : -1); // swipe ← avanti · → indietro
  }, { passive: true });

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
