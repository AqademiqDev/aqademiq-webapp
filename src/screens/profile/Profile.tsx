import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Content } from '../../layouts/AppShell';
import AdaCube, { type CubeExpr } from '../../components/brand/AdaCube';
import Button from '../../components/core/Button';
import Card from '../../components/core/Card';
import Icon from '../../components/core/Icon';
import Modal from '../../components/overlay/Modal';
import { EyebrowLabel } from '../../components/core/Misc';
import { AsyncSection, ErrorState, Loading, errorMessage } from '../../components/core/Async';
import { MoodWeek } from '../../components/content/MoodScale';
import InviteHero from '../../components/content/InviteHero';
import ReferralSheet from './ReferralSheet';
import GuestStatsLocked from './GuestStatsLocked';
import MorningCheckIn from '../mood/MorningCheckIn';
import {
  useMoodWeek,
  useProfile,
  useStats,
  useStreak,
  useSubmitRating,
  useWeekCount,
} from '../../hooks/data';
import { useAuth } from '../../hooks/useAuth';

/* ─────────────────────────────────────────────────────────────────────────
   Section 06 — Profile / Stats (frames 06.1–06.2).
   Two columns: identity + stats + mood + link list on the left, the invite
   hero and weekly goal on the right. Guests get 00b.4 instead.
   ───────────────────────────────────────────────────────────────────────── */

/** `avatar_index` is a 0–7 preset; index 0 is the cube the frame draws. */
// no endpoint: avatar is a preset index, not an upload
const AVATARS: { expr: CubeExpr; cheeks?: boolean; sparkles?: boolean }[] = [
  { expr: 'happy', cheeks: true },
  { expr: 'smile', cheeks: true },
  { expr: 'happy', sparkles: true },
  { expr: 'focused' },
  { expr: 'neutral', cheeks: true },
  { expr: 'smile', sparkles: true },
  { expr: 'meh' },
  { expr: 'happy' },
];

/* no endpoint: the FAQ, the social account and the policy pages live on the
   marketing site, not on the API — these open there rather than no-op. */
const MARKETING = {
  faq: 'https://aqademiq.com/faq',
  instagram: 'https://instagram.com/aqademiq',
  privacy: 'https://aqademiq.com/privacy',
  terms: 'https://aqademiq.com/terms',
};

const openExternal = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

export default function Profile() {
  const navigate = useNavigate();
  const { isGuest } = useAuth();

  const profile = useProfile();
  const stats = useStats();
  const streak = useStreak();
  const mood = useMoodWeek();
  const week = useWeekCount();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [moodOpen, setMoodOpen] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);

  // Identity + tiles all render together, so they share one async switch.
  const summary = {
    isLoading: profile.isLoading || stats.isLoading || streak.isLoading,
    isError: profile.isError || stats.isError || streak.isError,
    error: profile.error ?? stats.error ?? streak.error,
    refetch: () => {
      void profile.refetch();
      void stats.refetch();
      void streak.refetch();
    },
  };

  const streakDays = streak.data?.current_streak ?? stats.data?.current_streak ?? 0;
  const focusMinutes = stats.data?.focus_minutes ?? 0;
  // Lifetime focus reads as hours once there is at least one, minutes before that.
  const focus =
    focusMinutes >= 60
      ? { value: String(Math.round(focusMinutes / 60)), unit: 'h' }
      : { value: String(focusMinutes), unit: 'm' };
  const avatar = AVATARS[Math.min(Math.max(profile.data?.avatar_index ?? 0, 0), AVATARS.length - 1)];
  const displayName = profile.data?.name?.trim() || 'You';

  const activeDays = week.data?.count ?? 0;
  const weekPct = Math.round((activeDays / 7) * 100);

  const LINKS: { icon: string; label: string; onClick: () => void }[] = [
    { icon: 'star_outline', label: 'Rate the app', onClick: () => setRateOpen(true) },
    { icon: 'chat_bubble_outline', label: 'Share feedback', onClick: () => navigate('/feedback') },
    { icon: 'help_outline', label: 'FAQ', onClick: () => openExternal(MARKETING.faq) },
    {
      icon: 'camera_alt',
      label: 'Follow us on Instagram',
      onClick: () => openExternal(MARKETING.instagram),
    },
  ];

  if (isGuest) return <GuestStatsLocked />;

  return (
    <>
      <Content padding="24px 26px">
        <div className="aq-profile-cols aq-cols" style={{ display: 'flex', gap: 20, alignItems: 'stretch' }}>
          {/* ── Left column ─────────────────────────────────────────── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <AsyncSection query={summary} loadingLabel="Loading your stats…">
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
                  <AdaCube size={44} expr={avatar.expr} cheeks={avatar.cheeks} sparkles={avatar.sparkles} />
                </div>
                <div>
                  <div className="h-serif" style={{ fontSize: 24, lineHeight: 1.1 }}>
                    {displayName}
                  </div>
                  <div style={{ font: '700 12px var(--font-sans)', color: 'var(--text-secondary)' }}>
                    {streakDays > 0
                      ? `${streakDays}-day streak · keep it frozen`
                      : 'No streak yet · start one today'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <StatCard value={String(streakDays)} label="DAY STREAK" accent />
                {/* no endpoint: /me/stats only carries lifetime focus minutes — there is
                    no weekly focus bucket, so the tile reads as total focus time. */}
                <StatCard value={focus.value} unit={focus.unit} label="FOCUS TIME" />
                <StatCard value={String(stats.data?.completed_tasks ?? 0)} label="TASKS DONE" />
              </div>
            </AsyncSection>

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
              {/* A week with nothing logged is the drawn empty state: seven dashed
                  circles. `useMoodWeek().days` is always seven entries. */}
              {mood.isLoading ? (
                <Loading padding={6} label="Loading mood…" />
              ) : mood.isError ? (
                <ErrorState error={mood.error} onRetry={mood.refetch} padding={6} />
              ) : (
                <MoodWeek days={mood.days} size={34} dashSize={32} />
              )}
            </Card>

            <div>
              <EyebrowLabel style={{ marginBottom: 8 }}>ABOUT &amp; SUPPORT</EyebrowLabel>
              <Card padding="2px 18px">
                {LINKS.map((l, i) => (
                  <button
                    key={l.label}
                    type="button"
                    onClick={l.onClick}
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
                <button
                  type="button"
                  onClick={() => openExternal(MARKETING.privacy)}
                  className="focus-ring"
                  style={{ font: 'inherit', color: 'var(--text-secondary)', fontWeight: 700, borderRadius: 4 }}
                >
                  Privacy Policy
                </button>{' '}
                ·{' '}
                <button
                  type="button"
                  onClick={() => openExternal(MARKETING.terms)}
                  className="focus-ring"
                  style={{ font: 'inherit', color: 'var(--text-secondary)', fontWeight: 700, borderRadius: 4 }}
                >
                  Terms of service
                </button>{' '}
                · v1.0.0
              </div>
            </div>
          </div>

          {/* ── Right column ────────────────────────────────────────── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            {/* The hero's own code tiles are decorative; the real code is fetched
                and copied inside ReferralSheet. */}
            <InviteHero onShare={() => setInviteOpen(true)} />

            <Card padding={18}>
              <div style={{ font: '800 13px var(--font-sans)', marginBottom: 8 }}>Weekly goal</div>
              {/* no endpoint: there is no weekly focus-minutes bucket, so the goal
                  tracks active days this week from /week-count. */}
              {week.isLoading ? (
                <Loading padding={6} label="Loading…" />
              ) : week.isError ? (
                <ErrorState error={week.error} onRetry={week.refetch} padding={6} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span
                    style={{
                      font: '600 11px var(--font-sans)',
                      color: 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {activeDays} / 7 days
                  </span>
                  <div style={{ flex: 1, height: 8, background: 'var(--surface-page)', borderRadius: 4 }}>
                    <div
                      style={{ width: `${weekPct}%`, height: '100%', background: 'var(--accent)', borderRadius: 4 }}
                    />
                  </div>
                  <span style={{ font: '800 12px var(--font-sans)', color: 'var(--accent)' }}>{weekPct}%</span>
                </div>
              )}
            </Card>
          </div>
        </div>
      </Content>

      <ReferralSheet open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <MorningCheckIn open={moodOpen} onClose={() => setMoodOpen(false)} />
      <RateAppModal open={rateOpen} onClose={() => setRateOpen(false)} />
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

/** "Rate the app" — POST /ratings takes a 1–5 star score. */
function RateAppModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [stars, setStars] = useState(0);
  const submit = useSubmitRating();

  const close = () => {
    submit.reset();
    setStars(0);
    onClose();
  };

  const send = () => {
    if (stars < 1) return;
    submit.mutate({ rating: stars }, { onSuccess: close });
  };

  return (
    <Modal open={open} onClose={close} title="Rate the app" maxWidth={420} aria-label="Rate the app">
      <div
        style={{
          font: '600 12px/1.5 var(--font-sans)',
          color: 'var(--text-secondary)',
          marginBottom: 14,
        }}
      >
        How is Aqademiq treating you so far?
      </div>

      <div role="radiogroup" aria-label="Rating" style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={stars === n}
            aria-label={n === 1 ? '1 star' : `${n} stars`}
            onClick={() => setStars(n)}
            className="aq-press focus-ring"
            style={{ display: 'flex', borderRadius: 8, padding: 4 }}
          >
            <Icon
              name={n <= stars ? 'star' : 'star_outline'}
              size={30}
              color={n <= stars ? 'var(--accent)' : 'var(--text-dim)'}
            />
          </button>
        ))}
      </div>

      {submit.isError && (
        <div
          style={{
            font: '700 11.5px/1.5 var(--font-sans)',
            color: 'var(--aq-danger)',
            marginBottom: 12,
          }}
        >
          {errorMessage(submit.error)}
        </div>
      )}

      <Button full onClick={send} disabled={stars < 1} loading={submit.isPending}>
        Send rating
      </Button>
    </Modal>
  );
}
