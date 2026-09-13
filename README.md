# Weekly Resource Planner

A single-file, offline planning tool: open `resource_planner.html` in any modern browser (Edge, Chrome, Firefox). Nothing to install, no internet needed.

## What it does
Builds a one-week shift plan so that the daily service window is always staffed:
- from **Day start time** one person is present (configurable "people required before 2nd start");
- from **2nd resource starts at** (default 10:00) two people are present until **Day end time**.

## Inputs (left panel)
| Setting | Meaning |
|---|---|
| Week starting | Optional Monday date, used for column headers and file names |
| Day start / end time | The daily window to cover (1-hour granularity) |
| 2nd resource starts at | Hour from which the higher headcount applies |
| People required before / after | Headcount required in the two parts of the day (default 1 / 2) |
| Working days | Number of days per week **and** which days (tick/untick Mon–Sun) |
| People | Name, hours available per week, max & min shift length, preferred rest day |

Rest day is a preference: it is honoured unless it is the only way to close a coverage gap, in which case the plan is marked with a note.

## Workflow
1. Fill in settings and people (or click **Load sample**).
2. Click **⚡ Optimize**. The status bar shows required vs. available hours, uncovered / over-staffed hours and any warnings.
3. Review in the **Week** or **Day** calendar; the **planning table** is always shown underneath. Every table cell is editable (start / end / Off) and changes appear immediately in the calendar. Clicking a shift bar in the calendar jumps to its cell in the table.
   - **Drag & drop**: in the Week view drag a shift bar up/down to change its start time (duration is kept) or onto another day column to move it — the time follows where you drop it; dropping on a day where that person already works swaps the two shifts. In the Day view drag left/right to change the time, or onto another person's row to reassign it. Drag a bar or the ⠿ grip of a table cell onto any table cell to move the shift to another day *or* another person (time unchanged). Shifts are always kept inside the day window.
   - **Resize**: drag the top/bottom edge of a bar (Week view) or its left/right edge (Day view) to change the shift's start or end directly in the calendar.
   - **Overtime**: when a person's planned hours exceed their weekly budget, every bar of that person shows an `OT: Xh` tile with the excess.
4. **Save plan (.json)** to keep the whole plan (settings, people, shifts); **Load plan** re-imports it later.
5. **Export Excel (.csv)** writes a file that opens directly in Excel: the schedule matrix (person × day, with hour totals) followed by the hourly coverage table.

The current state is also kept in the browser's local storage, so closing the tab does not lose work.

## Colour legend
- green – required headcount met · red – under-staffed · amber – over-staffed
- blue table cell – preferred rest day · red outline – shift violates that person's min/max shift or the day window

## License

This project is licensed under the MIT License — see the `LICENSE` file for details. You are free to use, modify, and distribute this code (including commercially), provided that you include the copyright notice and license text in any copies or substantial portions of the work.
