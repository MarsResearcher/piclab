import type { Experiment, ExperimentResult, ParamValues } from '../core/experiment';
import { cloneImageData, luminance, rgbToHsv } from '../lib/color';
import { maskOverlay } from '../lib/viz';

type SortBy = 'luminance' | 'hue' | 'saturation' | 'red' | 'green' | 'blue';
type Axis = 'horizontal' | 'vertical';

function keyOf(r: number, g: number, b: number, by: SortBy): number {
  switch (by) {
    case 'luminance':
      return luminance(r, g, b);
    case 'hue':
      return rgbToHsv(r, g, b).h;
    case 'saturation':
      return rgbToHsv(r, g, b).s;
    case 'red':
      return r;
    case 'green':
      return g;
    case 'blue':
      return b;
    default: {
      const _exhaustive: never = by;
      return _exhaustive;
    }
  }
}

function normKey(k: number, by: SortBy): number {
  if (by === 'hue') return (k / 360) * 255;
  if (by === 'saturation') return k * 255;
  return k;
}

const pixelSort: Experiment = {
  id: 'pixelSort',
  name: '像素排队',
  description: '先圈出“谁可以动”，再在一行里按亮度重新排队——glitch 的本质是局部重排。',
  principle:
    '不是整图乱排。算法沿线扫描：连续落在阈值里的像素组成一段，只在这一段内部排序。阈值=入场券，轴向=排队方向。',
  observe: [
    '务必先点「只看入场券」：亮色区域才会被排序，暗处纹丝不动。',
    '放宽阈值 → 更多像素入场 → 条带更长、更疯。',
    '换成垂直轴：条带方向跟着变——你在选“哪条队伍”。',
  ],
  category: 'structure',
  realtime: false,
  probes: [
    {
      id: 'mask',
      label: '① 只看入场券',
      notice: '还没排序。亮黄=阈值内的像素。先理解“谁会被动”，再去排序。',
      params: {
        axis: 'horizontal',
        sortBy: 'luminance',
        threshold: 60,
        thresholdMax: 200,
        reverse: false,
        stage: 'mask',
      },
    },
    {
      id: 'sort-mid',
      label: '② 中灰排队',
      notice: '只让中等亮度重排：高光/阴影当锚点钉住，中间被抽成条带。',
      params: {
        axis: 'horizontal',
        sortBy: 'luminance',
        threshold: 60,
        thresholdMax: 200,
        reverse: false,
        stage: 'sorted',
      },
    },
    {
      id: 'sort-all',
      label: '③ 几乎全员',
      notice: '阈值极宽≈整行排序：变成亮度渐变条——失去空间结构，只剩统计顺序。',
      params: {
        axis: 'horizontal',
        sortBy: 'luminance',
        threshold: 0,
        thresholdMax: 255,
        reverse: false,
        stage: 'sorted',
      },
    },
    {
      id: 'vertical-hue',
      label: '④ 按色相竖排',
      notice: '排队键换成色相、方向改竖直：色彩被抽成竖丝。同一算法，键一换观感全变。',
      params: {
        axis: 'vertical',
        sortBy: 'hue',
        threshold: 0,
        thresholdMax: 255,
        reverse: false,
        stage: 'sorted',
      },
    },
  ],
  params: [
    {
      key: 'stage',
      label: '观察阶段',
      type: 'select',
      default: 'mask',
      options: [
        { value: 'mask', label: '① 入场券（谁会被排）' },
        { value: 'sorted', label: '② 执行排序' },
      ],
      hint: '建议永远先看入场券，再执行——否则你只看到“花了”',
    },
    {
      key: 'axis',
      label: '排队方向',
      type: 'select',
      default: 'horizontal',
      options: [
        { value: 'horizontal', label: '水平（一行一行）' },
        { value: 'vertical', label: '垂直（一列一列）' },
      ],
      hint: '像素只在这一行/列的连续段里交换位置',
    },
    {
      key: 'sortBy',
      label: '按什么排队',
      type: 'select',
      default: 'luminance',
      options: [
        { value: 'luminance', label: '亮度' },
        { value: 'hue', label: '色相' },
        { value: 'saturation', label: '饱和度' },
        { value: 'red', label: '红通道' },
        { value: 'green', label: '绿通道' },
        { value: 'blue', label: '蓝通道' },
      ],
      hint: '排序的“分数”；也用于判断是否拿得到入场券',
    },
    {
      key: 'threshold',
      label: '入场下限',
      type: 'number',
      default: 60,
      min: 0,
      max: 255,
      step: 1,
      hint: '分数低于此 → 不能进队（保持原位，还当分隔锚点）',
    },
    {
      key: 'thresholdMax',
      label: '入场上限',
      type: 'number',
      default: 200,
      min: 0,
      max: 255,
      step: 1,
      hint: '分数高于此 → 同样出局。上下限夹出一段“可排序带”',
    },
    {
      key: 'reverse',
      label: '倒序排队',
      type: 'boolean',
      default: false,
      hint: '亮→暗 或 暗→亮，只改顺序不改入场规则',
    },
  ],
  apply(imageData: ImageData, params: ParamValues): ExperimentResult {
    const axis = params.axis as Axis;
    const sortBy = params.sortBy as SortBy;
    const tMin = params.threshold as number;
    const tMax = params.thresholdMax as number;
    const reverse = Boolean(params.reverse);
    const stage = (params.stage as 'mask' | 'sorted') ?? 'mask';

    const { width, height, data } = imageData;
    const mask = new Uint8Array(width * height);

    const inBand = (idx: number): boolean => {
      const i = idx * 4;
      const k = normKey(keyOf(data[i]!, data[i + 1]!, data[i + 2]!, sortBy), sortBy);
      return k >= tMin && k <= tMax;
    };

    // Build mask first (always)
    if (axis === 'horizontal') {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          mask[idx] = inBand(idx) ? 1 : 0;
        }
      }
    } else {
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          const idx = y * width + x;
          mask[idx] = inBand(idx) ? 1 : 0;
        }
      }
    }

    const maskView = maskOverlay(imageData, mask);
    let admitted = 0;
    for (const m of mask) if (m) admitted += 1;
    const pct = ((admitted / mask.length) * 100).toFixed(1);

    if (stage === 'mask') {
      return {
        imageData: maskView,
        auxImageData: cloneImageData(imageData),
        meta: {
          auxLabel: '原图对照',
          narration: `入场券已发完：约 ${pct}% 像素可被排序（亮色）。暗处是锚点，把队伍切成一段段。点「执行排序」看它们在段内重排。`,
        },
      };
    }

    const out = cloneImageData(imageData);
    const od = out.data;

    const sortSpan = (indices: number[]) => {
      if (indices.length < 2) return;
      const pixels = indices.map((idx) => {
        const i = idx * 4;
        return {
          r: od[i]!,
          g: od[i + 1]!,
          b: od[i + 2]!,
          a: od[i + 3]!,
          k: keyOf(od[i]!, od[i + 1]!, od[i + 2]!, sortBy),
        };
      });
      pixels.sort((a, b) => (reverse ? b.k - a.k : a.k - b.k));
      for (let n = 0; n < indices.length; n++) {
        const i = indices[n]! * 4;
        const p = pixels[n]!;
        od[i] = p.r;
        od[i + 1] = p.g;
        od[i + 2] = p.b;
        od[i + 3] = p.a;
      }
    };

    const processLine = (getIndex: (t: number) => number, length: number) => {
      let start = -1;
      for (let t = 0; t <= length; t++) {
        const ok = t < length && mask[getIndex(t)] === 1;
        if (ok && start < 0) start = t;
        if (!ok && start >= 0) {
          const indices: number[] = [];
          for (let u = start; u < t; u++) indices.push(getIndex(u));
          sortSpan(indices);
          start = -1;
        }
      }
    };

    if (axis === 'horizontal') {
      for (let y = 0; y < height; y++) processLine((x) => y * width + x, width);
    } else {
      for (let x = 0; x < width; x++) processLine((y) => y * width + x, height);
    }

    return {
      imageData: out,
      auxImageData: maskView,
      meta: {
        auxLabel: '入场券（谁被动过）',
        narration: `已在${axis === 'horizontal' ? '水平' : '垂直'}方向、按${sortBy}排序。约 ${pct}% 像素参与；对比右边亮区，应对上主画布的条带位置。`,
      },
    };
  },
};

export default pixelSort;
