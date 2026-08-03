import type { AssetStore } from '../store/assetStore';
import type { ScenePlugin } from '../plugins/types';
import { FONT_HEI, WARM_PAPER } from '../templates/templatePalettes';
import { emptyDoc, fitImageNode, makeFrame, makeShape, makeText } from './helpers';

const W = 1080;
const H = 1080;
const P = WARM_PAPER;

export const adScene: ScenePlugin = {
  id: 'ad',
  label: '广告',
  description: '1080×1080 方图广告，上图区 + 下信息条',
  tools: ['select', 'text', 'image', 'export'],
  exportHints: [{ width: W, height: H, name: '广告方图' }],
  createDocument: (opts) => {
    const assets = opts?.assets as AssetStore | undefined;
    const { doc, frameId } = emptyDoc('广告', 'ad');
    const frame = makeFrame(frameId, W, H, '广告画板', P.bg);
    const children: string[] = [];
    const m = Math.round(W * 0.07);

    const imageBand = makeShape(frameId, 'rect', {
      x: 0,
      y: 0,
      width: W,
      height: Math.round(H * 0.66),
      fill: P.surface,
      name: '图区',
    });
    imageBand.locked = true;

    if (opts?.fromImage && assets) {
      const imageNode = fitImageNode(frameId, assets, opts.fromImage, W, H, '主图');
      doc.nodes[imageNode.id] = imageNode;
      children.push(imageNode.id);
    }

    const infoBand = makeShape(frameId, 'rect', {
      x: 0,
      y: H * 0.66,
      width: W,
      height: H * 0.34,
      fill: P.bgAlt,
      name: '信息条',
    });
    infoBand.locked = true;

    const hook = makeText(frameId, '核心卖点', m, H * 0.8, 48, {
      name: '卖点',
      align: 'left',
      color: P.ink,
      strokeWidth: 0,
      fontFamily: FONT_HEI,
    });

    doc.nodes[imageBand.id] = imageBand;
    doc.nodes[infoBand.id] = infoBand;
    doc.nodes[hook.id] = hook;
    children.push(imageBand.id, infoBand.id, hook.id);

    frame.children = children;
    doc.nodes[frameId] = frame;
    doc.selection = [hook.id];
    return doc;
  },
};
