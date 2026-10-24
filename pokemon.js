/*
  Habitats and the Pokémon that live in each one: all 151 from the first
  generation (Red, Blue and Yellow), each in exactly one habitat. Habitats are
  listed in the order a player reaches them in the games.
  id is the National Pokédex number, used to load the artwork from PokeAPI.
  rarity: "common", "uncommon" or "rare". Weights for each are in app.js.
  height: the Pokédex height in tenths of a meter (Caterpie is 3, Onix is 88),
  from PokeAPI. app.js uses it so bigger Pokémon look bigger on screen.
*/
window.HABITATS = [
  {
    key: "route", name: "Route 1", blurb: "Tall grass outside Pallet Town",
    pokemon: [
      [16, "Pidgey", "common", 3], [19, "Rattata", "common", 3], [21, "Spearow", "common", 3], [39, "Jigglypuff", "common", 5],
      [52, "Meowth", "common", 4], [56, "Mankey", "common", 5],
      [17, "Pidgeotto", "uncommon", 11], [18, "Pidgeot", "uncommon", 15], [20, "Raticate", "uncommon", 7], [22, "Fearow", "uncommon", 12],
      [40, "Wigglytuff", "uncommon", 10], [53, "Persian", "uncommon", 10], [57, "Primeape", "uncommon", 10], [83, "Farfetch’d", "uncommon", 8],
      [108, "Lickitung", "uncommon", 12], [133, "Eevee", "uncommon", 3],
      [143, "Snorlax", "rare", 21]
    ]
  },
  {
    key: "forest", name: "Viridian Forest", blurb: "Bug catchers welcome",
    pokemon: [
      [1, "Bulbasaur", "common", 7], [10, "Caterpie", "common", 3], [11, "Metapod", "common", 7], [13, "Weedle", "common", 3],
      [14, "Kakuna", "common", 6], [43, "Oddish", "common", 5], [48, "Venonat", "common", 10], [69, "Bellsprout", "common", 7],
      [2, "Ivysaur", "uncommon", 10], [12, "Butterfree", "uncommon", 11], [15, "Beedrill", "uncommon", 10], [44, "Gloom", "uncommon", 8],
      [45, "Vileplume", "uncommon", 12], [49, "Venomoth", "uncommon", 15], [70, "Weepinbell", "uncommon", 10], [71, "Victreebel", "uncommon", 17],
      [114, "Tangela", "uncommon", 10],
      [3, "Venusaur", "rare", 20]
    ]
  },
  {
    key: "fossil", name: "Pewter City", blurb: "Rock types and museum fossils",
    pokemon: [
      [27, "Sandshrew", "common", 6], [50, "Diglett", "common", 2], [138, "Omanyte", "common", 4], [140, "Kabuto", "common", 5],
      [28, "Sandslash", "uncommon", 10], [51, "Dugtrio", "uncommon", 7], [139, "Omastar", "uncommon", 10], [141, "Kabutops", "uncommon", 13],
      [142, "Aerodactyl", "rare", 18]
    ]
  },
  {
    key: "cave", name: "Mt. Moon", blurb: "Dark tunnels and glowing rocks",
    pokemon: [
      [35, "Clefairy", "common", 6], [41, "Zubat", "common", 8], [46, "Paras", "common", 3], [74, "Geodude", "common", 4],
      [36, "Clefable", "uncommon", 13], [42, "Golbat", "uncommon", 16], [47, "Parasect", "uncommon", 10], [75, "Graveler", "uncommon", 10],
      [76, "Golem", "rare", 14]
    ]
  },
  {
    key: "sea", name: "Open Sea", blurb: "Waves, reefs and sea spray",
    pokemon: [
      [7, "Squirtle", "common", 5], [60, "Poliwag", "common", 6], [72, "Tentacool", "common", 9], [98, "Krabby", "common", 4],
      [116, "Horsea", "common", 4], [118, "Goldeen", "common", 6], [129, "Magikarp", "common", 9],
      [8, "Wartortle", "uncommon", 10], [61, "Poliwhirl", "uncommon", 10], [73, "Tentacruel", "uncommon", 16], [99, "Kingler", "uncommon", 13],
      [117, "Seadra", "uncommon", 12], [119, "Seaking", "uncommon", 13],
      [9, "Blastoise", "rare", 16], [62, "Poliwrath", "rare", 13], [130, "Gyarados", "rare", 65], [134, "Vaporeon", "rare", 10]
    ]
  },
  {
    key: "haunted", name: "Lavender Town", blurb: "Home of the Pokémon Tower",
    pokemon: [
      [23, "Ekans", "common", 20], [88, "Grimer", "common", 9], [92, "Gastly", "common", 13], [104, "Cubone", "common", 4],
      [109, "Koffing", "common", 6],
      [24, "Arbok", "uncommon", 35], [89, "Muk", "uncommon", 12], [93, "Haunter", "uncommon", 16], [105, "Marowak", "uncommon", 10],
      [110, "Weezing", "uncommon", 12],
      [94, "Gengar", "rare", 15]
    ]
  },
  {
    key: "space", name: "Saffron City", blurb: "Psychic Pokémon under the stars",
    pokemon: [
      [63, "Abra", "common", 9], [96, "Drowzee", "common", 10], [120, "Staryu", "common", 8],
      [64, "Kadabra", "uncommon", 13], [97, "Hypno", "uncommon", 16], [121, "Starmie", "uncommon", 11], [122, "Mr. Mime", "uncommon", 13],
      [132, "Ditto", "uncommon", 3],
      [65, "Alakazam", "rare", 15], [137, "Porygon", "rare", 8], [151, "Mew", "rare", 4]
    ]
  },
  {
    key: "safari", name: "Safari Zone", blurb: "Tall grass and wide plains",
    pokemon: [
      [29, "Nidoran♀", "common", 4], [32, "Nidoran♂", "common", 5], [84, "Doduo", "common", 14], [102, "Exeggcute", "common", 4],
      [30, "Nidorina", "uncommon", 8], [33, "Nidorino", "uncommon", 9], [85, "Dodrio", "uncommon", 18], [103, "Exeggutor", "uncommon", 20],
      [115, "Kangaskhan", "uncommon", 22], [123, "Scyther", "uncommon", 15], [127, "Pinsir", "uncommon", 15], [128, "Tauros", "uncommon", 14],
      [31, "Nidoqueen", "rare", 13], [34, "Nidoking", "rare", 14], [113, "Chansey", "rare", 11], [147, "Dratini", "rare", 18],
      [148, "Dragonair", "rare", 40], [149, "Dragonite", "rare", 22]
    ]
  },
  {
    key: "power", name: "Power Plant", blurb: "Humming wires and sparks",
    pokemon: [
      [25, "Pikachu", "common", 4], [81, "Magnemite", "common", 3], [100, "Voltorb", "common", 5],
      [26, "Raichu", "uncommon", 8], [82, "Magneton", "uncommon", 10], [101, "Electrode", "uncommon", 12], [125, "Electabuzz", "uncommon", 11],
      [135, "Jolteon", "rare", 8], [145, "Zapdos", "rare", 16]
    ]
  },
  {
    key: "snow", name: "Seafoam Islands", blurb: "Icy caves out at sea",
    pokemon: [
      [54, "Psyduck", "common", 8], [79, "Slowpoke", "common", 12], [86, "Seel", "common", 11], [90, "Shellder", "common", 3],
      [55, "Golduck", "uncommon", 17], [80, "Slowbro", "uncommon", 16], [87, "Dewgong", "uncommon", 17], [91, "Cloyster", "uncommon", 15],
      [124, "Jynx", "uncommon", 14],
      [131, "Lapras", "rare", 25], [144, "Articuno", "rare", 17]
    ]
  },
  {
    key: "volcano", name: "Cinnabar Island", blurb: "Hot rocks and lava pools",
    pokemon: [
      [4, "Charmander", "common", 6], [37, "Vulpix", "common", 6], [58, "Growlithe", "common", 7], [77, "Ponyta", "common", 10],
      [5, "Charmeleon", "uncommon", 11], [78, "Rapidash", "uncommon", 17], [126, "Magmar", "uncommon", 13],
      [6, "Charizard", "rare", 17], [38, "Ninetales", "rare", 11], [59, "Arcanine", "rare", 19], [136, "Flareon", "rare", 9],
      [146, "Moltres", "rare", 20]
    ]
  },
  {
    key: "victory", name: "Victory Road", blurb: "The last climb before the League",
    pokemon: [
      [66, "Machop", "common", 8], [111, "Rhyhorn", "common", 10],
      [67, "Machoke", "uncommon", 15], [95, "Onix", "uncommon", 88], [106, "Hitmonlee", "uncommon", 15], [107, "Hitmonchan", "uncommon", 14],
      [112, "Rhydon", "uncommon", 19],
      [68, "Machamp", "rare", 16], [150, "Mewtwo", "rare", 20]
    ]
  }
].map(h => ({ ...h, pokemon: h.pokemon.map(([id, name, rarity, height]) => ({ id, name, rarity, height })) }));

window.ART = {
  normal: id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
  shiny: id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${id}.png`
};

// Pokémon in the game that can learn HM04 Strength in Red and Blue (checked
// against PokeAPI). In Victory Road they sometimes push a boulder.
window.STRENGTH = new Set([66, 67, 68, 95, 106, 107, 111, 112, 150]);

// Water Pokémon that swim, partly under the surface, in the Open Sea. Fish
// and jellyfish sit a little lower in the water.
window.SWIMMERS = new Set([7, 8, 9, 54, 55, 60, 61, 62, 72, 73, 79, 80, 86, 87, 90, 91, 98, 99, 116, 117, 118, 119, 129, 130, 131, 134]);
window.DEEP_SWIMMERS = new Set([72, 73, 116, 117, 118, 119, 129, 130]);
// How much of its artwork's height each swimmer's body fills. A wide, flat
// fish like Goldeen fills about half, so it sinks by a share of its body,
// not of the whole picture.
window.ART_FILL = {7: 0.91, 8: 0.91, 9: 0.91, 54: 0.91, 55: 0.89, 60: 0.71, 61: 0.79, 62: 0.62, 72: 0.74, 73: 0.7, 79: 0.73, 80: 0.91, 86: 0.83, 87: 0.9, 90: 0.88, 91: 0.87, 98: 0.55, 99: 0.56, 116: 0.91, 117: 0.79, 118: 0.51, 119: 0.85, 129: 0.91, 130: 0.91, 131: 0.87, 134: 0.91};

// Pokémon whose artwork shows them in the air. They hover over their shadow;
// everyone else stands on the ground.
window.FLOATERS = new Set([12, 15, 17, 18, 22, 41, 42, 49, 74, 81, 82, 92, 93, 109, 110, 142, 144, 145, 146, 151]);

// Empty space below each Pokémon's feet in its artwork, as a share of the
// image height (measured from the PokeAPI images). Used to set them down on
// their shadow instead of hovering above it.
window.ART_PAD = {1: 0.078, 2: 0.078, 3: 0.147, 4: 0.046, 5: 0.046, 6: 0.145, 7: 0.046, 8: 0.046, 9: 0.046, 10: 0.046, 11: 0.046, 12: 0.086, 13: 0.046, 14: 0.046, 15: 0.046, 16: 0.046, 17: 0.046, 18: 0.046, 19: 0.101, 20: 0.055, 21: 0.046, 22: 0.08, 23: 0.051, 24: 0.046, 25: 0.074, 26: 0.097, 27: 0.046, 28: 0.065, 29: 0.065, 30: 0.046, 31: 0.046, 32: 0.046, 33: 0.046, 34: 0.152, 35: 0.046, 36: 0.053, 37: 0.099, 38: 0.063, 39: 0.072, 40: 0.046, 41: 0.072, 42: 0.112, 43: 0.046, 44: 0.131, 45: 0.088, 46: 0.128, 47: 0.074, 48: 0.046, 49: 0.204, 50: 0.08, 51: 0.063, 52: 0.046, 53: 0.095, 54: 0.046, 55: 0.053, 56: 0.179, 57: 0.046, 58: 0.046, 59: 0.074, 60: 0.145, 61: 0.103, 62: 0.192, 63: 0.181, 64: 0.046, 65: 0.097, 66: 0.046, 67: 0.046, 68: 0.046, 69: 0.046, 70: 0.149, 71: 0.116, 72: 0.128, 73: 0.149, 74: 0.328, 75: 0.276, 76: 0.074, 77: 0.046, 78: 0.046, 79: 0.135, 80: 0.046, 81: 0.253, 82: 0.086, 83: 0.046, 84: 0.046, 85: 0.046, 86: 0.086, 87: 0.048, 88: 0.187, 89: 0.272, 90: 0.059, 91: 0.065, 92: 0.048, 93: 0.105, 94: 0.046, 95: 0.046, 96: 0.046, 97: 0.046, 98: 0.223, 99: 0.219, 100: 0.057, 101: 0.046, 102: 0.145, 103: 0.057, 104: 0.046, 105: 0.046, 106: 0.107, 107: 0.046, 108: 0.08, 109: 0.12, 110: 0.116, 111: 0.046, 112: 0.126, 113: 0.101, 114: 0.091, 115: 0.046, 116: 0.046, 117: 0.107, 118: 0.246, 119: 0.078, 120: 0.046, 121: 0.067, 122: 0.067, 123: 0.046, 124: 0.133, 125: 0.057, 126: 0.059, 127: 0.046, 128: 0.084, 129: 0.046, 130: 0.046, 131: 0.063, 132: 0.116, 133: 0.046, 134: 0.046, 135: 0.046, 136: 0.097, 137: 0.046, 138: 0.046, 139: 0.101, 140: 0.166, 141: 0.046, 142: 0.219, 143: 0.139, 144: 0.046, 145: 0.187, 146: 0.286, 147: 0.059, 148: 0.046, 149: 0.046, 150: 0.046, 151: 0.046};
