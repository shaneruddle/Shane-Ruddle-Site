// Copies the photo choices made in the portal Photos tab (Firestore settings/photo_slots, which is
// world-readable per firestore.rules) to src/generated/photo-slots.json before the site is built.
// If the fetch fails the build still succeeds and every spot keeps its default photo.
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve("src/generated/photo-slots.json");
const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || "shane-ruddle-site";
const API_KEY = process.env.VITE_FIREBASE_API_KEY;
const SITE_URL = "https://shaneruddle.com";

// Firestore REST values -> plain JSON.
function plain(v) {
  if (!v || typeof v !== "object") return null;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("timestampValue" in v) return v.timestampValue;
  if ("nullValue" in v) return null;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(plain);
  if ("mapValue" in v) return fields(v.mapValue.fields || {});
  return null;
}
const fields = (f) => Object.fromEntries(Object.entries(f).map(([k, v]) => [k, plain(v)]));

let data = { slots: {}, inline: {} };
if (!API_KEY) {
  console.warn("photo-slots: VITE_FIREBASE_API_KEY not set — using default photos.");
} else {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/settings/photo_slots?key=${API_KEY}`;
    const res = await fetch(url, { headers: { Referer: `${SITE_URL}/` } });
    if (res.status === 404) {
      console.log("photo-slots: no photo choices saved yet — using default photos.");
    } else if (!res.ok) {
      throw new Error(`Firestore REST ${res.status}: ${(await res.text()).slice(0, 200)}`);
    } else {
      const doc = fields((await res.json()).fields || {});
      data = { slots: doc.slots || {}, inline: doc.inline || {} };
      const inlineCount = Object.values(data.inline).reduce((n, l) => n + (Array.isArray(l) ? l.length : 0), 0);
      console.log(`photo-slots: ${Object.keys(data.slots).length} spot(s), ${inlineCount} in-article photo(s).`);
    }
  } catch (err) {
    console.warn("photo-slots: could not fetch photo choices —", err.message);
  }
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(data, null, 2));
