import { initializeApp, getApps, getAuth, signInAnonymously, getDatabase,
  ref, set, remove, onValue, onDisconnect, runTransaction } from './firebase-sdk.js';
import { firebaseConfig } from './firebase-config.js';

let badge;
let peakBadge;
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
  peakBadge.title = 'Record high number of people online at the same time.';
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

function render(text, connected, peakText = '') {
  ensureBadges();
  badge.textContent = text;
  badge.dataset.connected = String(connected);
  if (peakText) {
    peakBadge.textContent = peakText;
    peakBadge.hidden = false;
    peakBadge.dataset.connected = String(connected);
  } else {
    peakBadge.hidden = true;
  }
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
  const fail = () => { ready = false; render('Online unavailable', false); };
  const announce = async () => {
    if (!connected || !pageActive) return;
    await onDisconnect(session).remove();
    if (connected && pageActive) await set(session, true);
  };
  let count = 0;
  let peak = null;
  const update = () => {
    if (connected && ready) clearTimeout(waiting);
    const onlineText = connected && ready ? `${count} online` : 'Connecting…';
    const peakText = connected && ready && typeof peak === 'number' ? `Peak ${peak}` : '';
    render(onlineText, connected && ready, peakText);
  };
  onValue(ref(db, 'arcadePresence'), snapshot => {
    count = Object.values(snapshot.val() ?? {}).filter(tabs =>
      tabs && typeof tabs === 'object' && Object.values(tabs).some(value => value === true)).length;
    ready = true;
    if (typeof peak === 'number' && count > peak) {
      peak = count;
      runTransaction(peakRef, current => {
        const currentPeak = typeof current === 'number' ? current : 0;
        return count > currentPeak ? count : currentPeak;
      }).catch(() => {});
    }
    update();
  }, fail);
  onValue(peakRef, snapshot => {
    const value = snapshot.val();
    peak = typeof value === 'number' ? value : 0;
    if (ready && count > peak) {
      peak = count;
      runTransaction(peakRef, current => {
        const currentPeak = typeof current === 'number' ? current : 0;
        return count > currentPeak ? count : currentPeak;
      }).catch(() => {});
    }
    update();
  }, () => { peak = null; update(); });
  onValue(ref(db, '.info/connected'), snapshot => {
    connected = snapshot.val() === true;
    if (!connected) { render('Online unavailable', false); return; }
    update();
    announce().catch(fail);
  }, fail);
  addEventListener('pagehide', () => { pageActive = false; remove(session).catch(() => {}); });
  addEventListener('pageshow', () => { pageActive = true; announce().catch(fail); });
}

// Count the page containing the game, not its nested engine iframe.
if (window.top === window.self) start().catch(() => render('Online unavailable', false));
