/*
  Habitats and the Pokémon that live in each one.
  id is the National Pokédex number, used to load the artwork from PokeAPI.
  rarity: "common", "uncommon" or "rare". Weights for each are in app.js.
  height: the Pokédex height in tenths of a meter (Caterpie is 3, Onix is 88),
  from PokeAPI. app.js uses it so bigger Pokémon look bigger on screen.
*/
window.HABITATS = [
  {
    key: "forest", name: "Viridian Forest", blurb: "Bug catchers welcome",
    pokemon: [
      [10, "Caterpie", "common", 3], [13, "Weedle", "common", 3], [16, "Pidgey", "common", 3],
      [43, "Oddish", "common", 5], [163, "Hoothoot", "common", 7],
      [25, "Pikachu", "uncommon", 4], [12, "Butterfree", "uncommon", 11], [15, "Beedrill", "uncommon", 10],
      [214, "Heracross", "uncommon", 15], [252, "Treecko", "uncommon", 5],
      [123, "Scyther", "rare", 15], [470, "Leafeon", "rare", 10], [251, "Celebi", "rare", 6]
    ]
  },
  {
    key: "safari", name: "Safari Zone", blurb: "Tall grass and wide plains",
    pokemon: [
      [29, "Nidoran♀", "common", 4], [32, "Nidoran♂", "common", 5], [84, "Doduo", "common", 14],
      [102, "Exeggcute", "common", 4], [111, "Rhyhorn", "common", 10], [48, "Venonat", "common", 10],
      [128, "Tauros", "uncommon", 14], [115, "Kangaskhan", "uncommon", 22], [127, "Pinsir", "uncommon", 15],
      [203, "Girafarig", "uncommon", 15],
      [113, "Chansey", "rare", 11], [147, "Dratini", "rare", 18], [243, "Raikou", "rare", 19]
    ]
  },
  {
    key: "sea", name: "Open Sea", blurb: "Waves, reefs and sea spray",
    pokemon: [
      [129, "Magikarp", "common", 9], [72, "Tentacool", "common", 9], [54, "Psyduck", "common", 8],
      [116, "Horsea", "common", 4], [118, "Goldeen", "common", 6], [278, "Wingull", "common", 6],
      [7, "Squirtle", "uncommon", 5], [120, "Staryu", "uncommon", 8], [222, "Corsola", "uncommon", 6],
      [226, "Mantine", "uncommon", 21], [393, "Piplup", "uncommon", 4],
      [131, "Lapras", "rare", 25], [130, "Gyarados", "rare", 65], [382, "Kyogre", "rare", 45]
    ]
  },
  {
    key: "cave", name: "Mt. Moon Cave", blurb: "Dark tunnels and glowing rocks",
    pokemon: [
      [41, "Zubat", "common", 8], [74, "Geodude", "common", 4], [46, "Paras", "common", 3],
      [50, "Diglett", "common", 2], [27, "Sandshrew", "common", 6],
      [95, "Onix", "uncommon", 88], [66, "Machop", "uncommon", 8], [304, "Aron", "uncommon", 4],
      [302, "Sableye", "uncommon", 5], [42, "Golbat", "uncommon", 16],
      [443, "Gible", "rare", 7], [246, "Larvitar", "rare", 6], [150, "Mewtwo", "rare", 20]
    ]
  },
  {
    key: "fossil", name: "Fossil Dig", blurb: "Pokémon from long ago",
    pokemon: [
      [138, "Omanyte", "common", 4], [140, "Kabuto", "common", 5], [345, "Lileep", "common", 10],
      [347, "Anorith", "common", 7], [408, "Cranidos", "common", 9], [410, "Shieldon", "common", 5],
      [696, "Tyrunt", "uncommon", 8], [698, "Amaura", "uncommon", 13], [566, "Archen", "uncommon", 5],
      [564, "Tirtouga", "uncommon", 7], [139, "Omastar", "uncommon", 10],
      [142, "Aerodactyl", "rare", 18], [697, "Tyrantrum", "rare", 25], [409, "Rampardos", "rare", 16]
    ]
  },
  {
    key: "volcano", name: "Volcano", blurb: "Hot rocks and lava pools",
    pokemon: [
      [37, "Vulpix", "common", 6], [77, "Ponyta", "common", 10], [218, "Slugma", "common", 7],
      [322, "Numel", "common", 7], [58, "Growlithe", "common", 7],
      [4, "Charmander", "uncommon", 6], [126, "Magmar", "uncommon", 13], [324, "Torkoal", "uncommon", 5],
      [228, "Houndour", "uncommon", 6], [155, "Cyndaquil", "uncommon", 5],
      [6, "Charizard", "rare", 17], [146, "Moltres", "rare", 20], [383, "Groudon", "rare", 35]
    ]
  },
  {
    key: "snow", name: "Frozen Peak", blurb: "Snowdrifts and icy wind",
    pokemon: [
      [220, "Swinub", "common", 4], [361, "Snorunt", "common", 7], [363, "Spheal", "common", 8],
      [86, "Seel", "common", 11], [459, "Snover", "common", 10],
      [215, "Sneasel", "uncommon", 9], [225, "Delibird", "uncommon", 9], [124, "Jynx", "uncommon", 14],
      [471, "Glaceon", "uncommon", 8], [613, "Cubchoo", "uncommon", 5],
      [144, "Articuno", "rare", 17], [478, "Froslass", "rare", 13], [378, "Regice", "rare", 18]
    ]
  },
  {
    key: "haunted", name: "Haunted Tower", blurb: "Spooky, but only a little",
    pokemon: [
      [92, "Gastly", "common", 13], [200, "Misdreavus", "common", 7], [353, "Shuppet", "common", 6],
      [355, "Duskull", "common", 8], [607, "Litwick", "common", 3],
      [93, "Haunter", "uncommon", 16], [425, "Drifloon", "uncommon", 4], [708, "Phantump", "uncommon", 4],
      [778, "Mimikyu", "uncommon", 2],
      [94, "Gengar", "rare", 15], [442, "Spiritomb", "rare", 10], [487, "Giratina", "rare", 45]
    ]
  },
  {
    key: "space", name: "Night Sky", blurb: "Stars, moons and meteors",
    pokemon: [
      [35, "Clefairy", "common", 6], [173, "Cleffa", "common", 3], [774, "Minior", "common", 3],
      [605, "Elgyem", "common", 5], [177, "Natu", "common", 2], [337, "Lunatone", "common", 10],
      [338, "Solrock", "common", 12],
      [36, "Clefable", "uncommon", 13], [374, "Beldum", "uncommon", 6], [436, "Bronzor", "uncommon", 5],
      [178, "Xatu", "uncommon", 15],
      [385, "Jirachi", "rare", 3], [386, "Deoxys", "rare", 17], [384, "Rayquaza", "rare", 70]
    ]
  }
].map(h => ({ ...h, pokemon: h.pokemon.map(([id, name, rarity, height]) => ({ id, name, rarity, height })) }));

window.ART = {
  normal: id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
  shiny: id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${id}.png`
};
