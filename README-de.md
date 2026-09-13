# Wöchentlicher Ressourcenplaner

Ein einzelnes, statisches HTML-Tool: `resource_planner.html` in einem modernen Browser (Edge, Chrome, Firefox) öffnen. Keine Installation, funktioniert offline.

## Was es macht
Erstellt einen Schichtplan für eine Woche, sodass das tägliche Servicefenster immer besetzt ist:
- ab **Tag Beginn** ist eine Person anwesend (konfigurierbar: "Personen vor 2. Start"),
- ab **2. Ressource beginnt um** (Standard 10:00) sind zwei Personen bis **Tag Ende** anwesend.

## Eingaben (linkes Panel)
| Einstellung | Bedeutung |
|---|---|
| Woche beginnt | Optionales Montag-Datum, verwendet für Spaltenüberschriften und Dateinamen |
| Tag Beginn / Ende | Das täglich abzudeckende Zeitfenster (Stundenschritt) |
| 2. Ressource beginnt um | Stunde, ab der höhere Personalbedarf gilt |
| Personen erforderlich vorher / nachher | Benötigte Personalstärke in den beiden Tagesabschnitten (Standard 1 / 2) |
| Arbeitstage | Anzahl der Tage pro Woche **und** welche Tage (Mon–Sun auswählbar) |
| Zusätzliche Optimierungsparameter | Zusätzliche Personalregeln für bestimmte Tage/Stunden (z. B. "3 Personen Sa/So", "1 Person 18:00–Schluss"); werden mit den Basisanforderungen kombiniert (höherer Wert) und als harte Nebenbedingungen berücksichtigt |
| Personen | Name, verfügbare Stunden pro Woche, max./min. Schichtlänge, bevorzugter Ruhetag |

Der Ruhetag ist eine Präferenz: er wird eingehalten, außer es ist die einzige Möglichkeit, eine Abdeckungslücke zu schließen — dann wird der Plan entsprechend markiert.

## Ablauf
1. Einstellungen und Personen ausfüllen (oder **Load sample** klicken).
2. **⚡ Optimize** klicken. Die Statusleiste zeigt benötigte vs. verfügbare Stunden, nicht abgedeckte / überbesetzte Stunden und Warnungen — einschließlich nicht erfüllbarer benutzerdefinierter Regeln.
3. In der **Week**- oder **Day**-Ansicht prüfen; die **Planungstabelle** ist immer darunter sichtbar. Jede Tabellenzelle ist editierbar (Start / Ende / Off) und Änderungen erscheinen sofort im Kalender. Ein Klick auf eine Schicht springt zur entsprechenden Tabellenzelle.
   - **Drag & drop**: In der Wochenansicht eine Schicht nach oben/unten ziehen, um die Startzeit zu ändern (Dauer bleibt), oder in eine andere Tagesspalte ziehen, um sie zu verschieben — die Zeit folgt dem Drop-Punkt; falls die Person im Zieltag bereits arbeitet, werden die Schichten getauscht. In der Tagesansicht links/rechts ziehen, um die Zeit zu ändern, oder auf eine andere Zeile ziehen, um neu zuzuweisen.
   - **Größenänderung**: Den oberen/unteren Rand einer Schicht (Wochenansicht) oder den linken/rechten Rand (Tagesansicht) ziehen, um Start/Ende anzupassen.
   - **Überstunden**: Überschreitet eine Person ihr Wochenbudget, zeigt jede ihrer Schichten ein `OT: Xh`-Label mit dem Überschuss.
4. **Save plan (.json)** speichert den gesamten Zustand; **Load plan** lädt ihn wieder.
5. **Export Excel (.csv)** erzeugt eine Excel-kompatible Datei mit der Personen×Tage-Matrix und der stündlichen Abdeckungstabelle.

Der Zustand wird im Browser-`localStorage` gehalten. Mit Supabase konfiguriert, können Planner sich anmelden, Entwürfe speichern, Zuweisungen veröffentlichen und Empfänger per Gmail benachrichtigen.

## Farbenlegende
- grün – erforderliche Personalstärke erfüllt · rot – unterbesetzt · bernstein – überbesetzt
- blaue Tabellenzelle – bevorzugter Ruhetag · roter Rahmen – Verstoß gegen min/max Schicht oder Tagesfenster

## Lizenz
Dieses Projekt steht unter der MIT License — siehe `LICENSE` für Details. Nutzung, Modifikation und Verbreitung (auch kommerziell) sind erlaubt, solange der Copyright-Hinweis und der Lizenztext beigefügt sind.
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
