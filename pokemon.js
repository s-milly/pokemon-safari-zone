/*
  Habitats and the Pokémon that live in each one.
  id is the National Pokédex number, used to load the artwork from PokeAPI.
  rarity: "common", "uncommon" or "rare". Weights for each are in app.js.
*/
window.HABITATS = [
  {
    key: "forest", name: "Viridian Forest", blurb: "Bug catchers welcome",
    pokemon: [
      [10, "Caterpie", "common"], [13, "Weedle", "common"], [16, "Pidgey", "common"],
      [43, "Oddish", "common"], [163, "Hoothoot", "common"],
      [25, "Pikachu", "uncommon"], [12, "Butterfree", "uncommon"], [15, "Beedrill", "uncommon"],
      [214, "Heracross", "uncommon"], [252, "Treecko", "uncommon"],
      [123, "Scyther", "rare"], [470, "Leafeon", "rare"], [251, "Celebi", "rare"]
    ]
  },
  {
    key: "safari", name: "Safari Zone", blurb: "Tall grass and wide plains",
    pokemon: [
      [29, "Nidoran♀", "common"], [32, "Nidoran♂", "common"], [84, "Doduo", "common"],
      [102, "Exeggcute", "common"], [111, "Rhyhorn", "common"], [48, "Venonat", "common"],
      [128, "Tauros", "uncommon"], [115, "Kangaskhan", "uncommon"], [127, "Pinsir", "uncommon"],
      [203, "Girafarig", "uncommon"],
      [113, "Chansey", "rare"], [147, "Dratini", "rare"], [243, "Raikou", "rare"]
    ]
  },
  {
    key: "sea", name: "Open Sea", blurb: "Waves, reefs and sea spray",
    pokemon: [
      [129, "Magikarp", "common"], [72, "Tentacool", "common"], [54, "Psyduck", "common"],
      [116, "Horsea", "common"], [118, "Goldeen", "common"], [278, "Wingull", "common"],
      [7, "Squirtle", "uncommon"], [120, "Staryu", "uncommon"], [222, "Corsola", "uncommon"],
      [226, "Mantine", "uncommon"], [393, "Piplup", "uncommon"],
      [131, "Lapras", "rare"], [130, "Gyarados", "rare"], [382, "Kyogre", "rare"]
    ]
  },
  {
    key: "cave", name: "Mt. Moon Cave", blurb: "Dark tunnels and glowing rocks",
    pokemon: [
      [41, "Zubat", "common"], [74, "Geodude", "common"], [46, "Paras", "common"],
      [50, "Diglett", "common"], [27, "Sandshrew", "common"],
      [95, "Onix", "uncommon"], [66, "Machop", "uncommon"], [304, "Aron", "uncommon"],
      [302, "Sableye", "uncommon"], [42, "Golbat", "uncommon"],
      [443, "Gible", "rare"], [246, "Larvitar", "rare"], [150, "Mewtwo", "rare"]
    ]
  },
  {
    key: "fossil", name: "Fossil Dig", blurb: "Pokémon from long ago",
    pokemon: [
      [138, "Omanyte", "common"], [140, "Kabuto", "common"], [345, "Lileep", "common"],
      [347, "Anorith", "common"], [408, "Cranidos", "common"], [410, "Shieldon", "common"],
      [696, "Tyrunt", "uncommon"], [698, "Amaura", "uncommon"], [566, "Archen", "uncommon"],
      [564, "Tirtouga", "uncommon"], [139, "Omastar", "uncommon"],
      [142, "Aerodactyl", "rare"], [697, "Tyrantrum", "rare"], [409, "Rampardos", "rare"]
    ]
  },
  {
    key: "volcano", name: "Volcano", blurb: "Hot rocks and lava pools",
    pokemon: [
      [37, "Vulpix", "common"], [77, "Ponyta", "common"], [218, "Slugma", "common"],
      [322, "Numel", "common"], [58, "Growlithe", "common"],
      [4, "Charmander", "uncommon"], [126, "Magmar", "uncommon"], [324, "Torkoal", "uncommon"],
      [228, "Houndour", "uncommon"], [155, "Cyndaquil", "uncommon"],
      [6, "Charizard", "rare"], [146, "Moltres", "rare"], [383, "Groudon", "rare"]
    ]
  },
  {
    key: "snow", name: "Frozen Peak", blurb: "Snowdrifts and icy wind",
    pokemon: [
      [220, "Swinub", "common"], [361, "Snorunt", "common"], [363, "Spheal", "common"],
      [86, "Seel", "common"], [459, "Snover", "common"],
      [215, "Sneasel", "uncommon"], [225, "Delibird", "uncommon"], [124, "Jynx", "uncommon"],
      [471, "Glaceon", "uncommon"], [613, "Cubchoo", "uncommon"],
      [144, "Articuno", "rare"], [478, "Froslass", "rare"], [378, "Regice", "rare"]
    ]
  },
  {
    key: "haunted", name: "Haunted Tower", blurb: "Spooky, but only a little",
    pokemon: [
      [92, "Gastly", "common"], [200, "Misdreavus", "common"], [353, "Shuppet", "common"],
      [355, "Duskull", "common"], [607, "Litwick", "common"],
      [93, "Haunter", "uncommon"], [425, "Drifloon", "uncommon"], [708, "Phantump", "uncommon"],
      [778, "Mimikyu", "uncommon"],
      [94, "Gengar", "rare"], [442, "Spiritomb", "rare"], [487, "Giratina", "rare"]
    ]
  },
  {
    key: "space", name: "Night Sky", blurb: "Stars, moons and meteors",
    pokemon: [
      [35, "Clefairy", "common"], [173, "Cleffa", "common"], [774, "Minior", "common"],
      [605, "Elgyem", "common"], [177, "Natu", "common"], [337, "Lunatone", "common"],
      [338, "Solrock", "common"],
      [36, "Clefable", "uncommon"], [374, "Beldum", "uncommon"], [436, "Bronzor", "uncommon"],
      [178, "Xatu", "uncommon"],
      [385, "Jirachi", "rare"], [386, "Deoxys", "rare"], [384, "Rayquaza", "rare"]
    ]
  }
].map(h => ({ ...h, pokemon: h.pokemon.map(([id, name, rarity]) => ({ id, name, rarity })) }));

window.ART = {
  normal: id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
  shiny: id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${id}.png`
};
