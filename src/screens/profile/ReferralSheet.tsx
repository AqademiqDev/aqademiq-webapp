import Icon from '../../components/core/Icon';
import Modal from '../../components/overlay/Modal';
import { EyebrowLabel } from '../../components/core/Misc';
import { REFERRAL_CODE } from '../../components/content/InviteHero';
import { useAppState } from '../../hooks/useAppState';

/* Frame 06.2 — Referral sheet. Modal, max-width 420, padding 26, centred. */

export default function ReferralSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { name } = useAppState();

  return (
    <Modal
      open={open}
      onClose={onClose}
      hideClose
      maxWidth={420}
      padding={26}
      panelStyle={{ textAlign: 'center' }}
      aria-label="Share your invite"
    >
      <div
        style={{
          position: 'relative',
          borderRadius: 20,
          overflow: 'hidden',
          background: 'var(--aq-gradient-invite)',
          padding: 22,
          marginBottom: 18,
          boxShadow: 'var(--shadow-accent)',
        }}
      >
        <div
          style={{ position: 'absolute', inset: 0, borderRadius: 20, boxShadow: 'var(--ring-inset)' }}
          aria-hidden="true"
        />
        <img
          src="/assets/aqademiq-logo.png"
          alt=""
          style={{ width: 52, height: 52, objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,.18))' }}
        />
        <div className="h-serif" style={{ fontSize: 20, color: '#fff', marginTop: 4 }}>
          Aqademiq
        </div>
        <div style={{ font: '700 11px var(--font-sans)', color: 'rgba(255,255,255,.9)', marginTop: 4 }}>
          Invite by {name}
        </div>
      </div>

      <div className="h-serif" style={{ fontSize: 20, marginBottom: 6 }}>
        Help us grow!
      </div>
      <div style={{ font: '600 12px/1.5 var(--font-sans)', color: 'var(--text-secondary)', marginBottom: 16 }}>
        Share your code with friends and help us reach more students.
      </div>

      <EyebrowLabel style={{ marginBottom: 9 }}>YOUR REFERRAL CODE</EyebrowLabel>
      <div style={{ display: 'flex', gap: 7, justifyContent: 'center', marginBottom: 18 }}>
        {REFERRAL_CODE.map((ch, i) => (
          <div
            key={i}
            style={{
              width: 40,
              height: 46,
              borderRadius: 11,
              background: 'var(--surface-page)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              fontSize: 20,
              boxShadow: 'inset 0 0 0 1px var(--border-hairline)',
            }}
          >
            {ch}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="aq-press focus-ring"
        style={{
          width: '100%',
          height: 46,
          borderRadius: 100,
          background: 'linear-gradient(120deg,var(--accent),#9f8bef)',
          boxShadow: '0 6px 20px rgba(107,92,240,.35)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 9,
          font: '800 13px var(--font-sans)',
        }}
      >
        <Icon name="ios_share" size={18} />
        Share invite
      </button>
    </Modal>
  );
}
