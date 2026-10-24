/*
  Quiet Safari Zone: the game loop.
  The microphone level is measured every frame. While it stays under the goal,
  quiet time builds up, and each time it reaches the setting a wild Pokémon
  appears. Over the goal for a moment, the Pokémon flee (or the scene pauses).
*/
(function () {
  const $ = sel => document.querySelector(sel);
  const RARITY_WEIGHT = { common: 70, uncommon: 25, rare: 5 };
  const SHINY_ODDS = 40;
  const maxOnScreen = () => (innerWidth < 760 ? 4 : 6);
  const LOUD_MS = 600;     // how long the room must stay over the goal to count as loud
  const CALM_MS = 1200;    // how long it must be quiet again before the scene resumes
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

  // ---------- Saved settings and Pokédex (per browser) ----------
  const DEFAULTS = { loudMode: "flee", goal: 45, sensitivity: 5, spawnSeconds: 20, shiny: true, showMeter: true, practice: false };
  function load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage blocked: keep going in memory */ }
  }
  const settings = { ...DEFAULTS, ...load("qsz-settings", {}) };
  let dex = load("qsz-dex", {});

  const byId = {};
  for (const h of HABITATS) for (const p of h.pokemon) byId[p.id] = { ...p, habitat: h.key };

  // ---------- Home ----------
  const habitatList = $("#habitats");
  function renderHome() {
    habitatList.innerHTML = HABITATS.map(h => {
      const seen = h.pokemon.filter(p => dex[p.id]).length;
      return `<li><button class="habitat" type="button" data-habitat="${h.key}" style="--tint:${SCENES[h.key].tint}">
        <span class="habitat__art">${SCENES[h.key].back.replace(/(id="|url\(#)(\w+)/g, "$1$2-thumb")}</span>
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
  let quietMs = 0, loudMs = 0, calmMs = 0, lastFrame = 0, visitors = [];

  function openScene(key) {
    habitat = HABITATS.find(h => h.key === key);
    $("#scene-back").innerHTML = SCENES[key].back;
    $("#scene-front").innerHTML = SCENES[key].front;
    $("#scene-title").textContent = habitat.name;
    $("#start-title").textContent = habitat.name;
    $("#start-error").hidden = true;
    $("#start").hidden = false;
    stage.innerHTML = "";
    visitors = [];
    quietMs = loudMs = calmMs = 0;
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

      if (hushed) {
        if (calmMs > CALM_MS) { setHush(false); say("It is quiet again. The Pokémon are coming back out."); }
      } else if (scared) {
        // After a flee, wait for quiet before warning again, so the message stays readable
        if (calmMs > CALM_MS) scared = false;
      } else if (loudMs > LOUD_MS) {
        tooLoud();
      } else if (!over) {
        quietMs += dt;
        if (quietMs >= settings.spawnSeconds * 1000) { quietMs = 0; spawn(); }
      }
    }
    ring.style.strokeDashoffset = 100 - Math.min(100, quietMs / (settings.spawnSeconds * 10));
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
    hushed = on;
    $("#hush").hidden = !on;
    scene.classList.toggle("is-hushed", on);
  }

  // ---------- Pokémon ----------
  function pick() {
    // Skip Pokémon already on screen so the scene does not show two of the same
    const showing = new Set(visitors.map(v => v.id));
    const pool = habitat.pokemon.filter(p => !showing.has(p.id));
    const total = pool.reduce((s, p) => s + RARITY_WEIGHT[p.rarity], 0);
    let r = Math.random() * total;
    for (const p of pool) { r -= RARITY_WEIGHT[p.rarity]; if (r <= 0) return p; }
    return pool[0];
  }

  function placeFor() {
    const [lo, hi] = SCENES[habitat.key].ground;
    const flyMax = SCENES[habitat.key].fly ? hi + 40 * SCENES[habitat.key].fly : hi;
    let best = null, bestGap = -1;
    for (let i = 0; i < 24; i++) {
      const x = 10 + Math.random() * 76;
      const y = lo + Math.random() * (flyMax - lo);
      const gap = Math.min(999, ...visitors.map(v => Math.hypot(v.x - x, (v.y - y) * 1.6)));
      if (gap > bestGap) { best = { x, y }; bestGap = gap; }
      if (gap > 22) break;
    }
    return best;
  }

  function spawn() {
    if (visitors.length >= maxOnScreen()) leave(visitors[0], false);
    const p = pick(), key = habitat.key;
    const shiny = settings.shiny && Math.random() < 1 / SHINY_ODDS;
    const { x, y } = placeFor();
    const el = document.createElement("div");
    el.className = `mon mon--${p.rarity}${shiny ? " mon--shiny" : ""}`;
    // Further back (higher up) looks smaller
    const scale = 1.15 - (y / 100) * 0.9;
    el.style.cssText = `left:${x}%;bottom:${y}%;--s:${scale.toFixed(2)};z-index:${100 - Math.round(y)}`;
    el.innerHTML = `<img alt="${shiny ? "Shiny " : ""}${p.name}" src="${(shiny ? ART.shiny : ART.normal)(p.id)}" draggable="false"><span class="mon__shadow"></span>`;
    const visitor = { ...p, shiny, el, x, y };
    const img = el.querySelector("img");
    img.addEventListener("load", () => {
      // The room got loud (or the class left) while the picture was loading
      if (scared || hushed || !running || habitat.key !== key) return;
      stage.appendChild(el);
      requestAnimationFrame(() => el.classList.add("is-in"));
      visitors.push(visitor);
      wander(visitor);
      record(p, shiny);
      const tag = p.rarity === "rare" ? " A rare find!" : "";
      say(shiny ? `Whoa! A shiny ${p.name} appeared!` : `A wild ${p.name} appeared!${tag}`, p.rarity === "rare" || shiny);
    }, { once: true });
    img.addEventListener("error", () => { quietMs = settings.spawnSeconds * 1000 * 0.75; }, { once: true });
  }

  function wander(v) {
    v.timer = setTimeout(function step() {
      if (!v.el.isConnected) return;
      if (running && !paused && !hushed && !reduceMotion.matches) {
        const dx = (Math.random() - 0.5) * 10;
        v.x = Math.max(8, Math.min(86, v.x + dx));
        v.el.style.left = `${v.x}%`;
        v.el.classList.toggle("is-flipped", dx > 0);
        v.el.classList.remove("is-hop"); void v.el.offsetWidth; v.el.classList.add("is-hop");
      }
      v.timer = setTimeout(step, 3500 + Math.random() * 5000);
    }, 2500 + Math.random() * 3000);
  }

  function leave(v, fled) {
    clearTimeout(v.timer);
    visitors = visitors.filter(o => o !== v);
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
    const list = dexTab === "all" ? HABITATS.flatMap(h => h.pokemon) : HABITATS.find(h => h.key === dexTab).pokemon;
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
    form.spawnSeconds.value = String(settings.spawnSeconds);
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
    settings.spawnSeconds = Number(form.spawnSeconds.value);
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
