-- Interview story bank: STAR stories you can reuse across interviews.
CREATE TABLE stories (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT NOT NULL,
  situation  TEXT,
  task       TEXT,
  action     TEXT,
  result     TEXT,
  tags       TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
