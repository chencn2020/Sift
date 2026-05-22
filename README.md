# Sift

Sift is an open-source Windows/macOS desktop app for fast event photo culling.
It is designed for photographers who return from large events with hundreds or
thousands of images and need to quickly remove blur, closed eyes, duplicates,
weak burst frames, and irrelevant people.

## Architecture

- Desktop shell: Tauri v2
- Frontend: Vite, React, TypeScript
- Local service: Python `siftd` sidecar
- Core storage: SQLite
- AI policy: local-first, optional cloud providers only after explicit user opt-in

The current implementation is an early desktop scaffold. It keeps the original
HTML prototype in `templates/` and `static/` for reference while the production
UI is being migrated into `src/`.

## Development

```bash
npm install
npm run dev
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m backend.siftd.main --dev-token dev-token
```

Tauri development additionally requires Rust and platform build tools.

```bash
npm run tauri:dev
```

## Release Policy

Early builds are internal CI artifacts. Public GitHub prereleases should start
only when the MVP import, culling, persistence, and export workflow is stable.
The first planned public prerelease is `v0.1.0-alpha.1`.
