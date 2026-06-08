import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import axios from "axios";
import cors from "cors";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors());
  app.use(express.json());

  // API Route to extract property data and images from a URL
  app.post("/api/extract-images", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
      const images: string[] = [];
      const seen = new Set<string>();
      let apiData: any = null;

      const addImage = (src: string | undefined) => {
        if (!src) return;
        try {
          const absoluteUrl = new URL(src, url).href;
          if (!seen.has(absoluteUrl)) {
            const junk = /(logo|brand|avatar|icon|favicon|banner|header|footer|social|pixel|tracking|marker|btn|staff|agent)/i;
            if (!junk.test(absoluteUrl)) {
              images.push(absoluteUrl);
              seen.add(absoluteUrl);
            }
          }
        } catch (e) {}
      };

      // --- THAIPROPERTY.COM API (East Coast Real Estate) ---
      if (url.includes('thaiproperty.com')) {
        const tpIdMatch = url.match(/_(\d+)\.html/) || url.match(/\/(\d{4,})(?:\/|$|\?|#)/);
        const tpId = tpIdMatch?.[1];

        if (tpId) {
          try {
            let tpData: any = null;

            // Direct ID lookup only — no text search fallback (text search does substring matching and returns wrong properties)
            try {
              const tpRes = await axios.get(`https://www.thaiproperty.com/api/v1/properties/${tpId}`, { timeout: 8000 });
              const candidate = tpRes.data?.data ?? tpRes.data;
              if (candidate?.reference) tpData = candidate;
            } catch {}

            if (tpData) {
              if (Array.isArray(tpData.images)) {
                tpData.images.forEach((img: any) => addImage(img.url));
              }
              apiData = {
                "Listing Title":    tpData.name || "",
                "Main Website Ref": tpData.reference || tpId,
                "Ref":              tpData.reference || tpId,
                "Eng description":  tpData.description || "",
                "Eng Description":  tpData.description || "",
                "Bedrooms":         tpData.bedrooms != null ? String(tpData.bedrooms) : "",
                "Bathrooms":        tpData.bathrooms != null ? String(tpData.bathrooms) : "",
                "Living Area":      tpData.house_sqm != null ? String(tpData.house_sqm) : "",
                "Land Area":        tpData.land_sqm  != null ? String(tpData.land_sqm)  : "",
                "Listing Price":    tpData.sale_price && tpData.sale_price > 0 ? String(tpData.sale_price) : "",
                "Rental Price":     tpData.rent_price && tpData.rent_price > 0 ? String(tpData.rent_price) : "",
                "Floor":            tpData.floor != null ? String(tpData.floor) : "",
                "Location":         tpData.location || "",
                "Sale Type":        tpData.for_sale && tpData.for_rent ? "Sale & Rent"
                                    : tpData.for_sale ? "Sale"
                                    : tpData.for_rent ? "Rent" : "",
                "Property Name":    tpData.name || "",
              };
            }
          } catch (tpErr: any) {
            console.error("ThaiProperty API failed:", tpErr.message);
          }
        }
      }

      // --- BUBBLE.IO API (Alan Bolton / pattaya-property.net) ---
      if (!apiData && !url.includes('thaiproperty.com')) {
        const refMatch = url.match(/([A-Za-z]{2,8}\d{2,10})/i);
        const refCode = refMatch ? refMatch[1].toUpperCase() : null;

        if (refCode) {
          try {
            const parsedUrl = new URL(url);
            const constraints = JSON.stringify([{ key: "Main Website Ref", constraint_type: "equals", value: refCode }]);
            const apiUrl = `${parsedUrl.origin}/api/1.1/obj/homes?constraints=${encodeURIComponent(constraints)}`;
            const apiResponse = await axios.get(apiUrl, { timeout: 8000 });
            const item = apiResponse.data?.response?.results[0];
            if (item) {
              apiData = item;
              const galleryFields = ["List of Image", "List of Image NW", "Main Photo", "Photos"];
              galleryFields.forEach(field => {
                const val = item[field];
                if (Array.isArray(val)) val.forEach((img: any) => addImage(img));
                else if (typeof val === 'string') addImage(val);
              });
            }
          } catch (apiErr) { console.error("Bubble API failed", apiErr); }
        }
      }

      // Metadata from API data only — no HTML scraping
      const isBubbleId = (val: any) => typeof val === 'string' && (/^\d+x\d+$/.test(val) || /^[0-9\-]+$/.test(val));

      const refCode = url.match(/([A-Za-z]{2,8}\d{2,10})/i)?.[1]?.toUpperCase() || null;
      const refNumber = apiData?.["Ref"] || apiData?.["Reference"] || apiData?.["Main Website Ref"] || refCode || "N/A";

      const beds         = apiData?.["Bedrooms"] || apiData?.["Beds"] || "";
      const baths        = apiData?.["Bathrooms"] || apiData?.["Baths"] || "";
      const livingSize   = apiData?.["Living Area"] || apiData?.["Living Size"] || apiData?.["Area Size"] || apiData?.["Size"] || "";
      const landSize     = apiData?.["Land Area"] || apiData?.["Land Size"] || "";
      const sellingPrice = apiData?.["Listing Price"] || apiData?.["Price"] || "";
      const rentalPrice  = apiData?.["Rental Price"] || "";
      const priceVal     = sellingPrice || rentalPrice || "";

      let agent = apiData?.["Assigned Agent"] || "";

      // Resolve Bubble user ID to a name
      if (agent && isBubbleId(agent)) {
        try {
          const parsedUrl = new URL(url);
          const token = process.env.BUBBLE_API_TOKEN;
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const userResponse = await axios.get(`${parsedUrl.origin}/api/1.1/obj/user/${agent}`, { headers, timeout: 5000 });
          const userItem = userResponse.data?.response;
          if (userItem) {
            let firstName = userItem["First Name"] || userItem["first_name"] || userItem["FirstName"];
            if (!firstName) {
              const fullName = userItem["Full Name"] || userItem["full_name"] || userItem["Name"] || "";
              if (fullName) firstName = fullName.split(' ')[0];
            }
            const nickname = userItem["Nickname"] || userItem["nickname"] || userItem["Nick Name"];
            if (firstName) agent = nickname ? `${firstName} (${nickname})` : firstName;
            else if (nickname) agent = nickname;
          }
        } catch (err: any) {
          console.error(`Bubble User API fetch failed for ID ${agent}:`, err.message);
        }
      }

      // Clear unresolved Bubble IDs
      if (isBubbleId(agent)) agent = "";

      // Clean up email-format agent names
      if (agent.includes('@')) {
        agent = agent.split('@')[0]
          .replace(/[._-]/g, ' ')
          .toLowerCase()
          .split(' ')
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')
          .trim();
      }

      const location  = apiData?.["Location"] || apiData?.["District"] || "";
      const saleType  = apiData?.["Sale Type"] || "";
      const ownership = apiData?.["Ownership"] || "";
      let devLink     = apiData?.["Development Link"] || apiData?.["Development"] || apiData?.["Project"] || "";
      let devName     = apiData?.["Development Name"] || apiData?.["Project Name"] || apiData?.["Development_Name"] || apiData?.["Property Name"] || "";

      // Resolve Bubble development ID to a name
      if ((!devName || isBubbleId(devName)) && devLink && isBubbleId(devLink)) {
        try {
          const parsedUrl = new URL(url);
          const token = process.env.BUBBLE_API_TOKEN;
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          for (const type of ["development", "project", "condo"]) {
            try {
              const devResponse = await axios.get(`${parsedUrl.origin}/api/1.1/obj/${type}/${devLink}`, { headers, timeout: 4000 });
              const devItem = devResponse.data?.response;
              if (devItem) {
                const fetchedName = devItem["Name"] || devItem["name"] || devItem["Development Name"] || devItem["Title"];
                if (fetchedName && !isBubbleId(fetchedName)) { devName = fetchedName; break; }
              }
            } catch (e) {}
          }
        } catch (err: any) {
          console.error("Bubble Development API resolution failed:", err.message);
        }
      }

      const customDescription = apiData?.["Custom Description"] || apiData?.["Internal Description"] || apiData?.["Eng description"] || "";
      const floor     = apiData?.["Floor"] || apiData?.["Floor Number"] || "";
      const furniture = apiData?.["Furniture"] || apiData?.["Furnished"] || "";
      const keys      = apiData?.["List of Keys"] || apiData?.["Key held by who"] || "";

      res.json({
        images,
        meta: {
          title:          apiData?.["Listing Title"] || apiData?.["Property Name"] || "",
          description:    apiData?.["Eng description"] || apiData?.["Eng Description"] || apiData?.["Listing Description"] || "",
          engDescription: apiData?.["Eng description"] || apiData?.["Eng Description"] || "",
          refNumber, beds, baths,
          size: livingSize, livingSize, landSize,
          price: priceVal, sellingPrice, rentalPrice,
          agent, location, saleType, ownership, devLink, devName,
          customDescription, floor, furniture, keys,
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

    const apiUrl = `${base}/obj/${objType}?constraints=${encodeURIComponent(JSON.stringify([{ key: "Main Website Ref", constraint_type: "equals", value: ref }]))}`;

    try {
      const response = await axios.get(apiUrl, { headers: { Authorization: `Bearer ${token}` } });
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

  app.post("/api/generate-copy", async (req, res) => {
    const { prompt, model = "claude-sonnet-4-20250514", max_tokens = 1024 } = req.body;
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured on server" });
    try {
      const aiResponse = await axios.post(
        "https://api.anthropic.com/v1/messages",
        { model, max_tokens, messages: [{ role: "user", content: prompt }] },
        { headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" }, timeout: 60000 }
      );
      return res.json(aiResponse.data);
    } catch (err: any) {
      console.error("ERROR: Anthropic proxy failed:", err?.response?.data || err.message);
      return res.status(err?.response?.status || 500).json({ error: err?.response?.data?.error?.message || "AI generation failed" });
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
