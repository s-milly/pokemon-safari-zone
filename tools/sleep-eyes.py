"""
Makes the sleeping sprites: when Jigglypuff sings on Route 1, the Pokémon
that fall asleep show these, with their eyes closed. Each one is the first
frame of the Black and White 2 sprite (normal and shiny), with each eye
painted over in the colour of the face around it and a dark line for the
closed lid. Writes px/sleep/<id>.png and px/sleep/shiny/<id>.png.

Run from the project folder: python3 tools/sleep-eyes.py
Needs Pillow and an internet connection (the sprites come from PokeAPI).
"""
import io, os, urllib.request
import numpy as np
from PIL import Image

URL = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/{}{}.gif"

# Each eye as a box of sprite pixels: left, top, right, bottom (inclusive)
EYES = {
    16: [[10, 14, 15, 18]],
    17: [[31, 53, 36, 58]],
    18: [[9, 9, 15, 14]],
    19: [[10, 23, 14, 26]],
    20: [[17, 15, 21, 16]],
    21: [[7, 9, 11, 15]],
    22: [[15, 31, 21, 36]],
    40: [[11, 43, 17, 50], [24, 43, 31, 50]],
    52: [[9, 31, 13, 35], [19, 32, 23, 36]],
    53: [[15, 11, 20, 16], [6, 11, 12, 19]],
    56: [[20, 30, 26, 36], [30, 32, 35, 36]],
    57: [[26, 24, 31, 28], [37, 24, 41, 29]],
    83: [[10, 11, 16, 19], [19, 11, 23, 18]],
    108: [[33, 5, 36, 8]],
    133: [[5, 20, 8, 25], [15, 22, 17, 26]]
}
# A pixel of plain face, where the ring round the eye is a different colour
SKIN_AT = {40: (21, 47)}


def close_eyes(im, boxes, skin_at=None):
    a = np.asarray(im).copy()
    h, w = a.shape[:2]
    shown = a[a[:, :, 3] > 0][:, :3].astype(int)
    line = tuple(int(v) for v in shown[shown.sum(1).argmin()]) + (255,)  # the darkest outline colour
    for x0, y0, x1, y1 in boxes:
        ring = [tuple(int(v) for v in a[y, x]) for x in range(x0 - 1, x1 + 2) for y in (y0 - 1, y1 + 1) if 0 <= x < w and 0 <= y < h]
        ring += [tuple(int(v) for v in a[y, x]) for y in range(y0, y1 + 1) for x in (x0 - 1, x1 + 1) if 0 <= x < w and 0 <= y < h]
        ring = [c for c in ring if c[3] > 0 and sum(c[:3]) / 3 > 80]
        skin = max(set(ring), key=ring.count) if ring else (200, 160, 120, 255)
        if skin_at:
            skin = tuple(int(v) for v in a[skin_at[1], skin_at[0]])
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                if a[y, x, 3] > 0:
                    a[y, x] = skin
        # The closed lid: a short dark line, one pixel lower in the middle
        mid = y0 + (y1 - y0 + 1) // 2
        for x in range(x0, x1 + 1):
            y = mid + (1 if x0 < x < x1 and x1 - x0 >= 3 else 0)
            if a[y, x, 3] > 0:
                a[y, x] = line
    return Image.fromarray(a, "RGBA")


for folder, prefix in (("px/sleep", ""), ("px/sleep/shiny", "shiny/")):
    os.makedirs(folder, exist_ok=True)
    for pid, boxes in EYES.items():
        gif = Image.open(io.BytesIO(urllib.request.urlopen(URL.format(prefix, pid)).read()))
        gif.seek(0)
        close_eyes(gif.convert("RGBA"), boxes, SKIN_AT.get(pid)).save(f"{folder}/{pid}.png", optimize=True)
        print(folder, pid)
