import type { ScenePlugin } from '../plugins/types';
import { emptyDoc, fitImageNode, makeFrame, makeText } from './helpers';

export const retouchScene: ScenePlugin = {
  id: 'retouch',
  label: '修图',
  description: '以图片尺寸为画板，调色与加字后导出',
  tools: ['select', 'text', 'image', 'export'],
  createDocument: (opts) => {
    const assets = opts?.assets;
    if (!assets) throw new Error('retouch scene requires assets');
    const img = opts?.fromImage;
    const w = img?.width ?? 1080;
    const h = img?.height ?? 1080;
    const { doc, frameId } = emptyDoc('修图', 'retouch');
    const frame = makeFrame(frameId, w, h, '画板', '#0b0c0e');
    const children: string[] = [];

    if (img) {
      const imageNode = fitImageNode(frameId, assets, img, w, h);
      doc.nodes[imageNode.id] = imageNode;
      children.push(imageNode.id);
    } else {
      const tip = makeText(frameId, '导入图片开始修图', w / 2, h / 2, 36, '提示');
      tip.color = '#8a8678';
      tip.strokeWidth = 0;
      doc.nodes[tip.id] = tip;
      children.push(tip.id);
    }

    frame.children = children;
    doc.nodes[frameId] = frame;
    return doc;
  },
};
