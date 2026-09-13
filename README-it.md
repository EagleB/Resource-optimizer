% Pianificatore Risorse Settimanale

Una singola pagina HTML per la pianificazione settimanale: apri `resource_planner.html` in un browser moderno (Edge, Chrome, Firefox). Nessuna installazione richiesta, funziona anche offline.

## Cosa fa
Costruisce un piano di turni per una settimana in modo che la finestra di servizio giornaliera sia sempre coperta:
- da **Ora inizio giorno** è presente una persona (configurabile "persone richieste prima del 2° inizio");
- da **2° risorsa inizia alle** (default 10:00) sono presenti due persone fino a **Ora fine giorno**.

## Input (pannello a sinistra)
| Impostazione | Significato |
|---|---|
| Inizio settimana | Data opzionale (lunedì) usata per intestazioni e nomi file |
| Ora inizio / fine giorno | Finestra giornaliera da coprire (risoluzione 1 ora) |
| 2° risorsa inizia alle | Ora da cui si applica la maggior copertura |
| Persone richieste prima / dopo | Testa richiesta nelle due parti della giornata (default 1 / 2) |
| Giorni lavorativi | Numero di giorni alla settimana **e** quali giorni (seleziona Lun–Dom) |
| Parametri addizionali di ottimizzazione | Regole di staffing aggiuntive per giorni/ore specifiche (es. "3 persone sab/dom", "1 persona 18:00–chiusura"); combinate con i requisiti di base prendendo il valore maggiore e applicate come vincoli dall'ottimizzatore |
| Persone | Nome, ore disponibili a settimana, durata massima/minima turno, giorno di riposo preferito |

Il giorno di riposo è una preferenza: viene rispettato salvo che sia l'unico modo per coprire una lacuna, nel qual caso il piano viene segnalato.

## Flusso di lavoro
1. Compila impostazioni e persone (o clicca **Load sample**).
2. Clicca **⚡ Optimize**. La barra di stato mostra ore richieste vs disponibili, ore scoperte / sovra-organico e eventuali avvisi, incluse le regole personalizzate non soddisfatte.
3. Controlla nelle viste **Week** o **Day**; la **tabella di pianificazione** è sempre visibile sotto. Ogni cella è modificabile (start / end / Off) e le modifiche si riflettono subito nel calendario. Cliccando una barra turno si va alla corrispondente cella della tabella.
   - **Drag & drop**: in Week trascina una barra su/giù per cambiare l'orario di inizio (la durata resta), o su un'altra colonna per spostarla — il tempo segue il punto di rilascio; se nel giorno di destinazione la persona ha già un turno i due turni si scambiano. In Day trascina a sinistra/destra per cambiare orario, o su un'altra riga per riassegnare. Trascina la barra o la maniglia ⠿ su una cella della tabella per spostare il turno a un altro giorno o persona (orario invariato).
   - **Ridimensiona**: trascina il bordo superiore/inferiore di una barra (Week) o il bordo sinistro/destro (Day) per cambiare inizio/fine direttamente.
   - **Straordinari**: se le ore assegnate superano il budget settimanale, ogni barra mostra un tag `OT: Xh` con l'eccesso.
4. **Save plan (.json)** per esportare lo stato completo; **Load plan** per reimportare.
5. **Export Excel (.csv)** genera un file compatibile Excel con la matrice piano (persona × giorno) e la tabella di copertura oraria.

Lo stato corrente è salvato in `localStorage`. Se sono configurate le opzioni cloud (Supabase) è possibile salvare bozze, pubblicare assegnazioni e notificare i destinatari.

## Colori
- verde – copertura richiesta raggiunta · rosso – sotto-organico · ambra – sovra-organico
- cella blu – giorno di riposo preferito · bordo rosso – violazione di min/max turno o finestra giorno

## Licenza
Questo progetto è rilasciato sotto la MIT License — vedi il file `LICENSE` per i dettagli. È permesso l'uso, la modifica e la distribuzione (anche commerciale) purché venga mantenuto l'avviso di copyright e il testo della licenza.
# Pianificatore di Risorse Settimanale

*[English version](README.md) · [Versión en español](README-es.md) · [Deutsche Version](README-de.md)*

Pianificatore di risorse settimanale in un unico file: apri `resource_planner.html` in un browser moderno (Edge, Chrome, Firefox). Nessuna installazione, nessuna connessione a internet necessaria.

## Cosa fa
Costruisce un piano settimanale per turni in modo che la finestra di servizio giornaliera sia sempre coperta:
- da **Ora inizio giorno** è presente una sola persona (configurabile "persone richieste prima del 2° inizio");
- da **2° risorsa inizia alle** (default 10:00) sono presenti due persone fino a **Ora fine giorno**.

## Input (pannello a sinistra)
| Impostazione | Significato |
|---|---|
| Settimana di inizio | Data opzionale di lunedì, usata per intestazioni e nomi file |
| Ora inizio / fine giorno | Finestra giornaliera da coprire (risoluzione 1 ora) |
| 2° risorsa inizia alle | Ora da cui è richiesta maggiore copertura |
| Persone richieste prima / dopo | Numero di persone richieste nelle due parti della giornata |
| Giorni lavorativi | Numero di giorni alla settimana **e** quali giorni (seleziona/disseleziona Lun–Dom) |
| Parametri di ottimizzazione aggiuntivi | Regole di personale aggiuntive per giorni/orari specifici (es. "3 persone sabato e domenica", "1 persona dalle 18:00 alla chiusura"); si combinano con i requisiti base prendendo il valore più alto e vengono applicate dall'ottimizzatore come vincoli rigidi |
| Persone | Nome, ore disponibili a settimana, durata minima/massima turno, giorno di riposo preferito |

## Flusso di lavoro
1. Compila impostazioni e persone (o clicca **Load sample**).
2. Clicca **⚡ Optimize** per ottenere lo stato e gli eventuali avvisi.
3. Controlla la vista **Week** o **Day** e la tabella sottostante; ogni cella è modificabile.
4. **Salva piano (.json)** per esportare, **Load plan** per reimportare; **Export Excel (.csv)** per aprire in Excel.

## Legenda colori
- verde – copertura richiesta raggiunta · rosso – sottoorganico · ambra – sovraorganico
- cella blu – giorno di riposo preferito · bordo rosso – violazione delle regole di turno

## Licenza
Questo progetto è rilasciato sotto la MIT License — vedi il file `LICENSE` per i dettagli. Sei libero di usare, modificare e distribuire questo codice (anche a fini commerciali), a condizione di includere l'avviso di copyright e il testo della licenza nelle copie o nelle parti sostanziali dell'opera.
