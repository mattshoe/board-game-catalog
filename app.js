// ── State ──────────────────────────────────────────────
const state = {
  search: "",
  players: 1,
  time: "all",
  crunchMin: 1,
  crunchMax: 10,
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
          ${game.players}
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
    ["section-crunch",   state.crunchMin !== 1 || state.crunchMax !== 9],
    ["section-tag", state.tags.size > 0],
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

// Tag click — activate tag pill if available, else fall back to search
document.getElementById("catalog-grid").addEventListener("click", e => {
  // Expand hidden tags on a card
  const expandBtn = e.target.closest(".tag-card-expand");
  if (expandBtn) {
    e.preventDefault();
    expandBtn.closest(".mechanic-tags").classList.add("tags-expanded");
    return;
  }

  const tag = e.target.closest(".tag");
  if (!tag || tag.classList.contains("tag--more") || tag.classList.contains("tag-card-expand")) return;
  e.preventDefault();
  const value = tag.textContent.trim();
  const pill = document.querySelector(`#tag-filters [data-tag="${value}"]`);
  if (pill) {
    document.querySelectorAll("#tag-filters .filter-pill").forEach(p => p.classList.remove("active"));
    state.tags = new Set([value]);
    pill.classList.add("active");
  } else {
    state.search = value;
    document.getElementById("search-input").value = value;
  }
  render();
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
  state.tags = new Set();
  state.sort = "name-asc";

  document.getElementById("search-input").value = "";
  document.getElementById("sort-select").value = "name-asc";
  crunchMinEl.value = 1;
  crunchMaxEl.value = 10;
  crunchMinLabel.textContent = 1;
  crunchMaxLabel.textContent = 10;

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

// ── Init ───────────────────────────────────────────────
updatePlayersFill();
updateTimeFill();
updateCrunchFill();
render();
