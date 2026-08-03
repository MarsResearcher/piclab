import type { TextNode } from '../../model';
import { measureTextBounds } from '../textMetrics';
import type { NodeStrategy } from './types';

export const textStrategy: NodeStrategy<TextNode> = {
  type: 'text',
  localBounds: (node) => {
    const b = measureTextBounds(node);
    return { x: b.ox, y: b.oy, w: b.w, h: b.h };
  },
  hitLocal: (node, lx, ly) => {
    const b = measureTextBounds(node);
    return lx >= b.ox && lx <= b.ox + b.w && ly >= b.oy && ly <= b.oy + b.h;
  },
  paint: () => {
    /* text paint stays in renderer.drawText */
  },
};
