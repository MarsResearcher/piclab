/**
 * Xiaohongshu layout craft primitives — badges, tape, timeline, checklist boxes.
 */

import type { SceneNode, ShapeNode, TextNode } from '../model';
import { makeLine, makeShape } from '../scenes/helpers';
import { makeRoleText, type TypeRamp } from './templateType';
import { FONT_HEI, FONT_META } from './templatePalettes';
import { makeVeil } from './templateCraft';

export function makeAccentBar(
  parentId: string,
  opts: { x: number; y: number; width: number; height?: number; fill: string; name?: string },
): ShapeNode {
  return makeVeil(parentId, {
    x: opts.x,
    y: opts.y,
    width: opts.width,
    height: opts.height ?? 8,
    fill: opts.fill,
    name: opts.name ?? '\u5f3a\u8c03',
  });
}

/** Soft rounded pill badge (HOT / TIP / NEW). */
export function makePillBadge(
  parentId: string,
  opts: {
    x: number;
    y: number;
    width: number;
    height: number;
    fill: string;
    label: string;
    labelColor: string;
    ramp: TypeRamp;
    name?: string;
  },
): SceneNode[] {
  const pill = makeShape(parentId, 'roundRect', {
    x: opts.x,
    y: opts.y,
    width: opts.width,
    height: opts.height,
    fill: opts.fill,
    cornerRadius: Math.round(opts.height / 2),
    name: opts.name ?? '\u5f3a\u8c03',
  });
  const label = makeRoleText(
    parentId,
    'meta',
    opts.label,
    opts.x + opts.width / 2,
    opts.y + opts.height / 2,
    opts.ramp,
    {
      name: '\u5c5e\u6027',
      align: 'center',
      color: opts.labelColor,
      bold: true,
      fontFamily: FONT_META,
      fontSize: Math.round(opts.height * 0.38),
    },
  );
  return [pill, label];
}

/** Numbered circle for steps / timeline. */
export function makeNumberBadge(
  parentId: string,
  opts: {
    x: number;
    y: number;
    size: number;
    fill: string;
    ink: string;
    num: string;
    ramp: TypeRamp;
    name?: string;
  },
): SceneNode[] {
  const circle = makeShape(parentId, 'ellipse', {
    x: opts.x,
    y: opts.y,
    width: opts.size,
    height: opts.size,
    fill: opts.fill,
    name: opts.name ?? '\u5f3a\u8c03',
  });
  const t = makeRoleText(
    parentId,
    'meta',
    opts.num,
    opts.x + opts.size / 2,
    opts.y + opts.size / 2,
    opts.ramp,
    {
      name: '\u5c5e\u6027',
      align: 'center',
      color: opts.ink,
      bold: true,
      fontFamily: FONT_HEI,
      fontSize: Math.round(opts.size * 0.42),
    },
  );
  return [circle, t];
}

/** Empty checkbox square. */
export function makeCheckBox(
  parentId: string,
  opts: { x: number; y: number; size: number; stroke: string; name?: string },
): ShapeNode {
  return makeShape(parentId, 'roundRect', {
    x: opts.x,
    y: opts.y,
    width: opts.size,
    height: opts.size,
    fill: 'rgba(0,0,0,0)',
    stroke: opts.stroke,
    strokeWidth: 2.5,
    cornerRadius: 6,
    name: opts.name ?? '\u590d\u9009\u6846',
    locked: true,
  });
}

/** Washi-tape strip (rotated). */
export function makeTape(
  parentId: string,
  opts: {
    x: number;
    y: number;
    width: number;
    height: number;
    fill: string;
    deg?: number;
    name?: string;
    opacity?: number;
  },
): ShapeNode {
  const tape = makeShape(parentId, 'roundRect', {
    x: opts.x,
    y: opts.y,
    width: opts.width,
    height: opts.height,
    fill: opts.fill,
    cornerRadius: 4,
    name: opts.name ?? 'xhsSkinTape',
    opacity: opts.opacity ?? 0.75,
    locked: true,
  });
  if (opts.deg) {
    tape.transform = {
      ...tape.transform,
      rotation: (opts.deg * Math.PI) / 180,
    };
  }
  return tape;
}

/** Hairline horizontal rule. */
export function makeHairline(
  parentId: string,
  opts: { x: number; y: number; width: number; stroke: string; name?: string },
): ShapeNode {
  return makeLine(parentId, opts.x, opts.y, opts.width, 0, {
    stroke: opts.stroke,
    strokeWidth: 1.25,
    name: opts.name ?? 'xhsSkinRule',
    locked: true,
  });
}

/** Soft surface card panel. */
export function makeSurfaceCard(
  parentId: string,
  opts: {
    x: number;
    y: number;
    width: number;
    height: number;
    fill: string;
    radius?: number;
    name?: string;
  },
): ShapeNode {
  return makeShape(parentId, 'roundRect', {
    x: opts.x,
    y: opts.y,
    width: opts.width,
    height: opts.height,
    fill: opts.fill,
    cornerRadius: opts.radius ?? 20,
    name: opts.name ?? '\u5361\u7247',
    locked: true,
  });
}

/** Dashed inset frame (memo / journal). */
export function makeDashedFrame(
  parentId: string,
  opts: {
    x: number;
    y: number;
    width: number;
    height: number;
    stroke: string;
    name?: string;
  },
): ShapeNode {
  return makeShape(parentId, 'roundRect', {
    x: opts.x,
    y: opts.y,
    width: opts.width,
    height: opts.height,
    fill: 'rgba(0,0,0,0)',
    stroke: opts.stroke,
    strokeWidth: 1.75,
    cornerRadius: 12,
    dash: [10, 8],
    name: opts.name ?? 'xhsSkinDash',
    locked: true,
    opacity: 0.45,
  });
}

export function centerX(node: TextNode, canvasW: number): void {
  node.transform = { ...node.transform, x: canvasW / 2 };
}
