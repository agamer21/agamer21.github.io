// A standard gamepad for Unity's WebGL input system. Load inside the game frame.
(() => {
  const nativeGamepads = navigator.getGamepads.bind(navigator);
  const bindings = { Space: 0, ControlLeft: 1, KeyM: 2, ShiftLeft: 3, Comma: 4, Period: 5 };
  const validKeys = new Set([...Object.keys(bindings), 'KeyW', 'KeyA', 'KeyS', 'KeyD']);
  let controller;
  let held = new Set();
  let activationTimer;
  let releaseTimer;
  let spacePulse = false;

  function applyState() {
    if (!controller || activationTimer) return;

    controller.axes[0] = Number(held.has('KeyD')) - Number(held.has('KeyA'));
    controller.axes[1] = Number(held.has('KeyS')) - Number(held.has('KeyW'));
    for (const [key, index] of Object.entries(bindings)) {
      const pressed = held.has(key) || (key === 'Space' && spacePulse);
      Object.assign(controller.buttons[index], { pressed, touched: pressed, value: Number(pressed) });
    }
    controller.timestamp = performance.now();
  }

  function pulseSpace(duration) {
    spacePulse = true;
    clearTimeout(releaseTimer);
    releaseTimer = setTimeout(() => {
      spacePulse = false;
      applyState();
    }, duration);
  }

  function update(keys) {
    const next = new Set(keys.filter(key => validKeys.has(key)));
    if (!controller && next.size) enable();
    if (next.has('Space') && !held.has('Space')) pulseSpace(350);
    held = next;
    applyState();
  }

  function tapJoin() {
    enable();
    pulseSpace(850);
    applyState();
  }

  function enable() {
    if (controller) return;
    const pads = nativeGamepads();
    const index = Array.from({ length: 4 }, (_, slot) => slot).find(slot => !pads[slot]);
    if (index === undefined) throw new Error('All controller slots are in use.');
    controller = {
      id: 'AG Arcade remote controller (STANDARD GAMEPAD)',
      index, connected: true, mapping: 'standard',
      axes: [0, 0, 0, 0],
      buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })),
      timestamp: performance.now()
    };
    // Let Unity sample a neutral controller before the first button press.
    activationTimer = setTimeout(() => {
      activationTimer = undefined;
      applyState();
    }, 220);
    window.dispatchEvent(Object.assign(new Event('gamepadconnected'), { gamepad: controller }));
  }

  function disable() {
    if (!controller) return;
    clearTimeout(activationTimer);
    clearTimeout(releaseTimer);
    activationTimer = undefined;
    spacePulse = false;
    update([]);
    controller.connected = false;
    const gamepad = controller;
    controller = undefined;
    window.dispatchEvent(Object.assign(new Event('gamepaddisconnected'), { gamepad }));
  }

  navigator.getGamepads = () => {
    const pads = Array.from(nativeGamepads());
    if (controller) pads[controller.index] = controller;
    return pads;
  };
  window.arcadeRemoteController = { update, tapJoin, disable };
})();
