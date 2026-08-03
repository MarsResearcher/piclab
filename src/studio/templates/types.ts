import type { SceneId, StudioDocument } from '../model';
import type { AssetStore } from '../store/assetStore';

export type TemplateLayer = 'builtin' | 'parametric' | 'user';

export type BuiltinBuildContext = {
  assets: AssetStore;
};

export type BuiltinTemplate = {
  id: string;
  name: string;
  description: string;
  sceneId: SceneId;
  /** Style facets — not scene names (use sceneId for category). */
  tags?: string[];
  build: (ctx: BuiltinBuildContext) => Promise<StudioDocument>;
};

export type TemplatePick =
  | {
      layer: 'parametric';
      sceneId: SceneId;
      /** Xiaohongshu card type when sceneId is xhsNote. */
      xhsCardType?: string;
      xhsTheme?: {
        skin?: string;
        palette?: string;
        bg?: string;
        typeScale?: string;
      };
    }
  | { layer: 'builtin'; templateId: string }
  | { layer: 'user'; templateId: string };
