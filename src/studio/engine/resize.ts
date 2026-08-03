import {
  isImage,
  isShape,
  isText,
  type SceneNode,
  type ShapeNode,
  type Transform2D,
} from '../model';
import { measureTextBounds } from './textMetrics';
import { localToParent, parentToLocal } from './transformMath';

export type BoxHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
export type LineHandle = 'line-start' | 'line-end';
export type ResizeHandle = BoxHandle | LineHandle;

const MIN_SIZE = 8;

export function isBoxResizable(node: SceneNode): boolean {
  if (isImage(node)) return true;
  if (isShape(node) && node.shape !== 'line') return true;
  return false;
}

export function isLineNode(node: SceneNode): node is ShapeNode {
  return isShape(node) && node.shape === 'line';
}

/** Local-space handle anchors for box nodes. */
export function getBoxHandlePoints(
  width: number,
  height: number,
): Record<BoxHandle, { x: number; y: number }> {
  return {
    nw: { x: 0, y: 0 },
    n: { x: width / 2, y: 0 },
    ne: { x: width, y: 0 },
    e: { x: width, y: height / 2 },
    se: { x: width, y: height },
    s: { x: width / 2, y: height },
    sw: { x: 0, y: height },
    w: { x: 0, y: height / 2 },
  };
}

export function hitTestResizeHandle(
  node: SceneNode,
  frameX: number,
  frameY: number,
  viewScale: number,
): ResizeHandle | null {
  const hitR = Math.max(11, 14 / Math.max(viewScale, 0.05));
  const local = parentToLocal(node.transform, frameX, frameY);
  const lx = local.x;
  const ly = local.y;

  if (isLineNode(node)) {
    if (Math.hypot(lx, ly) <= hitR) return 'line-start';
    if (Math.hypot(lx - node.width, ly - node.height) <= hitR) return 'line-end';
    return null;
  }

  if (isText(node)) {
    const b = measureTextBounds(node);
    const corners: Record<'nw' | 'ne' | 'se' | 'sw', { x: number; y: number }> = {
      nw: { x: b.ox, y: b.oy },
      ne: { x: b.ox + b.w, y: b.oy },
      se: { x: b.ox + b.w, y: b.oy + b.h },
      sw: { x: b.ox, y: b.oy + b.h },
    };
    let best: BoxHandle | null = null;
    let bestDist = hitR;
    (Object.keys(corners) as Array<'nw' | 'ne' | 'se' | 'sw'>).forEach((id) => {
      const p = corners[id];
      const d = Math.hypot(lx - p.x, ly - p.y);
      if (d <= bestDist) {
        bestDist = d;
        best = id;
      }
    });
    return best;
  }

  if (!isBoxResizable(node)) return null;
  const w = 'width' in node ? node.width : 0;
  const h = 'height' in node ? node.height : 0;
  const points = getBoxHandlePoints(w, h);
  let best: BoxHandle | null = null;
  let bestDist = hitR;
  (Object.keys(points) as BoxHandle[]).forEach((id) => {
    const p = points[id];
    const d = Math.hypot(lx - p.x, ly - p.y);
    if (d <= bestDist) {
      bestDist = d;
      best = id;
    }
  });
  return best;
}

/** Uniform transform scale from a text corner handle (opposite corner fixed). */
export function applyTextCornerScale(opts: {
  handle: BoxHandle;
  origTransform: Transform2D;
  origBounds: { ox: number; oy: number; w: number; h: number };
  cursorFrameX: number;
  cursorFrameY: number;
}): Transform2D {
  const { handle, origTransform, origBounds: b } = opts;
  if (handle !== 'nw' && handle !== 'ne' && handle !== 'se' && handle !== 'sw') {
    return { ...origTransform };
  }
  const corners = {
    nw: { x: b.ox, y: b.oy },
    ne: { x: b.ox + b.w, y: b.oy },
    se: { x: b.ox + b.w, y: b.oy + b.h },
    sw: { x: b.ox, y: b.oy + b.h },
  } as const;
  const opposite = { nw: 'se', ne: 'sw', se: 'nw', sw: 'ne' } as const;
  const pivotLocal = corners[opposite[handle]];
  const handleLocal = corners[handle];
  const pivotW = localToParent(origTransform, pivotLocal.x, pivotLocal.y);
  const handleW = localToParent(origTransform, handleLocal.x, handleLocal.y);
  const startDist = Math.hypot(handleW.x - pivotW.x, handleW.y - pivotW.y) || 1;
  const curDist = Math.hypot(opts.cursorFrameX - pivotW.x, opts.cursorFrameY - pivotW.y);
  const s = Math.min(8, Math.max(0.2, curDist / startDist));
  const next: Transform2D = {
    ...origTransform,
    scaleX: origTransform.scaleX * s,
    scaleY: origTransform.scaleY * s,
  };
  const pivotAfter = localToParent(next, pivotLocal.x, pivotLocal.y);
  next.x += pivotW.x - pivotAfter.x;
  next.y += pivotW.y - pivotAfter.y;
  return next;
}

export type ResizeResult = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Resize from pointer position in frame space (opposite edge/corner stays fixed). */
export function applyBoxResize(opts: {
  handle: BoxHandle;
  origX: number;
  origY: number;
  origW: number;
  origH: number;
  cursorX: number;
  cursorY: number;
  lockAspect: boolean;
}): ResizeResult {
  const { handle, origX, origY, origW, origH, cursorX, cursorY, lockAspect } = opts;
  const right0 = origX + origW;
  const bottom0 = origY + origH;

  let left = origX;
  let top = origY;
  let right = right0;
  let bottom = bottom0;

  if (handle.includes('e')) right = cursorX;
  if (handle.includes('w')) left = cursorX;
  if (handle.includes('s')) bottom = cursorY;
  if (handle.includes('n')) top = cursorY;

  if (handle === 'e' || handle === 'w') {
    top = origY;
    bottom = bottom0;
  }
  if (handle === 'n' || handle === 's') {
    left = origX;
    right = right0;
  }

  if (right < left) {
    const t = left;
    left = right;
    right = t;
  }
  if (bottom < top) {
    const t = top;
    top = bottom;
    bottom = t;
  }

  let w = Math.max(MIN_SIZE, right - left);
  let h = Math.max(MIN_SIZE, bottom - top);

  if (lockAspect && origW > 0 && origH > 0) {
    const ratio = origW / origH;
    const isCorner = handle === 'nw' || handle === 'ne' || handle === 'sw' || handle === 'se';
    if (isCorner) {
      if (w / h > ratio) h = w / ratio;
      else w = h * ratio;
      w = Math.max(MIN_SIZE, w);
      h = Math.max(MIN_SIZE, h);
      switch (handle) {
        case 'se':
          left = origX;
          top = origY;
          break;
        case 'sw':
          right = right0;
          top = origY;
          left = right - w;
          break;
        case 'ne':
          left = origX;
          bottom = bottom0;
          top = bottom - h;
          break;
        case 'nw':
          right = right0;
          bottom = bottom0;
          left = right - w;
          top = bottom - h;
          break;
        default:
          break;
      }
      right = left + w;
      bottom = top + h;
    } else if (handle === 'e' || handle === 'w') {
      h = Math.max(MIN_SIZE, w / ratio);
      const cy = origY + origH / 2;
      top = cy - h / 2;
      bottom = top + h;
      if (handle === 'e') {
        left = origX;
        right = left + w;
      } else {
        right = right0;
        left = right - w;
      }
    } else {
      w = Math.max(MIN_SIZE, h * ratio);
      const cx = origX + origW / 2;
      left = cx - w / 2;
      right = left + w;
      if (handle === 's') {
        top = origY;
        bottom = top + h;
      } else {
        bottom = bottom0;
        top = bottom - h;
      }
    }
  }

  return {
    x: left,
    y: top,
    width: Math.max(MIN_SIZE, right - left),
    height: Math.max(MIN_SIZE, bottom - top),
  };
}

/**
 * Resize a (possibly rotated) box in local space, then map the new origin
 * back to frame space via the original transform.
 */
export function applyBoxResizeLocal(opts: {
  handle: BoxHandle;
  origTransform: Transform2D;
  origW: number;
  origH: number;
  cursorFrameX: number;
  cursorFrameY: number;
  lockAspect: boolean;
}): ResizeResult {
  const localCursor = parentToLocal(
    opts.origTransform,
    opts.cursorFrameX,
    opts.cursorFrameY,
  );
  const local = applyBoxResize({
    handle: opts.handle,
    origX: 0,
    origY: 0,
    origW: opts.origW,
    origH: opts.origH,
    cursorX: localCursor.x,
    cursorY: localCursor.y,
    lockAspect: opts.lockAspect,
  });
  // New top-left was at (local.x, local.y) in the original local space.
  const sx = local.x * opts.origTransform.scaleX;
  const sy = local.y * opts.origTransform.scaleY;
  const rad = (opts.origTransform.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: opts.origTransform.x + sx * cos - sy * sin,
    y: opts.origTransform.y + sx * sin + sy * cos,
    width: local.width,
    height: local.height,
  };
}

export function applyLineResize(opts: {
  handle: LineHandle;
  origX: number;
  origY: number;
  origW: number;
  origH: number;
  frameX: number;
  frameY: number;
}): ResizeResult {
  const { handle, origX, origY, origW, origH, frameX, frameY } = opts;
  if (handle === 'line-end') {
    return {
      x: origX,
      y: origY,
      width: frameX - origX,
      height: frameY - origY,
    };
  }
  const endX = origX + origW;
  const endY = origY + origH;
  return {
    x: frameX,
    y: frameY,
    width: endX - frameX,
    height: endY - frameY,
  };
}

const HANDLE_ANGLE: Record<BoxHandle, number> = {
  e: 0,
  se: 45,
  s: 90,
  sw: 135,
  w: 180,
  nw: 225,
  n: 270,
  ne: 315,
};

function resizeCursorForAngle(deg: number): string {
  let a = deg % 180;
  if (a < 0) a += 180;
  if (a < 22.5 || a >= 157.5) return 'ew-resize';
  if (a < 67.5) return 'nwse-resize';
  if (a < 112.5) return 'ns-resize';
  return 'nesw-resize';
}

export function cursorForHandle(handle: ResizeHandle, rotationDeg = 0): string {
  switch (handle) {
    case 'line-start':
    case 'line-end':
      return 'crosshair';
    case 'n':
    case 's':
    case 'e':
    case 'w':
    case 'ne':
    case 'nw':
    case 'se':
    case 'sw':
      return resizeCursorForAngle(HANDLE_ANGLE[handle] + rotationDeg);
    default: {
      const _e: never = handle;
      void _e;
      return 'default';
    }
  }
}
