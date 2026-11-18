const screen = document.getElementById('loadingScreen');
const status = document.getElementById('loadingText');
const start = document.getElementById('start');
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

start.addEventListener('click', async () => {
  start.disabled = true;
  status.textContent = 'Connecting to the game host…';
  try {
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
