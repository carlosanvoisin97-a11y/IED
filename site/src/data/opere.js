/* =============================================================================
   CORPUS — le 10 opere (CONCEPT.md §7)
   PUNTO DI INTEGRAZIONE: ogni opera ha campi `plate` (immagine del provino
   arrestato), `audio`, `video` lasciati a null. Quando i Workstream B/D/E
   produrranno gli asset in /assets/, basterà popolare questi campi (e copiare
   gli asset in /site/public/opere/). Finché sono null, la scheda mostra un
   provino di rumore generato a runtime (vedi ui/plate.js): nessun placeholder
   vuoto, l'estetica "arrestata" regge da sola.

   `verso`: frammento del verso sepolto (provenienza nascosta, §6.5). I tre
   frammenti definitivi arrivano dal Workstream A; qui versi di lavoro coerenti
   col tono, da sostituire.
   ============================================================================= */

export const opere = [
  {
    no: '01',
    titolo: 'Studio per un corpo che non diventa carne',
    medium: 'immagine · diffusione interrotta',
    stato: 'passo 14/50',
    seed: '0x1F·a4',
    plate: null,
    verso: 'ti ho tenuto al caldo, un grado sotto il vivo',
  },
  {
    no: '02',
    titolo: 'Le note per un lamento mai cantato',
    medium: 'suono · le note, non la canzone',
    stato: 'non sintetizzato',
    seed: 'midi·grezzo',
    plate: null,
    audio: null,
    verso: 'la voce resta scritta, mai messa in aria',
  },
  {
    no: '03',
    titolo: 'Prova d’aria (la temperatura del prima)',
    medium: 'olfatto · la formula, non il profumo',
    stato: 'formula aperta',
    seed: 'metallo·paglia·adrenalina',
    plate: null,
    verso: 'il freddo del ferro prima del calore',
  },
  {
    no: '04',
    titolo: 'Schizzo per il gesto che non affonda',
    medium: 'immagine/scena · lo schizzo, non il finito',
    stato: 'lama alzata',
    seed: '0x07·b2',
    plate: null,
    verso: 'la mano sa, e si trattiene',
  },
  {
    no: '05',
    titolo: 'Bozza di un volto sotto giudizio',
    medium: 'immagine · autoritratto non finito',
    stato: 'si disfa ai bordi',
    seed: '0x2C·d9',
    plate: null,
    verso: 'non riconoscermi: non ho ancora deciso chi sono',
  },
  {
    no: '06',
    titolo: 'Provenienza (l’archivio di ciò che non ho terminato)',
    medium: 'testo/installazione · archivio-reliquia',
    stato: 'in raccolta',
    seed: 'cartigli·seed·frammenti',
    plate: null,
    verso: 'tutto ciò che non è ancora stato tagliato',
  },
  {
    no: '07',
    titolo: 'Interpolazione (il verdetto tra due volti)',
    medium: 'video/loop · latent space',
    stato: 'non si ferma mai',
    seed: 'lerp·∞',
    plate: null,
    video: null,
    verso: 'tra due volti, il percorso che non scelgo',
  },
  {
    no: '08',
    titolo: 'La pelle che non diventa pagina',
    medium: 'immagine · diffusione interrotta',
    stato: 'pelle/carta',
    seed: '0x44·e1',
    plate: null,
    verso: 'la superficie su cui non scriverò',
  },
  {
    no: '09',
    titolo: 'Respiro a 35,9°',
    medium: 'audio generativo + temperatura',
    stato: 'quasi-silenzio',
    seed: '35.9·°C',
    plate: null,
    audio: null,
    verso: 'caldo come un fiato, appena sotto il vivo',
  },
  {
    no: '10',
    titolo: 'Prompt #∞ (l’istruzione che non ho eseguito)',
    medium: 'testo/stampa · il prompt come opera',
    stato: 'mai generata',
    seed: 'prompt·#∞',
    plate: null,
    verso: 'l’ordine c’è. L’ho lasciato non eseguito.',
  },
];
