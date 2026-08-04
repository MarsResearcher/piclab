/**
 * Shared IndexedDB / blob helpers for the studio object store
 * (projects · templates · prefs · folders). One place owns schema + encode/decode.
 */

const DB_NAME = 'piclab-studio';
const VERSION = 4;

export const IDB_STORE = {
  projects: 'projects',
  templates: 'templates',
  prefs: 'prefs',
  folders: 'folders',
  legacyKv: 'kv',
} as const;

export type IdbStoreName = (typeof IDB_STORE)[keyof typeof IDB_STORE];

export type StoredAsset = {
  id: string;
  width: number;
  height: number;
  blob: Blob;
};

function openDb(): Promise<IDBDatabase> {
  const req = indexedDB.open(DB_NAME, VERSION);
  return new Promise((resolve, reject) => {
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const store of Object.values(IDB_STORE)) {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store);
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function withStore<T>(store: IdbStoreName, mode: IDBTransactionMode, run: (tx: IDBTransaction) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(store, mode);
        const req = run(tx);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

export function idbGet<T>(store: IdbStoreName, key: string): Promise<T | null> {
  return withStore<T | null>(store, 'readonly', (tx) => tx.objectStore(store).get(key)).then(
    (v) => v ?? null,
  );
}

export function idbPut(store: IdbStoreName, key: string, value: unknown): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(store, 'readwrite');
        tx.objectStore(store).put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      }),
  );
}

export function idbDelete(store: IdbStoreName, key: string): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(store, 'readwrite');
        tx.objectStore(store).delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      }),
  );
}

export function idbGetAllKeys(store: IdbStoreName): Promise<string[]> {
  return withStore<IDBValidKey[]>(store, 'readonly', (tx) => tx.objectStore(store).getAllKeys()).then(
    (keys) => keys.map(String),
  );
}

/** Safe canvas 2d context — returns null when the canvas is too large / exhausted. */
export function canvas2d(c: HTMLCanvasElement): CanvasRenderingContext2D | null {
  return c.getContext('2d', { willReadFrequently: true });
}

export async function imageDataToPngBlob(imageData: ImageData): Promise<Blob> {
  const c = document.createElement('canvas');
  c.width = imageData.width;
  c.height = imageData.height;
  const ctx = canvas2d(c);
  if (!ctx) throw new Error('canvas unavailable');
  ctx.putImageData(imageData, 0, 0);
  return new Promise((resolve, reject) => {
    c.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('PNG encode failed'));
    }, 'image/png');
  });
}

export async function blobToImageData(blob: Blob): Promise<ImageData> {
  const bitmap = await createImageBitmap(blob);
  try {
    const c = document.createElement('canvas');
    c.width = bitmap.width;
    c.height = bitmap.height;
    const ctx = canvas2d(c);
    if (!ctx) throw new Error('canvas unavailable');
    ctx.drawImage(bitmap, 0, 0);
    return ctx.getImageData(0, 0, c.width, c.height);
  } finally {
    bitmap.close();
  }
}

export async function collectAssets(
  assetIds: Iterable<string>,
  assets: { get(id: string): { id: string; width: number; height: number; imageData: ImageData } | undefined },
): Promise<StoredAsset[]> {
  const stored: StoredAsset[] = [];
  for (const id of assetIds) {
    const asset = assets.get(id);
    if (!asset) continue;
    stored.push({
      id: asset.id,
      width: asset.width,
      height: asset.height,
      blob: await imageDataToPngBlob(asset.imageData),
    });
  }
  return stored;
}

/** Rehydrate stored blobs into an AssetStore-like sink, returning id → new id map. */
export async function hydrateAssets(
  stored: StoredAsset[],
  sink: { putImageData(imageData: ImageData, id?: string): { id: string } },
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const a of stored) {
    const imageData = await blobToImageData(a.blob);
    const asset = sink.putImageData(imageData);
    map.set(a.id, asset.id);
  }
  return map;
}
