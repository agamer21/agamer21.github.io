/* Adapter for Binaryen's Asyncify ABI. Each suspended guest thread owns its
 * continuation and linear-memory stack pointer. Does not emulate JSPI globals. */
function createHcrAsyncify(options = {}) {
  let wasm, active = null;
  const stackSize = options.stackSize || 1024 * 1024;
  const asyncExports = new Set();
  const stats = { suspensions: 0, resumes: 0, contexts: 0, maxContexts: 0, maxStackBytes: 0 };
  function wrapImport(original, name) {
    return function (...args) {
      const state = wasm.asyncify_get_state();
      if (state === 2) {
        if (!active || active.importName !== name) throw Error('Asyncify continuation mismatch: ' + name);
        wasm.asyncify_stop_rewind();
        stats.resumes++;
        if (active.failed) throw active.value;
        return active.value;
      }
      if (state !== 0) throw Error('Import called during Asyncify unwind: ' + name);
      const result = original(...args);
      if (!result || typeof result.then !== 'function') return result;
      if (!active) throw Error('Asynchronous call outside a guest entry point: ' + name);
      if (!active.data) {
        active.data = wasm.malloc(stackSize + 16) >>> 0;
        if (!active.data) throw Error('Not enough memory for the game continuation');
      }
      const data = active.data;
      const heap = new Uint32Array(wasm.memory.buffer);
      heap[data >>> 2] = data + 16;
      heap[(data + 4) >>> 2] = data + 16 + stackSize;
      active.stack = wasm._emscripten_stack_alloc(0);
      active.pending = Promise.resolve(result);
      active.importName = name;
      stats.suspensions++;
      wasm.asyncify_start_unwind(data);
      return 0;
    };
  }
  function wrapExport(original) {
    return async function (...args) {
      if (active) throw Error('Cannot enter an asynchronous guest thread from another Wasm call');
      const context = { data: 0 };
      stats.contexts++;
      stats.maxContexts = Math.max(stats.maxContexts, stats.contexts);
      let rewind = false;
      try {
        for (;;) {
          if (active) throw Error('Cannot enter an asynchronous guest thread from another Wasm call');
          active = context;
          let value, state;
          try {
            if (rewind) {
              wasm._emscripten_stack_restore(context.stack);
              wasm.asyncify_start_rewind(context.data);
            }
            value = original(...args);
            state = wasm.asyncify_get_state();
            if (state === 1) {
              wasm.asyncify_stop_unwind();
              const end = new Uint32Array(wasm.memory.buffer)[context.data >>> 2];
              stats.maxStackBytes = Math.max(stats.maxStackBytes, end - context.data - 16);
            }
          } finally {
            active = null;
          }
          if (state === 0) return value;
          if (state !== 1 || !context.pending) throw Error('Game continuation did not suspend correctly');
          context.failed = false;
          try { context.value = await context.pending; }
          catch (error) { context.failed = true; context.value = error; }
          context.pending = null;
          rewind = true;
        }
      } finally {
        if (wasm.asyncify_get_state() === 1) wasm.asyncify_stop_unwind();
        if (wasm.asyncify_get_state() === 2) wasm.asyncify_stop_rewind();
        if (context.data) wasm.free(context.data);
        stats.contexts--;
      }
    };
  }
  return {
    asyncExports, stats,
    instrumentWasmImports(imports) {
      for (const [name, original] of Object.entries(imports)) {
        if (typeof original === 'function' && (original.isAsync || /^(invoke_.*|__asyncjs__.*)$/.test(name))) {
          imports[name] = wrapImport(original, name);
        }
      }
    },
    instrumentWasmExports(exports) {
      wasm = exports;
      const result = { ...exports };
      for (const name of ['main', '__main_argc_argv', 'hcr_thread_start']) {
        if (typeof exports[name] === 'function') {
          asyncExports.add(exports[name]);
          result[name] = wrapExport(exports[name]);
        }
      }
      options.onReady?.(stats);
      return result;
    },
    isAsyncExport(func) { return asyncExports.has(func); },
    handleAsync: async fn => await fn(),
    handleSleep: fn => new Promise(fn),
    makeAsyncFunction: wrapExport
  };
}
globalThis.KkeepHcrAsyncify = createHcrAsyncify;
