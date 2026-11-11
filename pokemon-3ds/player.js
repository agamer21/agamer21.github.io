const titles = new Map([
  ["ultra-sun", "Pokémon Ultra Sun"],
  ["omega-ruby", "Pokémon Omega Ruby"],
  ["alpha-sapphire", "Pokémon Alpha Sapphire"],
]);
const title = titles.get(new URLSearchParams(location.search).get("game")) ?? "Nintendo 3DS";
document.title = `${title} | AG Arcade`;
document.querySelector("#title").textContent = title;

const chooser = document.querySelector("#chooser");
const rom = document.querySelector("#rom");
const change = document.querySelector("#change");
const status = document.querySelector("#status");
const game = document.querySelector("#game");
const resetKeyboard = document.querySelector("#reset-keyboard");
const keyboardStatus = document.querySelector("#keyboard-status");
const resetVideo = document.querySelector("#reset-video");
const videoStatus = document.querySelector("#video-status");
const dataPath = "/pokemon-3ds/vendor/emulatorjs/";
const maxWholeFileRead = 0x7fffffff;
const performanceOptions = { citra_resolution_factor: "1", shader: "disabled" };
// EmulatorJS uses RetroPad IDs. Axes 16–19 are the Circle Pad.
const keyboard = Object.fromEntries(Object.entries({
  0: "x", 1: "v", 2: "shift", 3: "enter",
  4: "up arrow", 5: "down arrow", 6: "left arrow", 7: "right arrow",
  8: "z", 9: "c", 10: "q", 11: "e", 12: "1", 13: "2",
  16: "d", 17: "a", 18: "s", 19: "w",
  20: "l", 21: "j", 22: "k", 23: "i",
  24: "", 25: "", 26: "",
}).map(([id, value]) => [id, { value }]));

// Chromium rejects a single Blob read above 2 GiB. EmulatorJS still needs one buffer.
async function readLargeGame(file) {
  try {
    const bytes = new Uint8Array(file.size);
    const chunkSize = 32 * 1024 * 1024;
    for (let offset = 0; offset < file.size; offset += chunkSize) {
      const chunk = await file.slice(offset, offset + chunkSize).arrayBuffer();
      bytes.set(new Uint8Array(chunk), offset);
      status.textContent = `Reading game file… ${Math.floor(100 * Math.min(file.size, offset + chunkSize) / file.size)}%`;
    }
    status.textContent = "Starting the 3DS emulator…";
    return bytes.buffer;
  } catch (error) {
    status.textContent = "This browser could not read the game file. Try closing other tabs or using a smaller dump.";
    throw error;
  }
}

async function preparePlayer() {
  if (crossOriginIsolated && typeof SharedArrayBuffer === "function") {
    rom.disabled = false;
    status.textContent = "";
    return;
  }
  if (!navigator.serviceWorker || navigator.serviceWorker.controller) {
    status.textContent = "This browser could not enable 3DS mode. Open the player directly in Chrome or Edge.";
    return;
  }
  navigator.serviceWorker.addEventListener("controllerchange", () => location.reload(), { once: true });
  try {
    await navigator.serviceWorker.register("./isolation-sw.js");
  } catch {
    status.textContent = "3DS mode could not start. Check your browser settings and reload this page.";
  }
}

function launchGame(file, hostedUrl) {
  if (!file) return;
  if ((!file.size && !hostedUrl) || !/\.(cci|3ds|cxi|zcxi)$/i.test(file.name)) {
    status.textContent = "Choose a nonempty, decrypted .cci, .3ds, .cxi, or .zcxi game file.";
    rom.value = "";
    return;
  }
  const gameFile = /\.3ds$/i.test(file.name) ? new File([file], file.name.replace(/\.3ds$/i, ".cci")) : file;
  if (hostedUrl) {
    installHostedDownload(gameFile, hostedUrl);
  } else if (gameFile.size > maxWholeFileRead) {
    gameFile.arrayBuffer = () => readLargeGame(gameFile);
  }
  chooser.hidden = true;
  game.hidden = false;
  change.hidden = false;
  status.textContent = "Loading the 3DS emulator…";
  Object.assign(window, {
    EJS_player: "#game",
    EJS_core: "3ds",
    EJS_gameUrl: gameFile,
    EJS_gameName: gameFile.name,
    EJS_pathtodata: dataPath,
    EJS_threads: true,
    EJS_cacheConfig: { enabled: false },
    EJS_startOnLoaded: true,
    EJS_defaultControls: { 0: keyboard },
    EJS_defaultOptions: {
      keyboardInput: "disabled",
      lockMouse: "disabled",
      ...performanceOptions,
    },
    EJS_onGameStart: () => {
      status.textContent = "";
      resetKeyboard.disabled = false;
      resetVideo.disabled = false;
    },
  });
  const loader = document.createElement("script");
  loader.src = `${dataPath}loader.js`;
  loader.addEventListener("error", () => {
    status.textContent = "The emulator could not download. Check your connection and try again.";
  });
  document.body.append(loader);
}

rom.addEventListener("change", () => launchGame(rom.files[0]));

resetKeyboard.addEventListener("click", () => {
  const emulator = window.EJS_emulator;
  for (const [id, binding] of Object.entries(keyboard)) {
    emulator.controls[0][id] = { ...emulator.controls[0][id], ...binding };
  }
  emulator.setupKeys();
  emulator.frontend.changeSettingOption("keyboardInput", "disabled");
  emulator.frontend.changeSettingOption("lockMouse", "disabled");
  emulator.saveSettings();
  keyboardStatus.textContent = "Keyboard layout applied.";
});

resetVideo.addEventListener("click", () => {
  const emulator = window.EJS_emulator;
  for (const [option, value] of Object.entries(performanceOptions)) {
    emulator.frontend.changeSettingOption(option, value);
  }
  emulator.saveSettings();
  videoStatus.textContent = "1× resolution and video filters off.";
});

change.addEventListener("click", () => {
  const url = new URL(location.href);
  url.searchParams.set("local", "1");
  location.replace(url);
});
await preparePlayer();
const hostedGames = new Map([
  ["ultra-sun", ["ultra-sun.zcxi", "Pokemon Ultra Sun.zcxi"]],
  ["omega-ruby", ["omega-ruby.cxi", "Pokemon Omega Ruby.cxi"]],
  ["alpha-sapphire", ["alpha-sapphire.cxi", "Pokemon Alpha Sapphire.cxi"]],
]);
const selected = hostedGames.get(new URLSearchParams(location.search).get("game"));
const blockSize = 8 * 1024 * 1024;

async function downloadHostedGame(url) {
  const signal = AbortSignal.timeout(15 * 60 * 1000);
  const blocks = [];
  let fileSize = 0;
  let received = 0;
  let lastPercent = -1;

  for (let attempt = 0; attempt < 2; attempt++) {
    const headers = received ? { Range: `bytes=${received}-` } : {};
    status.textContent = attempt ? "Resuming the game download?" : `Downloading ${title}?`;
    const response = await fetch(url, { cache: "no-store", headers, signal });
    if (!response.ok || !response.body) {
      await response.body?.cancel();
      throw new Error(`Download unavailable (HTTP ${response.status}).`);
    }

    if (!fileSize) {
      const length = Number(response.headers.get("Content-Length"));
      if (!Number.isSafeInteger(length) || length <= 0) {
        await response.body.cancel();
        throw new Error("The download did not include its file size.");
      }
      fileSize = length;
    } else {
      const length = Number(response.headers.get("Content-Length"));
      if (received && (response.status !== 206 || length !== fileSize - received)) {
        await response.body.cancel();
        throw new Error("The download could not resume.");
      }
    }

    const reader = response.body.getReader();
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (received + value.byteLength > fileSize) throw new Error("Unexpected game file size.");
        let offset = 0;
        while (offset < value.byteLength) {
          const index = Math.floor(received / blockSize);
          const position = received % blockSize;
          blocks[index] ??= new Uint8Array(Math.min(blockSize, fileSize - received + position));
          const block = blocks[index];
          const count = Math.min(block.length - position, value.byteLength - offset);
          block.set(value.subarray(offset, offset + count), position);
          received += count;
          offset += count;
        }
        const percent = Math.floor(received * 100 / fileSize);
        if (percent !== lastPercent) {
          status.textContent = `Downloading ${title}? ${percent}%`;
          lastPercent = percent;
        }
      }
      if (received === fileSize) return { blocks, fileSize };
    } catch (error) {
      if (attempt || signal.aborted || error instanceof RangeError) throw error;
    } finally {
      await reader.cancel().catch(() => {});
    }
  }

  throw new Error("The download stopped before all bytes arrived.");
}

function mountHostedGame(fs, name, { blocks, fileSize }) {
  const path = "/" + name;
  fs.writeFile(path, new Uint8Array(0));
  const node = fs.lookupPath(path).node;
  node.usedBytes = fileSize;
  node.stream_ops = {
    ...node.stream_ops,
    read(_stream, buffer, offset, length, position) {
      const available = Math.max(0, Math.min(length, fileSize - position));
      let copied = 0;
      while (copied < available) {
        const index = Math.floor(position / blockSize);
        const within = position % blockSize;
        const block = blocks[index];
        const count = Math.min(block.length - within, available - copied);
        buffer.set(block.subarray(within, within + count), offset + copied);
        copied += count;
        position += count;
      }
      return copied;
    },
  };
}

function installHostedDownload(file, url) {
  // The loader publishes the emulator before it starts fetching the core.
  Object.defineProperty(window, "EJS_emulator", {
    configurable: true,
    set(emulator) {
      Object.defineProperty(window, "EJS_emulator", {
        value: emulator, writable: true, configurable: true,
      });
      const originalDownload = emulator.download;
      emulator.download = async function (source, ...args) {
        if (source !== file) return originalDownload.call(this, source, ...args);
        try {
          const data = await downloadHostedGame(url);
          mountHostedGame(this.gameManager.FS, file.name, data);
          status.textContent = "Download complete. Starting the emulator?";
          await new Promise(resolve => setTimeout(resolve, 0));
          return { files: [{ filename: file.name }] };
        } catch (error) {
          const detail = error instanceof RangeError
            ? "This browser ran out of memory while loading the game."
            : error instanceof TypeError ? "The browser lost or blocked the connection." : error.message;
          status.textContent = `${detail} Reload to retry or choose a local file.`;
          throw error;
        }
      };
    },
  });
}

if (selected && !rom.disabled && !new URLSearchParams(location.search).has("local")) {
  launchGame(new File([], selected[1]), "https://roms.agamer21.kozow.com/" + selected[0]);
}
