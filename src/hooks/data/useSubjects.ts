import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as apiFns from '../../lib/api';
import type { SubjectInput } from '../../lib/api';
import { qk, queryClient } from '../../lib/queryClient';
import { toSemester, toSubject } from '../../lib/mappers';
import { useAuth } from '../useAuth';

/* Subjects, semesters and subject files. */

export function useSubjects(semesterId?: string) {
  const { status } = useAuth();
  return useQuery({
    queryKey: qk.subjects(semesterId),
    enabled: status === 'guest' || status === 'signed-in',
    queryFn: async () => (await apiFns.listSubjects(semesterId)).subjects,
  });
}

/** Subjects already mapped into the `Subject` view shape the screens render. */
export function useSubjectCards(semesterId?: string) {
  const query = useSubjects(semesterId);
  const subjects = useMemo(() => (query.data ?? []).map(toSubject), [query.data]);
  return { ...query, subjects, raw: query.data ?? [] };
}

export function useSubject(id: string | undefined) {
  const { status } = useAuth();
  return useQuery({
    queryKey: qk.subject(id ?? ''),
    enabled: Boolean(id) && (status === 'guest' || status === 'signed-in'),
    queryFn: () => apiFns.getSubject(id as string),
  });
}

export function useSemesters() {
  const { status } = useAuth();
  return useQuery({
    queryKey: qk.semesters,
    enabled: status === 'guest' || status === 'signed-in',
    queryFn: async () => (await apiFns.listSemesters()).semesters,
  });
}

/** Semesters with their subject/credit rollups, as the Semesters sheet draws them. */
export function useSemesterCards() {
  const semesters = useSemesters();
  const subjects = useSubjects();
  const cards = useMemo(
    () => (semesters.data ?? []).map((s) => toSemester(s, subjects.data ?? [])),
    [semesters.data, subjects.data],
  );
  return {
    ...semesters,
    cards,
    raw: semesters.data ?? [],
    active: (semesters.data ?? []).find((s) => s.is_active) ?? null,
  };
}

const invalidateSubjects = () => {
  void queryClient.invalidateQueries({ queryKey: ['subjects'] });
  void queryClient.invalidateQueries({ queryKey: qk.stats });
};

const invalidateSemesters = () => {
  void queryClient.invalidateQueries({ queryKey: ['semesters'] });
  invalidateSubjects();
};

export function useCreateSubject() {
  return useMutation({
    mutationFn: (input: SubjectInput) => apiFns.createSubject(input),
    onSuccess: invalidateSubjects,
  });
}

export function useUpdateSubject() {
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<SubjectInput> }) =>
      apiFns.updateSubject(id, patch),
    onSuccess: invalidateSubjects,
  });
}

export function useDeleteSubject() {
  return useMutation({
    mutationFn: (id: string) => apiFns.deleteSubject(id),
    onSuccess: invalidateSubjects,
  });
}

export function useReorderSubjects() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => apiFns.reorderSubjects(ids),
    onSuccess: (res) => {
      client.setQueryData(qk.subjects(undefined), res.subjects);
      invalidateSubjects();
    },
  });
}

export function useCreateSemester() {
  return useMutation({
    mutationFn: (input: { name: string; start: string; end: string }) =>
      apiFns.createSemester(input),
    onSuccess: invalidateSemesters,
  });
}

export function useUpdateSemester() {
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<{ name: string; start: string; end: string }> }) =>
      apiFns.updateSemester(id, patch),
    onSuccess: invalidateSemesters,
  });
}

export function useActivateSemester() {
  return useMutation({
    mutationFn: (id: string) => apiFns.activateSemester(id),
    onSuccess: invalidateSemesters,
  });
}

export function useDeleteSemester() {
  return useMutation({
    mutationFn: (id: string) => apiFns.deleteSemester(id),
    onSuccess: invalidateSemesters,
  });
}

/** init → PUT → commit. Rejects with an `ApiError` 501 when storage is unset. */
export function useUploadSubjectFile() {
  return useMutation({
    mutationFn: ({ subjectId, file, kind }: { subjectId: string; file: File; kind?: string }) =>
      apiFns.uploadSubjectFile(subjectId, file, kind),
    onSuccess: invalidateSubjects,
  });
}

export function useDeleteFile() {
  return useMutation({
    mutationFn: (id: string) => apiFns.deleteFile(id),
    onSuccess: invalidateSubjects,
  });
}

/** Resolves a short-lived signed URL and hands it to the browser. */
export function useDownloadFile() {
  return useMutation({
    mutationFn: async (id: string) => {
      const { url } = await apiFns.getFileDownloadUrl(id);
      window.open(url, '_blank', 'noopener,noreferrer');
      return url;
    },
  });
}
