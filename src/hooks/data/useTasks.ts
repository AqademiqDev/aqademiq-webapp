import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as apiFns from '../../lib/api';
import type { CreateTaskInput, OccurrenceDto, PatchTaskInput } from '../../lib/api';
import { invalidatePlan, qk } from '../../lib/queryClient';
import { addDays, todayIso } from '../../lib/format';
import {
  buildSubjectLookup,
  buildTagLookup,
  dedupeOccurrences,
  toLinkableTask,
  toTask,
} from '../../lib/mappers';
import { useAuth } from '../useAuth';
import { useStudyTags } from './useTags';
import { useSubjects } from './useSubjects';

/* Tasks / plan data.

   Every list goes through `dedupeOccurrences` because the deployed
   materialiser can return the same occurrence more than once — see the note on
   that helper. */

export function useDayTasks(date: string = todayIso()) {
  const { status } = useAuth();
  return useQuery({
    queryKey: qk.tasksDay(date),
    enabled: status === 'guest' || status === 'signed-in',
    queryFn: async () => dedupeOccurrences((await apiFns.listTasks({ date })).tasks),
  });
}

export function useTaskRange(from: string, to: string, enabled = true) {
  const { status } = useAuth();
  return useQuery({
    queryKey: qk.tasksRange(from, to),
    enabled: enabled && (status === 'guest' || status === 'signed-in'),
    queryFn: async () => dedupeOccurrences((await apiFns.listTasks({ from, to })).tasks),
  });
}

export const useWeekTasks = (weekStartIso: string) =>
  useTaskRange(weekStartIso, addDays(weekStartIso, 6));

export function useCompletionHistory() {
  const { status } = useAuth();
  return useQuery({
    queryKey: qk.completions,
    enabled: status === 'guest' || status === 'signed-in',
    queryFn: apiFns.getCompletionHistory,
  });
}

/** Subject + tag lookups, shared by every mapper call site. */
export function useTaskLookups() {
  const subjects = useSubjects();
  const tags = useStudyTags();
  return useMemo(
    () => ({
      subjects: buildSubjectLookup(subjects.data ?? []),
      tags: buildTagLookup(tags.data ?? []),
      ready: !subjects.isLoading && !tags.isLoading,
    }),
    [subjects.data, subjects.isLoading, tags.data, tags.isLoading],
  );
}

/** Occurrences for one day already mapped into the `Task` view shape. */
export function useDayPlan(date: string = todayIso()) {
  const query = useDayTasks(date);
  const lookups = useTaskLookups();

  const tasks = useMemo(
    () => (query.data ?? []).map((occ) => toTask(occ, lookups.subjects, lookups.tags)),
    [query.data, lookups],
  );

  const anytime = useMemo(() => tasks.filter((t) => !t.time), [tasks]);
  const planned = useMemo(
    () =>
      tasks
        .filter((t) => t.time)
        .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? '')),
    [tasks],
  );

  return {
    ...query,
    occurrences: query.data ?? [],
    tasks,
    anytime,
    planned,
    doneCount: tasks.filter((t) => t.done).length,
  };
}

/** Today's tasks as the Focus screen's linkable rows. */
export function useLinkableTasks(date: string = todayIso()) {
  const query = useDayTasks(date);
  const lookups = useTaskLookups();
  const items = useMemo(
    () =>
      (query.data ?? [])
        .filter((occ) => occ.status !== 'COMPLETE')
        .map((occ) => toLinkableTask(occ, lookups.subjects, lookups.tags)),
    [query.data, lookups],
  );
  return { ...query, items };
}

/* ── Mutations ──────────────────────────────────────────────────────── */

export function useCreateTask() {
  return useMutation({
    mutationFn: (input: CreateTaskInput) => apiFns.createTask(input),
    onSuccess: invalidatePlan,
  });
}

/**
 * Optimistic done/undone.
 *
 * The checkbox has to feel instant, so the day's cache is patched before the
 * request lands and rolled back if it fails. The server response is not written
 * into the cache directly — completing an occurrence can change its id (the
 * virtual `series@date` becomes a materialised uuid), so a refetch is the only
 * way to end up with ids that stay valid for the next toggle.
 */
export function useToggleTask(date: string) {
  const client = useQueryClient();
  const key = qk.tasksDay(date);

  return useMutation({
    mutationFn: (occId: string) => apiFns.toggleTask(occId),
    onMutate: async (occId: string) => {
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<OccurrenceDto[]>(key);
      client.setQueryData<OccurrenceDto[]>(key, (old) =>
        (old ?? []).map((t) =>
          t.id === occId ? { ...t, status: t.status === 'COMPLETE' ? 'PENDING' : 'COMPLETE' } : t,
        ),
      );
      return { previous };
    },
    onError: (_err, _occId, ctx) => {
      if (ctx?.previous) client.setQueryData(key, ctx.previous);
    },
    onSettled: invalidatePlan,
  });
}

export function usePatchTask() {
  return useMutation({
    mutationFn: ({ occId, patch }: { occId: string; patch: PatchTaskInput }) =>
      apiFns.patchTask(occId, patch),
    onSuccess: invalidatePlan,
  });
}

export function useDeleteTask() {
  return useMutation({
    mutationFn: (occId: string) => apiFns.deleteTask(occId),
    onSuccess: invalidatePlan,
  });
}

export function useMoveTasks() {
  return useMutation({
    mutationFn: (input: { from: string; to: string; ids?: string[] }) => apiFns.moveTasks(input),
    onSuccess: invalidatePlan,
  });
}

/** "Break into steps" — AI-backed, with a deterministic server-side fallback. */
export function useBreakdownTask() {
  return useMutation({
    mutationFn: ({ occId, date }: { occId: string; date?: string }) =>
      apiFns.breakdownTask(occId, date),
    onSuccess: invalidatePlan,
  });
}
