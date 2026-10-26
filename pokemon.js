/*
  Habitats and the Pokémon that live in each one: all 151 from the first
  generation (Red, Blue and Yellow), each in exactly one habitat. Habitats are
  listed in the order a player reaches them in the games.
  id is the National Pokédex number, used to load the sprites from PokeAPI.
  rarity: "common", "uncommon" or "rare". Weights for each are in app.js.
  height: the Pokédex height in tenths of a meter (Caterpie is 3, Onix is 88),
  from PokeAPI. app.js uses it to set the pace of their steps.
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

// The animated sprites from Pokémon Black and White 2 (via PokeAPI). Each one
// is cropped close around the Pokémon, so its feet are at the bottom edge.
// A few are slowed down and kept here (see tools/slow-sprites.py): Venomoth's
// wings changed so fast that it flickered.
const SLOWED = new Set([49]);
window.ART = {
  normal: id => SLOWED.has(id) ? `px/anim/${id}.png` : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${id}.gif`,
  shiny: id => SLOWED.has(id) ? `px/anim/shiny/${id}.png` : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/shiny/${id}.gif`
};

// Each sprite's width and height in pixels. Bigger Pokémon have bigger
// sprites, so they are drawn at their own size, the same pixel size as the
// pixel backgrounds.
window.ART_SIZE = {1: [37, 38], 2: [58, 51], 3: [86, 71], 4: [41, 42], 5: [66, 56], 6: [87, 89], 7: [39, 43], 8: [60, 57], 9: [70, 66], 10: [36, 37], 11: [37, 38], 12: [61, 58], 13: [37, 44], 14: [31, 40], 15: [72, 69], 16: [42, 48], 17: [82, 117], 18: [58, 68], 19: [43, 43], 20: [57, 52], 21: [33, 40], 22: [82, 105], 23: [59, 45], 24: [78, 75], 25: [50, 46], 26: [74, 73], 27: [36, 39], 28: [57, 54], 29: [35, 34], 30: [52, 47], 31: [77, 70], 32: [37, 37], 33: [52, 56], 34: [86, 71], 35: [48, 42], 36: [54, 52], 37: [60, 50], 38: [74, 73], 39: [47, 46], 40: [48, 82], 41: [53, 46], 42: [110, 82], 43: [37, 50], 44: [50, 45], 45: [56, 50], 46: [45, 37], 47: [62, 62], 48: [42, 53], 49: [101, 74], 50: [38, 31], 51: [52, 42], 52: [48, 65], 53: [72, 62], 54: [39, 46], 55: [60, 59], 56: [65, 61], 57: [66, 61], 58: [56, 49], 59: [75, 69], 60: [53, 34], 61: [74, 55], 62: [81, 57], 63: [62, 53], 64: [78, 61], 65: [92, 69], 66: [50, 50], 67: [61, 71], 68: [63, 77], 69: [41, 44], 70: [68, 50], 71: [65, 71], 72: [57, 69], 73: [83, 85], 74: [61, 45], 75: [71, 44], 76: [72, 57], 77: [58, 57], 78: [74, 73], 79: [65, 54], 80: [62, 60], 81: [37, 33], 82: [68, 60], 83: [45, 49], 84: [60, 54], 85: [69, 77], 86: [62, 47], 87: [75, 74], 88: [66, 42], 89: [94, 68], 90: [42, 38], 91: [73, 65], 92: [67, 75], 93: [85, 69], 94: [74, 63], 95: [74, 74], 96: [52, 58], 97: [67, 62], 98: [55, 40], 99: [82, 59], 100: [46, 31], 101: [48, 52], 102: [54, 43], 103: [78, 73], 104: [49, 43], 105: [67, 55], 106: [67, 78], 107: [34, 59], 108: [68, 52], 109: [90, 59], 110: [85, 67], 111: [68, 54], 112: [79, 68], 113: [59, 47], 114: [49, 42], 115: [78, 61], 116: [34, 43], 117: [57, 56], 118: [75, 57], 119: [72, 65], 120: [57, 49], 121: [65, 61], 122: [58, 53], 123: [54, 61], 124: [63, 60], 125: [72, 65], 126: [71, 61], 127: [73, 63], 128: [75, 59], 129: [47, 64], 130: [102, 84], 131: [68, 72], 132: [47, 32], 133: [46, 47], 134: [50, 59], 135: [47, 49], 136: [66, 60], 137: [57, 53], 138: [43, 44], 139: [62, 58], 140: [39, 41], 141: [64, 61], 142: [94, 82], 143: [74, 75], 144: [73, 81], 145: [96, 71], 146: [128, 97], 147: [44, 51], 148: [64, 73], 149: [80, 82], 150: [90, 69], 151: [77, 53]};

// Pokémon in the game that can learn HM04 Strength in Red and Blue (checked
// against PokeAPI). In Victory Road they sometimes push a boulder.
window.STRENGTH = new Set([66, 67, 68, 95, 106, 107, 111, 112, 150]);

// Water Pokémon that swim, partly under the surface, in the Open Sea. Fish
// and jellyfish sit a little lower in the water.
window.SWIMMERS = new Set([7, 8, 9, 54, 55, 60, 61, 62, 72, 73, 79, 80, 86, 87, 90, 91, 98, 99, 116, 117, 118, 119, 129, 130, 131, 134]);
window.DEEP_SWIMMERS = new Set([72, 73, 116, 117, 118, 119, 129, 130]);

// Pokémon whose artwork shows them in the air. They hover over their shadow;
// everyone else stands on the ground.
window.FLOATERS = new Set([12, 15, 17, 22, 41, 42, 49, 74, 81, 82, 92, 93, 109, 110, 142, 144, 145, 146, 151]);


// Where each ground Pokémon's feet (or body, tail or coils) meet the ground
// in its sprite: the share of the sprite's width to the left and to the right
// of them (measured from the first frame). Its shadow is drawn there, so it
// looks like it is standing on the ground. Floaters keep a plain shadow.
window.ART_FOOT = {1: [0.162, 0.135], 2: [0.069, 0.103], 3: [0.035, 0.174], 4: [0.171, 0.293], 5: [0.061, 0.53], 6: [0.184, 0.299], 7: [0.103, 0.282], 8: [0.167, 0.267], 9: [0.257, 0.143], 10: [0.25, 0.306], 11: [0.297, 0.054], 13: [0.243, 0.27], 14: [0.323, 0.355], 16: [0.238, 0.357], 18: [0.052, 0.293], 19: [0.07, 0.209], 20: [0.333, 0.14], 21: [0.061, 0.273], 23: [0.034, 0.407], 24: [0.256, 0.103], 25: [0.1, 0.42], 26: [0.392, 0.216], 27: [0.056, 0.278], 28: [0.246, 0.14], 29: [0.286, 0.086], 30: [0.346, 0.115], 31: [0.195, 0.182], 32: [0.081, 0.162], 33: [0.154, 0], 34: [0.198, 0.233], 35: [0.292, 0.188], 36: [0.259, 0.167], 37: [0.267, 0.333], 38: [0.108, 0.162], 39: [0.277, 0.213], 40: [0.229, 0.25], 43: [0.243, 0.324], 44: [0.26, 0.22], 45: [0.339, 0.143], 46: [0.067, 0.267], 47: [0.548, 0.194], 48: [0.143, 0.214], 50: [0.158, 0.158], 51: [0.019, 0.038], 52: [0.083, 0.271], 53: [0.208, 0.278], 54: [0.128, 0.103], 55: [0.25, 0.133], 56: [0.215, 0.215], 57: [0.258, 0.03], 58: [0.107, 0.464], 59: [0.133, 0.253], 60: [0.075, 0.509], 61: [0.23, 0.27], 62: [0.185, 0.148], 63: [0.065, 0.387], 64: [0.231, 0.244], 65: [0.326, 0.228], 66: [0.1, 0.18], 67: [0.213, 0.197], 68: [0.159, 0.111], 69: [0, 0.195], 70: [0.265, 0.456], 71: [0.169, 0.508], 72: [0.088, 0.07], 73: [0.53, 0.205], 75: [0.254, 0.254], 76: [0.167, 0.153], 77: [0.19, 0.362], 78: [0.149, 0.216], 79: [0, 0.231], 80: [0.016, 0.387], 83: [0.267, 0.267], 84: [0.3, 0.317], 85: [0.478, 0.319], 86: [0.032, 0.258], 87: [0.147, 0.227], 88: [0.227, 0.167], 89: [0.085, 0.223], 90: [0.048, 0.333], 91: [0.233, 0.26], 94: [0.311, 0.23], 95: [0.432, 0.203], 96: [0.231, 0.058], 97: [0.209, 0.269], 98: [0.745, 0.145], 99: [0.061, 0], 100: [0.239, 0.37], 101: [0.208, 0.208], 102: [0.056, 0.093], 103: [0.295, 0.282], 104: [0.367, 0.143], 105: [0.433, 0.149], 106: [0.478, 0.299], 107: [0, 0.176], 108: [0.191, 0.221], 111: [0.088, 0.397], 112: [0.165, 0.228], 113: [0.22, 0.237], 114: [0.184, 0.224], 115: [0.218, 0.103], 116: [0.118, 0.441], 117: [0.333, 0.368], 118: [0.147, 0.307], 119: [0.139, 0.222], 120: [0.544, 0.333], 121: [0.2, 0.231], 122: [0.172, 0.19], 123: [0.13, 0.074], 124: [0.111, 0.095], 125: [0.194, 0.153], 126: [0.225, 0.239], 127: [0.288, 0.205], 128: [0.253, 0.173], 129: [0.191, 0.553], 130: [0.118, 0.51], 131: [0, 0.044], 132: [0.128, 0.191], 133: [0.152, 0.413], 134: [0.04, 0.38], 135: [0.191, 0.213], 136: [0.106, 0.455], 137: [0.333, 0.404], 138: [0.186, 0.256], 139: [0.161, 0.242], 140: [0.231, 0.487], 141: [0.312, 0.172], 143: [0.149, 0.108], 147: [0.409, 0.227], 148: [0.344, 0.062], 149: [0.038, 0.45], 150: [0.144, 0.444]};


// A few Pokémon move differently from the usual step: small bouncy ones hop,
// long ones slither.
window.HOPPERS = new Set([19, 25, 26, 29, 32, 35, 36, 39, 40, 52, 56, 60, 61, 102, 133]);
window.SLITHERERS = new Set([10, 11, 13, 14, 23, 24, 95, 147, 148]);
