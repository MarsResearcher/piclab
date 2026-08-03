import type { TextNode } from '../model';

export type TextBounds = {
  /** Width of glyph box (includes stroke padding). */
  w: number;
  /** Height of glyph box (includes stroke padding). */
  h: number;
  /** Left offset relative to text anchor (align). */
  ox: number;
  /** Top offset relative to baseline middle. */
  oy: number;
};

let measureCtx: CanvasRenderingContext2D | null = null;

function ctx(): CanvasRenderingContext2D {
  if (!measureCtx) {
    const c = document.createElement('canvas');
    measureCtx = c.getContext('2d')!;
  }
  return measureCtx;
}

function fontString(node: TextNode): string {
  const weight = node.bold ? '700' : '400';
  return `${weight} ${node.fontSize}px ${node.fontFamily}`;
}

/** Split into columns (lines); each column is an array of grapheme-ish units. */
export function textColumns(content: string): string[][] {
  const lines = content.length > 0 ? content.split('\n') : [' '];
  return lines.map((line) => {
    const chars = Array.from(line);
    return chars.length > 0 ? chars : [' '];
  });
}

export function isVerticalText(node: TextNode): boolean {
  return node.writingMode === 'vertical';
}

/** Column pitch for upright vertical layout. */
export function verticalColumnGap(fontSize: number): number {
  return fontSize * 1.05;
}

/**
 * Measure text bounds consistent with renderer (baseline middle + align).
 * Supports multiline content separated by `\n`.
 * Vertical: upright columns, `\n` → new column, columns right→left.
 */
export function measureTextBounds(node: TextNode): TextBounds {
  if (isVerticalText(node)) {
    return measureVerticalBounds(node);
  }
  return measureHorizontalBounds(node);
}

function measureHorizontalBounds(node: TextNode): TextBounds {
  const c = ctx();
  c.font = fontString(node);
  c.textBaseline = 'middle';
  c.textAlign = node.align;
  const lines = (node.content.length > 0 ? node.content : ' ').split('\n');
  const lh = (node.lineHeight ?? 1.25) * node.fontSize;
  const strokePad = Math.max(0, node.strokeWidth) * 0.5 + 2;

  let maxW = 12;
  let maxAscent = node.fontSize * 0.55;
  let maxDescent = node.fontSize * 0.45;
  let left = 0;

  for (const line of lines) {
    const metrics = c.measureText(line.length > 0 ? line : ' ');
    const ascent =
      metrics.actualBoundingBoxAscent > 0
        ? metrics.actualBoundingBoxAscent
        : node.fontSize * 0.55;
    const descent =
      metrics.actualBoundingBoxDescent > 0
        ? metrics.actualBoundingBoxDescent
        : node.fontSize * 0.45;
    const l = metrics.actualBoundingBoxLeft ?? 0;
    const r = metrics.actualBoundingBoxRight ?? metrics.width;
    maxW = Math.max(maxW, metrics.width, r - l);
    maxAscent = Math.max(maxAscent, ascent);
    maxDescent = Math.max(maxDescent, descent);
    left = Math.min(left, -l);
  }

  const blockH = Math.max(lh * lines.length, maxAscent + maxDescent);
  const w = maxW + strokePad * 2;
  const h = blockH + strokePad * 2;
  const ox = left - strokePad;
  const oy = -blockH / 2 - strokePad;

  return { w, h, ox, oy };
}

function measureVerticalBounds(node: TextNode): TextBounds {
  const cols = textColumns(node.content);
  const lh = (node.lineHeight ?? 1.25) * node.fontSize;
  const colGap = verticalColumnGap(node.fontSize);
  const strokePad = Math.max(0, node.strokeWidth) * 0.5 + 2;

  let maxChars = 1;
  for (const col of cols) maxChars = Math.max(maxChars, col.length);

  const blockH = Math.max(lh * maxChars, node.fontSize);
  const blockW = Math.max(colGap * cols.length, node.fontSize);

  const w = blockW + strokePad * 2;
  const h = blockH + strokePad * 2;
  return {
    w,
    h,
    ox: -blockW / 2 - strokePad,
    oy: -blockH / 2 - strokePad,
  };
}

/** Legacy-compatible center-style box for simple contains checks. */
export function textHitBox(node: TextNode): { w: number; h: number; ox: number; oy: number } {
  return measureTextBounds(node);
}
