import type { Experiment, ExperimentResult, ParamValues } from '../core/experiment';
import { encodeForQR, reconstruct } from '../lib/payload';
import QRCode from 'qrcode';
import { annotate } from '../lib/viz';

/**
 * Shrink image → quantize to 8 colors → serialize → draw as QR.
 * The QR literally contains a tiny copy of the image. Scan it to reconstruct.
 */
const imageToQr: Experiment = {
  id: 'imageToQr',
  name: '把图塞进口袋',
  description: '把图片压缩成一串数据，画成二维码——扫码得到那段数据，就能重建出小图。',
  principle:
    '二维码不神秘：它只是“把一段文本画成黑白块”。我们先把图缩到 N×N、聚类到几个颜色、序列化成一行文本，再让二维码库画出来。扫码机读到这行文本，按同样规则就能倒回像素。',
  observe: [
    '右边永远显示“二维码里真的装着的那张小图” + 调色板。',
    '想无损复原高清图 → 数据量爆炸 → 二维码会大到扫不出。你在亲手感受“容量上限”。',
    '扫码后会得到 PICLAB:xxxxx —— 那串字符就是图像本身。',
  ],
  category: 'other',
  realtime: false,
  probes: [
    {
      id: 'pack',
      label: '① 压缩并打包',
      notice: '图被压到 8×8。右边是小图放大版+调色板；主画布是装着它的二维码。',
      params: { grid: 8, colors: 8, stage: 'packed' },
    },
    {
      id: 'finer',
      label: '② 多留一点细节',
      notice: '网格 12×12：更像原图，但二维码变密。容量与保真开始打架。',
      params: { grid: 12, colors: 8, stage: 'packed' },
    },
    {
      id: 'decode',
      label: '③ 从数据倒回图',
      notice: '不画二维码，直接从 payload 重建：验证“数据就是图”。',
      params: { grid: 10, colors: 8, stage: 'decoded' },
    },
  ],
  params: [
    {
      key: 'grid',
      label: '压缩网格',
      type: 'number',
      default: 8,
      min: 4,
      max: 16,
      step: 1,
      hint: '二维码里实际携带的像素网格边长。越大越像，码越密',
    },
    {
      key: 'colors',
      label: '调色板大小',
      type: 'number',
      default: 8,
      min: 8,
      max: 8,
      step: 1,
      hint: '当前固定 8 色（3 bit/像素），容量与体积的平衡点',
    },
    {
      key: 'stage',
      label: '观察阶段',
      type: 'select',
      default: 'packed',
      options: [
        { value: 'packed', label: '画成二维码' },
        { value: 'decoded', label: '从数据重建' },
      ],
    },
  ],
  async apply(imageData: ImageData, params: ParamValues): Promise<ExperimentResult> {
    const grid = Math.max(4, Math.min(16, params.grid as number));
    const colors = Math.max(4, Math.min(8, params.colors as number));
    const stage = (params.stage as 'packed' | 'decoded') ?? 'packed';

    const encoded = encodeForQR(imageData, grid, colors);
    const reconstructed = reconstruct(encoded, 36);

    // Aux: the tiny image + palette strip stacked
    const stripH = 28;
    const aux = new ImageData(reconstructed.width, reconstructed.height + stripH);
    aux.data.set(reconstructed.data, 0);
    for (let y = reconstructed.height; y < aux.height; y++) {
      for (let x = 0; x < aux.width; x++) {
        const swatch = Math.min(encoded.palette.length / 3 - 1, Math.floor((x / aux.width) * (encoded.palette.length / 3)));
        const i = (y * aux.width + x) * 4;
        aux.data[i] = encoded.palette[swatch * 3]!;
        aux.data[i + 1] = encoded.palette[swatch * 3 + 1]!;
        aux.data[i + 2] = encoded.palette[swatch * 3 + 2]!;
        aux.data[i + 3] = 255;
      }
    }
    const auxAnnotated = annotate(aux, [
      { text: `二维码里装的 ${grid}×${grid} 图 + ${colors}色调色板`, x: 6, y: 6 },
    ]);

    if (stage === 'decoded') {
      return {
        imageData: reconstructed,
        auxImageData: auxAnnotated,
        meta: {
          auxLabel: '数据形态（格子+调色板）',
          narration: `直接从 payload 重建出 ${grid}×${grid} 图。二维码只是这串数据的“外壳”；扫码机解出同样字符串，就能画出这张图。`,
          bytes: encoded.bytes,
          payloadPreview: `${encoded.payload.slice(0, 36)}…`,
        },
      };
    }

    // Draw QR from payload
    const size = 280;
    const dataUrl = await QRCode.toDataURL(encoded.scanText, {
      errorCorrectionLevel: 'M',
      width: size,
      margin: 1,
      color: { dark: '#0b0c0e', light: '#e8e4d8' },
    });
    const qrImg = await createImageBitmap(await (await fetch(dataUrl)).blob());
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('no 2d ctx');
    ctx.drawImage(qrImg, 0, 0);
    const qrImageData = ctx.getImageData(0, 0, size, size);
    const qrAnnotated = annotate(qrImageData, [
      { text: '扫一扫 → 得到里面那张小图', x: 8, y: size - 30 },
    ]);

    return {
      imageData: qrAnnotated,
      auxImageData: auxAnnotated,
      meta: {
        auxLabel: `payload 里的迷你图（${grid}×${grid}）`,
        narration: `已把图像压到 ${grid}×${grid}、${colors} 色，序列化为 ${encoded.bytes} 字节并画进二维码。手机扫它 → 得到 PICLAB:… 那串字符 → 它就是这张小图的完整数据（base64），可被解码回像素。`,
        bytes: encoded.bytes,
        scanText: encoded.scanText,
      },
    };
  },
};

export default imageToQr;
