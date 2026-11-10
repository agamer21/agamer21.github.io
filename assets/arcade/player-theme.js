const themes = ["midnight", "forest", "dusk", "daylight"];
const header = document.querySelector(".player-header, .bar, body > header");
if (header && !document.body.classList.contains("arcade-home")) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/assets/arcade/themes.css";
  document.head.append(link);
  const style = document.createElement("style");
  style.textContent = `
    body.arcade-shell { background: var(--bg); color: var(--ink); }
    .arcade-shell > header { background: var(--panel); color: var(--ink); border-bottom: 1px solid var(--line); flex-wrap: wrap; }
    .arcade-shell > header a { color: var(--accent); }
    .arcade-shell > header button, .arcade-shell > header select { background: var(--field); color: var(--ink); border: 1px solid var(--line); border-radius: 8px; padding: 8px 12px; font: inherit; }
    .arcade-shell #page-theme { margin-left: auto; }
    .arcade-shell .panel { background-color: var(--panel); color: var(--ink); }
  `;
  document.head.append(style);
  document.body.classList.add("arcade-shell");
  const select = document.createElement("select");
  select.id = "page-theme";
  select.setAttribute("aria-label", "Page theme");
  for (const [index, name] of themes.entries()) {
    select.add(new Option(["Black & White", "Forest", "Dusk", "Daylight"][index], name));
  }
  function applyTheme() {
    let theme = "midnight";
    try { theme = localStorage.getItem("agArcade.theme.v1") ?? theme; } catch {}
    document.documentElement.dataset.theme = themes.includes(theme) ? theme : "midnight";
    select.value = document.documentElement.dataset.theme;
  }
  select.addEventListener("change", () => {
    try { localStorage.setItem("agArcade.theme.v1", select.value); } catch {}
    document.documentElement.dataset.theme = select.value;
  });
  addEventListener("storage", applyTheme);
  header.append(select);
  applyTheme();
}
