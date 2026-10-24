# Pokémon Safari Zone

A classroom volume game. Put a habitat up on the board and press Start. While the class stays under the volume goal, wild Pokémon come out one at a time. If it gets too loud, they run away.

**[Play it](https://s-milly.github.io/pokemon-safari-zone/)**

## How it works

- **All 151 original Pokémon:** every Pokémon from Red, Blue and Yellow lives in exactly one of twelve habitats, listed in the order you reach them in Red and Blue: Route 1, Viridian Forest, Pewter City, Mt. Moon, Open Sea (with the S.S. Anne), Lavender Town, Saffron City, Safari Zone, Power Plant, Seafoam Islands, Cinnabar Island and Victory Road.
- **Quiet time:** the microphone measures how loud the room is. While the class stays under the goal, a new Pokémon appears about every 1 to 2 minutes of quiet (the exact wait is random each time, and Settings can make it faster or slower).
- **Too loud:** if the room stays over the goal for more than half a second, every Pokémon on screen flees and the wait starts over. In Settings you can switch this so the scene pauses instead, and the Pokémon come back once it is quiet again.
- **Wandering:** Pokémon walk slowly around the habitat and turn to face the way they are going. Their size comes from their Pokédex height, scaled down so a 9 meter Onix still fits on screen next to a 30 centimeter Caterpie.
- **Strength boulders:** in Victory Road, Pokémon that can learn HM04 Strength in Red and Blue now and then walk up to a boulder and push it a short way.
- **Ladder and ledge:** in Victory Road, Pokémon sometimes climb the ladder and roam the rock ledge above, looking smaller up there because they are further back. Later they climb back down.
- **Swimming:** in the Open Sea, and in the sea channel at Seafoam Islands, water Pokémon swim half under the surface, sitting higher or lower each time they move. Pokémon that cannot swim stay out of the water.
- **Up to 4 at a time:** when a fifth Pokémon arrives, the one that has been there longest wanders off.
- **Depth:** each background has far, middle and near layers. Far layers are hazier and drift more slowly, like a slow camera pan.
- **Rarity:** most Pokémon are common, some are uncommon and a few are rare (final evolutions, legendaries, Snorlax, Lapras, the Eevee evolutions and others). About 1 in 40 is shiny, and you can turn shinies off.
- **Class Pokédex:** every Pokémon the class has spotted is saved, with how many times it was seen. Ones not found yet show as silhouettes. Flip the **Shiny forms** switch to see the shiny Pokédex.
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
scenes.js    the drawn backgrounds for each habitat, in depth layers
app.js       microphone meter, timing, spawning, fleeing and the Pokédex
```

No build step. To run it locally, serve the folder (for example `python -m http.server`) and open `http://localhost:8000`. Browsers only allow the microphone on `https` pages or `localhost`.

## Credits

An unofficial fan project, not affiliated with Nintendo, Creatures Inc. or GAME FREAK, who own Pokémon and all related names and art. Pokémon artwork loads from [PokeAPI/sprites](https://github.com/PokeAPI/sprites), and heights come from [PokeAPI](https://pokeapi.co). Backgrounds are original SVG drawings.
