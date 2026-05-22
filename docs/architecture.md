# Sift Architecture

## Boundaries

- The Tauri layer owns native windows, app metadata, secure IPC, update hooks,
  and starting the Python sidecar.
- The React layer owns product UI, state transitions, keyboard workflows, and
  user-facing progress.
- The Python sidecar owns filesystem access, image indexing, thumbnail work,
  SQLite persistence, AI analysis jobs, and export jobs.

## Local Service Contract

The sidecar binds to `127.0.0.1` on a runtime-selected port and requires a
startup token. The frontend uses a single API client module instead of scattered
`fetch` calls.

## Photo Policy

Sift never mutates original photos. Ratings, picks, rejections, tags, people,
AI scores, and export settings live in local project metadata.

## AI Policy

Local inference is the default. Cloud AI providers are optional extensions and
must require explicit opt-in before any image or derived content leaves the
device.
