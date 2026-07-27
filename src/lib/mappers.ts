import type {
  OccurrenceDto,
  SemesterDto,
  StudyTagDto,
  SubjectDto,
  SubjectFileDto,
} from './api';
import { durationLabel, formatClock, relativeLabel, sizeLabel } from './format';
import type { Task, LinkableTask } from '../data/tasks';
import type { Semester, Subject, SubjectFile } from '../data/subjects';

/* DTO → view-model mappers.

   The screens were built against the shapes in `src/data/*.ts`; keeping those
   shapes and mapping into them means the JSX stays as drawn. Everything a
   mapper needs beyond one DTO (a subject's colour, a tag's label) is passed in
   as a lookup so the mappers stay pure and testable. */

export interface SubjectLookup {
  byId: Map<string, SubjectDto>;
}

export interface TagLookup {
  byId: Map<string, StudyTagDto>;
}

export const buildSubjectLookup = (subjects: SubjectDto[]): SubjectLookup => ({
  byId: new Map(subjects.map((s) => [s.id, s])),
});

export const buildTagLookup = (tags: StudyTagDto[]): TagLookup => ({
  byId: new Map(tags.map((t) => [t.id, t])),
});

const FALLBACK_COLOR = '#6b5cf0';

/** A subject's short chip label — the code if it has one, else a clipped name. */
export function subjectLabel(subject: SubjectDto | undefined): string {
  if (!subject) return 'General';
  return subject.code?.trim() || subject.name;
}

/**
 * The chip on a task card. `category` carries the study-tag id (the backend
 * stores it in `task_type`), but the frames label the chip with the *subject*
 * code — so prefer the subject and fall back to the tag when a task has none.
 */
export function taskChip(
  occ: OccurrenceDto,
  subjects: SubjectLookup,
  tags: TagLookup,
): { tag: string; color: string } {
  const subject = occ.subject_id ? subjects.byId.get(occ.subject_id) : undefined;
  if (subject) return { tag: subjectLabel(subject), color: subject.color_hex || FALLBACK_COLOR };

  const tag = occ.category ? tags.byId.get(occ.category) : undefined;
  if (tag) return { tag: tag.label, color: tag.color || FALLBACK_COLOR };

  return { tag: occ.category?.trim() || 'General', color: FALLBACK_COLOR };
}

/** Occurrence → the `Task` shape `TaskCard` and the plan views consume. */
export function toTask(occ: OccurrenceDto, subjects: SubjectLookup, tags: TagLookup): Task {
  const { tag, color } = taskChip(occ, subjects, tags);
  const time = formatClock(occ.scheduled_at);
  return {
    id: occ.id,
    title: occ.title,
    dur: durationLabel(occ.duration_seconds),
    tag,
    color,
    bar: Boolean(time),
    time,
    done: occ.status === 'COMPLETE',
  };
}

/** Occurrence → the Focus screen's "link a task" row. */
export function toLinkableTask(
  occ: OccurrenceDto,
  subjects: SubjectLookup,
  tags: TagLookup,
): LinkableTask {
  const { tag, color } = taskChip(occ, subjects, tags);
  const time = formatClock(occ.scheduled_at);
  return {
    id: occ.id,
    title: occ.title,
    meta: `${tag} · ${time ? `Planned ${time}` : 'Anytime'}`,
    color,
  };
}

/**
 * Split an occurrence id back into its parts.
 *
 * Two forms exist on the wire: `<series-uuid>@<yyyy-MM-dd>` for an occurrence
 * the server has not materialised yet, and a bare uuid once it has (after a
 * toggle, a breakdown or an edit). Both are valid targets for
 * toggle/patch/delete/move.
 */
export function splitOccurrenceId(id: string): { seriesId: string; date: string | null } {
  const at = id.lastIndexOf('@');
  return at === -1
    ? { seriesId: id, date: null }
    : { seriesId: id.slice(0, at), date: id.slice(at + 1) };
}

/**
 * Collapse duplicate occurrences returned for the same day.
 *
 * The deployed materialiser can emit one row per override plus the virtual
 * occurrence, so a task that has been toggled and broken down comes back two or
 * three times (see the note in aqademiq-backend/.../tasks.service.ts). Dedupe on
 * the identity the user can actually see, keeping the richest row — the one
 * carrying steps, then the completed one.
 */
export function dedupeOccurrences(items: OccurrenceDto[]): OccurrenceDto[] {
  const best = new Map<string, OccurrenceDto>();
  for (const occ of items) {
    const key = [occ.title.trim().toLowerCase(), occ.subject_id ?? '', occ.scheduled_at ?? '', occ.part_of_day].join('|');
    const prev = best.get(key);
    if (!prev) {
      best.set(key, occ);
      continue;
    }
    const better =
      occ.steps.length !== prev.steps.length
        ? occ.steps.length > prev.steps.length
        : occ.status === 'COMPLETE' && prev.status !== 'COMPLETE';
    if (better) best.set(key, occ);
  }
  return [...best.values()];
}

/* ── Subjects / semesters ───────────────────────────────────────────── */

const FILE_ICONS: Record<string, string> = {
  'application/pdf': 'picture_as_pdf',
  'image/png': 'image',
  'image/jpeg': 'image',
};

export const fileIcon = (mime: string | null | undefined): string =>
  (mime && FILE_ICONS[mime]) || 'description';

export function toSubjectFile(f: SubjectFileDto): SubjectFile & { id: string } {
  const size = f.size_label || sizeLabel(f.size_bytes);
  const when = relativeLabel(f.created_at);
  return {
    id: f.id,
    icon: fileIcon(f.mime_type),
    name: f.name,
    meta: [when, size].filter(Boolean).join(' · '),
  };
}

/** Lighten-safe text colour: very light hues get darkened for label contrast. */
function readableText(hex: string): string | undefined {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return undefined;
  const int = parseInt(m[1], 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  // Rec. 709 luma. Above ~0.62 the hue is too light for text on a light card.
  const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  if (luma <= 0.62) return undefined;
  const dark = (c: number) => Math.round(c * 0.72);
  return `#${[dark(r), dark(g), dark(b)].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

export function toSubject(dto: SubjectDto): Subject {
  const color = dto.color_hex || FALLBACK_COLOR;
  const files = dto.files?.map(toSubjectFile) ?? [];
  const filesPart = `${dto.files_count} ${dto.files_count === 1 ? 'file' : 'files'}`;
  return {
    id: dto.id,
    code: subjectLabel(dto),
    name: dto.name,
    credits: dto.credits ?? 0,
    grade: dto.target_grade || '—',
    target: dto.target_grade || '—',
    color,
    textColor: readableText(color),
    professor: dto.prof || '',
    meta: [dto.prof, filesPart].filter(Boolean).join(' · '),
    metaHighlight: dto.focus_label || dto.next_label || '',
    fileCount: dto.files_count,
    files,
    nudge: dto.next_label ? { text: `Next up: ${dto.next_label}`, action: 'Plan it' } : undefined,
  };
}

export function toSemester(dto: SemesterDto, subjects: SubjectDto[]): Semester {
  const mine = subjects.filter((s) => s.semester_id === dto.id);
  return {
    id: dto.id,
    name: dto.name,
    subjects: mine.length,
    credits: mine.reduce((sum, s) => sum + (s.credits ?? 0), 0),
    gpa: '—',
    current: dto.is_active,
  };
}
