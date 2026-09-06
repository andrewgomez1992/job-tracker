-- Core reference table: one row per employer.
CREATE TABLE companies (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  website     TEXT,
  industry    TEXT,
  location    TEXT,
  notes       TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE UNIQUE INDEX ux_companies_name ON companies (name COLLATE NOCASE);

-- The heart of the app: one row per job you are tracking.
CREATE TABLE applications (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id      INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'saved'
                  CHECK (status IN ('saved','applied','screening','interviewing','offer','accepted','rejected','withdrawn')),
  priority        INTEGER NOT NULL DEFAULT 2 CHECK (priority BETWEEN 1 AND 3),
  source          TEXT,
  job_url         TEXT,
  location        TEXT,
  work_mode       TEXT CHECK (work_mode IS NULL OR work_mode IN ('remote','hybrid','onsite')),
  employment_type TEXT CHECK (employment_type IS NULL OR employment_type IN ('full_time','part_time','contract','internship')),
  salary_min      INTEGER,
  salary_max      INTEGER,
  salary_currency TEXT NOT NULL DEFAULT 'USD',
  job_description TEXT,
  notes           TEXT,
  applied_at      TEXT,
  next_action     TEXT,
  next_action_at  TEXT,
  board_order     REAL NOT NULL DEFAULT 0,
  archived        INTEGER NOT NULL DEFAULT 0 CHECK (archived IN (0,1)),
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX ix_applications_status         ON applications (status);
CREATE INDEX ix_applications_company        ON applications (company_id);
CREATE INDEX ix_applications_next_action_at ON applications (next_action_at);
CREATE INDEX ix_applications_archived       ON applications (archived);
CREATE INDEX ix_applications_board          ON applications (status, board_order);

-- People: recruiters, hiring managers, referrals.
CREATE TABLE contacts (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id        INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  application_id    INTEGER REFERENCES applications(id) ON DELETE SET NULL,
  name              TEXT NOT NULL,
  title             TEXT,
  email             TEXT,
  phone             TEXT,
  linkedin_url      TEXT,
  relationship      TEXT NOT NULL DEFAULT 'other'
                    CHECK (relationship IN ('recruiter','hiring_manager','referral','peer','other')),
  last_contacted_at TEXT,
  notes             TEXT,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX ix_contacts_company     ON contacts (company_id);
CREATE INDEX ix_contacts_application ON contacts (application_id);

-- Every interview round, past and upcoming.
CREATE TABLE interviews (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id   INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  stage            TEXT NOT NULL,
  scheduled_at     TEXT,
  duration_minutes INTEGER,
  format           TEXT CHECK (format IS NULL OR format IN ('phone','video','onsite','take_home')),
  location         TEXT,
  interviewers     TEXT,
  prep_notes       TEXT,
  notes            TEXT,
  outcome          TEXT NOT NULL DEFAULT 'scheduled'
                   CHECK (outcome IN ('scheduled','completed','passed','failed','cancelled','no_show')),
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX ix_interviews_application ON interviews (application_id);
CREATE INDEX ix_interviews_scheduled   ON interviews (scheduled_at);

-- Which resume/cover letter went out, plus any file you want to keep.
CREATE TABLE documents (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER REFERENCES applications(id) ON DELETE SET NULL,
  title          TEXT NOT NULL,
  kind           TEXT NOT NULL DEFAULT 'other'
                 CHECK (kind IN ('resume','cover_letter','portfolio','offer_letter','other')),
  version_label  TEXT,
  url            TEXT,
  file_name      TEXT,
  file_path      TEXT,
  file_size      INTEGER,
  mime_type      TEXT,
  notes          TEXT,
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX ix_documents_application ON documents (application_id);
CREATE INDEX ix_documents_kind        ON documents (kind);

-- Append-only timeline. Written by services, never edited in place.
CREATE TABLE activities (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  type           TEXT NOT NULL,
  message        TEXT,
  payload        TEXT,
  occurred_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX ix_activities_application ON activities (application_id, occurred_at DESC);
CREATE INDEX ix_activities_type        ON activities (type, occurred_at DESC);
