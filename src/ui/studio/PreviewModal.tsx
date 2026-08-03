import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { formatDims } from './projectDisplay';

export type PreviewPage = {
  name: string;
  imageData: ImageData;
};

export type PreviewBackdrop = 'white' | 'black' | 'checker';

type Props = {
  pages: PreviewPage[];
  title?: string;
  onClose: () => void;
};

const BACKDROPS: { id: PreviewBackdrop; label: string }[] = [
  { id: 'white', label: '\u767d\u5e95' },
  { id: 'black', label: '\u9ed1\u5e95' },
  { id: 'checker', label: '\u900f\u660e' },
];

export function PreviewModal({ pages, title, onClose }: Props) {
  const [index, setIndex] = useState(0);
  const [url, setUrl] = useState('');
  const [backdrop, setBackdrop] = useState<PreviewBackdrop>('checker');
  const safeIndex = Math.min(index, Math.max(0, pages.length - 1));
  const current = pages[safeIndex];
  const multi = pages.length > 1;

  useEffect(() => {
    setIndex(0);
  }, [pages]);

  useEffect(() => {
    if (!current) {
      setUrl('');
      return;
    }
    const c = document.createElement('canvas');
    c.width = current.imageData.width;
    c.height = current.imageData.height;
    c.getContext('2d')!.putImageData(current.imageData, 0, 0);
    let revoked = false;
    c.toBlob((blob) => {
      if (!blob || revoked) return;
      setUrl(URL.createObjectURL(blob));
    }, 'image/png');
    return () => {
      revoked = true;
      setUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return '';
      });
    };
  }, [current]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (!multi) return;
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setIndex((i) => Math.max(0, i - 1));
      }
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        setIndex((i) => Math.min(pages.length - 1, i + 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, multi, pages.length]);

  if (!current) return null;

  return (
    <div className="studio-preview-modal" role="dialog" aria-modal="true">
      <div className="studio-preview-backdrop" onClick={onClose} />
      <div className="studio-preview-card">
        <header>
          <span className="studio-preview-title">
            {'\u9884\u89c8'}
            {title ? ` \u00b7 ${title}` : ''}
            {multi ? ` \u00b7 ${current.name}` : ''}
          </span>
          <div
            className="studio-preview-backdrop-toggles"
            role="group"
            aria-label={'\u80cc\u666f'}
          >
            {BACKDROPS.map((b) => (
              <button
                key={b.id}
                type="button"
                className={`studio-preview-bd-btn ${backdrop === b.id ? 'active' : ''} is-${b.id}`}
                title={b.label}
                aria-label={b.label}
                aria-pressed={backdrop === b.id}
                onClick={() => setBackdrop(b.id)}
              >
                <span className="studio-preview-bd-swatch" />
              </button>
            ))}
          </div>
          <button type="button" className="btn icon" onClick={onClose} title={'\u5173\u95ed'}>
            <X size={16} />
          </button>
        </header>
        <div className={`studio-preview-stage is-${backdrop}`}>
          {url ? <img src={url} alt={current.name} /> : <p className="hint">{'\u2026'}</p>}
        </div>
        <footer className="studio-preview-footer">
          <span className="muted">
            {formatDims(current.imageData.width, current.imageData.height)}
          </span>
          {multi && (
            <div className="studio-preview-pager">
              <button
                type="button"
                className="btn icon"
                disabled={safeIndex <= 0}
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                title={'\u4e0a\u4e00\u9762'}
              >
                <ChevronLeft size={16} />
              </button>
              <div className="studio-preview-dots" role="tablist">
                {pages.map((p, i) => (
                  <button
                    key={`${p.name}-${i}`}
                    type="button"
                    className={`studio-preview-dot ${i === safeIndex ? 'active' : ''}`}
                    aria-label={p.name}
                    aria-selected={i === safeIndex}
                    onClick={() => setIndex(i)}
                  />
                ))}
              </div>
              <button
                type="button"
                className="btn icon"
                disabled={safeIndex >= pages.length - 1}
                onClick={() => setIndex((i) => Math.min(pages.length - 1, i + 1))}
                title={'\u4e0b\u4e00\u9762'}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}
