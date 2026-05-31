/* =============================================================================
   CORPUS — le 12 opere (CONCEPT.md §7 + Wave 5: op11 Calco del fiato, op12 L'ultima riga)
   Fonte autorevole dei testi: /output/testi/ (testi-di-parete, versi-abbandonati)
   e /output/schede.md (scheda a 6 voci). Apparato curatoriale impeccabile attorno
   a opere che rifiutano di finire.

   Campi per scheda:
     no, titolo, medium, stato, seed        — riga di catalogo / griglia
     plate                                  — immagine del provino arrestato
                                              (null → rumore generato a runtime)
     live                                   — 'interpolate' | 'respiro' | 'lamento'
                                              | 'ultimariga' (opera viva: scena
                                              WebGL, audio, o testo generativo)
     anno, tecnica, dimensioni, didascalia  — voci della scheda a 6 voci
     testoParete                            — testo di parete definitivo
     verso                                  — frammento del verso sepolto (§6.5)
     formula                                — solo op03 (olfatto): l'opera È la formula
     prompt                                 — solo op10: il prompt mai eseguito
   ============================================================================= */

export const opere = [
  {
    no: '01',
    titolo: 'Studio per un corpo che non diventa carne',
    medium: 'immagine · diffusione interrotta',
    stato: 'passo 14/50',
    seed: 'seed 314 · passo 14/50',
    plate: '/opere/01-studio-corpo.webp',
    anno: '2025',
    tecnica:
      'diffusione interrotta (SD3.5 Medium, seed 314, passo ~14/50) + post-processing; stampa pigmentata su cotone, ed. di 3',
    dimensioni: '73 × 107 cm · stampa pigmentata su cotone · ed. 1/3',
    didascalia:
      'Matteo Proietti, «Studio per un corpo che non diventa carne», 2025. Diffusione interrotta al passo 14 di 50, stampa pigmentata su cotone, 73 × 107 cm. Ed. 1/3.',
    testoParete:
      'La figura è emersa a metà. Il rumore non si è ancora ritirato del tutto, la forma non si è ancora chiusa. Non è un corpo vivo e non è una carcassa: è la cosa che sta tra i due, colta nel solo momento in cui può essere entrambe. Proietti ha fermato la macchina al quattordicesimo passo su cinquanta. Più avanti l’immagine sarebbe diventata certa, e quindi giudicabile. Qui resta possibile. La carne attesa, non ancora consegnata.',
    verso: 'ti ho tenuto al caldo, un grado sotto il vivo',
  },
  {
    no: '02',
    titolo: 'Le note per un lamento mai cantato',
    medium: 'suono · le note, non la canzone',
    stato: 'non sintetizzato',
    seed: 'midi · grezzo',
    plate: null,
    audio: null,
    live: 'lamento',
    anno: '2025',
    tecnica:
      'note generative non sintetizzate in canto (Web Audio) + voce sussurrata (ElevenLabs, sepolta sotto le note); durata indefinita, nessuna melodia',
    dimensioni: 'soundscape a durata indefinita · spartito-reliquia 50 × 70 cm',
    didascalia:
      'Matteo Proietti, «Le note per un lamento mai cantato», 2025. Note generative non sintetizzate in canto, Web Audio + voce sussurrata, durata indefinita.',
    testoParete:
      'Esiste la partitura, non la voce. La macchina ha scritto la linea del lamento ma non l’ha mai cantata: nessun timbro, nessun fiato, nessun corpo a sostenerla. Resta la griglia delle note, esposta come uno spartito tenuto a distanza. Il testo che avrebbe dovuto cantare è suo — parole tenute sotto la lingua, piccole, vive, per paura che facessero rumore. Le tiene mute. Un canto che conosce ogni sua nota e non viene emesso.',
    verso: 'la voce resta scritta, mai messa in aria',
  },
  {
    no: '03',
    titolo: 'Prova d’aria (la temperatura del prima)',
    medium: 'olfatto · la formula, non il profumo',
    stato: 'formula aperta',
    seed: 'metallo · paglia · adrenalina',
    plate: null,
    anno: '2025',
    tecnica:
      'formula olfattiva non miscelata — l’opera è la formula esposta come documento, non il profumo. Materie e proporzioni fissate, nessuna composizione versata',
    dimensioni: 'formula su carta cotone (cartiglio) 50 × 70 cm · nessun liquido',
    didascalia:
      'Matteo Proietti, «Prova d’aria (la temperatura del prima)», 2025. Formula olfattiva non miscelata, inchiostro su carta cotone, 50 × 70 cm.',
    // L'opera È la formula: lista di note (CONCEPT §7.3). Mai miscelata.
    formula: [
      { nota: 'metallo freddo', dett: 'aldeide metallica, nota ferrosa', parte: '35%' },
      { nota: 'calore animale', dett: 'muschio caldo, cuoio crudo, una traccia di sego', parte: '24%' },
      { nota: 'paglia', dett: 'fieno secco, polvere di lettiera, cumarina trattenuta', parte: '18%' },
      { nota: 'adrenalina', dett: 'accordo acido e netto: ozono, sale, sudore freddo', parte: '17%' },
      { nota: 'una dolcezza minima', dett: 'un velo di latte tiepido / mandorla — non arriva mai a sentirsi', parte: '6%' },
    ],
    testoParete:
      'Non c’è profumo. C’è la sua formula, esposta come un documento: metallo freddo, calore animale, paglia, la nota acida e netta dell’adrenalina. Le proporzioni sono fissate, le materie elencate, ma niente è stato composto. È l’odore del recinto un istante prima — la stanza che sa cosa sta per accadere e ancora non accade. Proietti tiene l’aria a quella soglia. Si legge ciò che si dovrebbe sentire, e proprio per questo lo si sente di più.',
    verso: 'il freddo del ferro prima del calore',
  },
  {
    no: '04',
    titolo: 'Schizzo per il gesto che non affonda',
    medium: 'immagine/scena · lo schizzo, non il finito',
    stato: 'lama alzata',
    seed: 'seed 1444 · resolve 0.62',
    plate: '/opere/04-schizzo-gesto.webp',
    anno: '2025',
    tecnica:
      'diffusione interrotta (SD3.5 Medium, seed 1444, resolve 0.62) + post-processing; stampa pigmentata su cotone, ed. di 3',
    dimensioni: '73 × 107 cm · stampa pigmentata su cotone · ed. 1/3',
    didascalia:
      'Matteo Proietti, «Schizzo per il gesto che non affonda», 2025. Diffusione interrotta (resolve 0.62), stampa pigmentata su cotone, 73 × 107 cm. Ed. 1/3.',
    testoParete:
      'Una mano alza un coltello. La linea sale, descrive l’intenzione, e si interrompe dove la discesa dovrebbe cominciare. Proietti l’ha lasciata allo stato di schizzo: tratti di costruzione ancora visibili, nessuna superficie finita, nessun affondo. Il gesto è tutto contenuto nella sua promessa. È il braccio alzato della mattanza, fermato nell’unico punto in cui è ancora soltanto un movimento — e non ha ancora fatto nulla a nessuno.',
    verso: 'la mano sa, e si trattiene',
  },
  {
    no: '05',
    titolo: 'Bozza di un volto sotto giudizio',
    medium: 'immagine · autoritratto non finito',
    stato: 'si disfa ai bordi',
    seed: 'seed 1717',
    plate: '/opere/05-bozza-volto.webp',
    anno: '2025',
    tecnica:
      'diffusione interrotta (SD3.5 Medium, seed 1717) + post-processing; l’autoritratto che non finirà; stampa pigmentata su cotone, ed. di 3',
    dimensioni: '73 × 107 cm · stampa pigmentata su cotone · ed. 1/3',
    didascalia:
      'Matteo Proietti, «Bozza di un volto sotto giudizio» (autoritratto), 2025. Diffusione interrotta, stampa pigmentata su cotone, 73 × 107 cm. Ed. 1/3.',
    testoParete:
      'Al centro un volto cerca di formarsi; ai bordi si disfa in rumore. Non arriva mai a essere abbastanza nitido da poter essere riconosciuto — e quindi giudicato. È l’autoritratto di chi è già stato pesato una volta, e ha deciso di non offrirsi una seconda. Da fermo sembra calmo: è solo l’animale che ha capito da che parte tengono la mano. Proietti rifiuta la propria immagine all’ultimo grado di definizione. Resta una bozza, e per questo resta libera.',
    verso: 'non riconoscermi: non ho ancora deciso chi sono',
  },
  {
    no: '06',
    titolo: 'Provenienza (l’archivio di ciò che non ho terminato)',
    medium: 'testo/installazione · archivio-reliquia',
    stato: 'in raccolta',
    seed: 'cartigli · seed · frammenti',
    plate: null,
    archivio: true, // apre l'Archivio Provenienza nell'overlay
    anno: '2024–2026',
    tecnica:
      'archivio-installazione (la Provenienza): prompt-bozza, sequenze di seed, parametri, provini scartati e frammenti di versi — esposti come reliquiario datato',
    dimensioni: 'installazione, dimensioni variabili · ~4 m lineari di parete',
    didascalia:
      'Matteo Proietti, «Provenienza (l’archivio di ciò che non ho terminato)», 2024–2026. Archivio-installazione: prompt, seed, provini, versi. Dimensioni variabili.',
    testoParete:
      'Cartigli, prompt lasciati a bozza, sequenze di seed, frammenti di versi mai conclusi. Questo archivio tiene insieme la sala come una teca tiene insieme delle reliquie. Non documenta opere finite: documenta il punto esatto in cui ciascuna è stata fermata. È la prova — rigorosa, datata, ordinata — di una sola decisione ripetuta a ogni opera: non arrivare alla fine. Sotto ogni immagine della sala c’è un foglio nascosto qui dentro. La materia umana, conservata sotto la superficie.',
    verso: 'tutto ciò che non è ancora stato tagliato',
  },
  {
    no: '07',
    titolo: 'Interpolazione (il verdetto tra due volti)',
    medium: 'video/loop · latent space',
    stato: 'non si ferma mai',
    seed: 'lerp · ∞',
    plate: null,
    video: null,
    live: 'interpolate',
    anno: '2025',
    tecnica:
      'interpolazione latente real-time, WebGL, loop non risolto. Il morph tra due volti non si posa mai su nessuno: il verdetto che non si emette',
    dimensioni: 'video/loop generativo, durata indefinita · schermo verticale 3:4',
    didascalia:
      'Matteo Proietti, «Interpolazione (il verdetto tra due volti)», 2025. Interpolazione latente real-time, WebGL, loop non risolto, durata indefinita.',
    testoParete:
      'Due volti, e tra loro il morphing che non si ferma mai. Lo spazio latente li attraversa di continuo senza posarsi su nessuno: ogni fotogramma è un volto che sta per essere e già non è più. Non c’è scelta, perché scegliere vorrebbe dire decidere, e decidere vorrebbe dire un verdetto. Proietti lascia il transito aperto in loop. È il percorso tra due identità tenuto eternamente di qua dall’arrivo — il giudizio rinviato, immagine dopo immagine.',
    verso: 'tra due volti, il percorso che non scelgo',
  },
  {
    no: '08',
    titolo: 'La pelle che non diventa pagina',
    medium: 'immagine · diffusione interrotta',
    stato: 'pelle/carta',
    seed: 'seed 4040',
    plate: '/opere/08-pelle-pagina.webp',
    anno: '2025',
    tecnica:
      'diffusione interrotta (SD3.5 Medium, seed 4040) + post-processing; superficie pelle/carta col livido di rosso trattenuto; stampa pigmentata su cotone, ed. di 3',
    dimensioni: '73 × 107 cm · stampa pigmentata su cotone · ed. 1/3',
    didascalia:
      'Matteo Proietti, «La pelle che non diventa pagina», 2025. Diffusione interrotta, stampa pigmentata su cotone, 73 × 107 cm. Ed. 1/3. Eco de «La Pelanda», dove si scuoiava.',
    testoParete:
      'Una superficie che non si decide: è pelle, è carta, è la cosa indecisa che precede entrambe. Qui — alla Pelanda, dove si scuoiavano gli animali — la pelle diventava materia da lavorare. Proietti la ferma un attimo prima: prima che diventi pagina, prima che qualcuno possa scriverci sopra. È il foglio bianco di un poeta che ha smesso di scrivere, tenuto allo stato in cui può ancora essere tutto e non è ancora niente.',
    verso: 'la superficie su cui non scriverò',
  },
  {
    no: '09',
    titolo: 'Respiro a 35,9°',
    medium: 'audio generativo + temperatura',
    stato: 'quasi-silenzio',
    seed: '35,9 · °C',
    plate: null,
    audio: null,
    live: 'respiro',
    anno: '2025',
    tecnica:
      'soundscape generativo, Web Audio, durata indefinita — un respiro lento (~14/min) e una sub-drone a 35,9 Hz; sala portata a 35,9 °C. Quasi-silenzio: presenza, non musica',
    dimensioni: 'ambientale, durata indefinita · opera climatica per l’intera sala (aria a 35,9 °C)',
    didascalia:
      'Matteo Proietti, «Respiro a 35,9°», 2025. Soundscape generativo, Web Audio, durata indefinita, + temperatura ambientale 35,9 °C.',
    testoParete:
      'Quasi-silenzio. Un respiro lento riempie la stanza, e con lui l’aria sale a 35,9 gradi — la temperatura di un corpo vivo, appena sotto. Non succede altro, e non deve. È l’opera che fa respirare l’intero recinto: il ritmo di chi è fermo e in allerta, di chi ha capito e attende. Si entra e ci si accorge che la sala respira alla stessa frequenza di chi la attraversa. Caldo come un fiato. Per ora.',
    verso: 'caldo come un fiato, appena sotto il vivo',
  },
  {
    no: '10',
    titolo: 'Prompt #∞ (l’istruzione che non ho eseguito)',
    medium: 'testo/stampa · il prompt come opera',
    stato: 'mai generata',
    seed: 'prompt · #∞',
    plate: null,
    anno: '2026',
    tecnica:
      'prompt mai eseguito — opera testuale. Stampa tipografica di una sola istruzione, integrale, mai data alla macchina: descrive per intero un’opera mai generata',
    dimensioni: 'stampa tipografica su carta cotone, 70 × 100 cm · ed. unica',
    didascalia:
      'Matteo Proietti, «Prompt #∞ (l’istruzione che non ho eseguito)», 2026. Prompt mai eseguito, stampa tipografica su carta cotone, 70 × 100 cm. Opera testuale.',
    // L'opera È questo testo: un prompt-istruzione di un'opera MAI generata (§7.10).
    prompt:
      'PROMPT #∞ — non eseguire.\n\nGenera l’unico ritratto di mio padre che rompe il pane a tavola, l’istante prima che lo spezzi: le mani grandi sul filone, le nocche già bianche, la crosta che non si è ancora aperta. Luce radente da una finestra a sinistra, 35,9 °C nell’aria. Sul lato opposto del tavolo, fuori fuoco, un ragazzo che tiene qualcosa sotto la lingua e non lo dice. Niente deve essere a fuoco del tutto; nessuna superficie finita; la grana della diffusione resta visibile su ogni cosa. Reso fotografico, monocromo osso e grigio-fiato, un solo rosso trattenuto — sotto la pelle delle mani — che non arriva mai a sangue. Falla così esatta che nessuno possa rifarla uguale: la distanza tra quello che sento e quello che resta sulla riga deve misurare un millimetro, forse meno.\n\nPoi arrèstati al passo 0 di 50. Non un passo. Lascia l’istruzione intatta, la lama completamente alzata. Non premere invio.',
    testoParete:
      'Una sola istruzione, stampata e appesa. Descrive per intero un’opera — la più compiuta della sala — e non è mai stata data alla macchina. Resta parola, intenzione, possibilità: l’unica opera che non potrà mai essere giudicata perché non è mai stata fatta. Una cosa così esatta che nessuno potesse rifarla uguale. Proietti l’ha scritta e si è fermato sul punto. Il coltello è qui completamente alzato, e la mano non lo lascerà cadere.',
    verso: 'l’ordine c’è. L’ho lasciato non eseguito.',
  },
  {
    no: '11',
    titolo: 'Calco del fiato',
    medium: 'immagine · diffusione interrotta',
    stato: 'passo 11/50',
    seed: 'seed 359 · passo 11/50',
    // il file arriva da un altro processo; finché manca, plate.js genera il rumore a runtime
    plate: '/opere/op11-calco-del-fiato.webp',
    anno: '2026',
    tecnica:
      'diffusione interrotta (SD3.5 Medium, seed 359, passo ~11/50) + post-processing d’arresto; il calco di un respiro sul vetro freddo, fermato prima che la condensa si chiuda in forma; stampa pigmentata su cotone, ed. di 3',
    dimensioni: '73 × 107 cm · stampa pigmentata su cotone · ed. 1/3',
    didascalia:
      'Matteo Proietti, «Calco del fiato», 2026. Diffusione interrotta al passo 11 di 50, stampa pigmentata su cotone, 73 × 107 cm. Ed. 1/3.',
    testoParete:
      'Un fiato ha appena toccato una superficie fredda e vi ha lasciato un alone. La diffusione lo porta verso una forma — un volto, una mano, forse solo una nuvola di calore — e si arresta all’undicesimo passo, prima che la condensa si chiuda in qualcosa di riconoscibile. È il calore di un corpo registrato senza il corpo: la prova che qualcuno era qui, un istante fa, e respirava. Proietti ferma l’immagine dove è ancora soltanto traccia. Più avanti sarebbe diventata un’identità, e quindi qualcosa da giudicare. Qui resta fiato: tiepido, anonimo, già quasi svanito.',
    verso: 'ho lasciato il mio caldo sul vetro, e niente nome',
  },
  {
    no: '12',
    titolo: 'L’ultima riga',
    medium: 'testo generativo · si ferma un carattere prima',
    stato: 'mai conclusa',
    seed: 'lerp · un carattere',
    plate: null,
    live: 'ultimariga',
    anno: '2026',
    tecnica:
      'testo generativo in tempo reale (codice nativo, nessun modello a runtime): un verso si scrive carattere per carattere e si arresta sull’ultimo, poi ricomincia. La frase conosce la propria fine e non la raggiunge mai — l’arresto reso linguaggio',
    dimensioni: 'opera testuale generativa, durata indefinita · schermo o proiezione, dimensioni variabili',
    didascalia:
      'Matteo Proietti, «L’ultima riga», 2026. Testo generativo in tempo reale, durata indefinita, dimensioni variabili.',
    testoParete:
      'Una riga di poesia si scrive da sola, lettera dopo lettera, alla velocità di chi la pensa mentre la batte. Arriva fino in fondo e si ferma un carattere prima dell’ultimo: la parola resta aperta, la frase non si chiude. Poi cancella tutto e ricomincia. È il gesto del poeta che ha smesso di finire, fatto verbo: la mano sa esattamente quale segno manca, e si trattiene dal porlo. Quel carattere mancante è la distanza tra ciò che si sente e ciò che resta sulla riga — un millimetro, forse meno. La riga non sarà mai l’ultima, perché non finisce.',
    verso: 'la distanza tra quello che sento e quello che resta sulla riga',
  },
];

// I tre frammenti dei versi abbandonati (provenienza, /output/testi/versi-abbandonati.md).
// Usati dall'Archivio Provenienza (op06) come materia umana sepolta sotto le opere.
export const versiAbbandonati = [
  {
    titolo: 'I. [senza titolo — il pane]',
    testo:
      'A tavola mio padre rompeva il pane\ncome si chiude una porta.\nIo tenevo le parole sotto la lingua,\npiccole, vive,\nper paura che facessero rumore\ne che il rumore fosse mio.',
  },
  {
    titolo: 'II. [senza titolo — il recinto]',
    testo:
      'Ho imparato a stare nel poco spazio\nche lasciano gli altri quando respirano.\nDa fermo sembro calmo.\nMa è solo l’animale che ha capito\nda che parte tengono la mano,\ne aspetta.',
  },
  {
    titolo: 'III. [senza titolo — la misura]',
    testo:
      'Volevo dire una cosa così esatta\nche nessuno potesse rifarla uguale.\nL’ho scritta. L’ho letta a voce bassa.\nPoi ho contato la distanza\ntra quello che sentivo\ne quello che era rimasto sulla riga:\nun millimetro, forse meno.\nCi stava dentro tutta la mia vita.',
  },
];

// La Provenienza tecnica (dal generation-log.md): prompt + seed dei provini.
// Alimenta l'Archivio (op06) come reliquiario datato.
export const provenienza = [
  {
    op: '01',
    titolo: 'Studio per un corpo che non diventa carne',
    params: 'sd3.5-medium · seed 314 · steps 18 · cfg 2.4 · 2:3 · CONTENT_FILTERED',
    prompt:
      'chiaroscuro study of a bare human torso emerging from darkness and grain… neither living flesh nor carcass… an unresolved figure',
  },
  {
    op: '04',
    titolo: 'Schizzo per il gesto che non affonda',
    params: 'sd3.5-medium · seed 1444 · steps 16 · cfg 2.3 · resolve 0.62',
    prompt:
      'a charcoal sketch of a hand gripping a raised knife at the very top of its arc… the gesture suspended and never completing… a line drawing that does not close',
  },
  {
    op: '05',
    titolo: 'Bozza di un volto sotto giudizio',
    params: 'sd3.5-medium · seed 1717 · steps 15 · cfg 2.2',
    prompt:
      'a human face coming apart into diffusion noise at its edges, a portrait arrested before resolution, half-formed features that refuse to be recognized or judged',
  },
  {
    op: '08',
    titolo: 'La pelle che non diventa pagina',
    params: 'sd3.5-medium · seed 4040 · steps 16 · cfg 2.4 (scartate: 1888, 2024, 777)',
    prompt:
      'macro photograph of pale taut human skin… nearly a page but unmistakably flesh',
  },
];
