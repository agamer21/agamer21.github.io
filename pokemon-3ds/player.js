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
const dataPath = "https://cdn.emulatorjs.org/nightly/data/";
const maxWholeFileRead = 0x7fffffff;

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

function launchGame(file, readHostedGame) {
  if (!file) return;
  if ((!file.size && !readHostedGame) || !/\.(cci|3ds|cxi|zcxi)$/i.test(file.name)) {
    status.textContent = "Choose a nonempty, decrypted .cci, .3ds, .cxi, or .zcxi game file.";
    rom.value = "";
    return;
  }
  const gameFile = /\.3ds$/i.test(file.name) ? new File([file], file.name.replace(/\.3ds$/i, ".cci")) : file;
  if (readHostedGame) {
    gameFile.arrayBuffer = readHostedGame;
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
    EJS_onGameStart: () => { status.textContent = ""; },
  });
  const loader = document.createElement("script");
  loader.src = `${dataPath}loader.js`;
  loader.addEventListener("error", () => {
    status.textContent = "The emulator could not download. Check your connection and try again.";
  });
  document.body.append(loader);
}

rom.addEventListener("change", () => launchGame(rom.files[0]));

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
async function downloadHostedGame(url) {
  const signal = AbortSignal.timeout(15 * 60 * 1000);
  let bytes;
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

    if (!bytes) {
      const length = Number(response.headers.get("Content-Length"));
      if (!Number.isSafeInteger(length) || length <= 0) {
        await response.body.cancel();
        throw new Error("The download did not include its file size.");
      }
      try {
        bytes = new Uint8Array(length);
      } catch (error) {
        await response.body.cancel().catch(() => {});
        if (error instanceof RangeError) {
          throw new Error("This browser could not reserve enough memory for the game file.");
        }
        throw error;
      }
    } else {
      const length = Number(response.headers.get("Content-Length"));
      if (received && (response.status !== 206 || length !== bytes.length - received)) {
        await response.body.cancel();
        throw new Error("The download could not resume.");
      }
    }

    const reader = response.body.getReader();
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        bytes.set(value, received);
        received += value.byteLength;
        const percent = Math.floor(received * 100 / bytes.length);
        if (percent !== lastPercent) {
          status.textContent = `Downloading ${title}? ${percent}%`;
          lastPercent = percent;
        }
      }
      if (received === bytes.length) return bytes.buffer;
    } catch (error) {
      if (attempt || signal.aborted || error instanceof RangeError) throw error;
    } finally {
      await reader.cancel().catch(() => {});
    }
  }

  throw new Error("The download stopped before all bytes arrived.");
}

if (selected && !rom.disabled && !new URLSearchParams(location.search).has("local")) {
  launchGame(new File([], selected[1]), async () => {
    try {
      const buffer = await downloadHostedGame("https://roms.agamer21.kozow.com/" + selected[0]);
      status.textContent = "Download complete. Starting the emulator?";
      await new Promise(resolve => setTimeout(resolve, 0));
      return buffer;
    } catch (error) {
      const detail = error instanceof TypeError ? "The browser lost or blocked the connection." : error.message;
      status.textContent = `${detail} Reload to retry or choose a local file.`;
      throw error;
    }
  });
}
