import type { AssetStore } from '../store/assetStore';
import type { ScenePlugin } from '../plugins/types';
import {
  FONT_LATIN_SERIF,
  FONT_META,
  FONT_SONG,
  CHARCOAL,
} from '../templates/templatePalettes';
import { emptyDoc, fitImageNode, makeFrame, makeLine, makeText } from './helpers';

const W = 1080;
const H = 1080;
const P = CHARCOAL;
const M = 72; // 左轴
const R = W - M; // 右轴

export const socialScene: ScenePlugin = {
  id: 'social',
  label: '社交',
  description: '社交方图画板，几何分区 + 底条配文',
  tools: ['select', 'text', 'image', 'export'],
  exportHints: [
    { width: 1080, height: 1080, name: '方图' },
    { width: 1080, height: 1440, name: '竖图 3:4' },
    { width: 1080, height: 1920, name: 'Story' },
  ],
  createDocument: (opts) => {
    const assets = opts?.assets as AssetStore | undefined;
    const { doc, frameId } = emptyDoc('社交图', 'social');
    const frame = makeFrame(frameId, W, H, '社交画板', P.field);
    const children: string[] = [];

    if (opts?.fromImage && assets) {
      const imageNode = fitImageNode(frameId, assets, opts.fromImage, W, H, '主图');
      imageNode.opacity = 0.55;
      doc.nodes[imageNode.id] = imageNode;
      children.push(imageNode.id);
    }

    // ── 顶部 meta（左栏目 · 右日期）────────────────────────
    const metaL = makeText(frameId, '深夜随笔', M, 88, 22, {
      name: '栏目',
      align: 'left',
      color: P.mute,
      strokeWidth: 0,
      bold: true,
      fontFamily: FONT_META,
    });
    const metaR = makeText(frameId, '08.04', R, 88, 22, {
      name: '日期',
      align: 'right',
      color: P.accent,
      strokeWidth: 0,
      bold: true,
      fontFamily: FONT_META,
    });

    // ── 金句（serif 文气）+ 强调细线 ───────────────────────
    const quote = makeText(
      frameId,
      '把一句话\n留在这里\n当作今天',
      M,
      280,
      56,
      {
        name: '金句',
        align: 'left',
        color: P.ink,
        strokeWidth: 0,
        bold: false,
        lineHeight: 1.5,
        fontFamily: FONT_SONG,
      },
    );
    const rule = makeLine(frameId, M, 160, 72, 0, {
      stroke: P.accent,
      strokeWidth: 3,
      name: '引线',
      locked: true,
    });

    // ── 底部话题条（细线分隔）──────────────────────────────
    const footLine = makeLine(frameId, M, H - 200, W - M * 2, 0, {
      stroke: 'rgba(242,239,232,0.14)',
      strokeWidth: 1,
      name: '脚线',
      locked: true,
    });
    const tag = makeText(frameId, '@账号  ·  #话题', M, H - 132, 22, {
      name: '话题',
      align: 'left',
      color: P.mute,
      strokeWidth: 0,
      bold: false,
      fontFamily: FONT_META,
    });

    // ── 右下角 EN 副标（签名动作）──────────────────────────
    const en = makeText(frameId, 'LATE NIGHT NOTE', R, H - 132, 22, {
      name: '副标',
      align: 'right',
      color: P.accent,
      strokeWidth: 0,
      bold: false,
      fontFamily: FONT_LATIN_SERIF,
    });

    doc.nodes[frameId] = frame;
    for (const n of [metaL, metaR, quote, rule, footLine, tag, en]) {
      doc.nodes[n.id] = n;
      children.push(n.id);
    }
    frame.children = children;
    doc.selection = [quote.id];
    return doc;
  },
};
