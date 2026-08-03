# Docs

Product and community docs for PicLab Studio.

| Doc | Purpose |
| --- | --- |
| [`PRODUCT.md`](PRODUCT.md) | Beachhead, JTBD, priorities |
| [`getting-started.md`](getting-started.md) | Demo path + where to change code |
| [`SUPPORT.md`](SUPPORT.md) | Discussions vs Issues vs Security |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | How to contribute |
| [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) | Community standards |
| [`SECURITY.md`](SECURITY.md) | Vulnerability reports |
| [`BRANCHING.md`](BRANCHING.md) | `master` / tags / PR target |
| [`RELEASING.md`](RELEASING.md) | How maintainers cut a version |

Also: [`../CHANGELOG.md`](../CHANGELOG.md) (root) · [`../src/studio/ARCHITECTURE.md`](../src/studio/ARCHITECTURE.md)

## Why some files stay at repo root

GitHub expects these at the **repository root** (or links them from the home page):

- `README.md` — project front door  
- `LICENSE` — license discovery  
- `CHANGELOG.md` — common convention next to releases  

Community health files (`CONTRIBUTING`, `SECURITY`, `CODE_OF_CONDUCT`, `SUPPORT`, …) may live in **`docs/`** or `.github/` — GitHub still picks them up for the community profile. Process docs (`BRANCHING`, `RELEASING`) belong here so the root stays lean.
