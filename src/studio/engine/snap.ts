import type { AABB } from './bounds';

export type GuideLine = {
  orientation: 'v' | 'h';
  /** Frame-space position (x for vertical, y for horizontal). */
  pos: number;
};

export type SnapResult = {
  x: number;
  y: number;
  guides: GuideLine[];
};

const DEFAULT_THRESHOLD = 6;

type Edge = { kind: 'start' | 'center' | 'end'; value: number };

function edgesX(b: AABB): Edge[] {
  return [
    { kind: 'start', value: b.x },
    { kind: 'center', value: b.x + b.w / 2 },
    { kind: 'end', value: b.x + b.w },
  ];
}

function edgesY(b: AABB): Edge[] {
  return [
    { kind: 'start', value: b.y },
    { kind: 'center', value: b.y + b.h / 2 },
    { kind: 'end', value: b.y + b.h },
  ];
}

/**
 * Snap moving AABB (by translating x,y of its top-left intent) to targets.
 * `proposed` is the moving node's bounds at the proposed position.
 */
export function snapBounds(
  proposed: AABB,
  targets: AABB[],
  threshold = DEFAULT_THRESHOLD,
): SnapResult {
  let dx = 0;
  let dy = 0;
  let bestX = threshold + 1;
  let bestY = threshold + 1;
  const guides: GuideLine[] = [];

  const moveX = edgesX(proposed);
  const moveY = edgesY(proposed);

  for (const t of targets) {
    for (const me of moveX) {
      for (const te of edgesX(t)) {
        const dist = Math.abs(me.value - te.value);
        if (dist <= threshold && dist < bestX) {
          bestX = dist;
          dx = te.value - me.value;
        }
      }
    }
    for (const me of moveY) {
      for (const te of edgesY(t)) {
        const dist = Math.abs(me.value - te.value);
        if (dist <= threshold && dist < bestY) {
          bestY = dist;
          dy = te.value - me.value;
        }
      }
    }
  }

  const snapped: AABB = {
    x: proposed.x + (bestX <= threshold ? dx : 0),
    y: proposed.y + (bestY <= threshold ? dy : 0),
    w: proposed.w,
    h: proposed.h,
  };

  if (bestX <= threshold) {
    for (const me of edgesX(snapped)) {
      for (const t of targets) {
        for (const te of edgesX(t)) {
          if (Math.abs(me.value - te.value) < 0.5) {
            guides.push({ orientation: 'v', pos: te.value });
          }
        }
      }
    }
  }
  if (bestY <= threshold) {
    for (const me of edgesY(snapped)) {
      for (const t of targets) {
        for (const te of edgesY(t)) {
          if (Math.abs(me.value - te.value) < 0.5) {
            guides.push({ orientation: 'h', pos: te.value });
          }
        }
      }
    }
  }

  // Dedupe guides
  const seen = new Set<string>();
  const unique = guides.filter((g) => {
    const k = `${g.orientation}:${Math.round(g.pos)}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  return {
    x: snapped.x,
    y: snapped.y,
    guides: unique,
  };
}
