import type { ImageNode } from '../../model';
import type { NodeStrategy } from './types';

export const imageStrategy: NodeStrategy<ImageNode> = {
  type: 'image',
  localBounds: (node) => ({ x: 0, y: 0, w: node.width, h: node.height }),
  hitLocal: (node, lx, ly) => lx >= 0 && ly >= 0 && lx <= node.width && ly <= node.height,
  paint: () => {
    /* image paint (mask clip) stays in renderer for asset access path */
  },
};
