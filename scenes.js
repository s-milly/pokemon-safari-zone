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
  const fill = id => `<rect width="${W}" height="${H}" fill="url(#${id})"/>`;

  window.SCENES = {
    forest: {
      ground: [6, 26], tint: "#2f6b3a",
      back: svg(
        sky("fs", [[0, "#a9dccb"], [0.55, "#eef4cf"], [1, "#eef4cf"]]) + glow("fsun", "#fff6c4") +
        sky("fpath", [[0, "#d9c08f"], [1, "#b99566"]]),
        fill("fs") +
        `<circle cx="1250" cy="170" r="240" fill="url(#fsun)"/><circle cx="1250" cy="170" r="62" fill="#fffbe0"/>` +
        `<g class="fx-pulse" fill="#fffbe0" opacity=".14"><path d="M1250 170 L700 900 L860 900 Z"/><path d="M1250 170 L1020 900 L1130 900 Z"/><path d="M1250 170 L420 900 L520 900 Z"/></g>` +
        cloud(330, 140, 1, "#ffffff") +
        ridge(470, 50, 4, "#b9d9c4", 2) +
        pines(530, 26, "#94c3a0", 3, 240) +
        ridge(545, 30, 6, "#7db58a", 5) +
        pines(605, 15, "#4b8f5d", 7, 320) +
        ridge(625, 24, 5, "#5aa365", 11) +
        tree(180, 690, 1.2, "#2f7a45", "#3f9455", "#6b4a32") + tree(1420, 680, 1.35, "#2f7a45", "#3f9455", "#6b4a32") +
        ridge(700, 18, 4, "#7cc46a", 13) +
        `<path d="M700 900 C760 820 820 760 790 700 L830 700 C880 760 900 830 960 900 Z" fill="url(#fpath)" opacity=".8"/>` +
        dots(40, 15, "#ffffff", 720, 860, 3) + dots(30, 16, "#ffd84a", 720, 860, 3) + dots(20, 18, "#ff9ec4", 720, 860, 3) +
        `<g fill="#fff3a0">${dots(18, 21, "#fff3a0", 420, 760, 3, "fx-float")}</g>`
      ),
      front: svg("", tufts(900, "#3f9a49", 60, 17, 90) + tufts(900, "#56b25a", 40, 19, 60) +
        `<ellipse cx="80" cy="880" rx="190" ry="90" fill="#2e7f3c"/><ellipse cx="60" cy="850" rx="120" ry="50" fill="#3d9a4c"/>` +
        `<ellipse cx="1540" cy="890" rx="200" ry="100" fill="#2e7f3c"/><ellipse cx="1560" cy="850" rx="120" ry="50" fill="#3d9a4c"/>` +
        `<g fill="#e23b3b"><circle cx="40" cy="840" r="7"/><circle cx="110" cy="855" r="7"/><circle cx="1520" cy="845" r="7"/><circle cx="1580" cy="860" r="7"/></g>`)
    },

    safari: {
      ground: [6, 26], tint: "#8a6a24",
      back: svg(
        sky("ss", [[0, "#f3a76d"], [0.5, "#fde0a8"], [1, "#fde7b5"]]) + glow("ssun", "#fff0b8"),
        fill("ss") +
        `<circle cx="420" cy="320" r="260" fill="url(#ssun)"/><circle cx="420" cy="320" r="100" fill="#fff2c2"/>` +
        cloud(1100, 150, 0.9, "#ffe9cf") +
        `<g class="fx-drift" fill="none" stroke="#7a5236" stroke-width="4" stroke-linecap="round"><path d="M900 230 q12 -10 24 0 q12 -10 24 0"/><path d="M960 260 q9 -8 18 0 q9 -8 18 0"/><path d="M1010 220 q10 -9 20 0 q10 -9 20 0"/></g>` +
        `<path d="M880 560 L950 430 L1190 430 L1250 560 Z" fill="#d79e66"/><path d="M1190 430 L1250 560 L1150 560 Z" fill="#c2854f"/>` +
        `<path d="M1250 560 L1295 475 L1430 475 L1470 560 Z" fill="#dcaa74"/><path d="M1430 475 L1470 560 L1400 560 Z" fill="#c99260"/>` +
        ridge(560, 20, 6, "#d8c07a", 23) +
        `<g fill="#6f5a35"><path d="M286 610 L290 500 L250 470 M290 500 L330 468" stroke="#6f5a35" stroke-width="12" fill="none" stroke-linecap="round"/><ellipse cx="290" cy="465" rx="130" ry="26"/><ellipse cx="300" cy="452" rx="90" ry="18" fill="#857043"/>` +
        `<path d="M1126 610 L1128 520 L1100 500 M1128 520 L1156 498" stroke="#6f5a35" stroke-width="9" fill="none" stroke-linecap="round"/><ellipse cx="1128" cy="496" rx="95" ry="20"/><ellipse cx="1136" cy="486" rx="64" ry="13" fill="#857043"/></g>` +
        ridge(640, 20, 5, "#c9b766", 29) +
        `<g fill="#8a6440">${Array.from({ length: 14 }, (_, i) => `<rect x="${560 + i * 40}" y="610" width="10" height="56" rx="3"/>`).join("")}<rect x="555" y="622" width="540" height="8" rx="3"/><rect x="555" y="646" width="540" height="8" rx="3"/></g>` +
        ridge(720, 14, 4, "#b7ad5a", 31) +
        `<g fill="#a99a73"><ellipse cx="300" cy="760" rx="60" ry="24"/><ellipse cx="1300" cy="770" rx="44" ry="18"/></g>`
      ),
      front: svg("", tufts(900, "#9c8f3c", 70, 37, 120) + tufts(900, "#c2b45a", 50, 41, 80) + tufts(900, "#d9cb72", 26, 43, 50))
    },

    sea: {
      ground: [8, 34], fly: 0.25, tint: "#1f6fa0",
      back: svg(
        sky("se", [[0, "#7fc8ee"], [1, "#e2f4fb"]]) + sky("sw", [[0, "#4fb4de"], [0.4, "#2b8cc4"], [1, "#165a93"]]) + glow("sesun", "#fff6cc"),
        `<rect width="${W}" height="420" fill="url(#se)"/><rect y="414" width="${W}" height="${H - 414}" fill="url(#sw)"/>` +
        `<circle cx="1300" cy="150" r="200" fill="url(#sesun)"/><circle cx="1300" cy="150" r="58" fill="#fffbe0"/>` +
        cloud(320, 150, 1.1, "#ffffff") + cloud(880, 220, 0.8, "#ffffff") +
        `<path d="M1120 416 Q1200 370 1290 380 Q1360 388 1420 416 Z" fill="#6f9c7a"/><path d="M1240 384 Q1250 330 1262 300 M1262 300 q-30 -6 -48 12 M1262 300 q26 -12 50 2 M1262 300 q-10 -24 -36 -30 M1262 300 q14 -26 40 -26" stroke="#3f6b4a" stroke-width="7" fill="none" stroke-linecap="round"/>` +
        `<rect y="412" width="${W}" height="4" fill="#ffffff" opacity=".5"/>` +
        `<g class="fx-shimmer" fill="#fffbe0">${Array.from({ length: 12 }, (_, i) => `<rect x="${1240 + ((i * 37) % 120)}" y="${430 + i * 22}" width="${40 - i * 2}" height="4" rx="2" opacity="${(0.9 - i * 0.06).toFixed(2)}"/>`).join("")}</g>` +
        `<g class="fx-wave" stroke="#ffffff" stroke-opacity=".35" stroke-width="4" fill="none" stroke-linecap="round">` +
        Array.from({ length: 10 }, (_, i) => `<path d="M${(i * 197) % 1500} ${470 + i * 42} q30 -12 60 0 t60 0"/>`).join("") + `</g>` +
        `<g fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" class="fx-drift"><path d="M560 260 q14 -12 28 0 q14 -12 28 0"/><path d="M620 300 q10 -9 20 0 q10 -9 20 0"/></g>`
      ),
      front: svg(sky("sand", [[0, "#f3dca6"], [1, "#e2c387"]]),
        `<path class="fx-foam" d="M-100 860 Q0 820 100 860 T300 860 T500 860 T700 860 T900 860 T1100 860 T1300 860 T1500 860 T1700 860 L1700 900 L-100 900 Z" fill="#e8f7ff" opacity=".85"/>` +
        `<path d="M-40 900 Q40 800 260 830 Q360 850 420 900 Z" fill="url(#sand)"/>` +
        `<path d="M-80 900 Q60 780 200 840 Q260 870 280 900 Z" fill="#6d6560"/><path d="M60 820 Q120 800 170 830" stroke="#8d847d" stroke-width="8" fill="none" stroke-linecap="round"/>` +
        `<path d="M1380 900 Q1460 790 1580 820 L1640 900 Z" fill="#6d6560"/><path d="M1450 820 Q1500 800 1550 815" stroke="#8d847d" stroke-width="8" fill="none" stroke-linecap="round"/>` +
        `<path d="M300 880 l10 -14 l10 14 l-10 6 Z M290 872 l-14 -6 M330 872 l14 -6" fill="#f27b5a" stroke="#f27b5a" stroke-width="4"/>`)
    },

    cave: {
      ground: [6, 24], tint: "#4b3a6b",
      back: svg(
        sky("cv", [[0, "#17122a"], [1, "#3c3150"]]) + glow("cgl", "#8fe3ff") + glow("ctn", "#6d8fd6"),
        fill("cv") +
        `<ellipse cx="800" cy="500" rx="200" ry="150" fill="url(#ctn)" opacity=".5"/><path d="M640 640 Q650 400 800 380 Q950 400 960 640 Z" fill="#0f0b1d" opacity=".6"/>` +
        ridge(470, 70, 4, "#2b2342", 41) +
        `<g fill="#2a2240">` + Array.from({ length: 16 }, (_, i) => { const x = i * 105 + 20, h = 60 + ((i * 53) % 150); return `<path d="M${x - 34} 0 L${x + 34} 0 L${x} ${h} Z"/><path d="M${x + 6} 0 L${x + 34} 0 L${x + 3} ${h * 0.92} Z" fill="#3a3058"/>`; }).join("") + `</g>` +
        ridge(560, 60, 5, "#3a2f52", 43) +
        `<g fill="#2f2747"><path d="M480 600 L505 500 L530 600 Z"/><path d="M1060 610 L1080 530 L1100 610 Z"/><path d="M1110 610 L1124 560 L1138 610 Z"/></g>` +
        `<circle class="fx-pulse" cx="280" cy="570" r="140" fill="url(#cgl)" opacity=".45"/><circle class="fx-pulse" cx="1272" cy="560" r="160" fill="url(#cgl)" opacity=".45" style="animation-delay:-2s"/>` +
        `<g fill="#9ee7ff"><path d="M260 600 l20 -70 l20 70 Z"/><path d="M300 605 l14 -46 l14 46 Z"/><path d="M236 604 l12 -34 l12 34 Z"/><path d="M1250 590 l22 -80 l22 80 Z"/><path d="M1300 600 l14 -50 l14 50 Z"/><path d="M1222 598 l12 -36 l12 36 Z"/></g>` +
        `<g fill="#e4faff" opacity=".8"><path d="M270 590 l10 -50 l4 50 Z"/><path d="M1262 580 l10 -58 l4 58 Z"/></g>` +
        ridge(680, 20, 4, "#56486e", 47) +
        `<ellipse cx="800" cy="760" rx="170" ry="26" fill="#2c2a55"/><ellipse class="fx-pulse" cx="800" cy="756" rx="120" ry="10" fill="#9ee7ff" opacity=".25"/>` +
        dots(30, 49, "#cfe9ff", 120, 700, 1.6, "fx-float")
      ),
      front: svg("", `<g fill="#2b2340"><ellipse cx="120" cy="890" rx="230" ry="110"/><ellipse cx="1500" cy="900" rx="240" ry="120"/><ellipse cx="800" cy="930" rx="300" ry="60"/></g>` +
        `<g fill="none" stroke="#5d4f80" stroke-width="6" stroke-linecap="round"><path d="M-40 800 Q80 770 200 790"/><path d="M1340 800 Q1460 770 1600 790"/></g>`)
    },

    fossil: {
      ground: [6, 24], tint: "#8a4f2a",
      back: svg(
        sky("fo", [[0, "#f3c48e"], [1, "#fbe9cc"]]) + glow("fosun", "#fff2cc"),
        fill("fo") +
        `<circle cx="1180" cy="140" r="180" fill="url(#fosun)"/><circle cx="1180" cy="140" r="50" fill="#fff6dc"/>` +
        ridge(360, 40, 4, "#d7925e", 53) +
        `<g stroke="#c47c4b" stroke-width="3" opacity=".6">${Array.from({ length: 6 }, (_, i) => `<path d="M0 ${400 + i * 16} Q400 ${390 + i * 16} 800 ${404 + i * 16} T1600 ${398 + i * 16}"/>`).join("")}</g>` +
        ridge(440, 30, 5, "#c47c4b", 59) + ridge(520, 26, 5, "#b46c3e", 61) +
        `<g stroke="#a35f34" stroke-width="3" opacity=".6">${Array.from({ length: 5 }, (_, i) => `<path d="M0 ${560 + i * 14} Q400 ${552 + i * 14} 800 ${566 + i * 14} T1600 ${558 + i * 14}"/>`).join("")}</g>` +
        `<g fill="none" stroke="#f3dcc0" stroke-width="10" stroke-linecap="round" opacity=".85">` +
        `<path d="M300 480 a26 26 0 1 1 -26 -26 a40 40 0 1 1 40 40"/>` +
        `<path d="M900 470 L1180 470"/>${Array.from({ length: 6 }, (_, i) => `<path d="M${940 + i * 40} 470 q-12 40 0 70"/>`).join("")}` +
        `<path d="M1180 470 q40 -30 80 -10 q20 20 -10 30 q-30 6 -70 -20"/>` +
        `<path d="M900 470 q-60 -10 -110 20"/></g>` +
        ridge(640, 18, 4, "#d9a777", 67) +
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
      ground: [6, 24], tint: "#8a2d1d",
      back: svg(
        sky("vo", [[0, "#2b1622"], [0.55, "#a23f2a"], [1, "#e8853a"]]) + glow("vgl", "#ff9a3a") +
        sky("vside", [[0, "#4a302c"], [1, "#2e1d1c"]]),
        fill("vo") +
        `<g class="fx-drift" fill="#5e4a52" opacity=".6"><ellipse cx="800" cy="130" rx="170" ry="60"/><ellipse cx="900" cy="80" rx="130" ry="52"/><ellipse cx="700" cy="70" rx="100" ry="40"/></g>` +
        `<circle class="fx-pulse" cx="810" cy="220" r="220" fill="url(#vgl)" opacity=".7"/>` +
        `<path d="M500 640 L740 220 L880 220 L1120 640 Z" fill="url(#vside)"/><path d="M880 220 L1120 640 L960 640 Z" fill="#241615" opacity=".5"/>` +
        `<path d="M740 220 L880 220 L860 260 L830 330 L800 270 L770 300 Z" fill="#ffb24a"/>` +
        `<path d="M800 270 L780 380 L810 460 L790 560 L800 640" stroke="#ff7a2a" stroke-width="14" fill="none" stroke-linecap="round"/><path d="M800 270 L780 380 L810 460 L790 560" stroke="#ffd27a" stroke-width="5" fill="none" stroke-linecap="round"/>` +
        `<path d="M850 300 L880 400 L870 470" stroke="#ff7a2a" stroke-width="9" fill="none" stroke-linecap="round"/>` +
        ridge(620, 30, 5, "#4a2c28", 79) + ridge(700, 18, 4, "#3a2422", 83) +
        `<ellipse class="fx-pulse" cx="350" cy="760" rx="160" ry="40" fill="url(#vgl)"/><ellipse cx="350" cy="760" rx="110" ry="16" fill="#ff9a3a"/><ellipse cx="350" cy="757" rx="70" ry="7" fill="#ffd27a"/>` +
        `<ellipse class="fx-pulse" cx="1250" cy="790" rx="190" ry="44" fill="url(#vgl)" style="animation-delay:-1.5s"/><ellipse cx="1250" cy="790" rx="140" ry="18" fill="#ff9a3a"/><ellipse cx="1250" cy="787" rx="90" ry="8" fill="#ffd27a"/>` +
        `<g>${dots(40, 87, "#ffb24a", 350, 880, 2.6, "fx-rise")}</g>`
      ),
      front: svg("", `<g fill="#241615"><ellipse cx="110" cy="900" rx="230" ry="100"/><ellipse cx="1500" cy="900" rx="230" ry="110"/></g>` +
        `<g fill="none" stroke="#ff7a2a" stroke-width="5" stroke-linecap="round" opacity=".7"><path d="M-20 810 Q100 790 220 812"/><path d="M1380 806 Q1500 784 1620 806"/></g>`)
    },

    snow: {
      ground: [6, 24], tint: "#3d6d96",
      back: svg(
        sky("sn", [[0, "#2c3f74"], [0.5, "#8fa6d6"], [0.75, "#f2d6e2"], [1, "#f6eef4"]]) +
        sky("au", [[0, "#7affc8"], [1, "#7affc8"]]) + sky("ice", [[0, "#cfe6f5"], [1, "#a9cbe6"]]),
        fill("sn") +
        `<g class="fx-aurora" fill="none" stroke-linecap="round"><path d="M-50 160 C300 60 600 230 900 120 S1400 60 1700 150" stroke="#7affc8" stroke-width="60" opacity=".22"/><path d="M-50 200 C320 110 640 260 940 170 S1420 120 1700 210" stroke="#8ad0ff" stroke-width="40" opacity=".2"/></g>` +
        dots(40, 91, "#ffffff", 0, 260, 1.4, "fx-twinkle") +
        `<path d="M0 560 L260 260 L420 420 L640 180 L880 460 L1060 300 L1300 520 L1460 340 L1600 480 L1600 640 L0 640 Z" fill="#a9b9dd"/>` +
        `<path d="M640 180 L880 460 L760 460 Z M260 260 L420 420 L330 420 Z M1060 300 L1300 520 L1160 520 Z" fill="#8798c4"/>` +
        `<path d="M260 260 L310 320 L290 340 L270 320 L240 300 Z M640 180 L700 250 L680 262 L660 250 L630 270 L610 230 Z M1060 300 L1110 350 L1090 362 L1070 352 L1030 340 Z M1460 340 L1500 380 L1470 390 L1440 365 Z" fill="#ffffff"/>` +
        pines(640, 12, "#3f6690", 89, 180, "#ffffff") +
        ridge(650, 22, 5, "#e3eef7", 97) +
        `<ellipse cx="800" cy="720" rx="420" ry="40" fill="url(#ice)"/><path d="M560 712 L700 728 M860 708 L1000 724" stroke="#ffffff" stroke-width="4" opacity=".7" stroke-linecap="round"/>` +
        ridge(760, 16, 4, "#f4f9fd", 101) +
        snowfall(dots(70, 103, "#ffffff", 0, 900, 3.4), "") + snowfall(dots(50, 105, "#ffffff", 0, 900, 1.8), " snowfall--slow")
      ),
      front: svg("", `<g fill="#ffffff"><ellipse cx="120" cy="900" rx="260" ry="90"/><ellipse cx="1500" cy="900" rx="260" ry="100"/><ellipse cx="800" cy="935" rx="420" ry="60"/></g>` +
        `<g fill="#d6e6f4"><ellipse cx="160" cy="910" rx="200" ry="40"/><ellipse cx="1460" cy="912" rx="200" ry="44"/></g>`)
    },

    haunted: {
      ground: [6, 26], fly: 0.3, tint: "#3e2a5c",
      back: svg(
        sky("ha", [[0, "#0f0b20"], [1, "#3b2a5a"]]) + glow("hmoon", "#f4eccc") + glow("hwisp", "#8fd8ff"),
        fill("ha") +
        dots(60, 107, "#d9d0ff", 0, 420, 1.6, "fx-twinkle") +
        `<circle cx="1260" cy="170" r="200" fill="url(#hmoon)" opacity=".5"/><circle cx="1260" cy="170" r="80" fill="#f4eccc"/><circle cx="1235" cy="150" r="14" fill="#e2d8b4"/><circle cx="1285" cy="195" r="10" fill="#e2d8b4"/>` +
        `<g class="fx-bats" fill="#140f26"><path d="M0 0 q10 -10 20 0 q10 -10 20 0 q-10 4 -20 10 q-10 -6 -20 -10 Z" transform="translate(-100 220)"/><path d="M0 0 q8 -8 16 0 q8 -8 16 0 q-8 3 -16 8 q-8 -5 -16 -8 Z" transform="translate(-160 260)"/><path d="M0 0 q8 -8 16 0 q8 -8 16 0 q-8 3 -16 8 q-8 -5 -16 -8 Z" transform="translate(-60 280)"/></g>` +
        `<g fill="#241a3a"><rect x="640" y="200" width="160" height="460"/><path d="M620 210 L720 80 L820 210 Z"/><rect x="560" y="420" width="320" height="240"/><path d="M545 430 L600 360 L655 430 Z M785 430 L840 360 L895 430 Z"/></g>` +
        `<g stroke="#1a1230" stroke-width="3" opacity=".7">${Array.from({ length: 8 }, (_, i) => `<path d="M640 ${240 + i * 50} H800"/>`).join("")}</g>` +
        `<g fill="#ffd36b"><rect class="fx-flicker" x="700" y="260" width="20" height="34" rx="10"/><rect x="740" y="330" width="20" height="34" rx="10" opacity=".85"/><rect class="fx-flicker" style="animation-delay:-1.3s" x="610" y="480" width="22" height="36" rx="11"/><rect x="820" y="500" width="22" height="36" rx="11" opacity=".85"/><circle cx="720" cy="150" r="12" opacity=".7"/></g>` +
        ridge(640, 20, 5, "#2a1f44", 109) +
        `<g fill="none" stroke="#1d1530" stroke-width="10" stroke-linecap="round"><path d="M180 660 L190 520 M190 560 L150 520 M188 590 L230 540 M190 520 L170 480 M190 520 L215 490"/><path d="M1440 660 L1430 540 M1432 580 L1470 545 M1430 540 L1400 500"/></g>` +
        `<g fill="#4a3e66"><path d="M260 700 v-60 a30 30 0 0 1 60 0 v60 Z"/><path d="M380 710 v-44 a24 24 0 0 1 48 0 v44 Z"/><path d="M1150 705 v-56 a28 28 0 0 1 56 0 v56 Z"/><rect x="1330" y="650" width="12" height="60"/><rect x="1312" y="664" width="48" height="12"/></g>` +
        ridge(720, 14, 4, "#33284f", 113) +
        `<circle class="fx-float" cx="460" cy="560" r="40" fill="url(#hwisp)"/><circle class="fx-float" style="animation-delay:-3s" cx="1060" cy="520" r="34" fill="url(#hwisp)"/><circle class="fx-float" style="animation-delay:-5s" cx="1500" cy="600" r="30" fill="url(#hwisp)"/>`
      ),
      front: svg("", `<g class="fx-drift" fill="#d6cff0" opacity=".2"><ellipse cx="300" cy="870" rx="460" ry="70"/><ellipse cx="1200" cy="880" rx="520" ry="80"/></g>` +
        `<g class="fx-drift fx-drift--rev" fill="#d6cff0" opacity=".14"><ellipse cx="800" cy="840" rx="600" ry="50"/></g>` +
        `<g fill="#1d1530"><ellipse cx="80" cy="910" rx="200" ry="80"/><ellipse cx="1540" cy="910" rx="200" ry="90"/></g>`)
    },

    space: {
      ground: [8, 30], fly: 0.5, tint: "#2a2b6b",
      back: svg(
        sky("sp", [[0, "#05061a"], [1, "#1b1d4a"]]) +
        `<radialGradient id="neb1"><stop offset="0" stop-color="#9a5fe0" stop-opacity=".55"/><stop offset="1" stop-color="#9a5fe0" stop-opacity="0"/></radialGradient>` +
        `<radialGradient id="neb2"><stop offset="0" stop-color="#3fc1d6" stop-opacity=".4"/><stop offset="1" stop-color="#3fc1d6" stop-opacity="0"/></radialGradient>` +
        `<radialGradient id="planet" cx=".35" cy=".35"><stop offset="0" stop-color="#f6b07e"/><stop offset=".7" stop-color="#d9733f"/><stop offset="1" stop-color="#8a3f22"/></radialGradient>` +
        `<radialGradient id="earth" cx=".35" cy=".35"><stop offset="0" stop-color="#8fd2ff"/><stop offset="1" stop-color="#2556a6"/></radialGradient>` +
        sky("moon", [[0, "#a4a4bc"], [1, "#7c7c96"]]),
        fill("sp") +
        `<ellipse cx="520" cy="260" rx="480" ry="200" fill="url(#neb1)" transform="rotate(-14 520 260)"/><ellipse cx="900" cy="380" rx="380" ry="140" fill="url(#neb2)" transform="rotate(-8 900 380)"/>` +
        dots(110, 127, "#ffffff", 0, 700, 1.4) + dots(40, 129, "#ffffff", 0, 700, 2.2, "fx-twinkle") +
        `<g class="fx-shoot"><path d="M200 130 l160 80" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/><circle cx="360" cy="210" r="4" fill="#ffffff"/></g>` +
        `<path d="M1072 266 A190 34 -18 0 1 1448 194" fill="none" stroke="#f3c79a" stroke-width="10"/>` +
        `<circle cx="1260" cy="230" r="110" fill="url(#planet)"/>` +
        `<path d="M1448 194 A190 34 -18 0 1 1072 266" fill="none" stroke="#f3c79a" stroke-width="10"/>` +
        `<circle cx="300" cy="520" r="34" fill="url(#earth)"/><path d="M286 506 q10 -6 18 4 q-4 10 -14 8 Z M300 530 q12 -2 14 8 q-8 4 -14 -2 Z" fill="#6fcf8a"/>` +
        ridge(700, 26, 5, "url(#moon)", 131) +
        `<g><ellipse cx="420" cy="780" rx="90" ry="20" fill="#6a6a82"/><path d="M332 776 A90 20 0 0 1 508 776" stroke="#b9b9cf" stroke-width="4" fill="none"/>` +
        `<ellipse cx="1100" cy="760" rx="70" ry="16" fill="#6a6a82"/><path d="M1032 757 A70 16 0 0 1 1168 757" stroke="#b9b9cf" stroke-width="4" fill="none"/>` +
        `<ellipse cx="760" cy="840" rx="110" ry="22" fill="#6a6a82"/><path d="M652 836 A110 22 0 0 1 868 836" stroke="#b9b9cf" stroke-width="4" fill="none"/></g>`
      ),
      front: svg("", `<g fill="#a2a2b8"><ellipse cx="100" cy="900" rx="220" ry="80"/><ellipse cx="1500" cy="900" rx="220" ry="90"/></g>` +
        `<g fill="#c4c4d6"><circle cx="300" cy="880" r="14"/><circle cx="1290" cy="886" r="10"/></g>`)
    }
  };
})();
