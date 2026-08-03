/**
 * Resolve a path under `public/` with Vite `base` (e.g. `/piclab/` on GitHub Pages).
 * Absolute `/foo` breaks on project Pages — always go through this helper.
 */
export function publicUrl(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const clean = path.replace(/^\/+/, '');
  return `${base}${clean}`;
}
