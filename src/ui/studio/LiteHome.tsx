import { useEffect, useMemo, useState } from 'react';
import {
  createFolder,
  deleteFolder,
  deleteUserTemplate,
  ensureProjectThumbnail,
  getPickPreviewHiRes,
  listBuiltinTemplates,
  listFolders,
  listProjects,
  listScenes,
  listUserTemplates,
  moveProjectToFolder,
  removeProject,
  renameFolder,
  setProjectStarred,
  warmTemplatePreviews,
  type BuiltinTemplate,
  type ProjectFolder,
  type ProjectMeta,
  type SceneId,
  type ScenePlugin,
  type TemplatePick,
  type UserTemplateMeta,
} from '../../studio';
import { listLibrary, type LibraryItem } from '../../core/library';
import { Button } from '@/components/ui/button';
import { useGridAwarePick, type TemplatePickHandler } from './gridAwarePick';
import {
  displayProjectTitle,
  formatDims,
  formatProjectWhen,
  sceneLabel,
} from './projectDisplay';

type Props = {
  onPick: TemplatePickHandler;
  onOpenProject: (id: string) => void;
  onContinue?: () => void;
  recentLimit?: number;
};


type HubTab = 'recent' | 'projects' | 'templates' | 'images';
type ProjectSubTab = 'all' | 'designs' | 'folders';

const MATERIAL_IDS: SceneId[] = [
  'card',
  'poster',
  'ad',
  'social',
  'wechatCover',
  'xhsNote',
];
const PRINT_IDS: SceneId[] = ['tianzige', 'pinyin', 'calligraphy'];

type LibraryTab = 'builtin' | 'mine';
type CategoryChip = 'all' | SceneId | 'blank';

const CATEGORY_CHIPS: { id: CategoryChip; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'poster', label: '海报' },
  { id: 'card', label: '名片' },
  { id: 'ad', label: '广告' },
  { id: 'social', label: '社交' },
  { id: 'wechatCover', label: '公众号' },
  { id: 'xhsNote', label: '小红书' },
  { id: 'tianzige', label: '练习纸' },
  { id: 'blank', label: '空白起点' },
];

const STYLE_TAGS = ['摄影', '编辑', '极简', '促销'] as const;
const XHS_SHELF_TAGS = [
  { id: null as string | null, label: '全部' },
  { id: '签名', label: '视觉签名' },
  { id: '文字干货', label: '文字干货' },
  { id: '成套', label: '成套笔记' },
  { id: '摄影', label: '摄影向' },
] as const;
const XHS_CAT_TAGS = [
  { id: null as string | null, label: '类别不限' },
  { id: '生活', label: '生活 Plog' },
  { id: '氛围', label: '氛围' },
  { id: '旅行', label: '旅行' },
  { id: '知识', label: '知识' },
  { id: '种草', label: '种草' },
  { id: '手账', label: '手账' },
] as const;

type PreviewState = {
  pick: TemplatePick;
  title: string;
  desc: string;
  /** Card thumb (placeholder while hi-res loads). */
  thumb: string | null;
  /** Sharp modal raster. */
  hiRes?: string | null;
  hiResLoading?: boolean;
};

function hintSize(scene: ScenePlugin): string | null {
  const h = scene.exportHints?.[0];
  if (!h) return null;
  const dims = formatDims(h.width, h.height);
  return h.name ? `${h.name} · ${dims}` : dims;
}

function sceneTone(id: SceneId): string {
  switch (id) {
    case 'poster':
      return 'tone-poster';
    case 'card':
      return 'tone-card';
    case 'ad':
      return 'tone-ad';
    case 'social':
      return 'tone-social';
    case 'wechatCover':
      return 'tone-wechat';
    case 'xhsNote':
      return 'tone-xhs';
    case 'tianzige':
    case 'pinyin':
    case 'calligraphy':
      return 'tone-print';
    case 'retouch':
      return 'tone-default';
    default: {
      const _e: never = id;
      void _e;
      return 'tone-default';
    }
  }
}

function TemplatePreviewModal({
  preview,
  onClose,
  onUse,
}: {
  preview: PreviewState;
  onClose: () => void;
  onUse: () => void;
}) {
  const src = preview.hiRes || preview.thumb;
  const [aspect, setAspect] = useState<number | null>(null);

  useEffect(() => {
    setAspect(null);
  }, [preview.pick]);

  // Portrait → hug content width so the art fills the stage (less side letterbox).
  const cardStyle =
    aspect != null && aspect < 0.85
      ? {
          width: `min(98vw, calc((98vh - 96px) * ${aspect} + 40px))`,
          height: 'min(98vh, 1200px)',
        }
      : undefined;

  return (
    <div className="template-preview-modal" role="dialog" aria-modal="true">
      <button
        type="button"
        className="template-preview-backdrop"
        aria-label="关闭预览"
        onClick={onClose}
      />
      <div className="template-preview-card" style={cardStyle}>
        <header className="template-preview-head">
          <div>
            <h2>{preview.title}</h2>
            <p className="hint">{preview.desc}</p>
          </div>
          <button type="button" className="close" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="template-preview-stage">
          {src ? (
            <img
              src={src}
              alt={preview.title}
              className={preview.hiRes ? 'is-hires' : 'is-placeholder'}
              onLoad={(e) => {
                const el = e.currentTarget;
                if (el.naturalWidth > 0 && el.naturalHeight > 0) {
                  setAspect(el.naturalWidth / el.naturalHeight);
                }
              }}
            />
          ) : (
            <p className="hint">预览生成中…</p>
          )}
          {preview.hiResLoading && src && (
            <span className="template-preview-loading">高清渲染中…</span>
          )}
        </div>
        <footer className="template-preview-actions">
          <Button type="button" variant="ghost" onClick={onClose}>
            返回浏览
          </Button>
          <Button type="button" onClick={onUse}>
            使用此模板
          </Button>
        </footer>
      </div>
    </div>
  );
}

function SceneCardGrid({
  scenes,
  thumbs,
  onPreview,
}: {
  scenes: ScenePlugin[];
  thumbs: Record<string, string>;
  onPreview: (state: PreviewState) => void;
}) {
  return (
    <div className="template-grid">
      {scenes.map((s) => {
        const size = hintSize(s);
        const thumb = thumbs[s.id];
        return (
          <button
            key={s.id}
            type="button"
            className={`template-card has-thumb ${thumb ? '' : 'is-loading-thumb'}`}
            onClick={() =>
              onPreview({
                pick: { layer: 'parametric', sceneId: s.id },
                title: s.label,
                desc: size ? `${s.description} · ${size}` : s.description,
                thumb: thumb ?? null,
              })
            }
          >
            {thumb ? (
              <img className="template-thumb" src={thumb} alt="" loading="lazy" />
            ) : (
              <span className="template-thumb placeholder">{s.label.slice(0, 1)}</span>
            )}
            <span className="template-label">{s.label}</span>
            {size && <span className="template-size muted">{size}</span>}
            <span className="template-desc muted">{s.description}</span>
          </button>
        );
      })}
    </div>
  );
}

export function TemplateSections({
  onPick,
  userTemplates,
  onDeleteUserTemplate,
  hideSectionChrome,
  nameFilter = '',
}: {
  onPick: (pick: TemplatePick) => void;
  userTemplates: UserTemplateMeta[];
  onDeleteUserTemplate?: (id: string) => void;
  /** When embedded in hub tab, skip outer section title. */
  hideSectionChrome?: boolean;
  nameFilter?: string;
}) {
  const builtins = listBuiltinTemplates();
  const all = listScenes().filter((s) => s.id !== 'retouch');
  const byId = new Map(all.map((s) => [s.id, s]));
  const materials = MATERIAL_IDS.map((id) => byId.get(id)).filter(Boolean) as ScenePlugin[];
  const printPacks = PRINT_IDS.map((id) => byId.get(id)).filter(Boolean) as ScenePlugin[];
  const rest = all.filter(
    (s) => !MATERIAL_IDS.includes(s.id) && !PRINT_IDS.includes(s.id),
  );

  const [builtinThumbs, setBuiltinThumbs] = useState<Record<string, string>>({});
  const [sceneThumbs, setSceneThumbs] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [libraryTab, setLibraryTab] = useState<LibraryTab>('builtin');
  const [category, setCategory] = useState<CategoryChip>('all');
  const [styleTag, setStyleTag] = useState<string | null>(null);
  const [xhsCatTag, setXhsCatTag] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const sceneIds = [...MATERIAL_IDS, ...PRINT_IDS, ...rest.map((s) => s.id)];
    void warmTemplatePreviews({
      builtinIds: builtins.map((t) => t.id),
      sceneIds,
      onBuiltin: (id, url) => {
        if (cancelled || !url) return;
        setBuiltinThumbs((prev) => (prev[id] === url ? prev : { ...prev, [id]: url }));
      },
      onScene: (id, url) => {
        if (cancelled || !url) return;
        setSceneThumbs((prev) => (prev[id] === url ? prev : { ...prev, [id]: url }));
      },
    });
    return () => {
      cancelled = true;
    };
    // Warm once on mount — template ids are stable package data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Modal: load sharp PNG (do not blow up the card JPEG).
  useEffect(() => {
    if (!preview) return;
    if (preview.pick.layer === 'user') {
      if (preview.thumb && !preview.hiRes) {
        setPreview((p) => (p ? { ...p, hiRes: p.thumb, hiResLoading: false } : p));
      }
      return;
    }
    if (preview.hiRes) return;
    let cancelled = false;
    setPreview((p) => (p ? { ...p, hiResLoading: true } : p));
    void getPickPreviewHiRes(preview.pick).then((url) => {
      if (cancelled) return;
      setPreview((p) =>
        p
          ? { ...p, hiRes: url, hiResLoading: false }
          : p,
      );
    });
    return () => {
      cancelled = true;
    };
  }, [preview?.pick, preview?.hiRes]);

  const q = nameFilter.trim().toLowerCase();

  const filteredBuiltins = useMemo(() => {
    let list: BuiltinTemplate[] = builtins;
    if (
      category !== 'all' &&
      category !== 'blank' &&
      category !== 'tianzige' &&
      category !== 'pinyin' &&
      category !== 'calligraphy'
    ) {
      list = list.filter((t) => t.sceneId === category);
    }
    if (styleTag) {
      list = list.filter((t) => t.tags?.includes(styleTag));
    }
    if (category === 'xhsNote' && xhsCatTag) {
      list = list.filter((t) => t.tags?.includes(xhsCatTag));
    }
    if (q) {
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q),
      );
    }
    return list;
  }, [builtins, category, styleTag, xhsCatTag, q]);

  const filteredUserTemplates = useMemo(() => {
    if (!q) return userTemplates;
    return userTemplates.filter((t) =>
      displayProjectTitle(t.name, t.sceneId).toLowerCase().includes(q),
    );
  }, [userTemplates, q]);

  const showPrint =
    category === 'all' ||
    category === 'tianzige' ||
    category === 'pinyin' ||
    category === 'calligraphy';
  const showBlank = category === 'all' || category === 'blank';
  const showBuiltinGrid =
    category === 'all' ||
    category === 'poster' ||
    category === 'card' ||
    category === 'ad' ||
    category === 'social' ||
    category === 'wechatCover' ||
    category === 'xhsNote';

  const openBuiltin = (t: BuiltinTemplate) => {
    setPreview({
      pick: { layer: 'builtin', templateId: t.id },
      title: t.name,
      desc: t.description,
      thumb: builtinThumbs[t.id] ?? null,
    });
  };

  return (
    <>
      <section
        className={`lite-section lite-section-last ${hideSectionChrome ? 'is-hub-embed' : ''} ${category === 'xhsNote' ? 'is-xhs-specialty' : ''}`}
      >
        {!hideSectionChrome && (
          <div className="lite-section-head">
            <h3 className="lite-section-title">
              {category === 'xhsNote' ? '\u5c0f\u7ea2\u4e66\u7269\u6599\u4e13\u573a' : '\u6a21\u677f\u5e93'}
            </h3>
            <span className="lite-section-tag">
              {category === 'xhsNote' ? '\u7b7e\u540d\u00b7\u624b\u8d26\u00b7\u5e72\u8d27' : '\u5206\u7c7b \u00b7 \u9884\u89c8'}
            </span>
          </div>
        )}

        <div className="template-library-tabs" role="tablist" aria-label="模板来源">
          <button
            type="button"
            role="tab"
            aria-selected={libraryTab === 'builtin'}
            className={`template-library-tab ${libraryTab === 'builtin' ? 'active' : ''}`}
            onClick={() => setLibraryTab('builtin')}
          >
            自带模板
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={libraryTab === 'mine'}
            className={`template-library-tab ${libraryTab === 'mine' ? 'active' : ''}`}
            onClick={() => setLibraryTab('mine')}
          >
            我的模板
            {userTemplates.length > 0 ? ` · ${userTemplates.length}` : ''}
          </button>
        </div>

        {libraryTab === 'builtin' && (
          <>
            <div className="template-chip-row" role="toolbar" aria-label="品类">
              {CATEGORY_CHIPS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`template-chip ${category === c.id ? 'active' : ''}`}
                  onClick={() => {
                    setCategory(c.id);
                    setStyleTag(null);
                    setXhsCatTag(null);
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
            {showBuiltinGrid && category === 'xhsNote' && (
              <>
                <div className="template-chip-row is-secondary" role="toolbar" aria-label="小红书分区">
                  {XHS_SHELF_TAGS.map((tag) => (
                    <button
                      key={tag.label}
                      type="button"
                      className={`template-chip ${styleTag === tag.id ? 'active' : ''}`}
                      onClick={() => {
                        setStyleTag(tag.id);
                        if (tag.id !== null && tag.id !== '签名') setXhsCatTag(null);
                      }}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
                {(styleTag === null || styleTag === '签名') && (
                  <div className="template-chip-row is-secondary" role="toolbar" aria-label="签名类别">
                    {XHS_CAT_TAGS.map((tag) => (
                      <button
                        key={tag.label}
                        type="button"
                        className={`template-chip ${xhsCatTag === tag.id ? 'active' : ''}`}
                        onClick={() => setXhsCatTag(tag.id)}
                      >
                        {tag.label}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {showBuiltinGrid && category !== 'xhsNote' && (
              <div className="template-chip-row is-secondary" role="toolbar" aria-label="风格">
                <button
                  type="button"
                  className={`template-chip ${styleTag === null ? 'active' : ''}`}
                  onClick={() => setStyleTag(null)}
                >
                  风格不限
                </button>
                {STYLE_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={`template-chip ${styleTag === tag ? 'active' : ''}`}
                    onClick={() => setStyleTag((prev) => (prev === tag ? null : tag))}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            {showBuiltinGrid && category === 'xhsNote' && (
              <div className="lite-xhs-hub-cta">
                <button
                  type="button"
                  className="btn primary"
                  onClick={() =>
                    onPick({
                      layer: 'parametric',
                      sceneId: 'xhsNote',
                      xhsCardType: 'cover',
                    })
                  }
                >
                  空白开写 · 封面
                </button>
                <p className="hint">
                  物料专场 — 视觉签名为主货架；文字干货/成套仍可用；空白开写走封面卡片工厂
                </p>
              </div>
            )}

            {showBuiltinGrid && (
              <>
                <p className="hint">
                  {category === 'xhsNote'
                    ? '视觉签名 / 文字干货 / 成套 — 点开预览再用；签名以换图改字为主'
                    : '签名版式 — 配图场 + 字体对撞，点开预览再用'}
                </p>
                <div className="template-grid">
                  {filteredBuiltins.map((t) => {
                    const thumb = builtinThumbs[t.id];
                    return (
                      <button
                        key={t.id}
                        type="button"
                        className={`template-card has-thumb ${thumb ? '' : 'is-loading-thumb'}`}
                        onClick={() => openBuiltin(t)}
                      >
                        {thumb ? (
                          <img className="template-thumb" src={thumb} alt="" loading="lazy" />
                        ) : (
                          <span className="template-thumb placeholder">…</span>
                        )}
                        <span className="template-label">{t.name}</span>
                        <span className="template-desc muted">{t.description}</span>
                      </button>
                    );
                  })}
                </div>
                {filteredBuiltins.length === 0 && (
                  <p className="hint lite-empty">此分类下暂无模板</p>
                )}
              </>
            )}

            {showPrint && (
              <div className="template-library-block">
                <h4 className="template-library-subtitle">练习纸</h4>
                <p className="hint">A4 田字格 / 拼音格 / 书法格</p>
                <SceneCardGrid
                  scenes={printPacks}
                  thumbs={sceneThumbs}
                  onPreview={setPreview}
                />
              </div>
            )}

            {showBlank && (
              <details className="template-library-blank" open={category === 'blank'}>
                <summary>空白起点 · 场景画板</summary>
                <p className="hint">从 L2 场景起步，不含成品签名版式</p>
                <SceneCardGrid
                  scenes={materials}
                  thumbs={sceneThumbs}
                  onPreview={setPreview}
                />
                {rest.length > 0 && (
                  <SceneCardGrid scenes={rest} thumbs={sceneThumbs} onPreview={setPreview} />
                )}
              </details>
            )}
          </>
        )}

        {libraryTab === 'mine' && (
          <>
            <p className="hint">编辑器顶栏「另存为模板」沉淀到本机</p>
            {filteredUserTemplates.length === 0 ? (
              <p className="hint lite-empty">
                {q ? '无匹配模板' : '还没有自建模板 — 做好一版后另存即可复用'}
              </p>
            ) : (
              <div className="template-grid">
                {filteredUserTemplates.map((t) => (
                  <div key={t.id} className="template-card-wrap">
                    <button
                      type="button"
                      className="template-card has-thumb"
                      onClick={() =>
                        setPreview({
                          pick: { layer: 'user', templateId: t.id },
                          title: displayProjectTitle(t.name, t.sceneId),
                          desc: `${sceneLabel(t.sceneId)} · ${formatProjectWhen(t.updatedAt)}`,
                          thumb: t.thumbnail ?? null,
                        })
                      }
                    >
                      {t.thumbnail ? (
                        <img className="template-thumb" src={t.thumbnail} alt="" />
                      ) : (
                        <span className="template-thumb placeholder">
                          {displayProjectTitle(t.name, t.sceneId).slice(0, 1)}
                        </span>
                      )}
                      <span className="template-label">
                        {displayProjectTitle(t.name, t.sceneId)}
                      </span>
                      <span className="template-desc muted">
                        {sceneLabel(t.sceneId)} · {formatProjectWhen(t.updatedAt)}
                      </span>
                    </button>
                    {onDeleteUserTemplate && (
                      <button
                        type="button"
                        className="template-card-delete"
                        title="删除模板"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            window.confirm(
                              `\u5220\u9664\u6a21\u677f\u300c${displayProjectTitle(t.name, t.sceneId)}\u300d\uff1f`,
                            )
                          ) {
                            onDeleteUserTemplate(t.id);
                          }
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {preview && (
        <TemplatePreviewModal
          preview={preview}
          onClose={() => setPreview(null)}
          onUse={() => {
            const pick = preview.pick;
            setPreview(null);
            onPick(pick);
          }}
        />
      )}
    </>
  );
}

function ProjectCard({
  project,
  folders,
  onOpen,
  onRefresh,
}: {
  project: ProjectMeta;
  folders: ProjectFolder[];
  onOpen: () => void;
  onRefresh: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cover, setCover] = useState<string | null>(project.thumbnail ?? null);
  const [coverLoading, setCoverLoading] = useState(!project.thumbnail);
  const title = displayProjectTitle(project.name, project.sceneId);
  const kind = sceneLabel(project.sceneId);

  useEffect(() => {
    setCover(project.thumbnail ?? null);
    if (project.thumbnail) {
      setCoverLoading(false);
      return;
    }
    let cancelled = false;
    setCoverLoading(true);
    void ensureProjectThumbnail(project.id).then((url) => {
      if (cancelled) return;
      setCover(url);
      setCoverLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [project.id, project.thumbnail, project.updatedAt]);

  return (
    <div className={`hub-card ${menuOpen ? 'is-menu-open' : ''}`}>
      <button type="button" className="hub-card-main" onClick={onOpen}>
        <span
          className={[
            'lite-recent-thumb',
            sceneTone(project.sceneId),
            cover ? 'has-cover' : 'is-placeholder',
            coverLoading && !cover ? 'is-loading' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {cover ? (
            <img src={cover} alt="" loading="lazy" decoding="async" />
          ) : (
            <span className="lite-recent-thumb-fallback">{kind}</span>
          )}
        </span>
        <span className="lite-recent-name" title={title}>
          {title}
          {project.starred ? (
            <span className="hub-star-mark" title="已收藏">
              ★
            </span>
          ) : null}
        </span>
        <span className="lite-recent-meta muted">
          {kind} · {formatProjectWhen(project.updatedAt)}
        </span>
      </button>
      <div className="hub-card-actions">
        <button
          type="button"
          className="hub-card-more"
          aria-label="更多"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((o) => !o);
          }}
        >
          ···
        </button>
        {menuOpen && (
          <div className="hub-card-menu" role="menu">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                void setProjectStarred(project.id, !project.starred).then(onRefresh);
                setMenuOpen(false);
              }}
            >
              {project.starred ? '取消收藏' : '收藏'}
            </button>
            <div className="hub-card-menu-label">移到文件夹</div>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                void moveProjectToFolder(project.id, null).then(onRefresh);
                setMenuOpen(false);
              }}
            >
              根目录（未分类）
            </button>
            {folders.map((f) => (
              <button
                key={f.id}
                type="button"
                role="menuitem"
                className={project.folderId === f.id ? 'is-active' : ''}
                onClick={() => {
                  void moveProjectToFolder(project.id, f.id).then(onRefresh);
                  setMenuOpen(false);
                }}
              >
                {f.name}
              </button>
            ))}
            <button
              type="button"
              role="menuitem"
              className="is-danger"
              onClick={() => {
                if (
                  window.confirm(
                    `\u5220\u9664\u9879\u76ee\u300c${title}\u300d\uff1f\u6b64\u64cd\u4f5c\u4e0d\u53ef\u64a4\u9500\u3002`,
                  )
                ) {
                  void removeProject(project.id).then(onRefresh);
                }
                setMenuOpen(false);
              }}
            >
              删除项目
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FolderCard({
  folder,
  count,
  onOpen,
  onRename,
  onDelete,
}: {
  folder: ProjectFolder;
  count: number;
  onOpen: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className={`hub-folder-card ${menuOpen ? 'is-menu-open' : ''}`}>
      <button type="button" className="hub-folder-main" onClick={onOpen}>
        <span className="hub-folder-icon" aria-hidden>
          ▣
        </span>
        <span className="hub-folder-name">{folder.name}</span>
        <span className="hub-folder-meta muted">{count} 个设计</span>
      </button>
      <button
        type="button"
        className="hub-card-more"
        aria-label="文件夹操作"
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen((o) => !o);
        }}
      >
        ···
      </button>
      {menuOpen && (
        <div className="hub-card-menu" role="menu">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              onRename();
            }}
          >
            重命名
          </button>
          <button
            type="button"
            role="menuitem"
            className="is-danger"
            onClick={() => {
              setMenuOpen(false);
              onDelete();
            }}
          >
            删除文件夹
          </button>
        </div>
      )}
    </div>
  );
}

export function LiteHome({ onPick, onOpenProject, onContinue, recentLimit = 8 }: Props) {
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [folders, setFolders] = useState<ProjectFolder[]>([]);
  const [userTemplates, setUserTemplates] = useState<UserTemplateMeta[]>([]);
  const [images, setImages] = useState<LibraryItem[]>([]);
  const [hubTab, setHubTab] = useState<HubTab>('templates');
  const [projectSub, setProjectSub] = useState<ProjectSubTab>('all');
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [starredOnly, setStarredOnly] = useState(false);
  const [search, setSearch] = useState('');
  const { handlePick, gridModal } = useGridAwarePick(onPick);

  const refresh = async () => {
    // Isolate failures — one store error must not blank the project list.
    const settled = await Promise.allSettled([
      listProjects(),
      listFolders(),
      listUserTemplates(),
      listLibrary(),
    ]);
    const [p, f, t, imgs] = settled;
    if (p.status === 'fulfilled') setProjects(p.value);
    if (f.status === 'fulfilled') setFolders(f.value);
    if (t.status === 'fulfilled') setUserTemplates(t.value);
    if (imgs.status === 'fulfilled') setImages(imgs.value);
    if (settled.some((r) => r.status === 'rejected')) {
      console.warn(
        '[LiteHome] library refresh partial failure',
        settled.filter((r) => r.status === 'rejected'),
      );
    }
    return p.status === 'fulfilled' ? p.value : null;
  };

  useEffect(() => {
    void refresh().then((p) => {
      if (p && p.length > 0) {
        setHubTab((tab) => (tab === 'templates' ? 'projects' : tab));
      }
    });
  }, []);

  useEffect(() => {
    if (hubTab === 'recent' && projects.length === 0) setHubTab('projects');
  }, [hubTab, projects.length]);

  const q = search.trim().toLowerCase();
  const recent = projects.slice(0, recentLimit);
  const latest = projects[0];

  const folderCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of projects) {
      if (!p.folderId) continue;
      m.set(p.folderId, (m.get(p.folderId) ?? 0) + 1);
    }
    return m;
  }, [projects]);

  const visibleProjects = useMemo(() => {
    let list = projects;
    if (starredOnly) list = list.filter((p) => p.starred);
    if (activeFolderId) list = list.filter((p) => p.folderId === activeFolderId);
    if (q) {
      list = list.filter((p) =>
        displayProjectTitle(p.name, p.sceneId).toLowerCase().includes(q),
      );
    }
    return list;
  }, [projects, starredOnly, activeFolderId, q]);

  const filteredImages = useMemo(() => {
    if (!q) return images;
    return images.filter((i) => i.name.toLowerCase().includes(q));
  }, [images, q]);

  const activeFolder = folders.find((f) => f.id === activeFolderId) ?? null;

  const onCreateFolder = () => {
    const name = window.prompt('\u65b0\u6587\u4ef6\u5939\u540d\u79f0', '\u6211\u7684\u8bbe\u8ba1');
    if (name == null) return;
    void createFolder(name).then(refresh);
  };

  const onRenameFolder = (folder: ProjectFolder) => {
    const name = window.prompt('\u91cd\u547d\u540d\u6587\u4ef6\u5939', folder.name);
    if (name == null) return;
    void renameFolder(folder.id, name).then(refresh);
  };

  const onDeleteFolder = (folder: ProjectFolder) => {
    if (
      !window.confirm(
        `\u5220\u9664\u6587\u4ef6\u5939\u300c${folder.name}\u300d\uff1f\u91cc\u9762\u7684\u8bbe\u8ba1\u4f1a\u56de\u5230\u6839\u76ee\u5f55\uff0c\u4e0d\u4f1a\u88ab\u5220\u9664\u3002`,
      )
    ) {
      return;
    }
    void deleteFolder(folder.id).then(() => {
      if (activeFolderId === folder.id) setActiveFolderId(null);
      return refresh();
    });
  };

  return (
    <div className="lite-home">
      <div className="lite-home-inner">
        <header className="lite-home-header glass">
          <div className="lite-home-brand">
            <h1 className="lite-home-title">PicLab Studio</h1>
            <p className="lite-home-tagline">离线优先 · 模板 · 项目 · 图库一体</p>
          </div>
          {latest && onContinue && (
            <Button type="button" className="lite-continue-btn" onClick={onContinue}>
              <span className="lite-continue-main">
                继续编辑 · {displayProjectTitle(latest.name, latest.sceneId)}
              </span>
              <span className="lite-continue-meta">{formatProjectWhen(latest.updatedAt)}</span>
            </Button>
          )}
        </header>

        <div className="hub-toolbar glass">
          <label className="hub-search">
            <span className="hub-search-icon" aria-hidden>
              ⌕
            </span>
            <input
              type="search"
              value={search}
              placeholder="搜索项目 / 模板 / 图片…"
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <div className="hub-tabs" role="tablist" aria-label="资料库">
            {(
              [
                ['recent', '最近', projects.length > 0],
                ['projects', '项目', true],
                ['templates', '模板', true],
                ['images', '图片', true],
              ] as const
            ).map(([id, label, show]) =>
              show ? (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={hubTab === id}
                  className={`hub-tab ${hubTab === id ? 'active' : ''}`}
                  onClick={() => {
                    setHubTab(id);
                    if (id !== 'projects') {
                      setActiveFolderId(null);
                      setStarredOnly(false);
                    }
                  }}
                >
                  {label}
                  {id === 'projects' && projects.length > 0 ? ` · ${projects.length}` : ''}
                  {id === 'images' && images.length > 0 ? ` · ${images.length}` : ''}
                </button>
              ) : null,
            )}
          </div>
        </div>

        {hubTab === 'recent' && (
          <section className="lite-section">
            <div className="lite-section-head">
              <h3 className="lite-section-title">最近编辑</h3>
              <span className="lite-section-tag">{recent.length} / {projects.length}</span>
            </div>
            {recent.length === 0 ? (
              <p className="hint lite-empty">还没有项目 — 去「模板」选一个开始</p>
            ) : (
              <div className="lite-recent-grid">
                {recent
                  .filter((p) =>
                    q
                      ? displayProjectTitle(p.name, p.sceneId).toLowerCase().includes(q)
                      : true,
                  )
                  .map((p) => (
                    <ProjectCard
                      key={p.id}
                      project={p}
                      folders={folders}
                      onOpen={() => onOpenProject(p.id)}
                      onRefresh={() => void refresh()}
                    />
                  ))}
              </div>
            )}
          </section>
        )}

        {hubTab === 'projects' && (
          <section className="lite-section">
            <div className="hub-project-nav">
              <div className="hub-subtabs" role="tablist" aria-label="项目视图">
                {(
                  [
                    ['all', '全部'],
                    ['designs', '设计'],
                    ['folders', '文件夹'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    className={`hub-subtab ${projectSub === id ? 'active' : ''}`}
                    onClick={() => {
                      setProjectSub(id);
                      if (id === 'folders') {
                        setActiveFolderId(null);
                        setStarredOnly(false);
                      }
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="hub-project-filters">
                <button
                  type="button"
                  className={`template-chip ${starredOnly ? 'active' : ''}`}
                  onClick={() => setStarredOnly((s) => !s)}
                >
                  已收藏
                </button>
                {activeFolder && (
                  <button
                    type="button"
                    className="hub-crumb"
                    onClick={() => setActiveFolderId(null)}
                  >
                    项目 / {activeFolder.name} · 返回
                  </button>
                )}
              </div>
            </div>

            {/* Designs first — folders are optional organization, never a gate. */}
            {(projectSub === 'all' || projectSub === 'designs' || activeFolderId) && (
              <>
                {projectSub === 'all' && !activeFolderId && (
                  <div className="lite-section-head hub-block-head">
                    <h4 className="hub-block-title">最近设计</h4>
                    {projects.length > 0 && (
                      <span className="lite-section-tag">
                        {visibleProjects.length}
                        {starredOnly ? ' · 收藏' : ''}
                      </span>
                    )}
                  </div>
                )}
                {visibleProjects.length === 0 ? (
                  <p className="hint lite-empty">
                    {q ? (
                      '无匹配项目'
                    ) : activeFolderId ? (
                      '此文件夹还是空的 — 用卡片菜单「移到文件夹」归入'
                    ) : (
                      <>
                        还没有本地项目 —{' '}
                        <button
                          type="button"
                          className="hub-inline-link"
                          onClick={() => setHubTab('templates')}
                        >
                          去模板库开始
                        </button>
                      </>
                    )}
                  </p>
                ) : (
                  <div className="lite-recent-grid">
                    {visibleProjects.map((p) => (
                      <ProjectCard
                        key={p.id}
                        project={p}
                        folders={folders}
                        onOpen={() => onOpenProject(p.id)}
                        onRefresh={() => void refresh()}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Folders: full grid only on 文件夹 tab; on 全部, compact strip if any exist. */}
            {projectSub === 'all' && !activeFolderId && folders.length > 0 && (
              <div className="hub-folder-strip">
                <div className="lite-section-head hub-block-head">
                  <h4 className="hub-block-title">文件夹</h4>
                  <button
                    type="button"
                    className="hub-inline-link"
                    onClick={onCreateFolder}
                  >
                    + 新建
                  </button>
                </div>
                <div className="hub-folder-grid is-compact">
                  {folders.map((f) => (
                    <FolderCard
                      key={f.id}
                      folder={f}
                      count={folderCounts.get(f.id) ?? 0}
                      onOpen={() => {
                        setActiveFolderId(f.id);
                        setProjectSub('designs');
                        setStarredOnly(false);
                      }}
                      onRename={() => onRenameFolder(f)}
                      onDelete={() => onDeleteFolder(f)}
                    />
                  ))}
                </div>
              </div>
            )}

            {projectSub === 'folders' && !activeFolderId && (
              <div className="hub-folder-grid">
                <button type="button" className="hub-folder-create" onClick={onCreateFolder}>
                  <span className="hub-folder-create-plus">+</span>
                  <span>创建文件夹</span>
                </button>
                {folders.map((f) => (
                  <FolderCard
                    key={f.id}
                    folder={f}
                    count={folderCounts.get(f.id) ?? 0}
                    onOpen={() => {
                      setActiveFolderId(f.id);
                      setProjectSub('designs');
                      setStarredOnly(false);
                    }}
                    onRename={() => onRenameFolder(f)}
                    onDelete={() => onDeleteFolder(f)}
                  />
                ))}
                {folders.length === 0 && (
                  <p className="hint lite-empty hub-folder-hint">
                    文件夹可选 — 不建也能在「全部 / 设计」里看到全部项目
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        {hubTab === 'templates' && (
          <TemplateSections
            hideSectionChrome
            nameFilter={search}
            onPick={handlePick}
            userTemplates={userTemplates}
            onDeleteUserTemplate={(id) => {
              void (async () => {
                await deleteUserTemplate(id);
                await refresh();
              })();
            }}
          />
        )}

        {hubTab === 'images' && (
          <section className="lite-section lite-section-last">
            <div className="lite-section-head">
              <h3 className="lite-section-title">图片库</h3>
              <span className="lite-section-tag">本机素材 · 编辑器内插入</span>
            </div>
            <p className="hint">
              浏览已保存的本地图片。插入与在线搜索请在编辑器左侧「图片」打开图库抽屉。
            </p>
            {filteredImages.length === 0 ? (
              <p className="hint lite-empty">
                {q ? '无匹配图片' : '图库为空 — 在编辑器中导入或保存当前画面'}
              </p>
            ) : (
              <div className="hub-image-grid">
                {filteredImages.map((item) => (
                  <LibraryThumb key={item.id} item={item} />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
      {gridModal}
    </div>
  );
}

function LibraryThumb({ item }: { item: LibraryItem }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const u = URL.createObjectURL(item.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [item.blob]);
  return (
    <figure className="hub-image-card">
      {url ? <img src={url} alt={item.name} loading="lazy" /> : null}
      <figcaption title={item.name}>
        {item.name}
        <span className="muted">
          {item.width}×{item.height}
        </span>
      </figcaption>
    </figure>
  );
}
