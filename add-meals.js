const fs = require('fs');
const content = fs.readFileSync('games.js', 'utf8');
const match = content.match(/const GAMES = (\[[\s\S]*\]);/);
const GAMES = JSON.parse(match[1]);

// Course classifications:
// Amuse-Bouche — tiny quick bites, ≤20 min, ultralight
// Appetizer    — accessible gateway games, ~20–60 min, light-medium
// Main Course  — centerpiece game of the night, 60–120 min, medium-heavy
// Feast        — epic multi-hour or massive campaign games
// Dessert      — party/social games, end-of-night laughs
const meals = {
  1:   "Appetizer",    // Sky Team
  2:   "Appetizer",    // Final Girl
  3:   "Appetizer",    // Twisted Cryptids
  4:   "Appetizer",    // The Lost Expedition
  5:   "Main Course",  // Arkham Horror: The Card Game
  6:   "Main Course",  // Dune Imperium
  7:   "Appetizer",    // Deep Regrets
  8:   "Feast",        // Dungeon Degenerates: Hand of Doom
  9:   "Appetizer",    // Warp's Edge
  10:  "Appetizer",    // One Deck Dungeon
  11:  "Appetizer",    // One Deck Galaxy
  12:  "Appetizer",    // Pillars of Fate
  13:  "Appetizer",    // Kinfire Delve: Scorn's Stockade
  14:  "Appetizer",    // Kinfire Delve: Callous Lab
  15:  "Appetizer",    // Kinfire Delve: Vainglory's Grotto
  16:  "Appetizer",    // Hercules: 12 Labors
  17:  "Appetizer",    // Resist!
  18:  "Appetizer",    // Forbidden Island
  19:  "Appetizer",    // Codenames
  20:  "Appetizer",    // Codenames Pictures
  21:  "Appetizer",    // Harmonies
  22:  "Appetizer",    // Splendor
  23:  "Appetizer",    // Sagrada
  24:  "Appetizer",    // The Hobbit: There and Back Again
  25:  "Amuse-Bouche", // Tsuro
  26:  "Main Course",  // Everdell: Collector's Edition
  27:  "Main Course",  // Everdell: Newleaf
  28:  "Appetizer",    // Wispwood
  29:  "Main Course",  // Root
  30:  "Appetizer",    // Carcassonne
  31:  "Main Course",  // Dragonbane
  32:  "Main Course",  // Revive
  33:  "Main Course",  // Catan
  34:  "Dessert",      // Camel Up
  35:  "Appetizer",    // 7 Wonders
  36:  "Main Course",  // Scythe
  37:  "Amuse-Bouche", // Love Letter: Arkham Horror
  38:  "Amuse-Bouche", // Love Letter
  39:  "Amuse-Bouche", // Trio
  40:  "Amuse-Bouche", // Booty Dice
  41:  "Appetizer",    // Sea Salt & Paper
  42:  "Amuse-Bouche", // Odin
  43:  "Dessert",      // Flip 7
  44:  "Appetizer",    // Gloomhaven: Buttons & Bugs
  45:  "Amuse-Bouche", // A Gentle Rain
  46:  "Amuse-Bouche", // Onirim
  47:  "Main Course",  // Gloomhaven: Jaws of the Lion
  48:  "Feast",        // Vantage
  49:  "Main Course",  // Lord of the Rings: Fate of the Fellowship
  50:  "Main Course",  // Slay the Spire: The Board Game
  51:  "Feast",        // Earthborne Rangers
  52:  "Appetizer",    // Cascadia
  53:  "Appetizer",    // Cascadia: Landmarks
  54:  "Appetizer",    // Fantastic Factories
  55:  "Appetizer",    // Unmatched: Battle of Legends
  56:  "Appetizer",    // The Lord of the Rings: Duel for Middle-Earth
  57:  "Appetizer",    // Under Falling Skies
  58:  "Appetizer",    // Here to Slay
  59:  "Dessert",      // Unstable Unicorns: Diamond Edition
  60:  "Appetizer",    // A Familiar Find
  61:  "Dessert",      // Happy Little Dinosaurs
  62:  "Appetizer",    // Casting Shadows
  63:  "Appetizer",    // Patchwork
  64:  "Appetizer",    // Take Time
  65:  "Main Course",  // Wyrmspan
  66:  "Main Course",  // This War of Mine: The Board Game
  67:  "Main Course",  // Ticket to Ride
  68:  "Appetizer",    // The Night Cage
  69:  "Main Course",  // Wondrous Creatures
  70:  "Main Course",  // Unstoppable
  71:  "Main Course",  // Pandemic
  72:  "Main Course",  // Kinfire Chronicles: Night's Fall
  73:  "Main Course",  // Horrified
  74:  "Dessert",      // Trivillennial
  75:  "Main Course",  // Lord of the Rings: The Card Game
  76:  "Main Course",  // Plunder: A Pirate's Life
  77:  "Appetizer",    // Dice Throne: Season One
  78:  "Main Course",  // Castles of Mad King Ludwig
  79:  "Feast",        // Mansions of Madness
  80:  "Main Course",  // Spirit Island
  81:  "Main Course",  // Shuffle Dungeons
  82:  "Appetizer",    // Storyfold: Wildwoods
  83:  "Main Course",  // LotR: Return of the King Saga
  84:  "Feast",        // Risk
  85:  "Dessert",      // Secret Hitler
  86:  "Dessert",      // Tiny Laser Heist
  87:  "Main Course",  // Tapestry
  88:  "Appetizer",    // Mistborn: The Deckbuilding Game
  89:  "Main Course",  // LotR: Journeys in Middle-Earth
  90:  "Dessert",      // Heroes of Barcadia
  91:  "Main Course",  // Brass: Birmingham
  92:  "Feast",        // War of the Ring
  93:  "Feast",        // Voidfall
  94:  "Main Course",  // HeroQuest
  95:  "Feast",        // Mage Knight
  96:  "Main Course",  // Lost Ruins of Arnak
  97:  "Appetizer",    // Azul
  98:  "Feast",        // Storm Weavers
  99:  "Appetizer",    // Nidavellir
  100: "Main Course",  // Exit: Adventures on Catan
  101: "Appetizer",    // 7 Wonders Duel
  102: "Appetizer",    // Splendor Duel
  103: "Appetizer",    // Pantheum
  104: "Dessert",      // The Voting Game
  105: "Amuse-Bouche", // One Night Werewolf
  106: "Feast",        // Nemesis: Lockdown
  107: "Feast",        // Gloomhaven
  108: "Feast",        // Tainted Grail: Kings of Ruin
  109: "Main Course",  // Mythwind
  110: "Dessert",      // Taboo
  111: "Dessert",      // Telestrations After Dark
  112: "Dessert",      // Incohearent
  113: "Dessert",      // Trouble
  114: "Amuse-Bouche", // Suspend
  115: "Dessert",      // Trivial Pursuit
  116: "Main Course",  // Horrified: Greek Monsters
  117: "Appetizer",    // Codenames Duet
  118: "Dessert",      // Cards Against Humanity
  119: "Main Course",  // The Red Dragon Inn
  120: "Main Course",  // Sleeping Gods
  121: "Amuse-Bouche", // Coup
  122: "Appetizer",    // Skull King
  123: "Main Course",  // ISS Vanguard
};

GAMES.forEach(g => { g.meal = meals[g.id]; });
fs.writeFileSync('games.js', 'const GAMES = ' + JSON.stringify(GAMES, null, 2) + ';\n');

const counts = {};
GAMES.forEach(g => { counts[g.meal] = (counts[g.meal] || 0) + 1; });
console.log('Done! Meal distribution:', counts);
