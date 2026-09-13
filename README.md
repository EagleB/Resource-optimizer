# Weekly Resource Planner

*[Versione italiana](README-it.md) · [Versión en español](README-es.md) · [Deutsche Version](README-de.md)*

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
| Additional optimization parameters | Extra required-staffing rules for specific days/hours (e.g. "3 people on Sat/Sun", "1 person 18:00–close"); combined with the base requirements above by taking the higher value, and enforced by the optimizer as hard constraints |
| People | Name, hours available per week, max & min shift length, preferred rest day |

Rest day is a preference: it is honoured unless it is the only way to close a coverage gap, in which case the plan is marked with a note.

## Workflow
1. Fill in settings and people (or click **Load sample**).
2. Click **⚡ Optimize**. The status bar shows required vs. available hours, uncovered / over-staffed hours and any warnings — including any custom rule that could not be satisfied.
3. Review in the **Week** or **Day** calendar; the **planning table** is always shown underneath. Every table cell is editable (start / end / Off) and changes appear immediately in the calendar. Clicking a shift bar in the calendar jumps to its cell in the table.
   - **Drag & drop**: in the Week view drag a shift bar up/down to change its start time (duration is kept) or onto another day column to move it — the time follows where you drop it; dropping on a day where that person already works swaps the two shifts. In the Day view drag left/right to change the time, or onto another person's row to reassign it. Drag a bar or the ⠿ grip of a table cell onto any table cell to move the shift to another day *or* another person (time unchanged). Shifts are always kept inside the day window.
   - **Resize**: drag the top/bottom edge of a bar (Week view) or its left/right edge (Day view) to change the shift's start or end directly in the calendar.
   - **Overtime**: when a person's planned hours exceed their weekly budget, every bar of that person shows an `OT: Xh` tile with the excess.
4. **Save plan (.json)** to keep the whole plan (settings, people, shifts); **Load plan** re-imports it later.
5. **Export Excel (.csv)** writes a file that opens directly in Excel: the schedule matrix (person × day, with hour totals) followed by the hourly coverage table.

Use the **User** selector in the header to show one person's shifts in both calendar views and in the planning table. Choose **All users** to restore the full plan. **Export calendar (.pdf)** opens the browser's print dialog with the current Week or Day calendar, its person-color legend, and the planning table, including the active user filter; select **Save as PDF** as the destination.

The current state is also kept in the browser's local storage, so closing the tab does not lose work. When Supabase is configured, planners can sign in, save drafts, publish assignments, and notify recipients from their own Gmail account.

## Cloud setup

The planner remains a static application. Cloud features require serving it over HTTP(S); direct `file://` use continues to work in offline-only mode.

### 1. Supabase

1. Create a dedicated Supabase project.
2. Apply `supabase/migrations/20260913000000_planner_cloud.sql`.
3. Enable Google in **Authentication → Providers**. In Google Cloud, create an OAuth web client for application login and add Supabase's displayed callback URL.
4. Add the local URL and GitHub Pages URL under **Authentication → URL Configuration**. Example local URL: `http://localhost:8000/resource_planner.html`.
5. Deploy both Edge Functions with JWT gateway verification disabled; each function validates the user session itself:

   ```sh
   supabase functions deploy gmail-oauth --no-verify-jwt
   supabase functions deploy publish-week --no-verify-jwt
   ```

6. Copy the project URL and active `sb_publishable_...` key into `config.js`. Never place a secret/service-role key there.

### 2. Per-planner Gmail sending

Create a second Google OAuth web client for Gmail authorization, enable the Gmail API, and add this exact authorized redirect URI:

```text
https://PROJECT_REF.supabase.co/functions/v1/gmail-oauth
```

Set these Edge Function secrets:

```text
GOOGLE_GMAIL_CLIENT_ID=...
GOOGLE_GMAIL_CLIENT_SECRET=...
TOKEN_ENCRYPTION_KEY=...
APP_ORIGINS=http://localhost:8000,https://YOUR_GITHUB_USER.github.io
```

`TOKEN_ENCRYPTION_KEY` must be a base64-encoded random 32-byte value. Generate it locally with `openssl rand -base64 32`. `APP_ORIGINS` is a comma-separated origin allowlist without paths.

The Gmail OAuth consent requests only `openid`, `email`, and `gmail.send`. While the Google OAuth app is in Testing mode, add every planner who will connect Gmail as a test user. Google may expire refresh tokens for external apps in Testing mode; move the consent screen to Production and complete any verification Google requires before relying on long-lived connections.

### 3. GitHub Pages

Publish the repository root with GitHub Pages, update `APP_ORIGINS`, Supabase redirect URLs, and `config.js`, then redeploy the functions if their code changed. Both planner and recipient links use the same `resource_planner.html` page.

## Cloud permissions and workflow

- Any Google-authenticated user can create planner-owned weeks. Owners cannot access another planner's weeks.
- **Save draft** stores the editable planner state without notifying anyone.
- **Publish & notify** requires a valid, unique email for every person, replaces the latest published assignments, and sends up to 50 individual Gmail messages.
- Recipients can sign in after receiving the email. Database policies return only the published assignment matching their verified Google email.
- Recipients cannot view drafts, coworkers, full published planner payloads, or mutation controls.
- **Retry failed** sends only rows whose most recent notification failed.
- Disconnecting Gmail deletes the encrypted refresh token. Deleting a week also deletes its published assignments.

After deployment, run Supabase's security and performance advisors and review every finding before production use.

## Colour legend
- green – required headcount met · red – under-staffed · amber – over-staffed
- blue table cell – preferred rest day · red outline – shift violates that person's min/max shift or the day window

## License

This project is licensed under the MIT License — see the `LICENSE` file for details. You are free to use, modify, and distribute this code (including commercially), provided that you include the copyright notice and license text in any copies or substantial portions of the work.
