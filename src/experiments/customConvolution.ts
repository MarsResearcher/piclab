import type { Experiment, ExperimentResult, ParamValues } from '../core/experiment';
import { convolve, PRESET_KERNELS } from '../lib/convolution';
import { residualMap } from '../lib/viz';

const customConvolution: Experiment = {
  id: 'customConvolution',
  name: '邻域运算',
  description: '每个新像素 = 自己和周围邻居的加权平均。核决定“问邻居什么问题”。',
  principle:
    '卷积不是滤镜魔法：对每个像素，拿周围一小块（3×3/5×5），乘上权重再相加。正权重=吸收，负权重=对比邻居。',
  observe: [
    '点「模糊」再看残差图：发亮的是被抹掉的细节——模糊=扔掉高频。',
    '点「锐化」：残差几乎是边缘。锐化=原图 + 一点边缘。',
    '点「只看边缘」：主画布变成“哪里在变化”，平坦皮肤变黑。',
  ],
  category: 'spatial',
  realtime: true,
  probes: [
    {
      id: 'blur',
      label: '① 模糊=抹细节',
      notice: '主画布变软；右边残差发亮处=被平均掉的纹理。平坦区域残差接近黑。',
      params: { preset: 'blur', strength: 1, view: 'result' },
    },
    {
      id: 'sharpen',
      label: '② 锐化=加边缘',
      notice: '轮廓更“脆”。残差亮线就是被加回去的对比度——和边缘检测同源。',
      params: { preset: 'sharpen', strength: 1, view: 'result' },
    },
    {
      id: 'edges',
      label: '③ 只看边缘',
      notice: '核中心为正、四周为负：平坦处正负抵消→黑；边界处不抵消→亮。这就是梯度。',
      params: { preset: 'edge', strength: 1, view: 'result' },
    },
    {
      id: 'residual',
      label: '④ 主画布看残差',
      notice: '把“改动量”放到主画布：你直接看见算法碰过哪些像素。',
      params: { preset: 'blur', strength: 1, view: 'residual' },
    },
  ],
  params: [
    {
      key: 'view',
      label: '主画布看什么',
      type: 'select',
      default: 'result',
      options: [
        { value: 'result', label: '滤波结果' },
        { value: 'residual', label: '残差（改了哪里）' },
      ],
      hint: '残差 = |结果 − 原图|，专门用来理解算法动了什么',
    },
    {
      key: 'preset',
      label: '问邻居的方式',
      type: 'select',
      default: 'blur',
      options: [
        { value: 'identity', label: '原样（核=中心1）' },
        { value: 'blur', label: '平均 → 模糊' },
        { value: 'gaussian5', label: '高斯平均 → 更顺滑' },
        { value: 'sharpen', label: '强调中心 → 锐化' },
        { value: 'edge', label: '中心−邻居 → 边缘' },
        { value: 'emboss', label: '斜向差分 → 浮雕' },
        { value: 'custom', label: '自己填 3×3' },
      ],
    },
    {
      key: 'kernel',
      label: '自定义权重',
      type: 'matrix',
      rows: 3,
      cols: 3,
      default: [0, -1, 0, -1, 5, -1, 0, -1, 0],
      hint: '只有选「自己填」时生效。试试中心 8、四周 -1',
    },
    {
      key: 'strength',
      label: '掺多少结果',
      type: 'number',
      default: 1,
      min: 0,
      max: 1,
      step: 0.01,
      hint: '0=原图，1=全滤波。用来感受“一点点边缘”有多明显',
    },
  ],
  apply(imageData: ImageData, params: ParamValues): ExperimentResult {
    const preset = params.preset as string;
    const strength = params.strength as number;
    const view = (params.view as 'result' | 'residual') ?? 'result';
    let kernel: number[];
    let kw: number;
    let kh: number;

    if (preset === 'custom') {
      kernel = (params.kernel as number[]).map(Number);
      kw = 3;
      kh = 3;
    } else {
      const p = PRESET_KERNELS[preset] ?? PRESET_KERNELS.identity!;
      kernel = p.k;
      kw = p.w;
      kh = p.h;
    }

    const filtered = convolve(imageData, kernel, kw, kh);
    let mixed = filtered;
    if (strength < 0.999) {
      mixed = new ImageData(
        new Uint8ClampedArray(imageData.data.length),
        imageData.width,
        imageData.height,
      );
      const a = imageData.data;
      const b = filtered.data;
      const o = mixed.data;
      for (let i = 0; i < o.length; i += 4) {
        o[i] = a[i]! * (1 - strength) + b[i]! * strength;
        o[i + 1] = a[i + 1]! * (1 - strength) + b[i + 1]! * strength;
        o[i + 2] = a[i + 2]! * (1 - strength) + b[i + 2]! * strength;
        o[i + 3] = a[i + 3]!;
      }
    }

    const residual = residualMap(imageData, mixed);
    const stories: Record<string, string> = {
      blur: '每个像素被邻居平均 → 尖锐变化被摊平 → 看起来糊。残差亮处就是被抹掉的纹理。',
      gaussian5: '更远的邻居权重更小（高斯）→ 抹得更自然，少出现方块感。',
      sharpen: '中心加大、邻居减小 → 相当于原图加上边缘。残差应呈线状。',
      edge: '中心与邻居相减 → 平坦抵消为 0，边界留下能量。这是“哪里在变”。',
      emboss: '斜向正负权重 → 像侧光打在浮雕上。',
      identity: '只有中心为 1：什么都没问邻居，图不应变。',
      custom: '你自定义了权重。看残差判断它更像模糊、锐化还是边缘。',
    };

    return {
      imageData: view === 'residual' ? residual : mixed,
      auxImageData: view === 'residual' ? mixed : residual,
      meta: {
        auxLabel: view === 'residual' ? '对照：滤波结果' : '原理：残差（改动热力）',
        narration: stories[preset] ?? stories.custom!,
        kernelSize: `${kw}×${kh}`,
      },
    };
  },
};

export default customConvolution;
