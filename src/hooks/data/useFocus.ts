import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as apiFns from '../../lib/api';
import type { PrismPreferencesDto } from '../../lib/api';
import { invalidatePlan, qk } from '../../lib/queryClient';
import { useAuth } from '../useAuth';

/* Focus sessions + the Prism soundscape catalogue.

   The timer ticks client-side (there is no server tick event). The server row
   exists so progress survives a reload and so completing a session can mark its
   linked task done — the client checkpoints on pause/resume/blur, not per
   second. */

function useAuthed() {
  const { status } = useAuth();
  return status === 'guest' || status === 'signed-in';
}

export function usePrismModes() {
  const enabled = useAuthed();
  return useQuery({
    queryKey: qk.prismModes,
    enabled,
    staleTime: 10 * 60_000,
    queryFn: async () => (await apiFns.listPrismModes()).modes,
  });
}

export function usePrismPreferences() {
  const enabled = useAuthed();
  return useQuery({ queryKey: qk.prismPrefs, enabled, queryFn: apiFns.getPrismPreferences });
}

export function useUpdatePrismPreferences() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<PrismPreferencesDto>) => apiFns.updatePrismPreferences(patch),
    onSuccess: (prefs) => client.setQueryData(qk.prismPrefs, prefs),
  });
}

export function useStartFocusSession() {
  return useMutation({
    mutationFn: (input: {
      planned_min?: number;
      prism_mode?: string;
      task_id?: string;
      task_date?: string;
    }) => apiFns.startFocusSession(input),
  });
}

export function useCheckpointFocusSession() {
  return useMutation({
    mutationFn: ({
      id,
      elapsedSec,
      status,
    }: {
      id: string;
      elapsedSec?: number;
      status?: 'RUNNING' | 'PAUSED';
    }) => apiFns.checkpointFocusSession(id, { elapsed_sec: elapsedSec, status }),
  });
}

/** Finalises the session; also marks a linked task done and feeds the streak. */
export function useCompleteFocusSession() {
  return useMutation({
    mutationFn: ({ id, elapsedSec, moodIndex }: { id: string; elapsedSec?: number; moodIndex?: number }) =>
      apiFns.completeFocusSession(id, { elapsed_sec: elapsedSec, mood_index: moodIndex }),
    onSuccess: invalidatePlan,
  });
}
