# Contributing to PicLab

Thanks for considering a contribution. This project is **offline-first** design + image tooling in the browser (Vite + React + TypeScript + Canvas).

## Before you start

1. Read [`SUPPORT.md`](SUPPORT.md) — questions & early ideas go to [Discussions](https://github.com/MarsResearcher/piclab/discussions); actionable bugs/features use Issues.
2. Skim [`docs/PRODUCT.md`](docs/PRODUCT.md) so the idea fits the beachhead (and not an anti-job).
3. Open or skim an [issue](https://github.com/MarsResearcher/piclab/issues) so we can align on scope before a large PR.
4. Prefer small, reviewable PRs. Keep Studio boundaries: UI talks to **stores / plugins**, not raw pixels.

## Local setup

```bash
npm install
npm run dev
```

Verify the offline critical path:

```bash
npm run smoke
```

Typecheck + production build:

```bash
npm run build
```

## What we welcome

- Bug fixes with a clear repro
- Template / UX polish that matches existing visual language
- Docs improvements (README, comments, architecture notes)
- Tests / smoke coverage for regressions

## What to avoid in first PRs

- New cloud backend or account systems (product is offline-first)
- Drive-by dependency upgrades without a reason
- Unrelated formatting churn

## Pull requests

- Target **`master`**. See [`BRANCHING.md`](BRANCHING.md).
- Describe **why** and how you verified (`npm run smoke` / manual steps).
- Screenshots or short clips help for UI changes.
- Do not commit secrets (`.env`, API keys).

## Docs map

| Doc | Purpose |
| --- | --- |
| [`SUPPORT.md`](SUPPORT.md) | Where to ask (Discussions vs Issues) |
| [`docs/PRODUCT.md`](docs/PRODUCT.md) | Beachhead, JTBD, love/hate, priorities |
| [`docs/getting-started.md`](docs/getting-started.md) | Product path + where to change code |
| [`src/studio/ARCHITECTURE.md`](src/studio/ARCHITECTURE.md) | Layer boundaries |
| [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) | Community standards |
| [`SECURITY.md`](SECURITY.md) | Vulnerability reports |
| [`CHANGELOG.md`](CHANGELOG.md) | User-facing release notes |
| [`RELEASING.md`](RELEASING.md) | How maintainers cut a version |
| [`BRANCHING.md`](BRANCHING.md) | `master` / tags / PR target |

## Code of collaboration

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). Be respectful. Assume good intent. If something is unclear, ask in the issue/PR before large rewrites.
