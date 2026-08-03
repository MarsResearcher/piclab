import { useEffect, useRef, useState } from 'react';
import {
  deleteFromLibrary,
  ensureSampleInLibrary,
  listLibrary,
  saveImageDataToLibrary,
  saveToLibrary,
  type LibraryItem,
} from '../core/library';
import { StockPanel } from './studio/StockPanel';

type Tab = 'local' | 'stock';

type Props = {
  onPick: (blob: Blob, name: string, id: string) => void;
  /** Get current editor image to save as new library item */
  getCurrentImage: () => ImageData | null;
  currentLibraryId: string | null;
  onStatus?: (msg: string) => void;
};

export function LibraryPanel({ onPick, getCurrentImage, currentLibraryId, onStatus }: Props) {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>('local');
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    const list = await listLibrary();
    setItems(list);
  };

  useEffect(() => {
    void (async () => {
      await ensureSampleInLibrary();
      await refresh();
    })();
  }, []);

  const importFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        await saveToLibrary(file, file.name);
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const saveCurrent = async () => {
    const img = getCurrentImage();
    if (!img) return;
    setBusy(true);
    try {
      const name = `编辑-${new Date().toLocaleTimeString()}`;
      await saveImageDataToLibrary(img, name, currentLibraryId ?? undefined);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="library-panel">
      <div className="library-tabs">
        <button
          type="button"
          className={tab === 'local' ? 'active' : ''}
          onClick={() => setTab('local')}
        >
          本地
        </button>
        <button
          type="button"
          className={tab === 'stock' ? 'active' : ''}
          onClick={() => setTab('stock')}
        >
          在线
        </button>
      </div>

      {tab === 'stock' ? (
        <StockPanel
          onImported={() => void refresh()}
          onStatus={onStatus}
          onPick={onPick}
        />
      ) : (
        <>
      <div className="library-head">
        <h3>图片库</h3>
        <div className="library-actions">
          <button
            type="button"
            className="btn"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            导入
          </button>
          <button
            type="button"
            className="btn primary"
            disabled={busy || !getCurrentImage()}
            onClick={() => void saveCurrent()}
          >
            保存当前
          </button>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          void importFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {items.length === 0 ? (
        <p className="hint">库是空的。点「导入」把图片收进来，或编辑后点「保存当前」。</p>
      ) : (
        <div className="library-grid">
          {items.map((item) => (
            <LibraryCard
              key={item.id}
              item={item}
              onPick={() => onPick(item.blob, item.name, item.id)}
              onDelete={async () => {
                await deleteFromLibrary(item.id);
                await refresh();
              }}
            />
          ))}
        </div>
      )}
        </>
      )}
    </section>
  );
}

function LibraryCard({
  item,
  onPick,
  onDelete,
}: {
  item: LibraryItem;
  onPick: () => void;
  onDelete: () => void;
}) {
  const [url, setUrl] = useState<string>('');

  useEffect(() => {
    const u = URL.createObjectURL(item.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [item.blob]);

  return (
    <div className="library-card">
      <button
        type="button"
        className="thumb"
        onClick={onPick}
        title={`${item.name} · 点击载入，或拖到画布`}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('application/x-piclab-library', item.id);
          e.dataTransfer.effectAllowed = 'copy';
        }}
      >
        {url && <img src={url} alt={item.name} loading="lazy" draggable={false} />}
      </button>
      <div className="card-foot">
        <span className="name" title={item.name}>
          {item.name}
        </span>
        <button type="button" className="del" onClick={onDelete} title="删除">
          ×
        </button>
      </div>
    </div>
  );
}
