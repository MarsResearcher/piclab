import type { Experiment } from '../core/experiment';
import type { AppMode } from '../core/appMode';
import { ModeSwitcher } from './ModeSwitcher';

type Props = {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  playgrounds: Experiment[];
  principles: Experiment[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onOpenLibrary: () => void;
  libraryCount?: number;
};

export function Toolbar({
  mode,
  onModeChange,
  playgrounds,
  principles,
  activeId,
  onSelect,
  onOpenLibrary,
  libraryCount = 0,
}: Props) {
  return (
    <aside className="panel toolbar glass">
      <header className="panel-header">
        <span className="brand">PicLab</span>
        <span className="brand-sub">lab</span>
      </header>

      <ModeSwitcher mode={mode} onChange={onModeChange} />

      {mode === 'make' && (
        <section className="toolbar-group make-rail">
          <h3>制作</h3>
          <p className="rail-copy">
            图像编辑器。双击画布加字，拖动定位；右侧调色 / 滤镜 / 裁剪 / 导出。
          </p>
          <ul className="make-checklist">
            <li>双击画布 → 编辑文字</li>
            <li>一键滤镜 → 细调固化</li>
            <li>裁剪构图 → 旋转翻转</li>
            <li>导出 / 批量平台尺寸</li>
          </ul>
        </section>
      )}

      {mode === 'play' && (
        <section className="toolbar-group">
          <h3>玩法</h3>
          <ul>
            {playgrounds.map((exp) => (
              <li key={exp.id}>
                <button
                  type="button"
                  className={exp.id === activeId ? 'active' : ''}
                  onClick={() => onSelect(exp.id)}
                  title={exp.description}
                >
                  <span className="exp-name">{exp.name}</span>
                  <span className="exp-id">{exp.description}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {mode === 'learn' && (
        <section className="toolbar-group principles">
          <h3>原理模块</h3>
          <ul>
            {principles.map((exp) => (
              <li key={exp.id}>
                <button
                  type="button"
                  className={exp.id === activeId ? 'active' : ''}
                  onClick={() => onSelect(exp.id)}
                  title={exp.description}
                >
                  <span className="exp-name">{exp.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="toolbar-foot">
        <button type="button" className="btn library-toggle" onClick={onOpenLibrary}>
          图库{libraryCount > 0 ? ` · ${libraryCount}` : ''}
        </button>
      </div>
    </aside>
  );
}
