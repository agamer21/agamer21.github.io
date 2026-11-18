const screen = document.getElementById('loadingScreen');
const status = document.getElementById('loadingText');
const start = document.getElementById('start');
const graphics = document.getElementById('graphics');
let progressDeadline;

function showError(error) {
  clearTimeout(progressDeadline);
  screen.hidden = false;
  status.textContent = `Could not start Slime Rancher. ${error.message || error}`;
  start.textContent = 'Reload and retry';
  start.disabled = false;
  start.onclick = () => location.reload();
}

async function connectWorker() {
  if (!navigator.serviceWorker) throw new Error('This browser does not support game streaming.');
  const script = new URL('./parts-sw.js', location.href).href;
  await navigator.serviceWorker.register(script);
  if (navigator.serviceWorker.controller?.scriptURL !== script) {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        navigator.serviceWorker.removeEventListener('controllerchange', onController);
        reject(new Error('Game streaming did not initialize.'));
      }, 10000);
      function onController() {
        if (navigator.serviceWorker.controller?.scriptURL !== script) return;
        clearTimeout(timer);
        navigator.serviceWorker.removeEventListener('controllerchange', onController);
        resolve();
      }
      navigator.serviceWorker.addEventListener('controllerchange', onController);
      onController();
    });
  }
}

function useCompatibilityGraphics() {
  const getContext = HTMLCanvasElement.prototype.getContext;
  const probe = document.createElement('canvas');
  const context = getContext.call(probe, 'webgl');
  if (!context) throw new Error('Compatibility graphics are unavailable. Reload and choose Standard.');
  context.getExtension('WEBGL_lose_context')?.loseContext();

  const game = document.getElementById('unity');
  window.UnityLoader.SystemInfo.hasWebGL = 1;
  HTMLCanvasElement.prototype.getContext = function (type, options) {
    if (game.contains(this)) {
      if (type === 'webgl2') return null;
      if (type === 'webgl' || type === 'experimental-webgl') {
        return getContext.call(this, type, { ...options, antialias: false });
      }
    }
    return getContext.call(this, type, options);
  };
}

start.addEventListener('click', async () => {
  start.disabled = true;
  graphics.disabled = true;
  status.textContent = 'Connecting to the game host…';
  try {
    if (graphics.value === 'compatibility') useCompatibilityGraphics();
    await connectWorker();
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data?.type === 'slime-rancher-download-error') showError(event.data.message);
    });
    window.UnityLoader.instantiate('unity', 'Build/web.json', {
      onerror: showError,
      onProgress: (_, progress) => {
        clearTimeout(progressDeadline);
        if (progress >= 1) {
          screen.hidden = true;
          return;
        }
        status.textContent = `Loading game files… ${Math.round(progress * 100)}%`;
        progressDeadline = setTimeout(() => showError('The game stopped making progress.'), 150000);
      },
    });
  } catch (error) {
    showError(error);
  }
}, { once: true });
