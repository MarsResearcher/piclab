import type { AssetStore } from '../store/assetStore';
import type { ScenePlugin } from '../plugins/types';
import { FONT_HEI, GRAPHITE } from '../templates/templatePalettes';
import { emptyDoc, makeFrame, makeShape, makeText } from './helpers';
import { makeCoverImage } from '../templates/templateAssets';

/** Design board ≈2× export for comfort; export hint is 900×383. */
const W = 1800;
const H = 766;
const P = GRAPHITE;

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
    const frame = makeFrame(frameId, W, H, '头条画板', P.bg);
    const children: string[] = [];

    const field = makeShape(frameId, 'rect', {
      x: 0,
      y: 0,
      width: W,
      height: H,
      fill: P.bgAlt,
      name: '底色',
    });
    field.locked = true;
    doc.nodes[field.id] = field;
    children.push(field.id);

    if (opts?.fromImage && assets) {
      const imageNode = makeCoverImage(frameId, assets, opts.fromImage, W, H, {
        name: '封面图',
      });
      doc.nodes[imageNode.id] = imageNode;
      children.push(imageNode.id);
    }

    // Center safe zone cue (~60% width) — locked, hideable.
    const safe = makeShape(frameId, 'rect', {
      x: Math.round(W * 0.2),
      y: Math.round(H * 0.12),
      width: Math.round(W * 0.6),
      height: Math.round(H * 0.76),
      fill: 'transparent',
      stroke: 'rgba(232,226,214,0.35)',
      strokeWidth: 1,
      name: '安全区参考',
    });
    safe.locked = true;
    doc.nodes[safe.id] = safe;
    children.push(safe.id);

    const title = makeText(frameId, '主标题放在安全区内', W / 2, H * 0.42, 64, {
      name: '标题',
      align: 'center',
      color: P.ink,
      strokeWidth: 0,
      fontFamily: FONT_HEI,
      bold: true,
    });
    doc.nodes[title.id] = title;
    children.push(title.id);

    const sub = makeText(frameId, '副标题 · 栏目名', W / 2, H * 0.58, 28, {
      name: '副标',
      align: 'center',
      color: P.muted,
      strokeWidth: 0,
      bold: false,
    });
    doc.nodes[sub.id] = sub;
    children.push(sub.id);

    frame.children = children;
    doc.nodes[frameId] = frame;
    doc.selection = [title.id];
    return doc;
  },
};
