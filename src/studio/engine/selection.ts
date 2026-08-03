import type { AABB } from './bounds';
import { getNodeBoundsInDoc } from './groupBounds';
import {
  computeRotateDelta,
  getLocalCenter,
  getNodeCenter,
  transformAfterCenterFlip,
  transformAfterPivotRotate,
  type Vec2,
} from './transformMath';
import type { SceneNode, StudioDocument, Transform2D } from '../model';

export { getNodeBoundsInDoc, groupContentBoundsLocal } from './groupBounds';
export {
  aabbCenter,
  computeRotateDelta,
  getLocalCenter,
  getNodeCenter,
  localToParent,
  parentToLocal,
  transformAfterCenterFlip,
  transformAfterPivotRotate,
} from './transformMath';

/** Union AABB of selected nodes in frame space. */
export function selectionBounds(doc: StudioDocument, ids: string[]): AABB | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let any = false;
  for (const id of ids) {
    const node = doc.nodes[id];
    if (!node || node.type === 'frame') continue;
    const b = getNodeBoundsInDoc(doc, node);
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.w);
    maxY = Math.max(maxY, b.y + b.h);
    any = true;
  }
  if (!any) return null;
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

export function primarySelectionId(ids: string[]): string | null {
  return ids[ids.length - 1] ?? null;
}

/** Rotate-handle position below selection bounds (frame space). */
export function rotateHandlePoint(bounds: AABB, offset = 26): { x: number; y: number } {
  return { x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h + offset };
}

export function hitTestRotateHandle(
  bounds: AABB,
  frameX: number,
  frameY: number,
  viewScale: number,
): boolean {
  const p = rotateHandlePoint(bounds);
  const r = Math.max(14, 16 / Math.max(viewScale, 0.05));
  return Math.hypot(frameX - p.x, frameY - p.y) <= r;
}

/**
 * @deprecated Prefer computeRotateDelta + transformAfterPivotRotate.
 * Kept for API compat — returns angle only (does NOT keep center fixed).
 */
export function applyRotation(opts: {
  centerX: number;
  centerY: number;
  startAngleDeg: number;
  origRotation: number;
  cursorX: number;
  cursorY: number;
  snap15: boolean;
}): number {
  const delta = computeRotateDelta({
    pivot: { x: opts.centerX, y: opts.centerY },
    cursor: { x: opts.cursorX, y: opts.cursorY },
    startAngleDeg: opts.startAngleDeg,
    primaryOrigRotation: opts.origRotation,
    snap15: opts.snap15,
  });
  return opts.origRotation + delta;
}

export type RotateOrig = {
  transform: Transform2D;
  localCenter: Vec2;
  worldCenter: Vec2;
};

/** Snapshot nodes for a center-correct rotate gesture. */
export function captureRotateOrigins(
  doc: StudioDocument,
  ids: string[],
): Record<string, RotateOrig> {
  const out: Record<string, RotateOrig> = {};
  for (const id of ids) {
    const node = doc.nodes[id];
    if (!node) continue;
    const localCenter = getLocalCenter(doc, node);
    out[id] = {
      transform: { ...node.transform },
      localCenter,
      worldCenter: getNodeCenter(doc, node),
    };
  }
  return out;
}

/** Apply pivot-centered rotation for one node from a gesture snapshot. */
export function applyCenterRotation(
  orig: RotateOrig,
  pivot: Vec2,
  deltaDeg: number,
): Transform2D {
  return transformAfterPivotRotate({
    pivot,
    localCenter: orig.localCenter,
    orig: orig.transform,
    origWorldCenter: orig.worldCenter,
    deltaDeg,
  });
}

/** Flip around content center. Pass `doc` for groups (local center from children). */
export function flipNodeTransform(
  node: SceneNode,
  axis: 'h' | 'v',
  doc: StudioDocument | null = null,
): Partial<SceneNode> {
  const localCenter = getLocalCenter(doc, node);
  return {
    transform: transformAfterCenterFlip(node.transform, localCenter, axis),
  };
}
