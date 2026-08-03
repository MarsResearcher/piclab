/**
 * Pure-function regressions for transform pivots (center rotate / flip / local resize).
 * Invoked from smoke — no DOM required.
 */
import { identityTransform, type ShapeNode } from '../model';
import { applyBoxResizeLocal } from './resize';
import { flipNodeTransform } from './selection';
import {
  getNodeCenter,
  localToParent,
  transformAfterPivotRotate,
} from './transformMath';

export type InvariantResult = { name: string; ok: boolean; detail?: string };

function approx(a: number, b: number, eps = 1e-6): boolean {
  return Math.abs(a - b) <= eps;
}

function sampleRect(overrides?: Partial<ShapeNode>): ShapeNode {
  return {
    id: 'shape_test',
    name: 'Rect',
    type: 'shape',
    shape: 'rect',
    visible: true,
    locked: false,
    opacity: 1,
    parentId: null,
    transform: identityTransform(100, 50),
    width: 80,
    height: 60,
    fill: '#3d4450',
    stroke: '#333',
    strokeWidth: 1,
    ...overrides,
  };
}

export function runTransformInvariantChecks(): InvariantResult[] {
  const results: InvariantResult[] = [];

  // Center-fixed rotation
  {
    const node = sampleRect();
    const localCenter = { x: node.width / 2, y: node.height / 2 };
    const world0 = localToParent(node.transform, localCenter.x, localCenter.y);
    const next = transformAfterPivotRotate({
      pivot: world0,
      localCenter,
      orig: node.transform,
      origWorldCenter: world0,
      deltaDeg: 90,
    });
    const world1 = localToParent(next, localCenter.x, localCenter.y);
    const drift = Math.hypot(world1.x - world0.x, world1.y - world0.y);
    results.push({
      name: 'rotate-center-fixed',
      ok: drift < 1e-6 && approx(next.rotation, 90),
      detail: `drift=${drift.toFixed(8)} rot=${next.rotation}`,
    });
  }

  // Horizontal flip keeps world center
  {
    const node = sampleRect({
      transform: { ...identityTransform(120, 80), rotation: 25 },
    });
    const before = getNodeCenter(null, node);
    const patch = flipNodeTransform(node, 'h', null);
    const flipped = { ...node, transform: patch.transform! };
    const after = getNodeCenter(null, flipped);
    const drift = Math.hypot(after.x - before.x, after.y - before.y);
    results.push({
      name: 'flip-h-center-fixed',
      ok: drift < 1e-6 && flipped.transform.scaleX === -1,
      detail: `drift=${drift.toFixed(8)} scaleX=${flipped.transform.scaleX}`,
    });
  }

  // Vertical flip keeps world center
  {
    const node = sampleRect();
    const before = getNodeCenter(null, node);
    const patch = flipNodeTransform(node, 'v', null);
    const flipped = { ...node, transform: patch.transform! };
    const after = getNodeCenter(null, flipped);
    const drift = Math.hypot(after.x - before.x, after.y - before.y);
    results.push({
      name: 'flip-v-center-fixed',
      ok: drift < 1e-6 && flipped.transform.scaleY === -1,
      detail: `drift=${drift.toFixed(8)} scaleY=${flipped.transform.scaleY}`,
    });
  }

  // Local resize under rotation: opposite corner stays fixed in frame space
  {
    const node = sampleRect({
      transform: { ...identityTransform(40, 30), rotation: 0 },
      width: 100,
      height: 50,
    });
    const result = applyBoxResizeLocal({
      handle: 'se',
      origTransform: node.transform,
      origW: node.width,
      origH: node.height,
      cursorFrameX: 40 + 140,
      cursorFrameY: 30 + 80,
      lockAspect: false,
    });
    results.push({
      name: 'resize-local-se',
      ok:
        approx(result.x, 40) &&
        approx(result.y, 30) &&
        approx(result.width, 140) &&
        approx(result.height, 80),
      detail: `xy=${result.x},${result.y} wh=${result.width}x${result.height}`,
    });
  }

  return results;
}
