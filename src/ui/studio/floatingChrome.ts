/**
 * Stage-local placement for object-adjacent chrome.
 *
 * The stage uses overflow:hidden, so chrome MUST stay inside the visible
 * stage rect. When the selection is taller/wider than the viewport (zoom),
 * we place relative to the VISIBLE slice of the selection — never relative
 * to off-screen edges (that was the recurring clip bug).
 */

export type ChromePlacement = 'above' | 'below';

export type FloatingChromePos = {
  x: number;
  y: number;
  placement: ChromePlacement;
};

/** Bar height (32px icons + padding) — keep in sync with .studio-selection-toolbar */
export const CHROME_BAR_H = 40;
/** Gap between selection edge and bar (matches CSS translate offsets). */
export const CHROME_GAP = 8;
/** Space required on the chosen side of the anchor. */
export const CHROME_NEED = CHROME_BAR_H + CHROME_GAP;

/** TypeContextBar dock: top 10px + bar ~40px + breathing room. */
export const TYPE_BAR_RESERVE_TOP = 58;
/** Page strip + zoom chrome near the bottom of the stage. */
export const STAGE_RESERVE_BOTTOM = 56;

type Bounds = { x: number; y: number; w: number; h: number };

type Opts = {
  bounds: Bounds;
  offsetX: number;
  offsetY: number;
  scale: number;
  stageWidth: number;
  stageHeight: number;
  /** When true, keep clear of the top type-bar dock. */
  reserveTypeBar: boolean;
  sidePad?: number;
  /**
   * Extra vertical budget (e.g. stacked image context bar) so the primary
   * placement leaves room for a second pill on the same side.
   */
  stackExtra?: number;
};

function clamp(n: number, lo: number, hi: number): number {
  if (hi < lo) return lo;
  return Math.min(hi, Math.max(lo, n));
}

export function placeObjectChrome(opts: Opts): FloatingChromePos {
  const {
    bounds: b,
    offsetX,
    offsetY,
    scale,
    stageWidth,
    stageHeight,
    reserveTypeBar,
    sidePad = 120,
    stackExtra = 0,
  } = opts;

  const need = CHROME_NEED + Math.max(0, stackExtra);
  const reserveTop = reserveTypeBar ? TYPE_BAR_RESERVE_TOP : 8;
  const reserveBottom = STAGE_RESERVE_BOTTOM;

  const selTop = offsetY + b.y * scale;
  const selBottom = offsetY + (b.y + b.h) * scale;
  const midX = offsetX + (b.x + b.w / 2) * scale;

  // Visible slice — critical when zoomed so selection extends past the stage.
  const visTop = clamp(selTop, 0, stageHeight);
  const visBottom = clamp(selBottom, 0, stageHeight);

  const spaceAbove = visTop - reserveTop;
  const spaceBelow = stageHeight - reserveBottom - visBottom;

  const canAbove = spaceAbove >= need;
  const canBelow = spaceBelow >= need;

  let placement: ChromePlacement;
  if (canAbove && canBelow) {
    placement = spaceAbove >= spaceBelow ? 'above' : 'below';
  } else if (canAbove) {
    placement = 'above';
  } else if (canBelow) {
    placement = 'below';
  } else {
    // Neither side has a full clear band (tight zoom). Prefer the roomier
    // side, then hard-clamp the anchor so the bar stays inside the stage.
    placement = spaceAbove >= spaceBelow ? 'above' : 'below';
  }

  // Anchor Y: CSS `is-above` translates by (-100% - gap); `is-below` by (+gap).
  let y =
    placement === 'above'
      ? clamp(visTop, reserveTop + need, stageHeight - 4)
      : clamp(visBottom, 4, stageHeight - reserveBottom - need);

  // If the chosen side still can't host the bar, flip and clamp into the band.
  if (placement === 'above' && y - need < reserveTop - 0.5) {
    placement = 'below';
    y = clamp(Math.max(visBottom, reserveTop), reserveTop, stageHeight - reserveBottom - need);
  } else if (placement === 'below' && y + need > stageHeight - reserveBottom + 0.5) {
    placement = 'above';
    y = clamp(Math.min(visTop, stageHeight - reserveBottom), reserveTop + need, stageHeight - 4);
  }

  if (placement === 'above') {
    y = clamp(y, reserveTop + need, stageHeight - 4);
  } else {
    y = clamp(y, 4, Math.max(4, stageHeight - reserveBottom - need));
  }

  const xMin = Math.min(sidePad, stageWidth / 2);
  const xMax = Math.max(stageWidth - sidePad, stageWidth / 2);
  const x = clamp(midX, xMin, xMax);

  return { x, y, placement };
}

/** Offset a second chrome pill on the same side without leaving the stage. */
export function stackObjectChrome(
  base: FloatingChromePos,
  stageHeight: number,
  reserveTypeBar: boolean,
  gap = 42,
): FloatingChromePos {
  const reserveTop = reserveTypeBar ? TYPE_BAR_RESERVE_TOP : 8;
  const reserveBottom = STAGE_RESERVE_BOTTOM;

  if (base.placement === 'above') {
    const stacked = base.y - gap;
    if (stacked - CHROME_NEED >= reserveTop) {
      return { x: base.x, y: stacked, placement: 'above' };
    }
    // No room to stack further up — park under the primary pill instead.
    return {
      x: base.x,
      y: clamp(base.y + gap, 4, stageHeight - reserveBottom - CHROME_NEED),
      placement: 'below',
    };
  }

  const stacked = base.y + gap;
  if (stacked + CHROME_NEED <= stageHeight - reserveBottom) {
    return { x: base.x, y: stacked, placement: 'below' };
  }
  return {
    x: base.x,
    y: clamp(base.y - gap, reserveTop + CHROME_NEED, stageHeight - 4),
    placement: 'above',
  };
}
