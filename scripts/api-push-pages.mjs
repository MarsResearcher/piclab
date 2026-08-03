/**
 * Push local dist/ to gh-pages branch via Git Data API for GitHub Pages.
 * Usage: node scripts/api-push-pages.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, basename } from 'node:path';

const OWNER = 'MarsResearcher';
const REPO = 'piclab';
const BRANCH = 'gh-pages';
const DIST = 'dist';
const TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
if (!TOKEN) {
  console.error('Set GH_TOKEN');
  process.exit(1);
}

const API = 'https://api.github.com';

async function api(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : null;
}

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

async function main() {
  const files = walk(DIST);
  console.log(`Uploading ${files.length} files from ${DIST} → ${BRANCH}`);
  const tree = [];
  let i = 0;
  const concurrency = 6;
  async function worker() {
    while (i < files.length) {
      const idx = i++;
      const abs = files[idx];
      const path = relative(DIST, abs).replaceAll('\\', '/');
      process.stdout.write(`\r  ${idx + 1}/${files.length} ${basename(path)}    `);
      const content = readFileSync(abs).toString('base64');
      const blob = await api('POST', `/repos/${OWNER}/${REPO}/git/blobs`, {
        content,
        encoding: 'base64',
      });
      tree[idx] = { path, mode: '100644', type: 'blob', sha: blob.sha };
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  console.log('\nTree + commit…');
  // .nojekyll so Pages serves underscored paths
  const nojekyll = await api('POST', `/repos/${OWNER}/${REPO}/git/blobs`, {
    content: '',
    encoding: 'utf-8',
  });
  tree.push({ path: '.nojekyll', mode: '100644', type: 'blob', sha: nojekyll.sha });

  const treeRes = await api('POST', `/repos/${OWNER}/${REPO}/git/trees`, { tree });
  const commit = await api('POST', `/repos/${OWNER}/${REPO}/git/commits`, {
    message: 'Deploy GitHub Pages from local build',
    tree: treeRes.sha,
    parents: [],
  });
  try {
    await api('PATCH', `/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, {
      sha: commit.sha,
      force: true,
    });
  } catch {
    await api('POST', `/repos/${OWNER}/${REPO}/git/refs`, {
      ref: `refs/heads/${BRANCH}`,
      sha: commit.sha,
    });
  }
  console.log(`Done gh-pages ${commit.sha}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
