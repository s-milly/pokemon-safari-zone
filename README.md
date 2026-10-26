# Pokémon Safari Zone

A classroom volume game. Put a habitat up on the board and press Start. While the class stays under the volume goal, wild Pokémon come out one at a time. If it gets too loud, they run away.

**[Play it](https://s-milly.github.io/pokemon-safari-zone/)**

## How it works

- **All 151 original Pokémon:** every Pokémon from Red, Blue and Yellow lives in exactly one of twelve habitats, listed in the order you reach them in Red and Blue: Route 1, Viridian Forest, Pewter City, Mt. Moon, Open Sea (with the S.S. Anne), Lavender Town, Saffron City, Safari Zone, Power Plant, Seafoam Islands, Cinnabar Island and Victory Road.
- **Quiet time:** the microphone measures how loud the room is. While the class stays under the goal, a new Pokémon appears about every 1 to 2 minutes of quiet (the exact wait is random each time, and Settings can make it faster or slower).
- **Too loud:** if the room stays over the goal for more than half a second, every Pokémon on screen flees and the wait starts over. In Settings you can switch this so the scene pauses instead, and the Pokémon come back once it is quiet again.
- **Wandering:** Pokémon walk slowly around the habitat and turn to face the way they are going. Their size comes from their Pokédex height, scaled down so a 9 meter Onix still fits on screen next to a 30 centimeter Caterpie.
- **Movement:** Pokémon take small steps as they walk, quicker for small ones and slower for big ones. A few small, bouncy ones hop and long ones slither. Now and then one glances back or gives a little hop while standing. Each sprite turns to face the way it is going.
- **Perspective:** Pokémon are full size at the front of the scene and shrink steadily the further back they go. They stand on their shadows, except the ones whose sprite shows them flying (like Pidgeot, Zubat, Gastly, Magnemite and the legendary birds), which hover above theirs.
- **Habitat activities:** now and then, instead of a walk, a Pokémon does something that fits where it lives:
  - Route 1: steps a little way into the tall grass, ducks down and pops back up a couple of times to look around (the grass shakes as it moves), then walks out. Snorlax lies down for a nap. Jigglypuff sings, and every other Pokémon on screen falls asleep for a while. Now and then a wild Meowth brings Team Rocket along in their Meowth balloon, and they blast off again.
  - Viridian Forest: Caterpie, Weedle and Venonat climb a tree; Caterpie, Metapod, Weedle and Kakuna hang from a branch on a silk thread.
  - Pewter City: Sandshrew, Sandslash, Diglett and Dugtrio dig into the ground, tunnel along leaving a trail of dirt, and pop up somewhere else.
  - Mt. Moon: Clefairy and Clefable dance around the Moon Stone. Zubat and Golbat roost upside down on the ceiling and swoop back down. Graveler and Golem curl up and use Rollout the way they are facing.
  - Lavender Town: ghosts turn see-through and drift through the gravestones. Gastly and Haunter float into the Pokémon Tower windows. Gastly, Haunter and Gengar flicker, and sometimes fade away and show up somewhere else.
  - Saffron City: Pokémon that can learn Teleport in Red and Blue (everyone here but Ditto) teleport in a purple flash, or go into the Pokémon Center or Poké Mart for a while.
  - Safari Zone: Tauros, Doduo and Dodrio break into a run. Pokémon eat bait that appears on the ground.
  - Power Plant: electric Pokémon charge up on the glowing circles on the ground. Voltorb and Electrode roll instead of walking.
  - Seafoam Islands: Pokémon slide across the ice, Seel and Dewgong most of all. Seel and Dewgong bounce a beach ball on their heads. Slowpoke and Slowbro barely move, and slowly when they do.
  - Cinnabar Island: fire Pokémon warm up by a lava pool. Arcanine, Ponyta and Rapidash run, leaving a trail of embers.
  - Open Sea: swimmers dive and come up somewhere else with a splash. Magikarp flops out of the water.
  - Add `?busy` to the address (for example `.../pokemon-safari-zone/?busy`) to see the activities much more often, for a demo.
- **Legendary arrivals:** a legendary brings its own weather before it appears: a thunderstorm and a lightning strike for Zapdos, a blizzard for Articuno, a pillar of fire for Moltres, waves of psychic power for Mewtwo and a floating bubble that pops for Mew. With reduced motion turned on, the scene only changes color.
- **Strength boulders:** in Victory Road, Pokémon that can learn HM04 Strength in Red and Blue now and then walk up to a boulder and push it a short way.
- **Ladder and ledge:** in Victory Road, Pokémon sometimes climb the ladder and roam the rock ledge above, looking smaller up there because they are further back. Later they climb back down.
- **Swimming:** in the Open Sea, water Pokémon swim with their lower part under the surface, sitting a little higher or lower each time they move, with the water lapping at them. Further out they get smaller and ride higher in the water so they stay easy to see.
- **Up to 4 at a time:** when a fifth Pokémon arrives, the one that has been there longest wanders off.
- **Depth:** each background has far, middle and near layers. Far layers are hazier and drift more slowly, like a slow camera pan.
- **Sprites:** every Pokémon uses its animated sprite from Pokémon Black and White 2, shiny forms included. Each sprite is drawn at its own pixel size, so bigger Pokémon are bigger.
- **Background style:** the backgrounds are pixel art, at the same pixel size as the sprites, so the Pokémon and the scenes look like one game. Clouds, stars, glows and waves still move. The props (boulders, the Moon Stone, bait, the beach ball, the tall grass a Pokémon hides in, Team Rocket's balloon) are pixel art too. Settings can switch to the outlined drawings or the original flat ones.
- **Rarity:** most Pokémon are common, some are uncommon and a few are rare (final evolutions, legendaries, Snorlax, Lapras, the Eevee evolutions and others). About 1 in 40 is shiny, and you can turn shinies off.
- **Class Pokédex:** every Pokémon the class has spotted is saved, with how many times it was seen. Ones not found yet show as silhouettes. Flip the **Shiny forms** switch to see the shiny Pokédex.
- **Session summary:** press **End session** (or **← Habitats**) and a summary shows how long the class watched, how much of that time it stayed under the goal, its longest quiet stretch, how many times it got too loud, how many Pokémon appeared and how many were new to the Pokédex. A chart shows the volume over the session, red where it went over the goal, with each Pokémon shown at the moment it appeared. Hover or tap the chart for the details at any moment, or open it as a table. **Keep watching** goes back to the same session, and **Done** returns to the habitats.
- **Practice mode:** without a microphone, a slider stands in for the room so you can try everything.

The microphone only measures volume, inside the browser. Nothing is recorded or sent anywhere. Settings and the Pokédex are saved in the browser on that computer.

## Tips for the classroom

- Press **⛶** for full screen and **Space** to pause.
- Watch the meter for a minute while the class works normally, then set the goal just above that.
- If the meter barely moves, raise the microphone sensitivity. If it jumps at every small sound, lower it.

## Files

```
index.html   page layout: home, scene, Pokédex and Settings
style.css    styles, phone layout and reduced motion
pokemon.js   habitats, the Pokémon in each one and their Pokédex heights
scenes.js    the drawn backgrounds for each habitat, in depth layers, in the outlined style
scenes-pixel.js, px/  the pixel art backgrounds, made from scenes.js (see below)
scenes-classic.js  the original flat backgrounds, chosen in Settings
app.js       microphone meter, timing, spawning, fleeing and the Pokédex
```

No build step. The pixel backgrounds are made from the drawings in scenes.js; after changing scenes.js, serve the folder on port 4642 and run `node tools/pixel-render.js` then `python3 tools/pixel-build.py` (needs Playwright and Pillow).

To run it locally, serve the folder (for example `python -m http.server`) and open `http://localhost:8000`. Browsers only allow the microphone on `https` pages or `localhost`.

## Credits

An unofficial fan project, not affiliated with Nintendo, Creatures Inc. or GAME FREAK, who own Pokémon and all related names and art. Pokémon sprites (from Pokémon Black and White 2) load from [PokeAPI/sprites](https://github.com/PokeAPI/sprites), and heights come from [PokeAPI](https://pokeapi.co). Backgrounds are original SVG drawings, also turned into pixel art.
