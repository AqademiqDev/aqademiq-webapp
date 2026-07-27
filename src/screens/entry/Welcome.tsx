import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdaCube from '../../components/brand/AdaCube';
import GoogleMark from '../../components/brand/GoogleMark';
import Button from '../../components/core/Button';
import Icon from '../../components/core/Icon';
import Input from '../../components/core/Input';
import { useAppState } from '../../hooks/useAppState';
import { isEmail } from '../../lib/validate';

/* Frames 00.2 — Welcome (sign in / guest). Two equal panes, no nav.
   /signin renders the same screen; the right pane is the sign-in form. */

export default function Welcome() {
  const navigate = useNavigate();
  const { set } = useAppState();

  const [email, setEmail] = useState('ridhwan@bits.ac.in');
  const [password, setPassword] = useState('password');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function signIn() {
    const next: typeof errors = {};
    if (!email.trim()) next.email = 'Enter your email address.';
    else if (!isEmail(email)) next.email = 'Enter a valid email address.';
    if (!password) next.password = 'Enter your password.';
    setErrors(next);
    if (Object.keys(next).length) return;

    // Returning user → straight to the plan (README §4.3).
    set({ guest: false, onboarded: true, email });
    navigate('/plan');
  }

  function jumpIn() {
    set({ guest: true, onboarded: false });
    navigate('/plan');
  }

  return (
    <div className="aq-screen" style={{ flex: 1, display: 'flex', flexDirection: 'row', minHeight: 0 }}>
      {/* Left — brand pane on the page ground */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: 40,
          gap: 18,
          position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', top: 26, left: 30, display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/assets/aqademiq-logo.png" alt="" style={{ width: 26, height: 26, objectFit: 'contain' }} />
          <span style={{ font: '800 16px var(--font-sans)', letterSpacing: '-.3px' }}>Aqademiq</span>
        </div>

        <AdaCube size={126} expr="happy" sparkles cheeks />

        <div className="h-serif" style={{ fontSize: 38, lineHeight: 1.05 }}>
          Welcome to
          <br />
          Aqademiq
        </div>
        <div className="h-serif" style={{ fontStyle: 'italic', fontSize: 16, color: 'var(--text-secondary)' }}>
          Your focus sanctuary.
        </div>
      </div>

      {/* Right — form pane on the card ground */}
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
          <div style={{ font: '800 22px var(--font-sans)', letterSpacing: '-.3px', marginBottom: 6 }}>
            Sign in or create an account
          </div>
          <div style={{ font: '600 12.5px var(--font-sans)', color: 'var(--text-secondary)', marginBottom: 24 }}>
            Plan your subjects, focus, and let Ada build your week.
          </div>

          <Input
            label="EMAIL"
            type="email"
            value={email}
            error={errors.email}
            onChange={(e) => setEmail(e.target.value)}
            wrapperStyle={{ marginBottom: 13 }}
          />

          <Input
            label="PASSWORD"
            type={showPassword ? 'text' : 'password'}
            value={password}
            error={errors.password}
            onChange={(e) => setPassword(e.target.value)}
            wrapperStyle={{ marginBottom: 18 }}
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

          <Button full onClick={signIn} style={{ marginBottom: 12 }}>
            Sign in / Sign up
          </Button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '6px 0 14px' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border-hairline)' }} />
            <span style={{ font: '700 10px var(--font-sans)', color: 'var(--text-dim)' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-hairline)' }} />
          </div>

          <Button variant="ghost" full onClick={signIn} style={{ marginBottom: 9 }}>
            <GoogleMark />
            Continue with Google
          </Button>

          <Button variant="soft" full onClick={jumpIn} trailingIcon="arrow_forward" iconSize={16} style={{ height: 44, marginBottom: 16 }}>
            Jump right in!
          </Button>

          <div style={{ textAlign: 'center', font: '600 10.5px/1.5 var(--font-sans)', color: 'var(--text-dim)' }}>
            Jumping in as a guest? Your progress saves the moment you create an account.
          </div>

          <div
            style={{
              textAlign: 'center',
              font: '600 11px var(--font-sans)',
              color: 'var(--text-secondary)',
              marginTop: 14,
            }}
          >
            New here?{' '}
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="focus-ring"
              style={{ color: 'var(--accent)', font: '800 11px var(--font-sans)', borderRadius: 4 }}
            >
              Create an account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
