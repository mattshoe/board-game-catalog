#!/usr/bin/env node
// Run once: node fetch-images.js
// Fetches BGG thumbnail URLs via api.geekdo.com and stores them as game.img in games.js
const https = require('https');
const fs = require('fs');

function bggId(url) {
  const m = url.match(/boardgame(?:expansion)?\/(\d+)/);
  return m ? m[1] : null;
}

function get(url) {
  return new Promise((resolve, reject) => {
    const opts = new URL(url);
    https.get({ hostname: opts.hostname, path: opts.pathname + opts.search,
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', reject);
  });
}

async function fetchThumb(id) {
  const { status, body } = await get(`https://api.geekdo.com/api/geekitems?objectid=${id}&objecttype=thing`);
  if (status !== 200) return null;
  try {
    const data = JSON.parse(body);
    return data?.item?.images?.square200 || data?.item?.images?.square || null;
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
    if (g.img) { console.log(`${label} — skipped`); continue; }
    const id = bggId(g.bgg);
    if (!id) { console.log(`${label} — no BGG ID`); continue; }
    process.stdout.write(`${label}... `);
    try {
      const thumb = await fetchThumb(id);
      if (thumb) { g.img = thumb; changed++; console.log('✓'); }
      else console.log('not found');
    } catch (e) {
      console.log(`error: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 400));
  }

  if (changed > 0) {
    fs.writeFileSync('./games.js', 'const GAMES = ' + JSON.stringify(GAMES, null, 2) + ';\n');
    console.log(`\nDone — updated ${changed} game(s), games.js saved.`);
  } else {
    console.log('\nNo changes — games.js unchanged.');
  }
}

main().catch(e => { console.error(e); process.exit(1); });
