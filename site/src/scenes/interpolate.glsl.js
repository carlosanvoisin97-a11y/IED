/* =============================================================================
   SHADER — "Interpolazione (il verdetto tra due volti)" · opera 07
   Eco diretta della Legge 2 (non-risoluzione) applicata al morphing: un campo
   latente interpola tra DUE volti/forme (A e B) e NON si ferma MAI su uno dei
   due (CONCEPT §7.7). Il parametro `uMorph` percorre A→B→A all'infinito ma
   l'interpolazione è CLAMPATA agli estremi (vedi interpolate.js): non tocca mai
   né lo 0 puro (volto A risolto) né l'1 puro (volto B risolto). Il percorso
   resta sempre tra i due — il verdetto che non si emette.

   Le due "forme" sono due SDF di volto astratto (proporzioni diverse: uno più
   stretto/alto, uno più largo/basso) così la silhouette deriva senza mai
   stabilizzarsi. Sopra tutto, la grana di diffusione (§6.3) impedisce comunque
   la nitidezza: anche al centro del morph l'immagine "ribolle".

   Palette osso / grigio-fiato / rosso trattenuto, identica a denoise.glsl.js
   (deve combaciare con design-tokens.css). Il rosso affiora come calore nel
   punto in cui i due volti si contendono i lineamenti, e non satura mai.

   Sorgenti esportate come stringhe: niente loader, niente asset.
   ============================================================================= */

export const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0); // fullscreen quad in clip space
  }
`;

export const fragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform vec2  uResolution;
  uniform vec2  uPointer;   // puntatore normalizzato (-1..1) — deriva tenue
  uniform float uMorph;     // 0 = volto A · 1 = volto B (MAI raggiunti: ~0.12..0.88)
  uniform float uBreath;    // 0..1 battito ambientale (respiro)
  uniform float uGrain;     // ampiezza grana viva (0 con reduced-motion)

  // --- palette (combacia con denoise.glsl.js / design-tokens.css) ----------
  const vec3 INK   = vec3(0.043, 0.039, 0.039); // #0B0A0A
  const vec3 ASH   = vec3(0.082, 0.067, 0.059); // #15110F
  const vec3 BREATH= vec3(0.431, 0.400, 0.380); // #6E6661
  const vec3 BONE  = vec3(0.851, 0.812, 0.761); // #D9CFC2
  const vec3 RED   = vec3(0.478, 0.180, 0.149); // #7A2E26 (trattenuto)

  // --- hash & value noise (stesse routine del denoise) ---------------------
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 345.45));
    p += dot(p, p + 34.345);
    return fract(p.x * p.y);
  }

  float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash(i + vec2(0.0, 0.0));
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  // grana di diffusione strutturale
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

  // --- SDF di base: il volto astratto come campo ---------------------------
  float sdCircle(vec2 p, float r) { return length(p) - r; }

  float sdEllipse(vec2 p, vec2 r) {
    // approssimazione economica (sufficiente per una maschera morbida)
    float k = length(p / r);
    return (k - 1.0) * min(r.x, r.y);
  }

  // Un "volto" parametrico: ovale del cranio + due cavità oculari + asse del
  // naso/bocca. I parametri (larghezza, altezza, spaziatura occhi) cambiano tra
  // A e B così la silhouette deriva. Ritorna un campo 0..1 (1 = pieno del volto).
  float faceField(vec2 p, vec2 ovale, float eyeY, float eyeX, float eyeR) {
    // cranio: ellisse morbida
    float skull = sdEllipse(p - vec2(0.0, 0.02), ovale);
    float face = smoothstep(0.06, -0.06, skull);

    // cavità oculari: scavano due ombre (sottraggono massa)
    float eL = sdCircle(p - vec2(-eyeX, eyeY), eyeR);
    float eR = sdCircle(p - vec2( eyeX, eyeY), eyeR);
    float eyes = smoothstep(eyeR * 1.6, eyeR * 0.2, min(eL, eR));
    face -= eyes * 0.55;

    // asse naso/bocca: una tenue depressione verticale al centro-basso
    float axis = smoothstep(0.16, 0.0, abs(p.x)) *
                 smoothstep(0.34, 0.02, abs(p.y + 0.16));
    face -= axis * 0.12;

    return clamp(face, 0.0, 1.0);
  }

  void main() {
    // coordinate centrate, corrette per aspect ratio
    vec2 uv = vUv;
    vec2 p = (uv - 0.5);
    p.x *= uResolution.x / uResolution.y;

    // deriva lentissima + influenza tenue del puntatore (il recinto "sente")
    vec2 drift = vec2(
      sin(uTime * 0.043) * 0.018,
      cos(uTime * 0.031) * 0.012
    );
    p += drift + uPointer * 0.010;

    // ---- 1. i due volti latenti -------------------------------------------
    // Volto A: stretto e alto (proporzioni "scavate"); occhi vicini, in alto.
    float faceA = faceField(p, vec2(0.30, 0.40), 0.14, 0.115, 0.052);
    // Volto B: largo e basso; occhi distanti, più in giù.
    float faceB = faceField(p, vec2(0.38, 0.34), 0.10, 0.145, 0.060);

    // ---- 2. IL MORPH CHE NON SI FERMA -------------------------------------
    // uMorph oscilla tra ~0.12 e ~0.88 (clampato in JS): non raggiunge mai uno
    // dei due volti risolti. Interpoliamo i campi; il battito modula appena la
    // soglia di emersione, così i lineamenti "respirano" senza fissarsi.
    float morphed = mix(faceA, faceB, uMorph);

    // ---- 3. la grana di diffusione (il latent space che ribolle) ----------
    vec2 np = p * 3.0;
    np += uTime * 0.02;                  // scorre pianissimo
    float grain = fbm(np * 2.2);
    float field = fbm(np + grain * 0.5); // rumore base modulato

    // il volto interpolato non è MAI nitido: rimescolato con il rumore.
    // L'ampiezza del rumore è massima a metà strada tra i due volti (dove il
    // verdetto è più indeciso) e cala — senza azzerarsi — verso gli estremi.
    float indecision = 1.0 - abs(uMorph - 0.5) * 2.0; // 1 a metà, 0 agli estremi
    float noiseAmt = mix(0.30, 0.62, indecision);
    float img = mix(morphed, field, noiseAmt);

    // un alone di emersione: la figura "preme" col respiro ma non si risolve
    img = mix(img, morphed, 0.22 * uBreath);

    // ---- 4. mappatura tonale: cenere ↔ fiato ↔ osso -----------------------
    float t = clamp(img, 0.0, 1.0);
    vec3 col = mix(INK, ASH, smoothstep(0.0, 0.32, t));
    col = mix(col, BREATH, smoothstep(0.28, 0.60, t));
    col = mix(col, BONE,  smoothstep(0.56, 0.92, t));

    // ---- 5. il rosso trattenuto: dove i due volti si contendono i tratti ---
    // Il calore affiora dove A e B divergono di più (il bordo conteso del
    // morph) e pulsa col respiro; tetto duro, non satura mai (CONCEPT §6.3).
    float contested = abs(faceA - faceB);          // dove i volti non concordano
    float heat = contested * (0.05 + 0.06 * uBreath) * indecision;
    // concentrato nella zona occhi/zigomi (il punto del "giudizio")
    float locus = smoothstep(0.30, 0.0, length(p - vec2(0.0, 0.12)));
    heat *= locus;
    col = mix(col, RED, clamp(heat, 0.0, 0.15)); // max 15%

    // ---- 6. vignette caldo + grana finale ---------------------------------
    float vign = smoothstep(1.18, 0.22, length(p));
    col *= mix(0.70, 1.0, vign);
    // grana finale a bassissima ampiezza (residuo del denoise mai chiuso)
    float g = hash(uv * uResolution.xy * 0.5 + uTime) - 0.5;
    col += g * 0.025 * uGrain;

    gl_FragColor = vec4(col, 1.0);
  }
`;
