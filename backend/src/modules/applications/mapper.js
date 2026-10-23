import { toBool } from '../../lib/sql.js';

/** DB row -> API shape (camelCase, booleans, nested company). */
export const serializeApplication = (row) =>
  row && {
    id: row.id,
    role: row.role,
    status: row.status,
    priority: row.priority,
    source: row.source,
    jobUrl: row.job_url,
    location: row.location,
    workMode: row.work_mode,
    employmentType: row.employment_type,
    salaryMin: row.salary_min,
    salaryMax: row.salary_max,
    salaryCurrency: row.salary_currency,
    jobDescription: row.job_description,
    summary: row.summary ?? null,
    notes: row.notes,
    appliedAt: row.applied_at,
    nextAction: row.next_action,
    nextActionAt: row.next_action_at,
    boardOrder: row.board_order,
    archived: toBool(row.archived),
    company: {
      id: row.company_id,
      name: row.company_name,
      website: row.company_website ?? null,
    },
    counts: {
      interviews: row.interview_count ?? 0,
      contacts: row.contact_count ?? 0,
      documents: row.document_count ?? 0,
    },
    nextInterviewAt: row.next_interview_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

/** API shape -> DB row. Only defined keys are included, so PATCH stays partial. */
export const toApplicationRow = (input) => {
  const map = {
    companyId: 'company_id',
    role: 'role',
    status: 'status',
    priority: 'priority',
    source: 'source',
    jobUrl: 'job_url',
    location: 'location',
    workMode: 'work_mode',
    employmentType: 'employment_type',
    salaryMin: 'salary_min',
    salaryMax: 'salary_max',
    salaryCurrency: 'salary_currency',
    jobDescription: 'job_description',
    summary: 'summary',
    notes: 'notes',
    appliedAt: 'applied_at',
    nextAction: 'next_action',
    nextActionAt: 'next_action_at',
  };

  const row = {};
  for (const [from, to] of Object.entries(map)) {
    if (input[from] !== undefined) row[to] = input[from];
  }
  if (input.archived !== undefined) row.archived = input.archived ? 1 : 0;
  return row;
};
