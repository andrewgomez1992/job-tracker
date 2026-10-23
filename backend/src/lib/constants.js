/** Single source of truth for the domain vocabulary, shared by every module. */

export const APPLICATION_STATUSES = [
  'saved',
  'applied',
  'screening',
  'interviewing',
  'offer',
  'accepted',
  'rejected',
  'withdrawn',
];

/** Statuses that still need action from you. */
export const ACTIVE_STATUSES = ['saved', 'applied', 'screening', 'interviewing', 'offer'];

/** Statuses that end the process, one way or another. */
export const CLOSED_STATUSES = ['accepted', 'rejected', 'withdrawn'];

/** Reaching one of these means the company replied to you. */
export const RESPONDED_STATUSES = ['screening', 'interviewing', 'offer', 'accepted'];

/** The ordered funnel used by the analytics module. */
export const FUNNEL_STAGES = [
  { key: 'applied', label: 'Applied', reaches: ['applied', 'screening', 'interviewing', 'offer', 'accepted', 'rejected', 'withdrawn'] },
  { key: 'screening', label: 'Screening', reaches: ['screening', 'interviewing', 'offer', 'accepted'] },
  { key: 'interviewing', label: 'Interviewing', reaches: ['interviewing', 'offer', 'accepted'] },
  { key: 'offer', label: 'Offer', reaches: ['offer', 'accepted'] },
  { key: 'accepted', label: 'Accepted', reaches: ['accepted'] },
];

export const WORK_MODES = ['remote', 'hybrid', 'onsite'];
export const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract', 'internship'];
export const CONTACT_RELATIONSHIPS = ['recruiter', 'hiring_manager', 'referral', 'peer', 'other'];
export const INTERVIEW_FORMATS = ['phone', 'video', 'onsite', 'take_home'];
export const INTERVIEW_OUTCOMES = ['scheduled', 'completed', 'passed', 'failed', 'cancelled', 'no_show'];
export const DOCUMENT_KINDS = ['resume', 'cover_letter', 'portfolio', 'offer_letter', 'other'];

/**
 * Automatic follow-ups. When a job moves to Applied with no reminder set,
 * Trail schedules "reach out" in 2 days; marking that done schedules a
 * "follow up" 7 days after you applied. Set to false to turn it off.
 */
export const AUTO_FOLLOWUPS = true;
export const AUTO_REACH_OUT = 'Reach out to someone on the team';
export const AUTO_FOLLOW_UP = 'Follow up if no reply yet';
