/* Service worker — Verma Family Cookbook.
   Strategy: stale-while-revalidate. Every request is answered from the cache
   instantly (fast, works offline); the cached copy is refreshed from the
   network in the background, so a deploy is picked up by the next visit.
   The Planner page's "Get latest version" button wipes the cache for an
   immediate full refresh. */
var CACHE = "cookbook-v1";

self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener("fetch", function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(function (cache) {
      return cache.match(e.request).then(function (cached) {
        var network = fetch(e.request).then(function (resp) {
          if (resp && resp.ok) cache.put(e.request, resp.clone());
          return resp;
        }).catch(function () { return cached; });
        return cached || network;
      });
    })
  );
});
