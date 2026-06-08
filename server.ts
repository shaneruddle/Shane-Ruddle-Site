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
  const PORT = Number(process.env.PORT) || 3000;

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

      // --- PRIMARY EXTRACTION: THAIPROPERTY.COM API ---
      if (url.includes('thaiproperty.com')) {
        // Extract numeric ID from URL e.g. /realestate/Some-Name_12345.html
        const tpIdMatch = url.match(/_(\d+)\.html/) || url.match(/\/(\d{4,})(?:\/|$|\?|#)/);
        const tpId = tpIdMatch?.[1];

        if (tpId) {
          try {
            let tpData: any = null;

            // Try direct reference lookup (e.g. RC16311) then fall back to keyword search
            try {
              const tpRes = await axios.get(`https://www.thaiproperty.com/api/v1/properties/${tpId}`, { timeout: 8000 });
              const candidate = tpRes.data?.data ?? tpRes.data;
              if (candidate?.reference) tpData = candidate;
            } catch {}

            // If direct lookup returned nothing, search by numeric ID (always unique per URL)
            if (!tpData) {
              const searchRes = await axios.get(`https://www.thaiproperty.com/api/v1/properties?q=${tpId}&per_page=1`, { timeout: 8000 });
              tpData = searchRes.data?.data?.[0] ?? null;
            }

            if (tpData) {
              // Extract images
              if (Array.isArray(tpData.images)) {
                tpData.images.forEach((img: any) => addImage(img.url));
              }

              // Map to the same bubbleMetadata shape the rest of the code expects
              bubbleMetadata = {
                "Listing Title":      tpData.name || "",
                "Main Website Ref":   tpData.reference || tpId,
                "Ref":                tpData.reference || tpId,
                "Eng description":    tpData.description || "",
                "Eng Description":    tpData.description || "",
                "Bedrooms":           tpData.bedrooms != null ? String(tpData.bedrooms) : "",
                "Bathrooms":          tpData.bathrooms != null ? String(tpData.bathrooms) : "",
                "Living Area":        tpData.house_sqm != null ? String(tpData.house_sqm) : "",
                "Land Area":          tpData.land_sqm  != null ? String(tpData.land_sqm)  : "",
                "Listing Price":      tpData.sale_price && tpData.sale_price > 0 ? String(tpData.sale_price) : "",
                "Rental Price":       tpData.rent_price && tpData.rent_price > 0 ? String(tpData.rent_price) : "",
                "Floor":              tpData.floor != null ? String(tpData.floor) : "",
                "Location":           tpData.location || "",
                "Sale Type":          tpData.for_sale && tpData.for_rent ? "Sale & Rent"
                                      : tpData.for_sale ? "Sale"
                                      : tpData.for_rent ? "Rent" : "",
                "Property Name":      tpData.name || "",
              };
            }
          } catch (tpErr: any) {
            console.error("ThaiProperty API failed:", tpErr.message);
          }
        }
      }

      // --- PRIMARY EXTRACTION: BUBBLE.IO API ---
      const refMatch = url.match(/([A-Za-z]{2,8}\d{2,10})/i);
      const refCode = refMatch ? refMatch[1].toUpperCase() : null;

      if (!bubbleMetadata && refCode && (html.includes("api/1.1/init/data") || url.includes("property"))) {
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
      let refNumber = refCode || 
                     bubbleMetadata?.["Ref"] || 
                     bubbleMetadata?.["Reference"] || 
                     bubbleMetadata?.["Main Website Ref"] || 
                     bubbleMetadata?.["Listing ID"] || 
                     "N/A";
      
      // Map API fields if available, else scrape.
      // When bubbleMetadata is set (API data fetched), trust it completely — empty string means the field is genuinely absent.
      // Only fall through to HTML scraping when no API data exists (!bubbleMetadata).
      const beds = bubbleMetadata?.["Bedrooms"] || bubbleMetadata?.["Beds"] ||
        (!bubbleMetadata ? htmlText.match(/(\d+)\s?(?:bed|bedroom)/i)?.[1] || "" : "");
      const baths = bubbleMetadata?.["Bathrooms"] || bubbleMetadata?.["Baths"] ||
        (!bubbleMetadata ? htmlText.match(/(\d+)\s?(?:bath|bathroom)/i)?.[1] || "" : "");
      // livingSize: require context keyword nearby, and block "30 SQM+" style filter options (trailing +)
      const livingSize = bubbleMetadata?.["Living Area"] || bubbleMetadata?.["Living Size"] || bubbleMetadata?.["Area Size"] || bubbleMetadata?.["Size"] ||
        (!bubbleMetadata ? (
          htmlText.match(/(?:living\s?area|internal\s?size|floor\s?area|unit\s?size)[^\d]*(\d+(?:,\d+)?(?:\.\d+)?)\s?(?:sqm|sq\.?\s?m|sq\s?ft|square\s?feet|m2|sq\s?meters)/i)?.[1] ||
          htmlText.match(/(\d+(?:,\d+)?(?:\.\d+)?)\s?(?:sqm|sq\.?\s?m|sq\s?ft|square\s?feet|m2|sq\s?meters)(?!\s*\+)/i)?.[1] || ""
        ) : "");
      const landSize = bubbleMetadata?.["Land Area"] || bubbleMetadata?.["Land Size"] || "";
      const sellingPrice = bubbleMetadata?.["Listing Price"] || bubbleMetadata?.["Price"] ||
        (!bubbleMetadata ? htmlText.match(/(?:selling\s?price|sale\s?price)\s*[:\-]?\s*(?:฿|THB|USD|\$)?\s*([\d,]+)/i)?.[1] || "" : "");
      const rentalPrice = bubbleMetadata?.["Rental Price"] ||
        (!bubbleMetadata ? htmlText.match(/(?:rental price|rent|rental)\s*[:\-]?\s*(?:฿|THB|USD|\$)?\s*([\d,]+)/i)?.[1] || "" : "");
      const priceVal = sellingPrice || rentalPrice || "";
      const isBubbleId = (val: any) => typeof val === 'string' && (/^\d+x\d+$/.test(val) || /^[0-9\-]+$/.test(val));
      let agent = bubbleMetadata?.["Assigned Agent"] || "";
      
      // If we got a Bubble ID, try to fetch the User object from the exposed User API
      if (agent && isBubbleId(agent)) {
        try {
          const parsedUrl = new URL(url);
          const userApiUrl = `${parsedUrl.origin}/api/1.1/obj/user/${agent}`;
          const token = process.env.BUBBLE_API_TOKEN;
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          
          const userResponse = await axios.get(userApiUrl, { headers, timeout: 5000 });
          const userItem = userResponse.data?.response;
          if (userItem) {
            // Priority: "First Name" field, then "Full Name" (split), then "Name"
            let firstName = userItem["First Name"] || userItem["first_name"] || userItem["FirstName"];
            if (!firstName) {
              const fullName = userItem["Full Name"] || userItem["full_name"] || userItem["Name"] || "";
              if (fullName) {
                firstName = fullName.split(' ')[0];
              }
            }

            // Extract Nickname
            const nickname = userItem["Nickname"] || userItem["nickname"] || userItem["Nick Name"];
            
            if (firstName) {
              agent = nickname ? `${firstName} (${nickname})` : firstName;
            } else if (nickname) {
              agent = nickname;
            }
          }
        } catch (err: any) {
          console.error(`Bubble User API fetch failed for ID ${agent}:`, err.message);
        }
      }
      
      // Fallback: If still a Bubble ID or empty, try finding names in the metadata or scraping
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
      let devLink = bubbleMetadata?.["Development Link"] || bubbleMetadata?.["Development"] || bubbleMetadata?.["Project"] || "";
      
      let devName = bubbleMetadata?.["Development Name"] || 
                    bubbleMetadata?.["Project Name"] || 
                    bubbleMetadata?.["Development_Name"] || 
                    bubbleMetadata?.["Property Name"] || 
                    "";

      // If development name is empty or just an ID, and we have a devLink that is a Bubble ID, try to resolve it
      if ((!devName || isBubbleId(devName)) && devLink && isBubbleId(devLink)) {
        try {
          const parsedUrl = new URL(url);
          // Try common development object types in Bubble
          const potentialTypes = ["development", "project", "condo"];
          const token = process.env.BUBBLE_API_TOKEN;
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          
          for (const type of potentialTypes) {
            try {
              const devApiUrl = `${parsedUrl.origin}/api/1.1/obj/${type}/${devLink}`;
              const devResponse = await axios.get(devApiUrl, { headers, timeout: 4000 });
              const devItem = devResponse.data?.response;
              if (devItem) {
                const fetchedName = devItem["Name"] || devItem["name"] || devItem["Development Name"] || devItem["Title"];
                if (fetchedName && !isBubbleId(fetchedName)) {
                  devName = fetchedName;
                  break;
                }
              }
            } catch (e) {
              // try next type
            }
          }
        } catch (err: any) {
          console.error(`Bubble Development API resolution failed:`, err.message);
        }
      }

      if (!devName || isBubbleId(devName)) {
        if (devLink && typeof devLink === 'string' && devLink.startsWith('http')) {
          try {
            const parts = devLink.split('/').filter(Boolean);
            // Try to find a part that isn't just numbers
            let namePart = "";
            for (let i = parts.length - 1; i >= 0; i--) {
              const part = parts[i];
              // If it contains letters, it's likely a name, not just an ID
              if (/[a-zA-Z]/.test(part)) {
                namePart = part;
                break;
              }
            }
            
            if (namePart) {
              devName = namePart.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            }
          } catch (e) {}
        } else if (devLink && !isBubbleId(devLink)) {
          devName = devLink;
        }
      }

      const customDescription = bubbleMetadata?.["Custom Description"] || bubbleMetadata?.["Internal Description"] || bubbleMetadata?.["Eng description"] || "";
      const floor = bubbleMetadata?.["Floor"] || bubbleMetadata?.["Floor Number"] || "";
      const furniture = bubbleMetadata?.["Furniture"] || bubbleMetadata?.["Furnished"] || "";
      const keys = bubbleMetadata?.["List of Keys"] || bubbleMetadata?.["Key held by who"] || "";

      res.json({
        images: images,
        meta: {
          title: bubbleMetadata?.["Listing Title"] || 
               ($('meta[property="og:title"]').attr('content') || 
                $('meta[name="title"]').attr('content') || 
                $('h1').first().text() || 
                $('title').text()).trim() || 
               "Property Listing",
          description: bubbleMetadata?.["Eng description"] || bubbleMetadata?.["Eng Description"] || bubbleMetadata?.["Listing Description"] || ($('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || "").trim(),
          engDescription: bubbleMetadata?.["Eng description"] || bubbleMetadata?.["Eng Description"] || "",
          refNumber,
          beds,
          baths,
          size: livingSize,
          livingSize,
          landSize,
          price: priceVal,
          sellingPrice,
          rentalPrice,
          agent,
          location,
          saleType,
          ownership,
          devLink,
          devName,
          customDescription,
          floor,
          furniture,
          keys
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
