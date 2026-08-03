import type { GroupNode } from '../../model';
import type { NodeStrategy } from './types';

/**
 * Group bounds/hit live in groupBounds + hitTest to avoid circular imports
 * (bounds → strategies → groupBounds → bounds). Strategy kept for registry completeness.
 */
export const groupStrategy: NodeStrategy<GroupNode> = {
  type: 'group',
  localBounds: () => ({ x: 0, y: 0, w: 0, h: 0 }),
  hitLocal: () => false,
  paint: () => {
    /* group paint + raster cache stays in renderer */
  },
};
