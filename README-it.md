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
