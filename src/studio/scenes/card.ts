import type { AssetStore } from '../store/assetStore';
import type { ScenePlugin } from '../plugins/types';
import {
  FONT_FANG,
  FONT_HEI,
  FONT_KAI,
  FONT_LATIN_SERIF,
  FONT_META,
  CINNABAR,
} from '../templates/templatePalettes';
import { addPageWithFrame, emptyDoc, fitImageNode, makeFrame, makeLine, makeText } from './helpers';

/** ~90x54mm @ ~300dpi-ish landscape card */
const W = 1050;
const H = 600;
const P = CINNABAR;
const M = 88; // 左轴

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

    const front = makeFrame(frontFrameId, W, H, '正面', P.field);
    const frontChildren: string[] = [];

    if (opts?.fromImage && assets) {
      const imageNode = fitImageNode(frontFrameId, assets, opts.fromImage, W, H, '背景图');
      imageNode.opacity = 0.35;
      doc.nodes[imageNode.id] = imageNode;
      frontChildren.push(imageNode.id);
    }

    // ── 顶部细线（签名：横贯头线）──────────────────────────
    const head = makeLine(frontFrameId, M, 96, W - M * 2, 0, {
      stroke: P.accent,
      strokeWidth: 2,
      name: '头线',
      locked: true,
    });

    // ── 姓名大字（左侧轴）──────────────────────────────────
    const name = makeText(frontFrameId, '你的姓名', M, 168, 72, {
      name: '姓名',
      align: 'left',
      color: P.ink,
      strokeWidth: 0,
      fontFamily: FONT_HEI,
    });
    const enName = makeText(frontFrameId, 'YOUR NAME', M, 280, 18, {
      name: '英文名',
      align: 'left',
      color: P.accent,
      strokeWidth: 0,
      bold: false,
      fontFamily: FONT_LATIN_SERIF,
    });
    const role = makeText(frontFrameId, '职位 · 公司', M, 380, 24, {
      name: '职衔',
      align: 'left',
      color: P.mute,
      strokeWidth: 0,
      bold: false,
      fontFamily: FONT_FANG,
    });

    // ── 底部联系方式（左列，垂直轴）────────────────────────
    const phone = makeText(frontFrameId, 'TEL  138-0000-0000', M, H - 168, 20, {
      name: '电话',
      align: 'left',
      color: P.ink,
      strokeWidth: 0,
      bold: false,
      fontFamily: FONT_META,
    });
    const mail = makeText(frontFrameId, 'MAIL  you@company.com', M, H - 120, 20, {
      name: '邮箱',
      align: 'left',
      color: P.ink,
      strokeWidth: 0,
      bold: false,
      fontFamily: FONT_META,
    });

    // ── 右侧竖排"印"字（签名动作）─────────────────────────
    const stamp = makeText(frontFrameId, '印', W - 172, 120, 120, {
      name: '印章字',
      align: 'center',
      color: P.accent,
      strokeWidth: 0,
      writingMode: 'vertical',
      fontFamily: FONT_KAI,
    });

    doc.nodes[frontFrameId] = front;
    for (const n of [head, name, enName, role, phone, mail, stamp]) {
      doc.nodes[n.id] = n;
      frontChildren.push(n.id);
    }
    front.children = frontChildren;

    // ── 背面：白场居中 + 朱红印章 ──────────────────────────
    const { frameId: backFrameId } = addPageWithFrame(doc, {
      name: '背面',
      width: W,
      height: H,
      fill: P.panel,
      activate: false,
    });
    const back = doc.nodes[backFrameId]!;
    if (back.type !== 'frame') throw new Error('expected back frame');

    const backMark = makeText(backFrameId, '印', W / 2, H / 2 - 96, 160, {
      name: '印章',
      align: 'center',
      color: P.accent,
      strokeWidth: 0,
      fontFamily: FONT_KAI,
    });
    const backLine = makeLine(backFrameId, W / 2 - 80, H / 2 + 40, 160, 0, {
      stroke: 'rgba(156,27,48,0.4)',
      strokeWidth: 1.5,
      name: '背线',
      locked: true,
    });
    const backUrl = makeText(backFrameId, 'piclab.studio', W / 2, H - 140, 20, {
      name: '网址',
      align: 'center',
      color: P.mute,
      strokeWidth: 0,
      bold: false,
      fontFamily: FONT_META,
    });

    doc.nodes[backFrameId] = back;
    for (const n of [backMark, backLine, backUrl]) {
      doc.nodes[n.id] = n;
      back.children.push(n.id);
    }

    doc.activePageId = frontPageId;
    doc.selection = [name.id];
    return doc;
  },
};
