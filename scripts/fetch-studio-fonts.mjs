/**
 * Download curated OFL fonts into public/fonts (jsDelivr mirror of google/fonts).
 * Run: npm run fonts:fetch
 *
 * Note: LXGW WenKai woff2 may need manual sync from @fontsource/lxgw-wenkai
 * if GitHub releases are unreachable from your network.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'public', 'fonts');

/** @type {{ file: string, url: string, family: string, note: string }[]} */
const FONTS = [
  {
    file: 'zh/ZCOOLKuaiLe-Regular.ttf',
    url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/zcoolkuaile/ZCOOLKuaiLe-Regular.ttf',
    family: 'ZCOOL KuaiLe',
    note: '站酷快乐体',
  },
  {
    file: 'zh/ZCOOLXiaoWei-Regular.ttf',
    url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/zcoolxiaowei/ZCOOLXiaoWei-Regular.ttf',
    family: 'ZCOOL XiaoWei',
    note: '站酷小薇',
  },
  {
    file: 'zh/ZCOOLQingKeHuangYou-Regular.ttf',
    url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/zcoolqingkehuangyou/ZCOOLQingKeHuangYou-Regular.ttf',
    family: 'ZCOOL QingKe HuangYou',
    note: '站酷庆科黄油体',
  },
  {
    file: 'zh/MaShanZheng-Regular.ttf',
    url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/mashanzheng/MaShanZheng-Regular.ttf',
    family: 'Ma Shan Zheng',
    note: '马善政楷书',
  },
  {
    file: 'zh/LongCang-Regular.ttf',
    url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/longcang/LongCang-Regular.ttf',
    family: 'Long Cang',
    note: '龙藏体',
  },
  {
    file: 'zh/ZhiMangXing-Regular.ttf',
    url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/zhimangxing/ZhiMangXing-Regular.ttf',
    family: 'Zhi Mang Xing',
    note: '志莽行书',
  },
  {
    file: 'zh/LiuJianMaoCao-Regular.ttf',
    url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/liujianmaocao/LiuJianMaoCao-Regular.ttf',
    family: 'Liu Jian Mao Cao',
    note: '刘建毛草',
  },
  {
    file: 'latin/BebasNeue-Regular.ttf',
    url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/bebasneue/BebasNeue-Regular.ttf',
    family: 'Bebas Neue',
    note: 'narrow display (convert to woff2 preferred)',
  },
  {
    file: 'latin/Anton-Regular.ttf',
    url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/anton/Anton-Regular.ttf',
    family: 'Anton',
    note: 'impact display',
  },
  {
    file: 'latin/ArchivoBlack-Regular.ttf',
    url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/archivoblack/ArchivoBlack-Regular.ttf',
    family: 'Archivo Black',
    note: 'ultra bold',
  },
  {
    file: 'latin/DMSerifDisplay-Regular.ttf',
    url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/dmserifdisplay/DMSerifDisplay-Regular.ttf',
    family: 'DM Serif Display',
    note: 'editorial serif',
  },
  {
    file: 'latin/InstrumentSerif-Regular.ttf',
    url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/instrumentserif/InstrumentSerif-Regular.ttf',
    family: 'Instrument Serif',
    note: 'contemporary serif',
  },
];

async function download(file, url) {
  const dest = join(OUT, file);
  await mkdir(dirname(dest), { recursive: true });
  process.stdout.write(`↓ ${file} … `);
  const res = await fetch(url, {
    headers: { 'User-Agent': 'PicLabStudio/0.1 (OFL font curation)' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength < 8_000) throw new Error(`too small (${buf.byteLength})`);
  const head = buf.subarray(0, 15).toString('utf8');
  if (head.includes('<!DOCTYPE') || head.includes('<html')) {
    throw new Error('got HTML instead of font');
  }
  await writeFile(dest, buf);
  console.log(`${Math.round(buf.byteLength / 1024)} KB`);
  return buf.byteLength;
}

async function main() {
  await mkdir(join(OUT, 'zh'), { recursive: true });
  await mkdir(join(OUT, 'latin'), { recursive: true });
  let total = 0;
  let ok = 0;
  for (const f of FONTS) {
    try {
      total += await download(f.file, f.url);
      ok += 1;
    } catch (e) {
      console.error(`FAIL ${f.file}:`, e.message ?? e);
      process.exitCode = 1;
    }
  }
  console.log(`\nDone: ${ok}/${FONTS.length} · ~${Math.round(total / 1024)} KB`);
  console.log('Latin woff2 + LXGW: keep existing public/fonts copies if present.');
  console.log('See public/fonts/CREDITS.md');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
