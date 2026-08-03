/** Fast geometric transforms: rotate 90° steps and flip. */

export function rotate90(source: ImageData, times: number): ImageData {
  let img = source;
  const t = ((times % 4) + 4) % 4;
  for (let i = 0; i < t; i++) img = rotate90cw(img);
  return img;
}

function rotate90cw(source: ImageData): ImageData {
  const { width: w, height: h } = source;
  const out = new ImageData(h, w);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const si = (y * w + x) * 4;
      const di = (x * h + (h - 1 - y)) * 4;
      out.data[di] = source.data[si]!;
      out.data[di + 1] = source.data[si + 1]!;
      out.data[di + 2] = source.data[si + 2]!;
      out.data[di + 3] = source.data[si + 3]!;
    }
  }
  return out;
}

export function flipHorizontal(source: ImageData): ImageData {
  const { width: w, height: h } = source;
  const out = new ImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const si = (y * w + x) * 4;
      const di = (y * w + (w - 1 - x)) * 4;
      out.data[di] = source.data[si]!;
      out.data[di + 1] = source.data[si + 1]!;
      out.data[di + 2] = source.data[si + 2]!;
      out.data[di + 3] = source.data[si + 3]!;
    }
  }
  return out;
}

export function flipVertical(source: ImageData): ImageData {
  const { width: w, height: h } = source;
  const out = new ImageData(w, h);
  for (let y = 0; y < h; y++) {
    const si = (y * w) * 4;
    const di = ((h - 1 - y) * w) * 4;
    out.data.set(source.data.subarray(si, si + w * 4), di);
  }
  return out;
}
