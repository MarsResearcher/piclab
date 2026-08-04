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
  withHalo,
} from './templateType';
import {
  condenseText,
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
 * POSTER A — 旷野编辑 (v4 editorial)
 * Brief: 山野诗集封面 · job = "step away"
 * Palette: 青绿山野照片 65% · 深墨绿排版板 25% · 沙金 accent 10%
 *   —— accent 用沙金 #D9A441（低饱和暖色，与照片青绿冷暖对比；
 *       区别于展讯的珊瑚，模板间不雷同）
 * Type: 得意黑 旷野 竖排 176 / Playfair OPEN FIELD 竖排 30 / 小薇 sub 28 /
 *       文楷 诗句 40 / Outfit meta 26 全大写正字距
 * Grid: 左轴 72 · 右轴 1008 · 顶部 6% 刊头 · 中部 62% 照片呼吸
 * Signature: 竖排"旷野"大字 + 中英横竖对位 + 发丝分隔线 + 顶部细体日期
 * ═══════════════════════════════════════════════════════════ */
const posterFieldStack: BuiltinTemplate = {
  id: 'builtin-poster-field',
  name: '旷野编辑 · 叠字',
  description: '青绿山野全出血 + 竖排大字 · 沙金细字对位 · 深绿排版板',
  sceneId: 'poster',
  tags: ['摄影', '编辑'],
  build: async ({ assets }) => {
    const W = 1080;
    const H = 1920;
    const M = 72; // 左轴
    const R = W - M; // 右轴
    const bone = '#FFF8EC'; // 主 ink（暖调白）
    const sand = '#D9A441'; // 唯一 accent —— 沙金（低饱和暖色）
    const photo = await loadTemplateAsset('hills');
    const { doc, frameId } = emptyDoc('旷野编辑', 'poster');
    const frame = makeFrame(frameId, W, H, '海报', '#0E1A14');

    // ── field: full-bleed 青绿山野照片（顶部天空较亮，需渐变晕）──
    const bg = makeCoverImage(frameId, assets, photo, W, H, {
      name: '山野底',
      locked: true,
    });
    // 顶部竖向渐变晕：顶部最深 → 向下渐隐到 0。
    // 覆盖标题区（y0-760），保证竖排大字在亮天空上有稳定对比度，
    // 且不压死天空（比平铺色罩通透）。
    const topVeil = makeVeil(frameId, {
      x: 0,
      y: 0,
      width: W,
      height: 760,
      fill: 'linear-gradient(180deg, rgba(8,18,12,0.46) 0%, rgba(8,18,12,0.22) 42%, rgba(8,18,12,0.05) 78%, rgba(8,18,12,0) 100%)',
      name: '顶晕',
    });

    // ── 顶部刊头：全大写 + 正字距（空格模拟）+ 细体 ────────
    const issue = withHalo(
      makeRoleText(frameId, 'meta', 'F I E L D   N O T E S   ·   V O L . 0 8', M, 80, RAMP_POSTER, {
        color: bone,
        fontFamily: FONT_META,
        bold: false,
        fontSize: 26,
      }),
      'rgba(8,18,12,0.55)',
      3,
    );
    const date = withHalo(
      makeRoleText(frameId, 'meta', '2 0 2 6 . 0 8', R, 80, RAMP_POSTER, {
        color: 'rgba(255,248,236,0.78)',
        align: 'right',
        fontFamily: FONT_META,
        bold: false,
        fontSize: 26,
      }),
      'rgba(8,18,12,0.5)',
      3,
    );

    // ── 主标题：竖排"旷野" 176px 楷书，lineHeight 拉开字距 ──
    //    楷书（霞鹜文楷）= 为竖排而生的书法字体，笔画有粗细、有书卷气；
    //    绝不能竖排得意黑（Smiley Sans Oblique 是斜体，竖排会倾斜发虚）
    //    竖排大字 + 字距拉开 = 东方留白美学 + 向下延展的节奏
    //    注意：竖排时 transform.x 是列中心，需 +fontSize/2 让字左缘贴左轴
    // 竖排标题在亮天空上 → 渐变晕罩已保证对比，halo 减到 4px（楷书笔画细）
    const zh = withHalo(
      makeRoleText(frameId, 'display', '旷野', M + 88, 396, RAMP_POSTER, {
        color: bone,
        fontSize: 176,
        fontFamily: FONT_SONG,
        bold: false,
        writingMode: 'vertical',
        lineHeight: 1.34,
      }),
      'rgba(8,18,12,0.55)',
      4,
    );
    // 对位：右侧横排 Playfair 细字（正字距空格模拟）——
    //    横竖对比 × 中西对比 × 粗细对比，三种编辑式对比叠一层
    //    注意：沙金在亮天空上对比度仅 1.05，必须用强 halo 立起来；
    //    Playfair 优雅衬线不做 condense（压缩只适合黑体 display）
    const en = withHalo(
      makeRoleText(frameId, 'latinSerif', 'O P E N   F I E L D', M + 336, 468, RAMP_POSTER, {
        color: sand,
        fontFamily: FONT_LATIN_SERIF,
        bold: false,
        fontSize: 30,
      }),
      'rgba(8,18,12,0.7)',
      4,
    );
    // 对位锚点：沙金细线连接竖排标题与英文
    const enRule = makeLine(frameId, M + 336, 492, 96, 0, {
      stroke: 'rgba(217,164,65,0.85)',
      strokeWidth: 1.5,
      name: '对位线',
      locked: true,
    });

    // ── 中部：照片呼吸 62%，不放任何元素 ──────────────────

    // ── 底部 25% 深墨绿排版板（与照片同色系协调）───────────
    const panelY = Math.round(H * 0.75);
    const panel = makeVeil(frameId, {
      x: 0,
      y: panelY,
      width: W,
      height: H - panelY,
      fill: '#14241C',
      name: '排版板',
    });
    // 板顶发丝线（沙金 1px）—— 比索引带更克制高级
    const topRule = makeLine(frameId, M, panelY + 24, W - M * 2, 0, {
      stroke: 'rgba(217,164,65,0.5)',
      strokeWidth: 1,
      name: '板顶线',
      locked: true,
    });
    // 诗句 40px 文楷（行距 1.55 舒展）
    const verse = makeRoleText(
      frameId,
      'serifQuote',
      '把脚步放慢\n云才会停在肩上',
      M,
      panelY + 100,
      RAMP_POSTER,
      { color: bone, fontSize: 40, lineHeight: 1.55, fontFamily: FONT_SONG },
    );
    // 板内分隔细线 —— 贴近诗句下缘，形成紧凑"诗句块"（编辑式呼吸留白在中段）
    const innerRule = makeLine(frameId, M, panelY + 180, W - M * 2, 0, {
      stroke: 'rgba(255,248,236,0.18)',
      strokeWidth: 1,
      name: '板内线',
      locked: true,
    });
    // 底部信息行（24px 全大写正字距，贴板底留白均衡）
    const barL = makeRoleText(frameId, 'meta', 'P I C L A B   ·   W E E K E N D', M, panelY + 388, RAMP_POSTER, {
      color: 'rgba(255,248,236,0.72)',
      fontFamily: FONT_META,
      fontSize: 24,
    });
    const barR = makeRoleText(frameId, 'caption', '田埂 · 晨雾 · 远峰', R, panelY + 388, RAMP_POSTER, {
      color: 'rgba(255,248,236,0.62)',
      align: 'right',
      fontFamily: FONT_FANG,
      fontSize: 24,
    });

    return finish(doc, frame, [
      bg,
      topVeil,
      issue,
      date,
      zh,
      en,
      enRule,
      panel,
      topRule,
      verse,
      innerRule,
      barL,
      barR,
    ]);
  },
};

/* ═══════════════════════════════════════════════════════════
 * POSTER B — exhibition collage
 * Brief: gallery opening · job = "come see"
 * Palette: 摄影 field 60% · 奶油 panel 30% · 珊瑚 accent 10%
 * Type: 得意黑 title 92 / 小薇 fang 26 / Outfit meta 22 / Playfair EN
 * Grid: 照片 72% 高出血 · 下方奶油排版板 28% · 左轴 56
 * Signature: 珊瑚索引带横跨照片下缘 + 竖排日期轴 + 单色排版板
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
    const M = 56; // 排版板左轴
    const ink = '#12141A';
    const bone = '#F4F0E8';
    const coral = '#E85D4C';
    const photo = await loadTemplateAsset('architecture');
    const { doc, frameId } = emptyDoc('展讯拼贴', 'poster');
    const frame = makeFrame(frameId, W, H, '海报', ink);

    // ── field: photo 72% 高，底部奶油排版板衔接 ─────────────
    const field = makeVeil(frameId, {
      x: 0,
      y: 0,
      width: W,
      height: H,
      fill: ink,
      name: '底场',
    });
    const plate = makeImageInRect(frameId, assets, photo, 0, 0, W, Math.round(H * 0.72), {
      name: '主图',
      locked: true,
    });
    // 奶油排版板，顶部收进照片 8px 形成叠压感
    const panelY = Math.round(H * 0.72) - 8;
    const panel = makeVeil(frameId, {
      x: 0,
      y: panelY,
      width: W,
      height: H - panelY,
      fill: bone,
      name: '排版板',
    });
    // 珊瑚索引带横跨照片/板接缝 —— 唯一 accent
    const band = makeShape(frameId, 'rect', {
      x: M,
      y: Math.round(H * 0.72) - 16,
      width: 216,
      height: 32,
      fill: coral,
      name: '索引带',
      locked: true,
    });

    // ── 照片上：竖排日期轴贴右，Playfair 展讯名贴左 ────────
    const when = rotateText(
      withHalo(
        makeRoleText(frameId, 'latinSerif', 'AUG 16 — SEP 30', W - 56, 300, RAMP_POSTER, {
          color: bone,
          fontSize: 26,
          fontFamily: FONT_LATIN_SERIF,
          align: 'center',
        }),
        'rgba(18,20,26,0.55)',
        4,
      ),
      90,
    );
    const show = withHalo(
      makeRoleText(frameId, 'meta', 'EXHIBITION  ·  NO.04', M, 96, RAMP_POSTER, {
        color: bone,
        fontFamily: FONT_META,
        bold: true,
        fontSize: 22,
      }),
      'rgba(18,20,26,0.5)',
      3,
    );

    // ── 排版板：左轴排版，三行信息 ──────────────────────────
    const title = makeRoleText(frameId, 'display', '光影入室', M, panelY + 176, RAMP_POSTER, {
      color: ink,
      fontSize: 92,
      fontFamily: FONT_HEI,
      bold: true,
    });
    const sub = makeRoleText(
      frameId,
      'fang',
      '城市更新 · 空间叙事联展',
      M,
      panelY + 316,
      RAMP_POSTER,
      { color: 'rgba(18,20,26,0.68)', fontFamily: FONT_FANG, fontSize: 26 },
    );
    const foot = makeRoleText(
      frameId,
      'caption',
      '免费预约  ·  二楼展厅  ·  SAT–SUN',
      M,
      H - 112,
      RAMP_POSTER,
      { color: 'rgba(18,20,26,0.58)', fontFamily: FONT_META, fontSize: 20 },
    );

    return finish(doc, frame, [
      field,
      plate,
      panel,
      band,
      when,
      show,
      title,
      sub,
      foot,
    ]);
  },
};

/* ═══════════════════════════════════════════════════════════
 * CARD A — portrait atelier (dual page)
 * Brief: designer business card · job = "who & how"
 * Palette: 深褐 panel 30% · 米纸 field 60% · 朱红 accent 10%
 * Type: 得意黑 name 72 / 马善政 昭 96 / Outfit meta 15 / Playfair EN
 * Grid: 左 360 深色栏（肖像+职衔） · 右 690 米纸（姓名+联系）
 * Signature: 椭圆肖像 + 竖排姓名 + 肖像环细线 + 背面朱印
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

    // ── 左：深褐侧栏 360px（30%）───────────────────────────
    const band = makeVeil(frameId, {
      x: 0,
      y: 0,
      width: 360,
      height: H,
      fill: ink,
      name: '侧栏',
    });
    // 椭圆肖像 60px 边距，下方职衔
    const face = makeImageInRect(frameId, assets, photo, 60, 72, 240, 320, {
      name: '肖像',
      mask: 'ellipse',
      locked: true,
    });
    // 细肖像环——层次而非描边
    const ring = makeShape(frameId, 'ellipse', {
      x: 50,
      y: 62,
      width: 260,
      height: 340,
      fill: 'transparent',
      stroke: 'rgba(247,242,234,0.28)',
      strokeWidth: 1.5,
      name: '肖像环',
    });
    const role = makeRoleText(frameId, 'meta', 'ART DIRECTOR', 60, 464, RAMP_CARD, {
      color: 'rgba(247,242,234,0.72)',
      fontFamily: FONT_META,
      fontSize: 14,
      bold: true,
    });

    // ── 右：米纸场，姓名竖排 + 英文竖排 + 联系 ─────────────
    // 姓名 72px（主标题），英文 20px 竖排作副轴
    const nameV = makeRoleText(frameId, 'display', '林昭', 452, 96, RAMP_CARD, {
      color: ink,
      fontSize: 72,
      fontFamily: FONT_SONG,
      bold: false,
      writingMode: 'vertical',
      align: 'left',
    });
    const en = makeRoleText(frameId, 'latinSerif', 'LIN ZHAO', 560, 120, RAMP_CARD, {
      color: accent,
      fontSize: 20,
      fontFamily: FONT_LATIN_SERIF,
      writingMode: 'vertical',
    });
    const line = makeLine(frameId, 452, 348, 120, 0, {
      stroke: accent,
      strokeWidth: 2,
      name: '细线',
      locked: true,
    });
    const contact = makeRoleText(
      frameId,
      'body',
      'studio@piclab.local\n+86 138 0000 0000',
      452,
      424,
      RAMP_CARD,
      { color: ink, fontSize: 17, lineHeight: 1.55, fontFamily: FONT_META },
    );

    finish(doc, frame, [band, face, ring, role, nameV, en, line, contact]);

    // ── 背面：深褐底 + 米纸内卡 + 朱印 ─────────────────────
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
    const mark = makeRoleText(backId, 'script', '昭', W / 2, H / 2 - 44, RAMP_CARD, {
      color: accent,
      align: 'center',
      fontSize: 112,
      fontFamily: FONT_KAI,
    });
    const backLine = makeLine(backId, W / 2 - 60, H / 2 + 52, 120, 0, {
      stroke: accent,
      strokeWidth: 1.5,
      name: '背线',
      locked: true,
    });
    const url = makeRoleText(backId, 'meta', 'piclab.studio / linzhao', W / 2, H - 112, RAMP_CARD, {
      color: ink,
      align: 'center',
      fontFamily: FONT_META,
      fontSize: 16,
    });
    attach(back, [backPaper.id, mark.id, backLine.id, url.id]);
    put(doc, [back, backPaper, mark, backLine, url]);
    doc.activePageId = doc.pages[0]!.id;
    return doc;
  },
};

/* ═══════════════════════════════════════════════════════════
 * CARD B — cinnabar seal
 * Brief: letterpress designer · job = "name sticks"
 * Palette: 米纸 field 60% · 纸纹 30% · 朱红 accent 10%
 * Type: 马善政 印 96 / 得意黑 name 56 / 小薇 title 18 / Outfit meta 15
 * Grid: 左轴 90 · 印章右下（黄金角）· 信息单列左排
 * Signature: 大方朱印 + 极端留白 + 朱红细线收尾
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

    // ── field: 纸纹弱化打底（不喧宾夺主）────────────────────
    const bg = makeCoverImage(frameId, assets, tex, W, H, {
      name: '纸纹',
      opacity: 0.42,
      locked: true,
    });

    // ── 右下黄金角：朱印 + 细线（签名区，10% 面积）──────────
    const stamp = makeShape(frameId, 'roundRect', {
      x: W - 300,
      y: 96,
      width: 208,
      height: 208,
      fill: seal,
      cornerRadius: 12,
      name: '印面',
      locked: true,
    });
    const sealChar = makeRoleText(frameId, 'script', '印', W - 196, 200, RAMP_CARD, {
      color: paper,
      align: 'center',
      fontSize: 92,
      fontFamily: FONT_KAI,
    });
    const sealLine = makeLine(frameId, W - 300, 344, 208, 0, {
      stroke: seal,
      strokeWidth: 1.5,
      name: '印线',
      locked: true,
    });

    // ── 左轴 90：姓名 → 职衔 → 细线 → 联系方式（层级 2:1）──
    const name = makeRoleText(frameId, 'display', '沈砚', 90, 168, RAMP_CARD, {
      color: ink,
      fontSize: 56,
      fontFamily: FONT_HEI,
      bold: true,
    });
    const title = makeRoleText(frameId, 'fang', '独立设计师 · 字体与印刷', 90, 248, RAMP_CARD, {
      color: 'rgba(28,24,20,0.62)',
      fontFamily: FONT_FANG,
      fontSize: 22,
    });
    const rule = makeLine(frameId, 90, 320, 160, 0, {
      stroke: seal,
      strokeWidth: 2,
      name: '细线',
      locked: true,
    });
    const meta = makeRoleText(
      frameId,
      'meta',
      'WECHAT  shenyan.print\nMAIL  hi@shenyan.design',
      90,
      384,
      RAMP_CARD,
      { color: ink, fontSize: 15, lineHeight: 1.6, fontFamily: FONT_META },
    );

    return finish(doc, frame, [bg, stamp, sealChar, sealLine, name, title, rule, meta]);
  },
};

/* ═══════════════════════════════════════════════════════════
 * AD A — price split
 * Brief: weekend set promo · job = "price at a glance"
 * Palette: 摄影 field 60% · 奶油 panel 30% · 深褐 ink + 价格 CTA 10%
 * Type: Bebas price 184 / 得意黑 title 60 / Outfit meta 22 / 小薇 unit 24
 * Grid: 照片 52% 高出血 · 奶油价区 48% · 左轴 72
 * Signature: 巨价数字压住照片下缘（halo 可读）+ 奶油价区
 * ═══════════════════════════════════════════════════════════ */
const adPriceSplit: BuiltinTemplate = {
  id: 'builtin-ad-price',
  name: '分屏巨价 · 广告',
  description: '上摄影 + 巨价压线 · 促销一眼可读',
  sceneId: 'ad',
  tags: ['促销', '摄影'],
  build: async ({ assets }) => {
    const W = 1080;
    const H = 1080;
    const M = 72; // 左轴
    const ink = '#14110E';
    const cream = '#FFF6E8';
    const photo = await loadTemplateAsset('food');
    const { doc, frameId } = emptyDoc('分屏巨价', 'ad');
    const frame = makeFrame(frameId, W, H, '广告', ink);

    // ── field: 照片占上部 52% 出血 ──────────────────────────
    const photoBand = makeImageInRect(frameId, assets, photo, 0, 0, W, Math.round(H * 0.52), {
      name: '美食',
      locked: true,
    });

    // ── 巨价压住照片下缘（白字 + halo，可读性描边）──────────
    const eyebrow = withHalo(
      makeRoleText(frameId, 'meta', 'WEEKEND SET', M, 96, RAMP_SQUARE, {
        color: cream,
        fontFamily: FONT_META,
        bold: true,
        fontSize: 22,
      }),
      'rgba(20,17,14,0.55)',
      3,
    );
    const num = condenseText(
      withHalo(
        makeRoleText(frameId, 'latinDisplay', '128', M, 216, RAMP_SQUARE, {
          color: cream,
          fontSize: 184,
          fontFamily: FONT_LATIN_DISPLAY,
          bold: true,
        }),
        'rgba(20,17,14,0.5)',
        6,
      ),
      0.88,
    );
    const unit = withHalo(
      makeRoleText(frameId, 'caption', '元起  ·  含软饮', M + 4, 428, RAMP_SQUARE, {
        color: cream,
        fontFamily: FONT_FANG,
        fontSize: 24,
      }),
      'rgba(20,17,14,0.5)',
      3,
    );

    // ── 奶油价区承接 48% ────────────────────────────────────
    const panel = makeVeil(frameId, {
      x: 0,
      y: Math.round(H * 0.52),
      width: W,
      height: H - Math.round(H * 0.52),
      fill: cream,
      name: '价区',
    });
    const title = makeRoleText(frameId, 'display', '双人餐', M, Math.round(H * 0.62), RAMP_SQUARE, {
      color: ink,
      fontSize: 60,
      fontFamily: FONT_HEI,
      bold: true,
    });
    // CTA 按钮是唯一强调动作（深褐钮 + 米色字）
    const cta = makeShape(frameId, 'roundRect', {
      x: M,
      y: Math.round(H * 0.78),
      width: 264,
      height: 72,
      fill: ink,
      cornerRadius: 8,
      name: '按钮',
    });
    const ctaT = makeRoleText(frameId, 'meta', '立即预订', M + 132, Math.round(H * 0.78) + 40, RAMP_SQUARE, {
      color: cream,
      align: 'center',
      fontFamily: FONT_META,
      bold: true,
      fontSize: 22,
    });

    return finish(doc, frame, [photoBand, eyebrow, num, unit, panel, title, cta, ctaT]);
  },
};

/* ═══════════════════════════════════════════════════════════
 * AD B — material corner
 * Brief: stone texture homeware · job = "touch it"
 * Palette: 石材 field 60% · 深罩 30% · 沙金 accent 10%
 * Type: Playfair brand 30 / 得意黑 title 76 / 小薇 sub 26 / Mono SKU 26
 * Grid: 右上角饰方盘 · 左下信息左轴 64
 * Signature: 沙金角盘 + 左信息块（无抢戏 CTA）
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
    // bottom veil kept slim — photo stays the star
    const shade = makeVeil(frameId, {
      x: 0,
      y: H * 0.66,
      width: W,
      height: H * 0.34,
      fill: 'rgba(10,12,16,0.72)',
      name: '下罩',
    });
    const chip = makeShape(frameId, 'rect', {
      x: W - 232,
      y: 48,
      width: 172,
      height: 172,
      fill: accent,
      name: '角饰',
      locked: true,
    });
    const sku = makeRoleText(frameId, 'meta', 'SKU\n04', W - 146, 106, RAMP_SQUARE, {
      color: ink,
      align: 'center',
      fontFamily: FONT_MONO,
      bold: true,
      fontSize: 26,
      lineHeight: 1.25,
    });
    const brand = makeRoleText(frameId, 'latinSerif', 'ATELIER RAW', 64, 740, RAMP_SQUARE, {
      color: accent,
      fontFamily: FONT_LATIN_SERIF,
      fontSize: 30,
    });
    const title = makeRoleText(frameId, 'display', '触感系列', 64, 836, RAMP_SQUARE, {
      color: bone,
      fontSize: 76,
      fontFamily: FONT_HEI,
      bold: true,
    });
    const sub = makeRoleText(frameId, 'fang', '天然纹理  ·  限量配色', 64, 940, RAMP_SQUARE, {
      color: 'rgba(242,238,230,0.72)',
      fontFamily: FONT_FANG,
      fontSize: 26,
    });

    return finish(doc, frame, [bg, shade, chip, sku, brand, title, sub]);
  },
};

/* ═══════════════════════════════════════════════════════════
 * SOCIAL A — night quote
 * Brief: city-night essay · job = "slow down"
 * Palette: 墨色字场 40% · 霓虹照片 60% · 金色 accent 10%
 * Type: 马善政 夜 120 / 文楷 quote 48 / Outfit issue 20 / 小薇 credit 20
 * Grid: 左字场 44% · 右照片 56% · 金分线 · 阅读路径纵向
 * Signature: 金色单字 mark 起手 + 三行金句 + 底部 credit
 * ═══════════════════════════════════════════════════════════ */
const socialQuoteCover: BuiltinTemplate = {
  id: 'builtin-social-quote',
  name: '金句夜城 · 社交',
  description: '霓虹夜景侧图 + 左列金句 · 无底坞',
  sceneId: 'social',
  tags: ['摄影', '编辑'],
  build: async ({ assets }) => {
    const W = 1080;
    const H = 1080;
    const ink = '#0B0910';
    const bone = '#FFF6E8';
    const gold = '#E8C56A';
    const photo = await loadTemplateAsset('neon');
    const { doc, frameId } = emptyDoc('金句夜城', 'social');
    const frame = makeFrame(frameId, W, H, '方图', '#0A0810');

    // photo occupies right 56%, text lives on an ink field left 44%
    const field = makeVeil(frameId, {
      x: 0,
      y: 0,
      width: Math.round(W * 0.44),
      height: H,
      fill: ink,
      name: '字场',
    });
    const plate = makeImageInRect(
      frameId,
      assets,
      photo,
      Math.round(W * 0.44),
      0,
      Math.round(W * 0.56),
      H,
      { name: '夜城', locked: true },
    );
    const hair = makeLine(frameId, Math.round(W * 0.44), 0, 0, H, {
      stroke: gold,
      strokeWidth: 2,
      name: '分线',
      locked: true,
    });

    // reading path: mark (120) → quote (48) → credit (20)
    const issue = makeRoleText(frameId, 'meta', 'NIGHT NOTE  ·  03', 56, 76, RAMP_SQUARE, {
      color: gold,
      fontFamily: FONT_META,
      bold: true,
      fontSize: 20,
    });
    const mark = makeRoleText(frameId, 'script', '夜', 56, 224, RAMP_SQUARE, {
      color: gold,
      fontSize: 120,
      align: 'left',
      fontFamily: FONT_XING,
    });
    const quote = makeRoleText(
      frameId,
      'serifQuote',
      '灯光把城市\n变成一张\n旧照片',
      56,
      448,
      RAMP_SQUARE,
      {
        color: bone,
        fontSize: 48,
        lineHeight: 1.5,
        fontFamily: FONT_SONG,
      },
    );
    const credit = makeRoleText(frameId, 'caption', '夜记 · 城市随笔', 56, 884, RAMP_SQUARE, {
      color: 'rgba(255,246,232,0.55)',
      fontFamily: FONT_FANG,
      fontSize: 20,
    });

    return finish(doc, frame, [field, plate, hair, issue, mark, quote, credit]);
  },
};

/* ═══════════════════════════════════════════════════════════
 * SOCIAL B — open house announce
 * Brief: studio open house · job = "save the date"
 * Palette: 静物照片 50% · 左罩 40% · 珊瑚日期带 10%
 * Type: Bebas date 128 / Bebas EN 64 / 小薇 caption 22 / Outfit meta 20
 * Grid: 右 240 日期带 · 左 62% 文字块 · 左轴 48
 * Signature: 珊瑚竖日期带 + EN 双行标题 + 珊瑚强调词
 * ═══════════════════════════════════════════════════════════ */
const socialAnnounce: BuiltinTemplate = {
  id: 'builtin-social-announce',
  name: '活动角饰 · 社交',
  description: '静物底 + 日期条带 + 双语报名',
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
    // slim veil only behind the type — not a full bottom band
    const veil = makeVeil(frameId, {
      x: 0,
      y: 0,
      width: Math.round(W * 0.62),
      height: H,
      fill: 'rgba(8,6,4,0.62)',
      name: '左罩',
    });

    // right vertical date band
    const band = makeShape(frameId, 'rect', {
      x: W - 240,
      y: 0,
      width: 240,
      height: H,
      fill: coral,
      name: '日期带',
      locked: true,
    });
    const month = makeRoleText(frameId, 'meta', 'AUG', W - 120, 96, RAMP_SQUARE, {
      color: bone,
      align: 'center',
      fontSize: 22,
      fontFamily: FONT_META,
      bold: true,
    });
    const day = condenseText(
      makeRoleText(frameId, 'latinDisplay', '16', W - 120, 200, RAMP_SQUARE, {
        color: bone,
        align: 'center',
        fontSize: 128,
        fontFamily: FONT_LATIN_DISPLAY,
      }),
      0.86,
    );
    const time = makeRoleText(frameId, 'meta', 'SAT\n14:00', W - 120, 760, RAMP_SQUARE, {
      color: bone,
      align: 'center',
      fontFamily: FONT_META,
      fontSize: 20,
      bold: true,
      lineHeight: 1.5,
    });

    // EN headline + coral accent word — no stroke on solid field
    const en = condenseText(
      makeRoleText(frameId, 'latinDisplay', 'OPEN HOUSE', 48, 640, RAMP_SQUARE, {
        color: bone,
        fontSize: 64,
        fontFamily: FONT_LATIN_DISPLAY,
      }),
      0.76,
    );
    const zh = makeRoleText(frameId, 'display', '开放日', 48, 748, RAMP_SQUARE, {
      color: coral,
      fontSize: 64,
      fontFamily: FONT_HEI,
      bold: true,
    });
    const where = makeRoleText(
      frameId,
      'caption',
      '二楼展厅  ·  免费入场',
      48,
      920,
      RAMP_SQUARE,
      { color: 'rgba(255,248,240,0.8)', fontFamily: FONT_FANG, fontSize: 22 },
    );

    return finish(doc, frame, [bg, veil, band, month, day, time, en, zh, where]);
  },
};

/* ═══════════════════════════════════════════════════════════
 * WECHAT A — headline photo (left-safe)
 * Brief: wechat headline · job = "swipe stops here"
 * Signature: photo right bleed + text left on ink field (safe side)
 * Asset: forest · Export hint 900×383
 * ═══════════════════════════════════════════════════════════ */
const wechatHeadlinePhoto: BuiltinTemplate = {
  id: 'builtin-wechat-headline-photo',
  name: '头条 · 摄影横幅',
  description: '摄影出血 + 左侧信息场 · 安全区不遮挡',
  sceneId: 'wechatCover',
  tags: ['摄影', '编辑'],
  build: async ({ assets }) => {
    const W = 1800;
    const H = 766;
    const bone = '#FFF8EC';
    const lemon = '#FFE566';
    const photo = await loadTemplateAsset('forest');
    const { doc, frameId } = emptyDoc('头条摄影', 'wechatCover');
    const frame = makeFrame(frameId, W, H, '头条', '#0A1610');

    // photo bleeds right 58%, safe text zone left
    const bg = makeImageInRect(frameId, assets, photo, Math.round(W * 0.42), 0, Math.round(W * 0.58), H, {
      name: '风景',
      locked: true,
    });
    const field = makeVeil(frameId, {
      x: 0,
      y: 0,
      width: Math.round(W * 0.42),
      height: H,
      fill: '#0E1C14',
      name: '字场',
    });
    const seam = makeShape(frameId, 'rect', {
      x: Math.round(W * 0.42) - 6,
      y: 0,
      width: 6,
      height: H,
      fill: lemon,
      name: '分线',
    });

    const col = makeRoleText(frameId, 'meta', '深度  ·  周末', 96, 120, RAMP_WECHAT, {
      color: lemon,
      align: 'left',
      fontFamily: FONT_META,
      bold: true,
      fontSize: 24,
    });
    const title = makeRoleText(frameId, 'display', '把风景\n写成标题', 96, 240, RAMP_WECHAT, {
      color: bone,
      align: 'left',
      fontSize: 76,
      lineHeight: 1.2,
      fontFamily: FONT_HEI,
      bold: true,
    });
    const sub = makeRoleText(frameId, 'fang', '公众号头条封面', 96, H - 120, RAMP_WECHAT, {
      color: 'rgba(255,248,236,0.75)',
      align: 'left',
      fontFamily: FONT_FANG,
      fontSize: 24,
    });

    return finish(doc, frame, [bg, field, seam, col, title, sub]);
  },
};

/* ═══════════════════════════════════════════════════════════
 * WECHAT B — editorial color blocks
 * Brief: opinion column · job = "one clear point"
 * Palette: 深绿 field 60% · 墨绿左场 30% · 金色 accent 10%
 * Type: 马善政 读 168 / 得意黑 title 60 / Outfit col 26 / 小薇 foot 24
 * Grid: 左 40% 深色字场 · 右 60% 浅字场 · 金线分界
 * Signature: 金色衬底"读"字（低饱和）+ 右区左轴排版
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

    // left 40% deep ink field, right 60% field, thin gold seam
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
      width: 8,
      height: H,
      fill: accent,
      name: '金线',
    });
    // 衬底大字：马善政单字，低饱和金，左场中上
    const big = makeRoleText(frameId, 'script', '读', Math.round(W * 0.2), H * 0.42, RAMP_WECHAT, {
      color: 'rgba(201,162,39,0.42)',
      align: 'center',
      fontSize: 168,
      fontFamily: FONT_KAI,
    });
    // right field: left-aligned on one axis
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
 * Brief: sub-item square · job = "benefit hook"
 * Signature: number left on ink, photo right, corner coral tick
 * Asset: mist
 * ═══════════════════════════════════════════════════════════ */
const wechatSubSquare: BuiltinTemplate = {
  id: 'builtin-wechat-sub-square',
  name: '次条 · 数字钩子',
  description: '1:1 次条方图 · 左数字右图',
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

    // photo bleeds right, number + title on left ink field
    const bg = makeImageInRect(frameId, assets, photo, Math.round(W * 0.46), 0, Math.round(W * 0.54), H, {
      name: '氛围',
      locked: true,
    });
    const field = makeVeil(frameId, {
      x: 0,
      y: 0,
      width: Math.round(W * 0.46),
      height: H,
      fill: 'rgba(12,11,10,0.96)',
      name: '字场',
    });
    const tick = makeShape(frameId, 'rect', {
      x: Math.round(W * 0.46) - 8,
      y: 0,
      width: 8,
      height: H,
      fill: coral,
      name: '边标',
    });

    const num = makeRoleText(frameId, 'latinDisplay', '07', 72, 296, RAMP_SQUARE, {
      color: coral,
      align: 'left',
      fontSize: 168,
      fontFamily: FONT_LATIN_DISPLAY,
    });
    const title = makeRoleText(frameId, 'display', '条实用清单', 76, 524, RAMP_SQUARE, {
      color: bone,
      align: 'left',
      fontSize: 56,
      fontFamily: FONT_HEI,
      bold: true,
    });
    const sub = makeRoleText(frameId, 'caption', '次条封面 · 收藏备用', 76, 668, RAMP_SQUARE, {
      color: 'rgba(255,248,236,0.65)',
      align: 'left',
      fontFamily: FONT_FANG,
      fontSize: 24,
    });

    return finish(doc, frame, [bg, field, tick, num, title, sub]);
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
    // slim bottom title bar instead of 220px dock
    const bar = makeVeil(frameId, {
      x: 0,
      y: H - 130,
      width: W,
      height: 130,
      fill: 'rgba(12,11,10,0.88)',
      name: '底栏',
    });
    const title = makeRoleText(frameId, 'display', '值得入手', 56, H - 74, RAMP_SQUARE, {
      color: bone,
      fontSize: 52,
      fontFamily: FONT_YUAN,
      bold: true,
    });
    const sub = makeRoleText(frameId, 'caption', '本周好物 · 实测推荐', W - 56, H - 74, RAMP_SQUARE, {
      color: 'rgba(255,248,236,0.6)',
      align: 'right',
      fontFamily: FONT_FANG,
      fontSize: 20,
    });

    return finish(doc, frame, [bg, tag, tagT, bar, title, sub]);
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
