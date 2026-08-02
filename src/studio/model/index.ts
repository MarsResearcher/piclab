/** Document model — pure data types, no I/O or rendering. */
export * from './types';
export {
  DOCUMENT_SCHEMA_VERSION,
  migrateDocument,
  validateDocument,
  type DocumentValidation,
} from './migrate';
