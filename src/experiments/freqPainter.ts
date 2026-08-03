import type { Experiment, ExperimentResult, ParamValues } from '../core/experiment';
import {
  forwardFFT,
  inverseFFT,
  spatialToImage,
  spectrumToImage,
  cloneSpectrum,
} from '../lib/fft';
import { annotate } from '../lib/viz';

/**
 * Paint on the frequency spectrum: erase or boost regions, see spatial result instantly.
 */
const freqPainter: Experiment = {
  id: 'freqPainter',
  name: '在频谱上作画',
  description: '左边是图，右边是频率。直接在频谱上涂抹，擦除或放大某段频率。',
  principle:
    '傅里叶变换把“图像”翻译成“一组不同频率的正弦叠加”。频率位置=变化快慢，能量=那档波有多强。在谱上涂黑=去掉那档频率，涂亮=放大那档。逆变换回来，图像跟着变。',
  observe: [
    '谱的中心=低频。点掉中心，大块明暗消失，只剩线稿。',
    '在谱边缘画一圈=增强高频，轮廓变“脆”。',
    '把笔刷放到一侧乱涂：能造出方向性纹理（某个方向的波被留下）。',
  ],
  category: 'frequency',
  realtime: true,
  interaction: {
    hint: '在右边频谱视窗上涂：黑色=擦除，亮色=增强',
    onPointer: (_event, info, state) => {
      state.setParam('paintX', info.x);
      state.setParam('paintY', info.y);
      state.setParam('paintStamp', Math.random());
    },
  },
  probes: [
    {
      id: 'kill-center',
      label: '① 点掉低频中心',
      notice: '用笔刷在频谱正中点一下。主画布应只剩边缘——大色块没了。',
      params: { brush: 22, gain: 0, stage: 'paint' },
    },
    {
      id: 'boost-edges',
      label: '② 刷亮外围',
      notice: '在外圈刷几笔：高频被放大，轮廓更脆，细节更噪。',
      params: { brush: 26, gain: 2.2, stage: 'paint' },
    },
    {
      id: 'spectrum-only',
      label: '③ 只看频谱',
      notice: '主画布切到频谱：你画过的地方一目了然。',
      params: { brush: 26, gain: 0, stage: 'spectrum' },
    },
  ],
  params: [
    {
      key: 'brush',
      label: '频谱笔刷半径',
      type: 'number',
      default: 22,
      min: 4,
      max: 90,
      step: 1,
      hint: '在右边频谱上涂抹的半径',
    },
    {
      key: 'gain',
      label: '涂抹力度',
      type: 'number',
      default: 0,
      min: -3,
      max: 3,
      step: 0.1,
      hint: '0=完全擦除，>1=增强，负值=反相',
    },
    {
      key: 'stage',
      label: '主画布看什么',
      type: 'select',
      default: 'paint',
      options: [
        { value: 'paint', label: '逆变换结果' },
        { value: 'spectrum', label: '频谱本身' },
      ],
    },
    { key: 'paintX', label: 'paintX', type: 'number', default: -1, min: -1, max: 10000, step: 1, hint: 'internal' },
    { key: 'paintY', label: 'paintY', type: 'number', default: -1, min: -1, max: 10000, step: 1, hint: 'internal' },
    { key: 'paintStamp', label: 'stamp', type: 'number', default: 0, min: 0, max: 1e9, step: 0.000001, hint: 'internal' },
  ],
  apply(imageData: ImageData, params: ParamValues): ExperimentResult {
    const brush = params.brush as number;
    const gain = params.gain as number;
    const stage = (params.stage as 'paint' | 'spectrum') ?? 'paint';
    const paintX = params.paintX as number;
    const paintY = params.paintY as number;

    const spectrum = forwardFFT(imageData);
    const before = cloneSpectrum(spectrum);

    const { width, height, srcW, srcH, real, imag } = spectrum;
    void srcH;

    if (paintX >= 0 && paintY >= 0) {
      // Main-canvas image coords → frequency-bin coords (fftshift convention)
      // Frequency for image pixel (x,y): fx = x - W/2, fy = y - H/2 (wrapped)
      const fx = (paintX - srcW / 2 + width) % width;
      const fy = (paintY - srcH / 2 + height) % height;

      for (let dy = -brush; dy <= brush; dy++) {
        for (let dx = -brush; dx <= brush; dx++) {
          const dist = Math.hypot(dx, dy);
          if (dist > brush) continue;
          const fall = 1 - dist / brush;
          const x = Math.round(fx + dx);
          const y = Math.round(fy + dy);
          if (x < 0 || x >= width || y < 0 || y >= height) continue;
          const i = y * width + x;
          // gain 0 => erase; >1 => amplify; <0 => invert sign
          const factor = gain === 0 ? 0 : 1 + (gain - 1) * fall;
          real[i] = real[i]! * factor;
          imag[i] = imag[i]! * factor;
        }
      }
    }

    const spectrumView = annotate(spectrumToImage(spectrum), [
      { text: '频谱 · 中心低频 · 涂黑=删除', x: 6, y: 6 },
    ]);

    if (stage === 'spectrum') {
      return {
        imageData: spectrumView,
        auxImageData: spectrumToImage(before),
        meta: {
          auxLabel: '涂抹前的频谱',
          narration: `你正在直接编辑频率。亮点=那档频率能量强；涂黑=置零。`,
        },
      };
    }

    const spatial = inverseFFT(spectrum);
    const result = spatialToImage(spatial, spectrum);
    return {
      imageData: result,
      auxImageData: spectrumView,
      meta: {
        auxLabel: '你涂过的频谱',
        narration: `已在频谱 (${Math.round(paintX)}, ${Math.round(paintY)}) 涂抹。主画布是逆变换结果——频率域的每一笔都回到了空间域。`,
      },
    };
  },
};

export default freqPainter;
