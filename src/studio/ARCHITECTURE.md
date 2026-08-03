# Studio architecture

## Layers

| Layer | Path | Responsibility | Must not |
|-------|------|----------------|----------|
| Model | `model/` | Node/document types, **schemaVersion**, migrate + validate | Touch DOM, React, IndexedDB |
| Store | `store/` | DocStore commands/transactions, PatchHistory, projects | Draw canvas |
| Engine | `engine/` | Paint, hit-test, **NodeStrategy**, transform math, themeColors | Mutate document |
| Plugins | `plugins/` | Tool/Scene contracts + registry | Grow into a second App |
| Scenes | `scenes/` | Scene pack factories | UI chrome |
| Export | `export/` | ZIP / PDF / bleed | UI chrome |
| UI | `src/ui/studio/` + `components/ui` | Shell; shared `IconBtn` / labels | Direct pixel edits / IDB |

## Extensibility (composition, not inheritance)

- **Discriminated unions** for `SceneNode` + exhaustive `switch` / `never`
- **`NodeStrategy` registry** (`engine/nodeStrategies/`): `localBounds` / `hitLocal` / `paint` per type — add a file, don't grow deep class trees
- **Pure transform math** (`transformMath.ts`): rotate/flip/resize keep **content center** as the pivot invariant
- **DocCommand** for intentional mutations; gestures for live scrubbing
- Ink is a first-class stroke element; **bake → ImageNode** for materials (not a whiteboard product)

### Transform invariants

Geometric gestures must preserve the agreed pivot (usually content center):

- Rotate: update `rotation` **and** `x/y` so center stays fixed / orbits selection pivot
- Flip: negate `scaleX`/`scaleY` **and** re-anchor origin so center stays fixed
- Resize under rotation: math in local space, map origin back to frame space

Regressions: `engine/transformInvariants.ts` (via `npm run smoke`).

## Why the model looks “thin”

TypeScript interfaces are the **compile-time** contract. Runtime durability for an offline app comes from:

1. **`schemaVersion` + `migrateDocument()`** — every load upgrades old IDB blobs  
2. **`validateDocument()`** — structural checks after migrate  
3. **`DocCommand`** — intentional mutations (not ad-hoc object surgery in UI)  
4. Scene factories always stamp `DOCUMENT_SCHEMA_VERSION`

### Schema versioning (offline upgrades)

- Current: `DOCUMENT_SCHEMA_VERSION` in `model/migrate.ts` (**v4 · ink**)  
- `MIGRATIONS[]` steps `from → to`  
- On open: `DocStore.load` → `migrateDocument` → `validateDocument`  
- When you change node shape: bump version, add a migration, never silently drop fields  

## Document: pages as artboards

- **Page** = one artboard / side (e.g. card front & back).
- Convention: **one page → one frame** (`page.frameIds[0]`).
- Export: current page / all pages ZIP / PDF (+ optional bleed).
- Preview: white / black / checkerboard stage backdrop.

## Geometry (selection precision)

- Leaf AABB: `getNodeBounds` via NodeStrategy (+ text metrics, line negatives)
- Group content (local): `groupContentBoundsLocal` — **never** stub text as 40×40
- Group / selection in frame space: `getNodeBoundsInDoc` / `selectionBounds`
- Hit-test uses inverse transform (`parentToLocal`) so rotated handles match paint

## Performance (many elements)

- **Viewport culling** in `drawToViewport` (`viewRect` vs node AABB)
- **Locked heavy groups** (≥32 children, e.g. 格线): raster cache, redraw on content key change
- Prefer grouping grid lines + `locked` so interact / paint stay cheap

## History

- Snapshot stack with coalesceKey; gestures / transactions for scrubbing

## Shell (IA)

- Lite Home → Editor; object bar = icon-only (`IconBtn` + Lucide)
- Type context bar (text/shape/ink) + image context (replace/crop/mask)
- Pen / eraser tool rail; bake ink to image material
- Print packs: `GridParamsModal` before create; export menu bleed toggle
- Labels from `ui/studio/uiLabels.ts` (unicode escapes; encoding-safe)

## Visual system (Atelier)

- Warm dark + oxidized copper `--accent`
- Prefer crisp iconography over letter chips (L/C/R)

## UI stack

- Tailwind v4 + shadcn-style primitives
- Custom canvas renderer (not Fabric/Konva)
