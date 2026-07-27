import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../../components/core/Button';
import CodeInput from '../../components/core/CodeInput';
import Icon from '../../components/core/Icon';
import { errorMessage } from '../../components/core/Async';
import { useUpdateProfile } from '../../hooks/data';
import { useAuth } from '../../hooks/useAuth';
import { OTP_LENGTH } from '../../lib/validate';

/* Frame 00.4 — Verify email (OTP). Centred, max-width 420, no nav.

   Two ways in:
   • sign-up   — `verifyOtp(type:'signup')`, then the pending display name is
                 written to the profile and the wizard takes over.
   • guest link — the Account panel sends `mode:'link'` after `linkGuestAccount`;
                 the same code is exchanged as an email *change* and the guest
                 keeps every task they already had.

   The frame drew five boxes with a "8 2 4 _ _" preview; Supabase's token is six
   digits, so the run is OTP_LENGTH long, starts empty, and the boxes are sized
   to keep the same overall width. */

interface VerifyState {
  email?: string;
  name?: string;
  mode?: 'signup' | 'link';
}

const RESEND_COOLDOWN = 30;

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { status, email: authEmail, verifySignUpCode, verifyEmailChangeCode, resendSignUpCode, busy } =
    useAuth();
  const updateProfile = useUpdateProfile();

  const passed = (location.state ?? null) as VerifyState | null;
  const email = passed?.email ?? authEmail ?? '';
  const pendingName = passed?.name ?? '';
  const linking = passed?.mode === 'link';

  const [digits, setDigits] = useState<string[]>(() => Array<string>(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [sent, setSent] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const code = digits.join('');

  /* Landing here cold (refresh, deep link) leaves nothing to verify. */
  useEffect(() => {
    if (status !== 'loading' && !email) navigate('/signup', { replace: true });
  }, [status, email, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((n) => n - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  async function verify() {
    if (code.length !== OTP_LENGTH) {
      setError(`Enter the ${OTP_LENGTH}-digit code we sent you.`);
      return;
    }
    setError('');
    setSent('');

    try {
      if (linking) {
        await verifyEmailChangeCode(email, code);
        navigate('/plan', { replace: true });
        return;
      }

      await verifySignUpCode(email, code);
      if (pendingName) {
        // First moment there is a session to write it against.
        try {
          await updateProfile.mutateAsync({ name: pendingName });
        } catch {
          /* non-fatal — the wizard asks for the name again */
        }
      }
      navigate('/setup', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function resend() {
    if (cooldown > 0) return;
    setError('');
    setSent('');

    if (linking) {
      // no endpoint: useAuth exposes no email-change resend — the upgrade form
      // in Account re-issues the code, so send them back to it.
      navigate('/settings/account');
      return;
    }

    try {
      await resendSignUpCode(email);
      setSent('New code sent — check your inbox.');
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  const working = busy || updateProfile.isPending;

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
          We sent a {OTP_LENGTH}-digit code to{' '}
          <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{email}</span>
        </div>

        <CodeInput
          value={digits}
          onChange={(next) => {
            setDigits(next);
            setError('');
          }}
          length={OTP_LENGTH}
          boxWidth={48}
          numeric
          error={!!error}
          label="Digit"
          style={{ marginBottom: error || sent ? 10 : 24 }}
        />

        {error && (
          <div
            role="alert"
            style={{ font: '600 10.5px var(--font-sans)', color: 'var(--aq-danger)', marginBottom: 16 }}
          >
            {error}
          </div>
        )}

        {!error && sent && (
          <div
            role="status"
            style={{ font: '600 10.5px var(--font-sans)', color: 'var(--text-secondary)', marginBottom: 16 }}
          >
            {sent}
          </div>
        )}

        <Button
          onClick={() => void verify()}
          loading={working}
          disabled={working}
          style={{ maxWidth: 300, width: '100%', margin: '0 auto 12px' }}
        >
          Verify &amp; continue
        </Button>

        <div style={{ font: '600 11.5px var(--font-sans)', color: 'var(--text-secondary)' }}>
          Didn&apos;t get it?{' '}
          <button
            type="button"
            onClick={() => void resend()}
            disabled={working || cooldown > 0}
            className="focus-ring"
            style={{
              color: 'var(--accent)',
              fontWeight: 800,
              borderRadius: 4,
              opacity: working || cooldown > 0 ? 0.45 : 1,
              cursor: working || cooldown > 0 ? 'default' : 'pointer',
            }}
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
          </button>
        </div>
      </div>
    </div>
  );
}
