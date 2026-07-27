import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as apiFns from '../../lib/api';
import type { BoardPostDto } from '../../lib/api';
import { qk } from '../../lib/queryClient';
import { useAuth } from '../useAuth';

/* The community feedback board — suggestions, votes, comments and the roadmap.

   Posts are addressed by their public `ref` number, not a uuid. `sort` accepts
   only `top` or `new`; anything else is a 422. */

export interface BoardFilters {
  status?: string;
  category?: string;
  sort?: 'top' | 'new';
  q?: string;
}

function useAuthed() {
  const { status } = useAuth();
  return status === 'guest' || status === 'signed-in';
}

export function useBoardMeta() {
  const enabled = useAuthed();
  return useQuery({
    queryKey: qk.boardMeta,
    enabled,
    staleTime: 10 * 60_000,
    queryFn: apiFns.getBoardMeta,
  });
}

export function useBoardPosts(filters: BoardFilters = {}) {
  const enabled = useAuthed();
  return useQuery({
    queryKey: qk.boardPosts(JSON.stringify(filters)),
    enabled,
    queryFn: async () => (await apiFns.listBoardPosts(filters)).posts,
  });
}

export function useBoardPost(ref: string | number | undefined) {
  const enabled = useAuthed();
  return useQuery({
    queryKey: qk.boardPost(ref ?? ''),
    enabled: ref !== undefined && ref !== '' && enabled,
    queryFn: () => apiFns.getBoardPost(ref as string | number),
  });
}

export function useBoardRoadmap() {
  const enabled = useAuthed();
  return useQuery({
    queryKey: qk.boardRoadmap,
    enabled,
    queryFn: async () => (await apiFns.getBoardRoadmap()).groups,
  });
}

export function useChangelog() {
  const enabled = useAuthed();
  return useQuery({
    queryKey: qk.changelog,
    enabled,
    queryFn: async () => (await apiFns.listChangelog()).entries,
  });
}

export function useCreateBoardPost() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { title: string; body?: string; category?: string }) =>
      apiFns.createBoardPost(input),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['board'] });
    },
  });
}

/**
 * Toggle an upvote. Optimistic on every cached list and on the detail row so
 * the count moves the instant the pill is pressed.
 */
export function useToggleBoardVote() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ ref, voted }: { ref: number; voted: boolean }) =>
      voted ? apiFns.unvoteBoardPost(ref) : apiFns.voteBoardPost(ref),
    onMutate: async ({ ref, voted }) => {
      await client.cancelQueries({ queryKey: ['board'] });
      const delta = voted ? -1 : 1;

      const patch = (post: BoardPostDto): BoardPostDto =>
        post.ref === ref
          ? { ...post, upvotes: Math.max(0, post.upvotes + delta), you_voted: !voted }
          : post;

      const snapshots = client.getQueriesData<unknown>({ queryKey: ['board'] });
      for (const [key, value] of snapshots) {
        if (Array.isArray(value)) {
          client.setQueryData(key, (value as BoardPostDto[]).map(patch));
        } else if (value && typeof value === 'object' && 'ref' in (value as BoardPostDto)) {
          client.setQueryData(key, patch(value as BoardPostDto));
        }
      }
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      for (const [key, value] of ctx?.snapshots ?? []) client.setQueryData(key, value);
    },
    onSettled: () => {
      void client.invalidateQueries({ queryKey: ['board'] });
    },
  });
}

export function useCommentOnPost() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ ref, body }: { ref: number; body: string }) =>
      apiFns.commentOnBoardPost(ref, body),
    onSuccess: (_res, vars) => {
      void client.invalidateQueries({ queryKey: qk.boardPost(vars.ref) });
      void client.invalidateQueries({ queryKey: ['board', 'posts'] });
    },
  });
}

export function useToggleSubscription() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ ref, subscribed }: { ref: number; subscribed: boolean }) =>
      subscribed ? apiFns.unsubscribeBoardPost(ref) : apiFns.subscribeBoardPost(ref),
    onSuccess: (_res, vars) => {
      void client.invalidateQueries({ queryKey: qk.boardPost(vars.ref) });
    },
  });
}

/** Duplicate-check shown while composing a suggestion. */
export function useSimilarPosts(q: string, enabled: boolean) {
  const authed = useAuthed();
  return useQuery({
    queryKey: ['board', 'similar', q],
    enabled: authed && enabled && q.trim().length >= 3,
    queryFn: async () => (await apiFns.findSimilarPosts(q.trim())).similar,
  });
}

/**
 * Posting, voting, commenting and subscribing all 403 for guests
 * ("Create an account to …"). Screens use this to show the upgrade nudge
 * instead of letting the request fail.
 */
export function useBoardCanParticipate(): boolean {
  const { status } = useAuth();
  return status === 'signed-in';
}
