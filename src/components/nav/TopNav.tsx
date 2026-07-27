import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../core/Icon';
import { useAppState } from '../../hooks/useAppState';

/* ─────────────────────────────────────────────────────────────────────────
   TopNav (README §2.1) — 58px, card ground, hairline bottom rule.
   Brand · five tabs · action cluster. In guest mode Ada and Profile carry an
   amber lock dot and the action cluster becomes a GUEST badge (§00b).
   ───────────────────────────────────────────────────────────────────────── */

export interface NavTabSpec {
  to: string;
  icon: string;
  label: string;
  /** Locked tabs route to a set-up prompt instead of the real screen. */
  lockable?: boolean;
}

export const NAV_TABS: NavTabSpec[] = [
  { to: '/plan', icon: 'calendar_today', label: 'Plan' },
  { to: '/subjects', icon: 'menu_book', label: 'Subjects' },
  { to: '/focus', icon: 'timer', label: 'Focus' },
  { to: '/ada', icon: 'blur_on', label: 'Ada', lockable: true },
  { to: '/profile', icon: 'bar_chart', label: 'Profile', lockable: true },
];

/** NavTab — pill, 7px 14px, 800 12.5px; active fills with ink. */
export function NavTab({ to, icon, label, locked = false }: NavTabSpec & { locked?: boolean }) {
  return (
    <NavLink
      to={to}
      className="aq-press focus-ring"
      style={({ isActive }) => ({
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 14px',
        borderRadius: 100,
        font: '800 12.5px var(--font-sans)',
        color: isActive ? '#fff' : 'var(--text-secondary)',
        background: isActive ? 'var(--surface-ink)' : 'transparent',
        whiteSpace: 'nowrap',
        transition: 'background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard)',
      })}
    >
      <Icon name={icon} size={18} />
      {/* README §5: tabs keep icons + labels down to tablet-landscape, and the
          shell holds an 834px minimum below that — so labels never drop. */}
      <span>{label}</span>
      {locked && (
        <span
          style={{
            position: 'absolute',
            top: -1,
            right: 4,
            width: 13,
            height: 13,
            borderRadius: '50%',
            background: '#e8a430',
            border: '2px solid var(--surface-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="lock" size={7} color="#fff" />
        </span>
      )}
    </NavLink>
  );
}

/** IconButton (`.ip`) — 36px circle on the page ground; sunken when current. */
export function IconButton({
  icon,
  label,
  onClick,
  current = false,
  size = 36,
  iconSize = 18,
  style,
  children,
}: {
  icon?: string;
  label: string;
  onClick?: () => void;
  current?: boolean;
  size?: number;
  iconSize?: number;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="aq-press aq-darken focus-ring"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: current ? 'var(--surface-sunken)' : 'var(--surface-page)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-primary)',
        flexShrink: 0,
        ...style,
      }}
    >
      {children ?? (icon && <Icon name={icon} size={iconSize} />)}
    </button>
  );
}

/** Avatar (`.av`) — 34px accent circle with the user's initial. */
export function Avatar({
  initial = 'R',
  size = 34,
  onClick,
  label,
  style,
}: {
  initial?: string;
  size?: number;
  onClick?: () => void;
  label?: string;
  style?: CSSProperties;
}) {
  const skin: CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    background: 'var(--accent)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    font: `800 ${Math.round(size * 0.382)}px var(--font-sans)`,
    flexShrink: 0,
    ...style,
  };

  if (!onClick) return <span style={skin}>{initial}</span>;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label ?? 'Account'}
      className="aq-press focus-ring"
      style={skin}
    >
      {initial}
    </button>
  );
}

export default function TopNav() {
  const { guest, theme, toggleTheme, name } = useAppState();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const onSettings = location.pathname.startsWith('/settings');
  const initial = (name.trim()[0] || 'R').toUpperCase();

  return (
    <header
      style={{
        height: 58,
        flexShrink: 0,
        background: 'var(--surface-card)',
        borderBottom: '1px solid var(--border-hairline)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 22px',
        gap: 14,
        position: 'relative',
        zIndex: 20,
      }}
    >
      <NavLink
        to="/plan"
        className="focus-ring"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          font: '800 17px var(--font-sans)',
          letterSpacing: '-.4px',
          flexShrink: 0,
          borderRadius: 8,
        }}
      >
        <img src="/assets/aqademiq-logo.png" alt="" style={{ width: 26, height: 26, objectFit: 'contain' }} />
        Aqademiq
      </NavLink>

      <nav style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 3 }} aria-label="Main">
        {NAV_TABS.map((t) => (
          <NavTab key={t.to} {...t} locked={guest && !!t.lockable} />
        ))}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
        {searchOpen && (
          <input
            ref={searchRef}
            autoFocus
            placeholder="Search"
            aria-label="Search"
            onBlur={() => setSearchOpen(false)}
            onKeyDown={(e) => e.key === 'Escape' && setSearchOpen(false)}
            className="focus-ring"
            style={{
              height: 36,
              width: 190,
              borderRadius: 100,
              border: '1.5px solid var(--border-hairline)',
              background: 'var(--surface-page)',
              padding: '0 14px',
              font: '600 12px var(--font-sans)',
              outline: 'none',
            }}
          />
        )}

        <IconButton icon="search" label="Search" onClick={() => setSearchOpen((v) => !v)} />

        {guest ? (
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: 'var(--surface-page)',
              borderRadius: 100,
              padding: '6px 12px',
              font: '800 10px var(--font-sans)',
              letterSpacing: '.05em',
              color: 'var(--text-secondary)',
            }}
          >
            <Icon name="person_outline" size={13} color="#e8a430" />
            GUEST
          </span>
        ) : (
          <>
            <IconButton
              icon={theme === 'dark' ? 'light_mode' : 'dark_mode'}
              label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={toggleTheme}
            />
            <IconButton
              icon="settings"
              label="Settings"
              current={onSettings}
              onClick={() => navigate('/settings')}
            />
            <Avatar initial={initial} onClick={() => navigate('/profile')} label="Profile" />
          </>
        )}
      </div>
    </header>
  );
}
