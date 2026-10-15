/* Home page: cards, instant search (names + ingredients, Hinglish-aware),
   collapsible filters, sort, favorites toggle, cooked badges. */
(function (C) {
  "use strict";

  var state = { tokens: [], favOnly: false, sort: "name", sel: {}, filtersOpen: false };

  var GROUPS = [
    { key: "category", label: "Category", options: C.CATEGORIES,
      test: function (r, sel) { return C.filterCategoriesOf(r).some(function (c) { return sel.has(c); }); } },
    { key: "equipment", label: "Equipment", options: ["Air Fryer", "Gas Stove", "Microwave", "Pressure Cooker"],
      test: function (r, sel) {
        return (r.equipment || []).some(function (e) { return sel.has(e); });
      } },
    { key: "difficulty", label: "Difficulty", options: ["Easy", "Medium"],
      test: function (r, sel) { return sel.has(r.difficulty); } },
    { key: "time", label: "Time", options: ["Under 20 min", "Under 40 min"],
      test: function (r, sel) {
        var t = C.totalTime(r);
        return (sel.has("Under 20 min") && t <= 20) || (sel.has("Under 40 min") && t <= 40);
      } },
    { key: "mealType", label: "Meal Type", options: ["Brunch", "Dinner", "Side Dish", "Snack", "Dessert"],
      test: function (r, sel) {
        return (r.mealType || []).some(function (m) { return sel.has(m); });
      } },
    /* "Other" combines with AND: selecting High protein + One-pot means both must hold */
    { key: "other", label: "Other", options: ["Good leftovers", "High protein", "One-pot"],
      test: function (r, sel) {
        if (sel.has("Good leftovers") && !C.goodLeftovers(r)) return false;
        if (sel.has("High protein") && !C.isHighProtein(r)) return false;
        if (sel.has("One-pot") && !r.onePot) return false;
        return true;
      } }
  ];

  GROUPS.forEach(function (g) { state.sel[g.key] = new Set(); });

  var grid, emptyMsg, countEl, filterBadge;

  /* Filter state survives navigation within this tab only (sessionStorage):
     back from a recipe → filters intact; close the tab → clean slate. */
  var SKEY = "cookbook.session.filters";

  function saveSession() {
    try {
      var sel = {};
      GROUPS.forEach(function (g) { sel[g.key] = Array.from(state.sel[g.key]); });
      sessionStorage.setItem(SKEY, JSON.stringify({
        search: document.getElementById("search").value,
        favOnly: state.favOnly,
        sort: state.sort,
        sel: sel
      }));
    } catch (e) { /* private mode etc. — filters just won't stick */ }
  }

  function loadSession() {
    try {
      var raw = sessionStorage.getItem(SKEY);
      if (!raw) return;
      var s = JSON.parse(raw);
      state.favOnly = !!s.favOnly;
      state.sort = s.sort || "name";
      state.tokens = C.normalizeQuery(s.search || "").split(/\s+/).filter(Boolean);
      GROUPS.forEach(function (g) {
        /* drop values that no longer exist (e.g. a renamed category) — otherwise
           they'd silently filter everything out with no chip left to untick */
        var saved = (s.sel && s.sel[g.key]) || [];
        var valid = saved.filter(function (v) { return g.options.indexOf(v) !== -1; });
        if (valid.length !== saved.length) console.warn("Cookbook: ignoring stale saved filters", g.key, saved);
        state.sel[g.key] = new Set(valid);
      });
      document.getElementById("search").value = s.search || "";
      document.getElementById("fav-only").checked = state.favOnly;
      document.getElementById("sort").value = state.sort;
    } catch (e) {
      console.warn("Cookbook: could not restore session filters.", e);
    }
  }

  function activeFilterCount() {
    var n = 0;
    GROUPS.forEach(function (g) { n += state.sel[g.key].size; });
    return n;
  }

  function matches(r) {
    if (state.favOnly && !C.store.isFavorite(r.id)) return false;
    if (state.tokens.length) {
      var hay = C.haystack(r);
      for (var t = 0; t < state.tokens.length; t++) {
        if (hay.indexOf(state.tokens[t]) === -1) return false;
      }
    }
    for (var i = 0; i < GROUPS.length; i++) {
      var g = GROUPS[i], sel = state.sel[g.key];
      if (sel.size && !g.test(r, sel)) return false;
    }
    return true;
  }

  function sortList(list) {
    var by = state.sort;
    return list.slice().sort(function (a, b) {
      if (by === "time") return C.totalTime(a) - C.totalTime(b) || a.name.localeCompare(b.name);
      if (by === "rating") return C.store.rating(b.id) - C.store.rating(a.id) || a.name.localeCompare(b.name);
      if (by === "rotation") {
        /* never-cooked first, then longest-ago first */
        var la = C.store.lastCooked(a.id), lb = C.store.lastCooked(b.id);
        if (!la && !lb) return a.name.localeCompare(b.name);
        if (!la) return -1;
        if (!lb) return 1;
        return la.localeCompare(lb) || a.name.localeCompare(b.name);
      }
      return a.name.localeCompare(b.name);
    });
  }

  function card(r) {
    var el = document.createElement("article");
    el.className = "card";
    var rating = C.store.rating(r.id);
    var last = C.store.lastCooked(r.id);
    el.innerHTML =
      '<a class="card-link" href="recipe.html?id=' + encodeURIComponent(r.id) + '">' +
        '<div class="card-media"><img loading="lazy"></div>' +
        '<div class="card-body">' +
          '<div class="card-top">' +
            '<span class="diet ' + (r.veg ? "veg" : "nonveg") + '" title="' + (r.veg ? "Vegetarian" : "Non-vegetarian") + '"></span>' +
            "<h3>" + C.esc(r.name) + "</h3>" +
          "</div>" +
          '<p class="card-meta">⏱ ' + C.fmtTime(C.totalTime(r)) + " · " + C.esc(r.difficulty) + " · " + C.esc(C.categoriesOf(r).join(" / ")) +
            (last ? ' · <span title="Last cooked">🍳 ' + C.relTime(last) + "</span>" : "") + "</p>" +
          (rating ? '<p class="card-stars">' + C.stars(rating) + "</p>" : "") +
          '<p class="card-equip">' + (r.equipment || []).map(C.equipIcon).join("") + "</p>" +
        "</div>" +
      "</a>" +
      '<button class="fav-btn' + (C.store.isFavorite(r.id) ? " active" : "") + '" aria-label="Toggle favorite" title="Favorite">♥</button>';

    C.attachCover(el.querySelector("img"), r);
    el.querySelector(".fav-btn").addEventListener("click", function () {
      var on = C.store.toggleFavorite(r.id);
      this.classList.toggle("active", on);
      if (state.favOnly && !on) render();
    });
    return el;
  }

  function render() {
    var list = sortList(window.RECIPES.filter(matches));
    grid.innerHTML = "";
    list.forEach(function (r) { grid.appendChild(card(r)); });

    var total = window.RECIPES.length;
    countEl.textContent = list.length === total
      ? total + " recipes"
      : list.length + " of " + total + " recipes";
    emptyMsg.hidden = list.length > 0;

    var n = activeFilterCount();
    filterBadge.textContent = n;
    filterBadge.hidden = n === 0;
  }

  function renderFilters() {
    var wrap = document.getElementById("filters");
    wrap.innerHTML = "";
    GROUPS.forEach(function (g) {
      var row = document.createElement("div");
      row.className = "filter-group";
      row.innerHTML = '<span class="filter-label">' + g.label + '</span><span class="chips"></span>';
      var chips = row.querySelector(".chips");
      g.options.forEach(function (opt) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "chip" + (state.sel[g.key].has(opt) ? " active" : "");
        b.textContent = opt;
        b.setAttribute("aria-pressed", state.sel[g.key].has(opt) ? "true" : "false");
        b.addEventListener("click", function () {
          var sel = state.sel[g.key];
          if (sel.has(opt)) sel.delete(opt); else sel.add(opt);
          b.classList.toggle("active");
          b.setAttribute("aria-pressed", sel.has(opt) ? "true" : "false");
          saveSession();
          render();
        });
        chips.appendChild(b);
      });
      wrap.appendChild(row);
    });
    var clearRow = document.createElement("div");
    clearRow.className = "filter-group";
    clearRow.innerHTML = '<span class="filter-label"></span><button class="link-btn" id="filters-reset">Clear all filters</button>';
    clearRow.querySelector("#filters-reset").addEventListener("click", clearAll);
    wrap.appendChild(clearRow);
  }

  function setFiltersOpen(open) {
    state.filtersOpen = open;
    document.getElementById("filters").hidden = !open;
    document.getElementById("filter-toggle").setAttribute("aria-expanded", open ? "true" : "false");
    C.store.setPref("filtersOpen", open);
  }

  function clearAll() {
    GROUPS.forEach(function (g) { state.sel[g.key].clear(); });
    state.tokens = [];
    state.favOnly = false;
    document.getElementById("search").value = "";
    document.getElementById("fav-only").checked = false;
    saveSession();
    renderFilters();
    render();
  }

  function init() {
    grid = document.getElementById("grid");
    emptyMsg = document.getElementById("empty");
    countEl = document.getElementById("result-count");
    filterBadge = document.getElementById("filter-badge");

    loadSession();
    renderFilters();
    setFiltersOpen(!!C.store.pref("filtersOpen", false));

    document.getElementById("filter-toggle").addEventListener("click", function () {
      setFiltersOpen(!state.filtersOpen);
    });
    document.getElementById("search").addEventListener("input", function () {
      state.tokens = C.normalizeQuery(this.value).split(/\s+/).filter(Boolean);
      saveSession();
      render();
    });
    document.getElementById("fav-only").addEventListener("change", function () {
      state.favOnly = this.checked;
      saveSession();
      render();
    });
    document.getElementById("sort").addEventListener("change", function () {
      state.sort = this.value;
      saveSession();
      render();
    });
    document.getElementById("clear-filters").addEventListener("click", clearAll);

    render();
  }

  if (window.RECIPES_LOADED) init();
  else document.addEventListener("recipes:ready", init);
})(window.Cookbook);