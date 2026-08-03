/**
 * L1 signature builtins — contrast-first, OFL faces, invented compositions.
 *
 * Font roles (bundled OFL via templatePalettes):
 *   latinDisplay → Bebas/Anton | script → 马善政/文楷 | serifQuote → 文楷/小薇
 *   fang → 小薇 captions | meta → Outfit | display → 得意黑
 */

import type { FrameNode, SceneNode, StudioDocument } from '../model';
import {
  addPageWithFrame,
  emptyDoc,
  makeFrame,
  makeLine,
  makeShape,
} from '../scenes/helpers';
import type { BuiltinBuildContext, BuiltinTemplate } from './types';
import { loadTemplateAsset, makeCoverImage, makeImageInRect } from './templateAssets';
import {
  RAMP_CARD,
  RAMP_POSTER,
  RAMP_SQUARE,
  RAMP_WECHAT,
  makeRoleText,
  stackOffset,
  withHalo,
} from './templateType';
import {
  condenseText,
  makeAccentStroke,
  makeVeil,
  rotateText,
} from './templateCraft';
import {
  FONT_FANG,
  FONT_HEI,
  FONT_KAI,
  FONT_LATIN_DISPLAY,
  FONT_LATIN_SANS,
  FONT_LATIN_SERIF,
  FONT_META,
  FONT_MONO,
  FONT_SONG,
  FONT_XING,
  FONT_YUAN,
} from './templatePalettes';
import {
  XHS_CARD_TYPES,
  XHS_SUITE_PRESETS,
  buildXhsCardDocument,
  buildXhsSuiteDocument,
  type XhsCardTypeId,
} from './xhsCardTypes';
import { XHS_SIGNATURE_BUILTINS } from './xhsSignatures';
import type { XhsTheme } from './xhsTheme';

function put(doc: StudioDocument, nodes: SceneNode[]): void {
  for (const n of nodes) doc.nodes[n.id] = n;
}

function attach(frame: FrameNode, ids: string[]): void {
  frame.children.push(...ids);
}

function finish(doc: StudioDocument, frame: FrameNode, nodes: SceneNode[]): StudioDocument {
  attach(
    frame,
    nodes.map((n) => n.id),
  );
  put(doc, [frame, ...nodes]);
  return doc;
}

/* ═══════════════════════════════════════════════════════════
 * POSTER A — alpine editorial
 * Audience: outdoor / lifestyle feed
 * Signature: full-bleed hills + lemon dock + Impact×楷叠字 + ink ridge
 * Asset: hills · Anti-clone: stacked bilingual vs collage cut
 * ═══════════════════════════════════════════════════════════ */
const posterFieldStack: BuiltinTemplate = {
  id: 'builtin-poster-field',
  name: '旷野编辑 · 叠字',
  description: '全出血风景 + 得意黑×马善政对撞 · 文楷诗句',
  sceneId: 'poster',
  tags: ['摄影', '编辑'],
  build: async ({ assets }) => {
    const W = 1080;
    const H = 1920;
    const M = 64;
    const forest = '#0E1C14';
    const bone = '#FFF8EC';
    const lemon = '#FFE566';
    const photo = await loadTemplateAsset('hills');
    const { doc, frameId } = emptyDoc('旷野编辑', 'poster');
    const frame = makeFrame(frameId, W, H, '海报', '#0A1610');

    const bg = makeCoverImage(frameId, assets, photo, W, H, {
      name: '风景底',
      locked: true,
    });
    const topGlass = makeVeil(frameId, {
      x: 0,
      y: 0,
      width: W,
      height: 180,
      fill: 'rgba(255,248,236,0.72)',
      name: '顶栏托底',
    });
    const dock = makeVeil(frameId, {
      x: 0,
      y: 1180,
      width: W,
      height: 740,
      fill: 'rgba(8,16,12,0.86)',
      name: '阅读坞',
    });

    const issue = makeRoleText(frameId, 'meta', 'VOL. 08  ·  FIELD NOTES', M, 72, RAMP_POSTER, {
      color: forest,
      fontFamily: FONT_META,
      bold: true,
      fontSize: 22,
    });
    const tag = makeRoleText(frameId, 'caption', '山野纪行', W - M, 72, RAMP_POSTER, {
      color: forest,
      align: 'right',
      fontFamily: FONT_FANG,
      fontSize: 22,
    });

    const en = withHalo(
      condenseText(
        makeRoleText(frameId, 'latinDisplay', 'OPEN FIELD', M, 420, RAMP_POSTER, {
          color: bone,
          fontSize: 128,
          align: 'left',
          fontFamily: FONT_LATIN_DISPLAY,
        }),
        0.82,
      ),
      'rgba(0,0,0,0.35)',
      4,
    );
    const zh = withHalo(
      makeRoleText(frameId, 'script', '旷野', M + 8, 560, RAMP_POSTER, {
        color: lemon,
        fontSize: 120,
        fontFamily: FONT_KAI,
        strokeColor: 'rgba(0,0,0,0.4)',
        strokeWidth: 2,
      }),
      'rgba(0,0,0,0.25)',
      2,
    );
    const ridge = makeAccentStroke(frameId, {
      x: M,
      y: 680,
      width: W - M * 2,
      amplitude: 22,
      waves: 1.8,
      stroke: lemon,
      strokeWidth: 3.5,
      name: '山脊线',
    });

    const verse = makeRoleText(
      frameId,
      'serifQuote',
      '把脚步放慢\n云才会停在肩上',
      M,
      1360,
      RAMP_POSTER,
      {
        color: bone,
        fontSize: 44,
        lineHeight: 1.45,
        fontFamily: FONT_SONG,
      },
    );
    const foot = makeRoleText(
      frameId,
      'caption',
      'PICLAB  ·  WEEKEND EDIT',
      M,
      H - 100,
      RAMP_POSTER,
      { color: 'rgba(255,248,236,0.55)', fontFamily: FONT_META, fontSize: 18 },
    );

    return finish(doc, frame, [
      bg,
      topGlass,
      dock,
      issue,
      tag,
      en,
      zh,
      ridge,
      verse,
      foot,
    ]);
  },
};

/* ═══════════════════════════════════════════════════════════
 * POSTER B — exhibition collage
 * Signature: two masked plates + diagonal cut + tilted meta
 * Asset: architecture · Anti-clone: cut collage vs field stack
 * ═══════════════════════════════════════════════════════════ */
const posterCollage: BuiltinTemplate = {
  id: 'builtin-poster-collage',
  name: '展讯拼贴 · 斜切',
  description: '建筑蒙版拼贴 + 斜切色带 + 展讯层级',
  sceneId: 'poster',
  tags: ['编辑', '极简'],
  build: async ({ assets }) => {
    const W = 1080;
    const H = 1920;
    const ink = '#12141A';
    const bone = '#F4F0E8';
    const coral = '#E85D4C';
    const photo = await loadTemplateAsset('architecture');
    const { doc, frameId } = emptyDoc('展讯拼贴', 'poster');
    const frame = makeFrame(frameId, W, H, '海报', ink);

    const field = makeVeil(frameId, {
      x: 0,
      y: 0,
      width: W,
      height: H,
      fill: ink,
      name: '底场',
    });
    const plateA = makeImageInRect(frameId, assets, photo, 48, 120, 620, 820, {
      name: '主图',
      mask: 'roundRect',
      maskRadius: 8,
      locked: true,
    });
    const plateB = makeImageInRect(frameId, assets, photo, 520, 620, 480, 560, {
      name: '次图',
      mask: 'roundRect',
      maskRadius: 8,
      opacity: 0.92,
      locked: true,
    });
    const slash = makeShape(frameId, 'rect', {
      x: -80,
      y: 980,
      width: W + 200,
      height: 120,
      fill: coral,
      name: '斜切带',
      locked: true,
    });
    slash.transform.rotation = (-8 * Math.PI) / 180;

    const show = makeRoleText(frameId, 'meta', 'EXHIBITION  08.16', 56, 1080, RAMP_POSTER, {
      color: bone,
      fontFamily: FONT_META,
      bold: true,
      fontSize: 24,
    });
    const title = makeRoleText(frameId, 'display', '光影入室', 56, 1220, RAMP_POSTER, {
      color: bone,
      fontSize: 96,
      fontFamily: FONT_HEI,
      bold: true,
    });
    const sub = makeRoleText(
      frameId,
      'fang',
      '城市更新 · 空间叙事联展',
      56,
      1360,
      RAMP_POSTER,
      { color: 'rgba(244,240,232,0.75)', fontFamily: FONT_FANG, fontSize: 28 },
    );
    const when = rotateText(
      makeRoleText(frameId, 'latinSerif', 'SAT–SUN', W - 100, 420, RAMP_POSTER, {
        color: coral,
        fontSize: 28,
        fontFamily: FONT_LATIN_SERIF,
        align: 'center',
      }),
      90,
    );
    const cta = makeRoleText(frameId, 'caption', '免费预约  ·  二楼展厅', 56, H - 120, RAMP_POSTER, {
      color: coral,
      fontFamily: FONT_META,
      bold: true,
      fontSize: 22,
    });

    return finish(doc, frame, [
      field,
      plateA,
      plateB,
      slash,
      show,
      title,
      sub,
      when,
      cta,
    ]);
  },
};

/* ═══════════════════════════════════════════════════════════
 * CARD A — portrait atelier (dual page)
 * Signature: ellipse portrait + vertical name + back QR strip
 * Asset: portrait
 * ═══════════════════════════════════════════════════════════ */
const cardPortraitStrip: BuiltinTemplate = {
  id: 'builtin-card-portrait',
  name: '肖像侧栏 · 名片',
  description: '椭圆肖像 + 竖排姓名 · 正背面信息',
  sceneId: 'card',
  tags: ['摄影', '极简'],
  build: async ({ assets }) => {
    const W = 1050;
    const H = 600;
    const ink = '#1A1410';
    const paper = '#F7F2EA';
    const accent = '#8B2E2E';
    const photo = await loadTemplateAsset('portrait');
    const { doc, frameId } = emptyDoc('肖像名片', 'card');
    const frame = makeFrame(frameId, W, H, '正面', paper);

    const band = makeVeil(frameId, {
      x: 0,
      y: 0,
      width: 380,
      height: H,
      fill: ink,
      name: '侧栏',
    });
    const face = makeImageInRect(frameId, assets, photo, 48, 80, 284, 360, {
      name: '肖像',
      mask: 'ellipse',
      locked: true,
    });
    const role = makeRoleText(frameId, 'meta', 'ART DIRECTOR', 48, 480, RAMP_CARD, {
      color: 'rgba(247,242,234,0.7)',
      fontFamily: FONT_META,
      fontSize: 14,
      bold: true,
    });

    const nameV = makeRoleText(frameId, 'display', '林昭', 520, 120, RAMP_CARD, {
      color: ink,
      fontSize: 72,
      fontFamily: FONT_HEI,
      bold: true,
      writingMode: 'vertical',
      align: 'left',
    });
    const en = makeRoleText(frameId, 'latinSerif', 'LIN ZHAO', 620, 140, RAMP_CARD, {
      color: accent,
      fontSize: 22,
      fontFamily: FONT_LATIN_SERIF,
      writingMode: 'vertical',
    });
    const line = makeLine(frameId, 720, 100, 0, 280, {
      stroke: accent,
      strokeWidth: 2,
      name: '竖线',
      locked: true,
    });
    const contact = makeRoleText(
      frameId,
      'body',
      'studio@piclab.local\n+86 138 0000 0000',
      780,
      200,
      RAMP_CARD,
      { color: ink, fontSize: 18, lineHeight: 1.5, fontFamily: FONT_META },
    );

    finish(doc, frame, [band, face, role, nameV, en, line, contact]);

    const { frameId: backId } = addPageWithFrame(doc, {
      name: '背面',
      width: W,
      height: H,
      fill: ink,
      activate: false,
    });
    const back = doc.nodes[backId] as FrameNode;
    const backPaper = makeVeil(backId, {
      x: 40,
      y: 40,
      width: W - 80,
      height: H - 80,
      fill: paper,
      name: '内卡',
    });
    const mark = makeRoleText(backId, 'script', '昭', W / 2, H / 2 - 40, RAMP_CARD, {
      color: accent,
      align: 'center',
      fontSize: 120,
      fontFamily: FONT_KAI,
    });
    const url = makeRoleText(backId, 'meta', 'piclab.studio / linzhao', W / 2, H - 120, RAMP_CARD, {
      color: ink,
      align: 'center',
      fontFamily: FONT_META,
      fontSize: 16,
    });
    attach(back, [backPaper.id, mark.id, url.id]);
    put(doc, [back, backPaper, mark, url]);
    doc.activePageId = doc.pages[0]!.id;
    return doc;
  },
};

/* ═══════════════════════════════════════════════════════════
 * CARD B — cinnabar seal
 * Signature: huge seal square + extreme margin + meta only
 * Asset: paper texture soft
 * ═══════════════════════════════════════════════════════════ */
const cardSeal: BuiltinTemplate = {
  id: 'builtin-card-seal',
  name: '朱印留白 · 名片',
  description: '大方朱印 + 极端留白 · 信息极简',
  sceneId: 'card',
  tags: ['极简'],
  build: async ({ assets }) => {
    const W = 1050;
    const H = 600;
    const paper = '#F3EDE3';
    const ink = '#1C1814';
    const seal = '#9B1B1B';
    const tex = await loadTemplateAsset('paper');
    const { doc, frameId } = emptyDoc('朱印名片', 'card');
    const frame = makeFrame(frameId, W, H, '正面', paper);

    const bg = makeCoverImage(frameId, assets, tex, W, H, {
      name: '纸纹',
      opacity: 0.45,
      locked: true,
    });
    const stamp = makeShape(frameId, 'roundRect', {
      x: 72,
      y: 100,
      width: 220,
      height: 220,
      fill: seal,
      cornerRadius: 12,
      name: '印面',
      locked: true,
    });
    const sealChar = makeRoleText(frameId, 'script', '印', 182, 210, RAMP_CARD, {
      color: paper,
      align: 'center',
      fontSize: 96,
      fontFamily: FONT_KAI,
    });
    const name = makeRoleText(frameId, 'display', '沈砚', 360, 180, RAMP_CARD, {
      color: ink,
      fontSize: 56,
      fontFamily: FONT_HEI,
      bold: true,
    });
    const title = makeRoleText(frameId, 'fang', '独立设计师  ·  字体与印刷', 360, 260, RAMP_CARD, {
      color: 'rgba(28,24,20,0.65)',
      fontFamily: FONT_FANG,
      fontSize: 20,
    });
    const rule = makeLine(frameId, 360, 320, 280, 0, {
      stroke: seal,
      strokeWidth: 2,
      name: '细线',
      locked: true,
    });
    const meta = makeRoleText(
      frameId,
      'meta',
      'WECHAT  shenyan.print\nMAIL  hi@shenyan.design',
      360,
      380,
      RAMP_CARD,
      { color: ink, fontSize: 16, lineHeight: 1.55, fontFamily: FONT_META },
    );

    return finish(doc, frame, [bg, stamp, sealChar, name, title, rule, meta]);
  },
};

/* ═══════════════════════════════════════════════════════════
 * AD A — price split
 * Signature: left photo / right giant price number
 * Asset: food
 * ═══════════════════════════════════════════════════════════ */
const adPriceSplit: BuiltinTemplate = {
  id: 'builtin-ad-price',
  name: '分屏巨价 · 广告',
  description: '左摄影右巨价 · 促销一眼可读',
  sceneId: 'ad',
  tags: ['促销', '摄影'],
  build: async ({ assets }) => {
    const W = 1080;
    const H = 1080;
    const ink = '#14110E';
    const cream = '#FFF6E8';
    const price = '#C45C26';
    const photo = await loadTemplateAsset('food');
    const { doc, frameId } = emptyDoc('分屏巨价', 'ad');
    const frame = makeFrame(frameId, W, H, '广告', ink);

    const left = makeImageInRect(frameId, assets, photo, 0, 0, Math.round(W * 0.52), H, {
      name: '美食',
      locked: true,
    });

    const right = makeVeil(frameId, {
      x: Math.round(W * 0.48),
      y: 0,
      width: Math.round(W * 0.52),
      height: H,
      fill: cream,
      name: '价区',
    });
    const eyebrow = makeRoleText(frameId, 'meta', 'WEEKEND SET', W * 0.56, 160, RAMP_SQUARE, {
      color: price,
      fontFamily: FONT_META,
      bold: true,
      fontSize: 22,
    });
    const title = makeRoleText(frameId, 'display', '双人餐', W * 0.56, 260, RAMP_SQUARE, {
      color: ink,
      fontSize: 64,
      fontFamily: FONT_HEI,
      bold: true,
    });
    const num = condenseText(
      makeRoleText(frameId, 'latinDisplay', '128', W * 0.56, 520, RAMP_SQUARE, {
        color: price,
        fontSize: 180,
        fontFamily: FONT_LATIN_DISPLAY,
        bold: true,
      }),
      0.88,
    );
    const unit = makeRoleText(frameId, 'caption', '元起  ·  含软饮', W * 0.56, 640, RAMP_SQUARE, {
      color: 'rgba(20,17,14,0.65)',
      fontFamily: FONT_FANG,
      fontSize: 24,
    });
    const cta = makeShape(frameId, 'roundRect', {
      x: W * 0.56,
      y: 820,
      width: 280,
      height: 72,
      fill: ink,
      cornerRadius: 8,
      name: '按钮',
    });
    const ctaT = makeRoleText(frameId, 'meta', '立即预订', W * 0.56 + 140, 856, RAMP_SQUARE, {
      color: cream,
      align: 'center',
      fontFamily: FONT_META,
      bold: true,
      fontSize: 22,
    });

    return finish(doc, frame, [left, right, eyebrow, title, num, unit, cta, ctaT]);
  },
};

/* ═══════════════════════════════════════════════════════════
 * AD B — material corner
 * Signature: stone texture field + corner chip + mono SKU
 * Asset: stone
 * ═══════════════════════════════════════════════════════════ */
const adTexture: BuiltinTemplate = {
  id: 'builtin-ad-texture',
  name: '材质角饰 · 广告',
  description: '石材质感全场 + 角标 SKU · 克制促销',
  sceneId: 'ad',
  tags: ['摄影'],
  build: async ({ assets }) => {
    const W = 1080;
    const H = 1080;
    const ink = '#0F1216';
    const bone = '#F2EEE6';
    const accent = '#D4A574';
    const photo = await loadTemplateAsset('stone');
    const { doc, frameId } = emptyDoc('材质角饰', 'ad');
    const frame = makeFrame(frameId, W, H, '广告', ink);

    const bg = makeCoverImage(frameId, assets, photo, W, H, {
      name: '石材',
      locked: true,
    });
    const shade = makeVeil(frameId, {
      x: 0,
      y: H * 0.55,
      width: W,
      height: H * 0.45,
      fill: 'rgba(10,12,16,0.78)',
      name: '下罩',
    });
    const chip = makeShape(frameId, 'rect', {
      x: W - 220,
      y: 48,
      width: 160,
      height: 160,
      fill: accent,
      name: '角饰',
      locked: true,
    });
    const sku = makeRoleText(frameId, 'meta', 'SKU\n04', W - 140, 110, RAMP_SQUARE, {
      color: ink,
      align: 'center',
      fontFamily: FONT_MONO,
      bold: true,
      fontSize: 28,
      lineHeight: 1.2,
    });
    const brand = makeRoleText(frameId, 'latinSerif', 'ATELIER RAW', 64, 720, RAMP_SQUARE, {
      color: accent,
      fontFamily: FONT_LATIN_SERIF,
      fontSize: 28,
    });
    const title = makeRoleText(frameId, 'display', '触感系列', 64, 820, RAMP_SQUARE, {
      color: bone,
      fontSize: 72,
      fontFamily: FONT_HEI,
      bold: true,
    });
    const sub = makeRoleText(frameId, 'fang', '天然纹理  ·  限量配色', 64, 920, RAMP_SQUARE, {
      color: 'rgba(242,238,230,0.7)',
      fontFamily: FONT_FANG,
      fontSize: 26,
    });

    return finish(doc, frame, [bg, shade, chip, sku, brand, title, sub]);
  },
};

/* ═══════════════════════════════════════════════════════════
 * SOCIAL A — night quote
 * Signature: neon city + large Song quote + gold rule
 * Asset: neon
 * ═══════════════════════════════════════════════════════════ */
const socialQuoteCover: BuiltinTemplate = {
  id: 'builtin-social-quote',
  name: '金句夜城 · 社交',
  description: '霓虹夜景 + 文楷金句 · 阅读坞',
  sceneId: 'social',
  tags: ['摄影', '编辑'],
  build: async ({ assets }) => {
    const W = 1080;
    const H = 1080;
    const bone = '#FFF6E8';
    const gold = '#E8C56A';
    const photo = await loadTemplateAsset('neon');
    const { doc, frameId } = emptyDoc('金句夜城', 'social');
    const frame = makeFrame(frameId, W, H, '方图', '#0A0810');

    const bg = makeCoverImage(frameId, assets, photo, W, H, {
      name: '夜城',
      locked: true,
    });
    const dock = makeVeil(frameId, {
      x: 0,
      y: 520,
      width: W,
      height: 560,
      fill: 'rgba(6,4,12,0.82)',
      name: '阅读坞',
    });
    const issue = makeRoleText(frameId, 'meta', 'NIGHT NOTE  ·  03', 56, 80, RAMP_SQUARE, {
      color: gold,
      fontFamily: FONT_META,
      bold: true,
      fontSize: 20,
    });
    const mark = makeRoleText(frameId, 'script', '夜', W - 120, 200, RAMP_SQUARE, {
      color: 'rgba(232,197,106,0.4)',
      fontSize: 160,
      align: 'center',
      fontFamily: FONT_XING,
    });
    const q = makeRoleText(frameId, 'serifQuote', '「', 48, 620, RAMP_SQUARE, {
      color: gold,
      fontSize: 72,
      fontFamily: FONT_SONG,
    });
    const quote = makeRoleText(
      frameId,
      'serifQuote',
      '灯光把城市\n变成一张旧照片',
      96,
      720,
      RAMP_SQUARE,
      {
        color: bone,
        fontSize: 48,
        lineHeight: 1.4,
        fontFamily: FONT_SONG,
      },
    );
    const rule = makeLine(frameId, 96, 880, 80, 0, {
      stroke: gold,
      strokeWidth: 3,
      name: '金线',
      locked: true,
    });
    const credit = makeRoleText(frameId, 'caption', '夜记  ·  城市随笔', 96, 940, RAMP_SQUARE, {
      color: 'rgba(255,246,232,0.65)',
      fontFamily: FONT_FANG,
      fontSize: 20,
    });

    return finish(doc, frame, [bg, dock, issue, mark, q, quote, rule, credit]);
  },
};

/* ═══════════════════════════════════════════════════════════
 * SOCIAL B — open house announce
 * Signature: still life + coral date plate + bilingual stack
 * Asset: still
 * ═══════════════════════════════════════════════════════════ */
const socialAnnounce: BuiltinTemplate = {
  id: 'builtin-social-announce',
  name: '活动角饰 · 社交',
  description: '静物底 + 日期块 + 双语报名',
  sceneId: 'social',
  tags: ['促销', '摄影'],
  build: async ({ assets }) => {
    const W = 1080;
    const H = 1080;
    const bone = '#FFF8F0';
    const coral = '#E85D4C';
    const photo = await loadTemplateAsset('still');
    const { doc, frameId } = emptyDoc('活动角饰', 'social');
    const frame = makeFrame(frameId, W, H, '方图', '#120E0C');

    const bg = makeCoverImage(frameId, assets, photo, W, H, {
      name: '静物',
      locked: true,
    });
    const shade = makeVeil(frameId, {
      x: 0,
      y: 560,
      width: W,
      height: 520,
      fill: 'rgba(8,6,4,0.8)',
      name: '下罩',
    });
    const datePlate = makeShape(frameId, 'rect', {
      x: W - 300,
      y: 48,
      width: 240,
      height: 220,
      fill: coral,
      name: '日期块',
    });
    const month = makeRoleText(frameId, 'meta', 'AUG', W - 180, 100, RAMP_SQUARE, {
      color: bone,
      align: 'center',
      fontSize: 22,
      fontFamily: FONT_META,
      bold: true,
    });
    const day = condenseText(
      makeRoleText(frameId, 'latinDisplay', '16', W - 180, 180, RAMP_SQUARE, {
        color: bone,
        align: 'center',
        fontSize: 108,
        fontFamily: FONT_LATIN_DISPLAY,
      }),
      0.9,
    );
    const en = condenseText(
      makeRoleText(frameId, 'latinDisplay', 'OPEN HOUSE', 48, 680, RAMP_SQUARE, {
        color: bone,
        fontSize: 72,
        fontFamily: FONT_LATIN_DISPLAY,
      }),
      0.78,
    );
    const zh = makeRoleText(
      frameId,
      'script',
      '开放日',
      stackOffset(en, 24, 56).x,
      stackOffset(en, 24, 56).y,
      RAMP_SQUARE,
      {
        color: coral,
        fontSize: 72,
        fontFamily: FONT_KAI,
        strokeColor: 'rgba(0,0,0,0.35)',
        strokeWidth: 2,
      },
    );
    const when = makeRoleText(frameId, 'body', '本周六  14:00 — 18:00', 48, 900, RAMP_SQUARE, {
      color: bone,
      fontSize: 28,
      fontFamily: FONT_HEI,
      bold: true,
    });
    const where = makeRoleText(
      frameId,
      'caption',
      '二楼展厅  ·  免费入场',
      48,
      980,
      RAMP_SQUARE,
      { color: 'rgba(255,248,240,0.7)', fontFamily: FONT_FANG, fontSize: 20 },
    );

    return finish(doc, frame, [
      bg,
      shade,
      datePlate,
      month,
      day,
      en,
      zh,
      when,
      where,
    ]);
  },
};

/* ═══════════════════════════════════════════════════════════
 * WECHAT A — headline photo (safe center)
 * Signature: cover photo + centered safe-zone title card
 * Asset: forest · Export hint 900×383
 * ═══════════════════════════════════════════════════════════ */
const wechatHeadlinePhoto: BuiltinTemplate = {
  id: 'builtin-wechat-headline-photo',
  name: '头条 · 摄影横幅',
  description: '全出血风景 + 安全区居中大标题',
  sceneId: 'wechatCover',
  tags: ['摄影', '编辑'],
  build: async ({ assets }) => {
    const W = 1800;
    const H = 766;
    const bone = '#FFF8EC';
    const photo = await loadTemplateAsset('forest');
    const { doc, frameId } = emptyDoc('头条摄影', 'wechatCover');
    const frame = makeFrame(frameId, W, H, '头条', '#0A1610');

    const bg = makeCoverImage(frameId, assets, photo, W, H, {
      name: '风景',
      locked: true,
    });
    const veil = makeVeil(frameId, {
      x: Math.round(W * 0.18),
      y: Math.round(H * 0.2),
      width: Math.round(W * 0.64),
      height: Math.round(H * 0.6),
      fill: 'rgba(8,16,12,0.58)',
      name: '安全托底',
    });
    const col = makeRoleText(frameId, 'meta', '深度  ·  周末', W / 2, H * 0.32, RAMP_WECHAT, {
      color: 'rgba(255,248,236,0.75)',
      align: 'center',
      fontFamily: FONT_META,
      bold: true,
      fontSize: 24,
    });
    const title = makeRoleText(frameId, 'display', '把风景写成标题', W / 2, H * 0.48, RAMP_WECHAT, {
      color: bone,
      align: 'center',
      fontSize: 68,
      fontFamily: FONT_HEI,
      bold: true,
    });
    const sub = makeRoleText(frameId, 'fang', '公众号头条封面', W / 2, H * 0.64, RAMP_WECHAT, {
      color: 'rgba(255,248,236,0.8)',
      align: 'center',
      fontFamily: FONT_FANG,
      fontSize: 26,
    });

    return finish(doc, frame, [bg, veil, col, title, sub]);
  },
};

/* ═══════════════════════════════════════════════════════════
 * WECHAT B — editorial color blocks
 * Signature: split field + gold rule + left-aligned hierarchy
 * No photo — graphic editorial
 * ═══════════════════════════════════════════════════════════ */
const wechatHeadlineBlocks: BuiltinTemplate = {
  id: 'builtin-wechat-headline-blocks',
  name: '头条 · 色块编辑',
  description: '色块分区 + 栏目名 + 主标题',
  sceneId: 'wechatCover',
  tags: ['编辑', '极简'],
  build: async () => {
    const W = 1800;
    const H = 766;
    const ink = '#FFF8EC';
    const field = '#14281C';
    const accent = '#C9A227';
    const { doc, frameId } = emptyDoc('头条色块', 'wechatCover');
    const frame = makeFrame(frameId, W, H, '头条', field);

    const left = makeVeil(frameId, {
      x: 0,
      y: 0,
      width: Math.round(W * 0.4),
      height: H,
      fill: '#0C1A10',
      name: '左色场',
    });
    const bar = makeVeil(frameId, {
      x: Math.round(W * 0.4),
      y: 0,
      width: 14,
      height: H,
      fill: accent,
      name: '金线',
    });
    const big = makeRoleText(frameId, 'script', '读', Math.round(W * 0.2), H * 0.48, RAMP_WECHAT, {
      color: 'rgba(201,162,39,0.35)',
      align: 'center',
      fontSize: 200,
      fontFamily: FONT_KAI,
    });
    const col = makeRoleText(
      frameId,
      'meta',
      '栏目 · 深度',
      Math.round(W * 0.48),
      H * 0.28,
      RAMP_WECHAT,
      { color: accent, fontFamily: FONT_META, bold: true, fontSize: 26 },
    );
    const title = makeRoleText(
      frameId,
      'display',
      '一屏讲清一件事',
      Math.round(W * 0.48),
      H * 0.48,
      RAMP_WECHAT,
      { color: ink, fontSize: 64, fontFamily: FONT_HEI, bold: true },
    );
    const foot = makeRoleText(
      frameId,
      'caption',
      '阅读原文  ·  收藏本篇',
      Math.round(W * 0.48),
      H * 0.68,
      RAMP_WECHAT,
      { color: 'rgba(255,248,236,0.65)', fontFamily: FONT_FANG, fontSize: 24 },
    );

    return finish(doc, frame, [left, bar, big, col, title, foot]);
  },
};

/* ═══════════════════════════════════════════════════════════
 * WECHAT C — sub square number hook
 * Signature: 1:1 still + giant numeral + short benefit
 * Asset: mist
 * ═══════════════════════════════════════════════════════════ */
const wechatSubSquare: BuiltinTemplate = {
  id: 'builtin-wechat-sub-square',
  name: '次条 · 数字钩子',
  description: '1:1 次条方图 · 数字利益点',
  sceneId: 'wechatCover',
  tags: ['促销', '极简'],
  build: async ({ assets }) => {
    const W = 1080;
    const H = 1080;
    const bone = '#FFF8EC';
    const coral = '#B8322B';
    const photo = await loadTemplateAsset('mist');
    const { doc, frameId } = emptyDoc('次条方图', 'wechatCover');
    const frame = makeFrame(frameId, W, H, '次条', '#120E0C');

    const bg = makeCoverImage(frameId, assets, photo, W, H, {
      name: '氛围',
      locked: true,
    });
    const plate = makeVeil(frameId, {
      x: 72,
      y: 72,
      width: W - 144,
      height: H - 144,
      fill: 'rgba(12,11,10,0.74)',
      name: '托底',
    });
    const num = makeRoleText(frameId, 'latinDisplay', '07', W / 2, H * 0.38, RAMP_SQUARE, {
      color: coral,
      align: 'center',
      fontSize: 180,
      fontFamily: FONT_LATIN_DISPLAY,
    });
    const title = makeRoleText(frameId, 'display', '条实用清单', W / 2, H * 0.58, RAMP_SQUARE, {
      color: bone,
      align: 'center',
      fontSize: 56,
      fontFamily: FONT_HEI,
      bold: true,
    });
    const sub = makeRoleText(frameId, 'caption', '次条封面', W / 2, H * 0.7, RAMP_SQUARE, {
      color: 'rgba(255,248,236,0.7)',
      align: 'center',
      fontFamily: FONT_FANG,
      fontSize: 24,
    });

    return finish(doc, frame, [bg, plate, num, title, sub]);
  },
};

/* ═══════════════════════════════════════════════════════════
 * XHS — card-type shelf + suites (structure × theme) + photo side
 * ═══════════════════════════════════════════════════════════ */
const XHS_CARD_THEME: Partial<Record<XhsCardTypeId, Partial<XhsTheme>>> = {
  cover: { skin: 'bigType', palette: 'night', bg: 'solid', typeScale: 'lg' },
  body: { skin: 'classic', palette: 'peach', bg: 'solid', typeScale: 'md' },
  plain: { skin: 'memoPaper', palette: 'amber', bg: 'rules', typeScale: 'md' },
  summary: { skin: 'magazine', palette: 'mistBlue', bg: 'solid', typeScale: 'md' },
  tips: { skin: 'bento', palette: 'forest', bg: 'solid', typeScale: 'md' },
  compare: { skin: 'magazine', palette: 'inkMinimal', bg: 'solid', typeScale: 'md' },
  steps: { skin: 'classic', palette: 'clay', bg: 'solid', typeScale: 'md' },
  stats: { skin: 'bento', palette: 'mistBlue', bg: 'gradient', typeScale: 'md' },
  faq: { skin: 'grid', palette: 'lavender', bg: 'solid', typeScale: 'md' },
  checklist: { skin: 'memoPaper', palette: 'amber', bg: 'rules', typeScale: 'md' },
  quote: { skin: 'magazine', palette: 'night', bg: 'solid', typeScale: 'lg' },
  ending: { skin: 'classic', palette: 'peach', bg: 'dots', typeScale: 'md' },
};

function shelfTag(shelf: 'cover' | 'inner' | 'ending'): string {
  switch (shelf) {
    case 'cover':
      return '封面';
    case 'inner':
    case 'ending':
      return '内页';
    default: {
      const _e: never = shelf;
      void _e;
      return '内页';
    }
  }
}

const xhsCardBuiltins: BuiltinTemplate[] = XHS_CARD_TYPES.map((meta) => ({
  id: `builtin-xhs-card-${meta.id}`,
  name: `小红书 · ${meta.label}`,
  description: meta.description,
  sceneId: 'xhsNote' as const,
  tags: [shelfTag(meta.shelf), '文字干货', '编辑'],
  build: async () =>
    buildXhsCardDocument(meta.id, XHS_CARD_THEME[meta.id] ?? { skin: 'classic', palette: 'peach' }),
}));

const xhsSuiteBuiltins: BuiltinTemplate[] = XHS_SUITE_PRESETS.map((suite) => ({
  id: `builtin-xhs-suite-${suite.id}`,
  name: `成套 · ${suite.name}`,
  description: suite.description,
  sceneId: 'xhsNote' as const,
  tags: ['成套', '编辑'],
  build: async () => buildXhsSuiteDocument(suite.cardTypes, suite.theme, suite.name),
}));

const xhsSignatureBuiltins: BuiltinTemplate[] = XHS_SIGNATURE_BUILTINS;

/* Photography side branch — not text-as-image main path */
const xhsProductSquare: BuiltinTemplate = {
  id: 'builtin-xhs-product-square',
  name: '产品方图 · 1:1',
  description: '静物产品位 · 简标',
  sceneId: 'xhsNote',
  tags: ['摄影', '促销'],
  build: async ({ assets }) => {
    const W = 1080;
    const H = 1080;
    const bone = '#FFF8EC';
    const ink = '#0C0B0A';
    const photo = await loadTemplateAsset('product');
    const { doc, frameId } = emptyDoc('产品方图', 'xhsNote');
    const frame = makeFrame(frameId, W, H, '方图', '#F0F0F0');

    const bg = makeCoverImage(frameId, assets, photo, W, H, {
      name: '产品',
      locked: true,
    });
    const tag = makeShape(frameId, 'roundRect', {
      x: 48,
      y: 48,
      width: 200,
      height: 64,
      fill: ink,
      cornerRadius: 8,
      name: '标签',
    });
    const tagT = makeRoleText(frameId, 'meta', 'NEW', 148, 80, RAMP_SQUARE, {
      color: bone,
      align: 'center',
      fontSize: 26,
      fontFamily: FONT_LATIN_SANS,
      bold: true,
    });
    const dock = makeVeil(frameId, {
      x: 0,
      y: H - 220,
      width: W,
      height: 220,
      fill: 'rgba(255,252,247,0.92)',
      name: '底栏',
    });
    const title = makeRoleText(frameId, 'display', '值得入手', 64, H - 120, RAMP_SQUARE, {
      color: ink,
      fontSize: 56,
      fontFamily: FONT_YUAN,
      bold: true,
    });
    const sub = makeRoleText(frameId, 'caption', '本周好物  ·  实测推荐', 64, H - 60, RAMP_SQUARE, {
      color: 'rgba(12,11,10,0.55)',
      fontFamily: FONT_FANG,
      fontSize: 22,
    });

    return finish(doc, frame, [bg, tag, tagT, dock, title, sub]);
  },
};

const builtinTemplates: BuiltinTemplate[] = [
  posterFieldStack,
  posterCollage,
  cardPortraitStrip,
  cardSeal,
  adPriceSplit,
  adTexture,
  socialQuoteCover,
  socialAnnounce,
  wechatHeadlinePhoto,
  wechatHeadlineBlocks,
  wechatSubSquare,
  ...xhsSignatureBuiltins,
  ...xhsCardBuiltins,
  ...xhsSuiteBuiltins,
  xhsProductSquare,
];

export function listBuiltinTemplates(): BuiltinTemplate[] {
  return [...builtinTemplates];
}

export function getBuiltinTemplate(id: string): BuiltinTemplate | undefined {
  return builtinTemplates.find((t) => t.id === id);
}

export async function buildBuiltinDocument(
  id: string,
  ctx: BuiltinBuildContext,
): Promise<StudioDocument | null> {
  const tpl = getBuiltinTemplate(id);
  if (!tpl) return null;
  return tpl.build(ctx);
}
