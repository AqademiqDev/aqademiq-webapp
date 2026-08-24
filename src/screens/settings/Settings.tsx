import type { CSSProperties } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import Icon from '../../components/core/Icon';
import { errorMessage } from '../../components/core/Async';

/* ─────────────────────────────────────────────────────────────────────────
   Section 13 — Settings (README §2.15). Two-pane: a 280px rail on the card
   ground, then the scrolling panel.
   ───────────────────────────────────────────────────────────────────────── */

const CATEGORIES = [
  { to: '/settings', icon: 'palette', label: 'Appearance', end: true },
  { to: '/settings/tags', icon: 'sell', label: 'Study tags' },
  { to: '/settings/notifications', icon: 'notifications_none', label: 'Notifications' },
  { to: '/settings/prism', icon: 'graphic_eq', label: 'Prism' },
  { to: '/settings/import', icon: 'ios_share', label: 'Import' },
  { to: '/settings/account', icon: 'shield', label: 'Profile & Account' },
];

export default function Settings() {
  return (
    <div className="aq-screen" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      <nav
        className="aq-scroll aq-settings-rail"
        aria-label="Settings"
        style={{
          width: 280,
          flexShrink: 0,
          borderRight: '1px solid var(--border-hairline)',
          background: 'var(--surface-card)',
          padding: '20px 14px',
          overflow: 'auto',
        }}
      >
        <div style={{ font: '800 20px var(--font-sans)', letterSpacing: '-.4px', padding: '0 8px 16px' }}>
          Settings
        </div>
        {CATEGORIES.map((c) => (
          <NavLink
            key={c.to}
            to={c.to}
            end={c.end}
            className="aq-press focus-ring"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 11,
              padding: '11px 13px',
              borderRadius: 12,
              font: '800 13px var(--font-sans)',
              marginBottom: 3,
              background: isActive ? 'var(--surface-ink)' : 'transparent',
              color: isActive ? '#fff' : 'var(--text-secondary)',
              transition: 'background var(--dur-fast) var(--ease-standard)',
            })}
          >
            <Icon name={c.icon} size={19} />
            {c.label}
          </NavLink>
        ))}
      </nav>

      {/* The frames render this panel full-width — README §2.15's max-width:640px
          is not present in 13.1–13.5, so the drawn behaviour wins. Individual
          panels cap their own rows (e.g. 560px in Notifications and Prism). */}
      <div className="aq-scroll" style={{ flex: 1, overflow: 'auto', padding: '26px 30px', minWidth: 0 }}>
        <Outlet />
      </div>
    </div>
  );
}

/** Shared panel heading — 800 17px title + 600 12px sub. */
export function PanelHead({ title, sub, gap = 22 }: { title: string; sub: string; gap?: number }) {
  return (
    <>
      <div style={{ font: '800 17px var(--font-sans)', marginBottom: 3 }}>{title}</div>
      <div style={{ font: '600 12px var(--font-sans)', color: 'var(--text-secondary)', marginBottom: gap }}>
        {sub}
      </div>
    </>
  );
}

/** Shared settings row — label + sub on the left, control on the right. */
export function Row({
  title,
  sub,
  control,
  padding = '15px 0',
  last = false,
}: {
  title: React.ReactNode;
  sub?: React.ReactNode;
  control?: React.ReactNode;
  padding?: string;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
        padding,
        borderBottom: last ? undefined : '1px solid var(--border-hairline)',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ font: '800 13px var(--font-sans)' }}>{title}</div>
        {sub && (
          <div style={{ font: '600 10.5px var(--font-sans)', color: 'var(--text-dim)', marginTop: 2 }}>{sub}</div>
        )}
      </div>
      {control}
    </div>
  );
}

/**
 * A field row that shows a stored value with an inline Edit/Change action.
 * `action`/`onAction` are optional — a field the API cannot change yet renders
 * as the same row without the trailing button.
 */
export function ValueRow({
  label,
  value,
  action,
  onAction,
  disabled = false,
  last = false,
}: {
  label: string;
  value: string;
  action?: string;
  onAction?: () => void;
  disabled?: boolean;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
        padding: '14px 0',
        borderBottom: last ? undefined : '1px solid var(--border-hairline)',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ font: '700 10px var(--font-sans)', color: 'var(--text-dim)' }}>{label}</div>
        <div style={{ font: '800 13px var(--font-sans)', marginTop: 2 }}>{value}</div>
      </div>
      {action && onAction && (
        <button
          type="button"
          onClick={onAction}
          disabled={disabled}
          className="focus-ring"
          style={{
            font: '800 11px var(--font-sans)',
            color: 'var(--accent)',
            borderRadius: 4,
            flexShrink: 0,
            opacity: disabled ? 0.45 : undefined,
          }}
        >
          {action}
        </button>
      )}
    </div>
  );
}

/**
 * Inline failure line for a single control — same geometry as the field-level
 * error under `Input`, so a failed mutation reads next to what caused it
 * instead of taking over the panel.
 */
export function InlineError({ error, style }: { error: unknown; style?: CSSProperties }) {
  if (!error) return null;
  return (
    <div
      role="alert"
      style={{
        font: '600 10.5px var(--font-sans)',
        color: 'var(--aq-danger)',
        marginTop: 6,
        ...style,
      }}
    >
      {errorMessage(error)}
    </div>
  );
}
