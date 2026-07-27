/* Static mock data — the feedback board (frames 06b.1–06b.5). */

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

export const SUGGESTIONS: Suggestion[] = [
  {
    id: 'amazing-app',
    number: 3,
    title: 'Amazing app',
    votes: 1,
    voted: true,
    type: 'Feature',
    comments: 1,
    status: 'Under review',
    statusLabel: 'Open',
    author: 'Zayaan Ali',
    authorInitial: 'Z',
    age: '14m ago',
    body: 'This app changed my life. What an app! Great app! No more procrastination!!',
    thread: [
      { author: 'Ridhwan Ahamed', initial: 'R', when: '6m ago', body: 'Agreed!' },
    ],
  },
  {
    id: 'sync-google-calendar',
    title: 'Sync deadlines from Google Calendar',
    votes: 142,
    voted: true,
    type: 'Feature',
    comments: 18,
    status: 'Planned',
    body: "Auto-import assignment due dates so I don't re-enter them each week — one less thing to forget.",
    thread: [
      {
        author: 'Aarav K.',
        initial: 'A',
        when: '2 days ago',
        body: 'This would save me so much time at the start of every term.',
      },
      {
        author: 'Meera S.',
        initial: 'M',
        when: '5 days ago',
        body: 'Two-way sync would be even better — push my focus blocks back to Calendar.',
      },
    ],
  },
  {
    id: 'dark-mode-focus-timer',
    title: 'Dark mode for the focus timer',
    votes: 98,
    type: 'Improvement',
    comments: 9,
    status: 'In progress',
    body: 'Late-night sessions are hard on the eyes. A darker focus screen would help a lot.',
  },
  {
    id: 'ipad-landscape',
    title: 'iPad landscape layout',
    votes: 88,
    type: 'Feature',
    comments: 21,
    status: 'Shipped',
    body: 'Using Aqademiq on an iPad in landscape wastes half the screen.',
  },
  {
    id: 'export-notes-pdf',
    title: 'Export my notes as PDF',
    votes: 76,
    type: 'Feature',
    comments: 6,
    status: 'Under review',
    body: 'I want to print my revision notes before an exam.',
  },
  {
    id: 'recurring-tasks',
    title: 'Recurring tasks in Plan',
    votes: 61,
    type: 'Feature',
    comments: 4,
    status: 'Planned',
    body: 'Weekly labs and tutorials repeat — I should only add them once.',
  },
];

/** The board's five lanes (frame 06b.2). */
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

export const BOARD_LANES: BoardLane[] = [
  {
    name: 'Open',
    status: 'Open',
    dot: '#7a8699',
    cards: [
      { id: 'export-notes-pdf', title: 'Export my notes as PDF', type: 'Feature', votes: 76 },
      { title: 'Add LaTeX support in notes', type: 'Feature', votes: 44 },
      { title: 'Weekly email summary', type: 'Improvement', votes: 29 },
    ],
  },
  {
    name: 'Planned',
    status: 'Planned',
    dot: '#6b5cf0',
    cards: [
      { id: 'sync-google-calendar', title: 'Sync deadlines from Google Calendar', type: 'Feature', votes: 142 },
      { id: 'recurring-tasks', title: 'Recurring tasks in Plan', type: 'Feature', votes: 61 },
    ],
  },
  {
    name: 'In progress',
    status: 'In progress',
    dot: '#e8a430',
    cards: [{ id: 'dark-mode-focus-timer', title: 'Dark mode for the focus timer', type: 'Improvement', votes: 98 }],
  },
  {
    name: 'Shipped',
    status: 'Shipped',
    dot: '#2a9d6b',
    cards: [
      { id: 'ipad-landscape', title: 'iPad landscape layout', type: 'Feature', votes: 88 },
      { title: 'Pomodoro auto-start next session', type: 'Improvement', votes: 54 },
    ],
  },
  {
    name: 'Declined',
    status: 'Declined',
    dot: '#9aa3b2',
    cards: [{ title: 'Built-in music player', type: 'Feature', votes: 12 }],
  },
];

export const suggestionById = (id?: string) => SUGGESTIONS.find((s) => s.id === id);
