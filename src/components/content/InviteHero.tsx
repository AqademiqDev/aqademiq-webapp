import Icon from '../core/Icon';
import { useReferralBalance } from '../../hooks/data';

/* Invite hero (README §2.18) — the only gradient in the product, frame 06.1.

   The code comes from `/referrals/rewards/balance`, which mints one on first
   read. Real codes are 8 hex characters where the frame drew 5, so the tiles
   shrink past 6 characters to keep the row on one line. */

export default function InviteHero({ onShare }: { onShare: () => void }) {
  const balance = useReferralBalance();
  const code = balance.data?.code ?? '';
  const chars = code ? [...code] : ['', '', '', '', ''];
  const tileWidth = chars.length > 6 ? 30 : 38;
  const tileFont = chars.length > 6 ? 16 : 20;

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 22,
        overflow: 'hidden',
        background: 'var(--aq-gradient-invite)',
        padding: '26px 24px',
        textAlign: 'center',
        boxShadow: 'var(--shadow-accent)',
      }}
    >
      <div
        style={{ position: 'absolute', inset: 0, borderRadius: 22, boxShadow: 'var(--ring-inset)' }}
        aria-hidden="true"
      />
      <img
        src="/assets/aqademiq-logo.png"
        alt=""
        style={{ width: 54, height: 54, objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,.18))' }}
      />
      <div className="h-serif" style={{ fontSize: 22, color: '#fff', marginTop: 6 }}>
        Help us grow!
      </div>
      <div
        style={{
          font: '600 12px/1.5 var(--font-sans)',
          color: 'rgba(255,255,255,.92)',
          margin: '8px 0 16px',
        }}
      >
        Share your code with friends. It means the world to us.
      </div>

      <div style={{ display: 'flex', gap: 7, justifyContent: 'center', marginBottom: 16 }}>
        {chars.map((ch, i) => (
          <div
            key={i}
            style={{
              width: tileWidth,
              height: 44,
              borderRadius: 11,
              background: 'rgba(255,255,255,.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              fontSize: tileFont,
              color: '#3a2c66',
              // Empty tiles while the code loads — the row keeps its geometry
              // rather than collapsing and popping back.
              opacity: ch ? 1 : 0.55,
            }}
          >
            {ch}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onShare}
        disabled={!code}
        className="aq-press focus-ring"
        style={{
          width: '100%',
          height: 46,
          borderRadius: 100,
          background: 'rgba(255,255,255,.16)',
          border: '1.5px solid rgba(255,255,255,.5)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 9,
          font: '800 13px var(--font-sans)',
          position: 'relative',
        }}
      >
        <Icon name="ios_share" size={18} />
        Share invite
      </button>
    </div>
  );
}
