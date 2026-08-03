import type { AssetStore } from '../store/assetStore';
import type { ScenePlugin } from '../plugins/types';
import { FONT_HEI, GRAPHITE } from '../templates/templatePalettes';
import { emptyDoc, fitImageNode, makeFrame, makeShape, makeText } from './helpers';

const W = 1080;
const H = 1920;
const P = GRAPHITE;

export const posterScene: ScenePlugin = {
  id: 'poster',
  label: '海报',
  description: '1080×1920 竖版海报，上留白场 + 底部信息带',
  tools: ['select', 'text', 'image', 'export'],
  exportHints: [{ width: W, height: H, name: '海报' }],
  createDocument: (opts) => {
    const assets = opts?.assets as AssetStore | undefined;
    const { doc, frameId } = emptyDoc('海报', 'poster');
    const frame = makeFrame(frameId, W, H, '海报画板', P.bg);
    const children: string[] = [];
    const m = Math.round(W * 0.08);

    const topField = makeShape(frameId, 'rect', {
      x: 0,
      y: 0,
      width: W,
      height: Math.round(H * 0.62),
      fill: P.bgAlt,
      name: '上色场',
    });
    topField.locked = true;

    if (opts?.fromImage && assets) {
      const imageNode = fitImageNode(frameId, assets, opts.fromImage, W, H, '主图');
      doc.nodes[imageNode.id] = imageNode;
      children.push(imageNode.id);
    }

    const infoBand = makeShape(frameId, 'rect', {
      x: 0,
      y: H * 0.72,
      width: W,
      height: H * 0.28,
      fill: P.surface,
      name: '信息带',
    });
    infoBand.locked = true;

    const title = makeText(frameId, '主标题', m, H * 0.8, 64, {
      name: '标题',
      align: 'left',
      color: P.ink,
      strokeWidth: 0,
      fontFamily: FONT_HEI,
    });
    const sub = makeText(frameId, '副文案 / 行动号召', m, H * 0.9, 26, {
      name: '副文案',
      align: 'left',
      color: P.muted,
      strokeWidth: 0,
      bold: false,
    });

    doc.nodes[topField.id] = topField;
    doc.nodes[infoBand.id] = infoBand;
    doc.nodes[title.id] = title;
    doc.nodes[sub.id] = sub;
    children.push(topField.id, infoBand.id, title.id, sub.id);

    frame.children = children;
    doc.nodes[frameId] = frame;
    doc.selection = [title.id];
    return doc;
  },
};
