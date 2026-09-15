import { createContext, useContext } from 'react';

/* One number that sizes the whole story.

   The mobile beats are laid out for a ~390pt-wide phone with ~700pt of usable
   height. Rather than re-deciding every size for a laptop — and drifting from
   the phone's proportions, which is where line breaks and the one-screenful
   rule come from — the web multiplies each of those values by a single factor
   derived from the height actually available. The report reads the same, just
   larger or smaller; nothing reflows into a different composition. */

/** Mobile beat sizes, in phone points. Multiply by the scale. */
export const BeatSize = {
  label: 9.5,
  statement: 27,
  body: 13.5,
  numeral: 128,
  coreWidth: 128,
  coreHeight: 330,
  cube: 44,
  /** The phone's width; the story column is this many points wide. */
  column: 390,
  /** The phone beat's horizontal padding. */
  gutter: 26,
} as const;

/** Height that maps to a scale of 1. A little under the phone's, so a laptop gets a touch larger. */
const BASE_HEIGHT = 600;

export function scaleFor(availableHeight: number): number {
  if (!Number.isFinite(availableHeight) || availableHeight <= 0) return 1;
  return Math.min(1.35, Math.max(0.9, availableHeight / BASE_HEIGHT));
}

export const StoryScaleContext = createContext(1);

export const useStoryScale = () => useContext(StoryScaleContext);
