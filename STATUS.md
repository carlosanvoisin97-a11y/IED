# STATUS — "L'attesa del coltello" · build autonomo
Aggiornato: 2026-05-31 (preflight)

## Stato globale: EXECUTING — Wave 1 ✓ → Wave 2 (immagini arrestate + media generativi)
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
