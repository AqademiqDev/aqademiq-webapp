import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as apiFns from '../../lib/api';
import { qk, queryClient } from '../../lib/queryClient';
import { todayIso, weekStart } from '../../lib/format';
import { useAuth } from '../useAuth';
import type { MoodDay } from '../../data/tasks';

/* Mood check-ins. Every write also feeds the activity ledger, so the streak,
   stats and activity-dates caches are refreshed alongside. */

const WEEK_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function useAuthed() {
  const { status } = useAuth();
  return status === 'guest' || status === 'signed-in';
}

export function useMood(date: string = todayIso()) {
  const enabled = useAuthed();
  return useQuery({ queryKey: qk.mood(date), enabled, queryFn: () => apiFns.getMood(date) });
}

export function useMoodToday() {
  const enabled = useAuthed();
  return useQuery({ queryKey: qk.moodToday, enabled, queryFn: apiFns.getMoodToday });
}

export function useMoodWeek(date?: string) {
  const enabled = useAuthed();
  const query = useQuery({
    queryKey: qk.moodWeek(date),
    enabled,
    queryFn: () => apiFns.getMoodWeek(date),
  });

  /** The `MoodWeek` strip wants `{letter, rating}` per day, Monday first. */
  const days = useMemo<MoodDay[]>(() => {
    const source = query.data?.days ?? [];
    return WEEK_LETTERS.map((letter, i) => ({
      letter,
      rating: source[i]?.mood_index ?? null,
    }));
  }, [query.data]);

  /* The week payload already carries each day's `intention` and `reflection`,
     but only `mood_index` was ever read — so everything written by the morning
     check-in and the evening reflection was invisible. Hand the raw entries
     back so a screen can show what was actually written. */
  const entries = query.data?.days ?? [];
  const today = todayIso();
  const todayEntry = entries.find((d) => d.date === today) ?? null;

  return {
    ...query,
    days,
    entries,
    todayEntry,
    weekStartIso: query.data?.week_start ?? weekStart(date),
  };
}

const invalidateMood = () => {
  void queryClient.invalidateQueries({ queryKey: ['mood'] });
  void queryClient.invalidateQueries({ queryKey: qk.streak });
  void queryClient.invalidateQueries({ queryKey: qk.stats });
  void queryClient.invalidateQueries({ queryKey: qk.activityDates });
  void queryClient.invalidateQueries({ queryKey: ['week-count'] });
  // A logged mood is what tints a band of the week's core.
  void queryClient.invalidateQueries({ queryKey: qk.weeklyReport });
};

export function useLogMood() {
  return useMutation({
    mutationFn: ({
      date = todayIso(),
      moodIndex,
      intention,
    }: {
      date?: string;
      moodIndex: number;
      intention?: string;
    }) => apiFns.logMood({ date, mood_index: moodIndex, intention }),
    onSuccess: invalidateMood,
  });
}

export function useLogReflection() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ date = todayIso(), reflection }: { date?: string; reflection: string }) =>
      apiFns.logReflection(date, reflection),
    onSuccess: (mood) => {
      client.setQueryData(qk.mood(mood.date), mood);
      invalidateMood();
    },
  });
}
