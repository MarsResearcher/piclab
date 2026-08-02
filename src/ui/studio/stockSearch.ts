/** Shared stock search helpers + session cache (survives panel remount). */

import { STOCK_CATALOG, type StockItem } from '../../studio/templates/stockCatalog';

export type StockPhoto = {
  id: string;
  title: string;
  creator: string;
  thumb: string;
  full: string;
  source: 'openverse' | 'pexels' | 'local';
  pageUrl?: string;
};

export type StockSourceId = 'openverse' | 'pexels';

export type StockChip = {
  label: string;
  /** Query shown in the input (often Chinese). */
  query: string;
  /** English query sent to remote APIs. */
  apiQuery: string;
};

type CacheEntry = {
  source: StockSourceId;
  query: string;
  photos: StockPhoto[];
};

let sessionCache: CacheEntry | null = null;

export function getStockCache(): CacheEntry | null {
  return sessionCache;
}

export function setStockCache(entry: CacheEntry): void {
  sessionCache = entry;
}

/** Quick-pick chips — Chinese labels, English API queries. */
export const STOCK_CHIPS: StockChip[] = [
  { label: '自然', query: '自然', apiQuery: 'nature landscape' },
  { label: '森林', query: '森林', apiQuery: 'forest trees' },
  { label: '山野', query: '山野', apiQuery: 'mountains wilderness' },
  { label: '海岸', query: '海岸', apiQuery: 'ocean beach' },
  { label: '城市', query: '城市', apiQuery: 'city architecture' },
  { label: '建筑', query: '建筑', apiQuery: 'architecture building' },
  { label: '人物', query: '人物', apiQuery: 'portrait people' },
  { label: '静物', query: '静物', apiQuery: 'still life' },
  { label: '纹理', query: '纹理', apiQuery: 'texture abstract' },
  { label: '夜景', query: '夜景', apiQuery: 'night city lights' },
];

/** Chinese (and common aliases) → English for Openverse / Pexels. */
const QUERY_ALIASES: Record<string, string> = {
  自然: 'nature',
  风景: 'landscape',
  山水: 'mountain landscape',
  山野: 'mountains wilderness',
  森林: 'forest',
  树林: 'forest trees',
  树木: 'trees',
  湖: 'lake',
  海: 'ocean',
  海岸: 'ocean beach',
  沙滩: 'beach',
  沙漠: 'desert',
  雪: 'snow',
  雾: 'mist fog',
  城市: 'city',
  都市: 'city skyline',
  建筑: 'architecture',
  街道: 'street',
  夜景: 'night city',
  人物: 'portrait',
  人像: 'portrait',
  静物: 'still life',
  食物: 'food',
  花: 'flowers',
  纹理: 'texture',
  纸: 'paper texture',
  产品: 'product',
  霓虹: 'neon lights',
  桥: 'bridge',
  旅行: 'travel',
};

export type ResolvedStockQuery = {
  /** Trimmed user input (for UI / cache key). */
  raw: string;
  /** Query sent to remote APIs. */
  api: string;
  /** True when we mapped CJK → English. */
  translated: boolean;
};

export function resolveStockQuery(input: string): ResolvedStockQuery {
  const raw = input.trim();
  if (!raw) return { raw: '', api: 'nature', translated: false };

  const exact = QUERY_ALIASES[raw];
  if (exact) return { raw, api: exact, translated: true };

  if (/[\u4e00-\u9fff]/.test(raw)) {
    for (const [zh, en] of Object.entries(QUERY_ALIASES)) {
      if (raw.includes(zh)) return { raw, api: en, translated: true };
    }
    // Still try original; many APIs handle some CJK poorly — UI will hint.
    return { raw, api: raw, translated: false };
  }

  return { raw, api: raw, translated: false };
}

export function friendlyStockError(err: unknown): string {
  if (err instanceof DOMException && err.name === 'AbortError') {
    return '搜索已取消';
  }
  const msg = err instanceof Error ? err.message : String(err ?? '');
  const lower = msg.toLowerCase();
  if (lower.includes('failed to fetch') || lower.includes('networkerror')) {
    return '无法连接在线图库（网络受限或服务不可达）';
  }
  if (lower.includes('timeout') || lower.includes('aborted')) {
    return '搜索超时，请重试或换关键词';
  }
  if (/openverse\s*4\d\d/i.test(msg) || /pexels\s*4\d\d/i.test(msg)) {
    return '图库暂时限流，请稍后再试';
  }
  if (/openverse\s*5\d\d/i.test(msg) || /pexels\s*5\d\d/i.test(msg)) {
    return '图库服务异常，请稍后再试';
  }
  if (msg && msg.length < 80 && !/^TypeError/i.test(msg)) return msg;
  return '搜索失败，请重试';
}

function localItemToPhoto(item: StockItem): StockPhoto {
  const url = `/template-assets/${item.file}`;
  return {
    id: `local-${item.id}`,
    title: item.name,
    creator: item.credit,
    thumb: url,
    full: url,
    source: 'local',
  };
}

/** Local HD catalog — always available offline. */
export function listLocalStockPhotos(): StockPhoto[] {
  return STOCK_CATALOG.map(localItemToPhoto);
}

/** Filter local catalog by Chinese/English query tokens. */
export function filterLocalStockPhotos(query: string): StockPhoto[] {
  const resolved = resolveStockQuery(query);
  const tokens = `${resolved.raw} ${resolved.api}`
    .toLowerCase()
    .split(/[\s,，、/+]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  if (!tokens.length) return listLocalStockPhotos();

  const scored = STOCK_CATALOG.map((item) => {
    const hay = `${item.id} ${item.name} ${item.category} ${item.credit}`.toLowerCase();
    const en = categoryEnglish(item.category);
    const blob = `${hay} ${en}`;
    let score = 0;
    for (const t of tokens) {
      if (blob.includes(t)) score += t.length >= 2 ? 2 : 1;
      if (item.name.includes(t) || item.id.includes(t)) score += 3;
    }
    return { item, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) return listLocalStockPhotos().slice(0, 12);
  return scored.map((x) => localItemToPhoto(x.item));
}

function categoryEnglish(cat: StockItem['category']): string {
  switch (cat) {
    case 'landscape':
      return 'nature landscape forest mountain ocean desert snow mist';
    case 'architecture':
      return 'city architecture building concrete street';
    case 'travel':
      return 'travel bridge neon';
    case 'people':
      return 'portrait people';
    case 'still-life':
      return 'still life food market flowers';
    case 'texture':
      return 'texture fabric paper stone';
    case 'product':
      return 'product';
    default: {
      const _e: never = cat;
      void _e;
      return '';
    }
  }
}

async function fetchJson(
  url: string,
  init: RequestInit,
  timeoutMs = 14_000,
): Promise<Response> {
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), timeoutMs);
  const upstream = init.signal;
  const onAbort = () => timeout.abort();
  upstream?.addEventListener('abort', onAbort);
  try {
    return await fetch(url, { ...init, signal: timeout.signal });
  } finally {
    clearTimeout(timer);
    upstream?.removeEventListener('abort', onAbort);
  }
}

export async function fetchOpenverse(
  q: string,
  signal?: AbortSignal,
): Promise<StockPhoto[]> {
  const resolved = resolveStockQuery(q);
  const url =
    `https://api.openverse.org/v1/images/?q=${encodeURIComponent(resolved.api)}` +
    `&page_size=24&license_type=commercial,modification`;
  const res = await fetchJson(url, {
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!res.ok) throw new Error(`Openverse ${res.status}`);
  const data = (await res.json()) as {
    results?: Array<{
      id: string;
      title?: string;
      creator?: string;
      url?: string;
      thumbnail?: string;
      foreign_landing_url?: string;
    }>;
  };
  return (data.results ?? [])
    .filter((r) => r.thumbnail && r.url)
    .map(
      (r): StockPhoto => ({
        id: `ov-${r.id}`,
        title: r.title?.trim() || 'Openverse',
        creator: r.creator?.trim() || 'Unknown',
        thumb: r.thumbnail!,
        full: r.url!,
        source: 'openverse',
        pageUrl: r.foreign_landing_url,
      }),
    );
}

export async function fetchPexels(
  q: string,
  apiKey: string,
  signal?: AbortSignal,
): Promise<StockPhoto[]> {
  const resolved = resolveStockQuery(q);
  const res = await fetchJson(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(resolved.api)}&per_page=24`,
    { headers: { Authorization: apiKey }, signal },
  );
  if (!res.ok) throw new Error(`Pexels ${res.status}`);
  const data = (await res.json()) as {
    photos?: Array<{
      id: number;
      photographer: string;
      alt: string;
      src: { medium: string; large: string };
      url: string;
    }>;
  };
  return (data.photos ?? []).map(
    (p): StockPhoto => ({
      id: `px-${p.id}`,
      title: p.alt?.trim() || `pexels-${p.id}`,
      creator: p.photographer,
      thumb: p.src.medium,
      full: p.src.large,
      source: 'pexels',
      pageUrl: p.url,
    }),
  );
}
