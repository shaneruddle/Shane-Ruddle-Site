import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

// The backend now only sends notification emails (discount redemptions, contact form) and
// serves the built site. Shane OS (PRAC assistant, tasks, costs, data audit) was removed.

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors());
  app.use(express.json());

  app.post("/api/notify-redemption", async (req, res) => {
    const { employeeName, company, discountName, restaurantId, timestamp } = req.body;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.ethereal.email",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || "test@example.com",
        pass: process.env.SMTP_PASS || "password",
      },
    });

    const mailOptions = {
      from: '"Shane Ruddle Group" <notifications@shaneruddle.com>',
      to: "shaneruddle@gmail.com",
      subject: `Discount Redeemed: ${discountName} at ${restaurantId}`,
      text: `
        A discount has been redeemed!

        Employee: ${employeeName}
        Company: ${company}
        Discount: ${discountName}
        Location: ${restaurantId}
        Time: ${new Date(timestamp).toLocaleString()}
      `,
      html: `
        <div style="font-family: serif; padding: 20px; border: 1px solid #E5E5E5; border-radius: 12px;">
          <h2 style="color: #D4AF37;">Discount Redemption Notification</h2>
          <p><strong>Employee:</strong> ${employeeName}</p>
          <p><strong>Company:</strong> ${company}</p>
          <p><strong>Discount:</strong> ${discountName}</p>
          <p><strong>Location:</strong> ${restaurantId}</p>
          <p><strong>Time:</strong> ${new Date(timestamp).toLocaleString()}</p>
        </div>
      `,
    };

    try {
      if (process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_USER !== "test@example.com") {
        await transporter.sendMail(mailOptions);
        console.log(`SUCCESS: Redemption email sent to shaneruddle@gmail.com for ${employeeName}`);
      } else {
        console.warn("WARNING: SMTP credentials not configured or using default test values. Email NOT sent to shaneruddle@gmail.com.");
        console.log("Email Content (Redemption):", mailOptions.text);
        if ((transporter.options as any).host === "smtp.ethereal.email") {
          const info = await transporter.sendMail(mailOptions);
          console.log("Ethereal Email Sent: %s", info.messageId);
          console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        }
      }
      res.json({ success: true });
    } catch (error) {
      console.error("ERROR: Failed to send redemption email:", error);
      res.status(500).json({ error: "Failed to send notification" });
    }
  });

  app.post("/api/contact", async (req, res) => {
    const { name, email, message } = req.body;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.ethereal.email",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || "test@example.com",
        pass: process.env.SMTP_PASS || "password",
      },
    });

    const mailOptions = {
      from: `"Shane Ruddle Group Contact" <contact@shaneruddle.com>`,
      to: "shaneruddle@gmail.com",
      subject: `New Contact Form Submission from ${name}`,
      text: `
        New contact form submission:

        Name: ${name}
        Email: ${email}
        Message: ${message}
      `,
      html: `
        <div style="font-family: serif; padding: 20px; border: 1px solid #E5E5E5; border-radius: 12px;">
          <h2 style="color: #D4AF37;">New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <div style="background: #F9F9F9; padding: 15px; border-radius: 8px; border-left: 4px solid #D4AF37;">
            ${message.replace(/\n/g, '<br>')}
          </div>
        </div>
      `,
    };

    try {
      if (process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_USER !== "test@example.com") {
        await transporter.sendMail(mailOptions);
        console.log(`SUCCESS: Contact email sent to shaneruddle@gmail.com from ${name}`);
      } else {
        console.warn("WARNING: SMTP credentials not configured or using default test values. Contact email NOT sent to shaneruddle@gmail.com.");
        console.log("Email Content (Contact):", mailOptions.text);
        if ((transporter.options as any).host === "smtp.ethereal.email") {
          const info = await transporter.sendMail(mailOptions);
          console.log("Ethereal Contact Email Sent: %s", info.messageId);
          console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        }
      }
      res.json({ success: true });
    } catch (error) {
      console.error("ERROR: Failed to send contact email:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

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
