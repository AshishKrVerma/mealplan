/* Loads every recipe file listed in recipes/manifest.js, then fires "recipes:ready".
   A recipe file that fails to load is skipped with a console warning —
   one bad file never takes the whole cookbook down. */
(function () {
  "use strict";
  var files = window.RECIPE_FILES || [];
  var remaining = files.length;

  function fire() {
    window.RECIPES_LOADED = true;
    document.dispatchEvent(new CustomEvent("recipes:ready"));
  }

  if (!remaining) {
    console.warn("Cookbook: recipes/manifest.js lists no recipe files.");
    fire();
    return;
  }

  function done() { if (--remaining === 0) fire(); }

  files.forEach(function (f) {
    var s = document.createElement("script");
    s.src = "recipes/" + f;
    s.async = false;
    s.onload = done;
    s.onerror = function () {
      console.warn("Cookbook: could not load recipe file 'recipes/" + f + "' — skipping it.");
      done();
    };
    document.head.appendChild(s);
  });
})();
