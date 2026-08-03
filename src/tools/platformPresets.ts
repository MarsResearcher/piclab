export type PlatformPreset = {
  id: string;
  name: string;
  width: number;
  height: number;
  note?: string;
};

export type PlatformGroup = {
  id: string;
  name: string;
  presets: PlatformPreset[];
};

export const PLATFORM_GROUPS: PlatformGroup[] = [
  {
    id: 'xiaohongshu',
    name: '小红书',
    presets: [
      { id: 'xhs-square', name: '方图', width: 1080, height: 1080, note: '1:1' },
      { id: 'xhs-portrait', name: '竖图', width: 1080, height: 1440, note: '3:4' },
      { id: 'xhs-cover', name: '封面', width: 1080, height: 810, note: '4:3' },
    ],
  },
  {
    id: 'wechat',
    name: '微信',
    presets: [
      { id: 'wx-moment', name: '朋友圈', width: 1080, height: 1080 },
      { id: 'wx-cover', name: '公众号封面', width: 900, height: 383, note: '2.35:1' },
      { id: 'wx-avatar', name: '头像', width: 500, height: 500 },
    ],
  },
  {
    id: 'weibo',
    name: '微博',
    presets: [
      { id: 'wb-single', name: '单图', width: 1080, height: 1080 },
      { id: 'wb-header', name: '头图', width: 1080, height: 360, note: '3:1' },
    ],
  },
  {
    id: 'douyin',
    name: '抖音',
    presets: [
      { id: 'dy-cover', name: '视频封面', width: 1080, height: 1920, note: '9:16' },
      { id: 'dy-avatar', name: '头像', width: 500, height: 500 },
    ],
  },
  {
    id: 'bilibili',
    name: 'B站',
    presets: [
      { id: 'bili-cover', name: '视频封面', width: 1146, height: 717, note: '16:10' },
      { id: 'bili-banner', name: '空间头图', width: 2048, height: 320 },
    ],
  },
  {
    id: 'zhihu',
    name: '知乎',
    presets: [
      { id: 'zh-article', name: '文章配图', width: 1080, height: 608, note: '16:9' },
      { id: 'zh-avatar', name: '头像', width: 500, height: 500 },
    ],
  },
  {
    id: 'general',
    name: '通用',
    presets: [
      { id: 'g-1080', name: '1080 方形', width: 1080, height: 1080 },
      { id: 'g-1920', name: '1920 横图', width: 1920, height: 1080 },
      { id: 'g-story', name: 'Story', width: 1080, height: 1920 },
      { id: 'g-a4', name: 'A4 300dpi', width: 2480, height: 3508 },
    ],
  },
];

/** Cover-fit: scale source to fully cover target, centered crop. */
export function coverCrop(
  source: ImageData,
  targetW: number,
  targetH: number,
): ImageData {
  const srcW = source.width;
  const srcH = source.height;
  const srcAR = srcW / srcH;
  const dstAR = targetW / targetH;

  let cropW: number;
  let cropH: number;
  if (srcAR > dstAR) {
    cropH = srcH;
    cropW = Math.round(srcH * dstAR);
  } else {
    cropW = srcW;
    cropH = Math.round(srcW / dstAR);
  }
  const cropX = Math.floor((srcW - cropW) / 2);
  const cropY = Math.floor((srcH - cropH) / 2);

  // First crop
  const cropped = new ImageData(cropW, cropH);
  for (let y = 0; y < cropH; y++) {
    const srcRow = ((cropY + y) * srcW + cropX) * 4;
    cropped.data.set(source.data.subarray(srcRow, srcRow + cropW * 4), y * cropW * 4);
  }

  // Then resize via canvas (fast bilinear)
  const src = document.createElement('canvas');
  src.width = cropW;
  src.height = cropH;
  src.getContext('2d')!.putImageData(cropped, 0, 0);

  const dst = document.createElement('canvas');
  dst.width = targetW;
  dst.height = targetH;
  const dctx = dst.getContext('2d')!;
  dctx.imageSmoothingEnabled = true;
  dctx.imageSmoothingQuality = 'high';
  dctx.drawImage(src, 0, 0, targetW, targetH);
  return dctx.getImageData(0, 0, targetW, targetH);
}
