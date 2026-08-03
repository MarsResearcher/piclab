import { getLocalBounds, type AABB } from './bounds';
import { groupContentBoundsLocal } from './groupBounds';
import { isGroup, type SceneNode, type StudioDocument, type Transform2D } from '../model';

export type Vec2 = { x: number; y: number };

/** Map local point → parent/frame space through node transform. */
export function localToParent(t: Transform2D, lx: number, ly: number): Vec2 {
  const sx = lx * t.scaleX;
  const sy = ly * t.scaleY;
  const rad = (t.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: t.x + sx * cos - sy * sin,
    y: t.y + sx * sin + sy * cos,
  };
}

/** Map parent/frame point → local space (inverse of localToParent). */
export function parentToLocal(t: Transform2D, px: number, py: number): Vec2 {
  const dx = px - t.x;
  const dy = py - t.y;
  const rad = (-t.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const rx = dx * cos - dy * sin;
  const ry = dx * sin + dy * cos;
  const sx = t.scaleX === 0 ? 1 : t.scaleX;
  const sy = t.scaleY === 0 ? 1 : t.scaleY;
  return { x: rx / sx, y: ry / sy };
}

export function rotateAround(point: Vec2, pivot: Vec2, deg: number): Vec2 {
  const rad = (deg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = point.x - pivot.x;
  const dy = point.y - pivot.y;
  return {
    x: pivot.x + dx * cos - dy * sin,
    y: pivot.y + dx * sin + dy * cos,
  };
}

/** Local-space content center (pre-transform). */
export function getLocalCenter(doc: StudioDocument | null, node: SceneNode): Vec2 {
  if (doc && isGroup(node)) {
    const b = groupContentBoundsLocal(doc, node);
    if (b) return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
  }
  const b = getLocalBounds(node);
  return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
}

/** World/frame center of a node's content. */
export function getNodeCenter(doc: StudioDocument | null, node: SceneNode): Vec2 {
  const c = getLocalCenter(doc, node);
  return localToParent(node.transform, c.x, c.y);
}

/**
 * Top-left (transform origin) such that local center maps to `worldCenter`
 * under the given transform rotation/scale.
 */
export function originForWorldCenter(
  worldCenter: Vec2,
  localCenter: Vec2,
  rotation: number,
  scaleX: number,
  scaleY: number,
): Vec2 {
  const sx = localCenter.x * scaleX;
  const sy = localCenter.y * scaleY;
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: worldCenter.x - (sx * cos - sy * sin),
    y: worldCenter.y - (sx * sin + sy * cos),
  };
}

/** Rotate node around a fixed pivot; keep content center orbiting correctly. */
export function transformAfterPivotRotate(opts: {
  pivot: Vec2;
  localCenter: Vec2;
  orig: Transform2D;
  /** World center at gesture start. */
  origWorldCenter: Vec2;
  deltaDeg: number;
}): Transform2D {
  const { pivot, localCenter, orig, origWorldCenter, deltaDeg } = opts;
  const nextCenter = rotateAround(origWorldCenter, pivot, deltaDeg);
  const rotation = normalizeDeg(orig.rotation + deltaDeg);
  const origin = originForWorldCenter(
    nextCenter,
    localCenter,
    rotation,
    orig.scaleX,
    orig.scaleY,
  );
  return {
    ...orig,
    x: origin.x,
    y: origin.y,
    rotation,
  };
}

export function normalizeDeg(deg: number): number {
  let next = deg;
  while (next > 180) next -= 360;
  while (next < -180) next += 360;
  return next;
}

/** Cursor angle from pivot in degrees (−180…180). */
export function angleFromPivot(pivot: Vec2, cursor: Vec2): number {
  return (Math.atan2(cursor.y - pivot.y, cursor.x - pivot.x) * 180) / Math.PI;
}

/**
 * Gesture delta from start cursor angle, optionally snapping so the primary
 * node's absolute rotation lands on a 15° grid.
 */
export function computeRotateDelta(opts: {
  pivot: Vec2;
  cursor: Vec2;
  startAngleDeg: number;
  primaryOrigRotation: number;
  snap15: boolean;
}): number {
  const raw = angleFromPivot(opts.pivot, opts.cursor) - opts.startAngleDeg;
  if (!opts.snap15) return raw;
  const absolute = normalizeDeg(opts.primaryOrigRotation + raw);
  const snapped = Math.round(absolute / 15) * 15;
  return snapped - opts.primaryOrigRotation;
}

export function aabbCenter(b: AABB): Vec2 {
  return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
}

/**
 * Flip around content center (not transform origin).
 * Negating scale alone orbits the top-left; we re-anchor so world center stays fixed.
 */
export function transformAfterCenterFlip(
  transform: Transform2D,
  localCenter: Vec2,
  axis: 'h' | 'v',
): Transform2D {
  const worldCenter = localToParent(transform, localCenter.x, localCenter.y);
  const scaleX = axis === 'h' ? -transform.scaleX : transform.scaleX;
  const scaleY = axis === 'v' ? -transform.scaleY : transform.scaleY;
  const origin = originForWorldCenter(
    worldCenter,
    localCenter,
    transform.rotation,
    scaleX,
    scaleY,
  );
  return {
    ...transform,
    x: origin.x,
    y: origin.y,
    scaleX,
    scaleY,
  };
}
