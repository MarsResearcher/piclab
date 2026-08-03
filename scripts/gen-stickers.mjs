/**
 * Generate a curated hand-drawn doodle sticker pack (SVG) for XHS atmosphere.
 * Original PicLab doodles — free for use with the product (see public/stickers/CREDITS.md).
 * Run: node scripts/gen-stickers.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'public', 'stickers');

function svg(body, view = 128) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${view}" height="${view}" viewBox="0 0 ${view} ${view}" fill="none">
${body}
</svg>
`;
}

const S = {
  ink: '#1A1510',
  pink: '#F4A7B9',
  peach: '#FDCB7E',
  yellow: '#FFE566',
  lime: '#B8E05A',
  mint: '#8FD4C1',
  lavender: '#C4B5E0',
  coral: '#E85D4C',
  sky: '#7EC8E3',
  cream: '#FFF8EC',
  orange: '#F5A623',
  white: '#FFFFFF',
};

/** @type {{ id: string, tags: string[], defaultW: number, body: string }[]} */
const STICKERS = [
  // —— doodle ——
  {
    id: 'star-spark',
    tags: ['doodle'],
    defaultW: 72,
    body: `<path d="M64 12 L72 48 L108 48 L80 70 L90 108 L64 86 L38 108 L48 70 L20 48 L56 48 Z" fill="${S.yellow}" stroke="${S.ink}" stroke-width="4" stroke-linejoin="round"/>`,
  },
  {
    id: 'star-four',
    tags: ['doodle'],
    defaultW: 56,
    body: `<path d="M64 18 C68 48 80 60 110 64 C80 68 68 80 64 110 C60 80 48 68 18 64 C48 60 60 48 64 18 Z" fill="${S.yellow}" stroke="${S.ink}" stroke-width="3.5" stroke-linejoin="round"/>`,
  },
  {
    id: 'heart',
    tags: ['doodle'],
    defaultW: 64,
    body: `<path d="M64 108 C64 108 18 76 18 48 C18 30 32 20 48 24 C56 26 62 34 64 40 C66 34 72 26 80 24 C96 20 110 30 110 48 C110 76 64 108 64 108 Z" fill="${S.pink}" stroke="${S.ink}" stroke-width="4" stroke-linejoin="round"/>`,
  },
  {
    id: 'sparkle-trio',
    tags: ['doodle'],
    defaultW: 80,
    body: `<path d="M40 20 L44 36 L60 40 L44 44 L40 60 L36 44 L20 40 L36 36 Z" fill="${S.yellow}" stroke="${S.ink}" stroke-width="2.5"/><path d="M90 50 L93 62 L105 65 L93 68 L90 80 L87 68 L75 65 L87 62 Z" fill="${S.lime}" stroke="${S.ink}" stroke-width="2.5"/><path d="M70 88 L72 96 L80 98 L72 100 L70 108 L68 100 L60 98 L68 96 Z" fill="${S.pink}" stroke="${S.ink}" stroke-width="2"/>`,
  },
  {
    id: 'arrow-sketch',
    tags: ['doodle', 'ui'],
    defaultW: 96,
    body: `<path d="M20 70 Q50 20 90 40" stroke="${S.coral}" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M78 28 L96 42 L74 52" stroke="${S.coral}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  },
  {
    id: 'arrow-curved',
    tags: ['doodle', 'ui'],
    defaultW: 88,
    body: `<path d="M24 90 Q30 30 100 36" stroke="${S.orange}" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M88 22 L106 38 L84 48" stroke="${S.orange}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  },
  {
    id: 'swirl',
    tags: ['doodle'],
    defaultW: 64,
    body: `<path d="M70 30 Q90 30 90 50 Q90 78 58 78 Q30 78 30 52 Q30 34 50 34 Q64 34 64 48" stroke="${S.lavender}" stroke-width="5" stroke-linecap="round" fill="none"/>`,
  },
  {
    id: 'underline-wavy',
    tags: ['doodle', 'ui'],
    defaultW: 120,
    body: `<path d="M12 64 Q28 44 44 64 Q60 84 76 64 Q92 44 108 64 Q118 74 116 70" stroke="${S.coral}" stroke-width="6" stroke-linecap="round" fill="none"/>`,
  },
  {
    id: 'check-box',
    tags: ['ui', 'doodle'],
    defaultW: 56,
    body: `<rect x="22" y="22" width="84" height="84" rx="12" fill="${S.orange}" stroke="${S.ink}" stroke-width="4"/><path d="M40 66 L56 84 L90 44" stroke="${S.white}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  {
    id: 'check-soft',
    tags: ['ui', 'doodle'],
    defaultW: 52,
    body: `<circle cx="64" cy="64" r="44" fill="${S.lime}" stroke="${S.ink}" stroke-width="4"/><path d="M40 66 L56 84 L90 44" stroke="${S.ink}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  // —— flower ——
  {
    id: 'flower-pink',
    tags: ['flower'],
    defaultW: 88,
    body: `<circle cx="64" cy="40" r="18" fill="${S.pink}" stroke="${S.ink}" stroke-width="3"/><circle cx="44" cy="58" r="18" fill="${S.pink}" stroke="${S.ink}" stroke-width="3"/><circle cx="84" cy="58" r="18" fill="${S.pink}" stroke="${S.ink}" stroke-width="3"/><circle cx="52" cy="82" r="18" fill="${S.pink}" stroke="${S.ink}" stroke-width="3"/><circle cx="76" cy="82" r="18" fill="${S.pink}" stroke="${S.ink}" stroke-width="3"/><circle cx="64" cy="64" r="14" fill="${S.yellow}" stroke="${S.ink}" stroke-width="3"/><path d="M64 96 L64 118" stroke="${S.lime}" stroke-width="5" stroke-linecap="round"/><path d="M64 108 Q48 100 44 112" stroke="${S.lime}" stroke-width="4" fill="none"/>`,
  },
  {
    id: 'flower-tulip',
    tags: ['flower'],
    defaultW: 72,
    body: `<path d="M64 118 L64 70" stroke="${S.lime}" stroke-width="5" stroke-linecap="round"/><path d="M64 90 Q40 78 36 96" stroke="${S.lime}" stroke-width="4" fill="none"/><path d="M48 70 Q40 40 64 28 Q88 40 80 70 Q72 58 64 70 Q56 58 48 70 Z" fill="${S.pink}" stroke="${S.ink}" stroke-width="3.5" stroke-linejoin="round"/>`,
  },
  {
    id: 'leaf-pair',
    tags: ['flower', 'doodle'],
    defaultW: 72,
    body: `<path d="M30 90 Q50 40 90 30 Q70 70 40 98 Z" fill="${S.lime}" stroke="${S.ink}" stroke-width="3.5"/><path d="M70 100 Q90 60 110 50 Q100 90 78 110 Z" fill="${S.mint}" stroke="${S.ink}" stroke-width="3.5"/><path d="M40 80 Q55 60 72 48" stroke="${S.ink}" stroke-width="2" opacity="0.4"/>`,
  },
  {
    id: 'flower-daisy',
    tags: ['flower'],
    defaultW: 80,
    body: `<g stroke="${S.ink}" stroke-width="3">${[0, 45, 90, 135, 180, 225, 270, 315]
      .map((a) => {
        const r = (a * Math.PI) / 180;
        const x = 64 + Math.cos(r) * 28;
        const y = 64 + Math.sin(r) * 28;
        return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="14" ry="20" fill="${S.cream}" transform="rotate(${a} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
      })
      .join('')}</g><circle cx="64" cy="64" r="16" fill="${S.yellow}" stroke="${S.ink}" stroke-width="3"/>`,
  },
  {
    id: 'bloom-cluster',
    tags: ['flower'],
    defaultW: 100,
    body: `<circle cx="40" cy="50" r="16" fill="${S.pink}" stroke="${S.ink}" stroke-width="3"/><circle cx="62" cy="38" r="14" fill="${S.white}" stroke="${S.ink}" stroke-width="3"/><circle cx="78" cy="56" r="15" fill="${S.pink}" stroke="${S.ink}" stroke-width="3"/><circle cx="52" cy="68" r="12" fill="${S.lavender}" stroke="${S.ink}" stroke-width="3"/><circle cx="40" cy="50" r="6" fill="${S.yellow}"/><circle cx="62" cy="38" r="5" fill="${S.yellow}"/><path d="M50 80 L46 110 M62 78 L70 112 M74 76 L88 108" stroke="${S.lime}" stroke-width="4" stroke-linecap="round"/>`,
  },
  // —— animal ——
  {
    id: 'bunny',
    tags: ['animal'],
    defaultW: 100,
    body: `<ellipse cx="48" cy="28" rx="12" ry="28" fill="${S.lavender}" stroke="${S.ink}" stroke-width="3"/><ellipse cx="80" cy="28" rx="12" ry="28" fill="${S.lavender}" stroke="${S.ink}" stroke-width="3"/><ellipse cx="48" cy="28" rx="6" ry="16" fill="${S.pink}"/><ellipse cx="80" cy="28" rx="6" ry="16" fill="${S.pink}"/><circle cx="64" cy="72" r="36" fill="${S.lavender}" stroke="${S.ink}" stroke-width="3.5"/><circle cx="52" cy="68" r="4" fill="${S.ink}"/><circle cx="76" cy="68" r="4" fill="${S.ink}"/><ellipse cx="64" cy="82" rx="8" ry="5" fill="${S.pink}"/><path d="M56 90 Q64 96 72 90" stroke="${S.ink}" stroke-width="2.5" fill="none"/><circle cx="36" cy="78" r="8" fill="${S.lavender}" stroke="${S.ink}" stroke-width="2.5"/><circle cx="92" cy="78" r="8" fill="${S.lavender}" stroke="${S.ink}" stroke-width="2.5"/>`,
  },
  {
    id: 'cat-face',
    tags: ['animal'],
    defaultW: 88,
    body: `<circle cx="64" cy="70" r="38" fill="${S.peach}" stroke="${S.ink}" stroke-width="3.5"/><path d="M32 48 L28 18 L52 40 Z" fill="${S.peach}" stroke="${S.ink}" stroke-width="3"/><path d="M96 48 L100 18 L76 40 Z" fill="${S.peach}" stroke="${S.ink}" stroke-width="3"/><circle cx="50" cy="66" r="4" fill="${S.ink}"/><circle cx="78" cy="66" r="4" fill="${S.ink}"/><path d="M60 78 L64 84 L68 78" fill="${S.pink}" stroke="${S.ink}" stroke-width="2"/><path d="M44 80 L28 76 M44 84 L28 86 M84 80 L100 76 M84 84 L100 86" stroke="${S.ink}" stroke-width="2"/>`,
  },
  {
    id: 'corgi',
    tags: ['animal'],
    defaultW: 100,
    body: `<ellipse cx="64" cy="78" rx="42" ry="30" fill="${S.peach}" stroke="${S.ink}" stroke-width="3.5"/><circle cx="64" cy="48" r="28" fill="${S.peach}" stroke="${S.ink}" stroke-width="3.5"/><ellipse cx="40" cy="30" rx="10" ry="16" fill="${S.peach}" stroke="${S.ink}" stroke-width="3"/><ellipse cx="88" cy="30" rx="10" ry="16" fill="${S.peach}" stroke="${S.ink}" stroke-width="3"/><ellipse cx="64" cy="54" rx="12" ry="9" fill="${S.cream}" stroke="${S.ink}" stroke-width="2"/><circle cx="54" cy="44" r="3.5" fill="${S.ink}"/><circle cx="74" cy="44" r="3.5" fill="${S.ink}"/><ellipse cx="64" cy="52" rx="5" ry="3.5" fill="${S.ink}"/><path d="M36 95 L30 112 M50 100 L48 116 M78 100 L80 116 M92 95 L98 112" stroke="${S.ink}" stroke-width="4" stroke-linecap="round"/>`,
  },
  {
    id: 'bird',
    tags: ['animal'],
    defaultW: 80,
    body: `<ellipse cx="64" cy="70" rx="36" ry="28" fill="${S.sky}" stroke="${S.ink}" stroke-width="3.5"/><circle cx="88" cy="52" r="18" fill="${S.sky}" stroke="${S.ink}" stroke-width="3"/><circle cx="94" cy="50" r="3" fill="${S.ink}"/><path d="M104 54 L118 58 L104 64 Z" fill="${S.orange}" stroke="${S.ink}" stroke-width="2"/><path d="M40 70 Q20 50 28 40" stroke="${S.ink}" stroke-width="3" fill="none"/><ellipse cx="50" cy="78" rx="14" ry="8" fill="${S.white}" opacity="0.5"/>`,
  },
  // —— object ——
  {
    id: 'clock',
    tags: ['object'],
    defaultW: 100,
    body: `<circle cx="64" cy="70" r="40" fill="${S.yellow}" stroke="${S.ink}" stroke-width="4"/><circle cx="64" cy="70" r="32" fill="${S.cream}" stroke="${S.ink}" stroke-width="3"/><circle cx="44" cy="28" r="10" fill="${S.yellow}" stroke="${S.ink}" stroke-width="3"/><circle cx="84" cy="28" r="10" fill="${S.yellow}" stroke="${S.ink}" stroke-width="3"/><path d="M64 70 L64 48 M64 70 L82 78" stroke="${S.ink}" stroke-width="4" stroke-linecap="round"/><circle cx="64" cy="70" r="4" fill="${S.ink}"/><text x="64" y="48" text-anchor="middle" font-size="10" fill="${S.ink}" font-family="sans-serif">12</text><path d="M40 108 L36 118 M88 108 L92 118" stroke="${S.ink}" stroke-width="4" stroke-linecap="round"/>`,
  },
  {
    id: 'megaphone',
    tags: ['object'],
    defaultW: 96,
    body: `<path d="M30 50 L70 36 L70 92 L30 78 Z" fill="${S.lime}" stroke="${S.ink}" stroke-width="3.5" stroke-linejoin="round"/><ellipse cx="70" cy="64" rx="18" ry="30" fill="${S.yellow}" stroke="${S.ink}" stroke-width="3.5"/><rect x="18" y="54" width="16" height="20" rx="4" fill="${S.coral}" stroke="${S.ink}" stroke-width="3"/><path d="M92 40 L108 28 M96 64 L116 64 M92 88 L108 100" stroke="${S.ink}" stroke-width="3.5" stroke-linecap="round"/>`,
  },
  {
    id: 'book-open',
    tags: ['object'],
    defaultW: 96,
    body: `<path d="M20 36 Q64 28 64 36 L64 100 Q40 92 20 100 Z" fill="${S.cream}" stroke="${S.ink}" stroke-width="3.5"/><path d="M108 36 Q64 28 64 36 L64 100 Q88 92 108 100 Z" fill="${S.cream}" stroke="${S.ink}" stroke-width="3.5"/><path d="M36 52 H52 M36 64 H52 M36 76 H48 M76 52 H92 M76 64 H92 M76 76 H88" stroke="${S.ink}" stroke-width="2" opacity="0.35"/>`,
  },
  {
    id: 'magnifier',
    tags: ['object'],
    defaultW: 88,
    body: `<circle cx="52" cy="52" r="30" fill="${S.yellow}" fill-opacity="0.55" stroke="${S.ink}" stroke-width="4"/><circle cx="52" cy="52" r="20" fill="none" stroke="${S.ink}" stroke-width="2" opacity="0.3"/><path d="M74 74 L104 104" stroke="${S.orange}" stroke-width="10" stroke-linecap="round"/><path d="M74 74 L104 104" stroke="${S.ink}" stroke-width="4" stroke-linecap="round"/>`,
  },
  {
    id: 'lightbulb',
    tags: ['object'],
    defaultW: 72,
    body: `<path d="M64 20 C40 20 28 44 36 66 C40 76 48 80 48 92 L80 92 C80 80 88 76 92 66 C100 44 88 20 64 20 Z" fill="${S.yellow}" stroke="${S.ink}" stroke-width="3.5"/><rect x="48" y="92" width="32" height="14" rx="3" fill="${S.cream}" stroke="${S.ink}" stroke-width="3"/><path d="M52 106 H76" stroke="${S.ink}" stroke-width="3"/><path d="M64 36 L64 52 M50 44 L58 52 M78 44 L70 52" stroke="${S.orange}" stroke-width="3" stroke-linecap="round"/>`,
  },
  {
    id: 'paperclip',
    tags: ['object', 'ui'],
    defaultW: 48,
    body: `<path d="M50 30 C50 18 78 18 78 36 L78 88 C78 108 48 108 48 86 L48 42 C48 30 68 30 68 44 L68 80" stroke="${S.sky}" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M50 30 C50 18 78 18 78 36 L78 88 C78 108 48 108 48 86 L48 42 C48 30 68 30 68 44 L68 80" stroke="${S.ink}" stroke-width="3.5" stroke-linecap="round" fill="none"/>`,
  },
  {
    id: 'pencil',
    tags: ['object'],
    defaultW: 80,
    body: `<path d="M36 100 L28 108 L40 104 Z" fill="${S.peach}" stroke="${S.ink}" stroke-width="2"/><path d="M40 104 L96 40 L108 52 L52 116 Z" fill="${S.yellow}" stroke="${S.ink}" stroke-width="3"/><path d="M96 40 L108 28 L120 40 L108 52 Z" fill="${S.pink}" stroke="${S.ink}" stroke-width="3"/><path d="M52 90 L64 78" stroke="${S.ink}" stroke-width="2" opacity="0.3"/>`,
  },
  {
    id: 'coffee',
    tags: ['object'],
    defaultW: 80,
    body: `<path d="M36 48 H84 V96 C84 108 44 108 44 96 Z" fill="${S.cream}" stroke="${S.ink}" stroke-width="3.5"/><path d="M84 56 H100 C108 56 108 84 96 84 H84" fill="none" stroke="${S.ink}" stroke-width="3.5"/><ellipse cx="60" cy="48" rx="24" ry="8" fill="${S.peach}" stroke="${S.ink}" stroke-width="3"/><path d="M50 28 Q48 40 54 44 M66 24 Q68 38 62 44" stroke="${S.ink}" stroke-width="2.5" stroke-linecap="round" fill="none"/>`,
  },
  {
    id: 'camera',
    tags: ['object'],
    defaultW: 88,
    body: `<rect x="20" y="40" width="88" height="60" rx="12" fill="${S.lavender}" stroke="${S.ink}" stroke-width="3.5"/><rect x="44" y="28" width="40" height="16" rx="4" fill="${S.lavender}" stroke="${S.ink}" stroke-width="3"/><circle cx="64" cy="70" r="18" fill="${S.cream}" stroke="${S.ink}" stroke-width="3.5"/><circle cx="64" cy="70" r="10" fill="${S.sky}" stroke="${S.ink}" stroke-width="2"/><circle cx="96" cy="52" r="5" fill="${S.coral}"/>`,
  },
  {
    id: 'gift',
    tags: ['object'],
    defaultW: 80,
    body: `<rect x="28" y="52" width="72" height="56" rx="6" fill="${S.pink}" stroke="${S.ink}" stroke-width="3.5"/><rect x="24" y="40" width="80" height="20" rx="4" fill="${S.coral}" stroke="${S.ink}" stroke-width="3"/><path d="M64 40 V108 M24 62 H104" stroke="${S.yellow}" stroke-width="6"/><path d="M64 40 Q48 20 36 36 Q52 40 64 40 Q80 20 92 36 Q76 40 64 40" fill="${S.yellow}" stroke="${S.ink}" stroke-width="2.5"/>`,
  },
  {
    id: 'music-note',
    tags: ['object', 'doodle'],
    defaultW: 64,
    body: `<ellipse cx="40" cy="92" rx="16" ry="12" fill="${S.coral}" stroke="${S.ink}" stroke-width="3"/><ellipse cx="84" cy="80" rx="16" ry="12" fill="${S.coral}" stroke="${S.ink}" stroke-width="3"/><path d="M56 92 V36 L100 24 V80" stroke="${S.ink}" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M56 36 L100 24" stroke="${S.ink}" stroke-width="8"/>`,
  },
  {
    id: 'speech-bubble',
    tags: ['ui', 'object'],
    defaultW: 96,
    body: `<path d="M20 28 H108 Q116 28 116 36 V76 Q116 84 108 84 H56 L36 108 L40 84 H20 Q12 84 12 76 V36 Q12 28 20 28 Z" fill="${S.cream}" stroke="${S.ink}" stroke-width="3.5"/><circle cx="48" cy="56" r="5" fill="${S.ink}"/><circle cx="64" cy="56" r="5" fill="${S.ink}"/><circle cx="80" cy="56" r="5" fill="${S.ink}"/>`,
  },
  {
    id: 'tag-sale',
    tags: ['ui', 'object'],
    defaultW: 80,
    body: `<path d="M24 44 L64 20 L104 44 L104 100 L24 100 Z" fill="${S.coral}" stroke="${S.ink}" stroke-width="3.5" stroke-linejoin="round"/><circle cx="64" cy="44" r="8" fill="${S.yellow}" stroke="${S.ink}" stroke-width="2.5"/><text x="64" y="78" text-anchor="middle" font-size="22" font-weight="700" fill="${S.cream}" font-family="sans-serif" stroke="${S.ink}" stroke-width="1">HOT</text>`,
  },
  {
    id: 'pin',
    tags: ['ui', 'object'],
    defaultW: 48,
    body: `<circle cx="64" cy="40" r="22" fill="${S.coral}" stroke="${S.ink}" stroke-width="3.5"/><circle cx="64" cy="40" r="8" fill="${S.cream}" stroke="${S.ink}" stroke-width="2"/><path d="M64 62 L64 112" stroke="${S.ink}" stroke-width="5" stroke-linecap="round"/>`,
  },
  {
    id: 'tape-washi',
    tags: ['ui', 'doodle'],
    defaultW: 110,
    body: `<rect x="10" y="48" width="108" height="32" rx="3" fill="${S.mint}" stroke="${S.ink}" stroke-width="3" transform="rotate(-8 64 64)" opacity="0.9"/><path d="M20 56 L100 48 M24 72 L104 64" stroke="${S.white}" stroke-width="2" opacity="0.5" transform="rotate(-8 64 64)"/>`,
  },
  {
    id: 'badge-new',
    tags: ['ui'],
    defaultW: 72,
    body: `<circle cx="64" cy="64" r="44" fill="${S.lavender}" stroke="${S.ink}" stroke-width="4"/><text x="64" y="74" text-anchor="middle" font-size="26" font-weight="800" fill="${S.cream}" font-family="sans-serif">NEW</text>`,
  },
  {
    id: 'moon',
    tags: ['doodle', 'object'],
    defaultW: 72,
    body: `<path d="M72 20 C40 24 28 60 48 90 C70 110 100 96 104 70 C80 80 60 60 72 20 Z" fill="${S.yellow}" stroke="${S.ink}" stroke-width="3.5"/>`,
  },
  {
    id: 'sun',
    tags: ['doodle', 'object'],
    defaultW: 80,
    body: `<circle cx="64" cy="64" r="22" fill="${S.yellow}" stroke="${S.ink}" stroke-width="3.5"/>${[0, 45, 90, 135, 180, 225, 270, 315]
      .map((a) => {
        const r = (a * Math.PI) / 180;
        const x1 = 64 + Math.cos(r) * 32;
        const y1 = 64 + Math.sin(r) * 32;
        const x2 = 64 + Math.cos(r) * 48;
        const y2 = 64 + Math.sin(r) * 48;
        return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${S.orange}" stroke-width="4" stroke-linecap="round"/>`;
      })
      .join('')}`,
  },
  {
    id: 'cloud',
    tags: ['doodle'],
    defaultW: 100,
    body: `<ellipse cx="48" cy="70" rx="28" ry="22" fill="${S.cream}" stroke="${S.ink}" stroke-width="3"/><ellipse cx="78" cy="66" rx="30" ry="24" fill="${S.cream}" stroke="${S.ink}" stroke-width="3"/><ellipse cx="64" cy="52" rx="22" ry="18" fill="${S.cream}" stroke="${S.ink}" stroke-width="3"/>`,
  },
  {
    id: 'rainbow',
    tags: ['doodle'],
    defaultW: 100,
    body: `<path d="M20 90 Q64 20 108 90" stroke="${S.coral}" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M28 90 Q64 32 100 90" stroke="${S.peach}" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M36 90 Q64 44 92 90" stroke="${S.yellow}" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M44 90 Q64 56 84 90" stroke="${S.mint}" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M52 90 Q64 68 76 90" stroke="${S.sky}" stroke-width="8" fill="none" stroke-linecap="round"/>`,
  },
  {
    id: 'exclaim',
    tags: ['ui', 'doodle'],
    defaultW: 48,
    body: `<rect x="52" y="16" width="24" height="70" rx="12" fill="${S.coral}" stroke="${S.ink}" stroke-width="3.5"/><circle cx="64" cy="106" r="12" fill="${S.coral}" stroke="${S.ink}" stroke-width="3.5"/>`,
  },
  {
    id: 'question',
    tags: ['ui', 'doodle'],
    defaultW: 56,
    body: `<path d="M40 40 Q40 20 64 20 Q88 20 88 42 Q88 58 64 64 L64 78" stroke="${S.sky}" stroke-width="10" stroke-linecap="round" fill="none"/><path d="M40 40 Q40 20 64 20 Q88 20 88 42 Q88 58 64 64 L64 78" stroke="${S.ink}" stroke-width="4" stroke-linecap="round" fill="none"/><circle cx="64" cy="100" r="8" fill="${S.sky}" stroke="${S.ink}" stroke-width="3"/>`,
  },
  {
    id: 'fire',
    tags: ['doodle', 'object'],
    defaultW: 72,
    body: `<path d="M64 110 C30 100 28 60 50 40 C48 60 60 62 58 30 C90 48 100 70 90 96 C110 70 96 50 100 36 C120 70 100 110 64 110 Z" fill="${S.coral}" stroke="${S.ink}" stroke-width="3.5"/><path d="M64 110 C48 100 50 80 62 70 C60 82 72 84 68 64 C84 78 86 96 64 110 Z" fill="${S.yellow}" stroke="${S.ink}" stroke-width="2.5"/>`,
  },
  {
    id: 'diamond',
    tags: ['doodle', 'ui'],
    defaultW: 48,
    body: `<path d="M64 20 L100 64 L64 108 L28 64 Z" fill="${S.sky}" stroke="${S.ink}" stroke-width="3.5" stroke-linejoin="round"/><path d="M44 52 H84 L64 20 Z" fill="${S.cream}" opacity="0.5"/>`,
  },
  {
    id: 'smile',
    tags: ['doodle', 'animal'],
    defaultW: 72,
    body: `<circle cx="64" cy="64" r="44" fill="${S.yellow}" stroke="${S.ink}" stroke-width="4"/><circle cx="48" cy="54" r="5" fill="${S.ink}"/><circle cx="80" cy="54" r="5" fill="${S.ink}"/><path d="M42 76 Q64 98 86 76" stroke="${S.ink}" stroke-width="4" stroke-linecap="round" fill="none"/>`,
  },
  {
    id: 'crown',
    tags: ['object', 'doodle'],
    defaultW: 88,
    body: `<path d="M24 88 L20 40 L44 60 L64 28 L84 60 L108 40 L104 88 Z" fill="${S.yellow}" stroke="${S.ink}" stroke-width="3.5" stroke-linejoin="round"/><circle cx="20" cy="36" r="6" fill="${S.coral}" stroke="${S.ink}" stroke-width="2"/><circle cx="64" cy="24" r="6" fill="${S.pink}" stroke="${S.ink}" stroke-width="2"/><circle cx="108" cy="36" r="6" fill="${S.sky}" stroke="${S.ink}" stroke-width="2"/>`,
  },
];

async function main() {
  await mkdir(OUT, { recursive: true });
  const catalog = [];
  for (const s of STICKERS) {
    const file = `${s.id}.svg`;
    await writeFile(join(OUT, file), svg(s.body), 'utf8');
    catalog.push({
      id: s.id,
      file,
      tags: s.tags,
      defaultW: s.defaultW,
    });
    console.log(`+ ${file}`);
  }
  await writeFile(
    join(OUT, 'CREDITS.md'),
    `# Sticker pack credits

Original hand-drawn style doodle SVGs generated for PicLab Studio (PixelWorks).

- License: free to use within this product and derivatives of this repository
- Style: thick-stroke journal / Xiaohongshu atmosphere stickers
- Count: ${catalog.length}
- Regenerated by: \`node scripts/gen-stickers.mjs\`

Inspired by the visual language of open doodle icon packs (MIT), but assets here are original geometry — not copied from third-party SVG paths.
`,
    'utf8',
  );
  // Emit TS catalog snippet for convenience (actual source is stickerCatalog.ts)
  console.log(`\nDone: ${catalog.length} stickers → public/stickers/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
