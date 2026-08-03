/** Mutable document / asset / history / project persistence stores. */
export { DocStore } from './docStore';
export { AssetStore, type Asset } from './assetStore';
export { DocHistory, type HistoryPushOpts } from './history';
export {
  coalesceKeyForNodePatch,
  type DocCommand,
} from './commands';
export {
  listProjects,
  openProject,
  createProject,
  createProjectFromDocument,
  saveActiveProject,
  scheduleProjectSave,
  flushProjectSave,
  switchScene,
  renameProject,
  removeProject,
  deleteProject,
  bootstrapProjects,
  bindProjectFlushLifecycle,
  subscribeSaveStatus,
  getSaveStatus,
  getActiveProjectMeta,
  listFolders,
  createFolder,
  renameFolder,
  deleteFolder,
  moveProjectToFolder,
  setProjectStarred,
  updateProjectThumbnail,
  ensureProjectThumbnail,
  type StudioProject,
  type ProjectMeta,
  type ProjectFolder,
  type ProjectPrefs,
  type ListProjectsOpts,
  type BootstrapResult,
  type SaveStatus,
} from './projectStore';
export {
  listUserTemplates,
  getUserTemplate,
  saveUserTemplate,
  renameUserTemplate,
  deleteUserTemplate,
  createProjectFromUserTemplate,
  createProjectFromBuiltinTemplate,
  createProjectFromScene,
  blobToThumbnailDataUrl,
  type UserTemplate,
  type UserTemplateMeta,
} from './templateStore';
