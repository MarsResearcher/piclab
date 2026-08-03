import { clamp, nextPowerOfTwo } from './math';
import { luminance } from './color';

/** In-place Cooley–Tukey radix-2 FFT. `imag` may start as zeros. */
export function fft1d(real: Float64Array, imag: Float64Array, inverse = false): void {
  const n = real.length;
  if (n === 0 || (n & (n - 1)) !== 0) {
    throw new Error('FFT length must be a power of 2');
  }

  // Bit-reversal permutation
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [real[i], real[j]] = [real[j]!, real[i]!];
      [imag[i], imag[j]] = [imag[j]!, imag[i]!];
    }
  }

  for (let len = 2; len <= n; len <<= 1) {
    const ang = ((inverse ? 2 : -2) * Math.PI) / len;
    const wlenRe = Math.cos(ang);
    const wlenIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let wRe = 1;
      let wIm = 0;
      for (let j = 0; j < len / 2; j++) {
        const uRe = real[i + j]!;
        const uIm = imag[i + j]!;
        const vRe = real[i + j + len / 2]! * wRe - imag[i + j + len / 2]! * wIm;
        const vIm = real[i + j + len / 2]! * wIm + imag[i + j + len / 2]! * wRe;
        real[i + j] = uRe + vRe;
        imag[i + j] = uIm + vIm;
        real[i + j + len / 2] = uRe - vRe;
        imag[i + j + len / 2] = uIm - vIm;
        const nextWRe = wRe * wlenRe - wIm * wlenIm;
        wIm = wRe * wlenIm + wIm * wlenRe;
        wRe = nextWRe;
      }
    }
  }

  if (inverse) {
    for (let i = 0; i < n; i++) {
      real[i]! /= n;
      imag[i]! /= n;
    }
  }
}

export type Spectrum = {
  width: number;
  height: number;
  real: Float64Array;
  imag: Float64Array;
  /** Original image size before padding */
  srcW: number;
  srcH: number;
};

/** 2D FFT of luminance channel, zero-padded to power-of-two. */
export function forwardFFT(image: ImageData): Spectrum {
  const srcW = image.width;
  const srcH = image.height;
  const width = nextPowerOfTwo(srcW);
  const height = nextPowerOfTwo(srcH);
  const real = new Float64Array(width * height);
  const imag = new Float64Array(width * height);

  for (let y = 0; y < srcH; y++) {
    for (let x = 0; x < srcW; x++) {
      const i = (y * srcW + x) * 4;
      real[y * width + x] = luminance(image.data[i]!, image.data[i + 1]!, image.data[i + 2]!);
    }
  }

  // Row FFTs
  const rowRe = new Float64Array(width);
  const rowIm = new Float64Array(width);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      rowRe[x] = real[y * width + x]!;
      rowIm[x] = imag[y * width + x]!;
    }
    fft1d(rowRe, rowIm, false);
    for (let x = 0; x < width; x++) {
      real[y * width + x] = rowRe[x]!;
      imag[y * width + x] = rowIm[x]!;
    }
  }

  // Column FFTs
  const colRe = new Float64Array(height);
  const colIm = new Float64Array(height);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      colRe[y] = real[y * width + x]!;
      colIm[y] = imag[y * width + x]!;
    }
    fft1d(colRe, colIm, false);
    for (let y = 0; y < height; y++) {
      real[y * width + x] = colRe[y]!;
      imag[y * width + x] = colIm[y]!;
    }
  }

  return { width, height, real, imag, srcW, srcH };
}

export function inverseFFT(spectrum: Spectrum): Float64Array {
  const { width, height } = spectrum;
  const real = spectrum.real.slice();
  const imag = spectrum.imag.slice();

  const colRe = new Float64Array(height);
  const colIm = new Float64Array(height);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      colRe[y] = real[y * width + x]!;
      colIm[y] = imag[y * width + x]!;
    }
    fft1d(colRe, colIm, true);
    for (let y = 0; y < height; y++) {
      real[y * width + x] = colRe[y]!;
      imag[y * width + x] = colIm[y]!;
    }
  }

  const rowRe = new Float64Array(width);
  const rowIm = new Float64Array(width);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      rowRe[x] = real[y * width + x]!;
      rowIm[x] = imag[y * width + x]!;
    }
    fft1d(rowRe, rowIm, true);
    for (let x = 0; x < width; x++) {
      real[y * width + x] = rowRe[x]!;
      imag[y * width + x] = rowIm[x]!;
    }
  }

  return real;
}

export type FreqMaskMode = 'lowpass' | 'highpass' | 'bandstop' | 'bandpass';

/** Apply a radial frequency mask (centered spectrum convention via fftshift indices). */
export function applyRadialMask(
  spectrum: Spectrum,
  mode: FreqMaskMode,
  radius: number,
  bandWidth = 10,
): void {
  const { width, height, real, imag } = spectrum;
  const cx = width / 2;
  const cy = height / 2;
  const maxR = Math.hypot(cx, cy);
  const rNorm = (radius / 100) * maxR;
  const bw = (bandWidth / 100) * maxR;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // fftshift: treat DC as center
      const sx = x < cx ? x + cx : x - cx;
      const sy = y < cy ? y + cy : y - cy;
      const dist = Math.hypot(sx - cx, sy - cy);
      let keep = 1;
      switch (mode) {
        case 'lowpass':
          keep = dist <= rNorm ? 1 : 0;
          break;
        case 'highpass':
          keep = dist >= rNorm ? 1 : 0;
          break;
        case 'bandpass':
          keep = dist >= rNorm - bw / 2 && dist <= rNorm + bw / 2 ? 1 : 0;
          break;
        case 'bandstop':
          keep = dist >= rNorm - bw / 2 && dist <= rNorm + bw / 2 ? 0 : 1;
          break;
        default: {
          const _exhaustive: never = mode;
          void _exhaustive;
        }
      }
      if (keep === 0) {
        const i = y * width + x;
        real[i] = 0;
        imag[i] = 0;
      }
    }
  }
}

/** Log-magnitude spectrum as grayscale ImageData (fftshifted for display). */
export function spectrumToImage(spectrum: Spectrum): ImageData {
  const { width, height, real, imag, srcW, srcH } = spectrum;
  const mag = new Float64Array(width * height);
  let maxLog = 0;
  for (let i = 0; i < mag.length; i++) {
    const m = Math.log1p(Math.hypot(real[i]!, imag[i]!));
    mag[i] = m;
    if (m > maxLog) maxLog = m;
  }
  const scale = maxLog > 0 ? 255 / maxLog : 0;
  const data = new Uint8ClampedArray(srcW * srcH * 4);
  const cx = width / 2;
  const cy = height / 2;

  for (let y = 0; y < srcH; y++) {
    for (let x = 0; x < srcW; x++) {
      // Sample from shifted coordinates
      const sx = Math.min(width - 1, x + Math.floor((width - srcW) / 2));
      const sy = Math.min(height - 1, y + Math.floor((height - srcH) / 2));
      const fx = (sx + cx) % width;
      const fy = (sy + cy) % height;
      const v = clamp(Math.round(mag[fy * width + fx]! * scale), 0, 255);
      const di = (y * srcW + x) * 4;
      data[di] = v;
      data[di + 1] = v;
      data[di + 2] = v;
      data[di + 3] = 255;
    }
  }
  return new ImageData(data, srcW, srcH);
}

/** Clone spectrum buffers so we can visualize before destructive masking. */
export function cloneSpectrum(spectrum: Spectrum): Spectrum {
  return {
    width: spectrum.width,
    height: spectrum.height,
    srcW: spectrum.srcW,
    srcH: spectrum.srcH,
    real: spectrum.real.slice(),
    imag: spectrum.imag.slice(),
  };
}

/** Rebuild grayscale ImageData from inverse FFT spatial buffer. */
export function spatialToImage(
  spatial: Float64Array,
  spectrum: Spectrum,
): ImageData {
  const { width, srcW, srcH } = spectrum;
  const data = new Uint8ClampedArray(srcW * srcH * 4);
  for (let y = 0; y < srcH; y++) {
    for (let x = 0; x < srcW; x++) {
      const v = clamp(Math.round(spatial[y * width + x]!), 0, 255);
      const di = (y * srcW + x) * 4;
      data[di] = v;
      data[di + 1] = v;
      data[di + 2] = v;
      data[di + 3] = 255;
    }
  }
  return new ImageData(data, srcW, srcH);
}
