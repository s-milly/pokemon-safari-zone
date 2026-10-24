/*
  Hand-drawn SVG backgrounds, one per habitat.
  Each scene has a back layer (behind the Pokémon) and a front layer (grass,
  rocks or waves drawn over their feet). ground is the band, in percent from
  the bottom of the screen, where Pokémon stand. fly lets some float higher.
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

  function dots(count, seed, fill, yMax, rMax, extra = "") {
    const r = rng(seed);
    let out = "";
    for (let i = 0; i < count; i++) {
      out += `<circle cx="${(r() * W).toFixed(0)}" cy="${(r() * yMax).toFixed(0)}" r="${(0.6 + r() * rMax).toFixed(1)}" fill="${fill}" ${extra}/>`;
    }
    return out;
  }

  function pines(baseY, count, fill, seed, size) {
    const r = rng(seed);
    let out = "";
    for (let i = 0; i < count; i++) {
      const x = (i + r() * 0.6) * (W / count), h = size * (0.7 + r() * 0.6), w = h * 0.38;
      out += `<path d="M${x} ${baseY - h} L${x + w} ${baseY} L${x - w} ${baseY} Z" fill="${fill}"/>`;
    }
    return out;
  }

  function sky(id, stops) {
    return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("")}</linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${id})"/>`;
  }

  const svg = inner => `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

  window.SCENES = {
    forest: {
      ground: [6, 26], tint: "#2f6b3a",
      back: svg(
        sky("fs", [[0, "#bfe6d6"], [0.6, "#e9f3c9"], [1, "#e9f3c9"]]) +
        `<circle cx="1250" cy="170" r="70" fill="#fff7c2" opacity=".8"/>` +
        pines(520, 22, "#7fb48b", 3, 260) +
        ridge(540, 30, 6, "#6aa877", 5) +
        pines(600, 14, "#3f8452", 7, 330) +
        ridge(620, 24, 5, "#4f9a5c", 11) +
        `<rect x="160" y="420" width="40" height="260" fill="#6b4a32"/><circle cx="180" cy="400" r="120" fill="#2f7a45"/>` +
        `<rect x="1380" y="380" width="46" height="300" fill="#6b4a32"/><circle cx="1400" cy="360" r="140" fill="#2f7a45"/>` +
        ridge(700, 18, 4, "#7cc46a", 13)
      ),
      front: svg(tufts(900, "#3f9a49", 60, 17, 90) + tufts(900, "#56b25a", 40, 19, 60) +
        `<ellipse cx="80" cy="880" rx="190" ry="90" fill="#2e7f3c"/><ellipse cx="1540" cy="890" rx="200" ry="100" fill="#2e7f3c"/>`)
    },

    safari: {
      ground: [6, 26], tint: "#8a6a24",
      back: svg(
        sky("ss", [[0, "#f8c98a"], [0.55, "#fde7b5"], [1, "#fde7b5"]]) +
        `<circle cx="420" cy="300" r="110" fill="#ffefb0" opacity=".9"/>` +
        `<path d="M900 560 L960 440 L1180 440 L1240 560 Z" fill="#d79e66"/><path d="M1260 560 L1300 480 L1420 480 L1460 560 Z" fill="#dcaa74"/>` +
        ridge(560, 20, 6, "#d8c07a", 23) +
        `<g fill="#6f5a35"><rect x="280" y="470" width="16" height="140"/><ellipse cx="288" cy="465" rx="120" ry="28"/><rect x="1120" y="500" width="12" height="110"/><ellipse cx="1126" cy="496" rx="90" ry="22"/></g>` +
        ridge(640, 20, 5, "#c9b766", 29) +
        ridge(720, 14, 4, "#b7ad5a", 31)
      ),
      front: svg(tufts(900, "#9c8f3c", 70, 37, 120) + tufts(900, "#c2b45a", 50, 41, 80))
    },

    sea: {
      ground: [8, 34], fly: 0.25, tint: "#1f6fa0",
      back: svg(
        sky("se", [[0, "#9fd8f5"], [0.45, "#d8f1fb"], [0.46, "#3fa7d6"], [1, "#1c6aa3"]]) +
        `<circle cx="1300" cy="150" r="64" fill="#fff6cc"/>` +
        `<g fill="#ffffff" opacity=".9"><ellipse cx="300" cy="150" rx="110" ry="26"/><ellipse cx="370" cy="132" rx="70" ry="24"/><ellipse cx="900" cy="220" rx="90" ry="20"/></g>` +
        `<path d="M1180 420 L1240 360 L1320 370 L1380 420 Z" fill="#7a8a8f"/>` +
        `<g stroke="#ffffff" stroke-opacity=".35" stroke-width="4" fill="none" stroke-linecap="round">` +
        Array.from({ length: 9 }, (_, i) => `<path d="M${(i * 197) % 1500} ${470 + i * 45} q30 -12 60 0 t60 0"/>`).join("") + `</g>`
      ),
      front: svg(`<path d="M0 860 Q100 820 200 860 T400 860 T600 860 T800 860 T1000 860 T1200 860 T1400 860 T1600 860 L1600 900 L0 900 Z" fill="#e8f7ff" opacity=".85"/>` +
        `<path d="M-80 900 Q60 780 200 840 Q300 880 320 900 Z" fill="#6d6560"/><path d="M1380 900 Q1460 790 1580 820 L1640 900 Z" fill="#6d6560"/>`)
    },

    cave: {
      ground: [6, 24], tint: "#4b3a6b",
      back: svg(
        sky("cv", [[0, "#1e1830"], [1, "#3c3150"]]) +
        `<g fill="#2a2240">` + Array.from({ length: 16 }, (_, i) => { const x = i * 105 + 20, h = 60 + ((i * 53) % 150); return `<path d="M${x - 34} 0 L${x + 34} 0 L${x} ${h} Z"/>`; }).join("") + `</g>` +
        ridge(560, 60, 5, "#3a2f52", 43) +
        `<g fill="#9ee7ff" opacity=".85"><path d="M260 600 l20 -70 l20 70 Z"/><path d="M300 605 l14 -46 l14 46 Z"/><path d="M1250 590 l22 -80 l22 80 Z"/><path d="M1300 600 l14 -50 l14 50 Z"/></g>` +
        `<g fill="#9ee7ff" opacity=".25"><circle cx="280" cy="570" r="70"/><circle cx="1272" cy="560" r="80"/></g>` +
        ridge(680, 20, 4, "#56486e", 47)
      ),
      front: svg(`<g fill="#2b2340"><ellipse cx="120" cy="890" rx="230" ry="110"/><ellipse cx="1500" cy="900" rx="240" ry="120"/><ellipse cx="800" cy="930" rx="300" ry="60"/></g>`)
    },

    fossil: {
      ground: [6, 24], tint: "#8a4f2a",
      back: svg(
        sky("fo", [[0, "#f6d7a8"], [1, "#fbe9cc"]]) +
        ridge(360, 40, 4, "#d7925e", 53) + ridge(440, 30, 5, "#c47c4b", 59) + ridge(520, 26, 5, "#b46c3e", 61) +
        `<g fill="none" stroke="#f3dcc0" stroke-width="10" stroke-linecap="round" opacity=".8">` +
        `<path d="M300 480 a26 26 0 1 1 -26 -26 a40 40 0 1 1 40 40"/>` +
        `<path d="M1100 560 l120 0 M1120 545 l0 30 M1200 545 l0 30"/>` +
        `<path d="M760 470 q20 -20 40 0 q20 20 40 0 q20 -20 40 0"/></g>` +
        ridge(640, 18, 4, "#d9a777", 67) + ridge(720, 12, 4, "#e2b98c", 71)
      ),
      front: svg(`<g fill="#a5653c"><ellipse cx="100" cy="900" rx="220" ry="90"/><ellipse cx="1520" cy="900" rx="220" ry="100"/></g>` +
        `<g fill="#c88a5c"><circle cx="420" cy="885" r="26"/><circle cx="1180" cy="890" r="20"/></g>`)
    },

    volcano: {
      ground: [6, 24], tint: "#8a2d1d",
      back: svg(
        sky("vo", [[0, "#3b1f2b"], [0.6, "#b2462c"], [1, "#e8853a"]]) +
        `<g fill="#6b5a62" opacity=".55"><ellipse cx="820" cy="120" rx="150" ry="60"/><ellipse cx="900" cy="70" rx="120" ry="50"/></g>` +
        `<path d="M520 640 L740 220 L880 220 L1100 640 Z" fill="#3b2626"/>` +
        `<path d="M740 220 L880 220 L860 260 L830 330 L800 270 L770 300 Z" fill="#ff8a3a"/>` +
        `<path d="M800 270 L780 380 L810 460 L790 560" stroke="#ff7a2a" stroke-width="12" fill="none" stroke-linecap="round"/>` +
        ridge(620, 30, 5, "#4a2c28", 79) + ridge(700, 18, 4, "#3a2422", 83) +
        `<g fill="#ff9a3a" opacity=".85"><ellipse cx="350" cy="760" rx="110" ry="16"/><ellipse cx="1250" cy="790" rx="140" ry="18"/></g>`
      ),
      front: svg(`<g fill="#241615"><ellipse cx="110" cy="900" rx="230" ry="100"/><ellipse cx="1500" cy="900" rx="230" ry="110"/></g>`)
    },

    snow: {
      ground: [6, 24], tint: "#3d6d96",
      back: svg(
        sky("sn", [[0, "#cfe6f7"], [1, "#f2f8fd"]]) +
        `<path d="M0 560 L260 260 L420 420 L640 180 L880 460 L1060 300 L1300 520 L1460 340 L1600 480 L1600 640 L0 640 Z" fill="#a9c6dd"/>` +
        `<path d="M260 260 L310 320 L280 330 L240 300 Z M640 180 L700 250 L660 270 L610 230 Z M1060 300 L1110 350 L1070 360 L1030 340 Z" fill="#ffffff"/>` +
        pines(640, 12, "#4a7296", 89, 180) +
        ridge(650, 22, 5, "#e3eef7", 97) + ridge(740, 16, 4, "#f4f9fd", 101) +
        `<g class="snowfall">${dots(90, 103, "#ffffff", 900, 3.4)}</g>`
      ),
      front: svg(`<g fill="#ffffff"><ellipse cx="120" cy="900" rx="260" ry="90"/><ellipse cx="1500" cy="900" rx="260" ry="100"/><ellipse cx="800" cy="935" rx="420" ry="60"/></g>`)
    },

    haunted: {
      ground: [6, 26], fly: 0.3, tint: "#3e2a5c",
      back: svg(
        sky("ha", [[0, "#140f26"], [1, "#3b2a5a"]]) +
        dots(60, 107, "#d9d0ff", 420, 1.6) +
        `<circle cx="1260" cy="170" r="80" fill="#f4eccc"/><circle cx="1290" cy="150" r="80" fill="#140f26" opacity=".18"/>` +
        `<g fill="#241a3a"><rect x="640" y="200" width="160" height="460"/><path d="M620 210 L720 90 L820 210 Z"/><rect x="560" y="420" width="320" height="240"/></g>` +
        `<g fill="#ffd36b" opacity=".85"><rect x="700" y="260" width="20" height="34" rx="10"/><rect x="740" y="330" width="20" height="34" rx="10"/><rect x="610" y="480" width="22" height="36" rx="11"/><rect x="820" y="500" width="22" height="36" rx="11"/></g>` +
        ridge(640, 20, 5, "#2a1f44", 109) +
        `<g fill="#4a3e66"><path d="M220 700 v-60 a30 30 0 0 1 60 0 v60 Z"/><path d="M380 710 v-44 a24 24 0 0 1 48 0 v44 Z"/><path d="M1150 705 v-56 a28 28 0 0 1 56 0 v56 Z"/><rect x="1330" y="650" width="12" height="60"/><rect x="1312" y="664" width="48" height="12"/></g>` +
        ridge(720, 14, 4, "#33284f", 113)
      ),
      front: svg(`<g fill="#d6cff0" opacity=".22"><ellipse cx="300" cy="880" rx="420" ry="70"/><ellipse cx="1200" cy="890" rx="480" ry="80"/></g>` +
        `<g fill="#1d1530"><ellipse cx="80" cy="910" rx="200" ry="80"/><ellipse cx="1540" cy="910" rx="200" ry="90"/></g>`)
    },

    space: {
      ground: [8, 30], fly: 0.5, tint: "#2a2b6b",
      back: svg(
        sky("sp", [[0, "#07081c"], [1, "#1b1d4a"]]) +
        dots(160, 127, "#ffffff", 700, 1.8) +
        `<g opacity=".35"><ellipse cx="560" cy="260" rx="380" ry="90" fill="#7f5fd6" transform="rotate(-14 560 260)"/></g>` +
        `<circle cx="1260" cy="230" r="110" fill="#e48a5a"/><ellipse cx="1260" cy="230" rx="190" ry="34" fill="none" stroke="#f3c79a" stroke-width="10" transform="rotate(-18 1260 230)"/>` +
        `<path d="M200 130 l120 60" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity=".7"/>` +
        ridge(700, 26, 5, "#8f8fa8", 131) +
        `<g fill="#76768f"><ellipse cx="420" cy="780" rx="90" ry="20"/><ellipse cx="1100" cy="760" rx="70" ry="16"/><ellipse cx="760" cy="840" rx="110" ry="22"/></g>`
      ),
      front: svg(`<g fill="#a2a2b8"><ellipse cx="100" cy="900" rx="220" ry="80"/><ellipse cx="1500" cy="900" rx="220" ry="90"/></g>`)
    }
  };
})();
