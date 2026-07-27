/* Static mock data — subjects, semesters and their files (frames 03.1–03.5). */

export interface SubjectFile {
  icon: string;
  name: string;
  meta: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  credits: number;
  grade: string;
  target: string;
  color: string;
  /** Contrast-safe variant for text/labels where the hue is too light. */
  textColor?: string;
  professor: string;
  /** Row meta, split so the trailing deadline clause takes the subject hue. */
  meta: string;
  metaHighlight: string;
  /** Total files on record — the detail pane lists only the most recent two. */
  fileCount: number;
  files: SubjectFile[];
  /** The Ada nudge shown at the bottom of the detail pane. */
  nudge?: { text: string; action: string };
}

export const SUBJECTS: Subject[] = [
  {
    id: 'cc401',
    code: 'CC 401',
    name: 'Compiler Construction',
    credits: 4,
    grade: 'A',
    target: 'A',
    color: '#6b5cf0',
    professor: 'Prof. S. Rao',
    meta: 'Prof. S. Rao · 3 files',
    metaHighlight: 'Viva · 3 days',
    fileCount: 3,
    files: [
      { icon: 'picture_as_pdf', name: 'Syllabus & grading.pdf', meta: '2 weeks ago · 1.2 MB' },
      { icon: 'description', name: 'Lecture 08 — LL(1).pdf', meta: '3 days ago · 0.8 MB' },
    ],
    nudge: { text: 'Your viva is in 3 days. Want a revision plan?', action: 'Plan it' },
  },
  {
    id: 'nlp302',
    code: 'NLP 302',
    name: 'Natural Language Processing',
    credits: 3,
    grade: 'A−',
    target: 'A',
    color: '#5cbbff',
    textColor: '#3f93d6',
    professor: 'Dr. A. Mehta',
    meta: 'Dr. A. Mehta · 2 files',
    metaHighlight: 'Assignment · Fri',
    fileCount: 2,
    files: [
      { icon: 'picture_as_pdf', name: 'Assignment 3 brief.pdf', meta: '5 days ago · 0.6 MB' },
      { icon: 'description', name: 'Transformer notes.pdf', meta: '1 week ago · 1.1 MB' },
    ],
    nudge: { text: 'Assignment 3 is due Friday. Want me to break it down?', action: 'Plan it' },
  },
  {
    id: 'net305',
    code: 'NET 305',
    name: 'Computer Networks',
    credits: 4,
    grade: 'B+',
    target: 'A−',
    color: '#2a9d6b',
    professor: 'Prof. K. Iyer',
    meta: 'Prof. K. Iyer · 4 files',
    metaHighlight: 'Lab · tomorrow',
    fileCount: 4,
    files: [
      { icon: 'picture_as_pdf', name: 'Lab manual.pdf', meta: '3 weeks ago · 2.4 MB' },
      { icon: 'description', name: 'Routing notes.pdf', meta: '4 days ago · 0.9 MB' },
    ],
    nudge: { text: 'Your lab is tomorrow. Want a prep block?', action: 'Plan it' },
  },
];

export interface Semester {
  id: string;
  name: string;
  subjects: number;
  credits: number;
  gpa: string;
  current?: boolean;
}

export const SEMESTERS: Semester[] = [
  { id: 'sp26', name: "Spring '26", subjects: 3, credits: 11, gpa: '8.7', current: true },
  { id: 'fa25', name: "Fall '25", subjects: 5, credits: 18, gpa: '8.4' },
  { id: 'sp25', name: "Spring '25", subjects: 5, credits: 19, gpa: '8.1' },
];

/** The six colour swatches offered in the add/edit subject sheets. */
export const SUBJECT_SWATCHES = ['#6b5cf0', '#5cbbff', '#2a9d6b', '#e8a430', '#e85476', '#c0497b'];

export const subjectById = (id?: string) => SUBJECTS.find((s) => s.id === id);
