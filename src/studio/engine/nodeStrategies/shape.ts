import type { ShapeNode } from '../../model';
import type { AABB } from '../bounds';
import type { NodeStrategy } from './types';

function pointInTriangle(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
): boolean {
  const v0x = cx - ax;
  const v0y = cy - ay;
  const v1x = bx - ax;
  const v1y = by - ay;
  const v2x = px - ax;
  const v2y = py - ay;
  const dot00 = v0x * v0x + v0y * v0y;
  const dot01 = v0x * v1x + v0y * v1y;
  const dot02 = v0x * v2x + v0y * v2y;
  const dot11 = v1x * v1x + v1y * v1y;
  const dot12 = v1x * v2x + v1y * v2y;
  const inv = 1 / (dot00 * dot11 - dot01 * dot01 || 1);
  const u = (dot11 * dot02 - dot01 * dot12) * inv;
  const v = (dot00 * dot12 - dot01 * dot02) * inv;
  return u >= 0 && v >= 0 && u + v <= 1;
}

function localBounds(node: ShapeNode): AABB {
  if (node.shape === 'line') {
    const minX = Math.min(0, node.width);
    const minY = Math.min(0, node.height);
    const maxX = Math.max(0, node.width);
    const maxY = Math.max(0, node.height);
    return {
      x: minX,
      y: minY,
      w: Math.max(1, maxX - minX),
      h: Math.max(1, maxY - minY),
    };
  }
  return { x: 0, y: 0, w: node.width, h: node.height };
}

function hitLocal(node: ShapeNode, lx: number, ly: number): boolean {
  const { width: w, height: h, shape, strokeWidth } = node;
  switch (shape) {
    case 'rect':
    case 'roundRect':
      return lx >= 0 && ly >= 0 && lx <= w && ly <= h;
    case 'ellipse': {
      if (w <= 0 || h <= 0) return false;
      const nx = (lx - w / 2) / (w / 2);
      const ny = (ly - h / 2) / (h / 2);
      return nx * nx + ny * ny <= 1;
    }
    case 'triangle':
      return pointInTriangle(lx, ly, w / 2, 0, w, h, 0, h);
    case 'star':
    case 'arrow':
      return lx >= 0 && ly >= 0 && lx <= w && ly <= h;
    case 'line': {
      const len = Math.hypot(w, h) || 1;
      const t = Math.max(0, Math.min(1, (lx * w + ly * h) / (len * len)));
      const px = t * w;
      const py = t * h;
      return Math.hypot(lx - px, ly - py) <= Math.max(6, strokeWidth + 4);
    }
    default: {
      const _e: never = shape;
      void _e;
      return false;
    }
  }
}

export const shapeStrategy: NodeStrategy<ShapeNode> = {
  type: 'shape',
  localBounds: (node) => localBounds(node),
  hitLocal: (node, lx, ly) => hitLocal(node, lx, ly),
  paint: () => {
    /* shape paint remains in renderer.drawShape for dash/star paths */
  },
};
