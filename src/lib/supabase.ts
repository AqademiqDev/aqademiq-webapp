import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { env } from './env';

/* The single Supabase Auth client.

   Identity only — no table reads go through this. Row data is served by the
   Edge Function API (`lib/api`), which verifies the same access token against
   the project JWKS. Guest mode is Supabase *anonymous* sign-in, so a guest and
   a signed-up user are the same `auth.users` row and keep their data when the
   guest upgrades (`linkGuestAccount` in `hooks/useAuth`). */

export const supabase: SupabaseClient = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'aqademiq.auth',
    flowType: 'pkce',
  },
});

/** Current access token, refreshing it first if it is close to expiry. */
export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
