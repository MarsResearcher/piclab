import type { AssetStore } from '../store/assetStore';
import {
  getActiveFrame,
  getFrameById,
  isGroup,
  isImage,
  isInk,
  isShape,
  isText,
  type FrameNode,
  type GroupNode,
  type SceneNode,
  type ShapeNode,
  type StudioDocument,
  type TextNode,
} from '../model';
import {
  measureTextBounds,
  textColumns,
  verticalColumnGap,
} from './textMetrics';
import type { GuideLine } from './snap';
import { themeColors } from './themeColors';
import { getBoxHandlePoints, isBoxResizable, isLineNode } from './resize';
import type { AABB } from './bounds';
import { getNodeBoundsInDoc, groupContentBoundsLocal } from './groupBounds';
import { inkLocalBounds } from './inkGeometry';
import { strategyPaint } from './nodeStrategies';
import { rotateHandlePoint, selectionBounds } from './selection';

type GroupRaster = {
  key: string;
  canvas: HTMLCanvasElement;
  x: number;
  y: number;
};

type PaintCtx = {
  assets: AssetStore;
  selection: Set<string>;
  viewScale: number;
  /** Optional viewport in frame space for culling. */
  viewRect?: AABB;
  groupCache: Map<string, GroupRaster>;
};

function aabbIntersects(a: AABB, b: AABB): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function lockedGroupCacheKey(doc: StudioDocument, group: GroupNode): string {
  const parts: string[] = [String(group.children.length), String(group.opacity)];
  for (const cid of group.children) {
    const c = doc.nodes[cid];
    if (!c) continue;
    const t = c.transform;
    parts.push(
      cid,
      c.type,
      String(t.x),
      String(t.y),
      String(t.rotation),
      String(t.scaleX),
      String(t.scaleY),
      String(c.opacity),
      String(c.visible),
    );
    if (isShape(c)) {
      parts.push(c.shape, String(c.width), String(c.height), c.fill, c.stroke, String(c.strokeWidth));
    } else if (isText(c)) {
      parts.push(c.content, String(c.fontSize), c.color);
    } else if (isImage(c)) {
      parts.push(
        c.assetId,
        String(c.width),
        String(c.height),
        c.mask ?? 'none',
        String(c.maskRadius ?? 0),
      );
    }
  }
  return parts.join('|');
}

function drawText(ctx: CanvasRenderingContext2D, node: TextNode): void {
  if (node.writingMode === 'vertical') {
    drawTextVertical(ctx, node);
    return;
  }
  drawTextHorizontal(ctx, node);
}

function drawTextHorizontal(ctx: CanvasRenderingContext2D, node: TextNode): void {
  const weight = node.bold ? '700' : '400';
  ctx.font = `${weight} ${node.fontSize}px ${node.fontFamily}`;
  ctx.textAlign = node.align;
  ctx.textBaseline = 'middle';
  ctx.globalAlpha = node.opacity;
  const lines = node.content.split('\n');
  const lh = (node.lineHeight ?? 1.25) * node.fontSize;
  const startY = -((lines.length - 1) * lh) / 2;

  const hasFill = !!node.color && node.color !== 'transparent';
  const hasStroke =
    node.strokeWidth > 0 &&
    !!node.strokeColor &&
    node.strokeColor !== 'transparent';

  for (let i = 0; i < lines.length; i++) {
    const y = startY + i * lh;
    const line = lines[i] ?? '';
    if (hasStroke) {
      ctx.lineWidth = node.strokeWidth;
      ctx.strokeStyle = node.strokeColor;
      ctx.lineJoin = 'round';
      ctx.strokeText(line, 0, y);
    }
    if (hasFill) {
      ctx.fillStyle = node.color;
      ctx.fillText(line, 0, y);
    }
  }
  ctx.globalAlpha = 1;
}

/** Upright vertical: chars top-to-bottom; columns right-to-left (`\n` = new column). */
function drawTextVertical(ctx: CanvasRenderingContext2D, node: TextNode): void {
  const weight = node.bold ? '700' : '400';
  ctx.font = `${weight} ${node.fontSize}px ${node.fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.globalAlpha = node.opacity;

  const cols = textColumns(node.content);
  const lh = (node.lineHeight ?? 1.25) * node.fontSize;
  const colGap = verticalColumnGap(node.fontSize);
  let maxChars = 1;
  for (const col of cols) maxChars = Math.max(maxChars, col.length);
  const blockH = Math.max(lh * maxChars, node.fontSize);

  const hasFill = !!node.color && node.color !== 'transparent';
  const hasStroke =
    node.strokeWidth > 0 &&
    !!node.strokeColor &&
    node.strokeColor !== 'transparent';

  if (hasStroke) {
    ctx.lineWidth = node.strokeWidth;
    ctx.strokeStyle = node.strokeColor;
    ctx.lineJoin = 'round';
  }
  if (hasFill) ctx.fillStyle = node.color;

  // Column 0 (first line) sits on the right ? traditional CJK column order.
  const xRight = (cols.length - 1) * colGap * 0.5;

  for (let ci = 0; ci < cols.length; ci++) {
    const chars = cols[ci]!;
    const colH = chars.length * lh;
    const pad =
      node.align === 'left'
        ? 0
        : node.align === 'right'
          ? blockH - colH
          : (blockH - colH) / 2;
    const y0 = -blockH / 2 + pad + lh / 2;
    const x = xRight - ci * colGap;

    for (let gi = 0; gi < chars.length; gi++) {
      const ch = chars[gi]!;
      const y = y0 + gi * lh;
      if (hasStroke) ctx.strokeText(ch, x, y);
      if (hasFill) ctx.fillText(ch, x, y);
    }
  }
  ctx.globalAlpha = 1;
}

function drawShape(ctx: CanvasRenderingContext2D, node: ShapeNode): void {
  ctx.globalAlpha = node.opacity;
  ctx.lineWidth = node.strokeWidth;
  ctx.strokeStyle = node.stroke;
  ctx.fillStyle = node.fill;
  if (node.dash?.length) ctx.setLineDash(node.dash);
  else ctx.setLineDash([]);
  const hasFill = node.fill && node.fill !== 'transparent';
  const hasStroke =
    node.strokeWidth > 0 && !!node.stroke && node.stroke !== 'transparent';

  switch (node.shape) {
    case 'rect': {
      if (hasFill) ctx.fillRect(0, 0, node.width, node.height);
      if (hasStroke) ctx.strokeRect(0, 0, node.width, node.height);
      break;
    }
    case 'roundRect': {
      const r = Math.min(
        node.cornerRadius ?? Math.min(node.width, node.height) * 0.18,
        node.width / 2,
        node.height / 2,
      );
      ctx.beginPath();
      ctx.roundRect(0, 0, node.width, node.height, r);
      if (hasFill) ctx.fill();
      if (hasStroke) ctx.stroke();
      break;
    }
    case 'ellipse': {
      ctx.beginPath();
      ctx.ellipse(
        node.width / 2,
        node.height / 2,
        Math.max(0.5, node.width / 2),
        Math.max(0.5, node.height / 2),
        0,
        0,
        Math.PI * 2,
      );
      if (hasFill) ctx.fill();
      if (hasStroke) ctx.stroke();
      break;
    }
    case 'triangle': {
      ctx.beginPath();
      ctx.moveTo(node.width / 2, 0);
      ctx.lineTo(node.width, node.height);
      ctx.lineTo(0, node.height);
      ctx.closePath();
      if (hasFill) ctx.fill();
      if (hasStroke) ctx.stroke();
      break;
    }
    case 'star': {
      const cx = node.width / 2;
      const cy = node.height / 2;
      const spikes = 5;
      const outer = Math.min(node.width, node.height) / 2;
      const inner = outer * 0.4;
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const a = -Math.PI / 2 + (i * Math.PI) / spikes;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      if (hasFill) ctx.fill();
      if (hasStroke) ctx.stroke();
      break;
    }
    case 'arrow': {
      const w = node.width;
      const h = node.height;
      const bodyH = h * 0.4;
      const headW = Math.min(w * 0.35, h);
      ctx.beginPath();
      ctx.moveTo(0, h / 2 - bodyH / 2);
      ctx.lineTo(w - headW, h / 2 - bodyH / 2);
      ctx.lineTo(w - headW, 0);
      ctx.lineTo(w, h / 2);
      ctx.lineTo(w - headW, h);
      ctx.lineTo(w - headW, h / 2 + bodyH / 2);
      ctx.lineTo(0, h / 2 + bodyH / 2);
      ctx.closePath();
      if (hasFill) ctx.fill();
      if (hasStroke) ctx.stroke();
      break;
    }
    case 'line': {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(node.width, node.height);
      ctx.lineCap = 'round';
      ctx.stroke();
      break;
    }
    default: {
      const _e: never = node.shape;
      void _e;
    }
  }
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

function paintCornerHandle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  inv: number,
): void {
  ctx.beginPath();
  ctx.arc(x, y + 0.5 * inv, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = 'rgba(28, 24, 20, 0.38)';
  ctx.lineWidth = Math.max(1, 1.2 * inv);
  ctx.stroke();
}

/** Edge handle ??white pill (vertical on left/right, horizontal on top/bottom). */
function paintEdgeHandle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  vertical: boolean,
  inv: number,
): void {
  const long = 9 * inv;
  const short = 3.6 * inv;
  const hw = vertical ? short : long;
  const hh = vertical ? long : short;
  ctx.beginPath();
  ctx.roundRect(x - hw, y - hh, hw * 2, hh * 2, short);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = 'rgba(28, 24, 20, 0.38)';
  ctx.lineWidth = Math.max(1, 1.15 * inv);
  ctx.stroke();
}

function paintRotateGlyph(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = 'rgba(32, 28, 26, 0.78)';
  ctx.fillStyle = 'rgba(32, 28, 26, 0.78)';
  ctx.lineWidth = Math.max(1.2, r * 0.22);
  ctx.lineCap = 'round';
  const arcR = r * 0.42;
  ctx.beginPath();
  ctx.arc(0, 0, arcR, -Math.PI * 0.75, Math.PI * 0.35);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, arcR, Math.PI * 0.25, Math.PI * 1.35);
  ctx.stroke();
  // arrow heads
  const tip = (ang: number, outward: number) => {
    const ax = Math.cos(ang) * arcR;
    const ay = Math.sin(ang) * arcR;
    const tx = -Math.sin(ang);
    const ty = Math.cos(ang);
    const s = r * 0.28;
    ctx.beginPath();
    ctx.moveTo(ax + tx * s, ay + ty * s);
    ctx.lineTo(ax - tx * s * 0.35 + Math.cos(ang) * outward, ay - ty * s * 0.35 + Math.sin(ang) * outward);
    ctx.lineTo(ax - tx * s, ay - ty * s);
    ctx.closePath();
    ctx.fill();
  };
  tip(Math.PI * 0.35, r * 0.08);
  tip(Math.PI * 1.35, r * 0.08);
  ctx.restore();
}

function paintSelectionChrome(
  ctx: CanvasRenderingContext2D,
  node: SceneNode,
  viewScale: number,
): void {
  const inv = 1 / Math.max(viewScale * Math.max(Math.abs(node.transform.scaleX), 0.01), 0.05);
  ctx.strokeStyle = themeColors.selection;
  ctx.lineWidth = 1.35 * inv;
  ctx.setLineDash([]);

  if (isText(node)) {
    const b = measureTextBounds(node);
    ctx.strokeRect(b.ox, b.oy, b.w, b.h);
    const cornerR = 5.8 * inv;
    paintCornerHandle(ctx, b.ox, b.oy, cornerR, inv);
    paintCornerHandle(ctx, b.ox + b.w, b.oy, cornerR, inv);
    paintCornerHandle(ctx, b.ox + b.w, b.oy + b.h, cornerR, inv);
    paintCornerHandle(ctx, b.ox, b.oy + b.h, cornerR, inv);
  } else if (isInk(node)) {
    const b = inkLocalBounds(node);
    ctx.strokeRect(b.x, b.y, b.w, b.h);
  } else if (isImage(node) || isShape(node)) {
    if (isLineNode(node)) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(node.width, node.height);
      ctx.stroke();
      const r = 6.2 * inv;
      paintCornerHandle(ctx, 0, 0, r, inv);
      paintCornerHandle(ctx, node.width, node.height, r, inv);
    } else {
      const w = 'width' in node ? node.width : 0;
      const h = 'height' in node ? node.height : 0;
      ctx.strokeRect(0, 0, w, h);
      if (isBoxResizable(node)) {
        const cornerR = 5.8 * inv;
        const points = getBoxHandlePoints(w, h);
        paintCornerHandle(ctx, points.nw.x, points.nw.y, cornerR, inv);
        paintCornerHandle(ctx, points.ne.x, points.ne.y, cornerR, inv);
        paintCornerHandle(ctx, points.se.x, points.se.y, cornerR, inv);
        paintCornerHandle(ctx, points.sw.x, points.sw.y, cornerR, inv);
        paintEdgeHandle(ctx, points.n.x, points.n.y, false, inv);
        paintEdgeHandle(ctx, points.s.x, points.s.y, false, inv);
        paintEdgeHandle(ctx, points.e.x, points.e.y, true, inv);
        paintEdgeHandle(ctx, points.w.x, points.w.y, true, inv);
      }
    }
  }
}

function paintNode(
  ctx: CanvasRenderingContext2D,
  doc: StudioDocument,
  node: SceneNode,
  paint: PaintCtx,
): void {
  if (!node.visible) return;

  if (paint.viewRect && node.type !== 'frame') {
    const world = getNodeBoundsInDoc(doc, node);
    if (!aabbIntersects(world, paint.viewRect)) return;
  }

  ctx.save();
  ctx.translate(node.transform.x, node.transform.y);
  ctx.rotate((node.transform.rotation * Math.PI) / 180);
  ctx.scale(node.transform.scaleX, node.transform.scaleY);

  switch (node.type) {
    case 'image': {
      const canvas = paint.assets.getCanvas(node.assetId);
      if (canvas) {
        ctx.globalAlpha = node.opacity;
        ctx.save();
        const mask = node.mask ?? 'none';
        if (mask === 'ellipse') {
          ctx.beginPath();
          ctx.ellipse(
            node.width / 2,
            node.height / 2,
            Math.max(0.5, node.width / 2),
            Math.max(0.5, node.height / 2),
            0,
            0,
            Math.PI * 2,
          );
          ctx.clip();
        } else if (mask === 'roundRect') {
          const r = Math.max(
            0,
            Math.min(
              node.maskRadius ?? Math.round(Math.min(node.width, node.height) * 0.12),
              Math.min(node.width, node.height) / 2,
            ),
          );
          ctx.beginPath();
          ctx.roundRect(0, 0, node.width, node.height, r);
          ctx.clip();
        }
        // Prefer high-quality resampling when scaling photo assets.
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(canvas, 0, 0, node.width, node.height);
        ctx.restore();
        ctx.globalAlpha = 1;
      }
      break;
    }
    case 'text':
      drawText(ctx, node);
      break;
    case 'shape':
      drawShape(ctx, node);
      break;
    case 'ink':
      strategyPaint(ctx, node, { assets: paint.assets, viewScale: paint.viewScale });
      break;
    case 'group': {
      const heavy =
        node.locked &&
        node.children.length >= 32 &&
        !paint.selection.has(node.id) &&
        !node.children.some((cid) => paint.selection.has(cid));
      if (heavy) {
        const local = groupContentBoundsLocal(doc, node);
        if (local && local.w > 0 && local.h > 0) {
          const key = lockedGroupCacheKey(doc, node);
          let raster = paint.groupCache.get(node.id);
          if (!raster || raster.key !== key) {
            const pad = 2;
            const c = document.createElement('canvas');
            c.width = Math.max(1, Math.ceil(local.w + pad * 2));
            c.height = Math.max(1, Math.ceil(local.h + pad * 2));
            const gctx = c.getContext('2d')!;
            gctx.translate(-local.x + pad, -local.y + pad);
            for (const childId of node.children) {
              const child = doc.nodes[childId];
              if (child) {
                paintNode(gctx, doc, child, {
                  ...paint,
                  viewRect: undefined,
                  selection: new Set(),
                });
              }
            }
            raster = { key, canvas: c, x: local.x - pad, y: local.y - pad };
            paint.groupCache.set(node.id, raster);
          }
          ctx.globalAlpha = node.opacity;
          ctx.drawImage(raster.canvas, raster.x, raster.y);
          ctx.globalAlpha = 1;
          break;
        }
      }
      for (const childId of node.children) {
        const child = doc.nodes[childId];
        if (child) paintNode(ctx, doc, child, paint);
      }
      break;
    }
    case 'frame':
      break;
    default: {
      const _exhaustive: never = node;
      void _exhaustive;
    }
  }

  if (paint.selection.has(node.id) && !isGroup(node)) {
    paintSelectionChrome(ctx, node, paint.viewScale);
  } else if (paint.selection.has(node.id) && isGroup(node)) {
    const local = groupContentBoundsLocal(doc, node);
    if (local) {
      const inv = 1 / Math.max(paint.viewScale, 0.05);
      ctx.strokeStyle = themeColors.selection;
      ctx.lineWidth = 1.35 * inv;
      ctx.setLineDash([]);
      ctx.strokeRect(local.x, local.y, local.w, local.h);
    }
  }

  ctx.restore();
}

function paintFrame(
  ctx: CanvasRenderingContext2D,
  doc: StudioDocument,
  frame: FrameNode,
  paint: PaintCtx,
): void {
  ctx.fillStyle = frame.fill ?? '#1a1d24';
  ctx.fillRect(0, 0, frame.width, frame.height);

  for (const childId of frame.children) {
    const node = doc.nodes[childId];
    if (!node) continue;
    paintNode(ctx, doc, node, paint);
  }
}

export class StudioRenderer {
  private viewBuf = document.createElement('canvas');
  private flatBuf = document.createElement('canvas');
  private patternCanvas: HTMLCanvasElement | null = null;
  /** Raster cache for locked heavy groups (e.g. A4 grid lines). */
  private groupCache = new Map<string, GroupRaster>();

  constructor(private assets: AssetStore) {}

  private getPattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
    if (!this.patternCanvas) {
      this.patternCanvas = document.createElement('canvas');
      this.patternCanvas.width = 24;
      this.patternCanvas.height = 24;
      const tctx = this.patternCanvas.getContext('2d')!;
      tctx.fillStyle = themeColors.checkerA;
      tctx.fillRect(0, 0, 24, 24);
      tctx.fillStyle = themeColors.checkerB;
      tctx.fillRect(0, 0, 12, 12);
      tctx.fillRect(12, 12, 12, 12);
    }
    return ctx.createPattern(this.patternCanvas, 'repeat');
  }

  /**
   * Flatten a frame to ImageData. Defaults to the active page's frame.
   * `pixelScale` > 1 renders a larger raster (export ?? / ??) while
   * keeping document coordinates unchanged ? assets are resampled at output size.
   */
  flatten(
    doc: StudioDocument,
    frameId?: string,
    opts?: { pixelScale?: number },
  ): ImageData | null {
    const frame = frameId ? getFrameById(doc, frameId) : getActiveFrame(doc);
    if (!frame) return null;
    const pixelScale = Math.min(4, Math.max(1, opts?.pixelScale ?? 1));
    const outW = Math.max(1, Math.round(frame.width * pixelScale));
    const outH = Math.max(1, Math.round(frame.height * pixelScale));
    this.flatBuf.width = outW;
    this.flatBuf.height = outH;
    const ctx = this.flatBuf.getContext('2d', { willReadFrequently: true })!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, outW, outH);
    ctx.setTransform(pixelScale, 0, 0, pixelScale, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    paintFrame(ctx, doc, frame, {
      assets: this.assets,
      selection: new Set(),
      viewScale: pixelScale,
      groupCache: this.groupCache,
    });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    return ctx.getImageData(0, 0, outW, outH);
  }

  drawToViewport(
    viewport: HTMLCanvasElement,
    doc: StudioDocument,
    view: { scale: number; offsetX: number; offsetY: number },
    guides: GuideLine[] = [],
  ): void {
    const frame = getActiveFrame(doc);
    const dpr = window.devicePixelRatio || 1;
    const cssW = viewport.clientWidth || viewport.width;
    const cssH = viewport.clientHeight || viewport.height;
    const needW = Math.max(1, Math.floor(cssW * dpr));
    const needH = Math.max(1, Math.floor(cssH * dpr));
    if (viewport.width !== needW || viewport.height !== needH) {
      viewport.width = needW;
      viewport.height = needH;
    }
    const ctx = viewport.getContext('2d', { alpha: false })!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const pattern = this.getPattern(ctx);
    if (pattern) {
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, cssW, cssH);
    } else {
      ctx.fillStyle = themeColors.viewportFallback;
      ctx.fillRect(0, 0, cssW, cssH);
    }

    if (!frame) return;

    const scale = Math.max(view.scale, 0.05);
    const viewRect: AABB = {
      x: -view.offsetX / scale - 32,
      y: -view.offsetY / scale - 32,
      w: cssW / scale + 64,
      h: cssH / scale + 64,
    };

    this.viewBuf.width = frame.width;
    this.viewBuf.height = frame.height;
    const sctx = this.viewBuf.getContext('2d', { alpha: false })!;
    sctx.clearRect(0, 0, frame.width, frame.height);
    paintFrame(sctx, doc, frame, {
      assets: this.assets,
      selection: new Set(doc.selection),
      viewScale: view.scale,
      viewRect,
      groupCache: this.groupCache,
    });

    const selBounds = selectionBounds(doc, doc.selection);
    if (selBounds && doc.selection.length > 0) {
      const inv = 1 / Math.max(view.scale, 0.05);
      sctx.save();
      if (doc.selection.length > 1) {
        sctx.strokeStyle = themeColors.selection;
        sctx.lineWidth = 1.35 * inv;
        sctx.setLineDash([]);
        sctx.strokeRect(selBounds.x, selBounds.y, selBounds.w, selBounds.h);
      }
      const rp = rotateHandlePoint(selBounds);
      const midX = selBounds.x + selBounds.w / 2;
      const midBottom = selBounds.y + selBounds.h;
      sctx.strokeStyle = themeColors.selection;
      sctx.lineWidth = 1.25 * inv;
      sctx.beginPath();
      sctx.moveTo(midX, midBottom);
      sctx.lineTo(rp.x, rp.y);
      sctx.stroke();
      const rr = 9.5 * inv;
      // Soft shadow disc
      sctx.beginPath();
      sctx.arc(rp.x, rp.y + 0.6 * inv, rr, 0, Math.PI * 2);
      sctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
      sctx.fill();
      sctx.beginPath();
      sctx.arc(rp.x, rp.y, rr, 0, Math.PI * 2);
      sctx.fillStyle = '#ffffff';
      sctx.fill();
      sctx.strokeStyle = 'rgba(32, 28, 26, 0.28)';
      sctx.lineWidth = Math.max(1, 1.15 * inv);
      sctx.stroke();
      paintRotateGlyph(sctx, rp.x, rp.y, rr);
      sctx.restore();
    }

    if (guides.length > 0) {
      sctx.save();
      sctx.strokeStyle = themeColors.guides;
      sctx.lineWidth = 1;
      sctx.setLineDash([4, 3]);
      for (const g of guides) {
        sctx.beginPath();
        if (g.orientation === 'v') {
          sctx.moveTo(g.pos + 0.5, 0);
          sctx.lineTo(g.pos + 0.5, frame.height);
        } else {
          sctx.moveTo(0, g.pos + 0.5);
          sctx.lineTo(frame.width, g.pos + 0.5);
        }
        sctx.stroke();
      }
      sctx.restore();
    }

    ctx.imageSmoothingEnabled = view.scale < 1;
    if (view.scale < 1) ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      this.viewBuf,
      view.offsetX,
      view.offsetY,
      frame.width * view.scale,
      frame.height * view.scale,
    );
  }
}
