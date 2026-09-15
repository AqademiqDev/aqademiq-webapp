import { api, stripUndefined } from './http';
import type {
  AdaConversationDto,
  AdaMessageDto,
  AdaMemoryDto,
  AdaDecisionDto,
  AdaBulkDecisionDto,
  BoardCommentDto,
  BoardMetaDto,
  BoardPostDto,
  BoardRoadmapGroupDto,
  ChangelogEntryDto,
  CreateTaskInput,
  EmailPreferencesDto,
  FocusSessionDto,
  MoodDto,
  MoodWeekDto,
  NotificationDto,
  NotificationPreferencesDto,
  NotificationChannelDto,
  OccurrenceDto,
  OnboardingInput,
  OnboardingResultDto,
  PatchTaskInput,
  PrismModeDto,
  PrismPreferencesDto,
  ProfileDto,
  ProfilePatch,
  ReferralBalanceDto,
  SemesterDto,
  SettingsDto,
  SettingsPatch,
  SimilarPostDto,
  StagingUploadInitDto,
  StatsDto,
  StreakDto,
  StudyTagDto,
  SubjectDto,
  SubjectInput,
  TaskStepDto,
  UploadInitDto,
  WeeklyReportDto,
} from './types';

export * from './types';
export { ApiError } from './http';

/* Every REST call the web app makes, one function per endpoint.

   Paths are relative to `env.apiBaseUrl` (…/functions/v1/api/v1). Creates that
   a retry could duplicate pass `idempotent: true` so the server replays the
   first response instead of inserting twice (contract §4). */

/* ── Profile, settings, stats ───────────────────────────────────────── */

export const getProfile = () => api.get<ProfileDto>('/profile');
export const updateProfile = (patch: ProfilePatch) =>
  api.patch<ProfileDto>('/profile', stripUndefined(patch));
export const deleteAccount = () => api.del<{ status: string }>('/profile/account');

export const getStats = () => api.get<StatsDto>('/me/stats');

/* The current week's Core, and only the current week. There is deliberately no
   `week_start` parameter here even though the endpoint accepts one: browsing
   back through past weeks is a rumination affordance the design rules out, and
   a function that cannot name another week is the cheapest place to make that
   true. Mirrors `weeklyReportProvider` in the mobile app. */
export const getWeeklyReport = () => api.get<WeeklyReportDto>('/me/weekly-report');

export const getSettings = () => api.get<SettingsDto>('/me/settings');
export const updateSettings = (patch: SettingsPatch) =>
  api.patch<SettingsDto>('/me/settings', stripUndefined(patch));

export const getEmailPreferences = () => api.get<EmailPreferencesDto>('/me/email-preferences');
export const updateEmailPreferences = (patch: Partial<EmailPreferencesDto>) =>
  api.patch<EmailPreferencesDto>('/me/email-preferences', stripUndefined(patch));

export const getNotificationPreferences = () =>
  api.get<NotificationPreferencesDto>('/me/notification-preferences');
export const updateNotificationPreferences = (
  patch: Partial<Omit<NotificationPreferencesDto, 'channels'>>,
) => api.patch<NotificationPreferencesDto>('/me/notification-preferences', stripUndefined(patch));

export const getNotificationChannels = () =>
  api.get<{ channels: NotificationChannelDto[] }>('/me/notification-channels');
export const putNotificationChannels = (channels: NotificationChannelDto[]) =>
  api.put<{ channels: NotificationChannelDto[] }>('/me/notification-channels', { channels });

export const exportData = () => api.get<Record<string, unknown>>('/me/export');

/* ── Notifications inbox ────────────────────────────────────────────── */

export const getNotificationInbox = () =>
  api.get<{ notifications: NotificationDto[]; unread_count: number }>('/me/notifications/inbox');
export const getNotificationHistory = () =>
  api.get<{ notifications: NotificationDto[] }>('/me/notifications/history');
export const sendTestNotification = () => api.post<NotificationDto>('/me/notifications/test');

/* ── Onboarding ─────────────────────────────────────────────────────── */

export const completeOnboarding = (input: OnboardingInput) =>
  api.post<OnboardingResultDto>('/onboarding/complete', stripUndefined(input), {
    idempotent: true,
  });

/* ── Semesters ──────────────────────────────────────────────────────── */

export const listSemesters = () => api.get<{ semesters: SemesterDto[] }>('/semesters');
export const getActiveSemester = () => api.get<SemesterDto>('/semesters/active');
export const createSemester = (input: { name: string; start: string; end: string }) =>
  api.post<SemesterDto>('/semesters', input, { idempotent: true });
export const updateSemester = (id: string, patch: Partial<{ name: string; start: string; end: string }>) =>
  api.patch<SemesterDto>(`/semesters/${id}`, stripUndefined(patch));
export const activateSemester = (id: string) => api.patch<SemesterDto>(`/semesters/${id}/activate`);
export const deleteSemester = (id: string) =>
  api.del<{ status: string; id: string }>(`/semesters/${id}`);

/* ── Subjects ───────────────────────────────────────────────────────── */

export const listSubjects = (semesterId?: string) =>
  api.get<{ subjects: SubjectDto[] }>('/subjects', { semester_id: semesterId });
export const getSubject = (id: string) => api.get<SubjectDto>(`/subjects/${id}`);
export const createSubject = (input: SubjectInput) =>
  api.post<SubjectDto>('/subjects', stripUndefined(input), { idempotent: true });
export const updateSubject = (id: string, patch: Partial<SubjectInput>) =>
  api.patch<SubjectDto>(`/subjects/${id}`, stripUndefined(patch));
export const reorderSubjects = (ids: string[]) =>
  api.patch<{ subjects: SubjectDto[] }>('/subjects/reorder', { ids });
export const deleteSubject = (id: string) =>
  api.del<{ status: string; id: string }>(`/subjects/${id}`);
export const attachSubjectFileMeta = (
  id: string,
  input: { name?: string; kind?: string; important?: boolean },
) => api.post<{ id: string; name: string; kind: string; important: boolean }>(
  `/subjects/${id}/files`,
  stripUndefined(input),
);

/* ── Tasks ──────────────────────────────────────────────────────────── */

export const listTasks = (params: { date?: string; from?: string; to?: string }) =>
  api.get<{ tasks: OccurrenceDto[] }>('/tasks', params);
export const createTask = (input: CreateTaskInput) =>
  api.post<OccurrenceDto>('/tasks', stripUndefined(input), { idempotent: true });
export const patchTask = (occId: string, patch: PatchTaskInput) =>
  api.patch<OccurrenceDto>(`/tasks/${encodeURIComponent(occId)}`, stripUndefined(patch));
export const toggleTask = (occId: string) =>
  api.patch<OccurrenceDto>(`/tasks/${encodeURIComponent(occId)}/toggle`);
export const deleteTask = (occId: string) =>
  api.del<{ status: string; id: string }>(`/tasks/${encodeURIComponent(occId)}`);
export const moveTasks = (input: { from: string; to: string; ids?: string[] }) =>
  api.post<{ moved: number; from: string; to: string }>('/tasks/move', stripUndefined(input));
export const breakdownTask = (occId: string, date?: string) =>
  api.post<{ steps: TaskStepDto[] }>(
    `/tasks/${encodeURIComponent(occId)}/breakdown`,
    stripUndefined({ date }),
  );
export const getCompletionHistory = () =>
  api.get<Record<string, number>>('/tasks/history/completions');

/* ── Focus + prism ──────────────────────────────────────────────────── */

export const startFocusSession = (input: {
  planned_min?: number;
  prism_mode?: string;
  task_id?: string;
  task_date?: string;
}) => api.post<FocusSessionDto>('/focus-sessions', stripUndefined(input), { idempotent: true });

export const checkpointFocusSession = (
  id: string,
  input: { elapsed_sec?: number; status?: 'RUNNING' | 'PAUSED' },
) => api.patch<FocusSessionDto>(`/focus-sessions/${id}`, stripUndefined(input));

export const completeFocusSession = (
  id: string,
  input: { elapsed_sec?: number; mood_index?: number },
) => api.post<FocusSessionDto>(`/focus-sessions/${id}/complete`, stripUndefined(input));

export const listPrismModes = () => api.get<{ modes: PrismModeDto[] }>('/prism-modes');
export const getPrismPreferences = () => api.get<PrismPreferencesDto>('/prism-modes/preferences');
export const updatePrismPreferences = (patch: Partial<PrismPreferencesDto>) =>
  api.put<PrismPreferencesDto>('/prism-modes/preferences', stripUndefined(patch));

/* ── Mood + streaks ─────────────────────────────────────────────────── */

export const logMood = (input: { date: string; mood_index: number; intention?: string }) =>
  api.post<MoodDto>('/mood-entries', stripUndefined(input), { idempotent: true });
export const logReflection = (date: string, reflection: string) =>
  api.post<MoodDto>(`/mood-entries/${date}/reflection`, { reflection });
export const getMood = (date: string) => api.get<MoodDto>(`/mood-entries/${date}`);
export const getMoodWeek = (date?: string) =>
  api.get<MoodWeekDto>('/mood-entries/week', { date });
export const getMoodToday = () =>
  api.get<{ today_mood_logged: boolean; today_reflection_logged: boolean }>('/mood-entries/today');

export const getStreak = () => api.get<StreakDto>('/streaks/current');
export const getActivityDates = () => api.get<{ dates: string[] }>('/activity-dates');
export const getWeekCount = (date?: string) =>
  api.get<{ week_start: string; count: number }>('/week-count', { date });

/* ── Study tags ─────────────────────────────────────────────────────── */

export const listStudyTags = () => api.get<{ tags: StudyTagDto[] }>('/study-tags');
export const createStudyTag = (input: { label: string; color?: string }) =>
  api.post<StudyTagDto>('/study-tags', stripUndefined(input));
/** Deletes by label text, case-insensitive — not by id (contract mismatch 4). */
export const deleteStudyTag = (label: string) =>
  api.del<{ status: string; label: string }>(`/study-tags/${encodeURIComponent(label)}`);

/* ── Ada ────────────────────────────────────────────────────────────── */

export const listConversations = () =>
  api.get<{ conversations: AdaConversationDto[] }>('/ada/conversations');
export const createConversation = (title?: string) =>
  api.post<AdaConversationDto>('/ada/conversations', stripUndefined({ title }));
export const listMessages = (conversationId: string) =>
  api.get<{ messages: AdaMessageDto[] }>(`/ada/conversations/${conversationId}/messages`);
export const sendMessage = (
  conversationId: string,
  text: string,
  attachments?: { key: string; name: string; mime_type?: string }[],
) =>
  api.post<{ messages: AdaMessageDto[] }>(
    `/ada/conversations/${conversationId}/messages`,
    stripUndefined({ text, attachments }),
  );
export const applyPlan = (conversationId: string, messageId: string) =>
  api.post<{ applied: number; tasks: OccurrenceDto[] }>(
    `/ada/conversations/${conversationId}/messages/${messageId}/apply-plan`,
    {},
    { idempotent: true },
  );
export const planWeek = (input: { start_date?: string; goal?: string }) =>
  api.post<{
    conversation_id: string;
    start_date: string;
    end_date: string;
    applied: number;
    tasks: OccurrenceDto[];
  }>('/ada/plan-week', stripUndefined(input), { idempotent: true });
/** Presign an Ada chat attachment; the returned `key` rides in the next message. */
export const initAdaUpload = (input: {
  conversation_id: string;
  name: string;
  mime_type?: string;
  size_bytes?: number;
}) => api.post<UploadInitDto>('/ada/uploads', stripUndefined(input));

/** init → PUT, then reference `{key, name, mime_type}` in the message. */
export async function uploadAdaAttachment(conversationId: string, file: File) {
  const init = await initAdaUpload({
    conversation_id: conversationId,
    name: file.name,
    mime_type: file.type || 'application/octet-stream',
    size_bytes: file.size,
  });
  await putToSignedUrl(init.upload_url, file);
  return { key: init.key, name: file.name, mime_type: file.type || 'application/octet-stream' };
}

export const archiveConversation = (id: string) =>
  api.post<{ status: string; id: string }>(`/ada/conversations/${id}/archive`);
export const clearChats = () => api.post<{ status: string }>('/ada/chat/clear');

/* What Ada remembers. No create: the agent writes these itself — the client's
   job is to make what is stored visible and removable. */
export const listAdaMemories = () => api.get<{ memories: AdaMemoryDto[] }>('/ada/memories');
export const deleteAdaMemory = (id: string) =>
  api.del<{ status: string }>(`/ada/memories/${id}`);
export const clearAdaMemories = () =>
  api.del<{ status: string; deleted: number }>('/ada/memories');

/* Ada's proposed changes. Nothing the agent suggests touches the user's data
   until one of these is called. */
export const approveAdaAction = (actionId: string) =>
  api.post<AdaDecisionDto>(`/ada/actions/${actionId}/approve`);
export const rejectAdaAction = (actionId: string) =>
  api.post<AdaDecisionDto>(`/ada/actions/${actionId}/reject`);
/** Approve or reject everything still outstanding in one conversation. */
export const decideAllAdaActions = (conversationId: string, approve: boolean) =>
  api.post<AdaBulkDecisionDto>(`/ada/conversations/${conversationId}/actions/decide`, { approve });

/* ── Feedback board ─────────────────────────────────────────────────── */

export const getBoardMeta = () => api.get<BoardMetaDto>('/feedback/meta');
export const listBoardPosts = (params: {
  status?: string;
  category?: string;
  sort?: string;
  q?: string;
  cursor?: string;
}) => api.get<{ posts: BoardPostDto[]; next_cursor: string | null }>('/feedback/posts', params);
export const getBoardPost = (ref: number | string) => api.get<BoardPostDto>(`/feedback/posts/${ref}`);
/** 403 "Create an account to post a suggestion" for guests — the board is
    read-only without an account (same for vote/comment/subscribe). */
export const createBoardPost = (input: { title: string; body?: string; category?: string }) =>
  api.post<BoardPostDto & { similar?: SimilarPostDto[] }>('/feedback/posts', stripUndefined(input), {
    idempotent: true,
  });
export const voteBoardPost = (ref: number | string) =>
  api.post<BoardPostDto | { upvotes: number; you_voted: boolean }>(`/feedback/posts/${ref}/vote`);
export const unvoteBoardPost = (ref: number | string) =>
  api.del<BoardPostDto | { upvotes: number; you_voted: boolean }>(`/feedback/posts/${ref}/vote`);
export const commentOnBoardPost = (ref: number | string, body: string) =>
  api.post<BoardCommentDto>(`/feedback/posts/${ref}/comments`, { body });
export const subscribeBoardPost = (ref: number | string) =>
  api.post<{ subscribed: boolean }>(`/feedback/posts/${ref}/subscribe`);
export const unsubscribeBoardPost = (ref: number | string) =>
  api.del<{ subscribed: boolean }>(`/feedback/posts/${ref}/subscribe`);
export const getBoardRoadmap = () => api.get<{ groups: BoardRoadmapGroupDto[] }>('/feedback/roadmap');
/** Returns a trimmed shape under `similar`, not full posts. */
export const findSimilarPosts = (q: string) =>
  api.get<{ similar: SimilarPostDto[] }>('/feedback/similar', { q });
export const listChangelog = () => api.get<{ entries: ChangelogEntryDto[] }>('/changelog');

/* ── Referrals + lightweight feedback ───────────────────────────────── */

export const getReferralBalance = () => api.get<ReferralBalanceDto>('/referrals/rewards/balance');
export const validateReferral = (code: string) =>
  api.post<{ valid: boolean }>('/referrals/validate', { code });
export const redeemReferral = (code: string) =>
  api.post<{ status: string; referrer_user_id: string }>('/referrals/redeem', { code });

export const submitRating = (rating: number, comment?: string) =>
  api.post<{ status: string }>('/ratings', stripUndefined({ rating, comment }));
export const submitFeedback = (text: string) => api.post<{ status: string }>('/feedback', { text });

/* ── Files / uploads ────────────────────────────────────────────────── */

export const initUpload = (input: {
  subject_id: string;
  name: string;
  kind?: string;
  mime_type?: string;
  size_bytes?: number;
}) => api.post<UploadInitDto>('/uploads/init', stripUndefined(input));

export const initStagingUpload = (input: {
  name: string;
  kind?: string;
  mime_type?: string;
  size_bytes?: number;
}) => api.post<StagingUploadInitDto>('/uploads/staging/init', stripUndefined(input));

export const commitUpload = (fileId: string) =>
  api.post<{ id: string; name: string; kind: string }>(`/uploads/${fileId}/commit`);

export const patchFile = (id: string, patch: { important?: boolean; name?: string }) =>
  api.patch<{ id: string; name: string }>(`/files/${id}`, stripUndefined(patch));

export const deleteFile = (id: string) => api.del<{ status: string; id: string }>(`/files/${id}`);

export const getFileDownloadUrl = (id: string) =>
  api.get<{ url: string; expires_in: number }>(`/files/${id}/download`);

/**
 * PUT the bytes straight to the storage signed URL returned by an init call.
 * Deliberately not routed through `request()` — the signed URL is a different
 * host and must NOT receive our Authorization header.
 */
export async function putToSignedUrl(uploadUrl: string, file: File): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
}

/** init → PUT → commit, the full subject-file flow (contract §9.1). */
export async function uploadSubjectFile(subjectId: string, file: File, kind?: string) {
  const init = await initUpload({
    subject_id: subjectId,
    name: file.name,
    kind,
    mime_type: file.type || 'application/octet-stream',
    size_bytes: file.size,
  });
  await putToSignedUrl(init.upload_url, file);
  return commitUpload(init.file_id);
}

/** init → PUT for a syllabus staged before its subject exists (contract §9.2). */
export async function uploadStagedSyllabus(file: File) {
  const init = await initStagingUpload({
    name: file.name,
    kind: 'syllabus',
    mime_type: file.type || 'application/octet-stream',
    size_bytes: file.size,
  });
  await putToSignedUrl(init.upload_url, file);
  return init;
}
