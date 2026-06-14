#!/usr/bin/env node
// Run once: node fetch-tags.js
// Fetches BGG mechanisms + categories + subdomain types and stores as game.tags in games.js
const https = require('https');
const fs = require('fs');

function bggInfo(url) {
  const thing = url.match(/boardgame(?:expansion)?\/(\d+)/);
  if (thing) return { id: thing[1], type: 'thing' };
  const rpg = url.match(/rpgitem\/(\d+)/);
  if (rpg) return { id: rpg[1], type: 'rpgitem' };
  return null;
}

function get(path) {
  return new Promise((resolve, reject) => {
    https.get({
      hostname: 'api.geekdo.com',
      path,
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', reject);
  });
}

async function fetchTags(id, objecttype) {
  const { status, body } = await get(`/api/geekitems?objectid=${id}&objecttype=${objecttype}`);
  if (status !== 200) return null;
  try {
    const links = JSON.parse(body)?.item?.links ?? {};
    const tags = [
      ...(links.boardgamemechanic  ?? []).map(x => x.name),
      ...(links.boardgamecategory  ?? []).map(x => x.name),
      ...(links.boardgamesubdomain ?? []).map(x => x.name),
      // RPG equivalents
      ...(links.rpgcategory        ?? []).map(x => x.name),
      ...(links.rpgmechanic        ?? []).map(x => x.name),
    ];
    // Deduplicate and sort
    return [...new Set(tags)].sort((a, b) => a.localeCompare(b));
  } catch { return null; }
}

async function main() {
  const src = fs.readFileSync('./games.js', 'utf8');
  let GAMES;
  eval(src.replace(/^const\s+GAMES\s*=/, 'GAMES ='));

  let changed = 0;
  for (let i = 0; i < GAMES.length; i++) {
    const g = GAMES[i];
    const label = `[${String(i + 1).padStart(3)}/${GAMES.length}] ${g.name}`;
    const info = bggInfo(g.bgg);
    if (!info) { console.log(`${label} — no BGG ID, skipping`); continue; }

    process.stdout.write(`${label}... `);
    try {
      const tags = await fetchTags(info.id, info.type);
      if (tags && tags.length > 0) {
        g.tags = tags;
        delete g.mechanics;
        changed++;
        console.log(`${tags.length} tags`);
      } else {
        console.log('no tags found');
      }
    } catch (e) {
      console.log(`error: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 400));
  }

  if (changed > 0) {
    fs.writeFileSync('./games.js', 'const GAMES = ' + JSON.stringify(GAMES, null, 2) + ';\n');
    console.log(`\nDone — updated ${changed} game(s), games.js saved.`);
  } else {
    console.log('\nNo changes.');
  }
}

main().catch(e => { console.error(e); process.exit(1); });
