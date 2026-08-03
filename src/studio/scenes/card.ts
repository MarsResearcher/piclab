import type { AssetStore } from '../store/assetStore';
import type { ScenePlugin } from '../plugins/types';
import {
  FONT_HEI,
  FONT_SANS,
  NIGHT_SEA,
} from '../templates/templatePalettes';
import { addPageWithFrame, emptyDoc, fitImageNode, makeFrame, makeShape, makeText } from './helpers';

/** ~90x54mm @ ~300dpi-ish landscape card */
const W = 1050;
const H = 600;
const P = NIGHT_SEA;

export const cardScene: ScenePlugin = {
  id: 'card',
  label: '名片',
  description: '1050×600 双面画板，侧栏分区 + 联系信息层级',
  tools: ['select', 'text', 'image', 'export'],
  exportHints: [
    { width: W, height: H, name: '名片-正面' },
    { width: W, height: H, name: '名片-背面' },
  ],
  createDocument: (opts) => {
    const assets = opts?.assets as AssetStore | undefined;
    const { doc, frameId: frontFrameId, pageId: frontPageId } = emptyDoc('名片', 'card');
    doc.pages[0]!.name = '正面';

    const front = makeFrame(frontFrameId, W, H, '正面', P.bg);
    const frontChildren: string[] = [];
    const m = Math.round(W * 0.08);

    if (opts?.fromImage && assets) {
      const imageNode = fitImageNode(frontFrameId, assets, opts.fromImage, W, H, '背景图');
      imageNode.opacity = 0.45;
      doc.nodes[imageNode.id] = imageNode;
      frontChildren.push(imageNode.id);
    }

    const side = makeShape(frontFrameId, 'rect', {
      x: 0,
      y: 0,
      width: Math.round(W * 0.06),
      height: H,
      fill: P.accent,
      name: '侧色条',
    });
    side.locked = true;
    const rule = makeShape(frontFrameId, 'line', {
      x: m,
      y: H * 0.58,
      width: W * 0.4,
      height: 0,
      fill: P.muted,
      stroke: P.muted,
      strokeWidth: 1.5,
      name: '分隔线',
    });

    const name = makeText(frontFrameId, '你的姓名', m, H * 0.32, 48, {
      name: '姓名',
      align: 'left',
      color: P.ink,
      strokeWidth: 0,
      fontFamily: FONT_HEI,
    });
    const role = makeText(frontFrameId, '职位 / 公司', m, H * 0.46, 22, {
      name: '职称',
      align: 'left',
      color: P.accent,
      strokeWidth: 0,
      bold: false,
      fontFamily: FONT_SANS,
    });
    const phone = makeText(frontFrameId, '电话 138-0000-0000', m, H * 0.7, 20, {
      name: '电话',
      align: 'left',
      color: P.ink,
      strokeWidth: 0,
      bold: false,
    });

    doc.nodes[side.id] = side;
    doc.nodes[rule.id] = rule;
    doc.nodes[name.id] = name;
    doc.nodes[role.id] = role;
    doc.nodes[phone.id] = phone;
    frontChildren.push(side.id, rule.id, name.id, role.id, phone.id);

    front.children = frontChildren;
    doc.nodes[frontFrameId] = front;

    const { frameId: backFrameId } = addPageWithFrame(doc, {
      name: '背面',
      width: W,
      height: H,
      fill: P.bgAlt,
      activate: false,
    });
    const back = doc.nodes[backFrameId]!;
    if (back.type !== 'frame') throw new Error('expected back frame');

    const backBar = makeShape(backFrameId, 'rect', {
      x: 0,
      y: H - 12,
      width: W,
      height: 12,
      fill: P.accent,
      name: '底条',
    });
    backBar.locked = true;
    const company = makeText(backFrameId, '公司名称', W / 2, H * 0.42, 36, {
      name: '公司',
      color: P.ink,
      strokeWidth: 0,
      fontFamily: FONT_HEI,
    });
    const address = makeText(backFrameId, '地址 / 网址 / 邮箱', W / 2, H * 0.58, 20, {
      name: '地址',
      color: P.muted,
      strokeWidth: 0,
      bold: false,
    });

    doc.nodes[backBar.id] = backBar;
    doc.nodes[company.id] = company;
    doc.nodes[address.id] = address;
    back.children = [backBar.id, company.id, address.id];
    doc.nodes[backFrameId] = back;

    doc.activePageId = frontPageId;
    doc.selection = [name.id];
    return doc;
  },
};
