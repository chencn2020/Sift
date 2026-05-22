from __future__ import annotations

import sqlite3
from pathlib import Path
from uuid import uuid4

from .models import Photo, Project

SCHEMA = """
PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  source_path TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  filename TEXT NOT NULL,
  extension TEXT NOT NULL,
  kind TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  modified_at REAL NOT NULL,
  width INTEGER,
  height INTEGER,
  UNIQUE(project_id, path)
);
CREATE TABLE IF NOT EXISTS ratings (
  photo_id TEXT PRIMARY KEY REFERENCES photos(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL DEFAULT 0,
  flag TEXT CHECK(flag IN ('pick', 'reject') OR flag IS NULL),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS stacks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  label TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS people (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'registered',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS faces (
  id TEXT PRIMARY KEY,
  photo_id TEXT NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  person_id TEXT REFERENCES people(id) ON DELETE SET NULL,
  embedding_ref TEXT,
  bbox_json TEXT
);
CREATE TABLE IF NOT EXISTS ai_scores (
  photo_id TEXT PRIMARY KEY REFERENCES photos(id) ON DELETE CASCADE,
  sharpness REAL,
  exposure REAL,
  noise REAL,
  eyes_open REAL,
  duplicate_group TEXT,
  burst_group TEXT,
  provider TEXT NOT NULL DEFAULT 'local'
);
CREATE TABLE IF NOT EXISTS tags (
  photo_id TEXT NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY(photo_id, tag)
);
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  status TEXT NOT NULL,
  progress REAL NOT NULL DEFAULT 0,
  error TEXT,
  result_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
"""


class SiftStore:
    def __init__(self, db_path: Path):
        self.db_path = db_path.expanduser()
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.connection = sqlite3.connect(self.db_path, check_same_thread=False)
        self.connection.row_factory = sqlite3.Row

    def initialize(self) -> None:
        self.connection.executescript(SCHEMA)
        self.connection.commit()

    def close(self) -> None:
        self.connection.close()

    def create_project(self, name: str, source_path: Path) -> Project:
        project_id = uuid4().hex
        self.connection.execute(
            "INSERT INTO projects (id, name, source_path) VALUES (?, ?, ?)",
            (project_id, name, str(source_path.expanduser().resolve())),
        )
        self.connection.commit()
        row = self.connection.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
        return Project(id=row["id"], name=row["name"], source_path=Path(row["source_path"]), created_at=row["created_at"])

    def list_projects(self) -> list[dict]:
        rows = self.connection.execute(
            """
            SELECT p.*, COUNT(ph.id) AS photo_count
            FROM projects p
            LEFT JOIN photos ph ON ph.project_id = p.id
            GROUP BY p.id
            ORDER BY p.created_at DESC
            """
        ).fetchall()
        return [dict(row) for row in rows]

    def upsert_photos(self, photos: list[Photo]) -> int:
        self.connection.executemany(
            """
            INSERT INTO photos (id, project_id, path, filename, extension, kind, size_bytes, modified_at, width, height)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(project_id, path) DO UPDATE SET
              filename = excluded.filename,
              size_bytes = excluded.size_bytes,
              modified_at = excluded.modified_at,
              width = excluded.width,
              height = excluded.height
            """,
            [
                (
                    photo.id,
                    photo.project_id,
                    str(photo.path),
                    photo.filename,
                    photo.extension,
                    photo.kind,
                    photo.size_bytes,
                    photo.modified_at,
                    photo.width,
                    photo.height,
                )
                for photo in photos
            ],
        )
        self.connection.commit()
        return len(photos)

    def list_photos(self, project_id: str) -> list[dict]:
        rows = self.connection.execute("SELECT * FROM photos WHERE project_id = ? ORDER BY filename", (project_id,)).fetchall()
        return [dict(row) for row in rows]
