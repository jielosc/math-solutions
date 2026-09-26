import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { publicFiles } from './files.mjs';

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export async function build(root = defaultRoot) {
  const output = path.join(root, '_site');
  const files = await publicFiles(root);
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  for (const file of files) {
    await mkdir(path.dirname(path.join(output, file)), { recursive: true });
    await cp(path.join(root, file), path.join(output, file));
  }
  await writeFile(path.join(output, '.nojekyll'), '');
  console.log(`Built ${files.length} public files in ${output}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await build(process.argv[2] ? path.resolve(process.argv[2]) : defaultRoot);
}
