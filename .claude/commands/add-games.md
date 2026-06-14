# Add Games to Catalog

Ask the user to provide one or more BGG game URLs (boardgamegeek.com links). Accept them in any format — comma-separated, newline-separated, or pasted as a list.

For each URL provided, do the following **fully autonomously without asking the user questions** (except for the two fields noted below):

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

## Fields to ask the user about

After fetching all games, present a summary table of what was found and ask the user **two things in a single message**:
1. **Crunch (1–10)** for each game — describe it as "complexity/weight on a 1–10 scale" and give your own best estimate for each as a suggestion
2. **Co-op?** (yes/no) for each game — give your own best guess as a suggestion

## Fields to determine yourself

- **rating**: Use your knowledge of the game's BGG rating. If you don't know it, use `null`.
- **coop**: Use your best judgment (confirmed by user above).
- **description**: Write a 1–2 sentence description in the same style as the existing entries — specific, evocative, focused on what makes the game distinctive. Do not be generic.
- **id**: `Math.max(...GAMES.map(g => g.id)) + 1` (increment for each new game)

## Writing to games.js

Read the current `games.js`, parse the GAMES array, append the new game objects, and write back using:
```js
'const GAMES = ' + JSON.stringify(GAMES, null, 2) + ';\n'
```

Also bump the `?v=N` cache-buster on the `games.js` script tag in `index.html` by 1.

## After writing

Confirm what was added with a short summary: game name, player count, play time, crunch, co-op, and whether an image was found.
