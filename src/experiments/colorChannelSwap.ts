import type { Experiment, ExperimentResult, ParamValues } from '../core/experiment';
import { cloneImageData, rgbToHsv, hsvToRgb } from '../lib/color';
import { channelStrip } from '../lib/viz';

type Channel = 'r' | 'g' | 'b' | 'h' | 's' | 'v' | 'zero' | 'one';

const channelOptions = [
  { value: 'r', label: '红 R' },
  { value: 'g', label: '绿 G' },
  { value: 'b', label: '蓝 B' },
  { value: 'h', label: '色相 H' },
  { value: 's', label: '饱和 S' },
  { value: 'v', label: '明度 V' },
  { value: 'zero', label: '强制 0' },
  { value: 'one', label: '强制 满' },
];

function pick(
  ch: Channel,
  r: number,
  g: number,
  b: number,
  hsv: { h: number; s: number; v: number },
): number {
  switch (ch) {
    case 'r':
      return r;
    case 'g':
      return g;
    case 'b':
      return b;
    case 'h':
      return (hsv.h / 360) * 255;
    case 's':
      return hsv.s * 255;
    case 'v':
      return hsv.v * 255;
    case 'zero':
      return 0;
    case 'one':
      return 255;
    default: {
      const _exhaustive: never = ch;
      return _exhaustive;
    }
  }
}

const labelOf = (ch: Channel) =>
  channelOptions.find((o) => o.value === ch)?.label ?? ch;

const colorChannelSwap: Experiment = {
  id: 'colorChannelSwap',
  name: '拆开颜色',
  description: '一张图其实是三张叠在一起的“灰度图”。拆开看，再故意接错线。',
  principle:
    '屏幕上的每个像素不是“一种颜色”，而是三个独立数字（R/G/B）。换通道 = 把这三根线重新插到别的插座上。',
  observe: [
    '先看原理视窗：同一张脸在 R/G/B 里明暗不同——皮肤偏红、植被偏绿。',
    '点「RG 对调」：颜色错位，但轮廓几乎不动——形状住在亮度里，色相另算。',
    '点「只留明度」：彩色消失，说明“长什么样”大多由 V/亮度决定。',
  ],
  category: 'color',
  realtime: true,
  probes: [
    {
      id: 'see-rgb',
      label: '① 拆开 RGB',
      notice: '主画布仍是原图；请盯右边三张：它们是同一场景的三份亮度。',
      params: { outR: 'r', outG: 'g', outB: 'b', space: 'rgb', strip: 'rgb' },
    },
    {
      id: 'swap-rg',
      label: '② RG 对调',
      notice: '红绿插头对调。皮肤变诡异，但五官位置没变——位置信息不在“颜色名”里。',
      params: { outR: 'g', outG: 'r', outB: 'b', space: 'rgb', strip: 'rgb' },
    },
    {
      id: 'value-only',
      label: '③ 只留明度',
      notice: '三个输出都接明度 V → 彩色被掐断。你看到的是“形状骨架”。',
      params: { outR: 'v', outG: 'v', outB: 'v', space: 'rgb', strip: 'hsv' },
    },
    {
      id: 'hue-as-rgb',
      label: '④ 色相当灰度',
      notice: '把色相 H 接到 RGB：平滑渐变的脸会变成条带——色相是环形角度，不是亮度。',
      params: { outR: 'h', outG: 'h', outB: 'h', space: 'rgb', strip: 'hsv' },
    },
  ],
  params: [
    {
      key: 'strip',
      label: '原理视窗显示',
      type: 'select',
      default: 'rgb',
      options: [
        { value: 'rgb', label: 'RGB 三通道' },
        { value: 'hsv', label: 'HSV 三通道' },
      ],
      hint: '右边永远先展示“拆开后的原料”，主画布才是重组结果',
    },
    {
      key: 'outR',
      label: '输出红 接自',
      type: 'select',
      default: 'r',
      options: channelOptions,
      hint: '主画布红色插座插哪根线',
    },
    {
      key: 'outG',
      label: '输出绿 接自',
      type: 'select',
      default: 'g',
      options: channelOptions,
    },
    {
      key: 'outB',
      label: '输出蓝 接自',
      type: 'select',
      default: 'b',
      options: channelOptions,
    },
    {
      key: 'space',
      label: '怎么解释这三根线',
      type: 'select',
      default: 'rgb',
      options: [
        { value: 'rgb', label: '直接当 RGB 显示' },
        { value: 'hsv', label: '当 HSV，再转回 RGB' },
      ],
      hint: '选 HSV 时：你是在色相环上编辑，不是在红绿蓝灯上编辑',
    },
  ],
  apply(imageData: ImageData, params: ParamValues): ExperimentResult {
    const outR = params.outR as Channel;
    const outG = params.outG as Channel;
    const outB = params.outB as Channel;
    const space = params.space as 'rgb' | 'hsv';
    const strip = (params.strip as 'rgb' | 'hsv') ?? 'rgb';
    const out = cloneImageData(imageData);
    const d = out.data;

    for (let i = 0; i < d.length; i += 4) {
      const r = d[i]!;
      const g = d[i + 1]!;
      const b = d[i + 2]!;
      const hsv = rgbToHsv(r, g, b);
      const nr = pick(outR, r, g, b, hsv);
      const ng = pick(outG, r, g, b, hsv);
      const nb = pick(outB, r, g, b, hsv);

      if (space === 'hsv') {
        const rgb = hsvToRgb((nr / 255) * 360, ng / 255, nb / 255);
        d[i] = rgb.r;
        d[i + 1] = rgb.g;
        d[i + 2] = rgb.b;
      } else {
        d[i] = nr;
        d[i + 1] = ng;
        d[i + 2] = nb;
      }
    }

    const wiring = `红←${labelOf(outR)} · 绿←${labelOf(outG)} · 蓝←${labelOf(outB)}`;
    return {
      imageData: out,
      auxImageData: channelStrip(imageData, strip),
      meta: {
        auxLabel: strip === 'rgb' ? '原料：R / G / B 平面' : '原料：H / S / V 平面',
        narration: `接线：${wiring}。右边是拆开的三张图；主画布是按接线插回去的结果。`,
      },
    };
  },
};

export default colorChannelSwap;
