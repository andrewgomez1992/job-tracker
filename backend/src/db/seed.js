/**
 * Fake sample data for demos and screenshots. Every company, person and
 * number here is made up.
 *
 *   npm run seed          -> rebuilds backend/data/demo.db
 *
 * It refuses to touch your real database: seedDatabase() only runs when the
 * server is in demo mode (see src/config/demo.js).
 */
import { pathToFileURL } from 'node:url';
import { db } from './index.js';
import { runMigrations } from './migrate.js';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

// Deterministic randomness so screenshots look the same every reseed.
let state = 42;
const rand = () => { state = (state * 1664525 + 1013904223) % 4294967296; return state / 4294967296; };
const pick = (list) => list[Math.floor(rand() * list.length)];

const at = (daysAgo, hour = 10, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

const COMPANY_NAMES = [
  'Northwind Labs', 'Bluepeak', 'Halcyon Health', 'Cobalt Pay', 'Fernway', 'Tidewater Analytics',
  'Lumen Freight', 'Orchard Learning', 'Pinecrest Software', 'Quarry', 'Saltbox', 'Kitebird',
  'Meridian Mobility', 'Brightlane', 'Copperleaf', 'Driftwood Data', 'Evergreen Billing', 'Foxglove',
  'Granite Cloud', 'Harborview', 'Ironbark', 'Juniper Commerce', 'Keystone HR', 'Larkspur',
  'Mosaic Media', 'Nimbus Retail', 'Oakline', 'Prism Finance', 'Redwood Robotics', 'Summit Travel',
  'Thistle', 'Upland Energy', 'Vantage Insurance', 'Willow Care', 'Yarrow', 'Zephyr Logistics',
  'Atlas Tutor', 'Beacon Legal', 'Cedar Mail', 'Delta Kitchen', 'Ember Games', 'Fable Books',
];
const ROLES = [
  'Software Engineer', 'Full Stack Engineer', 'Frontend Engineer', 'Senior Software Engineer',
  'Software Engineer II', 'Product Engineer', 'Full Stack Developer', 'React Developer',
  'Software Engineer, Payments', 'Backend Engineer (Node.js)',
];
const SOURCES = ['LinkedIn', 'LinkedIn', 'LinkedIn', 'Indeed', 'Company site', 'Wellfound', 'Referral', 'Built In'];
const MODES = ['remote', 'remote', 'remote', 'hybrid', 'onsite'];
const CITIES = ['Remote (US)', 'Remote (US)', 'San Francisco, CA', 'Sacramento, CA', 'Austin, TX', 'Denver, CO', 'New York, NY'];

const FEATURED_JD = `Northwind Labs builds scheduling and billing software for 30,000 small businesses.

We're hiring a Senior Full Stack Engineer to join our Payments team. You'll own features end to end: React and TypeScript on the front end, Node.js services and PostgreSQL behind them.

What you'll do
- Build subscription, invoicing and checkout flows used by thousands of customers every day
- Design REST APIs and integrate with Stripe webhooks
- Write well-tested code (Jest, Cypress) and review your teammates' pull requests
- Work with product and design in an Agile team, shipping weekly

What we're looking for
- 4+ years building production web apps with React, TypeScript and Node.js
- Strong SQL and data modelling skills
- Experience with payments or billing systems
- Comfort with AWS, Docker and CI/CD
- Bonus: GraphQL, Redis, system design experience

Salary: $150,000 - $175,000. Remote within the US.`;

const FEATURED_SUMMARY = `## The role
Senior full stack on the Payments team: React/TypeScript front end, Node.js + PostgreSQL behind it.

## Why it fits
- Billing and checkout is exactly what you built at your last job
- Stripe webhooks, subscriptions, trial-to-paid
- Remote, $150k - $175k

## Watch out for
- They want PostgreSQL, Docker and CI/CD. Have a story ready for each.`;

/** Build every table's rows. Only call against the demo database. */
export function seedDatabase() {
  if (!env.demoMode) {
    throw new Error('Refusing to seed: demo mode is off, so this would overwrite your real data. Set USE_DEMO_DATA = true in src/config/demo.js.');
  }
  runMigrations();
  state = 42;

  const run = db.transaction(() => {
    for (const table of ['activities', 'documents', 'interviews', 'contacts', 'applications', 'companies', 'stories']) {
      db.prepare(`DELETE FROM ${table}`).run();
      db.prepare('DELETE FROM sqlite_sequence WHERE name = ?').run(table);
    }

    const insertCompany = db.prepare('INSERT INTO companies (name, website, industry, location) VALUES (?, ?, ?, ?)');
    const companyIds = new Map();
    for (const name of COMPANY_NAMES) {
      const slug = name.toLowerCase().replace(/[^a-z]+/g, '');
      const { lastInsertRowid } = insertCompany.run(name, `https://${slug}.example.com`, null, null);
      companyIds.set(name, Number(lastInsertRowid));
    }

    const insertApp = db.prepare(
      `INSERT INTO applications
        (company_id, role, status, priority, source, job_url, location, work_mode, employment_type,
         salary_min, salary_max, applied_at, next_action, next_action_at, board_order,
         job_description, summary, notes, created_at)
       VALUES (@company_id, @role, @status, @priority, @source, @job_url, @location, @work_mode, 'full_time',
               @salary_min, @salary_max, @applied_at, @next_action, @next_action_at, @board_order,
               @job_description, @summary, @notes, @created_at)`,
    );
    const insertActivity = db.prepare(
      'INSERT INTO activities (application_id, type, message, payload, occurred_at) VALUES (?, ?, ?, ?, ?)',
    );
    const LABEL = { saved: 'Saved', applied: 'Applied', screening: 'Screening', interviewing: 'Interviewing', offer: 'Offer', rejected: 'Rejected' };

    const apps = [];
    const add = (a) => {
      const salaryMin = a.salaryMin ?? (rand() > 0.4 ? 120000 + Math.round(rand() * 6) * 10000 : null);
      const { lastInsertRowid } = insertApp.run({
        company_id: companyIds.get(a.company),
        role: a.role,
        status: a.status,
        priority: a.priority ?? pick([1, 2, 2, 3]),
        source: a.source ?? pick(SOURCES),
        job_url: `https://jobs.example.com/${a.company.toLowerCase().replace(/[^a-z]+/g, '-')}`,
        location: a.location ?? pick(CITIES),
        work_mode: a.workMode ?? pick(MODES),
        salary_min: salaryMin,
        salary_max: a.salaryMax ?? (salaryMin ? salaryMin + 25000 : null),
        applied_at: a.appliedAt ?? null,
        next_action: a.nextAction ?? null,
        next_action_at: a.nextActionAt ?? null,
        board_order: apps.length,
        job_description: a.jobDescription ?? `${a.company} is hiring a ${a.role}. You'll build features across a React and TypeScript front end and Node.js services, working with product and design. We value clean, tested code and shipping often.`,
        summary: a.summary ?? null,
        notes: a.notes ?? null,
        created_at: a.appliedAt ?? at(1),
      });
      const id = Number(lastInsertRowid);
      insertActivity.run(id, 'created', `Added ${a.role} at ${a.company}`, JSON.stringify({ status: 'saved' }), a.appliedAt ?? at(1));
      if (a.appliedAt) insertActivity.run(id, 'status_change', 'Saved → Applied', JSON.stringify({ from: 'saved', to: 'applied' }), a.appliedAt);
      let prev = 'applied';
      for (const [to, daysAgo] of a.path ?? []) {
        insertActivity.run(id, 'status_change', `${LABEL[prev]} → ${LABEL[to]}`, JSON.stringify({ from: prev, to }), at(daysAgo, 15));
        prev = to;
      }
      apps.push({ ...a, id });
      return id;
    };

    // The showcase application.
    const featured = add({
      company: 'Northwind Labs', role: 'Senior Full Stack Engineer', status: 'interviewing', priority: 3,
      source: 'Referral', workMode: 'remote', location: 'Remote (US)', salaryMin: 150000, salaryMax: 175000,
      appliedAt: at(16, 9), path: [['screening', 12], ['interviewing', 6]],
      nextAction: 'Send thank-you note to Priya', nextActionAt: at(0, 17),
      jobDescription: FEATURED_JD, summary: FEATURED_SUMMARY,
      notes: 'Referral from Dana. Team is 6 engineers, ships weekly.',
    });
    const offer = add({
      company: 'Cobalt Pay', role: 'Software Engineer, Payments', status: 'offer', priority: 3, workMode: 'remote',
      salaryMin: 145000, salaryMax: 160000, appliedAt: at(19, 10), path: [['screening', 15], ['interviewing', 10], ['offer', 1]],
      nextAction: 'Reply to the offer', nextActionAt: at(-2, 12),
    });
    const screen = add({
      company: 'Bluepeak', role: 'Full Stack Engineer', status: 'screening', priority: 3,
      appliedAt: at(8, 11), path: [['screening', 3]], nextAction: 'Recruiter call prep', nextActionAt: at(-1, 9),
    });
    add({ company: 'Halcyon Health', role: 'Frontend Engineer', status: 'interviewing', priority: 2, appliedAt: at(13, 14), path: [['screening', 9], ['interviewing', 4]] });
    add({ company: 'Fernway', role: 'Product Engineer', status: 'screening', priority: 2, appliedAt: at(6, 10), path: [['screening', 2]] });

    // A steady stream of applications: 3-8 on weekdays for the last 18 days, 7 so far today.
    const rest = COMPANY_NAMES.filter((n) => !['Northwind Labs', 'Cobalt Pay', 'Bluepeak', 'Halcyon Health', 'Fernway'].includes(n));
    let ci = 0;
    for (let daysAgo = 18; daysAgo >= 0; daysAgo -= 1) {
      const d = new Date(); d.setDate(d.getDate() - daysAgo);
      const weekend = d.getDay() === 0 || d.getDay() === 6;
      const n = daysAgo === 0 ? 7 : weekend ? (rand() > 0.6 ? 2 : 0) : 3 + Math.floor(rand() * 6);
      for (let k = 0; k < n; k += 1) {
        const company = rest[ci % rest.length];
        ci += 1;
        const appliedAt = at(daysAgo, 8 + k, Math.floor(rand() * 59));
        const r = rand();
        const status = daysAgo > 9 && r < 0.18 ? 'rejected' : 'applied';
        const path = status === 'rejected' ? [['rejected', Math.max(0, daysAgo - 6)]] : [];
        const fresh = status === 'applied' && daysAgo <= 2;
        add({
          company, role: pick(ROLES), status, appliedAt, path,
          nextAction: fresh ? 'Reach out to someone on the team' : null,
          nextActionAt: fresh ? at(daysAgo - 2, 9) : null,
        });
      }
    }
    // A few saved for later.
    for (const company of ['Oakline', 'Thistle', 'Yarrow']) add({ company, role: pick(ROLES), status: 'saved', priority: 2 });

    // Contacts.
    const insertContact = db.prepare(
      `INSERT INTO contacts (company_id, application_id, name, title, email, linkedin_url, relationship, last_contacted_at, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    insertContact.run(companyIds.get('Northwind Labs'), featured, 'Priya Raman', 'Engineering Manager, Payments', 'priya@example.com', 'https://www.linkedin.com/in/example', 'hiring_manager', at(6), 'Ran the technical round. Cares a lot about testing.');
    insertContact.run(companyIds.get('Northwind Labs'), featured, 'Dana Cole', 'Senior Software Engineer', 'dana@example.com', null, 'referral', at(17), 'Former coworker. Referred me in.');
    insertContact.run(companyIds.get('Northwind Labs'), featured, 'Marcus Webb', 'Technical Recruiter', 'marcus@example.com', null, 'recruiter', at(12), 'Fast replies in the morning.');
    insertContact.run(companyIds.get('Cobalt Pay'), offer, 'Leah Kim', 'Talent Partner', 'leah@example.com', null, 'recruiter', at(1), 'Sent the offer. Open to negotiating.');
    insertContact.run(companyIds.get('Bluepeak'), screen, 'Sam Ortiz', 'Recruiter', 'sam@example.com', null, 'recruiter', at(3), null);

    // Interviews.
    const insertInterview = db.prepare(
      `INSERT INTO interviews (application_id, stage, scheduled_at, duration_minutes, format, location, interviewers, prep_notes, outcome)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    insertInterview.run(featured, 'Recruiter screen', at(12, 10), 30, 'phone', null, 'Marcus Webb', null, 'passed');
    insertInterview.run(featured, 'Technical interview', at(6, 13), 60, 'video', null, 'Priya Raman', null, 'passed');
    insertInterview.run(featured, 'Final round: system design', at(-2, 11), 90, 'video', 'https://meet.example.com/northwind', 'Priya Raman, CTO', 'Design a subscription billing system. Talk through webhooks, retries and idempotency.', 'scheduled');
    insertInterview.run(screen, 'Recruiter screen', at(-1, 9, 30), 30, 'phone', null, 'Sam Ortiz', 'Salary range ready. Why Bluepeak?', 'scheduled');
    insertInterview.run(offer, 'Final round', at(10, 14), 120, 'video', null, 'Panel', null, 'passed');

    // Documents.
    const insertDocument = db.prepare('INSERT INTO documents (application_id, title, kind, version_label, notes) VALUES (?, ?, ?, ?, ?)');
    insertDocument.run(null, 'Resume - full stack', 'resume', 'v4', 'Default resume.');
    insertDocument.run(featured, 'Resume - payments focus', 'resume', 'v2', 'Leads with billing work.');
    insertDocument.run(offer, 'Offer letter', 'offer_letter', null, null);

    // Story bank.
    const insertStory = db.prepare('INSERT INTO stories (title, situation, task, action, result, tags) VALUES (?, ?, ?, ?, ?, ?)');
    insertStory.run('Built the free-trial program end to end',
      'The company wanted a free trial to grow sign-ups but had no system for it.',
      'Own the build from API to checkout.',
      'Stood up a new Node.js service, designed the endpoints and data model, and built the React checkout with the billing provider.',
      'Launched on time and now serves thousands of trial members.',
      JSON.stringify(['ownership', 'impact', 'node', 'react', 'payments']));
    insertStory.run('Production billing bug under pressure',
      'Some customers were double-charged after a plan change.',
      'Find the cause fast and stop it happening again.',
      'Traced webhook retries hitting a non-idempotent handler, shipped a fix with an idempotency key, and wrote a backfill query to refund affected accounts.',
      'Zero repeats since, and refunds went out the same day.',
      JSON.stringify(['debugging', 'pressure', 'payments', 'sql']));
    insertStory.run('Disagreed with a tech lead on scope',
      'A lead wanted to rebuild checkout from scratch two weeks before launch.',
      'Ship on time without ignoring real problems.',
      'Laid out the risks with data, proposed fixing the three worst issues now and the rebuild next quarter.',
      'We shipped on time, and the rebuild later went faster because the scope was clear.',
      JSON.stringify(['conflict', 'communication', 'teamwork']));
    insertStory.run('Learned a new stack fast',
      'Joined a project on a framework I had never used.',
      'Be productive within the sprint.',
      'Read the codebase top-down, paired with the owner for two sessions, and took a small ticket first.',
      'Shipped my first feature in week one.',
      JSON.stringify(['learning', 'growth']));
  });

  run();
  logger.ready('Seeded demo.db with fake sample data.');
}

// `node src/db/seed.js` runs it directly.
const isCli = typeof process !== 'undefined' && process.argv?.[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isCli) seedDatabase();
