import type { InkNode } from '../../model';
import { inkLocalBounds, hitInkLocal, paintInkStroke } from '../inkGeometry';
import type { NodeStrategy } from './types';

export const inkStrategy: NodeStrategy<InkNode> = {
  type: 'ink',
  localBounds: (node) => inkLocalBounds(node),
  hitLocal: (node, lx, ly) => hitInkLocal(node, lx, ly),
  paint: (ctx, node) => {
    paintInkStroke(ctx, node);
  },
};
