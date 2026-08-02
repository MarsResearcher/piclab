/**
 * Small craft helpers — use when a brief needs them, never as a forced skeleton.
 */

import {
  createId,
  identityTransform,
  type InkNode,
  type ShapeNode,
  type TextNode,
} from '../model';
import { makeLine, makeShape } from '../scenes/helpers';

/** Narrow a display text horizontally (condensed look via transform). */
export function condenseText(node: TextNode, scaleX = 0.72): TextNode {
  return {
    ...node,
    transform: {
      ...node.transform,
      scaleX,
    },
  };
}

/** Rotate text around its position (degrees). */
export function rotateText(node: TextNode, deg: number): TextNode {
  return {
    ...node,
    transform: {
      ...node.transform,
      rotation: (deg * Math.PI) / 180,
    },
  };
}

/** Soft sine / freehand accent stroke as InkNode. */
export function makeAccentStroke(
  parentId: string,
  opts: {
    x: number;
    y: number;
    width: number;
    amplitude?: number;
    waves?: number;
    stroke?: string;
    strokeWidth?: number;
    name?: string;
    samples?: number;
  },
): InkNode {
  const amp = opts.amplitude ?? 28;
  const waves = opts.waves ?? 1.6;
  const n = opts.samples ?? 48;
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = t * opts.width;
    const y = Math.sin(t * Math.PI * 2 * waves) * amp * (0.55 + 0.45 * Math.sin(t * Math.PI));
    points.push({ x, y });
  }
  return {
    id: createId('ink'),
    name: opts.name ?? '强调线',
    type: 'ink',
    visible: true,
    locked: false,
    opacity: 1,
    parentId,
    transform: identityTransform(opts.x, opts.y),
    points,
    stroke: opts.stroke ?? '#F5D400',
    strokeWidth: opts.strokeWidth ?? 3,
    brush: 'pen',
  };
}

/** Full-bleed or regional reading veil (locked shape). */
export function makeVeil(
  parentId: string,
  opts: {
    x: number;
    y: number;
    width: number;
    height: number;
    fill: string;
    name?: string;
    opacity?: number;
  },
): ShapeNode {
  return makeShape(parentId, 'rect', {
    x: opts.x,
    y: opts.y,
    width: opts.width,
    height: opts.height,
    fill: opts.fill,
    name: opts.name ?? '阅读罩',
    opacity: opts.opacity,
    locked: true,
  });
}

/** Horizontal ruled lines for memo / notebook feel. */
export function makeRuledLines(
  parentId: string,
  opts: {
    x: number;
    y0: number;
    width: number;
    count: number;
    gap: number;
    stroke?: string;
    strokeWidth?: number;
  },
): ShapeNode[] {
  const stroke = opts.stroke ?? 'rgba(42,36,28,0.14)';
  const sw = opts.strokeWidth ?? 1.5;
  const out: ShapeNode[] = [];
  for (let i = 0; i < opts.count; i++) {
    out.push(
      makeLine(parentId, opts.x, opts.y0 + i * opts.gap, opts.width, 0, {
        stroke,
        strokeWidth: sw,
        name: `横线${i + 1}`,
        locked: true,
      }),
    );
  }
  return out;
}
