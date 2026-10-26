"""
Step 2 of making the pixel backgrounds (step 1 is pixel-render.js).
Turns the drawings from step 1 into pixel art: each layer gets its own small
palette (a little bolder than the originals), see-through edges are snapped to
solid or half, and sign text is written in a 3 by 5 pixel font. Writes the
pictures to px/ and the layer markup to scenes-pixel.js.

Run from the project folder: python3 tools/pixel-build.py
Needs Pillow.
"""
import base64, io, json, os
from PIL import Image, ImageEnhance

SRC, OUT = "tools/.pixel", "px"
UNIT = 1600 / 480          # drawing units per pixel
BIG_X, BIG_Y = -800, -900  # where the wide canvas for moving parts starts
COLORS = {"0": 32, "1": 48, "2": 64, "front": 24}

# A 3 by 5 pixel font for the signs (rows top to bottom, 1 = ink)
FONT = {
    "A": "010101111101101", "B": "110101110101110", "C": "011100100100011", "D": "110101101101110",
    "E": "111100110100111", "F": "111100110100100", "G": "011100101101011", "H": "101101111101101",
    "I": "111010010010111", "J": "001001001101010", "K": "101101110101101", "L": "100100100100111",
    "M": "101111111101101", "N": "110101101101101", "O": "010101101101010", "P": "110101110100100",
    "Q": "010101101110011", "R": "110101110101101", "S": "011100010001110", "T": "111010010010010",
    "U": "101101101101111", "V": "101101101101010", "W": "101101111111101", "X": "101101010101101",
    "Y": "101101010010010", "Z": "111001010100111", "0": "111101101101111", "1": "010110010010111",
    "2": "110001010100111", "3": "110001010001110", "4": "101101111001001", "5": "111100110001110",
    "6": "011100110101010", "7": "111001010010010", "8": "010101010101010", "9": "010101011001110",
    ".": "000000000000010", " ": "000000000000000", "'": "010010000000000",
}


def bolder(im):
    """A little more colour and contrast, like the Black and White backdrops."""
    a = im.getchannel("A")
    rgb = ImageEnhance.Contrast(ImageEnhance.Color(im.convert("RGB")).enhance(1.18)).enhance(1.06)
    out = rgb.convert("RGBA")
    out.putalpha(a)
    return out


def snap_alpha(a):
    """Pixel art has no soft edges: glows become a few steps of see-through
    rings, everything else is clear or solid."""
    return a.point(lambda v: 0 if v < 80 else 255 if v >= 224 else 112 if v < 144 else 176)


def palette_for(images, n):
    """One palette for a layer and its moving parts, from their visible pixels."""
    strips = []
    for im in images:
        rgb = im.convert("RGB")
        mask = im.getchannel("A").point(lambda v: 255 if v >= 40 else 0)
        bg = Image.new("RGB", im.size, (0, 0, 0))
        if mask.getbbox():
            box = mask.getbbox()
            crop = Image.composite(rgb, bg, mask).crop(box)
            # Leave out the empty pixels so they do not take a palette slot
            keep = mask.crop(box).tobytes()
            data = crop.tobytes()
            px = b"".join(data[i * 3:i * 3 + 3] for i, m in enumerate(keep) if m)
            strips.append(Image.frombytes("RGB", (len(px) // 3, 1), px))
    width = sum(s.width for s in strips) or 1
    all_px = Image.new("RGB", (width, 1)); x = 0
    for s in strips:
        all_px.paste(s, (x, 0)); x += s.width
    return all_px.quantize(n, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)


def to_palette(im, pal):
    a = snap_alpha(im.getchannel("A"))
    q = im.convert("RGB").quantize(palette=pal, dither=Image.Dither.NONE).convert("RGBA")
    q.putalpha(a)
    return q


def write_text(im, t):
    """Sign text in the pixel font, centred (or started) where the drawing put it."""
    # Letters are 3 pixels wide with 1 between them; a space is 2 wide
    adv = [2 if ch == " " else 4 for ch in t["text"]]
    w = sum(adv) - 1
    x = round(t["x"] - (w / 2 if t["anchor"] == "middle" else w if t["anchor"] == "end" else 0))
    y = round(t["y"]) - 5
    hexc = t["fill"].lstrip("#")
    if len(hexc) == 3:
        hexc = "".join(c * 2 for c in hexc)
    color = tuple(int(hexc[i:i + 2], 16) for i in (0, 2, 4)) + (255,)
    for n, ch in enumerate(t["text"].upper()):
        glyph = FONT.get(ch, FONT[" "])
        left = x + sum(adv[:n])
        for k, bit in enumerate(glyph):
            if bit == "1":
                px, py = left + k % 3, y + k // 3
                if 0 <= px < im.width and 0 <= py < im.height:
                    im.putpixel((px, py), color)


def data_uri(im):
    buf = io.BytesIO()
    im.save(buf, "PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


def esc(s):
    return s.replace("&", "&amp;").replace('"', "&quot;")


def main():
    os.makedirs(OUT, exist_ok=True)
    manifest = json.load(open(f"{SRC}/manifest.json"))
    out = {}
    for key, layers in manifest.items():
        out[key] = {"layers": []}
        thumb = Image.new("RGBA", (480, 270), (0, 0, 0, 255))
        for layer in layers:
            name = layer["name"]
            still = bolder(Image.open(f"{SRC}/{key}-{name}.png").convert("RGBA"))
            moving = [bolder(Image.open(f"{SRC}/{f['file']}").convert("RGBA")) for f in layer["fx"]]
            pal = palette_for([still] + moving, COLORS[name])
            still = to_palette(still, pal)
            for t in layer["texts"]:
                write_text(still, t)
            still.save(f"{OUT}/{key}-{name}.png", optimize=True)
            parts = [f'<image href="{OUT}/{key}-{name}.png" width="1600" height="900"/>']
            thumb_parts = [still]
            for f, im in zip(layer["fx"], moving):
                im = to_palette(im, pal)
                box = im.getbbox()
                if not box:
                    continue
                crop = im.crop(box)
                x, y = BIG_X + box[0] * UNIT, BIG_Y + box[1] * UNIT
                attrs = f' class="{esc(f["cls"])}"' + (f' style="{esc(f["style"])}"' if f["style"] else "") + (f' opacity="{f["opacity"]}"' if f["opacity"] else "")
                parts.append(f'<g{attrs}><image href="{data_uri(crop)}" x="{x:.2f}" y="{y:.2f}" width="{crop.width * UNIT:.2f}" height="{crop.height * UNIT:.2f}"/></g>')
                # The home screen picture shows moving parts where they rest
                if "fx-shoot" not in f["cls"]:
                    rest = Image.new("RGBA", (480, 270))
                    rest.paste(crop, (box[0] + round(BIG_X / UNIT), box[1] + round(BIG_Y / UNIT)))
                    if f["opacity"]:
                        rest.putalpha(rest.getchannel("A").point(lambda v, o=float(f["opacity"]): int(v * o)))
                    thumb_parts.append(rest)
            svg = f'<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">{"".join(parts)}</svg>'
            if name == "front":
                out[key]["front"] = svg
            else:
                out[key]["layers"].append(svg)
                for p in thumb_parts:
                    thumb.alpha_composite(p)
        thumb.save(f"{OUT}/{key}-thumb.png", optimize=True)
        out[key]["thumb"] = f'<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg"><image href="{OUT}/{key}-thumb.png" width="1600" height="900"/></svg>'
        print(key, "done")
    with open("scenes-pixel.js", "w") as fh:
        fh.write("/*\n  Pixel art backgrounds, made from the drawings in scenes.js by\n"
                 "  tools/pixel-render.js and tools/pixel-build.py. Do not edit by hand:\n"
                 "  change scenes.js and run both tools again. Where things stand (ground,\n"
                 "  water, ledge and so on) still comes from scenes.js.\n*/\n")
        fh.write("window.SCENES_PIXEL = " + json.dumps(out, separators=(",", ":")) + ";\n")


main()
