# PicLab Studio

[![Live Demo](https://img.shields.io/badge/demo-marsresearcher.github.io%2Fpiclab-34d3c0?style=flat-square&logo=github)](https://marsresearcher.github.io/piclab/)
[![Version](https://img.shields.io/badge/version-0.1.21-blue?style=flat-square)](https://github.com/MarsResearcher/piclab)
[![License: MIT](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)

**Offline-first** browser design bench & digital image darkroom — templates, projects, and library stay on your machine (IndexedDB), not in a cloud template marketplace.

> 浏览器里的设计工作台与图像暗房。**离线优先**：项目 / 模板保存在本机，可随时打开 [在线演示](https://marsresearcher.github.io/piclab/)。

---

## Why PicLab?

| | |
| --- | --- |
| **Studio first** | Lite Home → editor for Xiaohongshu notes, posters, cards, print grids |
| **Offline by design** | Autosave projects & user templates in IndexedDB |
| **Composable templates** | Built-in seeds + scene generators + “save as my template” |
| **Lab (Pro+)** | Optional reversible image experiments (FFT, glitch, convolution, …) |

## Live demo

**→ [https://marsresearcher.github.io/piclab/](https://marsresearcher.github.io/piclab/)**

Open in a modern Chromium / Firefox / Safari. No account required.

## Quick start

```bash
git clone https://github.com/MarsResearcher/piclab.git
cd piclab
npm install
npm run dev
```

You should land on **PicLab Studio** Lite Home (recent projects + template shelves). Use the top-bar **主页** to return anytime.

### Verify it works

```bash
npm run smoke    # offline critical path (scenes + builtins)
npm run build    # typecheck + production bundle
```

## Features

- **L1 built-in templates** — decomposable seeds (groups, shapes, type) in `src/studio/templates/`
- **L2 scene generators** — parameterized canvases (card / poster / ad / social / WeChat / XHS / print grids)
- **L3 my templates** — “另存为模板” → local `templateStore`
- **Export** — current page PNG, multi-page ZIP, PDF (optional bleed)
- **Print scenes** — 田字格 / 拼音格 / 书法格 (A4), offline geometry
- **Stock + stickers** — bundled template photos & Lucide / Open Doodles chrome

## Architecture (short)

```
model/ → store/ → engine/ → plugins/ → scenes/ + templates/ → export/
UI: src/ui/studio/  (talks to stores only — never raw pixels)
```

More detail: [`src/studio/ARCHITECTURE.md`](src/studio/ARCHITECTURE.md).

## Lab (Pro+)

Optional playground behind Studio. Add an experiment:

1. Copy `src/experiments/template.ts`
2. Implement `id / name / params / apply(imageData, params)`
3. Register in `src/core/experimentRegistry.ts`

Built-ins include channel remap, custom convolution, pixel sort, FFT filters.

## Tech stack

- **React + TypeScript + Vite**
- **Canvas 2D** — Studio canvas & Lab preview
- **IndexedDB** — multi-project + user templates
- **Web Workers** — reserved for heavy ops (convolution / FFT)

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md). Bug / feature templates live under `.github/ISSUE_TEMPLATE/`.

Security reports: [`SECURITY.md`](SECURITY.md) — please do **not** file public issues for vulnerabilities.

## License

[MIT](LICENSE) © 2026 MarsResearcher / PicLab contributors.

Bundled fonts and illustrations keep their own licenses — see `public/**/CREDITS.md` and `public/fonts/OFL-NOTICE.txt`.

## Roadmap (signals we care about)

Inspired by common OSS health checklists ([Shields](https://shields.io/), README launch checks, maintainer readiness):

| Area | Status / next |
| --- | --- |
| README + demo + license | Done |
| Issue / PR templates | Done |
| Contributing + security policy | Done |
| CI badge (Actions smoke/build) | Planned when `workflow` push scope is available |
| Changelog / tagged releases | Planned |
| Screenshot / short GIF in README | Welcome as a PR |
| Code of conduct | Add when community grows |

---

English-first sections above; UI copy is primarily Chinese. PRs improving bilingual docs are welcome.
