import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as apiFns from '../../lib/api';
import type { AdaActionDto, AdaMessageDto } from '../../lib/api';
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

/* ── Proposed changes ──────────────────────────────────────────────────

   Ada only ever proposes; the backend parks each create/update/delete as a
   pending action and applies nothing until one of these runs. A decision can
   come back with a follow-up assistant message ("done — moved to Thursday"),
   so the thread is patched in place rather than refetched.

   `invalidatePlan()` runs on approval because an executed action is a real
   write to tasks/subjects/terms. */

/** Patch one action inside the cached thread, leaving everything else alone. */
function patchAction(
  client: ReturnType<typeof useQueryClient>,
  conversationId: string,
  action: AdaActionDto,
  followUp?: AdaMessageDto | null,
) {
  client.setQueryData(qk.messages(conversationId), (old: unknown) => {
    if (!Array.isArray(old)) return old;
    const messages = (old as AdaMessageDto[]).map((m) =>
      m.actions?.some((a) => a.id === action.id)
        ? { ...m, actions: m.actions.map((a) => (a.id === action.id ? action : a)) }
        : m,
    );
    return followUp ? [...messages, followUp] : messages;
  });
}

export function useDecideAdaAction(conversationId: string | undefined) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ actionId, approve }: { actionId: string; approve: boolean }) =>
      approve ? apiFns.approveAdaAction(actionId) : apiFns.rejectAdaAction(actionId),
    onSuccess: (res, vars) => {
      if (conversationId) patchAction(client, conversationId, res.action, res.message);
      if (vars.approve) invalidatePlan();
    },
  });
}

/** Approve or reject every outstanding action in the conversation at once. */
export function useDecideAllAdaActions(conversationId: string | undefined) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (approve: boolean) =>
      apiFns.decideAllAdaActions(conversationId as string, approve),
    onSuccess: (res, approve) => {
      if (conversationId) {
        const decided = new Map(res.actions.map((a) => [a.id, a]));
        client.setQueryData(qk.messages(conversationId), (old: unknown) => {
          if (!Array.isArray(old)) return old;
          const messages = (old as AdaMessageDto[]).map((m) =>
            m.actions?.length
              ? { ...m, actions: m.actions.map((a) => decided.get(a.id) ?? a) }
              : m,
          );
          return res.messages.length ? [...messages, ...res.messages] : messages;
        });
      }
      if (approve) invalidatePlan();
    },
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
