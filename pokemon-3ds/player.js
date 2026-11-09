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

rom.addEventListener("change", () => {
  const file = rom.files[0];
  if (!file) return;
  if (!file.size || !/\.(cci|3ds)$/i.test(file.name)) {
    status.textContent = "Choose a nonempty, decrypted .cci or .3ds game file.";
    rom.value = "";
    return;
  }
  const gameFile = new File([file], file.name.replace(/\.(cci|3ds)$/i, ".cci"));
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
    EJS_startOnLoaded: true,
    EJS_onGameStart: () => { status.textContent = ""; },
  });
  const loader = document.createElement("script");
  loader.src = `${dataPath}loader.js`;
  loader.addEventListener("error", () => {
    status.textContent = "The emulator could not download. Check your connection and try again.";
  });
  document.body.append(loader);
});

change.addEventListener("click", () => location.reload());
preparePlayer();
