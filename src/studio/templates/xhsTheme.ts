/**
 * Xiaohongshu note theme tokens — orthogonal to card layout structure.
 * Skin chrome follows PicGen: classic blocks / magazine rules / bigType /
 * grid cells / memo tape / bento panels.
 */

import {
  getActiveFrame,
  isFrame,
  isShape,
  isText,
  type SceneNode,
  type StudioDocument,
  type TextNode,
} from '../model';
import { makeShape } from '../scenes/helpers';
import { makeRuledLines, makeVeil } from './templateCraft';
import {
  makeDashedFrame,
  makeHairline,
  makeSurfaceCard,
  makeTape,
} from './xhsCraft';
import {
  FONT_HEI,
  FONT_KAI,
  FONT_META,
  FONT_SANS,
  FONT_SONG,
  FONT_XING,
} from './templatePalettes';
import { RAMP_XHS, makeRoleText, type TypeRamp } from './templateType';

export type XhsSkin =
  | 'classic'
  | 'magazine'
  | 'bigType'
  | 'grid'
  | 'memoPaper'
  | 'bento';

export type XhsPaletteId =
  | 'peach'
  | 'mistBlue'
  | 'amber'
  | 'inkMinimal'
  | 'lavender'
  | 'clay'
  | 'forest'
  | 'night';

export type XhsBg = 'solid' | 'gradient' | 'dots' | 'rules';
export type XhsTypeScale = 'sm' | 'md' | 'lg';

export type XhsTheme = {
  skin: XhsSkin;
  palette: XhsPaletteId;
  bg: XhsBg;
  typeScale: XhsTypeScale;
};

export type XhsPaletteTokens = {
  id: XhsPaletteId;
  label: string;
  bg: string;
  surface: string;
  ink: string;
  muted: string;
  accent: string;
};

/** Stable node names used by factories + theme apply. */
export const XHS_NAME = {
  paper: '\u7eb8\u9762',
  title: '\u6807\u9898',
  body: '\u6b63\u6587',
  item: '\u6761\u76ee',
  hint: '\u63d0\u793a',
  accent: '\u5f3a\u8c03',
  safe: '\u5b89\u5168\u533a',
  meta: '\u5c5e\u6027',
  bgDecorPrefix: 'xhsBg',
  skinPrefix: 'xhsSkin',
} as const;

export const XHS_W = 1080;
export const XHS_H = 1440;

export const XHS_SAFE = {
  top: 0.12,
  bottom: 0.22,
} as const;

export const DEFAULT_XHS_THEME: XhsTheme = {
  skin: 'classic',
  palette: 'peach',
  bg: 'solid',
  typeScale: 'md',
};

/** PicGen-aligned palette shelf (avoid purple-on-white / cream+terracotta AI cliché as defaults). */
export const XHS_PALETTES: XhsPaletteTokens[] = [
  {
    id: 'peach',
    label: '\u6e29\u6da6\u6843\u7c89',
    bg: '#FFF4EF',
    surface: '#FFE4D8',
    ink: '#2A1812',
    muted: '#A07868',
    accent: '#D96B5C',
  },
  {
    id: 'mistBlue',
    label: '\u96fe\u84dd\u5546\u52a1',
    bg: '#F2F5F8',
    surface: '#E4ECF2',
    ink: '#1A2430',
    muted: '#6A7A8A',
    accent: '#3D6B8C',
  },
  {
    id: 'amber',
    label: '\u5976\u6cb9\u7425\u73c0',
    bg: '#FFF9EF',
    surface: '#F3E4C8',
    ink: '#2A2010',
    muted: '#8A7850',
    accent: '#C4892A',
  },
  {
    id: 'inkMinimal',
    label: '\u7d20\u96c5\u6781\u7b80',
    bg: '#FAFAF8',
    surface: '#F0EEE8',
    ink: '#141414',
    muted: '#7A7A72',
    accent: '#2A2A28',
  },
  {
    id: 'lavender',
    label: '\u85b0\u8863\u8349\u7070',
    bg: '#F6F4F8',
    surface: '#E8E4F0',
    ink: '#241E2E',
    muted: '#7A7288',
    accent: '#6B5B8A',
  },
  {
    id: 'clay',
    label: '\u9676\u571f\u6696\u8910',
    bg: '#F7F0EA',
    surface: '#EBD9CC',
    ink: '#2A1C14',
    muted: '#8A6E5C',
    accent: '#A85A3C',
  },
  {
    id: 'forest',
    label: '\u6df1\u6797\u58a8\u7eff',
    bg: '#F1F5F0',
    surface: '#DDE8DC',
    ink: '#1A2418',
    muted: '#5A6E58',
    accent: '#3D6B45',
  },
  {
    id: 'night',
    label: '\u591c\u8272\u58a8\u91d1',
    bg: '#141210',
    surface: '#1E1A16',
    ink: '#FFF8EC',
    muted: 'rgba(255,248,236,0.55)',
    accent: '#C9A227',
  },
];

export const XHS_SKIN_META: { id: XhsSkin; label: string; desc: string }[] = [
  {
    id: 'classic',
    label: '\u7ecf\u5178',
    desc: '\u6e05\u723d\u8272\u5757 + \u89c4\u5219\u6392\u7248',
  },
  {
    id: 'magazine',
    label: '\u6742\u5fd7',
    desc: '\u7ec6\u7ebf\u6392\u7248 + \u7f16\u8f91\u680f',
  },
  {
    id: 'bigType',
    label: '\u5927\u5b57\u62a5',
    desc: '\u6807\u9898\u5360\u6ee1\u89c6\u91ce',
  },
  {
    id: 'grid',
    label: '\u65b9\u683c',
    desc: '\u6574\u9f50\u65b9\u683c\u7ed3\u6784',
  },
  {
    id: 'memoPaper',
    label: '\u624b\u8d26\u7eb8',
    desc: '\u7c73\u767d\u7eb8 + \u80f6\u5e26\u6298\u89d2',
  },
  {
    id: 'bento',
    label: '\u4fbf\u5f53\u683c',
    desc: '\u4e0d\u5bf9\u79f0\u62fc\u8d34\u5361\u7247',
  },
];

export const XHS_BG_META: { id: XhsBg; label: string }[] = [
  { id: 'solid', label: '\u7eaf\u8272' },
  { id: 'gradient', label: '\u6e10\u53d8' },
  { id: 'dots', label: '\u6ce2\u70b9' },
  { id: 'rules', label: '\u6a2a\u7ebf' },
];

export const XHS_SCALE_META: { id: XhsTypeScale; label: string }[] = [
  { id: 'sm', label: '\u5c0f' },
  { id: 'md', label: '\u4e2d' },
  { id: 'lg', label: '\u5927' },
];

const SCALE_FACTOR: Record<XhsTypeScale, number> = {
  sm: 0.85,
  md: 1,
  lg: 1.18,
};

export function getXhsPalette(id: XhsPaletteId): XhsPaletteTokens {
  return XHS_PALETTES.find((p) => p.id === id) ?? XHS_PALETTES[0]!;
}

export function resolveXhsTheme(partial?: Partial<XhsTheme>): XhsTheme {
  return {
    skin: partial?.skin ?? DEFAULT_XHS_THEME.skin,
    palette: partial?.palette ?? DEFAULT_XHS_THEME.palette,
    bg: partial?.bg ?? DEFAULT_XHS_THEME.bg,
    typeScale: partial?.typeScale ?? DEFAULT_XHS_THEME.typeScale,
  };
}

export function xhsRamp(theme: XhsTheme): TypeRamp {
  const f = SCALE_FACTOR[theme.typeScale];
  const scale = (n: number) => Math.round(n * f);
  return {
    display: scale(RAMP_XHS.display),
    script: scale(RAMP_XHS.script),
    serifQuote: scale(RAMP_XHS.serifQuote),
    fang: scale(RAMP_XHS.fang),
    body: scale(RAMP_XHS.body),
    meta: scale(RAMP_XHS.meta),
    caption: scale(RAMP_XHS.caption),
    latinDisplay: scale(RAMP_XHS.latinDisplay),
    latinSerif: scale(RAMP_XHS.latinSerif),
  };
}

export function xhsTitleFont(skin: XhsSkin): string {
  switch (skin) {
    case 'classic':
    case 'bigType':
    case 'grid':
    case 'bento':
      return FONT_HEI;
    case 'magazine':
      return FONT_SONG;
    case 'memoPaper':
      return FONT_KAI;
    default: {
      const _e: never = skin;
      void _e;
      return FONT_HEI;
    }
  }
}

export function xhsBodyFont(skin: XhsSkin): string {
  switch (skin) {
    case 'classic':
    case 'grid':
    case 'bento':
      return FONT_SANS;
    case 'magazine':
      return FONT_SONG;
    case 'bigType':
      return FONT_HEI;
    case 'memoPaper':
      return FONT_KAI;
    default: {
      const _e: never = skin;
      void _e;
      return FONT_SANS;
    }
  }
}

export function xhsContentMargin(skin: XhsSkin): number {
  switch (skin) {
    case 'classic':
      return 88;
    case 'magazine':
      return 96;
    case 'bigType':
      return 72;
    case 'grid':
      return 72;
    case 'memoPaper':
      return 100;
    case 'bento':
      return 56;
    default: {
      const _e: never = skin;
      void _e;
      return 88;
    }
  }
}

export function xhsFrameName(cardType: string): string {
  return `xhs:${cardType}`;
}

export function parseXhsCardTypeFromFrame(name: string | undefined): string | null {
  if (!name?.startsWith('xhs:')) return null;
  return name.slice(4) || null;
}

/** Base paper + bg pattern (solid / gradient / dots / rules). */
export function buildXhsPaperLayers(frameId: string, theme: XhsTheme): SceneNode[] {
  const pal = getXhsPalette(theme.palette);
  const nodes: SceneNode[] = [];

  nodes.push(
    makeVeil(frameId, {
      x: 0,
      y: 0,
      width: XHS_W,
      height: XHS_H,
      fill: pal.bg,
      name: XHS_NAME.paper,
    }),
  );

  if (theme.bg === 'gradient') {
    nodes.push(
      makeVeil(frameId, {
        x: 0,
        y: Math.round(XHS_H * 0.38),
        width: XHS_W,
        height: Math.round(XHS_H * 0.62),
        fill: pal.surface,
        name: `${XHS_NAME.bgDecorPrefix}Grad`,
        opacity: 0.9,
      }),
    );
  }

  if (theme.bg === 'dots') {
    const step = 56;
    let i = 0;
    for (let y = 100; y < XHS_H - 100; y += step) {
      for (let x = 100; x < XHS_W - 100; x += step) {
        if (((x / step) | 0) % 2 !== ((y / step) | 0) % 2) continue;
        nodes.push(
          makeShape(frameId, 'ellipse', {
            x: x - 3.5,
            y: y - 3.5,
            width: 7,
            height: 7,
            fill: pal.accent,
            opacity: 0.14,
            name: `${XHS_NAME.bgDecorPrefix}Dot${i++}`,
            locked: true,
          }),
        );
      }
    }
  }

  if (theme.bg === 'rules') {
    const m = xhsContentMargin(theme.skin);
    nodes.push(
      ...makeRuledLines(frameId, {
        x: m,
        y0: Math.round(XHS_H * 0.26),
        width: XHS_W - m * 2,
        count: 10,
        gap: 84,
        stroke: pal.ink,
        strokeWidth: 1.2,
      }).map((line, idx) => ({
        ...line,
        name: `${XHS_NAME.bgDecorPrefix}Rule${idx + 1}`,
        opacity: 0.1,
      })),
    );
  }

  return nodes;
}

/**
 * Skin chrome (PicGen): color blocks / editorial frame / watermark /
 * grid lattice / washi tape / soft bento dock.
 */
export function buildXhsSkinChrome(frameId: string, theme: XhsTheme): SceneNode[] {
  const pal = getXhsPalette(theme.palette);
  const ramp = xhsRamp(theme);
  const m = xhsContentMargin(theme.skin);
  const p = XHS_NAME.skinPrefix;
  const nodes: SceneNode[] = [];

  switch (theme.skin) {
    case 'classic': {
      nodes.push(
        makeVeil(frameId, {
          x: 0,
          y: 0,
          width: XHS_W,
          height: Math.round(XHS_H * 0.22),
          fill: pal.surface,
          name: `${p}Band`,
        }),
        makeVeil(frameId, {
          x: m,
          y: Math.round(XHS_H * 0.22) - 6,
          width: 96,
          height: 12,
          fill: pal.accent,
          name: `${p}Mark`,
        }),
      );
      break;
    }
    case 'magazine': {
      nodes.push(
        makeShape(frameId, 'rect', {
          x: 40,
          y: 40,
          width: XHS_W - 80,
          height: XHS_H - 80,
          fill: 'rgba(0,0,0,0)',
          stroke: pal.ink,
          strokeWidth: 1.25,
          name: `${p}Frame`,
          locked: true,
          opacity: 0.28,
        }),
        makeHairline(frameId, {
          x: m,
          y: 120,
          width: XHS_W - m * 2,
          stroke: pal.ink,
          name: `${p}TopRule`,
        }),
        makeHairline(frameId, {
          x: m,
          y: XHS_H - 120,
          width: XHS_W - m * 2,
          stroke: pal.ink,
          name: `${p}BotRule`,
        }),
        makeVeil(frameId, {
          x: m,
          y: 140,
          width: 3,
          height: Math.round(XHS_H * 0.18),
          fill: pal.accent,
          name: `${p}Spine`,
        }),
      );
      const folio = makeRoleText(frameId, 'meta', 'VOL. 03', XHS_W - m, 88, ramp, {
        name: `${p}Folio`,
        align: 'right',
        color: pal.muted,
        fontFamily: FONT_META,
        fontSize: 18,
        bold: true,
      });
      nodes.push(folio);
      break;
    }
    case 'bigType': {
      const mark = makeRoleText(frameId, 'script', '\u8bb0', XHS_W - 140, 220, ramp, {
        name: `${p}Watermark`,
        align: 'center',
        color: pal.accent,
        fontFamily: FONT_XING,
        fontSize: 220,
      });
      mark.opacity = 0.12;
      mark.locked = true;
      nodes.push(mark);
      break;
    }
    case 'grid': {
      // Lattice only — cells are owned by card factories.
      const inset = 48;
      nodes.push(
        makeShape(frameId, 'rect', {
          x: inset,
          y: inset,
          width: XHS_W - inset * 2,
          height: XHS_H - inset * 2,
          fill: 'rgba(0,0,0,0)',
          stroke: pal.ink,
          strokeWidth: 1.5,
          name: `${p}Outer`,
          locked: true,
          opacity: 0.16,
        }),
        makeVeil(frameId, {
          x: XHS_W / 2 - 0.75,
          y: inset + 40,
          width: 1.5,
          height: XHS_H - inset * 2 - 80,
          fill: pal.ink,
          name: `${p}VLine`,
          opacity: 0.12,
        }),
      );
      break;
    }
    case 'memoPaper': {
      nodes.push(
        makeSurfaceCard(frameId, {
          x: 48,
          y: 56,
          width: XHS_W - 96,
          height: XHS_H - 112,
          fill: pal.surface,
          radius: 8,
          name: `${p}Sheet`,
        }),
        makeDashedFrame(frameId, {
          x: 72,
          y: 80,
          width: XHS_W - 144,
          height: XHS_H - 160,
          stroke: pal.ink,
          name: `${p}Dash`,
        }),
        makeTape(frameId, {
          x: 120,
          y: 40,
          width: 140,
          height: 36,
          fill: pal.accent,
          deg: -8,
          name: `${p}TapeL`,
          opacity: 0.55,
        }),
        makeTape(frameId, {
          x: XHS_W - 260,
          y: 48,
          width: 120,
          height: 32,
          fill: pal.muted,
          deg: 12,
          name: `${p}TapeR`,
          opacity: 0.4,
        }),
      );
      if (theme.bg !== 'rules') {
        nodes.push(
          ...makeRuledLines(frameId, {
            x: 120,
            y0: 320,
            width: XHS_W - 240,
            count: 9,
            gap: 90,
            stroke: pal.ink,
            strokeWidth: 1.2,
          }).map((line, idx) => ({
            ...line,
            name: `${p}Rule${idx + 1}`,
            opacity: 0.12,
          })),
        );
      }
      break;
    }
    case 'bento': {
      // Soft corner chips only — asymmetric cards live in factories.
      nodes.push(
        makeSurfaceCard(frameId, {
          x: 32,
          y: 32,
          width: 180,
          height: 56,
          fill: pal.accent,
          radius: 16,
          name: `${p}Chip`,
        }),
        makeSurfaceCard(frameId, {
          x: XHS_W - 200,
          y: XHS_H - 88,
          width: 160,
          height: 48,
          fill: pal.surface,
          radius: 14,
          name: `${p}Chip2`,
        }),
      );
      break;
    }
    default: {
      const _e: never = theme.skin;
      void _e;
    }
  }

  return nodes;
}

function removeDecor(frameId: string, doc: StudioDocument): void {
  const frame = doc.nodes[frameId];
  if (!frame || !isFrame(frame)) return;
  const keep: string[] = [];
  for (const cid of frame.children) {
    const n = doc.nodes[cid];
    if (!n) continue;
    if (
      n.name === XHS_NAME.paper ||
      n.name.startsWith(XHS_NAME.bgDecorPrefix) ||
      n.name.startsWith(XHS_NAME.skinPrefix) ||
      n.name.startsWith('\u6a2a\u7ebf')
    ) {
      delete doc.nodes[cid];
      continue;
    }
    keep.push(cid);
  }
  frame.children = keep;
}

function insertDecor(frameId: string, doc: StudioDocument, theme: XhsTheme): void {
  const frame = doc.nodes[frameId];
  if (!frame || !isFrame(frame)) return;
  const layers = [...buildXhsPaperLayers(frameId, theme), ...buildXhsSkinChrome(frameId, theme)];
  for (const n of layers) doc.nodes[n.id] = n;
  frame.children = [...layers.map((n) => n.id), ...frame.children];
  frame.fill = getXhsPalette(theme.palette).bg;
}

function restyleText(
  node: TextNode,
  theme: XhsTheme,
  role: 'title' | 'body' | 'item' | 'hint' | 'meta',
): void {
  const pal = getXhsPalette(theme.palette);
  const ramp = xhsRamp(theme);
  const patch: Partial<TextNode> = {};
  switch (role) {
    case 'title':
      patch.color = pal.ink;
      patch.fontFamily = xhsTitleFont(theme.skin);
      patch.fontSize =
        theme.skin === 'bigType' ? Math.round(ramp.display * 1.2) : ramp.display;
      patch.bold = theme.skin !== 'memoPaper';
      break;
    case 'body':
    case 'item':
      patch.color = pal.ink;
      patch.fontFamily = xhsBodyFont(theme.skin);
      patch.fontSize = ramp.body;
      break;
    case 'hint':
      patch.color = pal.muted;
      patch.fontFamily = FONT_META;
      patch.fontSize = ramp.caption;
      break;
    case 'meta':
      patch.color = pal.accent;
      patch.fontFamily = FONT_META;
      patch.fontSize = ramp.meta;
      patch.bold = true;
      break;
    default: {
      const _e: never = role;
      void _e;
    }
  }
  Object.assign(node, patch);
}

/** Recolor / rebuild craft layers on every page. Mutates doc in place. */
export function applyXhsTheme(doc: StudioDocument, theme: XhsTheme): void {
  const pal = getXhsPalette(theme.palette);
  for (const page of doc.pages) {
    const frameId = page.frameIds[0];
    if (!frameId) continue;
    const frame = doc.nodes[frameId];
    if (!frame || !isFrame(frame)) continue;

    removeDecor(frameId, doc);
    insertDecor(frameId, doc, theme);

    for (const cid of [...frame.children]) {
      const n = doc.nodes[cid];
      if (!n) continue;
      if (isShape(n)) {
        if (
          n.name === XHS_NAME.accent ||
          n.name.startsWith(XHS_NAME.accent) ||
          n.name.includes('\u5f3a\u8c03')
        ) {
          doc.nodes[cid] = { ...n, fill: pal.accent };
        } else if (
          n.name === '\u5361\u7247' ||
          n.name.startsWith('\u9762\u677f') ||
          n.name === '\u9762\u677f'
        ) {
          doc.nodes[cid] = { ...n, fill: pal.surface };
        }
        continue;
      }
      if (!isText(n)) continue;
      if (n.name.startsWith(XHS_NAME.skinPrefix)) continue;
      if (n.name === XHS_NAME.title || n.name.startsWith(XHS_NAME.title)) {
        restyleText(n, theme, 'title');
      } else if (n.name === XHS_NAME.body) {
        restyleText(n, theme, 'body');
      } else if (n.name === XHS_NAME.item || n.name.startsWith(XHS_NAME.item)) {
        restyleText(n, theme, 'item');
      } else if (n.name === XHS_NAME.hint || n.name.startsWith(XHS_NAME.hint)) {
        restyleText(n, theme, 'hint');
      } else if (n.name === XHS_NAME.meta || n.name.startsWith(XHS_NAME.meta)) {
        restyleText(n, theme, 'meta');
      }
    }
  }
}

export function inferThemeFromDoc(doc: StudioDocument | null): XhsTheme {
  if (!doc) return { ...DEFAULT_XHS_THEME };
  const frame = getActiveFrame(doc);
  if (!frame) return { ...DEFAULT_XHS_THEME };
  const fill = frame.fill?.toUpperCase() ?? '';
  const match = XHS_PALETTES.find((p) => p.bg.toUpperCase() === fill);
  return {
    ...DEFAULT_XHS_THEME,
    palette: match?.id ?? DEFAULT_XHS_THEME.palette,
  };
}
