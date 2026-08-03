import { useEffect, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import {
  ensureSampleInLibrary,
  listLibrary,
  type LibraryItem,
} from '../../core/library';

type Props = {
  refreshKey?: number;
  onPick: (blob: Blob, name: string, id: string) => void;
};

export function SampleStrip({ refreshKey = 0, onPick }: Props) {
  const [items, setItems] = useState<LibraryItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await ensureSampleInLibrary();
      const list = await listLibrary();
      if (!cancelled) setItems(list.slice(0, 24));
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (items.length === 0) {
    return (
      <p className="hint sample-strip-empty">图库为空，点「示例」或「图库」导入</p>
    );
  }

  return (
    <div className="sample-strip">
      <div className="sample-strip-label">
        <ImagePlus size={12} strokeWidth={2} />
        <span>快选</span>
      </div>
      <div className="sample-strip-scroll">
        {items.map((item) => (
          <SampleThumb key={item.id} item={item} onPick={() => onPick(item.blob, item.name, item.id)} />
        ))}
      </div>
    </div>
  );
}

function SampleThumb({ item, onPick }: { item: LibraryItem; onPick: () => void }) {
  const [url, setUrl] = useState('');

  useEffect(() => {
    const u = URL.createObjectURL(item.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [item.blob]);

  return (
    <button
      type="button"
      className="sample-thumb"
      title={`${item.name} · 点击加入画板`}
      onClick={onPick}
    >
      {url ? <img src={url} alt={item.name} draggable={false} /> : null}
    </button>
  );
}
