import type { Experiment, ExperimentResult, ParamValues } from '../core/experiment';
import { PRESET_KERNELS } from '../lib/convolution';
import { clamp } from '../lib/math';
import { residualMap } from '../lib/viz';

/**
 * Paint the convolution directly onto the image.
 * Stroke on the canvas = stamp the kernel at pointer positions.
 */
const convolutionBrush: Experiment = {
  id: 'convolutionBrush',
  name: '用笔刷卷积',
  description: '别再拖滑块——直接在图上画。划过的地方按核的权重和邻居加权混合。',
  principle:
    '卷积=对邻域加权求和。笔刷把这个操作局部化：只有笔画覆盖处才应用核，你立刻能看到“边缘出现/细节被抹”发生在你画的那一笔里。',
  observe: [
    '选「抹平」在皱纹/噪点上刷——只抹你画到的地方。',
    '选「显边」在轮廓上刷——线条被局部加强，像用笔描边。',
    '力度低时多刷几次会叠加：局部、可重复、方向感强。',
  ],
  category: 'spatial',
  realtime: true,
  interaction: {
    hint: '在图上按住拖动 = 用笔刷卷积',
    onPointer: (event, info, state) => {
      state.setParam('lastX', info.x);
      state.setParam('lastY', info.y);
      state.setParam('stroking', 1);
      if (event.type === 'pointerdown' || event.buttons === 1) {
        state.setParam('stampId', Math.random());
      }
    },
  },
  probes: [
    {
      id: 'smooth',
      label: '① 抹平笔',
      notice: '在脸上/噪点上刷：细节局部消失。残差图会亮出你刚抹过的地方。',
      params: { mode: 'smooth', brush: 36, strength: 0.8 },
    },
    {
      id: 'edge',
      label: '② 显边笔',
      notice: '在轮廓上刷：只让那里的对比变强，像在勾线。',
      params: { mode: 'edge', brush: 28, strength: 0.7 },
    },
    {
      id: 'big-smooth',
      label: '③ 大笔抹平',
      notice: '笔刷放大：一块区域被平均成柔和块面——局部低通。',
      params: { mode: 'smooth', brush: 80, strength: 0.9 },
    },
  ],
  params: [
    {
      key: 'mode',
      label: '核的含义',
      type: 'select',
      default: 'smooth',
      options: [
        { value: 'smooth', label: '抹平（低通）' },
        { value: 'edge', label: '显边（锐化）' },
      ],
      hint: '抹平=平均邻居；显边=中心−邻居',
    },
    {
      key: 'brush',
      label: '笔刷半径',
      type: 'number',
      default: 36,
      min: 6,
      max: 140,
      step: 1,
      hint: '在图上画时生效的圆头大小',
    },
    {
      key: 'strength',
      label: '力度',
      type: 'number',
      default: 0.8,
      min: 0.05,
      max: 1,
      step: 0.01,
      hint: '每一笔掺入多少滤波结果；低力度可多次叠加',
    },
    {
      key: 'showResidual',
      label: '显示残差',
      type: 'boolean',
      default: false,
      hint: '开=看你改动过的痕迹（红热）',
    },
    // Brush state (set via pointer)
    { key: 'lastX', label: 'lastX', type: 'number', default: -1, min: -1, max: 10000, step: 1, hint: 'internal' },
    { key: 'lastY', label: 'lastY', type: 'number', default: -1, min: -1, max: 10000, step: 1, hint: 'internal' },
    { key: 'stroking', label: 'stroking', type: 'number', default: 0, min: 0, max: 1, step: 1, hint: 'internal' },
    { key: 'stampId', label: 'stampId', type: 'number', default: 0, min: 0, max: 1e9, step: 0.000001, hint: 'internal' },
  ],
  apply(imageData: ImageData, params: ParamValues): ExperimentResult {
    const mode = params.mode as 'smooth' | 'edge';
    const brush = Math.max(2, Math.round(params.brush as number));
    const strength = params.strength as number;
    const showResidual = Boolean(params.showResidual);
    const lastX = params.lastX as number;
    const lastY = params.lastY as number;
    const stroking = (params.stroking as number) > 0;

    const kernel = mode === 'smooth' ? PRESET_KERNELS.blur!.k : PRESET_KERNELS.sharpen!.k;
    const kw = 3;
    const kh = 3;

    const out = new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);

    if (stroking && lastX >= 0 && lastY >= 0) {
      // Local convolution stamp around (lastX, lastY)
      const { width, height, data } = imageData;
      const src = data;
      const dst = out.data;
      const r = brush;
      const x0 = Math.max(0, Math.floor(lastX - r));
      const x1 = Math.min(width - 1, Math.ceil(lastX + r));
      const y0 = Math.max(0, Math.floor(lastY - r));
      const y1 = Math.min(height - 1, Math.ceil(lastY + r));
      const halfW = (kw - 1) >> 1;
      const halfH = (kh - 1) >> 1;

      let kSum = 0;
      for (const k of kernel) kSum += k;
      const norm = kSum === 0 ? 1 : kSum;

      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const dist = Math.hypot(x - lastX, y - lastY);
          if (dist > r) continue;
          const falloff = 1 - dist / r; // soft edge
          let rr = 0, gg = 0, bb = 0;
          for (let ky = 0; ky < kh; ky++) {
            const sy = clamp(y + ky - halfH, 0, height - 1);
            for (let kx = 0; kx < kw; kx++) {
              const sx = clamp(x + kx - halfW, 0, width - 1);
              const k = kernel[ky * kw + kx]!;
              const si = (sy * width + sx) * 4;
              rr += src[si]! * k;
              gg += src[si + 1]! * k;
              bb += src[si + 2]! * k;
            }
          }
          const di = (y * width + x) * 4;
          const fr = clamp(Math.round(rr / norm), 0, 255);
          const fg = clamp(Math.round(gg / norm), 0, 255);
          const fb = clamp(Math.round(bb / norm), 0, 255);
          const w = strength * falloff;
          dst[di] = src[di]! * (1 - w) + fr * w;
          dst[di + 1] = src[di + 1]! * (1 - w) + fg * w;
          dst[di + 2] = src[di + 2]! * (1 - w) + fb * w;
        }
      }
    }

    const result = showResidual ? residualMap(imageData, out) : out;
    return {
      imageData: result,
      meta: {
        narration: `在 (${Math.round(lastX)}, ${Math.round(lastY)}) 落了一笔 ${mode === 'smooth' ? '抹平' : '显边'}。卷积只发生在笔画圆内——这就是“局部空间滤波”。`,
        auxLabel: '原理提示',
      },
    };
  },
};

export default convolutionBrush;
