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
