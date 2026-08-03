# Verma Family Cookbook

A 100% static cookbook — no server, no build step. Just open `index.html` in any browser.

## How to add a recipe (3 steps, no code changes)

1. **Copy an existing file** in `recipes/` (e.g. `kanda-poha.js`), rename it to your recipe's id, e.g. `recipes/palak-paneer.js`, and edit the fields.
2. **Add its photo** as `images/palak-paneer.jpg` (the filename must match the recipe `id`). No photo yet? Fine — a colored placeholder is shown automatically.
3. **Add one line** to `recipes/manifest.js`:
   ```js
   "palak-paneer.js",
   ```

Refresh the page. Done.

## Recipe fields

| Field | Values |
|---|---|
| `id` | unique, kebab-case, matches filename and image name |
| `name`, `description`, `emoji` | free text; emoji is used for the placeholder art |
| `category` | `Chicken`, `Mutton`, `Eggs`, `Vegetables`, `Rice & Pasta`, `Snacks`, `Treats`, `Brunch`, `Kitchen Basics` |
| `mealType` | array of: `Brunch`, `Dinner`, `Side Dish`, `Dessert`, `Snack` |
| `veg` | `true` / `false` (green/red dot on the card) |
| `difficulty` | `Easy` or `Medium` |
| `equipment` | array of: `Air Fryer`, `Gas Stove`, `Microwave`, `Pressure Cooker` (others show as text) |
| `prepTimeMin`, `cookTimeMin` | numbers (minutes); total time is computed |
| `servings` | free text, e.g. `"3–4"` |
| `onePot` | `true` if it's a one-pot/one-appliance meal |
| `proteinLevel` | `High`, `Medium`, `Low` (High feeds the "High protein" filter) |
| `leftoverRating` | 1–5 (4+ counts as "Good leftovers") |
| `ingredients`, `shoppingList`, `preparation`, `steps` | arrays of strings |
| `storage`, `reheating`, `notes` | strings |

## Where your personal data lives

Favorites, star ratings, personal notes, the cooked-it log and the weekly meal plan are stored in the **browser's localStorage** on each device. Clearing browser data clears them — use **Export backup** on the Planner page to save a JSON backup, and **Import** to restore it (or move to another device).

## Folder map

```
index.html      home page (cards, search, filters)
recipe.html     recipe detail page
planner.html    weekly meal planner, shopping list, backup/restore
css/style.css   all styling
js/             app logic (you never need to touch this to add recipes)
recipes/        one .js file per recipe + manifest.js
images/         one photo per recipe, named <id>.jpg
```
