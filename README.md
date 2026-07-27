# Aqademiq Web

The Aqademiq study-planner web app, built from a design handoff package of 65
frames and wired to the live backend.

**React 18 · Vite · TypeScript · Tailwind CSS · React Router v6 · TanStack Query
· Supabase Auth**

Every screen reads and writes the live API — Supabase Auth for identity (with
anonymous sign-in for guest mode) and the Supabase Edge Function `api` for data.
See [`INTEGRATION.md`](INTEGRATION.md) for the wire contract, the layer map and
what the backend does not yet provide.

```bash
npm install
cp .env.example .env.local   # fill in VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
npm run dev                  # http://localhost:5173
npm run build
npm run preview
```

> On PowerShell, chain with `;` rather than `&&`:
> `cd aqademiq-web; npm run dev`

---

## What's in here

Twelve sections, 65 screens — the planner, the melting focus timer, Ada's chat,
subjects, feedback board, settings, guest mode and a full dark theme.

| Route | Screen |
|---|---|
| `/` `/welcome` `/signup` `/verify` | Splash, welcome, sign-up, email code |
| `/setup` | 11-step onboarding |
| `/plan` `?view=timeline\|week\|month` | Dashboard, day timeline, week agenda, month |
| `/plan/task/:id` | Task broken into microtasks |
| `/subjects` `/subjects/:id` `/subjects/semesters` | Master-detail subjects |
| `/focus` | Focus timer — setup, running, frozen, done |
| `/ada` `/ada/:chatId` | Ada chat and history |
| `/profile` | Streaks, mood, invite hero |
| `/feedback` `?view=board` `/feedback/:id` | Suggestions list, board, detail |
| `/settings` `/tags` `/notifications` `/prism` `/account` | Five settings panels |

Modals, sheets and popovers are local UI state, not routes.

`/dev/components` is a gallery of every component variant and state. It's
mounted behind `import.meta.env.DEV`, so it never reaches a production build.

---

## Design system

Everything is driven by CSS custom properties in `src/styles/tokens.css` —
one token set produces both themes plus three brand accents and three
background warmths. Theme, accent, warmth and guest mode persist to
`localStorage`.

Three parametric SVGs carry the visual identity:

- **`AdaCube`** — the ice-cube mascot. One component renders both the friendly
  avatar and the five-step mood scale by tweening `melt` from 0 (crisp) to 1
  (puddle).
- **`IceTimer`** — the focus gauge. The ring shows time *remaining* while Ada
  melts; `drip` runs during a session, `frost` when paused.
- **`PrismGlyph`** — a ring plus a five-bar soundwave, coloured per focus mode.

`AdaCube`, `IceTimer`, `LockBadge` and `TaskCard` are ports of the original
design-system source rather than visual approximations. See
[`BUILD_NOTES.md`](BUILD_NOTES.md) for how that source was recovered, every
place the written spec and the drawn frames disagreed, and the assumptions
made along the way.

---

## Layout

```
src/
├─ components/   nav · core · overlay · brand · content · feedback
├─ screens/      entry · onboarding · plan · subjects · focus
│                ada · profile · feedback · mood · settings
├─ layouts/      AppShell (TopNav + outlet) · AuthShell
├─ hooks/        useAuth · useAppState · useFocusTimer
│   └─ data/     one TanStack Query module per domain — what screens import
├─ lib/          env · supabase · api/ · format · mappers · queryClient
├─ data/         view-model types + styling tables (the mock rows are gone)
└─ styles/       tokens.css · index.css
```

One rule is load-bearing enough to call out — without it the cubes get squashed
by adjacent text:

```css
svg { flex-shrink: 0; vertical-align: middle; }
```

---

## Notes

- Desktop-first. Breakpoints reflow at 1280 and 1024px; below 834px the layout
  holds its tablet-landscape minimum.
- `prefers-reduced-motion: reduce` hides the drip, stops the shimmer and
  collapses transitions.
- The "Continue with Google" button still carries the handoff's placeholder
  mark — Google's official asset was never supplied. See `BUILD_NOTES.md`.
- `BUILD_NOTES.md` describes the original front-end-only build; its §6 ("what is
  deliberately not built") is superseded by `INTEGRATION.md`.
