import { initializeApp, getApps, getAuth, signInAnonymously, getDatabase,
  ref, set, remove, onValue, onDisconnect, runTransaction } from './firebase-sdk.js';
import { firebaseConfig } from './firebase-config.js';

let badge;
let peakBadge;
const peakStorageKey = 'ag-arcade-presence-peak';
const validPeak = value => Number.isSafeInteger(value) && value > 0;

function readCachedPeak() {
  try {
    const value = Number(localStorage.getItem(peakStorageKey));
    return validPeak(value) ? value : 0;
  } catch { return 0; }
}

let allTimePeak = readCachedPeak();
let sharedPeak = null;

function rememberPeak(value) {
  allTimePeak = Math.max(allTimePeak, value, readCachedPeak());
  try { localStorage.setItem(peakStorageKey, String(allTimePeak)); } catch {}
}

function ensureBadges() {
  if (badge) return;
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = '/assets/arcade/presence.css';
  document.head.append(style);

  badge = document.createElement('span');
  badge.className = 'arcade-online';
  badge.setAttribute('role', 'status');
  badge.setAttribute('aria-live', 'polite');
  badge.title = 'Live visitors across AG Arcade and its hosted games. One count per browser, including multiple tabs. Disconnects may take a moment to clear.';

  peakBadge = document.createElement('span');
  peakBadge.className = 'arcade-online arcade-online-peak';
  peakBadge.setAttribute('aria-live', 'polite');
  peakBadge.hidden = true;

  const actions = document.querySelector('.header-actions, .player-header, .bar, body > header');
  if (actions) {
    actions.prepend(peakBadge);
    actions.prepend(badge);
  } else {
    badge.classList.add('arcade-online-floating');
    peakBadge.classList.add('arcade-online-floating', 'arcade-online-peak-floating');
    document.body.append(badge, peakBadge);
  }
}

function render(text, connected) {
  ensureBadges();
  badge.textContent = text;
  badge.dataset.connected = String(connected);
  const confirmed = connected && sharedPeak === allTimePeak;
  peakBadge.hidden = allTimePeak === 0;
  peakBadge.textContent = allTimePeak ? `All-time peak ${allTimePeak}` : '';
  peakBadge.dataset.connected = String(confirmed);
  peakBadge.title = confirmed
    ? 'Highest number of visitors online at the same time across AG Arcade.'
    : 'Highest recorded count saved in this browser. The shared record is not confirmed right now.';
}

async function start() {
  render('Connecting…', false);
  const waiting = setTimeout(() => render('Online unavailable', false), 12000);
  const app = getApps().find(app => app.name === 'ag-arcade-presence')
    ?? initializeApp(firebaseConfig, 'ag-arcade-presence');
  const auth = getAuth(app);
  const signIn = async () => {
    await auth.authStateReady();
    if (!auth.currentUser) await signInAnonymously(auth);
  };
  if (navigator.locks) await navigator.locks.request('ag-arcade-presence-auth', signIn);
  else await signIn();
  const db = getDatabase(app);
  const session = ref(db, `arcadePresence/${auth.currentUser.uid}/${crypto.randomUUID()}`);
  const peakRef = ref(db, 'arcadePresencePeak');
  let connected = false, pageActive = true, ready = false;
  const fail = () => {
    clearTimeout(waiting);
    ready = false;
    render('Online unavailable', false);
  };
  const announce = async () => {
    if (!connected || !pageActive) return;
    await onDisconnect(session).remove();
    if (connected && pageActive) await set(session, true);
  };
  let count = 0;
  const update = () => {
    if (connected && ready) clearTimeout(waiting);
    const onlineText = connected && ready ? `${count} online` : 'Connecting…';
    render(onlineText, connected && ready);
  };
  let savingPeak = false;
  const tryUpdatePeak = async () => {
    if (!connected || !ready || sharedPeak === null || savingPeak || allTimePeak <= sharedPeak) return;
    const observedPeak = allTimePeak;
    savingPeak = true;
    try {
      const result = await runTransaction(
        peakRef,
        current => Math.max(validPeak(current) ? current : 0, observedPeak),
        { applyLocally: false }
      );
      const value = result.snapshot.val();
      if (!result.committed || !validPeak(value)) return;
      sharedPeak = Math.max(sharedPeak ?? 0, value);
      rememberPeak(value);
      update();
    } catch {
      return;
    } finally {
      savingPeak = false;
    }
    if (allTimePeak > observedPeak) void tryUpdatePeak();
  };
  onValue(ref(db, 'arcadePresence'), snapshot => {
    count = Object.values(snapshot.val() ?? {}).filter(tabs =>
      tabs && typeof tabs === 'object' && Object.values(tabs).some(value => value === true)).length;
    ready = true;
    if (connected && count > allTimePeak) rememberPeak(count);
    void tryUpdatePeak();
    update();
  }, fail);
  onValue(peakRef, snapshot => {
    const value = snapshot.val();
    sharedPeak = validPeak(value) ? value : 0;
    if (sharedPeak > allTimePeak) rememberPeak(sharedPeak);
    void tryUpdatePeak();
    update();
  }, () => {
    sharedPeak = null;
    update();
  });
  onValue(ref(db, '.info/connected'), snapshot => {
    connected = snapshot.val() === true;
    if (!connected) { render('Online unavailable', false); return; }
    if (ready && count > allTimePeak) rememberPeak(count);
    void tryUpdatePeak();
    update();
    announce().catch(fail);
  }, fail);
  addEventListener('pagehide', () => { pageActive = false; remove(session).catch(() => {}); });
  addEventListener('pageshow', () => { pageActive = true; announce().catch(fail); });
}

// Count the page containing the game, not its nested engine iframe.
if (window.top === window.self) start().catch(() => render('Online unavailable', false));
