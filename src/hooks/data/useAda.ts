import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as apiFns from '../../lib/api';
import { invalidatePlan, qk } from '../../lib/queryClient';
import { useAuth } from '../useAuth';

/* Ada chat.

   Transport is plain request/response — the POST blocks until the whole
   assistant turn is ready, so screens show a thinking state rather than
   streaming chunks. A reply may carry a `plan`; nothing is written to the
   user's calendar until they confirm it and the client calls `apply-plan`,
   which validates every field server-side. */

export function useConversations() {
  const { status } = useAuth();
  return useQuery({
    queryKey: qk.conversations,
    // Ada is account-only — guests see the locked screen instead.
    enabled: status === 'signed-in',
    queryFn: async () => (await apiFns.listConversations()).conversations,
  });
}

export function useMessages(conversationId: string | undefined) {
  const { status } = useAuth();
  return useQuery({
    queryKey: qk.messages(conversationId ?? ''),
    enabled: Boolean(conversationId) && status === 'signed-in',
    queryFn: async () => (await apiFns.listMessages(conversationId as string)).messages,
  });
}

export function useCreateConversation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (title?: string) => apiFns.createConversation(title),
    onSuccess: () => client.invalidateQueries({ queryKey: qk.conversations }),
  });
}

export function useSendMessage() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      conversationId,
      text,
      attachments,
    }: {
      conversationId: string;
      text: string;
      attachments?: { key: string; name: string; mime_type?: string }[];
    }) => apiFns.sendMessage(conversationId, text, attachments),
    onSuccess: (res, vars) => {
      // Append both turns rather than refetching — the POST already returned them.
      client.setQueryData(qk.messages(vars.conversationId), (old: unknown) =>
        Array.isArray(old) ? [...old, ...res.messages] : res.messages,
      );
      void client.invalidateQueries({ queryKey: qk.conversations });
    },
  });
}

export function useApplyPlan() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, messageId }: { conversationId: string; messageId: string }) =>
      apiFns.applyPlan(conversationId, messageId),
    onSuccess: (_res, vars) => {
      invalidatePlan();
      void client.invalidateQueries({ queryKey: qk.messages(vars.conversationId) });
    },
  });
}

/** "Plan my week" — 501 when no AI provider is configured on the project. */
export function usePlanWeek() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { start_date?: string; goal?: string }) => apiFns.planWeek(input),
    onSuccess: () => {
      invalidatePlan();
      void client.invalidateQueries({ queryKey: qk.conversations });
    },
  });
}

/** Presigns + uploads a chat attachment, returning the reference to send. */
export function useUploadAdaAttachment() {
  return useMutation({
    mutationFn: ({ conversationId, file }: { conversationId: string; file: File }) =>
      apiFns.uploadAdaAttachment(conversationId, file),
  });
}

export function useArchiveConversation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFns.archiveConversation(id),
    onSuccess: () => client.invalidateQueries({ queryKey: qk.conversations }),
  });
}

export function useClearChats() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: apiFns.clearChats,
    onSuccess: () => client.invalidateQueries({ queryKey: ['ada'] }),
  });
}
