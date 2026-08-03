# Releasing

How we cut a PicLab release (solo-maintainer path).

## When

Ship a release when users can **feel** a change: demo behavior, templates, export, docs that change how people use the product. Skip empty “chore-only” tags.

## Steps

1. **Bump** `package.json` `version` (semver; currently `0.1.x`).
2. **CHANGELOG** — Keep a Changelog: user-facing `Added` / `Changed` / `Fixed` under a dated section. Link the compare URL.
3. **Verify locally**
   ```bash
   npm run smoke
   npm run build
   ```
4. **Commit** on `master` (message focuses on why).
5. **Push** tree (`node scripts/api-push.mjs master` or git remote).
6. **Tag** `vX.Y.Z` at that commit and push the tag (or create via GitHub Release UI).
7. **GitHub Release** — title `vX.Y.Z`, body = that CHANGELOG section (paste). Attach nothing required; Pages is the binary.
8. **Demo** — if UI changed, rebuild + `node scripts/api-push-pages.mjs`.

## Notes

- CI (when Actions workflows are on the remote) should stay green on `master` before tagging.
- Security fixes: follow [`SECURITY.md`](SECURITY.md); prefer a patch release.
- Do not announce paid tiers or “Pro+” — Lab is a free playground in the same app.
