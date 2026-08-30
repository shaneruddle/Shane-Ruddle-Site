import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import axios from "axios";
import cors from "cors";
import * as admin from "firebase-admin";
import { cert, initializeApp as initializeAdminApp, initializeApp as initializeRemoteApp, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { auditPracDataMapping, discoverPracData, findVehicles, getBookingSummary, getFleetStatus, getMonthlyFinances, getPayrollSummary, getRealtimePracData, inspectPracSchema, pracCapabilities } from "./server/pracService.ts";

dotenv.config();

// --- News Feed sources (Dashboard > Feed) ---
// Fixed whitelist rather than an arbitrary ?url= param, so this endpoint can't be used as an
// open proxy to fetch any URL on the server's behalf.
const RSS_FEED_SOURCES: Record<string, string> = {
  bbc: "http://feeds.bbci.co.uk/news/rss.xml",
  sky: "https://feeds.skynews.com/feeds/rss/home.xml",
  bangkokpost: "https://www.bangkokpost.com/rss/data/topstories.xml",
  pattayanews: "https://thepattayanews.com/feed/",
  // The Nation Thailand doesn't publish a working native RSS feed anymore, so this substitutes
  // a Google News search scoped to their site as an approximation of their coverage.
  nationthailand: "https://news.google.com/rss/search?q=site:nationthailand.com&hl=en-TH&gl=TH&ceid=TH:en",
};

// --- Remote Firebase app instances (initialised once) ---
function getRemoteApp(name: string, envVar: string): admin.app.App | null {
  try {
    return getApp(name) as unknown as admin.app.App;
  } catch {
    const raw = process.env[envVar];
    if (!raw) return null;
    try {
      // Support both raw JSON and base64-encoded JSON
      const json = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
      const credential = cert(JSON.parse(json));
      return initializeRemoteApp({ credential }, name) as unknown as admin.app.App;
    } catch (e) {
      console.error(`Failed to init Firebase app "${name}":`, e);
      return null;
    }
  }
}

// Cloud Run uses its attached service account for this project's Firebase Admin SDK.
// This app verifies website tokens and reads role records; PRAC data remains isolated in its remote app.
function getPrimaryAdminApp(): admin.app.App {
  try {
    return getApp() as unknown as admin.app.App;
  } catch {
    return initializeAdminApp() as unknown as admin.app.App;
  }
}

type PracPermission = 'operations' | 'financials';

async function requirePracAccess(req: express.Request, res: express.Response, permission: PracPermission) {
  const bearer = req.header('authorization');
  if (!bearer?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'A signed-in session is required.' });
    return null;
  }

  try {
    const primaryApp = getPrimaryAdminApp();
    const token = await getAuth(primaryApp as any).verifyIdToken(bearer.slice(7));
    const profile = (await getFirestore(primaryApp as any).collection('users').doc(token.uid).get()).data() || {};
    const roles = new Set<string>([
      ...(Array.isArray(profile.roles) ? profile.roles : []),
      ...(profile.role ? [profile.role] : []),
    ]);
    const isAdmin = roles.has('admin') || token.email?.toLowerCase() === 'shaneruddle@gmail.com';
    const isPracStaff = profile.company === 'Pattaya Rent a Car';
    const allowed = permission === 'financials'
      ? isAdmin || roles.has('accounts')
      : isAdmin || roles.has('manager') || roles.has('accounts') || isPracStaff;

    if (!allowed) {
      res.status(403).json({ error: 'You do not have permission to view this PRAC data.' });
      return null;
    }
    return { remoteApp: getRemoteApp('prac-admin', 'PRAC_SERVICE_ACCOUNT'), canViewFinancials: isAdmin || roles.has('accounts') };
  } catch (error) {
    console.error('PRAC access verification failed:', error);
    res.status(401).json({ error: 'Your session could not be verified.' });
    return null;
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors());
  app.use(express.json());

  app.get('/api/prac/capabilities', (_req, res) => {
    res.json(pracCapabilities);
  });

  app.get('/api/prac/fleet', async (req, res) => {
    const access = await requirePracAccess(req, res, 'operations');
    if (!access) return;
    if (!access.remoteApp) return res.status(503).json({ error: 'PRAC data is not configured.' });
    try {
      res.json(await getFleetStatus(getFirestore(access.remoteApp as any)));
    } catch (error) {
      console.error('PRAC fleet request failed:', error);
      res.status(502).json({ error: 'Unable to read fleet data from PRAC.' });
    }
  });

  app.get('/api/prac/vehicles', async (req, res) => {
    const access = await requirePracAccess(req, res, 'operations');
    if (!access || !access.remoteApp) return;
    try { res.json(await findVehicles(getFirestore(access.remoteApp as any), String(req.query.q || ''))); }
    catch { res.status(502).json({ error: 'Unable to search PRAC vehicles.' }); }
  });

  app.get('/api/prac/schema', async (req, res) => {
    const access = await requirePracAccess(req, res, 'financials');
    if (!access || !access.remoteApp) return;
    try { res.json(await inspectPracSchema(getFirestore(access.remoteApp as any))); }
    catch { res.status(502).json({ error: 'Unable to inspect the PRAC schema.' }); }
  });

  app.get('/api/prac/discovery', async (req, res) => {
    const access = await requirePracAccess(req, res, 'financials');
    if (!access || !access.remoteApp) return;
    try { res.json(await discoverPracData(getFirestore(access.remoteApp as any))); }
    catch { res.status(502).json({ error: 'Unable to inspect PRAC data.' }); }
  });

  app.get('/api/prac/mapping-audit', async (req, res) => {
    const access = await requirePracAccess(req, res, 'financials');
    if (!access || !access.remoteApp) return;
    try { res.json(await auditPracDataMapping(getFirestore(access.remoteApp as any))); }
    catch { res.status(502).json({ error: 'Unable to audit PRAC data sources.' }); }
  });

  app.get('/api/prac/finance/monthly', async (req, res) => {
    const access = await requirePracAccess(req, res, 'financials');
    if (!access) return;
    if (!access.remoteApp) return res.status(503).json({ error: 'PRAC data is not configured.' });
    try {
      res.json(await getMonthlyFinances(getFirestore(access.remoteApp as any), String(req.query.month || '')));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to read PRAC financial data.';
      res.status(message.includes('YYYY-MM') ? 400 : 502).json({ error: message });
    }
  });

  app.get('/api/prac/payroll/summary', async (req, res) => {
    const access = await requirePracAccess(req, res, 'financials');
    if (!access) return;
    if (!access.remoteApp) return res.status(503).json({ error: 'PRAC data is not configured.' });
    try {
      res.json(await getPayrollSummary(getFirestore(access.remoteApp as any), String(req.query.month || '')));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to read PRAC payroll data.';
      res.status(message.includes('YYYY-MM') ? 400 : 502).json({ error: message });
    }
  });

  app.post('/api/prac/assistant', async (req, res) => {
    const access = await requirePracAccess(req, res, 'operations');
    if (!access) return;
    const question = typeof req.body?.question === 'string' ? req.body.question.trim().slice(0, 2000) : '';
    if (!question) return res.status(400).json({ error: 'Ask a PRAC question first.' });
    if (!access.remoteApp) return res.status(503).json({ error: 'PRAC data is not configured.' });
    if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'The PRAC assistant is not configured.' });
    try {
      const db = getFirestore(access.remoteApp as any);
      const context: Record<string, unknown> = { fleet: await getFleetStatus(db), bookings: await getBookingSummary(db), discovery: await discoverPracData(db) };
      const response = await axios.post('https://api.openai.com/v1/responses', {
        model: 'gpt-4.1-mini', max_output_tokens: 500,
        instructions: 'You are Shane OS for Pattaya Rent a Car. Always respond in English unless the user explicitly asks for another language. Answer only from the supplied live data. Be concise and state which collection/field supports financial or booking answers. Use the discovery samples to identify balances and dates; never invent figures.',
        input: `Question: ${question}\n\nAuthorised live PRAC context:\n${JSON.stringify(context)}`,
      }, { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, timeout: 60000 });
      const answer = response.data?.output_text || response.data?.output
        ?.flatMap((item: any) => item.content || [])
        .map((item: any) => item.text || item.value || '')
        .filter(Boolean)
        .join('');
      res.json({ answer: answer || 'I could not form an answer.' });
    } catch (error: any) {
      console.error('PRAC assistant failed:', error?.response?.data || error?.message);
      res.status(error?.response?.status || 502).json({ error: error?.response?.data?.error?.message || 'The PRAC assistant could not answer right now.' });
    }
  });

  app.post('/api/prac/speech', async (req, res) => {
    const access = await requirePracAccess(req, res, 'operations');
    if (!access) return;
    const text = typeof req.body?.text === 'string' ? req.body.text.trim().slice(0, 4000) : '';
    if (!text || !process.env.OPENAI_API_KEY) return res.status(400).json({ error: 'Speech is not available.' });
    try {
      const audio = await axios.post('https://api.openai.com/v1/audio/speech', { model: 'gpt-4o-mini-tts', voice: 'maple', input: text, response_format: 'mp3' }, { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' }, responseType: 'arraybuffer', timeout: 60000 });
      res.setHeader('Content-Type', 'audio/mpeg');
      res.send(Buffer.from(audio.data));
    } catch (error: any) { res.status(error?.response?.status || 502).json({ error: 'OpenAI speech could not be generated.' }); }
  });

  app.post('/api/prac/realtime-session', async (req, res) => {
    const access = await requirePracAccess(req, res, 'operations');
    if (!access) return;
    try {
      if (!access.remoteApp) return res.status(503).json({ error: 'PRAC data is not configured.' });
      const db = getFirestore(access.remoteApp as any);
      const fleet = await getFleetStatus(db);
      // Realtime limits session instructions to 16k tokens. Keep the initial voice
      // context deliberately small; deeper questions belong to dedicated data tools.
      const context: Record<string, unknown> = { fleet: fleet.totals, bookings: (await getBookingSummary(db)).totals };
      const session = await axios.post('https://api.openai.com/v1/realtime/client_secrets', {
        session: {
          type: 'realtime', model: 'gpt-realtime', audio: { input: { transcription: { model: 'gpt-4o-mini-transcribe' } }, output: { voice: 'marin' } },
          instructions: `You are Shane OS for Pattaya Rent a Car. Always speak and respond in English, even if the user is in Thailand or uses a Thai or Japanese word. Switch language only if the user explicitly asks you to. Speak naturally and concisely. Before answering any question about fleet, bookings, finance, cash, bank, or balances, call get_prac_live_data. Only answer from the returned data and never invent figures. Snapshot: ${JSON.stringify(context)}`,
          tools: [{ type: 'function', name: 'get_prac_live_data', description: 'Read current authorised Pattaya Rent a Car data. Use this before answering fleet, booking, cash, bank, balance, income, expense, or finance questions.', parameters: { type: 'object', properties: { topic: { type: 'string', enum: ['fleet', 'bookings', 'finance'] }, query: { type: 'string', description: 'The customer question, used to select relevant finance fields.' } }, required: ['topic', 'query'], additionalProperties: false } }],
        },
      }, { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' } });
      res.json({ clientSecret: session.data?.value || session.data?.client_secret?.value });
    } catch (error: any) {
      console.error('OpenAI Realtime session failed:', error?.response?.data || error?.message);
      res.status(error?.response?.status || 502).json({ error: error?.response?.data?.error?.message || 'Unable to start voice mode.' });
    }
  });

  app.post('/api/prac/realtime-tool', async (req, res) => {
    const access = await requirePracAccess(req, res, 'operations');
    if (!access || !access.remoteApp) return;
    const topic = req.body?.topic;
    const query = typeof req.body?.query === 'string' ? req.body.query.slice(0, 1000) : '';
    if (!['fleet', 'bookings', 'finance'].includes(topic)) return res.status(400).json({ error: 'Unsupported PRAC data topic.' });
    if (topic === 'finance' && !access.canViewFinancials) return res.status(403).json({ error: 'You do not have permission to view PRAC financial data.' });
    try { res.json(await getRealtimePracData(getFirestore(access.remoteApp as any), topic, query)); }
    catch (error) { console.error('PRAC Realtime tool failed:', error); res.status(502).json({ error: 'Unable to read live PRAC data.' }); }
  });

  // Cross-project log aggregator
  app.get("/api/logs", async (req, res) => {
    const sources: { name: string; envVar: string; label: string; collections: string[] }[] = [
      { name: "prac-admin",  envVar: "PRAC_SERVICE_ACCOUNT",  label: "RENT A CAR", collections: ["system_logs"] },
      { name: "cajun-admin", envVar: "CAJUN_SERVICE_ACCOUNT", label: "CAJUN",      collections: ["system_logs"] },
    ];
    const results: Record<string, { logs: any[]; error: string | null }> = {};
    await Promise.all(sources.map(async ({ name, envVar, label, collections }) => {
      const remoteApp = getRemoteApp(name, envVar);
      if (!remoteApp) { results[label] = { logs: [], error: "Not configured" }; return; }
      try {
        const db = getFirestore(remoteApp as any);
        const snaps = await Promise.all(collections.map(col => db.collection(col).orderBy("timestamp", "desc").limit(50).get()));
        const logs = snaps.flatMap((snap, i) => snap.docs.map(doc => {
          const d = doc.data() as any;
          const col = collections[i];
          return {
            id: doc.id,
            ...d,
            source: label,
            collection: col,
            timestamp: d.timestamp || null,
            userName: d.userName || d.customerName || d.name || null,
            userEmail: d.userEmail || d.user || d.admin_email || d.email || null,
            type: d.type || d.action || d.action_type || d.status || col.replace(/_/g, ' '),
            details: d.details || d.description || null,
          };
        }));
        results[label] = { logs, error: null };
      } catch (e: any) {
        console.error(`Logs fetch failed for ${label}:`, e.message);
        results[label] = { logs: [], error: e.message.includes("PERMISSION_DENIED") ? "Access Denied" : e.message };
      }
    }));
    res.json(results);
  });

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

            // Try direct numeric ID lookup first
            try {
              const tpRes = await axios.get(`https://www.thaiproperty.com/api/v1/properties/${tpId}`, { timeout: 8000 });
              const candidate = tpRes.data?.data ?? tpRes.data;
              if (candidate?.reference) tpData = candidate;
            } catch {}

            // If direct lookup failed, search and validate by exact reference suffix
            // e.g. ?q=1398 returns many results; we only accept one whose reference is exactly ^[A-Z]+1398$
            // This correctly finds SRC1398 while rejecting RC13984, RH13980 etc.
            if (!tpData) {
              try {
                const searchRes = await axios.get(`https://www.thaiproperty.com/api/v1/properties?q=${tpId}&per_page=20`, { timeout: 8000 });
                const results: any[] = searchRes.data?.data || [];
                tpData = results.find((r: any) => r.reference && new RegExp(`^[A-Z]{1,5}${tpId}$`).test(r.reference)) ?? null;
              } catch {}
            }

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

  // Proxies a fixed whitelist of RSS feeds (see RSS_FEED_SOURCES above) so the browser can read
  // them without hitting CORS, and so news outlets never see this site's visitors directly.
  app.get("/api/rss-proxy", async (req, res) => {
    const source = req.query.source as string;
    const feedUrl = RSS_FEED_SOURCES[source];
    if (!feedUrl) {
      return res.status(400).json({ error: "Unknown feed source" });
    }
    try {
      // A generic browser UA rather than a self-identifying bot UA - some outlets' WordPress
      // security plugins reject anything that reads as a bot, even for their own public feed.
      const response = await axios.get(feedUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" },
        timeout: 10000,
      });
      res.set("Content-Type", "application/xml; charset=utf-8");
      res.set("Cache-Control", "public, max-age=300");
      res.send(response.data);
    } catch (error) {
      res.status(502).json({ error: "Failed to fetch feed" });
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
    const { prompt, model = "claude-sonnet-4-6", max_tokens = 1024 } = req.body;
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
