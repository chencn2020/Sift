# Release Management

## Branches

- `main` is the stable integration branch.
- Use `feat/<short-name>` for feature work and merge through pull requests.
- Prefer conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`.

## Early Project Policy

Do not publish a GitHub Release for every small feature. Early work should push
to GitHub and let CI produce internal artifacts for Windows and macOS. Start
public prereleases only after import, culling, persistence, and export are
usable together.

## Public Prerelease

Use tags like `v0.1.0-alpha.2`. Tagged builds create GitHub prereleases and
attach packaged desktop installers. Auto-update remains disabled until signing,
notarization, and update signature keys are configured.

`v0.1.0-alpha.1` was withdrawn because it was published with incorrect MIT
license metadata. Future public prereleases use the repository's noncommercial
source-available licensing policy.
