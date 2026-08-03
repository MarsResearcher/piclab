import {
  ChevronDown,
  Download,
  Eye,
  FlaskConical,
  FolderOpen,
  Home,
  LayoutTemplate,
  Pencil,
  Scan,
  Plus,
  Redo2,
  Trash2,
  Undo2,
} from 'lucide-react';
import type { ProjectMeta, SaveStatus } from '../../studio';
import type { ExportPixelScale } from '../../studio/export';
import { displayProjectTitle, sceneLabel } from './projectDisplay';

const EXPORT_SCALE_LABEL: Record<ExportPixelScale, string> = {
  1: '标准 1×',
  2: '高清 2×',
  3: '印刷 3×',
};

type Props = {
  project: ProjectMeta | null;
  projects: ProjectMeta[];
  projectListOpen: boolean;
  saveStatus: SaveStatus;
  canUndo: boolean;
  canRedo: boolean;
  canExport: boolean;
  exportMenuOpen: boolean;
  onToggleProjectList: () => void;
  onNew: () => void;
  onOpen: (id: string) => void;
  onRename: () => void;
  onDelete: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onFit: () => void;
  onPreview: () => void;
  onExport: () => void;
  onExportAll?: () => void;
  onExportPdf?: () => void;
  onBatch: () => void;
  onToggleExportMenu: () => void;
  /** Bleed margin in mm for ZIP/PDF export (0 = off). */
  exportBleedMm?: number;
  onToggleExportBleed?: () => void;
  /** Raster scale for export (1 / 2 / 3). */
  exportPixelScale?: ExportPixelScale;
  onCycleExportScale?: () => void;
  onOpenLab?: () => void;
  onGoHome?: () => void;
  onSaveAsTemplate?: () => void;
  multiPage?: boolean;
};

function saveLabel(status: SaveStatus): string {
  switch (status) {
    case 'pending':
      return '…';
    case 'saving':
      return '…';
    case 'saved':
      return '已保存';
    case 'error':
      return '失败';
    case 'idle':
      return '';
    default: {
      const _e: never = status;
      void _e;
      return '';
    }
  }
}

export function StudioTopBar({
  project,
  projects,
  projectListOpen,
  saveStatus,
  canUndo,
  canRedo,
  canExport,
  exportMenuOpen,
  onToggleProjectList,
  onNew,
  onOpen,
  onRename,
  onDelete,
  onUndo,
  onRedo,
  onFit,
  onPreview,
  onExport,
  onExportAll,
  onExportPdf,
  onBatch,
  onToggleExportMenu,
  exportBleedMm = 0,
  onToggleExportBleed,
  exportPixelScale = 2,
  onCycleExportScale,
  onOpenLab,
  onGoHome,
  onSaveAsTemplate,
  multiPage = false,
}: Props) {
  return (
    <header className="studio-topbar glass">
      <div className="topbar-brand">
        <span className="brand">PicLab</span>
        <span className="brand-sub">Studio</span>
      </div>

      <div className="topbar-project">
        <button
          type="button"
          className="topbar-project-btn"
          onClick={onToggleProjectList}
          title={'\u9879\u76ee'}
        >
          <span className="topbar-project-name">
            {displayProjectTitle(project?.name, project?.sceneId)}
          </span>
          <span className={`save-pill save-${saveStatus}`}>{saveLabel(saveStatus)}</span>
          <ChevronDown size={14} />
        </button>
        {projectListOpen && (
          <div className="topbar-project-menu">
            <div className="topbar-project-actions">
              <button type="button" className="btn icon" title="新建" onClick={onNew}>
                <Plus size={15} />
              </button>
              <button type="button" className="btn icon" title="重命名" onClick={onRename} disabled={!project}>
                <Pencil size={14} />
              </button>
              <button type="button" className="btn icon" title="删除" onClick={onDelete} disabled={!project}>
                <Trash2 size={14} />
              </button>
              <button type="button" className="btn icon" title="打开" onClick={onToggleProjectList}>
                <FolderOpen size={14} />
              </button>
              {onSaveAsTemplate && (
                <button
                  type="button"
                  className="btn icon"
                  title="另存为模板"
                  onClick={onSaveAsTemplate}
                  disabled={!project}
                >
                  <LayoutTemplate size={14} />
                </button>
              )}
            </div>
            <ul className="project-list compact">
              {projects.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={`project-list-item ${p.id === project?.id ? 'active' : ''}`}
                    onClick={() => onOpen(p.id)}
                  >
                    <span className="project-list-name">
                      {displayProjectTitle(p.name, p.sceneId)}
                    </span>
                    <span className="project-list-sub muted">{sceneLabel(p.sceneId)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="topbar-actions">
        {onGoHome && (
          <button type="button" className="btn icon" onClick={onGoHome} title="主页">
            <Home size={16} />
          </button>
        )}
        <button type="button" className="btn icon" disabled={!canUndo} onClick={onUndo} title="撤销">
          <Undo2 size={16} />
        </button>
        <button type="button" className="btn icon" disabled={!canRedo} onClick={onRedo} title="重做">
          <Redo2 size={16} />
        </button>
        <button type="button" className="btn icon" onClick={onFit} title="适应画布">
          <Scan size={16} />
        </button>
        <span className="topbar-sep" />
        <button type="button" className="btn icon" onClick={onPreview} disabled={!canExport} title="预览">
          <Eye size={16} />
        </button>
        <div className="topbar-export">
          <button
            type="button"
            className="btn icon primary-icon"
            disabled={!canExport}
            onClick={onExport}
            title="导出"
          >
            <Download size={16} />
          </button>
          <button
            type="button"
            className="btn icon"
            disabled={!canExport}
            onClick={onToggleExportMenu}
            title="更多导出"
          >
            <ChevronDown size={14} />
          </button>
          {exportMenuOpen && (
            <div className="topbar-export-menu">
              <button type="button" onClick={onExport}>
                {'\u5bfc\u51fa\u5f53\u524d\u9762'}
              </button>
              {onExportAll && (
                <button type="button" onClick={onExportAll}>
                  {multiPage ? '\u5168\u90e8\u9762 ZIP' : '\u5bfc\u51fa ZIP'}
                </button>
              )}
              {onExportPdf && (
                <button type="button" onClick={onExportPdf}>
                  {'\u5bfc\u51fa PDF'}
                  {multiPage ? '\uff08\u591a\u9875\uff09' : ''}
                </button>
              )}
              {onCycleExportScale && (
                <button type="button" className="active" onClick={onCycleExportScale}>
                  {`\u5206\u8fa8\u7387 \u00b7 ${EXPORT_SCALE_LABEL[exportPixelScale]}`}
                </button>
              )}
              {onToggleExportBleed && (
                <button
                  type="button"
                  className={exportBleedMm > 0 ? 'active' : ''}
                  onClick={onToggleExportBleed}
                >
                  {exportBleedMm > 0
                    ? `\u51fa\u8840 ${exportBleedMm}mm \u00b7 \u5f00`
                    : '\u51fa\u8840 3mm \u00b7 \u5173'}
                </button>
              )}
              <button type="button" onClick={onBatch}>
                {'\u6279\u91cf\u5c3a\u5bf8'}
              </button>
            </div>
          )}
        </div>
        {onOpenLab && (
          <button type="button" className="btn icon" onClick={onOpenLab} title="实验室">
            <FlaskConical size={16} />
          </button>
        )}
      </div>
    </header>
  );
}
