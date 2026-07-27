import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as apiFns from '../../lib/api';
import { qk } from '../../lib/queryClient';
import { useAuth } from '../useAuth';

/* Study tags. The list seeds seven defaults on first read, so an empty array
   means "the call failed", not "the user has none". Deletion targets the label
   text, case-insensitively — not the id. */

export function useStudyTags() {
  const { status } = useAuth();
  return useQuery({
    queryKey: qk.tags,
    enabled: status === 'guest' || status === 'signed-in',
    staleTime: 5 * 60_000,
    queryFn: async () => (await apiFns.listStudyTags()).tags,
  });
}

export function useCreateStudyTag() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { label: string; color?: string }) => apiFns.createStudyTag(input),
    onSuccess: () => client.invalidateQueries({ queryKey: qk.tags }),
  });
}

export function useDeleteStudyTag() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (label: string) => apiFns.deleteStudyTag(label),
    onSuccess: () => client.invalidateQueries({ queryKey: qk.tags }),
  });
}
