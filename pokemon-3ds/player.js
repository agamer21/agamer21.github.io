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

function launchGame(file) {
  if (!file) return;
  if (!file.size || !/\.(cci|3ds|cxi|zcxi)$/i.test(file.name)) {
    status.textContent = "Choose a nonempty, decrypted .cci, .3ds, .cxi, or .zcxi game file.";
    rom.value = "";
    return;
  }
  const gameFile = /\.3ds$/i.test(file.name) ? new File([file], file.name.replace(/\.3ds$/i, ".cci")) : file;
  if (gameFile.size > maxWholeFileRead) {
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

change.addEventListener("click", () => location.reload());
await preparePlayer();
const hostedGames = new Map([
  ["ultra-sun", ["ultra-sun.zcxi", "Pokemon Ultra Sun.zcxi"]],
  ["omega-ruby", ["omega-ruby.cxi", "Pokemon Omega Ruby.cxi"]],
  ["alpha-sapphire", ["alpha-sapphire.cxi", "Pokemon Alpha Sapphire.cxi"]],
]);
const selected = hostedGames.get(new URLSearchParams(location.search).get("game"));
if (selected && !rom.disabled) {
  rom.disabled = true;
  status.textContent = "Downloading " + title + " from the home server?";
  try {
    const response = await fetch("https://roms.agamer21.kozow.com/" + selected[0], { cache: "no-store" });
    if (!response.ok) throw new Error("HTTP " + response.status);
    const blob = await response.blob();
    launchGame(new File([blob], selected[1]));
  } catch (error) {
    status.textContent = "The home server could not load this game. On home Wi-Fi, allow this site's local network access and reload. You can also choose a local file below. " + error.message;
  } finally {
    rom.disabled = false;
  }
}
