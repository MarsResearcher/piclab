import {
  createId,
  isFrame,
  isGroup,
  isImage,
  type SceneNode,
  type StudioDocument,
} from '../model';

/** Deep-clone a document with fresh ids for pages, nodes, and optional asset remapping. */
export function remapDocumentIds(
  doc: StudioDocument,
  assetIdMap?: Map<string, string>,
): StudioDocument {
  const idMap = new Map<string, string>();
  idMap.set(doc.id, createId('doc'));

  for (const page of doc.pages) {
    idMap.set(page.id, createId('page'));
    for (const frameId of page.frameIds) {
      if (!idMap.has(frameId)) idMap.set(frameId, createId('frame'));
    }
  }

  for (const oldId of Object.keys(doc.nodes)) {
    if (!idMap.has(oldId)) {
      idMap.set(oldId, createId(doc.nodes[oldId]!.type));
    }
  }

  const pages = doc.pages.map((page) => ({
    ...page,
    id: idMap.get(page.id)!,
    frameIds: page.frameIds.map((fid) => idMap.get(fid)!),
  }));

  const nodes: Record<string, SceneNode> = {};
  for (const [oldId, node] of Object.entries(doc.nodes)) {
    const next = structuredClone(node);
    next.id = idMap.get(oldId)!;
    next.parentId = next.parentId ? idMap.get(next.parentId) ?? null : null;
    if (isFrame(next) || isGroup(next)) {
      next.children = next.children.map((cid) => idMap.get(cid)!);
    }
    if (isImage(next) && assetIdMap?.has(next.assetId)) {
      next.assetId = assetIdMap.get(next.assetId)!;
    }
    nodes[next.id] = next;
  }

  return {
    ...structuredClone(doc),
    id: idMap.get(doc.id)!,
    pages,
    activePageId: idMap.get(doc.activePageId) ?? pages[0]!.id,
    nodes,
    selection: doc.selection.map((sid) => idMap.get(sid)!).filter(Boolean),
  };
}
