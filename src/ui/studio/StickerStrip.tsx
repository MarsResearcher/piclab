import { useMemo, useState } from 'react';
import {
  STICKER_CATALOG,
  listStickersByTag,
  type StickerTag,
} from '../../studio/templates/stickerCatalog';

type Props = {
  onPick: (id: string) => void;
};

const TAGS: { id: StickerTag | null; label: string }[] = [
  { id: null, label: '\u5168\u90e8' },
  { id: 'doodle', label: '\u6d82\u9e26' },
  { id: 'flower', label: '\u82b1' },
  { id: 'animal', label: '\u52a8\u7269' },
  { id: 'object', label: '\u7269\u4ef6' },
  { id: 'ui', label: 'UI' },
];

export function StickerStrip({ onPick }: Props) {
  const [tag, setTag] = useState<StickerTag | null>(null);
  const items = useMemo(() => listStickersByTag(tag), [tag]);

  return (
    <div className="sticker-strip">
      <div className="sticker-strip-head">{'\u8d34\u7eb8'}</div>
      <div className="sticker-tag-row" role="toolbar" aria-label={'\u8d34\u7eb8\u5206\u7c7b'}>
        {TAGS.map((t) => (
          <button
            key={t.label}
            type="button"
            className={`sticker-tag ${tag === t.id ? 'active' : ''}`}
            onClick={() => setTag(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="sticker-grid">
        {items.map((s) => (
          <button
            key={s.id}
            type="button"
            className="sticker-cell"
            title={s.id}
            onClick={() => onPick(s.id)}
          >
            <img src={`/stickers/${s.file}`} alt="" loading="lazy" />
          </button>
        ))}
      </div>
      <p className="sticker-strip-hint">
        {STICKER_CATALOG.length}
        {' \u679a\u8d34\u7eb8 \u00b7 \u70b9\u51fb\u63d2\u5165\u753b\u5e03'}
      </p>
    </div>
  );
}
