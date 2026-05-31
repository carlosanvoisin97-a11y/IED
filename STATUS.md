# STATUS — "L'attesa del coltello" · build autonomo
Aggiornato: 2026-05-31 (preflight)

## Stato globale: EXECUTING — Wave 4 (catalogo ✓, deploy ✓) → Wave 5 (effetti/hero/op11-12/Veo) + PR + report
Engine: `executing-plans` + background agents + `loop` (la skill `/goal` non è disponibile in questa sessione → sostituita).
Spec di riferimento: `CONCEPT.md`. Budget: vedi `SPESE.md` (tetti rigidi).

## Wave 5 (IN CODA — dopo il catalogo; non toccare /site finché G non finisce)
Richieste utente (2026-05-31):
- **Hero nuova frase:** «Un poeta usa l'intelligenza artificiale e la arresta prima che risolva. Le opere restano sulla soglia. Qui in questa sala, il coltello non cade.»
- **Ripassata web-design** per migliorare la resa del sito live e della hero.
- **op7:** aggiungere un **video generato con Veo (ultimo modello)** via Gemini API (fallback: tenere lo shader se Veo non disponibile).
- **Corpus a 12 opere:** aggiungere op11 e op12 coerenti; riempire ogni placeholder, nessuno slot vuoto.
- **Effetti da `angelini-academy` (versione -dev mockup):** loader con scritte, effetti 3D, ecc. — solo ciò che si adatta senza snaturare concept/stile attuali.
  - STUDIO FATTO → PORTARE (riadattati vanilla, palette fredda): (1) **IntroLoader** = loader a parole «Il taglio. / Il prima. / L'attesa.» (serif sottile, osso su #0d0d0b, ~1400ms/parola, uscita silenziosa, sessionStorage); (2) **HeroGrain** SVG feTurbulence (opacity ~0.08, baseFreq 0.92); (3) **MouseGlow** ridotto, quasi incolore. EVITARE: ponte/molecole 3D, scroll orizzontale, bottoni magnetici, blob caldi.
  - op11 = "Calco del fiato" (immagine arrestata); op12 = "L'ultima riga" (testo generativo, si ferma 1 char prima della fine).
- Poi: rebuild + **redeploy Vercel** + **rigenerare il catalogo a 12 opere**.

## Workstream
- [x] A · Scrittura — Matteo Proietti; bio (484p), statement (216p), 3 versi, 10 testi di parete + sala ✓
- [ ] B · Corpus immagini (opere 1,4,5,8 + schede a 6 voci)
- [x] C · Sito + opere vive ✓ — integrato, build OK, verifica headless PASS (0 errori console)
- [ ] D · Audio & olfatto (op. 2 lamento, 9 respiro, formula 3)
- [ ] E · Video/loop (op. 7 interpolazione)
- [ ] F · Allestimento (pianta 95 m², testo di parete, scheda sensoriale, render)
- [x] G · Catalogo PDF (28 pp A4, font embedded, 6 sezioni) ✓ — `/catalogo/`. (mock libro non-tagliato: extra opzionale, non fatto)
- [ ] H · Comms & QA (comunicato, 2 post, mail, recensione fittizia, 3 checklist)
- [x] Deploy Vercel ✓ — LIVE: https://site-seven-rouge-36.vercel.app
- [ ] FINAL_REPORT.md

## Log
- 2026-05-31: preflight — repo scaffolded, .env (gitignored), spec copiata.
- 2026-05-31: branch pushato, PLAN.md scritto, Wave 1 dispatch (3 agenti paralleli).
- 2026-05-31: Wave 1/A COMPLETATO — testi committati. Nome: Matteo Proietti. (SiteID + Pilot in corso)
- 2026-05-31: Wave 1/Pilot COMPLETATO — pipeline Stability OK (curl+UA), 8 cr usati. Serve SD3 Medium + post-processing per il look «arrestato» (recipe in DECISIONI.md). (SiteID in corso)
- 2026-05-31: Wave 1/SiteID COMPLETATO — identità (palette osso/fiato/rosso-trattenuto; Fraunces+Newsreader+IBM Plex Mono) + scaffold sito Vite+Three.js (shader denoise arrestato a 0.62, fallback/a11y, 10 opere in data/opere.js). WAVE 1 COMPLETA → lancio Wave 2.
- 2026-05-31: Wave 2/M (opere vive) COMPLETATO — op7 interpolate (morph 0.12-0.88, mai risolto), op9 respiro (14/min + 35,9 Hz), op2 lamento (7 note mai melodia) + sussurro ElevenLabs (51 cr). Integrazione → site/src/INTEGRATION-wave2.md. (immagini B in corso)
- 2026-05-31: Wave 2/B (immagini) rientrato — 4 opere, 14 cr (978 residui). Review orchestratore a vista: op4/op5 approvate, op1 +rosso, op8 da rifare (troppo vuota→pelle tesa). Rimando i 2 ritocchi a B prima di committare le immagini.
- 2026-05-31: ritocchi COMPLETATI — op1 (+rosso tint), op8 (membrana/pelle + livido). Corpus 4/4 APPROVATO. Stability 21 cr (971 residui). WAVE 2 ✓ → lancio Wave 3 (sito+schede, allestimento, comms).
- 2026-05-31: Wave 3/H (comms) COMPLETATO — comunicato, 2 post (op4 teaser, op5 concettuale), invito vernissage, recensione fittizia («Campo Neutro», C. Ripamonti). (sito + allestimento in corso)
- 2026-05-31: Wave 3/F (allestimento) COMPLETATO — pianta.svg (recinto a serpentina, 10 opere collocate), scheda-sensoriale, 2 render (7 cr → 964 residui), allestimento.md. (sito C in corso, ultimo della Wave 3)
- 2026-05-31: Wave 3/C (sito+schede) COMPLETATO — schede a 6 voci (10 opere; op3 formula, op6 Provenienza, op10 prompt mai eseguito), integrazione + opera-overlay, build OK, verifica headless PASS. Pronto al deploy. WAVE 3 ✓ → Wave 4.
- 2026-05-31: render sala approvati a vista (piastrelle/ganci/scolo, atmosfera del prima). WAVE 4 avviata: dispatch catalogo PDF (agente) + deploy Vercel.
- 2026-05-31: DEPLOY VERCEL OK ✓ — sito LIVE in produzione: https://site-seven-rouge-36.vercel.app (build Vite OK). Catalogo PDF in corso (ultimo task).
- 2026-05-31: Wave 4/G COMPLETATO — catalogo.pdf 28 pp (HTML/CSS → Chrome headless, font self-hostati embedded, 6 sezioni). WAVE 4 core ✓.
- 2026-05-31: avvio Wave 5: prep asset (op11 immagine + Veo op7) in corso; agente site-enhancement (loader/grana/glow + hero nuova + polish + op12) lanciato.
- 2026-05-31: prep Wave 5 COMPLETATO — op11 «Calco del fiato» (3.5 cr) + VIDEO VEO op7 OK (veo-3.1-generate-preview, 8s) approvati a vista. Restano: drop asset nel sito (dopo site-enhancement), rebuild+redeploy, catalogo→12 opere, PR, report finale.
- NOTA SICUREZZA: durante un tentativo di deploy il sourcing di .env ha stampato i valori delle 4 chiavi nel log di sessione → CONSIGLIO: rigenerare/rotare le chiavi (Gemini, Stability, ElevenLabs, Vercel) dopo la consegna.
