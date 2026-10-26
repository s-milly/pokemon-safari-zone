"""
Redraws the fossil pictures in art/ in the style of the Pewter City wall, so
they look carved into the rock instead of pasted on: a few flat sandstone
tones by brightness (light bone for the shell, darker rock below), and a
darker coloured outline in place of black, like the rest of the drawings.

Reads art/helix-fossil.png and art/dome-fossil.png, writes art/*-wall.png.
Run from the project folder: python3 tools/fossil-style.py
Needs Pillow.
"""
import numpy as np
from PIL import Image, ImageFilter

# Darkest to lightest: rock in shadow, rock, lit rock, bone, lit bone
RAMP = np.array([(0x9a, 0x5a, 0x34), (0xbb, 0x7a, 0x4a), (0xd6, 0x9e, 0x6a), (0xec, 0xc8, 0x92), (0xfa, 0xe4, 0xb8)], float)
LINE = np.array((0x6e, 0x3a, 0x20), float)


def restyle(src, out):
    im = Image.open(src).convert("RGBA")
    # Flatten the painted shading into even areas first
    rgb = im.convert("RGB").filter(ImageFilter.MedianFilter(3))
    a = np.asarray(im.getchannel("A")) >= 128
    c = np.asarray(rgb).astype(float)
    lum = (0.3 * c[..., 0] + 0.59 * c[..., 1] + 0.11 * c[..., 2]) / 255
    seen = lum[a]
    # Bands by where each pixel sits among this picture's own brightnesses
    cuts = np.quantile(seen, [0.12, 0.3, 0.55, 0.85])
    band = np.searchsorted(cuts, lum)
    res = RAMP[band]
    # The picture's own dark lines become the wall's outline colour
    res[lum < max(0.2, np.quantile(seen, 0.05))] = LINE
    # And a line all round the outside, as on everything else in the scene
    edge = a & ~np.asarray(Image.fromarray((a * 255).astype("uint8")).filter(ImageFilter.MinFilter(3))).astype(bool)
    res[edge] = LINE
    rgba = np.dstack([res.astype("uint8"), (a * 255).astype("uint8")])
    Image.fromarray(rgba, "RGBA").save(out, optimize=True)
    print(out)


for name in ("helix", "dome"):
    restyle(f"art/{name}-fossil.png", f"art/{name}-fossil-wall.png")
