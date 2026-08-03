/**
 * Push current git HEAD to GitHub via REST Git Data API (api.github.com).
 * Skips .github/workflows/* (requires workflow OAuth scope).
 *
 * Usage: node scripts/api-push.mjs [branch]
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

const OWNER = 'MarsResearcher';
const REPO = 'piclab';
const BRANCH = process.argv[2] ?? 'master';
const TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
if (!TOKEN) {
  console.error('Set GH_TOKEN (e.g. gh auth token)');
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
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${text.slice(0, 500)}`);
  }
  return json;
}

function listFiles() {
  const out = execSync('git ls-files -z', { encoding: 'buffer' });
  return out
    .toString('utf8')
    .split('\0')
    .filter(Boolean)
    .filter((p) => !p.startsWith('.github/workflows/'));
}

async function createBlob(path) {
  const buf = readFileSync(path);
  const isText = !/\.(png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|mp3|mp4|wasm|bin)$/i.test(path);
  // Prefer base64 for everything to avoid encoding issues
  const content = buf.toString('base64');
  const blob = await api('POST', `/repos/${OWNER}/${REPO}/git/blobs`, {
    content,
    encoding: 'base64',
  });
  return { path, mode: '100644', type: 'blob', sha: blob.sha };
}

async function main() {
  const files = listFiles();
  console.log(`Uploading ${files.length} blobs to ${OWNER}/${REPO}@${BRANCH}…`);

  const tree = [];
  const concurrency = 6;
  let i = 0;
  async function worker() {
    while (i < files.length) {
      const idx = i++;
      const path = files[idx];
      process.stdout.write(`\r  blob ${idx + 1}/${files.length}: ${basename(path)}          `);
      tree[idx] = await createBlob(path);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  console.log('\nCreating tree…');

  // GitHub tree API accepts max ~1000 entries; we have ~449 — fine in one call
  const treeRes = await api('POST', `/repos/${OWNER}/${REPO}/git/trees`, {
    tree: tree.map(({ path, mode, type, sha }) => ({ path, mode, type, sha })),
  });

  const message = execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim() || 'Initial import';
  console.log('Creating commit…');
  const commit = await api('POST', `/repos/${OWNER}/${REPO}/git/commits`, {
    message,
    tree: treeRes.sha,
    parents: [],
  });

  console.log(`Updating ref refs/heads/${BRANCH}…`);
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

  console.log(`Done: ${commit.sha}`);
  console.log(`https://github.com/${OWNER}/${REPO}/tree/${BRANCH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
