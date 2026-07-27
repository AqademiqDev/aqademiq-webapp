/* Runtime configuration, read once from Vite's `import.meta.env`.

   The app talks to two hosts:
   - Supabase Auth (`supabaseUrl`) — sign-up/in, Google OAuth, anonymous guest
     sessions. Handled by `@supabase/supabase-js`.
   - The Edge Function REST API (`apiBaseUrl`) — every `/v1/<resource>` route.
     Same project by default; overridable so a local `supabase functions serve`
     can be pointed at. */

const trimSlashes = (v: string) => v.replace(/\/+$/, '');

const supabaseUrl = trimSlashes(import.meta.env.VITE_SUPABASE_URL ?? '');
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

export const env = {
  supabaseUrl,
  supabaseAnonKey,
  /** REST base — every path in `lib/api` is appended to this. */
  apiBaseUrl: trimSlashes(
    import.meta.env.VITE_API_BASE_URL ?? (supabaseUrl ? `${supabaseUrl}/functions/v1/api/v1` : ''),
  ),
  /** False when the env file is missing — the app then runs in a clearly
      degraded, read-only state rather than throwing on every render. */
  configured: Boolean(supabaseUrl && supabaseAnonKey),
};

if (!env.configured && import.meta.env.DEV) {
  console.warn(
    '[aqademiq] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set. ' +
      'Copy .env.example to .env.local — auth and all data calls will fail until you do.',
  );
}
