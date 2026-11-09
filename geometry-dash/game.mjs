import { renderLevelSelector } from './level-selector.mjs';
import { readResourceZip } from './resource-zip.mjs';
import { extraButtons, localResources, menuButtons } from './menu.mjs';
import { levels, playable, readProfile, recallResources, rememberResources, saveProfile, saveRun, skins, unlockScore } from './library.mjs';
import { createRun, decodeLevel, nearby, parseLevel, STEP, stepRun } from './engine.mjs';

const get = id => document.getElementById(id);
const canvas = get('game');
const ctx = canvas.getContext('2d');
const width = canvas.width;
const height = canvas.height;
const overlay = get('overlay');
const title = get('title');
const message = get('message');
const start = get('start');
const choose = get('choose');
const files = get('files');
const zipInput = get('resource-zip');
const chooseZip = get('choose-zip');
const mute = get('mute');
const status = get('status');
const progress = get('progress');
const menuContent = get('menu-content');
const levelsButton = get('levels');
const iconsButton = get('icons');
const home = get('home');
const pauseButton = get('pause');
const checkpointButton = get('checkpoint');
const profile = readProfile();
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const cabinet = canvas.closest('.cabinet');
const audio = new Audio();
const atlases = ['GJ_GameSheet', 'GJ_GameSheet02', 'GJ_GameSheetIcons'];
const menuAtlases = ['GJ_GameSheet03', 'GJ_GameSheet04', 'GJ_LaunchSheet'];
const menuSong = new Audio();
menuSong.loop = true;
let assets;
let resources;
let selected;
const selectorEntries = [...levels.filter(entry => entry.id <= 22), { id: 5001, name: 'The Tower' }];
let selectorIndex = 0;
let practice = false;
let checkpoint;
let recorded = true;
let selectionVersion = 0;
let libraryNotice = '';
let menuSongUrl;
let local = false;
let level;
let run = createRun();
const jumpInputs = new Set();
let pendingPress = false;
const trail = [];
const sparks = [];
let screen = 'import';
let attempt = 0;
let previous = 0;
let accumulator = 0;
let cameraY = 0;
let songUrl;
let audioNotice = '';

const cssColor = rgb => 'rgb(' + rgb.map(Math.round).join(',') + ')';
const tiles = new WeakMap();

function decodePlist(node) {
  if (node.tagName !== 'dict') return node.tagName === 'true' || node.tagName === 'false'
    ? node.tagName === 'true' : node.textContent;
  const elements = [...node.children];
  const values = new Map();
  for (let i = 0; i + 1 < elements.length; i += 2) {
    values.set(elements[i].textContent, decodePlist(elements[i + 1]));
  }
  return values;
}

const dimensions = value => (value || '').match(/-?\d+(?:\.\d+)?/g)?.map(Number) || [];

async function readAtlas(find, name) {
  const plist = await find(name + '.plist').text();
  const doc = new DOMParser().parseFromString(plist, 'application/xml');
  const root = doc.querySelector('plist > dict');
  const sprites = root && decodePlist(root).get('frames');
  if (!(sprites instanceof Map)) throw new Error('Invalid sprite atlas ' + name + '.plist.');
  const image = await createImageBitmap(find(name + '.png'));
  const result = new Map();
  for (const [key, fields] of sprites) {
    const [x, y, w, h] = dimensions(fields.get('textureRect'));
    const [ox, oy] = dimensions(fields.get('spriteOffset'));
    if (![x, y, w, h].every(Number.isFinite)) continue;
    result.set(key, { image, x, y, w, h, ox: ox || 0, oy: oy || 0, rotated: fields.get('textureRotated') });
  }
  return result;
}

function releaseArt(art) {
  if (!art) return;
  const images = new Set([...art.frames.values()].map(frame => frame.image));
  for (const image of [...images, art.background, art.ground, art.font?.image]) image?.close();
  for (const sound of art.sounds.values()) URL.revokeObjectURL(sound);
}

const commonFiles = [
  'game_bg_01_001.png', 'groundsquare_01_001.png',
  ...atlases.flatMap(name => [name.toLowerCase() + '.plist', name.toLowerCase() + '.png']),
];
const menuFiles = menuAtlases.flatMap(name => [name.toLowerCase() + '.plist', name.toLowerCase() + '.png']);
const effectNames = { dead: 'explode_11.ogg', complete: 'endstart_02.ogg' };
const resourceNames = new Set([...commonFiles, ...menuFiles, 'menuloop.mp3', 'bigfont.fnt', 'bigfont.png', ...Object.values(effectNames), ...levels.flatMap(entry => [entry.path, entry.song])]);

function requireFile(paths, path) {
  const file = paths.get(path.toLowerCase());
  if (!file) throw new Error('Missing ' + path + '. Choose a ZIP of your Steam Resources folder or the folder itself.');
  return file;
}

async function loadSelectorFont(paths) {
  if (!paths.has('bigfont.fnt') || !paths.has('bigfont.png')) return undefined;
  const source = await paths.get('bigfont.fnt').text();
  const glyphs = new Map();
  for (const row of source.split(/\r?\n/)) {
    if (!row.startsWith('char ')) continue;
    const fields = Object.fromEntries([...row.matchAll(/(\w+)=(-?\d+)/g)].map(match => [match[1], Number(match[2])]));
    glyphs.set(fields.id, fields);
  }
  if (!glyphs.size) return undefined;
  return { glyphs, image: await createImageBitmap(paths.get('bigfont.png')) };
}

function selectorTitle(text) {
  const font = assets.font;
  if (!font) return undefined;
  const glyphs = [...text].map(char => font.glyphs.get(char.codePointAt(0)));
  if (glyphs.some(glyph => !glyph)) return undefined;
  const art = document.createElement('canvas');
  art.className = 'selector-bitmap-title';
  art.width = glyphs.reduce((total, glyph) => total + glyph.xadvance, 12);
  art.height = 43;
  art.setAttribute('aria-hidden', 'true');
  const paint = art.getContext('2d');
  let x = 5;
  for (const glyph of glyphs) {
    if (glyph.width && glyph.height) {
      paint.drawImage(font.image, glyph.x, glyph.y, glyph.width, glyph.height,
        x + glyph.xoffset, glyph.yoffset, glyph.width, glyph.height);
    }
    x += glyph.xadvance;
  }
  return art;
}

async function loadResources(paths) {
  const find = path => requireFile(paths, path);
  commonFiles.forEach(find);
  find(levels[0].path);
  find(levels[0].song);
  parseLevel(await decodeLevel(await find(levels[0].path).text()));
  const availableMenuAtlases = menuAtlases.filter(name =>
    paths.has(name.toLowerCase() + '.plist') && paths.has(name.toLowerCase() + '.png'));
  const sprites = await Promise.all([...atlases, ...availableMenuAtlases].map(name => readAtlas(find, name)));
  const nextArt = {
    frames: new Map(sprites.flatMap(sheet => [...sheet])),
    font: await loadSelectorFont(paths).catch(() => undefined),
    sounds: new Map(Object.entries(effectNames).flatMap(([event, name]) =>
      paths.has(name) ? [[event, URL.createObjectURL(paths.get(name))]] : [])),
    background: await createImageBitmap(find(commonFiles[0])),
    ground: await createImageBitmap(find(commonFiles[1])),
  };
  releaseArt(assets);
  assets = nextArt;
  resources = paths;
  level = undefined;
  menuSong.pause();
  if (menuSongUrl) URL.revokeObjectURL(menuSongUrl);
  const music = paths.get('menuloop.mp3');
  menuSongUrl = music && URL.createObjectURL(music);
  if (menuSongUrl) menuSong.src = menuSongUrl;
  else menuSong.removeAttribute('src');
}

async function selectLevel(entry, launch = false) {
  const version = ++selectionVersion;
  try {
    const track = requireFile(resources, entry.song);
    const parsed = parseLevel(await decodeLevel(await requireFile(resources, entry.path).text()));
    if (version !== selectionVersion || screen !== 'levels') return;
    audio.pause();
    if (songUrl) URL.revokeObjectURL(songUrl);
    songUrl = URL.createObjectURL(track);
    audio.src = songUrl;
    level = parsed;
    selected = entry;
    selectorIndex = selectorEntries.findIndex(item => item.id === entry.id);
    practice = false;
    checkpoint = undefined;
    audioNotice = '';
    attempt = 0;
    run = createRun();
    cameraY = 0;
    const best = profile.results[entry.id]?.best || 0;
    show('ready', entry.name, 'Best ' + best + '%. Press Play level to start.');
    if (launch) begin();
  } catch (error) {
    if (version === selectionVersion) {
      status.textContent = error.message;
      status.classList.add('selector-error');
    }
  }
}

function setImportBusy(busy) {
  choose.disabled = busy;
  chooseZip.disabled = busy;
}

async function importResources(read) {
  setImportBusy(true);
  status.textContent = 'Reading resources locally...';
  try {
    const paths = await read();
    await loadResources(paths);
    libraryNotice = 'Resources saved in this browser.';
    try {
      await rememberResources(paths);
    } catch {
      libraryNotice = 'Resources are available for this visit. Browser storage is unavailable.';
    }
    showMenu();
  } catch (error) {
    status.textContent = error.message;
  } finally {
    setImportBusy(false);
    files.value = '';
    zipInput.value = '';
  }
}

files.addEventListener('change', () => {
  if (!files.files.length) return;
  importResources(() => {
    const paths = new Map();
    for (const file of files.files) {
      const path = file.webkitRelativePath.replace(/^[^/]+\//, '').toLowerCase();
      if (resourceNames.has(path)) paths.set(path, file);
    }
    return paths;
  });
});
zipInput.addEventListener('change', () => {
  if (zipInput.files.length) importResources(() => readResourceZip(zipInput.files[0], resourceNames));
});

async function restoreLibrary() {
  setImportBusy(true);
  try {
    const bundled = await localResources(resourceNames);
    if (bundled) {
      await loadResources(bundled);
      local = true;
      document.querySelector('.bar a').href = 'https://agamer21.github.io/';
      libraryNotice = 'Steam resources loaded automatically on this PC.';
      showMenu();
      return;
    }
    const saved = await recallResources();
    if (!saved) return;
    await loadResources(saved);
    libraryNotice = 'Using the resources saved in this browser.';
    showMenu();
  } catch {
    status.textContent = 'Saved resources could not be restored. Choose your Steam Resources ZIP or folder again.';
  } finally {
    setImportBusy(false);
  }
}

function show(next, heading, text) {
  selectionVersion++;
  screen = next;
  cabinet.dataset.result = effectsEnabled() ? next : '';
  title.textContent = heading;
  message.textContent = text;
  overlay.hidden = next === 'playing';
  const menu = ['menu', 'levels', 'icons', 'settings', 'stats', 'achievements', 'creator'].includes(next);
  overlay.toggleAttribute('data-home', next === 'menu');
  overlay.toggleAttribute('data-selector', next === 'levels');
  if (!menu) menuSong.pause();
  overlay.toggleAttribute('data-menu', menu);
  get('hud').hidden = menu || next === 'import' || next === 'ready';
  menuContent.hidden = !menu && !['ready', 'paused', 'dead', 'complete'].includes(next);
  menuContent.replaceChildren();
  start.hidden = menu || next === 'import';
  start.textContent = next === 'paused' ? 'Resume' : next === 'dead' || next === 'complete' ? 'Try again' : 'Play level';
  choose.hidden = local || next !== 'import' && next !== 'menu';
  chooseZip.hidden = choose.hidden;
  levelsButton.hidden = next !== 'icons';
  iconsButton.hidden = true;
  home.hidden = next === 'import' || next === 'menu';
  pauseButton.hidden = next !== 'playing';
  checkpointButton.hidden = next !== 'playing' || !practice;
  checkpointButton.textContent = checkpoint ? 'Checkpoint saved' : 'Set checkpoint';
  status.classList.remove('selector-error');
  status.textContent = menu ? libraryNotice : audioNotice;
  if (['ready', 'paused', 'dead', 'complete'].includes(next)) {
    const actions = document.createElement('div');
    actions.className = 'round-actions';
    if (next === 'ready' || next === 'paused') {
      actions.append(actionButton(practice ? 'Normal mode' : 'Practice mode', () => {
        recordResult();
        practice = !practice;
        restart();
      }));
    }
    if (next === 'paused') actions.append(actionButton('Restart', restart));
    if (next === 'complete' && !practice) {
      const nextLevel = levels.find(entry => entry.id > selected.id && playable.has(entry.id) &&
        resources.has(entry.path) && resources.has(entry.song));
      if (nextLevel) actions.append(actionButton('Next level', () => {
        showLevels();
        selectLevel(nextLevel, true);
      }));
    }
    actions.append(actionButton('Level selection', () => {
      recordResult();
      audio.pause();
      showLevels();
    }));
    menuContent.append(actions);
  }
}

function startMenuMusic() {
  if (menuSongUrl && !mute.matches('[aria-pressed=true]')) menuSong.play().catch(() => {});
}

function showMenu() {
  recordResult();
  jumpInputs.clear();
  audio.pause();
  startMenuMusic();
  show('menu', 'Geometry Dash', '');
  const logo = document.createElement('canvas');
  logo.width = 430;
  logo.height = 54;
  logo.className = 'native-logo';
  logo.setAttribute('role', 'img');
  logo.setAttribute('aria-label', 'Geometry Dash');
  if (drawSprite('GJ_logo_001.png', 214, 26, 1, logo.getContext('2d'))) title.replaceChildren(logo);
  const actions = { icons: showIcons, levels: showLevels, creator: showCreator,
    settings: showSettings, stats: showStats, achievements: showAchievements };
  for (const [buttons, className] of [[menuButtons, 'main-buttons'], [extraButtons, 'extra-buttons']]) {
    const row = document.createElement('div');
    row.className = className;
    for (const [key, label, sprite, fallback] of buttons) {
      const button = document.createElement('button');
      button.className = 'sprite-button';
      button.type = 'button';
      button.id = 'menu-' + key;
      const art = document.createElement('canvas');
      art.width = art.height = 112;
      art.setAttribute('aria-hidden', 'true');
      const preview = art.getContext('2d');
      if (drawSprite(sprite, 56, 56, 1, preview)) button.append(art);
      else {
        const symbol = document.createElement('span');
        symbol.className = 'fallback-symbol';
        symbol.setAttribute('aria-hidden', 'true');
        symbol.textContent = fallback;
        button.append(symbol);
      }
      const caption = document.createElement('span');
      caption.textContent = label;
      button.append(caption);
      button.addEventListener('click', () => {
        startMenuMusic();
        actions[key]();
      });
      row.append(button);
    }
    menuContent.append(row);
  }
  const links = document.createElement('div');
  links.className = 'official-menu-links';
  for (const [name, href, sprite] of [
    ['Newgrounds', 'https://www.newgrounds.com/audio', 'GJ_ngBtn_001.png'],
    ['Geometry Dash news', 'https://www.geometrydash.com/', 'GJ_newsBtn_001.png'],
    ['RobTop Games', 'https://www.robtopgames.com/', 'robtoplogo_small.png'],
  ]) {
    const link = document.createElement('a');
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', name);
    const art = document.createElement('canvas');
    art.width = 108;
    art.height = 62;
    art.setAttribute('aria-hidden', 'true');
    if (drawSprite(sprite, 54, 31, 1, art.getContext('2d'))) link.append(art);
    else link.textContent = name;
    links.append(link);
  }
  menuContent.append(links);
}

function showCreator() {
  show('creator', 'Creator', 'The editor, online levels, daily levels, and lists are pending.');
}

function effectsEnabled() {
  return profile.effects !== false && !reducedMotion.matches;
}

function actionButton(label, handler) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.addEventListener('click', handler);
  return button;
}

function showSettings() {
  show('settings', 'Settings', 'Adjust music and visual effects.');
  const button = rowButton('Music', audio.muted ? 'Off' : 'On');
  button.addEventListener('click', () => {
    mute.click();
    showSettings();
    menuContent.querySelector('button').focus();
  });
  const effects = rowButton('Visual effects', reducedMotion.matches ? 'Reduced motion' : effectsEnabled() ? 'On' : 'Off');
  effects.disabled = reducedMotion.matches;
  effects.addEventListener('click', () => {
    profile.effects = !effectsEnabled();
    saveProfile(profile);
    showSettings();
    menuContent.lastElementChild.focus();
  });
  menuContent.append(button, effects);
}

function showStats() {
  const results = Object.values(profile.results);
  const completed = results.filter(result => result.best === 100).length;
  const attempts = results.reduce((count, result) => count + result.attempts, 0);
  const coins = results.reduce((count, result) => count + result.coins.length, 0);
  show('stats', 'Stats', completed + ' levels cleared \u00b7 ' + attempts + ' attempts \u00b7 ' + coins + ' secret coins');
}

function showAchievements() {
  show('achievements', 'Achievements', 'Web achievements are earned by clearing levels and collecting secret coins.');
  const list = document.createElement('ul');
  list.className = 'achievement-list';
  for (const skin of skins.filter(entry => entry.goal)) {
    const item = document.createElement('li');
    item.textContent = skin.name + ' ? ' + skin.goal + ' points';
    item.dataset.earned = String(unlockScore(profile) >= skin.goal);
    list.append(item);
  }
  menuContent.append(list);
}

function rowButton(name, description) {
  const button = document.createElement('button');
  button.type = 'button';
  const label = document.createElement('span');
  label.textContent = name;
  const detail = document.createElement('small');
  detail.textContent = description;
  button.append(label, detail);
  return button;
}

function chooseLevelPage(index, direction = 0) {
  selectionVersion++;
  status.classList.remove('selector-error');
  selectorIndex = (index + selectorEntries.length) % selectorEntries.length;
  renderLevelSelector(menuContent, selectorEntries, selectorIndex, {
    back: showMenu,
    choose: chooseLevelPage,
    navigate: delta => chooseLevelPage(selectorIndex + delta, delta),
    result: id => profile.results[id],
    availability: entry => !playable.has(entry.id) ? 'This level is still being ported.'
      : resources.has(entry.path) && resources.has(entry.song) ? 'Ready' : 'Import the resources for this level.',
    draw: drawSprite,
    titleArt: selectorTitle,
    launch: entry => selectLevel(entry, true),
  });
  if (direction) menuContent.querySelector(direction < 0 ? '.selector-left' : '.selector-right').focus({ preventScroll: true });
}

function showLevels() {
  show('levels', 'Select a level', '');
  chooseLevelPage(selectorIndex);
}

function cubeFrame(id, layer = '') {
  return 'player_' + String(id).padStart(2, '0') + layer + '_001.png';
}

function showIcons() {
  const points = unlockScore(profile);
  show('icons', 'Icon kit', 'Earn an unlock point for each level cleared and each unique secret coin saved.');
  const list = document.createElement('div');
  list.className = 'skin-list';
  for (const skin of skins) {
    const button = rowButton(skin.name, points >= skin.goal ? 'Unlocked' : skin.goal + ' points');
    const preview = document.createElement('canvas');
    preview.width = 40;
    preview.height = 40;
    preview.setAttribute('aria-hidden', 'true');
    const paint = preview.getContext('2d');
    drawSprite(cubeFrame(skin.id, '_2'), 20, 20, 1, paint);
    drawSprite(cubeFrame(skin.id), 20, 20, 1, paint);
    button.prepend(preview);
    button.disabled = points < skin.goal || !assets.frames.has(cubeFrame(skin.id));
    button.setAttribute('aria-pressed', String(profile.skin === skin.id));
    button.addEventListener('click', () => {
      profile.skin = skin.id;
      saveProfile(profile);
      showIcons();
      list.querySelector('[aria-pressed=true]')?.focus();
    });
    list.append(button);
  }
  menuContent.append(list);
  list.querySelector('[aria-pressed=true]')?.focus({ preventScroll: true });
}

function percentComplete() {
  return run.result === 'complete' ? 100 : Math.min(99, Math.floor(run.x / level.end * 100));
}

function recordResult() {
  if (recorded || !selected || !level) return;
  recorded = true;
  if (practice) {
    const result = profile.results[selected.id] ||= { best: 0, attempts: 0, coins: [] };
    result.practiceBest = Math.max(result.practiceBest || 0, percentComplete());
    saveProfile(profile);
    return;
  }
  const coins = run.result === 'complete' ? run.collected.map(coin => coin.x + ',' + coin.y) : [];
  const previousCoins = profile.results[selected.id]?.coins || [];
  const savedCoins = new Set([...previousCoins, ...coins]);
  const coinSlots = level.objects.filter(object => object.id === 142)
    .flatMap((coin, index) => savedCoins.has(coin.x + ',' + coin.y) ? [index] : []);
  if (!saveRun(profile, selected.id, percentComplete(), coins, coinSlots)) {
    libraryNotice = 'Progress is available for this visit. Browser storage is unavailable.';
  }
}

levelsButton.addEventListener('click', showLevels);
iconsButton.addEventListener('click', showIcons);
home.addEventListener('click', showMenu);
window.addEventListener('pagehide', recordResult);

function playAudio() {
  audio.play().catch(() => {
    audioNotice = 'Music could not start. Use Sound off / Sound on to retry.';
    status.textContent = audioNotice;
  });
}

function begin() {
  if (!level || !['ready', 'dead', 'complete', 'paused'].includes(screen)) return;
  if (screen !== 'paused') {
    recordResult();
    recorded = false;
    const saved = screen === 'dead' && practice ? checkpoint : undefined;
    run = saved ? { ...saved.run, collected: [...saved.run.collected] } : createRun();
    trail.length = 0;
    sparks.length = 0;
    cameraY = saved?.cameraY ?? 0;
    audio.currentTime = saved?.songTime ?? 0;
    attempt++;
  }
  jumpInputs.clear();
  pendingPress = false;
  accumulator = 0;
  previous = 0;
  show('playing', '', '');
  playAudio();
}

function restart() {
  checkpoint = undefined;
  screen = 'ready';
  begin();
}

function placeCheckpoint() {
  if (!practice || screen !== 'playing') return;
  checkpoint = { run: { ...run, collected: [...run.collected] }, cameraY, songTime: audio.currentTime };
  checkpointButton.textContent = 'Checkpoint saved';
}

function pause() {
  jumpInputs.clear();
  audio.pause();
  show('paused', 'Paused', 'Resume ' + selected.name + ' or press R for a new attempt.');
}

start.addEventListener('click', begin);
pauseButton.addEventListener('click', pause);
checkpointButton.addEventListener('click', placeCheckpoint);
choose.addEventListener('click', () => files.click());
chooseZip.addEventListener('click', () => zipInput.click());
mute.addEventListener('click', () => {
  audio.muted = !audio.muted;
  mute.textContent = audio.muted ? 'Sound off' : 'Sound on';
  mute.setAttribute('aria-pressed', String(audio.muted));
  if (audio.muted) menuSong.pause();
  else if (screen === 'playing') playAudio();
  else if (overlay.hasAttribute('data-menu')) startMenuMusic();
});

function pressJump(input) {
  if (jumpInputs.has(input)) return;
  pendingPress ||= jumpInputs.size === 0;
  jumpInputs.add(input);
}

const jumpCodes = new Set(['Space', 'ArrowUp', 'KeyW']);
window.addEventListener('keydown', event => {
  if (screen === 'levels' && ['ArrowLeft', 'ArrowRight'].includes(event.code)) {
    event.preventDefault();
    const direction = event.code === 'ArrowLeft' ? -1 : 1;
    chooseLevelPage(selectorIndex + direction, direction);
    return;
  }
  if (event.code === 'Escape' && !event.repeat) {
    if (screen === 'playing') pause();
    else if (screen === 'paused') begin();
    else if (['ready', 'dead', 'complete'].includes(screen) || overlay.hasAttribute('data-menu') && screen !== 'menu') showMenu();
  }
  if (event.code === 'KeyZ' && !event.repeat && !event.ctrlKey && !event.metaKey && !event.altKey) placeCheckpoint();
  if (event.code === 'KeyR' && ['playing', 'paused', 'ready', 'dead', 'complete'].includes(screen) && !event.repeat && !event.ctrlKey && !event.metaKey && !event.altKey) {
    restart();
  }
  if (!jumpCodes.has(event.code) || !['playing', 'paused', 'ready', 'dead', 'complete'].includes(screen) || event.target instanceof HTMLButtonElement && screen !== 'playing') return;
  event.preventDefault();
  if (screen !== 'playing' && !event.repeat) begin();
  if (screen === 'playing' && !event.repeat) {
    pressJump(event.code);
  }
});
window.addEventListener('keyup', event => {
  jumpInputs.delete(event.code);
});
canvas.addEventListener('pointerdown', event => {
  if (screen !== 'playing' || event.button !== 0) return;
  event.preventDefault();
  canvas.setPointerCapture(event.pointerId);
  pressJump(event.pointerId);
});
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  canvas.addEventListener(type, event => jumpInputs.delete(event.pointerId));
}
window.addEventListener('blur', () => { if (screen === 'playing') pause(); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden && screen === 'playing') pause();
});

function drawSprite(name, x, y, scale = 1, paint = ctx) {
  const frame = assets.frames.get(name);
  if (!frame) return false;
  const { image, x: sx, y: sy, w, h, ox, oy, rotated } = frame;
  paint.save();
  paint.translate(x + ox * scale, y - oy * scale);
  paint.scale(scale, scale);
  if (rotated) {
    paint.rotate(-Math.PI / 2);
    paint.drawImage(image, sx, sy, h, w, -h / 2, -w / 2, h, w);
  } else {
    paint.drawImage(image, sx, sy, w, h, -w / 2, -h / 2, w, h);
  }
  paint.restore();
  return true;
}

function tiled(image, x, y, size, tint) {
  let tile = tiles.get(image);
  if (!tile) {
    const surface = document.createElement('canvas');
    surface.width = size;
    surface.height = size;
    tile = { surface, paint: surface.getContext('2d'), tint: null };
    tiles.set(image, tile);
  }
  if (tile.tint !== tint) {
    tile.paint.globalCompositeOperation = 'source-over';
    tile.paint.fillStyle = tint;
    tile.paint.fillRect(0, 0, size, size);
    tile.paint.globalCompositeOperation = 'multiply';
    tile.paint.drawImage(image, 0, 0, size, size);
    tile.tint = tint;
  }
  for (let tx = -(x % size) - size; tx < width; tx += size) ctx.drawImage(tile.surface, tx, y);
}

function colorsAt(id, initial) {
  let from = initial;
  let to = initial;
  let x = -Infinity;
  let duration = 0;
  const interpolate = at => {
    const amount = duration ? Math.max(0, Math.min(1, (at - x) / duration)) : 1;
    return to.map((value, i) => from[i] + (value - from[i]) * amount);
  };
  for (const object of level.objects) {
    if (object.x > run.x) break;
    if (object.id !== id) continue;
    from = interpolate(object.x);
    to = object.rgb;
    x = object.x;
    duration = object.duration * 311.58;
  }
  return cssColor(interpolate(run.x));
}

function drawObject(object, x, y, scale) {
  if (object.id === 29 || object.id === 30 || run.collected.includes(object)) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(object.rotation * Math.PI / 180);
  ctx.scale(object.flipX ? -1 : 1, object.flipY ? -1 : 1);
  if (object.id >= 10 && object.id <= 13) {
    const prefix = 'portal_0' + (object.id - 9);
    drawSprite(prefix + '_back_001.png', 0, 0, scale);
    drawSprite(prefix + '_front_001.png', 0, 0, scale);
  } else if (object.id === 40) {
    ctx.fillStyle = '#111728';
    ctx.fillRect(-15 * scale, -3 * scale, 30 * scale, 6 * scale);
    ctx.strokeStyle = '#eef8ff';
    ctx.strokeRect(-15 * scale, -3 * scale, 30 * scale, 6 * scale);
  } else if (!drawSprite(object.sprite, 0, 0, scale) && object.id === 142) {
    ctx.fillStyle = '#ffd94f';
    ctx.beginPath();
    ctx.arc(0, 0, 11 * scale, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function draw() {
  if (assets && overlay.hasAttribute('data-menu')) {
    const travel = performance.now() / 42;
    tiled(assets.background, travel, 0, height, '#274eb2');
    tiled(assets.ground, travel * 2, height - 86, 148, '#263789');
    ctx.fillStyle = '#d7f3ff';
    ctx.fillRect(0, height - 86, width, 2);
    return;
  }
  if (!assets || !level) {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#163780');
    gradient.addColorStop(1, '#348dcc');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#d3f2ff44';
    for (let x = 0; x < width; x += 44) {
      ctx.strokeRect(x, height - 100, 44, 44);
      ctx.strokeRect(x, height - 56, 44, 44);
    }
    return;
  }
  const scale = 1.5;
  const anchor = 210;
  const groundY = height - 82 + cameraY * scale;
  const screenX = x => (x - run.x) * scale + anchor;
  const screenY = y => groundY - y * scale;
  tiled(assets.background, run.x * 0.23, 0, height, colorsAt(29, level.startBackground));
  const bottom = screenY(run.floor);
  if (bottom < height) tiled(assets.ground, run.x * scale - anchor, bottom, 148, colorsAt(30, level.startGround));
  ctx.fillStyle = '#ffffffbb';
  ctx.fillRect(0, bottom, width, 2);
  if (Number.isFinite(run.ceiling)) ctx.fillRect(0, screenY(run.ceiling), width, 2);
  for (const object of nearby(level, run.x - 200, run.x + 560)) {
    drawObject(object, screenX(object.x), screenY(object.y), scale);
  }
  ctx.save();
  if (effectsEnabled()) {
    ctx.fillStyle = run.mode === 'ship' ? '#ffc358' : '#a7f5ff';
    for (const sample of trail) {
      const remaining = 1 - (run.ticks - sample.tick) / 36;
      ctx.globalAlpha = Math.max(0, remaining * 0.55);
      ctx.fillRect(screenX(sample.x) - 4, screenY(sample.y) - 3, 7 * remaining, 6 * remaining);
    }
    for (const particle of sparks) {
      ctx.fillStyle = particle.color;
      const age = (run.ticks - particle.tick) / 240;
      ctx.globalAlpha = Math.max(0, 1 - age * 3.5);
      ctx.fillRect(screenX(particle.x + particle.vx * age), screenY(particle.y + particle.vy * age - 110 * age ** 2), 4, 4);
    }
    ctx.globalAlpha = 1;
  }
  ctx.translate(anchor, screenY(run.y));
  ctx.rotate(-run.angle);
  ctx.scale(1, run.direction);
  if (run.mode === 'ship') {
    drawSprite('ship_01_2_001.png', 0, 4, scale);
    drawSprite('ship_01_001.png', 0, 4, scale);
    drawSprite(cubeFrame(profile.skin), 0, -6, scale * 0.5);
  } else {
    drawSprite(cubeFrame(profile.skin, '_2'), 0, 0, scale);
    drawSprite(cubeFrame(profile.skin), 0, 0, scale);
  }
  ctx.restore();
}

function frame(now) {
  if (screen === 'playing') {
    const elapsed = previous ? Math.min(0.07, (now - previous) / 1000) : 0;
    accumulator += elapsed;
    previous = now;
    while (accumulator >= STEP && run.result === 'running') {
      const wasGrounded = run.grounded;
      const portal = run.portal;
      const coins = run.coins;
      const boost = run.boost;
      const isHeld = jumpInputs.size > 0;
      stepRun(run, level, isHeld || pendingPress, pendingPress || undefined);
      pendingPress = false;
      if (effectsEnabled()) {
        if (run.ticks % 3 === 0) {
          trail.push({ x: run.x, y: run.y, tick: run.ticks });
          if (trail.length > 12) trail.shift();
        }
        const ring = run.portal !== portal || run.coins !== coins || run.boost !== boost;
        if (ring || (!wasGrounded && run.grounded)) {
          const color = run.coins !== coins ? '#ffe464' : run.portal !== portal ? '#7cffed' : '#fff3a7';
          const count = ring ? 12 : 6;
          for (let ray = 0; ray < count; ray++) {
            const angle = ring ? ray * Math.PI * 2 / count : Math.PI * (0.2 + ray * 0.6 / count) * run.direction;
            sparks.push({ x: run.x, y: run.y, tick: run.ticks, vx: Math.cos(angle) * 115, vy: Math.sin(angle) * 115, color });
          }
        }
        while (sparks.length && run.ticks - sparks[0].tick > 68) sparks.shift();
      }
      accumulator -= STEP;
    }
    const cameraTarget = run.mode === 'ship' ? run.floor + 18 : Math.max(0, run.y - 185);
    cameraY += (cameraTarget - cameraY) * (1 - 0.91 ** (elapsed * 60));
    const percent = percentComplete();
    progress.value = percent;
    get('percent').textContent = percent + '%';
    get('attempt').textContent = (practice ? 'Practice ' : '') + 'Attempt ' + attempt;
    draw();
    if (run.result !== 'running') {
      recordResult();
      audio.pause();
      const sound = assets.sounds.get(run.result);
      if (sound && !audio.muted) new Audio(sound).play().catch(() => {});
      if (run.result === 'complete') show('complete', practice ? 'Practice complete' : 'Level complete', '100% Â· ' + run.coins + ' / 3 coins');
      else show('dead', 'Try again', percent + '% Â· Press Space to retry.');
    }
  } else if (!level || screen === 'ready' || overlay.hasAttribute('data-menu')) {
    draw();
  }
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

restoreLibrary();
