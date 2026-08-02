/**
 * Xiaohongshu card-type layout factories — dense, PicGen/Canva-grade craft.
 * Structure per card type; skin/palette/bg from XhsTheme.
 */

import type { FrameNode, SceneNode, StudioDocument } from '../model';
import { addPageWithFrame, emptyDoc, makeFrame } from '../scenes/helpers';
import { makeRoleText } from './templateType';
import { makeAccentStroke, makeVeil } from './templateCraft';
import {
  makeAccentBar,
  makeCheckBox,
  makeHairline,
  makeNumberBadge,
  makePillBadge,
  makeSurfaceCard,
} from './xhsCraft';
import {
  XHS_H,
  XHS_NAME,
  XHS_SAFE,
  XHS_W,
  applyXhsTheme,
  buildXhsPaperLayers,
  buildXhsSkinChrome,
  getXhsPalette,
  resolveXhsTheme,
  xhsBodyFont,
  xhsContentMargin,
  xhsFrameName,
  xhsRamp,
  xhsTitleFont,
  type XhsTheme,
} from './xhsTheme';
import { FONT_HEI, FONT_KAI, FONT_META, FONT_SONG, FONT_XING } from './templatePalettes';

export type XhsCardTypeId =
  | 'cover'
  | 'body'
  | 'plain'
  | 'summary'
  | 'tips'
  | 'compare'
  | 'steps'
  | 'stats'
  | 'faq'
  | 'checklist'
  | 'quote'
  | 'ending';

export type XhsCardTypeMeta = {
  id: XhsCardTypeId;
  label: string;
  shelf: 'cover' | 'inner' | 'ending';
  description: string;
};

export const XHS_CARD_TYPES: XhsCardTypeMeta[] = [
  { id: 'cover', label: '\u5c01\u9762', shelf: 'cover', description: '\u77ed\u94a9\u6807\u9898\u00b7\u4fe1\u606f\u6d41\u53ef\u8bfb' },
  { id: 'body', label: '\u6b63\u6587\u8981\u70b9', shelf: 'inner', description: '\u6807\u9898 + \u5206\u6761\u8981\u70b9' },
  { id: 'plain', label: '\u7eaf\u6bb5\u843d', shelf: 'inner', description: '\u957f\u6587\u6392\u7248\u00b7\u8bb0\u4e8b\u611f' },
  { id: 'summary', label: '\u91cd\u70b9\u603b\u7ed3', shelf: 'inner', description: '\u5206\u6761\u7ed3\u8bba\u6863' },
  { id: 'tips', label: '\u5c0f\u8d34\u58eb', shelf: 'inner', description: '\u591a\u6761\u5b9e\u7528\u63d0\u793a' },
  { id: 'compare', label: '\u5bf9\u6bd4\u53c2\u8003', shelf: 'inner', description: '\u4e24\u680f\u6b63\u53cd\u5bf9\u7167' },
  { id: 'steps', label: '\u64cd\u4f5c\u6b65\u9aa4', shelf: 'inner', description: '\u6309\u987a\u5e8f\u5206\u6b65\u8bf4\u660e' },
  { id: 'stats', label: '\u5173\u952e\u6570\u636e', shelf: 'inner', description: '\u6570\u503c + \u6807\u7b7e\u7f51\u683c' },
  { id: 'faq', label: '\u5e38\u89c1\u95ee\u7b54', shelf: 'inner', description: 'Q&A \u5bf9' },
  { id: 'checklist', label: '\u68c0\u67e5\u6e05\u5355', shelf: 'inner', description: '\u5f85\u529e / \u5fc5\u505a\u9879' },
  { id: 'quote', label: '\u91d1\u53e5', shelf: 'inner', description: '\u7a81\u51fa\u4e00\u53e5\u5f15\u7528' },
  { id: 'ending', label: '\u7ed3\u5c3e\u9875', shelf: 'ending', description: '\u6536\u675f\u00b7\u5f15\u5bfc\u4e92\u52a8' },
];

export function getXhsCardType(id: XhsCardTypeId): XhsCardTypeMeta {
  return XHS_CARD_TYPES.find((c) => c.id === id) ?? XHS_CARD_TYPES[0]!;
}

export const XHS_CARD_SAMPLES: Record<XhsCardTypeId, string[]> = {
  cover: ['5 \u5206\u949f\u641e\u5b9a', '\u770b\u5b8c\u7701\u4e00\u534a\u529f\u592b', '\u522b\u518d\u8e29\u5751'],
  body: ['\u5148\u8bb0\u8fd9\u4e09\u70b9', '\u6838\u5fc3\u8981\u70b9', '\u5e72\u8d27\u901f\u89c8'],
  plain: ['\u5199\u70b9\u6b64\u523b\u60f3\u8bf4\u7684\u2026', '\u6162\u6162\u6765\u4e5f\u5f88\u5feb'],
  summary: ['\u4e00\u53e5\u8bdd\u603b\u7ed3', '\u6536\u85cf\u5907\u7528'],
  tips: ['\u5c0f\u6280\u5de7', '\u907f\u5751\u63d0\u793a'],
  compare: ['Before / After', '\u5de6\u53f3\u5bf9\u6bd4'],
  steps: ['\u7b2c\u4e00\u6b65', '\u7167\u505a\u5c31\u884c'],
  stats: ['3 \u4e2a\u5173\u952e\u6570', '90% \u6709\u6548'],
  faq: ['\u5e38\u89c1\u95ee\u9898', '\u4e3a\u4ec0\u4e48\uff1f'],
  checklist: ['\u51fa\u95e8\u524d\u68c0\u67e5', '\u672c\u5468\u5fc5\u505a'],
  quote: ['\u628a\u4e00\u53e5\u8bdd\u7559\u5728\u8fd9\u91cc', '\u4eca\u5929\u4e5f\u8981\u597d\u597d\u751f\u6d3b'],
  ending: ['\u70b9\u8d5e\u6536\u85cf\u5173\u6ce8', '\u8bc4\u8bba\u533a\u89c1'],
};

function putAttach(
  doc: StudioDocument,
  frame: FrameNode,
  nodes: SceneNode[],
  selectId?: string,
): void {
  for (const n of nodes) doc.nodes[n.id] = n;
  frame.children = nodes.map((n) => n.id);
  doc.nodes[frame.id] = frame;
  if (selectId) doc.selection = [selectId];
}

function baseLayers(frameId: string, theme: XhsTheme): SceneNode[] {
  return [...buildXhsPaperLayers(frameId, theme), ...buildXhsSkinChrome(frameId, theme)];
}

function titleSize(theme: XhsTheme, factor = 1): number {
  const ramp = xhsRamp(theme);
  const base = theme.skin === 'bigType' ? ramp.display * 1.25 : ramp.display;
  return Math.round(base * factor);
}

/** Build nodes for one card type into an existing frame. */
export function buildXhsCardNodes(
  frameId: string,
  cardType: XhsCardTypeId,
  theme: XhsTheme,
): { nodes: SceneNode[]; selectId: string } {
  const pal = getXhsPalette(theme.palette);
  const ramp = xhsRamp(theme);
  const m = xhsContentMargin(theme.skin);
  const nodes: SceneNode[] = baseLayers(frameId, theme);
  let selectId = '';
  const push = (...ns: SceneNode[]) => {
    nodes.push(...ns);
  };

  switch (cardType) {
    case 'cover': {
      // Soft safe guides (very light)
      push(
        makeVeil(frameId, {
          x: 0,
          y: 0,
          width: XHS_W,
          height: Math.round(XHS_H * XHS_SAFE.top),
          fill: pal.ink,
          name: XHS_NAME.safe,
          opacity: 0.03,
        }),
        makeVeil(frameId, {
          x: 0,
          y: Math.round(XHS_H * (1 - XHS_SAFE.bottom)),
          width: XHS_W,
          height: Math.round(XHS_H * XHS_SAFE.bottom),
          fill: pal.ink,
          name: `${XHS_NAME.safe}2`,
          opacity: 0.03,
        }),
      );
      push(
        ...makePillBadge(frameId, {
          x: m,
          y: Math.round(XHS_H * 0.2),
          width: 128,
          height: 44,
          fill: pal.accent,
          label: 'HOT',
          labelColor: pal.bg,
          ramp,
        }),
      );
      const eyebrow = makeRoleText(
        frameId,
        'meta',
        'SAVE THIS  \u00b7  NOTE',
        m,
        Math.round(XHS_H * 0.28),
        ramp,
        {
          name: XHS_NAME.meta,
          color: pal.accent,
          bold: true,
          fontFamily: FONT_META,
          fontSize: 20,
        },
      );
      const isBig = theme.skin === 'bigType';
      const title = makeRoleText(
        frameId,
        'display',
        isBig ? '5 \u5206\u949f\n\u641e\u5b9a' : '5 \u5206\u949f\u641e\u5b9a',
        isBig ? XHS_W / 2 : m,
        Math.round(XHS_H * (isBig ? 0.46 : 0.4)),
        ramp,
        {
          name: XHS_NAME.title,
          align: isBig ? 'center' : 'left',
          color: pal.ink,
          fontFamily: xhsTitleFont(theme.skin),
          fontSize: titleSize(theme, isBig ? 1.15 : 0.95),
          bold: true,
          lineHeight: 1.15,
        },
      );
      push(
        makeAccentBar(frameId, {
          x: isBig ? XHS_W / 2 - 40 : m,
          y: Math.round(XHS_H * (isBig ? 0.62 : 0.52)),
          width: isBig ? 80 : 72,
          height: 10,
          fill: pal.accent,
        }),
      );
      const sub = makeRoleText(
        frameId,
        'body',
        '\u770b\u5b8c\u7701\u4e00\u534a\u529f\u592b\u00b7\u7167\u505a\u5c31\u884c',
        isBig ? XHS_W / 2 : m,
        Math.round(XHS_H * (isBig ? 0.68 : 0.58)),
        ramp,
        {
          name: XHS_NAME.body,
          align: isBig ? 'center' : 'left',
          color: pal.muted,
          fontFamily: xhsBodyFont(theme.skin),
          fontSize: ramp.body,
        },
      );
      const foot = makeRoleText(
        frameId,
        'caption',
        '\u6536\u85cf\u5907\u7528  \u00b7  \u6587\u5b57\u914d\u56fe',
        isBig ? XHS_W / 2 : m,
        Math.round(XHS_H * 0.84),
        ramp,
        {
          name: XHS_NAME.hint,
          align: isBig ? 'center' : 'left',
          color: pal.muted,
          fontFamily: FONT_META,
          fontSize: 18,
        },
      );
      push(eyebrow, title, sub, foot);
      selectId = title.id;
      break;
    }

    case 'body': {
      const title = makeRoleText(frameId, 'display', '\u5148\u8bb0\u8fd9\u4e09\u70b9', m, Math.round(XHS_H * 0.18), ramp, {
        name: XHS_NAME.title,
        color: pal.ink,
        fontFamily: xhsTitleFont(theme.skin),
        fontSize: titleSize(theme, 0.78),
        bold: true,
      });
      push(title, makeHairline(frameId, { x: m, y: Math.round(XHS_H * 0.24), width: 120, stroke: pal.accent }));
      const lineCopy = [
        { n: '01', t: '\u5148\u5217\u76ee\u6807\uff0c\u518d\u62c6\u6b65\u9aa4' },
        { n: '02', t: '\u9884\u7559\u7a7a\u767d\u534a\u5c0f\u65f6' },
        { n: '03', t: '\u665a\u4e0a\u53ea\u505a\u4e00\u4ef6\u4e8b' },
      ];
      lineCopy.forEach((row, i) => {
        const y = Math.round(XHS_H * 0.32) + i * 200;
        push(
          makeSurfaceCard(frameId, {
            x: m,
            y: y - 40,
            width: XHS_W - m * 2,
            height: 160,
            fill: pal.surface,
            radius: 18,
            name: '\u9762\u677f',
          }),
          ...makeNumberBadge(frameId, {
            x: m + 28,
            y: y - 8,
            size: 56,
            fill: pal.accent,
            ink: pal.bg,
            num: row.n,
            ramp,
            name: i === 0 ? XHS_NAME.accent : `${XHS_NAME.accent}${i + 1}`,
          }),
        );
        const item = makeRoleText(frameId, 'body', row.t, m + 108, y + 20, ramp, {
          name: `${XHS_NAME.item}${i + 1}`,
          color: pal.ink,
          fontFamily: xhsBodyFont(theme.skin),
          fontSize: Math.round(ramp.body * 1.05),
        });
        push(item);
      });
      selectId = title.id;
      break;
    }

    case 'plain': {
      const date = makeRoleText(frameId, 'meta', 'MEMO  \u00b7  TODAY', m, Math.round(XHS_H * 0.16), ramp, {
        name: XHS_NAME.meta,
        color: pal.accent,
        bold: true,
        fontFamily: FONT_META,
        fontSize: 18,
      });
      const body = makeRoleText(
        frameId,
        'script',
        '\u5199\u70b9\u6b64\u523b\u60f3\u8bf4\u7684\u2026\n\n\u6539\u5b57\u4f53\u3001\u6362\u98ce\u683c\u3001\u8c03\u884c\u8ddd\n\u6587\u5b57\u672c\u8eab\u5c31\u662f\u56fe\n\n\u6162\u6162\u6765\uff0c\u4e5f\u5f88\u5feb\u3002',
        m,
        Math.round(XHS_H * 0.3),
        ramp,
        {
          name: XHS_NAME.body,
          color: pal.ink,
          fontFamily: theme.skin === 'memoPaper' ? FONT_KAI : xhsBodyFont(theme.skin),
          fontSize: Math.round(ramp.script * 0.95),
          lineHeight: 1.65,
        },
      );
      const stroke = makeAccentStroke(frameId, {
        x: m,
        y: Math.round(XHS_H * 0.78),
        width: 220,
        amplitude: 10,
        waves: 1.2,
        stroke: pal.accent,
        strokeWidth: 2.5,
        name: XHS_NAME.accent,
      });
      push(date, body, stroke);
      selectId = body.id;
      break;
    }

    case 'summary': {
      push(
        makeSurfaceCard(frameId, {
          x: m,
          y: Math.round(XHS_H * 0.14),
          width: XHS_W - m * 2,
          height: Math.round(XHS_H * 0.68),
          fill: pal.surface,
          radius: 24,
        }),
        makeAccentBar(frameId, {
          x: m,
          y: Math.round(XHS_H * 0.14),
          width: 16,
          height: 140,
          fill: pal.accent,
        }),
      );
      const title = makeRoleText(
        frameId,
        'display',
        '\u91cd\u70b9\u603b\u7ed3',
        m + 48,
        Math.round(XHS_H * 0.22),
        ramp,
        {
          name: XHS_NAME.title,
          color: pal.ink,
          fontFamily: xhsTitleFont(theme.skin),
          fontSize: titleSize(theme, 0.72),
          bold: true,
        },
      );
      const points = [
        '\u25cf  \u6838\u5fc3\u4e00\u53e5\u8bdd\uff1a\u5148\u505a\u96be\u7684',
        '\u25cf  \u4e24\u4e2a\u5fc5\u505a\uff1a\u5217\u8868 + \u590d\u76d8',
        '\u25cf  \u4e00\u4e2a\u907f\u5751\uff1a\u522b\u540c\u65f6\u5f00\u59cb\u4e09\u4ef6',
        '\u25cf  \u6536\u85cf\u540e\u7167\u7740\u505a',
      ];
      points.forEach((t, i) => {
        push(
          makeRoleText(frameId, 'body', t, m + 48, Math.round(XHS_H * 0.36) + i * 100, ramp, {
            name: `${XHS_NAME.item}${i + 1}`,
            color: pal.ink,
            fontFamily: xhsBodyFont(theme.skin),
            fontSize: ramp.body,
          }),
        );
      });
      push(
        makeRoleText(frameId, 'caption', '\u53ef\u6536\u85cf\u5e72\u8d27', m + 48, Math.round(XHS_H * 0.78), ramp, {
          name: XHS_NAME.hint,
          color: pal.accent,
          fontFamily: FONT_META,
          bold: true,
          fontSize: 22,
        }),
      );
      push(title);
      selectId = title.id;
      break;
    }

    case 'tips': {
      const title = makeRoleText(frameId, 'display', '\u5b9e\u7528\u5c0f\u8d34\u58eb', m, Math.round(XHS_H * 0.14), ramp, {
        name: XHS_NAME.title,
        color: pal.ink,
        fontFamily: xhsTitleFont(theme.skin),
        fontSize: titleSize(theme, 0.72),
        bold: true,
      });
      push(title);
      const tips = [
        { h: 'TIP 01', b: '\u5148\u505a\u6700\u96be\u7684\u90a3\u4e00\u4ef6' },
        { h: 'TIP 02', b: '\u628a\u5927\u4efb\u52a1\u62c6\u6210 15 \u5206\u949f' },
        { h: 'TIP 03', b: '\u665a\u4e0a\u7559\u4e00\u5757\u4e0d\u5b89\u6392' },
      ];
      tips.forEach((tip, i) => {
        const y = Math.round(XHS_H * 0.26) + i * 240;
        push(
          makeSurfaceCard(frameId, {
            x: m,
            y,
            width: XHS_W - m * 2,
            height: 200,
            fill: pal.surface,
            radius: 20,
          }),
          ...makePillBadge(frameId, {
            x: m + 28,
            y: y + 28,
            width: 110,
            height: 40,
            fill: pal.accent,
            label: tip.h,
            labelColor: pal.bg,
            ramp,
            name: i === 0 ? XHS_NAME.accent : `${XHS_NAME.accent}${i + 1}`,
          }),
          makeRoleText(frameId, 'body', tip.b, m + 28, y + 120, ramp, {
            name: `${XHS_NAME.item}${i + 1}`,
            color: pal.ink,
            fontFamily: xhsBodyFont(theme.skin),
            fontSize: Math.round(ramp.body * 1.05),
          }),
        );
      });
      selectId = title.id;
      break;
    }

    case 'compare': {
      const title = makeRoleText(frameId, 'display', '\u5bf9\u6bd4\u53c2\u8003', m, Math.round(XHS_H * 0.12), ramp, {
        name: XHS_NAME.title,
        color: pal.ink,
        fontFamily: xhsTitleFont(theme.skin),
        fontSize: titleSize(theme, 0.68),
        bold: true,
      });
      const gap = 28;
      const colW = (XHS_W - m * 2 - gap) / 2;
      const y0 = Math.round(XHS_H * 0.22);
      const h = Math.round(XHS_H * 0.58);
      push(
        title,
        makeSurfaceCard(frameId, {
          x: m,
          y: y0,
          width: colW,
          height: h,
          fill: pal.surface,
          radius: 22,
          name: '\u9762\u677f',
        }),
        makeSurfaceCard(frameId, {
          x: m + colW + gap,
          y: y0,
          width: colW,
          height: h,
          fill: pal.surface,
          radius: 22,
          name: '\u9762\u677f2',
        }),
        ...makePillBadge(frameId, {
          x: XHS_W / 2 - 40,
          y: y0 + h / 2 - 40,
          width: 80,
          height: 80,
          fill: pal.accent,
          label: 'VS',
          labelColor: pal.bg,
          ramp,
        }),
      );
      const leftT = makeRoleText(frameId, 'display', 'Before', m + colW / 2, y0 + 80, ramp, {
        name: `${XHS_NAME.item}HeadL`,
        align: 'center',
        color: pal.muted,
        fontFamily: FONT_HEI,
        fontSize: 36,
        bold: true,
      });
      const rightT = makeRoleText(
        frameId,
        'display',
        'After',
        m + colW + gap + colW / 2,
        y0 + 80,
        ramp,
        {
          name: `${XHS_NAME.item}HeadR`,
          align: 'center',
          color: pal.accent,
          fontFamily: FONT_HEI,
          fontSize: 36,
          bold: true,
        },
      );
      const leftItems = ['\u76ee\u6807\u6a21\u7cca', '\u5bb9\u6613\u62d6\u5ef6', '\u6ca1\u6709\u590d\u76d8'];
      const rightItems = ['\u4e09\u4ef6\u5fc5\u505a', '\u9650\u65f6\u6267\u884c', '\u5f53\u5929\u590d\u76d8'];
      leftItems.forEach((t, i) => {
        push(
          makeRoleText(frameId, 'body', `\u00b7  ${t}`, m + 36, y0 + 200 + i * 90, ramp, {
            name: `${XHS_NAME.item}L${i + 1}`,
            color: pal.ink,
            fontFamily: xhsBodyFont(theme.skin),
            fontSize: 28,
          }),
        );
      });
      rightItems.forEach((t, i) => {
        push(
          makeRoleText(
            frameId,
            'body',
            `\u00b7  ${t}`,
            m + colW + gap + 36,
            y0 + 200 + i * 90,
            ramp,
            {
              name: `${XHS_NAME.item}R${i + 1}`,
              color: pal.ink,
              fontFamily: xhsBodyFont(theme.skin),
              fontSize: 28,
            },
          ),
        );
      });
      push(leftT, rightT);
      selectId = title.id;
      break;
    }

    case 'steps': {
      const title = makeRoleText(frameId, 'display', '\u4e09\u6b65\u8d70\u901a', m, Math.round(XHS_H * 0.12), ramp, {
        name: XHS_NAME.title,
        color: pal.ink,
        fontFamily: xhsTitleFont(theme.skin),
        fontSize: titleSize(theme, 0.72),
        bold: true,
      });
      push(title);
      // Vertical timeline rail
      push(
        makeVeil(frameId, {
          x: m + 34,
          y: Math.round(XHS_H * 0.26),
          width: 4,
          height: Math.round(XHS_H * 0.52),
          fill: pal.surface,
          name: `${XHS_NAME.accent}Rail`,
        }),
      );
      const steps = [
        { n: '1', t: '\u51c6\u5907\u6750\u6599', d: '\u6e05\u5355\u3001\u65f6\u95f4\u5757\u3001\u5de5\u5177' },
        { n: '2', t: '\u6309\u987a\u5e8f\u64cd\u4f5c', d: '\u4e00\u6b65\u4e00\u6b65\uff0c\u4e0d\u8df3\u6b65' },
        { n: '3', t: '\u68c0\u67e5\u4e0e\u590d\u76d8', d: '\u5f53\u5929\u6536\u5c3e\uff0c\u660e\u5929\u8f7b\u677e' },
      ];
      steps.forEach((s, i) => {
        const y = Math.round(XHS_H * 0.28) + i * 220;
        push(
          ...makeNumberBadge(frameId, {
            x: m + 8,
            y: y,
            size: 56,
            fill: pal.accent,
            ink: pal.bg,
            num: s.n,
            ramp,
            name: i === 0 ? XHS_NAME.accent : `${XHS_NAME.accent}${i + 1}`,
          }),
          makeRoleText(frameId, 'body', s.t, m + 92, y + 8, ramp, {
            name: `${XHS_NAME.item}${i + 1}`,
            color: pal.ink,
            fontFamily: xhsTitleFont(theme.skin),
            fontSize: Math.round(ramp.body * 1.15),
            bold: true,
          }),
          makeRoleText(frameId, 'caption', s.d, m + 92, y + 64, ramp, {
            name: `${XHS_NAME.hint}${i + 1}`,
            color: pal.muted,
            fontFamily: xhsBodyFont(theme.skin),
            fontSize: 24,
          }),
        );
      });
      selectId = title.id;
      break;
    }

    case 'stats': {
      const title = makeRoleText(frameId, 'display', '\u5173\u952e\u6570\u636e', m, Math.round(XHS_H * 0.12), ramp, {
        name: XHS_NAME.title,
        color: pal.ink,
        fontFamily: xhsTitleFont(theme.skin),
        fontSize: titleSize(theme, 0.7),
        bold: true,
      });
      push(title);
      const cells = [
        { n: '3', l: '\u4e2a\u6838\u5fc3\u8981\u70b9' },
        { n: '90%', l: '\u4eba\u8bb0\u5f97\u4f4f' },
        { n: '5', l: '\u5206\u949f\u8bfb\u5b8c' },
        { n: '1', l: '\u5f20\u53ef\u6267\u884c\u6e05\u5355' },
      ];
      // Bento-ish: first cell larger
      const layouts = [
        { x: m, y: Math.round(XHS_H * 0.22), w: XHS_W - m * 2, h: 280 },
        { x: m, y: Math.round(XHS_H * 0.22) + 300, w: (XHS_W - m * 2 - 20) / 2, h: 260 },
        {
          x: m + (XHS_W - m * 2 - 20) / 2 + 20,
          y: Math.round(XHS_H * 0.22) + 300,
          w: (XHS_W - m * 2 - 20) / 2,
          h: 260,
        },
        { x: m, y: Math.round(XHS_H * 0.22) + 580, w: XHS_W - m * 2, h: 260 },
      ];
      cells.forEach((c, i) => {
        const L = layouts[i]!;
        push(
          makeSurfaceCard(frameId, {
            x: L.x,
            y: L.y,
            width: L.w,
            height: L.h,
            fill: i === 0 ? pal.accent : pal.surface,
            radius: 22,
            name: i === 0 ? XHS_NAME.accent : '\u9762\u677f',
          }),
          makeRoleText(frameId, 'display', c.n, L.x + L.w / 2, L.y + L.h * 0.42, ramp, {
            name: i === 0 ? XHS_NAME.title : `${XHS_NAME.item}${i}`,
            align: 'center',
            color: i === 0 ? pal.bg : pal.accent,
            fontFamily: FONT_HEI,
            fontSize: i === 0 ? 96 : 72,
            bold: true,
          }),
          makeRoleText(frameId, 'caption', c.l, L.x + L.w / 2, L.y + L.h * 0.72, ramp, {
            name: `${XHS_NAME.hint}${i}`,
            align: 'center',
            color: i === 0 ? pal.bg : pal.muted,
            fontFamily: FONT_META,
            fontSize: 24,
          }),
        );
      });
      selectId = title.id;
      break;
    }

    case 'faq': {
      const title = makeRoleText(frameId, 'display', '\u5e38\u89c1\u95ee\u7b54', m, Math.round(XHS_H * 0.12), ramp, {
        name: XHS_NAME.title,
        color: pal.ink,
        fontFamily: xhsTitleFont(theme.skin),
        fontSize: titleSize(theme, 0.7),
        bold: true,
      });
      push(title);
      const pairs = [
        { q: '\u9700\u8981\u51c6\u5907\u4ec0\u4e48\uff1f', a: '\u53ea\u8981\u624b\u673a\u548c 5 \u5206\u949f\u5373\u53ef\u3002' },
        { q: '\u9002\u5408\u65b0\u624b\u5417\uff1f', a: '\u9002\u5408\u3002\u7167\u6b65\u9aa4\u505a\uff0c\u4e0d\u9700\u8981\u7ecf\u9a8c\u3002' },
        { q: '\u591a\u4e45\u80fd\u770b\u5230\u6548\u679c\uff1f', a: '\u5f53\u5929\u5c31\u80fd\u5b8c\u6210\u4e00\u7248\u53ef\u53d1\u5e03\u7a3f\u3002' },
      ];
      pairs.forEach((p, i) => {
        const y = Math.round(XHS_H * 0.24) + i * 280;
        push(
          makeSurfaceCard(frameId, {
            x: m,
            y,
            width: XHS_W - m * 2,
            height: 240,
            fill: pal.surface,
            radius: 20,
          }),
          ...makePillBadge(frameId, {
            x: m + 28,
            y: y + 28,
            width: 56,
            height: 40,
            fill: pal.accent,
            label: 'Q',
            labelColor: pal.bg,
            ramp,
            name: i === 0 ? XHS_NAME.accent : `${XHS_NAME.accent}${i + 1}`,
          }),
          makeRoleText(frameId, 'body', p.q, m + 100, y + 48, ramp, {
            name: `${XHS_NAME.item}${i * 2 + 1}`,
            color: pal.ink,
            fontFamily: xhsTitleFont(theme.skin),
            fontSize: 30,
            bold: true,
          }),
          makeRoleText(frameId, 'body', `A  ${p.a}`, m + 28, y + 130, ramp, {
            name: `${XHS_NAME.item}${i * 2 + 2}`,
            color: pal.muted,
            fontFamily: xhsBodyFont(theme.skin),
            fontSize: 26,
            lineHeight: 1.4,
          }),
        );
      });
      selectId = title.id;
      break;
    }

    case 'checklist': {
      const title = makeRoleText(frameId, 'display', '\u51fa\u95e8\u524d\u68c0\u67e5', m, Math.round(XHS_H * 0.12), ramp, {
        name: XHS_NAME.title,
        color: pal.ink,
        fontFamily: xhsTitleFont(theme.skin),
        fontSize: titleSize(theme, 0.7),
        bold: true,
      });
      // Progress strip
      push(
        title,
        makeSurfaceCard(frameId, {
          x: m,
          y: Math.round(XHS_H * 0.2),
          width: XHS_W - m * 2,
          height: 16,
          fill: pal.surface,
          radius: 8,
        }),
        makeAccentBar(frameId, {
          x: m,
          y: Math.round(XHS_H * 0.2),
          width: Math.round((XHS_W - m * 2) * 0.35),
          height: 16,
          fill: pal.accent,
        }),
      );
      const items = [
        '\u5145\u7535 / \u94b1\u5305 / \u94a5\u5319',
        '\u4eca\u65e5\u4e09\u4ef6\u5fc5\u505a',
        '\u4f1a\u8bae\u524d 10 \u5206\u949f\u5230',
        '\u7761\u524d\u6536\u62fe\u684c\u9762',
        '\u660e\u5929\u7b2c\u4e00\u4ef6\u4e8b\u5199\u4e0b',
      ];
      items.forEach((t, i) => {
        const y = Math.round(XHS_H * 0.3) + i * 140;
        push(
          makeSurfaceCard(frameId, {
            x: m,
            y: y - 24,
            width: XHS_W - m * 2,
            height: 112,
            fill: pal.surface,
            radius: 16,
          }),
          makeCheckBox(frameId, {
            x: m + 32,
            y: y + 8,
            size: 40,
            stroke: pal.accent,
          }),
          makeRoleText(frameId, 'body', t, m + 100, y + 28, ramp, {
            name: `${XHS_NAME.item}${i + 1}`,
            color: pal.ink,
            fontFamily: xhsBodyFont(theme.skin),
            fontSize: Math.round(ramp.body * 1.05),
          }),
        );
      });
      selectId = title.id;
      break;
    }

    case 'quote': {
      const mark = makeRoleText(frameId, 'display', '\u201c', m, Math.round(XHS_H * 0.26), ramp, {
        name: `${XHS_NAME.meta}Q`,
        color: pal.accent,
        fontFamily: FONT_SONG,
        fontSize: 160,
        bold: true,
      });
      mark.opacity = 0.85;
      const body = makeRoleText(
        frameId,
        'serifQuote',
        '\u628a\u4e00\u53e5\u60f3\u8bf4\u7684\u8bdd\n\u7559\u5728\u8fd9\u91cc',
        m,
        Math.round(XHS_H * 0.42),
        ramp,
        {
          name: XHS_NAME.body,
          color: pal.ink,
          fontFamily: theme.skin === 'memoPaper' ? FONT_KAI : FONT_SONG,
          fontSize: Math.round(ramp.serifQuote * 1.15),
          lineHeight: 1.45,
        },
      );
      push(
        mark,
        body,
        makeAccentBar(frameId, {
          x: m,
          y: Math.round(XHS_H * 0.68),
          width: 80,
          height: 8,
          fill: pal.accent,
        }),
        makeRoleText(frameId, 'caption', '\u2014  \u4eca\u65e5\u7b14\u8bb0', m, Math.round(XHS_H * 0.74), ramp, {
          name: XHS_NAME.hint,
          color: pal.muted,
          fontFamily: FONT_META,
          fontSize: 22,
        }),
      );
      // Soft script watermark
      const wm = makeRoleText(frameId, 'script', '\u5ff5', XHS_W - 160, Math.round(XHS_H * 0.55), ramp, {
        name: `${XHS_NAME.meta}Wm`,
        color: pal.accent,
        fontFamily: FONT_XING,
        fontSize: 180,
        align: 'center',
      });
      wm.opacity = 0.1;
      wm.locked = true;
      push(wm);
      selectId = body.id;
      break;
    }

    case 'ending': {
      push(
        makeSurfaceCard(frameId, {
          x: m,
          y: Math.round(XHS_H * 0.28),
          width: XHS_W - m * 2,
          height: Math.round(XHS_H * 0.42),
          fill: pal.surface,
          radius: 28,
        }),
        makeAccentBar(frameId, {
          x: XHS_W / 2 - 36,
          y: Math.round(XHS_H * 0.34),
          width: 72,
          height: 8,
          fill: pal.accent,
        }),
      );
      const title = makeRoleText(
        frameId,
        'display',
        '\u8d5e \u00b7 \u6536\u85cf \u00b7 \u5173\u6ce8',
        XHS_W / 2,
        Math.round(XHS_H * 0.44),
        ramp,
        {
          name: XHS_NAME.title,
          align: 'center',
          color: pal.ink,
          fontFamily: xhsTitleFont(theme.skin),
          fontSize: titleSize(theme, 0.62),
          bold: true,
        },
      );
      const body = makeRoleText(
        frameId,
        'body',
        '\u6b22\u8fce\u5728\u8bc4\u8bba\u533a\u4ea4\u6d41\u4f60\u7684\u770b\u6cd5',
        XHS_W / 2,
        Math.round(XHS_H * 0.54),
        ramp,
        {
          name: XHS_NAME.body,
          align: 'center',
          color: pal.muted,
          fontFamily: xhsBodyFont(theme.skin),
          fontSize: ramp.body,
        },
      );
      push(
        title,
        body,
        ...makePillBadge(frameId, {
          x: XHS_W / 2 - 140,
          y: Math.round(XHS_H * 0.78),
          width: 280,
          height: 72,
          fill: pal.accent,
          label: '\u5173\u6ce8\u6211\u00b7\u4e0b\u671f\u89e3\u9501',
          labelColor: pal.bg,
          ramp,
        }),
      );
      selectId = title.id;
      break;
    }

    default: {
      const _e: never = cardType;
      void _e;
    }
  }

  return { nodes, selectId: selectId || nodes[nodes.length - 1]!.id };
}

export function buildXhsCardDocument(
  cardType: XhsCardTypeId,
  themePartial?: Partial<XhsTheme>,
  docName?: string,
): StudioDocument {
  const theme = resolveXhsTheme(themePartial);
  const meta = getXhsCardType(cardType);
  const pal = getXhsPalette(theme.palette);
  const { doc, frameId } = emptyDoc(docName ?? meta.label, 'xhsNote');
  const frame = makeFrame(frameId, XHS_W, XHS_H, xhsFrameName(cardType), pal.bg);
  doc.pages[0]!.name = meta.label;
  const { nodes, selectId } = buildXhsCardNodes(frameId, cardType, theme);
  putAttach(doc, frame, nodes, selectId);
  return doc;
}

export function buildXhsSuiteDocument(
  cardTypes: XhsCardTypeId[],
  themePartial?: Partial<XhsTheme>,
  docName = '\u5c0f\u7ea2\u4e66\u7b14\u8bb0',
): StudioDocument {
  const theme = resolveXhsTheme(themePartial);
  const types = cardTypes.length ? cardTypes : (['cover', 'body', 'ending'] as XhsCardTypeId[]);
  const first = types[0]!;
  const doc = buildXhsCardDocument(first, theme, docName);
  for (let i = 1; i < types.length; i++) {
    const ct = types[i]!;
    const meta = getXhsCardType(ct);
    const pal = getXhsPalette(theme.palette);
    const { frameId } = addPageWithFrame(doc, {
      name: meta.label,
      width: XHS_W,
      height: XHS_H,
      fill: pal.bg,
      activate: false,
    });
    const frame = doc.nodes[frameId] as FrameNode;
    frame.name = xhsFrameName(ct);
    const { nodes } = buildXhsCardNodes(frameId, ct, theme);
    for (const n of nodes) doc.nodes[n.id] = n;
    frame.children = nodes.map((n) => n.id);
  }
  doc.activePageId = doc.pages[0]!.id;
  applyXhsTheme(doc, theme);
  return doc;
}

export const XHS_SUITE_PRESETS: {
  id: string;
  name: string;
  description: string;
  cardTypes: XhsCardTypeId[];
  theme?: Partial<XhsTheme>;
}[] = [
  {
    id: 'guide',
    name: '\u653b\u7565\u6210\u5957',
    description: '\u5c01\u9762\u2192\u603b\u7ed3\u2192\u6b65\u9aa4\u2192\u7ed3\u5c3e',
    cardTypes: ['cover', 'summary', 'steps', 'ending'],
    theme: { skin: 'classic', palette: 'peach', bg: 'solid', typeScale: 'md' },
  },
  {
    id: 'checklist',
    name: '\u6e05\u5355\u6210\u5957',
    description: '\u5c01\u9762\u2192\u6e05\u5355\u2192\u8d34\u58eb\u2192\u7ed3\u5c3e',
    cardTypes: ['cover', 'checklist', 'tips', 'ending'],
    theme: { skin: 'memoPaper', palette: 'amber', bg: 'rules', typeScale: 'md' },
  },
  {
    id: 'quoteNight',
    name: '\u91d1\u53e5\u591c\u8272',
    description: '\u5927\u5b57\u5c01\u9762\u2192\u91d1\u53e5\u2192\u7ed3\u5c3e',
    cardTypes: ['cover', 'quote', 'ending'],
    theme: { skin: 'bigType', palette: 'night', bg: 'solid', typeScale: 'lg' },
  },
];
