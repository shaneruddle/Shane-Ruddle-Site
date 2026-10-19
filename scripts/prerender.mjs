// Writes a static HTML file for every public route after `vite build`, so search engines and
// social networks (which don't run JavaScript) see each page's real title, description,
// structured data and content. Also writes sitemap.xml and robots.txt.
//
// Articles come from the Firestore `blog` collection via the public REST API (the collection is
// world-readable per firestore.rules). If that fetch fails the build still succeeds without them.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const DIST = path.resolve("dist");
const SSR_ENTRY = path.resolve("dist-ssr/entry.js");
const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || "shane-ruddle-site";
const API_KEY = process.env.VITE_FIREBASE_API_KEY;

const ssr = await import(pathToFileURL(SSR_ENTRY).href);
const { PAGE_META, SITE_URL, DEFAULT_OG_IMAGE, personSchema, websiteSchema } = ssr;
const template = fs.readFileSync(path.join(DIST, "index.html"), "utf8");
// Untouched app shell for the SPA fallback (/portal, unknown paths, articles published after the last build).
fs.writeFileSync(path.join(DIST, "app.html"), template);

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const jsonLd = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>`;

// Framer Motion renders entrance-animation start states (opacity:0, offsets) inline on the server.
// Drop them so the static HTML is visible; the live app animates as normal once it loads.
function stripAnimationStyles(html) {
  return html.replace(/ style="([^"]*)"/g, (match, css) => {
    const kept = css
      .split(";")
      .map((d) => d.trim())
      .filter((d) => d && !/^(opacity|transform)\s*:/i.test(d));
    return kept.length ? ` style="${kept.join(";")}"` : "";
  });
}

function page({ urlPath, title, description, body, ogType = "website", image = DEFAULT_OG_IMAGE, schemas = [] }) {
  const canonical = SITE_URL + (urlPath === "/" ? "/" : urlPath);
  const head = [
    `<link rel="canonical" href="${esc(canonical)}" />`,
    `<meta property="og:site_name" content="Shane Ruddle" />`,
    `<meta property="og:type" content="${ogType}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(canonical)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta property="og:locale" content="en_GB" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
    ...schemas.map(jsonLd),
  ].join("\n    ");

  let html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(description)}" />`)
    .replace("</head>", `    ${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${stripAnimationStyles(body)}</div>`);
  if (!html.includes('<meta name="description"')) {
    html = html.replace("<title>", `<meta name="description" content="${esc(description)}" />\n    <title>`);
  }
  return html;
}

function write(urlPath, html) {
  const file = urlPath === "/" ? path.join(DIST, "index.html") : path.join(DIST, urlPath.slice(1), "index.html");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

// ---- Articles from Firestore ----
const str = (f) => f?.stringValue ?? "";
function plainText(md) {
  return md.replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[#>*_`~-]+/g, " ").replace(/\s+/g, " ").trim();
}
async function fetchArticles() {
  if (!API_KEY) {
    console.warn("prerender: VITE_FIREBASE_API_KEY not set — skipping articles.");
    return [];
  }
  const docs = [];
  let pageToken = "";
  do {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/blog?pageSize=300&key=${API_KEY}${pageToken ? `&pageToken=${pageToken}` : ""}`;
    // Browser API keys are often referrer-restricted to the site, so identify as it.
    const res = await fetch(url, { headers: { Referer: `${SITE_URL}/` } });
    if (!res.ok) throw new Error(`Firestore REST ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const json = await res.json();
    docs.push(...(json.documents || []));
    pageToken = json.nextPageToken || "";
  } while (pageToken);
  return docs
    .filter((d) => d.fields?.published?.booleanValue === true)
    .map((d) => {
      const f = d.fields;
      const id = d.name.split("/").pop();
      const body = str(f.body);
      const desc = str(f.metaDescription) || plainText(body).slice(0, 155).replace(/\s+\S*$/, "") + "…";
      return {
        slug: str(f.slug) || id,
        title: str(f.title),
        description: desc,
        body,
        category: str(f.category),
        imageUrl: str(f.imageUrl),
        authorName: str(f.authorName),
        createdAt: f.createdAt?.timestampValue,
        updatedAt: f.updatedAt?.timestampValue || f.createdAt?.timestampValue,
      };
    })
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

let articles = [];
try {
  articles = await fetchArticles();
} catch (err) {
  console.warn("prerender: could not fetch articles —", err.message);
}
// Articles committed as files (content/articles/*.md) take precedence over Firestore posts with the same slug.
const fileArticles = ssr.FILE_ARTICLES.map((a) => ({
  slug: a.slug,
  title: a.title,
  description: a.description,
  body: a.body,
  category: a.category,
  imageUrl: a.image ? (a.image.startsWith("/") ? SITE_URL + a.image : a.image) : "",
  authorName: "Shane Ruddle",
  createdAt: `${a.date}T00:00:00+07:00`,
  updatedAt: `${a.date}T00:00:00+07:00`,
}));
const fileSlugs = new Set(fileArticles.map((a) => a.slug));
articles = [...fileArticles, ...articles.filter((a) => !fileSlugs.has(a.slug))]
  .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

// ---- Pages ----
const urls = [];
for (const urlPath of ssr.PAGE_PATHS) {
  const meta = PAGE_META[urlPath];
  const schemas =
    urlPath === "/"
      ? [personSchema(), websiteSchema()]
      : urlPath === "/about"
        ? [{ "@context": "https://schema.org", "@type": "ProfilePage", url: `${SITE_URL}/about`, mainEntity: personSchema() }]
        : [];
  write(urlPath, page({ urlPath, ...meta, body: ssr.renderPage(urlPath), ogType: urlPath === "/about" ? "profile" : "website", schemas }));
  if (!["/privacy", "/terms"].includes(urlPath)) urls.push({ loc: urlPath });
}

write("/articles", page({ urlPath: "/articles", ...PAGE_META["/articles"], body: ssr.renderArticleList(articles) }));
urls.push({ loc: "/articles", lastmod: articles[0]?.updatedAt });

for (const a of articles) {
  const urlPath = `/articles/${a.slug}`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: a.title,
    description: a.description,
    url: SITE_URL + urlPath,
    mainEntityOfPage: SITE_URL + urlPath,
    ...(a.imageUrl ? { image: a.imageUrl } : {}),
    ...(a.createdAt ? { datePublished: a.createdAt } : {}),
    ...(a.updatedAt ? { dateModified: a.updatedAt } : {}),
    author: { "@type": "Person", "@id": `${SITE_URL}/#person`, name: "Shane Ruddle", url: SITE_URL },
    publisher: { "@type": "Person", "@id": `${SITE_URL}/#person`, name: "Shane Ruddle" },
  };
  write(urlPath, page({
    urlPath,
    title: `${a.title} | Shane Ruddle`,
    description: a.description,
    body: ssr.renderArticle(a),
    ogType: "article",
    image: a.imageUrl || DEFAULT_OG_IMAGE,
    schemas: [schema],
  }));
  urls.push({ loc: urlPath, lastmod: a.updatedAt });
}

// ---- sitemap.xml + robots.txt ----
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${esc(SITE_URL + u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod.slice(0, 10)}</lastmod>` : ""}</url>`).join("\n")}
</urlset>
`;
fs.writeFileSync(path.join(DIST, "sitemap.xml"), sitemap);
fs.writeFileSync(
  path.join(DIST, "robots.txt"),
  `User-agent: *\nAllow: /\nDisallow: /portal\nDisallow: /api/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`
);

console.log(`prerender: wrote ${ssr.PAGE_PATHS.length + 1 + articles.length} pages, sitemap with ${urls.length} URLs.`);
