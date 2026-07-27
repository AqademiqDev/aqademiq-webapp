import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdaCube from '../../components/brand/AdaCube';
import Button from '../../components/core/Button';
import Icon from '../../components/core/Icon';
import Input from '../../components/core/Input';
import { useAppState } from '../../hooks/useAppState';
import { isEmail } from '../../lib/validate';

/* Frame 00.3 — Create an account. Two panes, no nav. */

export default function SignUp() {
  const navigate = useNavigate();
  const { set } = useAppState();

  const [fullName, setFullName] = useState('Ridhwan Ahamed');
  const [email, setEmail] = useState('ridhwan@bits.ac.in');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ fullName?: string; email?: string; password?: string }>({});

  function submit() {
    const next: typeof errors = {};
    if (!fullName.trim()) next.fullName = 'Enter your name.';
    if (!email.trim()) next.email = 'Enter your email address.';
    else if (!isEmail(email)) next.email = 'Enter a valid email address.';
    if (!password) next.password = 'Create a password.';
    setErrors(next);
    if (Object.keys(next).length) return;

    set({ name: fullName, email });
    navigate('/verify');
  }

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
            value={fullName}
            error={errors.fullName}
            onChange={(e) => setFullName(e.target.value)}
            wrapperStyle={{ marginBottom: 13 }}
          />
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
            placeholder="Create a password"
            value={password}
            error={errors.password}
            onChange={(e) => setPassword(e.target.value)}
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

          <Button full onClick={submit} style={{ marginBottom: 14 }}>
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
