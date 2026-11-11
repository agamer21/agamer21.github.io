import { initializeApp, getApps, getAuth, signInAnonymously, getDatabase,
  ref, set, remove, onValue, onDisconnect } from './firebase-sdk.js';
import { firebaseConfig } from './firebase-config.js';

let badge;
function render(text, connected) {
  if (!badge) {
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = '/assets/arcade/presence.css';
    document.head.append(style);
    badge = document.createElement('span');
    badge.className = 'arcade-online';
    badge.setAttribute('role', 'status');
    badge.setAttribute('aria-live', 'polite');
    badge.title = 'Live visitors across AG Arcade and its hosted games. One count per browser, including multiple tabs. Disconnects may take a moment to clear.';
    const actions = document.querySelector('.header-actions, .player-header, .bar, body > header');
    if (actions) actions.prepend(badge);
    else { badge.classList.add('arcade-online-floating'); document.body.append(badge); }
  }
  badge.textContent = text;
  badge.dataset.connected = String(connected);
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
  let connected = false, pageActive = true, ready = false;
  const fail = () => { ready = false; render('Online unavailable', false); };
  const announce = async () => {
    if (!connected || !pageActive) return;
    await onDisconnect(session).remove();
    if (connected && pageActive) await set(session, true);
  };
  let count = 0;
  const update = () => {
    if (connected && ready) clearTimeout(waiting);
    render(connected && ready ? `${count} online` : 'Connecting…', connected && ready);
  };
  onValue(ref(db, 'arcadePresence'), snapshot => {
    count = Object.values(snapshot.val() ?? {}).filter(tabs =>
      tabs && typeof tabs === 'object' && Object.values(tabs).some(value => value === true)).length;
    ready = true;
    update();
  }, fail);
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
