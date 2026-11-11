const STEP = 1 / 240;
const SPEED = 311.58;
const GRAVITY = 3449.52;
const JUMP_SPEED = 670.80;
// Measured from Steam Stereo Madness and Dry Out openings at 240 steps per second.
const STEAM_CUBE = { stepX: 1.298250436782837, gravity: 2799.36, jumpSpeed: 603.72 };
const PLAYER_HALF = 12;
const CUBE_HALF = 15;
const HAZARDS = new Set([8, 9, 39, 103]);
const SPIKE_HEIGHTS = new Map([[8, 12], [39, 5.6], [216, 12]]);
const SAW_IDS = new Set([89, 187]);
const NATIVE_CONTACT_LEVELS = new Set([6, 9, 12, 13, 15, 18, 21]);

const sprites = new Map([
  ...Array.from({ length: 7 }, (_, i) => [i + 1, 'square_0' + (i + 1) + '_001.png']),
  [8, 'spike_01_001.png'], [9, 'pit_01_001.png'],
  [15, 'rod_01_001.png'], [16, 'rod_02_001.png'], [17, 'rod_03_001.png'],
  [18, 'd_spikes_01_001.png'], [19, 'd_spikes_02_001.png'], [20, 'd_spikes_03_001.png'],
  [21, 'd_spikes_04_001.png'],
  [35, 'bump_01_001.png'], [36, 'ring_01_001.png'], [39, 'spike_02_001.png'],
  [41, 'chain_01_001.png'], [54, 'pit_01_low_001.png'], [62, 'pit_02_001.png'],
  [65, 'pit_03_001.png'], [89, 'sawblade_02_001.png'], [103, 'spike_03_001.png'], [142, 'secretCoin_01_001.png'],
]);

function pairs(value, separator = ',') {
  const parts = value.split(separator);
  const result = new Map();
  for (let i = 0; i + 1 < parts.length; i += 2) result.set(parts[i], parts[i + 1]);
  return result;
}

export async function decodeLevel(value) {
  // Some shipped levels terminate the encoded string with a NUL before trailing bytes.
  const normalized = value.split('\0', 1)[0].trim().replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '');
  const raw = Uint8Array.from(atob(normalized), char => char.charCodeAt(0));
  const stream = new Blob([raw]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Response(stream).text();
}

function color(fields, keys, fallback) {
  const channels = keys.map(key => Number(fields.get(key)));
  return channels.every(Number.isFinite) ? channels : fallback;
}

export function parseLevel(text, { steamCube: calibratedCube = false, levelId } = {}) {
  const steamCube = calibratedCube || levelId === 4;
  const [settings, ...rows] = text.split(';');
  const header = pairs(settings);
  const startBackground = color(pairs(header.get('kS29') || '', '_'), ['1', '2', '3'], [40, 62, 255]);
  const startGround = color(pairs(header.get('kS30') || '', '_'), ['1', '2', '3'], [0, 19, 200]);
  const objects = rows.filter(row => row.trim()).map(row => {
    const data = pairs(row);
    const id = Number(data.get('1'));
    const x = Number(data.get('2'));
    const y = Number(data.get('3'));
    const rotation = Number(data.get('6') || 0);
    const flipX = data.get('4') === '1';
    const flipY = data.get('5') === '1';
    const noGlow = data.get('96') === '1';
    const rgb = color(data, ['7', '8', '9'], [40, 62, 255]);
    const duration = Number(data.get('10') || 0);
    return { id, x, y, rotation, flipX, flipY, noGlow, rgb, duration, sprite: sprites.get(id) };
  }).filter(({ id, x, y }) => [id, x, y].every(Number.isFinite)).sort((a, b) => a.x - b.x);
  if (!header.has('kA2') || objects.length < 100 || !objects.some(o => o.id === 13)) {
    throw new Error('This file does not look like a supported Steam level.');
  }
  const maxY = objects.reduce((top, object) => Math.max(top, object.y), 0);
  const bins = new Map();
  for (const object of objects) {
    const bin = Math.floor(object.x / 60);
    if (!bins.has(bin)) bins.set(bin, []);
    bins.get(bin).push(object);
  }
  const nativeContacts = calibratedCube || NATIVE_CONTACT_LEVELS.has(levelId);
  const measuredShortSpikes = nativeContacts || [2, 3, 4, 5, 7].includes(levelId);
  const measuredPads = levelId === 2 || levelId === 4;
  return { objects, bins, maxY, steamCube, nativeContacts, measuredShortSpikes, measuredPads, end: objects.at(-1).x + 210, startBackground, startGround };
}

export function nearby(level, min, max) {
  const result = [];
  for (let bin = Math.floor(min / 60); bin <= Math.floor(max / 60); bin++) {
    for (const object of level.bins.get(bin) || []) {
      if (object.x >= min && object.x <= max) result.push(object);
    }
  }
  return result;
}

export function createRun() {
  return {
    x: 0, y: 15, vy: 0, angle: 0, grounded: true, mode: 'cube', floor: 0, ceiling: Infinity,
    ticks: 0, result: 'running', portal: null, boost: null, padFlight: false, padLaunch: false,
    direction: 1, lastHeld: false, pressedAt: -Infinity, coins: 0, collected: [],
  };
}

function overlaps(x, y, object, halfX, halfY) {
  return Math.abs(x - object.x) < halfX && Math.abs(y - object.y) < halfY;
}

export function stepRun(run, level, held, pressed = held && !run.lastHeld) {
  if (run.result !== 'running') return;
  const previousY = run.y;
  const previousX = run.x;
  const nativeCube = level.steamCube && run.mode === 'cube';
  run.x = nativeCube ? Math.fround(run.x + STEAM_CUBE.stepX) : run.x + SPEED * STEP;
  run.ticks++;
  if (pressed) run.pressedAt = run.ticks;
  run.lastHeld = held;
  const reach = level.nativeContacts ? 40 : 33;
  const objects = nearby(level, previousX - reach, run.x + reach);
  for (const object of objects) {
    if (object.id >= 10 && object.id <= 13 && run.portal !== object &&
        overlaps(run.x, run.y, object, 21, object.rotation % 180 ? 24 : 55)) {
      run.portal = object;
      if (object.id === 10 || object.id === 11) {
        run.direction = object.id === 11 ? -1 : 1;
        run.grounded = false;
        continue;
      }
      run.mode = object.id === 13 ? 'ship' : 'cube';
      run.padFlight = run.padLaunch = false;
      if (run.mode === 'ship') {
        run.floor = Math.max(0, Math.round((object.y - 150) / 30) * 30);
        run.ceiling = run.floor + 300;
        run.vy *= 0.4;
      } else {
        run.floor = 0;
        run.ceiling = Infinity;
      }
    }
    if (run.mode === 'cube' && run.boost !== object) {
      const pad = object.id === 35 && !level.measuredPads && overlaps(run.x, run.y, object, 21, 20);
      const orb = object.id === 36 && run.ticks - run.pressedAt <= 9 &&
        overlaps(run.x, run.y, object, 23, 27);
      if (pad || orb) {
        run.boost = object;
        run.pressedAt = -Infinity;
        run.vy = (pad ? 1000 : JUMP_SPEED) * run.direction;
        run.grounded = false;
      }
    }
    if (object.id === 142 && !run.collected.includes(object) && overlaps(run.x, run.y, object, 23, 25)) {
      run.coins++;
      run.collected = [...run.collected, object];
    }
  }
  const jumping = run.mode === 'cube' && run.grounded && held;
  const calibrated = (level.steamCube || run.padFlight) && run.mode === 'cube';
  const cubeGravity = calibrated ? STEAM_CUBE.gravity : GRAVITY;
  if (run.mode === 'cube') {
    if (jumping) {
      run.vy = (calibrated ? STEAM_CUBE.jumpSpeed : JUMP_SPEED) * run.direction;
      run.grounded = false;
    }
    run.vy = Math.max(-900, run.vy * run.direction - cubeGravity * STEP) * run.direction;
  } else {
    const velocity = run.vy * run.direction;
    const acceleration = held ? (velocity < 0 ? 0.5 : 0.4) : (velocity > 0 ? -0.48 : -0.32);
    run.vy = Math.max(-384, Math.min(480, velocity + GRAVITY * acceleration * STEP)) * run.direction;
  }
  const jumpTickOffset = calibrated && (jumping || run.padLaunch) ? cubeGravity * STEP * run.direction : 0;
  run.padLaunch = false;
  run.y += (run.vy + jumpTickOffset) * STEP;
  const half = run.mode === 'ship' ? 9 : PLAYER_HALF;
  const foot = run.mode === 'ship' ? 9 : 15;
  run.grounded = false;
  if (run.y <= run.floor + foot) {
    run.y = run.floor + foot;
    run.vy = 0;
    run.grounded = run.direction === 1;
  } else if (run.y > run.ceiling - foot) {
    run.y = run.ceiling - foot;
    run.vy = Math.min(0, run.vy);
    run.grounded = run.direction === -1;
  }

  let padContact;
  for (const object of objects) {
    if (object.id === 35 && level.measuredPads && run.mode === 'cube' && run.boost !== object &&
        overlaps(run.x, run.y, object, CUBE_HALF + 12.5, CUBE_HALF + 2)) {
      padContact ??= object;
    } else if ((object.id >= 1 && object.id <= 7) || object.id === 40) {
      const edge = object.id === 40 ? 3 : 15;
      if (!overlaps(run.x, run.y, object, 15 + half, edge + foot)) continue;
      const center = object.y * run.direction;
      const top = center + edge;
      const inset = run.mode === 'ship' ? 9 : 5;
      const previous = previousY * run.direction;
      const current = run.y * run.direction;
      const velocity = run.vy * run.direction;
      if (velocity <= 0 && Math.max(previous, current) - inset >= top) {
        run.y = (top + foot) * run.direction;
        run.vy = 0;
        run.grounded = true;
      } else if (run.mode === 'ship' && velocity > 0 && previous + foot <= center - edge + 0.1) {
        run.y = (center - edge - foot) * run.direction;
        run.vy = 0;
      } else if (overlaps(run.x, run.y, object, 19.5, edge + 4.5)) {
        run.result = 'dead';
      }
    } else if (level.nativeContacts && run.mode === 'cube' && SAW_IDS.has(object.id)) {
      // Effective contact distance fitted to the four measured native opening contacts.
      if (Math.hypot(run.x - object.x, run.y - object.y) < 39.4) run.result = 'dead';
    } else if (HAZARDS.has(object.id) || (level.nativeContacts && object.id === 216)) {
      const upsideDown = object.flipY !== (Math.abs(object.rotation % 360) === 180);
      const vertical = Math.abs(object.rotation % 180) === 90;
      const spikeHeight = SPIKE_HEIGHTS.get(object.id);
      if (run.mode === 'cube' && spikeHeight && (object.id !== 39 || level.measuredShortSpikes)) {
        const halfWidth = CUBE_HALF + 3;
        const halfHeight = CUBE_HALF + spikeHeight / 2;
        if (overlaps(run.x, run.y, object, vertical ? halfHeight : halfWidth, vertical ? halfWidth : halfHeight)) run.result = 'dead';
        continue;
      }
      const height = object.id === 9 ? 8 : object.id === 39 ? 12 : 25;
      const extent = object.id === 9 ? 10 : half * 0.69;
      const center = object.id === 9 ? object.y + 2 : object.y + (upsideDown ? 1 : -1) * (15 - height / 2);
      if (vertical ? overlaps(run.x, run.y, object, 10 + extent, 8 + extent)
        : Math.abs(run.x - object.x) < (object.id === 9 ? 11 : 6) + extent &&
          Math.abs(run.y - center) < height / 2 + extent) {
        run.result = 'dead';
      }
    }
  }
  if (run.grounded) run.padFlight = false;
  if (padContact && run.result === 'running') {
    // Steam applies the yellow pad's 16 × 54 impulse after the contact step.
    run.boost = padContact;
    run.pressedAt = -Infinity;
    run.vy = 864 * run.direction;
    run.grounded = false;
    run.padFlight = run.padLaunch = true;
  }
  if (run.y > level.maxY + 240) run.result = 'dead';
  if (run.mode === 'ship') run.angle = Math.atan2(run.vy, SPEED) * 0.7;
  else if (!run.grounded) run.angle -= STEP * Math.PI * 2.35;
  else run.angle = Math.round(run.angle / (Math.PI / 2)) * (Math.PI / 2);
  if (run.result === 'running' && run.x >= level.end) run.result = 'complete';
}

export { STEP };
