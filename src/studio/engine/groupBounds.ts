import { getNodeBounds, type AABB } from './bounds';
import { isGroup, type GroupNode, type SceneNode, type StudioDocument } from '../model';

/**
 * Union AABB of a group's children in the group's local space
 * (before the group's own translate/rotate/scale).
 * Text uses metrics; shapes/images use rotation-aware getNodeBounds.
 */
export function groupContentBoundsLocal(
  doc: StudioDocument,
  group: GroupNode,
): AABB | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let any = false;

  for (const cid of group.children) {
    const child = doc.nodes[cid];
    if (!child || !child.visible) continue;

    let b: AABB;
    if (isGroup(child)) {
      const local = groupContentBoundsLocal(doc, child);
      if (!local) continue;
      // Child group: content local → child parent space via child transform.
      b = transformLocalAabb(local, child);
    } else {
      b = getNodeBounds(child);
    }

    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.w);
    maxY = Math.max(maxY, b.y + b.h);
    any = true;
  }

  if (!any) return null;
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/** Map a local AABB through a node's transform into parent space. */
function transformLocalAabb(local: AABB, node: SceneNode): AABB {
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

/** Frame/parent-space AABB for any node (groups included). */
export function getNodeBoundsInDoc(doc: StudioDocument, node: SceneNode): AABB {
  if (!isGroup(node)) return getNodeBounds(node, doc);
  const local = groupContentBoundsLocal(doc, node);
  if (!local) {
    return { x: node.transform.x, y: node.transform.y, w: 0, h: 0 };
  }
  return transformLocalAabb(local, node);
}
