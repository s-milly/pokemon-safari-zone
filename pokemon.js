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
// How much of its artwork's height each Pokémon's body fills. A wide, flat
// fish like Goldeen fills about half, so swimming, digging or hiding in grass
// sinks it by a share of its body, not of the whole picture.
window.ART_FILL = {1: 0.85, 2: 0.85, 3: 0.71, 4: 0.91, 5: 0.91, 6: 0.71, 7: 0.91, 8: 0.91, 9: 0.91, 10: 0.91, 11: 0.91, 12: 0.83, 13: 0.91, 14: 0.91, 15: 0.91, 16: 0.91, 17: 0.91, 18: 0.91, 19: 0.8, 20: 0.89, 21: 0.91, 22: 0.84, 23: 0.9, 24: 0.91, 25: 0.85, 26: 0.81, 27: 0.91, 28: 0.87, 29: 0.87, 30: 0.91, 31: 0.91, 32: 0.91, 33: 0.91, 34: 0.7, 35: 0.91, 36: 0.9, 37: 0.8, 38: 0.87, 39: 0.86, 40: 0.91, 41: 0.86, 42: 0.78, 43: 0.91, 44: 0.74, 45: 0.83, 46: 0.75, 47: 0.85, 48: 0.91, 49: 0.59, 50: 0.84, 51: 0.88, 52: 0.91, 53: 0.81, 54: 0.91, 55: 0.89, 56: 0.64, 57: 0.91, 58: 0.91, 59: 0.85, 60: 0.71, 61: 0.79, 62: 0.62, 63: 0.64, 64: 0.91, 65: 0.81, 66: 0.91, 67: 0.91, 68: 0.91, 69: 0.91, 70: 0.7, 71: 0.77, 72: 0.74, 73: 0.7, 74: 0.34, 75: 0.45, 76: 0.85, 77: 0.91, 78: 0.91, 79: 0.73, 80: 0.91, 81: 0.49, 82: 0.83, 83: 0.91, 84: 0.91, 85: 0.91, 86: 0.83, 87: 0.9, 88: 0.63, 89: 0.46, 90: 0.88, 91: 0.87, 92: 0.9, 93: 0.79, 94: 0.91, 95: 0.91, 96: 0.91, 97: 0.91, 98: 0.55, 99: 0.56, 100: 0.89, 101: 0.91, 102: 0.71, 103: 0.89, 104: 0.91, 105: 0.91, 106: 0.79, 107: 0.91, 108: 0.84, 109: 0.76, 110: 0.77, 111: 0.91, 112: 0.75, 113: 0.8, 114: 0.82, 115: 0.91, 116: 0.91, 117: 0.79, 118: 0.51, 119: 0.85, 120: 0.91, 121: 0.87, 122: 0.87, 123: 0.91, 124: 0.74, 125: 0.89, 126: 0.88, 127: 0.91, 128: 0.83, 129: 0.91, 130: 0.91, 131: 0.87, 132: 0.77, 133: 0.91, 134: 0.91, 135: 0.91, 136: 0.81, 137: 0.91, 138: 0.91, 139: 0.8, 140: 0.67, 141: 0.91, 142: 0.56, 143: 0.72, 144: 0.91, 145: 0.63, 146: 0.43, 147: 0.88, 148: 0.91, 149: 0.91, 150: 0.91, 151: 0.91};

// Pokémon whose artwork shows them in the air. They hover over their shadow;
// everyone else stands on the ground.
window.FLOATERS = new Set([12, 15, 17, 18, 22, 41, 42, 49, 74, 81, 82, 92, 93, 109, 110, 142, 144, 145, 146, 151]);

// Empty space below each Pokémon's feet in its artwork, as a share of the
// image height (measured from the PokeAPI images). Used to set them down on
// their shadow instead of hovering above it.
window.ART_PAD = {1: 0.078, 2: 0.078, 3: 0.147, 4: 0.046, 5: 0.046, 6: 0.145, 7: 0.046, 8: 0.046, 9: 0.046, 10: 0.046, 11: 0.046, 12: 0.086, 13: 0.046, 14: 0.046, 15: 0.046, 16: 0.046, 17: 0.046, 18: 0.046, 19: 0.101, 20: 0.055, 21: 0.046, 22: 0.08, 23: 0.051, 24: 0.046, 25: 0.074, 26: 0.097, 27: 0.046, 28: 0.065, 29: 0.065, 30: 0.046, 31: 0.046, 32: 0.046, 33: 0.046, 34: 0.152, 35: 0.046, 36: 0.053, 37: 0.099, 38: 0.063, 39: 0.072, 40: 0.046, 41: 0.072, 42: 0.112, 43: 0.046, 44: 0.131, 45: 0.088, 46: 0.128, 47: 0.074, 48: 0.046, 49: 0.204, 50: 0.08, 51: 0.063, 52: 0.046, 53: 0.095, 54: 0.046, 55: 0.053, 56: 0.179, 57: 0.046, 58: 0.046, 59: 0.074, 60: 0.145, 61: 0.103, 62: 0.192, 63: 0.181, 64: 0.046, 65: 0.097, 66: 0.046, 67: 0.046, 68: 0.046, 69: 0.046, 70: 0.149, 71: 0.116, 72: 0.128, 73: 0.149, 74: 0.328, 75: 0.276, 76: 0.074, 77: 0.046, 78: 0.046, 79: 0.135, 80: 0.046, 81: 0.253, 82: 0.086, 83: 0.046, 84: 0.046, 85: 0.046, 86: 0.086, 87: 0.048, 88: 0.187, 89: 0.272, 90: 0.059, 91: 0.065, 92: 0.048, 93: 0.105, 94: 0.046, 95: 0.046, 96: 0.046, 97: 0.046, 98: 0.223, 99: 0.219, 100: 0.057, 101: 0.046, 102: 0.145, 103: 0.057, 104: 0.046, 105: 0.046, 106: 0.107, 107: 0.046, 108: 0.08, 109: 0.12, 110: 0.116, 111: 0.046, 112: 0.126, 113: 0.101, 114: 0.091, 115: 0.046, 116: 0.046, 117: 0.107, 118: 0.246, 119: 0.078, 120: 0.046, 121: 0.067, 122: 0.067, 123: 0.046, 124: 0.133, 125: 0.057, 126: 0.059, 127: 0.046, 128: 0.084, 129: 0.046, 130: 0.046, 131: 0.063, 132: 0.116, 133: 0.046, 134: 0.046, 135: 0.046, 136: 0.097, 137: 0.046, 138: 0.046, 139: 0.101, 140: 0.166, 141: 0.046, 142: 0.219, 143: 0.139, 144: 0.046, 145: 0.187, 146: 0.286, 147: 0.059, 148: 0.046, 149: 0.046, 150: 0.046, 151: 0.046};

// Where each ground Pokémon's feet (or body, tail or coils) meet the ground
// in its artwork: the share of the image width to the left and to the right
// of them (measured from the PokeAPI images). Its shadow is drawn there, so it
// looks like it is standing on the ground. Floaters keep a plain shadow.
window.ART_FOOT = {1: [0.183, 0.103], 2: [0.253, 0.116], 3: [0.263, 0.248], 4: [0.141, 0.286], 5: [0.168, 0.362], 6: [0.164, 0.242], 7: [0.143, 0.101], 8: [0.208, 0.206], 9: [0.082, 0.242], 10: [0.297, 0.133], 11: [0.356, 0.101], 13: [0.312, 0.202], 14: [0.371, 0.406], 16: [0.133, 0.425], 19: [0.381, 0.053], 20: [0.194, 0.349], 21: [0.261, 0.185], 23: [0.061, 0.175], 24: [0.139, 0.124], 25: [0.251, 0.343], 26: [0.124, 0.669], 27: [0.088, 0.301], 28: [0.282, 0.629], 29: [0.183, 0.223], 30: [0.181, 0.387], 31: [0.154, 0.063], 32: [0.103, 0.12], 33: [0.128, 0.232], 34: [0.223, 0.221], 35: [0.164, 0.181], 36: [0.236, 0.2], 37: [0.236, 0.347], 38: [0.192, 0.122], 39: [0.141, 0.297], 40: [0.349, 0.246], 43: [0.139, 0.587], 44: [0.269, 0.253], 45: [0.354, 0.175], 46: [0.091, 0.299], 47: [0.061, 0.065], 48: [0.326, 0.156], 50: [0.048, 0.048], 51: [0.048, 0.046], 52: [0.251, 0.499], 53: [0.232, 0.36], 54: [0.278, 0.194], 55: [0.217, 0.173], 56: [0.556, 0.295], 57: [0.238, 0.394], 58: [0.305, 0.204], 59: [0.141, 0.223], 60: [0.242, 0.048], 61: [0.244, 0.286], 62: [0.219, 0.192], 63: [0.147, 0.236], 64: [0.265, 0.116], 65: [0.194, 0.238], 66: [0.425, 0.419], 67: [0.124, 0.16], 68: [0.103, 0.312], 69: [0.114, 0.183], 70: [0.253, 0.474], 71: [0.084, 0.248], 72: [0.046, 0.836], 73: [0.232, 0.145], 75: [0.046, 0.328], 76: [0.227, 0.048], 77: [0.269, 0.347], 78: [0.284, 0.282], 79: [0.051, 0.048], 80: [0.091, 0.28], 83: [0.373, 0.189], 84: [0.448, 0.303], 85: [0.354, 0.364], 86: [0.046, 0.048], 87: [0.316, 0.265], 88: [0.248, 0.051], 89: [0.057, 0.354], 90: [0.251, 0.507], 91: [0.307, 0.187], 94: [0.185, 0.358], 95: [0.48, 0.229], 96: [0.175, 0.211], 97: [0.166, 0.261], 98: [0.046, 0.046], 99: [0.046, 0.046], 100: [0.187, 0.215], 101: [0.189, 0.189], 102: [0.472, 0.225], 103: [0.259, 0.221], 104: [0.118, 0.183], 105: [0.28, 0.24], 106: [0.293, 0.549], 107: [0.465, 0.364], 108: [0.065, 0.103], 111: [0.141, 0.149], 112: [0.107, 0.349], 113: [0.179, 0.238], 114: [0.177, 0.091], 115: [0.103, 0.196], 116: [0.124, 0.438], 117: [0.394, 0.316], 118: [0.269, 0.048], 119: [0.364, 0.219], 120: [0.137, 0.234], 121: [0.244, 0.229], 122: [0.143, 0.053], 123: [0.099, 0.202], 124: [0.103, 0.175], 125: [0.048, 0.282], 126: [0.259, 0.086], 127: [0.286, 0.48], 128: [0.219, 0.194], 129: [0.168, 0.278], 130: [0.64, 0.2], 131: [0.046, 0.082], 132: [0.093, 0.053], 133: [0.257, 0.385], 134: [0.097, 0.166], 135: [0.229, 0.223], 136: [0.046, 0.263], 137: [0.577, 0.156], 138: [0.196, 0.154], 139: [0.048, 0.057], 140: [0.109, 0.152], 141: [0.286, 0.179], 143: [0.072, 0.08], 147: [0.406, 0.069], 148: [0.217, 0.097], 149: [0.175, 0.36], 150: [0.324, 0.194]};

// Which way each Pokémon's artwork faces, so it can turn to face where it is
// going. Most face left; these face right, and the "front" ones look straight
// out and are never mirrored.
window.FACES_RIGHT = new Set([2, 9, 10, 11, 18, 21, 28, 30, 38, 48, 53, 58, 78, 83, 90, 100, 104, 106, 118, 125, 146, 147, 148, 150, 151]);
window.FACES_FRONT = new Set([3, 4, 6, 12, 15, 20, 24, 35, 36, 39, 40, 41, 42, 43, 44, 45, 46, 49, 50, 51, 56, 57, 61, 62, 64, 65, 67, 68, 73, 74, 75, 81, 82, 88, 89, 91, 93, 94, 96, 97, 98, 99, 101, 102, 103, 109, 110, 113, 114, 120, 121, 124, 126, 127, 132, 133, 134, 138, 139, 140, 141, 143, 145]);

// A few Pokémon move differently from the usual step: small bouncy ones hop,
// long ones slither.
window.HOPPERS = new Set([19, 25, 26, 29, 32, 35, 36, 39, 40, 52, 56, 60, 61, 102, 133]);
window.SLITHERERS = new Set([10, 11, 13, 14, 23, 24, 95, 147, 148]);
