import type { Express } from "express";
import crypto from "crypto";
import { FieldValue, type Firestore } from "firebase-admin/firestore";

// Shane's private Circle (portal tab, Firestore circle_people + circle_events, Shane-only rules).
// Claude researches long-standing Pattaya business owners and regular expat events, then loads them here.
// Callers send the INSIGHTS_TOKEN secret as a Bearer token. Suggestions are upserted by a stable id, and
// only the research fields are written, so Shane's own status, notes and reminders are never overwritten.

type Deps = { getDb: () => Firestore; oneLine: (value: unknown, max?: number) => string };

const idFor = (...parts: string[]) =>
  crypto.createHash("sha256").update(parts.map(p => p.trim().toLowerCase()).join("|")).digest("hex").slice(0, 24);

export function registerCircleRoutes(app: Express, { getDb, oneLine }: Deps) {
  const authorised = (header: string) => {
    const given = header.replace(/^Bearer\s+/i, "");
    const expected = process.env.INSIGHTS_TOKEN || "";
    return expected.length > 0 && given.length === expected.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  };

  app.post("/api/circle/import", async (req, res) => {
    if (!authorised(String(req.headers.authorization || ""))) return res.status(401).json({ error: "Unauthorised" });
    const people = Array.isArray(req.body?.people) ? req.body.people.slice(0, 50) : [];
    const events = Array.isArray(req.body?.events) ? req.body.events.slice(0, 50) : [];
    try {
      const db = getDb();
      const batch = db.batch();
      let added = 0;
      let updated = 0;

      for (const p of people) {
        const name = oneLine(p?.name, 100);
        const business = oneLine(p?.business, 150);
        if (!name || !business) continue;
        const ref = db.collection("circle_people").doc(`s_${idFor(name, business)}`);
        const existing = await ref.get();
        const research = {
          name,
          business,
          role: oneLine(p?.role, 100),
          sinceYear: Number(p?.sinceYear) || null,
          whyMeet: oneLine(p?.whyMeet, 400),
          wayIn: oneLine(p?.wayIn, 400),
          whereSeen: oneLine(p?.whereSeen, 200),
          sourceUrl: oneLine(p?.sourceUrl, 500),
          sourceLabel: oneLine(p?.sourceLabel, 120),
          source: "suggested",
          updatedAt: FieldValue.serverTimestamp(),
        };
        if (existing.exists) {
          batch.set(ref, research, { merge: true });
          updated++;
        } else {
          batch.set(ref, { ...research, status: "suggested", notes: "", createdAt: FieldValue.serverTimestamp() });
          added++;
        }
      }

      for (const e of events) {
        const title = oneLine(e?.title, 150);
        if (!title) continue;
        const ref = db.collection("circle_events").doc(`e_${idFor(title, oneLine(e?.when, 100))}`);
        batch.set(ref, {
          title,
          when: oneLine(e?.when, 100),
          where: oneLine(e?.where, 200),
          crowd: oneLine(e?.crowd, 300),
          tip: oneLine(e?.tip, 300),
          url: oneLine(e?.url, 500),
          key: oneLine(e?.key, 40),
          checkedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
      }

      await batch.commit();
      res.json({ added, updated, events: events.length });
    } catch (error) {
      console.error("Circle import failed:", error instanceof Error ? error.message : error);
      res.status(500).json({ error: "Import failed." });
    }
  });
}
