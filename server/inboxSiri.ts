import express, { type Express } from "express";
import crypto from "crypto";
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { requireOwner, sortItem } from "./inbox";
import { searchText, type Item } from "./inboxShared";

// "Hey Siri, Shane reminder": an Apple Shortcut on Shane's iPhone / Watch asks what to remember and posts it here.
//   POST /api/inbox/siri?key=…  { text }  Saves it like a capture-bar entry (Today list, Claude sorts it), replies "Done".
//   POST /api/inbox/siri/key    (Shane signed in) returns the key, making one the first time; { reset: true } makes a new one.
// The key lives in the server-only inbox_server/siri doc. It only lets the Shortcut add items, nothing else.

type Deps = { getDb: () => Firestore };

const SORT_WAIT_MS = 8_000;

export function registerInboxSiriRoutes(app: Express, { getDb }: Deps) {
  const keyRef = () => getDb().collection("inbox_server").doc("siri");
  let cached: { key: string; at: number } | null = null;

  const currentKey = async () => {
    if (cached && Date.now() - cached.at < 60_000) return cached.key;
    const key = String((await keyRef().get()).get("key") || "");
    cached = { key, at: Date.now() };
    return key;
  };

  const sameKey = (given: string, expected: string) =>
    !!expected && given.length === expected.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));

  app.post("/api/inbox/siri/key", async (req, res) => {
    if (!(await requireOwner(req, res, getDb))) return;
    try {
      let key = req.body?.reset ? "" : String((await keyRef().get()).get("key") || "");
      if (!key) {
        key = crypto.randomBytes(24).toString("base64url");
        await keyRef().set({ key, createdAt: FieldValue.serverTimestamp() });
      }
      cached = { key, at: Date.now() };
      res.json({ key, url: `https://shaneruddle.com/api/inbox/siri?key=${key}` });
    } catch (error) {
      console.error("Siri key failed:", error instanceof Error ? error.message : error);
      res.status(500).json({ error: "Couldn't load the Siri key." });
    }
  });

  // Shortcuts may send JSON or plain text; Siri hears the plain-text reply if it reads one out.
  app.post("/api/inbox/siri", express.text({ type: "text/*" }), async (req, res) => {
    res.type("text/plain");
    const given = String(req.query.key || req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    try {
      if (!sameKey(given, await currentKey())) return res.status(401).send("Siri isn't connected. Copy the link again from Reminders settings.");
    } catch {
      return res.status(500).send("Couldn't save it. Try again.");
    }
    const body = req.body;
    const raw = String((typeof body === "string" ? body : body?.text) ?? "").trim().slice(0, 5000);
    if (!raw) return res.status(400).send("I didn't catch anything to save.");
    try {
      const db = getDb();
      const ref = db.collection("inbox_items").doc();
      // Same as a capture-bar entry: lands on the Today list and Claude sorts it.
      const item: Partial<Item> = { title: raw.slice(0, 200), raw, kind: "task", status: "inbox", body: raw.length > 200 ? raw : "", onToday: true, todayRank: Date.now() };
      const batch = db.batch();
      batch.set(ref, {
        ...item, search: searchText(item), alertAt: null, ai: { state: "pending" }, version: 1,
        createdBy: "Siri", updatedBy: "Siri", createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
      });
      batch.set(db.collection("inbox_history").doc(), { itemId: ref.id, by: "Siri", action: "captured", changes: { raw }, at: FieldValue.serverTimestamp() });
      await batch.commit();
      // Sort before replying so a timed reminder gets its alert; if Claude is slow the app finishes it on next open.
      await Promise.race([sortItem(db, ref.id).catch(() => {}), new Promise(r => setTimeout(r, SORT_WAIT_MS))]);
      res.send("Done");
    } catch (error) {
      console.error("Siri capture failed:", error instanceof Error ? error.message : error);
      res.status(500).send("Couldn't save it. Try again.");
    }
  });
}
