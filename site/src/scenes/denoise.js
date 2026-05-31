/* =============================================================================
   SCENA "Denoise sospeso" — controller Three.js
   Isolata in un modulo (principi 3D §1): nessun figlio React/DOM dentro la
   scena. Init on-view, pausa off-view, cleanup su distruzione (§1, §2).

   Logica dell'ARRESTO (CONCEPT §6.1):
   - `reveal` viene animato VERSO il basso (ovvero verso la figura) ma viene
     CLAMPATO a REVEAL_MAX (0.62). La figura non si risolve mai.
   - Quando `reveal` raggiunge REVEAL_MAX, oscilla leggermente sotto la soglia
     (la figura "preme" ma è trattenuta), legato al respiro.

   Fallback: se WebGL non è disponibile, mostriamo il poster di grana statica
   e usciamo senza errori (principi 3D §5, CONCEPT progressive enhancement).
   ============================================================================= */

import * as THREE from 'three';
import { vertexShader, fragmentShader } from './denoise.glsl.js';
import { prefersReducedMotion } from '../utils/env.js';

const REVEAL_MAX = 0.62;     // soglia di arresto: la figura non va oltre
const REVEAL_RISE = 0.06;    // quanto si avvicina alla soglia al secondo
const BREATH_PERIOD = 8.4;   // s — combacia con --dur-breath (respiro a riposo)

export function createDenoiseScene(canvas, fallbackEl) {
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
    return { destroy() {} };
  }

  const reduced = prefersReducedMotion();

  // --- 1. renderer ---------------------------------------------------------
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,            // non serve: full-screen quad
    powerPreference: 'high-performance',
    alpha: false,
  });
  // cap del devicePixelRatio: protegge gli fps sui display retina (§2)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));

  // --- 2. scena: un quad a tutto schermo con lo shader --------------------
  const scene = new THREE.Scene();
  const camera = new THREE.Camera(); // il vertex shader scrive già in clip space

  const uniforms = {
    uTime:       { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uPointer:    { value: new THREE.Vector2(0, 0) },
    uReveal:     { value: 0.0 },
    uBreath:     { value: 0.0 },
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

  // --- 5. visibilità: pausa quando fuori schermo (§2) ---------------------
  let visible = true;
  const io = new IntersectionObserver(
    (entries) => { visible = entries[0].isIntersecting; },
    { threshold: 0.01 }
  );
  io.observe(canvas);

  // pausa anche quando la tab è nascosta
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

    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    // respiro: 0..1 sinusoidale al ritmo del battito ambientale
    const breath = 0.5 + 0.5 * Math.sin((t / BREATH_PERIOD) * Math.PI * 2);
    uniforms.uBreath.value = breath;
    uniforms.uTime.value = t;

    // deriva del puntatore (smorzata)
    uniforms.uPointer.value.lerp(targetPointer, 0.04);

    // L'ARRESTO: reveal sale verso REVEAL_MAX e lì si trattiene, oscillando
    // appena sotto la soglia, legato al respiro (la figura preme, non emerge).
    if (reduced) {
      uniforms.uReveal.value = REVEAL_MAX * 0.7; // versione calma: stato fisso
    } else {
      const r = uniforms.uReveal.value;
      if (r < REVEAL_MAX - 0.001) {
        // avvicinamento asintotico: rallenta vicino alla soglia (non-risoluzione)
        const remaining = REVEAL_MAX - r;
        uniforms.uReveal.value = r + remaining * REVEAL_RISE * dt * 16.0;
      } else {
        // trattenuto: micro-oscillazione sotto la soglia
        uniforms.uReveal.value = REVEAL_MAX - 0.03 * (1.0 - breath);
      }
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
