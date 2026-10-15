/* Recipe detail page: renders one recipe from ?id=..., with favorite,
   star rating and an auto-saving personal notes box. */
(function (C) {
  "use strict";

  function section(title, innerHtml) {
    return '<section class="recipe-section"><h2>' + C.esc(title) + "</h2>" + innerHtml + "</section>";
  }

  function list(items) {
    return "<ul>" + (items || []).map(function (i) { return "<li>" + C.esc(i) + "</li>"; }).join("") + "</ul>";
  }

  function renderStars(box, r) {
    var current = C.store.rating(r.id);
    box.innerHTML = '<span class="rate-label">My rating:</span>';
    for (var i = 1; i <= 5; i++) {
      (function (n) {
        var b = document.createElement("button");
        b.className = "star-btn" + (n <= current ? " filled" : "");
        b.textContent = "★";
        b.title = n + " star" + (n > 1 ? "s" : "");
        b.addEventListener("click", function () {
          /* clicking the current rating clears it */
          C.store.setRating(r.id, n === C.store.rating(r.id) ? 0 : n);
          renderStars(box, r);
        });
        box.appendChild(b);
      })(i);
    }
  }

  function render(r) {
    document.title = r.name + " · Verma Family Cookbook";
    var root = document.getElementById("recipe-root");
    var total = C.totalTime(r);

    root.innerHTML =
      '<div class="recipe-hero">' +
        '<div class="recipe-hero-media"><img></div>' +
        '<div class="recipe-head">' +
          '<p class="crumbs">' + C.esc(C.categoriesOf(r).join(" / ")) + ((r.mealType && r.mealType.length) ? " · " + r.mealType.map(C.esc).join(", ") : "") + "</p>" +
          '<div class="recipe-title-row">' +
            "<h1>" + C.esc(r.name) + "</h1>" +
            '<span class="diet ' + (r.veg ? "veg" : "nonveg") + '" title="' + (r.veg ? "Vegetarian" : "Non-vegetarian") + '"></span>' +
          "</div>" +
          '<p class="desc">' + C.esc(r.description || "") + "</p>" +
          '<div class="recipe-actions">' +
            '<button id="fav-toggle" class="fav-toggle">♥ <span>Favorite</span></button>' +
            '<div class="rate-box" id="rate-box"></div>' +
          "</div>" +
          '<div class="recipe-actions">' +
            '<button id="cooked-btn" class="fav-toggle">🍳 <span>Cooked this today</span></button>' +
            '<span id="cooked-info" class="cooked-info"></span>' +
          "</div>" +
          '<div class="recipe-actions plan-row">' +
            '<label class="plan-label" for="plan-day">Add to plan:</label>' +
            '<select id="plan-day">' +
              C.DAYS.map(function (d) { return '<option value="' + d[0] + '">' + d[1] + "</option>"; }).join("") +
            "</select>" +
            '<button id="plan-btn" class="fav-toggle">＋ <span>Add</span></button>' +
            '<a class="plan-link" href="planner.html">View plan →</a>' +
          "</div>" +
          '<div class="stat-grid">' +
            stat("Prep", C.fmtTime(r.prepTimeMin || 0)) +
            stat("Cook", C.fmtTime(r.cookTimeMin || 0)) +
            stat("Total", C.fmtTime(total)) +
            stat("Serves", r.servings) +
            stat("Difficulty", r.difficulty) +
            stat("Protein", r.proteinLevel) +
            '<div class="stat"><span class="k">Leftovers</span><div class="v gold">' + C.stars(r.leftoverRating) + "</div></div>" +
          "</div>" +
          '<div class="equip-row">' +
            (r.equipment && r.equipment.length
              ? r.equipment.map(function (e) { return C.equipIcon(e) + '<span class="equip-name">' + C.esc(e) + "</span>"; }).join("")
              : '<span class="equip-name">No cooking equipment needed</span>') +
          "</div>" +
        "</div>" +
      "</div>" +

      '<div class="recipe-body">' +
        section("Ingredients", list(r.ingredients)) +
        section("Shopping List", list(r.shoppingList)) +
        section("Preparation", list(r.preparation)) +
        section("Cooking Steps", '<ol class="steps">' + (r.steps || []).map(function (s) { return "<li>" + C.esc(s) + "</li>"; }).join("") + "</ol>") +
        section("Storage & Reheating",
          '<div class="info-pair">' +
            '<div class="info-card"><h3>🧊 Storage</h3><p>' + C.esc(r.storage || "—") + "</p></div>" +
            '<div class="info-card"><h3>♨️ Reheating</h3><p>' + C.esc(r.reheating || "—") + "</p></div>" +
          "</div>") +
        (r.buffaloNote ? section("🐃 Using Buffalo Meat", '<div class="chef-notes">' + C.esc(r.buffaloNote) + "</div>") : "") +
        (r.notes ? section("Notes", '<div class="chef-notes">' + C.esc(r.notes) + "</div>") : "") +
        section("My Notes",
          '<textarea id="personal-note" placeholder="e.g. Ananya liked this. Reduce chilli next time."></textarea>' +
          '<p class="note-hint">Saved automatically on this device. <span class="saved" id="note-saved">✓ Saved</span></p>') +
      "</div>";

    C.attachCover(root.querySelector(".recipe-hero-media img"), r);

    /* favorite */
    var favBtn = document.getElementById("fav-toggle");
    function paintFav() {
      var on = C.store.isFavorite(r.id);
      favBtn.classList.toggle("active", on);
      favBtn.querySelector("span").textContent = on ? "Favorited" : "Favorite";
    }
    favBtn.addEventListener("click", function () { C.store.toggleFavorite(r.id); paintFav(); });
    paintFav();

    /* rating */
    renderStars(document.getElementById("rate-box"), r);

    /* cooked log */
    var cookedBtn = document.getElementById("cooked-btn");
    var cookedInfo = document.getElementById("cooked-info");
    function paintCooked() {
      var last = C.store.lastCooked(r.id);
      var count = C.store.cookedCount(r.id);
      var today = new Date().toISOString().slice(0, 10);
      var isToday = last === today;
      cookedBtn.classList.toggle("active", isToday);
      cookedBtn.querySelector("span").textContent = isToday ? "Cooked today ✓" : "Cooked this today";
      cookedInfo.textContent = count
        ? "Last cooked " + C.relTime(last) + " · " + count + (count === 1 ? " time" : " times")
        : "Not cooked yet";
    }
    cookedBtn.addEventListener("click", function () { C.store.toggleCookedToday(r.id); paintCooked(); });
    paintCooked();

    /* add to weekly plan */
    var planBtn = document.getElementById("plan-btn");
    planBtn.addEventListener("click", function () {
      var day = document.getElementById("plan-day").value;
      C.store.addToPlan(day, r.id);
      var span = planBtn.querySelector("span");
      span.textContent = "Added ✓";
      setTimeout(function () { span.textContent = "Add"; }, 1500);
    });

    /* personal notes: debounced auto-save */
    var ta = document.getElementById("personal-note");
    var savedFlag = document.getElementById("note-saved");
    ta.value = C.store.note(r.id);
    var timer = null;
    ta.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        C.store.setNote(r.id, ta.value);
        savedFlag.classList.add("show");
        setTimeout(function () { savedFlag.classList.remove("show"); }, 1500);
      }, 500);
    });
  }

  function stat(k, v) {
    return '<div class="stat"><span class="k">' + C.esc(k) + '</span><div class="v">' + C.esc(v == null ? "—" : v) + "</div></div>";
  }

  function init() {
    var id = new URLSearchParams(location.search).get("id");
    var r = id && C.byId(id);
    if (!r) {
      console.warn("Cookbook: recipe id '" + id + "' not found.");
      document.getElementById("recipe-root").innerHTML =
        '<p class="empty">Couldn\'t find that recipe. <a href="index.html">Back to all recipes</a></p>';
      return;
    }
    render(r);
  }

  if (window.RECIPES_LOADED) init();
  else document.addEventListener("recipes:ready", init);
})(window.Cookbook);
