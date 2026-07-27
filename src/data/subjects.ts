/* View-model shapes for subjects, semesters and their files.

   Rows come from `/v1/subjects` and `/v1/semesters` and are mapped into these
   shapes by `lib/mappers.ts`; only the vocabulary and the colour swatches the
   add/edit sheets offer live here now. */

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
  files: (SubjectFile & { id?: string })[];
  /** The Ada nudge shown at the bottom of the detail pane. */
  nudge?: { text: string; action: string };
}

export interface Semester {
  id: string;
  name: string;
  subjects: number;
  credits: number;
  gpa: string;
  current?: boolean;
}

/** The six colour swatches offered in the add/edit subject sheets. */
export const SUBJECT_SWATCHES = ['#6b5cf0', '#5cbbff', '#2a9d6b', '#e8a430', '#e85476', '#c0497b'];
