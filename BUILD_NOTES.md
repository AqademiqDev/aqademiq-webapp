# Aqademiq Web — Build Notes

Front-end build of the handoff package in `design_handoff_aqademiq_web/`.
Stack as specified: **React 18 + Vite + TypeScript + Tailwind CSS + React Router v6**.
Front-end only — every value in `src/data/` is static mock data.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

---

## 1. The bespoke SVGs — status

The brief flagged `AdaCube`, `IceTimer` and `PrismGlyph` as the highest-risk
area, on the assumption their source was unrecoverable. **It was recoverable.**

`Aqademiq Web Flow Frames.html` is a self-extracting bundle: a base64 asset
manifest plus a gzipped copy of the design-system JavaScript. Unpacking it
yielded the original, unminified component source — including the exact
geometry, tone ramp and expression tables:

| Component | Status | Source |
|---|---|---|
| **AdaCube** | Exact port | `components/brand/AdaCube.jsx` from the bundle — `CUBE_TONES`, `MOUTHS`, `cubeBodyPath()`, `Sparkle`, all melt maths |
| **IceTimer** | Exact port | `components/brand/IceTimer.jsx` — ring geometry, `strokeDashoffset` depletion, drip and frost layers |
| **LockBadge** | Exact port | `components/brand/LockBadge.jsx` |
| **TaskCard** | Exact port | `components/content/TaskCard.jsx` |
| **PrismGlyph** | Exact transcription | Inline SVG markup read off frames 01.10 / 04.2 / 13.5 |

So these are not visual approximations — they are the design system's own code
transcribed to TSX. They were verified by rendering the original bundle
side-by-side with the build at 2× and comparing.

Two behaviours worth knowing:

- **The IceTimer ring shows time remaining, not elapsed.** `strokeDashoffset:
  c * progress` means the accent arc depletes as `progress` runs 0 → 1. At
  `progress = 0.38` roughly 62% of the ring is still accent, matching frame 04.5.
- **`melt` and `rating` are independent.** The mood scale drives both together
  (`melt = (4 - rating) / 4`); `IceTimer` instead pins `tone` to `CUBE_TONES[4]`
  and animates `melt` alone, so a running session melts without changing colour.

---

## 2. Where the README and the frames disagree

The README's prose has drifted from the frames in a few places. The README's own
opening says **"The frames are the single source of truth"**, so the frames won
each time. Each deviation from README prose:

| # | README says | The frames draw | Built |
|---|---|---|---|
| 1 | §1.3: headings are Playfair Display | `.h-serif` is `Plus Jakarta Sans 800` — Playfair (`.h-num`) is used only for numerals | Frames. `.h-serif` = sans 800, `.h-num` = Playfair. The class name is legacy. |
| 2 | §3: content padding `24px 30px` | `.body { padding: 24px 26px }` | Frames — `24px 26px` |
| 3 | §3 02.2: a `max-width:760px` day timeline with 6 tasks and a 6:00 PM group | The dashboard shell with the plan card switched to timeline mode, a 58px gutter, 4 tasks | Frames |
| 4 | §3 02.2: 70px time gutter | 58px | Frames — 58px |
| 5 | §3 03.1: header has a term chip **and** an ink "+ Add" pill | Term chip only; adding is the dashed row under the list | Frames |
| 6 | §2.15: settings panel `max-width:640px` | `flex:1; padding:26px 30px` — full width | Frames. Individual panels cap their own rows (560px in Notifications/Prism). |
| 7 | §9 Q4 dark text tokens | The frames' own dark block uses `#efefef / #888888 / #505050 / rgba(255,255,255,0.07)` | **The brief's pre-resolved values** (`#f2f1ee / #9a9a9a / #6a6a6a / rgba(255,255,255,0.08)`) — a direct instruction outranks the frames here. `--accent-soft: #2a2340` is taken from the frames, since the brief didn't cover it. |

**DK.1–DK.3** are dark-mode *content snapshots*, not different layouts — DK.1
shows an evening greeting with 2 tasks done and no "This week" card. README §4.3
calls dark mode "a theme flag, not a route", so the build renders the same
screens with dark tokens rather than a separate evening layout.

---

## 3. Assumptions made (not covered by the brief's pre-resolved list)

1. **Two flow-graph edges have no drawn affordance.** README §4.3 requires
   `Dashboard → New task` and `Notifications → Notification sound`, but frames
   02.1 and 13.3 draw no control for either. Both were added using components
   the design system already draws elsewhere — the dashed-add row (as in 01.5 /
   03.1) and the ValueRow + "Change" pattern (as in 13.4). They are the only
   two additions to any drawn layout, and both are marked with a comment in
   source.
2. **`Dashboard → Evening reflection`** is wired to the drawn "Log today ›" link
   in the "This week" card, which opens the morning check-in before 17:00 and
   the evening reflection after. No new element.
3. **The Google mark is still the frames' placeholder.** The brief says to use
   Google's official "Sign in with Google" asset and explicitly forbids
   recreating a vendor mark; that asset is not in the bundle and was never
   supplied (README §9 Q5 asks for it). `src/components/brand/GoogleMark.tsx`
   keeps the frames' conic-gradient placeholder and documents the one-line swap.
   **This is the only outstanding item that needs an asset from you.**
4. **`SUGGESTIONS (24)`** is the community total the frame's eyebrow reads; the
   mock list holds the six most-voted of them. Filtering or searching falls back
   to the real visible count.
5. **Guest plan data.** Frame 00b.1 draws a guest with 3 tasks (one planned at
   2:00 PM) versus the signed-in 4, and no name in the greeting. Reproduced.
6. **Frames 13.8–13.11 and 06b.4** were read directly off the frames as §9 Q7
   permits, including the password-strength meter in 13.9 and the comment
   thread in 06b.4.
7. **Subject file counts.** The detail pane's FILES tile reads 3 for CC 401
   while only two file rows are listed, so `fileCount` is stored separately from
   the `files` array rather than derived from it.
8. **Tailwind preflight had to be partly undone** to match the frames:
   - `html { line-height: normal }` — preflight's `1.5` made every heading
     without an explicit line-height ~8px taller than drawn.
   - `img { display: inline-block }` / `svg { display: inline }` — preflight
     makes both `display: block`, which breaks the `text-align: center` the
     invite hero and splash rely on and makes `vertical-align: middle` a no-op.

---

## 4. Pre-resolved decisions — how each was implemented

| # | Decision | Where |
|---|---|---|
| 1 | Hover/focus/disabled/loading | `.aq-darken` (6% overlay), `.aq-lift` (→ `--shadow-pop`), `.focus-ring` (`--ring-focus`), `.aq-press` (`.96` active, `.45` + `not-allowed` disabled), `<Spinner>` from frame 01.11 |
| 2 | Responsive | README §5 breakpoints in `src/styles/index.css`; desktop as drawn, laptop fills width, tablet-landscape reflows Plan/Subjects/Profile and narrows the rails to 240px, `min-width: 834px` below that |
| 3 | Validation | `src/lib/validate.ts` — email format, required fields, 5-digit OTP; errors render in `--aq-danger` with a helper line under the field |
| 4 | Dark-mode text tokens | `src/styles/tokens.css` — see §2.7 above |
| 5 | Google button | Placeholder retained — see §3.3 above |
| 6 | Logo | The included PNG (`public/assets/aqademiq-logo.png`) |
| 7 | Under-described frames | Read off the frames |
| 8 | Empty / loading / error | Guest-empty pattern reused for the Feedback empty state; `<Spinner>` for loading |
| 9 | Search | TopNav search opens an input (stub, no results screen); Feedback search filters the visible list |
| 10 | Focus slider | min 5, max 120, step 5, presets 15/25/45/60 (`useFocusTimer.ts`) |
| 11 | Prototype parity | Built from the frames; Ada's reply delay follows README §6 (~650ms) |
| 12 | Persistence | Theme, accent, warmth and guest state in `localStorage`; `startOver()` clears it |

---

## 5. Verification

- `npm run build` succeeds; `tsc --noEmit` clean.
- All 32 app routes (including guest and dark variants) render with **zero
  console errors or warnings**.
- Every screen was screenshot at 1200×720 @2× and compared against the same
  frame rendered from the original bundle.
- `prefers-reduced-motion: reduce` hides `.aq-drip`, stops the shimmer, and
  collapses transitions.

**The `/dev/components` gallery is dev-only** — `App.tsx` mounts it behind
`import.meta.env.DEV`, so it is not present in a production build.

---

## 6. What is deliberately not built

Front-end only, per the brief: no backend, no persistence beyond `localStorage`,
no real auth, no file upload (dropzones are visual), no audio for Prism, and
search returns no results screen.
