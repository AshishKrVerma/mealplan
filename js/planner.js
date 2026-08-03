/* Meal planner: weekly board, combined deduplicated shopping list, backup. */
(function (C) {
  "use strict";

  var pickerDay = null;

  /* ---------- week board ---------- */
  function renderBoard() {
    var board = document.getElementById("board");
    var plan = C.store.plan();
    board.innerHTML = "";
    C.DAYS.forEach(function (d) {
      var key = d[0], label = d[1];
      var col = document.createElement("div");
      col.className = "day-col";
      var entries = (plan[key] || []).map(function (id, i) {
        var r = C.byId(id);
        if (!r) return '<li class="day-item missing">Removed recipe <button class="rm" data-i="' + i + '">✕</button></li>';
        return '<li class="day-item">' +
          '<a href="recipe.html?id=' + encodeURIComponent(id) + '">' + C.esc(r.name) + "</a>" +
          '<span class="day-item-meta">⏱ ' + C.fmtTime(C.totalTime(r)) + "</span>" +
          '<button class="rm" data-i="' + i + '" title="Remove">✕</button></li>';
      }).join("");
      col.innerHTML =
        '<div class="day-name">' + label + "</div>" +
        '<ul class="day-list">' + entries + "</ul>" +
        '<button class="day-add" data-day="' + key + '">＋ Add recipe</button>';
      col.querySelectorAll(".rm").forEach(function (btn) {
        btn.addEventListener("click", function () {
          C.store.removeFromPlan(key, parseInt(btn.dataset.i, 10));
          renderBoard(); renderShop();
        });
      });
      col.querySelector(".day-add").addEventListener("click", function () { openPicker(key, label); });
      board.appendChild(col);
    });
  }

  /* ---------- recipe picker ---------- */
  function openPicker(dayKey, dayLabel) {
    pickerDay = dayKey;
    document.getElementById("picker-title").textContent = "Add to " + dayLabel;
    document.getElementById("picker-search").value = "";
    renderPickerList("");
    document.getElementById("picker").hidden = false;
    document.getElementById("picker-search").focus();
  }

  function closePicker() { document.getElementById("picker").hidden = true; pickerDay = null; }

  function renderPickerList(query) {
    var tokens = C.normalizeQuery(query).split(/\s+/).filter(Boolean);
    var list = window.RECIPES.filter(function (r) {
      if (!tokens.length) return true;
      var hay = C.haystack(r);
      return tokens.every(function (t) { return hay.indexOf(t) !== -1; });
    }).sort(function (a, b) { return a.name.localeCompare(b.name); });

    var ul = document.getElementById("picker-list");
    ul.innerHTML = list.map(function (r) {
      return '<li data-id="' + C.esc(r.id) + '">' +
        '<span class="diet ' + (r.veg ? "veg" : "nonveg") + '"></span> ' +
        C.esc(r.name) +
        '<span class="day-item-meta">' + C.esc(r.category) + " · ⏱ " + C.fmtTime(C.totalTime(r)) + "</span></li>";
    }).join("") || '<li class="empty-li">No matches.</li>';

    ul.querySelectorAll("li[data-id]").forEach(function (li) {
      li.addEventListener("click", function () {
        if (!pickerDay) return closePicker();
        C.store.addToPlan(pickerDay, li.dataset.id);
        closePicker();
        renderBoard(); renderShop();
      });
    });
  }

  /* ---------- shopping list ---------- */
  var UNIT_WORDS = /\b(g|kg|ml|l|tsp|tbsp|cup|cups|inch|cm|large|medium|small|packet|tray|tub|jar|bottle|big|handful)\b/g;

  function normKey(item) {
    var s = String(item).toLowerCase()
      .replace(/\([^)]*\)/g, " ")
      .replace(/[0-9¼-¾⅐-⅞./–-]+/g, " ")
      .replace(UNIT_WORDS, " ")
      .replace(/[^a-z\s]/g, " ")
      .replace(/\s+/g, " ").trim();
    return s.split(" ").map(function (w) {
      return w.length > 3 && w.slice(-1) === "s" && w.slice(-2) !== "ss" ? w.slice(0, -1) : w;
    }).join(" ");
  }

  function displayName(item) {
    return String(item).replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
  }

  function aggregate() {
    var plan = C.store.plan();
    var groups = {};
    C.DAYS.forEach(function (d) {
      (plan[d[0]] || []).forEach(function (id) {
        var r = C.byId(id);
        if (!r) return;
        (r.shoppingList || []).forEach(function (item) {
          var k = normKey(item);
          if (!k) return;
          if (!groups[k]) groups[k] = { display: displayName(item), originals: [], count: 0 };
          groups[k].count++;
          if (groups[k].originals.indexOf(item) === -1) groups[k].originals.push(item);
        });
      });
    });
    return groups;
  }

  function renderShop() {
    var groups = aggregate();
    var keys = Object.keys(groups).sort(function (a, b) { return groups[a].display.localeCompare(groups[b].display); });
    var ul = document.getElementById("shop");
    var ticks = C.store.ticks();
    document.getElementById("shop-empty").hidden = keys.length > 0;
    ul.innerHTML = "";
    keys.forEach(function (k) {
      var g = groups[k];
      var li = document.createElement("li");
      li.className = ticks[k] ? "ticked" : "";
      li.innerHTML =
        '<label><input type="checkbox"' + (ticks[k] ? " checked" : "") + ">" +
        '<span class="shop-name">' + C.esc(g.display) + "</span>" +
        (g.count > 1 ? '<span class="badge">×' + g.count + "</span>" : "") +
        "</label>" +
        '<div class="shop-detail">' + g.originals.map(C.esc).join(" · ") + "</div>";
      li.querySelector("input").addEventListener("change", function () {
        C.store.toggleTick(k);
        li.classList.toggle("ticked");
      });
      ul.appendChild(li);
    });
  }

  function copyList() {
    var groups = aggregate();
    var keys = Object.keys(groups).sort(function (a, b) { return groups[a].display.localeCompare(groups[b].display); });
    if (!keys.length) return flash("Nothing to copy — plan some meals first");
    var lines = keys.map(function (k) {
      var g = groups[k];
      return "- " + g.display + (g.count > 1 ? " (x" + g.count + ")" : "") +
        (g.originals.length > 1 || g.originals[0] !== g.display ? "  [" + g.originals.join("; ") + "]" : "");
    });
    var text = "Shopping list — Verma Family Cookbook\n" + lines.join("\n");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { flash("Copied " + keys.length + " items"); },
        function () { window.prompt("Copy this list:", text); }
      );
    } else {
      window.prompt("Copy this list:", text);
    }
  }

  /* ---------- backup ---------- */
  function exportBackup() {
    var blob = new Blob([JSON.stringify(C.store.exportData(), null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "cookbook-backup-" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    flash("Backup downloaded");
  }

  function importBackup(file) {
    var reader = new FileReader();
    reader.onload = function () {
      var ok = false;
      try { ok = C.store.importData(JSON.parse(reader.result)); }
      catch (e) { console.warn("Cookbook: backup import failed.", e); }
      if (!ok) return flash("That file doesn't look like a cookbook backup");
      if (window.confirm("Backup restored. Reload to see it everywhere?")) location.reload();
    };
    reader.readAsText(file);
  }

  function flash(msg) {
    var el = document.getElementById("data-msg");
    el.textContent = "✓ " + msg;
    setTimeout(function () { el.textContent = ""; }, 3000);
  }

  /* ---------- init ---------- */
  function init() {
    renderBoard();
    renderShop();

    document.getElementById("clear-week").addEventListener("click", function () {
      if (window.confirm("Clear all planned meals for the week?")) {
        C.store.clearPlan();
        renderBoard(); renderShop();
      }
    });
    document.getElementById("copy-list").addEventListener("click", copyList);
    document.getElementById("clear-ticks").addEventListener("click", function () {
      C.store.clearTicks(); renderShop();
    });
    document.getElementById("picker-close").addEventListener("click", closePicker);
    document.getElementById("picker").addEventListener("click", function (e) {
      if (e.target === this) closePicker();
    });
    document.getElementById("picker-search").addEventListener("input", function () {
      renderPickerList(this.value);
    });
    document.getElementById("export-data").addEventListener("click", exportBackup);
    document.getElementById("import-data").addEventListener("click", function () {
      document.getElementById("import-file").click();
    });
    document.getElementById("import-file").addEventListener("change", function () {
      if (this.files && this.files[0]) importBackup(this.files[0]);
      this.value = "";
    });
  }

  if (window.RECIPES_LOADED) init();
  else document.addEventListener("recipes:ready", init);
})(window.Cookbook);