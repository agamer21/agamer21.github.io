/* Deliver contacts to the original game's own buttons. No overlay, polling,
 * synthetic keyboard controls, or frame-delayed input. */
(() => {
  function attach(canvas, {position, emit, ready}) {
    const doc = canvas.ownerDocument, win = doc.defaultView;
    const contacts = new Map(), listeners = [];
    // Safari's native TouchEvents retain the start target for the whole gesture,
    // including a finger sliding outside the canvas. Use just one touch stream.
    const nativeTouch = 'ontouchstart' in win;
    const listen = (target, name, handler, options) => {
      target.addEventListener(name, handler, options);
      listeners.push(() => target.removeEventListener(name, handler, options));
    };
    const prevent = e => { if (e.cancelable) e.preventDefault(); };
    const focus = () => { canvas.focus({preventScroll: true}); emit('hcr_ev_focus', 1); };
    function begin(key, point, mouse = false, button = 0) {
      if (!ready() || contacts.has(key)) return;
      focus();
      const [x, y] = position(point);
      let id = 2;
      const ids = new Set([...contacts.values()].map(c => c.id));
      while (ids.has(id)) id++;
      const c = {id, x, y, mouse, button};
      contacts.set(key, c);
      if (mouse) {
        emit('hcr_ev_mouse', 0, x, y, 0, 0);
        emit('hcr_ev_mouse', 1, x, y, button, 0);
      } else emit('hcr_ev_touch', 0, id, x, y);
    }
    function move(key, point) {
      const c = contacts.get(key);
      if (!c) return;
      const [x, y] = position(point);
      if (x === c.x && y === c.y) return;
      c.x = x; c.y = y;
      if (c.mouse) emit('hcr_ev_mouse', 0, x, y, 0, 0);
      else emit('hcr_ev_touch', 1, c.id, x, y);
    }
    function end(key, point) {
      const c = contacts.get(key);
      if (!c) return;
      // Delete first: releasing pointer capture can synchronously cancel input.
      contacts.delete(key);
      const [x, y] = point ? position(point) : [c.x, c.y];
      if (c.mouse) emit('hcr_ev_mouse', 2, x, y, c.button, 0);
      else emit('hcr_ev_touch', 2, c.id, x, y);
    }
    const releaseAll = () => { for (const key of contacts.keys()) end(key); };
    const suspend = () => { releaseAll(); emit('hcr_ev_focus', 0); };
    const usePointer = e => !(nativeTouch && e.pointerType === 'touch');
    listen(canvas, 'pointerdown', e => {
      if (!usePointer(e) || (e.pointerType === 'mouse' && e.button !== 0)) return;
      prevent(e);
      begin('p' + e.pointerId, e, e.pointerType === 'mouse', e.button);
      if (contacts.has('p' + e.pointerId)) try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    });
    listen(canvas, 'pointermove', e => {
      if (!usePointer(e)) return;
      if (contacts.has('p' + e.pointerId)) { prevent(e); move('p' + e.pointerId, e); }
      else if (e.pointerType === 'mouse' && ready()) emit('hcr_ev_mouse', 0, ...position(e), 0, 0);
    });
    for (const name of ['pointerup', 'pointercancel']) listen(win, name, e => {
      if (!usePointer(e) || !contacts.has('p' + e.pointerId)) return;
      prevent(e); end('p' + e.pointerId, name === 'pointercancel' ? null : e);
    }, true);
    listen(canvas, 'lostpointercapture', e => end('p' + e.pointerId));
    if (nativeTouch) {
      listen(canvas, 'touchstart', e => {
        prevent(e);
        for (const touch of e.changedTouches) begin('t' + touch.identifier, touch);
      }, {passive: false});
      listen(canvas, 'touchmove', e => {
        prevent(e);
        for (const touch of e.changedTouches) move('t' + touch.identifier, touch);
      }, {passive: false});
      for (const name of ['touchend', 'touchcancel']) listen(win, name, e => {
        let handled = false;
        for (const touch of e.changedTouches) if (contacts.has('t' + touch.identifier)) {
          handled = true; end('t' + touch.identifier, name === 'touchcancel' ? null : touch);
        }
        if (handled) prevent(e);
      }, {capture: true, passive: false});
    }
    listen(win, 'blur', suspend);
    listen(win, 'pagehide', suspend);
    listen(win, 'focus', () => { if (!doc.hidden) emit('hcr_ev_focus', 1); });
    listen(doc, 'visibilitychange', () => { if (doc.hidden) suspend(); else emit('hcr_ev_focus', 1); });
    for (const name of ['contextmenu', 'dblclick', 'gesturestart']) listen(canvas, name, prevent, {passive: false});
    return () => { releaseAll(); listeners.forEach(remove => remove()); };
  }
  globalThis.KkeepHcrInput = {attach};
})();
