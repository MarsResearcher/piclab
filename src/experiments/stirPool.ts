import type { Experiment, ParamValues } from '../core/experiment';

/**
 * Stir the image like water in a pool.
 * Continuous displacement field; updated every animation frame while dragging.
 */
const stirPool: Experiment = {
  id: 'stirPool',
  name: '搅动池水',
  description: '把图像当水面。鼠标划过，像素被推着走，松开慢慢回弹。',
  principle:
    '持续位移场：指针注入速度，场随时间扩散并回弹。图像被一只手搅动，而不是被滤镜替换。',
  observe: [
    '按住快速划圈：图像像被手指搅进水里。',
    '轻扫：只有一小道波纹。',
    '松手不动：水面慢慢平复，但会留下痕迹。',
  ],
  category: 'spatial',
  realtime: true,
  interaction: {
    hint: '按住拖动 = 搅动水面',
    onPointer: () => {
      // handled continuously by App via stirTick
    },
  },
  probes: [],
  params: [
    {
      key: 'radius',
      label: '搅动半径',
      type: 'number',
      default: 60,
      min: 10,
      max: 160,
      step: 1,
      hint: '手指影响的圆头大小',
    },
    {
      key: 'strength',
      label: '力度',
      type: 'number',
      default: 0.8,
      min: 0.1,
      max: 2,
      step: 0.05,
      hint: '推动像素的距离感',
    },
    {
      key: 'viscosity',
      label: '粘度',
      type: 'number',
      default: 0.82,
      min: 0.5,
      max: 0.98,
      step: 0.01,
      hint: '越低越快回弹，越高拖得越糊',
    },
  ],
  apply(imageData: ImageData, _params: ParamValues): ImageData {
    // Not used for stirPool; App drives it frame-by-frame.
    return imageData;
  },
};

export default stirPool;
