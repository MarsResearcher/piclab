/**
 * Xiaohongshu composition kit — visible design parts for signature materials.
 * Names stay stable so users can swap images / edit titles.
 */

import type { AssetStore } from '../store/assetStore';
import type { ImageNode, SceneNode, ShapeNode, TextNode } from '../model';
import { makeLine, makeShape } from '../scenes/helpers';
import { makeImageInRect } from './templateAssets';
import { makeAccentStroke, makeVeil } from './templateCraft';
import { makePillBadge, makeTape, makeSurfaceCard, makeCheckBox } from './xhsCraft';
import { makeRoleText, RAMP_XHS, type TypeRamp } from './templateType';
import {
  FONT_HEI,
  FONT_KAI,
  FONT_LATIN_DISPLAY,
  FONT_LATIN_SERIF,
  FONT_META,
  FONT_SANS,
  FONT_XING,
} from './templatePalettes';

export const XHS_SIG_W = 1080;
export const XHS_SIG_H = 1440;

export const XHS_SIG_RAMP: TypeRamp = { ...RAMP_XHS };

/** Polaroid-style framed photo slot. */
export function makePolaroid(
  parentId: string,
  assets: AssetStore,
  image: ImageData,
  opts: {
    x: number;
    y: number;
    width: number;
    height: number;
    pad?: number;
    footer?: number;
    deg?: number;
    slotName?: string;
    frameName?: string;
  },
): SceneNode[] {
  const pad = opts.pad ?? 14;
  const footer = opts.footer ?? 48;
  const frame = makeShape(parentId, 'rect', {
    x: opts.x,
    y: opts.y,
    width: opts.width,
    height: opts.height,
    fill: '#FFFCF7',
    name: opts.frameName ?? '\u76f8\u6846',
    locked: true,
  });
  if (opts.deg) {
    frame.transform = {
      ...frame.transform,
      rotation: (opts.deg * Math.PI) / 180,
    };
  }
  const img = makeImageInRect(
    parentId,
    assets,
    image,
    opts.x + pad,
    opts.y + pad,
    opts.width - pad * 2,
    opts.height - pad * 2 - footer,
    { name: opts.slotName ?? '\u69fd\u4f4d1', locked: true },
  );
  if (opts.deg) {
    img.transform = {
      ...img.transform,
      rotation: (opts.deg * Math.PI) / 180,
    };
  }
  return [frame, img];
}

export function makeTapeStrip(
  parentId: string,
  opts: {
    x: number;
    y: number;
    width: number;
    height?: number;
    fill: string;
    deg?: number;
    name?: string;
  },
): ShapeNode {
  return makeTape(parentId, {
    x: opts.x,
    y: opts.y,
    width: opts.width,
    height: opts.height ?? 36,
    fill: opts.fill,
    deg: opts.deg,
    name: opts.name ?? 'xhsSkinTape',
    opacity: 0.72,
  });
}

/** Horizontal torn-paper band (jagged via triangles + bar). */
export function makeTornBand(
  parentId: string,
  opts: {
    x: number;
    y: number;
    width: number;
    height: number;
    fill: string;
    name?: string;
  },
): SceneNode[] {
  const nodes: SceneNode[] = [
    makeVeil(parentId, {
      x: opts.x,
      y: opts.y,
      width: opts.width,
      height: opts.height,
      fill: opts.fill,
      name: opts.name ?? '\u6495\u7eb8\u5e26',
    }),
  ];
  const teeth = 14;
  const tw = opts.width / teeth;
  for (let i = 0; i < teeth; i++) {
    nodes.push(
      makeShape(parentId, 'triangle', {
        x: opts.x + i * tw,
        y: opts.y - 10,
        width: tw,
        height: 14,
        fill: opts.fill,
        name: `${opts.name ?? '\u6495\u7eb8'}\u9f7f${i}`,
        locked: true,
      }),
      makeShape(parentId, 'triangle', {
        x: opts.x + i * tw,
        y: opts.y + opts.height - 4,
        width: tw,
        height: 14,
        fill: opts.fill,
        name: `${opts.name ?? '\u6495\u7eb8'}\u9f7fB${i}`,
        locked: true,
      }),
    );
  }
  return nodes;
}

export function makeGlassPanel(
  parentId: string,
  opts: {
    x: number;
    y: number;
    width: number;
    height: number;
    fill?: string;
    radius?: number;
    name?: string;
  },
): ShapeNode {
  return makeShape(parentId, 'roundRect', {
    x: opts.x,
    y: opts.y,
    width: opts.width,
    height: opts.height,
    fill: opts.fill ?? 'rgba(255,252,247,0.78)',
    cornerRadius: opts.radius ?? 20,
    name: opts.name ?? '\u73bb\u7483\u6e1a',
    locked: true,
  });
}

export function makePhotoGrid(
  parentId: string,
  assets: AssetStore,
  images: ImageData[],
  opts: {
    x: number;
    y: number;
    width: number;
    height: number;
    cols: 2 | 3;
    rows: 2 | 3;
    gap?: number;
    radius?: number;
    namePrefix?: string;
  },
): ImageNode[] {
  const gap = opts.gap ?? 12;
  const cols = opts.cols;
  const rows = opts.rows;
  const cellW = (opts.width - gap * (cols - 1)) / cols;
  const cellH = (opts.height - gap * (rows - 1)) / rows;
  const out: ImageNode[] = [];
  let i = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const img = images[i % images.length]!;
      out.push(
        makeImageInRect(
          parentId,
          assets,
          img,
          opts.x + c * (cellW + gap),
          opts.y + r * (cellH + gap),
          cellW,
          cellH,
          {
            name: `${opts.namePrefix ?? '\u69fd\u4f4d'}${i + 1}`,
            mask: opts.radius ? 'roundRect' : 'none',
            maskRadius: opts.radius,
            locked: true,
          },
        ),
      );
      i++;
    }
  }
  return out;
}

/** 1 large top + 3 bottom strip (travel collage). */
export function makePhotoGrid1Plus3(
  parentId: string,
  assets: AssetStore,
  images: ImageData[],
  opts: {
    x: number;
    y: number;
    width: number;
    height: number;
    gap?: number;
  },
): ImageNode[] {
  const gap = opts.gap ?? 12;
  const topH = Math.round(opts.height * 0.58);
  const botH = opts.height - topH - gap;
  const cellW = (opts.width - gap * 2) / 3;
  const a = images[0]!;
  const nodes: ImageNode[] = [
    makeImageInRect(parentId, assets, a, opts.x, opts.y, opts.width, topH, {
      name: '\u69fd\u4f4d1',
      mask: 'roundRect',
      maskRadius: 12,
      locked: true,
    }),
  ];
  for (let i = 0; i < 3; i++) {
    const img = images[(i + 1) % images.length]!;
    nodes.push(
      makeImageInRect(
        parentId,
        assets,
        img,
        opts.x + i * (cellW + gap),
        opts.y + topH + gap,
        cellW,
        botH,
        {
          name: `\u69fd\u4f4d${i + 2}`,
          mask: 'roundRect',
          maskRadius: 10,
          locked: true,
        },
      ),
    );
  }
  return nodes;
}

export function makeFilmStripSlots(
  parentId: string,
  assets: AssetStore,
  images: ImageData[],
  opts: {
    x: number;
    y: number;
    width: number;
    height: number;
    count?: number;
    stripFill?: string;
  },
): SceneNode[] {
  const count = opts.count ?? 3;
  const strip = makeShape(parentId, 'roundRect', {
    x: opts.x,
    y: opts.y,
    width: opts.width,
    height: opts.height,
    fill: opts.stripFill ?? '#141210',
    cornerRadius: 8,
    name: '\u80f6\u7247\u5e26',
    locked: true,
  });
  const pad = 16;
  const hole = 10;
  const nodes: SceneNode[] = [strip];
  for (let i = 0; i < 8; i++) {
    const yy = opts.y + 20 + i * ((opts.height - 40) / 7);
    nodes.push(
      makeShape(parentId, 'rect', {
        x: opts.x + 6,
        y: yy,
        width: hole,
        height: hole,
        fill: '#2A241C',
        name: `\u7247\u5b54L${i}`,
        locked: true,
      }),
      makeShape(parentId, 'rect', {
        x: opts.x + opts.width - 6 - hole,
        y: yy,
        width: hole,
        height: hole,
        fill: '#2A241C',
        name: `\u7247\u5b54R${i}`,
        locked: true,
      }),
    );
  }
  const innerW = opts.width - pad * 2 - 24;
  const innerH = (opts.height - pad * 2 - 8 * (count - 1)) / count;
  for (let i = 0; i < count; i++) {
    const img = images[i % images.length]!;
    nodes.push(
      makeImageInRect(
        parentId,
        assets,
        img,
        opts.x + pad + 12,
        opts.y + pad + i * (innerH + 8),
        innerW,
        innerH,
        { name: `\u69fd\u4f4d${i + 1}`, locked: true },
      ),
    );
  }
  return nodes;
}

export function makeHotBadge(
  parentId: string,
  x: number,
  y: number,
  ramp: TypeRamp = XHS_SIG_RAMP,
): SceneNode[] {
  return makePillBadge(parentId, {
    x,
    y,
    width: 88,
    height: 40,
    fill: '#E11D48',
    label: 'HOT',
    labelColor: '#FFF8EC',
    ramp,
    name: '\u6807\u7b7e',
  });
}

export function makeNewBadge(
  parentId: string,
  x: number,
  y: number,
  ramp: TypeRamp = XHS_SIG_RAMP,
): SceneNode[] {
  return makePillBadge(parentId, {
    x,
    y,
    width: 88,
    height: 40,
    fill: '#6D28D9',
    label: 'NEW',
    labelColor: '#FFF8EC',
    ramp,
    name: '\u6807\u7b7e',
  });
}

/** Decorative play / volume chrome (not real video). */
export function makeVideoChrome(
  parentId: string,
  opts?: { x?: number; y?: number; ink?: string },
): SceneNode[] {
  const x = opts?.x ?? 48;
  const y = opts?.y ?? XHS_SIG_H - 72;
  const ink = opts?.ink ?? 'rgba(255,248,236,0.9)';
  const play = makeShape(parentId, 'triangle', {
    x,
    y: y - 4,
    width: 28,
    height: 28,
    fill: ink,
    name: '\u89c6\u9891\u793a\u610f',
    locked: true,
  });
  const vol = makeShape(parentId, 'ellipse', {
    x: x + 48,
    y: y,
    width: 22,
    height: 22,
    fill: 'rgba(0,0,0,0)',
    stroke: ink,
    strokeWidth: 2,
    name: '\u89c6\u9891\u793a\u610f2',
    locked: true,
  });
  const bar = makeLine(parentId, x + 88, y + 10, 120, 0, {
    stroke: ink,
    strokeWidth: 2,
    name: '\u89c6\u9891\u793a\u610f3',
    locked: true,
  });
  return [play, vol, bar];
}

export function makeOutlinedDisplayText(
  parentId: string,
  content: string,
  x: number,
  y: number,
  opts: {
    fontSize: number;
    color: string;
    strokeColor: string;
    strokeWidth?: number;
    fontFamily?: string;
    align?: TextNode['align'];
    name?: string;
    bold?: boolean;
  },
): TextNode {
  return makeRoleText(parentId, 'display', content, x, y, XHS_SIG_RAMP, {
    name: opts.name ?? '\u6807\u9898',
    fontSize: opts.fontSize,
    color: opts.color,
    strokeColor: opts.strokeColor,
    strokeWidth: opts.strokeWidth ?? 6,
    fontFamily: opts.fontFamily ?? FONT_HEI,
    align: opts.align ?? 'left',
    bold: opts.bold ?? true,
  });
}

export function makePriceModule(
  parentId: string,
  opts: {
    x: number;
    y: number;
    width: number;
    height: number;
    price: string;
    rows: { label: string; price: string }[];
    surface: string;
    ink: string;
    accent: string;
  },
): SceneNode[] {
  const nodes: SceneNode[] = [
    makeSurfaceCard(parentId, {
      x: opts.x,
      y: opts.y,
      width: opts.width,
      height: opts.height,
      fill: opts.surface,
      radius: 20,
      name: '\u4ef7\u7b7e\u5361',
    }),
    makeRoleText(parentId, 'display', opts.price, opts.x + opts.width / 2, opts.y + 70, XHS_SIG_RAMP, {
      name: '\u6807\u9898',
      align: 'center',
      color: opts.accent,
      fontFamily: FONT_HEI,
      fontSize: 72,
      bold: true,
    }),
  ];
  opts.rows.forEach((row, i) => {
    const yy = opts.y + 140 + i * 56;
    nodes.push(
      makeRoleText(parentId, 'body', row.label, opts.x + 36, yy, XHS_SIG_RAMP, {
        name: `\u6761\u76ee${i + 1}`,
        color: opts.ink,
        fontFamily: FONT_SANS,
        fontSize: 26,
      }),
      makeRoleText(parentId, 'body', row.price, opts.x + opts.width - 36, yy, XHS_SIG_RAMP, {
        name: `\u4ef7\u683c${i + 1}`,
        align: 'right',
        color: opts.accent,
        fontFamily: FONT_META,
        fontSize: 26,
        bold: true,
      }),
    );
  });
  return nodes;
}

export function makeChecklistRows(
  parentId: string,
  opts: {
    x: number;
    y: number;
    width: number;
    items: string[];
    ink: string;
    accent: string;
    rowH?: number;
  },
): SceneNode[] {
  const rowH = opts.rowH ?? 72;
  const nodes: SceneNode[] = [];
  opts.items.forEach((t, i) => {
    const yy = opts.y + i * rowH;
    nodes.push(
      makeCheckBox(parentId, {
        x: opts.x,
        y: yy,
        size: 32,
        stroke: opts.accent,
      }),
      makeRoleText(parentId, 'body', t, opts.x + 52, yy + 16, XHS_SIG_RAMP, {
        name: `\u6761\u76ee${i + 1}`,
        color: opts.ink,
        fontFamily: FONT_SANS,
        fontSize: 28,
      }),
    );
  });
  return nodes;
}

export function makeCompareTable(
  parentId: string,
  assets: AssetStore,
  images: ImageData[],
  opts: {
    x: number;
    y: number;
    width: number;
    height: number;
    headers: string[];
    rows: string[][];
    surface: string;
    ink: string;
    accent: string;
    border: string;
  },
): SceneNode[] {
  const cols = Math.min(4, opts.headers.length);
  const pad = 16;
  const nodes: SceneNode[] = [
    makeShape(parentId, 'roundRect', {
      x: opts.x,
      y: opts.y,
      width: opts.width,
      height: opts.height,
      fill: opts.surface,
      stroke: opts.border,
      strokeWidth: 4,
      cornerRadius: 16,
      name: '\u5bf9\u6bd4\u8868',
      locked: true,
    }),
  ];
  const colW = (opts.width - pad * 2) / cols;
  const imgH = 120;
  for (let c = 0; c < cols; c++) {
    const img = images[c % images.length]!;
    nodes.push(
      makeImageInRect(
        parentId,
        assets,
        img,
        opts.x + pad + c * colW + 8,
        opts.y + pad,
        colW - 16,
        imgH,
        { name: `\u69fd\u4f4d${c + 1}`, mask: 'roundRect', maskRadius: 8, locked: true },
      ),
      makeRoleText(
        parentId,
        'meta',
        opts.headers[c] ?? '',
        opts.x + pad + c * colW + colW / 2,
        opts.y + pad + imgH + 28,
        XHS_SIG_RAMP,
        {
          name: `\u8868\u5934${c + 1}`,
          align: 'center',
          color: opts.ink,
          fontFamily: FONT_META,
          fontSize: 18,
          bold: true,
        },
      ),
    );
  }
  opts.rows.forEach((row, ri) => {
    const yy = opts.y + pad + imgH + 70 + ri * 56;
    nodes.push(
      makeLine(parentId, opts.x + pad, yy - 18, opts.width - pad * 2, 0, {
        stroke: opts.border,
        strokeWidth: 1,
        name: `\u8868\u7ebf${ri}`,
        locked: true,
      }),
    );
    for (let c = 0; c < cols; c++) {
      nodes.push(
        makeRoleText(
          parentId,
          'caption',
          row[c] ?? '',
          opts.x + pad + c * colW + colW / 2,
          yy,
          XHS_SIG_RAMP,
          {
            name: `\u8868\u683c${ri}_${c}`,
            align: 'center',
            color: c === 0 ? opts.accent : opts.ink,
            fontFamily: FONT_SANS,
            fontSize: 20,
          },
        ),
      );
    }
  });
  return nodes;
}

export function makeDoodleStars(
  parentId: string,
  opts: { cx: number; cy: number; fill: string; count?: number },
): SceneNode[] {
  const n = opts.count ?? 6;
  const nodes: SceneNode[] = [];
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2;
    const r = 90 + (i % 3) * 40;
    nodes.push(
      makeShape(parentId, 'star', {
        x: opts.cx + Math.cos(ang) * r - 14,
        y: opts.cy + Math.sin(ang) * r - 14,
        width: 28,
        height: 28,
        fill: opts.fill,
        name: `\u6d82\u9e26${i}`,
        locked: true,
        opacity: 0.85,
      }),
    );
  }
  nodes.push(
    makeAccentStroke(parentId, {
      x: opts.cx - 80,
      y: opts.cy + 120,
      width: 160,
      amplitude: 12,
      stroke: opts.fill,
      strokeWidth: 2,
      name: '\u6d82\u9e26\u7ebf',
    }),
  );
  return nodes;
}

export {
  FONT_HEI,
  FONT_KAI,
  FONT_LATIN_DISPLAY,
  FONT_LATIN_SERIF,
  FONT_META,
  FONT_SANS,
  FONT_XING,
};
