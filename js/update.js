/* Registers the service worker (offline copy of the site) and wires the
   Planner page's "Get latest version" button, which wipes the cache and
   reloads so every file is fetched fresh. Personal data (favorites, notes,
   plans) lives in localStorage and is never touched by this. */

/* Bump this with every deploy — it shows in the Planner page's App section
   header, so any device can confirm it's running the latest copy. */
var APP_VERSION = "1.7";

(function () {
  var ver = document.getElementById("app-version");
  if (ver) ver.textContent = "App Version " + APP_VERSION;

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js").catch(function (err) {
      console.warn("Cookbook: service worker registration failed — site still works, just without the offline cache.", err);
    });
  }

  var btn = document.getElementById("app-update");
  if (!btn) return;
  btn.addEventListener("click", function () {
    btn.disabled = true;
    btn.textContent = "⟳ Refreshing…";
    var wipe = ("caches" in window)
      ? caches.keys().then(function (keys) {
          return Promise.all(keys.map(function (k) { return caches.delete(k); }));
        })
      : Promise.resolve();
    wipe.catch(function (err) {
      console.warn("Cookbook: could not clear the cache, reloading anyway.", err);
    }).then(function () { location.reload(); });
  });
})();
