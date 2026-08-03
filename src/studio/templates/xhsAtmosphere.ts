/**
 * Xiaohongshu atmosphere chrome — notebook shells, sketch frames, window UI.
 * Stickers via scatterStickers / placeSticker (see stickerAssets).
 */

import type { AssetStore } from '../store/assetStore';
import type { ImageNode, SceneNode, ShapeNode } from '../model';
import { makeLine, makeShape } from '../scenes/helpers';
import { makeAccentStroke, makeVeil } from './templateCraft';
import { makeImageInRect } from './templateAssets';
import { makeRoleText, type TypeRamp } from './templateType';
import { FONT_META, FONT_SANS, FONT_YUAN } from './templatePalettes';
import { XHS_SIG_RAMP } from './xhsComposition';
import { scatterStickers, type StickerSlot } from './stickerAssets';

export { scatterStickers, placeSticker, loadSticker } from './stickerAssets';
export type { StickerSlot } from './stickerAssets';

/** Spiral notebook: white paper + left holes + ring ellipses. */
export function makeSpiralNotebook(
  parentId: string,
  opts: {
    x: number;
    y: number;
    width: number;
    height: number;
    paper?: string;
    ring?: string;
    hole?: string;
    name?: string;
  },
): SceneNode[] {
  const paper = opts.paper ?? '#FFFCF7';
  const ring = opts.ring ?? '#1E3A5F';
  const hole = opts.hole ?? '#E8E0D4';
  const nodes: SceneNode[] = [
    makeShape(parentId, 'roundRect', {
      x: opts.x,
      y: opts.y,
      width: opts.width,
      height: opts.height,
      fill: paper,
      cornerRadius: 8,
      name: opts.name ?? '\u7eb8\u58f3',
      locked: true,
    }),
  ];
  const margin = 28;
  const count = Math.max(6, Math.floor(opts.height / 90));
  const step = (opts.height - margin * 2) / (count - 1);
  for (let i = 0; i < count; i++) {
    const cy = opts.y + margin + i * step;
    nodes.push(
      makeShape(parentId, 'ellipse', {
        x: opts.x + 18,
        y: cy - 9,
        width: 18,
        height: 18,
        fill: hole,
        stroke: 'rgba(26,21,16,0.15)',
        strokeWidth: 1,
        name: `\u7ebf\u5708\u5b54${i}`,
        locked: true,
      }),
      makeShape(parentId, 'ellipse', {
        x: opts.x + 8,
        y: cy - 12,
        width: 22,
        height: 24,
        fill: 'rgba(0,0,0,0)',
        stroke: ring,
        strokeWidth: 5,
        name: `\u7ebf\u5708\u73af${i}`,
        locked: true,
      }),
    );
  }
  return nodes;
}

/** Offset color shadow + white/main card (sticker paper). */
export function makeOffsetShadowCard(
  parentId: string,
  opts: {
    x: number;
    y: number;
    width: number;
    height: number;
    fill?: string;
    shadow?: string;
    offset?: number;
    radius?: number;
    stroke?: string;
    strokeWidth?: number;
  },
): SceneNode[] {
  const off = opts.offset ?? 10;
  const radius = opts.radius ?? 16;
  return [
    makeShape(parentId, 'roundRect', {
      x: opts.x + off,
      y: opts.y + off,
      width: opts.width,
      height: opts.height,
      fill: opts.shadow ?? '#E85D7A',
      cornerRadius: radius,
      name: '\u7eb8\u58f3\u9634\u5f71',
      locked: true,
    }),
    makeShape(parentId, 'roundRect', {
      x: opts.x,
      y: opts.y,
      width: opts.width,
      height: opts.height,
      fill: opts.fill ?? '#FFFCF7',
      stroke: opts.stroke ?? '#1A1510',
      strokeWidth: opts.strokeWidth ?? 4,
      cornerRadius: radius,
      name: '\u7eb8\u58f3',
      locked: true,
    }),
  ];
}

/** Double / sketchy frame around a content area. */
export function makeSketchFrame(
  parentId: string,
  opts: {
    x: number;
    y: number;
    width: number;
    height: number;
    stroke?: string;
    accent?: string;
    fill?: string;
    radius?: number;
  },
): SceneNode[] {
  const stroke = opts.stroke ?? '#1A1510';
  const accent = opts.accent ?? '#F4A7B9';
  const radius = opts.radius ?? 18;
  return [
    makeShape(parentId, 'roundRect', {
      x: opts.x + 5,
      y: opts.y + 5,
      width: opts.width,
      height: opts.height,
      fill: 'rgba(0,0,0,0)',
      stroke: accent,
      strokeWidth: 3,
      cornerRadius: radius,
      name: '\u7eb8\u58f3\u5916\u63cf',
      locked: true,
    }),
    makeShape(parentId, 'roundRect', {
      x: opts.x,
      y: opts.y,
      width: opts.width,
      height: opts.height,
      fill: opts.fill ?? '#FFFCF7',
      stroke,
      strokeWidth: 4,
      cornerRadius: radius,
      name: '\u7eb8\u58f3',
      locked: true,
    }),
  ];
}

export function makeWavyUnderline(
  parentId: string,
  opts: { x: number; y: number; width: number; stroke?: string; strokeWidth?: number },
): SceneNode {
  return makeAccentStroke(parentId, {
    x: opts.x,
    y: opts.y,
    width: opts.width,
    amplitude: 8,
    waves: 2.2,
    stroke: opts.stroke ?? '#E85D4C',
    strokeWidth: opts.strokeWidth ?? 4,
    name: '\u6ce2\u6d6a\u4e0b\u5212\u7ebf',
  });
}

export function makeHighlighterOval(
  parentId: string,
  opts: {
    x: number;
    y: number;
    width: number;
    height: number;
    fill?: string;
    opacity?: number;
  },
): ShapeNode {
  return makeShape(parentId, 'ellipse', {
    x: opts.x,
    y: opts.y,
    width: opts.width,
    height: opts.height,
    fill: opts.fill ?? 'rgba(255,229,102,0.55)',
    name: '\u8336\u8272\u9ad8\u4eae',
    locked: true,
    opacity: opts.opacity ?? 1,
  });
}

/** Soft pill / cloud-like header bar for section titles. */
export function makeCloudHeaderBar(
  parentId: string,
  opts: {
    x: number;
    y: number;
    width: number;
    height: number;
    fill: string;
    label: string;
    labelColor?: string;
    ramp?: TypeRamp;
  },
): SceneNode[] {
  const ramp = opts.ramp ?? XHS_SIG_RAMP;
  const h = opts.height;
  const nodes: SceneNode[] = [
    makeShape(parentId, 'roundRect', {
      x: opts.x,
      y: opts.y,
      width: opts.width,
      height: h,
      fill: opts.fill,
      cornerRadius: Math.round(h / 2),
      name: '\u4e91\u6735\u6807\u9898\u6761',
      locked: true,
    }),
    makeShape(parentId, 'ellipse', {
      x: opts.x + opts.width - h * 0.55,
      y: opts.y - h * 0.15,
      width: h * 0.7,
      height: h * 0.7,
      fill: opts.fill,
      name: '\u4e91\u6735\u7aef',
      locked: true,
    }),
    makeRoleText(
      parentId,
      'body',
      opts.label,
      opts.x + opts.width / 2,
      opts.y + h / 2,
      ramp,
      {
        name: '\u6807\u9898',
        align: 'center',
        color: opts.labelColor ?? '#FFFCF7',
        fontFamily: FONT_YUAN,
        fontSize: Math.round(h * 0.42),
        bold: true,
      },
    ),
  ];
  return nodes;
}

/** Pseudo browser / window chrome. */
export function makeWindowChrome(
  parentId: string,
  opts: {
    x: number;
    y: number;
    width: number;
    height: number;
    barH?: number;
    fill?: string;
    barFill?: string;
    stroke?: string;
  },
): SceneNode[] {
  const barH = opts.barH ?? 48;
  const fill = opts.fill ?? '#FFFCF7';
  const barFill = opts.barFill ?? '#FFF3D6';
  const stroke = opts.stroke ?? '#1A1510';
  const dots = ['#FF5F57', '#FEBC2E', '#28C840'];
  const nodes: SceneNode[] = [
    makeShape(parentId, 'roundRect', {
      x: opts.x,
      y: opts.y,
      width: opts.width,
      height: opts.height,
      fill,
      stroke,
      strokeWidth: 4,
      cornerRadius: 16,
      name: '\u7eb8\u58f3',
      locked: true,
    }),
    makeShape(parentId, 'roundRect', {
      x: opts.x,
      y: opts.y,
      width: opts.width,
      height: barH,
      fill: barFill,
      cornerRadius: 16,
      name: '\u7a97\u680f',
      locked: true,
    }),
    makeVeil(parentId, {
      x: opts.x,
      y: opts.y + barH - 8,
      width: opts.width,
      height: 10,
      fill: barFill,
      name: '\u7a97\u680f\u63a5',
    }),
    makeLine(parentId, opts.x + 56, opts.y + barH / 2, 80, 0, {
      stroke: 'rgba(26,21,16,0.2)',
      strokeWidth: 3,
      name: '\u7a97\u680f\u7ebf',
      locked: true,
    }),
  ];
  dots.forEach((c, i) => {
    nodes.push(
      makeShape(parentId, 'ellipse', {
        x: opts.x + opts.width - 28 - i * 22,
        y: opts.y + barH / 2 - 7,
        width: 14,
        height: 14,
        fill: c,
        stroke: stroke,
        strokeWidth: 1.5,
        name: `\u7a97\u70b9${i}`,
        locked: true,
      }),
    );
  });
  return nodes;
}

/** Inner page chrome baked into the journal shell (not separate layers). */
export type JournalShellPage =
  | {
      kind: 'sketch';
      x: number;
      y: number;
      width: number;
      height: number;
      fill?: string;
      stroke?: string;
      accent?: string;
      radius?: number;
    }
  | {
      kind: 'plain';
      x: number;
      y: number;
      width: number;
      height: number;
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
      radius?: number;
    }
  | {
      kind: 'offsetCard';
      x: number;
      y: number;
      width: number;
      height: number;
      fill?: string;
      shadow?: string;
      offset?: number;
      radius?: number;
      stroke?: string;
      strokeWidth?: number;
    }
  | {
      kind: 'spiral';
      x: number;
      y: number;
      width: number;
      height: number;
      paper?: string;
      ring?: string;
      hole?: string;
    }
  | {
      kind: 'window';
      x: number;
      y: number;
      width: number;
      height: number;
      fill?: string;
      barFill?: string;
      stroke?: string;
      barH?: number;
    };

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function paintField(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  fill: string,
  grid?: string,
  gridStep = 48,
): void {
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, w, h);
  if (!grid) return;
  ctx.strokeStyle = grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= w; x += gridStep) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, h);
  }
  for (let y = 0; y <= h; y += gridStep) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(w, y + 0.5);
  }
  ctx.stroke();
}

function paintShellPage(ctx: CanvasRenderingContext2D, page: JournalShellPage): void {
  switch (page.kind) {
    case 'sketch': {
      const fill = page.fill ?? '#FFFCF7';
      const stroke = page.stroke ?? '#1A1510';
      const accent = page.accent ?? '#F4A7B9';
      const radius = page.radius ?? 18;
      roundRectPath(ctx, page.x + 5, page.y + 5, page.width, page.height, radius);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 3;
      ctx.stroke();
      roundRectPath(ctx, page.x, page.y, page.width, page.height, radius);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 4;
      ctx.stroke();
      break;
    }
    case 'plain': {
      const radius = page.radius ?? 4;
      roundRectPath(ctx, page.x, page.y, page.width, page.height, radius);
      ctx.fillStyle = page.fill ?? '#FFFCF7';
      ctx.fill();
      if (page.stroke) {
        ctx.strokeStyle = page.stroke;
        ctx.lineWidth = page.strokeWidth ?? 3;
        ctx.stroke();
      }
      break;
    }
    case 'offsetCard': {
      const off = page.offset ?? 10;
      const radius = page.radius ?? 16;
      roundRectPath(ctx, page.x + off, page.y + off, page.width, page.height, radius);
      ctx.fillStyle = page.shadow ?? '#E85D7A';
      ctx.fill();
      roundRectPath(ctx, page.x, page.y, page.width, page.height, radius);
      ctx.fillStyle = page.fill ?? '#FFFCF7';
      ctx.fill();
      ctx.strokeStyle = page.stroke ?? '#1A1510';
      ctx.lineWidth = page.strokeWidth ?? 4;
      ctx.stroke();
      break;
    }
    case 'spiral': {
      const paper = page.paper ?? '#FFFCF7';
      const ring = page.ring ?? '#1E3A5F';
      const hole = page.hole ?? '#E8E0D4';
      roundRectPath(ctx, page.x, page.y, page.width, page.height, 8);
      ctx.fillStyle = paper;
      ctx.fill();
      const margin = 28;
      const count = Math.max(6, Math.floor(page.height / 90));
      const step = (page.height - margin * 2) / (count - 1);
      for (let i = 0; i < count; i++) {
        const cy = page.y + margin + i * step;
        ctx.beginPath();
        ctx.ellipse(page.x + 27, cy, 9, 9, 0, 0, Math.PI * 2);
        ctx.fillStyle = hole;
        ctx.fill();
        ctx.strokeStyle = 'rgba(26,21,16,0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(page.x + 19, cy, 11, 12, 0, 0, Math.PI * 2);
        ctx.strokeStyle = ring;
        ctx.lineWidth = 5;
        ctx.stroke();
      }
      break;
    }
    case 'window': {
      const barH = page.barH ?? 48;
      const fill = page.fill ?? '#FFFCF7';
      const barFill = page.barFill ?? '#FFF3D6';
      const stroke = page.stroke ?? '#1A1510';
      roundRectPath(ctx, page.x, page.y, page.width, page.height, 16);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 4;
      ctx.stroke();
      roundRectPath(ctx, page.x, page.y, page.width, barH, 16);
      ctx.fillStyle = barFill;
      ctx.fill();
      ctx.fillRect(page.x, page.y + barH - 8, page.width, 10);
      ctx.strokeStyle = 'rgba(26,21,16,0.2)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(page.x + 56, page.y + barH / 2);
      ctx.lineTo(page.x + 136, page.y + barH / 2);
      ctx.stroke();
      const dots = ['#FF5F57', '#FEBC2E', '#28C840'];
      dots.forEach((c, i) => {
        ctx.beginPath();
        ctx.ellipse(page.x + page.width - 21 - i * 22, page.y + barH / 2, 7, 7, 0, 0, Math.PI * 2);
        ctx.fillStyle = c;
        ctx.fill();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
      break;
    }
    default: {
      const _e: never = page;
      void _e;
    }
  }
}

/**
 * Full-bleed journal shell: outer field (+ grid) + inner page chrome in ONE bitmap.
 * Product model: replaceable「手账壳」— content/text/stickers sit on top.
 */
export function rasterJournalShell(
  width: number,
  height: number,
  opts: { field: string; grid?: string; gridStep?: number; page?: JournalShellPage },
): ImageData {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  paintField(ctx, w, h, opts.field, opts.grid, opts.gridStep);
  if (opts.page) paintShellPage(ctx, opts.page);
  return ctx.getImageData(0, 0, w, h);
}

export function rasterPastelField(
  width: number,
  height: number,
  fill: string,
  grid?: string,
  gridStep = 48,
): ImageData {
  return rasterJournalShell(width, height, { field: fill, grid, gridStep });
}

/**
 * One locked「手账壳」image — field + page are cohesive (swap as a unit later).
 */
export function makeJournalShell(
  parentId: string,
  assets: AssetStore,
  opts: {
    width: number;
    height: number;
    field: string;
    grid?: string;
    page?: JournalShellPage;
    name?: string;
  },
): ImageNode {
  const image = rasterJournalShell(opts.width, opts.height, {
    field: opts.field,
    grid: opts.grid,
    page: opts.page,
  });
  return makeImageInRect(parentId, assets, image, 0, 0, opts.width, opts.height, {
    name: opts.name ?? '\u624b\u8d26\u58f3',
    locked: true,
  });
}

/** @deprecated Prefer makeJournalShell — field-only shell without inner page. */
export function makePastelField(
  parentId: string,
  assets: AssetStore,
  opts: {
    x: number;
    y: number;
    width: number;
    height: number;
    fill: string;
    grid?: string;
    name?: string;
  },
): ImageNode {
  if (opts.x === 0 && opts.y === 0) {
    return makeJournalShell(parentId, assets, {
      width: opts.width,
      height: opts.height,
      field: opts.fill,
      grid: opts.grid,
      name: opts.name ?? '\u624b\u8d26\u58f3',
    });
  }
  const image = rasterPastelField(opts.width, opts.height, opts.fill, opts.grid);
  return makeImageInRect(parentId, assets, image, opts.x, opts.y, opts.width, opts.height, {
    name: opts.name ?? '\u624b\u8d26\u58f3',
    locked: true,
  });
}

export function makeSpeechBubble(
  parentId: string,
  opts: {
    x: number;
    y: number;
    width: number;
    height: number;
    fill?: string;
    stroke?: string;
  },
): SceneNode[] {
  return [
    makeShape(parentId, 'roundRect', {
      x: opts.x,
      y: opts.y,
      width: opts.width,
      height: opts.height,
      fill: opts.fill ?? '#FFFCF7',
      stroke: opts.stroke ?? '#1A1510',
      strokeWidth: 4,
      cornerRadius: 28,
      name: '\u6c14\u6ce1',
      locked: true,
    }),
    makeShape(parentId, 'triangle', {
      x: opts.x + opts.width * 0.55,
      y: opts.y + opts.height - 8,
      width: 36,
      height: 28,
      fill: opts.fill ?? '#FFFCF7',
      stroke: opts.stroke ?? '#1A1510',
      strokeWidth: 3,
      name: '\u6c14\u6ce1\u5c16',
      locked: true,
    }),
  ];
}

export async function placeCornerStickers(
  parentId: string,
  assets: AssetStore,
  frameW: number,
  frameH: number,
  ids: { tl?: string; tr?: string; bl?: string; br?: string },
): Promise<SceneNode[]> {
  const slots: StickerSlot[] = [];
  if (ids.tl) slots.push({ id: ids.tl, x: 24, y: 24, width: 96, deg: -8 });
  if (ids.tr) slots.push({ id: ids.tr, x: frameW - 120, y: 36, width: 88, deg: 10 });
  if (ids.bl) slots.push({ id: ids.bl, x: 32, y: frameH - 140, width: 100, deg: -6 });
  if (ids.br) slots.push({ id: ids.br, x: frameW - 140, y: frameH - 160, width: 120, deg: 8 });
  return scatterStickers(parentId, assets, slots);
}

export { FONT_META, FONT_SANS, FONT_YUAN, XHS_SIG_RAMP };
