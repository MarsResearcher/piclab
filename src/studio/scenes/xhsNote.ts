import type { AssetStore } from '../store/assetStore';
import type { ScenePlugin } from '../plugins/types';
import { FONT_HEI, FONT_KAI, FONT_SONG } from '../templates/templatePalettes';
import { makeCoverImage } from '../templates/templateAssets';
import {
  XHS_CARD_TYPES,
  buildXhsCardDocument,
  type XhsCardTypeId,
} from '../templates/xhsCardTypes';
import {
  XHS_H,
  XHS_NAME,
  XHS_W,
  getXhsPalette,
  resolveXhsTheme,
  type XhsBg,
  type XhsPaletteId,
  type XhsSkin,
  type XhsTheme,
  type XhsTypeScale,
} from '../templates/xhsTheme';
import { isFrame } from '../model';
import { makeShape } from './helpers';

const CARD_IDS = new Set(XHS_CARD_TYPES.map((c) => c.id));

function asCardType(raw: string | undefined): XhsCardTypeId {
  if (raw && CARD_IDS.has(raw as XhsCardTypeId)) return raw as XhsCardTypeId;
  return 'cover';
}

function asTheme(partial?: {
  skin?: string;
  palette?: string;
  bg?: string;
  typeScale?: string;
}): Partial<XhsTheme> {
  if (!partial) return {};
  const out: Partial<XhsTheme> = {};
  if (partial.skin) out.skin = partial.skin as XhsSkin;
  if (partial.palette) out.palette = partial.palette as XhsPaletteId;
  if (partial.bg) out.bg = partial.bg as XhsBg;
  if (partial.typeScale) out.typeScale = partial.typeScale as XhsTypeScale;
  return out;
}

/** @deprecated Prefer XhsTheme — kept for older bar callers. */
export type XhsTextCardStyleId = 'memo' | 'card' | 'quote' | 'dark';

export type XhsTextCardStyle = {
  id: XhsTextCardStyleId;
  label: string;
  bg: string;
  textColor: string;
  mutedColor: string;
  fontFamily: string;
  fontSize: number;
  align: 'left' | 'center';
  bold: boolean;
  lineHeight: number;
  sample: string;
  theme: Partial<XhsTheme>;
};

/** Legacy style packs → theme presets (quick chips). */
export const XHS_TEXT_CARD_STYLES: XhsTextCardStyle[] = [
  {
    id: 'memo',
    label: '\u8bb0\u4e8b\u672c',
    bg: '#FFF8EC',
    textColor: '#2A2010',
    mutedColor: '#8A7850',
    fontFamily: FONT_KAI,
    fontSize: 48,
    align: 'left',
    bold: false,
    lineHeight: 1.55,
    sample: '\u5199\u70b9\u6b64\u523b\u60f3\u8bf4\u7684\u2026',
    theme: { skin: 'memoPaper', palette: 'amber', bg: 'rules', typeScale: 'md' },
  },
  {
    id: 'card',
    label: '\u5361\u7247',
    bg: '#FFF5F0',
    textColor: '#2A1810',
    mutedColor: '#9A7060',
    fontFamily: FONT_HEI,
    fontSize: 56,
    align: 'center',
    bold: true,
    lineHeight: 1.35,
    sample: '\u4e00\u53e5\u8bdd\u5c01\u9762',
    theme: { skin: 'classic', palette: 'peach', bg: 'solid', typeScale: 'md' },
  },
  {
    id: 'quote',
    label: '\u8bed\u5f55',
    bg: '#F0F4F8',
    textColor: '#1A2430',
    mutedColor: '#6A7A8A',
    fontFamily: FONT_SONG,
    fontSize: 44,
    align: 'left',
    bold: false,
    lineHeight: 1.6,
    sample: '\u628a\u4e00\u53e5\u60f3\u8bf4\u7684\u8bdd\n\u7559\u5728\u8fd9\u91cc',
    theme: { skin: 'magazine', palette: 'mistBlue', bg: 'solid', typeScale: 'md' },
  },
  {
    id: 'dark',
    label: '\u6df1\u8272',
    bg: '#141210',
    textColor: '#FFF8EC',
    mutedColor: 'rgba(255,248,236,0.55)',
    fontFamily: FONT_HEI,
    fontSize: 52,
    align: 'center',
    bold: true,
    lineHeight: 1.4,
    sample: '\u591c\u95f4\u7075\u611f',
    theme: { skin: 'bigType', palette: 'night', bg: 'solid', typeScale: 'lg' },
  },
];

export function getXhsTextCardStyle(id: XhsTextCardStyleId): XhsTextCardStyle {
  return XHS_TEXT_CARD_STYLES.find((s) => s.id === id) ?? XHS_TEXT_CARD_STYLES[0]!;
}

export const XHS_TEXT_SAMPLES = [
  '\u4eca\u5929\u4e5f\u8981\u597d\u597d\u751f\u6d3b',
  '\u8bb0\u4e09\u4ef6\u503c\u5f97\u7684\u5c0f\u4e8b',
  '\u522b\u6025\uff0c\u6162\u6162\u6765\u4e5f\u5f88\u5feb',
  '\u628a\u60f3\u6cd5\u5199\u6210\u4e00\u5f20\u56fe',
] as const;

export const xhsNoteScene: ScenePlugin = {
  id: 'xhsNote',
  label: '\u5c0f\u7ea2\u4e66',
  description:
    '\u5c0f\u7ea2\u4e66 3:4 \u6587\u5b57\u914d\u56fe\uff1b\u6309\u5361\u7247\u7ed3\u6784\u52a0\u9875\uff0c\u4e00\u952e\u6362\u4e3b\u9898',
  tools: ['select', 'text', 'image', 'shape', 'export'],
  exportHints: [
    { width: 1080, height: 1440, name: '\u5c01\u9762 / \u5185\u9875 3:4' },
    { width: 1080, height: 1080, name: '\u65b9\u56fe 1:1' },
  ],
  createDocument: (opts) => {
    const cardType = asCardType(opts?.xhsCardType);
    const theme = resolveXhsTheme(asTheme(opts?.xhsTheme));
    const doc = buildXhsCardDocument(cardType, theme);
    const pal = getXhsPalette(theme.palette);

    const assets = opts?.assets as AssetStore | undefined;
    if (opts?.fromImage && assets) {
      const page = doc.pages[0];
      const frameId = page?.frameIds[0];
      if (frameId) {
        const frame = doc.nodes[frameId];
        if (frame && isFrame(frame)) {
          const imageNode = makeCoverImage(frameId, assets, opts.fromImage, XHS_W, XHS_H, {
            name: '\u5e95\u56fe',
            opacity: 0.35,
          });
          doc.nodes[imageNode.id] = imageNode;
          const veil = makeShape(frameId, 'rect', {
            x: 0,
            y: 0,
            width: XHS_W,
            height: XHS_H,
            fill: pal.bg,
            opacity: 0.88,
            name: XHS_NAME.paper,
            locked: true,
          });
          doc.nodes[veil.id] = veil;
          frame.children = [
            imageNode.id,
            veil.id,
            ...frame.children.filter((id) => {
              const n = doc.nodes[id];
              return Boolean(n && n.name !== XHS_NAME.paper);
            }),
          ];
        }
      }
    }

    return doc;
  },
};
