# Getting started

PicLab Studio is an **offline-first** browser design bench. Projects, user templates, and library items live in **IndexedDB** on your machine.

## 60-second path

1. Open the [live demo](https://marsresearcher.github.io/piclab/) (or `npm run dev` locally).
2. Stay on **模板** → pick a signature layout (poster / card / 小红书 / print grid).
3. Preview → **使用此模板** → edit on canvas.
4. **导出** PNG (or ZIP / PDF from more export).
5. **主页** returns to Lite Home; recent projects keep covers when you leave.

No account. Closing the tab does not wipe IndexedDB until the browser profile is cleared.

## Local development

```bash
git clone https://github.com/MarsResearcher/piclab.git
cd piclab
npm install
npm run dev
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run smoke` | Offline critical path (scenes + builtins + invariants) |
| `npm run build` | `tsc --noEmit` + production bundle |

GitHub Pages builds set `GITHUB_ACTIONS=true` so Vite `base` becomes `/piclab/`. Locally, assets resolve from `/`.

## Mental model

```
Lite Home  →  StudioEditor  →  DocStore / AssetStore  →  Canvas engine
     ↑              │                    │
  projects     export PNG/ZIP/PDF    IndexedDB
  templates    Lab (free playground) schema migrate
```

- **UI** talks to stores and plugins only — never raw pixel buffers for document edits.
- **Templates** are document factories (L1 builtins / L2 scenes / L3 “另存为我的模板”).
- **Lab** is a separate image-experiment playground behind Studio.

Deeper layering: [`src/studio/ARCHITECTURE.md`](../src/studio/ARCHITECTURE.md).

## Where to change what

| Goal | Start here |
| --- | --- |
| New built-in layout | `src/studio/templates/builtins.ts` (+ assets under `public/template-assets/`) |
| New scene canvas size / defaults | `src/studio/scenes/` |
| Editor chrome / Lite Home | `src/ui/studio/` |
| Export formats | `src/studio/export/` |
| Lab experiment | `src/experiments/` → register in `src/core/experimentRegistry.ts` |

## Product principles (for contributors)

1. **Offline by default** — no required backend for core Studio.
2. **Template = editable document** — not a locked marketplace SKU.
3. **One job per surface** — Lite Home finds work; Editor edits; Lab experiments.
4. **Ship visual evidence** — UI PRs should include a screenshot or short clip.

## Need help?

- Product direction: [`PRODUCT.md`](PRODUCT.md)
- Bugs / features: [issue templates](https://github.com/MarsResearcher/piclab/issues/new/choose)
- Security: [`SECURITY.md`](../SECURITY.md)
- Conduct: [`CODE_OF_CONDUCT.md`](../CODE_OF_CONDUCT.md)
