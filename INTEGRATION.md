# Backend integration

The web app is no longer front-end only. Every screen reads and writes the live
Aqademiq API; there is no mock data left in `src/data/` (those files now hold
only view-model types and styling tables).

---

## 1. What it talks to

| Concern | Host |
|---|---|
| Identity — sign-up/in, Google, guest | Supabase Auth, `<SUPABASE_URL>/auth/v1` |
| All row data | Supabase Edge Function `api`, `<SUPABASE_URL>/functions/v1/api/v1` |
| File bytes | Supabase Storage signed URLs (returned by the API) |

One project serves all three. Configure it with:

```bash
cp .env.example .env.local
```

```
VITE_SUPABASE_URL=https://qwvuoooentacjslzpbqy.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_…
# optional — defaults to <VITE_SUPABASE_URL>/functions/v1/api/v1
VITE_API_BASE_URL=
```

Without these the app still boots but every call fails with a clear
"not configured" error rather than a stack trace.

Health check: `curl https://<ref>.supabase.co/functions/v1/api/v1/healthz`.

---

## 2. Layers

```
src/lib/env.ts          reads import.meta.env once
src/lib/supabase.ts     the single Supabase Auth client
src/lib/api/http.ts     fetch wrapper — bearer token, 401 refresh-and-retry, ApiError
src/lib/api/types.ts    every wire DTO (snake_case, verified against the live API)
src/lib/api/index.ts    one function per endpoint
src/lib/format.ts       date/time/label helpers
src/lib/mappers.ts      DTO → the view shapes the JSX was drawn against
src/lib/queryClient.ts  TanStack Query cache + query keys + invalidatePlan()
src/hooks/useAuth.tsx   session, guest mode, sign-up/in/out, guest upgrade
src/hooks/data/*        one hook module per domain — what screens import
```

Screens import from `src/hooks/data` and `src/components/core/Async`, never from
`fetch` or `supabase` directly.

### Wire conventions that bite

- **snake_case in both directions.** There is no case transform anywhere.
- **Unknown body fields are rejected**, so request builders send only documented
  keys — `stripUndefined()` drops `undefined` rather than serialising `null`.
- **`scheduled_at` is a naive local wall-clock ISO string** (`2026-07-27T11:30:00`),
  stored and echoed verbatim. Never round-trip it through `new Date()` — use
  `formatClock` / `toHhMm` / `toScheduledAt`, which read and write the characters.
- **Date-only fields** are `yyyy-MM-dd` at UTC midnight. `toIsoDate` builds them
  from local calendar parts so the displayed day never shifts.
- **Occurrence ids take two forms**: `<series-uuid>@<yyyy-MM-dd>` for a
  recurrence the server has not materialised, and a bare uuid once it has.
  Both are valid targets; always `encodeURIComponent` them (`@` in a path).
- **Errors share one shape** — `{status_code, error, message, errors?, path,
  timestamp}` — where `message` may be a string *or* an array of validation
  strings. `ApiError` normalises both, plus the rate limiter's camelCase variant.

---

## 3. Auth

Auth was replatformed onto **Supabase Auth** (2026-07-18); the backend's own
`/v1/auth/*` routes no longer exist. The API verifies the Supabase ES256 access
token against the project JWKS.

- **Guest** = Supabase *anonymous* sign-in. A guest owns a real `auth.users` row,
  so their tasks, subjects, focus sessions and streaks are real server data.
- **Upgrading a guest** attaches an email to that same user id, so nothing is
  lost. `/signup` detects a guest session and calls `linkGuestAccount` instead of
  `signUp`; `App.tsx`'s `AllowGuestUpgrade` guard is what lets a guest reach that
  route at all.
  Order matters: Supabase refuses to set a password on an anonymous user with no
  email, so the flow is `updateUser({email})` → verify the 6-digit code →
  `updateUser({password})`. The chosen password is held in memory in
  `useAuth.tsx` for the length of the upgrade — never in storage or router state.
- **The code is 6 digits** (`OTP_LENGTH`), not the 5 the frames drew.
- On a **401** the http layer refreshes the session once and retries; a second
  401 propagates so the caller can route to sign-in.

### Guest limits

Guests get the full planner. They are locked out of Ada and the Profile stats
(as the frames draw), and the server 403s them on every feedback-board write
(`Create an account to …`) — `useBoardCanParticipate()` routes them to `/signup`
before the request is made.

---

## 4. Notable behaviours

- **The focus timer ticks client-side.** There is no server tick. `POST
  /focus-sessions` creates the row, `PATCH` checkpoints on pause/resume/blur (not
  per second), and `POST …/complete` finalises — which also marks a linked task
  done and feeds the streak.
- **Ada never writes to your calendar on her own.** A reply may carry a `plan`;
  the tasks are only created when the user confirms and the client calls
  `…/apply-plan`, which validates every field server-side and rejects invalid
  plans wholesale with a per-task `errors[]`. An assistant message can have empty
  `text` but a non-null `plan` — the plan card renders alone in that case.
- **Onboarding is one atomic, idempotent call.** `POST /onboarding/complete`
  requires `consent_given` and `age` (the written contract lists them optional —
  the router is the truth).
- **Study tags delete by label text**, not id, case-insensitively.
- **Feedback posts are addressed by their numeric `ref`**, not a slug or uuid.
- **Theme is server-owned** (`settings.theme_mode`) so it follows the user across
  devices; accent and warmth have no server field and stay in `localStorage`.

---

## 5. Not available from this backend

These controls are wired as far as they can be and carry a `// no endpoint:`
comment explaining why:

| Feature | Why |
|---|---|
| GPA per semester | not tracked server-side |
| Weekly focus minutes | `/me/stats.focus_minutes` is lifetime; no weekly bucket |
| Avatar photo upload | the profile uses a preset `avatar_index` (0–7) |
| Per-step task completion | steps are read-only server-side |
| Mark notification read | no route exists |
| Global search | no search endpoint |
| Web push registration | device tokens are mobile-only |
| Whole-series task edit | only per-occurrence overrides exist |

Endpoints that exist but answer `501` until their provider is configured:
file upload/download (`GCS_USER_BUCKET` / Supabase Storage bucket), Prism audio
streams (null `url`), and `POST /ada/plan-week` (needs an AI provider). Each is
surfaced as a calm "not set up yet" state rather than an error.

---

## 6. Verifying

```bash
npm run dev
```

The guest path exercises most of the surface without an inbox: **Jump right in!**
→ add a subject → add a task → toggle it → run a focus session → check the week
and month views → settings panels. Every one of those is a real round-trip; watch
the network tab for `…/functions/v1/api/v1/…`.

Completing an email sign-up needs a real inbox for the 6-digit code.
