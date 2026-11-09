const LIMIT = 96 * 1024 * 1024;
const decoder = new TextDecoder();
const crcTable = Uint32Array.from({ length: 256 }, (_, value) => {
  for (let bit = 0; bit < 8; bit++) value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
  return value;
});

function checksum(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 255];
  return (crc ^ 0xffffffff) >>> 0;
}

async function directory(archive) {
  const start = Math.max(0, archive.size - 65557);
  const tail = new DataView(await archive.slice(start).arrayBuffer());
  for (let end = tail.byteLength - 22; end >= 0; end--) {
    if (tail.getUint32(end, true) !== 0x06054b50 ||
        end + 22 + tail.getUint16(end + 20, true) !== tail.byteLength) continue;
    const entries = tail.getUint16(end + 10, true);
    const length = tail.getUint32(end + 12, true);
    const offset = tail.getUint32(end + 16, true);
    if (tail.getUint32(end + 4, true) || entries !== tail.getUint16(end + 8, true) ||
        entries === 0xffff || length > 8 * 1024 * 1024 || offset + length > start + end) {
      throw new Error('Use a standard ZIP file with a single volume.');
    }
    return { entries, offset, bytes: new DataView(await archive.slice(offset, offset + length).arrayBuffer()) };
  }
  throw new Error('This file is not a readable ZIP archive.');
}

function resourcePath(name, accepted) {
  const path = name.toLowerCase().split('/');
  if (path.some(part => part === '.' || part === '..')) return undefined;
  const whole = path.join('/');
  if (accepted.has(whole)) return whole;
  const root = path.lastIndexOf('resources');
  const relative = path.slice(root + 1).join('/');
  return root >= 0 && accepted.has(relative) ? relative : undefined;
}

async function extract(archive, entry, directoryOffset) {
  const header = new DataView(await archive.slice(entry.offset, entry.offset + 30).arrayBuffer());
  if (header.byteLength !== 30 || header.getUint32(0, true) !== 0x04034b50 ||
      header.getUint16(8, true) !== entry.method) throw new Error('The ZIP contains an invalid file header.');
  const start = entry.offset + 30 + header.getUint16(26, true) + header.getUint16(28, true);
  if (start + entry.compressed > directoryOffset) throw new Error('The ZIP contains an invalid file range.');
  const input = archive.slice(start, start + entry.compressed);
  const stream = entry.method === 0 ? input.stream() : input.stream().pipeThrough(new DecompressionStream('deflate-raw'));
  const reader = stream.getReader();
  const bytes = new Uint8Array(entry.size);
  let position = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (position + value.length > bytes.length) throw new Error('A ZIP entry exceeded its declared size.');
      bytes.set(value, position);
      position += value.length;
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  if (position !== bytes.length || checksum(bytes) !== entry.crc) throw new Error('A game file in this ZIP is damaged.');
  const type = { mp3: 'audio/mpeg', ogg: 'audio/ogg', png: 'image/png' }[entry.path.split('.').at(-1)] || 'text/plain';
  return new Blob([bytes], { type });
}

export async function readResourceZip(archive, accepted) {
  const { entries, offset, bytes } = await directory(archive);
  const found = new Map();
  let cursor = 0;
  let total = 0;
  for (let i = 0; i < entries; i++) {
    if (cursor + 46 > bytes.byteLength || bytes.getUint32(cursor, true) !== 0x02014b50) {
      throw new Error('The ZIP directory is damaged.');
    }
    const nameLength = bytes.getUint16(cursor + 28, true);
    const next = cursor + 46 + nameLength + bytes.getUint16(cursor + 30, true) + bytes.getUint16(cursor + 32, true);
    if (next > bytes.byteLength) throw new Error('The ZIP directory is incomplete.');
    const path = resourcePath(decoder.decode(new Uint8Array(bytes.buffer, cursor + 46, nameLength)), accepted);
    if (path) {
      const flags = bytes.getUint16(cursor + 8, true);
      const method = bytes.getUint16(cursor + 10, true);
      const size = bytes.getUint32(cursor + 24, true);
      total += size;
      if (flags & 1 || (method !== 0 && method !== 8)) throw new Error('Use an unencrypted ZIP with standard compression.');
      if (total > LIMIT || found.has(path)) throw new Error('The ZIP has oversized or duplicate game files.');
      found.set(path, {
        path, method, size, crc: bytes.getUint32(cursor + 16, true),
        compressed: bytes.getUint32(cursor + 20, true), offset: bytes.getUint32(cursor + 42, true),
      });
    }
    cursor = next;
  }
  if (!found.size) throw new Error('No Geometry Dash resources were found in this ZIP.');
  const result = new Map();
  for (const [path, entry] of found) result.set(path, await extract(archive, entry, offset));
  return result;
}
