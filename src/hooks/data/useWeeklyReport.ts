import { useQuery } from '@tanstack/react-query';

import * as apiFns from '../../lib/api';
import { qk } from '../../lib/queryClient';
import { toWeeklyReport } from '../../lib/weeklyReport';
import { useAuth } from '../useAuth';

/* The weekly report — The Core.

   One read for the whole story: five sequential round trips would be a visibly
   assembling dashboard, which is exactly what this design is not.

   Guests are included. A guest's week is a real week, and the endpoint serves
   one; gating it behind an account would monetise a student's curiosity about
   themselves. */

function useAuthed() {
  const { status } = useAuth();
  return status === 'guest' || status === 'signed-in';
}

/** The current week, mapped to the view model. There is no way to ask for another week. */
export function useWeeklyReport() {
  const enabled = useAuthed();
  return useQuery({
    queryKey: qk.weeklyReport,
    enabled,
    queryFn: async () => toWeeklyReport(await apiFns.getWeeklyReport()),
  });
}
