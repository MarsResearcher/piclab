import type { AssetStore } from '../store/assetStore';
import { isInk, type InkNode, type StudioDocument } from '../model';
import { getNodeBoundsInDoc } from './groupBounds';
import { paintInkStroke } from './inkGeometry';

export type BakeInkResult = {
  imageData: ImageData;
  /** Top-left of baked content in frame space. */
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Rasterize ink nodes (transparent background) for material bake. */
export function bakeInkNodes(
  doc: StudioDocument,
  _assets: AssetStore,
  ids: string[],
): BakeInkResult | null {
  const inks: InkNode[] = [];
  for (const id of ids) {
    const n = doc.nodes[id];
    if (n && isInk(n) && n.visible) inks.push(n);
  }
  if (!inks.length) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const ink of inks) {
    const b = getNodeBoundsInDoc(doc, ink);
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.w);
    maxY = Math.max(maxY, b.y + b.h);
  }
  const pad = 2;
  minX = Math.floor(minX) - pad;
  minY = Math.floor(minY) - pad;
  maxX = Math.ceil(maxX) + pad;
  maxY = Math.ceil(maxY) + pad;
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, width, height);
  ctx.translate(-minX, -minY);

  for (const ink of inks) {
    ctx.save();
    ctx.translate(ink.transform.x, ink.transform.y);
    ctx.rotate((ink.transform.rotation * Math.PI) / 180);
    ctx.scale(ink.transform.scaleX, ink.transform.scaleY);
    paintInkStroke(ctx, ink);
    ctx.restore();
  }

  return {
    imageData: ctx.getImageData(0, 0, width, height),
    x: minX,
    y: minY,
    width,
    height,
  };
}
