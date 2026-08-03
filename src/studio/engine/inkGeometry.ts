import type { InkNode } from '../model';

export type InkAABB = { x: number; y: number; w: number; h: number };

/** Local AABB of ink polyline, padded by stroke. */
export function inkLocalBounds(node: InkNode): InkAABB {
  const pts = node.points;
  if (!pts.length) {
    const pad = Math.max(4, node.strokeWidth);
    return { x: -pad, y: -pad, w: pad * 2, h: pad * 2 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  const pad = Math.max(2, node.strokeWidth / 2 + 1);
  return {
    x: minX - pad,
    y: minY - pad,
    w: Math.max(1, maxX - minX + pad * 2),
    h: Math.max(1, maxY - minY + pad * 2),
  };
}

/** Distance from point to polyline segment (local). */
export function distToInkStroke(node: InkNode, lx: number, ly: number): number {
  const pts = node.points;
  if (pts.length === 0) return Infinity;
  if (pts.length === 1) {
    return Math.hypot(lx - pts[0]!.x, ly - pts[0]!.y);
  }
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!;
    const b = pts[i]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy || 1;
    let t = ((lx - a.x) * dx + (ly - a.y) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const px = a.x + t * dx;
    const py = a.y + t * dy;
    best = Math.min(best, Math.hypot(lx - px, ly - py));
  }
  return best;
}

export function hitInkLocal(node: InkNode, lx: number, ly: number): boolean {
  const thresh = Math.max(6, node.strokeWidth / 2 + 4);
  return distToInkStroke(node, lx, ly) <= thresh;
}

export function paintInkStroke(ctx: CanvasRenderingContext2D, node: InkNode): void {
  const pts = node.points;
  if (pts.length === 0) return;
  ctx.save();
  ctx.globalAlpha = node.opacity * (node.brush === 'highlighter' ? 0.45 : 1);
  ctx.strokeStyle = node.stroke;
  ctx.lineWidth = node.strokeWidth * (node.brush === 'marker' ? 1.6 : 1);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (node.brush === 'highlighter') {
    ctx.globalCompositeOperation = 'multiply';
  }
  ctx.beginPath();
  ctx.moveTo(pts[0]!.x, pts[0]!.y);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i]!.x, pts[i]!.y);
  }
  ctx.stroke();
  ctx.restore();
}
