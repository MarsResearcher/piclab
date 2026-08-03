import { useCallback, useState, type ReactNode } from 'react';
import { listScenes, type SceneId, type TemplatePick } from '../../studio';
import { GridParamsModal, isPrintGridScene, type GridParams } from './GridParamsModal';

export type SceneCreatePickOpts = GridParams & {
  fromImage?: ImageData;
  name?: string;
};

export type TemplatePickHandler = (
  pick: TemplatePick,
  opts?: SceneCreatePickOpts,
) => void;

/**
 * Intercepts print-grid scene picks and shows GridParamsModal before creating.
 */
export function useGridAwarePick(onPick: TemplatePickHandler): {
  handlePick: (pick: TemplatePick) => void;
  gridModal: ReactNode;
} {
  const [pending, setPending] = useState<{ sceneId: SceneId; label: string } | null>(null);

  const handlePick = useCallback((pick: TemplatePick) => {
    if (pick.layer === 'parametric' && isPrintGridScene(pick.sceneId)) {
      const label = listScenes().find((s) => s.id === pick.sceneId)?.label ?? pick.sceneId;
      setPending({ sceneId: pick.sceneId, label });
      return;
    }
    onPick(pick);
  }, [onPick]);

  const gridModal = pending ? (
    <GridParamsModal
      sceneId={pending.sceneId}
      sceneLabel={pending.label}
      onCancel={() => setPending(null)}
      onConfirm={(params) => {
        const sceneId = pending.sceneId;
        setPending(null);
        onPick({ layer: 'parametric', sceneId }, params);
      }}
    />
  ) : null;

  return { handlePick, gridModal };
}
