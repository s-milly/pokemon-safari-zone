"""
Slows down sprites whose animation is too fast to read. Venomoth's Black and
White 2 sprite changes its wings every 40 ms, jumping between open and shut
so it flickers. This keeps every pose but shows each for POSE_MS instead.
Writes px/anim/<id>.png and px/anim/shiny/<id>.png (animated PNG).

Sprites in STILL keep only their first pose. Voltorb's sprite lunges forward
and back, which looked wrong on top of the roll the game gives it.

Run from the project folder: python3 tools/slow-sprites.py
Needs Pillow and numpy, and an internet connection (the sprites come from PokeAPI).
"""
import io, os, urllib.request
import numpy as np
from PIL import Image

URL = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/{}{}.gif"
POSE_MS = {49: 100}
STILL = {100}

for folder, prefix in (("px/anim", ""), ("px/anim/shiny", "shiny/")):
    os.makedirs(folder, exist_ok=True)
    for pid, ms in POSE_MS.items():
        gif = Image.open(io.BytesIO(urllib.request.urlopen(URL.format(prefix, pid)).read()))
        poses, times = [], []
        for k in range(gif.n_frames):
            gif.seek(k)
            frame = gif.convert("RGBA")
            # Repeated frames only hold a pose longer: keep one of each, with its share of time
            if poses and np.array_equal(np.asarray(frame), np.asarray(poses[-1])):
                times[-1] += gif.info.get("duration", 100)
            else:
                poses.append(frame); times.append(gif.info.get("duration", 100))
        fast = min(times)
        durations = [round(t / fast * ms) for t in times]
        poses[0].save(f"{folder}/{pid}.png", save_all=True, append_images=poses[1:], duration=durations, loop=0, disposal=1, optimize=True)
        print(folder, pid, len(poses), "poses,", sum(durations), "ms a loop")

for folder, prefix in (("px/anim", ""), ("px/anim/shiny", "shiny/")):
    for pid in STILL:
        Image.open(io.BytesIO(urllib.request.urlopen(URL.format(prefix, pid)).read())).convert("RGBA").save(f"{folder}/{pid}.png", optimize=True)
        print(folder, pid, "still")
