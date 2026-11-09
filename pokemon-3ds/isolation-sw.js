// GitHub Pages cannot set the isolation headers that WebAssembly threads require.
self.addEventListener("install", (event) => event.waitUntil(self.skipWaiting()));
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.mode !== "navigate" || !request.url.startsWith(self.registration.scope)) return;
  event.respondWith((async () => {
    const response = await fetch(request);
    if (!response.ok || response.redirected) return response;
    const headers = new Headers(response.headers);
    headers.set("Cross-Origin-Opener-Policy", "same-origin");
    headers.set("Cross-Origin-Embedder-Policy", "require-corp");
    return new Response(response.body, { status: response.status, headers });
  })());
});
