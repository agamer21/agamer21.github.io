(() => {
  const AC = window.AudioContext || window.webkitAudioContext;
  function openAudio() {
    if (window.__hcrAudioContext) return;
    if (window.__hcrEarlyAudio) {
      if (window.__hcrEarlyAudio.state === 'suspended') window.__hcrEarlyAudio.resume().catch(() => {});
      return;
    }
    try {
      const ctx = new AC({ latencyHint: 'interactive' });
      window.__hcrEarlyAudio = ctx;
      ctx.resume().catch(() => {});
    } catch (e) {}
  }
  if (AC) {
    addEventListener('pointerdown', openAudio, { capture: true, once: true });
    addEventListener('keydown', openAudio, { capture: true, once: true });
    addEventListener('touchstart', openAudio, { capture: true, once: true, passive: true });
  }
  const ASSETS = {
  "hcr.data": {
    "size": 103210907,
    "compressedSize": 72421454
  },
  "hcr.wasm": {
    "size": 97394647,
    "compressedSize": 18224605
  },
  "image.bin": {
    "size": 22085632,
    "compressedSize": 4648288
  }
};
  const TYPES = {
    'hcr.wasm': 'application/wasm',
    'hcr.data': 'application/octet-stream',
    'image.bin': 'application/octet-stream'
  };
  const TOTAL = Object.values(ASSETS).reduce((sum, asset) => sum + asset.compressedSize, 0);
  const loaded = new Map();
  const bar = document.getElementById('loading-fill');
  const status = document.getElementById('status');
  let lastPercent = -1;

  function showProgress() {
    let bytes = 0;
    for (const value of loaded.values()) bytes += value;
    const percent = Math.min(100, Math.floor(bytes / TOTAL * 100));
    if (percent === lastPercent) return;
    lastPercent = percent;
    if (bar) bar.style.width = percent + '%';
    if (status) status.textContent = `Loading game files… ${percent}%`;
  }

  async function readPart(response, name) {
    if (!response.body) {
      const blob = await response.blob();
      loaded.set(name, blob.size);
      showProgress();
      return blob;
    }
    const reader = response.body.getReader();
    const chunks = [];
    let bytes = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      bytes += value.length;
      loaded.set(name, bytes);
      showProgress();
    }
    return new Blob(chunks);
  }

  async function fetchPart(name) {
    let lastError;
    for (let attempt = 0; attempt < 4; attempt++) {
      const url = name;
      try {
        const response = await fetch(url, attempt === 0 ? undefined : { cache: 'no-store' });
        if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
        return await readPart(response, name);
      } catch (error) {
        lastError = error;
        loaded.set(name, 0);
        showProgress();
        await new Promise(resolve => setTimeout(resolve, 200 * (attempt + 1)));
      }
    }
    throw lastError;
  }

  async function loadAsset(name, asset) {
    const compressed = await fetchPart(`${name}.gz`);
    if (compressed.size !== asset.compressedSize) throw new Error(name + ': incomplete download');
    const bytes = await new Response(compressed.stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
    if (bytes.byteLength !== asset.size) throw new Error(name + ': incomplete game file');
    return new Blob([bytes], { type: TYPES[name] });
  }

  function installBridge(assets) {
    const originalFetch = window.fetch.bind(window);
    window.fetch = (input, options) => {
      let name = '';
      try {
        const url = input instanceof Request ? input.url : String(input);
        name = new URL(url, document.baseURI).pathname.split('/').pop();
      } catch (error) {}
      const blob = assets[name];
      if (!blob) return originalFetch(input, options);
      const headers = new Headers(options && options.headers || (input instanceof Request ? input.headers : undefined));
      const range = /^bytes=(\d+)-(\d*)$/.exec(headers.get('Range') || '');
      if (range) {
        const start = Number(range[1]);
        const end = range[2] ? Math.min(Number(range[2]), blob.size - 1) : blob.size - 1;
        if (start >= blob.size || end < start) {
          return Promise.resolve(new Response(null, {
            status: 416,
            headers: { 'Content-Range': `bytes */${blob.size}` }
          }));
        }
        const slice = blob.slice(start, end + 1);
        return Promise.resolve(new Response(slice, {
          status: 206,
          headers: {
            'Content-Type': blob.type,
            'Content-Length': String(slice.size),
            'Content-Range': `bytes ${start}-${end}/${blob.size}`,
            'Accept-Ranges': 'bytes'
          }
        }));
      }
      return Promise.resolve(new Response(blob, {
        status: 200,
        headers: {
          'Content-Type': blob.type,
          'Content-Length': String(blob.size),
          'Accept-Ranges': 'bytes'
        }
      }));
    };
  }

  (async () => {
    try {
      if (status) status.textContent = 'Loading game files… 0%';
      const assets = {};
      for (const [name, asset] of Object.entries(ASSETS)) {
        assets[name] = await loadAsset(name, asset);
      }
      if (bar) bar.style.width = '100%';
      if (status) status.textContent = 'Starting game…';
      installBridge(assets);
      window.__hcrMain();
    } catch (error) {
      const statusElement = document.getElementById('status');
      if (statusElement) statusElement.textContent = 'Loading failed: ' + (error.message || String(error));
      console.error(error);
    }
  })();
})();
