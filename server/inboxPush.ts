import type { Express, Request, Response } from "express";
import crypto from "crypto";
import webpush from "web-push";
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { bkkToday, bkkNowTime } from "./reminderDates";
import { requireOwner } from "./inbox";
import { briefingFor, inQuietHours, NOTIFY_DEFAULTS, type NotifySettings } from "./inboxShared";
import type { Item } from "./inboxShared";

// Push notifications for Shane's Inbox: reminders at their time and a morning briefing.
//
//   GET  /api/inbox/push/key          public VAPID key for the app
//   POST /api/inbox/push/subscribe    save this phone's push subscription (Shane's ID token)
//   POST /api/inbox/push/unsubscribe
//   POST /api/inbox/push/test         send a test notification to every saved phone
//   POST /api/inbox/tick              run by the scheduler every few minutes (deploy service account, or INSIGHTS_TOKEN)
//
// No duplicates: each reminder is claimed in a transaction (alertSentFor = the alertAt it was sent for) before
// sending, and the briefing is claimed per day in inbox_server/state. Changing a reminder's time gives it a new
// alertAt, so it alerts again; completing a repeating task moves its date, so the next one alerts too.
// Quiet hours hold anything that wasn't given an exact time, and the briefing, until they end.
// Keys and subscriptions live in server-only collections (inbox_server, inbox_push_subs) with no client rules.

type Deps = { getDb: () => Firestore };

const TICK_AUDIENCE = "shane-ruddle-inbox";
const TICK_ACCOUNT = "github-deploy@shane-ruddle-site.iam.gserviceaccount.com";
const CATCH_UP = 12 * 60 * 60 * 1000; // alerts missed by up to 12 hours (e.g. held by quiet hours) still go out
const BUNDLE_OVER = 3; // more than this at once becomes one summary notification

type Payload = { title: string; body: string; url: string; tag: string };

export function registerInboxPushRoutes(app: Express, { getDb }: Deps) {
  let vapid: { publicKey: string; privateKey: string } | null = null;
  const keys = async () => {
    if (vapid) return vapid;
    const db = getDb();
    const ref = db.collection("inbox_server").doc("vapid");
    vapid = await db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (snap.exists) return snap.data() as { publicKey: string; privateKey: string };
      const fresh = webpush.generateVAPIDKeys();
      tx.set(ref, { ...fresh, createdAt: FieldValue.serverTimestamp() });
      return fresh;
    });
    webpush.setVapidDetails("mailto:shaneruddle@gmail.com", vapid.publicKey, vapid.privateKey);
    return vapid;
  };

  const subId = (endpoint: string) => crypto.createHash("sha256").update(endpoint).digest("hex").slice(0, 40);

  // Sends to every saved phone. Drops subscriptions the push service says are gone.
  const sendAll = async (db: Firestore, payload: Payload) => {
    await keys();
    const subs = await db.collection("inbox_push_subs").get();
    let sent = 0;
    await Promise.all(subs.docs.map(async d => {
      try {
        await webpush.sendNotification(d.get("subscription"), JSON.stringify(payload), { TTL: 6 * 60 * 60, urgency: "high" });
        sent++;
        d.ref.update({ lastSentAt: FieldValue.serverTimestamp() }).catch(() => {});
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) await d.ref.delete().catch(() => {});
        else console.error("Inbox push failed:", status, (error as Error).message);
      }
    }));
    return { sent, phones: subs.size };
  };

  app.get("/api/inbox/push/key", async (_req, res) => {
    try { res.set("Cache-Control", "no-store").json({ publicKey: (await keys()).publicKey }); }
    catch (error) { console.error("Inbox push key failed:", error); res.status(500).json({ error: "Push isn't available." }); }
  });

  app.post("/api/inbox/push/subscribe", async (req, res) => {
    if (!(await requireOwner(req, res, getDb))) return;
    const sub = req.body?.subscription;
    if (!sub?.endpoint || !/^https:\/\//.test(sub.endpoint) || !sub.keys?.p256dh || !sub.keys?.auth) return res.status(400).json({ error: "Bad subscription" });
    await getDb().collection("inbox_push_subs").doc(subId(sub.endpoint)).set({
      subscription: { endpoint: String(sub.endpoint), keys: { p256dh: String(sub.keys.p256dh), auth: String(sub.keys.auth) } },
      device: String(req.body?.device || "").slice(0, 120), createdAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    res.json({ ok: true });
  });

  app.post("/api/inbox/push/unsubscribe", async (req, res) => {
    if (!(await requireOwner(req, res, getDb))) return;
    const endpoint = String(req.body?.endpoint || "");
    if (endpoint) await getDb().collection("inbox_push_subs").doc(subId(endpoint)).delete();
    res.json({ ok: true });
  });

  app.post("/api/inbox/push/test", async (req, res) => {
    if (!(await requireOwner(req, res, getDb))) return;
    const result = await sendAll(getDb(), { title: "Inbox", body: "Notifications are working.", url: "/inbox", tag: "test" });
    res.json(result);
  });

  // ---- the scheduler's job ----
  const tickAuthorised = async (header: string) => {
    const token = header.replace(/^Bearer\s+/i, "");
    if (!token) return false;
    const expected = process.env.INSIGHTS_TOKEN || "";
    if (expected && token.length === expected.length && crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))) return true;
    try {
      const r = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`);
      if (!r.ok) return false;
      const info = (await r.json()) as { email?: string; email_verified?: string | boolean; aud?: string };
      return info.aud === TICK_AUDIENCE && info.email === TICK_ACCOUNT && String(info.email_verified) === "true";
    } catch {
      return false;
    }
  };

  app.post("/api/inbox/tick", async (req: Request, res: Response) => {
    if (!(await tickAuthorised(String(req.headers.authorization || "")))) return res.status(401).json({ error: "Unauthorised" });
    const dry = req.query.dry === "1";
    try {
      res.json(await tick(getDb(), sendAll, dry));
    } catch (error) {
      console.error("Inbox tick failed:", error instanceof Error ? error.message : error);
      res.status(500).json({ error: "Tick failed" });
    }
  });
}

export async function tick(db: Firestore, send: (db: Firestore, p: Payload) => Promise<{ sent: number; phones: number }>, dry = false, now = Date.now()) {
  const settingsSnap = await db.collection("inbox_settings").doc("profile").get();
  const notify: NotifySettings = { ...NOTIFY_DEFAULTS, ...(settingsSnap.get("notify") || {}) };
  const nowDate = new Date(now);
  const today = bkkToday(nowDate);
  const time = bkkNowTime(nowDate);
  const quiet = inQuietHours(time, notify);
  const report = { at: `${today} ${time}`, quiet, due: 0, sent: 0, held: 0, briefing: "" as string, phones: 0 };
  if (!notify.enabled) return { ...report, briefing: "notifications off" };

  // Reminders whose moment has come and haven't been sent for this moment yet.
  const snap = await db.collection("inbox_items").where("alertAt", "<=", now).where("alertAt", ">=", now - CATCH_UP).get();
  const due = snap.docs
    .map(d => ({ id: d.id, ...(d.data() as Omit<Item, "id">) }) as Item & { alertSentFor?: number })
    .filter(i => i.status !== "done" && i.status !== "archived" && i.alertSentFor !== i.alertAt);
  report.due = due.length;
  // An exact time Shane chose goes out even in quiet hours; date-only reminders (9am) and catch-ups wait.
  const ready = due.filter(i => !quiet || !!(i.remindDate ? i.remindTime : i.dueTime));
  report.held = due.length - ready.length;

  const claimed: Item[] = [];
  if (!dry) {
    for (const i of ready) {
      const ref = db.collection("inbox_items").doc(i.id);
      const ok = await db.runTransaction(async tx => {
        const cur = await tx.get(ref);
        if (!cur.exists || cur.get("alertAt") !== i.alertAt || cur.get("alertSentFor") === i.alertAt) return false;
        tx.update(ref, { alertSentFor: i.alertAt });
        return true;
      });
      if (ok) claimed.push(i);
    }
  }
  const toSend = dry ? ready : claimed;
  if (toSend.length > BUNDLE_OVER) {
    const r = await (dry ? Promise.resolve({ sent: 0, phones: 0 }) : send(db, {
      title: `${toSend.length} reminders`, body: toSend.slice(0, 4).map(i => i.title).join(" · "), url: "/inbox?tab=today", tag: `bundle-${now}`,
    }));
    report.sent += r.sent; report.phones = r.phones;
  } else {
    for (const i of toSend) {
      const r = await (dry ? Promise.resolve({ sent: 0, phones: 0 }) : send(db, {
        title: i.title.slice(0, 120), body: reminderBody(i), url: `/inbox?item=${encodeURIComponent(i.id)}`, tag: `item-${i.id}`,
      }));
      report.sent += r.sent; report.phones = r.phones;
    }
  }

  // Morning briefing, once a day, from the briefing time on (not before quiet hours end).
  if (notify.briefing && time >= notify.briefingTime && !quiet) {
    const stateRef = db.collection("inbox_server").doc("state");
    const already = (await stateRef.get()).get("lastBriefing") === today;
    if (already) report.briefing = "already sent";
    else {
      const items = (await db.collection("inbox_items").get()).docs.map(d => ({ id: d.id, ...(d.data() as Omit<Item, "id">) }) as Item);
      const b = briefingFor(items, today);
      if (dry) report.briefing = b ? `would send: ${b.title} / ${b.body}` : "nothing to say";
      else {
        const claim = await db.runTransaction(async tx => {
          const s = await tx.get(stateRef);
          if (s.get("lastBriefing") === today) return false;
          tx.set(stateRef, { lastBriefing: today }, { merge: true });
          return true;
        });
        if (!claim) report.briefing = "already sent";
        else if (!b) report.briefing = "nothing to say";
        else {
          const r = await send(db, { title: b.title, body: b.body, url: "/inbox?tab=today", tag: `briefing-${today}` });
          report.sent += r.sent; report.phones = r.phones;
          report.briefing = "sent";
        }
      }
    }
  }
  return report;
}

const reminderBody = (i: Item) => {
  const parts: string[] = [];
  if (i.dueDate) parts.push(`Due ${i.dueTime ? i.dueTime : "today"}`);
  if (i.waitingOn) parts.push(`Waiting on ${i.waitingOn}`);
  if (i.place) parts.push(`${i.placeWhen === "leave" ? "Leaving" : "At"} ${i.place}`);
  if (i.body) parts.push(i.body.replace(/\s+/g, " ").slice(0, 100));
  return parts.join(" · ") || "Reminder";
};
