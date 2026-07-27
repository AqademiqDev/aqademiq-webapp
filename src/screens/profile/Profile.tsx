import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Content } from '../../layouts/AppShell';
import AdaCube from '../../components/brand/AdaCube';
import Card from '../../components/core/Card';
import Icon from '../../components/core/Icon';
import { EyebrowLabel } from '../../components/core/Misc';
import { MoodWeek } from '../../components/content/MoodScale';
import InviteHero from '../../components/content/InviteHero';
import ReferralSheet from './ReferralSheet';
import GuestStatsLocked from './GuestStatsLocked';
import MorningCheckIn from '../mood/MorningCheckIn';
import { WEEK_MOODS } from '../../data/tasks';
import { useAppState } from '../../hooks/useAppState';

/* ─────────────────────────────────────────────────────────────────────────
   Section 06 — Profile / Stats (frames 06.1–06.2).
   Two columns: identity + stats + mood + link list on the left, the invite
   hero and weekly goal on the right. Guests get 00b.4 instead.
   ───────────────────────────────────────────────────────────────────────── */

const LINKS = [
  { icon: 'star_outline', label: 'Rate the app' },
  { icon: 'chat_bubble_outline', label: 'Share feedback', to: '/feedback' },
  { icon: 'help_outline', label: 'FAQ' },
  { icon: 'camera_alt', label: 'Follow us on Instagram' },
];

export default function Profile() {
  const navigate = useNavigate();
  const { guest, name } = useAppState();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [moodOpen, setMoodOpen] = useState(false);

  if (guest) return <GuestStatsLocked />;

  return (
    <>
      <Content padding="24px 26px">
        <div className="aq-profile-cols aq-cols" style={{ display: 'flex', gap: 20, alignItems: 'stretch' }}>
          {/* ── Left column ─────────────────────────────────────────── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: '50%',
                  background: 'var(--accent-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AdaCube size={44} expr="happy" cheeks />
              </div>
              <div>
                <div className="h-serif" style={{ fontSize: 24, lineHeight: 1.1 }}>
                  {name}
                </div>
                <div style={{ font: '700 12px var(--font-sans)', color: 'var(--text-secondary)' }}>
                  3-day streak · keep it frozen
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <StatCard value="3" label="DAY STREAK" accent />
              <StatCard value="12" unit="h" label="FOCUS THIS WK" />
              <StatCard value="86" unit="%" label="TASKS DONE" />
            </div>

            <Card padding={18}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 14,
                }}
              >
                <span style={{ font: '800 13px var(--font-sans)' }}>Mood this week</span>
                <button
                  type="button"
                  onClick={() => setMoodOpen(true)}
                  className="focus-ring"
                  style={{ font: '700 11px var(--font-sans)', color: 'var(--accent)', borderRadius: 4 }}
                >
                  Log today ›
                </button>
              </div>
              <MoodWeek days={WEEK_MOODS} size={34} dashSize={32} />
            </Card>

            <div>
              <EyebrowLabel style={{ marginBottom: 8 }}>ABOUT &amp; SUPPORT</EyebrowLabel>
              <Card padding="2px 18px">
                {LINKS.map((l, i) => (
                  <button
                    key={l.label}
                    type="button"
                    onClick={l.to ? () => navigate(l.to!) : undefined}
                    className="focus-ring"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 0',
                      borderBottom: i < LINKS.length - 1 ? '1px solid var(--border-hairline)' : undefined,
                      width: '100%',
                    }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 11,
                        font: '700 13px var(--font-sans)',
                      }}
                    >
                      <Icon name={l.icon} size={18} color="var(--text-secondary)" />
                      {l.label}
                    </span>
                    <span style={{ color: 'var(--text-dim)' }}>›</span>
                  </button>
                ))}
              </Card>
              <div
                style={{
                  font: '600 10.5px var(--font-sans)',
                  color: 'var(--text-dim)',
                  marginTop: 10,
                  paddingLeft: 2,
                }}
              >
                <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>Privacy Policy</span> ·{' '}
                <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>Terms of service</span> · v1.0.0
              </div>
            </div>
          </div>

          {/* ── Right column ────────────────────────────────────────── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <InviteHero onShare={() => setInviteOpen(true)} />

            <Card padding={18}>
              <div style={{ font: '800 13px var(--font-sans)', marginBottom: 8 }}>Weekly goal</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  style={{
                    font: '600 11px var(--font-sans)',
                    color: 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  12 / 14 h
                </span>
                <div style={{ flex: 1, height: 8, background: 'var(--surface-page)', borderRadius: 4 }}>
                  <div style={{ width: '86%', height: '100%', background: 'var(--accent)', borderRadius: 4 }} />
                </div>
                <span style={{ font: '800 12px var(--font-sans)', color: 'var(--accent)' }}>86%</span>
              </div>
            </Card>
          </div>
        </div>
      </Content>

      <ReferralSheet open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <MorningCheckIn open={moodOpen} onClose={() => setMoodOpen(false)} />
    </>
  );
}

function StatCard({
  value,
  unit,
  label,
  accent = false,
}: {
  value: string;
  unit?: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <Card padding={16} style={{ flex: 1, textAlign: 'center' }}>
      <div className="h-num" style={{ fontSize: 36, color: accent ? 'var(--accent)' : undefined }}>
        {value}
        {unit && <span style={{ fontSize: 18 }}>{unit}</span>}
      </div>
      <EyebrowLabel style={{ marginTop: 3 }}>{label}</EyebrowLabel>
    </Card>
  );
}
