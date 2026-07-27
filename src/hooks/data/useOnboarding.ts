import { useMutation } from '@tanstack/react-query';

import * as apiFns from '../../lib/api';
import type { OnboardingInput } from '../../lib/api';
import { queryClient } from '../../lib/queryClient';

/* Onboarding submits the whole wizard in one atomic, idempotent call: profile
   name, the first semester, every subject (with any staged syllabus), the daily
   focus goal and the peak-hours answer. Re-running it returns
   `already_completed` rather than duplicating anything. */

export function useCompleteOnboarding() {
  return useMutation({
    mutationFn: (input: OnboardingInput) => apiFns.completeOnboarding(input),
    onSuccess: () => {
      // Onboarding writes across nearly every domain — start clean.
      void queryClient.invalidateQueries();
    },
  });
}

/** Stage a syllabus before its subject exists (upload → key handed to complete). */
export function useUploadStagedSyllabus() {
  return useMutation({
    mutationFn: (file: File) => apiFns.uploadStagedSyllabus(file),
  });
}

export function useValidateReferral() {
  return useMutation({
    mutationFn: (code: string) => apiFns.validateReferral(code),
  });
}
