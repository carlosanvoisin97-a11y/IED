/* =============================================================================
   AUDIO "Le note per un lamento mai cantato" — generativo · opera 02
   CONCEPT §7.2: le note, NON la canzone. MIDI/grezzo mai sintetizzato in
   melodia; il testo del lamento sono i suoi versi. Qui: note ISOLATE che non
   diventano MAI una melodia — il fiato prima del grido, trattenuto (§6.1, §6.6).

   Posizione (non-risoluzione applicata al suono):
   - Ogni nota è un evento SOLO: nasce, gonfia appena come un fiato che sta per
     diventare voce... e si ritira PRIMA di "cantare" (l'attacco non sfocia mai
     in un sostegno pieno). Il grido è trattenuto.
   - Le note non costruiscono frasi: intervalli di tempo lunghi e irregolari,
     altezze scelte per NON formare scala/arpeggio riconoscibili (niente
     melodia, niente tonalità che "risolve").
   - Niente ritmo: nessuna griglia metrica. Silenzi lunghi: il lamento è ciò che
     NON viene cantato.

   Sintesi: Web Audio puro (nessuna dipendenza nuova; Tone.js NON è in package.json
   → non lo usiamo). Ogni nota è una piccola catena oscillatore→filtro→gain con
   inviluppo "trattenuto". Timbro vocale-ma-non-voce (vox-ish), caldo, fragile.

   Opzionale — il VERSO SUSSURRATO:
   - Se esiste /opere/lamento-sussurro.mp3 (generato via ElevenLabs, una sola
     riga di verso) lo si riproduce RARAMENTE e a volume bassissimo, sepolto tra
     le note: la voce che "resta scritta, mai messa in aria" (§6.5). Se il file
     non c'è, fallback automatico a sole note (nessun errore).

   Regole non negoziabili (parità con respiro.js / scene 3D):
   - Non parte senza gesto utente (AudioContext sospeso → `start()` da un click).
   - Pausa a tab nascosta / fuori vista.
   - prefers-reduced-motion: niente generazione viva; resta solo, eventualmente,
     UNA nota tenuta a volume minimo come presenza (nessuna sequenza).
   - Quasi-silenzio: volume di default basso, è soglia non concerto.

   API pubblica (vedi INTEGRATION-wave2.md):
     const op2 = createLamento({ target: el, whisperUrl: '/opere/lamento-sussurro.mp3' });
     await op2.start();   // DA UN GESTO UTENTE
     op2.stop();
     op2.setVolume(0..1);
     op2.destroy();
   ============================================================================= */

import { prefersReducedMotion } from '../utils/env.js';

const MASTER_DEFAULT = 0.16; // quasi-silenzio: soglia, non contenuto

// Altezze (Hz) scelte a mano per NON formare una scala/melodia: rapporti
// "scomodi" e ampi salti, registro grave-medio (gola). Sono semi/germi di voce,
// non note di un brano. L'ordine viene comunque randomizzato e mai ripetuto a
// formare frasi.
const SEEDS_HZ = [
  98.0,   // ~G2  — fondo del petto
  146.83, // ~D3
  174.6,  // ~F3
  207.65, // ~G#3 (rompe ogni tonalità con D/F)
  233.08, // ~A#3
  277.18, // ~C#4
  311.13, // ~D#4 — il più acuto: il grido che non arriva
];

export function createLamento(opts = {}) {
  const reduced = prefersReducedMotion();
  const whisperUrl = opts.whisperUrl || '/opere/lamento-sussurro.mp3';

  let ctx = null;
  let master = null;
  let convolver = null;     // riverbero corto (la sala, il recinto)
  let noteBus = null;       // somma delle note → (riverbero + dry) → master
  let dryGain = null, wetGain = null;
  let running = false;
  let nextNoteTimer = null; // timeout JS per la prossima nota (tempi lunghi/irregolari)
  let masterTarget = clamp01(opts.volume != null ? opts.volume : MASTER_DEFAULT);

  // verso sussurrato (caricato pigramente, opzionale)
  let whisperBuffer = null;
  let whisperTried = false;
  let whisperGain = null;

  let lastSeedIdx = -1; // per evitare immediate ripetizioni (anti-pattern melodico)

  // --- riverbero a impulso sintetico (niente asset esterni) -----------------
  function makeImpulse(audio, seconds = 2.6, decay = 3.2) {
    const rate = audio.sampleRate;
    const len = Math.floor(rate * seconds);
    const buf = audio.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        // coda esponenziale rumorosa → riverbero scuro e diffuso
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  // --- UNA nota "trattenuta": gonfia come fiato e si ritira prima di cantare -
  function playHeldNote(when, hz, opt = {}) {
    if (!ctx) return;
    const j = (a, b) => a + Math.random() * (b - a);

    // due oscillatori leggermente scordati → corpo "vocale", vivo, non sintetico
    const o1 = ctx.createOscillator();
    o1.type = 'triangle';                 // morbido, poche armoniche dure
    o1.frequency.value = hz;
    const o2 = ctx.createOscillator();
    o2.type = 'sine';
    o2.frequency.value = hz * j(1.004, 1.01); // micro-detune

    // formante vocale: passa-banda che apre un soffio e si richiude
    const formant = ctx.createBiquadFilter();
    formant.type = 'bandpass';
    formant.frequency.value = hz * j(2.0, 3.0); // armonica formantica
    formant.Q.value = j(2.0, 4.0);

    // ammorbidisce gli acuti (niente "sintetizzatore")
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = j(1400, 2200);
    lp.Q.value = 0.5;

    const g = ctx.createGain();
    g.gain.value = 0.0;

    o1.connect(formant);
    o2.connect(formant);
    formant.connect(lp);
    lp.connect(g);
    g.connect(noteBus);

    // --- inviluppo TRATTENUTO ---
    // attacco lento (il fiato che sale verso la voce), nessun sostegno pieno:
    // raggiunge solo una frazione, poi si ritira. Il grido non parte.
    const peak = (opt.peak != null ? opt.peak : 1.0) * j(0.5, 0.8);
    const attack = j(0.5, 1.1);   // il fiato sale
    const hold = j(0.05, 0.18);   // sospensione brevissima al culmine (il "prima")
    const release = j(1.8, 3.4);  // si ritira lentamente, si spegne

    const t0 = when;
    const tPeak = t0 + attack;
    const tHold = tPeak + hold;
    const tEnd = tHold + release;

    g.gain.setValueAtTime(0.0001, t0);
    // sale ma SOLO fino a `peak` (mai a 1: la voce piena non arriva)
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, 0.28 * peak), tPeak);
    g.gain.setValueAtTime(0.28 * peak, tHold);
    g.gain.exponentialRampToValueAtTime(0.0001, tEnd);

    // il formante si apre nell'attacco (la gola che sta per cantare) e si
    // richiude: la promessa di voce che non si compie.
    const fOpen = hz * j(3.0, 4.2);
    const fClose = hz * j(1.6, 2.2);
    formant.frequency.setValueAtTime(fClose, t0);
    formant.frequency.linearRampToValueAtTime(fOpen, tPeak);
    formant.frequency.exponentialRampToValueAtTime(fClose, tEnd);

    // un appena percettibile glissando in giù sul rilascio: il cedimento
    o1.frequency.setValueAtTime(hz, tHold);
    o1.frequency.exponentialRampToValueAtTime(hz * j(0.94, 0.985), tEnd);

    o1.start(t0); o2.start(t0);
    o1.stop(tEnd + 0.05); o2.stop(tEnd + 0.05);
    o1.onended = () => {
      try {
        o1.disconnect(); o2.disconnect();
        formant.disconnect(); lp.disconnect(); g.disconnect();
      } catch (e) { /* già scollegato */ }
    };

    return tEnd;
  }

  // --- il verso sussurrato (opzionale), sepolto e raro -----------------------
  async function loadWhisper() {
    if (whisperTried || !ctx) return;
    whisperTried = true; // un solo tentativo: assenza = fallback silenzioso
    try {
      const res = await fetch(whisperUrl);
      if (!res.ok) return;
      const arr = await res.arrayBuffer();
      whisperBuffer = await ctx.decodeAudioData(arr);
    } catch (e) {
      whisperBuffer = null; // nessun verso: solo note (nessun errore propagato)
    }
  }

  function playWhisper(when) {
    if (!ctx || !whisperBuffer) return;
    const src = ctx.createBufferSource();
    src.buffer = whisperBuffer;
    src.playbackRate.value = 0.96; // appena più lento → più trattenuto

    // molto scuro e bassissimo: deve restare SOTTO le note, quasi non emerso
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2600;

    const g = ctx.createGain();
    g.gain.value = 0.0;
    const t = when;
    const dur = whisperBuffer.duration;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.6); // emerge appena
    g.gain.setValueAtTime(0.5, t + Math.max(0.6, dur - 0.8));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    src.connect(lp);
    lp.connect(g);
    g.connect(noteBus); // passa anche nel riverbero: la voce nella sala
    src.start(t);
    src.stop(t + dur + 0.05);
    src.onended = () => {
      try { src.disconnect(); lp.disconnect(); g.disconnect(); } catch (e) {}
    };
  }

  // --- scelta della prossima altezza: mai due uguali di fila, salti ampi -----
  function pickSeed() {
    let idx = Math.floor(Math.random() * SEEDS_HZ.length);
    if (idx === lastSeedIdx) idx = (idx + 1 + Math.floor(Math.random() * (SEEDS_HZ.length - 1))) % SEEDS_HZ.length;
    lastSeedIdx = idx;
    // micro-stonatura per togliere ogni "intonazione da brano"
    const detune = 1 + (Math.random() * 0.012 - 0.006);
    return SEEDS_HZ[idx] * detune;
  }

  // --- generatore: una nota, poi un lungo silenzio irregolare, all'infinito --
  // (timeout JS, non look-ahead: i tempi sono LUNGHI e devono essere "vivi"/
  //  irregolari — la precisione campionaria non serve, anzi la nuoce.)
  let whisperCountdown = randInt(6, 11); // ogni tot note, forse, un sussurro
  function scheduleNext() {
    if (!running || !ctx || reduced) return;

    const now = ctx.currentTime;
    playHeldNote(now + 0.05, pickSeed(), { peak: 0.8 + Math.random() * 0.2 });

    // forse, raramente, il verso sussurrato (se caricato)
    whisperCountdown--;
    if (whisperCountdown <= 0 && whisperBuffer && Math.random() < 0.5) {
      playWhisper(now + 0.3);
      whisperCountdown = randInt(8, 14);
    } else if (whisperCountdown <= 0) {
      whisperCountdown = randInt(5, 9);
    }

    // intervallo lungo e irregolare prima della prossima nota: il silenzio è
    // il lamento. 3.5–9 s. Mai un tempo metrico.
    const gap = 3500 + Math.random() * 5500;
    nextNoteTimer = setTimeout(scheduleNext, gap);
  }

  // --- visibilità: pausa fuori vista / tab nascosta -------------------------
  let inView = true;
  let io = null;
  if (opts.target && 'IntersectionObserver' in window) {
    io = new IntersectionObserver(
      (entries) => { inView = entries[0].isIntersecting; syncRunState(); },
      { threshold: 0.01 }
    );
    io.observe(opts.target);
  }
  function onVisibility() { syncRunState(); }
  document.addEventListener('visibilitychange', onVisibility);

  let userWantsOn = false;
  function syncRunState() {
    if (!ctx) return;
    const shouldRun = userWantsOn && inView && !document.hidden;
    if (shouldRun) resumeAudio();
    else suspendAudio();
  }

  function resumeAudio() {
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (!running) {
      running = true;
      if (reduced) {
        // versione calma: UNA sola nota tenuta, nessuna sequenza viva
        playHeldNote(ctx.currentTime + 0.1, SEEDS_HZ[1], { peak: 0.5 });
      } else if (!nextNoteTimer) {
        // primo respiro di nota dopo un attimo di soglia
        nextNoteTimer = setTimeout(scheduleNext, 800 + Math.random() * 1500);
      }
    }
  }
  function suspendAudio() {
    running = false;
    if (nextNoteTimer) { clearTimeout(nextNoteTimer); nextNoteTimer = null; }
    if (ctx && ctx.state === 'running') ctx.suspend();
  }

  // --- API pubblica ---------------------------------------------------------

  /** Avvia. DEVE essere chiamato da un gesto utente. */
  async function start() {
    userWantsOn = true;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return; // niente Web Audio → no-op
      ctx = new AC();

      master = ctx.createGain();
      master.gain.value = 0.0;
      master.connect(ctx.destination);

      // bus note → split dry/wet (riverbero corto della sala)
      noteBus = ctx.createGain();
      noteBus.gain.value = 1.0;

      convolver = ctx.createConvolver();
      convolver.buffer = makeImpulse(ctx);

      dryGain = ctx.createGain(); dryGain.gain.value = 0.78;
      wetGain = ctx.createGain(); wetGain.gain.value = 0.42; // sala presente ma non invadente

      noteBus.connect(dryGain);
      noteBus.connect(convolver);
      convolver.connect(wetGain);
      dryGain.connect(master);
      wetGain.connect(master);

      // fade-in del master verso il target (quasi-silenzio)
      const now = ctx.currentTime;
      master.gain.setValueAtTime(0.0, now);
      master.gain.linearRampToValueAtTime(masterTarget, now + 3.0);

      // carica il verso sussurrato in background (opzionale)
      loadWhisper();
    }
    if (ctx.state === 'suspended') {
      try { await ctx.resume(); } catch (e) {}
    }
    syncRunState();
  }

  /** Sospende (riprendibile). */
  function stop() {
    userWantsOn = false;
    suspendAudio();
  }

  /** Volume 0..1 (resta "soglia": tetto basso consigliato). */
  function setVolume(v) {
    masterTarget = clamp01(v);
    if (ctx && master) {
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.linearRampToValueAtTime(masterTarget, now + 0.6);
    }
  }

  /** Spegne e libera le risorse. */
  function destroy() {
    stop();
    document.removeEventListener('visibilitychange', onVisibility);
    if (io) io.disconnect();
    if (ctx) {
      const c = ctx;
      ctx = null;
      setTimeout(() => { try { c.close(); } catch (e) {} }, 200);
    }
  }

  return { start, stop, setVolume, destroy, get isRunning() { return running; } };
}

function clamp01(v) {
  v = Number(v);
  if (!isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}
function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
