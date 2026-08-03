import type { AABB } from '../bounds';
import type { AssetStore } from '../../store/assetStore';
import type { SceneNode, StudioDocument } from '../../model';

export type PaintStrategyCtx = {
  assets: AssetStore;
  viewScale: number;
};

/**
 * Per-type behavior via composition (not inheritance).
 * Register one strategy per SceneNode['type'].
 */
export type NodeStrategy<T extends SceneNode = SceneNode> = {
  type: T['type'];
  localBounds: (node: T, doc: StudioDocument) => AABB;
  /** Hit in node-local space (after inverse transform). */
  hitLocal: (node: T, lx: number, ly: number, doc: StudioDocument) => boolean;
  /** Draw content in local space (caller already applied transform). */
  paint: (ctx: CanvasRenderingContext2D, node: T, paint: PaintStrategyCtx) => void;
};
