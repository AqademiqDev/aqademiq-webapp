/* View-model shapes for the feedback board (frames 06b.1–06b.5).

   Posts, votes, comments and the roadmap lanes come from `/v1/feedback/*`.
   The status/type styling tables stay — they are design tokens, not data — and
   the wire keys are mapped onto them by the board screens. */

export type SuggestionStatus = 'Under review' | 'Planned' | 'In progress' | 'Shipped' | 'Declined';
export type SuggestionType = 'Feature' | 'Improvement' | 'Bug';

/** Status hues (README §2.14). Chip fills are the hue at 18 alpha. */
export const STATUS_STYLE: Record<SuggestionStatus, { dot: string; text: string }> = {
  'Under review': { dot: '#7a8699', text: '#5f6b7e' },
  Planned: { dot: '#6b5cf0', text: '#6b5cf0' },
  'In progress': { dot: '#e8a430', text: '#b9791a' },
  Shipped: { dot: '#2a9d6b', text: '#22855a' },
  Declined: { dot: '#9aa3b2', text: '#9aa3b2' },
};

export const TYPE_ICON: Record<SuggestionType, string> = {
  Feature: 'lightbulb',
  Improvement: 'tune',
  Bug: 'bug_report',
};

/** Wire `status.key` → the label the frames draw. */
export const STATUS_BY_KEY: Record<string, SuggestionStatus> = {
  under_review: 'Under review',
  planned: 'Planned',
  in_progress: 'In progress',
  shipped: 'Shipped',
  declined: 'Declined',
};

/** Wire `category` → the frames' three type icons. */
export const TYPE_BY_KEY: Record<string, SuggestionType> = {
  feature: 'Feature',
  improvement: 'Improvement',
  bug: 'Bug',
};

export interface SuggestionComment {
  author: string;
  initial: string;
  when: string;
  body: string;
}

export interface Suggestion {
  id: string;
  title: string;
  votes: number;
  voted?: boolean;
  type: SuggestionType;
  comments: number;
  status: SuggestionStatus;
  body?: string;
  thread?: SuggestionComment[];
  /** Detail-view metadata (frame 06b.4). */
  number?: number;
  author?: string;
  authorInitial?: string;
  age?: string;
  /** The detail view labels an under-review item "Open", as 06b.4 draws it. */
  statusLabel?: string;
}

/** The board's lanes (frame 06b.2). */
export interface BoardCard {
  title: string;
  type: SuggestionType;
  votes: number;
  id?: string;
}

export interface BoardLane {
  name: string;
  status: SuggestionStatus | 'Open';
  dot: string;
  cards: BoardCard[];
}
