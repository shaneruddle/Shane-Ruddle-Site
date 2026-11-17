import type { Express, Request, Response } from "express";
import crypto from "crypto";
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Staff check: the cashier's staff list at each venue (/staff-check). Staff don't log in for discounts any
// more; the cashier opens the page, enters the one shared PIN and finds the person by name or photo.
// - POST /api/staff-check/list   (PIN) active staff: name, photo flag, company, position, last 3 digits of mobile
// - POST /api/staff-check/photo  (PIN) one person's photo
// - POST /api/staff-check/used   (PIN) cashier taps "Used": usage_logs entry + email to Shane
// - POST /api/staff-check/add    (PIN) cashier adds a new staff member: on the list straight away + email to Shane
// - GET/POST /api/staff-check/settings (admins) PIN and the discount shown at each venue
// The PIN is stored hashed in staff_check/config, which the browser can't read (firestore.rules default deny).

type Deps = {
  getDb: () => Firestore;
  oneLine: (value: unknown, max?: number) => string;
  sendNotification: (msg: { subject: string; html: string; text: string }) => Promise<void>;
  card: (title: string, rows: [string, unknown][]) => string;
};

export const STAFF_CHECK_VENUES = [
  { id: "hemingways-jomtien", name: "Hemingways Jomtien", match: /jomtien/i },
  { id: "hemingways-lakeside", name: "Hemingways Lakeside", match: /lakeside|lake/i },
  { id: "hemingways-pattaya", name: "Hemingways Pattaya", match: /hemingways.*pattaya|pattaya.*hemingways|^hemingways pattaya/i },
  { id: "cajun-life-cafe", name: "Cajun Life Cafe", match: /cajun/i },
  { id: "pattaya-rent-a-car", name: "Pattaya Rent a Car", match: /rent|car|prac/i },
] as const;
type VenueId = (typeof STAFF_CHECK_VENUES)[number]["id"];

const OWNER_UID = "u7ElWXIkdjVTNTp76LcyXnnq3AM2";
const OWNER_EMAIL = "shaneruddle@gmail.com";
const CONFIG = ["staff_check", "config"] as const;

type Config = { pinHash?: string; pinSalt?: string; discounts?: Partial<Record<VenueId, string>> };
type Person = { id: string; name: string; nickname: string; company: string; position: string; mobileEnd: string; photo: string };

const hashPin = (pin: string, salt: string) => crypto.scryptSync(pin, salt, 32).toString("hex");

// Wrong PINs: at most 8 tries per address every 15 minutes.
const failures = new Map<string, { count: number; until: number }>();
const clientIp = (req: Request) => String(req.headers["x-forwarded-for"] || req.ip || "").split(",")[0].trim();

const isLeaver = (finishWork: unknown) => {
  if (!finishWork || typeof finishWork !== "string") return false;
  const t = Date.parse(finishWork);
  return !Number.isNaN(t) && t < Date.now() - 24 * 60 * 60 * 1000;
};

export function registerStaffCheckRoutes(app: Express, { getDb, oneLine, sendNotification, card }: Deps) {
  const configRef = () => getDb().collection(CONFIG[0]).doc(CONFIG[1]);
  const readConfig = async (): Promise<Config> => ((await configRef().get()).data() as Config) || {};

  // The active staff list, kept for a minute so photo requests don't each read Firestore.
  let cache: { at: number; people: Person[] } | null = null;
  const loadStaff = async () => {
    if (cache && Date.now() - cache.at < 60_000) return cache.people;
    const snap = await getDb().collection("users").get();
    const people: Person[] = [];
    for (const d of snap.docs) {
      const u = d.data();
      if (u.active === false || !u.company || isLeaver(u.finishWork)) continue;
      const name = oneLine(u.name || [u.firstName, u.lastName].filter(Boolean).join(" "), 80);
      if (!name) continue;
      const digits = String(u.mobile || "").replace(/\D/g, "");
      people.push({
        id: d.id,
        name,
        nickname: oneLine(u.nickname, 40),
        company: oneLine(u.company, 60),
        position: oneLine(u.position, 60),
        mobileEnd: digits.length >= 3 ? digits.slice(-3) : "",
        photo: typeof u.profileImage === "string" && u.profileImage.startsWith("data:image/") ? u.profileImage : "",
      });
    }
    people.sort((a, b) => a.name.localeCompare(b.name));
    cache = { at: Date.now(), people };
    return people;
  };

  // true when the PIN is right; otherwise sends the error response.
  const checkPin = async (req: Request, res: Response) => {
    const ip = clientIp(req);
    const f = failures.get(ip);
    if (f && f.count >= 8 && f.until > Date.now()) {
      res.status(429).json({ error: "Too many wrong PINs. Try again in 15 minutes." });
      return false;
    }
    const pin = String(req.body?.pin || "").trim();
    const config = await readConfig();
    if (!config.pinHash || !config.pinSalt) {
      res.status(503).json({ error: "The staff list isn't set up yet." });
      return false;
    }
    const given = Buffer.from(hashPin(pin, config.pinSalt), "hex");
    const expected = Buffer.from(config.pinHash, "hex");
    if (pin && given.length === expected.length && crypto.timingSafeEqual(given, expected)) {
      failures.delete(ip);
      return true;
    }
    const next = f && f.until > Date.now() ? f.count + 1 : 1;
    failures.set(ip, { count: next, until: Date.now() + 15 * 60_000 });
    res.status(401).json({ error: "Wrong PIN." });
    return false;
  };

  const venueDiscounts = (config: Config) =>
    STAFF_CHECK_VENUES.map((v) => ({ id: v.id, name: v.name, discount: config.discounts?.[v.id] || "" }));

  app.post("/api/staff-check/list", async (req, res) => {
    try {
      if (!(await checkPin(req, res))) return;
      const [people, config] = await Promise.all([loadStaff(), readConfig()]);
      res.set("Cache-Control", "no-store");
      res.json({
        venues: venueDiscounts(config),
        staff: people.map(({ photo, ...p }) => ({ ...p, hasPhoto: !!photo })),
      });
    } catch (err) {
      console.error("Staff check list failed:", err instanceof Error ? err.message : err);
      res.status(500).json({ error: "Could not load the staff list." });
    }
  });

  app.post("/api/staff-check/photo", async (req, res) => {
    try {
      if (!(await checkPin(req, res))) return;
      const person = (await loadStaff()).find((p) => p.id === String(req.body?.id || ""));
      res.set("Cache-Control", "no-store");
      res.json({ photo: person?.photo || "" });
    } catch (err) {
      console.error("Staff check photo failed:", err instanceof Error ? err.message : err);
      res.status(500).json({ error: "Could not load the photo." });
    }
  });

  app.post("/api/staff-check/used", async (req, res) => {
    try {
      if (!(await checkPin(req, res))) return;
      const venue = STAFF_CHECK_VENUES.find((v) => v.id === req.body?.venue);
      const person = (await loadStaff()).find((p) => p.id === String(req.body?.id || ""));
      if (!venue || !person) { res.status(400).json({ error: "Pick the venue and the staff member." }); return; }
      const discount = (await readConfig()).discounts?.[venue.id] || "Staff discount";
      await getDb().collection("usage_logs").add({
        userId: person.id,
        userName: person.name,
        userCompany: person.company,
        discountName: discount,
        restaurantId: venue.name,
        type: "redemption",
        source: "staff-check",
        details: `Checked by the cashier at ${venue.name}`,
        timestamp: FieldValue.serverTimestamp(),
      });
      const time = new Date().toLocaleString("en-GB", { timeZone: "Asia/Bangkok" });
      const rows: [string, unknown][] = [["Employee", person.name], ["Company", person.company], ["Discount", discount], ["Location", venue.name], ["Time", time]];
      try {
        await sendNotification({
          subject: `Staff discount used: ${person.name} at ${venue.name}`,
          html: card("Staff discount used", rows),
          text: rows.map(([l, v]) => `${l}: ${v ?? ""}`).join("\n"),
        });
      } catch (err) {
        console.error("Staff check email failed:", err instanceof Error ? err.message : err);
      }
      res.json({ ok: true });
    } catch (err) {
      console.error("Staff check used failed:", err instanceof Error ? err.message : err);
      res.status(500).json({ error: "Could not save that." });
    }
  });

  // Cashiers can add a new staff member with the PIN. They go straight onto the list; Shane gets an email
  // and a line in Activity so he can switch them off in the portal if they shouldn't be there.
  app.post("/api/staff-check/add", async (req, res) => {
    try {
      if (!(await checkPin(req, res))) return;
      const b = req.body || {};
      const name = oneLine(b.name, 80);
      const company = oneLine(b.company, 60);
      const venue = STAFF_CHECK_VENUES.find((v) => v.id === b.venue);
      const photo = typeof b.photo === "string" && /^data:image\/(jpeg|png|webp);base64,/.test(b.photo) && b.photo.length < 400_000 ? b.photo : "";
      if (!name || !company) { res.status(400).json({ error: "Add a name and pick a company." }); return; }
      const data = {
        name,
        nickname: oneLine(b.nickname, 40),
        mobile: oneLine(b.mobile, 30),
        company,
        position: oneLine(b.position, 60),
        profileImage: photo,
        active: true,
        role: "employee",
        roles: ["employee"],
        addedBy: "staff-check",
        addedAtVenue: venue?.name || "",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      const ref = await getDb().collection("users").add(data);
      await getDb().collection("usage_logs").add({
        userId: ref.id,
        userName: name,
        userCompany: company,
        type: "employee_update",
        source: "staff-check",
        details: `Added to the staff list by the cashier${venue ? ` at ${venue.name}` : ""}`,
        timestamp: FieldValue.serverTimestamp(),
      });
      cache = null;
      const rows: [string, unknown][] = [
        ["Name", name], ["Nickname", data.nickname], ["Company", company], ["Position", data.position],
        ["Mobile", data.mobile], ["Added at", venue?.name || "Unknown venue"], ["Photo", photo ? "Yes" : "No"],
      ];
      try {
        await sendNotification({
          subject: `New staff added at the till: ${name} (${company})`,
          html: card("New staff member added", rows) + `<p style="font-family: Georgia, serif;">Not right? Switch them off in the portal: Activity &gt; Staff.</p>`,
          text: rows.map(([l, v]) => `${l}: ${v ?? ""}`).join("\n") + "\n\nNot right? Switch them off in the portal: Activity > Staff.",
        });
      } catch (err) {
        console.error("Staff check add email failed:", err instanceof Error ? err.message : err);
      }
      res.json({ ok: true, id: ref.id });
    } catch (err) {
      console.error("Staff check add failed:", err instanceof Error ? err.message : err);
      res.status(500).json({ error: "Could not add them." });
    }
  });

  // ---- Settings (admins in the portal) ----
  const requireAdmin = async (req: Request, res: Response) => {
    const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    try {
      if (!token) throw new Error("no token");
      getDb(); // initialises the admin app
      const user = await getAuth().verifyIdToken(token);
      if (user.uid === OWNER_UID || user.email?.toLowerCase() === OWNER_EMAIL) return true;
      const profile = (await getDb().collection("users").doc(user.uid).get()).data();
      if (profile && (profile.role === "admin" || (Array.isArray(profile.roles) && profile.roles.includes("admin")))) return true;
      res.status(403).json({ error: "Not allowed." });
    } catch {
      res.status(401).json({ error: "Please sign in again." });
    }
    return false;
  };

  app.get("/api/staff-check/settings", async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    try {
      const config = await readConfig();
      const venues = venueDiscounts(config);
      // First time: suggest each venue's discount from the old discounts list.
      if (venues.some((v) => !v.discount)) {
        const old = await getDb().collection("discounts").where("active", "==", true).get();
        for (const v of venues) {
          if (v.discount) continue;
          const match = STAFF_CHECK_VENUES.find((x) => x.id === v.id)!.match;
          const d = old.docs.map((x) => x.data()).find((x) => match.test(`${x.restaurantId || ""} ${x.name || ""}`));
          if (d?.percentage) v.discount = `${d.percentage}% off`;
        }
      }
      res.json({ pinSet: !!config.pinHash, venues });
    } catch (err) {
      console.error("Staff check settings failed:", err instanceof Error ? err.message : err);
      res.status(500).json({ error: "Could not load settings." });
    }
  });

  app.post("/api/staff-check/settings", async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    try {
      const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
      const pin = String(req.body?.pin || "").trim();
      if (pin) {
        if (!/^\d{4,8}$/.test(pin)) { res.status(400).json({ error: "The PIN must be 4 to 8 digits." }); return; }
        const salt = crypto.randomBytes(16).toString("hex");
        update.pinSalt = salt;
        update.pinHash = hashPin(pin, salt);
      }
      const discounts: Record<string, string> = {};
      for (const v of STAFF_CHECK_VENUES) discounts[v.id] = oneLine(req.body?.discounts?.[v.id], 80);
      update.discounts = discounts;
      await configRef().set(update, { merge: true });
      cache = null;
      res.json({ ok: true });
    } catch (err) {
      console.error("Staff check settings save failed:", err instanceof Error ? err.message : err);
      res.status(500).json({ error: "Could not save settings." });
    }
  });
}
