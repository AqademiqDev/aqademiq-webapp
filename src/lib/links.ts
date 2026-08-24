/* Outbound links to the marketing site.

   These lived as string literals inside Profile and as plain <span>s inside
   the onboarding consent copy — the onboarding pair were styled to look like
   links but had no href at all, so the two documents a user is agreeing to
   were unreachable at the exact moment they agreed to them.

   One place to change them, and the paths now match the live site. */

export const LINKS = {
  terms: 'https://www.aqademiq.com/terms-of-use',
  privacy: 'https://www.aqademiq.com/privacy-policy',
  faq: 'https://www.aqademiq.com/faq',
  instagram: 'https://instagram.com/aqademiq',
} as const;

/** Opens in a new tab without handing the target a `window.opener` handle. */
export function openExternal(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}
