/**
 * Journal / cute atmosphere signatures — chrome + stickers + marker type.
 */

import type { FrameNode, SceneNode, StudioDocument } from '../model';
import { emptyDoc, makeFrame, makeShape } from '../scenes/helpers';
import type { BuiltinBuildContext, BuiltinTemplate } from './types';
import { makeRoleText } from './templateType';
import { makeCheckBox, makePillBadge } from './xhsCraft';
import { FONT_HAND, FONT_MARKER, FONT_YUAN } from './templatePalettes';
import {
  FONT_HEI,
  FONT_KAI,
  FONT_META,
  FONT_SANS,
  XHS_SIG_H,
  XHS_SIG_RAMP,
  XHS_SIG_W,
  makeOutlinedDisplayText,
  makeTapeStrip,
  makeTornBand,
} from './xhsComposition';
import {
  makeCloudHeaderBar,
  makeHighlighterOval,
  makeOffsetShadowCard,
  makePastelField,
  makeSketchFrame,
  makeSpeechBubble,
  makeSpiralNotebook,
  makeWavyUnderline,
  makeWindowChrome,
  placeCornerStickers,
  scatterStickers,
} from './xhsAtmosphere';

function put(doc: StudioDocument, nodes: SceneNode[]): void {
  for (const n of nodes) doc.nodes[n.id] = n;
}

function finish(doc: StudioDocument, frame: FrameNode, nodes: SceneNode[]): StudioDocument {
  frame.children.push(...nodes.map((n) => n.id));
  put(doc, [frame, ...nodes]);
  return doc;
}

function journalMeta(
  id: string,
  name: string,
  description: string,
  catTag: string,
): Pick<BuiltinTemplate, 'id' | 'name' | 'description' | 'sceneId' | 'tags'> {
  return {
    id: `builtin-xhs-${id}`,
    name,
    description,
    sceneId: 'xhsNote',
    tags: ['\u7b7e\u540d', '\u624b\u8d26', '\u6c1b\u56f4', catTag],
  };
}

/* 1 — spring energy */
const sigJournalSpring: BuiltinTemplate = {
  ...journalMeta(
    'sig-journal-spring',
    '\u6625\u65e5\u80fd\u91cf · \u624b\u8d26',
    '\u7c89\u5e95\u7eb8\u58f3 + \u4e91\u6761\u6807\u9898 + \u82b1\u8d34',
    '\u751f\u6d3b',
  ),
  build: async ({ assets }: BuiltinBuildContext) => {
    const W = XHS_SIG_W;
    const H = XHS_SIG_H;
    const pink = '#F7C6D0';
    const ink = '#3A2A2E';
    const { doc, frameId } = emptyDoc('\u6625\u65e5\u80fd\u91cf', 'xhsNote');
    const frame = makeFrame(frameId, W, H, '\u7b14\u8bb0', pink);
    const pad = 56;
    const nodes: SceneNode[] = [
      ...makePastelField(frameId, {
        x: 0,
        y: 0,
        width: W,
        height: H,
        fill: pink,
        grid: 'rgba(255,255,255,0.35)',
      }),
      ...makeSketchFrame(frameId, {
        x: pad,
        y: pad + 40,
        width: W - pad * 2,
        height: H - pad * 2 - 40,
        fill: '#FFFCF9',
        stroke: pink,
        accent: '#F4A7B9',
      }),
      makeRoleText(frameId, 'meta', 'HUAN QI CHUN RI', W / 2, 140, XHS_SIG_RAMP, {
        name: '\u526f\u6807',
        align: 'center',
        color: '#E891A3',
        fontFamily: FONT_META,
        fontSize: 18,
      }),
      makeRoleText(frameId, 'display', '\u5524\u8d77\u6625\u65e5\u80fd\u91cf', W / 2, 200, XHS_SIG_RAMP, {
        name: '\u6807\u9898',
        align: 'center',
        color: '#E85D7A',
        fontFamily: FONT_YUAN,
        fontSize: 56,
        bold: true,
      }),
      makeRoleText(frameId, 'script', 'Spring', W - 160, 120, XHS_SIG_RAMP, {
        name: '\u6807\u7b7e',
        color: '#B8E05A',
        fontFamily: FONT_MARKER,
        fontSize: 40,
      }),
    ];
    const sections = [
      '\u9002\u5f53\u5f3a\u5ea6\u7684\u6237\u5916\u8fd0\u52a8',
      '\u628a\u9633\u5149\u653e\u8fdb\u623f\u95f4',
      '\u4e00\u987f\u8f7b\u98df\u6362\u6362\u5473\u89c9',
    ];
    const bodies = [
      '\u6563\u6b65\u3001\u4f38\u5c55\u6216\u8f7b\u677e\u8dd1\u6b65\uff0c\u8ba9\u8eab\u4f53\u6162\u6162\u9192\u6765\u3002',
      '\u6253\u5f00\u7a97\u5e18\uff0c\u6362\u4e00\u76c6\u5c0f\u82b1\uff0c\u60c5\u7eea\u4e5f\u4f1a\u53d8\u4eae\u3002',
      '\u7528\u5f53\u5b63\u852c\u83dc\u505a\u4e00\u987f\u7b80\u5355\u65e9\u9910\uff0c\u5473\u89c9\u4e5f\u662f\u5b63\u8282\u3002',
    ];
    sections.forEach((title, i) => {
      const yy = 320 + i * 260;
      nodes.push(
        ...makeCloudHeaderBar(frameId, {
          x: pad + 48,
          y: yy,
          width: W - pad * 2 - 96,
          height: 56,
          fill: '#F2789F',
          label: title,
        }),
        makeRoleText(frameId, 'body', bodies[i]!, pad + 64, yy + 100, XHS_SIG_RAMP, {
          name: `\u6761\u76ee${i + 1}`,
          color: ink,
          fontFamily: FONT_SANS,
          fontSize: 26,
          lineHeight: 1.55,
        }),
      );
    });
    nodes.push(
      ...(await placeCornerStickers(frameId, assets, W, H, {
        tl: 'bloom-cluster',
        tr: 'star-four',
        br: 'bunny',
        bl: 'flower-tulip',
      })),
    );
    return finish(doc, frame, nodes);
  },
};

/* 2 — wishlist spiral */
const sigJournalWishlist: BuiltinTemplate = {
  ...journalMeta(
    'sig-journal-wishlist',
    '\u613f\u671b\u6e05\u5355 · \u7ebf\u5708\u672c',
    '\u7ebf\u5708\u7eb8\u58f3 + \u52fe\u9009\u884c + \u89d2\u8d34',
    '\u751f\u6d3b',
  ),
  build: async ({ assets }: BuiltinBuildContext) => {
    const W = XHS_SIG_W;
    const H = XHS_SIG_H;
    const peach = '#FDCB7E';
    const ink = '#1A1510';
    const { doc, frameId } = emptyDoc('\u613f\u671b\u6e05\u5355', 'xhsNote');
    const frame = makeFrame(frameId, W, H, '\u7b14\u8bb0', peach);
    const paperX = 72;
    const paperY = 80;
    const paperW = W - 144;
    const paperH = H - 160;
    const items = [
      '\u8bfb\u5b8c\u4e00\u672c\u65b0\u4e66',
      '\u5b66\u4f1a\u4e00\u9053\u5bb6\u5e38\u83dc',
      '\u53bb\u4e00\u8d9f\u8fd1\u90ca\u5c0f\u65c5',
      '\u6574\u7406\u597d\u81ea\u5df1\u7684\u684c\u9762',
      '\u7ed9\u670b\u53cb\u5199\u4e00\u5c01\u4fe1',
      '\u5750\u4e0b\u6765\u559d\u676f\u9759\u9759\u7684\u8336',
    ];
    const nodes: SceneNode[] = [
      makeShape(frameId, 'roundRect', {
        x: 0,
        y: 0,
        width: W,
        height: H,
        fill: peach,
        cornerRadius: 0,
        name: '\u5e95\u573a',
        locked: true,
      }),
      ...makeSpiralNotebook(frameId, {
        x: paperX,
        y: paperY,
        width: paperW,
        height: paperH,
        ring: '#1E3A5F',
      }),
      makeRoleText(frameId, 'meta', '\u300a 2026 WISHLIST \u300b', W / 2, paperY + 56, XHS_SIG_RAMP, {
        name: '\u526f\u6807',
        align: 'center',
        color: ink,
        fontFamily: FONT_MARKER,
        fontSize: 28,
        bold: true,
      }),
      makeRoleText(frameId, 'display', '2026\u613f\u671b\u6e05\u5355', W / 2, paperY + 120, XHS_SIG_RAMP, {
        name: '\u6807\u9898',
        align: 'center',
        color: ink,
        fontFamily: FONT_HAND,
        fontSize: 52,
        bold: true,
      }),
      makeWavyUnderline(frameId, {
        x: W / 2 - 160,
        y: paperY + 150,
        width: 320,
        stroke: '#E85D4C',
      }),
    ];
    items.forEach((t, i) => {
      const yy = paperY + 220 + i * 100;
      nodes.push(
        makeCheckBox(frameId, {
          x: paperX + 72,
          y: yy,
          size: 36,
          stroke: '#E85D4C',
        }),
        makeRoleText(frameId, 'body', t, paperX + 130, yy + 18, XHS_SIG_RAMP, {
          name: `\u6761\u76ee${i + 1}`,
          color: ink,
          fontFamily: FONT_KAI,
          fontSize: 30,
        }),
        makeShape(frameId, 'line', {
          x: paperX + 72,
          y: yy + 56,
          width: paperW - 140,
          height: 0,
          fill: 'transparent',
          stroke: 'rgba(253,203,126,0.85)',
          strokeWidth: 2,
          name: `\u884c\u7ebf${i}`,
          locked: true,
        }),
      );
    });
    nodes.push(
      ...(await scatterStickers(frameId, assets, [
        { id: 'megaphone', x: W - 200, y: paperY + 40, width: 100, deg: 12 },
        { id: 'book-open', x: paperX + 40, y: H - 200, width: 96, deg: -8 },
        { id: 'magnifier', x: W - 200, y: H - 220, width: 90, deg: 6 },
        { id: 'star-spark', x: paperX + 200, y: paperY + 160, width: 48, deg: -15 },
      ])),
    );
    return finish(doc, frame, nodes);
  },
};

/* 3 — emergency guide */
const sigJournalEmergency: BuiltinTemplate = {
  ...journalMeta(
    'sig-journal-emergency',
    '\u5e94\u6025\u5e72\u8d27 · \u624b\u8d26',
    '\u7c97\u63cf\u8fb9\u6807\u9898 + \u8336\u8272\u5708 + \u89d2\u8d34',
    '\u77e5\u8bc6',
  ),
  build: async ({ assets }: BuiltinBuildContext) => {
    const W = XHS_SIG_W;
    const H = XHS_SIG_H;
    const field = '#FFF3C4';
    const ink = '#1A1510';
    const orange = '#F5A623';
    const { doc, frameId } = emptyDoc('\u5e94\u6025\u5e72\u8d27', 'xhsNote');
    const frame = makeFrame(frameId, W, H, '\u7b14\u8bb0', field);
    const nodes: SceneNode[] = [
      ...makePastelField(frameId, { x: 0, y: 0, width: W, height: H, fill: field }),
      ...makeSketchFrame(frameId, {
        x: 48,
        y: 64,
        width: W - 96,
        height: H - 128,
        fill: '#FFFCF7',
        stroke: ink,
        accent: field,
        radius: 12,
      }),
      ...makePillBadge(frameId, {
        x: 80,
        y: 100,
        width: 140,
        height: 40,
        fill: field,
        label: '\u300c\u8bb0\u5f97\u6536\u85cf\u300d',
        labelColor: ink,
        ramp: XHS_SIG_RAMP,
        name: '\u6807\u7b7e',
      }),
      makeRoleText(frameId, 'display', '\u5c0f\u670b\u53cb', 100, 200, XHS_SIG_RAMP, {
        name: '\u526f\u6807',
        color: orange,
        fontFamily: FONT_YUAN,
        fontSize: 48,
        bold: true,
      }),
      makeOutlinedDisplayText(frameId, '\u7a81\u7136\u751f\u75c5', W / 2, 320, {
        fontSize: 72,
        color: ink,
        strokeColor: '#FFFCF7',
        strokeWidth: 3,
        fontFamily: FONT_HEI,
        align: 'center',
        name: '\u6807\u9898',
      }),
      makeHighlighterOval(frameId, {
        x: 120,
        y: 400,
        width: W - 240,
        height: 100,
        fill: 'rgba(255,229,102,0.65)',
      }),
      makeRoleText(frameId, 'display', '\u8be5\u600e\u4e48\u529e', W / 2, 450, XHS_SIG_RAMP, {
        name: '\u6807\u9898',
        align: 'center',
        color: orange,
        fontFamily: FONT_YUAN,
        fontSize: 56,
        bold: true,
      }),
      makeRoleText(frameId, 'meta', 'EMERGENCY GUIDELINES', W / 2, 540, XHS_SIG_RAMP, {
        name: '\u526f\u6807',
        align: 'center',
        color: 'rgba(26,21,16,0.45)',
        fontFamily: FONT_META,
        fontSize: 16,
      }),
      makeShape(frameId, 'roundRect', {
        x: 100,
        y: 600,
        width: W - 200,
        height: 72,
        fill: field,
        cornerRadius: 12,
        name: '\u4fe1\u606f\u5361',
        locked: true,
      }),
      makeRoleText(frameId, 'body', '\u7238\u5988\u901f\u5b58\u8fd9\u7bc7', W / 2, 636, XHS_SIG_RAMP, {
        name: '\u6761\u76ee1',
        align: 'center',
        color: ink,
        fontFamily: FONT_SANS,
        fontSize: 28,
        bold: true,
      }),
      makeRoleText(frameId, 'fang', '\u300c\u5e94\u6025\u5e72\u8d27\u300d', 120, H - 180, XHS_SIG_RAMP, {
        name: '\u6807\u7b7e',
        color: ink,
        fontFamily: FONT_HEI,
        fontSize: 28,
      }),
      ...(await scatterStickers(frameId, assets, [
        { id: 'arrow-sketch', x: W - 220, y: 160, width: 100, deg: 20 },
        { id: 'exclaim', x: 90, y: 280, width: 48, deg: -12 },
        { id: 'smile', x: W - 220, y: H - 280, width: 110, deg: 8 },
        { id: 'heart', x: 100, y: H - 260, width: 56, deg: -10 },
      ])),
    ];
    return finish(doc, frame, nodes);
  },
};

/* 4 — time management */
const sigJournalTime: BuiltinTemplate = {
  ...journalMeta(
    'sig-journal-time',
    '\u65f6\u95f4\u7ba1\u7406 · \u6c14\u6ce1',
    '\u9ec4\u5e95\u504f\u79fb\u7eb8\u7247 + \u6c14\u6ce1\u6807\u9898 + \u95f9\u949f\u8d34',
    '\u77e5\u8bc6',
  ),
  build: async ({ assets }: BuiltinBuildContext) => {
    const W = XHS_SIG_W;
    const H = XHS_SIG_H;
    const yellow = '#FFE566';
    const ink = '#1A1510';
    const { doc, frameId } = emptyDoc('\u65f6\u95f4\u7ba1\u7406', 'xhsNote');
    const frame = makeFrame(frameId, W, H, '\u7b14\u8bb0', yellow);
    const cardX = 64;
    const cardY = 80;
    const cardW = W - 128;
    const cardH = H - 160;
    const nodes: SceneNode[] = [
      makeShape(frameId, 'roundRect', {
        x: 0,
        y: 0,
        width: W,
        height: H,
        fill: yellow,
        name: '\u5e95\u573a',
        locked: true,
      }),
      ...makeOffsetShadowCard(frameId, {
        x: cardX,
        y: cardY,
        width: cardW,
        height: cardH,
        fill: '#FFFCF7',
        shadow: '#E85D7A',
        offset: 12,
        stroke: ink,
        strokeWidth: 5,
      }),
      makeRoleText(frameId, 'display', '\u522b\u8ba9\u4e0d\u4f1a', cardX + 48, cardY + 80, XHS_SIG_RAMP, {
        name: '\u6807\u9898',
        color: ink,
        fontFamily: FONT_HEI,
        fontSize: 56,
        bold: true,
      }),
      ...makeSpeechBubble(frameId, {
        x: cardX + 80,
        y: cardY + 200,
        width: cardW - 160,
        height: 140,
        fill: '#FFFCF7',
        stroke: ink,
      }),
      makeRoleText(frameId, 'display', '\u65f6\u95f4\u7ba1\u7406', W / 2, cardY + 270, XHS_SIG_RAMP, {
        name: '\u6807\u9898',
        align: 'center',
        color: '#E85D7A',
        strokeColor: ink,
        strokeWidth: 3,
        fontFamily: FONT_YUAN,
        fontSize: 64,
        bold: true,
      }),
      makeRoleText(frameId, 'display', '\u5bb3\u4e86\u4f60', cardX + 48, cardY + 420, XHS_SIG_RAMP, {
        name: '\u526f\u6807',
        color: ink,
        fontFamily: FONT_HEI,
        fontSize: 56,
        bold: true,
      }),
    ];
    const tips = ['\u65f6\u95f4\u89c4\u5212', '\u5408\u7406\u5b89\u6392\u6bcf\u5929', '\u672a\u6765\u671f\u671b'];
    tips.forEach((t, i) => {
      nodes.push(
        makeRoleText(frameId, 'body', `\u2022  ${t}`, cardX + 56, cardY + 520 + i * 56, XHS_SIG_RAMP, {
          name: `\u6761\u76ee${i + 1}`,
          color: ink,
          fontFamily: FONT_SANS,
          fontSize: 28,
        }),
      );
    });
    nodes.push(
      makeRoleText(frameId, 'caption', '@ \u672a\u6765\u65f6\u95f4\u7ba1\u7406\u5c40', cardX + 56, H - 140, XHS_SIG_RAMP, {
        name: '\u6807\u7b7e',
        color: 'rgba(26,21,16,0.45)',
        fontFamily: FONT_META,
        fontSize: 18,
      }),
      ...(await scatterStickers(frameId, assets, [
        { id: 'clock', x: W - 260, y: H - 340, width: 160, deg: -6 },
        { id: 'star-four', x: W - 200, y: cardY + 60, width: 56, deg: 15 },
        { id: 'star-spark', x: W - 160, y: cardY + 120, width: 40, deg: -20 },
      ])),
    );
    return finish(doc, frame, nodes);
  },
};

/* 5 — browser window tips */
const sigJournalWindow: BuiltinTemplate = {
  ...journalMeta(
    'sig-journal-window',
    '\u6d4f\u89c8\u5668\u7a97 · \u5e72\u8d27',
    '\u4f2a\u7a97\u53e3\u7eb8\u58f3 + \u661f\u661f\u70b9\u7f00',
    '\u77e5\u8bc6',
  ),
  build: async ({ assets }: BuiltinBuildContext) => {
    const W = XHS_SIG_W;
    const H = XHS_SIG_H;
    const mint = '#C8EDE0';
    const ink = '#1A1510';
    const { doc, frameId } = emptyDoc('\u6d4f\u89c8\u5668\u5e72\u8d27', 'xhsNote');
    const frame = makeFrame(frameId, W, H, '\u7b14\u8bb0', mint);
    const wx = 56;
    const wy = 72;
    const ww = W - 112;
    const wh = H - 144;
    const tips = [
      { t: '\u5148\u5199\u7ed3\u8bba\uff0c\u518d\u8865\u8bc1\u636e', d: '\u8bfb\u8005 3 \u79d2\u5185\u770b\u61c2\u4f60\u5728\u8bf4\u4ec0\u4e48' },
      { t: '\u4e00\u9875\u53ea\u8bb2\u4e00\u4e2a\u70b9', d: '\u4fe1\u606f\u5bc6\u5ea6\u9ad8\uff0c\u4e5f\u8981\u7559\u767d' },
      { t: '\u7528\u6e05\u5355\u66ff\u957f\u6bb5', d: '\u624b\u6307\u6ed1\u52a8\u65f6\u66f4\u5bb9\u6613\u505c\u7559' },
      { t: '\u7ed3\u5c3e\u7559\u4e00\u4e2a\u52a8\u4f5c', d: '\u6536\u85cf / \u8bd5\u4e00\u4e0b / \u8ddf\u505a' },
    ];
    const nodes: SceneNode[] = [
      ...makePastelField(frameId, { x: 0, y: 0, width: W, height: H, fill: mint }),
      ...makeWindowChrome(frameId, {
        x: wx,
        y: wy,
        width: ww,
        height: wh,
        barFill: '#FFF3D6',
        fill: '#FFFCF7',
      }),
      makeRoleText(frameId, 'display', '\u5e72\u8d27\u6392\u7248\u56db\u62db', wx + 48, wy + 100, XHS_SIG_RAMP, {
        name: '\u6807\u9898',
        color: ink,
        fontFamily: FONT_YUAN,
        fontSize: 48,
        bold: true,
      }),
      makeRoleText(frameId, 'meta', 'tips for clearer notes', wx + 48, wy + 160, XHS_SIG_RAMP, {
        name: '\u526f\u6807',
        color: 'rgba(26,21,16,0.45)',
        fontFamily: FONT_META,
        fontSize: 20,
      }),
    ];
    tips.forEach((item, i) => {
      const yy = wy + 220 + i * 180;
      nodes.push(
        makeShape(frameId, 'roundRect', {
          x: wx + 40,
          y: yy,
          width: 48,
          height: 48,
          fill: i % 2 === 0 ? '#FFE566' : '#F4A7B9',
          cornerRadius: 12,
          name: `\u5e8f\u53f7${i + 1}`,
          locked: true,
        }),
        makeRoleText(frameId, 'meta', String(i + 1), wx + 64, yy + 24, XHS_SIG_RAMP, {
          name: `\u5c5e\u6027${i + 1}`,
          align: 'center',
          color: ink,
          fontFamily: FONT_HEI,
          fontSize: 24,
          bold: true,
        }),
        makeRoleText(frameId, 'body', item.t, wx + 110, yy + 8, XHS_SIG_RAMP, {
          name: `\u6761\u76ee${i + 1}`,
          color: ink,
          fontFamily: FONT_SANS,
          fontSize: 30,
          bold: true,
        }),
        makeRoleText(frameId, 'caption', item.d, wx + 110, yy + 52, XHS_SIG_RAMP, {
          name: `\u8bf4\u660e${i + 1}`,
          color: 'rgba(26,21,16,0.55)',
          fontFamily: FONT_SANS,
          fontSize: 22,
        }),
      );
    });
    nodes.push(
      ...(await scatterStickers(frameId, assets, [
        { id: 'sparkle-trio', x: W - 200, y: wy + 80, width: 90, deg: 8 },
        { id: 'lightbulb', x: W - 200, y: H - 280, width: 100, deg: -10 },
        { id: 'paperclip', x: wx + 40, y: H - 220, width: 44, deg: 25 },
      ])),
    );
    return finish(doc, frame, nodes);
  },
};

/* 6 — sticky tips trio */
const sigJournalSticky: BuiltinTemplate = {
  ...journalMeta(
    'sig-journal-sticky',
    '\u4fbf\u7b7e\u4e09\u680f · Tips',
    '\u4e09\u5f20\u504f\u79fb\u4fbf\u7b7e + \u56de\u5f62\u9488/\u661f\u661f\u8d34',
    '\u77e5\u8bc6',
  ),
  build: async ({ assets }: BuiltinBuildContext) => {
    const W = XHS_SIG_W;
    const H = XHS_SIG_H;
    const field = '#E8F0FE';
    const ink = '#1A1510';
    const colors = ['#FFE566', '#F4A7B9', '#B8E05A'];
    const titles = ['\u505a\u4e4b\u524d', '\u505a\u4e4b\u4e2d', '\u505a\u4e4b\u540e'];
    const lines = [
      ['\u5b9a\u4e00\u4e2a\u5c0f\u76ee\u6807', '\u51c6\u5907\u597d\u5de5\u5177', '\u628a\u624b\u673a\u653e\u8fdc'],
      ['\u5355\u4efb\u52a1\u8ba1\u65f6', '\u9047\u5230\u5361\u58f3\u5148\u8bb0\u5f55', '\u6bcf 25 \u5206\u949f\u4f11\u606f'],
      ['\u590d\u76d8\u4e00\u904d', '\u5956\u52b1\u81ea\u5df1', '\u5199\u4e0b\u660e\u5929\u4e00\u6b65'],
    ];
    const { doc, frameId } = emptyDoc('\u4fbf\u7b7e Tips', 'xhsNote');
    const frame = makeFrame(frameId, W, H, '\u7b14\u8bb0', field);
    const nodes: SceneNode[] = [
      ...makePastelField(frameId, { x: 0, y: 0, width: W, height: H, fill: field }),
      makeRoleText(frameId, 'display', '\u4eca\u5929\u7684\u4e09\u5f20\u4fbf\u7b7e', W / 2, 100, XHS_SIG_RAMP, {
        name: '\u6807\u9898',
        align: 'center',
        color: ink,
        fontFamily: FONT_YUAN,
        fontSize: 48,
        bold: true,
      }),
      makeRoleText(frameId, 'meta', 'sticky notes · get it done', W / 2, 160, XHS_SIG_RAMP, {
        name: '\u526f\u6807',
        align: 'center',
        color: 'rgba(26,21,16,0.45)',
        fontFamily: FONT_META,
        fontSize: 20,
      }),
    ];
    titles.forEach((title, i) => {
      const x = 56 + i * 340;
      const y = 240;
      const deg = i === 1 ? 0 : i === 0 ? -4 : 5;
      const card = makeOffsetShadowCard(frameId, {
        x,
        y,
        width: 300,
        height: 820,
        fill: colors[i],
        shadow: 'rgba(26,21,16,0.15)',
        offset: 8,
        stroke: ink,
        strokeWidth: 3,
        radius: 12,
      });
      card.forEach((n) => {
        if ('transform' in n) {
          n.transform = { ...n.transform, rotation: (deg * Math.PI) / 180 };
        }
      });
      nodes.push(
        ...card,
        makeRoleText(frameId, 'display', title, x + 150, y + 80, XHS_SIG_RAMP, {
          name: `\u6807\u9898${i + 1}`,
          align: 'center',
          color: ink,
          fontFamily: FONT_HEI,
          fontSize: 36,
          bold: true,
        }),
      );
      lines[i]!.forEach((line, li) => {
        nodes.push(
          makeRoleText(frameId, 'body', `\u25cf  ${line}`, x + 36, y + 200 + li * 120, XHS_SIG_RAMP, {
            name: `\u6761\u76ee${i + 1}_${li + 1}`,
            color: ink,
            fontFamily: FONT_SANS,
            fontSize: 26,
          }),
        );
      });
    });
    nodes.push(
      ...(await scatterStickers(frameId, assets, [
        { id: 'paperclip', x: 40, y: 200, width: 44, deg: -30 },
        { id: 'star-spark', x: W - 100, y: 180, width: 56, deg: 20 },
        { id: 'pencil', x: W - 160, y: H - 200, width: 90, deg: -15 },
        { id: 'check-soft', x: 80, y: H - 180, width: 56, deg: 8 },
      ])),
    );
    return finish(doc, frame, nodes);
  },
};

/* 7 — torn note + tape */
const sigJournalTorn: BuiltinTemplate = {
  ...journalMeta(
    'sig-journal-torn',
    '\u6495\u8fb9\u7b14\u8bb0 · \u80f6\u5e26',
    '\u6495\u7eb8\u5e26 + \u80f6\u5e26 + \u53cc\u8d34',
    '\u624b\u8d26',
  ),
  build: async ({ assets }: BuiltinBuildContext) => {
    const W = XHS_SIG_W;
    const H = XHS_SIG_H;
    const field = '#F0E6D8';
    const ink = '#1A1510';
    const { doc, frameId } = emptyDoc('\u6495\u8fb9\u7b14\u8bb0', 'xhsNote');
    const frame = makeFrame(frameId, W, H, '\u7b14\u8bb0', field);
    const nodes: SceneNode[] = [
      ...makePastelField(frameId, { x: 0, y: 0, width: W, height: H, fill: field }),
      makeShape(frameId, 'roundRect', {
        x: 64,
        y: 120,
        width: W - 128,
        height: H - 280,
        fill: '#FFFCF7',
        stroke: ink,
        strokeWidth: 3,
        cornerRadius: 4,
        name: '\u7eb8\u58f3',
        locked: true,
      }),
      ...makeTornBand(frameId, {
        x: 64,
        y: 320,
        width: W - 128,
        height: 120,
        fill: '#F4A7B9',
      }),
      makeTapeStrip(frameId, {
        x: 200,
        y: 100,
        width: 200,
        height: 40,
        fill: '#8FD4C1',
        deg: -8,
      }),
      makeTapeStrip(frameId, {
        x: W - 360,
        y: H - 200,
        width: 180,
        height: 36,
        fill: '#FFE566',
        deg: 12,
      }),
      makeRoleText(frameId, 'display', '\u4eca\u5929\u60f3\u8bb0\u4f4f', W / 2, 240, XHS_SIG_RAMP, {
        name: '\u6807\u9898',
        align: 'center',
        color: ink,
        fontFamily: FONT_YUAN,
        fontSize: 48,
        bold: true,
      }),
      makeRoleText(frameId, 'script', '\u6162\u4e00\u70b9\u4e5f\u6ca1\u5173\u7cfb', W / 2, 380, XHS_SIG_RAMP, {
        name: '\u6807\u9898',
        align: 'center',
        color: '#FFFCF7',
        fontFamily: FONT_KAI,
        fontSize: 40,
      }),
      makeRoleText(
        frameId,
        'body',
        '\u628a\u60c5\u7eea\u5199\u4e0b\u6765\uff0c\u628a\u6e05\u5355\u5212\u6389\uff0c\n\u7136\u540e\u53bb\u7761\u4e00\u4e2a\u597d\u89c9\u7684\u89c9\u3002',
        W / 2,
        560,
        XHS_SIG_RAMP,
        {
          name: '\u6761\u76ee1',
          align: 'center',
          color: ink,
          fontFamily: FONT_SANS,
          fontSize: 28,
          lineHeight: 1.6,
        },
      ),
      ...(await scatterStickers(frameId, assets, [
        { id: 'tape-washi', x: W / 2 - 60, y: 90, width: 120, deg: 6 },
        { id: 'heart', x: 100, y: H - 240, width: 64, deg: -12 },
        { id: 'cat-face', x: W - 220, y: H - 280, width: 110, deg: 8 },
        { id: 'moon', x: 120, y: 160, width: 64, deg: -6 },
      ])),
    ];
    return finish(doc, frame, nodes);
  },
};

/* 8 — steps with stickers */
const sigJournalSteps: BuiltinTemplate = {
  ...journalMeta(
    'sig-journal-steps',
    '\u4e09\u6b65\u6cd5 · \u8d34\u7eb8\u5e72\u8d27',
    '\u6b65\u9aa4\u5361 + \u8d34\u7eb8\u5bc6\u5ea6\uff08\u5e72\u8d27\u4e5f\u6709\u6c1b\u56f4\uff09',
    '\u77e5\u8bc6',
  ),
  build: async ({ assets }: BuiltinBuildContext) => {
    const W = XHS_SIG_W;
    const H = XHS_SIG_H;
    const field = '#FFF0E8';
    const ink = '#1A1510';
    const { doc, frameId } = emptyDoc('\u4e09\u6b65\u6cd5\u8d34\u7eb8', 'xhsNote');
    const frame = makeFrame(frameId, W, H, '\u7b14\u8bb0', field);
    const steps = [
      { n: '01', t: '\u627e\u51c6\u75db\u70b9', d: '\u5148\u5199\u6e05\u695a\u300c\u4e3a\u4ec0\u4e48\u8981\u770b\u300d' },
      { n: '02', t: '\u62c6\u6210\u4e09\u6b65', d: '\u6bcf\u6b65\u90fd\u80fd\u72ec\u7acb\u6210\u4e00\u5f20\u56fe' },
      { n: '03', t: '\u7528\u8d34\u7eb8\u6536\u5c3e', d: '\u89d2\u843d\u7559\u4e00\u4e2a\u5c0f\u60ca\u559c' },
    ];
    const nodes: SceneNode[] = [
      ...makePastelField(frameId, { x: 0, y: 0, width: W, height: H, fill: field }),
      ...makeOffsetShadowCard(frameId, {
        x: 56,
        y: 64,
        width: W - 112,
        height: H - 128,
        fill: '#FFFCF7',
        shadow: '#F5A623',
        offset: 10,
      }),
      makeRoleText(frameId, 'display', '\u5e72\u8d27\u4e5f\u8981\u6709\u6c1b\u56f4', W / 2, 140, XHS_SIG_RAMP, {
        name: '\u6807\u9898',
        align: 'center',
        color: ink,
        fontFamily: FONT_YUAN,
        fontSize: 44,
        bold: true,
      }),
      makeWavyUnderline(frameId, { x: W / 2 - 140, y: 175, width: 280, stroke: '#F5A623' }),
    ];
    steps.forEach((s, i) => {
      const yy = 260 + i * 280;
      nodes.push(
        makeShape(frameId, 'ellipse', {
          x: 100,
          y: yy,
          width: 72,
          height: 72,
          fill: i === 1 ? '#F4A7B9' : '#FFE566',
          stroke: ink,
          strokeWidth: 3,
          name: `\u5e8f\u53f7${i + 1}`,
          locked: true,
        }),
        makeRoleText(frameId, 'meta', s.n, 136, yy + 36, XHS_SIG_RAMP, {
          name: `\u5c5e\u6027${i + 1}`,
          align: 'center',
          color: ink,
          fontFamily: FONT_HEI,
          fontSize: 24,
          bold: true,
        }),
        makeRoleText(frameId, 'display', s.t, 200, yy + 16, XHS_SIG_RAMP, {
          name: `\u6761\u76ee${i + 1}`,
          color: ink,
          fontFamily: FONT_HEI,
          fontSize: 36,
          bold: true,
        }),
        makeRoleText(frameId, 'body', s.d, 200, yy + 70, XHS_SIG_RAMP, {
          name: `\u8bf4\u660e${i + 1}`,
          color: 'rgba(26,21,16,0.6)',
          fontFamily: FONT_SANS,
          fontSize: 26,
        }),
      );
    });
    nodes.push(
      ...(await scatterStickers(frameId, assets, [
        { id: 'crown', x: W - 220, y: 100, width: 88, deg: 12 },
        { id: 'fire', x: 90, y: H - 220, width: 72, deg: -8 },
        { id: 'corgi', x: W - 240, y: H - 280, width: 120, deg: 6 },
        { id: 'sparkle-trio', x: W - 200, y: 400, width: 80, deg: -5 },
      ])),
    );
    return finish(doc, frame, nodes);
  },
};

export const XHS_JOURNAL_SIGNATURES: BuiltinTemplate[] = [
  sigJournalSpring,
  sigJournalWishlist,
  sigJournalEmergency,
  sigJournalTime,
  sigJournalWindow,
  sigJournalSticky,
  sigJournalTorn,
  sigJournalSteps,
];
