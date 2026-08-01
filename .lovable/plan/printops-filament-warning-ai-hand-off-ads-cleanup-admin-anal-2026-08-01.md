# PrintOps: filament warning, AI hand-off, ads cleanup, admin analytics

## 1. Filament capability note

On the Filament page, add a callout above the settings card that warns against using filaments beyond the selected printer's limits. It compares the selected material's recommended nozzle/bed temps against the printer's max nozzle/bed temp and whether it has an enclosure or heated chamber:

- General note (always shown): "Avoid filaments that exceed your printer's rated limits — hotter materials can damage the hotend, bed, or wiring, and warp-prone materials need an enclosure."
- Escalated warning (shown when the material exceeds this printer): names the specific mismatch, e.g. nozzle temp above the printer's max, bed temp above the printer's max, or ABS/ASA/Nylon on an open-frame printer.

Also show a soft warning inline when the user manually edits nozzle or bed temp above the printer's rating.

## 2. "Ask the AI about this" sends automatically

Today the button only prefills the chat input. Change it so pressing it:
1. Scrolls to (mobile: jumps to) the AI chat panel.
2. Immediately submits the message and shows the "Thinking…" state — no extra click.

## 3. Remove the ads toggle

Delete the "Show ads" switch from the settings menu. The ad banner stays and is always visible. The `adsEnabled` setting and its setter are removed. (If the settings menu then has no items, the gear button is removed too.)

## 4. Admin-only usage analytics

### Sign-in and roles
- Add an `/auth` page with email + password sign-up/sign-in, plus Google sign-in.
- Add a `user_roles` table with an `app_role` enum and a `has_role` check function (roles are never stored on a profile table).
- Your account gets the `admin` role granted directly in the database after you sign up.
- Header shows a sign-in link when signed out, and an account menu with "Admin" (admins only) and "Sign out" when signed in.

### Event tracking
- A single `usage_events` table records: event name, page path, printer id, filament type, an optional small JSON detail blob, an anonymous visitor id (stored in the browser), the signed-in user id when present, and the timestamp.
- Events are written through a server function so anonymous visitors can be counted without opening the table to public reads.
- Tracked events: page view (every route), printer selected, filament type selected, filament setting edited, profile reset, setup step toggled, troubleshooting topic opened, "Ask the AI" pressed, chat message sent.

### Admin dashboard (`/admin`, admin-only)
- Date-range selector (last 24h / 7d / 30d / all).
- Totals: events, unique visitors, signed-in users.
- Charts/tables: events per day, page views by page, most-selected printers, most-used filament types, most-opened troubleshooting topics, chat messages sent, and a most-recent-events list.
- Non-admin visitors who reach `/admin` see a "not authorized" message.

## Technical notes

- New route files: `src/routes/auth.tsx` (public), `src/routes/_authenticated/route.tsx` (managed gate), `src/routes/_authenticated/admin.tsx`.
- Tracking: `src/lib/analytics.functions.ts` (`trackEvent` public server fn + `getUsageMetrics` server fn gated on `has_role(auth.uid(),'admin')`), plus a `useTrackEvent` hook and a route-change page-view effect in `AppShell`.
- RLS: `usage_events` has no anon/authenticated read policy; inserts go through the server function; admin reads use an admin-only SELECT policy via `has_role`. `user_roles` is readable by authenticated users and used by `has_role` (security definer). GRANTs included in the migration.
- Aggregation happens in SQL functions (`security definer`, admin-checked) so the dashboard doesn't pull raw rows to the browser.
- Filament warnings are derived in `src/lib/filaments.ts` from existing `maxNozzleTemp` / `maxBedTemp` / `hasEnclosure` / `hasHeatedChamber` fields — no schema or data changes.
- Chat auto-send is a state change in `troubleshooting.tsx` (pending-message effect in `ChatPanel` + ref scroll), no backend change.
- Google sign-in requires enabling the Google provider in the same change.
