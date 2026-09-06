/** Presentation-layer vocabulary. The server owns the values, this owns the words. */

export const STATUS_ORDER = [
  'saved', 'applied', 'screening', 'interviewing', 'offer', 'accepted', 'rejected', 'withdrawn',
];

/** Columns shown on the board, in pipeline order. */
export const BOARD_COLUMNS = ['saved', 'applied', 'screening', 'interviewing', 'offer', 'accepted'];

export const STATUS_META = {
  saved:        { label: 'Saved',        hint: 'Interesting, not applied yet' },
  applied:      { label: 'Applied',      hint: 'Sent, waiting to hear back' },
  screening:    { label: 'Screening',    hint: 'Recruiter or take-home stage' },
  interviewing: { label: 'Interviewing', hint: 'In the interview loop' },
  offer:        { label: 'Offer',        hint: 'They made an offer' },
  accepted:     { label: 'Accepted',     hint: 'You said yes' },
  rejected:     { label: 'Rejected',     hint: 'Closed - no offer' },
  withdrawn:    { label: 'Withdrawn',    hint: 'You stepped away' },
};

export const PRIORITY_META = {
  3: { label: 'High', short: 'H' },
  2: { label: 'Medium', short: 'M' },
  1: { label: 'Low', short: 'L' },
};

export const WORK_MODE_LABELS = { remote: 'Remote', hybrid: 'Hybrid', onsite: 'On-site' };

export const EMPLOYMENT_TYPE_LABELS = {
  full_time: 'Full time', part_time: 'Part time', contract: 'Contract', internship: 'Internship',
};

export const RELATIONSHIP_LABELS = {
  recruiter: 'Recruiter', hiring_manager: 'Hiring manager',
  referral: 'Referral', peer: 'Peer', other: 'Other',
};

export const INTERVIEW_FORMAT_LABELS = {
  phone: 'Phone', video: 'Video', onsite: 'On-site', take_home: 'Take-home',
};

export const INTERVIEW_OUTCOME_LABELS = {
  scheduled: 'Scheduled', completed: 'Completed', passed: 'Passed',
  failed: 'Did not pass', cancelled: 'Cancelled', no_show: 'No show',
};

export const DOCUMENT_KIND_LABELS = {
  resume: 'Resume', cover_letter: 'Cover letter', portfolio: 'Portfolio',
  offer_letter: 'Offer letter', other: 'Other',
};

export const SOURCE_SUGGESTIONS = [
  'LinkedIn', 'Referral', 'Company site', 'Job board', 'Recruiter outreach', 'Networking event', 'Other',
];

export const ACTIVITY_META = {
  created: { label: 'Added' },
  status_change: { label: 'Moved' },
  note: { label: 'Note' },
  reminder_set: { label: 'Reminder' },
  contact_added: { label: 'Contact' },
  interview_scheduled: { label: 'Interview' },
  interview_outcome: { label: 'Outcome' },
  document_added: { label: 'Document' },
  archived: { label: 'Archived' },
};
