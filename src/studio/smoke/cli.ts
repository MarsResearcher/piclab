import { assertOfflineSmoke } from './offlinePath';

// tsx 以 cjs 运行时，Top-level await 不可用 → 用 .then 驱动。
assertOfflineSmoke().then(
  () => process.exit(0),
  (err: unknown) => {
    // eslint-disable-next-line no-console
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  },
);
