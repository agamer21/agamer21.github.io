const base = 'https://roms.agamer21.kozow.com/granny';
const build = base + '/Build/';
const canvas = document.querySelector('#game');
const status = document.querySelector('#status');
let loaded = 0;

// The Unity build requests its device type through this platform interface.
const platform = {
  deviceInfo: { type: matchMedia('(pointer: coarse)').matches ? 'mobile' : 'desktop' },
  adv: {
    showFullscreenAdv({ callbacks }) { callbacks.onClose?.(false); },
    showRewardedVideo({ callbacks }) { callbacks.onError?.(new Error('Rewarded ads unavailable')); },
  },
};
window.YaGames = { init: async () => platform };

// The isolated player has no persistent Unity cache.
Object.defineProperty(window, 'caches', { value: undefined });

async function combinedAsset(extension) {
  const parts = await Promise.all([1, 2].map(async part => {
    const response = await fetch(build + 'Granny_part' + part + '.' + extension);
    if (!response.ok) throw new Error('Game download returned HTTP ' + response.status);
    const content = await response.blob();
    status.textContent = 'Downloading Granny (' + ++loaded + '/4)';
    return content;
  }));
  return URL.createObjectURL(new Blob(parts, { type: extension === 'wasm' ? 'application/wasm' : 'application/octet-stream' }));
}

async function start() {
  const urls = [];
  try {
    const [dataUrl, codeUrl] = await Promise.all(['data', 'wasm'].map(async extension => {
      const url = await combinedAsset(extension);
      urls.push(url);
      return url;
    }));
    await new Promise((resolve, reject) => {
      const loader = document.createElement('script');
      loader.src = build + 'Granny.loader.js';
      loader.onload = resolve;
      loader.onerror = () => reject(new Error('Game loader unavailable'));
      document.head.append(loader);
    });
    window.myGameInstance = await createUnityInstance(canvas, {
      dataUrl, codeUrl, frameworkUrl: build + 'Granny.framework.js',
      cacheControl: () => 'no-store',
      streamingAssetsUrl: base + '/StreamingAssets',
      companyName: 'Anastasia Kazantseva', productName: 'Granny', productVersion: '1.0',
      showBanner(message, type) { if (type === 'error') status.textContent = message; },
    }, progress => { status.textContent = 'Starting Granny (' + Math.round(100 * progress) + '%)'; });
    status.hidden = true;
    canvas.focus();
  } catch (error) {
    status.textContent = 'Granny could not load. ' + (error.message || String(error));
  } finally {
    for (const url of urls) URL.revokeObjectURL(url);
  }
}

start();
