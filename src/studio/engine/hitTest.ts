import {
  getActiveFrame,
  isGroup,
  type SceneNode,
  type StudioDocument,
} from '../model';
import { groupContentBoundsLocal } from './groupBounds';
import { strategyHitLocal } from './nodeStrategies';
import { parentToLocal } from './transformMath';

export type HitResult = { nodeId: string; node: SceneNode };

/** Hit test in frame-local coordinates (origin = frame top-left). */
export function hitTestFrame(
  doc: StudioDocument,
  frameX: number,
  frameY: number,
): HitResult | null {
  const frame = getActiveFrame(doc);
  if (!frame) return null;
  if (frameX < 0 || frameY < 0 || frameX > frame.width || frameY > frame.height) {
    return null;
  }

  for (let i = frame.children.length - 1; i >= 0; i--) {
    const id = frame.children[i]!;
    const node = doc.nodes[id];
    if (!node || !node.visible || node.type === 'frame') continue;

    const local = parentToLocal(node.transform, frameX, frameY);

    if (isGroup(node)) {
      const b = groupContentBoundsLocal(doc, node);
      if (
        b &&
        local.x >= b.x &&
        local.y >= b.y &&
        local.x <= b.x + b.w &&
        local.y <= b.y + b.h
      ) {
        return { nodeId: id, node };
      }
      continue;
    }

    if (strategyHitLocal(node, local.x, local.y, doc)) {
      return { nodeId: id, node };
    }
  }
  return null;
}
