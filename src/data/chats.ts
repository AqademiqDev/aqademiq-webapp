/* View-model shapes for Ada's chat (frames 05.1–05.3).

   Conversations and messages come from `/v1/ada/*`. Ada's replies are real
   model turns now, so the canned reply table is gone; the prompt chips stay
   because they are UI copy, not data. */

import type { CubeExpr } from '../components/brand/AdaCube';
import type { TaskCardProps } from '../components/content/TaskCard';

export interface ChatMessage {
  id: string;
  from: 'ada' | 'user';
  text: string;
  /** Ada's avatar expression for this bubble. */
  expr?: CubeExpr;
  /** Task blocks rendered inside the bubble — a proposed plan, until applied. */
  tasks?: TaskCardProps[];
  /** Set when the bubble carries a plan the user can add to their calendar. */
  planFooter?: string;
  hasPlan?: boolean;
}

export interface Chat {
  id: string;
  title: string;
  meta: string;
  messages: ChatMessage[];
}

/** Prompt chips on the intro screen (05.1). */
export const ADA_PROMPTS = ['Plan my week', "I'm overwhelmed", 'Break this down', 'Deadline help'];
