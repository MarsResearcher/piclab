/**
 * Small craft helpers — use when a brief needs them, never as a forced skeleton.
 */

import {
  createId,
  identityTransform,
  isGroup,
  type InkNode,
  type SceneNode,
  type ShapeNode,
  type StudioDocument,
  type TextNode,
} from '../model';
import { makeGroup, makeLine, makeShape } from '../scenes/helpers';

/** Direct children of a parent among a flat node list (for group trees). */
export function rootIdsOf(nodes: SceneNode[], parentId: string): string[] {
  return nodes.filter((n) => n.parentId === parentId).map((n) => n.id);
}

/** Delete a node and nested group children from `doc.nodes`. */
export function purgeNodeTree(doc: StudioDocument, id: string): void {
  const node = doc.nodes[id];
  if (!node) return;
  if (isGroup(node)) {
    for (const childId of node.children) purgeNodeTree(doc, childId);
  }
  delete doc.nodes[id];
}

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

/** Rotate text around its position (degrees). Rotation is stored in degrees. */
export function rotateText(node: TextNode, deg: number): TextNode {
  return {
    ...node,
    transform: {
      ...node.transform,
      rotation: deg,
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

/**
 * Horizontal ruled lines as one locked「横线纸纹」group.
 * Returns [group, ...lines] — attach only roots via `rootIdsOf`.
 */
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
    name?: string;
    opacity?: number;
  },
): SceneNode[] {
  const stroke = opts.stroke ?? 'rgba(42,36,28,0.14)';
  const sw = opts.strokeWidth ?? 1.5;
  const group = makeGroup(parentId, [], {
    name: opts.name ?? '\u6a2a\u7ebf\u7eb8\u7eb9',
    locked: true,
    opacity: opts.opacity,
  });
  const lines: ShapeNode[] = [];
  for (let i = 0; i < opts.count; i++) {
    lines.push(
      makeLine(group.id, opts.x, opts.y0 + i * opts.gap, opts.width, 0, {
        stroke,
        strokeWidth: sw,
        name: `\u6a2a\u7ebf${i + 1}`,
        locked: true,
      }),
    );
  }
  group.children = lines.map((n) => n.id);
  return [group, ...lines];
}
