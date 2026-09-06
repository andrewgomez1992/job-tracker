# Trail — a job tracker you'll actually use

A private, single-user job application tracker. React + Vite on the front,
Express 5 + SQLite on the back, no accounts, no cloud, no subscription. It runs
on your machine and installs to your phone's home screen.

![stack](https://img.shields.io/badge/react-19-blue) ![stack](https://img.shields.io/badge/node-%3E%3D20-green) ![stack](https://img.shields.io/badge/sqlite-better--sqlite3-lightgrey)

## Getting started

```bash
npm run setup   # installs both workspaces and seeds sample data
npm run dev     # API on :4000, app on http://localhost:5173
```

Open http://localhost:5173. To start from an empty database instead:

```bash
npm run db:reset   # wipes and reseeds
# or delete backend/data/ and run `npm run dev` — migrations create it on boot
```

### On your phone

Both servers bind to `0.0.0.0`, and Vite proxies `/api`, so the phone only needs
the one address. Find your Mac's LAN IP (`ipconfig getifaddr en0`) and open
`http://<that-ip>:5173` on your phone, on the same Wi-Fi. In Safari: Share →
Add to Home Screen. It launches full-screen with its own icon, and the service
worker keeps the shell working offline (data still needs the API).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Both servers, with reload |
| `npm run build` | Production build of the frontend into `frontend/dist` |
| `npm run start` | API only, production mode |
| `npm run seed` | Wipe and reseed the sample data |
| `npm run db:reset` | Delete the database file, migrate, reseed |
| `npm run smoke` | 55-assertion end-to-end API test against a throwaway database |

## How it's put together

```
backend/
  src/
    server.js            entry point: migrate, then listen
    app.js               Express app factory (importable by tests)
    routes.js            mounts every module under /api
    config/env.js        all environment reading happens here
    db/
      index.js           the better-sqlite3 connection (WAL, foreign keys on)
      migrate.js         forward-only migration runner
      migrations/*.sql   schema, applied once each, in a transaction
      seed.js            realistic sample data
    lib/                 ApiError, logger, dates, sql helpers, constants, upload
    middleware/          validate (zod), errorHandler, asyncHandler, notFound
    modules/<name>/
      routes.js          URLs + validation only
      controller.js      req/res only
      service.js         business rules, transactions, activity logging
      repository.js      SQL only
      schema.js          zod shapes
  scripts/smoke.mjs      end-to-end API test

frontend/
  src/
    main.jsx, App.jsx    providers + routes
    api/client.js        the only fetch() in the app
    api/queries.js       every TanStack Query hook and query key
    app/ThemeProvider    light / dark / follow-system
    styles/tokens.css    every colour, radius, shadow and space in the app
    components/ui/       Button, Card, Modal, Field, Toast, Tabs, Badge…
    components/layout/   AppShell, PageHeader, CommandPalette, ErrorBoundary
    features/<name>/     one folder per screen, colocated CSS modules
    lib/                 formatting and display constants
    hooks/               media query, debounce, local storage, hotkeys
```

**Rules the codebase follows.** SQL lives only in repositories. Business rules
and transactions live only in services. Controllers translate HTTP and nothing
else. Every request body, query and param is parsed by zod before a controller
sees it. Every timestamp is stored as ISO-8601 UTC (SQLite's default
`datetime('now')` format is not, which quietly breaks JavaScript date parsing).
On the frontend, the network is reachable only through `api/client.js`, and
every colour comes from a token — no hex codes in component CSS.

## The data model

- **companies** — one row per employer, created on the fly when you type a new name
- **applications** — the centre of everything; `status` drives the board
- **contacts** — recruiters, hiring managers, referrals; linked to a company and optionally an application
- **interviews** — every round, with prep notes and an outcome
- **documents** — which resume version went where, with an optional uploaded file
- **activities** — append-only timeline; services write it, nothing edits it

The activity log is what makes the analytics honest: the board only knows an
application's *current* status, so "how many ever reached an interview" is
answered from status-change history, not from where the card sits today.

## API

All responses are `{ "data": ... }`; errors are `{ "error": { message, details? } }`.

| Method | Path | |
|---|---|---|
| GET | `/api/health` | liveness |
| GET | `/api/meta` | enum values for the UI's dropdowns |
| GET/POST | `/api/applications` | list (filter, search, sort) / create |
| GET | `/api/applications/board` | grouped by status, board order |
| POST | `/api/applications/reorder` | drag-and-drop persistence |
| GET/PATCH/DELETE | `/api/applications/:id` | |
| GET | `/api/applications/:id/timeline` | the activity feed |
| POST | `/api/applications/:id/notes` | add a note to the timeline |
| CRUD | `/api/companies`, `/api/contacts`, `/api/interviews`, `/api/documents` | |
| GET | `/api/documents/:id/file` | download an uploaded file |
| GET | `/api/activities` | recent activity across everything |
| GET | `/api/reminders` | overdue / today / upcoming / going-quiet / interviews |
| GET | `/api/analytics/overview` | funnel, rates, weekly volume, sources |

## Configuration

Copy `backend/.env.example` to `backend/.env` to change anything. Every value
there is already the default, so the app runs with no `.env` at all.

## Keyboard

`⌘K` opens search. `N` adds an application. `Esc` closes anything open.
