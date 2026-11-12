const read = (key, fallback) => {
  try {
    const v = JSON.parse(localStorage.getItem(key)) ?? fallback;
    if (Array.isArray(fallback)) {
      if (!Array.isArray(v)) return fallback;
      return key.includes("favorites")
        ? v.filter((x) => typeof x === "string")
        : v.filter((x) => x && typeof x.id === "string" && Number.isFinite(x.at));
    }
    if (fallback && typeof fallback === "object" && !Array.isArray(fallback)) {
      return v && typeof v === "object" && !Array.isArray(v) ? v : fallback;
    }
    return v;
  } catch {
    return fallback;
  }
};
const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    document.querySelector("#library-results").textContent =
      "Browser storage is unavailable; favorites cannot be saved.";
  }
};
let favorites = new Set(read("agArcade.favorites.v1", [])),
  recent = read("agArcade.recent.v1", []),
  plays = read("agArcade.plays.v1", {}),
  view = "all";
const experimentalAckKey = "agArcade.experimentalAck.v1";
let experimentalAccepted = false;
try {
  experimentalAccepted = localStorage.getItem(experimentalAckKey) === "1";
} catch {}
const search = document.querySelector("#game-search"),
  genre = document.querySelector("#game-genre"),
  sort = document.querySelector("#game-sort"),
  grid = document.querySelector(".games-grid"),
  result = document.querySelector("#library-results"),
  continueSection = document.querySelector("#continue-section"),
  continueGrid = document.querySelector("#continue-grid"),
  featuredGrid = document.querySelector("#featured-grid");

const featuredIds = new Set([
  "/bloons-td6.html",
  "/geometry-dash/",
  "/openfront-friends/",
  "/retro-bowl.html",
  "/2048.html",
  "/wordle.html",
]);
const metaByName = new Map([
  ["Bloons TD 6", { input: "Mouse/Touch", save: "Saves locally" }],
  ["Granny", { input: "Keyboard/Mouse", save: "Session progress" }],
  ["Geometry Dash", { input: "Keyboard/Touch", save: "Saves locally" }],
  ["Half-Life", { input: "Keyboard/Mouse", save: "Own files/session" }],
  ["Angry Birds 2", { input: "Mouse/Touch", save: "Saves locally" }],
  ["OpenFront", { input: "Mouse/Touch", save: "World saves" }],
  ["Drive Mad", { input: "Keyboard/Touch", save: "Saves locally" }],
  ["Retro Bowl", { input: "Mouse/Touch", save: "Career saves" }],
  ["Moto X3M", { input: "Keyboard/Touch", save: "Progress saves" }],
  ["Tiny Fishing", { input: "Mouse/Touch", save: "Progress saves" }],
  ["Retro Bowl College", { input: "Mouse/Touch", save: "Career saves" }],
  ["Super Mario 64", { input: "Keyboard/Controller", save: "Save states" }],
  ["Pokémon Ultra Sun", { input: "Keyboard/Controller", save: "Save files" }],
  ["Pokémon Omega Ruby", { input: "Keyboard/Controller", save: "Save files" }],
  ["Pokémon Alpha Sapphire", { input: "Keyboard/Controller", save: "Save files" }],
  ["HexGL", { input: "Keyboard", save: "Best scores" }],
  ["Hextris", { input: "Keyboard/Touch", save: "Best scores" }],
  ["Tank Arena", { input: "Keyboard/Touch", save: "Session play" }],
  ["Krillion", { input: "Mouse/Touch", save: "On site" }],
  ["Wordle+", { input: "Keyboard/Touch", save: "Daily progress" }],
  ["2048", { input: "Keyboard/Touch", save: "Best score" }],
  ["Five Nights at Epstein's", { input: "Mouse", save: "Session play" }],
  ["Basket Bros", { input: "Keyboard", save: "Session play" }],
  ["Agar Arcade", { input: "Mouse/Touch", save: "Session play" }],
]);

const cards = [...grid.querySelectorAll(".game-card")].map((card, index) => {
  const url = new URL(card.href, location.href);
  const id = url.pathname + (url.pathname.includes("pokemon-3ds") ? url.search : "");
  const name = card.querySelector("h3").textContent.replace(/[↗?]/g, "").trim();
  const category = card.querySelector(".genre").textContent.trim();
  const shell = document.createElement("div");
  shell.className = "game-shell";
  card.replaceWith(shell);
  shell.hidden = category === "Experimental";
  shell.appendChild(card);
  card.hidden = false;
  const star = document.createElement("button");
  star.className = "favorite-game";
  shell.appendChild(star);
  star.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    favorites.has(id) ? favorites.delete(id) : favorites.add(id);
    write("agArcade.favorites.v1", [...favorites]);
    render();
  };
  card.addEventListener("click", () => {
    recent = [{ id, at: Date.now() }, ...recent.filter((x) => x.id !== id)].slice(0, 20);
    plays[id] = (Number(plays[id]) || 0) + 1;
    write("agArcade.recent.v1", recent);
    write("agArcade.plays.v1", plays);
  });
  // metadata chips
  const info = card.querySelector(".game-info");
  const meta = metaByName.get(name) || { input: "Mouse/Keyboard", save: "Progress varies" };
  if (info && !info.querySelector(".card-meta")) {
    const metaRow = document.createElement("div");
    metaRow.className = "card-meta";
    const playCount = Number(plays[id]) || 0;
    metaRow.innerHTML = `<span class="meta-chip">${meta.input}</span><span class="meta-chip">${meta.save}</span><span class="meta-chip meta-chip-plays">${playCount ? `${playCount} plays` : "New to you"}</span>`;
    const desc = info.querySelector(".card-description");
    if (desc) desc.after(metaRow); else info.appendChild(metaRow);
  }
  return {
    id,
    name,
    category,
    experimental: category === "Experimental",
    featured: featuredIds.has(new URL(card.href, location.href).pathname),
    index,
    shell,
    card,
    star,
    metaEl: card.querySelector(".meta-chip-plays"),
    searchText: (name + " " + category + " " + card.querySelector("p").textContent + " " + meta.input + " " + meta.save).toLowerCase(),
  };
});
for (const category of [...new Set(cards.filter((c) => !c.experimental).map((c) => c.category))].sort()) {
  const o = document.createElement("option");
  o.value = category;
  o.textContent = category;
  genre.appendChild(o);
}

function cardById(id) { return cards.find(c => c.id === id); }
function makeMiniCard(c) {
  const a = c.card.cloneNode(true);
  a.classList.add("mini-card");
  a.querySelectorAll(".card-meta").forEach(n => n.remove());
  a.querySelectorAll(".play-mark").forEach(n => n.remove());
  const p = a.querySelector(".card-description");
  if (p) p.remove();
  a.addEventListener("click", () => {
    recent = [{ id: c.id, at: Date.now() }, ...recent.filter((x) => x.id !== c.id)].slice(0, 20);
    plays[c.id] = (Number(plays[c.id]) || 0) + 1;
    write("agArcade.recent.v1", recent);
    write("agArcade.plays.v1", plays);
  });
  return a;
}
function renderHighlights() {
  if (continueGrid) {
    const recents = recent.map(r => cardById(r.id)).filter(c => c && !c.experimental).slice(0, 5);
    continueGrid.replaceChildren(...recents.map(makeMiniCard));
    if (continueSection) continueSection.hidden = recents.length === 0;
  }
  if (featuredGrid && featuredGrid.childElementCount === 0) {
    const featured = cards.filter(c => c.featured && !c.experimental).slice(0, 6);
    featuredGrid.replaceChildren(...featured.map(makeMiniCard));
  }
}

function sortedCards() {
  const mode = sort?.value || "default";
  return [...cards].sort((a, b) => {
    if (mode === "az") return a.name.localeCompare(b.name);
    if (mode === "za") return b.name.localeCompare(a.name);
    if (mode === "recent") return (recent.find((x) => x.id === b.id)?.at ?? 0) - (recent.find((x) => x.id === a.id)?.at ?? 0);
    if (mode === "played") return (Number(plays[b.id]) || 0) - (Number(plays[a.id]) || 0) || a.name.localeCompare(b.name);
    if (mode === "new") return b.index - a.index;
    if (view === "recent") return (recent.find((x) => x.id === b.id)?.at ?? 0) - (recent.find((x) => x.id === a.id)?.at ?? 0);
    return a.index - b.index;
  });
}

function render() {
  const query = search.value.trim().toLowerCase();
  let count = 0;
  for (const c of cards) {
    if (c.metaEl) {
      const pc = Number(plays[c.id]) || 0;
      c.metaEl.textContent = pc ? `${pc} ${pc === 1 ? "play" : "plays"}` : "New to you";
    }
  }
  for (const c of sortedCards()) {
    c.star.textContent = favorites.has(c.id) ? "★" : "☆";
    c.star.setAttribute("aria-pressed", String(favorites.has(c.id)));
    c.star.setAttribute(
      "aria-label",
      (favorites.has(c.id) ? "Remove " : "Add ") +
        c.name +
        (favorites.has(c.id) ? " from favorites" : " to favorites"),
    );
    c.shell.hidden = !(
      c.searchText.includes(query) &&
      (view === "experimental" || !genre.value || c.category === genre.value) &&
      (view !== "favorites" || favorites.has(c.id)) &&
      (view !== "recent" || recent.some((x) => x.id === c.id)) &&
      (c.experimental === (view === "experimental"))
    );
    grid.appendChild(c.shell);
    if (!c.shell.hidden) count++;
  }
  let msg = "";
  if (count) {
    msg = `${count} ${count === 1 ? "game" : "games"}`;
    if (view === "favorites") msg += " in favorites";
    else if (view === "recent") msg += " recently played";
    else if (view === "experimental") msg += " experimental — most need your own game files and none are finished";
  } else {
    if (view === "favorites") msg = "No favorites yet. Tap the ☆ on any game to save it here.";
    else if (view === "recent") msg = "No recently played games yet. Open a game and it’ll show up here and in Continue playing.";
    else if (view === "experimental") msg = "No experimental games match. Try clearing search or check back later.";
    else msg = "No matching games. Try a different search, genre, or sort.";
  }
  result.textContent = msg;
  for (const b of document.querySelectorAll("[data-view]"))
    b.setAttribute("aria-pressed", String(b.dataset.view === view));
  renderHighlights();
}
search.oninput = render;
genre.onchange = render;
if (sort) sort.onchange = render;
const experimentalDialog = document.querySelector("#experimental-warning");
function setView(next) {
  view = next;
  for (const b of document.querySelectorAll("[data-view]"))
    b.setAttribute("aria-pressed", String(b.dataset.view === view));
  render();
}
for (const b of document.querySelectorAll("[data-view]"))
  b.onclick = () => {
    if (b.dataset.view === "experimental" && !experimentalAccepted) {
      experimentalDialog.showModal();
      return;
    }
    setView(b.dataset.view);
  };
document.querySelector("#accept-experimental").onclick = () => {
  experimentalAccepted = true;
  try { localStorage.setItem(experimentalAckKey, "1"); } catch {}
  experimentalDialog.close();
  setView("experimental");
};
window.addEventListener("pageshow", () => {
  favorites = new Set(read("agArcade.favorites.v1", []));
  recent = read("agArcade.recent.v1", []);
  plays = read("agArcade.plays.v1", {});
  render();
});
render();
const dialog = document.querySelector("#backup-dialog");
document.querySelector("#open-backups").onclick = () => dialog.showModal();
document.querySelector("#export-saves").onclick = async () => {
  const status = document.querySelector("#backup-status");
  try {
    const { exportBackup } = await import("./save-backups.js");
    await exportBackup();
    status.textContent = "Backup downloaded. Keep it somewhere safe.";
  } catch (e) {
    status.textContent = "Could not create a backup: " + e.message;
  }
};
document.querySelector("#import-saves").onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const status = document.querySelector("#backup-status");
  try {
    const { importBackup } = await import("./save-backups.js");
    const summary = await importBackup(file);
    status.textContent = `Restored ${summary.saves} game saves${summary.world ? " and your OpenFront world" : ""}.`;
    favorites = new Set(read("agArcade.favorites.v1", []));
    recent = read("agArcade.recent.v1", []);
    plays = read("agArcade.plays.v1", {});
    render();
  } catch (e) {
    status.textContent = "Backup not restored: " + e.message;
  } finally {
    e.target.value = "";
  }
};
