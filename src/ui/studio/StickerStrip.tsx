import { useMemo, useState } from 'react';
import { publicUrl } from '../../lib/publicUrl';
import {
  STICKER_CATALOG,
  listStickersByTag,
  type StickerItem,
  type StickerTag,
} from '../../studio/templates/stickerCatalog';
import { lucideThumbDataUrl } from '../../studio/templates/stickerRaster';

type Props = {
  onPick: (id: string) => void;
};

const TAGS: { id: StickerTag | null; label: string }[] = [
  { id: null, label: '\u5168\u90e8' },
  { id: 'doodle', label: '\u6d82\u9e26' },
  { id: 'character', label: '\u89d2\u8272' },
  { id: 'flower', label: '\u82b1' },
  { id: 'animal', label: '\u52a8\u7269' },
  { id: 'object', label: '\u7269\u4ef6' },
  { id: 'ui', label: 'UI' },
];

function thumbSrc(item: StickerItem): string {
  const src = item.source;
  if (src.kind === 'illustration') return publicUrl(`illustrations/${src.file}`);
  return lucideThumbDataUrl(src.icon, {
    color: src.color ?? '#1A1510',
    strokeWidth: src.strokeWidth ?? 2,
  });
}

export function StickerStrip({ onPick }: Props) {
  const [tag, setTag] = useState<StickerTag | null>(null);
  const items = useMemo(() => listStickersByTag(tag), [tag]);

  return (
    <div className="sticker-strip">
      <div className="sticker-strip-head">
        {'\u8d34\u7eb8'}
        <span className="sticker-strip-sub"> Lucide · Open Doodles</span>
      </div>
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
            className={`sticker-cell ${s.source.kind === 'illustration' ? 'is-illust' : ''}`}
            title={s.id}
            onClick={() => onPick(s.id)}
          >
            <img src={thumbSrc(s)} alt="" loading="lazy" />
          </button>
        ))}
      </div>
      <p className="sticker-strip-hint">
        {STICKER_CATALOG.length}
        {' \u679a\u00b7\u4e13\u4e1a\u56fe\u6807\u5e93\uff0c\u70b9\u51fb\u63d2\u5165'}
      </p>
    </div>
  );
}
