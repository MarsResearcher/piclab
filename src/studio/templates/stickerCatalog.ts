/**
 * Pro sticker catalog — Lucide icons (ISC) + Open Doodles illustrations (CC0).
 * Stable business ids keep journal signatures / scatter slots working.
 */

export type StickerTag = 'flower' | 'animal' | 'object' | 'doodle' | 'ui' | 'character';

export type StickerSource =
  | {
      kind: 'lucide';
      icon: string;
      color?: string;
      strokeWidth?: number;
    }
  | {
      kind: 'illustration';
      /** Path under /illustrations/ */
      file: string;
    };

export type StickerItem = {
  id: string;
  tags: StickerTag[];
  defaultW: number;
  source: StickerSource;
  /** Short shelf label */
  label?: string;
};

function L(
  id: string,
  icon: string,
  tags: StickerTag[],
  defaultW: number,
  color?: string,
  strokeWidth?: number,
): StickerItem {
  return {
    id,
    tags,
    defaultW,
    label: id,
    source: {
      kind: 'lucide',
      icon,
      ...(color ? { color } : {}),
      ...(strokeWidth != null ? { strokeWidth } : {}),
    },
  };
}

function I(
  id: string,
  file: string,
  tags: StickerTag[],
  defaultW: number,
): StickerItem {
  return {
    id,
    tags,
    defaultW,
    label: id,
    source: { kind: 'illustration', file },
  };
}

/** Curated Lucide (designer set) + Open Doodles characters. */
export const STICKER_CATALOG: StickerItem[] = [
  // —— stable ids used by journal signatures ——
  L('star-spark', 'Sparkles', ['doodle'], 72, '#E8A317'),
  L('star-four', 'Star', ['doodle'], 56, '#F5D400'),
  L('heart', 'Heart', ['doodle'], 64, '#E85D7A', 2.25),
  L('sparkle-trio', 'WandSparkles', ['doodle'], 80, '#C4A0E0'),
  L('arrow-sketch', 'MoveUpRight', ['doodle', 'ui'], 88, '#E85D4C'),
  L('arrow-curved', 'ArrowRight', ['doodle', 'ui'], 80, '#F5A623'),
  L('swirl', 'RefreshCw', ['doodle'], 64, '#7EC8E3'),
  L('underline-wavy', 'Minus', ['doodle', 'ui'], 100, '#E85D4C', 2.5),
  L('check-box', 'CheckSquare', ['ui', 'doodle'], 56, '#E85D4C'),
  L('check-soft', 'CircleCheck', ['ui', 'doodle'], 52, '#6BBF6B'),
  L('flower-pink', 'Flower2', ['flower'], 80, '#F4A7B9'),
  L('flower-tulip', 'Flower', ['flower'], 72, '#E891A3'),
  L('leaf-pair', 'Leaf', ['flower', 'doodle'], 72, '#6BBF6B'),
  L('flower-daisy', 'Cherry', ['flower'], 72, '#F2789F'),
  L('bloom-cluster', 'Trees', ['flower'], 88, '#5FA86B'),
  L('bunny', 'Rabbit', ['animal'], 88, '#C4B5E0'),
  L('cat-face', 'Cat', ['animal'], 88, '#F5A623'),
  L('corgi', 'Dog', ['animal'], 88, '#E8A060'),
  L('bird', 'Bird', ['animal'], 72, '#7EC8E3'),
  L('clock', 'AlarmClock', ['object'], 96, '#E8A317'),
  L('megaphone', 'Megaphone', ['object'], 96, '#E85D4C'),
  L('book-open', 'BookOpen', ['object'], 88, '#3A5A8C'),
  L('magnifier', 'Search', ['object'], 80, '#1A1510'),
  L('lightbulb', 'Lightbulb', ['object'], 72, '#E8A317'),
  L('paperclip', 'Paperclip', ['object', 'ui'], 48, '#7EC8E3'),
  L('pencil', 'Pencil', ['object'], 72, '#E85D4C'),
  L('coffee', 'Coffee', ['object'], 72, '#8B5A3C'),
  L('camera', 'Camera', ['object'], 80, '#6B7C93'),
  L('gift', 'Gift', ['object'], 80, '#E85D7A'),
  L('music-note', 'Music', ['object', 'doodle'], 64, '#E85D4C'),
  L('speech-bubble', 'MessageCircle', ['ui', 'object'], 88, '#1A1510'),
  L('tag-sale', 'Tag', ['ui', 'object'], 72, '#E85D4C'),
  L('pin', 'MapPin', ['ui', 'object'], 48, '#E85D4C'),
  L('tape-washi', 'Bookmark', ['ui', 'doodle'], 64, '#8FD4C1'),
  L('badge-new', 'BadgePlus', ['ui'], 72, '#7C6BC4'),
  L('moon', 'Moon', ['doodle', 'object'], 64, '#7C6BC4'),
  L('sun', 'Sun', ['doodle', 'object'], 72, '#E8A317'),
  L('cloud', 'Cloud', ['doodle'], 80, '#8AABB8'),
  L('rainbow', 'Rainbow', ['doodle'], 88, '#E85D7A'),
  L('exclaim', 'CircleAlert', ['ui', 'doodle'], 48, '#E85D4C'),
  L('question', 'CircleHelp', ['ui', 'doodle'], 56, '#7EC8E3'),
  L('fire', 'Flame', ['doodle', 'object'], 72, '#E85D4C'),
  L('diamond', 'Diamond', ['doodle', 'ui'], 48, '#7EC8E3'),
  L('smile', 'Smile', ['doodle', 'animal'], 72, '#E8A317'),
  L('crown', 'Crown', ['object', 'doodle'], 80, '#E8A317'),

  // —— extra Lucide for denser shelf (≥50) ——
  L('notebook', 'NotebookPen', ['object', 'ui'], 80, '#3A5A8C'),
  L('sticky', 'StickyNote', ['object', 'ui'], 72, '#F5D400'),
  L('highlighter', 'Highlighter', ['object', 'ui'], 72, '#F5D400'),
  L('party', 'PartyPopper', ['doodle'], 80, '#E85D7A'),
  L('palette', 'Palette', ['object', 'doodle'], 80, '#E85D7A'),
  L('brush', 'Brush', ['object'], 72, '#7C6BC4'),
  L('scissors', 'Scissors', ['object', 'ui'], 64, '#1A1510'),
  L('calendar-heart', 'CalendarHeart', ['object', 'doodle'], 80, '#E85D7A'),
  L('mail', 'Mail', ['object', 'ui'], 72, '#3A5A8C'),
  L('headphones', 'Headphones', ['object'], 72, '#1A1510'),
  L('gamepad', 'Gamepad2', ['object'], 80, '#7C6BC4'),
  L('pizza', 'Pizza', ['object'], 72, '#E85D4C'),
  L('ice-cream-icon', 'IceCreamCone', ['object'], 72, '#F4A7B9'),
  L('plane', 'Plane', ['object'], 72, '#7EC8E3'),
  L('bike', 'Bike', ['object'], 72, '#6BBF6B'),
  L('home', 'Home', ['object'], 72, '#E8A317'),
  L('trophy', 'Trophy', ['object', 'doodle'], 80, '#E8A317'),
  L('target', 'Target', ['ui', 'object'], 72, '#E85D4C'),
  L('zap', 'Zap', ['doodle', 'ui'], 64, '#F5D400'),
  L('thumbs-up', 'ThumbsUp', ['doodle', 'ui'], 64, '#6BBF6B'),
  L('hand-heart', 'HandHeart', ['doodle'], 72, '#E85D7A'),
  L('laugh', 'Laugh', ['doodle'], 72, '#E8A317'),
  L('sticker', 'Sticker', ['doodle', 'ui'], 72, '#F2789F'),
  L('link', 'Link2', ['ui'], 56, '#3A5A8C'),
  L('share', 'Share2', ['ui'], 56, '#1A1510'),
  L('watch', 'Watch', ['object'], 64, '#1A1510'),
  L('key', 'KeyRound', ['object', 'ui'], 64, '#E8A317'),
  L('shirt', 'Shirt', ['object'], 72, '#7EC8E3'),
  L('sofa', 'Sofa', ['object'], 80, '#C4B5E0'),
  L('shell', 'Shell', ['doodle', 'object'], 64, '#F4A7B9'),
  L('fish', 'Fish', ['animal'], 72, '#7EC8E3'),
  L('squirrel', 'Squirrel', ['animal'], 72, '#E8A060'),
  L('bone', 'Bone', ['animal', 'doodle'], 64, '#D0C4B0'),

  // —— Open Doodles characters (CC0) ——
  I('illust-reading', 'reading.svg', ['character', 'doodle'], 160),
  I('illust-coffee', 'coffee.svg', ['character', 'object'], 140),
  I('illust-plant', 'plant.svg', ['character', 'flower'], 160),
  I('illust-loving', 'loving.svg', ['character', 'doodle'], 150),
  I('illust-meditating', 'meditating.svg', ['character', 'doodle'], 150),
  I('illust-dancing', 'dancing.svg', ['character', 'doodle'], 150),
  I('illust-ice-cream', 'ice-cream.svg', ['character', 'object'], 140),
];

export type StickerId = (typeof STICKER_CATALOG)[number]['id'];

export const STICKER_BY_ID: Record<string, StickerItem> = Object.fromEntries(
  STICKER_CATALOG.map((s) => [s.id, s]),
);

export function listStickersByTag(tag: StickerTag | null): StickerItem[] {
  if (!tag) return [...STICKER_CATALOG];
  return STICKER_CATALOG.filter((s) => s.tags.includes(tag));
}
