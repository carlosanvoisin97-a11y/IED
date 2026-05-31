/* =============================================================================
   PLATE — il "provino arrestato" di una scheda opera
   Finché l'asset reale (immagine a step basso) non esiste, generiamo a runtime
   un provino di rumore su <canvas> 2D: grana fredda con una tenue massa centrale
   che "vorrebbe" diventare figura e non ci riesce. Coerente con l'estetica
   "arrestata"; nessun placeholder vuoto.

   Costi/performance: canvas piccolo (rendering interno a bassa risoluzione,
   scalato in CSS), disegnato una sola volta (statico) — nessun loop, nessun
   peso sugli fps della home 3D. Con reduced-motion resta comunque statico.

   Quando arriva l'asset reale: passare `src` → si usa <img> e si salta il rumore.
   ============================================================================= */

const W = 240;
const H = 300;

/** Crea l'elemento provino per un'opera. */
export function createPlate(opera) {
  const wrap = document.createElement('div');
  wrap.className = 'work__plate';
  wrap.setAttribute('aria-hidden', 'true');

  if (opera.plate) {
    // asset reale disponibile: immagine del denoise a step basso
    const img = document.createElement('img');
    img.src = opera.plate;
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    wrap.appendChild(img);
    return wrap;
  }

  // nessun asset → rumore arrestato generato a runtime
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (ctx) drawArrestedNoise(ctx, hashSeed(opera.seed || opera.no));
  wrap.appendChild(canvas);
  return wrap;
}

/* --- rumore deterministico (così ogni opera ha il suo provino stabile) ----- */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < String(str).length; i++) {
    h ^= String(str).charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function drawArrestedNoise(ctx, seed) {
  const rand = mulberry32(seed);
  const img = ctx.createImageData(W, H);
  const d = img.data;

  // palette in 0..255 (osso / cenere / fiato) — combacia coi token
  const ASH = [21, 17, 15];
  const BREATH = [110, 102, 97];
  const BONE = [217, 207, 194];

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;

      // distanza dal "torso" centrale: una massa verticale ovale
      const nx = (x - W / 2) / (W * 0.34);
      const ny = (y - H * 0.52) / (H * 0.42);
      const dist = Math.sqrt(nx * nx + ny * ny);
      // massa latente: morbida, mai netta (la figura non si forma)
      const mass = Math.max(0, 1 - dist) * 0.45;

      // rumore: la grana di diffusione
      const n = rand();
      // il valore base è quasi-cenere; la massa lo schiarisce appena (verso osso)
      let v = 0.18 + n * 0.5 + mass;
      v = Math.min(1, v);

      let r, g, b;
      if (v < 0.4) {
        const t = v / 0.4;
        r = lerp(ASH[0], BREATH[0], t);
        g = lerp(ASH[1], BREATH[1], t);
        b = lerp(ASH[2], BREATH[2], t);
      } else {
        const t = (v - 0.4) / 0.6;
        r = lerp(BREATH[0], BONE[0], t);
        g = lerp(BREATH[1], BONE[1], t);
        b = lerp(BREATH[2], BONE[2], t);
      }
      d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  // velo caldo trattenuto al centro-basso (il calore del corpo), senza saturare
  const grad = ctx.createRadialGradient(W / 2, H * 0.62, 4, W / 2, H * 0.62, W * 0.7);
  grad.addColorStop(0, 'rgba(122, 46, 38, 0.10)');
  grad.addColorStop(1, 'rgba(122, 46, 38, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

function lerp(a, b, t) { return Math.round(a + (b - a) * t); }
