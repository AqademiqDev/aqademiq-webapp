import { QueryClient } from '@tanstack/react-query';

import { ApiError } from './api/http';

/* One cache for the whole app.

   Retries are deliberately narrow: a 4xx from this API is a contract answer
   ("no subject yet", "not configured"), never a transient failure, so retrying
   it just delays the empty state. Only network-level failures get a second go. */

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: true,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

/** Query keys — one namespace per domain so invalidation stays surgical. */
export const qk = {
  profile: ['profile'] as const,
  stats: ['stats'] as const,
  settings: ['settings'] as const,
  emailPrefs: ['email-preferences'] as const,
  notificationPrefs: ['notification-preferences'] as const,
  notificationInbox: ['notification-inbox'] as const,

  semesters: ['semesters'] as const,
  activeSemester: ['semesters', 'active'] as const,
  subjects: (semesterId?: string) => ['subjects', semesterId ?? 'all'] as const,
  subject: (id: string) => ['subjects', 'detail', id] as const,

  tasksDay: (date: string) => ['tasks', 'day', date] as const,
  tasksRange: (from: string, to: string) => ['tasks', 'range', from, to] as const,
  completions: ['tasks', 'completions'] as const,

  streak: ['streak'] as const,
  activityDates: ['activity-dates'] as const,
  weekCount: (date?: string) => ['week-count', date ?? 'today'] as const,

  mood: (date: string) => ['mood', date] as const,
  moodWeek: (date?: string) => ['mood', 'week', date ?? 'today'] as const,
  moodToday: ['mood', 'today'] as const,

  tags: ['study-tags'] as const,

  prismModes: ['prism-modes'] as const,
  prismPrefs: ['prism-preferences'] as const,

  conversations: ['ada', 'conversations'] as const,
  messages: (id: string) => ['ada', 'messages', id] as const,

  boardMeta: ['board', 'meta'] as const,
  boardPosts: (filters: string) => ['board', 'posts', filters] as const,
  boardPost: (ref: string | number) => ['board', 'post', String(ref)] as const,
  boardRoadmap: ['board', 'roadmap'] as const,
  changelog: ['changelog'] as const,

  referralBalance: ['referrals', 'balance'] as const,
};

/** Everything a mutation that changes tasks should refresh. */
export function invalidatePlan(): void {
  void queryClient.invalidateQueries({ queryKey: ['tasks'] });
  void queryClient.invalidateQueries({ queryKey: qk.streak });
  void queryClient.invalidateQueries({ queryKey: qk.stats });
  void queryClient.invalidateQueries({ queryKey: qk.activityDates });
  void queryClient.invalidateQueries({ queryKey: ['week-count'] });
  void queryClient.invalidateQueries({ queryKey: ['subjects'] });
}
