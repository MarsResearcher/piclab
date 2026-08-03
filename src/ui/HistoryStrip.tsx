import { useEffect, useState } from 'react';
import { imageState } from '../core/imageState';

type Thumb = {
  label: string;
  url: string;
};

type Props = {
  tick: number;
  onJump: (index: number) => void;
};

export function HistoryStrip({ tick, onJump }: Props) {
  const [thumbs, setThumbs] = useState<Thumb[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  useEffect(() => {
    const { entries, currentIndex: idx } = imageState.timeline();
    let cancelled = false;
    const urls: string[] = [];

    const make = async () => {
      const result: Thumb[] = [];
      for (const entry of entries) {
        const img = entry.imageData;
        const scale = Math.min(96 / img.width, 64 / img.height, 1);
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d')!;
        const src = document.createElement('canvas');
        src.width = img.width;
        src.height = img.height;
        src.getContext('2d')!.putImageData(img, 0, 0);
        ctx.drawImage(src, 0, 0, w, h);
        const url = c.toDataURL();
        urls.push(url);
        result.push({ label: entry.label, url });
      }
      if (!cancelled) {
        setThumbs(result);
        setCurrentIndex(idx);
      }
    };
    void make();

    return () => {
      cancelled = true;
    };
  }, [tick]);

  if (thumbs.length <= 1) return null;

  return (
    <div className="history-strip glass">
      <div className="history-track">
        {thumbs.map((t, i) => (
          <button
            key={`${i}-${t.label}`}
            type="button"
            className={`history-thumb ${i === currentIndex ? 'current' : ''}`}
            title={t.label}
            onClick={() => onJump(i)}
          >
            <img src={t.url} alt={t.label} />
            <span>{i === currentIndex ? '当前' : t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
