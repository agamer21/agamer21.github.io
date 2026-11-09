export const levels = [
  [1, 'Stereo Madness', 'StereoMadness'],
  [2, 'Back on Track', 'BackOnTrack'],
  [3, 'Polargeist', 'Polargeist'],
  [4, 'Dry Out', 'DryOut'],
  [5, 'Base After Base', 'BaseAfterBase'],
  [6, "Can't Let Go", 'CantLetGo'],
  [7, 'Jumper', 'Jumper'],
  [8, 'Time Machine', 'TimeMachine'],
  [9, 'Cycles', 'Cycles'],
  [10, 'xStep', 'xStep'],
  [11, 'Clutterfunk', 'Clutterfunk'],
  [12, 'Theory of Everything', 'TheoryOfEverything'],
  [13, 'Electroman Adventures', 'Electroman'],
  [14, 'Clubstep', 'Clubstep'],
  [15, 'Electrodynamix', 'Electrodynamix'],
  [16, 'Hexagon Force', 'HexagonForce'],
  [17, 'Blast Processing', 'BlastProcessing'],
  [18, 'Theory of Everything 2', 'TheoryOfEverything2'],
  [19, 'Geometrical Dominator', 'GeometricalDominator'],
  [20, 'Deadlocked', 'Deadlocked'],
  [21, 'Fingerdash', 'Fingerdash'],
  [22, 'Dash', 'Dash'],
  [3001, 'The Challenge', 'StayInsideMe'],
  [5001, 'The Tower'],
  [5002, 'The Sewers'],
  [5003, 'The Cellar'],
  [5004, 'The Secret Hollow'],
].map(([id, name, song]) => ({ id, name, song: song && song.toLowerCase() + '.mp3', path: 'levels/' + id + '.txt' }));

export const playable = new Set([1, 2, 3, 4, 5, 7]);

export const skins = [
  { id: 1, name: 'Classic', goal: 0 },
  { id: 2, name: 'Dash I', goal: 1 },
  { id: 3, name: 'Dash II', goal: 2 },
  { id: 4, name: 'Dash III', goal: 3 },
  { id: 5, name: 'Dash IV', goal: 4 },
  { id: 6, name: 'Dash V', goal: 5 },
];

const profileKey = 'agArcade.geometryDash.profile.v1';
export function readProfile() {
  try {
    const saved = JSON.parse(localStorage.getItem(profileKey));
    if (saved?.results && typeof saved.results === 'object') return saved;
  } catch { /* Storage can be unavailable in a private browser. */ }
  return { results: {}, skin: 1 };
}

export function saveProfile(profile) {
  try {
    localStorage.setItem(profileKey, JSON.stringify(profile));
    return true;
  } catch { return false; }
}

let database;
function openDatabase() {
  if (!database) database = new Promise((resolve, reject) => {
    const request = indexedDB.open('agArcade.geometryDash.resources', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('library');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }).catch(error => {
    database = undefined;
    throw error;
  });
  return database;
}

export async function recallResources() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction('library').objectStore('library').get('steam-v1');
    request.onsuccess = () => resolve(request.result ? new Map(request.result) : null);
    request.onerror = () => reject(request.error);
  });
}

export async function rememberResources(paths) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('library', 'readwrite');
    transaction.objectStore('library').put([...paths], 'steam-v1');
    transaction.oncomplete = resolve;
    transaction.onabort = () => reject(transaction.error);
  });
}

export function saveRun(profile, id, percent, coins) {
  const previous = profile.results[id] || { best: 0, attempts: 0, coins: [] };
  profile.results[id] = {
    best: Math.max(previous.best, percent),
    attempts: previous.attempts + 1,
    coins: [...new Set([...previous.coins, ...coins])],
  };
  return saveProfile(profile);
}

export function unlockScore(profile) {
  return Object.values(profile.results).reduce((total, row) =>
    total + Number(row.best === 100) + row.coins.length, 0);
}
