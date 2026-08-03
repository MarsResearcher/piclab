/**
 * Session persistence — restore the editing state after page reload.
 * Stores the current image (compressed JPEG blob) + active experiment id in IndexedDB.
 */

const DB_NAME = 'piclab-session';
const STORE = 'kv';
const VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function put(key: string, value: unknown): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function get<T>(key: string): Promise<T | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve((req.result as T) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export type SessionSnapshot = {
  imageBlob: Blob;
  experimentId: string | null;
  libraryId: string | null;
  savedAt: number;
};

let saveTimer: number | null = null;

/** Debounced save — called on every committed state change. */
export function scheduleSessionSave(
  imageData: ImageData | null,
  experimentId: string | null,
  libraryId: string | null,
): void {
  if (saveTimer !== null) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    saveTimer = null;
    if (!imageData) {
      void put('snapshot', null);
      return;
    }
    // Compress to JPEG to keep IndexedDB small
    const c = document.createElement('canvas');
    c.width = imageData.width;
    c.height = imageData.height;
    c.getContext('2d')!.putImageData(imageData, 0, 0);
    c.toBlob(
      (blob) => {
        if (!blob) return;
        const snapshot: SessionSnapshot = {
          imageBlob: blob,
          experimentId,
          libraryId,
          savedAt: Date.now(),
        };
        void put('snapshot', snapshot);
      },
      'image/jpeg',
      0.85,
    );
  }, 600);
}

export async function loadSessionSnapshot(): Promise<SessionSnapshot | null> {
  return get<SessionSnapshot>('snapshot');
}

export async function clearSession(): Promise<void> {
  await put('snapshot', null);
}
