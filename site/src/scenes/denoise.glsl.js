/* =============================================================================
   SHADER — "Denoise sospeso"
   Il cuore della home. Un campo di rumore tende a FORMARE una figura (la sagoma
   di un corpo/volto nel recinto) ma viene ARRESTATO prima di risolversi
   (CONCEPT §6.1). Il parametro chiave è `uReveal`: l'animazione lo porta verso
   1.0 ma viene FERMATO a ~0.62 (vedi denoise.js). La figura non si compie mai.

   Tutto in osso / grigio-fiato; il rosso trattenuto affiora solo come velo nel
   "fiato" centrale, e non satura (CONCEPT §6.3).

   Esportiamo le sorgenti come stringhe: niente loader esterni, niente asset.
   ============================================================================= */

export const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0); // fullscreen triangle/quad in clip space
  }
`;

export const fragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform vec2  uResolution;
  uniform vec2  uPointer;    // posizione puntatore normalizzata (-1..1)
  uniform float uReveal;     // 0 = solo rumore · 1 = figura risolta (mai raggiunto)
  uniform float uBreath;     // 0..1 battito ambientale (respiro)

  // --- palette (deve combaciare con design-tokens.css) ---------------------
  const vec3 INK   = vec3(0.043, 0.039, 0.039); // #0B0A0A
  const vec3 ASH   = vec3(0.082, 0.067, 0.059); // #15110F
  const vec3 BREATH= vec3(0.431, 0.400, 0.380); // #6E6661
  const vec3 BONE  = vec3(0.851, 0.812, 0.761); // #D9CFC2
  const vec3 RED   = vec3(0.478, 0.180, 0.149); // #7A2E26 (trattenuto)

  // --- hash & value noise ---------------------------------------------------
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 345.45));
    p += dot(p, p + 34.345);
    return fract(p.x * p.y);
  }

  float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f); // smoothstep
    float a = hash(i + vec2(0.0, 0.0));
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  // fractal brownian motion: la "grana di diffusione" strutturale
  float fbm(vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 5; i++) {
      v += amp * valueNoise(p);
      p = rot * p * 2.02;
      amp *= 0.5;
    }
    return v;
  }

  // --- SDF: la figura latente (un corpo/volto sospeso, molto astratto) -------
  // Capsula verticale (torso) + testa: la sagoma dell'animale-uomo nel recinto.
  float sdCircle(vec2 p, float r) { return length(p) - r; }

  float sdCapsule(vec2 p, vec2 a, vec2 b, float r) {
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h) - r;
  }

  float figure(vec2 p) {
    // testa
    float head = sdCircle(p - vec2(0.0, 0.34), 0.135);
    // torso/collo (capsula verticale)
    float torso = sdCapsule(p, vec2(0.0, 0.2), vec2(0.0, -0.34), 0.18);
    float d = min(head, torso);
    return d; // <0 dentro la figura
  }

  void main() {
    // coordinate centrate, corrette per aspect ratio
    vec2 uv = vUv;
    vec2 p = (uv - 0.5);
    p.x *= uResolution.x / uResolution.y;

    // deriva lentissima + influenza tenue del puntatore (il recinto "sente")
    vec2 drift = vec2(
      sin(uTime * 0.05) * 0.02,
      cos(uTime * 0.037) * 0.015
    );
    p += drift + uPointer * 0.012;

    // ---- 1. campo di rumore (lo stato pre-figura) --------------------------
    vec2 np = p * 3.2;
    np += uTime * 0.015;                 // il rumore scorre pianissimo
    float grain = fbm(np * 2.4);         // grana fine
    float field = fbm(np + grain * 0.6); // rumore base modulato

    // ---- 2. la figura latente come maschera morbida ------------------------
    float d = figure(p);
    // bordo morbido: la figura "vorrebbe" emergere
    float figMask = smoothstep(0.10, -0.02, d);
    // ai bordi la figura si disfa in rumore (CONCEPT §7 op.5)
    float edge = smoothstep(0.0, 0.22, abs(d));
    float dissolve = mix(field, 1.0 - field, 0.5);

    // ---- 3. IL DENOISE ARRESTATO ------------------------------------------
    // uReveal spinge il rumore verso la figura. La soglia di emersione si
    // abbassa man mano, ma la figura resta sempre "sotto" il rumore: convergenza
    // mai completata. Aggiungiamo rumore residuo proporzionale a (1 - uReveal):
    // anche al massimo uReveal possibile (~0.62) resta grana ovunque.
    float resolved = mix(field, figMask, uReveal);
    float residualNoise = field * (1.0 - uReveal * 0.9);
    float img = mix(residualNoise, resolved, 0.62 + 0.2 * uBreath);

    // la figura non è mai netta: rimescolata con la dissoluzione ai bordi
    img = mix(img, dissolve, edge * (1.0 - uReveal) * 0.5);

    // ---- 4. mappatura tonale: osso ↔ cenere ↔ fiato ------------------------
    float t = clamp(img, 0.0, 1.0);
    vec3 col = mix(INK, ASH, smoothstep(0.0, 0.35, t));
    col = mix(col, BREATH, smoothstep(0.30, 0.62, t));
    col = mix(col, BONE,  smoothstep(0.58, 0.92, t));

    // ---- 5. il rosso trattenuto: velo nel "fiato" centrale, non satura -----
    // appare dove la figura emerge (il calore del corpo) ma a opacità bassissima
    // e pulsa col respiro; non diventa mai colore pieno (CONCEPT §6.3).
    float heat = figMask * (0.05 + 0.07 * uBreath);
    // si concentra nel petto/gola
    float chest = smoothstep(0.22, 0.0, length(p - vec2(0.0, -0.05)));
    heat *= chest;
    col = mix(col, RED, clamp(heat, 0.0, 0.16)); // tetto duro: max 16%

    // ---- 6. vignette caldo + grana finale ---------------------------------
    float vign = smoothstep(1.15, 0.25, length(p));
    col *= mix(0.72, 1.0, vign);
    // grana finale a bassissima ampiezza (residuo del denoise)
    float g = hash(uv * uResolution.xy * 0.5 + uTime) - 0.5;
    col += g * 0.025;

    gl_FragColor = vec4(col, 1.0);
  }
`;
