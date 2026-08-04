/**
 * Xiaohongshu visual-signature builtins — composition recipes + stock photos.
 * Strong local palettes; do not run through applyXhsTheme.
 */

import type { FrameNode, SceneNode, StudioDocument } from '../model';
import { emptyDoc, makeFrame, makeShape } from '../scenes/helpers';
import type { BuiltinBuildContext, BuiltinTemplate } from './types';
import { loadTemplateAsset, makeCoverImage, makeImageInRect } from './templateAssets';
import { makeAccentStroke, makeVeil } from './templateCraft';
import { makeRoleText, withHalo } from './templateType';
import { makeAccentBar, makeNumberBadge, makePillBadge } from './xhsCraft';
import {
  FONT_HEI,
  FONT_KAI,
  FONT_LATIN_DISPLAY,
  FONT_LATIN_SERIF,
  FONT_META,
  FONT_SANS,
  FONT_XING,
  XHS_SIG_H,
  XHS_SIG_RAMP,
  XHS_SIG_W,
  makeChecklistRows,
  makeCompareTable,
  makeGlassPanel,
  makeHotBadge,
  makeOutlinedDisplayText,
  makePhotoGrid,
  makePolaroid,
  makePriceModule,
  makeTapeStrip,
  makeTornBand,
  makeVideoChrome,
} from './xhsComposition';
import { XHS_JOURNAL_SIGNATURES } from './xhsJournalSignatures';

export type XhsSignatureCategory =
  | 'plog'
  | 'vibe'
  | 'travel'
  | 'knowledge'
  | 'review'
  | 'promo'
  | 'scrapbook'
  | 'cnAesthetic';

const CAT_TAG: Record<XhsSignatureCategory, string> = {
  plog: '\u751f\u6d3b',
  vibe: '\u6c1b\u56f4',
  travel: '\u65c5\u884c',
  knowledge: '\u77e5\u8bc6',
  review: '\u79cd\u8349',
  promo: '\u79cd\u8349',
  scrapbook: '\u624b\u8d26',
  cnAesthetic: '\u56fd\u98ce',
};

function put(doc: StudioDocument, nodes: SceneNode[]): void {
  for (const n of nodes) doc.nodes[n.id] = n;
}

function finish(doc: StudioDocument, frame: FrameNode, nodes: SceneNode[]): StudioDocument {
  frame.children.push(...nodes.map((n) => n.id));
  put(doc, [frame, ...nodes]);
  return doc;
}

function sigMeta(
  id: string,
  name: string,
  description: string,
  category: XhsSignatureCategory,
  extraTags: string[] = [],
): Pick<BuiltinTemplate, 'id' | 'name' | 'description' | 'sceneId' | 'tags'> {
  return {
    id: `builtin-xhs-${id}`,
    name,
    description,
    sceneId: 'xhsNote',
    tags: ['\u7b7e\u540d', CAT_TAG[category], '摄影', ...extraTags],
  };
}

/* 1 — triptych plog */
const sigPlogTriptych: BuiltinTemplate = {
  ...sigMeta(
    'sig-plog-triptych',
    '\u4e09\u6a2a\u6761 · Plog',
    '\u4e09\u69fd\u751f\u6d3b\u611f\u62fc\u8d34 + \u4e2d\u5e26\u6807\u9898',
    'plog',
  ),
  build: async ({ assets }: BuiltinBuildContext) => {
    const W = XHS_SIG_W;
    const H = XHS_SIG_H;
    const { doc, frameId } = emptyDoc('\u4e09\u6a2a\u6761 Plog', 'xhsNote');
    const frame = makeFrame(frameId, W, H, '\u7b14\u8bb0', '#1A1510');
    const a = await loadTemplateAsset('food');
    const b = await loadTemplateAsset('flowers');
    const c = await loadTemplateAsset('still');
    const gap = 10;
    const band = (H - gap * 2) / 3;
    const nodes: SceneNode[] = [
      makeImageInRect(frameId, assets, a, 0, 0, W, band, { name: '\u69fd\u4f4d1', locked: true }),
      makeImageInRect(frameId, assets, b, 0, band + gap, W, band, { name: '\u69fd\u4f4d2', locked: true }),
      makeImageInRect(frameId, assets, c, 0, (band + gap) * 2, W, band, {
        name: '\u69fd\u4f4d3',
        locked: true,
      }),
      makeGlassPanel(frameId, {
        x: 72,
        y: band + gap + band / 2 - 56,
        width: W - 144,
        height: 112,
        fill: 'rgba(255,248,236,0.88)',
        radius: 16,
      }),
      makeRoleText(frameId, 'display', '\u4eca\u65e5\u4efd\u751f\u6d3b', W / 2, band + gap + band / 2 - 8, XHS_SIG_RAMP, {
        name: '\u6807\u9898',
        align: 'center',
        color: '#1A1510',
        fontFamily: FONT_HEI,
        fontSize: 48,
        bold: true,
      }),
      makeRoleText(frameId, 'meta', '#Plog  ·  slow afternoon', W / 2, band + gap + band / 2 + 36, XHS_SIG_RAMP, {
        name: '\u526f\u6807',
        align: 'center',
        color: 'rgba(26,21,16,0.55)',
        fontFamily: FONT_META,
        fontSize: 20,
      }),
      ...makeHotBadge(frameId, 48, 48),
    ];
    return finish(doc, frame, nodes);
  },
};

/* 2 — vibe ocean script */
const sigVibeScriptOcean: BuiltinTemplate = {
  ...sigMeta(
    'sig-vibe-script-ocean',
    '\u6d77\u98ce\u8349\u4e66 · \u5c01\u9762',
    '\u5168\u51fa\u8840\u6d77\u666f + \u8349\u4e66\u94a9\u5b50 + \u89c6\u9891\u793a\u610f',
    'vibe',
  ),
  build: async ({ assets }: BuiltinBuildContext) => {
    const W = XHS_SIG_W;
    const H = XHS_SIG_H;
    const { doc, frameId } = emptyDoc('\u6d77\u98ce\u8349\u4e66', 'xhsNote');
    const frame = makeFrame(frameId, W, H, '\u7b14\u8bb0', '#0A1A24');
    const photo = await loadTemplateAsset('ocean');
    const nodes: SceneNode[] = [
      makeCoverImage(frameId, assets, photo, W, H, { name: '\u5e95\u56fe', locked: true }),
      makeVeil(frameId, {
        x: 0,
        y: 0,
        width: W,
        height: H,
        fill: 'rgba(8,24,36,0.22)',
        name: '\u8499\u7248',
      }),
      withHalo(
        makeRoleText(frameId, 'script', 'Follow Me', W / 2, H * 0.38, XHS_SIG_RAMP, {
          name: '\u6807\u9898',
          align: 'center',
          color: '#FFF8EC',
          fontFamily: FONT_XING,
          fontSize: 96,
        }),
        'rgba(10,26,36,0.45)',
        4,
      ),
      withHalo(
        makeRoleText(frameId, 'fang', '\u8ddf\u6211\u53bb\u770b\u6d77', W / 2, H * 0.38 + 90, XHS_SIG_RAMP, {
          name: '\u526f\u6807',
          align: 'center',
          color: 'rgba(255,248,236,0.88)',
          fontFamily: FONT_KAI,
          fontSize: 32,
        }),
        'rgba(10,26,36,0.4)',
        3,
      ),
      ...makeVideoChrome(frameId, { ink: 'rgba(255,248,236,0.92)' }),
    ];
    return finish(doc, frame, nodes);
  },
};

/* 3 — type collision FREEDOM field */
const sigTypeCollisionField: BuiltinTemplate = {
  ...sigMeta(
    'sig-type-collision-field',
    '\u5de8\u5b57\u649e\u8272\u573a',
    '\u62c9\u4e01\u5de8\u5b57\u5e95\u5c42 + \u4e2d\u6587\u94a9\u5b50\u524d\u666f',
    'vibe',
  ),
  build: async ({ assets }: BuiltinBuildContext) => {
    const W = XHS_SIG_W;
    const H = XHS_SIG_H;
    const { doc, frameId } = emptyDoc('\u5de8\u5b57\u649e\u8272\u573a', 'xhsNote');
    const frame = makeFrame(frameId, W, H, '\u7b14\u8bb0', '#1C1410');
    const photo = await loadTemplateAsset('desert');
    const nodes: SceneNode[] = [
      makeCoverImage(frameId, assets, photo, W, H, { name: '\u5e95\u56fe', locked: true }),
      makeVeil(frameId, {
        x: 0,
        y: 0,
        width: W,
        height: H,
        fill: 'rgba(28,20,16,0.35)',
        name: '\u8499\u7248',
      }),
      makeRoleText(frameId, 'latinDisplay', 'FREEDOM', W / 2, H * 0.42, XHS_SIG_RAMP, {
        name: '\u5e95\u5b57',
        align: 'center',
        color: 'rgba(255,248,236,0.18)',
        fontFamily: FONT_LATIN_DISPLAY,
        fontSize: 140,
        bold: true,
      }),
      makeOutlinedDisplayText(frameId, '\u5927\u80c6\u6d3b', W / 2, H * 0.48, {
        fontSize: 88,
        color: '#FFF8EC',
        strokeColor: '#1C1410',
        strokeWidth: 8,
        fontFamily: FONT_HEI,
        align: 'center',
        name: '\u6807\u9898',
      }),
      makeRoleText(frameId, 'meta', 'BOLD LIVING  ·  THIS YEAR', W / 2, H * 0.48 + 80, XHS_SIG_RAMP, {
        name: '\u526f\u6807',
        align: 'center',
        color: '#F5D400',
        fontFamily: FONT_META,
        fontSize: 22,
        bold: true,
      }),
    ];
    return finish(doc, frame, nodes);
  },
};

/* 4 — polaroid scrapbook */
const sigScrapPolaroid: BuiltinTemplate = {
  ...sigMeta(
    'sig-scrap-polaroid',
    '\u5b9d\u4e3d\u6765\u62fc\u8d34',
    '\u767d\u8fb9\u76f8\u6846 + \u80f6\u5e26 + \u8d34\u7eb8',
    'scrapbook',
  ),
  build: async ({ assets }: BuiltinBuildContext) => {
    const W = XHS_SIG_W;
    const H = XHS_SIG_H;
    const bone = '#F7EFE4';
    const ink = '#2A1F18';
    const tape = '#E8B4A0';
    const { doc, frameId } = emptyDoc('\u5b9d\u4e3d\u6765\u62fc\u8d34', 'xhsNote');
    const frame = makeFrame(frameId, W, H, '\u7b14\u8bb0', bone);
    const a = await loadTemplateAsset('flowers');
    const b = await loadTemplateAsset('food');
    const c = await loadTemplateAsset('portrait');
    const nodes: SceneNode[] = [
      makeVeil(frameId, { x: 0, y: 0, width: W, height: H, fill: bone, name: '\u5e95\u573a' }),
      ...makePolaroid(frameId, assets, a, {
        x: 80,
        y: 160,
        width: 420,
        height: 520,
        deg: -6,
        slotName: '\u69fd\u4f4d1',
      }),
      ...makePolaroid(frameId, assets, b, {
        x: 520,
        y: 280,
        width: 400,
        height: 480,
        deg: 5,
        slotName: '\u69fd\u4f4d2',
      }),
      ...makePolaroid(frameId, assets, c, {
        x: 280,
        y: 720,
        width: 460,
        height: 540,
        deg: -2,
        slotName: '\u69fd\u4f4d3',
      }),
      makeTapeStrip(frameId, { x: 200, y: 140, width: 220, height: 40, fill: tape, deg: -18 }),
      makeTapeStrip(frameId, { x: 640, y: 260, width: 180, height: 36, fill: '#A8C5B0', deg: 12 }),
      ...makePillBadge(frameId, {
        x: 72,
        y: 72,
        width: 160,
        height: 44,
        fill: ink,
        label: 'Love Story',
        labelColor: bone,
        ramp: XHS_SIG_RAMP,
        name: '\u6807\u7b7e',
      }),
      makeRoleText(frameId, 'display', '\u4eca\u65e5\u4efd\u6d6a\u6f2b', 72, H - 100, XHS_SIG_RAMP, {
        name: '\u6807\u9898',
        color: ink,
        fontFamily: FONT_HEI,
        fontSize: 52,
        bold: true,
      }),
      makeRoleText(frameId, 'caption', 'scrapbook diary', 72, H - 48, XHS_SIG_RAMP, {
        name: '\u526f\u6807',
        color: 'rgba(42,31,24,0.55)',
        fontFamily: FONT_LATIN_SERIF,
        fontSize: 22,
      }),
    ];
    return finish(doc, frame, nodes);
  },
};

/* 5 — quote dock mid band */
const sigQuoteDock: BuiltinTemplate = {
  ...sigMeta(
    'sig-quote-dock',
    '\u4e2d\u90e8\u5206\u5272\u57e0',
    '\u4e0a\u4e0b\u56fe + \u4e2d\u5e26\u73bb\u7483\u57e0\u91d1\u53e5',
    'vibe',
  ),
  build: async ({ assets }: BuiltinBuildContext) => {
    const W = XHS_SIG_W;
    const H = XHS_SIG_H;
    const { doc, frameId } = emptyDoc('\u4e2d\u90e8\u5206\u5272\u57e0', 'xhsNote');
    const frame = makeFrame(frameId, W, H, '\u7b14\u8bb0', '#1A2018');
    const top = await loadTemplateAsset('forest');
    const bot = await loadTemplateAsset('mist');
    const dockH = 280;
    const dockY = (H - dockH) / 2;
    const nodes: SceneNode[] = [
      makeImageInRect(frameId, assets, top, 0, 0, W, dockY, { name: '\u69fd\u4f4d1', locked: true }),
      makeImageInRect(frameId, assets, bot, 0, dockY + dockH, W, H - dockY - dockH, {
        name: '\u69fd\u4f4d2',
        locked: true,
      }),
      ...makeTornBand(frameId, {
        x: 0,
        y: dockY,
        width: W,
        height: dockH,
        fill: '#E8EFE4',
        name: '\u6495\u7eb8\u5e26',
      }),
      makeRoleText(frameId, 'script', '\u7b49\u98ce\u6765', W / 2, dockY + 100, XHS_SIG_RAMP, {
        name: '\u6807\u9898',
        align: 'center',
        color: '#1A2018',
        fontFamily: FONT_XING,
        fontSize: 72,
      }),
      makeRoleText(
        frameId,
        'fang',
        '\u5728\u516c\u56ed\u5750\u4e00\u4e0b\u5348\u7684\u65e5\u5b50',
        W / 2,
        dockY + 180,
        XHS_SIG_RAMP,
        {
          name: '\u526f\u6807',
          align: 'center',
          color: 'rgba(26,32,24,0.65)',
          fontFamily: FONT_KAI,
          fontSize: 26,
        },
      ),
    ];
    return finish(doc, frame, nodes);
  },
};

/* 6 — fitness grid dark */
const sigGridFitness: BuiltinTemplate = {
  ...sigMeta(
    'sig-grid-fitness',
    '\u5065\u8eab\u7f51\u683c · Train',
    '\u6df1\u8272 1 \u5927\u56fe + 2\u00d72 \u7f51\u683c',
    'plog',
  ),
  build: async ({ assets }: BuiltinBuildContext) => {
    const W = XHS_SIG_W;
    const H = XHS_SIG_H;
    const ink = '#0E0E10';
    const bone = '#F2F0EA';
    const accent = '#C8F542';
    const { doc, frameId } = emptyDoc('\u5065\u8eab\u7f51\u683c', 'xhsNote');
    const frame = makeFrame(frameId, W, H, '\u7b14\u8bb0', ink);
    const hero = await loadTemplateAsset('street');
    const g1 = await loadTemplateAsset('concrete');
    const g2 = await loadTemplateAsset('bridge');
    const g3 = await loadTemplateAsset('city');
    const g4 = await loadTemplateAsset('architecture');
    const pad = 40;
    const heroH = 620;
    const nodes: SceneNode[] = [
      makeVeil(frameId, { x: 0, y: 0, width: W, height: H, fill: ink, name: '\u5e95\u573a' }),
      makeImageInRect(frameId, assets, hero, pad, 120, W - pad * 2, heroH, {
        name: '\u69fd\u4f4d1',
        mask: 'roundRect',
        maskRadius: 12,
        locked: true,
      }),
      ...makePhotoGrid(frameId, assets, [g1, g2, g3, g4], {
        x: pad,
        y: 120 + heroH + 20,
        width: W - pad * 2,
        height: 420,
        cols: 2,
        rows: 2,
        gap: 12,
        radius: 10,
      }),
      makeRoleText(frameId, 'latinDisplay', 'TRAIN', pad, 56, XHS_SIG_RAMP, {
        name: '\u6807\u9898',
        color: accent,
        fontFamily: FONT_LATIN_DISPLAY,
        fontSize: 48,
        bold: true,
      }),
      makeRoleText(frameId, 'meta', '\u672c\u5468\u8bad\u7ec3\u8bb0\u5f55', W - pad, 64, XHS_SIG_RAMP, {
        name: '\u526f\u6807',
        align: 'right',
        color: bone,
        fontFamily: FONT_META,
        fontSize: 20,
      }),
    ];
    return finish(doc, frame, nodes);
  },
};

/* 7 — vlog burst outlined type */
const sigVlogBurst: BuiltinTemplate = {
  ...sigMeta(
    'sig-vlog-burst',
    '\u63cf\u8fb9\u5927\u5b57 · Vlog',
    '\u63cf\u8fb9\u5de8\u5b57 + \u4e2d\u5fc3\u4eba\u50cf\u69fd',
    'vibe',
  ),
  build: async ({ assets }: BuiltinBuildContext) => {
    const W = XHS_SIG_W;
    const H = XHS_SIG_H;
    const { doc, frameId } = emptyDoc('\u63cf\u8fb9\u5927\u5b57 Vlog', 'xhsNote');
    const frame = makeFrame(frameId, W, H, '\u7b14\u8bb0', '#120F14');
    const photo = await loadTemplateAsset('portrait');
    const field = await loadTemplateAsset('neon');
    const nodes: SceneNode[] = [
      makeCoverImage(frameId, assets, field, W, H, { name: '\u5e95\u56fe', locked: true, opacity: 0.55 }),
      makeVeil(frameId, {
        x: 0,
        y: 0,
        width: W,
        height: H,
        fill: 'rgba(18,15,20,0.45)',
        name: '\u8499\u7248',
      }),
      makeImageInRect(frameId, assets, photo, W / 2 - 240, H / 2 - 300, 480, 600, {
        name: '\u69fd\u4f4d1',
        mask: 'roundRect',
        maskRadius: 20,
        locked: true,
      }),
      makeOutlinedDisplayText(frameId, 'VLOG', W / 2, 160, {
        fontSize: 120,
        color: 'rgba(0,0,0,0)',
        strokeColor: '#FFF8EC',
        strokeWidth: 5,
        fontFamily: FONT_LATIN_DISPLAY,
        align: 'center',
        name: '\u6807\u9898',
      }),
      makeRoleText(frameId, 'display', '\u4eca\u5929\u4e5f\u8981\u51fa\u95e8', W / 2, H - 160, XHS_SIG_RAMP, {
        name: '\u526f\u6807',
        align: 'center',
        color: '#FFF8EC',
        fontFamily: FONT_HEI,
        fontSize: 40,
        bold: true,
      }),
      ...makeVideoChrome(frameId),
    ];
    return finish(doc, frame, nodes);
  },
};

/* 8 — travel checklist */
const sigChecklistTravel: BuiltinTemplate = {
  ...sigMeta(
    'sig-checklist-travel',
    '\u65c5\u884c\u6e05\u5355\u5361',
    '\u9876\u56fe + \u6e05\u5355\u4fe1\u606f\u5361',
    'travel',
    ['\u77e5\u8bc6'],
  ),
  build: async ({ assets }: BuiltinBuildContext) => {
    const W = XHS_SIG_W;
    const H = XHS_SIG_H;
    const surface = '#FFF8EC';
    const ink = '#1A1510';
    const accent = '#E85D4C';
    const { doc, frameId } = emptyDoc('\u65c5\u884c\u6e05\u5355', 'xhsNote');
    const frame = makeFrame(frameId, W, H, '\u7b14\u8bb0', '#2A4A5A');
    const photo = await loadTemplateAsset('alpine');
    const nodes: SceneNode[] = [
      makeImageInRect(frameId, assets, photo, 0, 0, W, 520, { name: '\u5e95\u56fe', locked: true }),
      makeVeil(frameId, {
        x: 0,
        y: 420,
        width: W,
        height: H - 420,
        fill: surface,
        name: '\u4fe1\u606f\u5361',
      }),
      makeAccentBar(frameId, { x: 56, y: 460, width: 72, height: 10, fill: accent }),
      makeRoleText(frameId, 'display', '\u590f\u5b63\u65c5\u884c\u5fc5\u5907', 56, 520, XHS_SIG_RAMP, {
        name: '\u6807\u9898',
        color: ink,
        fontFamily: FONT_HEI,
        fontSize: 52,
        bold: true,
      }),
      makeRoleText(frameId, 'caption', 'pack list · before you go', 56, 580, XHS_SIG_RAMP, {
        name: '\u526f\u6807',
        color: 'rgba(26,21,16,0.5)',
        fontFamily: FONT_META,
        fontSize: 20,
      }),
      ...makeChecklistRows(frameId, {
        x: 56,
        y: 660,
        width: W - 112,
        items: [
          '\u9632\u6652\u971c + \u592a\u9633\u955c',
          '\u8f7b\u4fbf\u978b + \u5907\u7528\u889c',
          '\u5145\u7535\u5b9d / \u8f6c\u6362\u5934',
          '\u5c0f\u836f\u5305\u4e0e\u9632\u8679\u55b7\u96fe',
          '\u8eab\u4efd\u8bc1\u590d\u5370\u4ef6',
        ],
        ink,
        accent,
      }),
    ];
    return finish(doc, frame, nodes);
  },
};

/* 9 — compare table */
const sigCompareTable: BuiltinTemplate = {
  ...sigMeta(
    'sig-compare-table',
    '\u56db\u5217\u6d4b\u8bc4\u8868',
    '\u9876\u56fe\u884c + \u5c5e\u6027\u5bf9\u6bd4\u7f51\u683c',
    'review',
  ),
  build: async ({ assets }: BuiltinBuildContext) => {
    const W = XHS_SIG_W;
    const H = XHS_SIG_H;
    const surface = '#FFFCF7';
    const ink = '#1A1510';
    const accent = '#C45C26';
    const { doc, frameId } = emptyDoc('\u56db\u5217\u6d4b\u8bc4', 'xhsNote');
    const frame = makeFrame(frameId, W, H, '\u7b14\u8bb0', '#F0E6D8');
    const imgs = await Promise.all([
      loadTemplateAsset('product'),
      loadTemplateAsset('still'),
      loadTemplateAsset('food'),
      loadTemplateAsset('market'),
    ]);
    const nodes: SceneNode[] = [
      makeVeil(frameId, { x: 0, y: 0, width: W, height: H, fill: '#F0E6D8', name: '\u5e95\u573a' }),
      makeRoleText(frameId, 'display', '\u672c\u5468\u6d4b\u8bc4', 56, 80, XHS_SIG_RAMP, {
        name: '\u6807\u9898',
        color: ink,
        fontFamily: FONT_HEI,
        fontSize: 52,
        bold: true,
      }),
      makeRoleText(frameId, 'meta', 'side-by-side review', 56, 140, XHS_SIG_RAMP, {
        name: '\u526f\u6807',
        color: accent,
        fontFamily: FONT_META,
        fontSize: 20,
        bold: true,
      }),
      ...makeCompareTable(frameId, assets, imgs, {
        x: 40,
        y: 200,
        width: W - 80,
        height: 1080,
        headers: ['A \u6b3e', 'B \u6b3e', 'C \u6b3e', 'D \u6b3e'],
        rows: [
          ['\u53e3\u611f\u5b9e\u5e72', '\u9999\u751c\u67d4', '\u6e05\u723d\u751c', '\u6d53\u90c1\u9187'],
          ['\u2605\u2605\u2605\u2605', '\u2605\u2605\u2605', '\u2605\u2605\u2605\u2605', '\u2605\u2605\u2605'],
          ['\u65e5\u5e38', '\u793c\u7269', '\u8f7b\u98df', '\u5206\u4eab'],
          ['9.2', '8.6', '9.0', '8.8'],
        ],
        surface,
        ink,
        accent,
        border: 'rgba(26,21,16,0.12)',
      }),
    ];
    return finish(doc, frame, nodes);
  },
};

/* 10 — travel listicle 2x2 */
const sigTravelListicle: BuiltinTemplate = {
  ...sigMeta(
    'sig-travel-listicle',
    '\u5730\u70b9\u6e05\u5355 · 2\u00d72',
    '\u9876\u6807\u9898 + 2\u00d72 \u5730\u70b9\u683c',
    'travel',
  ),
  build: async ({ assets }: BuiltinBuildContext) => {
    const W = XHS_SIG_W;
    const H = XHS_SIG_H;
    const ink = '#FFF8EC';
    const field = '#1A2A22';
    const { doc, frameId } = emptyDoc('\u5730\u70b9\u6e05\u5355', 'xhsNote');
    const frame = makeFrame(frameId, W, H, '\u7b14\u8bb0', field);
    const imgs = await Promise.all([
      loadTemplateAsset('hills'),
      loadTemplateAsset('snow'),
      loadTemplateAsset('desert'),
      loadTemplateAsset('ocean'),
    ]);
    const labels = ['\u8349\u539f', '\u96ea\u5c71', '\u6c99\u6f20', '\u6d77\u5cb8'];
    const pad = 48;
    const gridY = 280;
    const gridH = H - gridY - 80;
    const nodes: SceneNode[] = [
      makeVeil(frameId, { x: 0, y: 0, width: W, height: H, fill: field, name: '\u5e95\u573a' }),
      makeRoleText(frameId, 'display', '\u56db\u7ad9\u5fc5\u53bb', pad, 100, XHS_SIG_RAMP, {
        name: '\u6807\u9898',
        color: ink,
        fontFamily: FONT_HEI,
        fontSize: 64,
        bold: true,
      }),
      makeRoleText(frameId, 'meta', 'weekend escape map', pad, 180, XHS_SIG_RAMP, {
        name: '\u526f\u6807',
        color: '#A8D5B5',
        fontFamily: FONT_META,
        fontSize: 22,
      }),
      ...makePhotoGrid(frameId, assets, imgs, {
        x: pad,
        y: gridY,
        width: W - pad * 2,
        height: gridH,
        cols: 2,
        rows: 2,
        gap: 16,
        radius: 14,
      }),
    ];
    // pin labels on each cell
    const cellW = (W - pad * 2 - 16) / 2;
    const cellH = (gridH - 16) / 2;
    labels.forEach((lab, i) => {
      const c = i % 2;
      const r = Math.floor(i / 2);
      nodes.push(
        makeGlassPanel(frameId, {
          x: pad + c * (cellW + 16) + 16,
          y: gridY + r * (cellH + 16) + cellH - 64,
          width: 120,
          height: 40,
          fill: 'rgba(26,42,34,0.72)',
          radius: 8,
          name: `\u6807\u7b7e${i + 1}`,
        }),
        makeRoleText(
          frameId,
          'meta',
          lab,
          pad + c * (cellW + 16) + 76,
          gridY + r * (cellH + 16) + cellH - 44,
          XHS_SIG_RAMP,
          {
            name: `\u5730\u70b9${i + 1}`,
            align: 'center',
            color: ink,
            fontFamily: FONT_META,
            fontSize: 20,
            bold: true,
          },
        ),
      );
    });
    return finish(doc, frame, nodes);
  },
};

/* 11 — memo UI habits */
const sigMemoUiHabits: BuiltinTemplate = {
  ...sigMeta(
    'sig-memo-ui-habits',
    '\u8bb0\u4e8b\u672c UI · \u4e60\u60ef',
    '\u65b9\u683c\u5e95 + \u9ec4\u9ad8\u4eae + \u5e95\u680f\u4f2a UI',
    'knowledge',
  ),
  build: async ({ assets }: BuiltinBuildContext) => {
    const W = XHS_SIG_W;
    const H = XHS_SIG_H;
    const paper = '#FFFDF6';
    const ink = '#1A1510';
    const hi = '#FFE566';
    const { doc, frameId } = emptyDoc('\u8bb0\u4e8b\u672c\u4e60\u60ef', 'xhsNote');
    const frame = makeFrame(frameId, W, H, '\u7b14\u8bb0', paper);
    const paperTex = await loadTemplateAsset('paper');
    const nodes: SceneNode[] = [
      makeCoverImage(frameId, assets, paperTex, W, H, {
        name: '\u5e95\u56fe',
        locked: true,
        opacity: 0.35,
      }),
      makeVeil(frameId, { x: 0, y: 0, width: W, height: H, fill: 'rgba(255,253,246,0.88)', name: '\u5e95\u573a' }),
    ];
    // sparse notebook dots (not a full grid of nodes)
    for (let x = 64; x < W - 40; x += 72) {
      for (let y = 200; y < H - 140; y += 72) {
        nodes.push(
          makeShape(frameId, 'ellipse', {
            x: x - 1.5,
            y: y - 1.5,
            width: 3,
            height: 3,
            fill: 'rgba(26,21,16,0.14)',
            name: '\u65b9\u683c\u70b9',
            locked: true,
          }),
        );
      }
    }
    const habits = [
      '\u65e9\u8d77\u540e\u5148\u559d\u6c34',
      '\u5355\u8bcd\u5361\u6bcf\u65e5 20 \u4e2a',
      '\u665a\u95f4\u6570\u5b57\u6392\u6bd2',
      '\u5468\u672b\u590d\u76d8\u4e00\u6b21',
      '\u8ddf\u4eba\u8bb2\u4e00\u904d',
      '\u7761\u524d\u5199\u4e09\u884c\u603b\u7ed3',
    ];
    nodes.push(
      makeRoleText(frameId, 'display', '\u516d\u5927\u5b66\u4e60\u4e60\u60ef', 64, 100, XHS_SIG_RAMP, {
        name: '\u6807\u9898',
        color: ink,
        fontFamily: FONT_HEI,
        fontSize: 48,
        bold: true,
      }),
      makeRoleText(frameId, 'caption', 'memo · habits that stick', 64, 160, XHS_SIG_RAMP, {
        name: '\u526f\u6807',
        color: 'rgba(26,21,16,0.45)',
        fontFamily: FONT_META,
        fontSize: 20,
      }),
    );
    habits.forEach((h, i) => {
      const yy = 240 + i * 140;
      if (i % 2 === 0) {
        nodes.push(
          makeVeil(frameId, {
            x: 56,
            y: yy - 24,
            width: W - 112,
            height: 72,
            fill: hi,
            name: `\u9ad8\u4eae${i + 1}`,
          }),
        );
      }
      nodes.push(
        ...makeNumberBadge(frameId, {
          x: 72,
          y: yy - 8,
          size: 44,
          fill: ink,
          ink: paper,
          num: String(i + 1),
          ramp: XHS_SIG_RAMP,
        }),
        makeRoleText(frameId, 'body', h, 140, yy + 14, XHS_SIG_RAMP, {
          name: `\u6761\u76ee${i + 1}`,
          color: ink,
          fontFamily: FONT_SANS,
          fontSize: 30,
        }),
      );
    });
    // fake bottom UI
    nodes.push(
      makeVeil(frameId, {
        x: 0,
        y: H - 100,
        width: W,
        height: 100,
        fill: 'rgba(255,253,246,0.95)',
        name: '\u5e95\u680f',
      }),
      makeAccentStroke(frameId, {
        x: 0,
        y: H - 100,
        width: W,
        amplitude: 0,
        stroke: 'rgba(26,21,16,0.1)',
        strokeWidth: 1,
        name: '\u5e95\u680f\u7ebf',
      }),
    );
    const icons = ['\u270e', '\u2713', '\u2605'];
    icons.forEach((ic, i) => {
      nodes.push(
        makeRoleText(frameId, 'meta', ic, 180 + i * 280, H - 48, XHS_SIG_RAMP, {
          name: `\u5e95\u680f\u56fe\u6807${i + 1}`,
          align: 'center',
          color: ink,
          fontSize: 28,
        }),
      );
    });
    return finish(doc, frame, nodes);
  },
};

/* 12 — promo price */
const sigPromoPrice: BuiltinTemplate = {
  ...sigMeta(
    'sig-promo-price',
    '\u4ef7\u7b7e\u4fc3\u9500\u6a21\u5757',
    '\u9876\u94a9\u5b50 + \u4e2d\u4ef7 + \u5e95\u670d\u52a1\u8868',
    'promo',
  ),
  build: async ({ assets }: BuiltinBuildContext) => {
    const W = XHS_SIG_W;
    const H = XHS_SIG_H;
    const ink = '#0C0B0A';
    const bone = '#FFF8EC';
    const accent = '#E11D48';
    const { doc, frameId } = emptyDoc('\u4ef7\u7b7e\u4fc3\u9500', 'xhsNote');
    const frame = makeFrame(frameId, W, H, '\u7b14\u8bb0', ink);
    const photo = await loadTemplateAsset('product');
    const nodes: SceneNode[] = [
      makeCoverImage(frameId, assets, photo, W, H, { name: '\u5e95\u56fe', locked: true }),
      makeVeil(frameId, {
        x: 0,
        y: 0,
        width: W,
        height: H,
        fill: 'rgba(12,11,10,0.45)',
        name: '\u8499\u7248',
      }),
      makeRoleText(frameId, 'meta', 'YEAR END SALE', W / 2, 100, XHS_SIG_RAMP, {
        name: '\u6807\u7b7e',
        align: 'center',
        color: '#F5D400',
        fontFamily: FONT_META,
        fontSize: 24,
        bold: true,
      }),
      makeRoleText(frameId, 'display', '\u5e74\u7ec8\u9650\u65f6', W / 2, 180, XHS_SIG_RAMP, {
        name: '\u6807\u9898',
        align: 'center',
        color: bone,
        fontFamily: FONT_HEI,
        fontSize: 64,
        bold: true,
      }),
      ...makePriceModule(frameId, {
        x: 72,
        y: 320,
        width: W - 144,
        height: 520,
        price: '\u00a51068',
        rows: [
          { label: '\u5957\u9910\u5185\u542b\u4e3b\u54c1', price: '\u00a5688' },
          { label: '\u9650\u65f6\u793c\u76d2', price: '\u00a5280' },
          { label: '\u5305\u90ae\u5305\u9000', price: '\u00a5100' },
        ],
        surface: bone,
        ink,
        accent,
      }),
      makeRoleText(frameId, 'caption', '\u670d\u52a1\u8bf4\u660e\u4ee5\u5e97\u5185\u4e3a\u51c6', W / 2, H - 80, XHS_SIG_RAMP, {
        name: '\u526f\u6807',
        align: 'center',
        color: 'rgba(255,248,236,0.65)',
        fontFamily: FONT_SANS,
        fontSize: 20,
      }),
    ];
    return finish(doc, frame, nodes);
  },
};

export const XHS_SIGNATURE_BUILTINS: BuiltinTemplate[] = [
  ...XHS_JOURNAL_SIGNATURES,
  sigPlogTriptych,
  sigVibeScriptOcean,
  sigTypeCollisionField,
  sigScrapPolaroid,
  sigQuoteDock,
  sigGridFitness,
  sigVlogBurst,
  sigChecklistTravel,
  sigCompareTable,
  sigTravelListicle,
  sigMemoUiHabits,
  sigPromoPrice,
];

export function listXhsSignatureBuiltins(): BuiltinTemplate[] {
  return [...XHS_SIGNATURE_BUILTINS];
}
