/* =============================================================================
   AUDIO "Respiro a 35,9°" — soundscape generativo · opera 09
   CONCEPT §7.9: quasi-silenzio di respiro, caldo, la temperatura del corpo come
   suono. Niente musica, niente melodia: solo PRESENZA. L'aria del recinto a
   35,9°C (§6.4), appena sotto il vivo.

   Sintesi (Web Audio puro, nessuna dipendenza):
   - RESPIRO: rumore filtrato (passa-banda) con inviluppo lento di inspiro/
     espiro a ~14 cicli/min (≈ respiro a riposo, lega il suono al battito
     ambientale del sito, Legge 3). L'espiro è più lungo e più scuro
     dell'inspiro (fisiologia reale). Mai un ritmo "musicale".
   - CALORE: una sub-drone bassissima (~35,9 Hz — la firma climatica resa
     udibile, un grado sotto il "36" del corpo) appena sopra la soglia, che
     dà corpo/temperatura senza essere riconoscibile come nota.
   - JITTER: ogni ciclo varia leggermente durata, profondità e timbro, così non
     diventa MAI un loop percepibile (Legge 1, non-risoluzione).

   Regole non negoziabili:
   - Non parte senza gesto utente: l'AudioContext nasce sospeso; `start()` va
     chiamato da un handler di click/tap (lo fa l'integrazione).
   - Pausa quando la tab è nascosta o l'elemento è fuori vista (parità con le
     scene 3D): si sospende il contesto e si annulla la programmazione.
   - `prefers-reduced-motion`: niente movimento del respiro; resta solo un velo
     di calore fermo a volume minimo (presenza, non animazione).
   - Volume di default bassissimo (quasi-silenzio): è ambiente, non contenuto.

   API pubblica (vedi INTEGRATION-wave2.md):
     const op9 = createRespiro({ target: el });   // el opzionale per l'IO
     await op9.start();   // DA UN GESTO UTENTE
     op9.stop();          // sospende (richiamabile con un altro gesto)
     op9.setVolume(0..1);
     op9.destroy();
   ============================================================================= */

import { prefersReducedMotion } from '../utils/env.js';

// --- costanti del respiro ---------------------------------------------------
const BREATHS_PER_MIN = 14;                 // ~respiro a riposo (CONCEPT)
const CYCLE_BASE = 60 / BREATHS_PER_MIN;    // ≈ 4.29 s per ciclo
const BODY_HZ = 35.9;                       // la temperatura come frequenza (firma)
const MASTER_DEFAULT = 0.18;                // quasi-silenzio: ambiente, non musica

export function createRespiro(opts = {}) {
  const reduced = prefersReducedMotion();

  // Lazy: l'AudioContext si crea solo al primo start() (gesto utente), così
  // niente warning "AudioContext was not allowed to start".
  let ctx = null;
  let master = null;       // gain generale (volume)
  let warmth = null;       // catena della sub-drone calda
  let breathBus = null;    // gain del respiro (sotto al master)
  let noiseBuffer = null;  // rumore rosa pre-generato (riusato a ogni ciclo)
  let running = false;
  let scheduler = null;    // timer di programmazione dei cicli
  let nextCycleTime = 0;   // quando parte il prossimo inspiro (clock audio)
  let masterTarget = clamp01(opts.volume != null ? opts.volume : MASTER_DEFAULT);

  // --- generazione del rumore (rosa-ish): caldo, non sibilante --------------
  function makeNoiseBuffer(audio) {
    const seconds = 3; // sorgente loopabile abbastanza lunga
    const len = Math.floor(audio.sampleRate * seconds);
    const buf = audio.createBuffer(1, len, audio.sampleRate);
    const data = buf.getChannelData(0);
    // filtro "pink-ish" via Voss-McCartney semplificato → meno acuti, più corpo
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.0990460;
      b1 = 0.96300 * b1 + white * 0.2965164;
      b2 = 0.57000 * b2 + white * 1.0526913;
      data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.18;
    }
    return buf;
  }

  // --- catena del CALORE: sub-drone a 35,9 Hz, appena udibile ---------------
  function buildWarmth(audio) {
    const osc = audio.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = BODY_HZ;

    // una seconda sinusoide quasi-unisono per un battito lentissimo (vivo, non
    // sintetico): pochi centesimi di Hz di differenza → beating impercettibile.
    const osc2 = audio.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = BODY_HZ * 1.004;

    // taglia ogni residuo acuto: deve essere puro corpo
    const lp = audio.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 90;
    lp.Q.value = 0.4;

    const g = audio.createGain();
    g.gain.value = 0.0;

    osc.connect(lp);
    osc2.connect(lp);
    lp.connect(g);
    g.connect(master);

    osc.start();
    osc2.start();

    // sale dolcissimo al valore di regime (presenza che "si accende")
    const now = audio.currentTime;
    g.gain.cancelScheduledValues(now);
    g.gain.setValueAtTime(0.0, now);
    g.gain.linearRampToValueAtTime(0.5, now + 6.0); // 6 s per emergere

    return { osc, osc2, lp, gain: g };
  }

  // --- un singolo respiro: inspiro (corto, più chiaro) + espiro (lungo, scuro)
  // Programmato sul clock audio per timing stabile a tab attiva.
  function scheduleBreath(startAt) {
    if (!ctx) return;

    // jitter: ogni ciclo è leggermente diverso → mai un loop riconoscibile
    const j = (a, b) => a + Math.random() * (b - a);
    const cycle = CYCLE_BASE * j(0.92, 1.12);
    const inhale = cycle * j(0.34, 0.40); // inspiro più breve
    const hold = cycle * j(0.02, 0.06);   // micro-apnea (il "prima")
    const exhale = cycle * j(0.50, 0.60); // espiro più lungo
    const peak = j(0.7, 1.0);             // profondità del respiro

    // sorgente di rumore (una per respiro, usa-e-getta)
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    src.loop = true;
    // leggera variazione di "grana" del fiato
    src.playbackRate.value = j(0.9, 1.1);

    // formante del fiato: passa-banda che si MUOVE (apertura della gola).
    // inspiro → banda più alta/aperta; espiro → scende e si scurisce.
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = j(0.6, 0.9);

    // un lievissimo passa-alto per togliere il rimbombo e tenerlo "aria"
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 180;

    const g = ctx.createGain();
    g.gain.value = 0.0;

    src.connect(bp);
    bp.connect(hp);
    hp.connect(g);
    g.connect(breathBus);

    const t0 = startAt;
    const tIn = t0 + inhale;
    const tHold = tIn + hold;
    const tOut = tHold + exhale;

    // --- inviluppo di ampiezza (inspiro→espiro), curve morbide ---
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.0001 + 0.5 * peak, tIn); // inspiro sale
    g.gain.setValueAtTime(0.5 * peak, tHold);                      // micro-tenuta
    g.gain.exponentialRampToValueAtTime(0.0001, tOut);             // espiro cala

    // --- movimento della banda (timbro del fiato) ---
    const fIn = j(620, 760);   // inspiro: gola più aperta
    const fOut = j(300, 380);  // espiro: scende, si scurisce
    bp.frequency.setValueAtTime(fOut, t0);
    bp.frequency.linearRampToValueAtTime(fIn, tIn);
    bp.frequency.setValueAtTime(fIn, tHold);
    bp.frequency.exponentialRampToValueAtTime(fOut, tOut);

    // avvio/arresto della sorgente con un margine
    src.start(t0);
    src.stop(tOut + 0.05);
    // pulizia nodo (evita accumulo)
    src.onended = () => {
      try { src.disconnect(); bp.disconnect(); hp.disconnect(); g.disconnect(); }
      catch (e) { /* già scollegato */ }
    };

    return tOut;
  }

  // --- programmatore: tiene 1–2 respiri "avanti" rispetto all'ora corrente --
  // (look-ahead classico: robusto, niente glitch quando il main thread è occupato)
  const LOOKAHEAD = 2.0; // s di programmazione anticipata
  function tick() {
    if (!running || !ctx || reduced) return;
    while (nextCycleTime < ctx.currentTime + LOOKAHEAD) {
      const end = scheduleBreath(nextCycleTime);
      // il prossimo inspiro parte poco dopo la fine dell'espiro (mai a tempo
      // esatto: una pausa "viva" prima di tornare a respirare)
      const gap = CYCLE_BASE * (0.04 + Math.random() * 0.10);
      nextCycleTime = end + gap;
    }
  }

  // --- visibilità: pausa quando tab nascosta o elemento fuori vista ---------
  let inView = true;
  let io = null;
  if (opts.target && 'IntersectionObserver' in window) {
    io = new IntersectionObserver(
      (entries) => {
        inView = entries[0].isIntersecting;
        syncRunState();
      },
      { threshold: 0.01 }
    );
    io.observe(opts.target);
  }

  function onVisibility() {
    syncRunState();
  }
  document.addEventListener('visibilitychange', onVisibility);

  // sospende/riprende il CONTESTO in base a vista+tab, senza distruggere nulla
  let userWantsOn = false; // l'utente ha avviato? (gate del gesto)
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
      // riallinea l'inizio del prossimo ciclo all'ora corrente del contesto
      nextCycleTime = Math.max(nextCycleTime, ctx.currentTime + 0.15);
      if (!scheduler && !reduced) scheduler = setInterval(tick, 250);
      tick();
    }
  }
  function suspendAudio() {
    running = false;
    if (scheduler) { clearInterval(scheduler); scheduler = null; }
    if (ctx && ctx.state === 'running') ctx.suspend();
  }

  // --- API pubblica ---------------------------------------------------------

  /** Avvia il soundscape. DEVE essere chiamato da un gesto utente. */
  async function start() {
    userWantsOn = true;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return; // ambiente senza Web Audio → no-op silenzioso
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.0;
      master.connect(ctx.destination);

      breathBus = ctx.createGain();
      breathBus.gain.value = reduced ? 0.0 : 1.0; // niente respiro se reduced
      breathBus.connect(master);

      noiseBuffer = makeNoiseBuffer(ctx);
      warmth = buildWarmth(ctx);

      // fade-in del master verso il target (quasi-silenzio)
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(0.0, now);
      master.gain.linearRampToValueAtTime(masterTarget, now + 4.0);
    }
    // alcuni browser richiedono resume() esplicito dopo la creazione
    if (ctx.state === 'suspended') {
      try { await ctx.resume(); } catch (e) { /* ignora */ }
    }
    syncRunState();
  }

  /** Sospende (riprendibile). Non distrugge i nodi. */
  function stop() {
    userWantsOn = false;
    suspendAudio();
  }

  /** Volume 0..1 (resta comunque "ambiente": tetto basso consigliato). */
  function setVolume(v) {
    masterTarget = clamp01(v);
    if (ctx && master) {
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.linearRampToValueAtTime(masterTarget, now + 0.6);
    }
  }

  /** Spegne tutto e libera le risorse. */
  function destroy() {
    stop();
    document.removeEventListener('visibilitychange', onVisibility);
    if (io) io.disconnect();
    try {
      if (warmth) {
        warmth.osc.stop(); warmth.osc2.stop();
        warmth.osc.disconnect(); warmth.osc2.disconnect();
        warmth.lp.disconnect(); warmth.gain.disconnect();
      }
    } catch (e) { /* già fermati */ }
    if (ctx) {
      const c = ctx;
      ctx = null;
      // chiusura asincrona: dà tempo agli ultimi nodi di spegnersi
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
