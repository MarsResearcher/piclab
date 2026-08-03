<p align="center">
  <img src="docs/brand/banner.png" alt="PicLab Studio — offline design bench" width="100%" />
</p>

<p align="center">
  <strong>Offline-first</strong> browser design bench &amp; digital darkroom.<br/>
  Templates · projects · library stay on <em>your</em> machine — not in a cloud marketplace.
</p>

<p align="center">
  <a href="https://marsresearcher.github.io/piclab/"><img src="https://img.shields.io/badge/demo-live-34d3c0?style=flat-square&logo=github" alt="Live demo" /></a>
  <a href="https://github.com/MarsResearcher/piclab/releases/tag/v0.1.23"><img src="https://img.shields.io/badge/version-0.1.23-0b0e11?style=flat-square" alt="Version" /></a>
  <a href="https://github.com/MarsResearcher/piclab/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/MarsResearcher/piclab/ci.yml?branch=master&style=flat-square&label=CI" alt="CI" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-1a2027?style=flat-square" alt="MIT" /></a>
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/storage-IndexedDB-6b7280?style=flat-square" alt="IndexedDB" />
</p>

<p align="center">
  浏览器里的设计工作台与图像暗房 · <strong>离线优先</strong> · 打开 <a href="https://marsresearcher.github.io/piclab/">在线演示</a> 即可用，无需账号
</p>

---

## Why PicLab (not another SaaS editor)

| Principle | What you get |
| --- | --- |
| **Your data stays local** | Projects & user templates in IndexedDB — close the tab, work resumes |
| **Templates are documents** | Decomposable nodes (type / image / shape / group) — not locked SKUs |
| **Studio → Lab** | Layout & type in Studio; optional free pixel experiments in Lab |
| **China-native scenes** | 小红书 · 公众号 · 手账壳 · 田字格 / 拼音格 / 书法格 |

Built for people who want a **local design bench**, not another subscription canvas.

---

## Try it in 60 seconds

**→ [https://marsresearcher.github.io/piclab/](https://marsresearcher.github.io/piclab/)** · Chromium / Firefox / Safari · no signup

```bash
git clone https://github.com/MarsResearcher/piclab.git
cd piclab && npm install && npm run dev
```

| Check | Command |
| --- | --- |
| Offline critical path | `npm run smoke` |
| Typecheck + production | `npm run build` |

Full walkthrough: [`docs/getting-started.md`](docs/getting-started.md).

---

## Product tour

**Studio** — edit on canvas, export when ready.

<p align="center">
  <img src="docs/screenshots/studio-editor.jpg" alt="PicLab Studio editor" width="100%" />
</p>

**Xiaohongshu in edit mode** — journal shell + theme controls (beachhead scene).

<p align="center">
  <img src="docs/screenshots/xhs-editor.jpg" alt="Xiaohongshu journal template in Studio editor" width="100%" />
</p>

**Lite Home** finds work · **Preview** before you commit.

| Find a template | Preview, then use |
| :---: | :---: |
| <img src="docs/screenshots/lite-home.jpg" alt="Lite Home template shelves" width="100%" /> | <img src="docs/screenshots/template-preview.jpg" alt="Template preview" width="100%" /> |

Flow: preview → **使用此模板** → edit → **导出** PNG / ZIP / PDF.

---

## Capabilities

- **L1 builtins** — signature layouts in `src/studio/templates/` (poster, card, ad, social, WeChat, XHS, …)
- **L2 scenes** — parameterized canvases (`card` / `poster` / `ad` / `social` / `wechatCover` / `xhsNote` / print grids)
- **L3 my templates** — 「另存为模板」 → local `templateStore`
- **Export** — page PNG, multi-page ZIP, PDF (optional bleed)
- **Print** — A4 田字格 / 拼音格 / 书法格, offline geometry
- **Stock + stickers** — bundled photos + Lucide / Open Doodles chrome
- **Lab** — free pixel playground (FFT, convolution, pixel sort, channel remap, …); same app, no paywall

---

## Architecture

```mermaid
flowchart LR
  UI["UI · Lite Home / Editor"] --> Store["Store · Doc / Project / Template"]
  Store --> Model["Model · nodes + schema migrate"]
  Store --> Engine["Engine · paint / hit / transform"]
  Scenes["Scenes + Templates"] --> Store
  Engine --> Export["Export · PNG / ZIP / PDF"]
  Lab["Lab experiments"] --> Workers["Workers · heavy ops"]
```

UI talks to **stores & plugins only** — never raw pixels for document edits.

```
model/ → store/ → engine/ → plugins/ → scenes/ + templates/ → export/
UI: src/ui/studio/
```

Details: [`src/studio/ARCHITECTURE.md`](src/studio/ARCHITECTURE.md) · Contributor map: [`docs/getting-started.md`](docs/getting-started.md).

---

## Lab

Optional **free** pixel playground behind Studio (same offline app — no account, no paid tier):

1. Copy `src/experiments/template.ts`
2. Implement `id / name / params / apply(imageData, params)`
3. Register in `src/core/experimentRegistry.ts`

---

## Tech stack

React 19 · TypeScript 5 · Vite 6 · Canvas 2D · IndexedDB · Web Workers (heavy ops)

---

## Community & support

| Need | Go to |
| --- | --- |
| Questions & ideas | [Discussions](https://github.com/MarsResearcher/piclab/discussions) |
| Bugs / scoped features | [Issues](https://github.com/MarsResearcher/piclab/issues) (use templates) |
| How we help | [`docs/SUPPORT.md`](docs/SUPPORT.md) |
| Contribute | [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) · [`docs/CODE_OF_CONDUCT.md`](docs/CODE_OF_CONDUCT.md) |
| Product direction | [`docs/PRODUCT.md`](docs/PRODUCT.md) |
| Security | [`docs/SECURITY.md`](docs/SECURITY.md) — **not** a public issue |
| Docs index | [`docs/README.md`](docs/README.md) |

- Prefer small, reviewable PRs
- UI changes: include a screenshot or short clip
- Keep offline-first — no required cloud backend for core Studio

---

## Roadmap

| Now | Next |
| --- | --- |
| Support channels + Discussions + Dependabot | Short product GIF / motion tour |
| Issue forms + docs under `docs/` + CI workflows | Learn from real Xiaohongshu creator usage |
| Journal「手账壳」+ product consensus | Bilingual docs polish; curated good-first-issues |
| Smoke + architecture docs | Good-first-issues from real creator bugs |

See [`CHANGELOG.md`](CHANGELOG.md), [`docs/RELEASING.md`](docs/RELEASING.md), and [v0.1.23](https://github.com/MarsResearcher/piclab/releases/tag/v0.1.23).

---

## License

[MIT](LICENSE) © 2026 MarsResearcher / PicLab contributors.

Bundled fonts & illustrations keep their own licenses — `public/**/CREDITS.md`, `public/fonts/OFL-NOTICE.txt`.

---

<p align="center">
  <sub>English docs · Chinese UI · PRs welcome for bilingual improvements</sub>
</p>
