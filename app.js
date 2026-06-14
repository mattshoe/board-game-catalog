// ── URL State ──────────────────────────────────────────
let urlReady = false;

function serializeState() {
  const p = new URLSearchParams();
  const tab = document.querySelector(".tab.active")?.dataset.tab || "catalog";
  if (tab !== "catalog") p.set("tab", tab);

  if (state.search) p.set("q", state.search);
  if (state.players !== 1) p.set("players", state.players);
  if (state.time !== "all") p.set("time", state.time);
  if (state.crunchMin !== 1) p.set("cmin", state.crunchMin);
  if (state.crunchMax !== 10) p.set("cmax", state.crunchMax);
  if (state.meals.size > 0) p.set("meals", [...state.meals].join(","));
  if (state.tags.size > 0) p.set("tags", [...state.tags].join(","));
  if (state.sort !== "name-asc") p.set("sort", state.sort);

  const defaultCourses = ["Amuse-Bouche", "Appetizer", "Main Course", "Dessert"];
  const coursesDefault = planner.courses.size === defaultCourses.length &&
    defaultCourses.every(c => planner.courses.has(c));
  if (!coursesDefault) p.set("courses", [...planner.courses].join(","));
  if (planner.players !== 4) p.set("pp", planner.players);
  if (planner.crunchMax !== 10) p.set("pc", planner.crunchMax);
  const PICK_KEYS = {"Amuse-Bouche": "pab", "Appetizer": "pa", "Main Course": "pm", "Feast": "pf", "Dessert": "pd"};
  Object.entries(PICK_KEYS).forEach(([course, key]) => {
    if (planner.picks[course]) p.set(key, planner.picks[course].name);
  });

  if (soloState.search) p.set("sq", soloState.search);
  if (soloState.time !== "all") p.set("stime", soloState.time);
  if (soloState.crunchMin !== 1) p.set("scmin", soloState.crunchMin);
  if (soloState.crunchMax !== 10) p.set("scmax", soloState.crunchMax);
  if (soloState.tags.size > 0) p.set("stags", [...soloState.tags].join(","));
  if (soloState.sort !== "name-asc") p.set("ssort", soloState.sort);

  return p.toString();
}

function updateURL() {
  const s = serializeState();
  history.replaceState(null, "", s ? "#" + s : location.pathname + location.search);
}

function loadFromURL() {
  const hash = location.hash.slice(1);
  if (!hash) return;
  const p = new URLSearchParams(hash);

  // Catalog state
  if (p.has("q")) { state.search = p.get("q"); document.getElementById("search-input").value = state.search; }
  if (p.has("players")) { state.players = parseInt(p.get("players")); playersSlider.value = state.players; updatePlayersFill(); }
  if (p.has("time")) { const t = p.get("time"); if (TIME_VALUES.includes(t)) { state.time = t; timeSlider.value = TIME_VALUES.indexOf(t); updateTimeFill(); } }
  if (p.has("cmin")) { state.crunchMin = parseInt(p.get("cmin")); crunchMinEl.value = state.crunchMin; crunchMinLabel.textContent = state.crunchMin; }
  if (p.has("cmax")) { state.crunchMax = parseInt(p.get("cmax")); crunchMaxEl.value = state.crunchMax; crunchMaxLabel.textContent = state.crunchMax; }
  if (p.has("cmin") || p.has("cmax")) updateCrunchFill();
  if (p.has("meals")) p.get("meals").split(",").forEach(m => {
    if (!m) return;
    state.meals.add(m);
    document.querySelector(`[data-meal="${m}"]`)?.classList.add("active");
  });
  if (p.has("tags")) p.get("tags").split(",").forEach(t => {
    if (!t) return;
    state.tags.add(t);
    document.querySelector(`#tag-filters [data-tag="${t}"]`)?.classList.add("active");
  });
  if (p.has("sort")) { state.sort = p.get("sort"); document.getElementById("sort-select").value = state.sort; }

  // Planner state — must be set before switchTab so planBuild() uses the right values
  if (p.has("pp")) planner.players = parseInt(p.get("pp"));
  if (p.has("pc")) planner.crunchMax = parseInt(p.get("pc"));
  if (p.has("courses")) planner.courses = new Set(p.get("courses").split(",").filter(Boolean));

  // Solo state
  if (p.has("sq")) { soloState.search = p.get("sq"); document.getElementById("solo-search-input").value = soloState.search; }
  if (p.has("stime")) { const t = p.get("stime"); if (TIME_VALUES.includes(t)) { soloState.time = t; soloTimeSlider.value = TIME_VALUES.indexOf(t); updateSoloTimeFill(); } }
  if (p.has("scmin")) { soloState.crunchMin = parseInt(p.get("scmin")); soloCrunchMinEl.value = soloState.crunchMin; soloCrunchMinLabel.textContent = soloState.crunchMin; }
  if (p.has("scmax")) { soloState.crunchMax = parseInt(p.get("scmax")); soloCrunchMaxEl.value = soloState.crunchMax; soloCrunchMaxLabel.textContent = soloState.crunchMax; }
  if (p.has("scmin") || p.has("scmax")) updateSoloCrunchFill();
  if (p.has("stags")) p.get("stags").split(",").forEach(t => {
    if (!t) return;
    soloState.tags.add(t);
    document.querySelector(`#solo-tag-filters [data-tag="${t}"]`)?.classList.add("active");
  });
  if (p.has("ssort")) { soloState.sort = p.get("ssort"); document.getElementById("solo-sort-select").value = soloState.sort; }

  // Switch tab last so planner/solo state is already applied when their init runs
  const tab = p.get("tab");
  if (tab && ["catalog", "planner", "solo"].includes(tab)) switchTab(tab);

  // Override planner picks from URL (switchTab/planBuild already ran with random picks above)
  const PICK_KEYS = {"Amuse-Bouche": "pab", "Appetizer": "pa", "Main Course": "pm", "Feast": "pf", "Dessert": "pd"};
  let picksFromURL = false;
  Object.entries(PICK_KEYS).forEach(([course, key]) => {
    if (p.has(key)) {
      const game = GAMES.find(g => g.name === p.get(key));
      if (game) { planner.picks[course] = game; picksFromURL = true; }
    }
  });
  if (picksFromURL) planRender();
}

// ── State ──────────────────────────────────────────────
const state = {
  search: "",
  players: 1,
  time: "all",
  crunchMin: 1,
  crunchMax: 10,
  meals: new Set(),
  tags: new Set(),
  sort: "name-asc",
};

// Strip parenthetical text from all tags at startup
GAMES.forEach(g => {
  g.tags = [...new Set(
    g.tags.map(t => t.replace(/\s*\([^)]*\)/g, '').trim()).filter(Boolean)
  )].sort((a, b) => a.localeCompare(b));
});

// ── Helpers ────────────────────────────────────────────
function parsePlayers(str) {
  const parts = str.replace(/\s/g, "").split(/[–-]/);
  if (parts.length === 1) return [parseInt(parts[0]), parseInt(parts[0])];
  return [parseInt(parts[0]), parseInt(parts[1])];
}

function matchesPlayers(game, filter) {
  if (filter === 1) return true;
  const [min, max] = parsePlayers(game.players);
  if (filter === 12) return max >= 12;
  return min <= filter && max >= filter;
}

function matchesTime(game, filter) {
  if (filter === "all") return true;
  if (filter === "quick") return game.timeMin < 30;
  if (filter === "medium") return game.timeMin <= 60 && game.timeMax >= 30;
  if (filter === "long") return game.timeMin <= 120 && game.timeMax >= 60;
  if (filter === "epic") return game.timeMax >= 120;
  return true;
}

function filterGames() {
  return GAMES.filter(g => {
    if (state.search) {
      const q = state.search.toLowerCase();
      const inName = g.name.toLowerCase().includes(q);
      const inMechanics = g.tags.some(m => m.toLowerCase().includes(q));
      if (!inName && !inMechanics) return false;
    }
    if (!matchesPlayers(g, state.players)) return false;
    if (!matchesTime(g, state.time)) return false;
    if (g.crunch < state.crunchMin || g.crunch > state.crunchMax) return false;
    if (state.meals.size > 0 && !state.meals.has(g.meal)) return false;
    if (state.tags.size > 0 && ![...state.tags].every(t => g.tags.includes(t))) return false;
    return true;
  });
}

function sortGames(games) {
  return [...games].sort((a, b) => {
    switch (state.sort) {
      case "name-asc":  return a.name.localeCompare(b.name);
      case "name-desc": return b.name.localeCompare(a.name);
      case "players-asc":  return parsePlayers(a.players)[0] - parsePlayers(b.players)[0];
      case "players-desc": return parsePlayers(b.players)[0] - parsePlayers(a.players)[0];
      case "time-asc":  return a.timeMin - b.timeMin;
      case "time-desc": return b.timeMin - a.timeMin;
      case "crunch-asc":  return a.crunch - b.crunch;
      case "crunch-desc": return b.crunch - a.crunch;
      case "rating-desc": return (b.rating ?? -1) - (a.rating ?? -1);
      case "rating-asc":  return (a.rating ?? 11) - (b.rating ?? 11);
      default: return 0;
    }
  });
}

// ── Rendering ──────────────────────────────────────────
function crunchPips(n) {
  return Array.from({ length: 10 }, (_, i) =>
    `<span class="pip${i < n ? " pip--filled" : ""}"></span>`
  ).join("");
}

function ratingBadge(r) {
  if (r === null) return `<span class="badge badge--new">New</span>`;
  const cls = r >= 8 ? "badge--gold" : r >= 7 ? "badge--silver" : "badge--bronze";
  return `<span class="badge ${cls}">${r.toFixed(1)}</span>`;
}

const TAG_CARD_VISIBLE = 10;

function mechanicTags(tags) {
  const visible = tags.slice(0, TAG_CARD_VISIBLE);
  const extra   = tags.slice(TAG_CARD_VISIBLE);
  return visible.map(t => `<span class="tag">${t}</span>`).join("") +
    extra.map(t => `<span class="tag tag-card-extra">${t}</span>`).join("") +
    (extra.length ? `<button class="tag tag-card-expand">+${extra.length} more</button>` : "");
}

function coopBadge(isCoop) {
  return isCoop ? `<span class="coop-badge">Co-op</span>` : "";
}

function renderCard(game) {
  return `
    <a class="game-row" href="${game.bgg}" target="_blank" rel="noopener">
      <div class="row-top">
        <div class="row-thumb">${game.img ? `<img class="game-thumb" src="${game.img}" loading="lazy" alt="" />` : ''}</div>
        <div class="row-main">
          <div class="row-name-line">
            <h3 class="row-title">${game.name}</h3>
            ${coopBadge(game.coop)}
          </div>
          ${game.description ? `<p class="row-desc">${game.description}</p>` : ''}
        </div>
      </div>
      <div class="row-stats">
        <span class="row-stat">
          <svg viewBox="0 0 16 16" width="11" height="11"><circle cx="8" cy="6" r="3" fill="currentColor"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
          ${game.players} <span class="mobile-only">Players</span>
        </span>
        <span class="row-stat">
          <svg viewBox="0 0 16 16" width="11" height="11"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M8 5v3l2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>
          ${game.playTime}
        </span>
        <div class="row-crunch">
          <span class="stat-label">Crunch</span>
          <div class="crunch-bar">
            <div class="pips">${crunchPips(game.crunch)}</div>
            <span class="mono crunch-num">${game.crunch}</span>
          </div>
        </div>
        <div class="row-rating">
          <span class="stat-label">BGG</span>
          ${ratingBadge(game.rating)}
        </div>
      </div>
      <div class="mechanic-tags">${mechanicTags(game.tags)}</div>
    </a>
  `;
}

// ── Filter Indicators ──────────────────────────────────
function updateFilterIndicators() {
  const checks = [
    ["section-players",  state.players !== 1],
    ["section-time",     state.time !== "all"],
    ["section-crunch",   state.crunchMin !== 1 || state.crunchMax !== 10],
    ["section-meal",     state.meals.size > 0],
    ["section-tag",      state.tags.size > 0],
  ];
  let activeCount = 0;
  checks.forEach(([id, active]) => {
    document.getElementById(id)?.classList.toggle("is-filtered", active);
    if (active) activeCount++;
  });
  const toggleCount = document.getElementById("toggle-count");
  if (toggleCount) toggleCount.textContent = activeCount > 0 ? `(${activeCount})` : "";
}

// ── Render ─────────────────────────────────────────────
function render() {
  const filtered = filterGames();
  const sorted = sortGames(filtered);
  const grid = document.getElementById("catalog-grid");
  const empty = document.getElementById("empty-state");

  document.getElementById("visible-count").textContent = filtered.length;
  const total = document.getElementById("count-total");
  total.textContent = filtered.length < GAMES.length ? `/ ${GAMES.length}` : "";

  if (sorted.length === 0) {
    grid.innerHTML = "";
    empty.style.display = "flex";
  } else {
    empty.style.display = "none";
    grid.innerHTML = sorted.map(renderCard).join("");
  }

  updateFilterIndicators();
  if (urlReady) updateURL();
}

// ── Crunch Slider Fill ─────────────────────────────────
const crunchMinEl = document.getElementById("crunch-min");
const crunchMaxEl = document.getElementById("crunch-max");
const crunchMinLabel = document.getElementById("crunch-min-label");
const crunchMaxLabel = document.getElementById("crunch-max-label");

function updateCrunchFill() {
  const fill = document.getElementById("crunch-fill");
  if (!fill) return;
  const lo = Math.min(parseInt(crunchMinEl.value), parseInt(crunchMaxEl.value));
  const hi = Math.max(parseInt(crunchMinEl.value), parseInt(crunchMaxEl.value));
  const pct = v => (v - 1) / 9 * 100;
  fill.style.left = pct(lo) + "%";
  fill.style.right = (100 - pct(hi)) + "%";
  // When thumbs collide, bring min to front so user can drag it back left
  crunchMinEl.style.zIndex = parseInt(crunchMinEl.value) >= parseInt(crunchMaxEl.value) ? 3 : 2;
}

function updateCrunchSliders() {
  state.crunchMin = parseInt(crunchMinEl.value);
  state.crunchMax = parseInt(crunchMaxEl.value);
  crunchMinLabel.textContent = state.crunchMin;
  crunchMaxLabel.textContent = state.crunchMax;
  updateCrunchFill();
  render();
}

crunchMinEl.addEventListener("input", () => {
  if (parseInt(crunchMinEl.value) > parseInt(crunchMaxEl.value)) {
    crunchMinEl.value = crunchMaxEl.value;
  }
  updateCrunchSliders();
});

crunchMaxEl.addEventListener("input", () => {
  if (parseInt(crunchMaxEl.value) < parseInt(crunchMinEl.value)) {
    crunchMaxEl.value = crunchMinEl.value;
  }
  updateCrunchSliders();
});

// ── Event Wiring ───────────────────────────────────────
document.getElementById("search-input").addEventListener("input", e => {
  state.search = e.target.value;
  render();
});

document.getElementById("sort-select").addEventListener("change", e => {
  state.sort = e.target.value;
  render();
});

// Players slider
const playersSlider = document.getElementById("players-slider");
const playersLabel  = document.getElementById("players-label");

function updatePlayersFill() {
  const fill = document.getElementById("players-fill");
  if (!fill) return;
  const val = parseInt(playersSlider.value);
  const pct = (val - 1) / 11 * 100;
  fill.style.left = "0%";
  fill.style.right = (100 - pct) + "%";
  fill.style.opacity = val === 1 ? "0" : "1";
  playersLabel.textContent = val === 1 ? "Any" : val === 12 ? "12+" : String(val);
}

playersSlider.addEventListener("input", () => {
  state.players = parseInt(playersSlider.value);
  updatePlayersFill();
  render();
});

// Time slider
const timeSlider = document.getElementById("time-slider");
const timeLabel  = document.getElementById("time-label");
const TIME_VALUES = ["all", "quick", "medium", "long", "epic"];
const TIME_LABELS = ["Any", "<30m", "30–60m", "1–2h", "2h+"];

function updateTimeFill() {
  const fill = document.getElementById("time-fill");
  if (!fill) return;
  const val = parseInt(timeSlider.value);
  const pct = val / 4 * 100;
  fill.style.left = "0%";
  fill.style.right = (100 - pct) + "%";
  fill.style.opacity = val === 0 ? "0" : "1";
  timeLabel.textContent = TIME_LABELS[val];
}

timeSlider.addEventListener("input", () => {
  state.time = TIME_VALUES[parseInt(timeSlider.value)];
  updateTimeFill();
  render();
});

const TAG_VISIBLE = 12;

function initTagPills() {
  const counts = {};
  GAMES.forEach(g => g.tags.forEach(t => { counts[t] = (counts[t] || 0) + 1; }));
  const all = Object.entries(counts)
    .map(([t]) => t)
    .sort((a, b) => a.localeCompare(b));
  const hidden = all.length - TAG_VISIBLE;
  document.getElementById("tag-filters").innerHTML =
    all.map((t, i) =>
      `<button class="filter-pill${i >= TAG_VISIBLE ? " tag-extra" : ""}" data-tag="${t}">${t}</button>`
    ).join("") +
    `<button class="tag-more-btn" id="tag-more-btn">More (${hidden})</button>`;

  document.getElementById("tag-more-btn").addEventListener("click", () => {
    const container = document.getElementById("tag-filters");
    const expanded = container.classList.toggle("tags-expanded");
    const btn = document.getElementById("tag-more-btn");
    btn.textContent = expanded ? "Less" : `More (${hidden})`;
  });
}

initTagPills();

document.getElementById("meal-filters").addEventListener("click", e => {
  const pill = e.target.closest(".filter-pill");
  if (!pill) return;
  const value = pill.dataset.meal;
  if (state.meals.has(value)) { state.meals.delete(value); pill.classList.remove("active"); }
  else { state.meals.add(value); pill.classList.add("active"); }
  render();
});

document.getElementById("tag-filters").addEventListener("click", e => {
  const pill = e.target.closest(".filter-pill");
  if (!pill) return;
  const value = pill.dataset.tag;
  if (state.tags.has(value)) {
    state.tags.delete(value);
    pill.classList.remove("active");
  } else {
    state.tags.add(value);
    pill.classList.add("active");
  }
  render();
});

document.getElementById("catalog-grid").addEventListener("click", e => {
  const expandBtn = e.target.closest(".tag-card-expand");
  if (expandBtn) {
    e.preventDefault();
    expandBtn.closest(".mechanic-tags").classList.add("tags-expanded");
  }
});

// Course info tooltip
document.getElementById("course-info-btn").addEventListener("click", e => {
  e.stopPropagation();
  document.getElementById("course-info-tip").classList.toggle("visible");
});
document.addEventListener("click", () => {
  document.getElementById("course-info-tip").classList.remove("visible");
});

// Mobile sidebar toggle
document.getElementById("sidebar-toggle")?.addEventListener("click", () => {
  document.querySelector(".sidebar").classList.toggle("open");
});

// Reset
document.getElementById("reset-btn").addEventListener("click", () => {
  state.search = "";
  state.players = 1;
  state.time = "all";
  state.crunchMin = 1;
  state.crunchMax = 10;
  state.meals = new Set();
  state.tags = new Set();
  state.sort = "name-asc";

  document.getElementById("search-input").value = "";
  document.getElementById("sort-select").value = "name-asc";
  crunchMinEl.value = 1;
  crunchMaxEl.value = 10;
  crunchMinLabel.textContent = 1;
  crunchMaxLabel.textContent = 10;

  document.querySelectorAll("#meal-filters .filter-pill").forEach(p => p.classList.remove("active"));
  document.querySelectorAll("#tag-filters .filter-pill").forEach(p => p.classList.remove("active"));
  const tagContainer = document.getElementById("tag-filters");
  tagContainer.classList.remove("tags-expanded");
  const moreBtn = document.getElementById("tag-more-btn");
  if (moreBtn) { const h = tagContainer.querySelectorAll(".tag-extra").length; moreBtn.textContent = `More (${h})`; }

  playersSlider.value = 1;
  timeSlider.value = 0;
  updatePlayersFill();
  updateTimeFill();
  updateCrunchFill();
  render();
});

// ── Game Night Planner ─────────────────────────────────
const COURSE_ORDER = ["Amuse-Bouche", "Appetizer", "Main Course", "Feast", "Dessert"];

const planner = {
  courses: new Set(["Amuse-Bouche", "Appetizer", "Main Course", "Dessert"]),
  picks: {},
  locked: new Set(),
  players: 4,
  crunchMax: 10,
};

function planPick(course) {
  const pool = GAMES.filter(g =>
    g.meal === course &&
    matchesPlayers(g, planner.players) &&
    g.crunch <= planner.crunchMax
  );
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
}

function planBuild() {
  COURSE_ORDER.forEach(c => {
    if (planner.courses.has(c) && !planner.locked.has(c)) planner.picks[c] = planPick(c);
    if (!planner.courses.has(c)) delete planner.picks[c];
  });
  planRender();
}

function planTimeText() {
  const games = COURSE_ORDER.filter(c => planner.courses.has(c)).map(c => planner.picks[c]).filter(Boolean);
  if (!games.length) return "";
  const minT = games.reduce((s, g) => s + g.timeMin, 0);
  const maxT = games.reduce((s, g) => s + g.timeMax, 0);
  const fmt = m => m < 60 ? `${m}m` : `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ""}`;
  return `Estimated: ${minT === maxT ? fmt(minT) : `${fmt(minT)}–${fmt(maxT)}`}`;
}

function planRender() {
  document.getElementById("planner-players-val").textContent = planner.players;
  document.getElementById("planner-crunch-val").textContent = planner.crunchMax;
  document.querySelectorAll("#planner-pills .planner-pill").forEach(pill => {
    pill.classList.toggle("active", planner.courses.has(pill.dataset.course));
  });

  const active = COURSE_ORDER.filter(c => planner.courses.has(c));
  const lineup = document.getElementById("planner-lineup");

  if (!active.length) {
    lineup.innerHTML = `<p class="planner-empty">Select at least one course above.</p>`;
    document.getElementById("planner-time").textContent = "";
    return;
  }

  lineup.innerHTML = active.map(course => {
    const game = planner.picks[course];
    const locked = planner.locked.has(course);
    return `
      <div class="planner-slot">
        <div class="planner-slot-head">
          <span class="planner-course-name">${course}</span>
          <div class="planner-slot-btns">
            <button class="planner-lock${locked ? " is-locked" : ""}" data-course="${course}">${locked ? "Locked" : "Lock"}</button>
            <button class="planner-reroll" data-course="${course}"${locked ? " disabled" : ""}>↺ Re-roll</button>
          </div>
        </div>
        ${game ? `
        <a class="planner-card" href="${game.bgg}" target="_blank" rel="noopener">
          ${game.img ? `<img class="planner-thumb" src="${game.img}" loading="lazy" alt="" />` : `<div class="planner-thumb planner-thumb--empty"></div>`}
          <div class="planner-info">
            <div class="planner-name">${game.name}${game.coop ? ` <span class="coop-badge">Co-op</span>` : ""}</div>
            <div class="planner-meta">${game.players} · ${game.playTime} · Crunch ${game.crunch}</div>
          </div>
        </a>` : `<p class="planner-no-game">No games in this course.</p>`}
      </div>`;
  }).join("");

  document.getElementById("planner-time").textContent = planTimeText();
  if (urlReady) updateURL();
}

let plannerInited = false;

// ── Tab Switching ──────────────────────────────────────
function switchTab(name) {
  document.querySelectorAll(".tab").forEach(t =>
    t.classList.toggle("active", t.dataset.tab === name)
  );
  document.getElementById("tab-catalog").hidden = name !== "catalog";
  document.getElementById("tab-planner").hidden = name !== "planner";
  document.getElementById("tab-solo").hidden = name !== "solo";

  if (name === "planner" && !plannerInited) {
    planBuild();
    plannerInited = true;
  } else if (name === "planner") {
    planRender();
  }
  if (urlReady) updateURL();
}

document.getElementById("tab-bar").addEventListener("click", e => {
  const tab = e.target.closest(".tab");
  if (tab) switchTab(tab.dataset.tab);
});

document.getElementById("planner-players-dec").addEventListener("click", () => {
  if (planner.players > 1) { planner.players--; planBuild(); }
});
document.getElementById("planner-players-inc").addEventListener("click", () => {
  if (planner.players < 12) { planner.players++; planBuild(); }
});
document.getElementById("planner-crunch-dec").addEventListener("click", () => {
  if (planner.crunchMax > 1) { planner.crunchMax--; planBuild(); }
});
document.getElementById("planner-crunch-inc").addEventListener("click", () => {
  if (planner.crunchMax < 10) { planner.crunchMax++; planBuild(); }
});

document.getElementById("planner-pills").addEventListener("click", e => {
  const pill = e.target.closest(".planner-pill");
  if (!pill) return;
  const c = pill.dataset.course;
  if (planner.courses.has(c)) {
    planner.courses.delete(c);
    planner.locked.delete(c);
    delete planner.picks[c];
  } else {
    planner.courses.add(c);
    planner.picks[c] = planPick(c);
  }
  planRender();
});

document.getElementById("planner-lineup").addEventListener("click", e => {
  const lockBtn = e.target.closest(".planner-lock");
  if (lockBtn) {
    const c = lockBtn.dataset.course;
    if (planner.locked.has(c)) planner.locked.delete(c);
    else planner.locked.add(c);
    planRender();
    return;
  }
  const rerollBtn = e.target.closest(".planner-reroll:not([disabled])");
  if (rerollBtn) {
    planner.picks[rerollBtn.dataset.course] = planPick(rerollBtn.dataset.course);
    planRender();
  }
});

document.getElementById("planner-reroll-all").addEventListener("click", planBuild);

// ── Solo ───────────────────────────────────────────────
const soloState = {
  search: "",
  time: "all",
  crunchMin: 1,
  crunchMax: 10,
  tags: new Set(),
  sort: "name-asc",
};

function filterSoloGames() {
  return GAMES.filter(g => {
    if (parsePlayers(g.players)[0] > 1) return false;
    if (soloState.search) {
      const q = soloState.search.toLowerCase();
      if (!g.name.toLowerCase().includes(q) && !g.tags.some(t => t.toLowerCase().includes(q))) return false;
    }
    if (!matchesTime(g, soloState.time)) return false;
    if (g.crunch < soloState.crunchMin || g.crunch > soloState.crunchMax) return false;
    if (soloState.tags.size > 0 && ![...soloState.tags].every(t => g.tags.includes(t))) return false;
    return true;
  });
}

function sortSoloGames(games) {
  return [...games].sort((a, b) => {
    switch (soloState.sort) {
      case "name-asc":    return a.name.localeCompare(b.name);
      case "name-desc":   return b.name.localeCompare(a.name);
      case "time-asc":    return a.timeMin - b.timeMin;
      case "time-desc":   return b.timeMin - a.timeMin;
      case "crunch-asc":  return a.crunch - b.crunch;
      case "crunch-desc": return b.crunch - a.crunch;
      case "rating-desc": return (b.rating ?? -1) - (a.rating ?? -1);
      case "rating-asc":  return (a.rating ?? 11) - (b.rating ?? 11);
      default: return 0;
    }
  });
}

function updateSoloFilterIndicators() {
  const checks = [
    ["solo-section-time",  soloState.time !== "all"],
    ["solo-section-crunch", soloState.crunchMin !== 1 || soloState.crunchMax !== 10],
    ["solo-section-tag",   soloState.tags.size > 0],
  ];
  let count = 0;
  checks.forEach(([id, active]) => {
    document.getElementById(id)?.classList.toggle("is-filtered", active);
    if (active) count++;
  });
  const el = document.getElementById("solo-toggle-count");
  if (el) el.textContent = count > 0 ? `(${count})` : "";
}

function renderSolo() {
  const filtered = filterSoloGames();
  const sorted = sortSoloGames(filtered);
  const grid = document.getElementById("solo-grid");
  const empty = document.getElementById("solo-empty");
  grid.innerHTML = sorted.length ? sorted.map(renderCard).join("") : "";
  empty.style.display = sorted.length ? "none" : "flex";
  updateSoloFilterIndicators();
  if (urlReady) updateURL();
}

function soloPickRandom() {
  const games = filterSoloGames();
  if (!games.length) return;
  const game = games[Math.floor(Math.random() * games.length)];
  const slot = document.getElementById("solo-pick-slot");
  slot.hidden = false;
  slot.innerHTML = `
    <div class="solo-pick-head">
      <span class="planner-course-name">Random Pick</span>
      <button class="planner-reroll" id="solo-reroll-btn">↺ Re-roll</button>
    </div>
    <a class="planner-card" href="${game.bgg}" target="_blank" rel="noopener">
      ${game.img ? `<img class="planner-thumb" src="${game.img}" loading="lazy" alt="" />` : `<div class="planner-thumb planner-thumb--empty"></div>`}
      <div class="planner-info">
        <div class="planner-name">${game.name}${game.coop ? ` <span class="coop-badge">Co-op</span>` : ""}</div>
        <div class="planner-meta">${game.players} · ${game.playTime} · Crunch ${game.crunch}</div>
      </div>
    </a>
  `;
  document.getElementById("solo-reroll-btn").addEventListener("click", e => {
    e.preventDefault();
    soloPickRandom();
  });
}

function initSoloTagPills() {
  const soloGames = GAMES.filter(g => parsePlayers(g.players)[0] === 1);
  const counts = {};
  soloGames.forEach(g => g.tags.forEach(t => { counts[t] = (counts[t] || 0) + 1; }));
  const all = Object.keys(counts).sort((a, b) => a.localeCompare(b));
  const TAG_VISIBLE = 12;
  const hidden = all.length - TAG_VISIBLE;
  document.getElementById("solo-tag-filters").innerHTML =
    all.map((t, i) =>
      `<button class="filter-pill${i >= TAG_VISIBLE ? " tag-extra" : ""}" data-tag="${t}">${t}</button>`
    ).join("") +
    (hidden > 0 ? `<button class="tag-more-btn" id="solo-tag-more-btn">More (${hidden})</button>` : "");
  const moreBtn = document.getElementById("solo-tag-more-btn");
  if (moreBtn) moreBtn.addEventListener("click", () => {
    const c = document.getElementById("solo-tag-filters");
    const expanded = c.classList.toggle("tags-expanded");
    moreBtn.textContent = expanded ? "Less" : `More (${hidden})`;
  });
}

// Solo time slider
const soloTimeSlider = document.getElementById("solo-time-slider");
const soloTimeLabel  = document.getElementById("solo-time-label");

function updateSoloTimeFill() {
  const fill = document.getElementById("solo-time-fill");
  if (!fill) return;
  const val = parseInt(soloTimeSlider.value);
  const pct = val / 4 * 100;
  fill.style.left = "0%";
  fill.style.right = (100 - pct) + "%";
  fill.style.opacity = val === 0 ? "0" : "1";
  soloTimeLabel.textContent = TIME_LABELS[val];
}

soloTimeSlider.addEventListener("input", () => {
  soloState.time = TIME_VALUES[parseInt(soloTimeSlider.value)];
  updateSoloTimeFill();
  renderSolo();
});

// Solo crunch sliders
const soloCrunchMinEl    = document.getElementById("solo-crunch-min");
const soloCrunchMaxEl    = document.getElementById("solo-crunch-max");
const soloCrunchMinLabel = document.getElementById("solo-crunch-min-label");
const soloCrunchMaxLabel = document.getElementById("solo-crunch-max-label");

function updateSoloCrunchFill() {
  const fill = document.getElementById("solo-crunch-fill");
  if (!fill) return;
  const lo = Math.min(parseInt(soloCrunchMinEl.value), parseInt(soloCrunchMaxEl.value));
  const hi = Math.max(parseInt(soloCrunchMinEl.value), parseInt(soloCrunchMaxEl.value));
  const pct = v => (v - 1) / 9 * 100;
  fill.style.left = pct(lo) + "%";
  fill.style.right = (100 - pct(hi)) + "%";
  soloCrunchMinEl.style.zIndex = parseInt(soloCrunchMinEl.value) >= parseInt(soloCrunchMaxEl.value) ? 3 : 2;
}

function updateSoloCrunchSliders() {
  soloState.crunchMin = parseInt(soloCrunchMinEl.value);
  soloState.crunchMax = parseInt(soloCrunchMaxEl.value);
  soloCrunchMinLabel.textContent = soloState.crunchMin;
  soloCrunchMaxLabel.textContent = soloState.crunchMax;
  updateSoloCrunchFill();
  renderSolo();
}

soloCrunchMinEl.addEventListener("input", () => {
  if (parseInt(soloCrunchMinEl.value) > parseInt(soloCrunchMaxEl.value)) soloCrunchMinEl.value = soloCrunchMaxEl.value;
  updateSoloCrunchSliders();
});
soloCrunchMaxEl.addEventListener("input", () => {
  if (parseInt(soloCrunchMaxEl.value) < parseInt(soloCrunchMinEl.value)) soloCrunchMaxEl.value = soloCrunchMinEl.value;
  updateSoloCrunchSliders();
});

document.getElementById("solo-search-input").addEventListener("input", e => {
  soloState.search = e.target.value;
  renderSolo();
});

document.getElementById("solo-tag-filters").addEventListener("click", e => {
  const pill = e.target.closest(".filter-pill");
  if (!pill) return;
  const val = pill.dataset.tag;
  if (soloState.tags.has(val)) { soloState.tags.delete(val); pill.classList.remove("active"); }
  else { soloState.tags.add(val); pill.classList.add("active"); }
  renderSolo();
});

document.getElementById("solo-sort-select").addEventListener("change", e => {
  soloState.sort = e.target.value;
  renderSolo();
});

document.getElementById("solo-random-btn").addEventListener("click", soloPickRandom);

document.getElementById("solo-reset-btn").addEventListener("click", () => {
  soloState.search = ""; soloState.time = "all";
  soloState.crunchMin = 1; soloState.crunchMax = 10;
  soloState.tags = new Set(); soloState.sort = "name-asc";
  document.getElementById("solo-search-input").value = "";
  document.getElementById("solo-sort-select").value = "name-asc";
  soloCrunchMinEl.value = 1; soloCrunchMaxEl.value = 10;
  soloCrunchMinLabel.textContent = 1; soloCrunchMaxLabel.textContent = 10;
  document.querySelectorAll("#solo-tag-filters .filter-pill").forEach(p => p.classList.remove("active"));
  const c = document.getElementById("solo-tag-filters");
  c.classList.remove("tags-expanded");
  const mb = document.getElementById("solo-tag-more-btn");
  if (mb) { mb.textContent = `More (${c.querySelectorAll(".tag-extra").length})`; }
  soloTimeSlider.value = 0;
  updateSoloTimeFill();
  updateSoloCrunchFill();
  renderSolo();
});

document.getElementById("solo-sidebar-toggle")?.addEventListener("click", () => {
  document.getElementById("solo-sidebar").classList.toggle("open");
});

// ── Init ───────────────────────────────────────────────
updatePlayersFill();
updateTimeFill();
updateCrunchFill();
initSoloTagPills();
updateSoloTimeFill();
updateSoloCrunchFill();
loadFromURL();
urlReady = true;
render();
renderSolo();
