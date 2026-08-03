/**
 * Xiaohongshu atmosphere chrome — notebook shells, sketch frames, window UI.
 * Stickers via scatterStickers / placeSticker (see stickerAssets).
 */

import type { AssetStore } from '../store/assetStore';
import type { SceneNode, ShapeNode } from '../model';
import { makeLine, makeShape } from '../scenes/helpers';
import { makeAccentStroke, makeVeil } from './templateCraft';
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

/** Soft pastel field with optional diagonal grid hint. */
export function makePastelField(
  parentId: string,
  opts: {
    x: number;
    y: number;
    width: number;
    height: number;
    fill: string;
    grid?: string;
  },
): SceneNode[] {
  const nodes: SceneNode[] = [
    makeVeil(parentId, {
      x: opts.x,
      y: opts.y,
      width: opts.width,
      height: opts.height,
      fill: opts.fill,
      name: '\u5e95\u573a',
    }),
  ];
  if (opts.grid) {
    const step = 48;
    for (let x = opts.x; x < opts.x + opts.width; x += step) {
      nodes.push(
        makeLine(parentId, x, opts.y, 0, opts.height, {
          stroke: opts.grid,
          strokeWidth: 1,
          name: '\u7f51\u683c\u7eb5',
          locked: true,
        }),
      );
    }
    for (let y = opts.y; y < opts.y + opts.height; y += step) {
      nodes.push(
        makeLine(parentId, opts.x, y, opts.width, 0, {
          stroke: opts.grid,
          strokeWidth: 1,
          name: '\u7f51\u683c\u6a2a',
          locked: true,
        }),
      );
    }
  }
  return nodes;
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
