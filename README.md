# Sift

> A local-first desktop photo culling app for photographers who come home with too many shots and too little time.

[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS-blue)](https://github.com/chencn2020/Sift/releases)
[![Built with Tauri](https://img.shields.io/badge/built%20with-Tauri-24c8db)](https://tauri.app/)
[![Local First](https://img.shields.io/badge/privacy-local--first-30d158)](#privacy-first)
[![License: MIT](https://img.shields.io/badge/license-MIT-black)](LICENSE)

Sift is built for event, wedding, travel, portrait, and conference photographers who often need to review hundreds or thousands of photos after one shoot. It helps you move quickly from a messy folder to a clean set of keepers, without sending private photos to the cloud by default.

中文文档：[README.zh-CN.md](README.zh-CN.md)

## Why Sift

Large photo shoots are not hard because one image is hard to judge. They are hard because there are too many near-duplicates, missed focus shots, awkward expressions, repeated burst frames, and people-specific selections.

Sift aims to make that workflow fast, visual, and calm:

| Need | What Sift Helps You Do |
| --- | --- |
| Review a full event folder | Import a shoot and browse it as a desktop project. |
| Pick winners quickly | Mark photos as picked/rejected and rate them with stars. |
| Compare similar frames | Use grid, focus, and compare views for repeated shots. |
| Work around people | Register key people and prepare for person-based filtering. |
| Stay private | Keep the default workflow local and non-destructive. |

## Features

- Desktop photo culling workflow for Windows and macOS.
- Project-based import for large photo folders.
- Fast grid browsing, focus view, and side-by-side comparison.
- Pick/reject flags and star ratings for rapid selection.
- Person registration with 1-5 reference photos.
- Recent projects, recently deleted projects, and project actions.
- Local-first design: originals stay in place and are not uploaded by default.
- Early AI-ready structure for future local models.

## News

| Date | Update |
| --- | --- |
| 2026-05-23 | Published `v0.1.0-alpha.1` with the first local-first desktop culling workflow, project library, profile editor, person registration, thumbnail cache, and README refresh. |
| 2026-05-23 | Built the first Tauri desktop app shell for macOS and Windows packaging. |
| 2026-05-23 | Added project import, recent projects, project actions, and recently deleted recovery. |
| 2026-05-23 | Added grid/focus/compare workflows, keyboard navigation, ratings, and pick/reject states. |
| 2026-05-23 | Added person registration flow with reference images. |
| 2026-05-23 | Added local build workflow and early update-check UI. |

## TODO

The next stage is mainly about AI-assisted photo selection:

- Face detection and person matching.
- Duplicate photo detection.
- Blink / closed-eye detection.
- Technical quality scoring for focus, exposure, noise, and motion blur.
- Aesthetic evaluation models for composition, expression, and overall keep potential.
- Burst-group recommendation: choose the strongest frame from a sequence.
- Local model management with optional cloud providers only when the user explicitly enables them.
- Real export workflows for copying/converting selected photos.
- Signed Windows/macOS releases with auto-update.

## Download

Public binaries will be published on the [GitHub Releases page](https://github.com/chencn2020/Sift/releases).

The project is still in early development. If no release is available yet, build from source with the steps below.

## Build From Source

Prerequisites:

- Node.js and npm
- Rust toolchain for Tauri
- Python 3 for the future sidecar and tests

Install dependencies:

```bash
npm install
```

Run the desktop app in development:

```bash
npm run tauri:dev
```

Build a local desktop app:

```bash
npm run tauri:build
```

Run checks:

```bash
npm run build
npm test
npm run python:test
cargo check --manifest-path src-tauri/Cargo.toml
```

## Privacy First

Sift is designed around a local-first workflow. Photos stay on your machine by default, and culling decisions are stored separately from the original files. Future cloud AI providers should be optional, explicit, and project-scoped.

## Contributing

Sift is looking for contributors who care about photography workflows, desktop apps, AI-assisted review, and privacy-preserving local tools.

Good first contribution areas:

- UI polish for real photographer workflows.
- Import and browsing performance.
- AI model integration through Python.
- Windows/macOS packaging and signing.
- Documentation, screenshots, examples, and sample workflows.

## Star History

| Star History |
| --- |
| [![Star History Chart](https://api.star-history.com/svg?repos=chencn2020/Sift&type=Date)](https://www.star-history.com/#chencn2020/Sift&Date) |

## License

Sift is released under the [MIT License](LICENSE).
