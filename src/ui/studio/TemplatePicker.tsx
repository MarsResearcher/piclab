import { useEffect, useState } from 'react';
import { listUserTemplates, type UserTemplateMeta } from '../../studio';
import { Button } from '@/components/ui/button';
import { TemplateSections } from './LiteHome';
import { useGridAwarePick, type TemplatePickHandler } from './gridAwarePick';

type Props = {
  open: boolean;
  onPick: TemplatePickHandler;
  onCancel?: () => void;
};

export function TemplatePicker({ open, onPick, onCancel }: Props) {
  const [userTemplates, setUserTemplates] = useState<UserTemplateMeta[]>([]);
  const { handlePick, gridModal } = useGridAwarePick((pick, opts) => {
    onPick(pick, opts);
  });

  useEffect(() => {
    if (!open) return;
    void listUserTemplates().then(setUserTemplates);
  }, [open]);

  if (!open) return null;

  return (
    <div className="template-picker" role="dialog" aria-modal="true">
      <div className="template-picker-backdrop" onClick={onCancel} />
      <div className="template-picker-card glass">
        <header>
          <h2 className="text-xl font-semibold text-[var(--color-studio-text)]">新建项目</h2>
          <p className="hint">L2 场景 · L1 内置模板 · L3 我的模板</p>
        </header>
        <TemplateSections onPick={handlePick} userTemplates={userTemplates} />
        {onCancel && (
          <Button variant="outline" size="sm" className="mt-4 template-cancel" onClick={onCancel}>
            取消
          </Button>
        )}
      </div>
      {gridModal}
    </div>
  );
}
