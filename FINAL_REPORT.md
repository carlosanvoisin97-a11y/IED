# FINAL REPORT — «L'attesa del coltello» · Matteo Proietti
IED Roma · *Prompt Thinking* (Andrea Colamedici) · Sala I · ex Mattatoio di Testaccio, La Pelanda · 14 nov 2026 – 28 feb 2027
Build autonomo completato: 2026-05-31.

## Output consegnati
- **Sito live (l'artista esiste):** https://site-seven-rouge-36.vercel.app — mostra interattiva: loader a scritte, home con denoise sospeso, 12 opere con scheda a 6 voci, opere vive (video Veo, interpolazione, respiro, lamento, «L'ultima riga»), archivio Provenienza, grana coerente.
- **Catalogo d'esame:** online (HTML) https://catalogo-omega-seven.vercel.app · PDF `catalogo/catalogo.pdf` (31 pp, A4, font embedded, 6 sezioni, margini verificati a vista pagina per pagina).
- **Pacchetto di consegna:** `CONSEGNA/` + `CONSEGNA.zip` (~18 MB) — PDF, singole immagini, video op7, comunicazione, concept, README (`LEGGIMI.md`), email pronta (`EMAIL-da-inviare.md`).
- **Repo:** branch `build/attesa-del-coltello`, PR aperta su `main`.

## Concept (in breve)
Matteo Proietti (Roma, 2001), poeta battuto dall'IA, «smette di finire»: usa l'IA ma la arresta prima che risolva. Sala I = soglia, l'unica in cui il coltello non cade. Tesi: «tutto ciò che non è ancora stato tagliato». Principio: l'artista non finisce le opere; la documentazione è impeccabile. Anti-Black Mirror per costruzione (la checklist in `CONCEPT.md §5`).

## Corpus — 12 opere
01 Studio per un corpo che non diventa carne · 02 Le note per un lamento mai cantato · 03 Prova d'aria (formula olfattiva) · 04 Schizzo per il gesto che non affonda · 05 Bozza di un volto sotto giudizio · 06 Provenienza (archivio) · 07 Interpolazione (video Veo 3.1) · 08 La pelle che non diventa pagina · 09 Respiro a 35,9° · 10 Prompt #∞ (mai eseguito) · 11 Calco del fiato · 12 L'ultima riga (testo che si ferma un carattere prima della fine).
Media: immagine (SD3.5 Medium + post-processing «arrestato»), audio generativo (Web Audio), olfatto (formula non miscelata), video (Veo 3.1), testo/generativo, archivio.

## Spese (tetti rispettati)
Stability ~40/900 crediti (960 residui) · ElevenLabs 51/9000 · Veo 3.1: 1 clip 8s (Gemini API) · Vercel: hobby (gratis). Ampiamente sotto budget.

## ⚠ Sicurezza — azione consigliata
Durante un tentativo di deploy il file `.env` è stato stampato per errore nel log di sessione. **Rigenera/rota le 4 chiavi** (Gemini, Stability, ElevenLabs, Vercel) dopo la consegna.

## Invio a g.larosa@ied.edu
Il connettore **Microsoft 365 non ha completato l'autenticazione** (`AADSTS50011`: redirect URI `localhost:50678` non registrato nell'app OAuth — configurazione Azure non modificabile da qui). → **Pacchetto pronto all'invio manuale:**
1. Apri `CONSEGNA/EMAIL-da-inviare.md`, copia oggetto + corpo in Outlook (mittente `c.sanvoisin@heyaidital.it`).
2. Allega `CONSEGNA.zip`.
3. Invia a **g.larosa@ied.edu**.
(Lo zip è ~18 MB, entro i limiti tipici; il video è comunque sul sito live se l'allegato venisse rifiutato.)

## Note
- Catalogo: margini/whitespace rivisti (container centrato a schermo, `@page` allargati, running header inset).
- «Mock libro non tagliato» (Strato 3, extra opzionale): non realizzato.
- Tracciamento: `STATUS.md` (avanzamento) · `DECISIONI.md` (scelte curatoriali) · `SPESE.md` (budget).
