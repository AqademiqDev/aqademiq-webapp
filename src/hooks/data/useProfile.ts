import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as apiFns from '../../lib/api';
import type {
  EmailPreferencesDto,
  NotificationChannelDto,
  NotificationPreferencesDto,
  ProfilePatch,
  SettingsPatch,
} from '../../lib/api';
import { qk } from '../../lib/queryClient';
import { useAuth } from '../useAuth';

/* Profile, settings, notification/email preferences, stats and streaks —
   everything the Profile and Settings sections read. */

function useAuthed() {
  const { status } = useAuth();
  return status === 'guest' || status === 'signed-in';
}

export function useProfile() {
  const enabled = useAuthed();
  return useQuery({ queryKey: qk.profile, enabled, queryFn: apiFns.getProfile });
}

export function useUpdateProfile() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (patch: ProfilePatch) => apiFns.updateProfile(patch),
    onSuccess: (profile) => client.setQueryData(qk.profile, profile),
  });
}

export function useStats() {
  const enabled = useAuthed();
  return useQuery({ queryKey: qk.stats, enabled, queryFn: apiFns.getStats });
}

export function useStreak() {
  const enabled = useAuthed();
  return useQuery({ queryKey: qk.streak, enabled, queryFn: apiFns.getStreak });
}

export function useActivityDates() {
  const enabled = useAuthed();
  return useQuery({
    queryKey: qk.activityDates,
    enabled,
    queryFn: async () => (await apiFns.getActivityDates()).dates,
  });
}

export function useWeekCount(date?: string) {
  const enabled = useAuthed();
  return useQuery({ queryKey: qk.weekCount(date), enabled, queryFn: () => apiFns.getWeekCount(date) });
}

export function useSettings() {
  const enabled = useAuthed();
  return useQuery({ queryKey: qk.settings, enabled, queryFn: apiFns.getSettings });
}

export function useUpdateSettings() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (patch: SettingsPatch) => apiFns.updateSettings(patch),
    onSuccess: (settings) => {
      client.setQueryData(qk.settings, settings);
      void client.invalidateQueries({ queryKey: qk.notificationPrefs });
    },
  });
}

export function useEmailPreferences() {
  const enabled = useAuthed();
  return useQuery({ queryKey: qk.emailPrefs, enabled, queryFn: apiFns.getEmailPreferences });
}

export function useUpdateEmailPreferences() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<EmailPreferencesDto>) => apiFns.updateEmailPreferences(patch),
    onSuccess: (prefs) => client.setQueryData(qk.emailPrefs, prefs),
  });
}

export function useNotificationPreferences() {
  const enabled = useAuthed();
  return useQuery({
    queryKey: qk.notificationPrefs,
    enabled,
    queryFn: apiFns.getNotificationPreferences,
  });
}

export function useUpdateNotificationPreferences() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Omit<NotificationPreferencesDto, 'channels'>>) =>
      apiFns.updateNotificationPreferences(patch),
    onSuccess: (prefs) => {
      client.setQueryData(qk.notificationPrefs, prefs);
      void client.invalidateQueries({ queryKey: qk.settings });
    },
  });
}

/**
 * Flip one reminder channel. The endpoint has replace semantics per channel, so
 * the whole current matrix is sent back with the one row changed.
 */
export function useSetNotificationChannel() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({
      channelKey,
      enabled,
      sendTime,
    }: {
      channelKey: string;
      enabled: boolean;
      sendTime?: string | null;
    }) => {
      const current = client.getQueryData<NotificationPreferencesDto>(qk.notificationPrefs);
      const channels: NotificationChannelDto[] = (current?.channels ?? []).map((c) =>
        c.channel_key === channelKey
          ? { ...c, enabled, send_time: sendTime === undefined ? c.send_time : sendTime }
          : c,
      );
      if (!channels.some((c) => c.channel_key === channelKey)) {
        channels.push({ channel_key: channelKey, enabled, send_time: sendTime ?? null });
      }
      return apiFns.putNotificationChannels(channels);
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: qk.notificationPrefs });
    },
  });
}

export function useNotificationInbox() {
  const enabled = useAuthed();
  return useQuery({
    queryKey: qk.notificationInbox,
    enabled,
    queryFn: apiFns.getNotificationInbox,
  });
}

export function useSendTestNotification() {
  return useMutation({ mutationFn: apiFns.sendTestNotification });
}

export function useReferralBalance() {
  const enabled = useAuthed();
  return useQuery({
    queryKey: qk.referralBalance,
    enabled,
    queryFn: apiFns.getReferralBalance,
  });
}

export function useRedeemReferral() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => apiFns.redeemReferral(code),
    onSuccess: () => client.invalidateQueries({ queryKey: qk.referralBalance }),
  });
}

/** Downloads the full export as a JSON file — the Account panel's export row. */
export function useExportData() {
  return useMutation({
    mutationFn: async () => {
      const data = await apiFns.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aqademiq-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      return data;
    },
  });
}

export function useDeleteAccount() {
  return useMutation({ mutationFn: apiFns.deleteAccount });
}

export function useSubmitFeedback() {
  return useMutation({ mutationFn: (text: string) => apiFns.submitFeedback(text) });
}

export function useSubmitRating() {
  return useMutation({
    mutationFn: ({ rating, comment }: { rating: number; comment?: string }) =>
      apiFns.submitRating(rating, comment),
  });
}
