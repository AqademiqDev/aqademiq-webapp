import { useRef, useState, type CSSProperties } from 'react';

import { isGap, moodTint, type ReportDay } from '../../lib/weeklyReport';

/* ─────────────────────────────────────────────────────────────────────────
   The core: seven days drilled out as one translucent column.

   A port of the mobile app's `core_column.dart`, geometry and colours included.

   An ice core is a record of a season, and nobody grades one — you read layers
   off it. That posture is the whole reason this is a column of bands and not
   seven bars on an axis: bars invite comparison against each other and against
   whatever the tallest one is, and a column of ice does not have a tallest.

   What the drawing must get right, all of it about honesty rather than looks:

   * An empty day is an open band, never a puddle. Nothing logged gets a dashed
     outline and no fill. Tinting it with the pale end of the ramp would draw
     "nothing logged" as "a bad day" — a claim the data does not support.
   * A day that has not happened is not a gap. Opened on a Thursday, the core
     has three days left in it, drawn as bare undashed space: the dashed band
     means "this day happened and holds nothing", which is false about tomorrow.
   * A day that happened but carries no mood is drawn solid and untinted. Work
     with no check-in is not the same as no work, and it is not a mood either.
   * Nothing here encodes volume. Every band is the same height; a band that grew
     with effort is a bar chart wearing a metaphor.

   Theme-dependent colours live in CSS (`.aq-core` in index.css) so the drawing
   follows the theme without re-rendering; per-band tints arrive as custom
   properties because they are data.
   ───────────────────────────────────────────────────────────────────────── */

export interface CoreColumnProps {
  days: ReportDay[];
  width?: number;
  height?: number;
  /** The freeze-in. Off for thumbnails, which must not animate on every render. */
  animate?: boolean;
  /**
   * With `animate`, whether to run it now. Held at its first frame until true, so
   * a core laid out off-screen (a later beat of the story) freezes in when it is
   * reached rather than long before anyone is looking.
   */
  play?: boolean;
  showBubbles?: boolean;
  style?: CSSProperties;
}

/** Long enough to read as drilling rather than loading; short enough nobody waits twice. */
const DURATION_MS = 1250;

/** When band `i` starts settling: staggered top-down, the way sediment does. */
const bandDelay = (i: number) => Math.round((0.22 + (i / 7) * 0.55) * DURATION_MS);

/** A 6-digit hex with alpha, as rgba(). */
function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function CoreColumn({
  days,
  width = 128,
  height = 340,
  animate = true,
  play = true,
  showBubbles = true,
  style,
}: CoreColumnProps) {
  const small = width < 70;
  const radius = width * 0.42;
  const gap = small ? 3 : 6;
  const inset = small ? 3 : 6;
  const bandRadius = small ? 5 : 9;
  const bubbles = showBubbles && !small;
  // When the drill began. The story swaps its seven blank bands for the real
  // week mid-animation; a band that appears late must settle on the same clock
  // rather than restart its stagger from zero and pop in after the others.
  const startedAt = useRef(performance.now()).current;

  const animClass = animate ? `aq-core-form${play ? '' : ' aq-core-paused'}` : '';

  return (
    <div
      className="aq-core"
      aria-hidden="true"
      style={{ position: 'relative', width, height, flexShrink: 0, ...style }}
    >
      <div className={animClass} style={{ position: 'absolute', inset: 0 }}>
        {/* The tube. */}
        <div
          className="aq-core-tube"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: radius,
            borderWidth: small ? 1 : 1.4,
            borderStyle: 'solid',
          }}
        />

        {/* The rim: the ellipse that makes it a drilled cylinder rather than a
            rounded rectangle. It is the whole read of the object. */}
        <Rim width={width} />

        {/* The layers. */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            padding: `${inset + 1}px ${inset}px`,
            display: 'flex',
            flexDirection: 'column',
            gap,
          }}
        >
          {days.map((day, i) => (
            <Band
              key={i}
              day={day}
              radius={bandRadius}
              bubbles={bubbles}
              delay={animate ? bandDelay(i) : null}
              startedAt={startedAt}
            />
          ))}
        </div>

        {/* Specular streak — one soft sheen down the left third. It is what stops
            the stack of bands reading as a flat list. */}
        <div
          className="aq-core-sheen"
          style={{ position: 'absolute', inset: 0, borderRadius: radius, pointerEvents: 'none' }}
        />
      </div>
    </div>
  );
}

function Rim({ width }: { width: number }) {
  const w = width + 2;
  const h = width * 0.16;
  // Inset by 1.5 for the highlight, as the mobile painter deflates its rect.
  const rx = w / 2 - 1.5;
  const ry = h / 2 - 1.5;
  const cx = w / 2;
  const cy = h / 2;
  // The near lip: an arc from 0.15π to 0.85π, drawn clockwise from +x — the
  // lower edge of the ellipse, so it reads as an opening.
  const a0 = Math.PI * 0.15;
  const a1 = Math.PI * 0.85;
  const x0 = cx + rx * Math.cos(a0);
  const y0 = cy + ry * Math.sin(a0);
  const x1 = cx + rx * Math.cos(a1);
  const y1 = cy + ry * Math.sin(a1);

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ position: 'absolute', left: -1, top: -width * 0.055, overflow: 'visible', display: 'block' }}
    >
      <ellipse
        cx={cx}
        cy={cy}
        rx={w / 2}
        ry={h / 2}
        className="aq-core-rim"
        strokeWidth={1.4}
      />
      <path
        d={`M ${x0} ${y0} A ${rx} ${ry} 0 0 1 ${x1} ${y1}`}
        fill="none"
        stroke="rgba(255, 255, 255, 0.55)"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </svg>
  );
}

function Band({
  day,
  radius,
  bubbles,
  delay,
  startedAt,
}: {
  day: ReportDay;
  radius: number;
  bubbles: boolean;
  /** Milliseconds, or null when not animating. */
  delay: number | null;
  startedAt: number;
}) {
  const animated = delay !== null;
  const wrapStyle: CSSProperties = {
    flex: 1,
    minHeight: 0,
    position: 'relative',
    ...(animated ? ({ '--band-delay': `${delay}ms` } as CSSProperties) : null),
  };
  const wrapClass = animated ? 'aq-core-band' : undefined;

  // Not yet drilled. No dashes: the dashed outline means "this day happened and
  // holds nothing", which is a statement, and it is false about tomorrow.
  if (day.isFuture) {
    return (
      <div className={wrapClass} style={wrapStyle}>
        <div className="aq-core-future" style={{ position: 'absolute', inset: 0, borderRadius: radius }} />
      </div>
    );
  }

  // An open band never fills. It is outlined so the gap is visibly a gap — a day
  // the core has no layer for — rather than a day drawn as a pale mood.
  if (isGap(day)) {
    return (
      <div className={wrapClass} style={wrapStyle}>
        <svg
          width="100%"
          height="100%"
          style={{ position: 'absolute', inset: 0, overflow: 'visible', display: 'block' }}
        >
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            rx={radius}
            ry={radius}
            fill="none"
            className="aq-core-dash"
            strokeWidth={1.2}
            strokeDasharray="5 4"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={wrapClass} style={wrapStyle}>
      <FilledBand
        moodIndex={day.moodIndex}
        radius={radius}
        bubbles={bubbles}
        delay={delay}
        startedAt={startedAt}
      />
    </div>
  );
}

/**
 * A day that happened. Tinted by its mood, or — with no mood logged — solid and
 * deliberately neutral, never borrowed from the low end of the ramp.
 *
 * Its own component so the drop delay is fixed once, when it mounts: recomputing
 * it on a later render would retime an animation that is already running.
 */
function FilledBand({
  moodIndex,
  radius,
  bubbles,
  delay,
  startedAt,
}: {
  moodIndex: number | null;
  radius: number;
  bubbles: boolean;
  delay: number | null;
  startedAt: number;
}) {
  const [dropDelay] = useState(() =>
    delay === null ? null : Math.max(0, delay - (performance.now() - startedAt)),
  );
  const tint = moodTint(moodIndex);
  const fillVars = (
    tint
      ? {
          '--band-fill': withAlpha(tint, 0.34),
          '--band-fill-dark': withAlpha(tint, 0.62),
          '--band-edge': withAlpha(tint, 0.85),
          '--band-edge-dark': withAlpha(tint, 0.85),
        }
      : null
  ) as CSSProperties | null;

  return (
    <div
      className={`aq-core-fill${tint ? '' : ' aq-core-fill-untinted'}${dropDelay !== null ? ' aq-core-drop' : ''}`}
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: radius,
        borderWidth: 1.2,
        borderStyle: 'solid',
        ...fillVars,
        ...(dropDelay !== null ? ({ '--drop-delay': `${dropDelay}ms` } as CSSProperties) : null),
      }}
    >
      {bubbles && (
        <>
          {/* Two trapped bubbles. Purely decorative, and the reason the bands
              read as ice rather than as progress bars. */}
          <span className="aq-core-bubble aq-core-bubble-a" style={{ left: 8, top: 6, width: 4.5, height: 4.5 }} />
          <span className="aq-core-bubble aq-core-bubble-b" style={{ left: 14, top: 17, width: 2.5, height: 2.5 }} />
        </>
      )}
    </div>
  );
}

const DAY_LETTERS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

/** MON…SUN down the left of the core, aligned to the bands beside it. */
export function CoreDayLabels({
  days,
  height,
  fontSize = 9.5,
  emphasise,
}: {
  days: ReportDay[];
  height: number;
  fontSize?: number;
  /** Weekday (1–7) to draw at full strength — the day a caption is talking about. */
  emphasise?: number | null;
}) {
  return (
    <div aria-hidden="true" style={{ height, display: 'flex', flexDirection: 'column' }}>
      {days.map((d, i) => {
        // The label for an open day dims with its band, so a gap reads as one
        // thing rather than a labelled void — and a day that has not arrived dims
        // further still.
        const color =
          emphasise === d.weekday
            ? 'var(--text-primary)'
            : d.isFuture
              ? 'color-mix(in srgb, var(--text-dim) 45%, transparent)'
              : d.hasActivity
                ? 'var(--text-secondary)'
                : 'var(--text-dim)';
        return (
          <div
            key={i}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              font: `800 ${fontSize}px var(--font-sans)`,
              letterSpacing: '0.1em',
              color,
            }}
          >
            {DAY_LETTERS[i % 7]}
          </div>
        );
      })}
    </div>
  );
}
