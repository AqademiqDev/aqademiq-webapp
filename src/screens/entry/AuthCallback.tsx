import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import Button from '../../components/core/Button';
import Icon from '../../components/core/Icon';
import { Loading } from '../../components/core/Async';
import { useAuth } from '../../hooks/useAuth';

/* Landing pad for the Google OAuth redirect.

   Google used to come back to `/plan`, which is wrong twice over:

   • `/plan` sits behind `RequireSession`. The PKCE exchange is asynchronous, so
     the guard could resolve "signed out" and `Navigate` away — taking the
     `?code=` in the URL with it — before the session existed.
   • When Supabase refuses the sign-in it appends `?error=…&error_description=…`
     instead of a code. Nothing on `/plan` reads those, so a failed sign-in
     looked like a silent no-op: the button spun, the page returned, and the
     user was still signed out with nothing to explain why.

   This screen owns that moment: it holds still while `detectSessionInUrl`
   finishes the exchange, then routes on — and if the provider sent an error, it
   says so instead of swallowing it.

   NOTE: the URL below must be listed under Authentication → URL Configuration →
   Redirect URLs in Supabase, for every origin the app is served from. */

export default function AuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { status } = useAuth();
  const [tooSlow, setTooSlow] = useState(false);

  // Supabase reports provider failures on the query string, and (for implicit
  // responses) in the hash. Read both so nothing is lost.
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const failure =
    params.get('error_description') ??
    params.get('error') ??
    hash.get('error_description') ??
    hash.get('error');

  useEffect(() => {
    if (failure) return;
    if (status === 'signed-in' || status === 'guest') {
      navigate('/plan', { replace: true });
    } else if (status === 'signed-out') {
      // The exchange has settled and left no session — treat as a failed round
      // trip rather than looping back into the provider.
      setTooSlow(true);
    }
  }, [status, failure, navigate]);

  if (!failure && !tooSlow) return <Loading label="Finishing sign-in…" padding={80} />;

  const message = failure
    ? failure.replace(/\+/g, ' ')
    : 'That sign-in did not complete. Please try again.';

  return (
    <div
      className="aq-screen"
      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div style={{ width: '100%', maxWidth: 380, textAlign: 'center', padding: 20 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: '#e8547618',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <Icon name="block" size={26} color="#e85476" />
        </div>

        <div style={{ font: '800 19px var(--font-sans)', letterSpacing: '-.3px', marginBottom: 8 }}>
          Couldn&apos;t sign you in
        </div>
        <div
          role="alert"
          style={{
            font: '600 12.5px/1.6 var(--font-sans)',
            color: 'var(--text-secondary)',
            marginBottom: 22,
          }}
        >
          {message}
        </div>

        <Button full onClick={() => navigate('/welcome', { replace: true })}>
          Back to sign in
        </Button>
      </div>
    </div>
  );
}
