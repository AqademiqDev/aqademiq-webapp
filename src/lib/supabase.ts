import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { env } from './env';

/* The single Supabase Auth client.

   Identity only — no table reads go through this. Row data is served by the
   Edge Function API (`lib/api`), which verifies the same access token against
   the project JWKS. Guest mode is Supabase *anonymous* sign-in, so a guest and
   a signed-up user are the same `auth.users` row and keep their data when the
   guest upgrades (`linkGuestAccount` in `hooks/useAuth`). */

/* `createClient` throws "supabaseUrl is required" on an empty string, and it
   runs at module scope — so a deploy that is missing its env vars died on
   import, before React rendered anything, and served a blank page with only a
   cryptic console error. `env.configured` exists precisely so the app can run
   in a visibly degraded state instead; these placeholders keep the module
   importable so it actually can. Every call still fails, but the UI renders and
   `lib/api` reports the real reason. */
const UNCONFIGURED_URL = 'https://unconfigured.invalid';

if (!env.configured) {
  console.error(
    '[aqademiq] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are missing. ' +
      'Auth and every data call will fail until they are set on this deployment.',
  );
}

export const supabase: SupabaseClient = createClient(
  env.supabaseUrl || UNCONFIGURED_URL,
  env.supabaseAnonKey || 'unconfigured',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'aqademiq.auth',
      flowType: 'pkce',
    },
  },
);

/** Current access token, refreshing it first if it is close to expiry. */
export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
