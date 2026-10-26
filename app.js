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
  const DEFAULTS = { loudMode: "flee", goal: 45, sensitivity: 5, spawnMin: 60, shiny: true, showMeter: true, practice: false, bgStyle: "pixel" };
  function load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage blocked: keep going in memory */ }
  }
  const settings = { ...DEFAULTS, ...load("qsz-settings", {}) };
  delete settings.spawnSeconds; // replaced by spawnMin
  // The pixel backgrounds came with the Black and White sprites: everyone starts on them once
  if (!settings.pixelSeen) { settings.bgStyle = "pixel"; settings.pixelSeen = true; save("qsz-settings", settings); }
  let dex = load("qsz-dex", {});

  // The drawings for a habitat in the chosen style. Where things stand (ground,
  // water, ledge, boulders) is the same in both, so that always comes from SCENES.
  const look = key => settings.bgStyle === "pixel" ? { tint: SCENES[key].tint, ...SCENES_PIXEL[key] }
    : (settings.bgStyle === "classic" ? SCENES_CLASSIC : SCENES)[key];

  const byId = {};
  for (const h of HABITATS) for (const p of h.pokemon) byId[p.id] = { ...p, habitat: h.key };

  // ---------- Home ----------
  const habitatList = $("#habitats");
  function renderHome() {
    habitatList.innerHTML = HABITATS.map(h => {
      const seen = h.pokemon.filter(p => dex[p.id]).length;
      return `<li><button class="habitat" type="button" data-habitat="${h.key}" style="--tint:${look(h.key).tint}">
        <span class="habitat__art">${look(h.key).thumb.replace(/(id="|url\(#)(\w+)/g, "$1$2-thumb")}</span>
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
  let session = null;

  // Quiet time needed for the next Pokémon: somewhere between the setting and twice it
  const waitFor = () => (settings.spawnMin + Math.random() * settings.spawnMin) * 1000;

  function openScene(key) {
    habitat = HABITATS.find(h => h.key === key);
    drawScene(key);
    $("#scene-title").textContent = habitat.name;
    $("#start-title").textContent = habitat.name;
    $("#start-error").hidden = true;
    $("#start").hidden = false;
    stage.innerHTML = "";
    clearWeather(true);
    visitors = [];
    setBoulders(key);
    setMoonstone(key);
    bait = null;
    quietMs = loudMs = calmMs = 0;
    nextMs = waitFor();
    running = false; paused = false; scared = false; setHush(false);
    // Ending a session pauses the scene, so clear that before a fresh start
    scene.classList.remove("is-paused");
    $("#playpause").textContent = "Pause";
    session = null;
    updateCount();
    $("#home").hidden = true;
    scene.hidden = false;
    applySettings();
    $("#start-btn").focus();
  }

  // Size of one sprite pixel on screen. The pixel backgrounds are 480 by 270
  // pixels, stretched to cover the screen; sprites use the same pixel size, but
  // on a narrow phone they are kept smaller so a few fit side by side.
  function setPixelSize() {
    const w = scene.clientWidth || innerWidth, h = scene.clientHeight || innerHeight;
    const px = Math.min(Math.max(w / 480, h / 270), w / 240);
    scene.style.setProperty("--px", px.toFixed(3));
  }
  addEventListener("resize", setPixelSize);

  function drawScene(key) {
    setPixelSize();
    $("#scene-back").innerHTML = look(key).layers.map((svg, i) => `<div class="layer layer--${i}">${svg}</div>`).join("");
    $("#scene-front").innerHTML = look(key).front;
    scene.classList.toggle("is-classic", settings.bgStyle === "classic");
    scene.classList.toggle("is-pixel", settings.bgStyle === "pixel");
  }

  function closeScene() {
    running = false;
    clearWeather(true);
    scene.hidden = true;
    $("#home").hidden = false;
    stopMic();
    renderHome();
  }
  // Leaving after a session shows its summary first
  $("#back-home").addEventListener("click", () => session ? endSession() : closeScene());

  $("#start-btn").addEventListener("click", async () => {
    const ok = settings.practice || await startMic();
    if (!ok) return;
    $("#start").hidden = true;
    running = true; paused = false;
    session = newSession();
    $("#playpause").textContent = "Pause";
    say(`Welcome to the ${habitat.name}. Stay quiet and the Pokémon will come out.`);
    lastFrame = performance.now();
  });

  function setPaused(on) {
    paused = on;
    $("#playpause").textContent = paused ? "Resume" : "Pause";
    scene.classList.toggle("is-paused", paused);
    paused ? freezeAll() : visitors.forEach(v => wander(v, 600));
    lastFrame = performance.now();
  }
  $("#playpause").addEventListener("click", () => {
    if (!running) return;
    setPaused(!paused);
    say(paused ? "Paused." : "Back to watching.");
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
      if (session) track(dt, lvl, over);
    }
    ring.style.strokeDashoffset = 100 - Math.min(100, quietMs / nextMs * 100);
    if (!scene.hidden) layerByDepth();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(t => { lastFrame = t; frame(t); });

  // Whoever is closer to the front of the scene (lower on screen) is drawn on
  // top. This uses where each one is right now, mid-walk, not where it is
  // heading, so two Pokémon crossing paths overlap the right way round.
  function layerByDepth() {
    const height = stage.clientHeight || 1;
    for (const el of stage.children) {
      const bottom = parseFloat(getComputedStyle(el).bottom) || 0;
      el.style.zIndex = 10000 - Math.round(bottom / height * 9000);
    }
  }

  function tooLoud() {
    loudMs = 0; calmMs = 0;
    if (session) { session.loud.push(session.activeMs); session.streak = 0; }
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
    const gait = HOPPERS.has(p.id) ? " gait-hop" : SLITHERERS.has(p.id) ? " gait-slither" : "";
    el.className = `mon mon--${p.rarity}${shiny ? " mon--shiny" : ""}${floats ? " mon--float" : ""}${gait}`;
    // Flyers hover a little above their shadow, everyone else stands on it
    const pad = floats ? -0.12 : 0;
    // Small Pokémon take quick steps, big ones slow, heavy steps
    const step = SLOW.has(p.id) ? 1.1 : Math.max(0.36, Math.min(0.8, 0.3 + p.height * 0.012));
    // Ground Pokémon cast their shadow right under where their feet touch
    const foot = !floats && ART_FOOT[p.id];
    // Sprites are drawn at their own pixel size (--gw), so bigger Pokémon are bigger
    el.style.cssText = `--gw:${ART_SIZE[p.id][0]};--pad:${pad};--step:${step.toFixed(2)}s` + (foot ? `;--fl:${foot[0]};--fr:${foot[1]}` : "");
    place(el, x, y);
    // The body holds the picture so swimmers can be cut off at the waterline
    el.innerHTML = `<span class="mon__body"><img alt="${shiny ? "Shiny " : ""}${p.name}" src="${(shiny ? ART.shiny : ART.normal)(p.id)}" draggable="false"></span><span class="mon__shadow"></span><span class="mon__fx"></span>`;
    const visitor = { ...p, shiny, el, x, y };
    const img = el.querySelector("img");
    // A legendary brings its own weather first and appears at its peak
    const legend = LEGENDS[p.id];
    const revealAt = legend ? performance.now() + bringWeather(legend, x, y) : 0;
    img.addEventListener("load", () => setTimeout(() => {
      // The room got loud (or the class left) while the picture was loading
      if (scared || hushed || !running || habitat.key !== key) { if (legend) clearWeather(); return; }
      stage.appendChild(el);
      requestAnimationFrame(() => el.classList.add("is-in"));
      visitors.push(visitor);
      setSwim(visitor);
      wander(visitor);
      record(p, shiny);
      const tag = p.rarity === "rare" ? " A rare find!" : "";
      const name = shiny ? `shiny ${p.name}` : p.name;
      if (legend) {
        el.classList.add("aura", `aura--${legend.kind}`);
        setTimeout(() => el.classList.remove("aura"), 6000);
        say(`The ${legend.title || "legendary"} ${name} appeared!`, true);
      } else {
        say(shiny ? `Whoa! A shiny ${p.name} appeared!` : `A wild ${p.name} appeared!${tag}`, p.rarity === "rare" || shiny);
      }
      if (p.id === 52 && Math.random() < (BUSY ? 1 : ROCKET_ODDS)) setTimeout(teamRocket, 3500);
    }, Math.max(0, revealAt - performance.now())), { once: true });
    img.addEventListener("error", () => { quietMs = nextMs * 0.75; if (legend) clearWeather(); }, { once: true });
  }

  // Turn to face the way it is going. Every sprite faces left (or straight
  // out), so it is mirrored to go right.
  function face(v, goingRight) {
    v.el.classList.toggle("is-flipped", goingRight);
    v.right = goingRight;
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
      if (!running || paused || hushed || reduceMotion.matches || v.asleep) return;
      // Slowpoke and Slowbro take long rests and often do not bother moving at all
      const slow = SLOW.has(v.id);
      const rest = () => { v.timer = setTimeout(step, slow ? 6000 + Math.random() * 8000 : 2000 + Math.random() * 5000); };
      if (slow && !(v.path && v.path.length) && Math.random() < 0.55) return rest();
      // Finish a route that a pause cut short
      if (v.path && v.path.length) return follow(v, rest);
      if (v.zone === "ledge") {
        v.path = Math.random() < 0.35 ? climbDown(v) : [ledgeSpot(v)];
        return follow(v, rest);
      }
      if (canFidget(v) && Math.random() < 0.25) return fidget(v, rest);
      const options = (ACTIVITIES[habitat.key] || []).slice().sort(() => Math.random() - 0.5);
      for (const act of options) {
        if (Math.random() < (BUSY ? 0.6 : act.chance) && act.who(v)) return act.run(v, rest);
      }
      v.path = [groundSpot(v)];
      follow(v, rest);
    }, delay);
  }

  // A small, quick fidget while standing: a glance the other way, or a hop
  const canFidget = v => !FLOATERS.has(v.id) && !ROLLERS.has(v.id) && !SLOW.has(v.id) && !v.el.classList.contains("is-swimming");
  function fidget(v, rest) {
    // Slitherers never hop; they only glance
    if (Math.random() < 0.5 || SLITHERERS.has(v.id)) {
      v.el.classList.toggle("is-flipped");
      v.timer = setTimeout(() => { v.el.classList.toggle("is-flipped"); rest(); }, 700 + Math.random() * 900);
    } else {
      v.el.classList.add("fidget-hop");
      v.timer = setTimeout(() => { v.el.classList.remove("fidget-hop"); rest(); }, 600);
    }
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
  //   roll     degrees to spin the body on the way (Rollout)
  // The first stop is only dropped once reached, so a pause can pick it up again.
  function follow(v, done) {
    const w = v.path[0];
    if (!w) { v.path = null; return done(); }
    const x = w.x ?? v.x, y = w.y ?? v.y;
    const dist = Math.hypot(x - v.x, (y - v.y) * 2);
    const pace = w.speed || WALK_SPEED * (SLOW.has(v.id) ? 0.35 : 1);
    const seconds = w.secs ?? (dist > 0.01 ? Math.max(0.3, dist / pace) : 0);
    if (w.start) w.start(v);
    if (dist > 0.01) {
      const ease = w.ease || "linear";
      v.el.style.transition = `left ${seconds}s ${ease}, bottom ${seconds}s ${ease}, --s ${seconds}s ${ease}`;
      if (!w.noFlip && Math.abs(x - v.x) > 0.5) face(v, x > v.x);
      if (ROLLERS.has(v.id)) roll(v, x - v.x, seconds);
      if (w.roll) roll(v, 0, seconds, w.roll, ease);
      // A small step bounce while walking (Voltorb and Electrode roll instead)
      if (seconds > 0.05 && !ROLLERS.has(v.id) && !w.roll) {
        v.el.classList.add("is-moving");
        clearTimeout(v.moveTimer);
        v.moveTimer = setTimeout(() => v.el.classList.remove("is-moving"), seconds * 1000);
      }
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
      const sink = share;
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
  // Sprites are cropped close around the body, so the body fills the picture
  const fillOf = () => 1;
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
  const PADS = [[420, 770], [1180, 790]]; // the glowing circles on the Power Plant ground
  const POOLS = [[350, 760, 110], [1250, 790, 140]];
  const ELECTRIC = new Set([25, 26, 81, 82, 100, 101, 125, 135, 145]);
  const FIRE = new Set([4, 5, 6, 37, 38, 58, 59, 77, 78, 126, 136, 146]);
  const ROLLERS = new Set([100, 101]);
  const SLOW = new Set([79, 80]); // Slowpoke and Slowbro
  const GHOSTS = new Set([92, 93, 94]);
  // Where the top of the head is, as a share of the picture from the left
  // and from the bottom (for balancing a beach ball)
  const HEAD_TOP = { 86: [0.4, 0.42], 87: [0.35, 0.77] };

  // ---------- Pixel props ----------
  // Small drawings (boulders, the Moon Stone, bait, the beach ball, the grass a
  // Pokémon hides in...) are turned into pixel art to match the sprites: drawn
  // w by h pixels with hard edges, then shown with square pixels. The same
  // drawing at the same size is only made once.
  const pixelCache = new Map();
  function pixelArt(svg, w, h) {
    const key = `${w}x${h}${svg}`;
    if (!pixelCache.has(key)) pixelCache.set(key, new Promise(done => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        const g = c.getContext("2d");
        g.drawImage(img, 0, 0, w, h);
        const d = g.getImageData(0, 0, w, h);
        for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] < 110 ? 0 : 255;
        g.putImageData(d, 0, 0);
        done(c.toDataURL());
      };
      img.onerror = () => done(null);
      const sized = svg.replace(/^<svg /, `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" shape-rendering="crispEdges" `);
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(sized);
    }));
    return pixelCache.get(key);
  }
  // Swap the drawing inside an element for its pixel version, w pixels wide
  function pixelize(el, w, h) {
    const svg = el.querySelector("svg");
    if (!svg) return;
    const box = svg.viewBox.baseVal;
    h = h || Math.max(1, Math.round(w * box.height / box.width));
    pixelArt(svg.outerHTML, Math.max(1, Math.round(w)), h).then(url => {
      if (!url || !svg.isConnected) return;
      const img = new Image();
      img.src = url; img.className = "px"; img.alt = ""; img.draggable = false;
      img.style.cssText = svg.style.cssText;
      svg.replaceWith(img);
    });
  }
  const artOf = el => el.querySelector(".px, svg");

  // Route 1: the Pokémon steps a little way into a patch of tall grass, ducks
  // down a couple of times and pops back up to look around, then walks out.
  // The grass in front of it shakes whenever it moves, like in the games.
  const GRASS_ART = (() => {
    let seed = 7;
    const r = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const blade = (x, h, w, lean) => `<path d="M${(x - w).toFixed(1)} 100 Q${(x - w * 0.7 + lean * 0.3).toFixed(1)} ${(100 - h * 0.6).toFixed(1)} ${(x + lean).toFixed(1)} ${(100 - h).toFixed(1)} Q${(x + w * 0.7 + lean * 0.3).toFixed(1)} ${(100 - h * 0.6).toFixed(1)} ${(x + w).toFixed(1)} 100 Z"/>`;
    const row = (fill, edge, vein, n, tall) => {
      let blades = "", veins = "";
      for (let i = 0; i < n; i++) {
        const x = (i + 0.5) * 200 / n + (r() - 0.5) * 6, t = Math.abs(x - 100) / 100;
        // Taller in the middle, so the clump is a soft mound
        const h = tall * (0.62 + r() * 0.2) * (1 - t * t * 0.5), lean = (r() - 0.5) * 14 + (x - 100) * 0.06;
        blades += blade(x - 7, h * 0.78, 6, lean - 6) + blade(x + 7, h * 0.78, 6, lean + 6) + blade(x, h, 7.5, lean);
        veins += `<path d="M${x.toFixed(1)} 98 Q${(x + lean * 0.2).toFixed(1)} ${(100 - h * 0.5).toFixed(1)} ${(x + lean * 0.8).toFixed(1)} ${(100 - h * 0.86).toFixed(1)}"/>`;
      }
      return `<g class="grass__row"><g fill="${fill}" stroke="${edge}" stroke-width="3" stroke-linejoin="round">${blades}</g><g fill="${fill}">${blades}</g>` +
        `<g fill="none" stroke="${vein}" stroke-width="1.6" stroke-linecap="round" opacity=".75">${veins}</g></g>`;
    };
    const svg = rows => `<svg viewBox="0 0 200 100" preserveAspectRatio="none" aria-hidden="true">${rows}</svg>`;
    const leaf = `<i class="grass__leaf"></i><i class="grass__leaf"></i><i class="grass__leaf"></i>`;
    return {
      front: `<span class="grass grass--front">${svg(row("#4c9f47", "#22562a", "#86cf72", 8, 92) + row("#61b654", "#2a6430", "#9fe08a", 7, 70))}${leaf}</span>`
    };
  })();
  function enterGrass(v) {
    if (!v.el.querySelector(".grass")) {
      v.el.querySelector(".mon__body").insertAdjacentHTML("afterend", GRASS_ART.front);
      // In pixels, the grass is a little wider than the sprite and covers its lower part
      const [w, h] = ART_SIZE[v.id];
      pixelize(v.el.querySelector(".grass--front"), w * 1.36, Math.round(h * 0.4));
    }
    requestAnimationFrame(() => flag("is-in-grass", true)(v));
  }
  function leaveGrass(v) {
    flag("is-in-grass", false)(v);
    setTimeout(() => { if (!v.el.classList.contains("is-in-grass")) v.el.querySelectorAll(".grass").forEach(g => g.remove()); }, 700);
  }
  const rustle = v => burst(v, "is-rustling");

  function hideInGrass(v, rest) {
    const p = anyOf(spots(GRASS, 2));
    // How far down it sinks: a little way in, ducked down to its head, and back up to peek
    const IN = 0.2, DUCK = 0.36, PEEK = 0.12;
    const peeks = [];
    for (let i = 0; i < 2; i++) {
      peeks.push(stay(1000, 1500, { start: w => { rustle(w); sinkTo(w, DUCK); } }),
        stay(1400, 2000, { start: w => { rustle(w); sinkTo(w, PEEK); } }),
        ...(i === 0 ? [stay(900, 1300, { start: w => w.el.classList.toggle("is-flipped") })] : []));
    }
    go(v, [{ x: p.x + rand(-4, 4), y: p.y, end: w => { enterGrass(w); rustle(w); } },
      stay(1600, 2200, { start: w => sinkTo(w, IN) }),
      ...peeks, stay(900, 900, { start: w => { rustle(w); sinkTo(w, 0); }, end: leaveGrass })], rest);
  }

  // Jigglypuff sings, and every other Pokémon on screen falls asleep where it
  // is for a while. Flyers drift down to the ground to sleep.
  function sing(v, rest) {
    go(v, [stay(5200, 5200, {
      start: w => {
        flag("is-singing", true)(w);
        w.el.querySelector(".mon__fx").insertAdjacentHTML("beforeend", `<span class="notes">${"<i>\u266A</i><i>\u266B</i>".repeat(2)}</span>`);
        say(`${w.name} used Sing!`);
      },
      end: w => { flag("is-singing", false)(w); w.el.querySelector(".notes")?.remove(); lullaby(w); }
    }), stay(1500, 2500)], rest);
  }
  function lullaby(singer) {
    const sleepers = visitors.filter(o => o !== singer && !o.asleep && o.el.isConnected);
    if (!sleepers.length) return say(`But nobody was there to hear ${singer.name} sing.`);
    say(sleepers.length === 1 ? `The wild ${sleepers[0].name} fell asleep!` : "The wild Pokémon fell asleep!");
    for (const o of sleepers) fallAsleep(o, rand(14000, 20000));
  }
  function fallAsleep(v, ms) {
    stopHere(v);
    clearInterval(v.trail);
    v.asleep = true;
    flag("is-asleep", true)(v);
    const [lo, hi] = SCENES[habitat.key].ground;
    if (FLOATERS.has(v.id) && v.y > hi && !v.el.classList.contains("is-roosting")) {
      const y = rand(lo, hi);
      v.el.style.transition = "left 2.6s ease-in-out, bottom 2.6s ease-in-out, --s 2.6s ease-in-out";
      place(v.el, v.x, y);
      v.y = y; v.far = 1;
    }
    v.wake = setTimeout(() => {
      v.asleep = false;
      flag("is-asleep", false)(v);
      if (v.el.isConnected) wander(v, 500 + Math.random() * 1500);
    }, ms);
  }

  // Mt. Moon: Graveler and Golem curl up and roll off the way they are facing
  function rollout(v, rest) {
    let right = v.right ?? Math.random() < 0.5;
    if (Math.abs((right ? 86 : 8) - v.x) < 20) right = !right; // too close to the edge: roll back the other way
    const x = right ? rand(78, 86) : rand(8, 16), dist = Math.abs(x - v.x);
    // Whole turns, so it ends the right way up
    const around = v.el.offsetWidth * fillOf(v) * Math.PI / stage.clientWidth * 100;
    const turns = Math.max(1, Math.round(dist / around));
    v.el.style.setProperty("--ry", (1 - fillOf(v) / 2).toFixed(2));
    go(v, [stay(800, 800, { start: w => { face(w, right); flag("is-curling", true)(w); say(`${w.name} used Rollout!`); } }),
      { x, y: v.y, speed: 15, ease: "cubic-bezier(.45, 0, .55, 1)", noFlip: true, roll: (right ? 1 : -1) * turns * 360,
        start: w => { flag("is-rolling", true)(w); w.trail = puffs(w, "dust"); }, end: w => { flag("is-rolling", false)(w); clearInterval(w.trail); burst(w, "fx-thud"); } },
      stay(900, 900, { end: w => {
        const body = w.el.querySelector(".mon__body");
        body.style.transition = "none"; body.style.rotate = "0deg"; w.spin = 0;
        flag("is-curling", false)(w);
      } })], rest);
  }

  // Lavender Town: a ghost flickers in and out, and sometimes fades away
  // completely and shows up somewhere else
  function flickerGhost(v, rest) {
    const flick = (lo, hi) => stay(lo, hi, { start: flag("is-flickering", true), end: flag("is-flickering", false) });
    const vanish = Math.random() < 0.5 ? [stay(900, 900, { start: flag("is-vanished", true) }), { ...groundSpot(v), secs: 0 },
      stay(900, 900, { start: flag("is-vanished", false) }), flick(1200, 1600)] : [];
    go(v, [flick(2600, 3800), ...vanish], rest);
  }

  // Seafoam Islands: Seel and Dewgong bounce a beach ball on their heads
  const BALL = `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="#fff"/><path d="M50 4 Q22 30 26 92 A46 46 0 0 1 8 32 Z" fill="#e8463c"/><path d="M50 4 Q78 30 74 92 A46 46 0 0 0 92 32 Z" fill="#2f7fd8"/><path d="M50 4 Q46 50 50 96 Q38 96 26 92 Q22 30 50 4 Z" fill="#ffd43b"/><circle cx="50" cy="50" r="46" fill="none" stroke="#2a2a3a" stroke-width="4"/><ellipse cx="34" cy="26" rx="10" ry="6" fill="#fff" opacity=".6"/></svg>`;
  function beachBall(v, rest) {
    const [hx, hy] = HEAD_TOP[v.id];
    go(v, [stay(7000, 10000, { keepSink: true, start: w => {
      const ball = document.createElement("span");
      ball.className = "ball";
      ball.innerHTML = BALL;
      ball.style.setProperty("--hx", w.el.classList.contains("is-flipped") ? 1 - hx : hx);
      ball.style.setProperty("--hy", hy);
      w.el.querySelector(".mon__fx").appendChild(ball);
      pixelize(ball, Math.max(8, ART_SIZE[w.id][0] * 0.3));
      flag("is-juggling", true)(w);
      w.cleanup = () => ball.remove();
    }, end: w => {
      flag("is-juggling", false)(w);
      const ball = w.el.querySelector(".ball");
      ball?.classList.add("is-tossed");
      setTimeout(() => ball?.remove(), 900);
      w.cleanup = null;
    } })], rest);
  }

  // Puffs of dust (or embers, for a fire Pokémon) left behind while running
  function puffs(v, kind) {
    return setInterval(() => {
      if (!v.el.isConnected || paused || hushed) return;
      const box = getComputedStyle(v.el);
      const puff = document.createElement("div");
      puff.className = `puff puff--${kind}`;
      puff.style.left = `${parseFloat(box.left) / stage.clientWidth * 100}%`;
      puff.style.bottom = `${parseFloat(box.bottom) / stage.clientHeight * 100}%`;
      puff.style.width = `${v.el.offsetWidth * (kind === "ember" ? 0.32 : 0.4)}px`;
      stage.appendChild(puff);
      setTimeout(() => puff.remove(), 1200);
    }, kind === "ember" ? 90 : 130);
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
      { ...to, speed: 4, noFlip: true, start: dirtTrail(true), end: dirtTrail(false) },
      stay(1500, 1500, { start: w => { flag("is-under", false)(w); sinkTo(w, 0); }, end: flag("is-burrowing", false) })], rest);
  }

  // While a digger moves underground, it leaves small clumps of dirt behind
  // that fade away after a few seconds
  function dirtTrail(on) {
    return v => {
      clearInterval(v.trail);
      if (!on) return;
      v.trail = setInterval(() => {
        if (!v.el.isConnected || paused || hushed) return;
        const box = getComputedStyle(v.el);
        const clump = document.createElement("div");
        clump.className = "dirt";
        clump.style.left = `${parseFloat(box.left) / stage.clientWidth * 100}%`;
        clump.style.bottom = `${parseFloat(box.bottom) / stage.clientHeight * 100}%`;
        clump.style.width = `${v.el.offsetWidth * 0.45}px`;
        clump.innerHTML = `<svg viewBox="0 0 40 14" aria-hidden="true"><path d="M2 14 Q8 6 20 5 Q32 6 38 14 Z" fill="#8a6440"/><circle cx="10" cy="11" r="2" fill="#6b4a32"/><circle cx="27" cy="9" r="1.6" fill="#a98256"/></svg>`;
        stage.appendChild(clump);
        pixelize(clump, ART_SIZE[v.id][0] * 0.45);
        setTimeout(() => clump.remove(), 4200);
      }, 280);
    };
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

  // Sprint across the scene, kicking up dust (or leaving a trail of fire)
  const run = kind => (v, rest) => {
    const [lo, hi] = heightRange(v);
    let x;
    do { x = rand(8, 86); } while (Math.abs(x - v.x) < 35);
    go(v, [{ x, y: rand(lo, hi), speed: kind === "ember" ? 14 : 12, ease: "cubic-bezier(.3, 0, .7, 1)",
      start: w => { flag("is-running", true)(w); clearInterval(w.trail); w.trail = puffs(w, kind); },
      end: w => { flag("is-running", false)(w); clearInterval(w.trail); } }], rest);
  };

  let bait = null;
  function eatBait(v, rest) {
    const [lo, hi] = heightRange(v);
    const spot = { x: rand(14, 80), y: rand(lo, hi) };
    const el = document.createElement("div");
    el.className = "bait";
    el.innerHTML = `<svg viewBox="0 0 60 30" aria-hidden="true"><ellipse cx="30" cy="24" rx="26" ry="6" fill="#7a5a2c"/><circle cx="20" cy="18" r="7" fill="#c0392b"/><circle cx="32" cy="15" r="8" fill="#8e44ad"/><circle cx="42" cy="19" r="6" fill="#e67e22"/><circle cx="27" cy="11" r="5" fill="#d35400"/></svg>`;
    stage.appendChild(el);
    pixelize(el, 18);
    place(el, spot.x, spot.y);
    bait = el;
    const d = spot.x > v.x ? 1 : -1;
    const gap = v.el.offsetWidth / 2 / stage.clientWidth * 100 * 0.7;
    v.cleanup = () => { el.remove(); if (bait === el) bait = null; };
    go(v, [{ x: spot.x - d * gap, y: spot.y + 0.3, end: w => { face(w, d > 0); flag("is-eating", true)(w); } },
      stay(6000, 8000, { end: w => { flag("is-eating", false)(w); el.classList.add("is-gone"); setTimeout(w.cleanup, 800); w.cleanup = null; } })], rest);
  }

  function charge(v, rest) {
    const p = anyOf(spots(PADS, 2));
    go(v, [{ x: p.x + rand(-2, 2), y: p.y, end: flag("is-charged", true) }, stay(6000, 9000, { end: flag("is-charged", false) })], rest);
  }

  // Voltorb and Electrode roll instead of walking
  function roll(v, dx, seconds, turn = dx * 14, ease = "linear") {
    const body = v.el.querySelector(".mon__body");
    v.spin = (v.spin || 0) + turn;
    body.style.transition = `rotate ${seconds}s ${ease}`;
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
    go(v, [{ ...spot, end: w => { face(w, side < 0); flag("is-warming", true)(w); } },
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
      { chance: 0.12, who: v => walker(v) && spots(GRASS, 2).length > 0, run: hideInGrass },
      { chance: 0.3, who: has(143), run: (v, rest) => go(v, [stay(14000, 22000, { start: flag("is-napping", true), end: flag("is-napping", false) })], rest) },
      { chance: 0.15, who: v => v.id === 39 && visitors.some(o => o !== v && !o.asleep), run: sing }
    ],
    forest: [
      { chance: 0.12, who: v => has(10, 13, 48)(v) && TREES.some(t => onScreen(svgToStage(t.x, t.base, 1))), run: climbTree },
      { chance: 0.12, who: v => has(10, 11, 13, 14)(v) && TREES.some(t => onScreen(svgToStage(t.x, t.base, 1))), run: hangFromTree }
    ],
    fossil: [{ chance: 0.15, who: has(27, 28, 50, 51), run: dig }],
    cave: [
      { chance: 0.15, who: v => has(35, 36)(v) && !!moonstone, run: dance },
      { chance: 0.15, who: has(41, 42), run: roost },
      { chance: 0.15, who: has(75, 76), run: rollout }
    ],
    haunted: [
      { chance: 0.12, who: v => has(92, 93, 94)(v) && spots(GRAVES, 1).length > 0, run: driftThroughGrave },
      { chance: 0.1, who: v => has(92, 93)(v) && spots(WINDOWS, 0).length > 0, run: visit(WINDOWS, 0) },
      { chance: 0.2, who: v => GHOSTS.has(v.id), run: flickerGhost }
    ],
    // Saffron City: everyone here but Ditto can learn Teleport in Red and Blue
    space: [
      { chance: 0.1, who: v => v.id !== 132, run: teleport },
      { chance: 0.08, who: v => v.id !== 132 && spots(DOORS, 1).length > 0, run: visit(DOORS, 1) }
    ],
    safari: [
      { chance: 0.2, who: has(84, 85, 128), run: run("dust") },
      { chance: 0.08, who: v => walker(v) && !bait, run: eatBait }
    ],
    power: [{ chance: 0.12, who: v => ELECTRIC.has(v.id) && spots(PADS, 2).length > 0, run: charge }],
    snow: [
      { chance: 0.25, who: has(86, 87), run: slide },
      { chance: 0.15, who: v => has(86, 87)(v), run: beachBall },
      { chance: 0.1, who: v => walker(v) && !SLOW.has(v.id), run: slide }
    ],
    volcano: [
      { chance: 0.12, who: v => FIRE.has(v.id) && POOLS.some(([x, y]) => onScreen(svgToStage(x, y, 2))), run: warmUp },
      { chance: 0.18, who: has(59, 77, 78), run: run("ember") }
    ],
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
    pixelize(el, 20);
    place(el, at[0], at[1]);
    moonstone = { el, x: at[0], y: at[1] };
  }

  // Stop every walker (and boulder) where it is right now
  function freezeAll() {
    for (const b of boulders) {
      const box = b.el.getBoundingClientRect(), area = stage.getBoundingClientRect();
      const svg = artOf(b.el), turn = getComputedStyle(svg).transform;
      b.el.style.transition = svg.style.transition = "none";
      if (turn !== "none") { const [a, c] = turn.slice(7).split(",").map(Number); b.turn = Math.atan2(c, a) * 180 / Math.PI; }
      svg.style.transform = `rotate(${b.turn}deg)`;
      b.x = (box.left + box.width / 2 - area.left) / area.width * 100;
      place(b.el, b.x, b.y);
      b.pusher = null;
    }
    for (const v of visitors) stopHere(v);
  }
  // Stop one Pokémon where it is right now, mid-walk. Its route is kept, so it
  // can carry on later.
  function stopHere(v) {
    clearTimeout(v.timer);
    clearTimeout(v.moveTimer);
    v.el.classList.remove("is-moving");
    const box = v.el.getBoundingClientRect(), area = stage.getBoundingClientRect();
    v.el.style.transition = "none";
    v.x = (box.left + box.width / 2 - area.left) / area.width * 100;
    v.y = (area.bottom - box.bottom) / area.height * 100;
    place(v.el, v.x, v.y, v.far || 1);
  }

  // ---------- Legendary arrivals ----------
  // A legendary brings its own weather: a thunderstorm for Zapdos, a blizzard
  // for Articuno, a firestorm for Moltres, a wave of psychic power for Mewtwo
  // and a floating bubble for Mew. It appears at the peak (where the lightning
  // strikes, the bubble pops and so on), then the sky clears.
  const LEGENDS = {
    145: { kind: "storm", first: "Dark clouds are rolling in. Thunder rumbles in the distance..." },
    144: { kind: "blizzard", first: "An icy wind picks up. The snow is starting to swirl..." },
    146: { kind: "inferno", first: "The air is getting hotter and hotter..." },
    150: { kind: "psychic", first: "A strange, heavy power fills the air..." },
    151: { kind: "bubble", first: "A shimmering bubble is drifting closer...", title: "mythical" }
  };
  const WEATHER_MS = 3400;   // from the first sign to the moment it appears
  const RAYS = Array.from({ length: 8 }, (_, i) => `<i class="w-ray" style="--a:${i * 45}deg"></i>`).join("");
  const WEATHER_ART = {
    storm: `<i class="w-tint"></i><i class="w-rain w-rain--far"></i><i class="w-rain"></i><i class="w-flash"></i>
      <svg class="w-bolt" viewBox="0 0 100 400" preserveAspectRatio="none" aria-hidden="true"><path d="M62 0 L40 120 L60 128 L30 262 L54 270 L44 400" fill="none" stroke="#9fd2ff" stroke-width="16" stroke-linejoin="round" opacity=".55" vector-effect="non-scaling-stroke"/><path d="M62 0 L40 120 L60 128 L30 262 L54 270 L44 400" fill="none" stroke="#fffbe6" stroke-width="5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg><i class="w-burst"></i>`,
    blizzard: `<i class="w-tint"></i><i class="w-wind"></i><i class="w-snow w-snow--far"></i><i class="w-snow"></i><i class="w-burst"></i>${RAYS}`,
    inferno: `<i class="w-tint"></i><i class="w-embers w-embers--far"></i><i class="w-embers"></i><i class="w-pillar"></i><i class="w-burst"></i>`,
    psychic: `<i class="w-tint"></i><i class="w-ring"></i><i class="w-ring"></i><i class="w-ring"></i><i class="w-burst"></i>`,
    bubble: `<i class="w-tint"></i><i class="w-sparkle w-sparkle--far"></i><i class="w-sparkle"></i><i class="w-bubble"></i><i class="w-burst"></i>${RAYS}`
  };
  let weather = null;
  function bringWeather(legend, x, y) {
    clearWeather(true);
    const el = document.createElement("div");
    el.className = `weather weather--${legend.kind}`;
    el.setAttribute("aria-hidden", "true");
    el.style.setProperty("--x", `${x}%`);
    el.style.setProperty("--y", `${100 - y}%`);
    el.innerHTML = WEATHER_ART[legend.kind];
    scene.appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("is-on")));
    say(legend.first, true);
    weather = el;
    el.timer = setTimeout(() => {
      el.classList.add("is-peak");
      if (legend.kind === "psychic" || legend.kind === "storm") { scene.classList.add("is-quaking"); setTimeout(() => scene.classList.remove("is-quaking"), 700); }
      el.timer = setTimeout(() => clearWeather(), 3800);
    }, WEATHER_MS);
    return WEATHER_MS;
  }
  // The sky clears (or, leaving the scene, the weather is gone at once)
  function clearWeather(now = false) {
    const el = weather;
    if (!el) return;
    weather = null;
    clearTimeout(el.timer);
    el.classList.remove("is-on");
    setTimeout(() => el.remove(), now ? 0 : 1800);
  }

  // ---------- Team Rocket ----------
  // Now and then a wild Meowth brings Team Rocket along: their Meowth balloon
  // drifts over, they say their lines, and off they blast again.
  const ROCKET_ODDS = 0.2;
  const ROCKET_ART = `<svg viewBox="0 0 200 300" aria-hidden="true"><g stroke="#3a2a1e" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
    <path d="M74 176 L70 236 M126 176 L130 236 M92 182 L88 236 M108 182 L112 236" fill="none" stroke-width="2.5"/>
    <path d="M26 64 L22 4 L72 30 Z" fill="#f2dfae"/><path d="M174 64 L178 4 L128 30 Z" fill="#f2dfae"/>
    <path d="M33 50 L30 16 L58 32 Z" fill="#6b4630" stroke="none"/><path d="M167 50 L170 16 L142 32 Z" fill="#6b4630" stroke="none"/>
    <ellipse cx="100" cy="98" rx="84" ry="82" fill="#f2dfae"/>
    <path d="M30 140 Q100 196 170 140 Q160 176 100 182 Q40 176 30 140 Z" fill="#e3c98f" stroke="none"/>
    <ellipse cx="100" cy="46" rx="17" ry="20" fill="#f6c94a"/><ellipse cx="100" cy="46" rx="8" ry="10" fill="#fbe39a" stroke="none"/>
    <ellipse cx="68" cy="96" rx="15" ry="19" fill="#fff"/><ellipse cx="132" cy="96" rx="15" ry="19" fill="#fff"/>
    <ellipse cx="72" cy="100" rx="5" ry="12" fill="#2a2a2a" stroke="none"/><ellipse cx="128" cy="100" rx="5" ry="12" fill="#2a2a2a" stroke="none"/>
    <path d="M86 128 Q93 136 100 128 Q107 136 114 128" fill="none"/>
    <path d="M16 112 L52 120 M14 128 L52 128 M184 112 L148 120 M186 128 L148 128" fill="none" stroke-width="2.5"/>
    <path d="M74 214 Q66 194 84 190 Q100 192 94 214 Z" fill="#d6336c"/><path d="M78 196 Q50 200 44 226 Q62 210 80 208 Z" fill="#d6336c"/>
    <circle cx="84" cy="212" r="10" fill="#ffe0c4"/>
    <path d="M106 212 Q106 194 120 194 Q134 196 132 212 Q124 202 112 206 Z" fill="#8e7cc3"/>
    <circle cx="120" cy="214" r="10" fill="#ffe0c4"/>
    <path d="M72 226 L136 226 L134 230 L70 230 Z" fill="#f4f4f4"/>
    <path d="M64 228 L140 228 L132 278 L72 278 Z" fill="#a8743f"/>
    <path d="M68 244 L136 244 M70 260 L134 260" fill="none" stroke="#7a512a" stroke-width="2.5"/>
    <circle cx="102" cy="252" r="13" fill="#fff"/></g>
    <path d="M97 260 V244 H104 Q110 244 110 249.5 Q110 255 104 255 H99 M103 255 L109 260" fill="none" stroke="#d92d2d" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  function teamRocket() {
    if (!running || stage.querySelector(".rocket")) return;
    const key = habitat.key, el = document.createElement("div");
    el.className = "rocket";
    el.innerHTML = `<div class="rocket__ship">${ROCKET_ART}</div>`;
    pixelize(el, 60);
    const from = Math.random() < 0.5 ? -1 : 1, hover = rand(30, 70);
    el.style.left = `${50 + from * 80}%`;
    el.style.bottom = "56%";
    stage.appendChild(el);
    const gone = () => !el.isConnected || !running || habitat.key !== key;
    let blasted = false;
    const blastOff = quiet => {
      if (blasted || gone()) return;
      blasted = true;
      if (!quiet) say("Team Rocket is blasting off again!", true);
      el.classList.add("is-blasting");
      el.style.transition = "left 1.5s cubic-bezier(.5, 0, .9, .5), bottom 1.5s cubic-bezier(.5, 0, .9, .5), scale 1.5s ease-in";
      el.style.left = `${hover - from * 22}%`;
      el.style.bottom = "100%";
      el.style.scale = ".15";
      setTimeout(() => {
        const star = document.createElement("div");
        star.className = "rocket__star";
        star.style.left = `${hover - from * 22}%`;
        stage.appendChild(star);
        setTimeout(() => star.remove(), 1600);
        el.remove();
      }, 1450);
    };
    // Each line waits its turn, but a loud room sends them off early
    const lines = [[1800, "Prepare for trouble!"], [2800, "And make it double!"], [2800, "Meowth, that is right!"], [3200, null]];
    let at = 0;
    for (const [wait, line] of lines) {
      at += wait;
      setTimeout(() => {
        if (gone() || blasted) return;
        if (scared || !line) return blastOff(scared);
        say(line, true);
      }, at);
    }
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.transition = "left 5s cubic-bezier(.2, .6, .35, 1), bottom 5s ease-in-out";
      el.style.left = `${hover}%`;
      el.style.bottom = "50%";
    }));
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
      pixelize(el, 40);
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
    face(v, x > v.x);
    place(v.el, x, y);
    v.x = x; v.y = y;

    // 2. Push: Pokémon and boulder slide together, the boulder rolling
    v.timer = setTimeout(() => {
      if (!running || paused || hushed || b.pusher !== v) { b.pusher = null; return; }
      const secs = dist / PUSH_SPEED;
      const svg = artOf(b.el);
      face(v, d > 0);
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
    clearInterval(v.trail);
    if (v.cleanup) { v.cleanup(); v.cleanup = null; }
    clearTimeout(v.swimTimer);
    clearTimeout(v.wake);
    for (const b of boulders) if (b.pusher === v) b.pusher = null;
    visitors = visitors.filter(o => o !== v);
    v.el.style.transition = "";
    v.el.style.setProperty("--dir", v.x < 50 ? -1 : 1);
    v.el.classList.add(fled ? "is-fleeing" : "is-leaving");
    setTimeout(() => v.el.remove(), reduceMotion.matches ? 400 : 1100);
  }

  function record(p, shiny) {
    session?.mons.push({ id: p.id, shiny, isNew: !dex[p.id], newShiny: shiny && !(dex[p.id] && shinyCount(dex[p.id])), at: session.activeMs });
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

  // ---------- Session summary ----------
  // A session runs from Start until the class ends it. Paused time is left
  // out. The room's volume is kept once a second (the loudest moment in that
  // second) for the chart.
  const SAMPLE_MS = 1000;
  function newSession() {
    return { started: Date.now(), activeMs: 0, underMs: 0, streak: 0, longest: 0, loud: [], mons: [], points: [], bucket: 0, bucketMs: 0 };
  }
  function track(dt, lvl, over) {
    const s = session;
    s.activeMs += dt;
    if (!over) s.underMs += dt;
    // A quiet stretch is broken only by a "too loud" moment
    if (!hushed && !scared) { s.streak += dt; s.longest = Math.max(s.longest, s.streak); }
    s.bucket = Math.max(s.bucket, lvl);
    s.bucketMs += dt;
    if (s.bucketMs >= SAMPLE_MS) {
      s.points.push({ v: s.bucket, goal: settings.goal });
      s.bucket = 0; s.bucketMs -= SAMPLE_MS;
    }
  }

  const summaryDialog = $("#summary");
  let pausedBefore = false;
  function endSession() {
    if (!session) return closeScene();
    pausedBefore = paused;
    if (running && !paused) setPaused(true);
    renderSummary();
    summaryDialog.showModal();
    drawChart();
  }
  function keepWatching() {
    if (summaryDialog.open) summaryDialog.close();
    if (running && paused && !pausedBefore) setPaused(false);
  }
  $("#end-btn").addEventListener("click", () => { if (running) endSession(); });
  $("#summary-resume").addEventListener("click", keepWatching);
  $("#summary-done").addEventListener("click", () => {
    session = null;
    summaryDialog.close();
    closeScene();
  });
  // Closing it any other way (Esc or a click outside) goes back to the same session
  summaryDialog.addEventListener("close", () => { if (session) keepWatching(); });
  addEventListener("resize", () => { if (summaryDialog.open) drawChart(); });

  function duration(ms) {
    const total = Math.round(ms / 1000), m = Math.floor(total / 60), sec = total % 60;
    if (!m) return `${sec} sec`;
    if (m >= 60) return `${Math.floor(m / 60)} hr ${m % 60} min`;
    return sec && m < 10 ? `${m} min ${sec} sec` : `${m} min`;
  }
  const clock = sec => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;

  function renderSummary() {
    const s = session;
    const newOnes = s.mons.filter(m => m.isNew).length;
    const under = s.activeMs ? Math.round(s.underMs / s.activeMs * 100) : 0;
    $("#summary-sub").textContent = `${habitat.name} · started at ${new Date(s.started).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
    const stats = [
      ["Time watching", duration(s.activeMs)],
      ["Under the goal", `${under}%`],
      ["Longest quiet stretch", duration(s.longest)],
      ["Times it got too loud", s.loud.length],
      ["Pokémon appeared", s.mons.length],
      ["New in the Pokédex", newOnes],
    ];
    $("#summary-stats").innerHTML = stats.map(([label, value]) => `<li class="stat"><b>${value}</b><span>${label}</span></li>`).join("");

    // Each Pokémon once, in the order it first appeared
    const seen = new Map();
    for (const m of s.mons) {
      const g = seen.get(m.id) || { ...m, count: 0, shinyAny: false, newShinyAny: false };
      g.count += 1; g.shinyAny ||= m.shiny; g.newShinyAny ||= m.newShiny;
      seen.set(m.id, g);
    }
    $("#summary-mons").innerHTML = seen.size ? [...seen.values()].map(g => {
      const p = byId[g.id];
      const tags = (g.isNew ? '<span class="tag tag--new">New!</span>' : "") + (g.newShinyAny && !g.isNew ? '<span class="tag tag--shiny">New shiny!</span>' : "");
      const star = g.shinyAny ? ' <span class="dex__shiny" title="Shiny">✦</span>' : "";
      const count = g.count > 1 ? `<small>Seen ${times(g.count)}</small>` : "";
      return `<li class="caught__card"><img src="${(g.shinyAny ? ART.shiny : ART.normal)(g.id)}" alt="" loading="lazy" draggable="false"><b>${p.name}${star}</b>${tags}${count}</li>`;
    }).join("") : `<li class="caught__empty">No Pokémon came out this time. Stay quiet a little longer next time and they will.</li>`;

    // Table view: one row per minute
    const rows = [];
    for (let i = 0; i < s.points.length; i += 60) {
      const chunk = s.points.slice(i, i + 60);
      const from = i * SAMPLE_MS, to = (i + chunk.length) * SAMPLE_MS;
      const names = s.mons.filter(m => m.at >= from && m.at < to).map(m => byId[m.id].name);
      const loud = s.loud.filter(t => t >= from && t < to).length;
      rows.push(`<tr><td>${i / 60 + 1}</td><td>${Math.round(chunk.reduce((a, b) => a + b.v, 0) / chunk.length)}</td><td>${Math.round(Math.max(...chunk.map(c => c.v)))}</td><td>${loud || ""}</td><td>${names.join(", ")}</td></tr>`);
    }
    $("#summary-table").innerHTML = rows.length
      ? `<table><thead><tr><th>Minute</th><th>Average volume</th><th>Loudest</th><th>Too loud</th><th>Pokémon</th></tr></thead><tbody>${rows.join("")}</tbody></table>`
      : "<p>Not enough time yet to show the volume.</p>";
    $("#summary-note").textContent = s.points.length
      ? `Volume goes from 0 (silent) to 100, the same as the meter on screen. Paused time is left out.`
      : "";
  }

  // Area chart of the volume, red where it went over the goal, with each
  // Pokémon shown at the moment it appeared
  function drawChart() {
    const box = $("#summary-chart"), pts = session.points;
    if (pts.length < 2) { box.innerHTML = '<p class="chart__empty">Watch for at least a few seconds to see the volume here.</p>'; return; }
    const W = Math.max(280, box.clientWidth), H = W < 500 ? 180 : 220;
    const m = { l: 34, r: 12, t: 40, b: 26 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
    // Keep about one point for every 3 pixels, using the loudest moment in each
    const per = Math.max(1, Math.ceil(pts.length / (iw / 3)));
    const data = [];
    for (let i = 0; i < pts.length; i += per) {
      const chunk = pts.slice(i, i + per);
      data.push({ t: i + chunk.length / 2, v: Math.max(...chunk.map(c => c.v)), goal: chunk[chunk.length - 1].goal });
    }
    const span = pts.length;
    const x = t => m.l + t / span * iw, y = v => m.t + ih - v / 100 * ih;
    const line = data.map((d, i) => `${i ? "L" : "M"}${x(d.t).toFixed(1)},${y(d.v).toFixed(1)}`).join("");
    const area = `${line}L${x(data[data.length - 1].t).toFixed(1)},${y(0)}L${x(data[0].t).toFixed(1)},${y(0)}Z`;
    // The goal can change partway through, so it is drawn as steps
    let goalPath = "";
    data.forEach((d, i) => { goalPath += `${i ? "L" : "M"}${(i ? x(d.t) : m.l).toFixed(1)},${y(d.goal).toFixed(1)}`; if (i < data.length - 1 && data[i + 1].goal !== d.goal) goalPath += `L${x(data[i + 1].t).toFixed(1)},${y(d.goal).toFixed(1)}`; });
    goalPath += `L${(m.l + iw).toFixed(1)},${y(data[data.length - 1].goal).toFixed(1)}`;
    const overClip = `${goalPath}L${m.l + iw},${m.t - 2}L${m.l},${m.t - 2}Z`;
    const underClip = `${goalPath}L${m.l + iw},${y(0) + 2}L${m.l},${y(0) + 2}Z`;

    // Time labels: whole minutes, spaced so they never crowd
    const mins = span / 60, stepMin = [1, 2, 5, 10, 15, 30, 60].find(n => mins / n <= W / 90) || 60;
    let ticks = "";
    for (let mm = 0; mm * 60 <= span; mm += stepMin) ticks += `<text x="${x(mm * 60)}" y="${H - 6}" text-anchor="${mm ? "middle" : "start"}">${mm} min</text>`;
    if (mins < 1) ticks = `<text x="${m.l}" y="${H - 6}">0 sec</text><text x="${m.l + iw}" y="${H - 6}" text-anchor="end">${span} sec</text>`;

    const lastGoal = data[data.length - 1].goal;
    const loudMarks = session.loud.map(t => `<line class="chart__loud" x1="${x(t / SAMPLE_MS)}" x2="${x(t / SAMPLE_MS)}" y1="${m.t}" y2="${y(0)}"/>`).join("");
    const icon = W < 500 ? 26 : 32;
    // Skip an icon that would sit on top of the one before it (all are in the hover and the list)
    let lastX = -Infinity;
    const shown = session.mons.filter(mn => { const px = x(mn.at / SAMPLE_MS); if (px - lastX < icon * 0.8) return false; lastX = px; return true; });
    const mons = shown.map(mn => `<img class="chart__mon" src="${(mn.shiny ? ART.shiny : ART.normal)(mn.id)}" alt="" title="${byId[mn.id].name}" style="left:${x(mn.at / SAMPLE_MS)}px;top:${m.t - icon - 2}px;width:${icon}px" draggable="false">`).join("");

    box.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Volume over the session. The class was under the goal ${Math.round(session.underMs / session.activeMs * 100)}% of the time.">
      <defs>
        <clipPath id="clip-over"><path d="${overClip}"/></clipPath>
        <clipPath id="clip-under"><path d="${underClip}"/></clipPath>
      </defs>
      <g class="chart__grid">${[0, 50, 100].map(v => `<line x1="${m.l}" x2="${m.l + iw}" y1="${y(v)}" y2="${y(v)}"/><text x="${m.l - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join("")}</g>
      <g clip-path="url(#clip-under)"><path class="chart__area" d="${area}"/><path class="chart__line" d="${line}"/></g>
      <g clip-path="url(#clip-over)"><path class="chart__area chart__area--over" d="${area}"/><path class="chart__line chart__line--over" d="${line}"/></g>
      ${loudMarks}
      <path class="chart__goal" d="${goalPath}"/>
      <text class="chart__goal-label" x="${m.l + iw - 4}" y="${y(lastGoal) - 6}" text-anchor="end">Goal ${lastGoal}</text>
      <g class="chart__axis">${ticks}</g>
      <line class="chart__cross" id="chart-cross" x1="0" x2="0" y1="${m.t}" y2="${y(0)}" visibility="hidden"/>
      <circle class="chart__dot" id="chart-dot" r="5" visibility="hidden"/>
    </svg>${mons}<div class="chart__tip" id="chart-tip" hidden></div>`;

    // Hover or touch: show the time, volume and anything that happened then
    const svg = box.querySelector("svg"), cross = box.querySelector("#chart-cross"), dot = box.querySelector("#chart-dot"), tip = box.querySelector("#chart-tip");
    const show = e => {
      const r = svg.getBoundingClientRect();
      const px = Math.max(m.l, Math.min(m.l + iw, e.clientX - r.left));
      const sec = Math.round((px - m.l) / iw * span);
      const d = data.reduce((a, b) => Math.abs(b.t - sec) < Math.abs(a.t - sec) ? b : a);
      const near = per * 1.5 + 2;
      const events = [
        ...session.mons.filter(mn => Math.abs(mn.at / SAMPLE_MS - sec) <= near).map(mn => `${mn.shiny ? "Shiny " : ""}${byId[mn.id].name} appeared`),
        ...session.loud.filter(t => Math.abs(t / SAMPLE_MS - sec) <= near).map(() => "Too loud"),
      ];
      cross.setAttribute("x1", x(d.t)); cross.setAttribute("x2", x(d.t)); cross.setAttribute("visibility", "visible");
      dot.setAttribute("cx", x(d.t)); dot.setAttribute("cy", y(d.v)); dot.setAttribute("visibility", "visible");
      dot.classList.toggle("is-over", d.v > d.goal);
      tip.innerHTML = `<b>${clock(d.t)}</b> Volume ${Math.round(d.v)}${events.map(ev => `<br>${ev}`).join("")}`;
      tip.hidden = false;
      const left = Math.min(W - tip.offsetWidth - 4, Math.max(4, x(d.t) - tip.offsetWidth / 2));
      tip.style.left = `${left}px`;
      tip.style.top = `${Math.max(0, y(d.v) - tip.offsetHeight - 12)}px`;
    };
    const hide = () => { tip.hidden = true; cross.setAttribute("visibility", "hidden"); dot.setAttribute("visibility", "hidden"); };
    svg.addEventListener("pointermove", show);
    svg.addEventListener("pointerdown", show);
    svg.addEventListener("pointerleave", hide);
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
    form.bgStyle.value = settings.bgStyle;
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
    const style = settings.bgStyle;
    settings.bgStyle = form.bgStyle.value;
    save("qsz-settings", settings);
    if (settings.bgStyle !== style) { renderHome(); if (habitat && !scene.hidden) drawScene(habitat.key); }
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
