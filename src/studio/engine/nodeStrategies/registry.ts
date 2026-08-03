import type { SceneNode, StudioDocument } from '../../model';
import type { AABB } from '../bounds';
import { frameStrategy } from './frame';
import { groupStrategy } from './group';
import { imageStrategy } from './image';
import { inkStrategy } from './ink';
import { shapeStrategy } from './shape';
import { textStrategy } from './text';
import type { NodeStrategy, PaintStrategyCtx } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const strategies = new Map<SceneNode['type'], NodeStrategy<any>>();

function register<T extends SceneNode>(s: NodeStrategy<T>): void {
  strategies.set(s.type, s);
}

register(frameStrategy);
register(groupStrategy);
register(imageStrategy);
register(inkStrategy);
register(shapeStrategy);
register(textStrategy);

export function getNodeStrategy(type: SceneNode['type']): NodeStrategy {
  const s = strategies.get(type);
  if (!s) {
    throw new Error(`No NodeStrategy for type: ${type}`);
  }
  return s;
}

export function strategyLocalBounds(node: SceneNode, doc: StudioDocument): AABB {
  return getNodeStrategy(node.type).localBounds(node, doc);
}

export function strategyHitLocal(
  node: SceneNode,
  lx: number,
  ly: number,
  doc: StudioDocument,
): boolean {
  return getNodeStrategy(node.type).hitLocal(node, lx, ly, doc);
}

export function strategyPaint(
  ctx: CanvasRenderingContext2D,
  node: SceneNode,
  paint: PaintStrategyCtx,
): void {
  getNodeStrategy(node.type).paint(ctx, node, paint);
}

export type { NodeStrategy, PaintStrategyCtx } from './types';
