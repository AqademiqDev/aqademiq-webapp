import { useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import AdaCube from '../../components/brand/AdaCube';
import Button from '../../components/core/Button';
import Icon from '../../components/core/Icon';
import Input from '../../components/core/Input';
import { errorMessage } from '../../components/core/Async';
import { useUpdateProfile } from '../../hooks/data';
import { useAuth } from '../../hooks/useAuth';
import { isEmail, isPassword, MIN_PASSWORD } from '../../lib/validate';

/* Frame 00.3 — Create an account. Two panes, no nav.

   Supabase Auth owns the account; the display name is not part of sign-up, so
   it rides along in router state and is written to the profile once there is a
   session (either right here, or after the code screen).

   A **guest** reaching this screen is upgrading, not registering: guest mode is
   an anonymous Supabase user, so attaching the email to that same user id keeps
   every task, subject and streak they built while exploring. Registering afresh
   would silently orphan all of it, so the guest path goes through
   `linkGuestAccount` instead. The screen looks identical either way. */

export default function SignUp() {
  const navigate = useNavigate();
  const { signUp, linkGuestAccount, isGuest, busy } = useAuth();
  const updateProfile = useUpdateProfile();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ fullName?: string; email?: string; password?: string }>({});
  const [formError, setFormError] = useState('');

  async function submit() {
    const next: typeof errors = {};
    if (!fullName.trim()) next.fullName = 'Enter your name.';
    if (!email.trim()) next.email = 'Enter your email address.';
    else if (!isEmail(email)) next.email = 'Enter a valid email address.';
    if (!password) next.password = 'Create a password.';
    else if (!isPassword(password)) next.password = `Use at least ${MIN_PASSWORD} characters.`;
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;

    try {
      // Guests keep their user id (and therefore their data); everyone else
      // gets a fresh account.
      const { needsVerification } = isGuest
        ? await linkGuestAccount(email, password)
        : await signUp(email, password);

      if (needsVerification) {
        // No confirmed identity yet — the name has to survive the trip to the
        // code screen, and the screen needs to know which token type to verify.
        navigate('/verify', {
          state: { email: email.trim(), name: fullName.trim(), mode: isGuest ? 'link' : 'signup' },
        });
        return;
      }

      // Confirmation is off on this project: already signed in, so the name can
      // be written straight away. A failed write is not worth blocking the
      // wizard for — the setup flow asks for the name again.
      try {
        await updateProfile.mutateAsync({ name: fullName.trim() });
      } catch {
        /* non-fatal */
      }
      // An upgraded guest has already been through setup — send them back to
      // the plan they were building rather than round the wizard again.
      navigate(isGuest ? '/plan' : '/setup', { replace: true });
    } catch (err) {
      const message = errorMessage(err);
      if (/already exists|already registered/i.test(message)) setErrors({ email: message });
      else setFormError(message);
    }
  }

  function onFieldKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') void submit();
  }

  const pending = busy || updateProfile.isPending;

  return (
    <div className="aq-screen" style={{ flex: 1, display: 'flex', flexDirection: 'row', minHeight: 0 }}>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: 40,
          gap: 16,
          background: 'var(--accent-soft)',
        }}
      >
        <AdaCube size={110} expr="happy" cheeks />
        <div className="h-serif" style={{ fontSize: 30, lineHeight: 1.1 }}>
          A calmer way
          <br />
          to study.
        </div>
        <div
          style={{
            font: '600 12.5px/1.6 var(--font-sans)',
            color: 'var(--text-secondary)',
            maxWidth: 280,
          }}
        >
          Ada turns your real workload into a plan you can actually keep.
        </div>
      </div>

      <div
        className="aq-scroll"
        style={{
          flex: 1,
          background: 'var(--surface-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 40,
          overflow: 'auto',
        }}
      >
        <div style={{ width: '100%', maxWidth: 340 }}>
          <div style={{ font: '800 22px var(--font-sans)', letterSpacing: '-.3px', marginBottom: 20 }}>
            Create your account
          </div>

          <Input
            label="FULL NAME"
            autoComplete="name"
            value={fullName}
            error={errors.fullName}
            onChange={(e) => setFullName(e.target.value)}
            onKeyDown={onFieldKeyDown}
            wrapperStyle={{ marginBottom: 13 }}
          />
          <Input
            label="EMAIL"
            type="email"
            autoComplete="email"
            value={email}
            error={errors.email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={onFieldKeyDown}
            wrapperStyle={{ marginBottom: 13 }}
          />
          <Input
            label="PASSWORD"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a password"
            autoComplete="new-password"
            value={password}
            error={errors.password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={onFieldKeyDown}
            wrapperStyle={{ marginBottom: 20 }}
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="focus-ring"
                style={{ display: 'flex', borderRadius: 6 }}
              >
                <Icon name={showPassword ? 'visibility' : 'visibility_off'} size={17} color="var(--text-dim)" />
              </button>
            }
          />

          {formError && (
            <div
              role="alert"
              style={{
                font: '600 10.5px/1.5 var(--font-sans)',
                color: 'var(--aq-danger)',
                marginBottom: 12,
              }}
            >
              {formError}
            </div>
          )}

          <Button
            full
            onClick={() => void submit()}
            loading={pending}
            disabled={pending}
            style={{ marginBottom: 14 }}
          >
            Create account
          </Button>

          <div style={{ textAlign: 'center', font: '600 11.5px var(--font-sans)', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/signin')}
              className="focus-ring"
              style={{ color: 'var(--accent)', fontWeight: 800, borderRadius: 4 }}
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
