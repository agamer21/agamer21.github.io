/* Bounded, shared cache for the pinned 20 MiB game-data parts. */
globalThis.MCSMParts = (() => {
  const base = 'https://cdn.jsdelivr.net/gh/linkawaken1979-alt/mcsm-web-port@92ea4bab239286af747c00626cf3d31bf360c65f/game-files/';
  const cacheName = 'mcsm-parts-92ea4bab-v1';
  const memory = new Map(), pending = new Map(), queue = [];
  const memoryLimit = (globalThis.navigator?.deviceMemory || 4) <= 2 ? 2 : 3;
  let active = 0;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  async function acquire() {
    if (active >= 2) await new Promise(resolve => queue.push(resolve));
    else active++;
  }
  function release() {
    if (queue.length) queue.shift()();
    else active--;
  }
  function validate(bytes, index) {
    const expected = 20 * 1024 * 1024;
    if (!bytes.length || bytes.length > expected || (index < 323 && bytes.length !== expected)) {
      throw new Error('Incomplete game-data part ' + index);
    }
    return bytes;
  }
  function remember(index, bytes) {
    memory.delete(index);memory.set(index, bytes);
    while (memory.size > memoryLimit) memory.delete(memory.keys().next().value);
    return bytes;
  }
  async function load(index) {
    const url = base + 'game.data.part' + String(index).padStart(3, '0');
    let disk;
    try {
      disk = await globalThis.caches?.open(cacheName);
      const cached = await disk?.match(url);
      if (cached) {
        try { return remember(index, validate(new Uint8Array(await cached.arrayBuffer()), index)); }
        catch { await disk.delete(url); }
      }
    } catch { disk = null; } // Storage denial/quota must not prevent play.
    await acquire();
    try {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const response = await fetch(url, {signal: AbortSignal.timeout(180000), cache: attempt ? 'reload' : 'force-cache'});
          if (!response.ok) throw new Error('Game-data HTTP ' + response.status);
          const bytes = validate(new Uint8Array(await response.arrayBuffer()), index);
          if (disk) {
            try {
              await disk.put(url, new Response(bytes));
              const keys = await disk.keys();
              for (const key of keys.slice(0, Math.max(0, keys.length - 12))) await disk.delete(key);
            } catch { /* Continue from memory when storage is full. */ }
          }
          return remember(index, bytes);
        } catch (error) {
          if (attempt === 2) throw error;
          await sleep(500 * 2 ** attempt);
        }
      }
    } finally { release(); }
  }
  return {
    read(index) {
      if (!Number.isInteger(index) || index < 0 || index >= 324) return Promise.reject(new Error('Invalid game-data part'));
      if (memory.has(index)) return Promise.resolve(remember(index, memory.get(index)));
      if (!pending.has(index)) {
        const request = load(index).finally(() => pending.delete(index));
        pending.set(index, request);
      }
      return pending.get(index);
    }
  };
})();
