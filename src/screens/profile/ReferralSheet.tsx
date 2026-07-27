import { useState } from 'react';

import Icon from '../../components/core/Icon';
import Modal from '../../components/overlay/Modal';
import { EyebrowLabel } from '../../components/core/Misc';
import { ErrorState, Loading } from '../../components/core/Async';
import { useProfile, useReferralBalance } from '../../hooks/data';

/* Frame 06.2 — Referral sheet. Modal, max-width 420, padding 26, centred.

   The code comes from GET /referrals/rewards/balance, which mints one on first
   read. Redeeming somebody else's code is not offered here — that belongs to
   the onboarding referral step (POST /referrals/validate + /referrals/redeem). */

/** Server codes are 8 hex characters; the tiles shrink so the row still fits. */
const boxWidthFor = (len: number) => (len > 6 ? 36 : 40);

export default function ReferralSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
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
      {/* Body lives in its own component so the balance query — which mints the
          code on first read — only fires once the sheet is actually opened. */}
      <SheetBody onClose={onClose} />
    </Modal>
  );
}

function SheetBody({ onClose }: { onClose: () => void }) {
  const profile = useProfile();
  const balance = useReferralBalance();

  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  const name = profile.data?.name?.trim() || 'a friend';
  const code = balance.data?.code ?? '';
  const redemptions = balance.data?.redemptions ?? 0;
  const points = balance.data?.balance ?? 0;
  const boxWidth = boxWidthFor(code.length);

  const share = async () => {
    if (!code) return;
    setCopyError(null);

    const text = `Join me on Aqademiq — my invite code is ${code}`;
    const nav = navigator as Navigator & {
      share?: (data: { title?: string; text?: string }) => Promise<void>;
    };

    if (typeof nav.share === 'function') {
      try {
        await nav.share({ title: 'Aqademiq', text });
        onClose();
        return;
      } catch {
        /* sheet dismissed or unavailable — fall through to the clipboard */
      }
    }

    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
        onClose();
      }, 1000);
    } catch {
      setCopyError('Copying is blocked here — the code above can be typed in by hand.');
    }
  };

  return (
    <>
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

      {balance.isLoading ? (
        <Loading padding={14} label="Getting your code…" />
      ) : balance.isError ? (
        <ErrorState error={balance.error} onRetry={balance.refetch} padding={14} />
      ) : (
        <>
          <div style={{ display: 'flex', gap: 7, justifyContent: 'center', marginBottom: 10 }}>
            {code.split('').map((ch, i) => (
              <div
                key={i}
                style={{
                  width: boxWidth,
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
          {/* Both numbers are real; they stay at 0 for everyone until the reward
              ledger ships, so nothing here is invented. */}
          <div
            style={{
              font: '600 11px var(--font-sans)',
              color: 'var(--text-dim)',
              marginBottom: 18,
            }}
          >
            {redemptions === 0
              ? 'No one has used your code yet.'
              : `${redemptions} ${redemptions === 1 ? 'friend has' : 'friends have'} used your code` +
                (points > 0 ? ` · ${points} points` : '')}
          </div>
        </>
      )}

      {copyError && (
        <div
          style={{
            font: '700 11.5px/1.5 var(--font-sans)',
            color: 'var(--aq-danger)',
            marginBottom: 12,
          }}
        >
          {copyError}
        </div>
      )}

      <button
        type="button"
        onClick={share}
        disabled={!code}
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
          opacity: code ? 1 : 0.45,
        }}
      >
        <Icon name={copied ? 'check' : 'ios_share'} size={18} />
        {copied ? 'Code copied' : 'Share invite'}
      </button>
    </>
  );
}
