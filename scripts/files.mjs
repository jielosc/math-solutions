import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const extensions = new Set(['.html', '.htm', '.css', '.js', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.ico', '.pdf', '.woff', '.woff2', '.ttf', '.otf']);
const excluded = new Set(['scripts', 'tests', 'node_modules', 'private', '_site']);

export function isPublicFile(file) {
  const parts = file.replaceAll('\\', '/').split('/');
  return !parts.some(part => part.startsWith('.') || excluded.has(part)) && extensions.has(path.extname(file).toLowerCase());
}

export async function publicFiles(root) {
  const files = [];
  async function walk(folder, relative = '') {
    for (const entry of await readdir(folder, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || excluded.has(entry.name)) continue;
      const file = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isDirectory()) await walk(path.join(folder, entry.name), file);
      else if (entry.isFile() && isPublicFile(file)) files.push(file);
      // Symlinks are deliberately excluded from both upload and deployment.
    }
  }
  await walk(root);
  return files.sort();
}

export async function fingerprint(root) {
  const hash = createHash('sha256');
  for (const file of await publicFiles(root)) {
    hash.update(file).update('\0').update(await readFile(path.join(root, file))).update('\0');
  }
  return hash.digest('hex');
}
