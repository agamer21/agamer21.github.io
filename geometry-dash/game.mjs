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
const audio = new Audio();
const atlases = ['GJ_GameSheet', 'GJ_GameSheet02', 'GJ_GameSheetIcons'];
let assets;
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

async function loadResources(list) {
  const paths = new Map([...list].map(file => [file.webkitRelativePath.replace(/^[^/]+\//, '').toLowerCase(), file]));
  const find = path => {
    const file = paths.get(path.toLowerCase());
    if (!file) throw new Error('Missing ' + path + '. Choose the Resources folder inside Geometry Dash.');
    return file;
  };
  const song = find('StereoMadness.mp3');
  const map = find('levels/1.txt');
  const background = find('game_bg_01_001.png');
  const ground = find('groundSquare_01_001.png');
  for (const name of atlases) {
    find(name + '.plist');
    find(name + '.png');
  }
  const parsed = parseLevel(await decodeLevel(await map.text()));
  const sprites = await Promise.all(atlases.map(name => readAtlas(find, name)));
  const nextArt = {
    frames: new Map(sprites.flatMap(sheet => [...sheet])),
    background: await createImageBitmap(background),
    ground: await createImageBitmap(ground),
  };
  releaseArt(assets);
  assets = nextArt;
  level = parsed;
  audio.pause();
  if (songUrl) URL.revokeObjectURL(songUrl);
  songUrl = URL.createObjectURL(song);
  audio.src = songUrl;
  audioNotice = '';
  attempt = 0;
  run = createRun();
  cameraY = 0;
}

files.addEventListener('change', async () => {
  if (!files.files.length) return;
  choose.disabled = true;
  start.disabled = true;
  status.textContent = 'Reading level, sprites, and music locally…';
  try {
    await loadResources(files.files);
    show('ready', 'Stereo Madness', 'Original Steam level loaded. Press play or Space to start.');
    status.textContent = level.objects.length.toLocaleString() + ' level objects loaded.';
  } catch (error) {
    status.textContent = error.message;
  } finally {
    choose.disabled = false;
    start.disabled = false;
    files.value = '';
  }
});

function show(next, heading, text) {
  screen = next;
  title.textContent = heading;
  message.textContent = text;
  overlay.hidden = next === 'playing';
  get('hud').hidden = next === 'import' || next === 'ready';
  start.hidden = !level;
  start.textContent = next === 'paused' ? 'Resume' : next === 'dead' || next === 'complete' ? 'Try again' : 'Play level';
  choose.hidden = next === 'paused';
  status.textContent = audioNotice;
}

function playAudio() {
  audio.play().catch(() => {
    audioNotice = 'Music could not start. Use Sound off / Sound on to retry.';
    status.textContent = audioNotice;
  });
}

function begin() {
  if (!level || start.disabled) return;
  if (screen !== 'paused') {
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
  show('paused', 'Paused', 'Resume Stereo Madness or press R for a new attempt.');
}

start.addEventListener('click', begin);
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
  }
  if (event.code === 'KeyR' && level && !event.repeat && !event.ctrlKey && !event.metaKey && !event.altKey) {
    screen = 'ready';
    begin();
  }
  if (!jumpCodes.has(event.code) || !level || event.target instanceof HTMLButtonElement && screen !== 'playing') return;
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

function drawSprite(name, x, y, scale = 1) {
  const frame = assets.frames.get(name);
  if (!frame) return false;
  const { image, x: sx, y: sy, w, h, ox, oy, rotated } = frame;
  ctx.save();
  ctx.translate(x + ox * scale, y - oy * scale);
  ctx.scale(scale, scale);
  if (rotated) {
    ctx.rotate(-Math.PI / 2);
    ctx.drawImage(image, sx, sy, h, w, -h / 2, -w / 2, h, w);
  } else {
    ctx.drawImage(image, sx, sy, w, h, -w / 2, -h / 2, w, h);
  }
  ctx.restore();
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
  if (object.id === 12 || object.id === 13) {
    const prefix = object.id === 13 ? 'portal_04' : 'portal_03';
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
  if (!assets) {
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
  if (run.mode === 'ship') {
    drawSprite('ship_01_2_001.png', 0, 4, scale);
    drawSprite('ship_01_001.png', 0, 4, scale);
    drawSprite('player_01_001.png', 0, -6, scale * 0.5);
  } else {
    drawSprite('player_01_2_001.png', 0, 0, scale);
    drawSprite('player_01_001.png', 0, 0, scale);
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
    const percent = Math.min(100, Math.floor(run.x / level.end * 100));
    progress.value = percent;
    get('percent').textContent = percent + '%';
    get('attempt').textContent = 'Attempt ' + attempt;
    draw();
    if (run.result !== 'running') {
      audio.pause();
      if (run.result === 'complete') show('complete', 'Level complete', '100% · ' + run.coins + ' / 3 coins');
      else show('dead', 'Try again', percent + '% · Press Space to retry.');
    }
  } else if (!level || screen === 'ready') {
    draw();
  }
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
