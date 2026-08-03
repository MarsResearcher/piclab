/**
 * Bundled journal / doodle stickers under /stickers (SVG).
 * Tags drive editor filters and signature scatter picks.
 */

export type StickerTag = 'flower' | 'animal' | 'object' | 'doodle' | 'ui';

export type StickerItem = {
  id: string;
  file: string;
  tags: StickerTag[];
  /** Default place width in canvas px */
  defaultW: number;
};

export const STICKER_CATALOG: StickerItem[] = [
  { id: 'star-spark', file: 'star-spark.svg', tags: ['doodle'], defaultW: 72 },
  { id: 'star-four', file: 'star-four.svg', tags: ['doodle'], defaultW: 56 },
  { id: 'heart', file: 'heart.svg', tags: ['doodle'], defaultW: 64 },
  { id: 'sparkle-trio', file: 'sparkle-trio.svg', tags: ['doodle'], defaultW: 80 },
  { id: 'arrow-sketch', file: 'arrow-sketch.svg', tags: ['doodle', 'ui'], defaultW: 96 },
  { id: 'arrow-curved', file: 'arrow-curved.svg', tags: ['doodle', 'ui'], defaultW: 88 },
  { id: 'swirl', file: 'swirl.svg', tags: ['doodle'], defaultW: 64 },
  { id: 'underline-wavy', file: 'underline-wavy.svg', tags: ['doodle', 'ui'], defaultW: 120 },
  { id: 'check-box', file: 'check-box.svg', tags: ['ui', 'doodle'], defaultW: 56 },
  { id: 'check-soft', file: 'check-soft.svg', tags: ['ui', 'doodle'], defaultW: 52 },
  { id: 'flower-pink', file: 'flower-pink.svg', tags: ['flower'], defaultW: 88 },
  { id: 'flower-tulip', file: 'flower-tulip.svg', tags: ['flower'], defaultW: 72 },
  { id: 'leaf-pair', file: 'leaf-pair.svg', tags: ['flower', 'doodle'], defaultW: 72 },
  { id: 'flower-daisy', file: 'flower-daisy.svg', tags: ['flower'], defaultW: 80 },
  { id: 'bloom-cluster', file: 'bloom-cluster.svg', tags: ['flower'], defaultW: 100 },
  { id: 'bunny', file: 'bunny.svg', tags: ['animal'], defaultW: 100 },
  { id: 'cat-face', file: 'cat-face.svg', tags: ['animal'], defaultW: 88 },
  { id: 'corgi', file: 'corgi.svg', tags: ['animal'], defaultW: 100 },
  { id: 'bird', file: 'bird.svg', tags: ['animal'], defaultW: 80 },
  { id: 'clock', file: 'clock.svg', tags: ['object'], defaultW: 100 },
  { id: 'megaphone', file: 'megaphone.svg', tags: ['object'], defaultW: 96 },
  { id: 'book-open', file: 'book-open.svg', tags: ['object'], defaultW: 96 },
  { id: 'magnifier', file: 'magnifier.svg', tags: ['object'], defaultW: 88 },
  { id: 'lightbulb', file: 'lightbulb.svg', tags: ['object'], defaultW: 72 },
  { id: 'paperclip', file: 'paperclip.svg', tags: ['object', 'ui'], defaultW: 48 },
  { id: 'pencil', file: 'pencil.svg', tags: ['object'], defaultW: 80 },
  { id: 'coffee', file: 'coffee.svg', tags: ['object'], defaultW: 80 },
  { id: 'camera', file: 'camera.svg', tags: ['object'], defaultW: 88 },
  { id: 'gift', file: 'gift.svg', tags: ['object'], defaultW: 80 },
  { id: 'music-note', file: 'music-note.svg', tags: ['object', 'doodle'], defaultW: 64 },
  { id: 'speech-bubble', file: 'speech-bubble.svg', tags: ['ui', 'object'], defaultW: 96 },
  { id: 'tag-sale', file: 'tag-sale.svg', tags: ['ui', 'object'], defaultW: 80 },
  { id: 'pin', file: 'pin.svg', tags: ['ui', 'object'], defaultW: 48 },
  { id: 'tape-washi', file: 'tape-washi.svg', tags: ['ui', 'doodle'], defaultW: 110 },
  { id: 'badge-new', file: 'badge-new.svg', tags: ['ui'], defaultW: 72 },
  { id: 'moon', file: 'moon.svg', tags: ['doodle', 'object'], defaultW: 72 },
  { id: 'sun', file: 'sun.svg', tags: ['doodle', 'object'], defaultW: 80 },
  { id: 'cloud', file: 'cloud.svg', tags: ['doodle'], defaultW: 100 },
  { id: 'rainbow', file: 'rainbow.svg', tags: ['doodle'], defaultW: 100 },
  { id: 'exclaim', file: 'exclaim.svg', tags: ['ui', 'doodle'], defaultW: 48 },
  { id: 'question', file: 'question.svg', tags: ['ui', 'doodle'], defaultW: 56 },
  { id: 'fire', file: 'fire.svg', tags: ['doodle', 'object'], defaultW: 72 },
  { id: 'diamond', file: 'diamond.svg', tags: ['doodle', 'ui'], defaultW: 48 },
  { id: 'smile', file: 'smile.svg', tags: ['doodle', 'animal'], defaultW: 72 },
  { id: 'crown', file: 'crown.svg', tags: ['object', 'doodle'], defaultW: 88 },
];

export type StickerId = (typeof STICKER_CATALOG)[number]['id'];

export const STICKER_BY_ID: Record<string, StickerItem> = Object.fromEntries(
  STICKER_CATALOG.map((s) => [s.id, s]),
);

export function listStickersByTag(tag: StickerTag | null): StickerItem[] {
  if (!tag) return [...STICKER_CATALOG];
  return STICKER_CATALOG.filter((s) => s.tags.includes(tag));
}
