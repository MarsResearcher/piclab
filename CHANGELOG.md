# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.24] — 2026-08-03

### Fixed

- Stickers no longer fall back to blank colored circles — Lucide icons paint directly to canvas; illustration SVGs decode via `<img>` (Chromium `createImageBitmap(SVG)` was failing silently)
- Inserted stickers / images land on the **top** of the layer stack (append), matching shapes and text

## [0.1.23] — 2026-08-03

### Added

- Custom linear gradient editor (angle + 2–3 stops) in the color flyout
- `docs/README.md` — docs index explaining root vs `docs/`

### Changed

- Community / process docs moved under `docs/` (SUPPORT, CONTRIBUTING, SECURITY, CoC, BRANCHING, RELEASING); root keeps README / LICENSE / CHANGELOG

## [0.1.22] — 2026-08-03

### Added

- `SUPPORT.md` — Discussions vs Issues vs Security channel map
- Issue forms (YAML) + contact links (no blank issues)
- Dependabot (npm weekly, Actions monthly) and `CODEOWNERS`
- `RELEASING.md` — solo-maintainer cut checklist

### Changed

- README / CONTRIBUTING / getting-started point to Discussions for Q&A
- Clarified Lab as a free playground (no Pro+ / paid-tier branding)

## [0.1.21] — 2026-08-03

### Added

- GitHub Pages demo at https://marsresearcher.github.io/piclab/
- PicLab brand favicon / apple-touch icon + README brand banner
- Product-grade README tour (home / editor / preview / journal shots)
- MIT license, CONTRIBUTING, SECURITY, CODE_OF_CONDUCT, getting-started
- Issue & PR templates; CI workflow (`smoke` + `build`)
- Project home-card covers (raster thumbs instead of letter placeholders)
- Journal「手账壳」cohesive backdrop baking for Xiaohongshu templates

### Fixed

- Public asset URLs under `/piclab/` base (template photos no longer fall back to solid fills)
- Ruled-line chrome grouped instead of dozens of noisy layers

### Changed

- Repository renamed to `piclab`; Vite `base` aligned for project Pages

## [0.1.19] — 2026-08-03

### Added

- Xiaohongshu specialty light chrome; Lucide + Open Doodles sticker pack
- Journal atmosphere signatures and materials shelf

[0.1.24]: https://github.com/MarsResearcher/piclab/releases/tag/v0.1.24
[0.1.23]: https://github.com/MarsResearcher/piclab/compare/v0.1.23...v0.1.24
[0.1.22]: https://github.com/MarsResearcher/piclab/compare/v0.1.22...v0.1.23
[0.1.21]: https://github.com/MarsResearcher/piclab/compare/v0.1.21...v0.1.22
[0.1.19]: https://github.com/MarsResearcher/piclab/compare/v0.1.19...v0.1.21
