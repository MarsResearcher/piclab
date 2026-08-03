import { useState } from 'react';
import type { SceneCreateOptions, SceneId } from '../../studio';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type GridParams = Pick<
  SceneCreateOptions,
  'rows' | 'cols' | 'pageCount' | 'marginMm' | 'gridStyle'
>;

type Props = {
  sceneId: SceneId;
  sceneLabel: string;
  onConfirm: (params: GridParams) => void;
  onCancel: () => void;
};

const PRINT = new Set<SceneId>(['tianzige', 'pinyin', 'calligraphy']);

export function isPrintGridScene(id: SceneId): boolean {
  return PRINT.has(id);
}

export function GridParamsModal({ sceneId, sceneLabel, onConfirm, onCancel }: Props) {
  const isPinyin = sceneId === 'pinyin';
  const isCalligraphy = sceneId === 'calligraphy';

  const [rows, setRows] = useState(isPinyin ? 12 : 10);
  const [cols, setCols] = useState(isCalligraphy ? 8 : 8);
  const [pageCount, setPageCount] = useState(1);
  const [marginMm, setMarginMm] = useState(15);
  const [gridStyle, setGridStyle] = useState<'mizi' | 'shuge'>('mizi');

  return (
    <div className="grid-params-modal" role="dialog" aria-modal="true">
      <div className="grid-params-backdrop" onClick={onCancel} />
      <div className="grid-params-card glass">
        <header>
          <h2>{sceneLabel}</h2>
          <p className="hint">参数生成 · 完全离线 · A4</p>
        </header>

        <div className="grid-params-fields">
          {isCalligraphy && (
            <div className="grid-params-style">
              <Label>样式</Label>
              <div className="grid-params-style-row">
                <button
                  type="button"
                  className={gridStyle === 'mizi' ? 'active' : ''}
                  onClick={() => setGridStyle('mizi')}
                >
                  米字格
                </button>
                <button
                  type="button"
                  className={gridStyle === 'shuge' ? 'active' : ''}
                  onClick={() => setGridStyle('shuge')}
                >
                  竖格
                </button>
              </div>
            </div>
          )}

          {!isCalligraphy || gridStyle === 'mizi' ? (
            <div className="grid-params-row">
              <Label htmlFor="gp-rows">{isPinyin ? '行带数' : '行数'}</Label>
              <Input
                id="gp-rows"
                type="number"
                min={4}
                max={24}
                value={rows}
                onChange={(e) => setRows(Number(e.target.value) || 8)}
              />
            </div>
          ) : null}

          {(!isPinyin && (!isCalligraphy || gridStyle === 'mizi' || gridStyle === 'shuge')) && (
            <div className="grid-params-row">
              <Label htmlFor="gp-cols">{isCalligraphy && gridStyle === 'shuge' ? '列数' : '列数'}</Label>
              <Input
                id="gp-cols"
                type="number"
                min={4}
                max={20}
                value={cols}
                onChange={(e) => setCols(Number(e.target.value) || 8)}
              />
            </div>
          )}

          <div className="grid-params-row">
            <Label htmlFor="gp-pages">页数</Label>
            <Input
              id="gp-pages"
              type="number"
              min={1}
              max={30}
              value={pageCount}
              onChange={(e) => setPageCount(Number(e.target.value) || 1)}
            />
          </div>

          <div className="grid-params-row">
            <Label htmlFor="gp-margin">页边距 (mm)</Label>
            <Input
              id="gp-margin"
              type="number"
              min={8}
              max={30}
              value={marginMm}
              onChange={(e) => setMarginMm(Number(e.target.value) || 15)}
            />
          </div>
        </div>

        <footer className="grid-params-actions">
          <Button type="button" variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button
            type="button"
            onClick={() => {
              const params: GridParams = {
                pageCount: Math.min(30, Math.max(1, Math.round(pageCount))),
                marginMm: Math.min(30, Math.max(8, Math.round(marginMm))),
              };
              if (isPinyin) {
                params.rows = Math.min(24, Math.max(4, Math.round(rows)));
              } else if (isCalligraphy) {
                params.gridStyle = gridStyle;
                params.cols = Math.min(20, Math.max(4, Math.round(cols)));
                if (gridStyle === 'mizi') {
                  params.rows = Math.min(24, Math.max(4, Math.round(rows)));
                }
              } else {
                params.rows = Math.min(24, Math.max(4, Math.round(rows)));
                params.cols = Math.min(20, Math.max(4, Math.round(cols)));
              }
              onConfirm(params);
            }}
          >
            生成练习纸
          </Button>
        </footer>
      </div>
    </div>
  );
}
