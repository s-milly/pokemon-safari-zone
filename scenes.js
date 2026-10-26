/*
  Hand-drawn SVG backgrounds, one per habitat.
  Each scene has a back layer (behind the Pokémon) and a front layer (grass,
  rocks or waves drawn over their feet). ground is the band, in percent from
  the bottom of the screen, where Pokémon stand. fly lets swimmers go further
  out over open water. With the pixel backgrounds the ground reaches back to
  far, and Pokémon shrink toward horizon (both in drawing units).
  Classes starting with fx- are gentle loops defined in style.css; they stop
  under reduced motion and on the home screen thumbnails.
*/
(function () {
  const W = 1600, H = 900;

  // ---------- Drawing style ----------
  // The official Pokémon artwork has clean coloured outlines (a darker version
  // of each colour, never plain black), flat colours with one lighter tone, and
  // no blur. These helpers give the backgrounds the same look, with soft
  // shading on top like the backdrops in the anime.
  function hsl(hex) {
    const n = parseInt(hex.slice(1).replace(/^(.)(.)(.)$/, "$1$1$2$2$3$3"), 16);
    const r = (n >> 16) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
    let h = 0;
    const sat = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
    if (d) h = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h * 60, sat, l];
  }
  function hex(h, sat, l) {
    const f = k => { const a = sat * Math.min(l, 1 - l), t = (k + h / 30) % 12; return l - a * Math.max(-1, Math.min(t - 3, 9 - t, 1)); };
    return "#" + [0, 8, 4].map(k => Math.round(Math.max(0, Math.min(1, f(k))) * 255).toString(16).padStart(2, "0")).join("");
  }
  // Line colour: darker and a little richer. Greys and whites get a cool blue line.
  function line(c) {
    const [h, sat, l] = hsl(c);
    return sat < 0.12 ? hex(222, 0.28, l * 0.62) : hex(h, Math.min(1, sat * 1.1 + 0.08), l * 0.58);
  }
  const light = (c, k) => { const [h, sat, l] = hsl(c); return hex(h, sat, l + (1 - l) * k); };
  const shade = (c, k) => { const [h, sat, l] = hsl(c); return hex(h, Math.min(1, sat * 1.05), l * (1 - k)); };
  function mix(a, b, t) {
    const rgb = c => { const n = parseInt(c.slice(1), 16); return [n >> 16, n >> 8 & 255, n & 255]; };
    const A = rgb(a), B = rgb(b);
    return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
  }

  // Outline every flat-coloured shape in a layer. Small sparkles, see-through
  // glows and anything marked data-noink are left alone.
  function ink(markup, width) {
    return markup.replace(/<(path|circle|ellipse|rect|polygon|g)\b([^>]*?)(\/?)>/g, (all, tag, attrs, close) => {
      const color = /\bfill="(#[0-9a-fA-F]{3,6})"/.exec(attrs);
      if (!color || /\bstroke=|data-noink|\bclass=|clip-path/.test(attrs)) return all;
      const opacity = /\bopacity="([\d.]+)"/.exec(attrs);
      if (opacity && Number(opacity[1]) < 0.6) return all;
      const num = name => Number((new RegExp(`\\b${name}="([\\d.]+)"`).exec(attrs) || [])[1] ?? Infinity);
      if (tag === "circle" && num("r") < 6) return all;
      if (tag === "rect" && (num("width") < 12 || num("height") < 12)) return all;
      return `<${tag}${attrs} stroke="${line(color[1])}" stroke-width="${width}" stroke-linejoin="round"${close}>`;
    });
  }

  function rng(seed) {
    let s = seed % 2147483647 || 1;
    return () => (s = s * 16807 % 2147483647) / 2147483647;
  }

  // Gradients and clips defined right where they are used. Every id is unique
  // across all the scenes, since the home screen shows them side by side.
  let uidN = 0;
  const uid = p => p + (++uidN);
  const stops = list => list.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}"${a < 1 ? ` stop-opacity="${a}"` : ""}/>`).join("");
  function lin(list, x1, y1, x2, y2) {
    const id = uid("lg");
    return { def: `<defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops(list)}</linearGradient></defs>`, url: `url(#${id})` };
  }
  function rad(list, cx, cy, r, ry = r) {
    const id = uid("rg");
    return { def: `<defs><radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${r}" gradientTransform="translate(${cx} ${cy}) scale(1 ${ry / r}) translate(${-cx} ${-cy})">${stops(list)}</radialGradient></defs>`, url: `url(#${id})` };
  }
  function clip(shapes) {
    const id = uid("cp");
    return { def: `<defs><clipPath id="${id}">${shapes}</clipPath></defs>`, url: `url(#${id})` };
  }
  // A soft round light, brightest in the middle
  function glowAt(cx, cy, r, color, k = 0.9, cls = "", ry = r) {
    const g = rad([[0, color, k], [0.35, color, k * 0.4], [1, color, 0]], cx, cy, r, ry);
    return g.def + `<ellipse${cls ? ` class="${cls}"` : ""} cx="${cx}" cy="${cy}" rx="${r}" ry="${ry}" fill="${g.url}"/>`;
  }

  // A wavy ridge from the left edge to the right, filled down to the bottom.
  // Returns the shape and a function giving the height of its top edge at x.
  function ridgeShape(y, amp, bumps, seed) {
    const r = rng(seed);
    const step = W / bumps;
    const pts = [y + (r() - 0.5) * amp], ctrl = [];
    let d = `M0 ${H} L0 ${pts[0]}`;
    for (let i = 1; i <= bumps; i++) {
      const x = i * step, cy = y + (r() - 0.5) * amp * 2;
      ctrl.push(cy - amp * r());
      pts.push(y + (r() - 0.5) * amp);
      d += ` Q${x - step / 2} ${ctrl[i - 1]} ${x} ${pts[i]}`;
    }
    d += ` L${W} ${H} Z`;
    const top = x => {
      const i = Math.max(0, Math.min(bumps - 1, Math.floor(x / step))), t = Math.max(0, Math.min(1, x / step - i));
      return (1 - t) * (1 - t) * pts[i] + 2 * t * (1 - t) * ctrl[i] + t * t * pts[i + 1];
    };
    return { d, top };
  }

  // A ridge of land. tex adds marks on its face: "grass", "rock" or "sand"
  function ridge(y, amp, bumps, fill, seed, extra = "", tex = "") {
    const { d, top } = ridgeShape(y, amp, bumps, seed);
    if (!fill.startsWith("#") || fill === "#000") return `<path d="${d}" fill="${fill}" ${extra}/>`;
    // A lit rim along the top edge, then a body that darkens as it goes down
    const body = lin([[0, light(fill, 0.08)], [0.3, fill], [1, shade(fill, 0.26)]], 0, y - amp, 0, Math.min(H + 200, y + 420));
    let out = body.def + `<path d="${d}" fill="${light(fill, 0.22)}" ${extra}/><path data-noink d="${d}" transform="translate(0 9)" fill="${body.url}" ${extra}/>`;
    if (tex) {
      const r = rng(seed * 7 + 3), mark = shade(fill, 0.16), hi = light(fill, 0.3);
      let marks = "", lits = "";
      const n = tex === "rock" ? 26 : 70;
      for (let i = 0; i < n; i++) {
        const x = r() * W, depth = 22 + r() * r() * 200, yy = top(x) + 9 + depth, k = 0.6 + depth / 160;
        if (yy > H - 4) continue;
        if (tex === "grass") marks += `<path d="M${(x - 5 * k).toFixed(0)} ${yy.toFixed(0)} q${2 * k} ${-6 * k} ${3 * k} ${-11 * k} M${(x + 1 * k).toFixed(0)} ${yy.toFixed(0)} q${2 * k} ${-5 * k} ${6 * k} ${-8 * k}"/>`;
        else if (tex === "rock") { const w = 30 + r() * 50; marks += `<path d="M${x.toFixed(0)} ${yy.toFixed(0)} q${w / 2} ${-6 - r() * 6} ${w} 0 l${8 + r() * 10} ${6 + r() * 6}"/>`; lits += `<path d="M${(x + 4).toFixed(0)} ${(yy - 5).toFixed(0)} q${w / 3} -5 ${w * 0.6} -2"/>`; }
        else marks += `<path d="M${x.toFixed(0)} ${yy.toFixed(0)} q${8 * k} -3 ${16 * k} 0"/>`;
      }
      out += `<g data-noink fill="none" stroke="${mark}" stroke-width="${tex === "rock" ? 3 : 2.5}" stroke-linecap="round" opacity=".75">${marks}</g>`;
      if (lits) out += `<g data-noink fill="none" stroke="${hi}" stroke-width="2.5" stroke-linecap="round" opacity=".6">${lits}</g>`;
    }
    return out;
  }

  // Blades of grass along a line, with a lit edge on each blade
  function tufts(y, fill, count, seed, height = 60) {
    const r = rng(seed);
    let out = "", lit = "";
    for (let i = 0; i < count; i++) {
      const x = (i + r() * 0.8) * (W / count), h = height * (0.6 + r() * 0.7), w = 14 + r() * 16, tip = x + r() * 18 - 9;
      out += `<path d="M${x - w} ${y} Q${x - w * 0.2} ${y - h * 0.6} ${tip} ${y - h} Q${x + w * 0.1} ${y - h * 0.5} ${x + w} ${y} Z" fill="${fill}"/>`;
      lit += `<path d="M${x - w * 0.55} ${y} Q${x - w * 0.15} ${y - h * 0.55} ${tip} ${y - h} Q${x - w * 0.05} ${y - h * 0.45} ${x - w * 0.05} ${y} Z"/>`;
    }
    return out + `<g data-noink fill="${light(fill, 0.22)}">${lit}</g>`;
  }

  // A patch of tall grass like the games': rows of leafy clumps, darker at the
  // back and lighter at the front. Each row is outlined as one shape (drawn
  // once with a thick line, then again on top without it).
  function tallGrass(cx, baseY, width, seed) {
    const r = rng(seed);
    const blade = (x, y, w, h, lean) => `<path d="M${x - w} ${y} Q${x - w * 0.8 + lean * 0.3} ${y - h * 0.65} ${x + lean} ${y - h} Q${x + w * 0.8 + lean * 0.3} ${y - h * 0.65} ${x + w} ${y} Z"/>`;
    const vein = (x, y, h, lean) => `<path d="M${x} ${y - 4} Q${x + lean * 0.2} ${y - h * 0.5} ${x + lean * 0.8} ${y - h * 0.88}"/>`;
    let out = `<ellipse data-noink cx="${cx}" cy="${baseY + 12}" rx="${width * 0.56}" ry="16" fill="#2f6a33" opacity=".3"/>`;
    [[-18, "#3a8a3c", 0.8, 0.8], [-6, "#4c9f47", 0.92, 0.9], [8, "#61b654", 1, 1]].forEach(([dy, fill, k, wk]) => {
      const w = width * wk, n = Math.round(w / 46);
      let blades = "", veins = "";
      for (let i = 0; i < n; i++) {
        const x = cx - w / 2 + (i + 0.5) * (w / n) + (r() - 0.5) * 8;
        // The patch is a soft mound: clumps get shorter towards the ends
        const t = Math.abs(x - cx) / (w / 2), h = (44 + r() * 10) * k * (1 - t * t * 0.55);
        blades += blade(x - 13, baseY + dy, 12, h * 0.75, -12) + blade(x + 13, baseY + dy, 12, h * 0.75, 12) + blade(x, baseY + dy + 2, 15, h, 2);
        veins += vein(x, baseY + dy + 2, h, 2) + vein(x - 13, baseY + dy, h * 0.75, -12) + vein(x + 13, baseY + dy, h * 0.75, 12);
      }
      out += `<g data-noink fill="${fill}" stroke="${line(fill)}" stroke-width="6" stroke-linejoin="round">${blades}</g><g data-noink fill="${fill}">${blades}</g>` +
        `<g data-noink fill="none" stroke="${light(fill, 0.3)}" stroke-width="3" stroke-linecap="round" opacity=".8">${veins}</g>`;
    });
    return out;
  }

  function dots(count, seed, fill, yMin, yMax, rMax, cls = "") {
    const r = rng(seed);
    let out = "";
    for (let i = 0; i < count; i++) {
      const delay = cls ? ` style="animation-delay:-${(r() * 8).toFixed(1)}s;animation-duration:${(3 + r() * 5).toFixed(1)}s"` : "";
      out += `<circle class="${cls}" cx="${(r() * W).toFixed(0)}" cy="${(yMin + r() * (yMax - yMin)).toFixed(0)}" r="${(0.6 + r() * rMax).toFixed(1)}" fill="${fill}"${delay}/>`;
    }
    return out;
  }

  // Little four-petal flowers scattered over a band of ground
  function flowers(count, seed, yMin, yMax, colors, size = 1) {
    const r = rng(seed);
    let out = "";
    for (let i = 0; i < count; i++) {
      const x = r() * W, y = yMin + r() * (yMax - yMin), k = size * (0.7 + (y - yMin) / (yMax - yMin + 1) * 0.6), c = colors[i % colors.length], p = 3.4 * k;
      out += `<g fill="${c}"><circle cx="${(x - p).toFixed(1)}" cy="${y.toFixed(1)}" r="${p.toFixed(1)}"/><circle cx="${(x + p).toFixed(1)}" cy="${y.toFixed(1)}" r="${p.toFixed(1)}"/><circle cx="${x.toFixed(1)}" cy="${(y - p).toFixed(1)}" r="${p.toFixed(1)}"/><circle cx="${x.toFixed(1)}" cy="${(y + p).toFixed(1)}" r="${p.toFixed(1)}"/></g><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(p * 0.7).toFixed(1)}" fill="${c === "#ffd84a" ? "#f08a24" : "#ffd84a"}"/>`;
    }
    return out;
  }

  // A twinkle: a four-pointed star
  const star = (x, y, s, fill, cls = "", style = "") => `<path${cls ? ` class="${cls}"` : ""}${style ? ` style="${style}"` : ""} data-noink d="M${x} ${y - 9 * s} Q${x + 1.5 * s} ${y - 1.5 * s} ${x + 9 * s} ${y} Q${x + 1.5 * s} ${y + 1.5 * s} ${x} ${y + 9 * s} Q${x - 1.5 * s} ${y + 1.5 * s} ${x - 9 * s} ${y} Q${x - 1.5 * s} ${y - 1.5 * s} ${x} ${y - 9 * s} Z" fill="${fill}"/>`;
  function stars(count, seed, yMax, fill) {
    const r = rng(seed);
    let out = "";
    for (let i = 0; i < count; i++) out += star(Math.round(r() * W), Math.round(r() * yMax), 0.5 + r() * 0.6, fill, "fx-twinkle", `animation-delay:-${(r() * 4).toFixed(1)}s`);
    return out;
  }

  // A pine tree in three tiers, lit on the side facing the sun (side 1 is right)
  function pine(x, baseY, h, fill, side = 1, snow = "") {
    const w = h * 0.36, lit = light(fill, 0.2), sd = side;
    let out = `<rect data-noink x="${x - w * 0.06}" y="${baseY - h * 0.1}" width="${w * 0.12}" height="${h * 0.1}" fill="${shade(fill, 0.3)}"/>`;
    for (let k = 0; k < 3; k++) {
      const top = baseY - h + k * h * 0.22, bot = k === 2 ? baseY - h * 0.08 : baseY - h * 0.52 + k * h * 0.2, hw = w * (0.5 + k * 0.25), dip = h * 0.06;
      out += `<path d="M${x} ${top} L${x + hw} ${bot} Q${x} ${bot - dip} ${x - hw} ${bot} Z" fill="${fill}"/>` +
        `<path data-noink d="M${x} ${top} L${x + sd * hw} ${bot} Q${x + sd * hw / 2} ${bot - dip / 2} ${x} ${bot - dip / 2} Z" fill="${lit}"/>`;
      if (snow) out += `<path data-noink d="M${x} ${top} L${x + hw * 0.42} ${top + (bot - top) * 0.42} Q${x + hw * 0.2} ${top + (bot - top) * 0.34} ${x} ${top + (bot - top) * 0.4} Q${x - hw * 0.2} ${top + (bot - top) * 0.34} ${x - hw * 0.42} ${top + (bot - top) * 0.42} Z" fill="${snow}"/>`;
    }
    return out;
  }
  function pines(baseY, count, fill, seed, size, side = 1, snow = "") {
    const r = rng(seed);
    let out = "";
    for (let i = 0; i < count; i++) {
      const x = (i + r() * 0.6) * (W / count), h = size * (0.7 + r() * 0.6);
      out += pine(x, baseY, h, fill, side, snow);
    }
    return out;
  }

  // A round leafy tree, shaded underneath and lit on the side facing the sun.
  // The leaves are outlined as one shape: drawn once with a thick line, then
  // again on top without one, so only the outside edge shows
  function tree(x, y, s, dark, lit, trunk, side = 1) {
    const at = (dx, dy) => `${x + dx * s * side} ${y + dy * s}`;
    const crown = [[-50, -150, 70], [45, -160, 75], [0, -220, 85], [-92, -205, 46], [90, -212, 48]]
      .map(([dx, dy, r]) => `<circle cx="${x + dx * s}" cy="${y + dy * s}" r="${r * s}"/>`).join("");
    const lw = Math.max(2.5, 5 * s), c = clip(crown), r = rng(Math.round(x * 7 + y));
    let leaves = "";
    for (let i = 0; i < 22; i++) {
      const lx = x + (r() - 0.5) * 230 * s, ly = y - (120 + r() * 170) * s;
      leaves += `<path d="M${lx.toFixed(0)} ${ly.toFixed(0)} q${6 * s} ${7 * s} ${13 * s} 0"/>`;
    }
    return `<ellipse data-noink cx="${x + 14 * s * side}" cy="${y + 3 * s}" rx="${105 * s}" ry="${15 * s}" fill="${shade(dark, 0.55)}" opacity=".28"/>` +
      `<path d="M${at(-26, 0)} Q${at(-10, -8)} ${at(-11, -40)} L${at(-8, -150)} L${at(8, -150)} L${at(11, -40)} Q${at(10, -8)} ${at(26, 0)} Z" fill="${trunk}"/>` +
      `<path data-noink d="M${at(2, -150)} L${at(8, -150)} L${at(11, -40)} Q${at(10, -8)} ${at(26, 0)} L${at(6, 0)} Z" fill="${light(trunk, 0.18)}"/>` +
      `<path data-noink d="M${at(-4, -30)} q${-2 * s} ${-20 * s} 0 ${-40 * s} M${at(4, -80)} q${2 * s} ${-14 * s} 0 ${-28 * s}" stroke="${shade(trunk, 0.3)}" stroke-width="${lw * 0.6}" fill="none" stroke-linecap="round"/>` +
      `<g data-noink fill="${dark}" stroke="${line(dark)}" stroke-width="${lw * 2}">${crown}</g><g data-noink fill="${dark}">${crown}</g>` +
      // Shade under the crown, and small leaf marks over it
      c.def + `<g clip-path="${c.url}"><ellipse data-noink cx="${x - 20 * s * side}" cy="${y - 92 * s}" rx="${190 * s}" ry="${78 * s}" fill="${shade(dark, 0.22)}"/>` +
      `<g fill="none" stroke="${shade(dark, 0.3)}" stroke-width="${lw * 0.5}" stroke-linecap="round" opacity=".7">${leaves}</g></g>` +
      // Leaf clumps: lighter on the sunny side, each with its own line
      `<g data-noink fill="${lit}" stroke="${line(dark)}" stroke-width="${lw * 0.6}"><path d="M${at(-35, -235)} a${55 * s} ${55 * s} 0 0 ${side > 0 ? 1 : 0} ${110 * s * side} 0 a${55 * s} ${40 * s} 0 0 ${side > 0 ? 1 : 0} ${-110 * s * side} 0Z"/>` +
      `<path d="M${at(20, -175)} a${40 * s} ${40 * s} 0 0 ${side > 0 ? 1 : 0} ${80 * s * side} 0 a${40 * s} ${28 * s} 0 0 ${side > 0 ? 1 : 0} ${-80 * s * side} 0Z"/>` +
      `<path d="M${at(-80, -222)} a${30 * s} ${30 * s} 0 0 ${side > 0 ? 1 : 0} ${60 * s * side} 0 a${30 * s} ${22 * s} 0 0 ${side > 0 ? 1 : 0} ${-60 * s * side} 0Z"/></g>` +
      `<g data-noink fill="${light(lit, 0.35)}"><ellipse cx="${x + 30 * s * side}" cy="${y - 262 * s}" rx="${22 * s}" ry="${10 * s}"/><ellipse cx="${x + 72 * s * side}" cy="${y - 196 * s}" rx="${14 * s}" ry="${6 * s}"/></g>`;
  }

  // A round bush, outlined as one shape, with optional berries or blossoms
  function bush(x, y, s, fill, berry = "") {
    const parts = [[-62, -28, 36], [-25, -50, 46], [28, -46, 44], [66, -26, 34], [0, -26, 50]]
      .map(([dx, dy, r]) => `<circle cx="${x + dx * s}" cy="${y + dy * s}" r="${r * s}"/>`).join("") + `<ellipse cx="${x}" cy="${y - 6 * s}" rx="${96 * s}" ry="${20 * s}"/>`;
    const c = clip(parts), r = rng(Math.round(x * 3 + y * 5));
    let out = `<ellipse data-noink cx="${x}" cy="${y + 2 * s}" rx="${100 * s}" ry="${12 * s}" fill="${shade(fill, 0.55)}" opacity=".3"/>` +
      `<g data-noink fill="${fill}" stroke="${line(fill)}" stroke-width="${8 * s}">${parts}</g><g data-noink fill="${fill}">${parts}</g>` +
      c.def + `<g clip-path="${c.url}"><ellipse data-noink cx="${x}" cy="${y + 4 * s}" rx="${120 * s}" ry="${34 * s}" fill="${shade(fill, 0.2)}"/></g>` +
      `<g data-noink fill="${light(fill, 0.22)}" stroke="${line(fill)}" stroke-width="${2.5 * s}"><path d="M${x - 58 * s} ${y - 72 * s} a${32 * s} ${28 * s} 0 0 1 ${64 * s} 0 a${32 * s} ${20 * s} 0 0 1 ${-64 * s} 0Z"/><path d="M${x + 12 * s} ${y - 70 * s} a${26 * s} ${22 * s} 0 0 1 ${52 * s} 0 a${26 * s} ${15 * s} 0 0 1 ${-52 * s} 0Z"/></g>`;
    if (berry) for (let i = 0; i < 7; i++) out += `<circle data-noink cx="${(x + (r() - 0.5) * 150 * s).toFixed(1)}" cy="${(y - (14 + r() * 50) * s).toFixed(1)}" r="${(5.5 * s).toFixed(1)}" fill="${berry}" stroke="${line(berry)}" stroke-width="${1.5 * s}"/>`;
    return out;
  }

  // A boulder with a lit top face and a shaded side
  function rock(x, y, s, fill, side = 1) {
    const p = (dx, dy) => `${x + dx * s * side} ${y + dy * s}`;
    return `<ellipse data-noink cx="${x + 8 * s * side}" cy="${y + 2 * s}" rx="${72 * s}" ry="${10 * s}" fill="${shade(fill, 0.6)}" opacity=".3"/>` +
      `<path d="M${p(-62, 0)} L${p(-50, -34)} L${p(-16, -52)} L${p(30, -46)} L${p(58, -20)} L${p(64, 0)} Z" fill="${fill}"/>` +
      `<path data-noink d="M${p(-48, -32)} L${p(-16, -50)} L${p(28, -44)} L${p(6, -28)} L${p(-28, -24)} Z" fill="${light(fill, 0.28)}"/>` +
      `<path data-noink d="M${p(28, -44)} L${p(56, -20)} L${p(62, -2)} L${p(18, -2)} L${p(6, -28)} Z" fill="${shade(fill, 0.18)}"/>` +
      `<path data-noink d="M${p(-30, -12)} l${12 * s * side} ${-8 * s} l${10 * s * side} ${4 * s}" stroke="${shade(fill, 0.3)}" stroke-width="${3 * s}" fill="none" stroke-linecap="round"/>`;
  }

  // Big rocks in both front corners, over the Pokémons' feet
  const corner = c => rock(250, 912, 1.1, c) + rock(90, 918, 2.4, c) + rock(1360, 914, 1, c, -1) + rock(1515, 920, 2.5, c, -1);

  // A small house with a two-tone roof, lit windows and a door. y is the ground line
  function house(x, y, w, h, wall, roof, opts = {}) {
    const rh = opts.roofH ?? h * 0.7, glow = opts.glow || "#9fd4f0";
    let out = `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="${wall}"/>` +
      `<rect data-noink x="${x + w * 0.55}" y="${y - h}" width="${w * 0.45}" height="${h}" fill="${shade(wall, 0.08)}"/>`;
    if (opts.chimney) out += `<rect x="${x + w * 0.7}" y="${y - h - rh * 0.8}" width="${w * 0.12}" height="${rh * 0.6}" fill="${shade(wall, 0.25)}"/>`;
    out += `<path d="M${x - 8} ${y - h + 4} L${x + w / 2} ${y - h - rh} L${x + w + 8} ${y - h + 4} Z" fill="${roof}"/>` +
      `<path data-noink d="M${x + w / 2} ${y - h - rh} L${x + w + 8} ${y - h + 4} L${x + w / 2} ${y - h + 4} Z" fill="${shade(roof, 0.16)}"/>` +
      `<path data-noink d="M${x - 4} ${y - h + 2} L${x + w / 2} ${y - h - rh + 5}" stroke="${light(roof, 0.35)}" stroke-width="3" stroke-linecap="round"/>`;
    const ww = Math.max(8, w * 0.16), wy = y - h * 0.62;
    out += `<g fill="${glow}"><rect x="${x + w * 0.12}" y="${wy}" width="${ww}" height="${ww * 0.8}" rx="2"/><rect x="${x + w * 0.88 - ww}" y="${wy}" width="${ww}" height="${ww * 0.8}" rx="2"/></g>` +
      `<rect x="${x + w / 2 - w * 0.1}" y="${y - h * 0.5}" width="${w * 0.2}" height="${h * 0.5}" fill="${opts.door || "#8a6440"}"/>`;
    return out;
  }

  // Puffy cloud: one outline round the outside, a white top and a shaded underside
  function cloud(x, y, s, fill, cls = "fx-drift", under = "") {
    const puffs = `<ellipse cx="${x}" cy="${y}" rx="${120 * s}" ry="${24 * s}"/><circle cx="${x - 66 * s}" cy="${y - 12 * s}" r="${30 * s}"/><circle cx="${x - 22 * s}" cy="${y - 30 * s}" r="${42 * s}"/>` +
      `<circle cx="${x + 34 * s}" cy="${y - 34 * s}" r="${48 * s}"/><circle cx="${x + 82 * s}" cy="${y - 10 * s}" r="${30 * s}"/>`;
    const [, , l] = hsl(fill);
    const tone = under ? mix(fill, under, 0.5) : l > 0.5 ? mix(fill, "#9fc3e8", 0.42) : shade(fill, 0.25);
    const c = clip(puffs);
    return `<g class="${cls}"><g fill="${fill}" stroke="${line(fill)}" stroke-width="${5 * s}">${puffs}</g><g fill="${fill}">${puffs}</g>` +
      c.def + `<g clip-path="${c.url}"><ellipse data-noink cx="${x + 10 * s}" cy="${y + 20 * s}" rx="${150 * s}" ry="${26 * s}" fill="${tone}"/>` +
      `<ellipse data-noink cx="${x + 40 * s}" cy="${y - 2 * s}" rx="${50 * s}" ry="${12 * s}" fill="${mix(fill, tone, 0.45)}"/></g>` +
      `<g data-noink fill="${l > 0.5 ? "#ffffff" : light(fill, 0.18)}" opacity=".9"><ellipse cx="${x - 30 * s}" cy="${y - 50 * s}" rx="${16 * s}" ry="${8 * s}"/><ellipse cx="${x + 26 * s}" cy="${y - 62 * s}" rx="${20 * s}" ry="${9 * s}"/></g></g>`;
  }

  // Sun or moon: a glow, a halo ring and the disc
  function sun(x, y, r, core, halo, rings = true) {
    return glowAt(x, y, r * 4, halo, 0.85) + (rings ? `<circle data-noink cx="${x}" cy="${y}" r="${r * 1.45}" fill="${halo}" opacity=".35"/>` : "") +
      `<circle cx="${x}" cy="${y}" r="${r}" fill="${core}"/><ellipse data-noink cx="${x - r * 0.3}" cy="${y - r * 0.32}" rx="${r * 0.4}" ry="${r * 0.26}" fill="#ffffff" opacity=".55"/>`;
  }

  // Long soft beams of light fanning out from a point
  function rays(x, y, list, color, k = 0.14) {
    // The faint opacity sits on an outer group, since the pulse animation sets its own
    return `<g opacity="${k}"><g class="fx-pulse" fill="${color}">${list.map(([a, b]) => `<path data-noink d="M${x} ${y} L${a} 900 L${b} 900 Z"/>`).join("")}</g></g>`;
  }

  function sky(id, list) {
    return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops(list)}</linearGradient>`;
  }
  function glow(id, color) {
    return `<radialGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity=".9"/><stop offset=".35" stop-color="${color}" stop-opacity=".35"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`;
  }

  const svg = (defs, inner) => `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>${inner}</svg>`;
  // Splits a background into far, middle and near layers (see layered below)
  const L = "\u0000";
  const layered = (defs, inner) => ({ defs, parts: inner.split(L) });
  // Something standing on the ground that a Pokémon can walk behind. base is
  // where it meets the ground, in drawing units. In the pixel backgrounds it is
  // drawn in front of any Pokémon standing further back (see tools/pixel-render.js).
  const stand = (base, inner) => `<g data-stand="${base}">${inner}</g>`;

  const fill = id => `<rect width="${W}" height="${H}" fill="url(#${id})"/>`;
  const range = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join("");

  window.SCENES = {
    forest: {
      far: 640, horizon: 555,
      ground: [6, 26], tint: "#2f6b3a", haze: ["#eef3c8", 560, 0.55],
      back: layered(
        sky("fs", [[0, "#8fc9b4"], [0.35, "#d4ebc4"], [0.6, "#f8f2c4"], [1, "#f8f2c4"]]) +
        sky("fpath", [[0, "#dcc28f"], [1, "#b48f5e"]]) + `<clipPath id="fpclip">${ridge(700, 18, 4, "#000", 13)}</clipPath>`,
        fill("fs") +
        sun(1250, 170, 62, "#fffbe0", "#fff6c4") +
        rays(1250, 170, [[700, 860], [1020, 1130], [420, 520], [1340, 1440]], "#fffbe0", 0.22) +
        cloud(330, 140, 1, "#ffffff") + cloud(720, 92, 0.55, "#ffffff", "fx-drift fx-drift--rev") +
        ridge(450, 50, 4, "#d3e6c2", 2) +
        pines(505, 30, "#b4d3ae", 33, 190) +
        ridge(520, 26, 5, "#9dc79b", 4) +
        pines(545, 24, "#8abd8e", 3, 250) +
        ridge(560, 26, 6, "#73ac81", 5, "", "grass") +
        L + pines(612, 15, "#4b8f5d", 7, 320) +
        // The canopy overhead, dark against the light
        `<g fill="#1f5233">${range(14, i => `<circle cx="${i * 125 - 20}" cy="${-30 + ((i * 37) % 60)}" r="${90 + ((i * 53) % 50)}"/>`)}</g>` +
        `<g data-noink fill="#2c6a40">${range(14, i => `<circle cx="${i * 125 + 10}" cy="${-60 + ((i * 37) % 60)}" r="${60 + ((i * 53) % 40)}"/>`)}</g>` +
        `<g opacity=".2"><g class="fx-pulse" fill="#fffbe0"><path data-noink d="M1180 0 L1320 0 L900 680 L760 680 Z"/><path data-noink d="M1420 0 L1500 0 L1180 680 L1110 680 Z"/><path data-noink d="M820 0 L880 0 L520 680 L470 680 Z"/></g></g>` +
        ridge(628, 24, 5, "#58a163", 11, "", "grass") +
        stand(650, bush(360, 650, 0.85, "#3f8f4f")) + stand(646, bush(1170, 646, 0.95, "#3f8f4f", "#e23b3b")) + stand(636, bush(650, 636, 0.55, "#4a9a57")) +
        stand(690, tree(180, 690, 1.2, "#2f7a45", "#4a9f5a", "#6b4a32")) + stand(680, tree(1420, 680, 1.35, "#2f7a45", "#4a9f5a", "#6b4a32")) +
        L + ridge(700, 18, 4, "#7cc46a", 13, "", "grass") +
        `<path clip-path="url(#fpclip)" d="M700 900 C760 820 820 760 790 670 L830 670 C880 760 900 830 960 900 Z" fill="url(#fpath)" opacity=".85"/>` +
        `<g clip-path="url(#fpclip)" fill="none" stroke="#9d7a4c" stroke-width="3" stroke-linecap="round" opacity=".7"><path d="M702 898 C762 818 822 758 792 672"/><path d="M958 898 C898 828 878 758 828 672"/></g>` +
        `<g fill="#c9ad7c"><ellipse cx="820" cy="760" rx="9" ry="5"/><ellipse cx="850" cy="812" rx="12" ry="6"/><ellipse cx="800" cy="850" rx="10" ry="5"/></g>` +
        `<g fill="#f6fbc8" opacity=".3"><ellipse data-noink cx="420" cy="770" rx="110" ry="18"/><ellipse data-noink cx="1080" cy="800" rx="140" ry="20"/><ellipse data-noink cx="640" cy="840" rx="90" ry="14"/></g>` +
        // Mushrooms among the flowers, and a sign by the path (near the middle so phones see it)
        `<g data-stand="780"><rect x="553" y="756" width="12" height="20" rx="4" fill="#f4ead2"/><path d="M538 760 Q559 730 580 760 Z" fill="#e23b3b"/><g fill="#ffffff"><circle cx="552" cy="750" r="3.5"/><circle cx="566" cy="748" r="3"/></g>` +
        `<rect x="583" y="768" width="9" height="14" rx="3" fill="#f4ead2"/><path d="M572 771 Q588 750 603 771 Z" fill="#e23b3b"/></g>` +
        `<g data-stand="750"><rect x="648" y="690" width="10" height="60" fill="#7a5236"/><rect x="598" y="662" width="110" height="40" rx="6" fill="#a0734a"/><rect data-noink x="598" y="662" width="110" height="10" rx="5" fill="#b8895c"/>` +
        `<text x="653" y="689" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="15" fill="#fff4dc">VIRIDIAN</text></g>` +
        flowers(12, 15, 720, 870, ["#ffffff", "#ffd84a", "#ff9ec4"]) +
        `<g>${dots(26, 21, "#fff3a0", 360, 760, 3, "fx-float")}</g>`
      ),
      front: svg("", tufts(900, "#3f9a49", 60, 17, 90) + tufts(900, "#56b25a", 40, 19, 60) +
        bush(70, 905, 1.25, "#2e7f3c", "#e23b3b") + bush(1545, 910, 1.3, "#2e7f3c", "#e23b3b"))
    },

    route: {
      far: 600, horizon: 515,
      ground: [6, 26], tint: "#3f8f4a", haze: ["#ffe4b8", 540, 0.6],
      back: layered(
        sky("rt", [[0, "#4f8fd8"], [0.32, "#9cc4ec"], [0.56, "#ffe0b0"], [1, "#ffe8c2"]]) +
        sky("rpath", [[0, "#ead6a4"], [1, "#cdae73"]]) + `<clipPath id="rpclip">${ridge(700, 16, 4, "#000", 211)}</clipPath>`,
        fill("rt") +
        sun(1180, 260, 66, "#fffbe6", "#fffaf0") +
        cloud(300, 130, 1.1, "#ffffff") + cloud(860, 200, 0.8, "#ffffff", "fx-drift fx-drift--rev") + cloud(1500, 290, 0.6, "#ffffff") +
        // Far blue mountains with snow on the peaks
        `<path d="M0 470 L120 380 L210 420 L330 330 L450 410 L560 360 L680 440 L1600 440 L1600 470 Z" fill="#d6c6d4"/>` +
        `<path data-noink d="M330 330 L362 354 L340 352 L322 362 L304 350 Z M120 380 L146 400 L128 398 L112 404 L98 397 Z" fill="#f4fbff"/>` +
        `<path d="M1000 450 L1160 360 L1260 400 L1380 320 L1500 390 L1600 360 L1600 470 L1000 470 Z" fill="#e0ccd2"/>` +
        `<path data-noink d="M1380 320 L1410 342 L1390 340 L1374 350 L1358 340 Z" fill="#f4fbff"/>` +
        ridge(470, 40, 4, "#d2dfb0", 201) +
        // Pallet Town on the far hill: little houses and Professor Oak's lab
        `<g transform="translate(980 452)">` +
        house(0, 36, 54, 36, "#f4efe4", "#d9534a", { chimney: true, roofH: 24, glow: "#ffe39a" }) + house(80, 36, 50, 32, "#f4efe4", "#d9534a", { roofH: 22, glow: "#ffe39a" }) +
        `<rect x="160" y="-8" width="96" height="44" fill="#e8ecef"/><rect data-noink x="208" y="-8" width="48" height="44" fill="#d9dfe4"/><path d="M152 -6 L208 -30 L264 -6 Z" fill="#8f9aa6"/><path data-noink d="M208 -30 L264 -6 L208 -6 Z" fill="#7c8793"/>` +
        `<g fill="#9fd4f0"><rect x="172" y="6" width="16" height="12"/><rect x="228" y="6" width="16" height="12"/></g><rect x="200" y="16" width="16" height="20" fill="#6b7a88"/>` +
        `<path d="M250 -24 L250 -50" stroke="#6b7a88" stroke-width="3"/><circle cx="250" cy="-52" r="3" fill="#d9534a"/></g>` +
        // Morning mist lying over the far fields
        `<g class="fx-drift" fill="#fff8e6" opacity=".45"><ellipse cx="300" cy="528" rx="360" ry="16"/><ellipse cx="1150" cy="520" rx="420" ry="18"/></g>` +
        ridge(540, 26, 6, "#abcf7e", 203, "", "grass") +
        // Hedgerows dividing the fields
        `<g fill="#7cb46c"><path d="M60 556 q20 -14 40 0 q20 -14 40 0 q20 -14 40 0 q20 -14 40 0 Z"/><path d="M1240 552 q20 -14 40 0 q20 -14 40 0 q20 -14 40 0 q20 -14 40 0 q20 -14 40 0 Z"/></g>` +
        L + stand(640, tree(140, 640, 0.7, "#3b8a4a", "#58ad63", "#6b4a32", -1)) + stand(630, tree(300, 630, 0.55, "#3b8a4a", "#58ad63", "#6b4a32", -1)) +
        stand(640, tree(1460, 640, 0.75, "#3b8a4a", "#58ad63", "#6b4a32")) + stand(628, tree(1300, 628, 0.5, "#3b8a4a", "#58ad63", "#6b4a32")) +
        ridge(620, 18, 5, "#8cc460", 207, "", "grass") +
        stand(630, bush(560, 630, 0.42, "#5aa55c")) + stand(636, bush(1180, 636, 0.5, "#5aa55c", "#ff8fb1")) +
        `<g data-stand="634"><g fill="#ffffff">${range(12, i => `<rect x="${430 + i * 24}" y="600" width="8" height="34" rx="3"/>`)}<rect x="426" y="608" width="290" height="6" rx="3"/><rect x="426" y="622" width="290" height="6" rx="3"/></g>` +
        `<g data-noink fill="#c8d6e4">${range(12, i => `<rect x="${434 + i * 24}" y="604" width="4" height="30" rx="2"/>`)}</g></g>` +
        `<g data-stand="644"><rect x="1066" y="590" width="8" height="54" fill="#7a5236"/><rect x="1030" y="566" width="80" height="34" rx="5" fill="#a0734a" stroke="#7a5236" stroke-width="4"/><rect x="1034" y="569" width="72" height="7" rx="3" fill="#b8895c"/><text x="1070" y="590" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="18" fill="#fff4dc">ROUTE 1</text></g>` +
        L + ridge(700, 16, 4, "#86cf6b", 211, "", "grass") +
        `<path clip-path="url(#rpclip)" d="M720 900 C760 820 820 760 790 670 L840 670 C880 760 900 830 980 900 Z" fill="url(#rpath)"/>` +
        `<g clip-path="url(#rpclip)" fill="none" stroke="#b39463" stroke-width="3" stroke-linecap="round" opacity=".8"><path d="M722 898 C762 818 822 758 792 672"/><path d="M978 898 C898 828 878 758 838 672"/></g>` +
        `<g fill="#c8ab78"><ellipse cx="828" cy="742" rx="9" ry="4"/><ellipse cx="868" cy="800" rx="12" ry="5"/><ellipse cx="820" cy="852" rx="10" ry="5"/></g>` +
        // Patches of tall grass where wild Pokémon hide
        stand(800, tallGrass(330, 792, 300, 223)) + stand(800, tallGrass(1270, 792, 300, 227)) +
        flowers(14, 213, 712, 880, ["#ffffff", "#ffd84a", "#ff8fb1"])
      ),
      front: svg("", "")
    },

    safari: {
      far: 600, horizon: 515,
      ground: [6, 26], tint: "#8a6a24", haze: ["#fdd9a0", 560, 0.55],
      back: layered(
        sky("ss", [[0, "#e5845e"], [0.32, "#f4b07a"], [0.58, "#fddca5"], [1, "#fde7b5"]]),
        fill("ss") +
        sun(420, 330, 110, "#fff2c2", "#ffd88a") +
        rays(420, 330, [[60, 200], [460, 560], [760, 900], [1100, 1240]], "#fff0c0", 0.14) +
        // Long thin clouds across the evening sky
        `<g class="fx-drift" fill="#f9d2a6"><rect x="140" y="300" width="300" height="16" rx="8"/><rect x="380" y="336" width="240" height="12" rx="6"/><rect x="1180" y="250" width="320" height="16" rx="8"/><rect x="1260" y="280" width="200" height="12" rx="6"/></g>` +
        cloud(1100, 150, 0.9, "#ffe9cf", "fx-drift fx-drift--rev", "#f2b98e") +
        `<g class="fx-drift" fill="none" stroke="#7a5236" stroke-width="4" stroke-linecap="round"><path d="M900 230 q12 -10 24 0 q12 -10 24 0"/><path d="M960 260 q9 -8 18 0 q9 -8 18 0"/><path d="M1010 220 q10 -9 20 0 q10 -9 20 0"/><path d="M850 270 q8 -7 16 0 q8 -7 16 0"/></g>` +
        // Flat-topped mesas with bands of rock
        (() => {
          const m = `<path d="M880 560 L950 430 L1190 430 L1250 560 Z"/><path d="M1250 560 L1295 475 L1430 475 L1470 560 Z"/>`, c = clip(m);
          return `<g fill="#e4ae78">${m}</g>` + c.def + `<g clip-path="${c.url}">` +
            `<g data-noink fill="none" stroke="#d79e6c" stroke-width="5">${range(5, i => `<path d="M860 ${452 + i * 24} q80 ${i % 2 ? 6 : -6} 160 0 t160 0 t160 0 t160 0"/>`)}</g>` +
            `<path data-noink d="M1190 430 L1250 560 L1150 560 Z M1430 475 L1470 560 L1400 560 Z" fill="#cc8d5a"/><path data-noink d="M950 430 L1190 430 L1186 440 L946 440 Z M1295 475 L1430 475 L1427 484 L1291 484 Z" fill="#f2c08a"/></g>`;
        })() +
        L + ridge(560, 20, 6, "#d8c07a", 23, "", "grass") +
        // A watering hole between the trees
        `<ellipse cx="760" cy="600" rx="130" ry="16" fill="#79b5c4"/><ellipse data-noink cx="740" cy="597" rx="70" ry="5" fill="#d6f0f4" opacity=".8"/>` +
        `<g fill="none" stroke="#7b8a3a" stroke-width="4" stroke-linecap="round"><path d="M640 602 q-4 -20 2 -34 M650 604 q2 -16 10 -26 M876 600 q2 -18 -4 -30 M866 602 q-2 -14 -10 -22"/></g>` +
        // Acacia trees: a bent trunk under a wide flat crown
        [[290, 610, 1], [1128, 610, 0.74]].map(([x, y, s]) => stand(y, `<path d="M${x - 6 * s} ${y} Q${x - 10 * s} ${y - 60 * s} ${x} ${y - 110 * s} L${x - 40 * s} ${y - 140 * s} M${x} ${y - 110 * s} L${x + 40 * s} ${y - 142 * s} M${x - 2 * s} ${y - 100 * s} L${x + 6 * s} ${y - 146 * s}" stroke="#4a3626" stroke-width="${12 * s}" fill="none" stroke-linecap="round"/>` +
          `<ellipse cx="${x}" cy="${y - 145 * s}" rx="${135 * s}" ry="${26 * s}" fill="#4a3626"/><ellipse cx="${x + 8 * s}" cy="${y - 158 * s}" rx="${105 * s}" ry="${20 * s}" fill="#5c4630"/>` +
          `<ellipse cx="${x - 70 * s}" cy="${y - 150 * s}" rx="${50 * s}" ry="${14 * s}" fill="#544030"/><ellipse data-noink cx="${x + 20 * s}" cy="${y - 166 * s}" rx="${60 * s}" ry="${8 * s}" fill="#a0703c"/>`)).join("") +
        ridge(640, 20, 5, "#c9b766", 29, "", "grass") +
        L + `<g data-stand="666"><g fill="#8a6440">${range(14, i => `<rect x="${560 + i * 40}" y="610" width="10" height="56" rx="3"/>`)}<rect x="555" y="622" width="540" height="8" rx="3"/><rect x="555" y="646" width="540" height="8" rx="3"/></g>` +
        `<g data-noink fill="#ad8459"><rect x="555" y="622" width="540" height="3" rx="1.5"/><rect x="555" y="646" width="540" height="3" rx="1.5"/></g></g>` +
        ridge(720, 14, 4, "#b7ad5a", 31, "", "grass") +
        stand(772, rock(300, 772, 0.9, "#a99a73")) + stand(778, rock(1300, 778, 0.7, "#a99a73", -1)) +
        flowers(7, 33, 740, 880, ["#ffd84a", "#ffffff", "#f08a5c"], 0.9)
      ),
      front: svg("", tufts(900, "#9c8f3c", 70, 37, 70) + tufts(900, "#c2b45a", 50, 41, 50) + tufts(900, "#d9cb72", 26, 43, 32))
    },

    sea: {
      horizon: 470,
      ground: [8, 34], fly: 0.25, tint: "#1f6fa0",
      // Where the water is, in drawing units of a layer: here, everything below the horizon
      water: { top: 414, bottom: 900, layer: 0 }, haze: ["#fdeccc", 420, 0.4],
      back: layered(
        sky("se", [[0, "#3f93d6"], [0.55, "#a9d6f0"], [0.85, "#fbe4bc"], [1, "#fde6bc"]]) + sky("sw", [[0, "#6cc6e6"], [0.08, "#3ea6d8"], [0.45, "#2783bf"], [1, "#145290"]]),
        `<rect width="${W}" height="420" fill="url(#se)"/><rect y="414" width="${W}" height="${H - 414}" fill="url(#sw)"/>` +
        sun(1260, 250, 64, "#fffbe6", "#fffaf0") +
        cloud(320, 150, 1.1, "#ffffff") + cloud(880, 220, 0.8, "#ffffff", "fx-drift fx-drift--rev") + cloud(1480, 300, 0.55, "#ffffff") +
        // Far islands on the horizon
        `<path d="M60 416 Q150 368 230 378 Q300 344 380 386 Q430 404 470 416 Z" fill="#9fb8c6"/><path data-noink d="M230 378 Q300 344 380 386 L300 380 Z" fill="#b5cad4"/>` +
        `<path d="M1440 416 Q1500 388 1560 396 Q1600 400 1640 416 Z" fill="#a8c0cc"/>` +
        // The S.S. Anne at anchor on the horizon, near the middle so phones see it too
        `<g transform="translate(-480 0)">` +
        `<g class="fx-drift" fill="#c9ced6" opacity=".7"><ellipse cx="1290" cy="200" rx="34" ry="16"/><ellipse cx="1260" cy="176" rx="42" ry="18"/><ellipse cx="1350" cy="212" rx="28" ry="13"/></g>` +
        `<g><rect x="1296" y="228" width="34" height="64" fill="#d9534a"/><rect x="1296" y="228" width="34" height="12" fill="#1e2230"/><rect data-noink x="1318" y="240" width="12" height="52" fill="#b8433c"/>` +
        `<rect x="1356" y="238" width="34" height="54" fill="#d9534a"/><rect x="1356" y="238" width="34" height="12" fill="#1e2230"/><rect data-noink x="1378" y="250" width="12" height="42" fill="#b8433c"/>` +
        `<path d="M1160 318 L1160 238" stroke="#4a5568" stroke-width="4"/><path d="M1160 240 L1300 232 M1390 244 L1470 300" stroke="#4a5568" stroke-width="2" fill="none"/>` +
        `<g fill="#ffcb05"><path d="M1190 238 l6 10 l6 -10 Z"/><path d="M1240 235 l6 10 l6 -10 Z"/></g><g fill="#2a75bb"><path d="M1215 236 l6 10 l6 -10 Z"/><path d="M1265 234 l6 10 l6 -10 Z"/></g>` +
        `<rect x="1180" y="286" width="230" height="34" rx="3" fill="#f4f4f0"/><rect x="1196" y="266" width="80" height="22" rx="3" fill="#f4f4f0"/>` +
        `<rect x="1120" y="318" width="330" height="36" rx="3" fill="#ffffff"/>` +
        `<g fill="#5aa8d6">${range(9, i => `<rect x="${1196 + i * 24}" y="296" width="14" height="10" rx="2"/>`)}${range(13, i => `<rect x="${1134 + i * 24}" y="328" width="14" height="12" rx="2"/>`)}<rect x="1206" y="272" width="60" height="8" rx="2"/></g>` +
        `<path d="M1030 352 L1520 352 L1486 418 L1074 418 Z" fill="#f4f4f0"/><path data-noink d="M1036 352 L1520 352 L1514 364 L1042 364 Z" fill="#ffffff"/>` +
        `<path d="M1052 384 L1505 384 L1486 418 L1074 418 Z" fill="#24375f"/><path d="M1050 384 L1506 384" stroke="#d9534a" stroke-width="5"/>` +
        `<g fill="#24375f">${range(16, i => `<circle cx="${1090 + i * 26}" cy="368" r="4"/>`)}</g>` +
        `<text x="1290" y="410" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="22" letter-spacing="3" fill="#ffffff">S.S. ANNE</text></g>` +
        `<path d="M1040 418 Q1280 426 1520 418" stroke="#ffffff" stroke-width="4" opacity=".7" fill="none"/>` +
        `<path data-noink d="M1074 420 L1486 420 L1460 450 L1100 450 Z" fill="#24375f" opacity=".18"/></g>` +
        `<rect y="412" width="${W}" height="4" fill="#ffffff" opacity=".55"/>` +
        // The sun's path on the water, widening toward the shore
        glowAt(1260, 420, 200, "#fff1c4", 0.55, "", 40) +
        L + (() => {
          // Short glints scattered in a band that widens toward the shore
          const g = rng(337);
          let out = "";
          for (let i = 0; i < 22; i++) {
            const y = 424 + i * 20, half = 30 + i * 9;
            for (let k = 0; k < 3; k++) out += `<rect x="${(1260 + (g() * 2 - 1) * half).toFixed(0)}" y="${(y + g() * 10).toFixed(0)}" width="${(10 + i * 1.6 + g() * 14).toFixed(0)}" height="${3 + Math.floor(i / 8)}" rx="2" opacity="${(0.95 - i * 0.03).toFixed(2)}"/>`;
          }
          return `<g class="fx-shimmer" fill="#fff4cf">${out}</g>`;
        })() +
        // Rows of wave crests, bigger and further apart towards the front
        (() => {
          const r = rng(331);
          let crest = "", trough = "";
          for (let row = 0; row < 11; row++) {
            const y = 436 + row * row * 3.6 + row * 6, k = 0.5 + row * 0.16, n = 9 - Math.floor(row / 3);
            for (let i = 0; i < n; i++) {
              const x = (i + r()) * (W / n), w = 34 * k;
              crest += `<path d="M${x.toFixed(0)} ${y.toFixed(0)} q${w / 2} ${-8 * k} ${w} 0 t${w} 0"/>`;
              trough += `<path d="M${(x + w * 0.4).toFixed(0)} ${(y + 6 * k).toFixed(0)} q${w * 0.6} ${5 * k} ${w * 1.2} 0"/>`;
            }
          }
          return `<g class="fx-wave" fill="none" stroke-linecap="round"><g stroke="#ffffff" stroke-opacity=".42" stroke-width="4">${crest}</g><g stroke="#0f4f86" stroke-opacity=".25" stroke-width="3">${trough}</g></g>`;
        })() +
        // A little sailboat out on the water
        `<g class="fx-drift fx-drift--rev"><path d="M262 446 L330 446 L318 458 L274 458 Z" fill="#f4f4f0"/><path d="M296 444 L296 380 L330 440 Z" fill="#ffffff"/><path d="M292 440 L292 392 L266 440 Z" fill="#f6c54a"/></g>` +
        range(8, i => star(160 + i * 190 + (i % 3) * 40, 480 + (i % 4) * 70, 0.8, "#ffffff", "fx-twinkle", `animation-delay:-${i * 0.6}s`)) +
        L + `<g fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" class="fx-drift"><path d="M560 260 q14 -12 28 0 q14 -12 28 0"/><path d="M620 300 q10 -9 20 0 q10 -9 20 0"/><path d="M500 300 q8 -7 16 0 q8 -7 16 0"/></g>`
      ),
      front: svg(sky("sand", [[0, "#f6e2b0"], [1, "#e0bf80"]]),
        `<path class="fx-foam" d="M-100 860 Q0 820 100 860 T300 860 T500 860 T700 860 T900 860 T1100 860 T1300 860 T1500 860 T1700 860 L1700 900 L-100 900 Z" fill="#e8f7ff" opacity=".85"/>` +
        `<path d="M-40 900 Q40 800 260 830 Q360 850 420 900 Z" fill="url(#sand)"/>` +
        `<g data-noink fill="#c9a66a"><circle cx="210" cy="868" r="3"/><circle cx="240" cy="880" r="2.5"/><circle cx="330" cy="884" r="3"/><circle cx="170" cy="886" r="2.5"/></g>` +
        rock(60, 905, 2.1, "#6d6560") + rock(1520, 905, 1.9, "#6d6560", -1) +
        `<path d="M300 880 l10 -14 l10 14 l-10 6 Z M290 872 l-14 -6 M330 872 l14 -6" fill="#f27b5a" stroke="#f27b5a" stroke-width="4"/>` +
        `<path d="M366 886 q8 -16 16 0 Z" fill="#fbd3d8"/>`)
    },

    cave: {
      far: 615, horizon: 530,
      ground: [6, 24], tint: "#4b3a6b",
      // Where the Moon Stone sits on the cave floor (x and y in percent)
      moonstone: [52, 13], haze: ["#6d5a9a", 560, 0.3],
      back: layered(
        sky("cv", [[0, "#130e25"], [0.6, "#2a2140"], [1, "#3c3150"]]) + glow("cgl", "#8fe3ff") + glow("ctn", "#6d8fd6") + sky("cvhole", [[0, "#1c2a5e"], [1, "#3a4f8f"]]),
        fill("cv") +
        // Columns of rock on the far wall
        `<g fill="#1d172f">${range(9, i => `<path data-noink d="M${i * 190 - 30} 0 Q${i * 190 + 10} 300 ${i * 190 - 20} 600 L${i * 190 + 70} 600 Q${i * 190 + 90} 300 ${i * 190 + 50} 0 Z"/>`)}</g>` +
        `<ellipse cx="800" cy="500" rx="200" ry="150" fill="url(#ctn)" opacity=".55"/><path d="M640 640 Q650 400 800 380 Q950 400 960 640 Z" fill="#0f0b1d" opacity=".6"/>` +
        ridge(470, 70, 4, "#2b2342", 41, "", "rock") +
        // Icicles of rock from the roof, each with a lit edge
        `<g>` + range(16, i => { const x = i * 105 + 20, h = 60 + ((i * 53) % 150); return `<path d="M${x - 34} 0 L${x + 34} 0 L${x} ${h} Z" fill="#2a2240"/><path data-noink d="M${x + 6} 0 L${x + 34} 0 L${x + 3} ${h * 0.92} Z" fill="#3a3058"/><path data-noink d="M${x - 14} 0 L${x - 6} 0 L${x - 1} ${h * 0.7} Z" fill="#4a3f6c"/>`; }) + `</g>` +
        // A hole in the roof, with the night sky and the moon showing through
        `<ellipse cx="800" cy="40" rx="150" ry="110" fill="url(#cvhole)"/>` +
        star(712, 60, 0.6, "#e8f0ff", "fx-twinkle") + star(890, 100, 0.5, "#e8f0ff", "fx-twinkle", "animation-delay:-1.5s") + star(760, 118, 0.4, "#e8f0ff") +
        sun(830, 70, 32, "#f4f2dc", "#dfe8ff", false) +
        `<path d="M650 40 Q660 156 800 152 Q940 156 950 40" fill="none" stroke="#3e3462" stroke-width="12"/>` +
        L + `<g opacity=".4"><path class="fx-pulse" data-noink d="M700 150 L900 150 L1000 770 L600 770 Z" fill="#8f94d6"/></g>` +
        ridge(560, 60, 5, "#3a2f52", 43, "", "rock") +
        `<g><path d="M480 600 L505 500 L530 600 Z" fill="#2f2747"/><path data-noink d="M505 500 L530 600 L512 600 Z" fill="#40365e"/><path d="M1060 610 L1080 530 L1100 610 Z" fill="#2f2747"/><path data-noink d="M1080 530 L1100 610 L1086 610 Z" fill="#40365e"/><path d="M1110 610 L1124 560 L1138 610 Z" fill="#2f2747"/></g>` +
        `<circle class="fx-pulse" cx="280" cy="570" r="150" fill="url(#cgl)" opacity=".5"/><circle class="fx-pulse" cx="1272" cy="560" r="170" fill="url(#cgl)" opacity=".5" style="animation-delay:-2s"/>` +
        // Crystal clusters with a bright face on each crystal
        [[280, 604, 1], [1272, 596, 1.15]].map(([x, y, s]) => [[-44, 36, 12, -6], [-20, 60, 16, 0], [6, 82, 18, 4], [30, 52, 14, 10], [50, 32, 11, 14]].map(([dx, h, w, lean]) =>
          `<path d="M${x + (dx - w) * s} ${y} L${x + (dx - w * 0.8 + lean) * s} ${y - h * 0.82 * s} L${x + (dx + lean) * s} ${y - h * s} L${x + (dx + w * 0.8 + lean) * s} ${y - h * 0.82 * s} L${x + (dx + w) * s} ${y} Z" fill="#7fd6f5"/>` +
          `<path data-noink d="M${x + (dx + lean) * s} ${y - h * s} L${x + (dx + w * 0.8 + lean) * s} ${y - h * 0.82 * s} L${x + (dx + w) * s} ${y} L${x + dx * s} ${y} Z" fill="#c4f1ff"/>`).join("")).join("") +
        star(262, 534, 1.2, "#ffffff", "fx-twinkle") + star(1290, 512, 1.4, "#ffffff", "fx-twinkle", "animation-delay:-2s") +
        // Glowing mushrooms by the far wall
        `<g><rect x="1004" y="590" width="7" height="18" rx="3" fill="#e9dcff"/><path d="M994 594 Q1007 572 1021 594 Z" fill="#ff8fb1"/><rect x="1024" y="596" width="6" height="12" rx="3" fill="#e9dcff"/><path d="M1016 599 Q1027 584 1038 599 Z" fill="#ff8fb1"/></g>` +
        L + ridge(705, 20, 4, "#56486e", 47, "", "rock") +
        // Moonlight pooling on the floor round the pond
        `<ellipse data-noink cx="800" cy="745" rx="250" ry="56" fill="#8f94d6" opacity=".4"/>` +
        `<ellipse cx="800" cy="760" rx="180" ry="28" fill="#2c2a55"/><ellipse data-noink cx="800" cy="757" rx="150" ry="18" fill="#3b4a86"/><ellipse class="fx-pulse" cx="800" cy="756" rx="120" ry="10" fill="#9ee7ff" opacity=".3"/>` +
        stand(790, rock(420, 790, 0.6, "#4a3e64")) + stand(800, rock(1160, 800, 0.75, "#4a3e64", -1)) +
        dots(30, 49, "#cfe9ff", 120, 700, 1.6, "fx-float")
      ),
      front: svg("", corner("#2b2340") + `<ellipse cx="800" cy="930" rx="300" ry="60" fill="#2b2340"/>`)
    },

    fossil: {
      far: 650, horizon: 565,
      ground: [6, 24], tint: "#8a4f2a", haze: ["#fbe3c0", 520, 0.4],
      back: layered(
        sky("fo", [[0, "#eeac78"], [0.5, "#f8d2a0"], [1, "#fbe9cc"]]),
        fill("fo") +
        sun(800, 230, 78, "#fff6dc", "#ffe6b0") +
        rays(800, 230, [[300, 440], [640, 720], [880, 960], [1160, 1300]], "#fff2cc", 0.14) +
        cloud(330, 150, 0.8, "#fff1dc", "fx-drift", "#f0c398") + cloud(1300, 120, 0.6, "#fff1dc", "fx-drift fx-drift--rev", "#f0c398") +
        // Grey peaks of Mt. Moon in the distance
        `<path d="M0 360 L140 250 L230 300 L330 220 L470 320 L560 280 L700 360 Z" fill="#dcb4a0"/><path data-noink d="M330 220 L470 320 L400 320 Z M140 250 L230 300 L180 300 Z" fill="#cfa792"/>`+`<path d="M1000 360 L1120 280 L1210 320 L1330 250 L1460 330 L1600 290 L1600 360 Z" fill="#e2bca4"/>` +
        // The Pewter Museum of Science on the far cliff
        `<g transform="translate(650 196) scale(1.5)"><rect x="0" y="30" width="200" height="80" fill="#8a5a4a"/><rect data-noink x="110" y="30" width="90" height="80" fill="#7a4d40"/>` +
        `<path d="M50 30 A50 50 0 0 1 150 30 Z" fill="#6f5a62"/><path data-noink d="M100 -20 A50 50 0 0 1 150 30 L100 30 Z" fill="#5f4b54"/><path d="M100 -20 V-34" stroke="#5f4b54" stroke-width="3"/>` +
        `<rect x="-10" y="24" width="220" height="10" fill="#9a6a56"/><g fill="#a87a62">${range(6, i => `<rect x="${14 + i * 32}" y="40" width="10" height="60"/>`)}</g>` +
        `<g fill="#ffd27a">${range(5, i => `<rect${i === 2 ? ' class="fx-flicker"' : ""} x="${28 + i * 32}" y="54" width="14" height="26" rx="2"/>`)}</g></g>` +
        glowAt(800, 330, 160, "#ffd27a", 0.22) +
        ridge(360, 40, 4, "#d7925e", 53, "", "rock") +
        `<g fill="none" stroke="#c47c4b" stroke-width="3" opacity=".6">${range(6, i => `<path d="M0 ${400 + i * 16} Q400 ${390 + i * 16} 800 ${404 + i * 16} T1600 ${398 + i * 16}"/>`)}</g>` +
        ridge(440, 30, 5, "#c47c4b", 59, "", "rock") + L + ridge(520, 26, 5, "#b46c3e", 61, "", "rock") +
        `<g fill="none" stroke="#a35f34" stroke-width="3" opacity=".6">${range(5, i => `<path d="M0 ${560 + i * 14} Q400 ${552 + i * 14} 800 ${566 + i * 14} T1600 ${558 + i * 14}"/>`)}</g>` +
        // Fossils in the rock: a spiral shell and a long skeleton, each with a dark edge
        (() => {
          const bones = `<path d="M300 480 a26 26 0 1 1 -26 -26 a40 40 0 1 1 40 40"/><path d="M900 470 L1180 470"/>${range(6, i => `<path d="M${940 + i * 40} 470 q-12 40 0 70"/>`)}` +
            `<path d="M1180 470 q40 -30 80 -10 q20 20 -10 30 q-30 6 -70 -20"/><path d="M900 470 q-60 -10 -110 20"/>`;
          return `<g fill="none" stroke="#9a5a34" stroke-width="16" stroke-linecap="round" opacity=".55">${bones}</g><g fill="none" stroke="#e2bb92" stroke-width="10" stroke-linecap="round">${bones}</g>`;
        })() +
        `<circle cx="1236" cy="472" r="5" fill="#9a5a34"/>` +
        L + ridge(688, 18, 4, "#d9a777", 67, "", "sand") +
        `<g data-stand="690"><g stroke="#7a4a2a" stroke-width="5"><path d="M420 690 L420 640 M620 690 L620 640" fill="none"/></g><path d="M420 650 Q470 660 520 652 Q570 660 620 650" stroke="#f2c230" stroke-width="4" fill="none"/></g>` +
        `<g data-stand="660"><path d="M1250 660 L1310 600 L1370 660 Z" fill="#e8d6b0"/><path data-noink d="M1310 600 L1370 660 L1330 660 Z" fill="#cdb98f"/><path d="M1300 660 L1310 630 L1320 660 Z" fill="#8a6440"/><path d="M1310 600 L1310 560" stroke="#7a4a2a" stroke-width="4"/><path d="M1310 562 l30 8 l-30 8 Z" fill="#e3350d"/></g>` +
        ridge(760, 12, 4, "#e2b98c", 71, "", "sand") +
        stand(790, rock(560, 790, 0.55, "#c88a5c")) + stand(800, rock(1080, 800, 0.45, "#c88a5c", -1))
      ),
      front: svg("", corner("#a5653c") +
        `<g stroke="#f3dcc0" stroke-width="9" stroke-linecap="round"><path d="M1400 852 L1480 832"/><circle cx="1394" cy="854" r="9" fill="#f3dcc0"/><circle cx="1486" cy="830" r="9" fill="#f3dcc0"/></g>` +
        `<g stroke="#6b4a32" stroke-width="7" stroke-linecap="round"><path d="M240 870 L310 800"/></g><path d="M285 800 Q315 780 345 810" stroke="#8d96a0" stroke-width="10" fill="none" stroke-linecap="round"/>`)
    },

    volcano: {
      far: 640, horizon: 560,
      ground: [6, 24], tint: "#8a2d1d", haze: ["#e8853a", 600, 0.3],
      back: layered(
        sky("vo", [[0, "#22111c"], [0.4, "#6e2629"], [0.7, "#c9582c"], [1, "#ef9140"]]) + glow("vgl", "#ff9a3a") +
        sky("vside", [[0, "#56362f"], [1, "#2e1d1c"]]) + sky("vsea", [[0, "#7a3b33"], [1, "#2c1a24"]]),
        fill("vo") +
        stars(18, 71, 160, "#ffd9b0") +
        // The sea around Cinnabar Island, lit by the glow
        `<rect y="530" width="${W}" height="140" fill="url(#vsea)"/><g class="fx-shimmer" fill="#ffb24a" opacity=".6">${range(8, i => `<rect x="${730 + (i * 29) % 140}" y="${540 + i * 12}" width="${60 - i * 5}" height="3" rx="1.5"/>`)}</g>` +
        cloud(330, 170, 1, "#4e3a44", "fx-drift", "#b5513a") + cloud(1300, 130, 0.85, "#4e3a44", "fx-drift fx-drift--rev", "#b5513a") +
        glowAt(810, 230, 260, "#ff9a3a", 0.8, "fx-pulse") +
        // Smoke rising from the crater
        `<g class="fx-drift" fill="#5e4a52" opacity=".75"><circle cx="790" cy="170" r="50"/><circle cx="840" cy="120" r="60"/><circle cx="780" cy="80" r="56"/><circle cx="880" cy="60" r="50"/></g>` +
        `<g class="fx-drift" fill="#c0603a" opacity=".5"><ellipse cx="800" cy="200" rx="50" ry="14"/><ellipse cx="850" cy="160" rx="54" ry="14"/></g>` +
        `<path d="M500 640 L740 220 L880 220 L1120 640 Z" fill="url(#vside)"/><path d="M880 220 L1120 640 L960 640 Z" fill="#241615" opacity=".5"/>` +
        `<g fill="none" stroke="#2a1918" stroke-width="5" stroke-linecap="round" opacity=".7"><path d="M720 260 Q690 400 620 560"/><path d="M760 250 Q730 420 700 620"/><path d="M870 240 Q930 420 1000 600"/></g>` +
        `<path d="M740 220 L880 220 L860 260 L830 330 L800 270 L770 300 Z" fill="#ffb24a"/>` +
        `<g opacity=".35"><path d="M800 270 L780 380 L810 460 L790 560 L800 640" stroke="#ff7a2a" stroke-width="40" fill="none" stroke-linecap="round"/></g>` +
        `<path d="M800 270 L780 380 L810 460 L790 560 L800 640" stroke="#ff7a2a" stroke-width="14" fill="none" stroke-linecap="round"/><path d="M800 270 L780 380 L810 460 L790 560" stroke="#ffd27a" stroke-width="5" fill="none" stroke-linecap="round"/>` +
        `<path d="M850 300 L880 400 L870 470" stroke="#ff7a2a" stroke-width="9" fill="none" stroke-linecap="round"/>` +
        L + ridge(620, 30, 5, "#4a2c28", 79, "", "rock") +
        `<g fill="none" stroke="#ff7a2a" stroke-width="4" stroke-linecap="round" opacity=".8"><path class="fx-pulse" d="M200 660 l30 10 l20 -6 l34 14"/><path class="fx-pulse" style="animation-delay:-2s" d="M1300 650 l-26 12 l22 8 l-30 12"/></g>` +
        ridge(700, 18, 4, "#3a2422", 83, "", "rock") +
        L + [[350, 760, 110], [1250, 790, 140]].map(([x, y, r], i) => glowAt(x, y, r * 1.5, "#ff9a3a", 0.9, "fx-pulse", r * 0.38) +
          `<ellipse cx="${x}" cy="${y + 4}" rx="${r * 1.12}" ry="${r * 0.2}" fill="#2a1a18"/><ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.15}" fill="#ff8a2a"/>` +
          `<ellipse data-noink cx="${x}" cy="${y - 2}" rx="${r * 0.66}" ry="${r * 0.07}" fill="#ffd27a"/><g data-noink fill="#c7461f"><ellipse cx="${x - r * 0.5}" cy="${y + 2}" rx="${r * 0.14}" ry="${r * 0.04}"/><ellipse cx="${x + r * 0.45}" cy="${y - 1}" rx="${r * 0.1}" ry="${r * 0.03}"/></g>` +
          rock(x - r * 1.05, y + 10, 0.35, "#3a2422") + rock(x + r * 1.08, y + 12, 0.3, "#3a2422", -1)).join("") +
        `<g>${dots(40, 87, "#ffb24a", 350, 880, 2.6, "fx-rise")}</g>`
      ),
      front: svg("", corner("#2e1c1a") +
        `<g fill="none" stroke="#ff7a2a" stroke-width="5" stroke-linecap="round" opacity=".75"><path d="M40 800 l30 18 l26 -6 l30 22"/><path d="M1500 790 l-24 20 l26 8 l-20 24"/></g>`)
    },

    power: {
      far: 640, horizon: 555,
      ground: [6, 26], fly: 0.15, tint: "#2c4a63", haze: ["#a9b8c9", 560, 0.3],
      back: layered(
        sky("pw", [[0, "#141f37"], [0.5, "#465e80"], [0.82, "#d49e5c"], [1, "#e9bb72"]]) + glow("pglow", "#ffe066"),
        fill("pw") +
        stars(30, 301, 300, "#ffffff") +
        cloud(260, 200, 0.9, "#4a5874", "fx-drift", "#c08a5a") + cloud(1340, 150, 1.1, "#4a5874", "fx-drift fx-drift--rev", "#c08a5a") +
        ridge(560, 24, 5, "#3c4a5c", 303) +
        // The plant: main hall, turbine house and two striped chimneys
        `<g fill="#26323f"><rect x="520" y="330" width="520" height="250"/><rect x="1040" y="400" width="220" height="180"/><path d="M500 340 L780 280 L1060 340 Z"/></g>` +
        `<g data-noink fill="#2e3b4a">${range(5, i => `<rect x="520" y="${350 + i * 46}" width="520" height="4"/>`)}<path d="M500 340 L780 280 L780 340 Z"/></g>` +
        `<g fill="#26323f"><rect x="600" y="210" width="44" height="130"/><rect x="690" y="240" width="40" height="100"/></g>` +
        `<g data-noink fill="#c94b4b"><rect x="600" y="226" width="44" height="12"/><rect x="600" y="262" width="44" height="12"/><rect x="690" y="256" width="40" height="10"/><rect x="690" y="288" width="40" height="10"/></g>` +
        `<g fill="#3a4757"><rect x="600" y="210" width="44" height="12"/><rect x="690" y="240" width="40" height="12"/></g>` +
        `<g class="fx-drift" fill="#8f9bb0" opacity=".35"><ellipse cx="630" cy="180" rx="60" ry="24"/><ellipse cx="700" cy="150" rx="70" ry="26"/><ellipse cx="720" cy="210" rx="40" ry="16"/></g>` +
        `<g fill="#ffd84a">${range(16, i => `<rect${i % 5 === 2 ? ' class="fx-flicker"' : ""} x="${550 + (i % 8) * 58}" y="${380 + Math.floor(i / 8) * 70}" width="30" height="34" rx="3" opacity="${i % 3 ? 0.9 : 0.55}"/>`)}</g>` +
        `<g data-noink fill="#fff3b0" opacity=".7">${range(16, i => `<rect x="${553 + (i % 8) * 58}" y="${383 + Math.floor(i / 8) * 70}" width="10" height="12" rx="2"/>`)}</g>` +
        `<g fill="#ffd84a" opacity=".8"><rect x="1070" y="440" width="40" height="24" rx="3"/><rect x="1150" y="440" width="40" height="24" rx="3" class="fx-flicker" style="animation-delay:-1.7s"/></g>` +
        glowAt(780, 430, 340, "#ffd84a", 0.22, "", 200) +
        // Pipes along the turbine house
        `<g fill="none" stroke="#5a6a7c" stroke-width="10" stroke-linecap="round"><path d="M1040 520 H1250 V600"/><path d="M1040 545 H1220 V600"/></g><g fill="none" stroke="#7d8ea2" stroke-width="3"><path d="M1040 516 H1246"/><path d="M1040 541 H1216"/></g>` +
        // The lightning bolt sign, up in the middle of the roof
        `<path transform="translate(780 312) scale(.62) translate(-820 -372)" d="M820 330 l-24 44 h20 l-16 40 l40 -54 h-22 l18 -30 Z" fill="#ffd84a"/>` +
        L + ridge(600, 20, 5, "#46586a", 307, "", "rock") +
        // Pylons with sagging wires
        `<g fill="none" stroke="#1d2833" stroke-width="6" stroke-linejoin="round"><path d="M210 640 L250 360 L290 640 M226 520 L274 520 M236 440 L264 440 M190 380 L310 380"/><path d="M1380 640 L1416 380 L1452 640 M1394 530 L1438 530 M1402 450 L1430 450 M1360 400 L1472 400"/></g>` +
        `<g fill="none" stroke="#1d2833" stroke-width="3"><path d="M218 600 L270 520 L232 440 L262 400 M282 600 L230 520 L268 440 L238 400"/><path d="M1386 600 L1436 530 L1404 450 L1426 410 M1446 600 L1396 530 L1428 450 L1406 410"/></g>` +
        `<g fill="none" stroke="#1d2833" stroke-width="3"><path d="M190 380 Q800 480 1360 400"/><path d="M310 380 Q900 470 1472 400"/><path d="M-60 400 Q80 430 190 380"/><path d="M1472 400 Q1560 420 1680 390"/></g>` +
        `<g fill="#ffe066"><circle class="fx-flicker" cx="190" cy="380" r="5"/><circle class="fx-flicker" style="animation-delay:-1s" cx="1472" cy="400" r="5"/></g>` +
                L + ridge(690, 16, 4, "#566a5a", 311, "", "rock") +
        // The charging pads: metal plates with a glowing ring
        [[420, 770, 120], [1180, 790, 150]].map(([x, y, r]) => glowAt(x, y, r * 1.2, "#ffe066", 0.5, "fx-pulse", r * 0.3) +
          `<ellipse cx="${x}" cy="${y + 4}" rx="${r}" ry="${r * 0.15}" fill="#3a4a58"/><ellipse cx="${x}" cy="${y}" rx="${r * 0.9}" ry="${r * 0.12}" fill="#5a6a78"/>` +
          `<ellipse data-noink cx="${x}" cy="${y - 1}" rx="${r * 0.55}" ry="${r * 0.06}" fill="none" stroke="#ffe066" stroke-width="3" opacity=".9"/><ellipse data-noink cx="${x - r * 0.3}" cy="${y - 4}" rx="${r * 0.25}" ry="${r * 0.025}" fill="#8796a4"/>`).join("") +
        `<g fill="none" stroke="#ffe066" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path class="fx-flicker" d="M560 720 l12 -16 l-8 -4 l14 -18"/><path class="fx-flicker" style="animation-delay:-2.1s" d="M1020 740 l10 -14 l-8 -4 l12 -16"/></g>` +
        dots(10, 313, "#ffe066", 620, 860, 2, "fx-rise")
      ),
      front: svg("", corner("#2e3a44") +
        `<g transform="translate(1440 790)"><rect x="-4" y="0" width="8" height="70" fill="#5a6470"/><path d="M0 -44 L40 26 L-40 26 Z" fill="#ffcb05" stroke="#1e2230" stroke-width="5" stroke-linejoin="round"/><path d="M4 -18 l-10 16 h8 l-6 16 l14 -20 h-8 l6 -12 Z" fill="#1e2230"/></g>` +
        `<rect x="260" y="850" width="260" height="30" rx="15" fill="#5a6470"/><rect x="260" y="850" width="260" height="10" rx="5" fill="#76808c"/>`)
    },

    victory: {
      far: 640, horizon: 555,
      ground: [6, 24], tint: "#6b4a2e", haze: ["#c99a64", 560, 0.3],
      // Strength boulders that Pokémon can push (x and y in percent, see app.js)
      boulders: [[36, 12], [74, 10]],
      // The ladder and the rock ledge it leads to, in drawing units of the middle layer
      // edge is the top of the ledge, from one end to the other: x, y, x, y
      ledge: { ladderX: 470, ladderBottom: 600, ladderTop: 478, x1: 90, x2: 410, edge: [0, 450, 560, 470], layer: 1 },
      back: layered(
        sky("vr", [[0, "#20150d"], [1, "#4a3220"]]) + glow("vexit", "#fff1c8") + glow("vtorch", "#ffb347") +
        sky("vrock", [[0, "#7e5d3e"], [1, "#5a4029"]]),
        fill("vr") +
        `<g fill="#2b1e12">${range(8, i => `<path data-noink d="M${i * 210 - 40} 0 Q${i * 210} 260 ${i * 210 - 30} 520 L${i * 210 + 60} 520 Q${i * 210 + 90} 260 ${i * 210 + 50} 0 Z"/>`)}</g>` +
        // Daylight from the exit at the far end, toward the Pokémon League
        `<ellipse cx="800" cy="470" rx="340" ry="260" fill="url(#vexit)" opacity=".75"/>` +
        rays(800, 470, [[440, 600], [690, 770], [850, 940], [1040, 1200]], "#fff4d6", 0.18) +
        `<path d="M700 600 Q705 430 800 410 Q895 430 900 600 Z" fill="#fff4d6"/><path data-noink d="M730 600 Q740 500 800 480 Q860 500 870 600 Z" fill="#cfe8f4" opacity=".7"/><path data-noink d="M740 600 L780 540 L820 570 L860 600 Z" fill="#a8cf9a" opacity=".8"/>` +
        // The Indigo Plateau on the hill beyond
        `<g data-noink fill="#6f8aa0"><rect x="782" y="520" width="44" height="30"/><path d="M776 522 L804 500 L832 522 Z"/><rect x="800" y="488" width="6" height="14"/></g><g data-noink fill="#fff2b0"><rect x="790" y="530" width="6" height="8"/><rect x="812" y="530" width="6" height="8"/></g>` +
        `<g>` + range(14, i => { const x = i * 120 + 40, h = 50 + ((i * 47) % 120); return `<path d="M${x - 40} 0 L${x + 40} 0 L${x} ${h} Z" fill="#3a2818"/><path data-noink d="M${x - 18} 0 L${x - 8} 0 L${x - 2} ${h * 0.7} Z" fill="#54402a"/>`; }) + `</g>` +
        ridge(480, 80, 4, "#3e2b1b", 401, "", "rock") +
        L + ridge(560, 50, 5, "url(#vrock)", 403) +
        `<g fill="none" stroke="#5a4029" stroke-width="3" stroke-linecap="round" opacity=".7"><path d="M620 600 q30 -6 60 0 l12 8"/><path d="M1080 590 q30 -6 60 0 l12 8"/><path d="M1300 610 q24 -5 48 0"/></g>` +
        // A rock ledge with a ladder up to it
        `<path d="M560 470 L0 450 L0 560 L540 560 Z" fill="#6a4c32"/><path d="M560 470 L0 450 L0 466 L550 484 Z" fill="#8a6644"/><path data-noink d="M556 474 L0 454 L0 458 L553 478 Z" fill="#a8825a"/>` +
        `<g fill="none" stroke="#54392a" stroke-width="3" stroke-linecap="round" opacity=".8"><path d="M60 500 q40 -6 80 0 l10 8"/><path d="M260 510 q40 -6 80 0"/><path d="M160 540 q30 -5 60 0"/></g>` +
        `<g stroke="#7a5636" stroke-width="10" stroke-linecap="round"><path d="M450 478 L450 600 M490 476 L490 600"/></g>` +
        `<g stroke="#b88a58" stroke-width="5" stroke-linecap="round"><path d="M448 478 L448 600 M488 476 L488 600"/>${range(5, i => `<path d="M450 ${496 + i * 22} H490"/>`)}</g>` +
        // Torches on the walls
        [[621, 420, 0], [1301, 390, 2]].map(([x, y, d]) => `<g><path d="M${x - 9} ${y + 12} L${x + 9} ${y + 12} L${x + 5} ${y + 54} L${x - 5} ${y + 54} Z" fill="#4a3220"/><rect x="${x - 12}" y="${y + 8}" width="24" height="8" rx="3" fill="#7a5a3c"/>` +
          `<circle class="fx-pulse" style="animation-delay:-${d}s" cx="${x}" cy="${y}" r="80" fill="url(#vtorch)" opacity=".75"/>` +
          `<path class="fx-flicker" style="animation-delay:-${d * 0.6}s" d="M${x} ${y - 24} q16 18 0 32 q-16 -14 0 -32 Z" fill="#ff9a3a"/><path class="fx-flicker" style="animation-delay:-${d * 0.6}s" d="M${x} ${y - 14} q9 12 0 20 q-9 -9 0 -20 Z" fill="#ffe08a"/></g>`).join("") +
        ridge(640, 20, 5, "#6e5035", 405, "", "rock") +
        L + ridge(700, 16, 4, "#8a6844", 407, "", "rock") +
        `<g data-stand="740"><path d="M520 740 L540 690 L560 740 Z" fill="#6a4c32"/><path data-noink d="M540 690 L560 740 L546 740 Z" fill="#7e5d3e"/></g><g data-stand="760"><path d="M1000 760 L1016 720 L1032 760 Z" fill="#6a4c32"/></g>` +
        stand(820, rock(760, 820, 0.45, "#7a5a3c")) + stand(790, rock(1400, 790, 0.6, "#7a5a3c", -1)) +
        dots(24, 409, "#ffd9a0", 380, 760, 1.4, "fx-float")
      ),
      front: svg("", corner("#3e2b1b"))
    },

    snow: {
      far: 660, horizon: 575,
      ground: [6, 24], tint: "#2f6d8f",
      haze: ["#bfe3f2", 600, 0.35],
      back: layered(
        sky("sf", [[0, "#0a2236"], [1, "#16425e"]]) + sky("sfout", [[0, "#8fd0f2"], [0.55, "#e2f5fc"], [0.56, "#4aa8d4"], [1, "#236f9e"]]) +
        glow("sflight", "#e8f8ff") + sky("ice", [[0, "#cfe7f3"], [0.5, "#a9d2e6"], [1, "#7fb6d2"]]) + sky("icicle", [[0, "#e9f8ff"], [1, "#9fd2ea"]]),
        fill("sf") +
        // The cave mouth looking out to the sea, with icebergs floating past
        `<path d="M520 640 Q520 250 800 220 Q1080 250 1080 640 Z" fill="url(#sfout)"/>` +
        sun(800, 380, 46, "#fffbe6", "#fffaf0") +
        `<ellipse cx="800" cy="420" rx="420" ry="320" fill="url(#sflight)" opacity=".7"/>` +
        `<g fill="#ffffff" opacity=".9"><ellipse cx="700" cy="300" rx="60" ry="14"/><ellipse cx="900" cy="330" rx="44" ry="11"/></g>` +
        `<path d="M600 420 L630 396 L660 402 L690 420 Z" fill="#f4fbff"/><path data-noink d="M630 396 L660 402 L690 420 L640 420 Z" fill="#bfe2f2"/>` +
        `<path d="M900 420 L930 388 L960 380 L990 400 L1010 420 Z" fill="#f4fbff"/><path data-noink d="M960 380 L990 400 L1010 420 L950 420 Z" fill="#bfe2f2"/>` +
        `<g class="fx-wave" stroke="#ffffff" stroke-opacity=".5" stroke-width="3" fill="none" stroke-linecap="round"><path d="M600 470 q20 -8 40 0 t40 0"/><path d="M820 500 q20 -8 40 0 t40 0"/><path d="M700 560 q20 -8 40 0 t40 0"/></g>` +
        `<path d="M0 0 H1600 V700 H1080 Q1080 250 800 220 Q520 250 520 640 V700 H0 Z" fill="#143c56"/>` +
        `<path data-noink d="M1080 640 Q1080 250 800 220 Q520 250 520 640" fill="none" stroke="#8fd0ea" stroke-width="6" opacity=".7"/>` +
        rays(800, 260, [[480, 660], [740, 870], [940, 1120]], "#e8f8ff", 0.2) +
        `<path d="M0 0 H1600 V120 Q1200 160 800 130 Q400 160 0 120 Z" fill="#1c4c6a"/>` +
        L + ridge(560, 60, 4, "#2b6a8c", 501, "", "rock") +
        // Icicles from the roof, each with a bright streak
        `<g>` + range(15, i => { const x = i * 110 + 30, h = 50 + ((i * 61) % 130); return `<path d="M${x - 22} 118 L${x + 22} 118 L${x} ${118 + h} Z" fill="url(#icicle)" opacity=".95"/><path data-noink d="M${x - 10} 120 L${x - 4} 120 L${x - 1} ${118 + h * 0.75} Z" fill="#ffffff" opacity=".85"/>`; }) + `</g>` +
        // Frozen falls down the cave wall
        `<path d="M250 160 Q230 380 260 600 L330 600 Q350 380 320 160 Z" fill="#bfe6f6" opacity=".9"/><path d="M270 180 Q262 380 282 590" stroke="#ffffff" stroke-width="6" opacity=".8" fill="none"/><path d="M308 190 Q318 380 312 590" stroke="#93cde6" stroke-width="4" opacity=".8" fill="none"/>` +
        `<path d="M1300 150 Q1280 360 1320 590 L1380 590 Q1400 360 1370 150 Z" fill="#bfe6f6" opacity=".9"/><path d="M1318 170 Q1306 360 1336 580" stroke="#ffffff" stroke-width="6" opacity=".8" fill="none"/>` +
        // Ice crystals at the foot of the walls
        [[430, 612, 1], [1170, 618, 0.9]].map(([x, y, s]) => [[-30, 40, 12, -8], [0, 70, 16, 0], [28, 46, 12, 8]].map(([dx, h, w, lean]) =>
          `<path d="M${x + (dx - w) * s} ${y} L${x + (dx + lean) * s} ${y - h * s} L${x + (dx + w) * s} ${y} Z" fill="#a9e2f7"/><path data-noink d="M${x + (dx + lean) * s} ${y - h * s} L${x + (dx + w) * s} ${y} L${x + dx * s} ${y} Z" fill="#e6f8ff"/>`).join("")).join("") +
        `<g>${range(18, i => star(80 + (i * 89) % 1440, 160 + (i * 53) % 440, 0.7, "#ffffff", "fx-twinkle", `animation-delay:-${(i * 0.37).toFixed(1)}s`))}</g>` +
        ridge(640, 24, 5, "#3f86a8", 505, "", "rock") +
        // A frozen cave floor, with cracks and shine in the ice
        L + `<path d="M0 700 Q400 670 800 690 T1600 680 L1600 900 L0 900 Z" fill="url(#ice)"/>` +
        // Light from the mouth across the ice
        `<path data-noink d="M720 690 L880 690 L1000 900 L600 900 Z" fill="#f2fbff" opacity=".45"/>` +
        `<g data-noink fill="#ffffff" opacity=".6"><path d="M560 712 L700 708 L640 730 L520 734 Z"/><path d="M1000 760 L1180 754 L1110 780 L950 784 Z"/></g>` +
        `<g fill="none" stroke="#9cc8de" stroke-width="3" stroke-linecap="round" opacity=".8"><path d="M300 720 l60 14 l40 -10 l50 18"/><path d="M900 712 l-40 16 l30 14"/><path d="M1180 730 l70 -8 l30 16"/></g>` +
        ridge(760, 16, 4, "#bcdcec", 507) +
        `<g class="fx-drift" fill="#e8f8ff" opacity=".25"><ellipse cx="500" cy="740" rx="300" ry="24"/><ellipse cx="1150" cy="760" rx="340" ry="26"/></g>`
      ),
      front: svg("", `<g fill="#ffffff"><ellipse cx="120" cy="900" rx="260" ry="90"/><ellipse cx="1500" cy="900" rx="260" ry="100"/></g>` +
        `<g fill="#bfe6f6"><path d="M60 840 l30 -70 l30 70 Z"/><path d="M110 850 l20 -46 l20 46 Z"/><path d="M1460 840 l26 -64 l26 64 Z"/><path d="M1510 850 l18 -40 l18 40 Z"/></g>` +
        `<g data-noink fill="#ecfaff"><path d="M90 770 l30 70 l-14 0 Z"/><path d="M1486 776 l26 64 l-12 0 Z"/></g>` +
        `<g fill="#d6e6f4"><ellipse cx="160" cy="910" rx="200" ry="40"/><ellipse cx="1460" cy="912" rx="200" ry="44"/></g>`)
    },

    haunted: {
      far: 665, horizon: 580,
      ground: [6, 26], fly: 0.3, tint: "#3e2a5c", haze: ["#6b5a9a", 640, 0.3],
      back: layered(
        sky("ha", [[0, "#0d0a1d"], [0.6, "#2a1f48"], [1, "#43306a"]]) + glow("hwisp", "#8fd8ff") + sky("htower", [[0, "#2c2146"], [1, "#1e1734"]]),
        fill("ha") +
        stars(50, 107, 420, "#d9d0ff") +
        sun(1260, 170, 80, "#f4eccc", "#f4eccc") +
        `<g data-noink fill="#e2d8b4"><circle cx="1235" cy="150" r="14"/><circle cx="1285" cy="195" r="10"/><circle cx="1290" cy="140" r="6"/></g>` +
        `<g class="fx-drift" fill="#4a3c70" opacity=".8"><path d="M1110 196 Q1180 180 1250 192 Q1320 178 1370 194 Q1300 206 1240 202 Q1170 210 1110 196 Z"/><path d="M1200 222 Q1260 210 1320 220 Q1360 214 1390 222 Q1320 232 1200 222 Z"/></g>` +
        `<g class="fx-bats" fill="#140f26"><path d="M0 0 q10 -10 20 0 q10 -10 20 0 q-10 4 -20 10 q-10 -6 -20 -10 Z" transform="translate(-100 220)"/><path d="M0 0 q8 -8 16 0 q8 -8 16 0 q-8 3 -16 8 q-8 -5 -16 -8 Z" transform="translate(-160 260)"/><path d="M0 0 q8 -8 16 0 q8 -8 16 0 q-8 3 -16 8 q-8 -5 -16 -8 Z" transform="translate(-60 280)"/></g>` +
        // Lavender Town houses with purple roofs on either side of the tower
        house(180, 650, 110, 70, "#3a2f58", "#6a4a9a", { glow: "#ffd36b", chimney: true, door: "#241a3a" }) + house(330, 650, 90, 56, "#3a2f58", "#6a4a9a", { glow: "#ffd36b", door: "#241a3a" }) +
        house(1020, 650, 100, 64, "#3a2f58", "#6a4a9a", { glow: "#ffd36b", chimney: true, door: "#241a3a" }) + house(1400, 650, 120, 72, "#3a2f58", "#6a4a9a", { glow: "#ffd36b", door: "#241a3a" }) +
        // The Pokémon Tower
        `<g fill="url(#htower)"><rect x="640" y="200" width="160" height="460"/><rect x="560" y="420" width="320" height="240"/></g>` +
        `<g fill="#241a3a"><path d="M620 210 L720 80 L820 210 Z"/><path d="M545 430 L600 360 L655 430 Z M785 430 L840 360 L895 430 Z"/></g>` +
        `<g data-noink fill="#3a2c5e"><path d="M620 210 L720 80 L720 210 Z"/><path d="M545 430 L600 360 L600 430 Z M785 430 L840 360 L840 430 Z"/></g>` +
        `<g data-noink fill="#33275a" opacity=".8"><rect x="640" y="200" width="22" height="460"/><rect x="560" y="420" width="22" height="240"/></g>` +
        `<path d="M720 80 L720 50" stroke="#241a3a" stroke-width="5"/><circle cx="720" cy="46" r="5" fill="#ffd36b"/>` +
        `<g stroke="#1a1230" stroke-width="3" opacity=".7">${range(8, i => `<path d="M640 ${240 + i * 50} H800"/>`)}${range(4, i => `<path d="M560 ${470 + i * 50} H640 M800 ${470 + i * 50} H880"/>`)}</g>` +
        `<g fill="#ffd36b"><rect class="fx-flicker" x="700" y="260" width="20" height="34" rx="10"/><rect x="740" y="330" width="20" height="34" rx="10" opacity=".85"/><rect class="fx-flicker" style="animation-delay:-1.3s" x="610" y="480" width="22" height="36" rx="11"/><rect x="820" y="500" width="22" height="36" rx="11" opacity=".85"/><circle cx="720" cy="150" r="12" opacity=".7"/></g>` +
        glowAt(720, 300, 120, "#ffd36b", 0.25) +
        `<path d="M690 660 L690 610 Q720 580 750 610 L750 660 Z" fill="#140f26"/>` +
        L + ridge(640, 20, 5, "#2a1f44", 109, "", "grass") +
        // Bare trees with thin branches
        `<g fill="none" stroke="#1d1530" stroke-linecap="round"><path stroke-width="14" d="M180 660 L190 520"/><path stroke-width="8" d="M190 560 L150 520 M188 590 L230 540 M190 520 L170 480 M190 520 L215 490"/><path stroke-width="4" d="M150 520 L130 510 M230 540 L250 520 M170 480 L160 460 M215 490 L230 470"/>` +
        `<path stroke-width="14" d="M1440 660 L1430 540"/><path stroke-width="8" d="M1432 580 L1470 545 M1430 540 L1400 500 M1430 560 L1460 520"/><path stroke-width="4" d="M1470 545 L1490 540 M1400 500 L1390 480 M1460 520 L1474 500"/></g>` +
        // An iron fence round the graves
        `<g data-stand="690"><g stroke="#1d1530" stroke-width="4" stroke-linecap="round">${range(10, i => `<path d="M${470 + i * 26} 690 V650"/>`)}<path d="M466 660 H708"/></g>` +
        `<g fill="#1d1530">${range(10, i => `<path d="M${466 + i * 26} 652 l4 -10 l4 10 Z"/>`)}</g></g>` +
        // Graves: each stone is lit on one side and carved with a line
        [[290, 700, 30, 60], [404, 710, 24, 44], [1178, 705, 28, 56]].map(([x, y, r, h]) => stand(y, `<path d="M${x - r} ${y} v${-h} a${r} ${r} 0 0 1 ${r * 2} 0 v${h} Z" fill="#4a3e66"/>` +
          `<path data-noink d="M${x - r + 6} ${y} v${-h} a${r - 6} ${r - 6} 0 0 1 ${r * 0.6} ${-(r - 8)} L${x - r * 0.2} ${y} Z" fill="#5c4f7c"/><path data-noink d="M${x - r * 0.4} ${y - h * 0.9} h${r * 0.8} M${x} ${y - h * 1.1} v${h * 0.5}" stroke="#2e2546" stroke-width="3" stroke-linecap="round"/>` +
          `<ellipse data-noink cx="${x}" cy="${y + 2}" rx="${r * 1.5}" ry="5" fill="#140f26" opacity=".4"/>`)).join("") +
        `<g data-stand="710" fill="#4a3e66"><rect x="1330" y="650" width="12" height="60"/><rect x="1312" y="664" width="48" height="12"/></g>` +
        L + ridge(720, 14, 4, "#33284f", 113, "", "grass") +
        // Candles by the graves
        [[340, 735], [1230, 744]].map(([x, y], i) => `<rect x="${x - 4}" y="${y - 16}" width="8" height="16" rx="2" fill="#e8e0f4"/>${glowAt(x, y - 22, 26, "#ffd36b", 0.8, "fx-pulse")}<path class="fx-flicker" style="animation-delay:-${i}s" d="M${x} ${y - 30} q6 7 0 12 q-6 -5 0 -12 Z" fill="#ffd36b"/>`).join("") +
        `<circle class="fx-float" cx="460" cy="560" r="40" fill="url(#hwisp)"/><circle class="fx-float" style="animation-delay:-3s" cx="1060" cy="520" r="34" fill="url(#hwisp)"/><circle class="fx-float" style="animation-delay:-5s" cx="1500" cy="600" r="30" fill="url(#hwisp)"/>`
      ),
      front: svg("", `<g class="fx-drift" fill="#d6cff0" opacity=".2"><ellipse cx="300" cy="870" rx="460" ry="70"/><ellipse cx="1200" cy="880" rx="520" ry="80"/></g>` +
        `<g class="fx-drift fx-drift--rev" fill="#d6cff0" opacity=".14"><ellipse cx="800" cy="840" rx="600" ry="50"/></g>` +
        `<g fill="#1d1530"><ellipse cx="80" cy="910" rx="200" ry="80"/><ellipse cx="1540" cy="910" rx="200" ry="90"/></g>`)
    },

    space: {
      far: 640, horizon: 580,
      ground: [6, 26], fly: 0.25, tint: "#4a3a7a", haze: ["#6c5a9e", 560, 0.3],
      back: layered(
        sky("sc", [[0, "#100c2a"], [0.55, "#35286a"], [1, "#6a4f8f"]]) +
        glow("sclamp", "#ffe08a") + sky("plaza", [[0, "#8a7f99"], [1, "#5a5070"]]) + sky("silph", [[0, "#4a3d86"], [1, "#2e2560"]]),
        fill("sc") +
        // A faint purple band of stars across the night
        `<path data-noink d="M0 260 Q400 120 900 180 T1600 60 L1600 140 Q1200 230 900 250 T0 340 Z" fill="#8a6cd6" opacity=".08"/>` +
        stars(60, 601, 380, "#e8e0ff") +
        sun(1320, 130, 50, "#f4eccc", "#f4eccc") +
        // Far skyline
        `<g fill="#2a2150">${range(22, i => { const w = 50 + ((i * 37) % 50), h = 120 + ((i * 71) % 170); return `<rect x="${i * 76 - 20}" y="${560 - h}" width="${w}" height="${h}"/>`; })}</g>` +
        `<g data-noink fill="#332a60">${range(22, i => { const w = 50 + ((i * 37) % 50), h = 120 + ((i * 71) % 170); return `<rect x="${i * 76 - 20}" y="${560 - h}" width="${w * 0.35}" height="${h}"/>`; })}</g>` +
        `<g fill="#ffd36b" opacity=".6">${range(80, i => `<rect x="${(i * 97) % 1600}" y="${410 + ((i * 53) % 130)}" width="6" height="8"/>`)}</g>` +
        // The Magnet Train track running behind the city
        `<g fill="#3a2f6e"><rect x="0" y="512" width="${W}" height="10"/>${range(9, i => `<rect x="${i * 200 + 40}" y="520" width="12" height="50"/>`)}</g>` +
        `<g transform="translate(900 482)"><path d="M0 30 L0 12 Q0 0 14 0 L170 0 Q206 0 226 30 Z" fill="#e8ecf4"/><rect data-noink x="0" y="20" width="216" height="6" fill="#2a75bb"/><g fill="#9fd4f0">${range(5, i => `<rect x="${16 + i * 30}" y="6" width="20" height="10" rx="2"/>`)}</g></g>` +
        // Silph Co. tower in the middle of the city, kept low so the sign clears the centred title
        `<rect x="700" y="290" width="200" height="280" fill="url(#silph)"/><rect data-noink x="700" y="290" width="40" height="280" fill="#5a4c9a" opacity=".6"/><rect x="730" y="250" width="140" height="44" fill="#3a2f6e"/><path d="M800 250 L800 190" stroke="#3a2f6e" stroke-width="6"/>` +
        `<circle class="fx-flicker" cx="800" cy="188" r="7" fill="#ff5a5a"/>` +
        `<g fill="#9fd4f0" opacity=".85">${range(25, i => `<rect x="${716 + (i % 5) * 36}" y="${360 + Math.floor(i / 5) * 42}" width="22" height="22" rx="2"/>`)}</g>` +
        `<g data-noink fill="#e2f4ff" opacity=".6">${range(25, i => `<rect x="${718 + (i % 5) * 36}" y="${362 + Math.floor(i / 5) * 42}" width="7" height="9" rx="1"/>`)}</g>` +
        `<rect x="720" y="308" width="160" height="34" rx="4" fill="#1e2230"/><text x="800" y="332" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="20" letter-spacing="2" fill="#ffd84a">SILPH CO.</text>` +
        L + ridge(600, 14, 5, "#4a3d6e", 603) +
        // Pokémon Center on the left, Poké Mart on the right
        `<g transform="translate(220 470)"><rect x="0" y="40" width="220" height="110" fill="#f4efe4"/><rect data-noink x="130" y="40" width="90" height="110" fill="#e6dfd0"/><path d="M-14 46 L110 0 L234 46 Z" fill="#e3350d"/><path data-noink d="M110 0 L234 46 L110 46 Z" fill="#c22c0a"/><rect x="84" y="88" width="52" height="62" fill="#9fd4f0"/><path data-noink d="M110 88 V150" stroke="#7fb8d8" stroke-width="3"/>` +
        `<circle cx="110" cy="64" r="16" fill="#ffffff" stroke="#1e2230" stroke-width="4"/><path d="M94 64 H126" stroke="#1e2230" stroke-width="4"/><circle cx="110" cy="64" r="5" fill="#ffffff" stroke="#1e2230" stroke-width="3"/>` +
        `<g fill="#ffd36b"><rect x="22" y="80" width="40" height="28" rx="3"/><rect x="158" y="80" width="40" height="28" rx="3"/></g></g>` +
        `<g transform="translate(1160 490)"><rect x="0" y="34" width="200" height="96" fill="#f4efe4"/><rect data-noink x="120" y="34" width="80" height="96" fill="#e6dfd0"/><path d="M-12 40 L100 0 L212 40 Z" fill="#2a75bb"/><path data-noink d="M100 0 L212 40 L100 40 Z" fill="#225f98"/><rect x="76" y="70" width="48" height="60" fill="#9fd4f0"/><path data-noink d="M100 70 V130" stroke="#7fb8d8" stroke-width="3"/>` +
        `<rect x="60" y="44" width="80" height="20" rx="3" fill="#2a75bb"/><text x="100" y="60" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="14" fill="#ffffff">MART</text>` +
        `<g fill="#ffd36b"><rect x="18" y="72" width="38" height="26" rx="3"/><rect x="144" y="72" width="38" height="26" rx="3"/></g></g>` +
        ridge(660, 12, 5, "#5a4d7a", 605) +
        L + `<path d="M0 700 Q400 690 800 696 T1600 692 L1600 900 L0 900 Z" fill="url(#plaza)"/>` +
        `<g stroke="#7a6f8c" stroke-width="3" opacity=".6">${range(9, i => `<path d="M${-200 + i * 260} 900 L${400 + i * 100} 700"/>`)}<path d="M0 760 H1600 M0 830 H1600"/></g>` +
        `<g data-noink fill="#ffe08a" opacity=".14"><ellipse cx="500" cy="740" rx="160" ry="22"/><ellipse cx="1100" cy="740" rx="160" ry="22"/></g>` +
        // Flower planters along the plaza
        [[300, 745], [1300, 748]].map(([x, y]) => stand(y, `<rect x="${x - 60}" y="${y - 26}" width="120" height="26" rx="4" fill="#8a7f99"/><rect data-noink x="${x - 60}" y="${y - 26}" width="120" height="7" rx="3" fill="#a69cb4"/>` +
          bush(x, y - 24, 0.42, "#4f7350", "#e58fd0"))).join("") +
        // Street lamps
        [[500, 0], [1100, 2.5]].map(([x, d]) => `<g data-stand="712"><rect x="${x - 4}" y="560" width="8" height="150" fill="#2a2440"/><rect x="${x - 12}" y="700" width="24" height="10" rx="3" fill="#2a2440"/><path d="M${x - 16} 552 L${x + 16} 552 L${x + 10} 540 L${x - 10} 540 Z" fill="#2a2440"/>` +
          `<circle class="fx-pulse"${d ? ` style="animation-delay:-${d}s"` : ""} cx="${x}" cy="562" r="90" fill="url(#sclamp)" opacity=".65"/><circle cx="${x}" cy="562" r="12" fill="#ffe08a"/></g>`).join("") +
        dots(26, 607, "#d9b8ff", 360, 800, 2.2, "fx-float")
      ),
      front: svg("", `<g fill="#3c5a3e"><ellipse cx="90" cy="890" rx="210" ry="80"/><ellipse cx="1510" cy="890" rx="220" ry="86"/></g>` +
        `<g fill="#4f7350"><ellipse cx="60" cy="852" rx="120" ry="44"/><ellipse cx="1540" cy="850" rx="130" ry="46"/></g>` +
        `<g fill="#e58fd0"><circle cx="40" cy="840" r="7"/><circle cx="100" cy="856" r="7"/><circle cx="1510" cy="842" r="7"/><circle cx="1570" cy="858" r="7"/></g>`)
    }
  };

  // Build each scene's layers. Far layers get a band of haze in the scene's air
  // colour, so they fade into the distance; style.css also blurs them slightly.
  for (const [key, scene] of Object.entries(window.SCENES)) {
    const { defs, parts } = scene.back;
    // Lighter haze than the classic set: the artwork's colours stay clear and bright
    const [color, y, haze0] = scene.haze, strength = haze0 * 0.55;
    const id = "hz" + key;
    const hazeDef = `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity="0"/><stop offset="${(y - 260) / H}" stop-color="${color}" stop-opacity="0"/><stop offset="${y / H}" stop-color="${color}" stop-opacity="${strength}"/><stop offset="1" stop-color="${color}" stop-opacity="${strength * 0.2}"/></linearGradient>`;
    const haze = `<rect width="${W}" height="${H}" fill="url(#${id})"/>`;
    // Lines get thicker towards the front, like nearer things in a drawing
    const inked = parts.map((part, i) => ink(part, [2, 3, 4][i] ?? 4));
    scene.layers = inked.map((part, i) => svg(defs + hazeDef, part + (i < parts.length - 1 ? haze : "")));
    scene.thumb = svg(defs + hazeDef, inked.join(haze));
    scene.front = ink(scene.front, 3.5);
  }
})();
