import { convolve } from '../lib/convolution';

type InMsg = {
  id: string;
  type: string;
  payload: {
    data: Uint8ClampedArray;
    width: number;
    height: number;
    kernel: number[];
    kw: number;
    kh: number;
  };
};

self.onmessage = (ev: MessageEvent<InMsg>) => {
  const { id, type, payload } = ev.data;
  try {
    if (type !== 'convolve') throw new Error(`Unknown type: ${type}`);
    const image = new ImageData(
      new Uint8ClampedArray(payload.data),
      payload.width,
      payload.height,
    );
    const out = convolve(image, payload.kernel, payload.kw, payload.kh);
    self.postMessage(
      { id, result: { data: out.data, width: out.width, height: out.height } },
      { transfer: [out.data.buffer] },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    self.postMessage({ id, error: message });
  }
};

export {};
