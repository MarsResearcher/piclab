/**
 * Browser VFS for image library (IndexedDB).
 * Stores blobs + metadata; no server needed.
 */

import { publicUrl } from '../lib/publicUrl';
import {
  STOCK_CATALOG,
  stockLibrarySourceId,
} from '../studio/templates/stockCatalog';

export type LibraryItem = {
  id: string;
  name: string;
  blob: Blob;
  width: number;
  height: number;
  createdAt: number;
  /** Optional parent id (e.g. derived edit) */
  sourceId?: string;
};

const DB_NAME = 'piclab-vfs';
const STORE = 'images';
const VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveToLibrary(
  blob: Blob,
  name: string,
  sourceId?: string,
): Promise<LibraryItem> {
  const bitmap = await createImageBitmap(blob);
  const item: LibraryItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    blob,
    width: bitmap.width,
    height: bitmap.height,
    createdAt: Date.now(),
    sourceId,
  };
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(item);
    tx.oncomplete = () => resolve(item);
    tx.onerror = () => reject(tx.error);
  });
}

export async function listLibrary(): Promise<LibraryItem[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => {
      const items = (req.result as LibraryItem[]).sort((a, b) => b.createdAt - a.createdAt);
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteFromLibrary(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getLibraryItem(id: string): Promise<LibraryItem | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve((req.result as LibraryItem) ?? null);
    req.onerror = () => reject(req.error);
  });
}

/** Helper: canvas/ImageData → blob → save */
export async function saveImageDataToLibrary(
  imageData: ImageData,
  name: string,
  sourceId?: string,
): Promise<LibraryItem> {
  const c = document.createElement('canvas');
  c.width = imageData.width;
  c.height = imageData.height;
  c.getContext('2d')!.putImageData(imageData, 0, 0);
  const blob = await new Promise<Blob>((resolve, reject) => {
    c.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png');
  });
  return saveToLibrary(blob, name, sourceId);
}

const SAMPLE_NAME = '示例图';

/** Ensure the built-in sample exists in the library; returns that item. */
export async function ensureSampleInLibrary(): Promise<LibraryItem | null> {
  const items = await listLibrary();
  const existing = items.find((i) => i.name === SAMPLE_NAME);
  if (existing) {
    await ensureTemplateStockInLibrary();
    return existing;
  }
  try {
    const res = await fetch(publicUrl('samples/lab-sample.jpg'));
    if (!res.ok) {
      await ensureTemplateStockInLibrary();
      return null;
    }
    const blob = await res.blob();
    const item = await saveToLibrary(blob, SAMPLE_NAME);
    await ensureTemplateStockInLibrary();
    return item;
  } catch {
    await ensureTemplateStockInLibrary();
    return null;
  }
}

/**
 * Seed bundled template HD stock into the local image library so template
 * photos are shareable from 图库 / 快选 (idempotent via sourceId).
 */
export async function ensureTemplateStockInLibrary(): Promise<number> {
  const items = await listLibrary();
  const bySource = new Set(
    items.map((i) => i.sourceId).filter((s): s is string => !!s),
  );
  let added = 0;
  for (const stock of STOCK_CATALOG) {
    const sourceId = stockLibrarySourceId(stock.id);
    if (bySource.has(sourceId)) continue;
    try {
      const res = await fetch(publicUrl(`template-assets/${stock.file}`));
      if (!res.ok) continue;
      const blob = await res.blob();
      if (blob.size < 40_000) continue;
      await saveToLibrary(blob, stock.name, sourceId);
      bySource.add(sourceId);
      added += 1;
    } catch {
      /* offline / missing file — skip */
    }
  }
  return added;
}
