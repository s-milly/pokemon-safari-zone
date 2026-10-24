# Quiet Safari Zone

A classroom volume game. Put a habitat up on the board and press Start. While the class stays under the volume goal, wild Pokémon come out one at a time. If it gets too loud, they run away.

**[Play it](https://s-milly.github.io/pokemon-safari-zone/)**

## How it works

- **Nine habitats:** Viridian Forest, Safari Zone, Open Sea, Mt. Moon Cave, Fossil Dig, Volcano, Frozen Peak, Haunted Tower and Night Sky. Each has 12 to 14 Pokémon.
- **Quiet time:** the microphone measures how loud the room is. Every time the class stays under the goal for the quiet time (20 seconds by default), a new Pokémon appears.
- **Too loud:** if the room stays over the goal for more than half a second, every Pokémon on screen flees and the wait starts over. In Settings you can switch this so the scene pauses instead, and the Pokémon come back once it is quiet again.
- **Rarity:** most Pokémon are common, some are uncommon and a few are rare. About 1 in 40 is shiny, and you can turn shinies off.
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
pokemon.js   habitats and the Pokémon in each one (edit this to change who appears)
scenes.js    the drawn backgrounds for each habitat
app.js       microphone meter, timing, spawning, fleeing and the Pokédex
```

No build step. To run it locally, serve the folder (for example `python -m http.server`) and open `http://localhost:8000`. Browsers only allow the microphone on `https` pages or `localhost`.

## Credits

An unofficial fan project, not affiliated with Nintendo, Creatures Inc. or GAME FREAK, who own Pokémon and all related names and art. Pokémon artwork loads from [PokeAPI/sprites](https://github.com/PokeAPI/sprites). Backgrounds are original SVG drawings.
