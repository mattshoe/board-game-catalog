// ── State ──────────────────────────────────────────────
const state = {
  search: "",
  players: "all",
  time: "all",
  crunchMin: 1,
  crunchMax: 9,
  coop: "all",
  sort: "name",
};

// ── Helpers ────────────────────────────────────────────
function parsePlayers(str) {
  const parts = str.replace(/\s/g, "").split(/[–-]/);
  if (parts.length === 1) return [parseInt(parts[0]), parseInt(parts[0])];
  return [parseInt(parts[0]), parseInt(parts[1])];
}

function matchesPlayers(game, filter) {
  const [min, max] = parsePlayers(game.players);
  if (filter === "all") return true;
  if (filter === "1") return min === 1;
  if (filter === "2") return min <= 2 && max >= 2;
  if (filter === "3") return max >= 3;
  if (filter === "5") return max >= 5;
  return true;
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
      const inMechanics = g.mechanics.some(m => m.toLowerCase().includes(q));
      if (!inName && !inMechanics) return false;
    }
    if (!matchesPlayers(g, state.players)) return false;
    if (!matchesTime(g, state.time)) return false;
    if (g.crunch < state.crunchMin || g.crunch > state.crunchMax) return false;
    if (state.coop === "yes" && !g.coop) return false;
    if (state.coop === "no" && g.coop) return false;
    return true;
  });
}

function sortGames(games) {
  return [...games].sort((a, b) => {
    switch (state.sort) {
      case "name": return a.name.localeCompare(b.name);
      case "rating": return (b.rating ?? 0) - (a.rating ?? 0);
      case "crunch-asc": return a.crunch - b.crunch;
      case "crunch-desc": return b.crunch - a.crunch;
      case "time-asc": return a.timeMin - b.timeMin;
      default: return 0;
    }
  });
}

// ── Rendering ──────────────────────────────────────────
function crunchPips(n) {
  return Array.from({ length: 9 }, (_, i) =>
    `<span class="pip${i < n ? " pip--filled" : ""}"></span>`
  ).join("");
}

function ratingBadge(r) {
  if (r === null) return `<span class="badge badge--new">New</span>`;
  const cls = r >= 8 ? "badge--gold" : r >= 7 ? "badge--silver" : "badge--bronze";
  return `<span class="badge ${cls}">${r.toFixed(1)}</span>`;
}

function mechanicTags(mechanics) {
  const visible = mechanics.slice(0, 3).map(m =>
    `<span class="tag">${m}</span>`
  ).join("");
  const overflow = mechanics.length > 3
    ? `<span class="tag tag--more">+${mechanics.length - 3}</span>`
    : "";
  return visible + overflow;
}

function coopBadge(isCoop) {
  return isCoop ? `<span class="coop-badge">Co-op</span>` : "";
}

function renderCard(game) {
  return `
    <a class="game-row" href="${game.bgg}" target="_blank" rel="noopener">
      <div class="row-main">
        <div class="row-name-line">
          <h3 class="row-title">${game.name}</h3>
          ${coopBadge(game.coop)}
        </div>
        <div class="mechanic-tags">${mechanicTags(game.mechanics)}</div>
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
          <div class="pips">${crunchPips(game.crunch)}</div>
          <span class="mono crunch-num">${game.crunch}</span>
        </div>
        ${ratingBadge(game.rating)}
      </div>
    </a>
  `;
}

// ── Filter Indicators ──────────────────────────────────
function updateFilterIndicators() {
  const checks = [
    ["section-search",  state.search !== ""],
    ["section-players", state.players !== "all"],
    ["section-time",    state.time !== "all"],
    ["section-crunch",  state.crunchMin !== 1 || state.crunchMax !== 9],
    ["section-coop",    state.coop !== "all"],
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
  const pct = v => (v - 1) / 8 * 100;
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

function wirePillGroup(parentId, stateKey) {
  document.getElementById(parentId).addEventListener("click", e => {
    const pill = e.target.closest(".filter-pill");
    if (!pill) return;
    document.querySelectorAll(`#${parentId} .filter-pill`).forEach(p => p.classList.remove("active"));
    pill.classList.add("active");
    state[stateKey] = pill.dataset[stateKey];
    render();
  });
}

wirePillGroup("player-filters", "players");
wirePillGroup("time-filters", "time");
wirePillGroup("coop-filters", "coop");

// Mechanic tag click — set search to that mechanic; also block BGG nav when clicking any tag
document.getElementById("catalog-grid").addEventListener("click", e => {
  const tag = e.target.closest(".tag");
  if (!tag) return;
  e.preventDefault();
  if (tag.classList.contains("tag--more")) return;
  const mechanic = tag.textContent.trim();
  state.search = mechanic;
  document.getElementById("search-input").value = mechanic;
  render();
});

// Mobile sidebar toggle
document.getElementById("sidebar-toggle")?.addEventListener("click", () => {
  document.querySelector(".sidebar").classList.toggle("open");
});

// Reset
document.getElementById("reset-btn").addEventListener("click", () => {
  state.search = "";
  state.players = "all";
  state.time = "all";
  state.crunchMin = 1;
  state.crunchMax = 9;
  state.coop = "all";
  state.sort = "name";

  document.getElementById("search-input").value = "";
  document.getElementById("sort-select").value = "name";
  crunchMinEl.value = 1;
  crunchMaxEl.value = 9;
  crunchMinLabel.textContent = 1;
  crunchMaxLabel.textContent = 9;

  document.querySelectorAll(".filter-pill").forEach(p => {
    p.classList.toggle("active",
      p.dataset.players === "all" || p.dataset.time === "all" || p.dataset.coop === "all"
    );
  });

  updateCrunchFill();
  render();
});

// ── Init ───────────────────────────────────────────────
updateCrunchFill();
render();
