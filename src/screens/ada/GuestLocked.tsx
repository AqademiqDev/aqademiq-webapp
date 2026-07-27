import { useNavigate } from 'react-router-dom';
import AdaCube from '../../components/brand/AdaCube';
import LockBadge from '../../components/brand/LockBadge';
import Button from '../../components/core/Button';
import Icon from '../../components/core/Icon';

/* Frame 00b.3 — Locked feature → set up Ada. Centred, max-width 440.

   Ada is the one account-only surface: `/v1/ada/*` is not reachable on an
   anonymous session, so the guest gate in `Ada.tsx` (`useAuth().isGuest`)
   swaps the chat for this screen and the CTA sends them to sign-up. */

const POINTS = ['What & where you study', 'Your deadlines & syllabus', 'When you focus best'];

export default function GuestLocked() {
  const navigate = useNavigate();

  return (
    <main
      className="aq-screen"
      style={{
        flex: 1,
        overflow: 'auto',
        padding: '24px 26px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 20 }}>
          <AdaCube size={84} expr="happy" />
          <LockBadge
            size={28}
            ringColor="var(--surface-page)"
            ringWidth={3}
            style={{ position: 'absolute', bottom: 2, right: -4 }}
          />
        </div>

        <div style={{ font: '800 22px var(--font-sans)', letterSpacing: '-.3px', marginBottom: 8 }}>Meet Ada</div>
        <div
          style={{
            font: '600 12.5px/1.6 var(--font-sans)',
            color: 'var(--text-secondary)',
            marginBottom: 20,
          }}
        >
          Ada builds your week from your real workload. To plan for you, she needs to know what you&apos;re studying.
        </div>

        <div
          style={{
            textAlign: 'left',
            padding: '14px 18px',
            borderRadius: 18,
            background: 'var(--surface-page)',
            marginBottom: 22,
          }}
        >
          {POINTS.map((p, i) => (
            <div
              key={p}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '7px 0',
                borderBottom: i < POINTS.length - 1 ? '1px solid var(--border-hairline)' : undefined,
              }}
            >
              <Icon name="check_circle" size={16} color="var(--accent)" />
              <span style={{ font: '600 12px var(--font-sans)' }}>{p}</span>
            </div>
          ))}
        </div>

        <Button
          onClick={() => navigate('/signup')}
          style={{ maxWidth: 300, width: '100%', margin: '0 auto 10px' }}
        >
          Set up Ada · 2 min →
        </Button>
        <button
          type="button"
          onClick={() => navigate('/plan')}
          className="focus-ring"
          style={{ font: '600 11.5px var(--font-sans)', color: 'var(--text-secondary)', borderRadius: 4 }}
        >
          Maybe later
        </button>
      </div>
    </main>
  );
}
