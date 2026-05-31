# STATUS — "L'attesa del coltello" · build autonomo
Aggiornato: 2026-05-31 (preflight)

## Stato globale: EXECUTING — Wave 2 ✓ → Wave 3 (sito+schede · allestimento · comms)
Engine: `executing-plans` + background agents + `loop` (la skill `/goal` non è disponibile in questa sessione → sostituita).
Spec di riferimento: `CONCEPT.md`. Budget: vedi `SPESE.md` (tetti rigidi).

## Workstream
- [x] A · Scrittura — Matteo Proietti; bio (484p), statement (216p), 3 versi, 10 testi di parete + sala ✓
- [ ] B · Corpus immagini (opere 1,4,5,8 + schede a 6 voci)
- [ ] C · Sito + opere vive (Three.js/WebGL, interattivo)
- [ ] D · Audio & olfatto (op. 2 lamento, 9 respiro, formula 3)
- [ ] E · Video/loop (op. 7 interpolazione)
- [ ] F · Allestimento (pianta 95 m², testo di parete, scheda sensoriale, render)
- [ ] G · Catalogo PDF + mock libro non-tagliato
- [ ] H · Comms & QA (comunicato, 2 post, mail, recensione fittizia, 3 checklist)
- [ ] Deploy Vercel (URL live)
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
