import { spawnSync } from 'node:child_process';
import { mkdir, open, readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fingerprint, isPublicFile, publicFiles } from './files.mjs';

const rootOption = process.argv.indexOf('--root');
const root = rootOption >= 0 ? path.resolve(process.argv[rootOption + 1]) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const once = process.argv.includes('--once');
const log = message => console.log(`[${new Date().toLocaleString()}] ${message}`);
process.env.GIT_TERMINAL_PROMPT = '0';
process.env.GCM_INTERACTIVE = 'Never';

function git(...args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8', windowsHide: true, timeout: 120000 });
  if (result.error || result.status !== 0) throw new Error(result.error?.message || result.stderr?.trim() || result.stdout?.trim() || `git ${args[0]} failed`);
  return result.stdout;
}

function ready() {
  if (git('branch', '--show-current').trim() !== 'main') throw new Error('Switch to main before publishing.');
  git('remote', 'get-url', 'origin');
  if (git('diff', '--name-only', '--diff-filter=U').trim()) throw new Error('Resolve Git conflicts before publishing.');
  if (git('diff', '--cached', '--name-only').trim()) throw new Error('There are already staged files. Commit or unstage them before publishing.');
}

async function publish() {
  ready();
  const current = await publicFiles(root);
  const tracked = git('ls-files', '-z').split('\0').filter(file => file && isPublicFile(file));
  const files = [...new Set([...current, ...tracked])];
  for (let i = 0; i < files.length; i += 50) git('--literal-pathspecs', 'add', '-A', '--', ...files.slice(i, i + 50));
  if (git('diff', '--cached', '--name-only').trim()) {
    git('commit', '-m', `Publish math solutions ${new Date().toISOString()}`);
    log('Saved HTML and assets to Git.');
  }
  git('push', '-u', 'origin', 'main');
  log('Uploaded. GitHub Actions will deploy to Pages.');
}

await mkdir(path.join(root, '.local'), { recursive: true });
const lockPath = path.join(root, '.local', 'watch.pid');
try {
  const pid = Number(await readFile(lockPath, 'utf8'));
  if (!Number.isSafeInteger(pid) || pid <= 0) throw new Error('Invalid old lock');
  process.kill(pid, 0);
  throw new Error(`Publisher is already running (PID ${pid}).`);
} catch (error) {
  if (error.message.startsWith('Publisher is already running')) throw error;
  if (error.code === 'EPERM') throw new Error('Cannot verify existing publisher; stop it before continuing.');
  await unlink(lockPath).catch(error => { if (error.code !== 'ENOENT') throw error; });
}
const lock = await open(lockPath, 'wx');
await lock.writeFile(String(process.pid));
await lock.close();
process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));

try {
  if (once) await publish();
  else {
    ready();
    log('Watching this folder. HTML and supported assets publish after 6 seconds without changes.');
    let candidate;
    let changedAt = 0;
    let published;
    let retryAt = 0;
    while (true) {
      try {
        const next = await fingerprint(root);
        if (next !== candidate) { candidate = next; changedAt = Date.now(); }
        if (candidate !== published && Date.now() - changedAt >= 6000 && Date.now() >= retryAt) {
          await publish();
          published = candidate;
        }
      } catch (error) {
        log(`Publish paused: ${error.message}. Retrying in 30 seconds.`);
        retryAt = Date.now() + 30000;
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await unlink(lockPath).catch(() => {});
}
