import {
  getActiveFrame,
  isFrame,
  isGroup,
  type FrameNode,
  type SceneNode,
  type StudioDocument,
} from '../model';
import { strategyLocalBounds } from './nodeStrategies';

/** Axis-aligned bounds in parent (frame) space. */
export type AABB = {
  x: number;
  y: number;
  w: number;
  h: number;
};

/**
 * Local AABB relative to node transform origin (before rotation).
 * Leaf types → NodeStrategy. Groups use getNodeBoundsInDoc / groupContentBoundsLocal
 * (kept separate to avoid bounds ↔ groupBounds import cycles).
 */
export function getLocalBounds(node: SceneNode, doc?: StudioDocument | null): AABB {
  if (isFrame(node)) {
    return { x: 0, y: 0, w: node.width, h: node.height };
  }
  if (isGroup(node)) {
    return { x: 0, y: 0, w: 0, h: 0 };
  }
  const stubDoc = doc ?? ({ nodes: {} } as StudioDocument);
  return strategyLocalBounds(node, stubDoc);
}

/**
 * AABB in frame space. Rotation uses axis-aligned bounding box of corners
 * (good enough for snap guides; exact OBB later).
 */
export function getNodeBounds(node: SceneNode, doc?: StudioDocument | null): AABB {
  const local = getLocalBounds(node, doc);
  const { x: tx, y: ty, rotation, scaleX, scaleY } = node.transform;
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const corners = [
    { x: local.x, y: local.y },
    { x: local.x + local.w, y: local.y },
    { x: local.x + local.w, y: local.y + local.h },
    { x: local.x, y: local.y + local.h },
  ].map((p) => {
    const sx = p.x * scaleX;
    const sy = p.y * scaleY;
    return {
      x: tx + sx * cos - sy * sin,
      y: ty + sx * sin + sy * cos,
    };
  });

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const c of corners) {
    minX = Math.min(minX, c.x);
    minY = Math.min(minY, c.y);
    maxX = Math.max(maxX, c.x);
    maxY = Math.max(maxY, c.y);
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

export function frameBounds(frame: FrameNode): AABB {
  return { x: 0, y: 0, w: frame.width, h: frame.height };
}

export function listSiblingBounds(
  doc: StudioDocument,
  excludeId: string,
): AABB[] {
  const frame = getActiveFrame(doc);
  if (!frame) return [];
  const out: AABB[] = [];
  for (const id of frame.children) {
    if (id === excludeId) continue;
    const node = doc.nodes[id];
    if (!node || !node.visible) continue;
    out.push(getNodeBounds(node, doc));
  }
  return out;
}
