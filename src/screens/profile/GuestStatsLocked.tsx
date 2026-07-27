import { useNavigate } from 'react-router-dom';
import { Content } from '../../layouts/AppShell';
import AdaCube from '../../components/brand/AdaCube';
import LockBadge from '../../components/brand/LockBadge';
import Button from '../../components/core/Button';
import Card from '../../components/core/Card';
import Modal from '../../components/overlay/Modal';
import { EyebrowLabel } from '../../components/core/Misc';
import { GuestBlurPane } from '../../components/content/GuestNudge';

/* Frame 00b.4 — Locked stats → set up. The Profile stats sit blurred behind a
   bottom-anchored card (max-width 560), with — placeholders in the tiles. */

/* Placeholders only — a guest's real numbers stay behind the blur until they
   have an account. Labels mirror the tiles Profile draws when unlocked. */
const PLACEHOLDER_STATS = [
  { label: 'DAY STREAK' },
  { label: 'FOCUS TIME' },
  { label: 'TASKS DONE' },
];

export default function GuestStatsLocked() {
  const navigate = useNavigate();

  return (
    <>
      <Content padding="24px 26px">
        <GuestBlurPane>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              background: 'var(--accent-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AdaCube size={44} expr="happy" cheeks />
          </div>
          <div>
            <div className="h-serif" style={{ fontSize: 24, lineHeight: 1.1 }}>
              Guest
            </div>
            <div style={{ font: '700 12px var(--font-sans)', color: 'var(--text-secondary)' }}>
              — · keep it frozen
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          {PLACEHOLDER_STATS.map((s) => (
            <Card key={s.label} padding={16} style={{ flex: 1, textAlign: 'center' }}>
              <div className="h-num" style={{ fontSize: 36 }}>
                —
              </div>
              <EyebrowLabel style={{ marginTop: 3 }}>{s.label}</EyebrowLabel>
            </Card>
          ))}
        </div>
        </GuestBlurPane>
      </Content>

      <Modal
        open
        onClose={() => navigate('/plan')}
        hideClose
        align="bottom"
        maxWidth={560}
        padding="24px 26px"
        panelStyle={{ textAlign: 'center' }}
        aria-label="Track your progress"
      >
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 14 }}>
          <AdaCube size={60} expr="happy" />
          <LockBadge size={24} ringWidth={3} style={{ position: 'absolute', bottom: 0, right: -4 }} />
        </div>

        <div style={{ font: '800 19px var(--font-sans)', letterSpacing: '-.3px', marginBottom: 6 }}>
          Track your progress
        </div>
        <div
          style={{
            font: '600 12.5px/1.6 var(--font-sans)',
            color: 'var(--text-secondary)',
            marginBottom: 18,
          }}
        >
          Set up your profile and Ada will track your streaks, focus hours &amp; mood trends — then tune your plan to
          match.
        </div>

        {/* Guests already own a real (anonymous) session, so the upgrade path is
            sign-up — `linkGuestAccount` keeps every task, streak and subject. */}
        <Button onClick={() => navigate('/signup')} style={{ maxWidth: 320, width: '100%', margin: '0 auto 10px' }}>
          Set up now · 2 min →
        </Button>
        <button
          type="button"
          onClick={() => navigate('/plan')}
          className="focus-ring"
          style={{ font: '600 11.5px var(--font-sans)', color: 'var(--text-secondary)', borderRadius: 4 }}
        >
          Not now
        </button>
      </Modal>
    </>
  );
}
