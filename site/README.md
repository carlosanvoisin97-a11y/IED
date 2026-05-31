# L'attesa del coltello — microsito

Sala I, ex Mattatoio di Testaccio · IED Roma · *Prompt Thinking MMXXVI*.
Vanilla JS + Vite + Three.js. Niente framework UI: la UI è HTML/CSS, il 3D è
isolato in moduli (vedi `src/scenes/`).

Estetica e regole: `../output/identita.md` e `../CONCEPT.md` (§5 anti-Black Mirror,
§6 grammatica del corpus). Regola d'oro: **se un effetto si risolve in qualcosa di
pulito, è sbagliato — va arrestato un attimo prima.**

## Avvio (dev)

```sh
cd site
npm install        # installa: three, vite (vedi package.json)
npm run dev        # avvia Vite su http://localhost:5173 (apre il browser)
```

Build di produzione (statica, per Vercel o qualsiasi host):

```sh
npm run build      # output in site/dist
npm run preview    # anteprima della build
```

> Le dipendenze NON sono ancora installate (`node_modules` assente per scelta).
> `npm install` le scarica (three ~1 MB, vite dev-only).

## Struttura

```
site/
├─ index.html                 home: tutto il contenuto è nel DOM (funziona senza JS)
├─ package.json               three + vite
├─ vite.config.js             config minima, base relativa
├─ public/
│  ├─ fonts/                  (opz.) font self-hostati al posto di Google Fonts
│  └─ opere/                  ← DROP degli asset reali delle 10 opere
└─ src/
   ├─ main.js                 entry: monta scena + corpus + reveal + cursore
   ├─ styles/
   │  ├─ design-tokens.css    PALETTE e variabili — fonte unica di verità
   │  ├─ base.css             reset, font, grana di diffusione (overlay film)
   │  └─ layout.css           recinto, hero, griglia opere, cartiglio, cursore
   ├─ scenes/
   │  ├─ denoise.js           controller Three.js del denoise sospeso
   │  └─ denoise.glsl.js      shader GLSL (rumore → figura, ARRESTATO a ~0.62)
   ├─ ui/
   │  ├─ corpus.js            costruisce la griglia dal dato
   │  ├─ plate.js             provino "arrestato" su canvas (finché manca l'asset)
   │  ├─ reveal.js            ingressi allo scroll (IntersectionObserver)
   │  └─ cursor.js            cursore custom osso→rosso
   ├─ data/
   │  └─ opere.js             ← LE 10 OPERE (punto di integrazione)
   └─ utils/
      └─ env.js               reduced-motion / touch
```

## Come integrare le 10 opere

Tutto passa da **`src/data/opere.js`**. Ogni opera ha campi `plate` / `audio` /
`video` oggi a `null`: la scheda mostra allora un provino di rumore arrestato
generato a runtime (nessun placeholder vuoto). Per collegare un asset reale:

1. Copia l'asset in `public/opere/` (es. `public/opere/01-corpo.webp`).
2. In `opere.js` imposta il percorso **relativo a public** con slash iniziale:
   ```js
   { no: '01', /* ... */ plate: '/opere/01-corpo.webp' }
   ```
   `plate.js` userà automaticamente `<img>` al posto del rumore.
3. Per audio (op. 2, 9) e video/loop (op. 7) i campi `audio`/`video` sono già
   predisposti nel dato; il rendering dedicato (player Web Audio / `<video>` muto
   in loop) è il lavoro della Wave 3 (Workstream C) — l'hook è qui.

### Cosa manca (per la Wave 3 "opere vive")
- **Asset immagine** (op. 1, 4, 5, 8): file a step basso in `public/opere/` +
  campo `plate`.
- **Pagina/overlay per singola opera** con la scheda a 6 voci (testi dal
  Workstream A) — la griglia oggi è la vista d'insieme.
- **Opere generative dedicate**: interpolazione latent-space (op. 7, un secondo
  shader sul modello di `denoise.glsl.js`), respiro audio 35,9° (op. 9, Web
  Audio/Tone.js), lamento MIDI non sintetizzato (op. 2).
- **Archivio Provenienza** (op. 6): vista elenco di seed/prompt-bozza/frammenti.
- **Versi definitivi**: i `verso` in `opere.js` e i `data-verso` in `index.html`
  sono di lavoro; sostituirli coi 3 frammenti dal Workstream A.

## Note tecniche
- **Performance/accessibilità**: pixelRatio cap 1.75, render in pausa fuori vista e
  a tab nascosta, `prefers-reduced-motion` spegne denoise/pulsazione/grana viva,
  fallback grana statica se manca WebGL.
- **Font**: importati da Google Fonts in `base.css` (Fraunces, Newsreader, IBM Plex
  Mono). Per build offline/Vercel più rapida, self-hostarli in `public/fonts` e
  sostituire l'`@import` con `@font-face`.
