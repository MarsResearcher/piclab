/**
 * Offline critical-path smoke checks (no network).
 * Run via: npm run smoke
 */
import {
  DOCUMENT_SCHEMA_VERSION,
  createId,
  identityTransform,
  migrateDocument,
  validateDocument,
  type InkNode,
  type StudioDocument,
  type TextNode,
} from '../model';
import { hitInkLocal, inkLocalBounds } from '../engine/inkGeometry';
import { measureTextBounds } from '../engine/textMetrics';
import { runTransformInvariantChecks } from '../engine/transformInvariants';
import { getScene, listScenes, registerBuiltinTools } from '../plugins/host';
import { listBuiltinTemplates } from '../templates';
import {
  XHS_CARD_TYPES,
  applyXhsTheme,
  buildXhsCardDocument,
  buildXhsSuiteDocument,
  getXhsPalette,
  resolveXhsTheme,
} from '../templates';
import { getNodeStrategy } from '../engine/nodeStrategies';
import { assertProjectFolderFilters } from '../store/projectFolders.selftest';

export type SmokeResult = { name: string; ok: boolean; detail?: string };

export function runOfflineSmoke(): SmokeResult[] {
  registerBuiltinTools();
  const results: SmokeResult[] = [];

  const scenes = listScenes();
  results.push({
    name: 'scenes-registered',
    ok: scenes.length >= 5,
    detail: `count=${scenes.length}`,
  });

  // Geometry-only scenes must construct offline without ImageData / DOM assets.
  for (const id of ['tianzige', 'pinyin', 'calligraphy'] as const) {
    const scene = getScene(id);
    if (!scene) {
      results.push({ name: `scene:${id}`, ok: false, detail: 'missing' });
      continue;
    }
    try {
      const doc =
        id === 'tianzige'
          ? scene.createDocument({ pageCount: 2, rows: 8, cols: 6 })
          : scene.createDocument({});
      const pagesOk = doc.pages.length >= (id === 'tianzige' ? 2 : 1);
      const frameId = doc.pages[0]?.frameIds[0];
      const frame = frameId ? doc.nodes[frameId] : null;
      const frameOk = !!frame && frame.type === 'frame';
      results.push({
        name: `scene:${id}`,
        ok: pagesOk && frameOk,
        detail: `pages=${doc.pages.length} nodes=${Object.keys(doc.nodes).length}`,
      });
    } catch (e) {
      results.push({
        name: `scene:${id}`,
        ok: false,
        detail: e instanceof Error ? e.message : String(e),
      });
    }
  }

  for (const id of ['card', 'poster', 'ad', 'social'] as const) {
    const scene = getScene(id);
    results.push({
      name: `scene-registered:${id}`,
      ok: !!scene?.exportHints?.length,
      detail: scene ? `hints=${scene.exportHints!.length}` : 'missing',
    });
  }

  try {
    const builtins = listBuiltinTemplates();
    const wechat = builtins.filter((t) => t.sceneId === 'wechatCover');
    const xhs = builtins.filter((t) => t.sceneId === 'xhsNote');
    results.push({
      name: 'builtin-templates',
      ok: builtins.length >= 15 && builtins.every((t) => t.sceneId && t.build),
      detail: `count=${builtins.length}`,
    });
    const xhsCards = xhs.filter((t) => t.id.startsWith('builtin-xhs-card-'));
    const xhsSuites = xhs.filter((t) => t.id.startsWith('builtin-xhs-suite-'));
    const xhsSigs = xhs.filter((t) => t.tags?.includes('签名'));
    const catTags = ['生活', '氛围', '旅行', '知识', '种草', '手账'] as const;
    const catsOk = catTags.every((c) => xhsSigs.some((t) => t.tags?.includes(c)));
    const dryGoods = xhs.filter((t) => t.tags?.includes('文字干货'));
    results.push({
      name: 'wechat-xhs-templates',
      ok: wechat.length >= 3 && xhsCards.length >= 12 && xhsSuites.length >= 2,
      detail: `wechat=${wechat.length} xhsCards=${xhsCards.length} xhsSuites=${xhsSuites.length} xhs=${xhs.length}`,
    });
    results.push({
      name: 'xhs-signatures',
      ok: xhsSigs.length >= 12 && catsOk && dryGoods.length >= 12,
      detail: `sigs=${xhsSigs.length} catsOk=${catsOk} dryGoods=${dryGoods.length}`,
    });
  } catch (e) {
    results.push({
      name: 'builtin-templates',
      ok: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }

  for (const id of ['wechatCover', 'xhsNote'] as const) {
    const scene = getScene(id);
    results.push({
      name: `scene-${id}`,
      ok: !!scene?.exportHints?.length,
      detail: scene
        ? `${scene.label} hints=${scene.exportHints!.length}`
        : 'missing',
    });
  }

  try {
    const xhsScene = getScene('xhsNote');
    const blank = xhsScene!.createDocument({ xhsCardType: 'cover' });
    const blankFrame = blank.pages[0]?.frameIds[0]
      ? blank.nodes[blank.pages[0]!.frameIds[0]!]
      : null;
    const blankOk =
      blank.pages.length === 1 &&
      blankFrame?.type === 'frame' &&
      blankFrame.width === 1080 &&
      blankFrame.height === 1440 &&
      blankFrame.name.startsWith('xhs:cover');

    let cardsOk = true;
    for (const meta of XHS_CARD_TYPES) {
      const doc = buildXhsCardDocument(meta.id, {
        skin: 'classic',
        palette: 'peach',
        bg: 'solid',
        typeScale: 'md',
      });
      const fid = doc.pages[0]?.frameIds[0];
      const frame = fid ? doc.nodes[fid] : null;
      if (!frame || frame.type !== 'frame' || frame.children.length < 3) {
        cardsOk = false;
        break;
      }
    }

    const suite = buildXhsSuiteDocument(
      ['cover', 'summary', 'steps', 'ending'],
      { skin: 'classic', palette: 'mistBlue', bg: 'solid', typeScale: 'md' },
      'smoke-suite',
    );
    const theme = resolveXhsTheme({
      skin: 'bigType',
      palette: 'night',
      bg: 'solid',
      typeScale: 'lg',
    });
    applyXhsTheme(suite, theme);
    const suiteFrameId = suite.pages[0]?.frameIds[0];
    const suiteFrame = suiteFrameId ? suite.nodes[suiteFrameId] : null;
    const nightBg = getXhsPalette('night').bg;
    const themeOk =
      suite.pages.length === 4 &&
      suiteFrame?.type === 'frame' &&
      suiteFrame.fill === nightBg;

    results.push({
      name: 'xhs-note-system',
      ok: blankOk && cardsOk && themeOk && XHS_CARD_TYPES.length >= 12,
      detail: `blank=${blankOk} cards=${cardsOk} suitePages=${suite.pages.length} themeOk=${themeOk}`,
    });
  } catch (e) {
    results.push({
      name: 'xhs-note-system',
      ok: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }

  results.push({
    name: 'navigator-offline-safe',
    ok: typeof navigator === 'undefined' || typeof navigator.onLine === 'boolean',
    detail: typeof navigator !== 'undefined' ? `onLine=${navigator.onLine}` : 'node',
  });

  try {
    const scene = getScene('tianzige');
    const raw = scene!.createDocument({});
    delete (raw as { schemaVersion?: number }).schemaVersion;
    const migrated = migrateDocument(raw);
    const check = validateDocument(migrated);
    results.push({
      name: 'schema-migrate',
      ok: migrated.schemaVersion === DOCUMENT_SCHEMA_VERSION && check.ok,
      detail: `v=${migrated.schemaVersion} errors=${check.errors.length}`,
    });
  } catch (e) {
    results.push({
      name: 'schema-migrate',
      ok: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }

  for (const r of runTransformInvariantChecks()) {
    results.push(r);
  }

  // Ink geometry + strategy registration + schema v4 ink normalize
  try {
    const ink: InkNode = {
      id: createId('ink'),
      name: 'stroke',
      type: 'ink',
      visible: true,
      locked: false,
      opacity: 1,
      parentId: null,
      transform: identityTransform(10, 10),
      points: [
        { x: 0, y: 0 },
        { x: 40, y: 0 },
        { x: 40, y: 30 },
      ],
      stroke: '#111',
      strokeWidth: 4,
      brush: 'pen',
    };
    const b = inkLocalBounds(ink);
    const hit = hitInkLocal(ink, 20, 0);
    const miss = hitInkLocal(ink, 200, 200);
    const strat = getNodeStrategy('ink');
    results.push({
      name: 'ink-geometry',
      ok: b.w > 30 && b.h > 20 && hit && !miss && strat.type === 'ink',
      detail: `bounds=${Math.round(b.w)}x${Math.round(b.h)} hit=${hit}`,
    });

    const frameId = 'frame_smoke';
    const pageId = 'page_smoke';
    const doc: StudioDocument = {
      id: 'doc_smoke',
      name: 'smoke',
      pages: [{ id: pageId, name: 'Page', frameIds: [frameId] }],
      activePageId: pageId,
      nodes: {
        [frameId]: {
          id: frameId,
          name: 'Frame',
          type: 'frame',
          visible: true,
          locked: false,
          opacity: 1,
          parentId: null,
          transform: identityTransform(),
          width: 400,
          height: 300,
          children: [ink.id],
        },
        [ink.id]: { ...ink, parentId: frameId },
      },
      selection: [],
    };
    delete (doc as { schemaVersion?: number }).schemaVersion;
    const migrated = migrateDocument(doc);
    const check = validateDocument(migrated);
    const inkOk = migrated.nodes[ink.id]?.type === 'ink';
    results.push({
      name: 'ink-schema-migrate',
      ok: migrated.schemaVersion === DOCUMENT_SCHEMA_VERSION && check.ok && inkOk,
      detail: `v=${migrated.schemaVersion} ink=${inkOk}`,
    });
  } catch (e) {
    results.push({
      name: 'ink-checks',
      ok: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }

  // Vertical text: upright columns, `\n` → new column (RTL).
  try {
    const base = {
      id: 't-v',
      name: '竖排',
      type: 'text' as const,
      visible: true,
      locked: false,
      opacity: 1,
      parentId: null,
      transform: identityTransform(0, 0),
      content: '在山野',
      fontSize: 48,
      fontFamily: 'sans-serif',
      color: '#111111',
      strokeColor: '#000000',
      strokeWidth: 0,
      bold: true,
      align: 'center' as const,
      lineHeight: 1.2,
      writingMode: 'vertical' as const,
    } satisfies TextNode;

    // Vertical metrics are pure geometry (no canvas / DOM).
    const single = measureTextBounds(base);
    const dual: TextNode = { ...base, content: '甲乙\n丙丁戊' };
    const twoCol = measureTextBounds(dual);

    const singleOk =
      single.w > 0 &&
      single.h > 0 &&
      single.h > single.w * 1.5; // tall column
    const colsWider = twoCol.w > single.w * 1.4;

    results.push({
      name: 'vertical-text-bounds',
      ok: singleOk && colsWider,
      detail: `single=${Math.round(single.w)}x${Math.round(single.h)} dual=${Math.round(twoCol.w)}x${Math.round(twoCol.h)}`,
    });

    const migratedText = migrateDocument({
      id: 'doc-vtext',
      name: 'vtext',
      schemaVersion: 4,
      pages: [{ id: 'p1', name: '1', frameIds: ['f1'] }],
      activePageId: 'p1',
      nodes: {
        f1: {
          id: 'f1',
          name: 'frame',
          type: 'frame',
          visible: true,
          locked: false,
          opacity: 1,
          parentId: null,
          transform: identityTransform(),
          width: 400,
          height: 300,
          children: ['t1'],
        },
        t1: { ...base, id: 't1', parentId: 'f1', writingMode: undefined },
      },
      selection: [],
    } as StudioDocument);
    const t1 = migratedText.nodes.t1;
    const modeOk =
      !!t1 &&
      t1.type === 'text' &&
      (t1 as TextNode).writingMode === 'horizontal' &&
      migratedText.schemaVersion === 5;
    results.push({
      name: 'writingMode-migrate-v5',
      ok: modeOk,
      detail: `v=${migratedText.schemaVersion} mode=${t1 && t1.type === 'text' ? t1.writingMode : '?'}`,
    });
  } catch (e) {
    results.push({
      name: 'vertical-text',
      ok: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }

  try {
    assertProjectFolderFilters();
    results.push({ name: 'project-folder-filters', ok: true });
  } catch (e) {
    results.push({
      name: 'project-folder-filters',
      ok: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }

  return results;
}

export function assertOfflineSmoke(): void {
  const results = runOfflineSmoke();
  const failed = results.filter((r) => !r.ok);
  for (const r of results) {
    const mark = r.ok ? 'PASS' : 'FAIL';
    // eslint-disable-next-line no-console
    console.log(`[smoke] ${mark} ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
  }
  if (failed.length) {
    throw new Error(`Offline smoke failed: ${failed.map((f) => f.name).join(', ')}`);
  }
}
