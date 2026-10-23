import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useHype } from '../features/hype/HypeProvider.jsx';
import { api } from './client.js';

/**
 * Query keys live in one object so invalidation is never a guess.
 */
export const keys = {
  meta: ['meta'],
  applications: (filters) => ['applications', filters ?? {}],
  application: (id) => ['application', Number(id)],
  board: ['board'],
  timeline: (id) => ['timeline', Number(id)],
  companies: (filters) => ['companies', filters ?? {}],
  contacts: (filters) => ['contacts', filters ?? {}],
  interviews: (filters) => ['interviews', filters ?? {}],
  documents: (filters) => ['documents', filters ?? {}],
  activities: (limit) => ['activities', limit ?? 30],
  reminders: ['reminders'],
  analytics: (weeks) => ['analytics', weeks ?? 12],
  daily: ['analytics', 'daily'],
  stories: ['stories'],
};

/** Anything that can change a pipeline number invalidates these. */
const DERIVED = [keys.board, keys.reminders, ['analytics'], ['applications'], ['activities']];

const useInvalidator = () => {
  const client = useQueryClient();
  return (extra = []) => {
    for (const key of [...DERIVED, ...extra]) {
      client.invalidateQueries({ queryKey: key });
    }
  };
};

/* ------------------------------------------------------------------ reads */

export const useMeta = () =>
  useQuery({ queryKey: keys.meta, queryFn: () => api.get('/meta'), staleTime: Infinity });

export const useApplications = (filters) =>
  useQuery({ queryKey: keys.applications(filters), queryFn: () => api.get('/applications', { params: filters }) });

export const useApplication = (id) =>
  useQuery({ queryKey: keys.application(id), queryFn: () => api.get(`/applications/${id}`), enabled: Boolean(id) });

export const useBoard = () =>
  useQuery({ queryKey: keys.board, queryFn: () => api.get('/applications/board') });

export const useTimeline = (id) =>
  useQuery({ queryKey: keys.timeline(id), queryFn: () => api.get(`/applications/${id}/timeline`), enabled: Boolean(id) });

export const useCompanies = (filters) =>
  useQuery({ queryKey: keys.companies(filters), queryFn: () => api.get('/companies', { params: filters }) });

export const useContacts = (filters) =>
  useQuery({ queryKey: keys.contacts(filters), queryFn: () => api.get('/contacts', { params: filters }) });

export const useInterviews = (filters) =>
  useQuery({ queryKey: keys.interviews(filters), queryFn: () => api.get('/interviews', { params: filters }) });

export const useDocuments = (filters) =>
  useQuery({ queryKey: keys.documents(filters), queryFn: () => api.get('/documents', { params: filters }) });

export const useActivities = (limit = 20) =>
  useQuery({ queryKey: keys.activities(limit), queryFn: () => api.get('/activities', { params: { limit } }) });

export const useReminders = () =>
  useQuery({ queryKey: keys.reminders, queryFn: () => api.get('/reminders'), refetchInterval: 5 * 60 * 1000 });

export const useAnalytics = (weeks = 12) =>
  useQuery({ queryKey: keys.analytics(weeks), queryFn: () => api.get('/analytics/overview', { params: { weeks } }) });

export const useDaily = () =>
  useQuery({ queryKey: keys.daily, queryFn: () => api.get('/analytics/daily', { params: { days: 60 } }) });

export const useStories = () =>
  useQuery({ queryKey: keys.stories, queryFn: () => api.get('/stories') });

/* ----------------------------------------------------------------- writes */

export function useSaveStory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => (id ? api.patch(`/stories/${id}`, body) : api.post('/stories', body)),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.stories }),
  });
}

export function useDeleteStory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/stories/${id}`),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.stories }),
  });
}


const HYPE_STATUS = new Set(['screening', 'interviewing', 'offer']);

export function useCreateApplication() {
  const client = useQueryClient();
  const hype = useHype();
  const invalidate = useInvalidator();
  return useMutation({
    mutationFn: (body) => api.post('/applications', body),
    onSuccess: (data) => {
      // Saved-for-later jobs don't count; anything already applied does.
      if (data?.status && data.status !== 'saved') {
        const applied = client.getQueryData(keys.analytics(12))?.totals?.applied;
        const today = client.getQueryData(keys.daily)?.today;
        let goal = 20;
        try { goal = Number(JSON.parse(localStorage.getItem('trail.goal'))) || 20; } catch { /* default */ }
        hype.fire(HYPE_STATUS.has(data.status) ? data.status : 'applied', {
          count: applied != null ? applied + 1 : undefined,
          goalHit: today != null && today + 1 === goal ? goal : undefined,
        });
      }
      invalidate([keys.companies()]);
    },
  });
}

export function useUpdateApplication() {
  const client = useQueryClient();
  const hype = useHype();
  const invalidate = useInvalidator();
  return useMutation({
    mutationFn: ({ id, ...body }) => api.patch(`/applications/${id}`, body),
    onSuccess: (data) => {
      const before = client.getQueryData(keys.application(data.id))?.status;
      if (before && before !== data.status) {
        if (HYPE_STATUS.has(data.status)) hype.fire(data.status);
        else if (before === 'saved' && data.status === 'applied') hype.fire('applied');
      }
      client.setQueryData(keys.application(data.id), data);
      invalidate([keys.timeline(data.id), keys.companies()]);
    },
  });
}

export function useDeleteApplication() {
  const invalidate = useInvalidator();
  return useMutation({
    mutationFn: (id) => api.delete(`/applications/${id}`),
    onSuccess: () => invalidate([['contacts'], ['interviews'], ['documents']]),
  });
}

/** Board drag and drop. Optimistic, because a card must never lag the finger. */
export function useReorderBoard() {
  const client = useQueryClient();
  const hype = useHype();
  const invalidate = useInvalidator();
  return useMutation({
    mutationFn: (body) => api.post('/applications/reorder', body),
    onMutate: async (variables) => {
      await client.cancelQueries({ queryKey: keys.board });
      const previous = client.getQueryData(keys.board);
      // A card that wasn't already in this column was just moved into it.
      const had = new Set((previous?.[variables.status] ?? []).map((a) => a.id));
      if (previous && variables.orderedIds?.some((id) => !had.has(id))) {
        if (HYPE_STATUS.has(variables.status)) hype.fire(variables.status);
        else if (variables.status === 'applied') hype.fire('applied');
      }
      if (variables.optimisticBoard) client.setQueryData(keys.board, variables.optimisticBoard);
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) client.setQueryData(keys.board, context.previous);
    },
    onSuccess: (data) => client.setQueryData(keys.board, data),
    onSettled: () => invalidate(),
  });
}

export function useAddNote() {
  const invalidate = useInvalidator();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ applicationId, ...body }) => api.post(`/applications/${applicationId}/notes`, body),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: keys.timeline(variables.applicationId) });
      invalidate();
    },
  });
}

const crud = (resource, extraKeys = []) => ({
  useCreate() {
    const invalidate = useInvalidator();
    return useMutation({
      mutationFn: (body) => api.post(`/${resource}`, body),
      onSuccess: () => invalidate([[resource], ...extraKeys]),
    });
  },
  useUpdate() {
    const invalidate = useInvalidator();
    return useMutation({
      mutationFn: ({ id, ...body }) => api.patch(`/${resource}/${id}`, body),
      onSuccess: () => invalidate([[resource], ...extraKeys]),
    });
  },
  useDelete() {
    const invalidate = useInvalidator();
    return useMutation({
      mutationFn: (id) => api.delete(`/${resource}/${id}`),
      onSuccess: () => invalidate([[resource], ...extraKeys]),
    });
  },
});

export const contactMutations = crud('contacts');
export const interviewMutations = crud('interviews');
export const companyMutations = crud('companies');
export const documentMutations = crud('documents');

/** Documents can carry a file, so this one posts FormData instead of JSON. */
export function useUploadDocument() {
  const invalidate = useInvalidator();
  return useMutation({
    mutationFn: ({ file, ...fields }) => {
      const form = new FormData();
      for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined && value !== null && value !== '') form.append(key, value);
      }
      if (file) form.append('file', file);
      return api.post('/documents', form);
    },
    onSuccess: () => invalidate([['documents']]),
  });
}
