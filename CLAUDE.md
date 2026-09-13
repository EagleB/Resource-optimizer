# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-file weekly shift/resource planner. The entire application (state, optimizer, rendering,
drag-and-drop, i18n, Supabase cloud sync) lives in `resource_planner.html` as one inline `<script>` —
there is no build step, bundler, or framework. It runs by opening the file directly in a browser
(`file://`, fully offline) or by serving it over HTTP(S) for the optional cloud features.

`config.js` holds public Supabase config (`window.RESOURCE_PLANNER_CONFIG = { supabaseUrl, supabasePublishableKey }`)
and is loaded via `<script src="config.js">` before the app script. It is safe to leave blank — the app
detects a missing config (`cloudReady()`) and runs in offline-only mode.

## Response style

Caveman mode: keep chat output terse. Short fragments over full sentences, no filler words
("I will now...", "Let's...", "Great, ..."), no restating what was just asked, no trailing summary
unless the change is non-trivial. Skip pleasantries and hedging. Expand only when the task genuinely
needs explanation (a design tradeoff, a non-obvious bug cause) — default to minimum words.

## Commands

There is no npm/build/lint toolchain. The only automated checks are Python tests against the static files:

```sh
python3 -m unittest discover -s tests -v      # run all tests
python3 -m unittest tests.test_static_contract -v   # same, explicit module
python3 -m unittest tests.test_static_contract.StaticContractTests.test_rls_and_grants -v  # single test
```

`tests/test_static_contract.py` does **not** execute the app; it greps/parses `resource_planner.html`
and the SQL migration as text to assert specific IDs, function bodies, and RLS/grant statements are
present. When editing `resource_planner.html` or the migration, keep the literal strings these tests
check for (element ids like `btnSignIn`/`cloudWeeks`/`btnPublish`, function signatures like
`function saveJSON()`, specific SQL clauses) or update the test alongside the change.

To manually exercise the app: serve the directory (e.g. `python3 -m http.server 8000`) and open
`http://localhost:8000/resource_planner.html`, or just open the file directly for offline mode.

Supabase Edge Functions (`supabase/functions/*`) are Deno/TypeScript; there's no local test harness for
them — validate via `supabase functions deploy <name> --no-verify-jwt` against a real project, per the
setup steps in README.md.

## Architecture

### Front end (`resource_planner.html`)

Everything is one IIFE. Key pieces, in the order they appear in the file:

- **i18n**: a `LOCALES` map (`en`/`it`) and `t(key)`/`setLang()`. Adding UI text means adding a key to
  both locale objects and wiring it into `setLang()`'s DOM update list (or the relevant `*HTML()`
  render function via `t()`).
- **State model**: a single `state` object — `{version, settings, people, schedule}` — is the source of
  truth. `schedule` is keyed `schedule[personId][day] = {start, end}` (hours, integers). `normalize(st)`
  is the sanitizer/migration point run on every load (localStorage restore, JSON import, cloud draft
  load) — new fields must be defaulted there. `persist()`/`restore()` mirror `state` to `localStorage`
  under `LS_KEY`; there is no server-authoritative state for offline use.
- **Optimizer** (`optimize()` and helpers `construct()`/`repair()`/`objective()`/`analyze()`): a
  randomized multi-restart greedy construction + local-search repair heuristic (not an exact solver), run
  for up to 60 iterations or ~4 seconds, keeping the lowest-`objective()` schedule. `objective()` is a
  weighted penalty sum (hard constraint violations ×100000, uncovered hours ×1000, overstaffed ×10,
  unused budget, rest-day violations ×5) — tune weights here to change optimizer priorities.
  `analyze(sched)` is the separate human-facing report (warnings list, per-day gaps) shown in the status
  card; it mirrors but does not share code with `objective()`.
- **Rendering**: `render()` fans out to `renderStatus()`, `weekHTML()`/`dayHTML()` (calendar views), and
  `tableHTML()` (the always-visible editable grid). All three read `state` fresh and rebuild
  `innerHTML` — there is no virtual DOM or incremental diffing. Editing UI state (e.g. `ui.view`,
  `ui.day`) always goes through a full `render()`.
- **Interaction**: a single `bind()` sets up all delegated event listeners on `main` for table
  edits, pointer-based resize (drag a shift's edge), and native HTML5 drag-and-drop (drag a shift bar
  or a table row's ⠿ grip to move it to another day/person). Drops are computed from pixel offsets back
  into hour slots (`RH`=30px/hour in week view). Any change to shift data funnels through `moveShift()`
  or direct `state.schedule[...]` mutation followed by `persist();render()`.
- **Import/export**: `saveJSON()`/`loadJSON()` round-trip the whole `state` as `.json`; `exportCSV()`
  builds an Excel-compatible `.csv` (schedule matrix + hourly coverage table).
- **Cloud sync** (`initCloud()` and the functions below it): optional, gated by `cloudReady()`
  (requires `config.js` values + the Supabase JS UMD script, loaded via CDN in `<head>`). Handles Google
  OAuth sign-in, listing/loading/saving a planner's weeks (`weeks` table), publishing
  (`publish-week` Edge Function) and Gmail connect/disconnect (`gmail-oauth` Edge Function). A page
  loaded with `?assignment=<week_id>` switches into read-only "recipient" mode
  (`renderRecipientAssignment()`), hiding all planner controls and showing only that signed-in
  recipient's published shifts for the week.

### Backend (Supabase)

- `supabase/migrations/20260913000000_planner_cloud.sql` defines the whole cloud schema in one file:
  `public.weeks` (planner-owned draft/published payloads as `jsonb`) and `public.week_assignments`
  (one row per published recipient per week), both RLS-protected — owners get full access to their own
  rows, recipients get `select` only on rows matching their verified JWT email
  (`recipient_email = lower(auth.jwt()->>'email')`). A private schema (`private`, revoked from all
  client roles) holds `gmail_connections` (encrypted refresh tokens) and short-lived
  `gmail_oauth_states`; access to that schema is only via `security definer` `service_*` functions
  granted to `service_role`, called exclusively from Edge Functions with the secret key — never exposed
  to `anon`/`authenticated`.
- `supabase/functions/_shared/common.ts` centralizes CORS, the `user`/`admin` Supabase client pair
  (publishable key + user JWT vs. secret/service-role key), `requireUser()` session verification,
  `allowedAppUrl()` origin allowlisting (`APP_ORIGINS` env var), and AES-GCM token
  encryption/decryption (`TOKEN_ENCRYPTION_KEY` env var, base64 32-byte key).
- `supabase/functions/gmail-oauth/index.ts`: GET handles the Google OAuth redirect callback (consumes a
  one-time state row, exchanges the code, encrypts and stores the refresh token); POST handles
  `status`/`disconnect`/`start` actions from the app.
- `supabase/functions/publish-week/index.ts`: validates the draft snapshot (unique, valid recipient
  emails, ≤50 people), calls `publish_week_snapshot` (an RPC using the *user's* client, so RLS still
  applies) to atomically copy the draft into `published_payload` and rebuild `week_assignments`, then
  sends one Gmail API message per recipient using the planner's stored refresh token, recording
  per-row `notification_status`. `retry_only` re-sends only rows currently `failed`.
- Both functions are deployed with `verify_jwt = false` (see `supabase/config.toml`) because they
  validate the caller's session themselves via `requireUser()` — this is intentional, not an oversight.

### Security-relevant invariants (also enforced by tests)

- Recipients must never get write access or see other people's data — read-only, own-email-only,
  published-only.
- No secret/service-role key ever goes in `config.js` or client-reachable code; only the `sb_publishable_...`
  key does.
- Anything touching `private.gmail_connections` goes through a `security definer` function explicitly
  granted to `service_role` only.
