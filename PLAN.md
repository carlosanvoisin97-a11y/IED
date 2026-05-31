# PLAN — Build "L'attesa del coltello"
Branch: `build/attesa-del-coltello` · Spec: `CONCEPT.md` · Stato: `STATUS.md` · Budget: `SPESE.md`

## Workflow dinamico (a ondate, con dipendenze esplicite)

**WAVE 1 — fondamenta (parallelo, costo 0 tranne pilota):**
- **A · Scrittura:** nome artista, biografia critica (1 pag), statement (½ pag), 3 frammenti di versi, 10 testi di parete + testo di parete della sala → `/output/testi/`
- **SiteID · Sito + identità:** palette/tipografia/grammatica, design tokens, scaffold Vite+Three.js con home 3D proof → `/site`, `/output/identita.md`
- **Pilot · Pilota immagine:** script API Stability + 2 immagini-test in estetica "arrestata" (≤16 crediti) → `/assets/immagini/_pilot/`

**WAVE 2 — produzione asset (dopo validazione pilota):**
- **B** corpus immagini (op. 1,4,5,8 + varianti) + schede a 6 voci · **D** audio (op.2 lamento, op.9 respiro) + formula olfattiva (op.3) · **E** video/loop (op.7 interpolazione)

**WAVE 3 — assemblaggio:**
- **C** sito con opere vive (denoise/interpolazione/audio) + archivio Provenienza · **G** catalogo PDF (slide 16) + mock libro non-tagliato

**WAVE 4 — chiusura:**
- **H** comms (comunicato, 2 post, mail, recensione fittizia) + QA (3 checklist) · Deploy Vercel · PR su `main` · `FINAL_REPORT.md`

## Mappa skill → wave
frontend-design / web-design-3d / web-artifacts-builder / algorithmic-art → SiteID, C, E · theme-factory / brand-guidelines → SiteID · canvas-design → G · copywriting / marketing-ideas → H · webapp-testing → QA · writing-plans/executing-plans/dispatching-parallel-agents → orchestrazione.

## Regole per gli agenti
- Spec = `CONCEPT.md`. Rispettare grammatica del corpus (§6) e checklist anti-Black Mirror (§5).
- **NON eseguire comandi git** (li gestisce l'orchestratore). Produrre file ai percorsi indicati. Restituire un summary con decisioni e costi.
- Chiavi in `.env` (root). Rispettare i tetti di `SPESE.md`; al limite → fallback gratuito. Mai stampare i valori delle chiavi.
- Decidere in autonomia (Giulia ha delegato). 

## Acceptance
Definition of Done in `CONCEPT.md §10` tutta verde + URL live + `FINAL_REPORT.md`.
