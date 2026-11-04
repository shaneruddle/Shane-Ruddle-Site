import type { Express } from "express";
import crypto from "crypto";
import type { Firestore } from "firebase-admin/firestore";
import { SEQUENCES, type Segment } from "./sequences";

// "Email me my result": a visitor emails themselves the result of one of the site's tools.
// 1. The result is emailed to them straight away (Brevo transactional API).
// 2. They're added to the newsletter list in Brevo, tagged with the tool (SR_TOOL) and visitor type (SR_SEGMENT).
// 3. They're saved in the Firestore `leads` collection and joined to the welcome sequence for their type.
// The sequences are sent by POST /api/sequences/run, called once a day by .github/workflows/sequences.yml.

const SEGMENTS: Segment[] = ["moving", "retiring", "property", "business", "visiting", "work"];
const SITE = "https://shaneruddle.com";
const DAY = 24 * 60 * 60 * 1000;
// Who may call the daily run: the GitHub deploy service account, with this audience on its ID token.
const RUN_AUDIENCE = "shane-ruddle-sequences";
const RUN_ACCOUNT = "github-deploy@shane-ruddle-site.iam.gserviceaccount.com";

type Deps = {
  getDb: () => Firestore;
  escapeHtml: (value: unknown) => string;
  oneLine: (value: unknown, max?: number) => string;
  fromEmail: string;
};

const leadId = (email: string) => crypto.createHash("sha256").update(email).digest("hex").slice(0, 32);

// ---- Email layout (brand: black, gold, serif) ----
function layout(inner: string, footer: string) {
  return `<!doctype html><html><body style="margin:0;background:#F6F3EC;padding:24px 12px;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;font-family:Georgia,'Times New Roman',serif;color:#141414;">
    <div style="background:#141414;padding:22px 28px;">
      <a href="${SITE}" style="color:#D4AF37;text-decoration:none;font-size:20px;letter-spacing:1px;">Shane <em>Ruddle</em></a>
    </div>
    <div style="padding:28px;font-size:16px;line-height:1.6;">${inner}</div>
    <div style="padding:18px 28px;border-top:1px solid #eee;font-family:Arial,sans-serif;font-size:12px;color:#888;line-height:1.5;">${footer}</div>
  </div></body></html>`;
}

function paragraphs(text: string, escapeHtml: Deps["escapeHtml"]) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const html = escapeHtml(p)
        .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_m, t, u) => `<a href="${u}" style="color:#9A7B1F;">${t}</a>`)
        .replace(/\n/g, "<br>");
      return `<p style="margin:0 0 16px;">${html}</p>`;
    })
    .join("");
}

const plain = (text: string) => text.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, "$1 ($2)");

export function registerLeadRoutes(app: Express, { getDb, escapeHtml, oneLine, fromEmail }: Deps) {
  const apiKey = () => process.env.BREVO_API_KEY;

  const brevo = async (path: string, body: unknown, method = "POST") => {
    const res = await fetch(`https://api.brevo.com/v3${path}`, {
      method,
      headers: { "api-key": apiKey()!, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Brevo ${path} ${res.status}: ${(await res.text()).slice(0, 300)}`);
  };

  const sendTo = (to: { email: string; name?: string }, subject: string, html: string, text: string) =>
    brevo("/smtp/email", {
      sender: { email: fromEmail, name: "Shane Ruddle" },
      to: [to.name ? to : { email: to.email }],
      subject,
      htmlContent: html,
      textContent: text,
    });

  // Brevo rejects attributes it doesn't know, so create ours once per server start (an "already exists" error is fine).
  let attributesReady: Promise<void> | null = null;
  const ensureAttributes = () =>
    (attributesReady ??= Promise.all(
      ["SR_TOOL", "SR_SEGMENT"].map((name) =>
        fetch(`https://api.brevo.com/v3/contacts/attributes/normal/${name}`, {
          method: "POST",
          headers: { "api-key": apiKey()!, "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ type: "text" }),
        }).catch(() => undefined),
      ),
    ).then(() => undefined));

  const addToList = async (email: string, firstName: string, tool: string, segment: Segment) => {
    const listId = Number(process.env.BREVO_LIST_ID);
    if (!listId) return;
    await ensureAttributes();
    const attributes: Record<string, string> = { SR_TOOL: tool, SR_SEGMENT: segment };
    if (firstName) attributes.FIRSTNAME = firstName;
    try {
      await brevo("/contacts", { email, listIds: [listId], updateEnabled: true, attributes });
    } catch (error) {
      // If the custom attributes still fail, at least get them on the list.
      console.error("Brevo contact with attributes failed, retrying without:", error instanceof Error ? error.message : error);
      await brevo("/contacts", { email, listIds: [listId], updateEnabled: true, ...(firstName ? { attributes: { FIRSTNAME: firstName } } : {}) });
    }
  };

  const unsubscribeLink = (id: string, token: string) => `${SITE}/api/unsubscribe?id=${id}&t=${token}`;

  // ---- 1. Email me my result ----
  const hits = new Map<string, number[]>();
  app.post("/api/email-result", async (req, res) => {
    const ip = String(req.headers["x-forwarded-for"] || req.ip || "").split(",")[0].trim();
    const now = Date.now();
    const recent = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
    recent.push(now);
    hits.set(ip, recent);
    if (recent.length > 8) return res.status(429).json({ error: "Too many requests. Please try again in a few minutes." });

    const email = String(req.body?.email || "").trim().toLowerCase();
    const firstName = oneLine(req.body?.firstName, 80);
    const tool = oneLine(req.body?.tool, 60).replace(/[^a-z0-9_]/gi, "");
    const segment = (SEGMENTS.includes(req.body?.segment) ? req.body.segment : "moving") as Segment;
    const title = oneLine(req.body?.title, 120) || "Your result";
    const summary = String(req.body?.summary || "").slice(0, 4000);
    const rawLink = String(req.body?.link || "");
    const link = rawLink.startsWith(`${SITE}/`) ? rawLink.slice(0, 1500) : SITE;
    if (req.body?.website) return res.json({ success: true }); // honeypot
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }
    if (!tool || !summary.trim()) return res.status(400).json({ error: "Something went wrong. Please try again." });
    if (!apiKey()) {
      console.error("Email-result request received but BREVO_API_KEY is not set.");
      return res.status(503).json({ error: "Sending is temporarily unavailable. Please try again later." });
    }

    const lines = summary.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 40);
    const [headline, ...rest] = lines;
    const greeting = firstName ? `Hi ${escapeHtml(firstName)},` : "Hi,";
    const html = layout(
      `<p style="margin:0 0 16px;">${greeting}</p>
       <p style="margin:0 0 20px;">Here's your ${escapeHtml(title)} from my site, so you have it to hand.</p>
       <div style="background:#141414;color:#fff;border-radius:12px;padding:22px 24px;margin:0 0 22px;">
         <p style="margin:0 0 12px;color:#D4AF37;font-size:19px;">${escapeHtml(headline)}</p>
         ${rest.map((l) => `<p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:14px;color:rgba(255,255,255,.8);">${escapeHtml(l)}</p>`).join("")}
       </div>
       <p style="margin:0 0 22px;"><a href="${escapeHtml(link)}" style="display:inline-block;background:#D4AF37;color:#141414;text-decoration:none;padding:12px 22px;border-radius:999px;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;">Open my result again</a></p>
       <p style="margin:0 0 16px;">If anything in there doesn't look right for you, just ask me on the site and I'll reply personally.</p>
       <p style="margin:0;">Shane</p>`,
      `You asked for this on shaneruddle.com. You'll also get my weekly email about life, property and business in Pattaya, and you can unsubscribe from any of them at any time.`,
    );
    const text = `${firstName ? `Hi ${firstName},` : "Hi,"}\n\nHere's your ${title} from my site.\n\n${lines.join("\n")}\n\nOpen it again: ${link}\n\nShane`;

    try {
      await sendTo({ email, name: firstName || undefined }, `Your ${title}`, html, text);
    } catch (error) {
      console.error("Email-result send failed:", error instanceof Error ? error.message : error);
      return res.status(502).json({ error: "Sorry, that didn't send. Please check your email address and try again." });
    }
    res.json({ success: true });

    // After replying: list + lead record. Failures here are logged, not shown to the visitor.
    try {
      await addToList(email, firstName, tool, segment);
    } catch (error) {
      console.error("Email-result Brevo list add failed:", error instanceof Error ? error.message : error);
    }
    try {
      const ref = getDb().collection("leads").doc(leadId(email));
      await getDb().runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const data = snap.data();
        const result = { tool, segment, title, summary: lines.join("\n"), link, at: new Date() };
        if (!data) {
          const hasSequence = !!SEQUENCES[segment];
          tx.set(ref, {
            email,
            firstName,
            createdAt: new Date(),
            results: [result],
            token: crypto.randomBytes(16).toString("hex"),
            seqSegment: hasSequence ? segment : null,
            seqStep: 0,
            seqActive: hasSequence,
            nextSendAt: hasSequence ? new Date(Date.now() + (SEQUENCES[segment]!.emails[0]?.day ?? 1) * DAY) : null,
          });
        } else {
          const update: Record<string, unknown> = { results: [...(data.results || []), result].slice(-20), updatedAt: new Date() };
          if (firstName && !data.firstName) update.firstName = firstName;
          // Someone who finished (or never had) a sequence joins the one for their new type of visit.
          if (!data.seqActive && !data.unsubscribed && SEQUENCES[segment] && data.seqSegment !== segment) {
            Object.assign(update, {
              seqSegment: segment,
              seqStep: 0,
              seqActive: true,
              nextSendAt: new Date(Date.now() + (SEQUENCES[segment]!.emails[0]?.day ?? 1) * DAY),
            });
          }
          tx.update(ref, update);
        }
      });
    } catch (error) {
      console.error("Email-result lead save failed:", error instanceof Error ? error.message : error);
    }
  });

  // ---- 2. Unsubscribe from the welcome emails ----
  app.get("/api/unsubscribe", async (req, res) => {
    const id = String(req.query.id || "").replace(/[^a-f0-9]/g, "");
    const token = String(req.query.t || "");
    const page = (msg: string) =>
      res.type("html").send(layout(`<p style="margin:0 0 16px;">${msg}</p><p style="margin:0;"><a href="${SITE}" style="color:#9A7B1F;">Back to shaneruddle.com</a></p>`, ""));
    try {
      const ref = getDb().collection("leads").doc(id);
      const snap = id ? await ref.get() : null;
      if (!snap?.exists || snap.data()?.token !== token) return page("That link doesn't look right. If you keep getting emails you don't want, reply to one and I'll take you off.");
      await ref.update({ seqActive: false, unsubscribed: true, unsubscribedAt: new Date() });
      page("Done. You won't get any more of these emails from me. (My weekly email has its own unsubscribe link at the bottom.)");
    } catch (error) {
      console.error("Unsubscribe failed:", error instanceof Error ? error.message : error);
      res.status(500).send("Sorry, something went wrong. Please try the link again later.");
    }
  });

  // ---- 3. Daily run: send the welcome emails that are due ----
  const authorised = async (header: string) => {
    const token = header.replace(/^Bearer\s+/i, "");
    if (!token) return false;
    if (process.env.INSIGHTS_TOKEN && token === process.env.INSIGHTS_TOKEN) return true;
    try {
      const r = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`);
      if (!r.ok) return false;
      const info = (await r.json()) as { email?: string; email_verified?: string | boolean; aud?: string };
      return info.aud === RUN_AUDIENCE && info.email === RUN_ACCOUNT && String(info.email_verified) === "true";
    } catch {
      return false;
    }
  };

  app.post("/api/sequences/run", async (req, res) => {
    if (!(await authorised(String(req.headers.authorization || "")))) return res.status(401).json({ error: "Unauthorised" });
    if (!apiKey()) return res.status(503).json({ error: "BREVO_API_KEY not set" });
    const dryRun = req.query.dry === "1";
    const db = getDb();
    const snap = await db.collection("leads").where("seqActive", "==", true).where("nextSendAt", "<=", new Date()).limit(200).get();
    const report = { due: snap.size, sent: 0, waiting: 0, finished: 0, failed: 0 };
    for (const doc of snap.docs) {
      const lead = doc.data();
      const seq = SEQUENCES[lead.seqSegment as Segment];
      if (!seq || !seq.emails.length) {
        await doc.ref.update({ seqActive: false });
        report.finished++;
        continue;
      }
      if (!seq.approved) {
        report.waiting++;
        continue;
      }
      const step = Number(lead.seqStep) || 0;
      const mail = seq.emails[step];
      if (!mail) {
        await doc.ref.update({ seqActive: false, seqFinishedAt: new Date() });
        report.finished++;
        continue;
      }
      if (dryRun) {
        report.sent++;
        continue;
      }
      const greeting = lead.firstName ? `Hi ${lead.firstName},` : "Hi,";
      const unsub = unsubscribeLink(doc.id, lead.token);
      try {
        await sendTo(
          { email: lead.email, name: lead.firstName || undefined },
          mail.subject,
          layout(`${paragraphs(`${greeting}\n\n${mail.body}\n\nShane`, escapeHtml)}`, `You're getting this because you used one of the tools on shaneruddle.com. <a href="${unsub}" style="color:#888;">Stop these emails</a>.`),
          `${greeting}\n\n${plain(mail.body)}\n\nShane\n\nStop these emails: ${unsub}`,
        );
        const next = seq.emails[step + 1];
        await doc.ref.update({
          seqStep: step + 1,
          lastSentAt: new Date(),
          ...(next
            ? { nextSendAt: new Date(Date.now() + Math.max(1, next.day - mail.day) * DAY - 60 * 60 * 1000) }
            : { seqActive: false, seqFinishedAt: new Date() }),
        });
        report.sent++;
      } catch (error) {
        console.error(`Sequence send failed for lead ${doc.id}:`, error instanceof Error ? error.message : error);
        report.failed++;
      }
    }
    console.log("Sequence run:", JSON.stringify(report));
    res.json(report);
  });
}
