/* =============================================================================
   SCENA "Interpolazione (il verdetto tra due volti)" — controller Three.js
   Opera 07 (CONCEPT §7.7). Stesso schema isolato del denoise (principi 3D §1):
   nessun figlio DOM dentro la scena, init on-view, pausa off-view e a tab
   nascosta, cleanup su distruzione.

   Logica della NON-RISOLUZIONE (Legge 2 / §6.1):
   - `uMorph` percorre A↔B all'infinito con moto sinusoidale (respiro lento),
     ma è CLAMPATO a [MORPH_MIN, MORPH_MAX]: non tocca mai 0 (volto A risolto)
     né 1 (volto B risolto). Il percorso resta sempre fra i due — il verdetto
     che non si emette, il volto mai scelto.
   - Aggiungiamo una deriva lentissima e aperiodica alla fase, così il loop non
     è mai percepibile come loop (Legge 1).

   API pubblica (per l'integrazione Wave 3, vedi INTEGRATION-wave2.md):
     const op7 = createInterpolateScene(canvas, fallbackEl);
     op7.start(); op7.stop(); op7.destroy();
   Parte già da sola (come denoise); start/stop esposti per il controllo da
   overlay/scheda opera.

   Fallback: se manca WebGL → mostra il poster/fallback e esce senza errori
   (principi 3D §5, progressive enhancement).
   ============================================================================= */

import * as THREE from 'three';
import { vertexShader, fragmentShader } from './interpolate.glsl.js';
import { prefersReducedMotion } from '../utils/env.js';

// Il morph non raggiunge mai gli estremi: resta SEMPRE tra i due volti.
const MORPH_MIN = 0.12;   // mai sotto: il volto A non si risolve
const MORPH_MAX = 0.88;   // mai sopra: il volto B non si risolve
const MORPH_PERIOD = 19.0; // s — un'andata-e-ritorno A→B→A lentissima, ipnotica
const BREATH_PERIOD = 8.4; // s — combacia con --dur-breath (respiro a riposo)

export function createInterpolateScene(canvas, fallbackEl) {
  // --- 0. test WebGL → fallback grazioso ----------------------------------
  let gl = null;
  try {
    gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  } catch (e) {
    gl = null;
  }
  if (!gl) {
    if (fallbackEl) fallbackEl.style.display = 'block';
    canvas.style.display = 'none';
    return { destroy() {}, start() {}, stop() {} };
  }

  const reduced = prefersReducedMotion();

  // --- 1. renderer ---------------------------------------------------------
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,            // full-screen quad: inutile
    powerPreference: 'high-performance',
    alpha: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75)); // cap retina (§2)

  // --- 2. scena: un quad a tutto schermo con lo shader --------------------
  const scene = new THREE.Scene();
  const camera = new THREE.Camera(); // il vertex shader scrive già in clip space

  const uniforms = {
    uTime:       { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uPointer:    { value: new THREE.Vector2(0, 0) },
    uMorph:      { value: 0.5 },
    uBreath:     { value: 0.0 },
    uGrain:      { value: reduced ? 0.0 : 1.0 }, // grana viva spenta se reduced
  };

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    depthTest: false,
    depthWrite: false,
  });

  const geometry = new THREE.PlaneGeometry(2, 2);
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // --- 3. resize -----------------------------------------------------------
  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    uniforms.uResolution.value.set(
      w * renderer.getPixelRatio(),
      h * renderer.getPixelRatio()
    );
  }
  resize();
  window.addEventListener('resize', resize);

  // --- 4. puntatore (deriva tenue; il recinto "sente" la presenza) --------
  const targetPointer = new THREE.Vector2(0, 0);
  function onPointer(e) {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -((e.clientY / window.innerHeight) * 2 - 1);
    targetPointer.set(x, y);
  }
  if (!reduced) window.addEventListener('pointermove', onPointer, { passive: true });

  // --- 5. visibilità: pausa fuori vista (§2) e a tab nascosta -------------
  let visible = true;
  const io = new IntersectionObserver(
    (entries) => { visible = entries[0].isIntersecting; },
    { threshold: 0.01 }
  );
  io.observe(canvas);

  function onVisibility() {
    if (document.hidden) stop();
    else start();
  }
  document.addEventListener('visibilitychange', onVisibility);

  // --- 6. loop -------------------------------------------------------------
  const clock = new THREE.Clock();
  let rafId = null;
  let running = false;

  function frame() {
    if (!running) return;
    rafId = requestAnimationFrame(frame);
    if (!visible) return; // visibile ma fuori vista → niente render (§2)

    const t = clock.elapsedTime;

    // respiro: 0..1 sinusoidale al ritmo del battito ambientale
    const breath = 0.5 + 0.5 * Math.sin((t / BREATH_PERIOD) * Math.PI * 2);
    uniforms.uBreath.value = breath;
    uniforms.uTime.value = t;

    // deriva del puntatore (smorzata)
    uniforms.uPointer.value.lerp(targetPointer, 0.04);

    // IL MORPH CHE NON SI FERMA: A↔B sinusoidale, clampato agli estremi.
    if (reduced) {
      // versione calma: fermo a metà strada (indeciso ma immobile), nessun loop.
      uniforms.uMorph.value = 0.5;
    } else {
      // fase con deriva aperiodica lentissima → il loop non è mai "pulito"
      const phase = (t / MORPH_PERIOD) * Math.PI * 2 + Math.sin(t * 0.013) * 0.6;
      const s = 0.5 + 0.5 * Math.sin(phase);            // 0..1
      uniforms.uMorph.value = MORPH_MIN + s * (MORPH_MAX - MORPH_MIN);
    }

    renderer.render(scene, camera);
  }

  function start() {
    if (running) return;
    running = true;
    clock.getDelta(); // azzera il delta dopo una pausa
    rafId = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  start();

  // --- 7. cleanup ----------------------------------------------------------
  function destroy() {
    stop();
    window.removeEventListener('resize', resize);
    window.removeEventListener('pointermove', onPointer);
    document.removeEventListener('visibilitychange', onVisibility);
    io.disconnect();
    geometry.dispose();
    material.dispose();
    renderer.dispose();
  }

  return { destroy, start, stop };
}
