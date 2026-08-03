import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { saveToLibrary } from '../../core/library';
import {
  fetchOpenverse,
  fetchPexels,
  filterLocalStockPhotos,
  friendlyStockError,
  getStockCache,
  listLocalStockPhotos,
  resolveStockQuery,
  setStockCache,
  STOCK_CHIPS,
  type StockPhoto,
  type StockSourceId,
} from './stockSearch';

type Props = {
  onImported?: () => void;
  onStatus?: (msg: string) => void;
  /** When set, click inserts onto canvas (and caches to local library). */
  onPick?: (blob: Blob, name: string, id: string) => void;
};

type ResultMode = 'remote' | 'local';

const PEXELS_KEY = import.meta.env.VITE_PEXELS_KEY as string | undefined;

export function StockPanel({ onImported, onStatus, onPick }: Props) {
  const cached = getStockCache();
  const [online, setOnline] = useState(() => navigator.onLine);
  const [query, setQuery] = useState(cached?.query ?? '');
  const [photos, setPhotos] = useState<StockPhoto[]>(
    () => cached?.photos ?? listLocalStockPhotos(),
  );
  const [resultMode, setResultMode] = useState<ResultMode>(() =>
    cached?.photos?.length ? 'remote' : 'local',
  );
  const [searching, setSearching] = useState(false);
  const [importingIds, setImportingIds] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<StockSourceId>(cached?.source ?? 'openverse');
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const searchSeqRef = useRef(0);
  const importingRef = useRef<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  const resolved = useMemo(() => resolveStockQuery(query || '自然'), [query]);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
      abortRef.current?.abort();
    };
  }, []);

  const showLocalFallback = useCallback((q: string) => {
    setPhotos(filterLocalStockPhotos(q || '自然'));
    setResultMode('local');
  }, []);

  const runSearch = useCallback(
    async (rawQuery: string, src: StockSourceId, opts?: { quiet?: boolean }) => {
      const quiet = opts?.quiet ?? false;
      const q = rawQuery.trim() || '自然';

      if (!online) {
        showLocalFallback(q);
        setError(null);
        onStatus?.('离线 · 已显示本地精选');
        return;
      }

      if (src === 'pexels' && !PEXELS_KEY) {
        setError('未配置 Pexels Key，已切回 Openverse');
        setSource('openverse');
        return;
      }

      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      const seq = ++searchSeqRef.current;

      setSearching(true);
      if (!quiet) setError(null);

      try {
        const list =
          src === 'pexels' && PEXELS_KEY
            ? await fetchPexels(q, PEXELS_KEY, ac.signal)
            : await fetchOpenverse(q, ac.signal);
        if (seq !== searchSeqRef.current) return;

        if (list.length === 0) {
          showLocalFallback(q);
          setError(null);
          onStatus?.('在线无结果 · 已改用本地精选');
          return;
        }

        setPhotos(list);
        setResultMode('remote');
        setStockCache({ source: src, query: q, photos: list });
        setError(null);
      } catch (e) {
        if (ac.signal.aborted || seq !== searchSeqRef.current) return;
        showLocalFallback(q);
        if (!quiet) {
          setError(friendlyStockError(e));
          onStatus?.('在线搜索失败 · 已显示本地精选');
        }
      } finally {
        if (seq === searchSeqRef.current) setSearching(false);
      }
    },
    [online, onStatus, showLocalFallback],
  );

  // Soft background refresh only when we already have a remote cache.
  useEffect(() => {
    if (!online) return;
    if (cached?.photos?.length && cached.source === source) {
      void runSearch(cached.query || query || '自然', source, { quiet: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount / source only
  }, [online, source]);

  const submitSearch = (nextQuery?: string) => {
    const q = (nextQuery ?? query).trim() || '自然';
    if (nextQuery != null) setQuery(q);
    void runSearch(q, source);
  };

  const pickChip = (chipQuery: string, label: string) => {
    setActiveChip(label);
    setQuery(chipQuery);
    void runSearch(chipQuery, source);
    inputRef.current?.focus();
  };

  const importPhoto = async (photo: StockPhoto) => {
    if (importingRef.current.has(photo.id)) return;
    if (photo.source !== 'local' && !online) {
      onStatus?.('离线无法下载在线图片');
      return;
    }
    importingRef.current.add(photo.id);
    setImportingIds(new Set(importingRef.current));
    try {
      const res = await fetch(photo.full);
      if (!res.ok) throw new Error('download failed');
      const blob = await res.blob();
      const name = photo.title.slice(0, 48) || photo.id;
      const saved = await saveToLibrary(blob, name, photo.id);
      onImported?.();
      if (onPick) {
        onPick(blob, name, saved.id);
        onStatus?.(`已插入 · ${name}`);
      } else {
        onStatus?.(`已保存到图库 · ${name}`);
      }
    } catch {
      onStatus?.('下载失败 · 可继续编辑');
    } finally {
      importingRef.current.delete(photo.id);
      setImportingIds(new Set(importingRef.current));
    }
  };

  if (!online) {
    return (
      <div className="stock-panel">
        <p className="stock-banner stock-banner-info">
          当前离线。下面是本地高清精选，可直接插入画布。
        </p>
        <div className="stock-chips" role="list">
          {STOCK_CHIPS.map((c) => (
            <button
              key={c.label}
              type="button"
              className={activeChip === c.label ? 'active' : ''}
              onClick={() => {
                setActiveChip(c.label);
                setQuery(c.query);
                setPhotos(filterLocalStockPhotos(c.query));
                setResultMode('local');
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="stock-grid">
          {(query ? filterLocalStockPhotos(query) : listLocalStockPhotos()).map((p) => (
            <StockThumb
              key={p.id}
              photo={p}
              disabled={importingIds.has(p.id)}
              busyLabel={importingIds.has(p.id) ? '插入中…' : undefined}
              actionLabel={onPick ? '插入画布' : '保存到图库'}
              onImport={() => void importPhoto(p)}
            />
          ))}
        </div>
        <p className="stock-credit hint">本地 Unsplash 精选 · 可免费商用</p>
      </div>
    );
  }

  const showSkeleton = searching && resultMode === 'remote' && photos.every((p) => p.source !== 'local') && photos.length === 0;
  const showHint =
    resolved.translated &&
    resolved.raw.length > 0 &&
    resolved.api !== resolved.raw;

  return (
    <div className="stock-panel">
      <div className="stock-source-row">
        <button
          type="button"
          className={source === 'openverse' ? 'active' : ''}
          onClick={() => setSource('openverse')}
        >
          Openverse
        </button>
        {PEXELS_KEY ? (
          <button
            type="button"
            className={source === 'pexels' ? 'active' : ''}
            onClick={() => setSource('pexels')}
          >
            Pexels
          </button>
        ) : null}
        {searching ? (
          <span className="stock-searching">搜索中…</span>
        ) : (
          <span className="stock-searching stock-mode-tag">
            {resultMode === 'local' ? '本地精选' : '在线结果'}
          </span>
        )}
      </div>

      <form
        className="stock-search"
        onSubmit={(e) => {
          e.preventDefault();
          setActiveChip(null);
          submitSearch();
        }}
      >
        <div className="stock-search-field">
          <input
            ref={inputRef}
            type="search"
            value={query}
            placeholder="搜主题，如 森林 / forest…"
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveChip(null);
            }}
          />
        </div>
        <button type="submit" className="btn primary" disabled={searching}>
          {searching ? '…' : '搜索'}
        </button>
      </form>

      {showHint ? (
        <p className="stock-query-hint">
          将搜索英文：<strong>{resolved.api}</strong>
          <span className="stock-query-hint-muted">（在线库对中文支持有限）</span>
        </p>
      ) : null}

      <div className="stock-chips" role="list" aria-label="快捷主题">
        {STOCK_CHIPS.map((c) => (
          <button
            key={c.label}
            type="button"
            className={activeChip === c.label || query === c.query ? 'active' : ''}
            onClick={() => pickChip(c.query, c.label)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="stock-banner stock-banner-error" role="alert">
          <div className="stock-banner-text">
            <strong>在线搜索未成功</strong>
            <span>{error}</span>
            <span className="stock-banner-sub">已改用下方本地高清精选，可直接插入。</span>
          </div>
          <button
            type="button"
            className="btn"
            disabled={searching}
            onClick={() => submitSearch()}
          >
            重试
          </button>
        </div>
      ) : null}

      {showSkeleton ? (
        <div className="stock-grid stock-grid-skeleton" aria-hidden>
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className="stock-skel" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="stock-empty">
          <p>没有找到相关图片</p>
          <button type="button" className="btn" onClick={() => pickChip('自然', '自然')}>
            浏览自然主题
          </button>
        </div>
      ) : (
        <div className={`stock-grid ${searching ? 'is-refreshing' : ''}`}>
          {photos.map((p) => (
            <StockThumb
              key={p.id}
              photo={p}
              disabled={importingIds.has(p.id)}
              busyLabel={importingIds.has(p.id) ? '插入中…' : undefined}
              actionLabel={onPick ? '插入画布' : '保存到图库'}
              badge={p.source === 'local' ? '本地' : undefined}
              onImport={() => void importPhoto(p)}
            />
          ))}
        </div>
      )}

      <p className="stock-credit hint">
        {resultMode === 'local'
          ? '本地 Unsplash 精选 · 可免费商用 · 无需等待在线接口'
          : source === 'pexels'
            ? 'Photos provided by Pexels · 点击即可插入'
            : 'Openverse · CC 商用可改 · 点击即可插入'}
      </p>
    </div>
  );
}

function StockThumb({
  photo,
  disabled,
  actionLabel,
  busyLabel,
  badge,
  onImport,
}: {
  photo: StockPhoto;
  disabled: boolean;
  actionLabel: string;
  busyLabel?: string;
  badge?: string;
  onImport: () => void;
}) {
  return (
    <button
      type="button"
      className="stock-thumb"
      title={`${photo.title} · ${photo.creator}`}
      disabled={disabled}
      onClick={onImport}
    >
      <img src={photo.thumb} alt={photo.title || photo.creator} loading="lazy" />
      {badge ? <span className="stock-thumb-badge">{badge}</span> : null}
      <span className="stock-thumb-label">{busyLabel ?? actionLabel}</span>
    </button>
  );
}
