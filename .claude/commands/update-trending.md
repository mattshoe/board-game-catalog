# Update Trending Games

Scrape board gaming subreddits, compile ranked game lists by category, fetch BGG metadata, and update `trending-data.js` with today's snapshot. Then commit and push.

## Step 1 — Scrape Reddit

Use `mcp__reddit__fetch_reddit_hot_threads` (limit: 25) for each subreddit:
- `boardgames`
- `soloboardgaming`
- `boardgamescirclejerk`

Also fetch comments from any "Weekly Crowdfunding Roundup" post found in r/boardgames hot threads.

## Step 2 — Score games

For each post, extract every board game name mentioned in the title and body. Score:

- **score** = sum of (post upvotes × weight) across all posts mentioning the game
  - r/boardgames weight: 1.0
  - r/soloboardgaming weight: 1.0
  - r/boardgamescirclejerk weight: 0.5
- **mentions** = count of posts referencing the game
- **sources** = list of subreddits where it appeared

Category rules:
- **solo**: games mentioned in r/soloboardgaming, or in a solo context elsewhere
- **party**: games described as party, social deduction, or large-group (6+ players)
- **overall**: all games by total score

Return top 15 for overall and solo, top 10 for party. For crowdfunding, extract the top campaigns from the roundup post (backers, platform, end date).

## Step 3 — Compute rank changes

Load the current `trending-data.js`. Find the most recent history entry. For each game in today's rankings, compare its rank to the prior snapshot:
- `change`: +N (moved up N spots), -N (moved down), 0 (same), null (not in prior snapshot = new)

## Step 4 — Fetch BGG metadata

For each unique game name across all categories today, check if it already has a `bgg` URL in any prior history entry. If so, reuse it.

For any game **without** a known `bgg` URL: use WebFetch to query:
`https://boardgamegeek.com/xmlapi2/search?query={GAME_NAME}&type=boardgame&exact=1`

If that returns 401, try the BGG website directly for the og:image:
`https://boardgamegeek.com/boardgame/{id}/{slug}`

If BGG is unreachable, leave `bgg: null` and `img: null` for unknown games.

For **games already in the catalog** (`games.js`), cross-reference by name to get their `bgg` and `img` fields — these are already stored there and don't require an API call.

Store results as:
- `bgg`: full BGG URL, e.g. `"https://boardgamegeek.com/boardgame/237182/root"`
- `img`: square thumbnail URL from BGG CDN, e.g. `"https://cf.geekdo-images.com/...square200.../pic....jpg"`

## Step 5 — Build today's snapshot object

```js
{
  date: "YYYY-MM-DD",   // today's actual date
  overall:      [ { name, score, mentions, sources, change, bgg, img }, ... ],  // top 15
  solo:         [ { name, score, mentions, sources, change, bgg, img }, ... ],  // top 15
  party:        [ { name, score, mentions, sources, change, bgg, img }, ... ],  // top 10
  crowdfunding: [ { name, backers, pct, platform, ends, bgg }, ... ]
}
```

## Step 6 — Update trending-data.js

Read `/Users/matthewshoemaker/repos/board-game-catalog/trending-data.js`.

Append today's snapshot to `TRENDING_DATA.history`. If the array already has 30 entries, remove index 0 (oldest) before appending.

Write the file back.

## Step 7 — Commit and push

```bash
cd /Users/matthewshoemaker/repos/board-game-catalog
git add trending-data.js
git commit -m "chore: update trending games $(date +%Y-%m-%d)"
git push
```

GitHub Pages redeploys automatically after the push.
