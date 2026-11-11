import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
import { commonFiles, resourceNames } from '../../geometry-dash/resource-names.mjs';
import { levels } from '../../geometry-dash/library.mjs';
import { readResourceZip } from '../../geometry-dash/resource-zip.mjs';

const [archivePath, output] = process.argv.slice(2);
const archive = await readFile(archivePath);
const expected = '583193d635535b63be863c0aa6f815a27553edefeb38de943624f14014505a80';
if (createHash('sha256').update(archive).digest('hex') !== expected) {
  throw new Error('Geometry Dash release asset failed its checksum check.');
}
const resources = await readResourceZip(new Blob([archive]), resourceNames);
for (const name of [...commonFiles, levels[0].path, levels[0].song]) {
  if (!resources.has(name)) throw new Error('Missing required Geometry Dash resource ' + name);
}
await Promise.all([...resources].map(async ([name, blob]) => {
  const destination = join(output, 'release-assets', name);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, Buffer.from(await blob.arrayBuffer()));
}));
await writeFile(join(output, 'release-resources.json'), JSON.stringify({ files: [...resources.keys()] }));
