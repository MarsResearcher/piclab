export type ViewTransform = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

export type ImagePointerInfo = {
  x: number;
  y: number;
  pressure: number;
};

export type CanvasInteractionHandlers = {
  /** Direct manipulation on the image (paint/brush). Return true if handled (skip pan). */
  onPaint?: (event: PointerEvent, info: ImagePointerInfo) => boolean;
  /** Aux viewport painting gets coordinates in aux-image space instead. */
  onAuxPaint?: (event: PointerEvent, info: ImagePointerInfo) => boolean;
  /** Double-click on image (e.g. edit text). */
  onDblClick?: (event: MouseEvent, info: ImagePointerInfo) => void;
};

const MIN_SCALE = 0.05;
const MAX_SCALE = 32;

/**
 * Owns the main canvas: draw ImageData, pan/zoom, fit-to-view.
 */
export class CanvasManager {
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private image: ImageData | null = null;
  /** Cached raster of current ImageData — avoid allocating a canvas every redraw. */
  private sourceCanvas: HTMLCanvasElement | null = null;
  private transform: ViewTransform = { scale: 1, offsetX: 0, offsetY: 0 };
  private dragging = false;
  private lastPointer = { x: 0, y: 0 };
  private listeners = new Set<() => void>();
  private checkerboard: boolean;
  private interaction: CanvasInteractionHandlers | null = null;

  constructor(canvas: HTMLCanvasElement, options?: { checkerboard?: boolean }) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    if (!ctx) throw new Error('2D canvas context unavailable');
    this.ctx = ctx;
    this.checkerboard = options?.checkerboard ?? true;
    this.bindPointer();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }

  get view(): ViewTransform {
    return { ...this.transform };
  }

  setInteraction(handlers: CanvasInteractionHandlers | null): void {
    this.interaction = handlers;
  }

  /** Convert client coords to image-space pixel coords. */
  clientToImage(clientX: number, clientY: number): ImagePointerInfo | null {
    if (!this.image) return null;
    const rect = this.canvas.getBoundingClientRect();
    const x = (clientX - rect.left - this.transform.offsetX) / this.transform.scale;
    const y = (clientY - rect.top - this.transform.offsetY) / this.transform.scale;
    if (x < 0 || y < 0 || x >= this.image.width || y >= this.image.height) return null;
    return { x: Math.floor(x), y: Math.floor(y), pressure: 1 };
  }

  setImage(imageData: ImageData | null, fit = false): void {
    this.bindImage(imageData);
    if (fit && imageData) this.fitToView();
    this.redraw();
    this.notify();
  }

  /** Fast path: no subscription notification (for high-frequency updates). */
  setImageSilent(imageData: ImageData | null): void {
    this.bindImage(imageData);
    this.redraw();
  }

  private bindImage(imageData: ImageData | null): void {
    this.image = imageData;
    if (!imageData) {
      this.sourceCanvas = null;
      return;
    }
    // Reuse one offscreen canvas — never allocate per redraw frame
    if (!this.sourceCanvas) this.sourceCanvas = document.createElement('canvas');
    if (
      this.sourceCanvas.width !== imageData.width ||
      this.sourceCanvas.height !== imageData.height
    ) {
      this.sourceCanvas.width = imageData.width;
      this.sourceCanvas.height = imageData.height;
    }
    this.sourceCanvas.getContext('2d')!.putImageData(imageData, 0, 0);
  }

  resize(width: number, height: number): void {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.max(1, Math.floor(width * dpr));
    this.canvas.height = Math.max(1, Math.floor(height * dpr));
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.redraw();
  }

  fitToView(): void {
    if (!this.image) return;
    const cssW = this.canvas.clientWidth || this.canvas.width;
    const cssH = this.canvas.clientHeight || this.canvas.height;
    const pad = 48;
    const scale = Math.min(
      (cssW - pad) / this.image.width,
      (cssH - pad) / this.image.height,
      1,
    );
    this.transform.scale = Math.max(MIN_SCALE, scale);
    this.transform.offsetX = (cssW - this.image.width * this.transform.scale) / 2;
    this.transform.offsetY = (cssH - this.image.height * this.transform.scale) / 2;
  }

  zoomAt(clientX: number, clientY: number, factor: number): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const before = this.transform.scale;
    const after = Math.min(MAX_SCALE, Math.max(MIN_SCALE, before * factor));
    const wx = (x - this.transform.offsetX) / before;
    const wy = (y - this.transform.offsetY) / before;
    this.transform.scale = after;
    this.transform.offsetX = x - wx * after;
    this.transform.offsetY = y - wy * after;
    this.redraw();
    this.notify();
  }

  resetView(): void {
    this.fitToView();
    this.redraw();
    this.notify();
  }

  redraw(): void {
    const w = this.canvas.clientWidth || this.canvas.width;
    const h = this.canvas.clientHeight || this.canvas.height;
    this.ctx.save();
    this.ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
    this.ctx.clearRect(0, 0, w, h);

    if (this.checkerboard) {
      this.drawCheckerboard(w, h);
    }

    if (this.image && this.sourceCanvas) {
      this.ctx.imageSmoothingEnabled = this.transform.scale < 1;
      this.ctx.drawImage(
        this.sourceCanvas,
        this.transform.offsetX,
        this.transform.offsetY,
        this.image.width * this.transform.scale,
        this.image.height * this.transform.scale,
      );
    }
    this.ctx.restore();
  }

  private drawCheckerboard(w: number, h: number): void {
    const size = 12;
    for (let y = 0; y < h; y += size) {
      for (let x = 0; x < w; x += size) {
        const odd = ((x / size) | 0) + ((y / size) | 0);
        this.ctx.fillStyle = odd % 2 === 0 ? '#14161a' : '#1a1d23';
        this.ctx.fillRect(x, y, size, size);
      }
    }
  }

  private bindPointer(): void {
    this.canvas.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.button !== 1) return;
      // Direct manipulation first
      if (this.interaction?.onPaint) {
        const info = this.clientToImage(e.clientX, e.clientY);
        if (info && this.interaction.onPaint(e, info)) {
          this.canvas.setPointerCapture(e.pointerId);
          return;
        }
      }
      this.dragging = true;
      this.lastPointer = { x: e.clientX, y: e.clientY };
      this.canvas.setPointerCapture(e.pointerId);
    });

    this.canvas.addEventListener('pointermove', (e) => {
      if (this.interaction?.onPaint && (e.buttons & 1)) {
        const info = this.clientToImage(e.clientX, e.clientY);
        if (info && this.interaction.onPaint(e, info)) {
          return; // painting, not panning
        }
      }
      if (!this.dragging) return;
      const dx = e.clientX - this.lastPointer.x;
      const dy = e.clientY - this.lastPointer.y;
      this.lastPointer = { x: e.clientX, y: e.clientY };
      this.transform.offsetX += dx;
      this.transform.offsetY += dy;
      this.redraw();
      this.notify();
    });

    const endDrag = (e: PointerEvent) => {
      this.dragging = false;
      try {
        this.canvas.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    };
    this.canvas.addEventListener('pointerup', endDrag);
    this.canvas.addEventListener('pointercancel', endDrag);

    this.canvas.addEventListener('dblclick', (e) => {
      if (!this.interaction?.onDblClick) return;
      const info = this.clientToImage(e.clientX, e.clientY);
      if (info) this.interaction.onDblClick(e, info);
    });

    this.canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
        this.zoomAt(e.clientX, e.clientY, factor);
      },
      { passive: false },
    );
  }
}
