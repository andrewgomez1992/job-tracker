/**
 * DEMO MODE SWITCH
 *
 * true  -> Trail runs on fake sample data in backend/data/demo.db (auto-seeded).
 * false -> Trail runs on your real data in backend/data/job-tracker.db.
 *
 * The two databases are separate files, so flipping this never touches your
 * real applications. Save the file and the dev server restarts on its own.
 * The env var TRAIL_DEMO=1 / TRAIL_DEMO=0 overrides this for one run.
 */
export const USE_DEMO_DATA = false;
