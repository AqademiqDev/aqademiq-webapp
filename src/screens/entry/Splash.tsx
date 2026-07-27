import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/* Frame 00.1 — Splash. No nav. Auto-advances to Welcome (README §4.3). */

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = window.setTimeout(() => navigate('/welcome', { replace: true }), 1600);
    return () => window.clearTimeout(t);
  }, [navigate]);

  return (
    <div
      className="aq-screen"
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--surface-page)',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <img
          src="/assets/aqademiq-logo.png"
          alt="Aqademiq"
          style={{ width: 124, height: 124, objectFit: 'contain' }}
        />
        <div style={{ font: '800 38px var(--font-sans)', letterSpacing: '-1px', marginTop: 20 }}>
          Aqademiq
        </div>
        <div
          className="h-serif"
          style={{
            fontStyle: 'italic',
            fontSize: 16,
            color: 'var(--text-secondary)',
            marginTop: 8,
          }}
        >
          Your focus sanctuary.
        </div>
        <div style={{ display: 'flex', gap: 7, justifyContent: 'center', marginTop: 30 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)' }} />
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--text-dim)', opacity: 0.45 }} />
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--text-dim)', opacity: 0.45 }} />
        </div>
      </div>
    </div>
  );
}
