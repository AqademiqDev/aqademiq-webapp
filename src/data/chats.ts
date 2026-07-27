/* Static mock data — Ada's chats (frames 05.1–05.3). */

import type { CubeExpr } from '../components/brand/AdaCube';
import type { TaskCardProps } from '../components/content/TaskCard';

export interface ChatMessage {
  id: string;
  from: 'ada' | 'user';
  text: string;
  /** Ada's avatar expression for this bubble. */
  expr?: CubeExpr;
  /** Task blocks rendered inside the bubble. */
  tasks?: TaskCardProps[];
}

export interface Chat {
  id: string;
  title: string;
  meta: string;
  messages: ChatMessage[];
}

export const CHATS: Chat[] = [
  {
    id: 'viva-prep-plan',
    title: 'Viva prep plan',
    meta: 'Today · 3 focus blocks added',
    messages: [
      {
        id: 'm1',
        from: 'ada',
        expr: 'happy',
        text: "Hi Ridhwan — I pulled your week. You've a Compiler viva in 3 days and an NLP assignment due Friday.",
      },
      { id: 'm2', from: 'user', text: 'Can you block focus time for the viva prep?' },
      {
        id: 'm3',
        from: 'ada',
        expr: 'focused',
        text: 'Done — three Deep Work blocks this week:',
        tasks: [
          { title: 'Parsing techniques review', time: 'Wed 4:00 PM', dur: '45m', tag: 'CC 401', color: '#6b5cf0', bar: true },
          { title: 'Practice past viva questions', time: 'Thu 10:00 AM', dur: '45m', tag: 'CC 401', color: '#6b5cf0', bar: true },
        ],
      },
    ],
  },
  {
    id: 'this-weeks-overload',
    title: "This week's overload",
    meta: 'Yesterday',
    messages: [
      {
        id: 'm1',
        from: 'ada',
        expr: 'focused',
        text: "You've got four deadlines in five days. I can move the lighter reading to next week if that helps.",
      },
      { id: 'm2', from: 'user', text: 'Yes, push the reading back.' },
    ],
  },
  {
    id: 'break-down-nlp-assignment',
    title: 'Break down NLP assignment',
    meta: 'Mon',
    messages: [
      {
        id: 'm1',
        from: 'ada',
        expr: 'happy',
        text: 'I split Assignment 3 into three 20-minute steps — outline, draft, then sources.',
      },
    ],
  },
  {
    id: 'exam-revision-schedule',
    title: 'Exam revision schedule',
    meta: 'Last week',
    messages: [
      {
        id: 'm1',
        from: 'ada',
        expr: 'smile',
        text: 'Here is a two-week revision run-up with a lighter load the day before each paper.',
      },
    ],
  },
];

/** The chat opened by default when the history pane is shown (05.3). */
export const DEFAULT_CHAT_ID = 'viva-prep-plan';

/** Prompt chips on the intro screen (05.1). */
export const ADA_PROMPTS = ['Plan my week', "I'm overwhelmed", 'Break this down', 'Deadline help'];

/**
 * Canned replies for the composer. The frames are static, so this keeps Ada
 * responsive without inventing an API — README §6 notes the prototype waits
 * ~650ms before the reply lands.
 */
export const ADA_REPLIES: ChatMessage[] = [
  {
    id: 'r1',
    from: 'ada',
    expr: 'focused',
    text: "Got it — I've slotted that into your week and kept your evenings free.",
  },
  {
    id: 'r2',
    from: 'ada',
    expr: 'happy',
    text: 'That fits. I moved your lighter reading so the hard work lands in your peak hours.',
  },
  {
    id: 'r3',
    from: 'ada',
    expr: 'smile',
    text: "Done. Want me to break any of it into smaller steps?",
  },
];

export const chatById = (id?: string) => CHATS.find((c) => c.id === id);
