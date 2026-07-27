/* Wire DTOs — snake_case, exactly as the Edge Function returns them.
   Verified against the live API (2026-07-27), not just the contract doc; where
   the two disagree the live shape wins and the difference is noted inline. */

/* ── Profile / settings ─────────────────────────────────────────────── */

export interface ProfileDto {
  name: string | null;
  email: string | null;
  is_guest: boolean;
  /** Live-only field, absent from the contract doc — drives the /setup gate. */
  onboarding_complete?: boolean;
  gender: string | null;
  date_of_birth: string | null;
  university: string | null;
  program: string | null;
  avatar_index: number;
}

export interface ProfilePatch {
  name?: string;
  gender?: string;
  date_of_birth?: string;
  university?: string;
  program?: string;
  avatar_index?: number;
}

export type ThemeMode = 'light' | 'dark' | 'system';
export type NotificationSound = 'Chime' | 'Pulse' | 'Glass' | 'Drop' | 'None';

export interface SettingsDto {
  theme_mode: ThemeMode;
  prism_default_mode: string | null;
  notification_sound: NotificationSound;
  notification_time: string;
  notification_time_morning: string;
  notification_time_review: string;
  daily_focus_goal_min: number;
  work_best_times: unknown;
  education_level: string | null;
}

export type SettingsPatch = Partial<{
  theme_mode: ThemeMode;
  prism_default_mode: string;
  notification_sound: NotificationSound;
  notification_time: string;
  notification_time_morning: string;
  notification_time_review: string;
  daily_focus_goal_min: number;
  work_best_times: unknown;
  education_level: string;
}>;

export interface EmailPreferencesDto {
  product_updates: boolean;
  study_tips: boolean;
  offers: boolean;
  surveys: boolean;
}

export interface NotificationChannelDto {
  channel_key: string;
  enabled: boolean;
  send_time: string | null;
}

export interface NotificationPreferencesDto {
  notification_sound: NotificationSound;
  notification_time: string;
  notification_time_morning: string;
  notification_time_review: string;
  channels: NotificationChannelDto[];
}

export interface StatsDto {
  current_streak: number;
  total_active_days: number;
  completed_tasks: number;
  focus_minutes: number;
  focus_sessions: number;
  subjects_count: number;
}

/* ── Semesters / subjects / files ───────────────────────────────────── */

export interface SemesterDto {
  id: string;
  name: string;
  start: string;
  end: string;
  is_active: boolean;
}

export interface SubjectFileDto {
  id: string;
  name: string;
  size_label?: string | null;
  kind?: string | null;
  important?: boolean;
  mime_type?: string | null;
  size_bytes?: number | null;
  scan_status?: string | null;
  ocr_status?: string | null;
  created_at?: string | null;
}

export interface SubjectDto {
  id: string;
  name: string;
  code: string | null;
  color_hex: string;
  semester_id: string | null;
  credits: number | null;
  prof: string | null;
  target_grade: string | null;
  mood: number | null;
  files_count: number;
  sort_order: number;
  /** Server-derived; null when there is nothing upcoming. */
  next_label: string | null;
  focus_label: string | null;
  files: SubjectFileDto[];
}

export interface SubjectInput {
  name: string;
  color_hex: string;
  semester_id?: string;
  code?: string;
  credits?: number;
  prof?: string;
  target_grade?: string;
  mood?: number;
}

/* ── Tasks ──────────────────────────────────────────────────────────── */

export type RepeatKind =
  | 'none'
  | 'daily'
  | 'weekdays'
  | 'weekly'
  | 'monthly'
  | 'everyNDays'
  | 'everyNWeeks'
  | 'everyNMonths';

export type TaskStatus = 'PENDING' | 'COMPLETE';
export type PartOfDay = 'anytime' | 'morning' | 'afternoon' | 'evening';

export interface TaskStepDto {
  id: string;
  title: string;
  duration_seconds: number;
  status: TaskStatus;
}

export interface OccurrenceDto {
  /** `<series-uuid>@<yyyy-MM-dd>` for a recurring/virtual occurrence, or a bare
      uuid once the server has materialised an override row for that day. Both
      forms are accepted by toggle/patch/delete/move. */
  id: string;
  title: string;
  subject_id: string | null;
  duration_seconds: number;
  /** Naive local wall-clock ISO (`2026-07-27T11:30:00`), or null = "anytime". */
  scheduled_at: string | null;
  part_of_day: PartOfDay;
  status: TaskStatus;
  category: string;
  note: string | null;
  repeat: { kind: RepeatKind; interval: number };
  steps: TaskStepDto[];
}

export interface CreateTaskInput {
  title: string;
  subject_id?: string;
  duration_seconds?: number;
  scheduled_at?: string;
  category?: string;
  note?: string;
  date?: string;
  part_of_day?: PartOfDay;
  repeat?: { kind: RepeatKind; interval?: number };
  until_date?: string;
}

export type PatchTaskInput = Partial<{
  scheduled_at: string;
  status: TaskStatus;
  title: string;
  category: string;
  note: string;
  duration_seconds: number;
  part_of_day: PartOfDay;
}>;

/* ── Focus / prism ──────────────────────────────────────────────────── */

/** The live API answers `COMPLETED` on finish; the doc says `COMPLETE`. Accept both. */
export type FocusStatus = 'RUNNING' | 'PAUSED' | 'COMPLETE' | 'COMPLETED';

export interface FocusSessionDto {
  id: string;
  planned_min: number;
  elapsed_sec: number;
  status: FocusStatus;
  prism_mode: string | null;
  task_id: string | null;
  task_date: string | null;
  mood_index: number | null;
  created_at: string;
  linked_task?: OccurrenceDto | null;
}

export interface PrismModeDto {
  key: string;
  label: string;
  description: string;
  /** HLS stream, or null until the CDN bucket is configured. */
  url: string | null;
  preset_id?: string | null;
}

export interface PrismPreferencesDto {
  default_mode: string;
  default_preset_id: string | null;
  volume_level: number;
  adaptive_audio: boolean;
  play_in_focus: boolean;
}

/* ── Mood / streaks ─────────────────────────────────────────────────── */

export interface MoodDto {
  date: string;
  mood_index: number | null;
  intention: string | null;
  reflection: string | null;
}

export interface MoodWeekDto {
  week_start: string;
  days: MoodDto[];
}

export interface StreakDto {
  current_streak: number;
  today_has_activity: boolean;
  total_active_days: number;
}

/* ── Study tags ─────────────────────────────────────────────────────── */

export interface StudyTagDto {
  id: string;
  label: string;
  color: string;
}

/* ── Ada ────────────────────────────────────────────────────────────── */

export interface AdaConversationDto {
  id: string;
  title: string | null;
  is_active: boolean;
  created_at: string;
  last_message_at: string;
}

export interface AdaPlanTaskDto {
  title: string;
  subject_id?: string | null;
  /** Either `HH:MM` or a full naive ISO — the apply-plan gate accepts both. */
  scheduled_at?: string | null;
  duration_seconds?: number | null;
  repeat?: { kind: RepeatKind; interval?: number } | null;
}

export interface AdaPlanDayDto {
  date: string;
  tasks: AdaPlanTaskDto[];
}

export interface AdaAttachmentDto {
  key: string;
  name: string;
  mime_type?: string | null;
}

export interface AdaMessageDto {
  id: string;
  is_user: boolean;
  text: string;
  plan: AdaPlanDayDto[] | null;
  plan_footer: string | null;
  attachments: AdaAttachmentDto[] | null;
  created_at: string;
}

/* ── Feedback board ─────────────────────────────────────────────────── */

export interface BoardStatusDto {
  key: string;
  label: string;
  color: string;
  on_roadmap?: boolean;
}

export interface BoardCategoryDto {
  key: string;
  label: string;
}

export interface BoardMetaDto {
  statuses: BoardStatusDto[];
  categories: BoardCategoryDto[];
}

export interface BoardAuthorDto {
  id: string;
  name: string | null;
  avatar_url: string | null;
}

export interface BoardPostDto {
  /** Public reference number — the id used in every board path. */
  ref: number;
  title: string;
  body: string;
  status: string;
  category: string;
  upvotes: number;
  comment_count: number;
  pinned: boolean;
  locked: boolean;
  approved: boolean;
  you_voted: boolean;
  author: BoardAuthorDto | null;
  created_at: string;
  updated_at: string;
  comments?: BoardCommentDto[];
  subscribed?: boolean;
}

export interface BoardCommentDto {
  id: string;
  body: string;
  author: BoardAuthorDto | null;
  created_at: string;
  is_admin?: boolean;
  pinned?: boolean;
}

export interface BoardRoadmapGroupDto {
  status: BoardStatusDto;
  posts: BoardPostDto[];
}

/** The duplicate-check shape — deliberately smaller than a full post. */
export interface SimilarPostDto {
  ref: number;
  title: string;
  upvotes: number;
  status: string;
}

export interface ChangelogEntryDto {
  id: string;
  title: string;
  body: string;
  published_at: string;
}

/* ── Referrals / misc ───────────────────────────────────────────────── */

export interface ReferralBalanceDto {
  code: string;
  balance: number;
  redemptions: number;
}

export interface NotificationDto {
  id: string;
  channel_key: string;
  status: string;
  read: boolean;
  created_at: string;
}

/* ── Onboarding ─────────────────────────────────────────────────────── */

export interface OnboardingSubjectInput {
  name: string;
  color_hex?: string;
  mood?: number;
  syllabus_staging_key?: string;
  syllabus_file_name?: string;
  syllabus_mime_type?: string;
}

export interface OnboardingInput {
  /** Required by the router (the contract doc lists it as optional — code wins). */
  consent_given: boolean;
  /** Required, 1–120. The server applies its own minimum-age gate. */
  age: number;
  consent_version?: string;
  referral_code?: string;
  name?: string;
  education_level?: string;
  semester?: { name: string; start: string; end: string };
  subjects?: OnboardingSubjectInput[];
  daily_focus_goal_min?: number;
  work_best_times?: unknown;
}

export interface OnboardingResultDto {
  profile_name: string | null;
  semesters: number;
  subjects: number;
  daily_focus_goal_min: number;
  status: 'completed' | 'already_completed';
}

/* ── Uploads ────────────────────────────────────────────────────────── */

export interface UploadInitDto {
  file_id: string;
  upload_url: string;
  key: string;
  name?: string;
  mime_type?: string;
}

export interface StagingUploadInitDto {
  upload_id: string;
  upload_url: string;
  key: string;
  name: string;
  mime_type: string;
}
