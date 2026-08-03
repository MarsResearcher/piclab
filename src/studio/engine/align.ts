import { getNodeBounds } from './bounds';
import type { FrameNode, SceneNode, StudioDocument } from '../model';

export type AlignEdge = 'left' | 'centerX' | 'right' | 'top' | 'centerY' | 'bottom';

/** Align selected nodes relative to the active frame. */
export function alignNodesToFrame(
  doc: StudioDocument,
  frame: FrameNode,
  ids: string[],
  edge: AlignEdge,
): Array<{ id: string; x: number; y: number }> {
  const out: Array<{ id: string; x: number; y: number }> = [];
  for (const id of ids) {
    const node = doc.nodes[id];
    if (!node || node.type === 'frame' || node.locked) continue;
    const b = getNodeBounds(node);
    let x = node.transform.x;
    let y = node.transform.y;
    const dx = node.transform.x - b.x;
    const dy = node.transform.y - b.y;
    switch (edge) {
      case 'left':
        x = dx;
        break;
      case 'centerX':
        x = frame.width / 2 - b.w / 2 + dx;
        break;
      case 'right':
        x = frame.width - b.w + dx;
        break;
      case 'top':
        y = dy;
        break;
      case 'centerY':
        y = frame.height / 2 - b.h / 2 + dy;
        break;
      case 'bottom':
        y = frame.height - b.h + dy;
        break;
      default: {
        const _e: never = edge;
        void _e;
      }
    }
    out.push({ id, x: Math.round(x), y: Math.round(y) });
  }
  return out;
}

export function canAlign(node: SceneNode | null | undefined): boolean {
  return !!node && node.type !== 'frame' && !node.locked;
}
