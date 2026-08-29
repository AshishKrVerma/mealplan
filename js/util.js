/* Shared helpers: recipe registry, category art, equipment icons, formatting. */
window.RECIPES = window.RECIPES || [];
window.Cookbook = window.Cookbook || {};

(function (C) {
  "use strict";

  C.CATEGORIES = ["Chicken", "Mutton", "Eggs", "Vegetables", "Keto", "Rice & Pasta", "Snacks", "Treats", "Drinks", "Brunch", "Kitchen Basics"];

  /* [light gradient start, gradient end] used for placeholder cover art */
  C.CATEGORY_ART = {
    "Chicken":        ["#ffe8cc", "#ffc78a"],
    "Mutton":         ["#f5e0d3", "#e2b494"],
    "Eggs":           ["#fff3c4", "#ffd97a"],
    "Vegetables":     ["#e4f2d5", "#b5dd8e"],
    "Keto":           ["#dff0e8", "#9fd3bb"],
    "Rice & Pasta":   ["#f7edd8", "#e8d3a3"],
    "Snacks":         ["#f5ead2", "#e4c675"],
    "Treats":         ["#fde2ec", "#f9b8d4"],
    "Drinks":         ["#ddeefb", "#a5cbee"],
    "Brunch":         ["#ffe9d6", "#ffc9a3"],
    "Kitchen Basics": ["#e5e9ef", "#c3ccd9"]
  };

  /* Material-family icons via Iconify (mdi / material-symbols), inlined so
     they follow currentColor and the site stays fully offline. */
  var ICONS = {
    "Gas Stove": '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 14h2l3 3H9zM4 4h1V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1h2V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1h1a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2v1h-3v-1H7v1H4v-1a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2m14 3a1 1 0 0 1 1 1a1 1 0 0 1-1 1a1 1 0 0 1-1-1a1 1 0 0 1 1-1m-4 0a1 1 0 0 1 1 1a1 1 0 0 1-1 1a1 1 0 0 1-1-1a1 1 0 0 1 1-1m6-1H4v4h16zM4 19h16v-7H4zM6 7a1 1 0 0 1 1 1a1 1 0 0 1-1 1a1 1 0 0 1-1-1a1 1 0 0 1 1-1m7 7h2l3 3h-2z"/></svg>',
    "Air Fryer": '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5V4q0-.825.588-1.412T10 2h4q.825 0 1.413.588T16 4v1h3q.825 0 1.413.588T21 7v1H3V7q0-.825.588-1.412T5 5zM5 21q-.825 0-1.412-.587T3 19v-9h4v2q0 .825.588 1.413T9 14h6q.825 0 1.413-.587T17 12v-2h4v9q0 .825-.587 1.413T19 21zm3.713-3.287Q9 17.425 9 17t-.288-.712T8 16t-.712.288T7 17t.288.713T8 18t.713-.288m4 0Q13 17.426 13 17t-.288-.712T12 16t-.712.288T11 17t.288.713T12 18t.713-.288m4 0Q17 17.426 17 17t-.288-.712T16 16t-.712.288T15 17t.288.713T16 18t.713-.288M9 12v-2h6v2zm1-7h4V4h-4z"/></svg>',
    "Microwave": '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 2h12v10H4zm15 0a1 1 0 0 1 1 1a1 1 0 0 1-1 1a1 1 0 0 1-1-1a1 1 0 0 1 1-1m-6 2v6h2V9zm6 2a1 1 0 0 1 1 1a1 1 0 0 1-1 1a1 1 0 0 1-1-1a1 1 0 0 1 1-1"/></svg>',
    "Pressure Cooker": '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 19c0 1.11-.89 2-2 2H7a2 2 0 0 1-2-2v-7H3v-2h18v2h-2M8 1.5a3.35 3.35 0 0 0 0 6.7h1.53c.39 0 .76.1 1.08.3h2.02c-.58-1.05-1.77-1.75-3.1-1.75H8c-1 0-1.85-.98-1.85-2S7 3 8 3m4.85-1c0 1-.85 1.85-1.85 1.85v1.5c1.92 0 3.5 1.35 3.89 3.15h1.53a5.54 5.54 0 0 0-3.07-4.12c.62-.61 1-1.45 1-2.38Z"/></svg>'
  };

  C.equipIcon = function (name) {
    var svg = ICONS[name];
    return svg
      ? '<span class="equip" title="' + C.esc(name) + '">' + svg + "</span>"
      : '<span class="equip equip-text">' + C.esc(name) + "</span>";
  };

  C.esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  };

  C.totalTime = function (r) { return (r.prepTimeMin || 0) + (r.cookTimeMin || 0); };

  C.fmtTime = function (min) {
    if (min >= 60) {
      var h = Math.floor(min / 60), m = min % 60;
      return h + " hr" + (m ? " " + m + " min" : "");
    }
    return min + " min";
  };

  C.isHighProtein = function (r) { return r.proteinLevel === "High"; };
  C.goodLeftovers = function (r) { return (r.leftoverRating || 0) >= 4; };

  C.byId = function (id) {
    for (var i = 0; i < window.RECIPES.length; i++) {
      if (window.RECIPES[i].id === id) return window.RECIPES[i];
    }
    return null;
  };

  C.coverSrc = function (r) { return "images/" + r.id + ".jpg"; };

  /* Category-coloured SVG placeholder shown until a real photo exists in /images */
  C.placeholder = function (r) {
    var art = C.CATEGORY_ART[r.category] || C.CATEGORY_ART["Kitchen Basics"];
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 420">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + art[0] + '"/><stop offset="1" stop-color="' + art[1] + '"/>' +
      "</linearGradient></defs>" +
      '<rect width="600" height="420" fill="url(#g)"/>' +
      '<circle cx="90" cy="70" r="100" fill="#ffffff" opacity=".2"/>' +
      '<circle cx="530" cy="370" r="130" fill="#ffffff" opacity=".16"/>' +
      '<text x="300" y="255" font-size="130" text-anchor="middle">' + (r.emoji || "🍽️") + "</text></svg>";
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  };

  /* Point an <img> at the recipe photo, falling back to placeholder art */
  C.attachCover = function (img, r) {
    img.alt = r.name;
    img.onerror = function () { this.onerror = null; this.src = C.placeholder(r); };
    img.src = C.coverSrc(r);
  };

  C.stars = function (n) {
    n = Math.max(0, Math.min(5, n || 0));
    return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
  };

  /* Ingredient synonyms — English / Hinglish / common variants all map to the
     term the recipe text actually uses, so okra = bhindi = lady finger, etc. */
  var ALIASES = {
    /* multi-word first (sorted longest-first below anyway) */
    "lady finger": "bhindi", "ladies finger": "bhindi", "ladys finger": "bhindi",
    "bottle gourd": "lauki", "cottage cheese": "paneer",
    "phool gobhi": "cauliflower", "phul gobhi": "cauliflower",
    "patta gobhi": "cabbage", "band gobhi": "cabbage", "bandh gobhi": "cabbage",
    "shimla mirch": "capsicum", "bell pepper": "capsicum",
    "hari mirch": "chilli", "kadi patta": "curry leaves",
    "kidney beans": "rajma", "kidney bean": "rajma",
    "green peas": "peas", "green pea": "peas", "gram flour": "besan",
    /* single words */
    "ladyfinger": "bhindi", "ladyfingure": "bhindi", "okra": "bhindi",
    "ghiya": "lauki", "doodhi": "lauki", "dudhi": "lauki",
    "anda": "egg", "ande": "egg", "andey": "egg",
    "murgh": "chicken", "murgi": "chicken",
    "gosht": "mutton", "lamb": "mutton", "goat": "mutton",
    "gobhi": "gobi", "pyaz": "onion", "pyaaz": "onion", "kanda": "onion",
    "tamatar": "tomato", "gajar": "carrot", "aalu": "aloo", "alu": "aloo", "batata": "aloo",
    "mirchi": "chilli", "mirch": "chilli", "nimbu": "lemon",
    "adrak": "ginger", "lehsun": "garlic", "lasun": "garlic", "lahsun": "garlic",
    "khumb": "mushroom", "khumbi": "mushroom",
    "mutter": "matar", "mattar": "matar", "saag": "palak",
    "dhania": "coriander", "pudina": "mint", "dahi": "curd",
    "fenugreek": "methi", "spinach": "palak", "lentil": "dal", "lentils": "dal",
    "chole": "chana", "chhole": "chana", "chickpea": "chana", "chickpeas": "chana",
    "makai": "corn", "makka": "corn", "rava": "sooji", "suji": "sooji",
    "chawal": "rice", "makhan": "butter", "sabzi": "vegetable", "subzi": "vegetable",
    "meetha": "sweet", "laddu": "ladoo", "laddoo": "ladoo",
    "protein powder": "whey", "chia seeds": "chia", "chia seed": "chia",
    "khichadi": "khichdi", "kichdi": "khichdi", "parantha": "paratha", "chapathi": "chapati"
  };
  var ALIAS_KEYS = Object.keys(ALIASES).sort(function (a, b) { return b.length - a.length; });

  C.normalizeQuery = function (q) {
    q = String(q || "").toLowerCase();
    ALIAS_KEYS.forEach(function (k) {
      q = q.replace(new RegExp("\\b" + k + "\\b", "g"), ALIASES[k]);
    });
    return q;
  };

  /* one searchable string per recipe: name, description, category, ingredients */
  C.haystack = function (r) {
    if (!r._hay) {
      r._hay = (r.name + " " + (r.description || "") + " " + r.category + " " +
        (r.ingredients || []).join(" ") + " " + (r.shoppingList || []).join(" ")).toLowerCase();
    }
    return r._hay;
  };

  C.relTime = function (iso) {
    var days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (days <= 0) return "today";
    if (days === 1) return "yesterday";
    if (days < 14) return days + "d ago";
    if (days < 60) return Math.floor(days / 7) + "w ago";
    return Math.floor(days / 30) + "mo ago";
  };

  C.DAYS = [
    ["mon", "Monday"], ["tue", "Tuesday"], ["wed", "Wednesday"], ["thu", "Thursday"],
    ["fri", "Friday"], ["sat", "Saturday"], ["sun", "Sunday"]
  ];
})(window.Cookbook);
