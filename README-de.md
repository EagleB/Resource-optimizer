# Wochen-Ressourcenplaner

*[English version](README.md) · [Versione italiana](README-it.md) · [Versión en español](README-es.md)*

Ein Planungswerkzeug in einer einzigen Datei, offline nutzbar: `resource_planner.html` in einem beliebigen modernen Browser öffnen (Edge, Chrome, Firefox). Keine Installation, keine Internetverbindung nötig.

## Was es tut
Erstellt einen Wochenschichtplan, sodass das tägliche Servicefenster immer besetzt ist:
- ab **Tagesbeginn** ist eine Person anwesend (konfigurierbar über "Personen erforderlich vor 2. Start");
- ab **2. Ressource beginnt um** (Standard 10:00 Uhr) sind bis zum **Tagesende** zwei Personen anwesend.

## Eingaben (linkes Feld)
| Einstellung | Bedeutung |
|---|---|
| Woche beginnt am | Optionales Montagsdatum, wird für Spaltenüberschriften und Dateinamen verwendet |
| Tagesbeginn / Tagesende | Das abzudeckende Tagesfenster (Auflösung 1 Stunde) |
| 2. Ressource beginnt um | Uhrzeit, ab der die höhere Personalstärke gilt |
| Personen erforderlich davor / danach | Erforderliche Personalstärke in den beiden Tagesabschnitten (Standard 1 / 2) |
| Arbeitstage | Anzahl der Arbeitstage pro Woche **und** welche Tage (Mo–So an-/abwählen) |
| Zusätzliche Optimierungsparameter | Zusätzliche Personalregeln für bestimmte Tage/Stunden (z. B. "3 Personen am Sa/So", "1 Person von 18:00 bis Schließung"); werden mit den obigen Basisanforderungen kombiniert, indem der höhere Wert gilt, und vom Optimierer als harte Nebenbedingungen durchgesetzt |
| Personen | Name, verfügbare Wochenstunden, maximale & minimale Schichtlänge, bevorzugter Ruhetag |

Der Ruhetag ist eine Präferenz: Er wird berücksichtigt, sofern dies nicht die einzige Möglichkeit ist, eine Deckungslücke zu schließen — in diesem Fall wird der Plan entsprechend markiert.

## Arbeitsablauf
1. Einstellungen und Personen ausfüllen (oder auf **Load sample** klicken).
2. Auf **⚡ Optimize** klicken. Die Statusleiste zeigt benötigte gegenüber verfügbaren Stunden, nicht abgedeckte / überbesetzte Stunden sowie alle Hinweise — einschließlich jeder benutzerdefinierten Regel, die nicht erfüllt werden konnte.
3. In der **Week**- oder **Day**-Ansicht prüfen; die Planungstabelle wird darunter immer angezeigt. Jede Tabellenzelle ist bearbeitbar (Start / Ende / Off), Änderungen erscheinen sofort im Kalender darüber. Ein Klick auf einen Schichtbalken im Kalender springt zur zugehörigen Zelle in der Tabelle.
4. **Save plan (.json)** speichert den gesamten Plan (Einstellungen, Personen, Schichten); **Load plan** importiert ihn später wieder.
5. **Export Excel (.csv)** erzeugt eine Datei, die sich direkt in Excel öffnen lässt: die Planmatrix (Person × Tag, mit Stundensummen), gefolgt von der stündlichen Abdeckungstabelle.

Der aktuelle Stand wird zudem im lokalen Speicher des Browsers gehalten, sodass beim Schließen des Tabs keine Arbeit verloren geht.

## Farblegende
- grün – erforderliche Personalstärke erreicht · rot – unterbesetzt · gelb/orange – überbesetzt
- blaue Tabellenzelle – bevorzugter Ruhetag · roter Rahmen – Schicht verstößt gegen die minimale/maximale Schichtlänge dieser Person oder das Tagesfenster

## Lizenz
Dieses Projekt steht unter der MIT-Lizenz — Details siehe Datei `LICENSE`. Es steht Ihnen frei, diesen Code zu verwenden, zu verändern und weiterzugeben (auch kommerziell), sofern der Urheberrechtshinweis und der Lizenztext in allen Kopien oder wesentlichen Teilen des Werks enthalten sind.
