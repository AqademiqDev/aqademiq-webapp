/* ─────────────────────────────────────────────────────────────────────────
   GoogleMark — placeholder for the "Continue with Google" vendor mark.

   README §9 Q5 asks for Google's official asset and explicitly says the mark
   must not be recreated by hand; the build brief confirms "use Google's
   official 'Sign in with Google' asset. Do not recreate a vendor mark."
   That asset is not in this bundle, so the frames' own conic-gradient
   placeholder is kept here verbatim.

   To finish: drop Google's official `btn_google_light_normal` SVG/PNG into
   public/assets/ and replace the span below with an <img>. Nothing else
   in the sign-in flow changes. Tracked in BUILD_NOTES.md.
   ───────────────────────────────────────────────────────────────────────── */

export default function GoogleMark({ size = 16 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        background: 'conic-gradient(from -45deg,#ea4335,#fbbc05,#34a853,#4285f4,#ea4335)',
      }}
    />
  );
}
