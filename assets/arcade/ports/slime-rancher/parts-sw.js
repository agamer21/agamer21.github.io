const revision = 'eb5348fe5a0f17956daaea873fb161c7142ed0a7';
const build = new URL('Build/', self.registration.scope);
const origins = [
  `https://cdn.jsdelivr.net/gh/Reeyuki/SlimeRanch@${revision}/Build/`,
  `https://raw.githubusercontent.com/Reeyuki/SlimeRanch/${revision}/Build/`,
];
const parts = new Map([
  ['web.data.unityweb', {count: 64, bytes: 668193724, type: 'application/octet-stream'}],
  ['web.wasm.code.unityweb', {count: 4, bytes: 34076030, type: 'application/wasm'}],
  ['web.wasm.framework.unityweb', {count: 1, bytes: 571388, type: 'application/javascript'}],
]);

self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

async function downloadPart(name, bytes, abort) {
  let lastError;
  for (const origin of [...origins, origins[0]]) {
    try {
      const response = await fetch(new URL(name, origin), {
        signal: AbortSignal.any([abort, AbortSignal.timeout(45000)]),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = new Uint8Array(await response.arrayBuffer());
      if (data.length !== bytes) throw new Error(`expected ${bytes} bytes, got ${data.length}`);
      return data;
    } catch (error) {
      if (abort.aborted) throw error;
      lastError = error;
    }
  }
  throw new Error(`${name}: ${lastError.message}`);
}

function streamAsset(name, asset, clientId) {
  const abort = new AbortController();
  let index = 0;
  const partSize = 10485760;
  const stream = new ReadableStream({
    async pull(controller) {
      const filename = asset.count === 1 ? name : name + String(index).padStart(2, '0');
      const bytes = Math.min(partSize, asset.bytes - index * partSize);
      try {
        controller.enqueue(await downloadPart(filename, bytes, abort.signal));
        if (++index === asset.count) controller.close();
      } catch (error) {
        if (abort.signal.aborted) return;
        controller.error(error);
        const client = await self.clients.get(clientId);
        client?.postMessage({type: 'slime-rancher-download-error', message: error.message});
      }
    },
    cancel() {
      abort.abort();
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': asset.type,
      'Content-Length': String(asset.bytes),
      'Cache-Control': 'no-store',
    },
  });
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const name = event.request.url.slice(build.href.length);
  if (!event.request.url.startsWith(build.href) || !parts.has(name)) return;
  event.respondWith(streamAsset(name, parts.get(name), event.clientId));
});
