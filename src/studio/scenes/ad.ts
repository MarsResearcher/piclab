import type { AssetStore } from '../store/assetStore';
import type { ScenePlugin } from '../plugins/types';
import {
  FONT_FANG,
  FONT_HEI,
  FONT_LATIN_DISPLAY,
  FONT_META,
  PRICE,
} from '../templates/templatePalettes';
import { emptyDoc, fitImageNode, makeFrame, makeLine, makeShape, makeText } from './helpers';

const W = 1080;
const H = 1080;
const P = PRICE;
const M = 72; // 左轴
const R = W - M; // 右轴

export const adScene: ScenePlugin = {
  id: 'ad',
  label: '广告',
  description: '1080×1080 方图广告，上图区 + 下信息条',
  tools: ['select', 'text', 'image', 'export'],
  exportHints: [{ width: W, height: H, name: '广告方图' }],
  createDocument: (opts) => {
    const assets = opts?.assets as AssetStore | undefined;
    const { doc, frameId } = emptyDoc('广告', 'ad');
    const frame = makeFrame(frameId, W, H, '广告画板', P.field);
    const children: string[] = [];

    if (opts?.fromImage && assets) {
      const imageNode = fitImageNode(frameId, assets, opts.fromImage, W, H, '主图');
      imageNode.opacity = 0.9;
      doc.nodes[imageNode.id] = imageNode;
      children.push(imageNode.id);
    }

    // ── 顶部 meta（左品牌 · 右编号）────────────────────────
    const metaL = makeText(frameId, 'PICLAB DROP', M, 88, 22, {
      name: '品牌',
      align: 'left',
      color: P.mute,
      strokeWidth: 0,
      bold: true,
      fontFamily: FONT_META,
    });
    const metaR = makeText(frameId, 'NO. 01', R, 88, 22, {
      name: '编号',
      align: 'right',
      color: P.accent,
      strokeWidth: 0,
      bold: true,
      fontFamily: FONT_META,
    });

    // ── 巨价数字（Bebas 压缩感）────────────────────────────
    const price = makeText(frameId, '99', M, 240, 200, {
      name: '价格',
      align: 'left',
      color: P.ink,
      strokeWidth: 0,
      fontFamily: FONT_LATIN_DISPLAY,
    });
    const unit = makeText(frameId, '元', 360, 380, 40, {
      name: '单位',
      align: 'left',
      color: P.ink,
      strokeWidth: 0,
      bold: false,
      fontFamily: FONT_HEI,
    });
    const hook = makeText(frameId, '限时好物  ·  买一送一', M, 500, 30, {
      name: '卖点',
      align: 'left',
      color: P.mute,
      strokeWidth: 0,
      bold: false,
      fontFamily: FONT_FANG,
    });

    // ── 底部信息条（价格区与 CTA）──────────────────────────
    const footLine = makeLine(frameId, M, H - 200, W - M * 2, 0, {
      stroke: 'rgba(255,255,255,0.14)',
      strokeWidth: 1,
      name: '脚线',
      locked: true,
    });
    const note = makeText(frameId, '活动最终解释权归品牌方所有', M, H - 132, 18, {
      name: '小字',
      align: 'left',
      color: P.mute,
      strokeWidth: 0,
      bold: false,
      fontFamily: FONT_META,
    });
    const cta = makeShape(frameId, 'roundRect', {
      x: R - 224,
      y: H - 160,
      width: 224,
      height: 64,
      fill: P.accent,
      cornerRadius: 8,
      name: '按钮',
    });
    const ctaT = makeText(frameId, '立即抢购', R - 112, H - 132, 22, {
      name: '按钮字',
      align: 'center',
      color: P.field,
      strokeWidth: 0,
      bold: true,
      fontFamily: FONT_META,
    });

    doc.nodes[frameId] = frame;
    for (const n of [metaL, metaR, price, unit, hook, footLine, note, cta, ctaT]) {
      doc.nodes[n.id] = n;
      children.push(n.id);
    }
    frame.children = children;
    doc.selection = [price.id];
    return doc;
  },
};
