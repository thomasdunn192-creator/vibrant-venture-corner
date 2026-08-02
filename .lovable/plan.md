# PrintOps: printer editing, troubleshooting history, chat photos, accounts, dark mode

## 1. Editable printer profiles

New "Printers" screen (reachable from the printer dropdown and nav):

- Edit any built-in printer's name, short name, build volume, default nozzle diameter, max nozzle temp, max bed temp, enclosure / heated chamber, and extruder type. A "Reset to stock" action restores the original values per printer.
- Add your own printers with the same fields (custom image optional; a generic icon is used otherwise). Custom printers can be renamed and deleted.
- Edits and custom printers flow into everything already keyed off printer specs: the printer selector, filament defaults, capability warnings on the Filament page, setup checklists (custom printers get the generic 7-step checklist), and the AI chat context.

## 2. Troubleshooting history

- Every entry is auto-logged: symptom opened, AI conversation started (with the question and the assistant's reply), and filament setting changes made while troubleshooting — each with printer, filament, and timestamp.
- Each entry can be annotated with your own notes and marked **Resolved** / **Not resolved** / **Still testing**.
- New "History" section on the Troubleshooting page plus a full log view with filtering by printer and outcome, and a "Ask the AI about this again" shortcut that re-opens the conversation with prior context.
- Stored in the browser for everyone. When signed in, the log is saved to your account and merges with anything recorded as a guest, so it follows you across devices.

## 3. Photo uploads in AI chat

- Attach button + drag-and-drop + paste in the chat composer; multiple images per message, previews with remove, size/type validation (JPEG/PNG/WebP, capped per image).
- Images are sent to the AI along with your question and current printer/filament settings, so it can diagnose from the photo.
- For signed-in users, photos are stored privately and attached to the matching troubleshooting history entry so they can be referenced later. Guests' photos are used for the answer only and not stored.

## 4. Accounts stay optional

- The whole app keeps working with no account: no gates, no sign-in prompts on Home, Filament, Setup, or Troubleshooting.
- Signing in adds cross-device sync for troubleshooting history, chat photos, and printer profile edits, surfaced as a gentle "Sign in to save your history" hint (dismissible) rather than a blocker.
- The account menu keeps sign-in/sign-out and shows the admin link only for admins.

## 5. Admin rights

thomas.dunn192@gmail.com (already registered) is granted the `admin` role, so `/admin` usage metrics unlock for that account.

## 6. Dark / light mode toggle

- Sun/moon toggle in the header cycling Light → Dark → System, remembered per browser and applied before first paint so there's no flash.
- The existing dark token set in `src/styles.css` is reviewed for contrast on all pages; light mode becomes a first-class variant of the amber/steel industrial theme.

## Technical notes

- Printer overrides/custom printers live in the existing `printops-v1` local settings plus a new `printer_profiles` cloud table (owner-scoped RLS) synced on sign-in. `PRINTERS` becomes a stock list merged with overrides through a resolver in `src/lib/printers.ts`; `PrinterId` widens to `string` so custom ids work.
- History: `troubleshooting_log` table (user-scoped RLS, GRANTs for authenticated + service_role) and a local mirror in `src/lib/history.ts`; writes go through server functions using `requireSupabaseAuth`.
- Photos: private storage bucket with per-user path RLS; the chat server fn accepts base64/signed-URL image parts and passes them as `image_url` content blocks to the Gemini model via the AI gateway. Existing `chatWithAssistant` input schema is extended with an `images` array.
- Admin grant is a one-row insert into `public.user_roles` for the existing user id.
- Theme: small `ThemeProvider` in `src/components/theme-provider.tsx` toggling the `dark` class on `<html>` with a blocking inline script in `__root.tsx`; no new dependency.
- Analytics gains events for printer profile edited, history entry annotated/resolved, and photo attached.
