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
const mute = get('mute');
const status = get('status');
const progress = get('progress');
const menuContent = get('menu-content');
const levelsButton = get('levels');
const iconsButton = get('icons');
const home = get('home');
const pauseButton = get('pause');
const profile = readProfile();
const audio = new Audio();
const atlases = ['GJ_GameSheet', 'GJ_GameSheet02', 'GJ_GameSheetIcons'];
let assets;
let resources;
let selected;
let recorded = true;
let selectionVersion = 0;
let libraryNotice = '';
let level;
let run = createRun();
let held = false;
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
  for (const image of [...images, art.background, art.ground]) image.close();
}

const commonFiles = [
  'game_bg_01_001.png', 'groundsquare_01_001.png',
  ...atlases.flatMap(name => [name.toLowerCase() + '.plist', name.toLowerCase() + '.png']),
];
const resourceNames = new Set([...commonFiles, ...levels.flatMap(entry => [entry.path, entry.song])]);

function requireFile(paths, path) {
  const file = paths.get(path.toLowerCase());
  if (!file) throw new Error('Missing ' + path + '. Choose the Resources folder inside Geometry Dash.');
  return file;
}

async function loadResources(paths) {
  const find = path => requireFile(paths, path);
  commonFiles.forEach(find);
  find(levels[0].path);
  find(levels[0].song);
  parseLevel(await decodeLevel(await find(levels[0].path).text()));
  const sprites = await Promise.all(atlases.map(name => readAtlas(find, name)));
  const nextArt = {
    frames: new Map(sprites.flatMap(sheet => [...sheet])),
    background: await createImageBitmap(find(commonFiles[0])),
    ground: await createImageBitmap(find(commonFiles[1])),
  };
  releaseArt(assets);
  assets = nextArt;
  resources = paths;
  level = undefined;
}

async function selectLevel(entry) {
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
    audioNotice = '';
    attempt = 0;
    run = createRun();
    cameraY = 0;
    const best = profile.results[entry.id]?.best || 0;
    show('ready', entry.name, 'Best ' + best + '% ? Press Play level to start.');
  } catch (error) {
    if (version === selectionVersion) status.textContent = error.message;
  }
}

files.addEventListener('change', async () => {
  if (!files.files.length) return;
  const paths = new Map();
  for (const file of files.files) {
    const path = file.webkitRelativePath.replace(/^[^/]+\//, '').toLowerCase();
    if (resourceNames.has(path)) paths.set(path, file);
  }
  choose.disabled = true;
  status.textContent = 'Reading resources locally?';
  try {
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
    choose.disabled = false;
    files.value = '';
  }
});

async function restoreLibrary() {
  choose.disabled = true;
  try {
    const saved = await recallResources();
    if (!saved) return;
    await loadResources(saved);
    libraryNotice = 'Using the resources saved in this browser.';
    showMenu();
  } catch {
    status.textContent = 'Saved resources could not be restored. Choose the Steam Resources folder again.';
  } finally {
    choose.disabled = false;
  }
}

function show(next, heading, text) {
  selectionVersion++;
  screen = next;
  title.textContent = heading;
  message.textContent = text;
  overlay.hidden = next === 'playing';
  const menu = ['menu', 'levels', 'icons'].includes(next);
  overlay.toggleAttribute('data-menu', menu);
  get('hud').hidden = menu || next === 'import' || next === 'ready';
  menuContent.hidden = next !== 'levels' && next !== 'icons';
  menuContent.replaceChildren();
  start.hidden = menu || next === 'import';
  start.textContent = next === 'paused' ? 'Resume' : next === 'dead' || next === 'complete' ? 'Try again' : 'Play level';
  choose.hidden = next !== 'import' && next !== 'menu';
  levelsButton.hidden = !menu;
  iconsButton.hidden = !menu;
  home.hidden = next === 'import' || next === 'menu';
  pauseButton.hidden = next !== 'playing';
  status.textContent = menu ? libraryNotice : audioNotice;
}

function showMenu() {
  recordResult();
  held = false;
  audio.pause();
  const cleared = Object.values(profile.results).filter(result => result.best === 100).length;
  show('menu', 'Geometry Dash', cleared + ' levels cleared ? ' + unlockScore(profile) + ' unlock points');
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

function showLevels() {
  show('levels', 'Select a level', 'Choose a level marked ready. The catalog includes the 27 maps in the Steam install.');
  const list = document.createElement('ul');
  list.className = 'menu-list';
  for (const entry of levels) {
    const result = profile.results[entry.id];
    const available = playable.has(entry.id) && resources.has(entry.path) && resources.has(entry.song);
    const detail = available ? (result ? result.best + '% ? ' + result.coins.length + ' coins' : 'Ready')
      : playable.has(entry.id) ? 'Files needed' : 'Port pending';
    const item = document.createElement('li');
    const button = rowButton(entry.name, detail);
    button.disabled = !available;
    button.addEventListener('click', () => selectLevel(entry));
    item.append(button);
    list.append(item);
  }
  menuContent.append(list);
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
  const coins = run.result === 'complete' ? run.collected.map(coin => coin.x + ',' + coin.y) : [];
  if (!saveRun(profile, selected.id, percentComplete(), coins)) {
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
    run = createRun();
    cameraY = 0;
    audio.currentTime = 0;
    attempt++;
  }
  held = false;
  accumulator = 0;
  previous = 0;
  show('playing', '', '');
  playAudio();
}

function pause() {
  held = false;
  audio.pause();
  show('paused', 'Paused', 'Resume ' + selected.name + ' or press R for a new attempt.');
}

start.addEventListener('click', begin);
pauseButton.addEventListener('click', pause);
choose.addEventListener('click', () => files.click());
mute.addEventListener('click', () => {
  audio.muted = !audio.muted;
  mute.textContent = audio.muted ? 'Sound off' : 'Sound on';
  mute.setAttribute('aria-pressed', String(audio.muted));
  if (!audio.muted && screen === 'playing') playAudio();
});

const jumpCodes = new Set(['Space', 'ArrowUp', 'KeyW']);
window.addEventListener('keydown', event => {
  if (event.code === 'Escape' && !event.repeat) {
    if (screen === 'playing') pause();
    else if (screen === 'paused') begin();
    else if (['ready', 'dead', 'complete', 'levels', 'icons'].includes(screen)) showMenu();
  }
  if (event.code === 'KeyR' && ['playing', 'paused', 'ready', 'dead', 'complete'].includes(screen) && !event.repeat && !event.ctrlKey && !event.metaKey && !event.altKey) {
    screen = 'ready';
    begin();
  }
  if (!jumpCodes.has(event.code) || !['playing', 'paused', 'ready', 'dead', 'complete'].includes(screen) || event.target instanceof HTMLButtonElement && screen !== 'playing') return;
  event.preventDefault();
  if (screen !== 'playing' && !event.repeat) begin();
  else if (screen === 'playing') held = true;
});
window.addEventListener('keyup', event => {
  if (jumpCodes.has(event.code)) held = false;
});
canvas.addEventListener('pointerdown', event => {
  if (screen !== 'playing' || event.button !== 0) return;
  event.preventDefault();
  canvas.setPointerCapture(event.pointerId);
  held = true;
});
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  canvas.addEventListener(type, () => { held = false; });
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
  if (!assets || !level || ['menu', 'levels', 'icons'].includes(screen)) {
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
    if (previous) accumulator += Math.min(0.07, (now - previous) / 1000);
    previous = now;
    while (accumulator >= STEP && run.result === 'running') {
      stepRun(run, level, held);
      accumulator -= STEP;
    }
    const cameraTarget = run.mode === 'ship' ? run.floor + 18 : Math.max(0, run.y - 185);
    cameraY += (cameraTarget - cameraY) * 0.09;
    const percent = percentComplete();
    progress.value = percent;
    get('percent').textContent = percent + '%';
    get('attempt').textContent = 'Attempt ' + attempt;
    draw();
    if (run.result !== 'running') {
      recordResult();
      audio.pause();
      if (run.result === 'complete') show('complete', 'Level complete', '100% Â· ' + run.coins + ' / 3 coins');
      else show('dead', 'Try again', percent + '% Â· Press Space to retry.');
    }
  } else if (!level || screen === 'ready' || ['menu', 'levels', 'icons'].includes(screen)) {
    draw();
  }
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

restoreLibrary();
