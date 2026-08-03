/**
 * FFT worker — offload spectrum ops for larger images.
 */
import {
  applyRadialMask,
  forwardFFT,
  inverseFFT,
  spatialToImage,
  spectrumToImage,
  type FreqMaskMode,
} from '../lib/fft';

type InMsg = {
  id: string;
  type: string;
  payload: unknown;
};

self.onmessage = (ev: MessageEvent<InMsg>) => {
  const { id, type, payload } = ev.data;
  try {
    switch (type) {
      case 'fftFilter': {
        const p = payload as {
          data: Uint8ClampedArray;
          width: number;
          height: number;
          mode: FreqMaskMode;
          radius: number;
          bandWidth: number;
          showSpectrum: boolean;
        };
        const image = new ImageData(new Uint8ClampedArray(p.data), p.width, p.height);
        const spectrum = forwardFFT(image);
        applyRadialMask(spectrum, p.mode, p.radius, p.bandWidth);
        const aux = p.showSpectrum ? spectrumToImage(spectrum) : null;
        const spatial = inverseFFT(spectrum);
        const resultImg = spatialToImage(spatial, spectrum);
        const transfer: Transferable[] = [resultImg.data.buffer];
        if (aux) transfer.push(aux.data.buffer);
        self.postMessage(
          {
            id,
            result: {
              data: resultImg.data,
              width: resultImg.width,
              height: resultImg.height,
              aux: aux
                ? { data: aux.data, width: aux.width, height: aux.height }
                : null,
            },
          },
          { transfer },
        );
        return;
      }
      default:
        throw new Error(`Unknown FFT worker op: ${type}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    self.postMessage({ id, error: message });
  }
};

export {};
