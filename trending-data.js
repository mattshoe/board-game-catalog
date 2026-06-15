// Trending data — updated daily by /update-trending skill
// History keeps the last 30 daily snapshots.
// Game fields: { name, score, mentions, sources, change, bgg, img }
//   bgg  — full BGG URL (null if unknown)
//   img  — square thumbnail URL (null if unknown; skill populates these)
//   change — rank delta vs prior snapshot (+up, -down, 0 same, null new)

const TRENDING_DATA = {
  meta: {
    subreddits: ["r/boardgames", "r/soloboardgaming", "r/boardgamescirclejerk"],
  },
  history: [
    {
      date: "2026-06-14",
      overall: [
        { name: "Mansions of Madness",         score: 567, mentions: 1, sources: ["r/boardgames"],           change: null, bgg: "https://boardgamegeek.com/boardgame/205059/mansions-of-madness-second-edition", img: "https://cf.geekdo-images.com/LIooA9bTdjnE9qmhjL-UFw__square200/img/I60Uk2oPsbiV0u_onRxI6HNgUxc=/200x200/filters:strip_icc()/pic3118622.jpg" },
        { name: "Death May Die",                score: 160, mentions: 1, sources: ["r/boardgames"],           change: null, bgg: "https://boardgamegeek.com/boardgame/253344/cthulhu-death-may-die",               img: null },
        { name: "Vantage",                      score: 153, mentions: 1, sources: ["r/soloboardgaming"],      change: null, bgg: "https://boardgamegeek.com/boardgame/420033/vantage",                             img: "https://cf.geekdo-images.com/M0e9l-SHH2H4RMSAcnsDgg__square200/img/AFfSFufAeHUbnKONFYGAZO7VIMs=/200x200/filters:strip_icc()/pic8658546.jpg" },
        { name: "Tiny Epic Galaxies",           score: 122, mentions: 1, sources: ["r/soloboardgaming"],      change: null, bgg: "https://boardgamegeek.com/boardgame/163967/tiny-epic-galaxies",                  img: null },
        { name: "Earthborne Rangers",           score: 119, mentions: 1, sources: ["r/soloboardgaming"],      change: null, bgg: "https://boardgamegeek.com/boardgame/342900/earthborne-rangers",                  img: "https://cf.geekdo-images.com/EVfMwPiHmxDUvY32BbghBg__square200/img/BzfEEBzbXRa1lHm-5dc3ls6wuHU=/200x200/filters:strip_icc()/pic7378384.jpg" },
        { name: "Root",                         score:  94, mentions: 3, sources: ["r/boardgames"],           change: null, bgg: "https://boardgamegeek.com/boardgame/237182/root",                               img: "https://cf.geekdo-images.com/JUAUWaVUzeBgzirhZNmHHw__square200/img/pKGjK1ToJcM3DyOYnc2LHdhkKJ4=/200x200/filters:strip_icc()/pic4254509.jpg" },
        { name: "Finspan",                      score:  86, mentions: 1, sources: ["r/boardgames"],           change: null, bgg: "https://boardgamegeek.com/boardgame/414692/finspan",                            img: null },
        { name: "Wingspan",                     score:  83, mentions: 1, sources: ["r/boardgames"],           change: null, bgg: "https://boardgamegeek.com/boardgame/266192/wingspan",                           img: null },
        { name: "Gloomhaven: Jaws of the Lion", score:  77, mentions: 1, sources: ["r/soloboardgaming"],      change: null, bgg: "https://boardgamegeek.com/boardgame/291457/gloomhaven-jaws-of-the-lion",         img: "https://cf.geekdo-images.com/_HhIdavYW-hid20Iq3hhmg__square200/img/PAvcImUWC1c5q2TBIbG87fyPfEM=/200x200/filters:strip_icc()/pic5055631.jpg" },
        { name: "Twilight Imperium 4",          score:  74, mentions: 2, sources: ["r/boardgamescirclejerk"], change: null, bgg: "https://boardgamegeek.com/boardgame/233078/twilight-imperium-fourth-edition",    img: null },
        { name: "Barbarian Prince",             score:  65, mentions: 1, sources: ["r/soloboardgaming"],      change: null, bgg: "https://boardgamegeek.com/boardgame/3392/barbarian-prince",                     img: null },
        { name: "Kemet",                        score:  60, mentions: 4, sources: ["r/boardgames"],           change: null, bgg: "https://boardgamegeek.com/boardgame/127023/kemet",                              img: null },
        { name: "Inis",                         score:  55, mentions: 3, sources: ["r/boardgames"],           change: null, bgg: "https://boardgamegeek.com/boardgame/155821/inis",                               img: null },
        { name: "Trailblazers",                 score:  55, mentions: 1, sources: ["r/soloboardgaming"],      change: null, bgg: "https://boardgamegeek.com/boardgame/365421/trailblazers",                       img: null },
        { name: "Storyfold Wildwoods",          score:  52, mentions: 1, sources: ["r/soloboardgaming"],      change: null, bgg: null,                                                                            img: null },
      ],
      solo: [
        { name: "Vantage",                      score: 153, mentions: 1, sources: ["r/soloboardgaming"], change: null, bgg: "https://boardgamegeek.com/boardgame/420033/vantage",                             img: "https://cf.geekdo-images.com/M0e9l-SHH2H4RMSAcnsDgg__square200/img/AFfSFufAeHUbnKONFYGAZO7VIMs=/200x200/filters:strip_icc()/pic8658546.jpg" },
        { name: "Tiny Epic Galaxies",           score: 122, mentions: 1, sources: ["r/soloboardgaming"], change: null, bgg: "https://boardgamegeek.com/boardgame/163967/tiny-epic-galaxies",                  img: null },
        { name: "Earthborne Rangers",           score: 119, mentions: 1, sources: ["r/soloboardgaming"], change: null, bgg: "https://boardgamegeek.com/boardgame/342900/earthborne-rangers",                  img: "https://cf.geekdo-images.com/EVfMwPiHmxDUvY32BbghBg__square200/img/BzfEEBzbXRa1lHm-5dc3ls6wuHU=/200x200/filters:strip_icc()/pic7378384.jpg" },
        { name: "Gloomhaven: Jaws of the Lion", score:  77, mentions: 1, sources: ["r/soloboardgaming"], change: null, bgg: "https://boardgamegeek.com/boardgame/291457/gloomhaven-jaws-of-the-lion",         img: "https://cf.geekdo-images.com/_HhIdavYW-hid20Iq3hhmg__square200/img/PAvcImUWC1c5q2TBIbG87fyPfEM=/200x200/filters:strip_icc()/pic5055631.jpg" },
        { name: "Barbarian Prince",             score:  65, mentions: 1, sources: ["r/soloboardgaming"], change: null, bgg: "https://boardgamegeek.com/boardgame/3392/barbarian-prince",                     img: null },
        { name: "Trailblazers",                 score:  55, mentions: 1, sources: ["r/soloboardgaming"], change: null, bgg: "https://boardgamegeek.com/boardgame/365421/trailblazers",                       img: null },
        { name: "Storyfold Wildwoods",          score:  52, mentions: 1, sources: ["r/soloboardgaming"], change: null, bgg: null,                                                                            img: null },
        { name: "Everdell: Silverfrost",        score:  42, mentions: 1, sources: ["r/soloboardgaming"], change: null, bgg: "https://boardgamegeek.com/boardgame/199792/everdell",                           img: "https://cf.geekdo-images.com/fjE7V5LNq31yVEW_yuqI-Q__square200/img/oSGR0N6s84_G6q5MSCrZ1ILL7VE=/200x200/filters:strip_icc()/pic3918905.png" },
        { name: "Judge Dredd: Helter Skelter",  score:  31, mentions: 1, sources: ["r/soloboardgaming"], change: null, bgg: null,                                                                            img: null },
        { name: "Ambush!",                      score:  29, mentions: 1, sources: ["r/soloboardgaming"], change: null, bgg: "https://boardgamegeek.com/boardgame/1062/ambush",                               img: null },
        { name: "Ark Nova / Sanctuary",         score:  29, mentions: 1, sources: ["r/soloboardgaming"], change: null, bgg: "https://boardgamegeek.com/boardgame/342942/ark-nova",                           img: null },
        { name: "Imperium Classics",            score:  26, mentions: 1, sources: ["r/soloboardgaming"], change: null, bgg: "https://boardgamegeek.com/boardgame/314730/imperium-classics",                  img: null },
        { name: "Hadrian's Wall",               score:  18, mentions: 3, sources: ["r/soloboardgaming"], change: null, bgg: "https://boardgamegeek.com/boardgame/304783/hadrians-wall",                      img: null },
        { name: "Final Girl",                   score:  14, mentions: 1, sources: ["r/soloboardgaming"], change: null, bgg: "https://boardgamegeek.com/boardgame/277659/final-girl",                         img: "https://cf.geekdo-images.com/TUtzY-F7gKTIKm9y8e1AQw__square200/img/ElsynU1BFxm4xjLFXLp-KtJnQXw=/200x200/filters:strip_icc()/pic6520382.jpg" },
        { name: "Cascadia",                     score:  12, mentions: 2, sources: ["r/soloboardgaming"], change: null, bgg: "https://boardgamegeek.com/boardgame/295947/cascadia",                           img: "https://cf.geekdo-images.com/MjeJZfulbsM1DSV3DrGJYA__square200/img/ClDVJ5N-pZlzIkxQBCufbfFXChI=/200x200/filters:strip_icc()/pic5100691.jpg" },
      ],
      party: [
        { name: "SHUG",                   score: 123, mentions: 1, sources: ["r/boardgames"],           change: null, bgg: "https://boardgamegeek.com/boardgame/471200/shug",              img: null, note: "Kickstarter: 12,253 backers" },
        { name: "Blood on the Clocktower", score:  40, mentions: 2, sources: ["r/boardgamescirclejerk"], change: null, bgg: "https://boardgamegeek.com/boardgame/240980/blood-on-the-clocktower", img: null },
        { name: "Codenames",              score:  20, mentions: 2, sources: ["r/boardgames"],           change: null, bgg: "https://boardgamegeek.com/boardgame/178900/codenames",          img: "https://cf.geekdo-images.com/nC6ifPCDnAItwoKSKXVrnw__square200/img/ZUa-6Wb_m1KmtkAb6MxmcVN6Y50=/200x200/filters:strip_icc()/pic8907965.jpg" },
        { name: "Wavelength",             score:  15, mentions: 1, sources: ["r/boardgames"],           change: null, bgg: "https://boardgamegeek.com/boardgame/262543/wavelength",         img: null },
        { name: "Jackbox Party Pack",     score:  10, mentions: 1, sources: ["r/boardgames"],           change: null, bgg: null,                                                           img: null },
      ],
      crowdfunding: [
        { name: "SHUG",                        backers: 12253, pct: 10044, platform: "Kickstarter", ends: "2026-06-17", bgg: "https://boardgamegeek.com/boardgame/471200/shug" },
        { name: "Arydia: 2nd Printing",        backers: 11905, pct:  1028, platform: "Gamefound",   ends: null,         bgg: null },
        { name: "Concordia Special Edition",   backers: 11105, pct:  5599, platform: "Gamefound",   ends: "2026-06-30", bgg: "https://boardgamegeek.com/boardgame/465819/concordia-special-edition" },
        { name: "Zombicide: Dead Men Tales",   backers: 11058, pct:  2063, platform: "Gamefound",   ends: null,         bgg: null },
        { name: "Altera",                      backers:  3181, pct:  1004, platform: "Gamefound",   ends: "2026-06-29", bgg: "https://boardgamegeek.com/boardgame/469367/altera" },
        { name: "Earthborne Trailblazer",      backers:  3178, pct:   311, platform: "Kickstarter", ends: "2026-06-16", bgg: null },
        { name: "8 Dragons",                   backers:  2661, pct:  2611, platform: "Kickstarter", ends: "2026-07-06", bgg: "https://boardgamegeek.com/boardgame/454438/8-dragons" },
        { name: "Dragon Ball Z: The Board Game",backers: 1343, pct:  1463, platform: "Kickstarter", ends: "2026-07-07", bgg: null },
      ],
    }
  ]
};
