import type { Express } from "express";
import crypto from "crypto";
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import type { Repeat, RepeatFreq } from "./reminderDates";

// Shane's private Reminders (portal tab, Firestore reminders + reminder_lists, Shane-only rules).
// POST /api/reminders/import: one-off import from Apple Reminders, read on Shane's Mac and sent by Claude.
// Callers send the INSIGHTS_TOKEN secret as a Bearer token. Reminders are upserted by their Apple id and
// lists matched by name, so running the import twice never makes duplicates.

type Deps = { getDb: () => Firestore; oneLine: (value: unknown, max?: number) => string };

const COLORS = ["#2563EB", "#D4AF37", "#16A34A", "#DC2626", "#EA580C", "#9333EA", "#DB2777", "#0891B2", "#57534E"];
const FREQS: RepeatFreq[] = ["daily", "weekdays", "weekly", "monthly", "yearly"];
const isDate = (v: unknown) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isTime = (v: unknown) => typeof v === "string" && /^\d{2}:\d{2}$/.test(v);
const idFor = (value: string) => crypto.createHash("sha256").update(value).digest("hex").slice(0, 24);

export function registerReminderRoutes(app: Express, { getDb, oneLine }: Deps) {
  const authorised = (header: string) => {
    const given = header.replace(/^Bearer\s+/i, "");
    const expected = process.env.INSIGHTS_TOKEN || "";
    return expected.length > 0 && given.length === expected.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  };

  app.post("/api/reminders/import", async (req, res) => {
    if (!authorised(String(req.headers.authorization || ""))) return res.status(401).json({ error: "Unauthorised" });
    const items = Array.isArray(req.body?.reminders) ? req.body.reminders.slice(0, 2000) : [];
    try {
      const db = getDb();
      const listSnap = await db.collection("reminder_lists").get();
      const listIds = new Map(listSnap.docs.map(d => [String(d.get("name") || "").toLowerCase(), d.id]));
      let order = listSnap.size;
      const listFor = async (name: string) => {
        const key = name.toLowerCase();
        if (listIds.has(key)) return listIds.get(key)!;
        const ref = await db.collection("reminder_lists").add({ name, color: COLORS[order % COLORS.length], order: order++, createdAt: FieldValue.serverTimestamp() });
        listIds.set(key, ref.id);
        return ref.id;
      };

      let added = 0;
      let updated = 0;
      for (let i = 0; i < items.length; i += 400) {
        const batch = db.batch();
        for (const r of items.slice(i, i + 400)) {
          const title = oneLine(r?.title, 300);
          const appleId = oneLine(r?.appleId, 200);
          if (!title || !appleId) continue;
          const listId = await listFor(oneLine(r?.list, 80) || "Reminders");
          const freq = FREQS.includes(r?.repeat?.freq) ? (r.repeat.freq as RepeatFreq) : null;
          const repeat: Repeat | null = freq ? { freq, interval: Math.max(1, Math.round(Number(r.repeat.interval) || 1)) } : null;
          const ref = db.collection("reminders").doc(`a_${idFor(appleId)}`);
          const existing = await ref.get();
          batch.set(ref, {
            title,
            notes: String(r?.notes ?? "").trim().slice(0, 4000),
            listId,
            dueDate: isDate(r?.dueDate) ? r.dueDate : null,
            dueTime: isDate(r?.dueDate) && isTime(r?.dueTime) ? r.dueTime : null,
            repeat,
            flagged: !!r?.flagged,
            done: !!r?.done,
            appleId,
            source: "apple",
            updatedAt: FieldValue.serverTimestamp(),
            ...(existing.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
          }, { merge: true });
          existing.exists ? updated++ : added++;
        }
        await batch.commit();
      }
      res.json({ added, updated, lists: listIds.size });
    } catch (error) {
      console.error("Reminders import failed:", error instanceof Error ? error.message : error);
      res.status(500).json({ error: "Import failed." });
    }
  });
}
