/**
 * Download curated HD stock photos into public/template-assets.
 * Sources: Unsplash License (https://unsplash.com/license) — free commercial use.
 *
 * Run: node scripts/fetch-template-assets.mjs
 */
import { mkdir, writeFile, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'public', 'template-assets');

/**
 * @typedef {{ w: number, h: number }} StockCrop
 * @typedef {{ id: string, file: string, photo: string, category: string, name: string, credit: string, crop?: StockCrop }} StockEntry
 * @type {StockEntry[]}
 */
export const STOCK = [
  {
    id: 'hills',
    file: 'hills.jpg',
    photo: '1501785888041-af3ef285b470',
    category: 'landscape',
    name: '山野远峰',
    credit: 'Luca Bravo',
    // Portrait crop for 9:16 poster covers — landscape source looked soft when upscaled.
    crop: { w: 2160, h: 3240 },
  },
  {
    id: 'alpine',
    file: 'alpine.jpg',
    photo: '1464822759023-fed622ff2c3b',
    category: 'landscape',
    name: '雪山湖泊',
    credit: 'Kalen Emsley',
  },
  {
    id: 'forest',
    file: 'forest.jpg',
    photo: '1441974231531-c6227db76b6e',
    category: 'landscape',
    name: '林间光斑',
    credit: 'Casey Horner',
  },
  {
    id: 'ocean',
    file: 'ocean.jpg',
    photo: '1507525428034-b723cf961d3e',
    category: 'landscape',
    name: '海岸浪线',
    credit: 'Sean Oulashin',
  },
  {
    id: 'desert',
    file: 'desert.jpg',
    photo: '1509316785289-025f5b846b35',
    category: 'landscape',
    name: '沙丘曲线',
    credit: 'Neom',
  },
  {
    id: 'mist',
    file: 'mist.jpg',
    photo: '1470071459604-3b5ec3a7fe05',
    category: 'landscape',
    name: '雾气山脊',
    credit: 'v2osk',
  },
  {
    id: 'snow',
    file: 'snow.jpg',
    photo: '1483921020237-2ff51e8e4b22',
    category: 'landscape',
    name: '雪原松林',
    credit: 'Aaron Burden',
  },
  {
    id: 'city',
    file: 'city.jpg',
    photo: '1519501025264-65ba15a82390',
    category: 'architecture',
    name: '都市夜景',
    credit: 'Pedro Lastra',
  },
  {
    id: 'architecture',
    file: 'architecture.jpg',
    photo: '1487958449943-2429e8be8625',
    category: 'architecture',
    name: '现代建筑',
    credit: 'Lance Anderson',
  },
  {
    id: 'concrete',
    file: 'concrete.jpg',
    photo: '1497366216548-37526070297c',
    category: 'architecture',
    name: '混凝土空间',
    credit: 'Nastuh Abootalebi',
  },
  {
    id: 'street',
    file: 'street.jpg',
    photo: '1477959858617-67f85cf4f1df',
    category: 'architecture',
    name: '城市街景',
    credit: 'Pedro Lastra',
  },
  {
    id: 'bridge',
    file: 'bridge.jpg',
    photo: '1476514525535-07fb3b4ae5f1',
    category: 'travel',
    name: '湖面倒影',
    credit: 'Luca Bravo',
  },
  {
    id: 'neon',
    file: 'neon.jpg',
    photo: '1540959733332-eab4deabeeaf',
    category: 'travel',
    name: '霓虹街巷',
    credit: 'Jezael Melgoza',
  },
  {
    id: 'portrait',
    file: 'portrait.jpg',
    photo: '1534528741775-53994a69daeb',
    category: 'people',
    name: '人像光影',
    credit: 'Ayo Ogunseinde',
  },
  {
    id: 'still',
    file: 'still.jpg',
    photo: '1495474472287-4d71bcdd2085',
    category: 'still-life',
    name: '咖啡静物',
    credit: 'Nadya Spetnitskaya',
  },
  {
    id: 'food',
    file: 'food.jpg',
    photo: '1546069901-ba9599a7e63c',
    category: 'still-life',
    name: '餐桌色彩',
    credit: 'Anna Pelzer',
  },
  {
    id: 'market',
    file: 'market.jpg',
    photo: '1488459716781-31db52582fe9',
    category: 'still-life',
    name: '市集蔬果',
    credit: 'Christine Siracusa',
  },
  {
    id: 'flowers',
    file: 'flowers.jpg',
    photo: '1490750967868-88aa4486c946',
    category: 'still-life',
    name: '花卉特写',
    credit: 'Annie Spratt',
  },
  {
    id: 'fabric',
    file: 'fabric.jpg',
    photo: '1558618666-fcd25c85cd64',
    category: 'texture',
    name: '织物纹理',
    credit: 'Five F Cat',
  },
  {
    id: 'paper',
    file: 'paper.jpg',
    photo: '1516414447565-b14be0adf13e',
    category: 'texture',
    name: '纸页书卷',
    credit: 'Thought Catalog',
  },
  {
    id: 'stone',
    file: 'stone.jpg',
    photo: '1550684848-fac1c5b4e853',
    category: 'texture',
    name: '石材肌理',
    credit: 'Pawel Czerwinski',
  },
  {
    id: 'product',
    file: 'product.jpg',
    photo: '1505740420928-5e560c06d30e',
    category: 'product',
    name: '极简产品',
    credit: 'C D-X',
  },
];

function urlFor(photo, crop) {
  if (crop?.w && crop?.h) {
    return `https://images.unsplash.com/photo-${photo}?auto=format&fit=crop&w=${crop.w}&h=${crop.h}&q=88&fm=jpg`;
  }
  return `https://images.unsplash.com/photo-${photo}?auto=format&fit=max&w=2000&q=85&fm=jpg`;
}

async function downloadOne(entry) {
  const dest = join(OUT, entry.file);
  const url = urlFor(entry.photo, entry.crop);
  process.stdout.write(`↓ ${entry.file} … `);
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'PicLabStudio/0.1 (template asset curation; offline bundle)',
      Accept: 'image/jpeg,image/*;q=0.8,*/*;q=0.5',
    },
  });
  if (!res.ok) throw new Error(`${entry.file}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength < 80_000) {
    throw new Error(`${entry.file}: suspiciously small (${buf.byteLength} bytes)`);
  }
  await writeFile(dest, buf);
  const kb = Math.round(buf.byteLength / 1024);
  console.log(`${kb} KB · ${entry.name}`);
  return { ...entry, bytes: buf.byteLength };
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const results = [];
  for (const entry of STOCK) {
    try {
      results.push(await downloadOne(entry));
    } catch (e) {
      console.error(`FAIL ${entry.file}:`, e.message ?? e);
      process.exitCode = 1;
    }
  }

  const credits = [
    '# Template asset credits',
    '',
    'Bundled HD photos for PicLab Studio signature templates + local image library.',
    '',
    '**License:** [Unsplash License](https://unsplash.com/license) — free to use, including commercial.',
    'Photographers retain copyright; attribution appreciated (listed below).',
    '',
    '**Sources for more free commercial images:**',
    '- [Unsplash](https://unsplash.com/) — Unsplash License',
    '- [Pexels](https://www.pexels.com/license/) — free commercial use',
    '- [Pixabay](https://pixabay.com/service/license-summary/) — free commercial use',
    '- [Openverse](https://openverse.org/) — CC-filtered search (wired in Studio stock panel)',
    '',
    '| File | Id | Category | Photo | Photographer |',
    '|------|-----|----------|-------|--------------|',
    ...STOCK.map(
      (s) =>
        `| ${s.file} | \`${s.id}\` | ${s.category} | [photo-${s.photo}](https://unsplash.com/photos/${s.photo.split('-').pop ? s.photo : s.photo}) | ${s.credit} |`,
    ),
    '',
    `Fetched: ${new Date().toISOString().slice(0, 10)} · target width ≈ 2000px`,
    '',
  ];

  // Fix photo links — Unsplash URLs use full photo slug; keep photo- id in images CDN.
  const creditsFixed = [
    '# Template asset credits',
    '',
    'Bundled HD photos for PicLab Studio signature templates + local image library.',
    '',
    '**License:** [Unsplash License](https://unsplash.com/license) — free to use, including commercial.',
    'Photographers retain copyright; attribution appreciated (listed below).',
    '',
    '**Sources for more free commercial images:**',
    '- [Unsplash](https://unsplash.com/) — Unsplash License',
    '- [Pexels](https://www.pexels.com/license/) — free commercial use',
    '- [Pixabay](https://pixabay.com/service/license-summary/) — free commercial use',
    '- [Openverse](https://openverse.org/) — CC-filtered search (wired in Studio stock panel)',
    '',
    '| File | Id | Category | CDN photo id | Photographer |',
    '|------|-----|----------|--------------|--------------|',
    ...STOCK.map(
      (s) =>
        `| ${s.file} | \`${s.id}\` | ${s.category} | \`${s.photo}\` | ${s.credit} |`,
    ),
    '',
    `Fetched: ${new Date().toISOString().slice(0, 10)} · default width ≈ 2000px · portrait crops where noted · count=${STOCK.length}`,
    '',
    'Note: `hills.jpg` is a 2160×3240 portrait crop for vertical poster covers.',
    '',
  ].join('\n');

  await writeFile(join(OUT, 'CREDITS.md'), creditsFixed, 'utf8');

  const ok = results.length;
  const totalKb = Math.round(results.reduce((a, r) => a + r.bytes, 0) / 1024);
  console.log(`\nDone: ${ok}/${STOCK.length} files · ~${totalKb} KB total`);
  console.log('Remember: keep src/studio/templates/stockCatalog.ts in sync with STOCK above.');
  void credits;
  void stat;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
