# Security Policy

## Supported versions

Security fixes are applied on the latest `master` / published GitHub Pages build. Older tags are best-effort only.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security-sensitive reports.

Email or privately message the maintainer via GitHub (@MarsResearcher), and include:

- Affected surface (Studio editor, Lab, export, IndexedDB, Pages deploy, …)
- Steps to reproduce
- Impact (data loss, XSS, local file access, etc.)
- Your contact for follow-up

We will acknowledge receipt when possible and work on a fix before any public disclosure.

## Scope notes

PicLab is a **browser, offline-first** app. Typical concerns include:

- XSS via unsanitized text/SVG/import paths
- Unexpected IndexedDB / local data exposure
- Supply-chain issues in dependencies

Out of scope: third-party font/illustration licenses (see `public/**/CREDITS.md`), or GitHub Pages hosting outages.
