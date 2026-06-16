# Update Trending Games

Scrape board gaming subreddits, score games, fetch BGG metadata, and append a new daily snapshot to `trending-data.js`. Then commit and push so GitHub Pages redeploys automatically.

**Run this once per day.** If today's date already exists in `TRENDING_DATA.history`, replace that entry with the freshly scraped data rather than appending a duplicate.

---

## Context: data file

All data lives in one file:
```
/Users/matthewshoemaker/repos/board-game-catalog/trending-data.js
```

It exports a single global `TRENDING_DATA` object:
```js
const TRENDING_DATA = {
  meta: { subreddits: [...] },
  history: [
    {
      date: "YYYY-MM-DD",
      overall:      [ { name, score, mentions, sources, change, bgg, img }, ... ],  // top 15
      solo:         [ { name, score, mentions, sources, change, bgg, img }, ... ],  // top 15
      party:        [ { name, score, mentions, sources, change, bgg, img }, ... ],  // top 10
      crowdfunding: [ { name, backers, pct, platform, ends, url, bgg, img }, ... ]
    },
    ...  // up to 30 entries, oldest first
  ]
};
```

Field reference:
- `score` — weighted upvote sum across all posts mentioning the game
- `mentions` — number of posts that referenced the game
- `sources` — array of subreddit strings, e.g. `["r/boardgames", "r/soloboardgaming"]`
- `change` — rank delta vs. prior snapshot: positive = moved up, negative = moved down, `0` = same rank, `null` = new entry not in prior snapshot
- `bgg` — full BGG URL, e.g. `"https://boardgamegeek.com/boardgame/237182/root"` (null if unknown)
- `img` — BGG CDN square thumbnail URL, e.g. `"https://cf.geekdo-images.com/...square200.../pic....jpg"` (null if unknown)
- `url` — direct crowdfunding campaign URL on Kickstarter or Gamefound (crowdfunding only)
- `pct` — funding percentage as an integer, e.g. `10044` means 10,044% funded
- `ends` — campaign end date as `"YYYY-MM-DD"` string, or `null` if ongoing/unknown

---

## Step 1 — Scrape Reddit

Use `mcp__reddit__fetch_reddit_hot_threads` (limit: 50) for each subreddit:
- `boardgames`
- `soloboardgaming`
- `boardgamescirclejerk`

After fetching, **filter posts to only those created within the last 48 hours** using the post's `created_utc` timestamp. Discard any post older than 48 hours before scoring. Use a higher limit (50) to ensure enough recent posts survive the filter.

Also use `mcp__reddit__fetch_reddit_post_content` on any post whose title contains "Weekly Crowdfunding Roundup" found in r/boardgames hot threads — this is the source for the crowdfunding section. Include this post regardless of age (roundup posts are often pinned and may be older than 48 hours).

---

## Step 2 — Score games

For each post (title + body text), extract every board game name mentioned.

**Scoring:**
- `score` = sum of (post.upvotes × subreddit_weight) across every post that mentions the game
  - r/boardgames: weight **1.0**
  - r/soloboardgaming: weight **1.0**
  - r/boardgamescirclejerk: weight **0.5**
- `mentions` = count of distinct posts referencing the game
- `sources` = deduplicated list of subreddits where it appeared

**Category assignment:**
- **overall** — all games, ranked by total score. Top 15.
- **solo** — games mentioned in r/soloboardgaming, OR mentioned in a solo/solitaire context in any subreddit. Top 15.
- **party** — games described as party games, social deduction, or designed for 6+ players. Top 10.

A game can appear in multiple categories.

**Crowdfunding** — from the Weekly Roundup post comments/body, extract each campaign:
- `name` — game name
- `backers` — backer count (integer)
- `pct` — funded percentage (integer, e.g. 1028 for 1028%)
- `platform` — `"Kickstarter"` or `"Gamefound"`
- `ends` — end date as `"YYYY-MM-DD"` or `null`
- `url` — direct campaign URL on kickstarter.com or gamefound.com
- `bgg` — BGG URL (populate in Step 4)
- `img` — BGG thumbnail (populate in Step 4)

---

## Step 3 — Compute rank changes

Read `trending-data.js` and find `TRENDING_DATA.history[history.length - 1]` (the most recent snapshot).

For each game in today's overall/solo/party rankings, find its rank in the matching category of the prior snapshot:
- If the game was rank 3 before and is rank 1 today → `change: +2` (moved up 2)
- If the game was rank 2 before and is rank 5 today → `change: -3` (moved down 3)
- If the rank is unchanged → `change: 0`
- If the game was not in the prior snapshot at all → `change: null`

Crowdfunding entries always use `change: null` (not ranked).

---

## Step 4 — Fetch BGG metadata

For every unique game across all categories (overall + solo + party + crowdfunding):

**1. Check prior history first** — scan all entries in `TRENDING_DATA.history` for any entry with the same name that already has a `bgg` URL. If found, reuse it (skip API calls).

**2. Check games.js** — Read `/Users/matthewshoemaker/repos/board-game-catalog/games.js`. If the game name matches an entry there, use its `bgg` field.

**3. Search BGG for unknown games** — If still no `bgg` URL, use WebSearch:
```
{GAME_NAME} site:boardgamegeek.com boardgame
```
Find the BGG page URL (pattern: `https://boardgamegeek.com/boardgame/{ID}/{slug}`). Set `bgg` to that full URL. If nothing found, leave `bgg: null` and `img: null`.

**4. Fetch the thumbnail** — For every game that now has a `bgg` URL, extract the numeric ID from the URL and call:
```
https://api.geekdo.com/api/geekitems?objecttype=boardgame&objectid={ID}
```
This returns JSON. The square thumbnail is in the `images` object — look for the `square200` key. The URL looks like:
```
https://cf.geekdo-images.com/{hash}__square200/img/{hash}=/200x200/filters:strip_icc()/{filename}.jpg
```
Set that as `img`. If the API call fails or returns no image, leave `img: null`.

---

## Step 5 — Build today's snapshot

Use today's actual date in `YYYY-MM-DD` format (not hardcoded).

```js
{
  date: "YYYY-MM-DD",
  overall: [
    { name, score, mentions, sources, change, bgg, img },
    // ... top 15, sorted by score descending
  ],
  solo: [
    { name, score, mentions, sources, change, bgg, img },
    // ... top 15, sorted by score descending
  ],
  party: [
    { name, score, mentions, sources, change, bgg, img },
    // ... top 10, sorted by score descending
  ],
  crowdfunding: [
    { name, backers, pct, platform, ends, url, bgg, img },
    // ... all campaigns found, sorted by backers descending
  ]
}
```

---

## Step 6 — Update trending-data.js

Read the file. Then:

- If an entry with today's date already exists in `TRENDING_DATA.history`, replace it in-place with today's new snapshot.
- Otherwise, append the new snapshot. If the array already has **30 entries**, remove index `0` (the oldest) before appending — the array must never exceed 30.

Write the full file back. Keep the existing formatting style (the `const TRENDING_DATA = { ... };` wrapper must be preserved exactly).

---

## Step 7 — Commit and push

```bash
cd /Users/matthewshoemaker/repos/board-game-catalog
git add trending-data.js
git commit -m "chore: update trending games $(date +%Y-%m-%d)"
git push
```

GitHub Pages redeploys automatically after the push. No other files need to be changed — the site reads `trending-data.js` directly.

---

## Step 8 — Post to Discord

Use the `mcp__discord-mcp__send_message` tool to post to three channels in the "Game Night" server.

**Channel IDs:**
- `#trending-games` → `1516429115992047744`
- `#solo-gaming` → `1516429914054852789`
- `#kickstarters` → `1516429197193773166`

### #trending-games — overall leaderboard

Post today's `overall` rankings as a plain numbered list. Include the game name and score. No intro fluff.

Example format:
```
📊 Trending Board Games — 2026-06-16

1. Mansions of Madness — 572
2. Root — 235
3. Death May Die — 174
...
```

### #solo-gaming — solo leaderboard

Same format, using today's `solo` rankings.

```
🧍 Solo Gaming Trending — 2026-06-16

1. Vantage — 168
2. Ruins: Death Binder — 126
...
```

### #kickstarters — crowdfunding campaigns

List today's `crowdfunding` entries. Include the platform, backer count, funding percentage, and end date if known. Link the campaign name to its URL using Discord markdown `[name](url)`.

```
🎲 Active Crowdfunding — 2026-06-16

1. [SHUG](https://www.kickstarter.com/...) — Kickstarter — 12,253 backers — 10,044% funded — ends Jun 17
2. [Arydia: 2nd Printing](https://gamefound.com/...) — Gamefound — 11,905 backers — 1,028% funded
...
```

Omit the "ends" line if `ends` is null. Format backer counts with commas. Format `pct` as a percentage integer (e.g. `10044` → `10,044%`).
