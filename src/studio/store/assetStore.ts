export type Asset = {
  id: string;
  kind: 'image';
  width: number;
  height: number;
  /** In-memory pixel buffer */
  imageData: ImageData;
};

export class AssetStore {
  private assets = new Map<string, Asset>();
  /** Cached canvas for drawImage — avoids putImageData every paint */
  private canvasCache = new Map<string, HTMLCanvasElement>();

  has(id: string): boolean {
    return this.assets.has(id);
  }

  get(id: string): Asset | undefined {
    return this.assets.get(id);
  }

  /** Return a canvas with the asset pixels (cached). */
  getCanvas(id: string): HTMLCanvasElement | null {
    const asset = this.assets.get(id);
    if (!asset) return null;
    let canvas = this.canvasCache.get(id);
    if (
      canvas &&
      canvas.width === asset.width &&
      canvas.height === asset.height
    ) {
      return canvas;
    }
    canvas = document.createElement('canvas');
    canvas.width = asset.width;
    canvas.height = asset.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: false })!;
    ctx.putImageData(asset.imageData, 0, 0);
    this.canvasCache.set(id, canvas);
    return canvas;
  }

  putImageData(imageData: ImageData, id?: string): Asset {
    const assetId =
      id ?? `asset_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    this.canvasCache.delete(assetId);
    const asset: Asset = {
      id: assetId,
      kind: 'image',
      width: imageData.width,
      height: imageData.height,
      imageData: new ImageData(
        new Uint8ClampedArray(imageData.data),
        imageData.width,
        imageData.height,
      ),
    };
    this.assets.set(asset.id, asset);
    return asset;
  }

  replaceImageData(id: string, imageData: ImageData): void {
    const prev = this.assets.get(id);
    if (!prev) return;
    this.canvasCache.delete(id);
    this.assets.set(id, {
      ...prev,
      width: imageData.width,
      height: imageData.height,
      imageData: new ImageData(
        new Uint8ClampedArray(imageData.data),
        imageData.width,
        imageData.height,
      ),
    });
  }

  /** Clone pixels under a new asset id (for duplicate nodes). */
  duplicate(id: string): Asset | null {
    const prev = this.assets.get(id);
    if (!prev) return null;
    return this.putImageData(prev.imageData);
  }

  remove(id: string): void {
    this.assets.delete(id);
    this.canvasCache.delete(id);
  }

  clear(): void {
    this.assets.clear();
    this.canvasCache.clear();
  }
}
