# Product

Product consensus for PicLab Studio. Beachhead and priorities below override “build whatever is fun.”

**Last aligned:** 2026-08-03

---

## Beachhead (one only)

**小红书创作者** — cover / multi-page note sets / journal-style info graphics.

Side wings (do not lead the story): WeChat covers, print grids, business cards, Lab experiments, GitHub developers.

---

## Jobs to be done

| Priority | Job | Context | Success looks like |
| --- | --- | --- | --- |
| Primary | Ship “好看且可改” visual pages without starting from a blank board | 10–30 min before posting a Xiaohongshu note | Open demo → pick template → tweak copy/image → export PNG |
| Secondary | Turn tips / lists into journal-feeling layouts | Atmosphere > pixel retouch | Swap「手账壳」, keep content editable, export |

Anti-job (not our job): cloud design OS, team collab, beauty-cam retouch, template marketplace lock-in.

---

## Positioning

**External one-liner (ZH):**  
给小红书创作者的离线排版工作台——模板可拆、项目在本机。

**External one-liner (EN):**  
An offline layout bench for Xiaohongshu creators — editable templates, projects on your machine.

**Wedge (why us):** offline-first (IndexedDB) + China-native scenes (3:4 notes, journal shell, multi-page sets) — not “another Canva clone in the browser.”

---

## Love / hate matrix

### Love (invest)

- Multi-page / signature builtins for Xiaohongshu
- Cohesive「手账壳」replace (not dozens of chrome layers)
- Preview → 使用此模板 → edit → export
- Local projects + “另存为我的模板”
- PNG / ZIP / PDF export

### Hate (explicit non-goals for now)

- Account systems / cloud sync as a requirement
- Cloud template marketplace / locked SKUs
- Collab comments / multiplayer canvas
- Competing with Meitu-style beauty retouch
- Diluting the homepage story across Lab + print grids + cards

---

## Metrics (product)

| Kind | Metric | Note |
| --- | --- | --- |
| North star | Share of users who **export ≥1 time** and return within **7 days** | Truer than GitHub stars |
| Guardrail | Median time **template pick → first export** | Friction in the core loop |
| Guardrail | Template preview load failure rate | Trust in Demo |
| Brand only | GitHub stars, README traffic | Do not steer the product by these alone |

---

## Priority ladder

| Tier | Focus | Examples |
| --- | --- | --- |
| **P0** | Shorten Xiaohongshu path to export | Fewer clicks to sets; discoverability of 成套 / 手账 |
| **P1** | Narrative assets | Official sample note packs made *in* PicLab |
| **P2** | Everything else | Lab, 练习纸, cards — keep, don’t headline |

When in doubt: improve the primary JTBD loop before adding a new scene family.

---

## Decision checklist (before building)

1. Does this help a Xiaohongshu creator export faster or with less blank-page anxiety?
2. Does it strengthen offline-first / editable-template wedge?
3. Would we put it in the one-liner? If no, it is P2 or later.
4. Prefer learning from real creator usage before coding large features.

Related: [`getting-started.md`](getting-started.md) · [`../src/studio/ARCHITECTURE.md`](../src/studio/ARCHITECTURE.md)
