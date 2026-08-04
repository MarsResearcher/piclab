import type { AssetStore } from '../store/assetStore';
import type { ScenePlugin } from '../plugins/types';
import {
  FONT_FANG,
  FONT_HEI,
  FONT_META,
  COBALT,
} from '../templates/templatePalettes';
import { emptyDoc, makeFrame, makeLine, makeShape, makeText } from './helpers';
import { makeCoverImage } from '../templates/templateAssets';

/** Design board ≈2× export for comfort; export hint is 900×383. */
const W = 1800;
const H = 766;
const P = COBALT;
const M = 88; // 左轴

export const wechatCoverScene: ScenePlugin = {
  id: 'wechatCover',
  label: '公众号',
  description: '公众号封面：头条横幅 2.35:1（设计 1800×766 / 导出 900×383）与次条方图',
  tools: ['select', 'text', 'image', 'shape', 'export'],
  exportHints: [
    { width: 900, height: 383, name: '头条封面' },
    { width: 1080, height: 1080, name: '次条方图' },
  ],
  createDocument: (opts) => {
    const assets = opts?.assets as AssetStore | undefined;
    const { doc, frameId } = emptyDoc('公众号封面', 'wechatCover');
    const frame = makeFrame(frameId, W, H, '头条画板', P.field);
    const children: string[] = [];

    if (opts?.fromImage && assets) {
      const imageNode = makeCoverImage(frameId, assets, opts.fromImage, W, H, {
        name: '封面图',
        opacity: 0.85,
      });
      doc.nodes[imageNode.id] = imageNode;
      children.push(imageNode.id);
    }

    // ── 左侧信息场（安全区内的文字排版）────────────────────
    // 窄竖条 + 标题区，右侧留白/图片呼吸
    const veil = makeShape(frameId, 'rect', {
      x: 0,
      y: 0,
      width: Math.round(W * 0.42),
      height: H,
      fill: 'rgba(11,31,74,0.72)',
      name: '字场',
      locked: true,
    });
    const seam = makeLine(frameId, Math.round(W * 0.42), 0, 0, H, {
      stroke: P.accent,
      strokeWidth: 3,
      name: '分线',
      locked: true,
    });

    // eyebrow（栏目 · 日期）
    const col = makeText(frameId, '深度  ·  专栏', M, 120, 24, {
      name: '栏目',
      align: 'left',
      color: P.accent,
      strokeWidth: 0,
      bold: true,
      fontFamily: FONT_META,
    });

    // hero 标题（左轴，安全区 60% 内）
    const title = makeText(frameId, '主标题', M, 240, 64, {
      name: '标题',
      align: 'left',
      color: P.ink,
      strokeWidth: 0,
      fontFamily: FONT_HEI,
    });
    const sub = makeText(frameId, '副标题 · 一句话摘要', M, 360, 26, {
      name: '副标',
      align: 'left',
      color: P.mute,
      strokeWidth: 0,
      bold: false,
      fontFamily: FONT_FANG,
    });

    // 底部署名
    const foot = makeText(frameId, 'PICLAB 公众号', M, H - 120, 22, {
      name: '署名',
      align: 'left',
      color: 'rgba(255,255,255,0.7)',
      strokeWidth: 0,
      bold: false,
      fontFamily: FONT_META,
    });

    doc.nodes[frameId] = frame;
    for (const n of [veil, seam, col, title, sub, foot]) {
      doc.nodes[n.id] = n;
      children.push(n.id);
    }
    frame.children = children;
    doc.selection = [title.id];
    return doc;
  },
};
