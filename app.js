/*
  Pokémon Safari Zone: the game loop.
  The microphone level is measured every frame. While it stays under the goal,
  quiet time builds up, and each time it reaches the setting a wild Pokémon
  appears. Over the goal for a moment, the Pokémon flee (or the scene pauses).
*/
(function () {
  const $ = sel => document.querySelector(sel);
  const RARITY_WEIGHT = { common: 70, uncommon: 25, rare: 5 };
  const SHINY_ODDS = 40;
  const MAX_ON_SCREEN = 4;
  const LOUD_MS = 600;     // how long the room must stay over the goal to count as loud
  const CALM_MS = 1200;    // how long it must be quiet again before the scene resumes
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

  // ---------- Saved settings and Pokédex (per browser) ----------
  const DEFAULTS = { loudMode: "flee", goal: 45, sensitivity: 5, spawnMin: 60, shiny: true, showMeter: true, practice: false };
  function load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage blocked: keep going in memory */ }
  }
  const settings = { ...DEFAULTS, ...load("qsz-settings", {}) };
  delete settings.spawnSeconds; // replaced by spawnMin
  let dex = load("qsz-dex", {});

  const byId = {};
  for (const h of HABITATS) for (const p of h.pokemon) byId[p.id] = { ...p, habitat: h.key };

  // ---------- Home ----------
  const habitatList = $("#habitats");
  function renderHome() {
    habitatList.innerHTML = HABITATS.map(h => {
      const seen = h.pokemon.filter(p => dex[p.id]).length;
      return `<li><button class="habitat" type="button" data-habitat="${h.key}" style="--tint:${SCENES[h.key].tint}">
        <span class="habitat__art">${SCENES[h.key].thumb.replace(/(id="|url\(#)(\w+)/g, "$1$2-thumb")}</span>
        <span class="habitat__text"><b>${h.name}</b><small>${h.blurb}</small></span>
        <span class="habitat__seen">${seen} of ${h.pokemon.length}</span>
      </button></li>`;
    }).join("");
    const total = Object.keys(byId).length, seen = Object.keys(dex).filter(id => byId[id]).length;
    $("#home-dex-count").textContent = `${seen}/${total}`;
  }
  habitatList.addEventListener("click", e => {
    const btn = e.target.closest("[data-habitat]");
    if (btn) openScene(btn.dataset.habitat);
  });

  // ---------- Scene ----------
  const scene = $("#scene"), stage = $("#stage"), dialogBox = $("#dialog");
  let habitat = null, running = false, paused = false, hushed = false, scared = false;
  let quietMs = 0, loudMs = 0, calmMs = 0, lastFrame = 0, visitors = [], nextMs = 0;

  // Quiet time needed for the next Pokémon: somewhere between the setting and twice it
  const waitFor = () => (settings.spawnMin + Math.random() * settings.spawnMin) * 1000;

  function openScene(key) {
    habitat = HABITATS.find(h => h.key === key);
    $("#scene-back").innerHTML = SCENES[key].layers.map((svg, i) => `<div class="layer layer--${i}">${svg}</div>`).join("");
    $("#scene-front").innerHTML = SCENES[key].front;
    $("#scene-title").textContent = habitat.name;
    $("#start-title").textContent = habitat.name;
    $("#start-error").hidden = true;
    $("#start").hidden = false;
    stage.innerHTML = "";
    visitors = [];
    setBoulders(key);
    setMoonstone(key);
    bait = null;
    quietMs = loudMs = calmMs = 0;
    nextMs = waitFor();
    running = false; paused = false; scared = false; setHush(false);
    updateCount();
    $("#home").hidden = true;
    scene.hidden = false;
    applySettings();
    $("#start-btn").focus();
  }

  function closeScene() {
    running = false;
    scene.hidden = true;
    $("#home").hidden = false;
    stopMic();
    renderHome();
  }
  $("#back-home").addEventListener("click", closeScene);

  $("#start-btn").addEventListener("click", async () => {
    const ok = settings.practice || await startMic();
    if (!ok) return;
    $("#start").hidden = true;
    running = true; paused = false;
    $("#playpause").textContent = "Pause";
    say(`Welcome to the ${habitat.name}. Stay quiet and the Pokémon will come out.`);
    lastFrame = performance.now();
  });

  $("#playpause").addEventListener("click", () => {
    if (!running) return;
    paused = !paused;
    $("#playpause").textContent = paused ? "Resume" : "Pause";
    scene.classList.toggle("is-paused", paused);
    paused ? freezeAll() : visitors.forEach(v => wander(v, 600));
    say(paused ? "Paused." : "Back to watching.");
    lastFrame = performance.now();
  });

  $("#fullscreen").addEventListener("click", () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  });

  // ---------- Microphone ----------
  let audio = null, analyser = null, stream = null, samples = null;
  async function startMic() {
    if (analyser) return true;
    const error = $("#start-error");
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      audio = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audio.createAnalyser();
      analyser.fftSize = 2048;
      audio.createMediaStreamSource(stream).connect(analyser);
      samples = new Float32Array(analyser.fftSize);
      return true;
    } catch (err) {
      error.hidden = false;
      error.innerHTML = `The microphone did not start, so the game cannot hear the room. Allow the microphone in your browser and press Start again, or turn on <button type="button" class="link" id="use-practice">practice mode</button> to try it with a slider.`;
      $("#use-practice").addEventListener("click", () => { settings.practice = true; save("qsz-settings", settings); applySettings(); $("#start-btn").click(); });
      return false;
    }
  }
  function stopMic() {
    stream?.getTracks().forEach(t => t.stop());
    audio?.close().catch(() => {});
    audio = analyser = stream = null;
  }

  let level = 0;
  function readLevel() {
    let raw;
    if (settings.practice) {
      raw = Number($("#practice-level").value);
    } else if (analyser) {
      analyser.getFloatTimeDomainData(samples);
      let sum = 0;
      for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
      const db = 20 * Math.log10(Math.sqrt(sum / samples.length) + 1e-8);
      // About -80 dB (silent room) to -15 dB (shouting) maps onto 0 to 100, shifted by sensitivity
      raw = (db + 80 + (settings.sensitivity - 5) * 5) / 65 * 100;
    } else {
      raw = 0;
    }
    raw = Math.max(0, Math.min(100, raw));
    level += (raw - level) * (raw > level ? 0.35 : 0.08);
    return level;
  }

  // ---------- Loop ----------
  const fill = $("#meter-fill"), meter = $("#meter"), ring = $("#next-ring");
  function frame(now) {
    const dt = Math.min(100, now - lastFrame);
    lastFrame = now;
    const lvl = readLevel();
    fill.style.height = `${lvl}%`;
    const over = lvl > settings.goal;
    meter.classList.toggle("is-loud", over);
    meter.classList.toggle("is-near", !over && lvl > settings.goal * 0.8);
    meter.setAttribute("aria-valuenow", Math.round(lvl));

    if (running && !paused && !document.hidden) {
      stage.classList.toggle("is-nervous", !over && lvl > settings.goal * 0.8);
      if (over) { loudMs += dt; calmMs = 0; } else { loudMs = Math.max(0, loudMs - dt); calmMs += dt; }

      // Loud time only counts toward a new warning once the last one is over
      if (hushed || scared) loudMs = 0;

      if (hushed) {
        if (calmMs > CALM_MS) { setHush(false); say("It is quiet again. The Pokémon are coming back out."); }
      } else if (scared) {
        // After a flee, wait for quiet before warning again, so the message stays readable
        if (calmMs > CALM_MS) scared = false;
      } else if (loudMs > LOUD_MS) {
        tooLoud();
      } else if (!over) {
        quietMs += dt;
        if (quietMs >= nextMs) { quietMs = 0; nextMs = waitFor(); spawn(); }
      }
    }
    ring.style.strokeDashoffset = 100 - Math.min(100, quietMs / nextMs * 100);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(t => { lastFrame = t; frame(t); });

  function tooLoud() {
    loudMs = 0; calmMs = 0;
    if (settings.loudMode === "pause") {
      setHush(true);
      say("Too loud! The Pokémon are hiding.");
      return;
    }
    quietMs = 0;
    scared = true;
    if (visitors.length) {
      const names = visitors.length === 1 ? `The wild ${visitors[0].name}` : "The wild Pokémon";
      visitors.forEach(v => leave(v, true));
      say(`Too loud! ${names} fled!`);
    } else {
      say("Too loud! Shh... nothing will come out while it is this noisy.");
    }
  }

  function setHush(on) {
    if (on !== hushed) on ? freezeAll() : visitors.forEach(v => wander(v, 600));
    hushed = on;
    $("#hush").hidden = !on;
    scene.classList.toggle("is-hushed", on);
  }

  // ---------- Pokémon ----------
  function pick() {
    // Skip Pokémon already on screen so the scene does not show two of the same
    const showing = new Set(visitors.map(v => v.id));
    let pool = habitat.pokemon.filter(p => !showing.has(p.id));
    if (!pool.length) pool = habitat.pokemon;
    const total = pool.reduce((s, p) => s + RARITY_WEIGHT[p.rarity], 0);
    let r = Math.random() * total;
    for (const p of pool) { r -= RARITY_WEIGHT[p.rarity]; if (r <= 0) return p; }
    return pool[0];
  }

  // How far up the screen a Pokémon may stand. Ones that cannot swim stay
  // out of the water (in the sea channel at Seafoam Islands), and only
  // flyers and swimmers go beyond the ground into the band behind it.
  function heightRange(p) {
    const scene = SCENES[habitat.key];
    const [lo, hi] = scene.ground;
    // Only flyers (and swimmers, out on open water) use the band above the ground
    const upHigh = scene.fly && (FLOATERS.has(p.id) || (scene.water && SWIMMERS.has(p.id)));
    let top = upHigh ? hi + 40 * scene.fly : hi;
    if (scene.water && !SWIMMERS.has(p.id)) top = Math.min(top, svgToStage(800, scene.water.bottom, scene.water.layer).y - 1);
    return [lo, Math.max(lo, top)];
  }

  function placeFor(p) {
    const [lo, flyMax] = heightRange(p);
    let best = null, bestGap = -1;
    for (let i = 0; i < 24; i++) {
      const x = 10 + Math.random() * 76;
      const y = lo + Math.random() * (flyMax - lo);
      const gap = Math.min(999, ...[...visitors, ...boulders].map(v => Math.hypot(v.x - x, (v.y - y) * 1.6)));
      if (gap > bestGap) { best = { x, y }; bestGap = gap; }
      if (gap > 22) break;
    }
    return best;
  }

  function spawn() {
    if (visitors.length >= MAX_ON_SCREEN) leave(visitors[0], false);
    const p = pick(), key = habitat.key;
    const shiny = settings.shiny && Math.random() < 1 / SHINY_ODDS;
    const { x, y } = placeFor(p);
    const el = document.createElement("div");
    const floats = FLOATERS.has(p.id);
    el.className = `mon mon--${p.rarity}${shiny ? " mon--shiny" : ""}${floats ? " mon--float" : ""}`;
    // Bigger Pokémon look bigger: Pokédex height, squashed so a 9 meter Onix
    // still fits next to a 30 centimeter Caterpie
    const size = Math.max(0.6, Math.min(2, Math.pow(p.height / 10, 0.45)));
    // Flyers hover a little above their shadow, everyone else stands on it
    const pad = floats ? -0.12 : ART_PAD[p.id] || 0;
    el.style.cssText = `--k:${size.toFixed(2)};--pad:${pad}`;
    place(el, x, y);
    // The body holds the picture so swimmers can be cut off at the waterline
    el.innerHTML = `<span class="mon__body"><img alt="${shiny ? "Shiny " : ""}${p.name}" src="${(shiny ? ART.shiny : ART.normal)(p.id)}" draggable="false"></span><span class="mon__shadow"></span><span class="mon__fx"></span>`;
    const visitor = { ...p, shiny, el, x, y };
    const img = el.querySelector("img");
    img.addEventListener("load", () => {
      // The room got loud (or the class left) while the picture was loading
      if (scared || hushed || !running || habitat.key !== key) return;
      stage.appendChild(el);
      requestAnimationFrame(() => el.classList.add("is-in"));
      visitors.push(visitor);
      setSwim(visitor);
      wander(visitor);
      record(p, shiny);
      const tag = p.rarity === "rare" ? " A rare find!" : "";
      say(shiny ? `Whoa! A shiny ${p.name} appeared!` : `A wild ${p.name} appeared!${tag}`, p.rarity === "rare" || shiny);
    }, { once: true });
    img.addEventListener("error", () => { quietMs = nextMs * 0.75; }, { once: true });
  }

  // Position on the stage, with perspective: full size at the front of the
  // scene, shrinking steadily (and getting hazier) the further back it stands.
  function depthScale(y) {
    return Math.max(0.42, Math.min(1.15, 1.15 - (y - 5) * 0.022));
  }
  function place(el, x, y, far = 1) {
    el.style.left = `${x}%`;
    el.style.bottom = `${y}%`;
    el.style.setProperty("--s", (depthScale(y) * far).toFixed(2));
    el.style.setProperty("--f", (y / 100).toFixed(2));
    el.style.zIndex = 100 - Math.round(y);
  }

  // Walk to a new spot at a steady pace, facing the way it is going, then rest.
  // Now and then a Pokémon does one of its habitat's activities instead (see
  // ACTIVITIES below): hiding in grass, digging, teleporting and so on.
  const WALK_SPEED = 3.5; // percent of the screen width per second
  // Add ?busy to the address to see the activities far more often (for a demo)
  const BUSY = new URLSearchParams(location.search).has("busy");
  function wander(v, delay = 2500 + Math.random() * 3000) {
    clearTimeout(v.timer);
    v.timer = setTimeout(function step() {
      if (!v.el.isConnected) return;
      if (!running || paused || hushed || reduceMotion.matches) return;
      const rest = () => { v.timer = setTimeout(step, 2000 + Math.random() * 5000); };
      // Finish a route that a pause cut short
      if (v.path && v.path.length) return follow(v, rest);
      if (v.zone === "ledge") {
        v.path = Math.random() < 0.35 ? climbDown(v) : [ledgeSpot(v)];
        return follow(v, rest);
      }
      const options = (ACTIVITIES[habitat.key] || []).slice().sort(() => Math.random() - 0.5);
      for (const act of options) {
        if (Math.random() < (BUSY ? 0.6 : act.chance) && act.who(v)) return act.run(v, rest);
      }
      v.path = [groundSpot(v)];
      follow(v, rest);
    }, delay);
  }

  function groundSpot(v) {
    const [lo, top] = heightRange(v);
    let x;
    do { x = 8 + Math.random() * 78; } while (Math.abs(x - v.x) < 15);
    return { x, y: Math.max(lo, Math.min(top, v.y + (Math.random() - 0.5) * 10)), zone: "ground" };
  }

  // Go through a list of stops one at a time. A stop can have:
  //   x, y     where to go (leave out to stay put)
  //   speed    instead of walking speed; secs for an exact time (0 is instant)
  //   ease     a CSS timing function instead of a steady pace
  //   far      extra shrink, or growth (see keepSize)
  //   noFlip   keep facing the same way
  //   start    run on setting off; end runs on arrival
  //   wait     milliseconds to stay after arriving
  //   zone     "ground" or "ledge", set on arrival
  //   keepSink leave a swimmer's depth alone
  // The first stop is only dropped once reached, so a pause can pick it up again.
  function follow(v, done) {
    const w = v.path[0];
    if (!w) { v.path = null; return done(); }
    const x = w.x ?? v.x, y = w.y ?? v.y;
    const dist = Math.hypot(x - v.x, (y - v.y) * 2);
    const seconds = w.secs ?? (dist > 0.01 ? Math.max(0.3, dist / (w.speed || WALK_SPEED)) : 0);
    if (w.start) w.start(v);
    if (dist > 0.01) {
      const ease = w.ease || "linear";
      v.el.style.transition = `left ${seconds}s ${ease}, bottom ${seconds}s ${ease}, --s ${seconds}s ${ease}`;
      if (!w.noFlip && Math.abs(x - v.x) > 0.5) v.el.classList.toggle("is-flipped", x > v.x);
      if (ROLLERS.has(v.id)) roll(v, x - v.x, seconds);
      place(v.el, x, y, w.far || 1);
      v.x = x; v.y = y; v.far = w.far || 1;
      if (!w.keepSink) {
        clearTimeout(v.swimTimer);
        v.swimTimer = setTimeout(() => setSwim(v), seconds * 500);
      }
    }
    v.timer = setTimeout(() => {
      if (w.zone) v.zone = w.zone;
      if (w.end) w.end(v);
      v.path.shift();
      if (!v.path.length) { v.path = null; return done(); }
      follow(v, done);
    }, seconds * 1000 + (w.wait || 0) + 150);
  }

  // Turn a point in a background drawing (1600 by 900 units) into a spot on the stage
  function svgToStage(x, y, layer) {
    const box = document.querySelector(`#scene-back .layer--${layer}`).getBoundingClientRect();
    const area = stage.getBoundingClientRect();
    const k = Math.max(box.width / 1600, box.height / 900);
    const px = box.left + (box.width - 1600 * k) / 2 + x * k;
    const py = box.top + (box.height - 900 * k) + y * k;
    return { x: (px - area.left) / area.width * 100, y: (area.bottom - py) / area.height * 100 };
  }

  // ---------- The ladder and ledge (Victory Road) ----------
  // A Pokémon sometimes walks to the ladder, climbs up and roams the ledge,
  // looking smaller because it is further back. Later it climbs down again.
  const CLIMB_SPEED = 3;     // a bit slower than walking
  // Height of the ledge's top at x, in the drawing (feet sit a little in from the edge)
  function ledgeY(x) {
    const [x0, y0, x1, y1] = SCENES[habitat.key].ledge.edge;
    return y0 + (x - x0) * (y1 - y0) / (x1 - x0) + 8;
  }

  function canClimb(v) {
    const L = SCENES[habitat.key].ledge;
    if (!L || v.height > 25) return false; // Onix is too big for a ladder
    if (visitors.filter(o => o.zone === "ledge" || (o.path && o.path.some(w => w.zone === "ledge"))).length >= 2) return false;
    const mid = (L.x1 + L.x2) / 2;
    const foot = svgToStage(L.ladderX, L.ladderBottom, L.layer), middle = svgToStage(mid, ledgeY(mid), L.layer);
    return foot.x > 4 && foot.x < 88 && middle.x > 4 && middle.x < 86; // ladder and ledge on screen (not on a narrow phone)
  }

  function ledgeSpot(v) {
    const L = SCENES[habitat.key].ledge;
    let sx, spot;
    for (let i = 0; i < 12; i++) {
      sx = L.x1 + Math.random() * (L.x2 - L.x1);
      spot = svgToStage(sx, ledgeY(sx), L.layer);
      if (spot.x > 4 && spot.x < 86 && Math.abs(spot.x - v.x) > 6) break; // on screen, clear of the meter
    }
    return { ...spot, zone: "ledge" };
  }

  function climbUp(v) {
    const L = SCENES[habitat.key].ledge;
    const foot = svgToStage(L.ladderX, L.ladderBottom, L.layer), top = svgToStage(L.ladderX, L.ladderTop, L.layer);
    return [{ ...foot, zone: "ground" }, { ...top, speed: CLIMB_SPEED, zone: "ledge" }, ledgeSpot(v)];
  }

  function climbDown(v) {
    const L = SCENES[habitat.key].ledge;
    const foot = svgToStage(L.ladderX, L.ladderBottom, L.layer), top = svgToStage(L.ladderX, L.ladderTop, L.layer);
    const [lo, hi] = SCENES[habitat.key].ground;
    return [{ ...top }, { ...foot, speed: CLIMB_SPEED, zone: "ground" },
      { x: Math.max(8, Math.min(86, foot.x + (Math.random() - 0.5) * 40)), y: lo + Math.random() * (hi - lo), zone: "ground" }];
  }

  // ---------- Swimming (Open Sea) ----------
  // In water, a water Pokémon sinks part way below the surface, and bobs a
  // little higher or lower each time it moves.
  function setSwim(v) {
    const w = SCENES[habitat.key].water;
    if (!w || !SWIMMERS.has(v.id) || !v.el.isConnected) return;
    const top = svgToStage(800, w.top, w.layer).y, bottom = svgToStage(800, w.bottom, w.layer).y;
    clearTimeout(v.swimTimer);
    if (v.y <= top && v.y >= bottom) {
      // Shallow enough that you can always tell who it is
      // A share of the body, so a flat fish is not swallowed whole
      // Further out they are smaller, so they ride higher to stay easy to see
      const deep = DEEP_SWIMMERS.has(v.id) ? 0.05 : 0;
      const share = (Math.random() < 0.2 ? 0.06 : 0.12 + deep + Math.random() * 0.12) * Math.min(1, depthScale(v.y));
      const sink = share * (ART_FILL[v.id] || 1);
      v.el.classList.add("is-swimming");
      v.el.style.setProperty("--sink", sink.toFixed(2));
    } else {
      v.el.style.setProperty("--sink", 0);
      v.swimTimer = setTimeout(() => v.el.classList.remove("is-swimming"), 1400);
    }
  }

  // ---------- Habitat activities ----------
  // Each habitat lists things its Pokémon sometimes do instead of a walk.
  // chance is per walk, who says which Pokémon can (and whether the spot
  // is on screen), and run sets up the route.
  const has = (...ids) => v => ids.includes(v.id);
  const walker = v => !FLOATERS.has(v.id);
  const anyOf = list => list[Math.floor(Math.random() * list.length)];
  const rand = (lo, hi) => lo + Math.random() * (hi - lo);
  const onScreen = p => p.x > 4 && p.x < 86 && p.y > 0 && p.y < 92;
  // Points in the drawings, as spots on the stage that are on screen right now
  const spots = (list, layer) => list.map(([x, y]) => svgToStage(x, y, layer)).filter(onScreen);
  // Moving up or down without going further back (climbing, hanging) keeps the size the same
  const keepSize = (fromY, toY) => depthScale(fromY) / depthScale(toY);
  const fillOf = v => ART_FILL[v.id] || 0.85;
  const sinkTo = (v, amount) => v.el.style.setProperty("--sink", amount.toFixed(2));
  const flag = (name, on) => v => v.el.classList.toggle(name, on);
  function burst(v, name) {
    v.el.classList.remove(name); void v.el.offsetWidth; v.el.classList.add(name);
    setTimeout(() => v.el.classList.remove(name), 1400);
  }
  const go = (v, path, rest) => { v.path = path; follow(v, rest); };
  const stay = (lo, hi, more = {}) => ({ wait: rand(lo, hi), ...more });

  // Route 1: tall grass patches; Viridian Forest: trees; and so on
  const GRASS = [[330, 790], [1270, 790]];
  const TREES = [{ x: 180, base: 690, top: 560, perch: [130, 240, 470, 500] }, { x: 1420, base: 680, top: 540, perch: [1360, 1480, 420, 460] }];
  const GRAVES = [[290, 700], [404, 710], [1178, 705]];
  const WINDOWS = [[710, 294], [750, 364], [621, 534], [831, 554]];
  const DOORS = [[330, 620], [1260, 620]];
  const PYLONS = [[250, 640], [1416, 640]];
  const POOLS = [[350, 760, 110], [1250, 790, 140]];
  const ELECTRIC = new Set([25, 26, 81, 82, 100, 101, 125, 135, 145]);
  const FIRE = new Set([4, 5, 6, 37, 38, 58, 59, 77, 78, 126, 136, 146]);
  const ROLLERS = new Set([100, 101]);

  function hideInGrass(v, rest) {
    const p = anyOf(spots(GRASS, 2)), f = fillOf(v);
    const peeks = [];
    for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
      peeks.push(stay(1500, 2200, { start: w => sinkTo(w, f * 0.35) }), stay(2000, 3500, { start: w => sinkTo(w, f * 0.8) }));
    }
    go(v, [{ x: p.x + rand(-4, 4), y: p.y }, stay(2500, 3500, { start: w => { flag("is-in-grass", true)(w); sinkTo(w, f * 0.8); } }),
      ...peeks, stay(1500, 1500, { start: w => sinkTo(w, 0), end: flag("is-in-grass", false) })], rest);
  }

  function climbTree(v, rest) {
    const t = anyOf(TREES.filter(t => onScreen(svgToStage(t.x, t.base, 1))));
    const base = svgToStage(t.x, t.base, 1), top = svgToStage(t.x, t.top, 1);
    const perch = svgToStage(rand(t.perch[0], t.perch[1]), rand(t.perch[2], t.perch[3]), 1);
    go(v, [{ ...base }, { ...top, speed: 2, noFlip: true, far: keepSize(base.y, top.y) },
      { ...perch, far: keepSize(base.y, perch.y) }, stay(6000, 10000),
      { ...top, far: keepSize(base.y, top.y) }, { ...base, speed: 2, noFlip: true }, groundSpot(v)], rest);
  }

  function hangFromTree(v, rest) {
    const t = anyOf(TREES.filter(t => onScreen(svgToStage(t.x, t.base, 1))));
    const x = t.x + (t.x < 800 ? 70 : -70);
    const ground = svgToStage(x, t.base, 1), hang = svgToStage(x, t.base - 110, 1);
    go(v, [{ ...ground }, { ...hang, speed: 1.5, noFlip: true, far: keepSize(ground.y, hang.y), start: flag("is-hanging", true) },
      stay(7000, 11000), { ...ground, speed: 1.5, noFlip: true, end: flag("is-hanging", false) }], rest);
  }

  function dig(v, rest) {
    const to = groundSpot(v), f = fillOf(v);
    go(v, [stay(1500, 1500, { start: w => { flag("is-burrowing", true)(w); sinkTo(w, f + 0.12); } }),
      stay(300, 300, { start: flag("is-under", true) }),
      { ...to, speed: 4, noFlip: true },
      stay(1500, 1500, { start: w => { flag("is-under", false)(w); sinkTo(w, 0); }, end: flag("is-burrowing", false) })], rest);
  }

  function dance(v, rest) {
    const s = moonstone, r = 6;
    const ring = Array.from({ length: 7 }, (_, i) => {
      const a = Math.PI + i * Math.PI / 3;
      return { x: s.x + Math.cos(a) * r, y: s.y + Math.sin(a) * r * 0.45, speed: 3 };
    });
    ring[0].start = w => { flag("is-dancing", true)(w); s.el.classList.add("is-glowing"); };
    ring[ring.length - 1].end = w => {
      flag("is-dancing", false)(w);
      if (!visitors.some(o => o !== w && o.el.classList.contains("is-dancing"))) s.el.classList.remove("is-glowing");
    };
    go(v, [{ x: s.x - r, y: s.y }, ...ring], rest);
  }

  function roost(v, rest) {
    const y = rand(72, 78), x = Math.max(10, Math.min(84, v.x + rand(-10, 10)));
    const [lo, hi] = heightRange(v);
    go(v, [{ x, y, speed: 5, far: keepSize(v.y, y), end: flag("is-roosting", true) }, stay(6000, 10000),
      { x: rand(10, 84), y: rand(lo, hi), speed: 9, ease: "cubic-bezier(.6, 0, .4, 1)", start: flag("is-roosting", false) }], rest);
  }

  function driftThroughGrave(v, rest) {
    const g = anyOf(spots(GRAVES, 1)), d = Math.random() < 0.5 ? -1 : 1;
    go(v, [{ x: g.x - 10 * d, y: g.y }, { x: g.x + 12 * d, y: g.y, speed: 2.5, start: flag("is-ghostly", true) },
      stay(800, 800, { end: flag("is-ghostly", false) })], rest);
  }

  // Go into a doorway or window, stay a while, come back out
  function visit(list, layer) {
    return (v, rest) => {
      const p = anyOf(spots(list, layer));
      go(v, [{ ...p, speed: 3, end: flag("is-inside", true) }, stay(6000, 9000),
        stay(900, 900, { start: flag("is-inside", false) }), groundSpot(v)], rest);
    };
  }

  function teleport(v, rest) {
    const to = groundSpot(v);
    go(v, [stay(600, 600, { start: w => { burst(w, "fx-flash"); flag("tp-out", true)(w); } }),
      { ...to, secs: 0 },
      stay(700, 700, { start: w => { flag("tp-out", false)(w); flag("tp-in", true)(w); burst(w, "fx-flash"); }, end: flag("tp-in", false) })], rest);
  }

  function run(v, rest) {
    const [lo, hi] = heightRange(v);
    let x;
    do { x = rand(8, 86); } while (Math.abs(x - v.x) < 35);
    go(v, [{ x, y: rand(lo, hi), speed: 11, start: flag("is-running", true), end: flag("is-running", false) }], rest);
  }

  let bait = null;
  function eatBait(v, rest) {
    const [lo, hi] = heightRange(v);
    const spot = { x: rand(14, 80), y: rand(lo, hi) };
    const el = document.createElement("div");
    el.className = "bait";
    el.innerHTML = `<svg viewBox="0 0 60 30" aria-hidden="true"><ellipse cx="30" cy="24" rx="26" ry="6" fill="#7a5a2c"/><circle cx="20" cy="18" r="7" fill="#c0392b"/><circle cx="32" cy="15" r="8" fill="#8e44ad"/><circle cx="42" cy="19" r="6" fill="#e67e22"/><circle cx="27" cy="11" r="5" fill="#d35400"/></svg>`;
    stage.appendChild(el);
    place(el, spot.x, spot.y);
    bait = el;
    const d = spot.x > v.x ? 1 : -1;
    const gap = v.el.offsetWidth / 2 / stage.clientWidth * 100 * 0.7;
    v.cleanup = () => { el.remove(); if (bait === el) bait = null; };
    go(v, [{ x: spot.x - d * gap, y: spot.y + 0.3, end: w => { w.el.classList.toggle("is-flipped", d > 0); flag("is-eating", true)(w); } },
      stay(6000, 8000, { end: w => { flag("is-eating", false)(w); el.classList.add("is-gone"); setTimeout(w.cleanup, 800); w.cleanup = null; } })], rest);
  }

  function charge(v, rest) {
    const p = anyOf(spots(PYLONS, 1)), side = p.x < 50 ? 1 : -1;
    go(v, [{ x: p.x + side * rand(3, 6), y: p.y, end: flag("is-charged", true) }, stay(6000, 9000, { end: flag("is-charged", false) })], rest);
  }

  // Voltorb and Electrode roll instead of walking
  function roll(v, dx, seconds) {
    const body = v.el.querySelector(".mon__body");
    v.spin = (v.spin || 0) + dx * 14;
    body.style.transition = `rotate ${seconds}s linear`;
    body.style.rotate = `${v.spin}deg`;
  }

  function slide(v, rest) {
    const d = Math.random() < 0.5 ? -1 : 1;
    const x = Math.max(8, Math.min(86, v.x + d * rand(25, 40)));
    go(v, [{ x, y: v.y, speed: 12, ease: "cubic-bezier(.15, .7, .3, 1)",
      start: w => { w.el.style.setProperty("--lean", x > w.x ? 8 : -8); flag("is-sliding", true)(w); }, end: flag("is-sliding", false) }], rest);
  }

  function warmUp(v, rest) {
    const pools = POOLS.map(([x, y, r]) => ({ x, y, r, at: svgToStage(x, y, 2) })).filter(p => onScreen(p.at));
    const p = anyOf(pools), side = Math.random() < 0.5 ? -1 : 1;
    const spot = svgToStage(p.x + side * (p.r + 70), p.y, 2);
    go(v, [{ ...spot, end: w => { w.el.classList.toggle("is-flipped", side < 0); flag("is-warming", true)(w); } },
      stay(7000, 10000, { end: flag("is-warming", false) })], rest);
  }

  function dive(v, rest) {
    const to = groundSpot(v);
    go(v, [stay(1100, 1100, { keepSink: true, start: w => { burst(w, "fx-splash"); sinkTo(w, fillOf(w) + 0.15); } }),
      stay(400, 400, { keepSink: true, start: flag("is-under", true) }),
      { ...to, speed: 6, keepSink: true, noFlip: true },
      stay(1200, 1200, { keepSink: true, start: w => { flag("is-under", false)(w); burst(w, "fx-splash"); setSwim(w); } })], rest);
  }

  function flop(v, rest) {
    go(v, [stay(1300, 1300, { keepSink: true, start: w => { burst(w, "fx-splash"); flag("is-flopping", true)(w); },
      end: w => { flag("is-flopping", false)(w); burst(w, "fx-splash"); } })], rest);
  }

  const ACTIVITIES = {
    route: [
      { chance: 0.1, who: v => walker(v) && spots(GRASS, 2).length > 0, run: hideInGrass },
      { chance: 0.3, who: has(143), run: (v, rest) => go(v, [stay(14000, 22000, { start: flag("is-napping", true), end: flag("is-napping", false) })], rest) }
    ],
    forest: [
      { chance: 0.12, who: v => has(10, 13, 48)(v) && TREES.some(t => onScreen(svgToStage(t.x, t.base, 1))), run: climbTree },
      { chance: 0.12, who: v => has(10, 11, 13, 14)(v) && TREES.some(t => onScreen(svgToStage(t.x, t.base, 1))), run: hangFromTree }
    ],
    fossil: [{ chance: 0.15, who: has(27, 28, 50, 51), run: dig }],
    cave: [
      { chance: 0.15, who: v => has(35, 36)(v) && !!moonstone, run: dance },
      { chance: 0.15, who: has(41, 42), run: roost }
    ],
    haunted: [
      { chance: 0.12, who: v => has(92, 93, 94)(v) && spots(GRAVES, 1).length > 0, run: driftThroughGrave },
      { chance: 0.1, who: v => has(92, 93)(v) && spots(WINDOWS, 0).length > 0, run: visit(WINDOWS, 0) }
    ],
    // Saffron City: everyone here but Ditto can learn Teleport in Red and Blue
    space: [
      { chance: 0.1, who: v => v.id !== 132, run: teleport },
      { chance: 0.08, who: v => v.id !== 132 && spots(DOORS, 1).length > 0, run: visit(DOORS, 1) }
    ],
    safari: [
      { chance: 0.15, who: has(84, 85, 128), run: run },
      { chance: 0.08, who: v => walker(v) && !bait, run: eatBait }
    ],
    power: [{ chance: 0.12, who: v => ELECTRIC.has(v.id) && spots(PYLONS, 1).length > 0, run: charge }],
    snow: [
      { chance: 0.25, who: has(86, 87), run: slide },
      { chance: 0.1, who: walker, run: slide }
    ],
    volcano: [{ chance: 0.12, who: v => FIRE.has(v.id) && POOLS.some(([x, y]) => onScreen(svgToStage(x, y, 2))), run: warmUp }],
    sea: [
      { chance: 0.12, who: v => SWIMMERS.has(v.id), run: dive },
      { chance: 0.15, who: has(129), run: flop }
    ],
    victory: [
      { chance: 0.12, who: v => canPush(v), run: (v, rest) => push(v, rest) },
      { chance: 0.12, who: v => canClimb(v), run: (v, rest) => go(v, climbUp(v), rest) }
    ]
  };

  // The Moon Stone in Mt. Moon, where Clefairy come to dance
  let moonstone = null;
  function setMoonstone(key) {
    moonstone = null;
    const at = SCENES[key].moonstone;
    if (!at) return;
    const el = document.createElement("div");
    el.className = "moonstone";
    el.innerHTML = `<svg viewBox="0 0 60 50" aria-hidden="true"><ellipse cx="30" cy="44" rx="22" ry="5" fill="rgba(0,0,0,.3)"/><path d="M14 42 L20 16 L32 6 L44 18 L48 42 Z" fill="#c9c3e6"/><path d="M32 6 L44 18 L48 42 L34 42 Z" fill="#a69fcf"/><path d="M22 20 l4 -4 M38 22 l3 6" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/></svg>`;
    stage.appendChild(el);
    place(el, at[0], at[1]);
    moonstone = { el, x: at[0], y: at[1] };
  }

  // Stop every walker (and boulder) where it is right now
  function freezeAll() {
    for (const b of boulders) {
      const box = b.el.getBoundingClientRect(), area = stage.getBoundingClientRect();
      const svg = b.el.querySelector("svg"), turn = getComputedStyle(svg).transform;
      b.el.style.transition = svg.style.transition = "none";
      if (turn !== "none") { const [a, c] = turn.slice(7).split(",").map(Number); b.turn = Math.atan2(c, a) * 180 / Math.PI; }
      svg.style.transform = `rotate(${b.turn}deg)`;
      b.x = (box.left + box.width / 2 - area.left) / area.width * 100;
      place(b.el, b.x, b.y);
      b.pusher = null;
    }
    for (const v of visitors) {
      clearTimeout(v.timer);
      const box = v.el.getBoundingClientRect(), area = stage.getBoundingClientRect();
      v.el.style.transition = "none";
      v.x = (box.left + box.width / 2 - area.left) / area.width * 100;
      v.y = (area.bottom - box.bottom) / area.height * 100;
      place(v.el, v.x, v.y, v.far || 1);
    }
  }

  // ---------- Strength boulders (Victory Road) ----------
  // A Pokémon that can learn Strength sometimes walks up to a boulder and
  // pushes it a short way. Most of the time it just wanders like the others.
  const PUSH_SPEED = 1.6;   // slower than walking, boulders are heavy
  let boulders = [];

  function setBoulders(key) {
    boulders = (SCENES[key].boulders || []).map(([x, y]) => {
      const el = document.createElement("div");
      el.className = "boulder";
      el.innerHTML = `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="52" r="46" fill="#8d8a84"/><circle cx="37" cy="37" r="20" fill="#a8a59e"/><path d="M24 68 q26 14 52 -4 M62 20 l8 18 M70 50 l12 6" stroke="#6f6c66" stroke-width="4" fill="none" stroke-linecap="round"/></svg><span class="mon__shadow"></span>`;
      stage.appendChild(el);
      place(el, x, y);
      return { el, x, y, turn: 0, pusher: null };
    });
  }

  const canPush = v => STRENGTH.has(v.id) && v.zone !== "ledge" && boulders.some(b => !b.pusher);

  function push(v, resume) {
    const free = boulders.filter(b => !b.pusher);
    const b = free[Math.floor(Math.random() * free.length)];
    const dist = 8 + Math.random() * 8;
    const ways = [-1, 1].filter(d => b.x + d * dist >= 10 && b.x + d * dist <= 84);
    if (!ways.length) return resume();
    const d = ways[Math.floor(Math.random() * ways.length)];
    b.pusher = v;

    // 1. Walk up beside the boulder, on the side it will be pushed from
    const gap = (v.el.offsetWidth + b.el.offsetWidth) / 2 / stage.clientWidth * 100 * 0.85;
    const x = b.x - d * gap, y = b.y + 0.3;
    const walk = Math.hypot(x - v.x, (y - v.y) * 2) / WALK_SPEED;
    v.el.style.transition = `left ${walk}s linear, bottom ${walk}s linear, --s ${walk}s linear`;
    v.el.classList.toggle("is-flipped", x > v.x);
    place(v.el, x, y);
    v.x = x; v.y = y;

    // 2. Push: Pokémon and boulder slide together, the boulder rolling
    v.timer = setTimeout(() => {
      if (!running || paused || hushed || b.pusher !== v) { b.pusher = null; return; }
      const secs = dist / PUSH_SPEED;
      const svg = b.el.querySelector("svg");
      v.el.classList.toggle("is-flipped", d > 0);
      v.el.style.transition = b.el.style.transition = `left ${secs}s linear`;
      svg.style.transition = `transform ${secs}s linear`;
      b.turn += d * dist * 9;
      svg.style.transform = `rotate(${b.turn}deg)`;
      v.x += d * dist; b.x += d * dist;
      place(v.el, v.x, v.y);
      place(b.el, b.x, b.y);
      say(`${v.name} used Strength! The boulder moved.`);
      v.timer = setTimeout(() => { b.pusher = null; resume(); }, secs * 1000 + 600);
    }, walk * 1000 + 400);
  }

  function leave(v, fled) {
    clearTimeout(v.timer);
    if (v.cleanup) { v.cleanup(); v.cleanup = null; }
    clearTimeout(v.swimTimer);
    for (const b of boulders) if (b.pusher === v) b.pusher = null;
    visitors = visitors.filter(o => o !== v);
    v.el.style.transition = "";
    v.el.style.setProperty("--dir", v.x < 50 ? -1 : 1);
    v.el.classList.add(fled ? "is-fleeing" : "is-leaving");
    setTimeout(() => v.el.remove(), reduceMotion.matches ? 400 : 1100);
  }

  function record(p, shiny) {
    const entry = dex[p.id] || { seen: 0, shiny: false, first: new Date().toISOString() };
    entry.seen += 1;
    if (shiny) entry.shinySeen = shinyCount(entry) + 1;
    entry.shiny = entry.shiny || shiny;
    dex[p.id] = entry;
    save("qsz-dex", dex);
    updateCount();
  }

  function updateCount() {
    if (!habitat) return;
    const seen = habitat.pokemon.filter(p => dex[p.id]).length;
    $("#scene-count").textContent = `${seen} of ${habitat.pokemon.length} spotted`;
  }

  let sayTimer = 0;
  function say(text, big = false) {
    dialogBox.textContent = text;
    dialogBox.classList.toggle("is-big", big);
    dialogBox.classList.add("is-on");
    clearTimeout(sayTimer);
    sayTimer = setTimeout(() => dialogBox.classList.remove("is-on"), big ? 6000 : 4000);
  }

  // ---------- Pokédex ----------
  const dexDialog = $("#dex"), tabs = $("#dex-tabs"), grid = $("#dex-grid");
  let dexTab = "all", dexShiny = false;
  // Older saves only kept a yes or no for shiny
  const shinyCount = e => e.shinySeen ?? (e.shiny ? 1 : 0);
  const times = n => `${n} ${n === 1 ? "time" : "times"}`;

  function renderDex() {
    const all = Object.keys(byId).length;
    const entries = Object.keys(dex).filter(id => byId[id]).map(id => dex[id]);
    const seen = entries.length, shinies = entries.filter(e => shinyCount(e)).length;
    $("#dex-sub").textContent = dexShiny ? `${shinies} of ${all} shiny forms found` : `${seen} of ${all} spotted`;
    $("#dex").classList.toggle("is-shiny", dexShiny);
    tabs.innerHTML = [["all", "All"], ...HABITATS.map(h => [h.key, h.name])]
      .map(([k, n]) => `<button type="button" role="tab" aria-selected="${k === dexTab}" data-tab="${k}">${n}</button>`).join("");
    // The main view lists all 151 in Pokédex number order
    const list = dexTab === "all"
      ? HABITATS.flatMap(h => h.pokemon).sort((a, b) => a.id - b.id)
      : HABITATS.find(h => h.key === dexTab).pokemon;
    grid.innerHTML = list.map(p => {
      const e = dex[p.id];
      const num = `<span class="dex__num">#${String(p.id).padStart(4, "0")}</span>`;
      const rar = `<span class="dex__rar dex__rar--${p.rarity}">${p.rarity}</span>`;
      const art = dexShiny ? ART.shiny : ART.normal;
      const found = dexShiny ? e && shinyCount(e) : e;
      if (!found) {
        // In the shiny view, a Pokémon seen only in its normal form keeps its name
        const name = e ? p.name : "???";
        const note = dexShiny && e ? "<small>Shiny not found yet</small>" : "";
        return `<li class="dex__card is-unseen"><img src="${art(p.id)}" alt="" loading="lazy" draggable="false">${num}<b>${name}</b>${rar}${note}</li>`;
      }
      const star = shinyCount(e) ? ' <span class="dex__shiny" title="Shiny form found">✦</span>' : "";
      const count = dexShiny ? `Shiny seen ${times(shinyCount(e))}` : `Seen ${times(e.seen)}`;
      return `<li class="dex__card"><img src="${art(p.id)}" alt="${dexShiny ? "Shiny " : ""}${p.name}" loading="lazy" draggable="false">${num}<b>${p.name}${star}</b>${rar}<small>${count}</small></li>`;
    }).join("");
  }
  $("#dex-shiny").addEventListener("change", e => { dexShiny = e.target.checked; renderDex(); });
  tabs.addEventListener("click", e => {
    const t = e.target.closest("[data-tab]");
    if (t) { dexTab = t.dataset.tab; renderDex(); }
  });

  // ---------- Settings ----------
  const form = $("#settings-form");
  function fillForm() {
    form.loudMode.value = settings.loudMode;
    form.goal.value = settings.goal;
    form.sensitivity.value = settings.sensitivity;
    form.spawnMin.value = String(settings.spawnMin);
    form.shiny.checked = settings.shiny;
    form.showMeter.checked = settings.showMeter;
    form.practice.checked = settings.practice;
    $("#goal-out").textContent = settings.goal;
    $("#sens-out").textContent = settings.sensitivity;
  }
  form.addEventListener("input", () => {
    settings.loudMode = form.loudMode.value;
    settings.goal = Number(form.goal.value);
    settings.sensitivity = Number(form.sensitivity.value);
    const before = settings.spawnMin;
    settings.spawnMin = Number(form.spawnMin.value);
    if (settings.spawnMin !== before) nextMs = Math.min(nextMs, waitFor());
    settings.shiny = form.shiny.checked;
    settings.showMeter = form.showMeter.checked;
    settings.practice = form.practice.checked;
    save("qsz-settings", settings);
    fillForm();
    applySettings();
  });
  function applySettings() {
    $("#meter-goal").style.bottom = `${settings.goal}%`;
    meter.hidden = !settings.showMeter;
    $("#practice").hidden = !settings.practice;
    if (settings.loudMode === "flee" && hushed) setHush(false);
  }
  $("#reset-dex").addEventListener("click", () => {
    if (!confirm("Clear every Pokémon the class has spotted? This cannot be undone.")) return;
    dex = {};
    save("qsz-dex", dex);
    updateCount();
    renderHome();
  });

  // ---------- Dialog open and close ----------
  document.addEventListener("click", e => {
    const open = e.target.closest("[data-open]");
    if (open) {
      const d = $("#" + open.dataset.open);
      if (d.id === "dex") { dexTab = habitat && !scene.hidden ? habitat.key : "all"; renderDex(); }
      if (d.id === "settings") fillForm();
      d.showModal();
    }
    if (e.target.closest("[data-close]")) e.target.closest("dialog").close();
  });
  for (const d of document.querySelectorAll("dialog")) {
    d.addEventListener("click", e => { if (e.target === d) d.close(); });
  }

  document.addEventListener("keydown", e => {
    if (e.key === " " && running && !scene.hidden && !document.querySelector("dialog[open]") && e.target.tagName !== "INPUT") {
      e.preventDefault();
      $("#playpause").click();
    }
  });

  applySettings();
  renderHome();
})();
