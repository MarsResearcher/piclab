/**
 * Generic pixel-ops worker.
 * Message protocol: { id, type, payload } → { id, result } | { id, error }
 */
import { convolve } from '../lib/convolution';

type InMsg = {
  id: string;
  type: string;
  payload: unknown;
};

self.onmessage = (ev: MessageEvent<InMsg>) => {
  const { id, type, payload } = ev.data;
  try {
    let result: unknown;
    switch (type) {
      case 'convolve': {
        const p = payload as {
          data: Uint8ClampedArray;
          width: number;
          height: number;
          kernel: number[];
          kw: number;
          kh: number;
        };
        const image = new ImageData(new Uint8ClampedArray(p.data), p.width, p.height);
        const out = convolve(image, p.kernel, p.kw, p.kh);
        result = {
          data: out.data,
          width: out.width,
          height: out.height,
        };
        self.postMessage({ id, result }, { transfer: [out.data.buffer] });
        return;
      }
      default:
        throw new Error(`Unknown worker op: ${type}`);
    }
    self.postMessage({ id, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    self.postMessage({ id, error: message });
  }
};

export {};
