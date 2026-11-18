const DEFAULT_EDITOR_ORIGIN = 'https://stackblitz.com';
const SEARCH_PARAM_AUTH_CODE = 'code';
const SEARCH_PARAM_ERROR = 'error';
const SEARCH_PARAM_ERROR_DESCRIPTION = 'error_description';
const BROADCAST_CHANNEL_NAME = '__wc_api_bc__';
const STORAGE_TOKENS_NAME = '__wc_api_tokens__';
const STORAGE_CODE_VERIFIER_NAME = '__wc_api_verifier__';
const STORAGE_POPUP_NAME = '__wc_api_popup__';

class TypedEventTarget {
    _bus = new EventTarget();
    listen(listener) {
        function wrappedListener(event) {
            listener(event.data);
        }
        this._bus.addEventListener('message', wrappedListener);
        return () => this._bus.removeEventListener('message', wrappedListener);
    }
    fireEvent(data) {
        this._bus.dispatchEvent(new MessageEvent('message', { data }));
    }
}

const IGNORED_ERROR = new Error();
IGNORED_ERROR.stack = '';
const accessTokenChangedListeners = new TypedEventTarget();
/**
 * @internal
 */
class Tokens {
    origin;
    refresh;
    access;
    expires;
    _revoked = new AbortController();
    constructor(
    // editor origin that those tokens are bound to, mostly used for development
    origin, 
    // token to use to get a new access token
    refresh, 
    // token to provide to webcontainer
    access, 
    // time in UTC when the token expires
    expires) {
        this.origin = origin;
        this.refresh = refresh;
        this.access = access;
        this.expires = expires;
    }
    async activate(onFailedRefresh) {
        if (this._revoked.signal.aborted) {
            throw new Error('Token revoked');
        }
        // if the access token expired we fetch a new one
        if (this.expires < Date.now()) {
            if (!(await this._fetchNewAccessToken())) {
                return false;
            }
        }
        this._sync();
        this._startRefreshTokensLoop(onFailedRefresh);
        return true;
    }
    async revoke(clientId, ignoreRevokeError) {
        this._revoked.abort();
        try {
            const response = await fetch(`${this.origin}/oauth/revoke`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({ token: this.refresh, token_type_hint: 'refresh_token', client_id: clientId }),
                mode: 'cors',
            });
            if (!response.ok) {
                throw new Error(`Failed to logout`);
            }
        }
        catch (error) {
            if (!ignoreRevokeError) {
                throw error;
            }
        }
        clearTokensInStorage();
    }
    static fromStorage() {
        const savedTokens = readTokensFromStorage();
        if (!savedTokens) {
            return null;
        }
        return new Tokens(savedTokens.origin, savedTokens.refresh, savedTokens.access, savedTokens.expires);
    }
    static async fromAuthCode({ editorOrigin, clientId, codeVerifier, authCode, redirectUri, }) {
        const response = await fetch(`${editorOrigin}/oauth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: clientId,
                code: authCode,
                code_verifier: codeVerifier,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
            }),
            mode: 'cors',
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch token: ${response.status}`);
        }
        const tokenResponse = await response.json();
        assertTokenResponse(tokenResponse);
        const { access_token: access, refresh_token: refresh } = tokenResponse;
        const expires = getExpiresFromTokenResponse(tokenResponse);
        return new Tokens(editorOrigin, refresh, access, expires);
    }
    async _fetchNewAccessToken() {
        try {
            const response = await fetch(`${this.origin}/oauth/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: this.refresh,
                }),
                mode: 'cors',
                signal: this._revoked.signal,
            });
            if (!response.ok) {
                throw IGNORED_ERROR;
            }
            const tokenResponse = await response.json();
            assertTokenResponse(tokenResponse);
            const { access_token: access, refresh_token: refresh } = tokenResponse;
            const expires = getExpiresFromTokenResponse(tokenResponse);
            this.access = access;
            this.expires = expires;
            this.refresh = refresh;
            return true;
        }
        catch {
            clearTokensInStorage();
            return false;
        }
    }
    _sync() {
        persistTokensInStorage(this);
        fireAccessTokenChanged(this.access);
    }
    async _startRefreshTokensLoop(onFailedRefresh) {
        while (true) {
            const expiresIn = this.expires - Date.now() - 1000;
            await wait(Math.max(expiresIn, 1000));
            if (this._revoked.signal.aborted) {
                return;
            }
            if (!this._fetchNewAccessToken()) {
                onFailedRefresh();
                return;
            }
            this._sync();
        }
    }
}
/**
 * @internal
 */
function clearTokensInStorage() {
    localStorage.removeItem(STORAGE_TOKENS_NAME);
}
/**
 * @internal
 */
function addAccessTokenChangedListener(listener) {
    return accessTokenChangedListeners.listen(listener);
}
function readTokensFromStorage() {
    const serializedTokens = localStorage.getItem(STORAGE_TOKENS_NAME);
    if (!serializedTokens) {
        return null;
    }
    try {
        return JSON.parse(serializedTokens);
    }
    catch {
        return null;
    }
}
function persistTokensInStorage(tokens) {
    localStorage.setItem(STORAGE_TOKENS_NAME, JSON.stringify(tokens));
}
function getExpiresFromTokenResponse({ created_at, expires_in }) {
    return (created_at + expires_in) * 1000;
}
function assertTokenResponse(token) {
    if (typeof token !== 'object' || !token) {
        throw new Error('Invalid Token Response');
    }
    if (typeof token.access_token !== 'string' ||
        typeof token.refresh_token !== 'string' ||
        typeof token.created_at !== 'number' ||
        typeof token.expires_in !== 'number') {
        throw new Error('Invalid Token Response');
    }
}
function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function fireAccessTokenChanged(accessToken) {
    accessTokenChangedListeners.fireEvent(accessToken);
}

const params = {};
let editorOrigin = null;
const iframeSettings = {
    get editorOrigin() {
        if (editorOrigin == null) {
            editorOrigin = new URL(globalThis.WEBCONTAINER_API_IFRAME_URL ?? DEFAULT_EDITOR_ORIGIN).origin;
        }
        return editorOrigin;
    },
    set editorOrigin(newOrigin) {
        editorOrigin = new URL(newOrigin).origin;
    },
    setQueryParam(key, value) {
        params[key] = value;
    },
    get url() {
        const url = new URL(this.editorOrigin);
        url.pathname = '/headless';
        for (const param in params) {
            url.searchParams.set(param, params[param]);
        }
        url.searchParams.set('version', "1.6.4");
        return url;
    },
};

/**
 * Implementation of https://www.rfc-editor.org/rfc/rfc7636#section-4.2 that can
 * run in the browser.
 *
 * @internal
 *
 * @param input Code verifier.
 */
async function S256(input) {
    // input here is assumed to match https://www.rfc-editor.org/rfc/rfc3986#section-2.3
    const ascii = new TextEncoder().encode(input);
    const sha256 = new Uint8Array(await crypto.subtle.digest('SHA-256', ascii));
    // base64url encode, based on https://developer.mozilla.org/en-US/docs/Glossary/Base64#the_unicode_problem
    return btoa(sha256.reduce((binary, byte) => binary + String.fromCodePoint(byte), ''))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}
/**
 * Implementation of https://www.rfc-editor.org/rfc/rfc7636#section-4.1 with
 * a slight deviation:
 *
 *  - We use 128 characters (it's expected to be between 43 and 128)
 *  - We use 64 characters instead of 66
 *
 * So the entropy is lower given the space size is 64^128 instead of 66^128.
 * It still satisfies the entropy constraint given that 64^128 > 66^43.
 *
 * @internal
 */
function newCodeVerifier() {
    const random = new Uint8Array(96);
    crypto.getRandomValues(random);
    let codeVerifier = '';
    for (let i = 0; i < 32; ++i) {
        codeVerifier += nextFourChars(random[3 * i + 0], random[3 * i + 1], random[3 * i + 2]);
    }
    return codeVerifier;
}
function nextFourChars(byte1, byte2, byte3) {
    const char1 = byte1 >> 2;
    const char2 = ((byte1 & 3) << 4) | (byte2 >> 4);
    const char3 = (byte2 & 15) | ((byte3 & 192) >> 2);
    const char4 = byte3 & 63;
    return [char1, char2, char3, char4].map(unreservedCharacters).join('');
}
function unreservedCharacters(code) {
    let offset;
    if (code < 26) {
        offset = code + 65; // [A-Z]
    }
    else if (code < 52) {
        offset = code - 26 + 97; // [a-z]
    }
    else if (code < 62) {
        offset = code - 52 + 48; // [0-9]
    }
    else {
        offset = code === 62 ? 30 /* _ */ : 45 /* - */;
    }
    return String.fromCharCode(offset);
}

/**
 * @internal
 */
function resettablePromise() {
    let resolve;
    let promise;
    function reset() {
        promise = new Promise((_resolve) => (resolve = _resolve));
    }
    reset();
    return {
        get promise() {
            return promise;
        },
        resolve(value) {
            return resolve(value);
        },
        reset,
    };
}

/**
 * @internal
 */
const authState = {
    initialized: false,
    bootCalled: false,
    authComplete: resettablePromise(),
    clientId: '',
    oauthScope: '',
    broadcastChannel: null,
    get editorOrigin() {
        return iframeSettings.editorOrigin;
    },
    tokens: null,
};
const authFailedListeners = new TypedEventTarget();
const loggedOutListeners = new TypedEventTarget();
function broadcastMessage(message) {
    if (!authState.broadcastChannel) {
        return;
    }
    authState.broadcastChannel.postMessage(message);
    // check if we are in a popup mode
    if (localStorage.getItem(STORAGE_POPUP_NAME) === 'true' && message.type !== 'auth-logout') {
        localStorage.removeItem(STORAGE_POPUP_NAME);
        // wait a tick to make sure the posted message has been sent
        setTimeout(() => {
            window.close();
        });
    }
}
const auth$1 = {
    init({ editorOrigin, clientId, scope }) {
        if (authState.initialized) {
            throw new Error('Init should only be called once');
        }
        let enterprise = true;
        if (enterprise && authState.bootCalled) {
            throw new Error('`auth.init` should always be called before `WebContainer.boot`');
        }
        authState.initialized = true;
        authState.tokens = Tokens.fromStorage();
        authState.clientId = clientId;
        authState.oauthScope = scope;
        authState.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        // configure iframe url
        iframeSettings.setQueryParam('client_id', clientId);
        if (editorOrigin) {
            iframeSettings.editorOrigin = new URL(editorOrigin).origin;
        }
        loggedOutListeners.listen(() => authState.authComplete.reset());
        // if authentication or logout are done in another page, we want to reflect the state on this page as well
        authState.broadcastChannel.addEventListener('message', onChannelMessage);
        async function onChannelMessage(event) {
            const typedEvent = event.data;
            if (typedEvent.type === 'auth-complete') {
                authState.tokens = Tokens.fromStorage();
                // we ignore the possible error here because they can't have expired just yet
                await authState.tokens.activate(onFailedTokenRefresh);
                authState.authComplete.resolve();
                return;
            }
            if (typedEvent.type === 'auth-failed') {
                authFailedListeners.fireEvent(typedEvent);
                return;
            }
            if (typedEvent.type === 'auth-logout') {
                loggedOutListeners.fireEvent();
                return;
            }
        }
        if (authState.tokens) {
            const tokens = authState.tokens;
            if (tokens.origin === authState.editorOrigin) {
                /**
                 * Here we assume that the refresh token never expires which
                 * might not be correct. If that is the case though, we will
                 * emit a 'logged-out' event to signal that the user has been
                 * logged out, which could also happen at a later time anyway.
                 *
                 * Because this flow is done entirely locally, we do not broadcast
                 * anything to the other tabs. They should be performing a similar
                 * check.
                 */
                (async () => {
                    const success = await tokens.activate(onFailedTokenRefresh);
                    if (!success) {
                        // if we got new token in the meantime we discard this error
                        if (authState.tokens !== tokens) {
                            return;
                        }
                        loggedOutListeners.fireEvent();
                        return;
                    }
                    authState.authComplete.resolve();
                })();
                return { status: 'authorized' };
            }
            clearTokensInStorage();
            authState.tokens = null;
        }
        const locationURL = new URL(window.location.href);
        const { searchParams } = locationURL;
        const updateURL = () => window.history.replaceState({}, document.title, locationURL);
        // check for errors first, aka the user declined the authorisation or stackblitz did
        if (searchParams.has(SEARCH_PARAM_ERROR)) {
            const error = searchParams.get(SEARCH_PARAM_ERROR);
            const description = searchParams.get(SEARCH_PARAM_ERROR_DESCRIPTION);
            searchParams.delete(SEARCH_PARAM_ERROR);
            searchParams.delete(SEARCH_PARAM_ERROR_DESCRIPTION);
            updateURL();
            broadcastMessage({ type: 'auth-failed', error, description });
            return { status: 'auth-failed', error, description };
        }
        // if there's an auth code
        if (searchParams.has(SEARCH_PARAM_AUTH_CODE)) {
            const authCode = searchParams.get(SEARCH_PARAM_AUTH_CODE);
            const editorOrigin = authState.editorOrigin;
            searchParams.delete(SEARCH_PARAM_AUTH_CODE);
            updateURL();
            const codeVerifier = localStorage.getItem(STORAGE_CODE_VERIFIER_NAME);
            if (!codeVerifier) {
                return { status: 'need-auth' };
            }
            localStorage.removeItem(STORAGE_CODE_VERIFIER_NAME);
            Tokens.fromAuthCode({
                editorOrigin,
                clientId: authState.clientId,
                authCode,
                codeVerifier,
                redirectUri: defaultRedirectUri(),
            })
                .then(async (tokens) => {
                authState.tokens = tokens;
                assertAuthTokens(authState.tokens);
                const success = await authState.tokens.activate(onFailedTokenRefresh);
                // if authentication failed we throw, and we'll mark auth as failed
                if (!success) {
                    throw new Error();
                }
                authState.authComplete.resolve();
                broadcastMessage({ type: 'auth-complete' });
            })
                .catch((error) => {
                // this should never happen unless the rails app is now down for some reason?
                console.error(error);
                // treat it as a logged out event so that the user can retry to login
                loggedOutListeners.fireEvent();
                broadcastMessage({ type: 'auth-logout' });
            });
            return { status: 'authorized' };
        }
        return { status: 'need-auth' };
    },
    async startAuthFlow({ popup } = {}) {
        if (!authState.initialized) {
            throw new Error('auth.init must be called first');
        }
        if (popup) {
            localStorage.setItem(STORAGE_POPUP_NAME, 'true');
            const height = 500;
            const width = 620;
            const left = window.screenLeft + (window.outerWidth - width) / 2;
            const top = window.screenTop + (window.outerHeight - height) / 2;
            window.open(await generateOAuthRequest(), '_blank', `popup,width=${width},height=${height},left=${left},top=${top}`);
        }
        else {
            window.location.href = await generateOAuthRequest();
        }
    },
    async logout({ ignoreRevokeError } = {}) {
        await authState.tokens?.revoke(authState.clientId, ignoreRevokeError ?? false);
        loggedOutListeners.fireEvent();
        broadcastMessage({ type: 'auth-logout' });
    },
    loggedIn() {
        return authState.authComplete.promise;
    },
    on(event, listener) {
        switch (event) {
            case 'auth-failed': {
                return authFailedListeners.listen(listener);
            }
            case 'logged-out': {
                return loggedOutListeners.listen(listener);
            }
            default: {
                throw new Error(`Unsupported event type '${event}'.`);
            }
        }
    },
};
function onFailedTokenRefresh() {
    loggedOutListeners.fireEvent();
    broadcastMessage({ type: 'auth-logout' });
}
function defaultRedirectUri() {
    return window.location.href;
}
async function generateOAuthRequest() {
    const codeVerifier = newCodeVerifier();
    localStorage.setItem(STORAGE_CODE_VERIFIER_NAME, codeVerifier);
    const codeChallenge = await S256(codeVerifier);
    const url = new URL('/oauth/authorize', authState.editorOrigin);
    const { searchParams } = url;
    searchParams.append('response_type', 'code');
    searchParams.append('client_id', authState.clientId);
    searchParams.append('redirect_uri', defaultRedirectUri());
    searchParams.append('scope', authState.oauthScope);
    searchParams.append('code_challenge', codeChallenge);
    searchParams.append('code_challenge_method', 'S256');
    return url.toString();
}
/**
 * @internal
 */
function assertAuthTokens(tokens) {
    if (!tokens) {
        throw new Error('Oops! Tokens is not defined when it always should be.');
    }
}

/**
 * This type is in a separate module so that localservice can import it
 * without bundling all the other webcontainer specific stuff.
 */
var PreviewMessageType;
(function (PreviewMessageType) {
    PreviewMessageType["UncaughtException"] = "PREVIEW_UNCAUGHT_EXCEPTION";
    PreviewMessageType["UnhandledRejection"] = "PREVIEW_UNHANDLED_REJECTION";
    PreviewMessageType["ConsoleError"] = "PREVIEW_CONSOLE_ERROR";
})(PreviewMessageType || (PreviewMessageType = {}));

var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// dist/vendor/comlink.js
var comlink_exports = {};
__export(comlink_exports, {
  createEndpoint: () => createEndpoint,
  expose: () => expose,
  proxy: () => proxy,
  proxyMarker: () => proxyMarker,
  releaseProxy: () => releaseProxy,
  transfer: () => transfer,
  transferHandlers: () => transferHandlers,
  windowEndpoint: () => windowEndpoint,
  wrap: () => wrap
});

// ../../node_modules/comlink/dist/esm/comlink.mjs
var proxyMarker = Symbol("Comlink.proxy");
var createEndpoint = Symbol("Comlink.endpoint");
var releaseProxy = Symbol("Comlink.releaseProxy");
var throwMarker = Symbol("Comlink.thrown");
var isObject = (val) => typeof val === "object" && val !== null || typeof val === "function";
var proxyTransferHandler = {
  canHandle: (val) => isObject(val) && val[proxyMarker],
  serialize(obj) {
    const { port1, port2 } = new MessageChannel();
    expose(obj, port1);
    return [port2, [port2]];
  },
  deserialize(port) {
    port.start();
    return wrap(port);
  }
};
var throwTransferHandler = {
  canHandle: (value) => isObject(value) && throwMarker in value,
  serialize({ value }) {
    let serialized;
    if (value instanceof Error) {
      serialized = {
        isError: true,
        value: {
          message: value.message,
          name: value.name,
          stack: value.stack
        }
      };
    } else {
      serialized = { isError: false, value };
    }
    return [serialized, []];
  },
  deserialize(serialized) {
    if (serialized.isError) {
      throw Object.assign(new Error(serialized.value.message), serialized.value);
    }
    throw serialized.value;
  }
};
var transferHandlers = /* @__PURE__ */ new Map([
  ["proxy", proxyTransferHandler],
  ["throw", throwTransferHandler]
]);
function expose(obj, ep = self) {
  ep.addEventListener("message", function callback(ev) {
    if (!ev || !ev.data) {
      return;
    }
    const { id, type, path } = Object.assign({ path: [] }, ev.data);
    const argumentList = (ev.data.argumentList || []).map(fromWireValue);
    let returnValue;
    try {
      const parent = path.slice(0, -1).reduce((obj2, prop) => obj2[prop], obj);
      const rawValue = path.reduce((obj2, prop) => obj2[prop], obj);
      switch (type) {
        case 0:
          {
            returnValue = rawValue;
          }
          break;
        case 1:
          {
            parent[path.slice(-1)[0]] = fromWireValue(ev.data.value);
            returnValue = true;
          }
          break;
        case 2:
          {
            returnValue = rawValue.apply(parent, argumentList);
          }
          break;
        case 3:
          {
            const value = new rawValue(...argumentList);
            returnValue = proxy(value);
          }
          break;
        case 4:
          {
            const { port1, port2 } = new MessageChannel();
            expose(obj, port2);
            returnValue = transfer(port1, [port1]);
          }
          break;
        case 5:
          {
            returnValue = void 0;
          }
          break;
      }
    } catch (value) {
      returnValue = { value, [throwMarker]: 0 };
    }
    Promise.resolve(returnValue).catch((value) => {
      return { value, [throwMarker]: 0 };
    }).then((returnValue2) => {
      const [wireValue, transferables] = toWireValue(returnValue2);
      ep.postMessage(Object.assign(Object.assign({}, wireValue), { id }), transferables);
      if (type === 5) {
        ep.removeEventListener("message", callback);
        closeEndPoint(ep);
      }
    });
  });
  if (ep.start) {
    ep.start();
  }
}
function isMessagePort(endpoint) {
  return endpoint.constructor.name === "MessagePort";
}
function closeEndPoint(endpoint) {
  if (isMessagePort(endpoint))
    endpoint.close();
}
function wrap(ep, target) {
  return createProxy(ep, [], target);
}
function throwIfProxyReleased(isReleased) {
  if (isReleased) {
    throw new Error("Proxy has been released and is not useable");
  }
}
function createProxy(ep, path = [], target = function() {
}) {
  let isProxyReleased = false;
  const proxy2 = new Proxy(target, {
    get(_target, prop) {
      throwIfProxyReleased(isProxyReleased);
      if (prop === releaseProxy) {
        return () => {
          return requestResponseMessage(ep, {
            type: 5,
            path: path.map((p) => p.toString())
          }).then(() => {
            closeEndPoint(ep);
            isProxyReleased = true;
          });
        };
      }
      if (prop === "then") {
        if (path.length === 0) {
          return { then: () => proxy2 };
        }
        const r = requestResponseMessage(ep, {
          type: 0,
          path: path.map((p) => p.toString())
        }).then(fromWireValue);
        return r.then.bind(r);
      }
      return createProxy(ep, [...path, prop]);
    },
    set(_target, prop, rawValue) {
      throwIfProxyReleased(isProxyReleased);
      const [value, transferables] = toWireValue(rawValue);
      return requestResponseMessage(ep, {
        type: 1,
        path: [...path, prop].map((p) => p.toString()),
        value
      }, transferables).then(fromWireValue);
    },
    apply(_target, _thisArg, rawArgumentList) {
      throwIfProxyReleased(isProxyReleased);
      const last = path[path.length - 1];
      if (last === createEndpoint) {
        return requestResponseMessage(ep, {
          type: 4
        }).then(fromWireValue);
      }
      if (last === "bind") {
        return createProxy(ep, path.slice(0, -1));
      }
      const [argumentList, transferables] = processArguments(rawArgumentList);
      return requestResponseMessage(ep, {
        type: 2,
        path: path.map((p) => p.toString()),
        argumentList
      }, transferables).then(fromWireValue);
    },
    construct(_target, rawArgumentList) {
      throwIfProxyReleased(isProxyReleased);
      const [argumentList, transferables] = processArguments(rawArgumentList);
      return requestResponseMessage(ep, {
        type: 3,
        path: path.map((p) => p.toString()),
        argumentList
      }, transferables).then(fromWireValue);
    }
  });
  return proxy2;
}
function myFlat(arr) {
  return Array.prototype.concat.apply([], arr);
}
function processArguments(argumentList) {
  const processed = argumentList.map(toWireValue);
  return [processed.map((v) => v[0]), myFlat(processed.map((v) => v[1]))];
}
var transferCache = /* @__PURE__ */ new WeakMap();
function transfer(obj, transfers) {
  transferCache.set(obj, transfers);
  return obj;
}
function proxy(obj) {
  return Object.assign(obj, { [proxyMarker]: true });
}
function windowEndpoint(w, context = self, targetOrigin = "*") {
  return {
    postMessage: (msg, transferables) => w.postMessage(msg, targetOrigin, transferables),
    addEventListener: context.addEventListener.bind(context),
    removeEventListener: context.removeEventListener.bind(context)
  };
}
function toWireValue(value) {
  for (const [name, handler] of transferHandlers) {
    if (handler.canHandle(value)) {
      const [serializedValue, transferables] = handler.serialize(value);
      return [
        {
          type: 3,
          name,
          value: serializedValue
        },
        transferables
      ];
    }
  }
  return [
    {
      type: 0,
      value
    },
    transferCache.get(value) || []
  ];
}
function fromWireValue(value) {
  switch (value.type) {
    case 3:
      return transferHandlers.get(value.name).deserialize(value.value);
    case 0:
      return value.value;
  }
}
function requestResponseMessage(ep, msg, transfers) {
  return new Promise((resolve) => {
    const id = generateUUID();
    ep.addEventListener("message", function l(ev) {
      if (!ev.data || !ev.data.id || ev.data.id !== id) {
        return;
      }
      ep.removeEventListener("message", l);
      resolve(ev.data);
    });
    if (ep.start) {
      ep.start();
    }
    ep.postMessage(Object.assign({ id }, msg), transfers);
  });
}
function generateUUID() {
  return new Array(4).fill(0).map(() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16)).join("-");
}

/**
 * This function reloads the provided iframe.
 *
 * @param preview The iframe page to reload.
 * @param hardRefreshTimeout The timeout after which the preview is reset if it hasn't responded to the reload event.
 */
function reloadPreview(preview, hardRefreshTimeout = 200) {
    const { port1, port2 } = new MessageChannel();
    let resolve;
    const promise = new Promise((_resolve) => {
        resolve = _resolve;
    });
    const done = () => {
        resolve();
        port2.close();
    };
    const timeout = setTimeout(() => {
        const iframeSrc = preview.src;
        preview.src = iframeSrc;
        done();
    }, hardRefreshTimeout);
    port2.addEventListener('message', (event) => {
        const data = event.data;
        if (data == null || typeof data !== 'object') {
            return;
        }
        if (data.type === 'LOCALSERVICE_WINDOW_RELOADED') {
            clearTimeout(timeout);
            done();
        }
    });
    preview.contentWindow?.postMessage({
        type: 'LOCALSERVICE_RELOAD_WINDOW',
        callback: port1,
    }, '*', [port1]);
    return promise;
}

const PREVIEW_MESSAGE_TYPES = [
    PreviewMessageType.ConsoleError,
    PreviewMessageType.UncaughtException,
    PreviewMessageType.UnhandledRejection,
];
function isPreviewMessage(data) {
    if (data == null || typeof data !== 'object') {
        return false;
    }
    if (!('type' in data) || !PREVIEW_MESSAGE_TYPES.includes(data.type)) {
        return false;
    }
    return true;
}

/**
 * @internal
 */
function nullPrototype(source) {
    const prototype = Object.create(null);
    if (!source) {
        return prototype;
    }
    return Object.assign(prototype, source);
}

/**
 * @internal
 */
function toInternalFileSystemTree(tree) {
    const newTree = { d: {} };
    for (const name of Object.keys(tree)) {
        const entry = tree[name];
        if ('file' in entry) {
            if ('symlink' in entry.file) {
                newTree.d[name] = { f: { l: entry.file.symlink } };
                continue;
            }
            const contents = entry.file.contents;
            const stringContents = typeof contents === 'string' ? contents : toLatin1(contents);
            const binary = typeof contents === 'string' ? {} : { b: true };
            newTree.d[name] = { f: { c: stringContents, ...binary } };
            continue;
        }
        const newEntry = toInternalFileSystemTree(entry.directory);
        newTree.d[name] = newEntry;
    }
    return newTree;
}
/**
 * @internal
 */
function toExternalFileSystemTree(tree) {
    const newTree = nullPrototype();
    if ('f' in tree) {
        throw new Error('It is not possible to export a single file in the JSON format.');
    }
    if ('d' in tree) {
        for (const name of Object.keys(tree.d)) {
            const entry = tree.d[name];
            if ('d' in entry) {
                newTree[name] = nullPrototype({
                    directory: toExternalFileSystemTree(entry),
                });
            }
            else if ('f' in entry) {
                if ('c' in entry.f) {
                    newTree[name] = nullPrototype({
                        file: nullPrototype({
                            contents: entry.f.b ? fromBinaryString(entry.f.c) : entry.f.c,
                        }),
                    });
                }
                else if ('l' in entry.f) {
                    newTree[name] = nullPrototype({
                        file: nullPrototype({
                            symlink: entry.f.l,
                        }),
                    });
                }
            }
        }
    }
    return newTree;
}
function fromBinaryString(s) {
    const encoded = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) {
        encoded[i] = s[i].charCodeAt(0);
    }
    return encoded;
}
function toLatin1(bytes) {
    let decoded = '';
    for (let i = 0; i < bytes.length; i++) {
        decoded += String.fromCharCode(bytes[i]);
    }
    return decoded;
}

/**
 * The WebContainer Public API allows you build custom applications on top of an in-browser Node.js runtime.
 *
 * Its main entrypoint is the {@link WebContainer} class.
 *
 * @packageDocumentation
 */
const auth = auth$1;
let bootPromise = null;
let cachedServerPromise = null;
let cachedBootOptions = {};
const decoder = new TextDecoder();
const encoder = new TextEncoder();
/**
 * The main export of this library. An instance of `WebContainer` represents a runtime
 * ready to be used.
 */
class WebContainer {
    _instance;
    _runtimeInfo;
    /**
     * Gives access to the underlying file system.
     */
    fs;
    /** @internal */
    static _instance = null;
    /** @internal */
    static _teardownPromise = null;
    _tornDown = false;
    _unsubscribeFromTokenChangedListener = () => { };
    /** @internal */
    constructor(
    /** @internal */
    _instance, fs, previewScript, 
    /** @internal */
    _runtimeInfo) {
        this._instance = _instance;
        this._runtimeInfo = _runtimeInfo;
        this.fs = new FileSystemAPIClient(fs);
        // forward the credentials to webcontainer if needed
        if (authState.initialized) {
            this._unsubscribeFromTokenChangedListener = addAccessTokenChangedListener((accessToken) => {
                this._instance.setCredentials({ accessToken, editorOrigin: authState.editorOrigin });
            });
            (async () => {
                await authState.authComplete.promise;
                if (this._tornDown) {
                    return;
                }
                assertAuthTokens(authState.tokens);
                await this._instance.setCredentials({
                    accessToken: authState.tokens.access,
                    editorOrigin: authState.editorOrigin,
                });
            })().catch((error) => {
                // print the error as this is likely a bug in webcontainer
                console.error(error);
            });
        }
    }
    async spawn(command, optionsOrArgs, options) {
        let args = [];
        if (Array.isArray(optionsOrArgs)) {
            args = optionsOrArgs;
        }
        else {
            options = optionsOrArgs;
        }
        let output = undefined;
        let outputStream = new ReadableStream();
        if (options?.output !== false) {
            const result = streamWithPush();
            output = result.push;
            outputStream = result.stream;
        }
        let stdout = undefined;
        let stdoutStream;
        let stderr = undefined;
        let stderrStream;
        const wrappedOutput = proxyListener(binaryListener(output));
        const wrappedStdout = proxyListener(binaryListener(stdout));
        const wrappedStderr = proxyListener(binaryListener(stderr));
        const process = await this._instance.run({
            command,
            args,
            cwd: options?.cwd,
            env: options?.env,
            terminal: options?.terminal,
        }, wrappedStdout, wrappedStderr, wrappedOutput);
        return new WebContainerProcessImpl(process, outputStream, stdoutStream, stderrStream);
    }
    async export(path, options) {
        const serializeOptions = {
            format: options?.format ?? 'json',
            includes: options?.includes,
            excludes: options?.excludes,
            external: true,
        };
        const result = await this._instance.serialize(path, serializeOptions);
        if (serializeOptions.format === 'json') {
            const data = JSON.parse(decoder.decode(result));
            return toExternalFileSystemTree(data);
        }
        return result;
    }
    on(event, listener) {
        if (event === 'preview-message') {
            const originalListener = listener;
            listener = ((message) => {
                if (isPreviewMessage(message)) {
                    originalListener(message);
                }
            });
        }
        const { listener: wrapped, subscribe } = syncSubscription(listener);
        return subscribe(this._instance.on(event, comlink_exports.proxy(wrapped)));
    }
    /**
     * Mounts a tree of files into the filesystem. This can be specified as a tree object ({@link FileSystemTree})
     * or as a binary snapshot generated by [`@webcontainer/snapshot`](https://www.npmjs.com/package/@webcontainer/snapshot).
     *
     * @param snapshotOrTree - A tree of files, or a binary snapshot. Note that binary payloads will be transferred.
     * @param options - Additional options.
     */
    mount(snapshotOrTree, options) {
        const payload = snapshotOrTree instanceof Uint8Array
            ? snapshotOrTree
            : snapshotOrTree instanceof ArrayBuffer
                ? new Uint8Array(snapshotOrTree)
                : encoder.encode(JSON.stringify(toInternalFileSystemTree(snapshotOrTree)));
        return this._instance.loadFiles(comlink_exports.transfer(payload, [payload.buffer]), {
            mountPoints: options?.mountPoint,
        });
    }
    /**
     * Set a custom script to be injected into all previews. When this function is called, every
     * future page reload will contain the provided script tag on all HTML responses.
     *
     * Note:
     *
     * When this function resolves, every preview reloaded _after_ will have the new script.
     * Existing preview have to be explicitely reloaded.
     *
     * To reload a preview you can use `reloadPreview`.
     *
     * @param scriptSrc Source for the script tag.
     * @param options Options to define which type of script this is.
     */
    setPreviewScript(scriptSrc, options) {
        return this._instance.setPreviewScript(scriptSrc, options);
    }
    /**
     * The default value of the `PATH` environment variable for processes started through {@link spawn}.
     */
    get path() {
        return this._runtimeInfo.path;
    }
    /**
     * The full path to the working directory (see {@link FileSystemAPI}).
     */
    get workdir() {
        return this._runtimeInfo.cwd;
    }
    /**
     * Destroys the WebContainer instance, turning it unusable, and releases its resources. After this,
     * a new WebContainer instance can be obtained by calling {@link WebContainer.boot | `boot`}.
     *
     * All entities derived from this instance (e.g. processes, the file system, etc.) also become unusable
     * after calling this method.
     */
    teardown() {
        if (this._tornDown) {
            throw new Error('WebContainer already torn down');
        }
        this._tornDown = true;
        this._unsubscribeFromTokenChangedListener();
        const teardownFn = async () => {
            try {
                await this.fs._teardown();
                await this._instance.teardown();
            }
            finally {
                this._instance[comlink_exports.releaseProxy]();
                if (WebContainer._instance === this) {
                    WebContainer._instance = null;
                }
            }
        };
        WebContainer._teardownPromise = teardownFn();
    }
    /**
     * Boots a WebContainer. Only a single instance of WebContainer can be booted concurrently
     * (see {@link WebContainer.teardown | `teardown`}).
     *
     * Booting WebContainer is an expensive operation.
     */
    static async boot(options = {}) {
        await this._teardownPromise;
        WebContainer._teardownPromise = null;
        const { workdirName } = options;
        if (window.crossOriginIsolated && options.coep === 'none') {
            console.warn(`A Cross-Origin-Embedder-Policy header is required in cross origin isolated environments.\nSet the 'coep' option to 'require-corp'.`);
        }
        if (workdirName?.includes('/') || workdirName === '..' || workdirName === '.') {
            throw new Error('workdirName should be a valid folder name');
        }
        // signal that boot was called to auth module as calling auth.init after boot is likely incorrect
        authState.bootCalled = true;
        // try to "acquire the lock", i.e. wait for any ongoing boot request to finish
        while (bootPromise) {
            await bootPromise;
        }
        if (WebContainer._instance) {
            throw new Error('Only a single WebContainer instance can be booted');
        }
        const instancePromise = unsynchronizedBoot(options);
        // the "lock" is a promise for the ongoing boot that never fails
        bootPromise = instancePromise.catch(() => { });
        try {
            const instance = await instancePromise;
            WebContainer._instance = instance;
            return instance;
        }
        finally {
            // release the "lock"
            bootPromise = null;
        }
    }
}
/**
 * Configure an API key to be used for this instance of WebContainer.
 *
 * @param key WebContainer API key.
 */
function configureAPIKey(key) {
    if (authState.bootCalled) {
        throw new Error('`configureAPIKey` should always be called before `WebContainer.boot`');
    }
    iframeSettings.setQueryParam('client_id', key);
}
const DIR_ENTRY_TYPE_FILE = 1;
const DIR_ENTRY_TYPE_DIR = 2;
/**
 * @internal
 */
class DirEntImpl {
    name;
    _type;
    constructor(name, _type) {
        this.name = name;
        this._type = _type;
    }
    isFile() {
        return this._type === DIR_ENTRY_TYPE_FILE;
    }
    isDirectory() {
        return this._type === DIR_ENTRY_TYPE_DIR;
    }
}
class FSWatcher {
    _apiClient;
    _path;
    _options;
    _listener;
    _wrappedListener;
    _watcher;
    _closed = false;
    constructor(_apiClient, _path, _options, _listener) {
        this._apiClient = _apiClient;
        this._path = _path;
        this._options = _options;
        this._listener = _listener;
        this._apiClient._watchers.add(this);
        this._wrappedListener = (event, filename) => {
            if (this._listener && !this._closed) {
                this._listener(event, filename);
            }
        };
        this._apiClient._fs
            .watch(this._path, this._options, proxyListener(this._wrappedListener))
            .then((_watcher) => {
            this._watcher = _watcher;
            if (this._closed) {
                return this._teardown();
            }
            return undefined;
        })
            .catch(console.error);
    }
    async close() {
        if (!this._closed) {
            this._closed = true;
            this._apiClient._watchers.delete(this);
            await this._teardown();
        }
    }
    /**
     * @internal
     */
    async _teardown() {
        await this._watcher?.close().finally(() => {
            this._watcher?.[comlink_exports.releaseProxy]();
        });
    }
}
/**
 * @internal
 */
class WebContainerProcessImpl {
    output;
    input;
    exit;
    _process;
    stdout;
    stderr;
    constructor(process, output, stdout, stderr) {
        this.output = output;
        this._process = process;
        this.input = new WritableStream({
            write: (data) => {
                // this promise is not supposed to fail anyway
                this._getProcess()
                    ?.write(data)
                    .catch(() => { });
            },
        });
        this.exit = this._onExit();
        this.stdout = stdout;
        this.stderr = stderr;
    }
    kill() {
        this._process?.kill();
    }
    resize(dimensions) {
        this._getProcess()?.resize(dimensions);
    }
    async _onExit() {
        try {
            return await this._process.onExit;
        }
        finally {
            this._process?.[comlink_exports.releaseProxy]();
            this._process = null;
        }
    }
    _getProcess() {
        if (this._process == null) {
            console.warn('This process already exited');
        }
        return this._process;
    }
}
/**
 * @internal
 */
class FileSystemAPIClient {
    _fs;
    _watchers = new Set([]);
    constructor(fs) {
        this._fs = fs;
    }
    rm(...args) {
        return this._fs.rm(...args);
    }
    async readFile(path, encoding) {
        return await this._fs.readFile(path, encoding);
    }
    async rename(oldPath, newPath) {
        return await this._fs.rename(oldPath, newPath);
    }
    async writeFile(path, data, options) {
        if (data instanceof Uint8Array) {
            const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
            data = comlink_exports.transfer(new Uint8Array(buffer), [buffer]);
        }
        await this._fs.writeFile(path, data, options);
    }
    async readdir(path, options) {
        const result = await this._fs.readdir(path, options);
        if (isStringArray(result)) {
            return result;
        }
        if (isTypedArrayCollection(result)) {
            return result;
        }
        const entries = result.map((entry) => new DirEntImpl(entry.name, entry['Symbol(type)']));
        return entries;
    }
    async mkdir(path, options) {
        return await this._fs.mkdir(path, options);
    }
    watch(path, options, listener) {
        if (typeof options === 'function') {
            listener = options;
            options = null;
        }
        return new FSWatcher(this, path, options, listener);
    }
    /**
     * @internal
     */
    async _teardown() {
        this._fs[comlink_exports.releaseProxy]();
        await Promise.all([...this._watchers].map((watcher) => watcher.close()));
    }
}
async function unsynchronizedBoot(options) {
    const { serverPromise } = serverFactory(options);
    const server = await serverPromise;
    const instance = await server.build({
        host: window.location.host,
        version: "1.6.4",
        workdirName: options.workdirName,
        forwardPreviewErrors: options.forwardPreviewErrors,
    });
    const [fs, previewScript, runtimeInfo] = await Promise.all([
        instance.fs(),
        instance.previewScript(),
        instance.runtimeInfo(),
    ]);
    return new WebContainer(instance, fs, previewScript, runtimeInfo);
}
function binaryListener(listener) {
    if (listener == null) {
        return undefined;
    }
    return (data) => {
        if (data instanceof Uint8Array) {
            listener(decoder.decode(data));
        }
        else if (data == null) {
            listener(null);
        }
    };
}
function proxyListener(listener) {
    if (listener == null) {
        return undefined;
    }
    return comlink_exports.proxy(listener);
}
function serverFactory(options) {
    if (cachedServerPromise != null) {
        if (options.coep !== cachedBootOptions.coep) {
            console.warn(`Attempting to boot WebContainer with 'coep: ${options.coep}'`);
            console.warn(`First boot had 'coep: ${cachedBootOptions.coep}', new settings will not take effect!`);
        }
        return { serverPromise: cachedServerPromise };
    }
    if (options.coep) {
        iframeSettings.setQueryParam('coep', options.coep);
    }
    if (options.experimentalNode) {
        iframeSettings.setQueryParam('experimental_node', '1');
    }
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.setAttribute('allow', 'cross-origin-isolated');
    const url = iframeSettings.url;
    iframe.src = url.toString();
    const { origin } = url;
    cachedBootOptions = { ...options };
    cachedServerPromise = new Promise((resolve) => {
        const onMessage = (event) => {
            if (event.origin !== origin) {
                return;
            }
            const { data } = event;
            if (data.type === 'init') {
                resolve(comlink_exports.wrap(event.ports[0]));
                return;
            }
            if (data.type === 'warning') {
                console[data.level].call(console, data.message);
                return;
            }
        };
        window.addEventListener('message', onMessage);
    });
    document.body.insertBefore(iframe, null);
    return { serverPromise: cachedServerPromise };
}
function isStringArray(list) {
    return typeof list[0] === 'string';
}
function isTypedArrayCollection(list) {
    return list[0] instanceof Uint8Array;
}
function streamWithPush() {
    let controller = null;
    const stream = new ReadableStream({
        start(controller_) {
            controller = controller_;
        },
    });
    const push = (item) => {
        if (item != null) {
            controller?.enqueue(item);
        }
        else {
            controller?.close();
            controller = null;
        }
    };
    return { stream, push };
}
function syncSubscription(listener) {
    let stopped = false;
    let unsubscribe = () => { };
    const wrapped = ((...args) => {
        if (stopped) {
            return;
        }
        listener(...args);
    });
    return {
        subscribe(promise) {
            promise.then((unsubscribe_) => {
                unsubscribe = unsubscribe_;
                if (stopped) {
                    unsubscribe();
                }
            });
            return () => {
                stopped = true;
                unsubscribe();
            };
        },
        listener: wrapped,
    };
}

export { PreviewMessageType, WebContainer, auth, configureAPIKey, isPreviewMessage, reloadPreview };
