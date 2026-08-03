# Branching

How we treat Git branches on [piclab](https://github.com/MarsResearcher/piclab).

## Default branch: `master`

- **Production truth** — GitHub Pages demo and releases track `master`.
- **Protected (ruleset)** — non-admins cannot delete or force-push `master`. Repository admins may bypass (needed for maintainer API push).
- External work lands via **pull request** into `master`. Do not push directly unless you are the maintainer.

## Tags: `v*`

Release tags matching `v*` cannot be force-moved or deleted by non-admins (ruleset **Protect release tags**). Prefer a new patch tag over rewriting history.

## Everyday flow

| Who | Flow |
| --- | --- |
| Contributor | fork or branch → PR → `master` |
| Maintainer (solo) | small fixes may land on `master`; feature work can still use a short-lived branch + PR for reviewability |

We do **not** run a long-lived `develop` branch. Keep the graph simple until there are multiple regular committers.

## After CI is on the remote

Next hardening step: require the `CI` workflow status check on PRs before merge. That needs `.github/workflows/ci.yml` published (token needs `workflow` scope).
