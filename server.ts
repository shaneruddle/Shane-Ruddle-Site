import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

// The backend sends notification emails (discount redemptions, contact form), handles newsletter
// sign-ups, and serves the built site. Shane OS (PRAC assistant, tasks, costs, data audit) was removed.

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors());
  app.use(express.json());

  // ---- Outgoing email ----
  // Notification emails go to Shane. Sent through Brevo's transactional API when BREVO_API_KEY is set
  // (same key as the newsletter), otherwise through SMTP if real SMTP credentials are configured.
  // If neither is available the request fails loudly instead of reporting success.
  const NOTIFY_TO = "shaneruddle@gmail.com";
  // Must be a verified Brevo sender. Override with MAIL_FROM_EMAIL / MAIL_FROM_NAME.
  const FROM_EMAIL = process.env.MAIL_FROM_EMAIL || "info@pattayarentacar.com";
  const FROM_NAME = process.env.MAIL_FROM_NAME || "shaneruddle.com";

  const escapeHtml = (value: unknown) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  const oneLine = (value: unknown, max = 200) => String(value ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, max);

  const smtpConfigured = () =>
    !!(process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_USER !== "test@example.com" && process.env.SMTP_PASS !== "REPLACE_ME");

  async function sendNotification({ subject, html, text, replyTo }: { subject: string; html: string; text: string; replyTo?: string }) {
    if (process.env.BREVO_API_KEY) {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": process.env.BREVO_API_KEY, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          sender: { email: FROM_EMAIL, name: FROM_NAME },
          to: [{ email: NOTIFY_TO, name: "Shane Ruddle" }],
          ...(replyTo ? { replyTo: { email: replyTo } } : {}),
          subject,
          htmlContent: html,
          textContent: text,
        }),
      });
      if (!response.ok) throw new Error(`Brevo send failed: ${response.status} ${(await response.text()).slice(0, 300)}`);
      return;
    }
    if (smtpConfigured()) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transporter.sendMail({ from: `"${FROM_NAME}" <${process.env.SMTP_USER}>`, to: NOTIFY_TO, replyTo, subject, html, text });
      return;
    }
    throw new Error("No email provider configured (set BREVO_API_KEY or SMTP_* variables).");
  }

  const card = (title: string, rows: [string, unknown][], body?: string) => `
    <div style="font-family: Georgia, serif; padding: 20px; border: 1px solid #E5E5E5; border-radius: 12px; max-width: 600px;">
      <h2 style="color: #B8860B; margin-top: 0;">${escapeHtml(title)}</h2>
      ${rows.map(([label, value]) => `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`).join("")}
      ${body ? `<div style="background: #F9F9F9; padding: 15px; border-radius: 8px; border-left: 4px solid #D4AF37; white-space: pre-wrap;">${escapeHtml(body)}</div>` : ""}
    </div>`;

  app.post("/api/notify-redemption", async (req, res) => {
    const { employeeName, company, discountName, restaurantId, timestamp } = req.body || {};
    const time = new Date(timestamp || Date.now()).toLocaleString("en-GB", { timeZone: "Asia/Bangkok" });
    const rows: [string, unknown][] = [
      ["Employee", employeeName], ["Company", company], ["Discount", discountName], ["Location", restaurantId], ["Time", time],
    ];
    try {
      await sendNotification({
        subject: `Discount redeemed: ${oneLine(discountName, 80)} at ${oneLine(restaurantId, 80)}`,
        html: card("Discount Redemption", rows),
        text: rows.map(([l, v]) => `${l}: ${v ?? ""}`).join("\n"),
      });
      res.json({ success: true });
    } catch (error) {
      console.error("ERROR: Failed to send redemption email:", error instanceof Error ? error.message : error);
      res.status(500).json({ error: "Failed to send notification" });
    }
  });

  app.post("/api/contact", async (req, res) => {
    const name = oneLine(req.body?.name, 120);
    const email = oneLine(req.body?.email, 254);
    const message = String(req.body?.message ?? "").trim().slice(0, 5000);
    if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Please fill in your name, a valid email and a message." });
    }
    try {
      await sendNotification({
        subject: `New message from ${name} via shaneruddle.com`,
        html: card("New Contact Form Message", [["Name", name], ["Email", email]], message),
        text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
        replyTo: email,
      });
      console.log(`Contact email sent for ${email}`);
      res.json({ success: true });
    } catch (error) {
      console.error("ERROR: Failed to send contact email:", error instanceof Error ? error.message : error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Newsletter sign-up: adds the contact to the Brevo list. The API key stays server-side.
  app.post("/api/newsletter", async (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const firstName = String(req.body?.firstName || "").trim().slice(0, 80);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }
    const apiKey = process.env.BREVO_API_KEY;
    const listId = Number(process.env.BREVO_LIST_ID);
    if (!apiKey || !listId) {
      console.error("Newsletter sign-up received but BREVO_API_KEY / BREVO_LIST_ID are not set.");
      return res.status(503).json({ error: "Sign-ups are temporarily unavailable. Please try again later." });
    }
    try {
      const response = await fetch("https://api.brevo.com/v3/contacts", {
        method: "POST",
        headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          email,
          listIds: [listId],
          updateEnabled: true,
          ...(firstName ? { attributes: { FIRSTNAME: firstName } } : {}),
        }),
      });
      if (!response.ok) {
        const detail = await response.text();
        console.error("Brevo sign-up failed:", response.status, detail.slice(0, 300));
        return res.status(502).json({ error: "Could not subscribe right now. Please try again." });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Brevo sign-up error:", error instanceof Error ? error.message : error);
      res.status(502).json({ error: "Could not subscribe right now. Please try again." });
    }
  });

  // Unknown API routes return a real 404 instead of falling through to the SPA's index.html.
  app.all('/api/*', (_req, res) => { res.status(404).json({ error: 'Not found' }); });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
