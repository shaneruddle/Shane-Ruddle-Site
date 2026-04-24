import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import axios from "axios";
import * as cheerio from "cheerio";
import cors from "cors";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Route to extract property data and images from a URL
  app.post("/api/extract-images", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
      const response = await axios.get(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
        timeout: 15000,
      });

      const html = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      const $ = cheerio.load(html);
      const images: string[] = [];
      const seen = new Set<string>();
      let bubbleMetadata: any = null;

      const addImage = (src: string | undefined) => {
        if (!src || src.startsWith('data:')) return;
        let cleanSrc = src.startsWith('//') ? `https:${src}` : src;
        
        // Ensure protocol if it's just a path
        if (cleanSrc.startsWith('/')) {
          try {
            const parsed = new URL(url);
            cleanSrc = `${parsed.protocol}//${parsed.host}${cleanSrc}`;
          } catch(e) {}
        }

        try {
          const absoluteUrl = new URL(cleanSrc, url).href;
          if (!seen.has(absoluteUrl)) {
            const junk = /(logo|brand|avatar|icon|favicon|banner|header|footer|social|pixel|tracking|marker|btn|staff|agent)/i;
            if (!junk.test(absoluteUrl)) {
              images.push(absoluteUrl);
              seen.add(absoluteUrl);
            }
          }
        } catch (e) {}
      };

      // --- PRIMARY EXTRACTION: BUBBLE.IO API ---
      const refMatch = url.match(/([A-Za-z]{2,8}\d{2,10})/i);
      const refCode = refMatch ? refMatch[1].toUpperCase() : null;

      if (refCode && (html.includes("api/1.1/init/data") || url.includes("property"))) {
        const parsedUrl = new URL(url);
        const constraints = JSON.stringify([{
          key: "Main Website Ref",
          constraint_type: "equals",
          value: refCode
        }]);
        const apiUrl = `${parsedUrl.origin}/api/1.1/obj/homes?constraints=${encodeURIComponent(constraints)}`;
        
        try {
          const apiResponse = await axios.get(apiUrl, { timeout: 8000 });
          const item = apiResponse.data?.response?.results[0];
          if (item) {
            bubbleMetadata = item;
            // Extract Images
            const galleryFields = ["List of Image", "List of Image NW", "Main Photo", "Photos"];
            galleryFields.forEach(field => {
              const val = item[field];
              if (Array.isArray(val)) val.forEach((img: any) => addImage(img));
              else if (typeof val === 'string') addImage(val);
            });
          }
        } catch (apiErr) { console.error("Bubble API failed", apiErr); }
      }

      // FALLBACK: Standard scraping for images if API failed
      if (images.length === 0) {
        $("[src], [data-src], [srcset], img").each((_, el) => {
          addImage($(el).attr("src") || $(el).attr("data-src") || $(el).attr("srcset"));
        });
        const deepRegex = /(?:https?:)?\/\/[^"'\s<>]*?\.(?:jpg|jpeg|png|webp|avif)(?:\?[^"'\s<>]*)?/gi;
        let match;
        while ((match = deepRegex.exec(html)) !== null) { addImage(match[0]); }
      }

      // Metadata Resolution
      const htmlText = $('body').text();
      const refNumber = refCode || "N/A";
      
      // Map API fields if available, else scrape
      const beds = bubbleMetadata?.["Bedrooms"] || bubbleMetadata?.["Beds"] || htmlText.match(/(\d+)\s?(?:bed|bedroom)/i)?.[1] || "";
      const baths = bubbleMetadata?.["Bathrooms"] || bubbleMetadata?.["Baths"] || htmlText.match(/(\d+)\s?(?:bath|bathroom)/i)?.[1] || "";
      const livingSize = bubbleMetadata?.["Living Area"] || bubbleMetadata?.["Living Size"] || bubbleMetadata?.["Area Size"] || bubbleMetadata?.["Size"] || htmlText.match(/(\d+(?:,\d+)?(?:\.\d+)?)\s?(?:sqm|sq\.\s?m|sq\s?ft|square\s?feet|m2|sq\s?meters)/i)?.[1] || "";
      const landSize = bubbleMetadata?.["Land Area"] || bubbleMetadata?.["Land Size"] || "";
      const priceVal = bubbleMetadata?.["Listing Price"] || bubbleMetadata?.["Price"] || htmlText.match(/(?:price|baht|฿|THB|sale)\s*[:\-]?\s*(?:฿|THB|USD|\$)?\s*([\d,]+)/i)?.[1] || "";
      const isBubbleId = (val: string) => typeof val === 'string' && (/^\d+x\d+$/.test(val) || /^[0-9\-]+$/.test(val));
      let agent = bubbleMetadata?.["Assigned Agent"] || "";
      
      // If we got a Bubble ID or something heavily numeric, try to find a better name
      if (!agent || isBubbleId(agent)) {
        agent = bubbleMetadata?.["Agent Name"] || 
                bubbleMetadata?.["Assigned Agent Name"] || 
                bubbleMetadata?.["Agent Display Name"] ||
                bubbleMetadata?.["Full Name"] ||
                bubbleMetadata?.["Agent"] || 
                $('meta[name="author"]').attr('content') ||
                $('meta[property="product:brand"]').attr('content') ||
                htmlText.match(/(?:listing\s?by|agent|contact|representative|listing agent)\s*[:\-]?\s*([A-Za-z\s]{3,30})/i)?.[1]?.trim() || 
                "";
      }
      
      // Check for structured data if agent still not found/valid
      if (!agent || isBubbleId(agent)) {
        try {
          const ldJson = $('script[type="application/ld+json"]');
          ldJson.each((_, el) => {
            try {
              const data = JSON.parse($(el).html() || '{}');
              const author = data?.author?.name || data?.brand?.name || data?.seller?.name;
              if (author && typeof author === 'string') {
                agent = author;
                return false; // break
              }
            } catch (e) {}
          });
        } catch (e) {}
      }
      
      // Clean agent name if it's an email (e.g. shaneruddle@pattaya-property.net -> Shane Ruddle)
      if (agent.includes('@')) {
        const namePart = agent.split('@')[0];
        agent = namePart
          .replace(/[._-]/g, ' ')
          .toLowerCase()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
          .trim();
      }

      const location = bubbleMetadata?.["Location"] || bubbleMetadata?.["District"] || "";
      const saleType = bubbleMetadata?.["Sale Type"] || "";
      const ownership = bubbleMetadata?.["Ownership"] || "";
      const devLink = bubbleMetadata?.["Development Link"] || "";

      res.json({
        images: images,
        meta: {
          title: bubbleMetadata?.["Listing Title"] || ($('meta[property="og:title"]').attr('content') || $('title').text()).trim() || "Property Listing",
          description: bubbleMetadata?.["Eng description"] || bubbleMetadata?.["Eng Description"] || bubbleMetadata?.["Listing Description"] || ($('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || "").trim(),
          engDescription: bubbleMetadata?.["Eng description"] || bubbleMetadata?.["Eng Description"] || "",
          refNumber,
          beds,
          baths,
          size: livingSize, // Maintaining 'size' for backward compatibility in UI
          livingSize,
          landSize,
          price: priceVal,
          agent,
          location,
          saleType,
          ownership,
          devLink
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Bubble Status Endpoint
  app.get("/api/bubble/status/:ref", async (req, res) => {
    const { ref } = req.params;
    const base = process.env.BUBBLE_API_BASE_URL;
    const token = process.env.BUBBLE_API_TOKEN;
    const objType = process.env.BUBBLE_OBJECT_TYPE || "homes";

    if (!base || !token) {
      return res.json({ found: false, status: "Config Missing" });
    }

    const apiUrl = `${base}/obj/${objType}?constraints=${encodeURIComponent(JSON.stringify([{key: "Main Website Ref", constraint_type: "equals", value: ref}]))}`;
    
    try {
      const response = await axios.get(apiUrl, { headers: { Authorization: `Bearer ${token}`} });
      const item = response.data?.response?.results[0];
      res.json({ found: !!item, status: item?.["Sale Type"] || "N/A" });
    } catch (err: any) { 
      res.json({ found: false, error: err.message }); 
    }
  });

  app.get("/api/proxy-image", async (req, res) => {
    const { url } = req.query;
    try {
      const response = await axios.get(url as string, { responseType: "arraybuffer" });
      res.set("Content-Type", response.headers["content-type"] as string);
      res.send(response.data);
    } catch (error) {
      res.status(500).send("Failed to proxy image");
    }
  });

  app.post("/api/notify-redemption", async (req, res) => {
    const { employeeName, company, discountName, restaurantId, timestamp } = req.body;

    // Create a transporter
    // Note: In a real app, you'd use real SMTP credentials from process.env
    // For now, I'll use a mock/test account or just log it if credentials aren't provided
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
        
        // If using ethereal, we can still send it and provide a link
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

  app.post("/api/notify-login", async (req, res) => {
    const { userName, userEmail, userCompany, timestamp, targetEmail } = req.body;

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
      to: targetEmail || "shaneruddle@gmail.com",
      subject: `Login Alert: ${userName || userEmail || 'A user'} has signed in`,
      text: `
        A user has signed in to the portal!
        
        Name: ${userName || 'N/A'}
        Email: ${userEmail || 'N/A'}
        Company: ${userCompany || 'N/A'}
        Time: ${new Date(timestamp).toLocaleString()}
      `,
      html: `
        <div style="font-family: serif; padding: 20px; border: 1px solid #E5E5E5; border-radius: 12px;">
          <h2 style="color: #D4AF37;">Login Notification</h2>
          <p><strong>Name:</strong> ${userName || 'N/A'}</p>
          <p><strong>Email:</strong> ${userEmail || 'N/A'}</p>
          <p><strong>Company:</strong> ${userCompany || 'N/A'}</p>
          <p><strong>Time:</strong> ${new Date(timestamp).toLocaleString()}</p>
        </div>
      `,
    };

    try {
      if (process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_USER !== "test@example.com") {
        await transporter.sendMail(mailOptions);
        console.log(`SUCCESS: Login email sent to ${targetEmail || "shaneruddle@gmail.com"} for ${userName}`);
      } else {
        console.warn("WARNING: SMTP credentials not configured. Login email NOT sent.");
        console.log("Email Content (Login):", mailOptions.text);

        if ((transporter.options as any).host === "smtp.ethereal.email") {
          const info = await transporter.sendMail(mailOptions);
          console.log("Ethereal Login Email Sent: %s", info.messageId);
          console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        }
      }
      res.json({ success: true });
    } catch (error) {
      console.error("ERROR: Failed to send login email:", error);
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
