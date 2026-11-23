// Renders the infographic posters in src/lib/posters.ts to images in public/images/posters/:
//   <file>.webp            1080 x 1350 (4:5), shown on the site and used for Facebook/Instagram
//   <file>-pinterest.jpg   1000 x 1500 (2:3), for Pinterest
// Run: npx tsx scripts/render-posters.ts   (needs Playwright with Chromium, and internet for Google Fonts)
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { POSTERS, type Poster } from "../src/lib/posters";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const OUT = new URL("../public/images/posters/", import.meta.url).pathname;
const only = process.argv.slice(2);

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const monogram = `<svg viewBox="0 0 120 120" class="mono"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#F9F295"/><stop offset="45%" stop-color="#D4AF37"/><stop offset="100%" stop-color="#B8860B"/></linearGradient></defs><circle cx="60" cy="60" r="57" fill="#0A0A0A"/><circle cx="60" cy="60" r="53" fill="none" stroke="url(#g)" stroke-width="1.6"/><text x="60" y="78" text-anchor="middle" font-size="58" font-weight="500" letter-spacing="-2" fill="url(#g)" font-family="Inter, system-ui, sans-serif">SR</text></svg>`;

function html(p: Poster, w: number, h: number) {
  const s = w / 1080; // scale
  const pin = h / w > 1.4;
  const rows = p.rows
    .map(
      (r) => `<div class="row">
        <div class="label">${esc(r.label)}</div>
        <div class="value"><span>${esc(r.value)}</span>${r.valueSub ? `<small>${esc(r.valueSub)}</small>` : ""}</div>
        <div class="note">${esc(r.note)}</div>
      </div>`,
    )
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Cormorant+Garamond:wght@500;600;700&family=Great+Vibes&display=block" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${w}px;height:${h}px}
body{font-family:Inter,sans-serif;background:#F9F8F6;color:#0A0A0A;display:flex;flex-direction:column;font-size:${22 * s}px}
.gold{background:linear-gradient(135deg,#F9F295 0%,#D4AF37 45%,#B8860B 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
header{background:#0A0A0A;color:#fff;padding:${36 * s}px ${64 * s}px ${pin ? 52 * s : 34 * s}px;position:relative}
header:after{content:"";position:absolute;left:0;right:0;bottom:0;height:${5 * s}px;background:linear-gradient(90deg,#B8860B,#F9F295 50%,#B8860B)}
.brand{display:flex;align-items:center;justify-content:space-between;margin-bottom:${pin ? 44 * s : 24 * s}px}
.brand .l{display:flex;align-items:center;gap:${16 * s}px}
.mono{width:${58 * s}px;height:${58 * s}px}
.word{font-family:"Cormorant Garamond",serif;font-weight:600;font-size:${26 * s}px;letter-spacing:.2em;text-transform:uppercase}
.eyebrow{font-size:${15 * s}px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:#D4AF37}
h1{text-wrap:balance;font-family:"Cormorant Garamond",serif;font-weight:600;font-size:${(p.title.length > 36 ? 56 : 68) * s}px;line-height:1.02;letter-spacing:-.005em;font-variant-numeric:lining-nums}
.big{font-family:"Cormorant Garamond",serif;font-weight:700;font-size:${(p.big && p.big.length > 14 ? 76 : 92) * s}px;line-height:1.05;margin-top:${8 * s}px;font-variant-numeric:lining-nums;padding-bottom:${4 * s}px}
.intro{margin-top:${14 * s}px;color:rgba(255,255,255,.72);font-size:${21 * s}px;line-height:1.4;max-width:${880 * s}px}
main{flex:1;display:flex;flex-direction:column;padding:${26 * s}px ${64 * s}px ${20 * s}px}
.thead,.row{display:grid;grid-template-columns:${300 * s}px ${232 * s}px 1fr;column-gap:${26 * s}px;align-items:center}
.thead{font-size:${13 * s}px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#8A6D0B;padding-bottom:${10 * s}px;border-bottom:${2 * s}px solid #0A0A0A}
.thead div:nth-child(2){text-align:right}
.rows{flex:1;display:flex;flex-direction:column;justify-content:space-evenly}
.row{padding:${pin ? 18 * s : 11 * s}px 0;border-bottom:1px solid #E5E1DA}
.label{font-weight:600;font-size:${23 * s}px;line-height:1.2}
.value{text-align:right;font-family:"Cormorant Garamond",serif;font-weight:700;font-size:${40 * s}px;line-height:1;font-variant-numeric:lining-nums tabular-nums}
.value small{display:block;font-family:Inter,sans-serif;font-weight:500;font-size:${14 * s}px;color:rgba(0,0,0,.5);margin-top:${6 * s}px;letter-spacing:0}
.note{font-size:${18 * s}px;line-height:1.35;color:rgba(0,0,0,.62);border-left:${3 * s}px solid #D4AF37;padding-left:${16 * s}px}
.total{margin-top:${18 * s}px;background:#0A0A0A;color:#fff;border-radius:${18 * s}px;padding:${20 * s}px ${30 * s}px;display:flex;align-items:center;justify-content:space-between}
.total .t{font-size:${15 * s}px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#D4AF37}
.total .v{font-family:"Cormorant Garamond",serif;font-weight:700;font-size:${46 * s}px;line-height:1;text-align:right;font-variant-numeric:lining-nums}
.total small{display:block;font-family:Inter,sans-serif;font-size:${16 * s}px;color:rgba(255,255,255,.65);font-weight:500;margin-top:${6 * s}px}
.points{margin-top:${20 * s}px;background:#fff;border:1px solid #E5E1DA;border-radius:${18 * s}px;padding:${20 * s}px ${28 * s}px}
.points h2{font-size:${13 * s}px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#8A6D0B;margin-bottom:${10 * s}px}
.points ul{list-style:none;display:grid;gap:${8 * s}px}
.points li{position:relative;padding-left:${26 * s}px;font-size:${19 * s}px;line-height:1.35}
.points li:before{content:"";position:absolute;left:0;top:${8 * s}px;width:${10 * s}px;height:${10 * s}px;background:#D4AF37;transform:rotate(45deg)}
footer{padding:${14 * s}px ${64 * s}px ${30 * s}px}
.src{font-size:${14 * s}px;color:rgba(0,0,0,.5);line-height:1.4}
.sig{display:flex;align-items:flex-end;justify-content:space-between;margin-top:${12 * s}px;padding-top:${14 * s}px;border-top:1px solid #E5E1DA}
.sig .name{font-family:"Great Vibes",cursive;font-size:${46 * s}px;line-height:1;color:#8A6D0B}
.sig .by{font-size:${14 * s}px;color:rgba(0,0,0,.55);margin-top:${4 * s}px}
.sig .url{font-family:"Cormorant Garamond",serif;font-weight:700;font-size:${30 * s}px;letter-spacing:.04em}
</style></head><body>
<header>
  <div class="brand"><div class="l">${monogram}<span class="word">Shane Ruddle</span></div><span class="eyebrow">${esc(p.eyebrow)}</span></div>
  <h1>${esc(p.title)}</h1>
  ${p.big ? `<div class="big gold">${esc(p.big)}</div>` : ""}
  <p class="intro">${esc(p.intro)}</p>
</header>
<main>
  <div class="thead"><div>${esc(p.columns[0])}</div><div>${esc(p.columns[1])}</div><div>${esc(p.columns[2])}</div></div>
  <div class="rows">${rows}</div>
  ${p.total ? `<div class="total"><span class="t">${esc(p.total.label)}</span><div class="v"><span class="gold">${esc(p.total.value)}</span>${p.total.sub ? `<small>${esc(p.total.sub)}</small>` : ""}</div></div>` : ""}
  ${p.points.length ? `<div class="points">${p.pointsTitle ? `<h2>${esc(p.pointsTitle)}</h2>` : ""}<ul>${p.points.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}
</main>
<footer>
  <p class="src">${esc(p.source)}</p>
  <div class="sig"><div><div class="name">Shane Ruddle</div><div class="by">Straight answers from 20 years in Pattaya</div></div><div class="url">shaneruddle.com</div></div>
</footer>
</body></html>`;
}

const browser = await chromium.launch();
mkdirSync(OUT, { recursive: true });
for (const p of Object.values(POSTERS)) {
  if (only.length && !only.includes(p.id)) continue;
  for (const [w, h, name, type] of [
    [1080, 1350, `${p.file}.webp`, "image/webp"],
    [1000, 1500, `${p.file}-pinterest.jpg`, "image/jpeg"],
  ] as const) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.setContent(html(p, w, h), { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const overflow = await page.evaluate(() => document.body.scrollHeight - window.innerHeight);
    if (overflow > 0) console.warn(`! ${name} overflows by ${overflow}px`);
    const png = await page.screenshot({ type: "png" });
    // Encode in the browser so we need no image library.
    const data: string = await page.evaluate(
      async ({ b64, type }) => {
        const img = new Image();
        img.src = `data:image/png;base64,${b64}`;
        await img.decode();
        const c = document.createElement("canvas");
        c.width = img.width;
        c.height = img.height;
        c.getContext("2d")!.drawImage(img, 0, 0);
        return c.toDataURL(type, 0.9).split(",")[1];
      },
      { b64: png.toString("base64"), type },
    );
    writeFileSync(OUT + name, Buffer.from(data, "base64"));
    console.log(`${name}  ${Math.round(Buffer.from(data, "base64").length / 1024)} KB`);
    await page.close();
  }
}
await browser.close();
