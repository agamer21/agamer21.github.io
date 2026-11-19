// A standard gamepad for Unity's WebGL input system. Load inside the game frame.
(() => {
  const nativeGamepads = navigator.getGamepads.bind(navigator);
  const bindings = { Space: 0, ControlLeft: 1, KeyM: 2, ShiftLeft: 3, Comma: 4, Period: 5 };
  const validKeys = new Set([...Object.keys(bindings), 'KeyW', 'KeyA', 'KeyS', 'KeyD']);
  let controller;

  function update(keys) {
    if (!controller) return;
    const held = new Set(keys.filter(key => validKeys.has(key)));
    controller.axes[0] = Number(held.has('KeyD')) - Number(held.has('KeyA'));
    controller.axes[1] = Number(held.has('KeyS')) - Number(held.has('KeyW'));
    for (const [key, index] of Object.entries(bindings)) {
      const pressed = held.has(key);
      Object.assign(controller.buttons[index], { pressed, touched: pressed, value: Number(pressed) });
    }
    controller.timestamp = performance.now();
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
    window.dispatchEvent(Object.assign(new Event('gamepadconnected'), { gamepad: controller }));
  }

  function disable() {
    if (!controller) return;
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
  window.arcadeRemoteController = { enable, update, disable };
})();
