import { useEffect, useState } from 'react';

import Button from '../../components/core/Button';
import CodeInput from '../../components/core/CodeInput';
import Icon from '../../components/core/Icon';
import Input from '../../components/core/Input';
import Modal from '../../components/overlay/Modal';
import { errorMessage } from '../../components/core/Async';
import { useAuth } from '../../hooks/useAuth';
import { isEmail, isPassword, MIN_PASSWORD, OTP_LENGTH } from '../../lib/validate';

/* Password recovery from the sign-in pane.

   `useAuth` has exposed `requestPasswordReset` / `resetPassword` since the
   Supabase replatform, but nothing ever called them — the Welcome screen had no
   "Forgot password?" control at all, so the only way to change a password was
   Settings → Profile & Account, which needs a session you cannot get.

   Two steps, matching the sign-up flow's shape:
     email  — `resetPasswordForEmail`, which sends the 6-digit recovery OTP
     reset  — `verifyOtp(type:'recovery')` + `updateUser({password})`

   Verifying a recovery OTP signs the user in, so a success here lands straight
   on the plan rather than bouncing back to the form. */

const RESEND_COOLDOWN = 30;

export default function ForgotPassword({
  open,
  onClose,
  onDone,
  initialEmail = '',
}: {
  open: boolean;
  onClose: () => void;
  /** Fired once the password is changed and the recovery session is live. */
  onDone: () => void;
  initialEmail?: string;
}) {
  const { requestPasswordReset, resetPassword, busy } = useAuth();

  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState(initialEmail);
  const [digits, setDigits] = useState<string[]>(() => Array<string>(OTP_LENGTH).fill(''));
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const code = digits.join('');

  useEffect(() => {
    if (!open) return;
    setStep('email');
    setEmail(initialEmail);
    setDigits(Array<string>(OTP_LENGTH).fill(''));
    setPassword('');
    setConfirm('');
    setShowPassword(false);
    setError('');
    setNotice('');
    setCooldown(0);
  }, [open, initialEmail]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((n) => n - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  async function send() {
    if (!isEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setError('');
    try {
      await requestPasswordReset(email);
      setStep('reset');
      setNotice(`We sent a ${OTP_LENGTH}-digit code to ${email.trim()}.`);
      setCooldown(RESEND_COOLDOWN);
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function resend() {
    if (cooldown > 0) return;
    setError('');
    try {
      await requestPasswordReset(email);
      setNotice('New code sent — check your inbox.');
      setCooldown(RESEND_COOLDOWN);
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function submit() {
    if (code.length !== OTP_LENGTH) {
      setError(`Enter the ${OTP_LENGTH}-digit code we sent you.`);
      return;
    }
    if (!isPassword(password)) {
      setError(`Use at least ${MIN_PASSWORD} characters for your new password.`);
      return;
    }
    if (password !== confirm) {
      setError('The two passwords don’t match.');
      return;
    }
    setError('');
    setNotice('');
    try {
      await resetPassword(email, code, password);
      onDone();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={step === 'email' ? 'Reset your password' : 'Choose a new password'}
      maxWidth={440}
      panelStyle={{ padding: '24px 26px' }}
    >
      {step === 'email' ? (
        <>
          <div
            style={{
              font: '600 12px/1.6 var(--font-sans)',
              color: 'var(--text-secondary)',
              marginTop: -6,
              marginBottom: 18,
            }}
          >
            Tell us the email on your account and we&apos;ll send you a {OTP_LENGTH}-digit code to
            set a new password.
          </div>

          <Input
            label="EMAIL"
            type="email"
            autoComplete="email"
            value={email}
            focusedStyle
            error={error}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void send();
            }}
            wrapperStyle={{ marginBottom: 22 }}
          />

          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="ghost" onClick={onClose} disabled={busy} style={{ padding: '0 22px' }}>
              Cancel
            </Button>
            <Button onClick={() => void send()} loading={busy} style={{ flex: 1 }}>
              Send reset code
            </Button>
          </div>
        </>
      ) : (
        <>
          {notice && (
            <div
              role="status"
              style={{
                font: '600 11.5px/1.6 var(--font-sans)',
                color: 'var(--text-secondary)',
                marginTop: -6,
                marginBottom: 16,
              }}
            >
              {notice}
            </div>
          )}

          <CodeInput
            value={digits}
            onChange={(next) => {
              setDigits(next);
              setError('');
            }}
            length={OTP_LENGTH}
            boxWidth={44}
            boxHeight={54}
            fontSize={22}
            numeric
            error={!!error && code.length !== OTP_LENGTH}
            label="Digit"
            style={{ marginBottom: 18 }}
          />

          <Input
            label="NEW PASSWORD"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder={`At least ${MIN_PASSWORD} characters`}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            wrapperStyle={{ marginBottom: 13 }}
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="focus-ring"
                style={{ display: 'flex', borderRadius: 6 }}
              >
                <Icon
                  name={showPassword ? 'visibility' : 'visibility_off'}
                  size={17}
                  color="var(--text-dim)"
                />
              </button>
            }
          />

          <Input
            label="CONFIRM NEW PASSWORD"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Re-enter new password"
            value={confirm}
            error={error}
            onChange={(e) => {
              setConfirm(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void submit();
            }}
            wrapperStyle={{ marginBottom: 20 }}
          />

          <Button full onClick={() => void submit()} loading={busy} style={{ marginBottom: 12 }}>
            Reset password
          </Button>

          <div
            style={{
              textAlign: 'center',
              font: '600 11.5px var(--font-sans)',
              color: 'var(--text-secondary)',
            }}
          >
            Didn&apos;t get it?{' '}
            <button
              type="button"
              onClick={() => void resend()}
              disabled={busy || cooldown > 0}
              className="focus-ring"
              style={{
                color: 'var(--accent)',
                fontWeight: 800,
                borderRadius: 4,
                opacity: busy || cooldown > 0 ? 0.45 : 1,
                cursor: busy || cooldown > 0 ? 'default' : 'pointer',
              }}
            >
              {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
