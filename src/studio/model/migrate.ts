import type { InkNode, SceneNode, StudioDocument } from './types';
import { isGroup, isImage, isInk, isShape, isText } from './types';

/**
 * Document schema version (offline-first compatibility).
 *
 * Bump when on-disk / IDB shape changes in a way that loaders must transform.
 * Each step in `MIGRATIONS` upgrades from N → N+1. Opening always runs
 * migrateDocument() so old projects keep working after app updates.
 */
export const DOCUMENT_SCHEMA_VERSION = 5;

type Migration = {
  from: number;
  to: number;
  run: (doc: StudioDocument) => StudioDocument;
};

/** v0/missing → v1: stamp schemaVersion. */
function migrateToV1(doc: StudioDocument): StudioDocument {
  return { ...doc, schemaVersion: 1 };
}

/**
 * v1 → v2: normalize node defaults (opacity/visible/locked/transform),
 * ensure pages have frameIds, clear invalid selection ids.
 */
function migrateToV2(doc: StudioDocument): StudioDocument {
  const nodes: Record<string, SceneNode> = { ...doc.nodes };
  for (const id of Object.keys(nodes)) {
    const n = nodes[id]!;
    const base = {
      ...n,
      visible: n.visible !== false,
      locked: !!n.locked,
      opacity: typeof n.opacity === 'number' ? n.opacity : 1,
      transform: {
        x: n.transform?.x ?? 0,
        y: n.transform?.y ?? 0,
        scaleX: n.transform?.scaleX ?? 1,
        scaleY: n.transform?.scaleY ?? 1,
        rotation: n.transform?.rotation ?? 0,
      },
      parentId: n.parentId ?? null,
      name: n.name?.trim() ? n.name : n.type,
    } as SceneNode;

    if (isText(base) && base.lineHeight == null) {
      nodes[id] = { ...base, lineHeight: 1.25 };
    } else if (isGroup(base) && !Array.isArray(base.children)) {
      nodes[id] = { ...base, children: [] };
    } else if (isShape(base) || isImage(base) || isText(base) || isGroup(base)) {
      nodes[id] = base;
    } else {
      nodes[id] = base;
    }
  }

  const pages = (doc.pages ?? []).map((p, i) => ({
    ...p,
    name: p.name?.trim() ? p.name : `Page ${i + 1}`,
    frameIds: Array.isArray(p.frameIds) ? p.frameIds.filter((fid) => !!nodes[fid]) : [],
  }));

  const selection = (doc.selection ?? []).filter((id) => {
    const n = nodes[id];
    return !!n && n.type !== 'frame';
  });

  let activePageId = doc.activePageId;
  if (!pages.some((p) => p.id === activePageId)) {
    activePageId = pages[0]?.id ?? activePageId;
  }

  return {
    ...doc,
    schemaVersion: 2,
    nodes,
    pages,
    selection,
    activePageId,
  };
}

/** v2 → v3: image mask defaults (none). */
function migrateToV3(doc: StudioDocument): StudioDocument {
  const nodes: Record<string, SceneNode> = { ...doc.nodes };
  for (const id of Object.keys(nodes)) {
    const n = nodes[id]!;
    if (isImage(n) && n.mask == null) {
      nodes[id] = { ...n, mask: 'none' };
    }
  }
  return { ...doc, schemaVersion: 3, nodes };
}

/** v3 → v4: normalize ink strokes if present. */
function migrateToV4(doc: StudioDocument): StudioDocument {
  const nodes: Record<string, SceneNode> = { ...doc.nodes };
  for (const id of Object.keys(nodes)) {
    const n = nodes[id]!;
    if (!isInk(n)) continue;
    const ink = n as InkNode;
    const points = Array.isArray(ink.points) ? ink.points : [];
    nodes[id] = {
      ...ink,
      points,
      stroke: ink.stroke || '#1a1a1a',
      strokeWidth: typeof ink.strokeWidth === 'number' ? ink.strokeWidth : 3,
      brush: ink.brush ?? 'pen',
    };
  }
  return { ...doc, schemaVersion: 4, nodes };
}

/** v4 → v5: text writingMode default (horizontal). */
function migrateToV5(doc: StudioDocument): StudioDocument {
  const nodes: Record<string, SceneNode> = { ...doc.nodes };
  for (const id of Object.keys(nodes)) {
    const n = nodes[id]!;
    if (!isText(n)) continue;
    if (n.writingMode !== 'horizontal' && n.writingMode !== 'vertical') {
      nodes[id] = { ...n, writingMode: 'horizontal' };
    }
  }
  return { ...doc, schemaVersion: 5, nodes };
}

const MIGRATIONS: Migration[] = [
  { from: 0, to: 1, run: migrateToV1 },
  { from: 1, to: 2, run: migrateToV2 },
  { from: 2, to: 3, run: migrateToV3 },
  { from: 3, to: 4, run: migrateToV4 },
  { from: 4, to: 5, run: migrateToV5 },
];

/**
 * Bring any persisted document up to DOCUMENT_SCHEMA_VERSION.
 * Idempotent. Never throws on unknown future versions — clamps forward only.
 */
export function migrateDocument(doc: StudioDocument): StudioDocument {
  let next: StudioDocument = { ...doc };
  let version = next.schemaVersion ?? 0;

  if (version > DOCUMENT_SCHEMA_VERSION) {
    return next;
  }

  while (version < DOCUMENT_SCHEMA_VERSION) {
    const step = MIGRATIONS.find((m) => m.from === version);
    if (!step) {
      next = {
        ...next,
        schemaVersion: DOCUMENT_SCHEMA_VERSION,
      };
      version = DOCUMENT_SCHEMA_VERSION;
      break;
    }
    next = step.run(next);
    version = step.to;
    next = { ...next, schemaVersion: version };
  }

  return next;
}

export type DocumentValidation = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

/** Lightweight structural check after migrate (not a full JSON schema). */
export function validateDocument(doc: StudioDocument): DocumentValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!doc.id) errors.push('missing doc.id');
  if (!Array.isArray(doc.pages) || doc.pages.length === 0) {
    errors.push('doc.pages empty');
  }
  if (!doc.activePageId) errors.push('missing activePageId');
  if ((doc.schemaVersion ?? 0) !== DOCUMENT_SCHEMA_VERSION) {
    warnings.push(
      `schemaVersion ${doc.schemaVersion ?? 0} != current ${DOCUMENT_SCHEMA_VERSION}`,
    );
  }

  for (const page of doc.pages ?? []) {
    if (!page.frameIds?.[0] || !doc.nodes[page.frameIds[0]]) {
      errors.push(`page ${page.id} missing frame`);
    }
  }

  for (const [id, node] of Object.entries(doc.nodes ?? {})) {
    if (node.id !== id) warnings.push(`node key/id mismatch ${id}`);
    if (isGroup(node)) {
      for (const cid of node.children) {
        if (!doc.nodes[cid]) errors.push(`group ${id} missing child ${cid}`);
      }
    }
    if (isInk(node) && (!Array.isArray(node.points) || node.points.length === 0)) {
      warnings.push(`ink ${id} has empty points`);
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}
