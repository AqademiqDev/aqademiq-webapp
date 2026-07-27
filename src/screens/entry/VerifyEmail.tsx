import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/core/Button';
import CodeInput from '../../components/core/CodeInput';
import Icon from '../../components/core/Icon';
import { useAppState } from '../../hooks/useAppState';
import { OTP_LENGTH } from '../../lib/validate';

/* Frame 00.4 — Verify email (OTP). Centred, max-width 420, no nav.
   The frame draws "8 2 4 _ _": filled boxes carry an accent border on the
   card ground, the rest stay hairline on the page ground. */

export default function VerifyEmail() {
  const navigate = useNavigate();
  const { email, set } = useAppState();

  const [digits, setDigits] = useState<string[]>(['8', '2', '', '', '']);
  const [error, setError] = useState('');

  const code = digits.join('');

  function verify() {
    if (code.length !== OTP_LENGTH) {
      setError(`Enter the ${OTP_LENGTH}-digit code we sent you.`);
      return;
    }
    set({ guest: false });
    navigate('/setup');
  }

  return (
    <div
      className="aq-screen"
      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div style={{ width: '100%', maxWidth: 420, textAlign: 'center', padding: 20 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'var(--accent-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <Icon name="mark_email_read" size={30} color="var(--accent)" />
        </div>

        <h1 style={{ font: '800 24px var(--font-sans)', letterSpacing: '-.4px', marginBottom: 8 }}>
          Verify your email
        </h1>
        <div
          style={{
            font: '600 12.5px/1.6 var(--font-sans)',
            color: 'var(--text-secondary)',
            marginBottom: 26,
          }}
        >
          We sent a 5-digit code to{' '}
          <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{email}</span>
        </div>

        <CodeInput
          value={digits}
          onChange={(next) => {
            setDigits(next);
            setError('');
          }}
          ghost="4"
          length={OTP_LENGTH}
          numeric
          error={!!error}
          label="Digit"
          style={{ marginBottom: error ? 10 : 24 }}
        />

        {error && (
          <div style={{ font: '600 10.5px var(--font-sans)', color: 'var(--aq-danger)', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <Button onClick={verify} style={{ maxWidth: 300, width: '100%', margin: '0 auto 12px' }}>
          Verify &amp; continue
        </Button>

        <div style={{ font: '600 11.5px var(--font-sans)', color: 'var(--text-secondary)' }}>
          Didn&apos;t get it?{' '}
          <button
            type="button"
            onClick={() => {
              setDigits(Array(OTP_LENGTH).fill(''));
              setError('');
            }}
            className="focus-ring"
            style={{ color: 'var(--accent)', fontWeight: 800, borderRadius: 4 }}
          >
            Resend code
          </button>
        </div>
      </div>
    </div>
  );
}
