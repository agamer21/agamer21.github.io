const byId = id => document.getElementById(id);
const game = byId('game');
const screen = byId('screen');
const controls = byId('controls');
const status = byId('status');
const allowedKeys = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'Comma', 'Period', 'ShiftLeft', 'ControlLeft', 'KeyM']);
const held = new Set();
const signalingHost = 'gang-beasts-multiplayer.onrender.com';
const root = 'ag-arcade-gang-beasts-';
let session;

function reset(message = '') {
  const current = session;
  session = undefined;
  clearTimeout(current?.timeout);
  clearTimeout(current?.inputTimeout);
  clearTimeout(current?.streamTimeout);
  current?.wake?.abort();
  current?.controller?.disable();
  current?.stream?.getTracks().forEach(track => track.stop());
  current?.peer?.destroy();
  held.clear();
  screen.srcObject = null;
  screen.hidden = true;
  game.removeAttribute('src');
  game.hidden = true;
  controls.hidden = true;
  byId('start').hidden = true;
  byId('lobby').hidden = true;
  byId('entry').hidden = false;
  status.textContent = message;
}

async function connect(code, hosting) {
  const options = {
    host: signalingHost,
    port: 443,
    path: '/signal',
    secure: true,
    config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
  };
  const current = { hosting, wake: new AbortController() };
  session = current;
  byId('entry').hidden = true;
  byId('lobby').hidden = false;
  byId('code').textContent = code;
  status.textContent = 'Connecting to the room server. It may take a minute to wake up.';
  const end = message => { if (session === current) reset(message); };
  current.timeout = setTimeout(() => end('Could not reach the room server. Try again.'), 75000);
  try {
    await fetch('https://' + signalingHost + '/health', { mode: 'no-cors', cache: 'no-store', signal: current.wake.signal });
  } catch {
    end('Could not reach the room server. Try again.');
    return;
  }
  if (session !== current) return;
  const peer = hosting ? new Peer(root + code, options) : new Peer(options);
  current.peer = peer;

  function accept(connection) {
    if (session !== current || current.connection) {
      connection.close();
      return;
    }
    current.connection = connection;
    clearTimeout(current.timeout);
    current.timeout = setTimeout(() => {
      end('The players could not connect directly. These networks may need a relay.');
    }, 25000);
    connection.on('open', () => {
      if (session !== current) return;
      clearTimeout(current.timeout);
      byId('start').hidden = !hosting;
      status.textContent = hosting ? 'Guest joined. You can start the match.' : 'Waiting for the host to start.';
    });
    connection.on('close', () => end('The other player left the room.'));
    connection.on('error', () => end('The connection was interrupted.'));
    connection.on('data', keys => {
      if (session !== current || !hosting || !Array.isArray(keys) || keys.length > allowedKeys.size) return;
      current.controller?.update(keys);
      clearTimeout(current.inputTimeout);
      current.inputTimeout = setTimeout(() => current.controller?.update([]), 500);
    });
  }

  peer.on('open', () => {
    if (session !== current) return;
    if (hosting) {
      clearTimeout(current.timeout);
      status.textContent = 'Share the room code with your guest.';
    } else {
      accept(peer.connect(root + code, { serialization: 'json', reliable: true }));
    }
  });
  peer.on('error', error => end(error.type === 'peer-unavailable' ? 'Room not found. Check the code.' : 'Could not connect to the room.'));
  peer.on('disconnected', () => end('Lost contact with the room server.'));
  peer.on('connection', connection => hosting ? accept(connection) : connection.close());
  peer.on('call', call => {
    if (session !== current || hosting || call.peer !== current.connection?.peer) {
      call.close();
      return;
    }
    if (current.call) {
      call.close();
      return;
    }
    current.call = call;
    current.streamTimeout = setTimeout(() => end('Could not receive the host’s video.'), 25000);
    call.on('stream', stream => {
      if (session !== current) return;
      clearTimeout(current.streamTimeout);
      screen.srcObject = stream;
      screen.hidden = false;
      controls.hidden = false;
      status.textContent = 'Click the video, then press Space to join when the host opens Local.';
    });
    call.on('close', () => end('The host ended the stream.'));
    call.on('error', () => end('The video connection failed.'));
    call.answer();
  });
}

byId('host').onclick = () => connect(crypto.getRandomValues(new Uint32Array(1))[0].toString(16).padStart(8, '0'), true);
byId('join').onsubmit = event => {
  event.preventDefault();
  connect(new FormData(event.currentTarget).get('code').toLowerCase(), false);
};
byId('leave').onclick = () => reset();
byId('copy').onclick = async () => {
  try {
    await navigator.clipboard.writeText(byId('code').textContent);
    byId('copy').textContent = 'Copied';
    setTimeout(() => { byId('copy').textContent = 'Copy code'; }, 1500);
  } catch {
    status.textContent = 'Select the room code to copy it.';
  }
};
byId('start').onclick = () => {
  const current = session;
  if (!current?.hosting || !current.connection?.open) return;
  byId('start').hidden = true;
  game.hidden = false;
  controls.hidden = false;
  game.addEventListener('load', () => {
    if (session !== current) return;
    try {
      const doc = game.contentDocument;
      current.controller = game.contentWindow.arcadeRemoteController;
      current.controller.enable();
      current.stream = doc.querySelector('canvas').captureStream(30);
      const call = current.peer.call(current.connection.peer, current.stream);
      if (!call) throw new Error('Could not start sharing the game.');
      call.on('error', () => { if (session === current) reset('The video connection failed.'); });
      status.textContent = 'Open Local in the game. Ask the guest to press Space to join as player two.';
      game.focus();
      doc.querySelector('canvas').focus();
    } catch (error) {
      reset(error.message);
    }
  }, { once: true });
  game.src = '/assets/arcade/ports/gang-beasts/?remote-play=1';
};

function sendKeys() {
  if (session && !session.hosting && session.connection?.open) session.connection.send([...held]);
}
function changeKey(event) {
  if (document.activeElement !== screen || !allowedKeys.has(event.code)) return;
  event.preventDefault();
  if (event.repeat) return;
  if (event.type === 'keydown') held.add(event.code);
  else held.delete(event.code);
  sendKeys();
}
screen.addEventListener('keydown', changeKey);
screen.addEventListener('keyup', changeKey);
screen.addEventListener('blur', () => { held.clear(); sendKeys(); });
setInterval(() => { if (held.size) sendKeys(); }, 150);
window.addEventListener('pagehide', () => reset());
