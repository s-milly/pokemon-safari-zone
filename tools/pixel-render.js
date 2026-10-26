/*
  Step 1 of making the pixel backgrounds (step 2 is pixel-build.py).
  Draws every layer of every habitat in scenes.js at 480 by 270 pixels with
  hard edges, using a local copy of the game (python3 -m http.server 4642).
  Animated parts (clouds, stars, glows...) are drawn one at a time on their
  own, so they can keep moving in the game. Sign text is left out here and
  written back in a pixel font by step 2.

  Run from the project folder: node tools/pixel-render.js
  Needs Playwright with Chromium.
*/
const { chromium } = require("playwright");
const fs = require("fs");
const OUT = "tools/.pixel";
const W = 480, H = 270;
// Animated parts are drawn on a wider canvas, so ones that start off screen
// (bats, a shooting star) are kept: the drawing's -800..2400 by -900..1800
const BIG = { x: -800, y: -900, w: 3200, h: 2700 };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const game = await browser.newPage();
  await game.goto("http://localhost:4642/");
  const scenes = await game.evaluate(() => Object.fromEntries(HABITATS.map(h => [h.key, [...SCENES[h.key].layers, SCENES[h.key].front]])));
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  const manifest = {};
  for (const [key, layers] of Object.entries(scenes)) {
    manifest[key] = [];
    for (let i = 0; i < layers.length; i++) {
      const name = i === layers.length - 1 ? "front" : String(i);
      await page.setViewportSize({ width: W, height: H });
      await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${W}px;height:${H}px}
        *{shape-rendering:crispEdges;animation:none!important;transition:none!important}
        [data-fxi],text{visibility:hidden}</style>${layers[i]}`);
      // Mark each animated part (the outermost one, if they are nested) and note the signs
      const info = await page.evaluate(() => {
        const svg = document.querySelector("svg");
        const fx = [...svg.querySelectorAll("[class*='fx-']")].filter(el => !el.parentElement.closest("[class*='fx-']"));
        fx.forEach((el, n) => el.setAttribute("data-fxi", n));
        const texts = [...svg.querySelectorAll("text")].map(t => {
          const m = t.getScreenCTM(), p = svg.createSVGPoint();
          p.x = +t.getAttribute("x"); p.y = +t.getAttribute("y");
          const q = p.matrixTransform(m);
          return { text: t.textContent, x: q.x, y: q.y, anchor: t.getAttribute("text-anchor") || "start", fill: t.getAttribute("fill") || "#fff", size: +t.getAttribute("font-size") * m.a };
        });
        return { fx: fx.map(el => ({ cls: el.getAttribute("class"), style: el.getAttribute("style") || "", opacity: el.getAttribute("opacity") || "" })), texts };
      });
      await page.screenshot({ path: `${OUT}/${key}-${name}.png`, omitBackground: true });
      // Each animated part alone, at rest, at full opacity (the game fades it)
      await page.setViewportSize({ width: BIG.w * W / 1600, height: BIG.h * H / 900 });
      await page.evaluate(big => {
        const svg = document.querySelector("svg");
        svg.setAttribute("viewBox", `${big.x} ${big.y} ${big.w} ${big.h}`);
        svg.style.width = `${big.w * 480 / 1600}px`; svg.style.height = `${big.h * 270 / 900}px`;
      }, BIG);
      for (let n = 0; n < info.fx.length; n++) {
        await page.evaluate(n => {
          document.getElementById("only")?.remove();
          const st = document.createElement("style"); st.id = "only";
          st.textContent = `svg{visibility:hidden!important} [data-fxi="${n}"],[data-fxi="${n}"] *{visibility:visible!important} [data-fxi="${n}"]{opacity:1!important}`;
          document.head.appendChild(st);
        }, n);
        info.fx[n].file = `${key}-${name}-fx${n}.png`;
        await page.screenshot({ path: `${OUT}/${info.fx[n].file}`, omitBackground: true });
      }
      manifest[key].push({ name, ...info });
    }
    console.log(key, manifest[key].map(l => `${l.name}: ${l.fx.length} moving, ${l.texts.length} signs`).join("; "));
  }
  fs.writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 1));
  await browser.close();
})();
