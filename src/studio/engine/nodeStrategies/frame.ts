import type { FrameNode } from '../../model';
import type { NodeStrategy } from './types';

export const frameStrategy: NodeStrategy<FrameNode> = {
  type: 'frame',
  localBounds: (node) => ({ x: 0, y: 0, w: node.width, h: node.height }),
  hitLocal: () => false,
  paint: () => {
    /* frames paint via paintFrame */
  },
};
