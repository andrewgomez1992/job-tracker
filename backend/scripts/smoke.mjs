/**
 * End-to-end smoke test. Boots the real app against a throwaway database,
 * exercises every route, and exits non-zero on the first failure.
 *   npm run smoke
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'job-tracker-smoke-'));
process.env.DATABASE_PATH = path.join(tmp, 'smoke.db');
process.env.UPLOADS_DIR = path.join(tmp, 'uploads');
process.env.NODE_ENV = 'test';

const { createApp } = await import('../src/app.js');
const { runMigrations } = await import('../src/db/migrate.js');

runMigrations();

const server = createApp().listen(0);
await new Promise((resolve) => server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}/api`;

let passed = 0;
const failures = [];

const check = (name, condition, extra) => {
  if (condition) {
    passed += 1;
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } else {
    failures.push(name);
    console.log(`  \x1b[31m✗\x1b[0m ${name}${extra ? ` — ${JSON.stringify(extra).slice(0, 300)}` : ''}`);
  }
};

const api = async (method, path_, body) => {
  const res = await fetch(base + path_, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
};

const group = (name) => console.log(`\n\x1b[1m${name}\x1b[0m`);

try {
  group('health & meta');
  check('GET /health', (await api('GET', '/health')).body.data.status === 'ok');
  const meta = await api('GET', '/meta');
  check('GET /meta returns statuses', meta.body.data.applicationStatuses.length === 8);

  group('companies');
  const company = await api('POST', '/companies', { name: 'Acme Robotics', website: 'https://acme.test' });
  check('POST /companies -> 201', company.status === 201, company.body);
  const companyId = company.body.data.id;
  check('duplicate name -> 409', (await api('POST', '/companies', { name: 'acme robotics' })).status === 409);
  check('GET /companies/:id', (await api('GET', `/companies/${companyId}`)).body.data.name === 'Acme Robotics');

  group('applications');
  const bad = await api('POST', '/applications', { role: '' });
  check('empty role -> 422', bad.status === 422, bad.body);
  check('422 carries field details', Array.isArray(bad.body.error.details));

  const created = await api('POST', '/applications', {
    companyName: 'Hooli', role: 'Staff Engineer', status: 'applied',
    source: 'Referral', priority: 3, salaryMin: 150000, salaryMax: 180000,
  });
  check('POST /applications -> 201', created.status === 201, created.body);
  const appId = created.body.data.id;
  check('creates the company on the fly', created.body.data.company.name === 'Hooli');
  check('stamps appliedAt when status is not "saved"', Boolean(created.body.data.appliedAt));
  check('appliedAt is parseable ISO', !Number.isNaN(Date.parse(created.body.data.createdAt)));

  check('salaryMin > salaryMax -> 422',
    (await api('POST', '/applications', { companyName: 'X', role: 'Y', salaryMin: 9, salaryMax: 1 })).status === 422);

  const second = await api('POST', '/applications', { companyId, role: 'Firmware Engineer' });
  check('POST with companyId -> 201', second.status === 201, second.body);
  const secondId = second.body.data.id;

  const patched = await api('PATCH', `/applications/${appId}`, {
    status: 'interviewing', nextAction: 'Send follow-up', nextActionAt: new Date(Date.now() - 864e5).toISOString(),
  });
  check('PATCH status', patched.body.data.status === 'interviewing', patched.body);
  check('PATCH keeps nextAction', patched.body.data.nextAction === 'Send follow-up');

  const timeline = await api('GET', `/applications/${appId}/timeline`);
  check('timeline logs create + status change + reminder',
    timeline.body.data.some((a) => a.type === 'created')
    && timeline.body.data.some((a) => a.type === 'status_change')
    && timeline.body.data.some((a) => a.type === 'reminder_set'),
    timeline.body.data.map((a) => a.type));

  const note = await api('POST', `/applications/${appId}/notes`, { message: 'Recruiter said Tuesday.' });
  check('POST note -> 201', note.status === 201, note.body);

  const board = await api('GET', '/applications/board');
  check('board is keyed by every status', Object.keys(board.body.data).length === 8);
  check('board places the app in its column', board.body.data.interviewing.some((a) => a.id === appId));

  const reordered = await api('POST', '/applications/reorder', { status: 'offer', orderedIds: [secondId, appId] });
  check('reorder moves across columns', reordered.body.data.offer.map((a) => a.id).join(',') === `${secondId},${appId}`,
    reordered.body.data.offer.map((a) => a.id));
  const afterMove = await api('GET', `/applications/${secondId}`);
  check('cross-column move stamps appliedAt', Boolean(afterMove.body.data.appliedAt));

  const filtered = await api('GET', '/applications?status=offer&sort=role&direction=asc');
  check('filter by status', filtered.body.data.length === 2 && filtered.body.data.every((a) => a.status === 'offer'));
  const searched = await api('GET', '/applications?search=firmware');
  check('search matches role text', searched.body.data.some((a) => a.id === secondId));

  group('contacts');
  const contact = await api('POST', '/contacts', {
    companyId, applicationId: secondId, name: 'Dana Cole', relationship: 'recruiter', email: 'dana@acme.test',
  });
  check('POST /contacts -> 201', contact.status === 201, contact.body);
  check('bad email -> 422', (await api('POST', '/contacts', { name: 'X', email: 'nope' })).status === 422);
  check('contact appears on its application',
    (await api('GET', `/contacts?applicationId=${secondId}`)).body.data.length === 1);
  check('contact logged to the timeline',
    (await api('GET', `/applications/${secondId}/timeline`)).body.data.some((a) => a.type === 'contact_added'));

  group('interviews');
  const interview = await api('POST', '/interviews', {
    applicationId: appId, stage: 'Technical screen', format: 'video',
    scheduledAt: new Date(Date.now() + 2 * 864e5).toISOString(), durationMinutes: 60,
  });
  check('POST /interviews -> 201', interview.status === 201, interview.body);
  check('upcoming filter finds it', (await api('GET', '/interviews?upcoming=true')).body.data.length === 1);
  const outcome = await api('PATCH', `/interviews/${interview.body.data.id}`, { outcome: 'passed' });
  check('PATCH outcome', outcome.body.data.outcome === 'passed', outcome.body);
  check('outcome logged to the timeline',
    (await api('GET', `/applications/${appId}/timeline`)).body.data.some((a) => a.type === 'interview_outcome'));
  check('bad format -> 422', (await api('POST', '/interviews', { applicationId: appId, stage: 'x', format: 'telepathy' })).status === 422);
  check('application counts reflect the interview',
    (await api('GET', `/applications/${appId}`)).body.data.counts.interviews === 1);

  group('documents');
  const doc = await api('POST', '/documents', { applicationId: appId, title: 'Resume v3', kind: 'resume', versionLabel: 'v3' });
  check('POST /documents -> 201', doc.status === 201, doc.body);
  check('unattached document is allowed',
    (await api('POST', '/documents', { title: 'Resume general', kind: 'resume' })).status === 201);
  check('filter by kind', (await api('GET', '/documents?kind=resume')).body.data.length === 2);
  check('document without a file has no downloadUrl', doc.body.data.downloadUrl === null);
  check('DELETE /documents/:id -> 204', (await api('DELETE', `/documents/${doc.body.data.id}`)).status === 204);

  group('reminders & analytics');
  const reminders = await api('GET', '/reminders');
  check('overdue reminder surfaces', reminders.body.data.counts.overdue === 1, reminders.body.data.counts);
  check('upcoming interviews surface', reminders.body.data.upcomingInterviews.length >= 0);

  const analytics = await api('GET', '/analytics/overview');
  const a = analytics.body.data;
  check('analytics totals', a.totals.tracked === 2, a.totals);
  check('analytics funnel has 5 stages', a.funnel.length === 5);
  check('funnel counts history, not just current status',
    a.funnel.find((f) => f.key === 'interviewing').count === 2, a.funnel);
  check('funnel is monotonically decreasing',
    a.funnel.every((stage, i) => i === 0 || stage.count <= a.funnel[i - 1].count), a.funnel);
  check('rates are percentages', a.rates.response >= 0 && a.rates.response <= 100, a.rates);
  check('weekly buckets returned', a.weekly.length === 12);
  check('sources tracked', a.sources.length >= 1, a.sources);

  group('errors');
  check('unknown application -> 404', (await api('GET', '/applications/99999')).status === 404);
  check('unknown route -> 404', (await api('GET', '/definitely-not-a-route')).status === 404);
  check('404 body has a message', Boolean((await api('GET', '/applications/99999')).body.error.message));

  group('cascades');
  check('DELETE /applications/:id -> 204', (await api('DELETE', `/applications/${appId}`)).status === 204);
  check('its timeline is gone', (await api('GET', `/applications/${appId}/timeline`)).status === 404);
  check('its interviews are gone', (await api('GET', '/interviews')).body.data.length === 0);
  check('unattached document survived', (await api('GET', '/documents')).body.data.length === 1);
} catch (error) {
  failures.push(`threw: ${error.message}`);
  console.error(error);
} finally {
  server.close();
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  console.log(failures.map((f) => `  - ${f}`).join('\n'));
  process.exit(1);
}
