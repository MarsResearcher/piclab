/**
 * Self-test for placeObjectChrome viewport clamping.
 * Run: npx tsx src/ui/studio/floatingChrome.selftest.ts
 */
import {
  CHROME_NEED,
  STAGE_RESERVE_BOTTOM,
  TYPE_BAR_RESERVE_TOP,
  placeObjectChrome,
  stackObjectChrome,
} from './floatingChrome';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

function barTop(y: number, placement: 'above' | 'below'): number {
  return placement === 'above' ? y - CHROME_NEED : y + 8;
}

function barBottom(y: number, placement: 'above' | 'below'): number {
  return placement === 'above' ? y - 8 : y + CHROME_NEED;
}

const stageW = 900;
const stageH = 700;

// Zoomed-in tall selection: both edges off-screen — must not clip at stage top.
{
  const pos = placeObjectChrome({
    bounds: { x: 0, y: 0, w: 400, h: 2000 },
    offsetX: 50,
    offsetY: -400,
    scale: 1,
    stageWidth: stageW,
    stageHeight: stageH,
    reserveTypeBar: false,
  });
  const top = barTop(pos.y, pos.placement);
  const bottom = barBottom(pos.y, pos.placement);
  assert(top >= 8 - 0.5, `zoomed tall: bar top clipped (${top}, ${pos.placement})`);
  assert(
    bottom <= stageH - STAGE_RESERVE_BOTTOM + 0.5,
    `zoomed tall: bar bottom clipped (${bottom})`,
  );
}

// Near-top selection with room below → must flip below (the screenshot bug).
{
  const pos = placeObjectChrome({
    bounds: { x: 100, y: 0, w: 200, h: 80 },
    offsetX: 40,
    offsetY: 20,
    scale: 1,
    stageWidth: stageW,
    stageHeight: stageH,
    reserveTypeBar: false,
  });
  assert(pos.placement === 'below', `near-top should be below, got ${pos.placement}`);
  assert(barTop(pos.y, pos.placement) >= 0, 'near-top: still clipped');
}

// Type bar reserved — above must clear TYPE_BAR_RESERVE_TOP.
{
  const pos = placeObjectChrome({
    bounds: { x: 100, y: 100, w: 200, h: 80 },
    offsetX: 40,
    offsetY: 40,
    scale: 1,
    stageWidth: stageW,
    stageHeight: stageH,
    reserveTypeBar: true,
  });
  if (pos.placement === 'above') {
    assert(
      barTop(pos.y, pos.placement) >= TYPE_BAR_RESERVE_TOP - 0.5,
      `type-bar: above overlaps dock (${barTop(pos.y, pos.placement)})`,
    );
  }
}

// Stacked secondary stays in stage.
{
  const base = placeObjectChrome({
    bounds: { x: 100, y: 0, w: 200, h: 80 },
    offsetX: 40,
    offsetY: 20,
    scale: 1,
    stageWidth: stageW,
    stageHeight: stageH,
    reserveTypeBar: false,
    stackExtra: 42,
  });
  const stacked = stackObjectChrome(base, stageH, false);
  const top = barTop(stacked.y, stacked.placement);
  const bottom = barBottom(stacked.y, stacked.placement);
  assert(top >= 0, `stack: top clipped (${top})`);
  assert(bottom <= stageH, `stack: bottom clipped (${bottom})`);
}

console.log('floatingChrome.selftest: ok');
