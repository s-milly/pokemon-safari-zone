/*
  Hand-drawn SVG backgrounds, one per habitat.
  Each scene has a back layer (behind the Pokémon) and a front layer (grass,
  rocks or waves drawn over their feet). ground is the band, in percent from
  the bottom of the screen, where Pokémon stand. fly lets some float higher.
  Classes starting with fx- are gentle loops defined in style.css; they stop
  under reduced motion and on the home screen thumbnails.
*/
(function () {
  const W = 1600, H = 900;

  function rng(seed) {
    let s = seed % 2147483647 || 1;
    return () => (s = s * 16807 % 2147483647) / 2147483647;
  }

  // A wavy ridge from the left edge to the right, filled down to the bottom
  function ridge(y, amp, bumps, fill, seed, extra = "") {
    const r = rng(seed);
    const step = W / bumps;
    let d = `M0 ${H} L0 ${y + (r() - 0.5) * amp}`;
    for (let i = 1; i <= bumps; i++) {
      const x = i * step, cy = y + (r() - 0.5) * amp * 2;
      d += ` Q${x - step / 2} ${cy - amp * r()} ${x} ${y + (r() - 0.5) * amp}`;
    }
    return `<path d="${d} L${W} ${H} Z" fill="${fill}" ${extra}/>`;
  }

  // Blades of grass along a line
  function tufts(y, fill, count, seed, height = 60) {
    const r = rng(seed);
    let out = "";
    for (let i = 0; i < count; i++) {
      const x = (i + r() * 0.8) * (W / count), h = height * (0.6 + r() * 0.7), w = 14 + r() * 16;
      out += `<path d="M${x - w} ${y} Q${x - w * 0.2} ${y - h * 0.6} ${x + r() * 18 - 9} ${y - h} Q${x + w * 0.1} ${y - h * 0.5} ${x + w} ${y} Z" fill="${fill}"/>`;
    }
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

  // Pine trees, optionally with snow on the branches
  function pines(baseY, count, fill, seed, size, snow = "") {
    const r = rng(seed);
    let out = "";
    for (let i = 0; i < count; i++) {
      const x = (i + r() * 0.6) * (W / count), h = size * (0.7 + r() * 0.6), w = h * 0.36;
      out += `<path d="M${x} ${baseY - h} L${x + w * 0.55} ${baseY - h * 0.55} L${x + w * 0.3} ${baseY - h * 0.55} L${x + w} ${baseY} L${x - w} ${baseY} L${x - w * 0.3} ${baseY - h * 0.55} L${x - w * 0.55} ${baseY - h * 0.55} Z" fill="${fill}"/>`;
      if (snow) out += `<path d="M${x} ${baseY - h} L${x + w * 0.32} ${baseY - h * 0.74} Q${x} ${baseY - h * 0.68} ${x - w * 0.32} ${baseY - h * 0.74} Z" fill="${snow}"/>`;
    }
    return out;
  }

  // A round leafy tree with a lit side
  function tree(x, y, s, dark, light, trunk) {
    return `<rect x="${x - 10 * s}" y="${y - 140 * s}" width="${20 * s}" height="${140 * s}" rx="${6 * s}" fill="${trunk}"/>` +
      `<circle cx="${x - 50 * s}" cy="${y - 150 * s}" r="${70 * s}" fill="${dark}"/><circle cx="${x + 45 * s}" cy="${y - 160 * s}" r="${75 * s}" fill="${dark}"/>` +
      `<circle cx="${x}" cy="${y - 220 * s}" r="${85 * s}" fill="${dark}"/><circle cx="${x + 20 * s}" cy="${y - 235 * s}" r="${55 * s}" fill="${light}"/>` +
      `<circle cx="${x + 60 * s}" cy="${y - 175 * s}" r="${40 * s}" fill="${light}"/>`;
  }

  function cloud(x, y, s, fill, cls = "fx-drift") {
    return `<g class="${cls}" fill="${fill}"><ellipse cx="${x}" cy="${y}" rx="${110 * s}" ry="${26 * s}"/><ellipse cx="${x + 40 * s}" cy="${y - 20 * s}" rx="${60 * s}" ry="${30 * s}"/><ellipse cx="${x - 40 * s}" cy="${y - 10 * s}" rx="${45 * s}" ry="${22 * s}"/></g>`;
  }

  function sky(id, stops) {
    return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("")}</linearGradient>`;
  }
  function glow(id, color) {
    return `<radialGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity=".9"/><stop offset=".35" stop-color="${color}" stop-opacity=".35"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`;
  }

  // Two copies stacked so the falling loop has no gap
  const snowfall = (flakes, cls) => `<g class="snowfall${cls}"><g>${flakes}</g><g transform="translate(0 -900)">${flakes}</g></g>`;

  const svg = (defs, inner) => `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>${inner}</svg>`;
  // Splits a background into far, middle and near layers (see layered below)
  const L = "\u0000";
  const layered = (defs, inner) => ({ defs, parts: inner.split(L) });

  const fill = id => `<rect width="${W}" height="${H}" fill="url(#${id})"/>`;

  window.SCENES = {
    forest: {
      ground: [6, 26], tint: "#2f6b3a", haze: ["#e9f3d6", 560, 0.45],
      back: layered(
        sky("fs", [[0, "#a9dccb"], [0.55, "#eef4cf"], [1, "#eef4cf"]]) + glow("fsun", "#fff6c4") +
        sky("fpath", [[0, "#d9c08f"], [1, "#b99566"]]),
        fill("fs") +
        `<circle cx="1250" cy="170" r="240" fill="url(#fsun)"/><circle cx="1250" cy="170" r="62" fill="#fffbe0"/>` +
        `<g class="fx-pulse" fill="#fffbe0" opacity=".14"><path d="M1250 170 L700 900 L860 900 Z"/><path d="M1250 170 L1020 900 L1130 900 Z"/><path d="M1250 170 L420 900 L520 900 Z"/></g>` +
        cloud(330, 140, 1, "#ffffff") +
        ridge(470, 50, 4, "#b9d9c4", 2) +
        pines(530, 26, "#94c3a0", 3, 240) +
        ridge(545, 30, 6, "#7db58a", 5) +
        L + pines(605, 15, "#4b8f5d", 7, 320) +
        ridge(625, 24, 5, "#5aa365", 11) +
        tree(180, 690, 1.2, "#2f7a45", "#3f9455", "#6b4a32") + tree(1420, 680, 1.35, "#2f7a45", "#3f9455", "#6b4a32") +
        L + ridge(700, 18, 4, "#7cc46a", 13) +
        `<path d="M700 900 C760 820 820 760 790 700 L830 700 C880 760 900 830 960 900 Z" fill="url(#fpath)" opacity=".8"/>` +
        dots(40, 15, "#ffffff", 720, 860, 3) + dots(30, 16, "#ffd84a", 720, 860, 3) + dots(20, 18, "#ff9ec4", 720, 860, 3) +
        `<g fill="#fff3a0">${dots(18, 21, "#fff3a0", 420, 760, 3, "fx-float")}</g>`
      ),
      front: svg("", tufts(900, "#3f9a49", 60, 17, 90) + tufts(900, "#56b25a", 40, 19, 60) +
        `<ellipse cx="80" cy="880" rx="190" ry="90" fill="#2e7f3c"/><ellipse cx="60" cy="850" rx="120" ry="50" fill="#3d9a4c"/>` +
        `<ellipse cx="1540" cy="890" rx="200" ry="100" fill="#2e7f3c"/><ellipse cx="1560" cy="850" rx="120" ry="50" fill="#3d9a4c"/>` +
        `<g fill="#e23b3b"><circle cx="40" cy="840" r="7"/><circle cx="110" cy="855" r="7"/><circle cx="1520" cy="845" r="7"/><circle cx="1580" cy="860" r="7"/></g>`)
    },

    route: {
      ground: [6, 26], tint: "#3f8f4a", haze: ["#e6f6ff", 540, 0.4],
      back: layered(
        sky("rt", [[0, "#7cc6f2"], [0.6, "#dff3fd"], [1, "#e9f7fd"]]) + glow("rsun", "#fffbe0") +
        sky("rpath", [[0, "#ead6a4"], [1, "#d1b47a"]]),
        fill("rt") +
        `<circle cx="1320" cy="140" r="200" fill="url(#rsun)"/><circle cx="1320" cy="140" r="54" fill="#fffde8"/>` +
        cloud(300, 130, 1.1, "#ffffff") + cloud(860, 200, 0.8, "#ffffff") +
        ridge(470, 40, 4, "#b5dcc0", 201) +
        // Pallet Town on the far hill: little houses and Professor Oak's lab
        `<g transform="translate(980 452)"><rect x="0" y="0" width="54" height="36" fill="#f4efe4"/><path d="M-6 2 L27 -22 L60 2 Z" fill="#d9534a"/><rect x="20" y="16" width="12" height="20" fill="#8a6440"/>` +
        `<rect x="80" y="4" width="50" height="32" fill="#f4efe4"/><path d="M74 6 L105 -16 L136 6 Z" fill="#d9534a"/><rect x="98" y="18" width="12" height="18" fill="#8a6440"/>` +
        `<rect x="160" y="-8" width="96" height="44" fill="#e8ecef"/><path d="M152 -6 L208 -30 L264 -6 Z" fill="#8f9aa6"/><g fill="#9fd4f0"><rect x="172" y="6" width="16" height="12"/><rect x="228" y="6" width="16" height="12"/></g><rect x="200" y="16" width="16" height="20" fill="#6b7a88"/></g>` +
        ridge(540, 26, 6, "#93cc95", 203) +
        L + tree(140, 640, 0.7, "#3b8a4a", "#4fa25c", "#6b4a32") + tree(300, 630, 0.55, "#3b8a4a", "#4fa25c", "#6b4a32") +
        tree(1460, 640, 0.75, "#3b8a4a", "#4fa25c", "#6b4a32") + tree(1300, 628, 0.5, "#3b8a4a", "#4fa25c", "#6b4a32") +
        ridge(620, 18, 5, "#7cc274", 207) +
        `<g fill="#ffffff">${Array.from({ length: 12 }, (_, i) => `<rect x="${430 + i * 24}" y="600" width="8" height="34" rx="3"/>`).join("")}<rect x="426" y="608" width="290" height="6" rx="3"/><rect x="426" y="622" width="290" height="6" rx="3"/></g>` +
        `<g><rect x="1066" y="590" width="8" height="54" fill="#7a5236"/><rect x="1030" y="566" width="80" height="34" rx="5" fill="#a0734a" stroke="#7a5236" stroke-width="4"/><text x="1070" y="590" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="18" fill="#fff4dc">ROUTE 1</text></g>` +
        L + ridge(700, 16, 4, "#86cf6b", 211) +
        `<path d="M720 900 C760 820 820 760 790 690 L840 690 C880 760 900 830 980 900 Z" fill="url(#rpath)"/>` +
        // A one-way ledge across the meadow
        `<path d="M0 742 Q300 730 600 744 L600 756 Q300 744 0 756 Z" fill="#4f9a4a"/><path d="M1000 748 Q1300 736 1600 748 L1600 760 Q1300 750 1000 762 Z" fill="#4f9a4a"/>` +
        // Patches of tall grass where wild Pokémon hide
        `<g fill="#2f7f3a">${Array.from({ length: 2 }, (_, k) => Array.from({ length: 9 }, (_, i) => `<path d="M${(k ? 1120 : 180) + i * 34} ${790} l14 -34 l14 34 Z"/>`).join("")).join("")}</g>` +
        dots(30, 213, "#ffffff", 700, 880, 3) + dots(24, 215, "#ffd84a", 700, 880, 3) + dots(14, 217, "#ff8fb1", 700, 880, 3)
      ),
      front: svg("", tufts(900, "#3f9a49", 60, 219, 90) + tufts(900, "#5cb85c", 40, 221, 60) +
        `<g fill="#2b7a36">${Array.from({ length: 14 }, (_, i) => `<path d="M${-20 + i * 30} 900 l15 -60 l15 60 Z"/><path d="M${1200 + i * 30} 900 l15 -54 l15 54 Z"/>`).join("")}</g>`)
    },

    safari: {
      ground: [6, 26], tint: "#8a6a24", haze: ["#fde3b0", 560, 0.45],
      back: layered(
        sky("ss", [[0, "#f3a76d"], [0.5, "#fde0a8"], [1, "#fde7b5"]]) + glow("ssun", "#fff0b8"),
        fill("ss") +
        `<circle cx="420" cy="320" r="260" fill="url(#ssun)"/><circle cx="420" cy="320" r="100" fill="#fff2c2"/>` +
        cloud(1100, 150, 0.9, "#ffe9cf") +
        `<g class="fx-drift" fill="none" stroke="#7a5236" stroke-width="4" stroke-linecap="round"><path d="M900 230 q12 -10 24 0 q12 -10 24 0"/><path d="M960 260 q9 -8 18 0 q9 -8 18 0"/><path d="M1010 220 q10 -9 20 0 q10 -9 20 0"/></g>` +
        `<path d="M880 560 L950 430 L1190 430 L1250 560 Z" fill="#d79e66"/><path d="M1190 430 L1250 560 L1150 560 Z" fill="#c2854f"/>` +
        `<path d="M1250 560 L1295 475 L1430 475 L1470 560 Z" fill="#dcaa74"/><path d="M1430 475 L1470 560 L1400 560 Z" fill="#c99260"/>` +
        L + ridge(560, 20, 6, "#d8c07a", 23) +
        `<g fill="#6f5a35"><path d="M286 610 L290 500 L250 470 M290 500 L330 468" stroke="#6f5a35" stroke-width="12" fill="none" stroke-linecap="round"/><ellipse cx="290" cy="465" rx="130" ry="26"/><ellipse cx="300" cy="452" rx="90" ry="18" fill="#857043"/>` +
        `<path d="M1126 610 L1128 520 L1100 500 M1128 520 L1156 498" stroke="#6f5a35" stroke-width="9" fill="none" stroke-linecap="round"/><ellipse cx="1128" cy="496" rx="95" ry="20"/><ellipse cx="1136" cy="486" rx="64" ry="13" fill="#857043"/></g>` +
        ridge(640, 20, 5, "#c9b766", 29) +
        L + `<g fill="#8a6440">${Array.from({ length: 14 }, (_, i) => `<rect x="${560 + i * 40}" y="610" width="10" height="56" rx="3"/>`).join("")}<rect x="555" y="622" width="540" height="8" rx="3"/><rect x="555" y="646" width="540" height="8" rx="3"/></g>` +
        ridge(720, 14, 4, "#b7ad5a", 31) +
        `<g fill="#a99a73"><ellipse cx="300" cy="760" rx="60" ry="24"/><ellipse cx="1300" cy="770" rx="44" ry="18"/></g>`
      ),
      front: svg("", tufts(900, "#9c8f3c", 70, 37, 120) + tufts(900, "#c2b45a", 50, 41, 80) + tufts(900, "#d9cb72", 26, 43, 50))
    },

    sea: {
      ground: [8, 34], fly: 0.25, tint: "#1f6fa0",
      // Where the water is, in drawing units of a layer: here, everything below the horizon
      water: { top: 414, bottom: 900, layer: 0 }, haze: ["#e2f4fb", 420, 0.35],
      back: layered(
        sky("se", [[0, "#7fc8ee"], [1, "#e2f4fb"]]) + sky("sw", [[0, "#4fb4de"], [0.4, "#2b8cc4"], [1, "#165a93"]]) + glow("sesun", "#fff6cc"),
        `<rect width="${W}" height="420" fill="url(#se)"/><rect y="414" width="${W}" height="${H - 414}" fill="url(#sw)"/>` +
        `<circle cx="1300" cy="150" r="200" fill="url(#sesun)"/><circle cx="1300" cy="150" r="58" fill="#fffbe0"/>` +
        cloud(320, 150, 1.1, "#ffffff") + cloud(880, 220, 0.8, "#ffffff") +
        // The S.S. Anne at anchor on the horizon, near the middle so phones see it too
        `<g transform="translate(-480 0)">` +
        `<g class="fx-drift" fill="#c9ced6" opacity=".7"><ellipse cx="1290" cy="200" rx="34" ry="16"/><ellipse cx="1260" cy="176" rx="42" ry="18"/><ellipse cx="1350" cy="212" rx="28" ry="13"/></g>` +
        `<g><rect x="1296" y="228" width="34" height="64" fill="#d9534a"/><rect x="1296" y="228" width="34" height="12" fill="#1e2230"/>` +
        `<rect x="1356" y="238" width="34" height="54" fill="#d9534a"/><rect x="1356" y="238" width="34" height="12" fill="#1e2230"/>` +
        `<path d="M1160 318 L1160 238" stroke="#4a5568" stroke-width="4"/><path d="M1160 240 L1300 232 M1390 244 L1470 300" stroke="#4a5568" stroke-width="2" fill="none"/>` +
        `<g fill="#ffcb05"><path d="M1190 238 l6 10 l6 -10 Z"/><path d="M1240 235 l6 10 l6 -10 Z"/></g><g fill="#2a75bb"><path d="M1215 236 l6 10 l6 -10 Z"/><path d="M1265 234 l6 10 l6 -10 Z"/></g>` +
        `<rect x="1180" y="286" width="230" height="34" rx="3" fill="#f4f4f0"/><rect x="1196" y="266" width="80" height="22" rx="3" fill="#f4f4f0"/>` +
        `<rect x="1120" y="318" width="330" height="36" rx="3" fill="#ffffff"/>` +
        `<g fill="#5aa8d6">${Array.from({ length: 9 }, (_, i) => `<rect x="${1196 + i * 24}" y="296" width="14" height="10" rx="2"/>`).join("")}${Array.from({ length: 13 }, (_, i) => `<rect x="${1134 + i * 24}" y="328" width="14" height="12" rx="2"/>`).join("")}<rect x="1206" y="272" width="60" height="8" rx="2"/></g>` +
        `<path d="M1030 352 L1520 352 L1486 418 L1074 418 Z" fill="#f4f4f0"/>` +
        `<path d="M1052 384 L1505 384 L1486 418 L1074 418 Z" fill="#24375f"/><path d="M1050 384 L1506 384" stroke="#d9534a" stroke-width="5"/>` +
        `<g fill="#24375f">${Array.from({ length: 16 }, (_, i) => `<circle cx="${1090 + i * 26}" cy="368" r="4"/>`).join("")}</g>` +
        `<text x="1290" y="410" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="22" letter-spacing="3" fill="#ffffff">S.S. ANNE</text></g>` +
        `<path d="M1040 418 Q1280 426 1520 418" stroke="#ffffff" stroke-width="4" opacity=".7" fill="none"/></g>` +
        `<rect y="412" width="${W}" height="4" fill="#ffffff" opacity=".5"/>` +
        L + `<g class="fx-shimmer" fill="#fffbe0">${Array.from({ length: 12 }, (_, i) => `<rect x="${1240 + ((i * 37) % 120)}" y="${430 + i * 22}" width="${40 - i * 2}" height="4" rx="2" opacity="${(0.9 - i * 0.06).toFixed(2)}"/>`).join("")}</g>` +
        `<g class="fx-wave" stroke="#ffffff" stroke-opacity=".35" stroke-width="4" fill="none" stroke-linecap="round">` +
        Array.from({ length: 10 }, (_, i) => `<path d="M${(i * 197) % 1500} ${470 + i * 42} q30 -12 60 0 t60 0"/>`).join("") + `</g>` +
        L + `<g fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" class="fx-drift"><path d="M560 260 q14 -12 28 0 q14 -12 28 0"/><path d="M620 300 q10 -9 20 0 q10 -9 20 0"/></g>`
      ),
      front: svg(sky("sand", [[0, "#f3dca6"], [1, "#e2c387"]]),
        `<path class="fx-foam" d="M-100 860 Q0 820 100 860 T300 860 T500 860 T700 860 T900 860 T1100 860 T1300 860 T1500 860 T1700 860 L1700 900 L-100 900 Z" fill="#e8f7ff" opacity=".85"/>` +
        `<path d="M-40 900 Q40 800 260 830 Q360 850 420 900 Z" fill="url(#sand)"/>` +
        `<path d="M-80 900 Q60 780 200 840 Q260 870 280 900 Z" fill="#6d6560"/><path d="M60 820 Q120 800 170 830" stroke="#8d847d" stroke-width="8" fill="none" stroke-linecap="round"/>` +
        `<path d="M1380 900 Q1460 790 1580 820 L1640 900 Z" fill="#6d6560"/><path d="M1450 820 Q1500 800 1550 815" stroke="#8d847d" stroke-width="8" fill="none" stroke-linecap="round"/>` +
        `<path d="M300 880 l10 -14 l10 14 l-10 6 Z M290 872 l-14 -6 M330 872 l14 -6" fill="#f27b5a" stroke="#f27b5a" stroke-width="4"/>`)
    },

    cave: {
      ground: [6, 24], tint: "#4b3a6b", haze: ["#6d5a9a", 560, 0.3],
      back: layered(
        sky("cv", [[0, "#17122a"], [1, "#3c3150"]]) + glow("cgl", "#8fe3ff") + glow("ctn", "#6d8fd6"),
        fill("cv") +
        `<ellipse cx="800" cy="500" rx="200" ry="150" fill="url(#ctn)" opacity=".5"/><path d="M640 640 Q650 400 800 380 Q950 400 960 640 Z" fill="#0f0b1d" opacity=".6"/>` +
        ridge(470, 70, 4, "#2b2342", 41) +
        `<g fill="#2a2240">` + Array.from({ length: 16 }, (_, i) => { const x = i * 105 + 20, h = 60 + ((i * 53) % 150); return `<path d="M${x - 34} 0 L${x + 34} 0 L${x} ${h} Z"/><path d="M${x + 6} 0 L${x + 34} 0 L${x + 3} ${h * 0.92} Z" fill="#3a3058"/>`; }).join("") + `</g>` +
        L + ridge(560, 60, 5, "#3a2f52", 43) +
        `<g fill="#2f2747"><path d="M480 600 L505 500 L530 600 Z"/><path d="M1060 610 L1080 530 L1100 610 Z"/><path d="M1110 610 L1124 560 L1138 610 Z"/></g>` +
        `<circle class="fx-pulse" cx="280" cy="570" r="140" fill="url(#cgl)" opacity=".45"/><circle class="fx-pulse" cx="1272" cy="560" r="160" fill="url(#cgl)" opacity=".45" style="animation-delay:-2s"/>` +
        `<g fill="#9ee7ff"><path d="M260 600 l20 -70 l20 70 Z"/><path d="M300 605 l14 -46 l14 46 Z"/><path d="M236 604 l12 -34 l12 34 Z"/><path d="M1250 590 l22 -80 l22 80 Z"/><path d="M1300 600 l14 -50 l14 50 Z"/><path d="M1222 598 l12 -36 l12 36 Z"/></g>` +
        `<g fill="#e4faff" opacity=".8"><path d="M270 590 l10 -50 l4 50 Z"/><path d="M1262 580 l10 -58 l4 58 Z"/></g>` +
        L + ridge(680, 20, 4, "#56486e", 47) +
        `<ellipse cx="800" cy="760" rx="170" ry="26" fill="#2c2a55"/><ellipse class="fx-pulse" cx="800" cy="756" rx="120" ry="10" fill="#9ee7ff" opacity=".25"/>` +
        dots(30, 49, "#cfe9ff", 120, 700, 1.6, "fx-float")
      ),
      front: svg("", `<g fill="#2b2340"><ellipse cx="120" cy="890" rx="230" ry="110"/><ellipse cx="1500" cy="900" rx="240" ry="120"/><ellipse cx="800" cy="930" rx="300" ry="60"/></g>` +
        `<g fill="none" stroke="#5d4f80" stroke-width="6" stroke-linecap="round"><path d="M-40 800 Q80 770 200 790"/><path d="M1340 800 Q1460 770 1600 790"/></g>`)
    },

    fossil: {
      ground: [6, 24], tint: "#8a4f2a", haze: ["#fbe3c0", 520, 0.4],
      back: layered(
        sky("fo", [[0, "#f3c48e"], [1, "#fbe9cc"]]) + glow("fosun", "#fff2cc"),
        fill("fo") +
        `<circle cx="1180" cy="140" r="180" fill="url(#fosun)"/><circle cx="1180" cy="140" r="50" fill="#fff6dc"/>` +
        ridge(360, 40, 4, "#d7925e", 53) +
        `<g stroke="#c47c4b" stroke-width="3" opacity=".6">${Array.from({ length: 6 }, (_, i) => `<path d="M0 ${400 + i * 16} Q400 ${390 + i * 16} 800 ${404 + i * 16} T1600 ${398 + i * 16}"/>`).join("")}</g>` +
        ridge(440, 30, 5, "#c47c4b", 59) + L + ridge(520, 26, 5, "#b46c3e", 61) +
        `<g stroke="#a35f34" stroke-width="3" opacity=".6">${Array.from({ length: 5 }, (_, i) => `<path d="M0 ${560 + i * 14} Q400 ${552 + i * 14} 800 ${566 + i * 14} T1600 ${558 + i * 14}"/>`).join("")}</g>` +
        `<g fill="none" stroke="#f3dcc0" stroke-width="10" stroke-linecap="round" opacity=".85">` +
        `<path d="M300 480 a26 26 0 1 1 -26 -26 a40 40 0 1 1 40 40"/>` +
        `<path d="M900 470 L1180 470"/>${Array.from({ length: 6 }, (_, i) => `<path d="M${940 + i * 40} 470 q-12 40 0 70"/>`).join("")}` +
        `<path d="M1180 470 q40 -30 80 -10 q20 20 -10 30 q-30 6 -70 -20"/>` +
        `<path d="M900 470 q-60 -10 -110 20"/></g>` +
        L + ridge(640, 18, 4, "#d9a777", 67) +
        `<g stroke="#7a4a2a" stroke-width="5"><path d="M420 690 L420 640 M620 690 L620 640 M420 650 L620 650" fill="none"/></g>` +
        `<path d="M1250 660 L1310 600 L1370 660 Z" fill="#e8d6b0"/><path d="M1310 600 L1370 660 L1330 660 Z" fill="#cdb98f"/><path d="M1310 600 L1310 560" stroke="#7a4a2a" stroke-width="4"/><path d="M1310 562 l30 8 l-30 8 Z" fill="#e3350d"/>` +
        ridge(720, 12, 4, "#e2b98c", 71)
      ),
      front: svg("", `<g fill="#a5653c"><ellipse cx="100" cy="900" rx="220" ry="90"/><ellipse cx="1520" cy="900" rx="220" ry="100"/></g>` +
        `<g fill="#c88a5c"><circle cx="420" cy="885" r="26"/><circle cx="1180" cy="890" r="20"/></g>` +
        `<g stroke="#f3dcc0" stroke-width="9" stroke-linecap="round"><path d="M1420 840 L1500 820"/><circle cx="1414" cy="842" r="9" fill="#f3dcc0"/><circle cx="1506" cy="818" r="9" fill="#f3dcc0"/></g>` +
        `<g stroke="#6b4a32" stroke-width="7" stroke-linecap="round"><path d="M160 860 L230 790"/></g><path d="M205 790 Q235 770 265 800" stroke="#8d96a0" stroke-width="10" fill="none" stroke-linecap="round"/>`)
    },

    volcano: {
      ground: [6, 24], tint: "#8a2d1d", haze: ["#e8853a", 600, 0.3],
      back: layered(
        sky("vo", [[0, "#2b1622"], [0.55, "#a23f2a"], [1, "#e8853a"]]) + glow("vgl", "#ff9a3a") +
        sky("vside", [[0, "#4a302c"], [1, "#2e1d1c"]]),
        fill("vo") +
        `<g class="fx-drift" fill="#5e4a52" opacity=".6"><ellipse cx="800" cy="130" rx="170" ry="60"/><ellipse cx="900" cy="80" rx="130" ry="52"/><ellipse cx="700" cy="70" rx="100" ry="40"/></g>` +
        `<circle class="fx-pulse" cx="810" cy="220" r="220" fill="url(#vgl)" opacity=".7"/>` +
        `<path d="M500 640 L740 220 L880 220 L1120 640 Z" fill="url(#vside)"/><path d="M880 220 L1120 640 L960 640 Z" fill="#241615" opacity=".5"/>` +
        `<path d="M740 220 L880 220 L860 260 L830 330 L800 270 L770 300 Z" fill="#ffb24a"/>` +
        `<path d="M800 270 L780 380 L810 460 L790 560 L800 640" stroke="#ff7a2a" stroke-width="14" fill="none" stroke-linecap="round"/><path d="M800 270 L780 380 L810 460 L790 560" stroke="#ffd27a" stroke-width="5" fill="none" stroke-linecap="round"/>` +
        `<path d="M850 300 L880 400 L870 470" stroke="#ff7a2a" stroke-width="9" fill="none" stroke-linecap="round"/>` +
        L + ridge(620, 30, 5, "#4a2c28", 79) + ridge(700, 18, 4, "#3a2422", 83) +
        L + `<ellipse class="fx-pulse" cx="350" cy="760" rx="160" ry="40" fill="url(#vgl)"/><ellipse cx="350" cy="760" rx="110" ry="16" fill="#ff9a3a"/><ellipse cx="350" cy="757" rx="70" ry="7" fill="#ffd27a"/>` +
        `<ellipse class="fx-pulse" cx="1250" cy="790" rx="190" ry="44" fill="url(#vgl)" style="animation-delay:-1.5s"/><ellipse cx="1250" cy="790" rx="140" ry="18" fill="#ff9a3a"/><ellipse cx="1250" cy="787" rx="90" ry="8" fill="#ffd27a"/>` +
        `<g>${dots(40, 87, "#ffb24a", 350, 880, 2.6, "fx-rise")}</g>`
      ),
      front: svg("", `<g fill="#241615"><ellipse cx="110" cy="900" rx="230" ry="100"/><ellipse cx="1500" cy="900" rx="230" ry="110"/></g>` +
        `<g fill="none" stroke="#ff7a2a" stroke-width="5" stroke-linecap="round" opacity=".7"><path d="M-20 810 Q100 790 220 812"/><path d="M1380 806 Q1500 784 1620 806"/></g>`)
    },

    power: {
      ground: [6, 26], fly: 0.15, tint: "#2c4a63", haze: ["#a9b8c9", 560, 0.3],
      back: layered(
        sky("pw", [[0, "#17243d"], [0.55, "#4d6584"], [0.85, "#d8a35e"], [1, "#e9bb72"]]) + glow("pglow", "#ffe066"),
        fill("pw") +
        dots(40, 301, "#ffffff", 0, 300, 1.3, "fx-twinkle") +
        ridge(560, 24, 5, "#3c4a5c", 303) +
        // The plant: main hall, turbine house and two chimneys
        `<g fill="#26323f"><rect x="520" y="330" width="520" height="250"/><rect x="1040" y="400" width="220" height="180"/><rect x="600" y="210" width="44" height="130"/><rect x="690" y="240" width="40" height="100"/><path d="M500 340 L780 280 L1060 340 Z"/></g>` +
        `<g fill="#3a4757"><rect x="600" y="210" width="44" height="12"/><rect x="690" y="240" width="40" height="12"/></g>` +
        `<g class="fx-drift" fill="#8f9bb0" opacity=".35"><ellipse cx="630" cy="180" rx="60" ry="24"/><ellipse cx="700" cy="150" rx="70" ry="26"/><ellipse cx="720" cy="210" rx="40" ry="16"/></g>` +
        `<g fill="#ffd84a">${Array.from({ length: 16 }, (_, i) => `<rect${i % 5 === 2 ? ' class="fx-flicker"' : ""} x="${550 + (i % 8) * 58}" y="${380 + Math.floor(i / 8) * 70}" width="30" height="34" rx="3" opacity="${i % 3 ? 0.9 : 0.55}"/>`).join("")}</g>` +
        `<g fill="#ffd84a" opacity=".8"><rect x="1070" y="440" width="40" height="24" rx="3"/><rect x="1150" y="440" width="40" height="24" rx="3" class="fx-flicker" style="animation-delay:-1.7s"/></g>` +
        `<path d="M820 330 l-24 44 h20 l-16 40 l40 -54 h-22 l18 -30 Z" fill="#ffd84a"/>` +
        L + ridge(600, 20, 5, "#46586a", 307) +
        // Pylons with sagging wires
        `<g fill="none" stroke="#1d2833" stroke-width="6" stroke-linejoin="round"><path d="M210 640 L250 360 L290 640 M226 520 L274 520 M236 440 L264 440 M190 380 L310 380"/><path d="M1380 640 L1416 380 L1452 640 M1394 530 L1438 530 M1402 450 L1430 450 M1360 400 L1472 400"/></g>` +
        `<g fill="none" stroke="#1d2833" stroke-width="3"><path d="M190 380 Q800 480 1360 400"/><path d="M310 380 Q900 470 1472 400"/><path d="M-60 400 Q80 430 190 380"/><path d="M1472 400 Q1560 420 1680 390"/></g>` +
        `<circle class="fx-pulse" cx="800" cy="440" r="160" fill="url(#pglow)" opacity=".25"/>` +
        L + ridge(690, 16, 4, "#566a5a", 311) +
        `<g fill="#3f5060" opacity=".8"><ellipse cx="420" cy="770" rx="120" ry="16"/><ellipse cx="1180" cy="790" rx="150" ry="18"/></g>` +
        `<g fill="#ffd84a" opacity=".35"><ellipse cx="420" cy="768" rx="60" ry="5"/><ellipse cx="1180" cy="788" rx="70" ry="6"/></g>` +
        `<g fill="none" stroke="#ffe066" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path class="fx-flicker" d="M560 720 l12 -16 l-8 -4 l14 -18"/><path class="fx-flicker" style="animation-delay:-2.1s" d="M1020 740 l10 -14 l-8 -4 l12 -16"/></g>` +
        dots(10, 313, "#ffe066", 620, 860, 2, "fx-rise")
      ),
      front: svg("", `<g fill="#2e3a44"><ellipse cx="100" cy="900" rx="220" ry="90"/><ellipse cx="1500" cy="900" rx="230" ry="100"/></g>` +
        `<g transform="translate(1440 790)"><rect x="-4" y="0" width="8" height="70" fill="#5a6470"/><path d="M0 -44 L40 26 L-40 26 Z" fill="#ffcb05" stroke="#1e2230" stroke-width="5" stroke-linejoin="round"/><path d="M4 -18 l-10 16 h8 l-6 16 l14 -20 h-8 l6 -12 Z" fill="#1e2230"/></g>` +
        `<rect x="120" y="840" width="260" height="30" rx="15" fill="#5a6470"/><rect x="120" y="840" width="260" height="10" rx="5" fill="#76808c"/>`)
    },

    victory: {
      ground: [6, 24], tint: "#6b4a2e", haze: ["#c99a64", 560, 0.3],
      // Strength boulders that Pokémon can push (x and y in percent, see app.js)
      boulders: [[36, 12], [74, 10]],
      // The ladder and the rock ledge it leads to, in drawing units of the middle layer
      // edge is the top of the ledge, from one end to the other: x, y, x, y
      ledge: { ladderX: 470, ladderBottom: 600, ladderTop: 478, x1: 90, x2: 410, edge: [0, 450, 560, 470], layer: 1 },
      back: layered(
        sky("vr", [[0, "#24180f"], [1, "#4a3220"]]) + glow("vexit", "#fff1c8") + glow("vtorch", "#ffb347") +
        sky("vrock", [[0, "#7a5a3c"], [1, "#5a4029"]]),
        fill("vr") +
        // Daylight from the exit at the far end, toward the Pokémon League
        `<ellipse cx="800" cy="470" rx="260" ry="200" fill="url(#vexit)" opacity=".55"/><path d="M700 600 Q705 430 800 410 Q895 430 900 600 Z" fill="#fff4d6"/>` +
        `<g fill="#3a2818">` + Array.from({ length: 14 }, (_, i) => { const x = i * 120 + 40, h = 50 + ((i * 47) % 120); return `<path d="M${x - 40} 0 L${x + 40} 0 L${x} ${h} Z"/>`; }).join("") + `</g>` +
        ridge(480, 80, 4, "#3e2b1b", 401) +
        L + ridge(560, 50, 5, "url(#vrock)", 403) +
        // A rock ledge with a ladder up to it
        `<path d="M560 470 L0 450 L0 560 L540 560 Z" fill="#6a4c32"/><path d="M560 470 L0 450 L0 466 L550 484 Z" fill="#8a6644"/>` +
        `<g stroke="#a07a4c" stroke-width="7" stroke-linecap="round"><path d="M450 478 L450 600 M490 476 L490 600"/>${Array.from({ length: 5 }, (_, i) => `<path d="M450 ${496 + i * 22} H490"/>`).join("")}</g>` +
        // Torches on the walls
        `<g><rect x="616" y="430" width="10" height="44" fill="#4a3220"/><circle class="fx-pulse" cx="621" cy="420" r="70" fill="url(#vtorch)" opacity=".7"/><path class="fx-flicker" d="M621 398 q12 14 0 26 q-12 -12 0 -26 Z" fill="#ffcf5a"/></g>` +
        `<g><rect x="1296" y="400" width="10" height="44" fill="#4a3220"/><circle class="fx-pulse" style="animation-delay:-2s" cx="1301" cy="390" r="70" fill="url(#vtorch)" opacity=".7"/><path class="fx-flicker" style="animation-delay:-1.1s" d="M1301 368 q12 14 0 26 q-12 -12 0 -26 Z" fill="#ffcf5a"/></g>` +
        ridge(640, 20, 5, "#6e5035", 405) +
        L + ridge(700, 16, 4, "#8a6844", 407) +
        `<g fill="#6a4c32"><path d="M520 740 L540 690 L560 740 Z"/><path d="M1000 760 L1016 720 L1032 760 Z"/></g>` +
        dots(24, 409, "#ffd9a0", 380, 760, 1.4, "fx-float")
      ),
      front: svg("", `<g fill="#3e2b1b"><ellipse cx="110" cy="900" rx="230" ry="100"/><ellipse cx="1500" cy="900" rx="240" ry="110"/></g>` +
        `<g fill="none" stroke="#7a5a3c" stroke-width="6" stroke-linecap="round"><path d="M-40 806 Q90 780 230 800"/></g>`)
    },

    snow: {
      ground: [6, 24], tint: "#2f6d8f",
      haze: ["#bfe3f2", 600, 0.35],
      back: layered(
        sky("sf", [[0, "#10324a"], [1, "#1d5372"]]) + sky("sfout", [[0, "#9fd6f2"], [0.55, "#dff4fc"], [0.56, "#4aa8d4"], [1, "#2a7fb0"]]) +
        glow("sflight", "#e8f8ff") + sky("ice", [[0, "#e6f6fd"], [1, "#a9d4ea"]]),
        fill("sf") +
        // The cave mouth looking out to the sea
        `<path d="M520 640 Q520 250 800 220 Q1080 250 1080 640 Z" fill="url(#sfout)"/>` +
        `<ellipse cx="800" cy="420" rx="320" ry="260" fill="url(#sflight)" opacity=".45"/>` +
        `<g fill="#ffffff" opacity=".9"><ellipse cx="700" cy="300" rx="60" ry="14"/><ellipse cx="900" cy="330" rx="44" ry="11"/></g>` +
        `<path d="M600 420 Q640 400 690 420 Z M900 420 Q950 396 1010 420 Z" fill="#6f8f9c"/>` +
        `<g class="fx-wave" stroke="#ffffff" stroke-opacity=".5" stroke-width="3" fill="none" stroke-linecap="round"><path d="M600 470 q20 -8 40 0 t40 0"/><path d="M820 500 q20 -8 40 0 t40 0"/><path d="M700 560 q20 -8 40 0 t40 0"/></g>` +
        `<path d="M0 0 H1600 V700 H1080 Q1080 250 800 220 Q520 250 520 640 V700 H0 Z" fill="#1a4a66"/>` +
        `<path d="M0 0 H1600 V120 Q1200 160 800 130 Q400 160 0 120 Z" fill="#245e80"/>` +
        L + ridge(560, 60, 4, "#2b6a8c", 501) +
        `<g fill="#cfeefa" opacity=".9">` + Array.from({ length: 15 }, (_, i) => { const x = i * 110 + 30, h = 50 + ((i * 61) % 130); return `<path d="M${x - 22} 118 L${x + 22} 118 L${x} ${118 + h} Z"/>`; }).join("") + `</g>` +
        // Frozen falls down the cave wall
        `<path d="M250 160 Q230 380 260 600 L330 600 Q350 380 320 160 Z" fill="#bfe6f6" opacity=".85"/><path d="M270 180 Q262 380 282 590" stroke="#ffffff" stroke-width="6" opacity=".7" fill="none"/>` +
        `<path d="M1300 150 Q1280 360 1320 590 L1380 590 Q1400 360 1370 150 Z" fill="#bfe6f6" opacity=".85"/>` +
        `<g fill="#ffffff">${dots(40, 503, "#ffffff", 140, 620, 2, "fx-twinkle")}</g>` +
        ridge(640, 24, 5, "#3f86a8", 505) +
        // A frozen cave floor, with cracks in the ice
        L + `<path d="M0 700 Q400 670 800 690 T1600 680 L1600 900 L0 900 Z" fill="url(#ice)"/>` +
        `<g fill="none" stroke="#9cc8de" stroke-width="3" stroke-linecap="round" opacity=".8"><path d="M300 720 l60 14 l40 -10 l50 18"/><path d="M900 712 l-40 16 l30 14"/><path d="M1180 730 l70 -8 l30 16"/></g>` +
        ridge(760, 16, 4, "#e9f6fc", 507) +
        `<g class="fx-drift" fill="#e8f8ff" opacity=".25"><ellipse cx="500" cy="740" rx="300" ry="24"/><ellipse cx="1150" cy="760" rx="340" ry="26"/></g>`
      ),
      front: svg("", `<g fill="#ffffff"><ellipse cx="120" cy="900" rx="260" ry="90"/><ellipse cx="1500" cy="900" rx="260" ry="100"/></g>` +
        `<g fill="#bfe6f6"><path d="M60 840 l30 -70 l30 70 Z"/><path d="M110 850 l20 -46 l20 46 Z"/><path d="M1460 840 l26 -64 l26 64 Z"/><path d="M1510 850 l18 -40 l18 40 Z"/></g>` +
        `<g fill="#d6e6f4"><ellipse cx="160" cy="910" rx="200" ry="40"/><ellipse cx="1460" cy="912" rx="200" ry="44"/></g>`)
    },

    haunted: {
      ground: [6, 26], fly: 0.3, tint: "#3e2a5c", haze: ["#6b5a9a", 640, 0.3],
      back: layered(
        sky("ha", [[0, "#0f0b20"], [1, "#3b2a5a"]]) + glow("hmoon", "#f4eccc") + glow("hwisp", "#8fd8ff"),
        fill("ha") +
        dots(60, 107, "#d9d0ff", 0, 420, 1.6, "fx-twinkle") +
        `<circle cx="1260" cy="170" r="200" fill="url(#hmoon)" opacity=".5"/><circle cx="1260" cy="170" r="80" fill="#f4eccc"/><circle cx="1235" cy="150" r="14" fill="#e2d8b4"/><circle cx="1285" cy="195" r="10" fill="#e2d8b4"/>` +
        `<g class="fx-bats" fill="#140f26"><path d="M0 0 q10 -10 20 0 q10 -10 20 0 q-10 4 -20 10 q-10 -6 -20 -10 Z" transform="translate(-100 220)"/><path d="M0 0 q8 -8 16 0 q8 -8 16 0 q-8 3 -16 8 q-8 -5 -16 -8 Z" transform="translate(-160 260)"/><path d="M0 0 q8 -8 16 0 q8 -8 16 0 q-8 3 -16 8 q-8 -5 -16 -8 Z" transform="translate(-60 280)"/></g>` +
        `<g fill="#241a3a"><rect x="640" y="200" width="160" height="460"/><path d="M620 210 L720 80 L820 210 Z"/><rect x="560" y="420" width="320" height="240"/><path d="M545 430 L600 360 L655 430 Z M785 430 L840 360 L895 430 Z"/></g>` +
        `<g stroke="#1a1230" stroke-width="3" opacity=".7">${Array.from({ length: 8 }, (_, i) => `<path d="M640 ${240 + i * 50} H800"/>`).join("")}</g>` +
        `<g fill="#ffd36b"><rect class="fx-flicker" x="700" y="260" width="20" height="34" rx="10"/><rect x="740" y="330" width="20" height="34" rx="10" opacity=".85"/><rect class="fx-flicker" style="animation-delay:-1.3s" x="610" y="480" width="22" height="36" rx="11"/><rect x="820" y="500" width="22" height="36" rx="11" opacity=".85"/><circle cx="720" cy="150" r="12" opacity=".7"/></g>` +
        L + ridge(640, 20, 5, "#2a1f44", 109) +
        `<g fill="none" stroke="#1d1530" stroke-width="10" stroke-linecap="round"><path d="M180 660 L190 520 M190 560 L150 520 M188 590 L230 540 M190 520 L170 480 M190 520 L215 490"/><path d="M1440 660 L1430 540 M1432 580 L1470 545 M1430 540 L1400 500"/></g>` +
        `<g fill="#4a3e66"><path d="M260 700 v-60 a30 30 0 0 1 60 0 v60 Z"/><path d="M380 710 v-44 a24 24 0 0 1 48 0 v44 Z"/><path d="M1150 705 v-56 a28 28 0 0 1 56 0 v56 Z"/><rect x="1330" y="650" width="12" height="60"/><rect x="1312" y="664" width="48" height="12"/></g>` +
        L + ridge(720, 14, 4, "#33284f", 113) +
        `<circle class="fx-float" cx="460" cy="560" r="40" fill="url(#hwisp)"/><circle class="fx-float" style="animation-delay:-3s" cx="1060" cy="520" r="34" fill="url(#hwisp)"/><circle class="fx-float" style="animation-delay:-5s" cx="1500" cy="600" r="30" fill="url(#hwisp)"/>`
      ),
      front: svg("", `<g class="fx-drift" fill="#d6cff0" opacity=".2"><ellipse cx="300" cy="870" rx="460" ry="70"/><ellipse cx="1200" cy="880" rx="520" ry="80"/></g>` +
        `<g class="fx-drift fx-drift--rev" fill="#d6cff0" opacity=".14"><ellipse cx="800" cy="840" rx="600" ry="50"/></g>` +
        `<g fill="#1d1530"><ellipse cx="80" cy="910" rx="200" ry="80"/><ellipse cx="1540" cy="910" rx="200" ry="90"/></g>`)
    },

    space: {
      ground: [6, 26], fly: 0.25, tint: "#4a3a7a", haze: ["#6c5a9e", 560, 0.3],
      back: layered(
        sky("sc", [[0, "#120e2e"], [0.6, "#3b2c6b"], [1, "#6a4f8f"]]) + glow("scmoon", "#f4eccc") + glow("scpsy", "#c58cff") +
        glow("sclamp", "#ffe08a") + sky("plaza", [[0, "#8a7f99"], [1, "#5e5570"]]),
        fill("sc") +
        dots(70, 601, "#e8e0ff", 0, 380, 1.5, "fx-twinkle") +
        `<circle cx="1320" cy="130" r="170" fill="url(#scmoon)" opacity=".45"/><circle cx="1320" cy="130" r="50" fill="#f4eccc"/>` +
        // Far skyline
        `<g fill="#2a2150">${Array.from({ length: 22 }, (_, i) => { const w = 50 + ((i * 37) % 50), h = 120 + ((i * 71) % 170); return `<rect x="${i * 76 - 20}" y="${560 - h}" width="${w}" height="${h}"/>`; }).join("")}</g>` +
        `<g fill="#ffd36b" opacity=".55">${Array.from({ length: 70 }, (_, i) => `<rect x="${(i * 97) % 1600}" y="${420 + ((i * 53) % 120)}" width="6" height="8"/>`).join("")}</g>` +
        // Silph Co. tower in the middle of the city
        `<rect x="700" y="150" width="200" height="420" fill="#3a2f6e"/><rect x="730" y="110" width="140" height="44" fill="#3a2f6e"/><path d="M800 110 L800 50" stroke="#3a2f6e" stroke-width="6"/>` +
        `<circle class="fx-flicker" cx="800" cy="48" r="7" fill="#ff5a5a"/>` +
        `<g fill="#9fd4f0" opacity=".85">${Array.from({ length: 40 }, (_, i) => `<rect x="${716 + (i % 5) * 36}" y="${220 + Math.floor(i / 5) * 42}" width="22" height="22" rx="2"/>`).join("")}</g>` +
        `<rect x="720" y="168" width="160" height="34" rx="4" fill="#1e2230"/><text x="800" y="192" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="20" letter-spacing="2" fill="#ffd84a">SILPH CO.</text>` +
        L + ridge(600, 14, 5, "#4a3d6e", 603) +
        // Pokémon Center on the left, Poké Mart on the right
        `<g transform="translate(220 470)"><rect x="0" y="40" width="220" height="110" fill="#f4efe4"/><path d="M-14 46 L110 0 L234 46 Z" fill="#e3350d"/><rect x="84" y="88" width="52" height="62" fill="#9fd4f0"/>` +
        `<circle cx="110" cy="64" r="16" fill="#ffffff" stroke="#1e2230" stroke-width="4"/><path d="M94 64 H126" stroke="#1e2230" stroke-width="4"/><circle cx="110" cy="64" r="5" fill="#ffffff" stroke="#1e2230" stroke-width="3"/>` +
        `<g fill="#ffd36b"><rect x="22" y="80" width="40" height="28" rx="3"/><rect x="158" y="80" width="40" height="28" rx="3"/></g></g>` +
        `<g transform="translate(1160 490)"><rect x="0" y="34" width="200" height="96" fill="#f4efe4"/><path d="M-12 40 L100 0 L212 40 Z" fill="#2a75bb"/><rect x="76" y="70" width="48" height="60" fill="#9fd4f0"/>` +
        `<rect x="60" y="44" width="80" height="20" rx="3" fill="#2a75bb"/><text x="100" y="60" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="14" fill="#ffffff">MART</text>` +
        `<g fill="#ffd36b"><rect x="18" y="72" width="38" height="26" rx="3"/><rect x="144" y="72" width="38" height="26" rx="3"/></g></g>` +
        `<circle class="fx-pulse" cx="800" cy="460" r="260" fill="url(#scpsy)" opacity=".2"/>` +
        ridge(660, 12, 5, "#5a4d7a", 605) +
        L + `<path d="M0 700 Q400 690 800 696 T1600 692 L1600 900 L0 900 Z" fill="url(#plaza)"/>` +
        `<g stroke="#7a6f8c" stroke-width="3" opacity=".6">${Array.from({ length: 9 }, (_, i) => `<path d="M${-200 + i * 260} 900 L${400 + i * 100} 700"/>`).join("")}<path d="M0 760 H1600 M0 830 H1600"/></g>` +
        // Street lamps
        `<g><rect x="496" y="560" width="8" height="150" fill="#2a2440"/><circle class="fx-pulse" cx="500" cy="556" r="80" fill="url(#sclamp)" opacity=".6"/><circle cx="500" cy="556" r="12" fill="#ffe08a"/></g>` +
        `<g><rect x="1096" y="560" width="8" height="150" fill="#2a2440"/><circle class="fx-pulse" style="animation-delay:-2.5s" cx="1100" cy="556" r="80" fill="url(#sclamp)" opacity=".6"/><circle cx="1100" cy="556" r="12" fill="#ffe08a"/></g>` +
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
    const [color, y, strength] = scene.haze;
    const id = "hz" + key;
    const hazeDef = `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity="0"/><stop offset="${(y - 260) / H}" stop-color="${color}" stop-opacity="0"/><stop offset="${y / H}" stop-color="${color}" stop-opacity="${strength}"/><stop offset="1" stop-color="${color}" stop-opacity="${strength * 0.2}"/></linearGradient>`;
    const haze = `<rect width="${W}" height="${H}" fill="url(#${id})"/>`;
    scene.layers = parts.map((part, i) => svg(defs + hazeDef, part + (i < parts.length - 1 ? haze : "")));
    scene.thumb = svg(defs + hazeDef, parts.join(haze));
  }
})();
