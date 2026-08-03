import type { AssetStore } from '../store/assetStore';
import type { ScenePlugin } from '../plugins/types';
import { FONT_HEI, NIGHT_SEA } from '../templates/templatePalettes';
import { emptyDoc, fitImageNode, makeFrame, makeShape, makeText } from './helpers';

const W = 1080;
const H = 1080;
const P = NIGHT_SEA;

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
    const frame = makeFrame(frameId, W, H, '社交画板', P.bg);
    const children: string[] = [];
    const m = Math.round(W * 0.08);

    const field = makeShape(frameId, 'rect', {
      x: 0,
      y: 0,
      width: W,
      height: H * 0.72,
      fill: P.bgAlt,
      name: '主色场',
    });
    field.locked = true;

    if (opts?.fromImage && assets) {
      const imageNode = fitImageNode(frameId, assets, opts.fromImage, W, H, '主图');
      doc.nodes[imageNode.id] = imageNode;
      children.push(imageNode.id);
    }

    const accent = makeShape(frameId, 'rect', {
      x: W * 0.62,
      y: H * 0.12,
      width: W * 0.28,
      height: H * 0.28,
      fill: P.surface,
      name: '几何块',
    });
    accent.locked = true;

    const foot = makeShape(frameId, 'rect', {
      x: 0,
      y: H * 0.78,
      width: W,
      height: H * 0.22,
      fill: P.surface,
      name: '底条',
    });
    foot.locked = true;

    const caption = makeText(frameId, '配文标题', m, H * 0.42, 48, {
      name: '配文',
      align: 'left',
      color: P.ink,
      strokeWidth: 0,
      fontFamily: FONT_HEI,
    });
    const handle = makeText(frameId, '@账号 · #话题', m, H * 0.9, 22, {
      name: '话题',
      align: 'left',
      color: P.muted,
      strokeWidth: 0,
      bold: false,
    });

    doc.nodes[field.id] = field;
    doc.nodes[accent.id] = accent;
    doc.nodes[foot.id] = foot;
    doc.nodes[caption.id] = caption;
    doc.nodes[handle.id] = handle;
    children.push(field.id, accent.id, foot.id, caption.id, handle.id);

    frame.children = children;
    doc.nodes[frameId] = frame;
    doc.selection = [caption.id];
    return doc;
  },
};
