const CACHE = "greene-monitor-2.4-stable-v1";
const SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  // Dados pessoais e configuração nunca usam cache do Service Worker.
  if (url.hostname.includes("supabase.co") || url.pathname.endsWith("/config.js")) return;

  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put("./index.html", copy));
      return response;
    }).catch(() => caches.match("./index.html")));
    return;
  }

  // Dependência ESM usada pelo frontend: depois do primeiro uso online, também pode ser reutilizada offline.
  if (url.hostname === "cdn.jsdelivr.net") {
    event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (response.ok) caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
      return response;
    })));
    return;
  }

  // Arquivos estáticos locais: cache-first com atualização em segundo plano.
  if (url.origin === self.location.origin) {
    event.respondWith(caches.match(event.request).then(cached => {
      const fresh = fetch(event.request).then(response => {
        if (response.ok) caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
        return response;
      }).catch(() => cached);
      return cached || fresh;
    }));
  }
});
