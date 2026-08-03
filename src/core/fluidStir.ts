/**
 * Continuous fluid-stir engine.
 * Keeps a persistent distorted buffer; each tick warps it further based on pointer velocity.
 */
export class FluidStir {
  private base: ImageData;
  private work: ImageData;
  private vx: Float32Array;
  private vy: Float32Array;
  private lastX = -1;
  private lastY = -1;

  constructor(source: ImageData) {
    this.base = new ImageData(new Uint8ClampedArray(source.data), source.width, source.height);
    this.work = new ImageData(new Uint8ClampedArray(source.data), source.width, source.height);
    const n = source.width * source.height;
    this.vx = new Float32Array(n);
    this.vy = new Float32Array(n);
  }

  reset(source: ImageData) {
    this.base = new ImageData(new Uint8ClampedArray(source.data), source.width, source.height);
    this.work = new ImageData(new Uint8ClampedArray(source.data), source.width, source.height);
    this.vx.fill(0);
    this.vy.fill(0);
    this.lastX = -1;
    this.lastY = -1;
  }

  /**
   * Advance one frame.
   * pointer: current image-space coords, or null if not stirring.
   */
  tick(
    pointer: { x: number; y: number } | null,
    opts: { radius: number; strength: number; viscosity: number },
  ): ImageData {
    const { width, height } = this.work;
    const src = this.work.data;
    const dst = new Uint8ClampedArray(src);
    const out = new ImageData(dst, width, height);

    const radius = Math.max(4, opts.radius);
    const strength = opts.strength;
    const viscosity = opts.viscosity;

    // Inject velocity from pointer
    if (pointer) {
      const px = pointer.x;
      const py = pointer.y;
      const dx = this.lastX >= 0 ? px - this.lastX : 0;
      const dy = this.lastY >= 0 ? py - this.lastY : 0;
      const r2 = radius * radius;
      const x0 = Math.max(0, Math.floor(px - radius));
      const x1 = Math.min(width - 1, Math.ceil(px + radius));
      const y0 = Math.max(0, Math.floor(py - radius));
      const y1 = Math.min(height - 1, Math.ceil(py + radius));

      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const vx0 = x - px;
          const vy0 = y - py;
          const d2 = vx0 * vx0 + vy0 * vy0;
          if (d2 > r2) continue;
          const fall = Math.exp(-d2 / (r2 * 0.5));
          const idx = y * width + x;
          // Tangential swirl + drag
          const dist = Math.sqrt(d2) + 1e-4;
          const tx = (-vy0 / dist) * strength * 4 * fall;
          const ty = (vx0 / dist) * strength * 4 * fall;
          this.vx[idx] = this.vx[idx]! * 0.6 + (tx + dx * 0.4 * strength * fall) * 0.4;
          this.vy[idx] = this.vy[idx]! * 0.6 + (ty + dy * 0.4 * strength * fall) * 0.4;
        }
      }
      this.lastX = px;
      this.lastY = py;
    } else {
      this.lastX = -1;
      this.lastY = -1;
    }

    // Diffuse + decay velocity, and advect pixels
    const nextVx = new Float32Array(this.vx);
    const nextVy = new Float32Array(this.vy);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = y * width + x;
        // Simple diffusion
        nextVx[i] =
          (this.vx[i]! * 4 + this.vx[i - 1]! + this.vx[i + 1]! + this.vx[i - width]! + this.vx[i + width]!) /
          8;
        nextVy[i] =
          (this.vy[i]! * 4 + this.vy[i - 1]! + this.vy[i + 1]! + this.vy[i - width]! + this.vy[i + width]!) /
          8;
      }
    }

    for (let i = 0; i < nextVx.length; i++) {
      nextVx[i] = nextVx[i]! * viscosity;
      nextVy[i] = nextVy[i]! * viscosity;
    }

    this.vx = nextVx;
    this.vy = nextVy;

    // Advect (backward sample)
    const wsrc = this.work.data;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        const vx = this.vx[i]!;
        const vy = this.vy[i]!;
        if (Math.abs(vx) < 0.01 && Math.abs(vy) < 0.01) {
          continue;
        }
        const sx = x - vx;
        const sy = y - vy;

        const ix = Math.max(0, Math.min(width - 1, Math.floor(sx)));
        const iy = Math.max(0, Math.min(height - 1, Math.floor(sy)));
        const fx = sx - ix;
        const fy = sy - iy;
        const ix1 = Math.min(width - 1, ix + 1);
        const iy1 = Math.min(height - 1, iy + 1);

        const i00 = (iy * width + ix) * 4;
        const i10 = (iy * width + ix1) * 4;
        const i01 = (iy1 * width + ix) * 4;
        const i11 = (iy1 * width + ix1) * 4;
        const di = i * 4;

        for (let c = 0; c < 3; c++) {
          const a = wsrc[i00 + c]! * (1 - fx) + wsrc[i10 + c]! * fx;
          const b = wsrc[i01 + c]! * (1 - fx) + wsrc[i11 + c]! * fx;
          dst[di + c] = a * (1 - fy) + b * fy;
        }
        dst[di + 3] = 255;
      }
    }

    this.work = out;
    return this.work;
  }

  get current(): ImageData {
    return this.work;
  }

  get original(): ImageData {
    return this.base;
  }
}
