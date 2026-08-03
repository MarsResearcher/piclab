import type { SceneCreateOptions, ScenePlugin } from '../plugins/types';
import type { ShapeNode, StudioDocument } from '../model';
import { addPageWithFrame, emptyDoc, makeFrame, makeGroup, makeLine } from './helpers';

/** A4 portrait @ 96 dpi (794×1123 px) — matches CSS/screen print preview at ~96dpi. */
export const A4_W = 794;
export const A4_H = 1123;

const MM_TO_PX = 96 / 25.4;
const GRID_STROKE = '#cc4444';
const GRID_STROKE_W = 1;
const PAGE_FILL = '#ffffff';

function mmToPx(mm: number): number {
  return Math.round(mm * MM_TO_PX);
}

function clampInt(value: number | undefined, fallback: number, min: number, max: number): number {
  const n = Math.round(value ?? fallback);
  return Math.min(max, Math.max(min, n));
}

function gridRect(
  marginMm: number,
): { left: number; top: number; width: number; height: number } {
  const m = mmToPx(marginMm);
  return {
    left: m,
    top: m,
    width: A4_W - m * 2,
    height: A4_H - m * 2,
  };
}

function addLinesToDoc(
  doc: StudioDocument,
  frameId: string,
  lines: ShapeNode[],
): string {
  const group = makeGroup(frameId, [], { name: '\u683c\u7ebf', locked: true });
  const ids = lines.map((line) => {
    const node = { ...line, parentId: group.id };
    doc.nodes[node.id] = node;
    return node.id;
  });
  group.children = ids;
  doc.nodes[group.id] = group;
  return group.id;
}

/** \u7530\u5b57\u683c — square cells with cross dividers. */
function buildTianzigeLines(
  frameId: string,
  rows: number,
  cols: number,
  marginMm: number,
): ShapeNode[] {
  const { left, top, width, height } = gridRect(marginMm);
  const cellW = width / cols;
  const cellH = height / rows;
  const lines: ShapeNode[] = [];
  let i = 0;

  const pushH = (y: number, x1: number, x2: number) => {
    const n = i++;
    lines.push(
      makeLine(frameId, x1, y, x2 - x1, 0, {
        stroke: GRID_STROKE,
        strokeWidth: GRID_STROKE_W,
        name: `h${n}`,
        locked: true,
      }),
    );
  };
  const pushV = (x: number, y1: number, y2: number) => {
    const n = i++;
    lines.push(
      makeLine(frameId, x, y1, 0, y2 - y1, {
        stroke: GRID_STROKE,
        strokeWidth: GRID_STROKE_W,
        name: `v${n}`,
        locked: true,
      }),
    );
  };

  for (let c = 0; c <= cols; c++) {
    const x = left + c * cellW;
    pushV(x, top, top + height);
  }
  for (let r = 0; r <= rows; r++) {
    const y = top + r * cellH;
    pushH(y, left, left + width);
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x0 = left + c * cellW;
      const y0 = top + r * cellH;
      pushH(y0 + cellH / 2, x0, x0 + cellW);
      pushV(x0 + cellW / 2, y0, y0 + cellH);
    }
  }

  return lines;
}

/** \u56db\u7ebf\u4e09\u683c — four parallel lines per band (pinyin). */
function buildPinyinLines(
  frameId: string,
  bands: number,
  marginMm: number,
): ShapeNode[] {
  const { left, top, width, height } = gridRect(marginMm);
  const bandH = height / bands;
  const lines: ShapeNode[] = [];
  let i = 0;

  /** Typical 四线三格 proportions within each band. */
  const offsets = [0, 0.22, 0.58, 1];

  for (let b = 0; b < bands; b++) {
    const y0 = top + b * bandH;
    for (const t of offsets) {
      const y = y0 + bandH * t;
      lines.push(
        makeLine(frameId, left, y, width, 0, {
          stroke: GRID_STROKE,
          strokeWidth: GRID_STROKE_W,
          name: `p${i++}`,
          locked: true,
        }),
      );
    }
  }

  return lines;
}

/** \u7ad6\u683c — vertical columns for calligraphy. */
function buildShugeLines(
  frameId: string,
  cols: number,
  marginMm: number,
): ShapeNode[] {
  const { left, top, width, height } = gridRect(marginMm);
  const lines: ShapeNode[] = [];
  let i = 0;

  for (let c = 0; c <= cols; c++) {
    const x = left + (width / cols) * c;
    lines.push(
      makeLine(frameId, x, top, 0, height, {
        stroke: GRID_STROKE,
        strokeWidth: GRID_STROKE_W,
        name: `v${i++}`,
        locked: true,
      }),
    );
  }

  return lines;
}

/** \u7c73\u5b57\u683c — tianzige plus diagonals in each cell. */
function buildMiziLines(
  frameId: string,
  rows: number,
  cols: number,
  marginMm: number,
): ShapeNode[] {
  const base = buildTianzigeLines(frameId, rows, cols, marginMm);
  const { left, top, width, height } = gridRect(marginMm);
  const cellW = width / cols;
  const cellH = height / rows;
  let i = base.length;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x0 = left + c * cellW;
      const y0 = top + r * cellH;
      base.push(
        makeLine(frameId, x0, y0, cellW, cellH, {
          stroke: GRID_STROKE,
          strokeWidth: GRID_STROKE_W,
          name: `d${i++}`,
          locked: true,
        }),
      );
      base.push(
        makeLine(frameId, x0 + cellW, y0, -cellW, cellH, {
          stroke: GRID_STROKE,
          strokeWidth: GRID_STROKE_W,
          name: `d${i++}`,
          locked: true,
        }),
      );
    }
  }

  return base;
}

function populateGridPage(
  doc: StudioDocument,
  frameId: string,
  build: (frameId: string) => ShapeNode[],
): void {
  const frame = doc.nodes[frameId];
  if (!frame || frame.type !== 'frame') throw new Error('expected frame');
  const groupId = addLinesToDoc(doc, frameId, build(frameId));
  doc.nodes[frameId] = { ...frame, children: [groupId] };
}

function createGridDocument(
  sceneId: 'tianzige' | 'pinyin' | 'calligraphy',
  docName: string,
  pageCount: number,
  buildPage: (frameId: string) => ShapeNode[],
): StudioDocument {
  const { doc, frameId, pageId } = emptyDoc(docName, sceneId);
  const frame = makeFrame(frameId, A4_W, A4_H, docName, PAGE_FILL);
  doc.nodes[frameId] = frame;
  populateGridPage(doc, frameId, buildPage);

  for (let p = 2; p <= pageCount; p++) {
    const { frameId: nextFrameId } = addPageWithFrame(doc, {
      name: `\u9875\u9762 ${p}`,
      width: A4_W,
      height: A4_H,
      fill: PAGE_FILL,
      activate: false,
    });
    populateGridPage(doc, nextFrameId, buildPage);
  }

  doc.activePageId = pageId;
  doc.selection = [];
  return doc;
}

const A4_EXPORT = [{ width: A4_W, height: A4_H, name: 'A4' }] as const;

export const tianzigeScene: ScenePlugin = {
  id: 'tianzige',
  label: '\u7530\u5b57\u683c',
  description: 'A4 \u7530\u5b57\u683c\u7ec3\u4e60\u7eb8\uff0c\u53ef\u8c03\u884c\u5217\u4e0e\u9875\u6570',
  tools: ['select', 'text', 'shape', 'export'],
  exportHints: [...A4_EXPORT],
  createDocument: (opts?: SceneCreateOptions) => {
    const rows = clampInt(opts?.rows, 10, 2, 24);
    const cols = clampInt(opts?.cols, 8, 2, 16);
    const pageCount = clampInt(opts?.pageCount, 1, 1, 50);
    const marginMm = opts?.marginMm ?? 15;
    return createGridDocument(
      'tianzige',
      '\u7530\u5b57\u683c',
      pageCount,
      (frameId) => buildTianzigeLines(frameId, rows, cols, marginMm),
    );
  },
};

export const pinyinScene: ScenePlugin = {
  id: 'pinyin',
  label: '\u62fc\u97f3\u683c',
  description: 'A4 \u56db\u7ebf\u4e09\u683c\uff08\u62fc\u97f3\uff09\u7ec3\u4e60\u7eb8',
  tools: ['select', 'text', 'shape', 'export'],
  exportHints: [...A4_EXPORT],
  createDocument: (opts?: SceneCreateOptions) => {
    const bands = clampInt(opts?.rows, 12, 3, 30);
    const pageCount = clampInt(opts?.pageCount, 1, 1, 50);
    const marginMm = opts?.marginMm ?? 15;
    return createGridDocument(
      'pinyin',
      '\u62fc\u97f3\u683c',
      pageCount,
      (frameId) => buildPinyinLines(frameId, bands, marginMm),
    );
  },
};

export const calligraphyScene: ScenePlugin = {
  id: 'calligraphy',
  label: '\u4e66\u6cd5\u683c',
  description: 'A4 \u7ad6\u683c / \u7c73\u5b57\u683c\u7ec3\u4e60\u7eb8',
  tools: ['select', 'text', 'shape', 'export'],
  exportHints: [...A4_EXPORT],
  createDocument: (opts?: SceneCreateOptions) => {
    const style = opts?.gridStyle ?? 'mizi';
    const pageCount = clampInt(opts?.pageCount, 1, 1, 50);
    const marginMm = opts?.marginMm ?? 15;

    if (style === 'shuge') {
      const cols = clampInt(opts?.cols, 8, 2, 20);
      return createGridDocument(
        'calligraphy',
        '\u7ad6\u683c',
        pageCount,
        (frameId) => buildShugeLines(frameId, cols, marginMm),
      );
    }

    const rows = clampInt(opts?.rows, 10, 2, 24);
    const cols = clampInt(opts?.cols, 8, 2, 16);
    return createGridDocument(
      'calligraphy',
      '\u7c73\u5b57\u683c',
      pageCount,
      (frameId) => buildMiziLines(frameId, rows, cols, marginMm),
    );
  },
};
