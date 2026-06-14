# Add Games to Catalog

Ask the user to provide one or more BGG game URLs (boardgamegeek.com links). Accept them in any format — comma-separated, newline-separated, or pasted as a list.

For each URL provided, do the following **fully autonomously without asking the user any questions** unless you hit a genuine blocker (e.g., the API returns no data and you can't determine a field at all).

## Data fetching (run in parallel for all games)

Extract the BGG ID and objecttype from each URL:
- `/boardgame/NNNN/` → objecttype=thing
- `/boardgameexpansion/NNNN/` → objecttype=thing  
- `/rpgitem/NNNN/` → objecttype=rpgitem

Fetch from `api.geekdo.com`: 
```
/api/geekitems?objectid={ID}&objecttype={type}
```

Extract from the response:
- `item.name` → name
- `item.minplayers` / `item.maxplayers` → players string (e.g. "1–4" using en-dash, or "2" if min==max)
- `item.minplaytime` / `item.maxplaytime` → playTime string (e.g. "30–60 min" or "45 min" if equal)
- `item.minplaytime` → timeMin (integer)
- `item.maxplaytime` → timeMax (integer)
- `item.images.square200` → img URL
- `item.links.boardgamemechanic` + `item.links.boardgamecategory` + `item.links.boardgamesubdomain` (and rpg equivalents) → tags array, deduplicated and alphabetically sorted

## Fields to determine yourself

Make all of these calls independently — do not ask the user:

- **crunch**: Your best estimate of the game's complexity/weight on a 1–10 scale, based on your knowledge of the game and signals from its mechanics/tags (e.g. many complex mechanics → higher crunch). Use the BGG weight rating as a reference if you know it.
- **coop**: `true` if players cooperate against the game; `false` if competitive or solo-only. Use the mechanics tags (e.g. "Cooperative Game") and your knowledge of the game.
- **rating**: Use your knowledge of the game's BGG rating. If you don't know it, use `null`.
- **description**: Write a 1–2 sentence description in the same style as the existing entries — specific, evocative, focused on what makes the game distinctive. Do not be generic.
- **id**: `Math.max(...GAMES.map(g => g.id)) + 1` (increment for each new game)
- **meal**: Assign based on session weight — "Appetizer" for light/short games (low crunch, short playtime), "Main Course" for heavier or longer games.

## Writing to games.js

Read the current `games.js`, parse the GAMES array, append the new game objects, and write back using:
```js
'const GAMES = ' + JSON.stringify(GAMES, null, 2) + ';\n'
```

Also bump the `?v=N` cache-buster on the `games.js` script tag in `index.html` by 1.

## Commit and push

After writing the files, commit and push:
```
git add games.js index.html
git commit -m "Add <game name(s)> to catalog"
git push
```

## After pushing

Confirm what was added with a short summary: game name, player count, play time, crunch, co-op, and whether an image was found.
