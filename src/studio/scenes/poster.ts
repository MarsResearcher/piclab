import type { AssetStore } from '../store/assetStore';
import type { ScenePlugin } from '../plugins/types';
import {
  FONT_FANG,
  FONT_HEI,
  FONT_META,
  FONT_SONG,
  GALLERY,
} from '../templates/templatePalettes';
import { emptyDoc, fitImageNode, makeFrame, makeLine, makeText } from './helpers';

const W = 1080;
const H = 1920;
const P = GALLERY;
const M = 72; // 左轴
const R = W - M; // 右轴

export const posterScene: ScenePlugin = {
  id: 'poster',
  label: '海报',
  description: '1080×1920 竖版海报，上留白场 + 底部信息带',
  tools: ['select', 'text', 'image', 'export'],
  exportHints: [{ width: W, height: H, name: '海报' }],
  createDocument: (opts) => {
    const assets = opts?.assets as AssetStore | undefined;
    const { doc, frameId } = emptyDoc('海报', 'poster');
    const frame = makeFrame(frameId, W, H, '海报画板', P.field);
    const children: string[] = [];

    if (opts?.fromImage && assets) {
      const imageNode = fitImageNode(frameId, assets, opts.fromImage, W, H, '主图');
      imageNode.opacity = 0.5;
      doc.nodes[imageNode.id] = imageNode;
      children.push(imageNode.id);
    }

    // ── eyebrow: 顶部 meta 行（左 VOL · 右日期）──────────────
    const metaL = makeText(frameId, 'VOL. 01  ·  ISSUE', M, 96, 22, {
      name: '期号',
      align: 'left',
      color: P.mute,
      strokeWidth: 0,
      bold: false,
      fontFamily: FONT_META,
    });
    const metaR = makeText(frameId, '08.04', R, 96, 22, {
      name: '日期',
      align: 'right',
      color: P.accent,
      strokeWidth: 0,
      bold: true,
      fontFamily: FONT_META,
    });

    // ── hero: 标题区画面上 1/3，左侧轴大字 ──────────────────
    const title = makeText(frameId, '主标题', M, 280, 104, {
      name: '标题',
      align: 'left',
      color: P.ink,
      strokeWidth: 0,
      fontFamily: FONT_HEI,
    });
    const rule = makeLine(frameId, M, 460, 96, 0, {
      stroke: P.accent,
      strokeWidth: 3,
      name: '标题下划线',
      locked: true,
    });
    const sub = makeText(frameId, '副标题 · 一句话说明', M, 520, 30, {
      name: '副标题',
      align: 'left',
      color: P.mute,
      strokeWidth: 0,
      bold: false,
      fontFamily: FONT_FANG,
    });

    // ── verse: 画面中部的诗句占位（文气留白）────────────────
    const verse = makeText(frameId, '把一行字\n留在这里', M, H * 0.46, 40, {
      name: '诗句',
      align: 'left',
      color: P.ink,
      strokeWidth: 0,
      bold: false,
      lineHeight: 1.6,
      fontFamily: FONT_SONG,
    });

    // ── footer: 底部信息条（白底 + 上细线）─────────────────
    const footLine = makeLine(frameId, M, H - 200, W - M * 2, 0, {
      stroke: 'rgba(17,19,24,0.12)',
      strokeWidth: 1,
      name: '脚线',
      locked: true,
    });
    const footL = makeText(frameId, 'PICLAB STUDIO', M, H - 136, 20, {
      name: '署名',
      align: 'left',
      color: P.mute,
      strokeWidth: 0,
      bold: false,
      fontFamily: FONT_META,
    });
    const footR = makeText(frameId, '了解更多', R, H - 136, 20, {
      name: '指引',
      align: 'right',
      color: P.accent,
      strokeWidth: 0,
      bold: true,
      fontFamily: FONT_META,
    });

    // ── 右侧竖排引导字（签名动作）──────────────────────────
    const vertical = makeText(frameId, '新海报', R - 36, 360, 24, {
      name: '竖排引导',
      align: 'center',
      color: 'rgba(17,19,24,0.3)',
      strokeWidth: 0,
      bold: false,
      writingMode: 'vertical',
      fontFamily: FONT_META,
    });

    doc.nodes[frameId] = frame;
    for (const n of [
      metaL,
      metaR,
      title,
      rule,
      sub,
      verse,
      footLine,
      footL,
      footR,
      vertical,
    ]) {
      doc.nodes[n.id] = n;
      children.push(n.id);
    }
    frame.children = children;
    doc.selection = [title.id];
    return doc;
  },
};
