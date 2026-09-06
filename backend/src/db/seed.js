/**
 * Fills an empty database with realistic sample data so the UI has something
 * to show. Safe to run repeatedly: it wipes the tables it owns first.
 *   npm run seed
 */
import { db } from './index.js';
import { runMigrations } from './migrate.js';
import { logger } from '../lib/logger.js';

runMigrations();

const daysAgo = (n, hour = 10) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};
const daysAhead = (n, hour = 14) => daysAgo(-n, hour);

const COMPANIES = [
  { name: 'Linear', website: 'https://linear.app', industry: 'Developer tools', location: 'Remote' },
  { name: 'Stripe', website: 'https://stripe.com', industry: 'Fintech', location: 'San Francisco, CA' },
  { name: 'Vercel', website: 'https://vercel.com', industry: 'Developer tools', location: 'Remote' },
  { name: 'Notion', website: 'https://notion.so', industry: 'Productivity', location: 'San Francisco, CA' },
  { name: 'Figma', website: 'https://figma.com', industry: 'Design', location: 'New York, NY' },
  { name: 'Ramp', website: 'https://ramp.com', industry: 'Fintech', location: 'New York, NY' },
  { name: 'Cloudflare', website: 'https://cloudflare.com', industry: 'Infrastructure', location: 'Austin, TX' },
];

const APPLICATIONS = [
  { company: 'Linear', role: 'Senior Frontend Engineer', status: 'interviewing', priority: 3, source: 'Referral', workMode: 'remote', salaryMin: 170000, salaryMax: 200000, appliedDaysAgo: 21, location: 'Remote (US)' },
  { company: 'Stripe', role: 'Product Engineer', status: 'screening', priority: 3, source: 'LinkedIn', workMode: 'hybrid', salaryMin: 180000, salaryMax: 215000, appliedDaysAgo: 12, location: 'San Francisco, CA', nextAction: 'Send recruiter my availability', nextActionDaysAhead: 1 },
  { company: 'Vercel', role: 'Full Stack Engineer', status: 'offer', priority: 3, source: 'Company site', workMode: 'remote', salaryMin: 165000, salaryMax: 190000, appliedDaysAgo: 34, location: 'Remote', nextAction: 'Respond to the offer', nextActionDaysAhead: 2 },
  { company: 'Notion', role: 'Software Engineer, Web', status: 'applied', priority: 2, source: 'LinkedIn', workMode: 'hybrid', salaryMin: 160000, salaryMax: 185000, appliedDaysAgo: 14, location: 'San Francisco, CA' },
  { company: 'Figma', role: 'Frontend Engineer, Design Systems', status: 'rejected', priority: 2, source: 'Job board', workMode: 'onsite', appliedDaysAgo: 45, location: 'New York, NY' },
  { company: 'Ramp', role: 'Software Engineer', status: 'applied', priority: 1, source: 'Job board', workMode: 'hybrid', appliedDaysAgo: 9, location: 'New York, NY', nextAction: 'Follow up with the recruiter', nextActionDaysAhead: -1 },
  { company: 'Cloudflare', role: 'Systems Engineer', status: 'saved', priority: 2, source: 'Company site', workMode: 'remote', location: 'Remote' },
];

const reset = db.transaction(() => {
  for (const table of ['activities', 'documents', 'interviews', 'contacts', 'applications', 'companies']) {
    db.prepare(`DELETE FROM ${table}`).run();
    db.prepare('DELETE FROM sqlite_sequence WHERE name = ?').run(table);
  }

  const insertCompany = db.prepare(
    'INSERT INTO companies (name, website, industry, location) VALUES (?, ?, ?, ?)',
  );
  const companyIds = new Map();
  for (const c of COMPANIES) {
    const { lastInsertRowid } = insertCompany.run(c.name, c.website, c.industry, c.location);
    companyIds.set(c.name, Number(lastInsertRowid));
  }

  const insertApp = db.prepare(
    `INSERT INTO applications
      (company_id, role, status, priority, source, location, work_mode, employment_type,
       salary_min, salary_max, applied_at, next_action, next_action_at, board_order, job_description, notes)
     VALUES (@company_id, @role, @status, @priority, @source, @location, @work_mode, 'full_time',
             @salary_min, @salary_max, @applied_at, @next_action, @next_action_at, @board_order,
             @job_description, @notes)`,
  );
  const insertActivity = db.prepare(
    `INSERT INTO activities (application_id, type, message, payload, occurred_at)
     VALUES (?, ?, ?, ?, ?)`,
  );

  const appIds = new Map();
  APPLICATIONS.forEach((a, index) => {
    const appliedAt = a.appliedDaysAgo != null ? daysAgo(a.appliedDaysAgo) : null;
    const { lastInsertRowid } = insertApp.run({
      company_id: companyIds.get(a.company),
      role: a.role,
      status: a.status,
      priority: a.priority,
      source: a.source ?? null,
      location: a.location ?? null,
      work_mode: a.workMode ?? null,
      salary_min: a.salaryMin ?? null,
      salary_max: a.salaryMax ?? null,
      applied_at: appliedAt,
      next_action: a.nextAction ?? null,
      next_action_at: a.nextActionDaysAhead != null ? daysAhead(a.nextActionDaysAhead) : null,
      board_order: index,
      job_description: `We are looking for a ${a.role} to join ${a.company}. You will own features end to end, work closely with design, and help shape the roadmap.`,
      notes: null,
    });
    const id = Number(lastInsertRowid);
    appIds.set(a.company, id);

    insertActivity.run(id, 'created', `Added ${a.role} at ${a.company}`, JSON.stringify({ status: 'saved' }), appliedAt || daysAgo(2));
    if (appliedAt) {
      insertActivity.run(id, 'status_change', 'Saved → Applied', JSON.stringify({ from: 'saved', to: 'applied' }), appliedAt);
    }
  });

  // A believable history so the funnel and response-time charts have data.
  const LABELS = {
    saved: 'Saved', applied: 'Applied', screening: 'Screening', interviewing: 'Interviewing',
    offer: 'Offer', accepted: 'Accepted', rejected: 'Rejected', withdrawn: 'Withdrawn',
  };
  const progress = [
    ['Linear', 'applied', 'screening', 14], ['Linear', 'screening', 'interviewing', 7],
    ['Stripe', 'applied', 'screening', 5],
    ['Vercel', 'applied', 'screening', 28], ['Vercel', 'screening', 'interviewing', 18], ['Vercel', 'interviewing', 'offer', 4],
    ['Figma', 'applied', 'screening', 38], ['Figma', 'screening', 'rejected', 30],
  ];
  for (const [company, from, to, ago] of progress) {
    insertActivity.run(
      appIds.get(company), 'status_change',
      `${LABELS[from]} → ${LABELS[to]}`, JSON.stringify({ from, to }), daysAgo(ago),
    );
  }

  const insertContact = db.prepare(
    `INSERT INTO contacts (company_id, application_id, name, title, email, relationship, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  insertContact.run(companyIds.get('Linear'), appIds.get('Linear'), 'Priya Raman', 'Engineering Manager', 'priya@example.com', 'hiring_manager', 'Straight talker, cares about product sense.');
  insertContact.run(companyIds.get('Stripe'), appIds.get('Stripe'), 'Marcus Webb', 'Technical Recruiter', 'marcus@example.com', 'recruiter', 'Responds fastest in the morning.');
  insertContact.run(companyIds.get('Vercel'), appIds.get('Vercel'), 'Dana Cole', 'Staff Engineer', 'dana@example.com', 'referral', 'Former coworker - referred me in.');

  const insertInterview = db.prepare(
    `INSERT INTO interviews (application_id, stage, scheduled_at, duration_minutes, format, location, interviewers, prep_notes, outcome)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  insertInterview.run(appIds.get('Linear'), 'Recruiter screen', daysAgo(14), 30, 'phone', null, 'Priya Raman', null, 'passed');
  insertInterview.run(appIds.get('Linear'), 'Technical deep dive', daysAhead(2, 11), 60, 'video', 'https://meet.example.com/linear', 'Two senior engineers', 'Review my React rendering notes and the last project I shipped.', 'scheduled');
  insertInterview.run(appIds.get('Vercel'), 'Final round', daysAgo(6), 90, 'video', null, 'Hiring panel', null, 'passed');
  insertInterview.run(appIds.get('Stripe'), 'Recruiter screen', daysAhead(4, 9), 30, 'phone', null, 'Marcus Webb', 'Have my salary range ready.', 'scheduled');

  const insertDocument = db.prepare(
    'INSERT INTO documents (application_id, title, kind, version_label, notes) VALUES (?, ?, ?, ?, ?)',
  );
  insertDocument.run(appIds.get('Linear'), 'Resume - frontend focus', 'resume', 'v3', 'Leads with the design-systems work.');
  insertDocument.run(appIds.get('Vercel'), 'Cover letter - Vercel', 'cover_letter', 'v1', null);
  insertDocument.run(null, 'Resume - general', 'resume', 'v2', 'The one I send when there is no strong angle.');
});

reset();
logger.ready('Seeded the database with sample applications, contacts, interviews and documents.');
