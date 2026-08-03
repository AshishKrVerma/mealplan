/* Local persistence: favorites, ratings, notes, cooked-log, meal plan,
   shopping ticks, UI prefs — plus backup export/import.
   Degrades gracefully: if localStorage is unavailable the site still works,
   it just won't remember anything (a console warning explains why). */
(function (C) {
  "use strict";
  var PREFIX = "cookbook.";
  /* keys included in backup export/import */
  var DATA_KEYS = ["favorites", "ratings", "notes", "cooked", "plan"];

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(PREFIX + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
      console.warn("Cookbook: could not read '" + key + "' from localStorage; using default.", e);
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.warn("Cookbook: could not save '" + key + "' — it will not persist.", e);
    }
  }

  C.store = {
    /* ---- favorites ---- */
    favorites: function () { return read("favorites", []); },
    isFavorite: function (id) { return this.favorites().indexOf(id) !== -1; },
    toggleFavorite: function (id) {
      var f = this.favorites(), i = f.indexOf(id);
      if (i === -1) f.push(id); else f.splice(i, 1);
      write("favorites", f);
      return i === -1;
    },

    /* ---- ratings ---- */
    rating: function (id) { return read("ratings", {})[id] || 0; },
    setRating: function (id, n) {
      var r = read("ratings", {});
      if (n) r[id] = n; else delete r[id];
      write("ratings", r);
    },

    /* ---- personal notes ---- */
    note: function (id) { return read("notes", {})[id] || ""; },
    setNote: function (id, text) {
      var n = read("notes", {});
      if (text && text.trim()) n[id] = text; else delete n[id];
      write("notes", n);
    },

    /* ---- cooked log: id -> array of "YYYY-MM-DD" ---- */
    cookedDates: function (id) { return read("cooked", {})[id] || []; },
    lastCooked: function (id) {
      var d = this.cookedDates(id);
      return d.length ? d[d.length - 1] : null;
    },
    cookedCount: function (id) { return this.cookedDates(id).length; },
    /* toggle today's entry; returns true if today is now logged */
    toggleCookedToday: function (id) {
      var all = read("cooked", {});
      var list = all[id] || [];
      var today = new Date().toISOString().slice(0, 10);
      var i = list.indexOf(today);
      if (i === -1) list.push(today); else list.splice(i, 1);
      if (list.length > 50) list = list.slice(-50);
      if (list.length) all[id] = list; else delete all[id];
      write("cooked", all);
      return i === -1;
    },

    /* ---- weekly plan: {mon:[ids], ...} ---- */
    plan: function () { return read("plan", {}); },
    addToPlan: function (day, id) {
      var p = read("plan", {});
      (p[day] = p[day] || []).push(id);
      write("plan", p);
    },
    removeFromPlan: function (day, index) {
      var p = read("plan", {});
      if (p[day]) { p[day].splice(index, 1); if (!p[day].length) delete p[day]; }
      write("plan", p);
    },
    clearPlan: function () { write("plan", {}); write("shopTicks", {}); },
    planCount: function () {
      var p = this.plan(), n = 0;
      Object.keys(p).forEach(function (d) { n += p[d].length; });
      return n;
    },

    /* ---- shopping list ticks (keyed by normalized item) ---- */
    ticks: function () { return read("shopTicks", {}); },
    toggleTick: function (key) {
      var t = read("shopTicks", {});
      if (t[key]) delete t[key]; else t[key] = 1;
      write("shopTicks", t);
    },
    clearTicks: function () { write("shopTicks", {}); },

    /* ---- small UI prefs ---- */
    pref: function (key, fallback) { return read("pref." + key, fallback); },
    setPref: function (key, value) { write("pref." + key, value); },

    /* ---- backup ---- */
    exportData: function () {
      var data = {};
      DATA_KEYS.forEach(function (k) { data[k] = read(k, null); });
      return { app: "verma-family-cookbook", version: 1, exportedAt: new Date().toISOString(), data: data };
    },
    importData: function (obj) {
      if (!obj || obj.app !== "verma-family-cookbook" || !obj.data) return false;
      DATA_KEYS.forEach(function (k) {
        if (obj.data[k] !== null && obj.data[k] !== undefined) write(k, obj.data[k]);
      });
      return true;
    }
  };
})(window.Cookbook);