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

// Unknown paths get a real 404 (Firebase Hosting serves 404.html with a 404 status) instead of the
// app shell, so Google doesn't index mistyped URLs as copies of the homepage. Static on purpose:
// no app script, so the router can't swap it for the homepage.
fs.writeFileSync(
  path.join(DIST, "404.html"),
  template
    .replace(/<title>[\s\S]*?<\/title>/, "<title>Page not found | Shane Ruddle</title>")
    .replace(/<meta name="description"[^>]*>/, "")
    .replace("</head>", '  <meta name="robots" content="noindex" />\n  </head>')
    .replace(/<script\b[^>]*type="module"[^>]*><\/script>\s*/g, "")
    .replace(
      '<div id="root"></div>',
      `<div id="root"><main style="max-width:40rem;margin:6rem auto;padding:0 1.5rem;font-family:system-ui,sans-serif;line-height:1.6">
<h1 style="font-size:2rem;margin-bottom:1rem">Page not found</h1>
<p>That page doesn't exist, or it has moved.</p>
<p><a href="/">Home</a> · <a href="/guides">Start here</a> · <a href="/articles">Articles</a> · <a href="/questions">Questions</a> · <a href="/contact">Contact</a></p>
</main></div>`,
    ),
);

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

// English pages with a German twin, and every German page, list both versions (hreflang).
function alternatesFor(urlPath) {
  const en = ssr.DE_TO_EN[urlPath] ?? (ssr.EN_TO_DE[urlPath] ? urlPath : null);
  const de = ssr.EN_TO_DE[urlPath] ?? (ssr.DE_TO_EN[urlPath] ? urlPath : null);
  if (!en || !de) return [];
  return [["en", en], ["de", de], ["x-default", en]];
}

function page({ urlPath, title: fullTitle, description: fullDescription, body, ogType = "website", image = DEFAULT_OG_IMAGE, schemas = [], lang = "en" }) {
  const title = ssr.fitTitle(fullTitle);
  const description = ssr.fitDescription(fullDescription);
  const canonical = SITE_URL + (urlPath === "/" ? "/" : urlPath);
  const alternates = alternatesFor(urlPath);
  const head = [
    ...alternates.map(([hl, p]) => `<link rel="alternate" hreflang="${hl}" href="${esc(SITE_URL + (p === "/" ? "/" : p))}" />`),
    `<link rel="canonical" href="${esc(canonical)}" />`,
    `<meta property="og:site_name" content="Shane Ruddle" />`,
    `<meta property="og:type" content="${ogType}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(canonical)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta property="og:locale" content="${lang === "de" ? "de_DE" : "en_GB"}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
    `<link rel="alternate" type="application/rss+xml" title="Shane Ruddle — Articles" href="${SITE_URL}/rss.xml" />`,
    ...schemas.map(jsonLd),
  ].join("\n    ");

  let html = template
    .replace('<html lang="en">', `<html lang="${lang}">`)
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
  seoTitle: a.seoTitle,
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
        : urlPath === ssr.CALCULATOR_PATH
          ? [
              {
                "@context": "https://schema.org",
                "@type": "WebApplication",
                name: "Pattaya Cost of Living Calculator",
                url: SITE_URL + urlPath,
                description: meta.description,
                applicationCategory: "FinanceApplication",
                operatingSystem: "Any",
                offers: { "@type": "Offer", price: "0", priceCurrency: "THB" },
                author: { "@type": "Person", "@id": `${SITE_URL}/#person`, name: "Shane Ruddle", url: SITE_URL },
              },
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: ssr.CALCULATOR_FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
              },
            ]
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
    title: `${a.seoTitle || a.title} | Shane Ruddle`,
    description: a.description,
    body: ssr.renderArticle(a),
    ogType: "article",
    image: a.imageUrl || DEFAULT_OG_IMAGE,
    schemas: [schema, {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Articles", item: `${SITE_URL}/articles` },
        { "@type": "ListItem", position: 3, name: a.title, item: SITE_URL + urlPath },
      ],
    }],
  }));
  urls.push({ loc: urlPath, lastmod: a.updatedAt });
}

// ---- "Start here" guides ----
const crumbs = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, item], i) => ({ "@type": "ListItem", position: i + 1, name, item: SITE_URL + item })),
});
write("/guides", page({
  urlPath: "/guides",
  ...ssr.GUIDES_META,
  body: ssr.renderGuide("/guides"),
  schemas: [crumbs([["Home", "/"], ["Start here", "/guides"]])],
}));
urls.push({ loc: "/guides" });
for (const g of ssr.GUIDES) {
  const urlPath = `/guides/${g.slug}`;
  write(urlPath, page({
    urlPath,
    title: g.metaTitle,
    description: g.description,
    body: ssr.renderGuide(urlPath),
    schemas: [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: g.title,
        description: g.description,
        url: SITE_URL + urlPath,
        mainEntityOfPage: SITE_URL + urlPath,
        image: DEFAULT_OG_IMAGE,
        author: { "@type": "Person", "@id": `${SITE_URL}/#person`, name: "Shane Ruddle", url: SITE_URL },
        publisher: { "@type": "Person", "@id": `${SITE_URL}/#person`, name: "Shane Ruddle" },
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: g.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
      crumbs([["Home", "/"], ["Start here", "/guides"], [g.name, urlPath]]),
    ],
  }));
  urls.push({ loc: urlPath });
}

// ---- Pattaya areas ----
const faqSchema = (faqs) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
});
write("/areas", page({
  urlPath: "/areas",
  ...ssr.AREAS_META,
  body: ssr.renderAreas("/areas"),
  schemas: [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Areas to live in Pattaya",
      itemListElement: ssr.AREAS.map((a, i) => ({ "@type": "ListItem", position: i + 1, name: a.name, url: `${SITE_URL}/areas/${a.slug}` })),
    },
    faqSchema(ssr.AREAS_FAQS),
    crumbs([["Home", "/"], ["Areas", "/areas"]]),
  ],
}));
urls.push({ loc: "/areas" });
for (const a of ssr.AREAS) {
  const urlPath = `/areas/${a.slug}`;
  write(urlPath, page({
    urlPath,
    title: a.metaTitle,
    description: a.description,
    body: ssr.renderAreas(urlPath),
    schemas: [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: `Living in ${a.name}, Pattaya`,
        description: a.description,
        url: SITE_URL + urlPath,
        mainEntityOfPage: SITE_URL + urlPath,
        image: DEFAULT_OG_IMAGE,
        about: { "@type": "Place", name: `${a.name}, Pattaya`, containedInPlace: { "@type": "City", name: "Pattaya" } },
        author: { "@type": "Person", "@id": `${SITE_URL}/#person`, name: "Shane Ruddle", url: SITE_URL },
        publisher: { "@type": "Person", "@id": `${SITE_URL}/#person`, name: "Shane Ruddle" },
      },
      faqSchema(a.faqs),
      crumbs([["Home", "/"], ["Areas", "/areas"], [a.name, urlPath]]),
    ],
  }));
  urls.push({ loc: urlPath });
}

// ---- Thai visas ----
write(ssr.VISAS_PATH, page({
  urlPath: ssr.VISAS_PATH,
  ...ssr.VISAS_META,
  body: ssr.renderVisas(ssr.VISAS_PATH),
  schemas: [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Thai Visa Finder",
      url: SITE_URL + ssr.VISAS_PATH,
      description: ssr.VISAS_META.description,
      applicationCategory: "TravelApplication",
      operatingSystem: "Any",
      offers: { "@type": "Offer", price: "0", priceCurrency: "THB" },
      author: { "@type": "Person", "@id": `${SITE_URL}/#person`, name: "Shane Ruddle", url: SITE_URL },
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Thai visas for living in Pattaya",
      itemListElement: ssr.VISAS.map((v, i) => ({ "@type": "ListItem", position: i + 1, name: v.name, url: `${SITE_URL}${ssr.VISAS_PATH}/${v.slug}` })),
    },
    faqSchema(ssr.VISAS_FAQS),
    crumbs([["Home", "/"], ["Thai visas", ssr.VISAS_PATH]]),
  ],
}));
urls.push({ loc: ssr.VISAS_PATH });
for (const v of ssr.VISAS) {
  const urlPath = `${ssr.VISAS_PATH}/${v.slug}`;
  write(urlPath, page({
    urlPath,
    title: v.metaTitle,
    description: v.description,
    body: ssr.renderVisas(urlPath),
    schemas: [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: `${v.name}: ${v.official}`,
        description: v.description,
        url: SITE_URL + urlPath,
        mainEntityOfPage: SITE_URL + urlPath,
        image: DEFAULT_OG_IMAGE,
        author: { "@type": "Person", "@id": `${SITE_URL}/#person`, name: "Shane Ruddle", url: SITE_URL },
        publisher: { "@type": "Person", "@id": `${SITE_URL}/#person`, name: "Shane Ruddle" },
      },
      faqSchema(v.faqs),
      crumbs([["Home", "/"], ["Thai visas", ssr.VISAS_PATH], [v.name, urlPath]]),
    ],
  }));
  urls.push({ loc: urlPath });
}

// ---- Real questions, answered ----
write(ssr.QUESTIONS_PATH, page({
  urlPath: ssr.QUESTIONS_PATH,
  ...ssr.QUESTIONS_META,
  body: ssr.renderQuestions(ssr.QUESTIONS_PATH),
  schemas: [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Pattaya questions, answered by Shane Ruddle",
      url: SITE_URL + ssr.QUESTIONS_PATH,
      description: ssr.QUESTIONS_META.description,
      author: { "@type": "Person", "@id": `${SITE_URL}/#person`, name: "Shane Ruddle", url: SITE_URL },
      mainEntity: {
        "@type": "ItemList",
        itemListElement: ssr.QUESTIONS.map((q, i) => ({ "@type": "ListItem", position: i + 1, name: q.q, url: `${SITE_URL}${ssr.QUESTIONS_PATH}/${q.slug}` })),
      },
    },
    crumbs([["Home", "/"], ["Questions", ssr.QUESTIONS_PATH]]),
  ],
}));
urls.push({ loc: ssr.QUESTIONS_PATH });
for (const q of ssr.QUESTIONS) {
  const urlPath = `${ssr.QUESTIONS_PATH}/${q.slug}`;
  const shane = { "@type": "Person", "@id": `${SITE_URL}/#person`, name: "Shane Ruddle", url: SITE_URL };
  write(urlPath, page({
    urlPath,
    ...ssr.questionMeta(q),
    body: ssr.renderQuestions(urlPath),
    schemas: [
      // Written by the site owner with no user-submitted answers, so FAQPage (not QAPage) per Google's guidance.
      faqSchema([{ q: q.q, a: [q.short, ...q.answer].join(" ") }]),
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        url: SITE_URL + urlPath,
        name: q.q,
        author: shane,
      },
      crumbs([["Home", "/"], ["Questions", ssr.QUESTIONS_PATH], [q.q, urlPath]]),
    ],
  }));
  urls.push({ loc: urlPath });
}

// ---- Move planner ----
write(ssr.MOVE_PATH, page({
  urlPath: ssr.MOVE_PATH,
  ...ssr.MOVE_META,
  body: ssr.renderMove(),
  schemas: [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Moving to Thailand Planner",
      url: SITE_URL + ssr.MOVE_PATH,
      description: ssr.MOVE_META.description,
      applicationCategory: "TravelApplication",
      operatingSystem: "Any",
      offers: { "@type": "Offer", price: "0", priceCurrency: "THB" },
      author: { "@type": "Person", "@id": `${SITE_URL}/#person`, name: "Shane Ruddle", url: SITE_URL },
    },
    faqSchema(ssr.MOVE_FAQS),
    crumbs([["Home", "/"], ["Moving to Thailand", ssr.MOVE_PATH]]),
  ],
}));
urls.push({ loc: ssr.MOVE_PATH });

// ---- Business reality check ----
write(ssr.BUSINESS_PATH, page({
  urlPath: ssr.BUSINESS_PATH,
  ...ssr.BUSINESS_META,
  body: ssr.renderBusiness(),
  schemas: [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Pattaya Business Reality Check",
      url: SITE_URL + ssr.BUSINESS_PATH,
      description: ssr.BUSINESS_META.description,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Any",
      offers: { "@type": "Offer", price: "0", priceCurrency: "THB" },
      author: { "@type": "Person", "@id": `${SITE_URL}/#person`, name: "Shane Ruddle", url: SITE_URL },
    },
    faqSchema(ssr.BUSINESS_FAQS),
    crumbs([["Home", "/"], ["Business in Pattaya", ssr.BUSINESS_PATH]]),
  ],
}));
urls.push({ loc: ssr.BUSINESS_PATH });

// ---- Working in Pattaya ----
write(ssr.WORK_PATH, page({
  urlPath: ssr.WORK_PATH,
  ...ssr.WORK_META,
  body: ssr.renderWork(),
  schemas: [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Working in Pattaya as a Foreigner",
      url: SITE_URL + ssr.WORK_PATH,
      description: ssr.WORK_META.description,
      author: { "@type": "Person", "@id": `${SITE_URL}/#person`, name: "Shane Ruddle", url: SITE_URL },
    },
    faqSchema(ssr.WORK_FAQS),
    crumbs([["Home", "/"], ["Working in Pattaya", ssr.WORK_PATH]]),
  ],
}));
urls.push({ loc: ssr.WORK_PATH });

// ---- Fair price checker ----
write(ssr.PRICES_PATH, page({
  urlPath: ssr.PRICES_PATH,
  ...ssr.PRICES_META,
  body: ssr.renderPrices(),
  schemas: [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Pattaya Fair Price Checker",
      url: SITE_URL + ssr.PRICES_PATH,
      description: ssr.PRICES_META.description,
      applicationCategory: "TravelApplication",
      operatingSystem: "Any",
      offers: { "@type": "Offer", price: "0", priceCurrency: "THB" },
      author: { "@type": "Person", "@id": `${SITE_URL}/#person`, name: "Shane Ruddle", url: SITE_URL },
    },
    faqSchema(ssr.PRICES_FAQS),
    crumbs([["Home", "/"], ["Pattaya prices", ssr.PRICES_PATH]]),
  ],
}));
urls.push({ loc: ssr.PRICES_PATH });

// ---- Pattaya's future (development timeline) ----
write(ssr.FUTURE_PATH, page({
  urlPath: ssr.FUTURE_PATH,
  ...ssr.FUTURE_META,
  body: ssr.renderFuture(),
  schemas: [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "What's really being built in Pattaya, and what it means for you",
      url: SITE_URL + ssr.FUTURE_PATH,
      description: ssr.FUTURE_META.description,
      dateModified: "2026-11-04",
      author: { "@type": "Person", "@id": `${SITE_URL}/#person`, name: "Shane Ruddle", url: SITE_URL },
    },
    faqSchema(ssr.FUTURE_FAQS),
    crumbs([["Home", "/"], ["Pattaya's future", ssr.FUTURE_PATH]]),
  ],
}));
urls.push({ loc: ssr.FUTURE_PATH });

// ---- Buying a business (chapter of the business check) ----
write(ssr.BUYING_PATH, page({
  urlPath: ssr.BUYING_PATH,
  ...ssr.BUYING_META,
  body: ssr.renderBuying(),
  schemas: [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Pattaya Business Deal Checker",
      url: SITE_URL + ssr.BUYING_PATH,
      description: ssr.BUYING_META.description,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Any",
      offers: { "@type": "Offer", price: "0", priceCurrency: "THB" },
      author: { "@type": "Person", "@id": `${SITE_URL}/#person`, name: "Shane Ruddle", url: SITE_URL },
    },
    faqSchema(ssr.BUYING_FAQS),
    crumbs([["Home", "/"], ["Business in Pattaya", ssr.BUSINESS_PATH], ["Buying a business", ssr.BUYING_PATH]]),
  ],
}));
urls.push({ loc: ssr.BUYING_PATH });

// ---- Selling a business (landing page in the business chapter) ----
write(ssr.SELL_PATH, page({
  urlPath: ssr.SELL_PATH,
  ...ssr.SELL_META,
  body: ssr.renderSell(),
  schemas: [
    faqSchema(ssr.SELL_FAQS),
    crumbs([["Home", "/"], ["Business in Pattaya", ssr.BUSINESS_PATH], ["Sell your business", ssr.SELL_PATH]]),
  ],
}));
urls.push({ loc: ssr.SELL_PATH });

// ---- International schools ----
write(ssr.SCHOOLS_PATH, page({
  urlPath: ssr.SCHOOLS_PATH,
  ...ssr.SCHOOLS_META,
  body: ssr.renderSchools(ssr.SCHOOLS_PATH),
  schemas: [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Pattaya International School Chooser",
      url: SITE_URL + ssr.SCHOOLS_PATH,
      description: ssr.SCHOOLS_META.description,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Any",
      offers: { "@type": "Offer", price: "0", priceCurrency: "THB" },
      author: { "@type": "Person", "@id": `${SITE_URL}/#person`, name: "Shane Ruddle", url: SITE_URL },
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "International schools around Pattaya",
      itemListElement: ssr.SCHOOLS.map((s, i) => ({ "@type": "ListItem", position: i + 1, name: s.name, url: `${SITE_URL}${ssr.SCHOOLS_PATH}/${s.slug}` })),
    },
    faqSchema(ssr.SCHOOLS_FAQS),
    crumbs([["Home", "/"], ["International schools", ssr.SCHOOLS_PATH]]),
  ],
}));
urls.push({ loc: ssr.SCHOOLS_PATH });
for (const s of ssr.SCHOOLS) {
  const urlPath = `${ssr.SCHOOLS_PATH}/${s.slug}`;
  write(urlPath, page({
    urlPath,
    title: s.metaTitle,
    description: s.description,
    body: ssr.renderSchools(urlPath),
    schemas: [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: `${s.name}: fees, curriculum and school run`,
        description: s.description,
        url: SITE_URL + urlPath,
        mainEntityOfPage: SITE_URL + urlPath,
        image: DEFAULT_OG_IMAGE,
        about: { "@type": "School", name: s.name, ...(s.website ? { url: s.website.replace(/^(https:\/\/[^/]+).*/, "$1") } : {}) },
        author: { "@type": "Person", "@id": `${SITE_URL}/#person`, name: "Shane Ruddle", url: SITE_URL },
        publisher: { "@type": "Person", "@id": `${SITE_URL}/#person`, name: "Shane Ruddle" },
      },
      faqSchema(ssr.faqsForSchool(s)),
      crumbs([["Home", "/"], ["International schools", ssr.SCHOOLS_PATH], [s.name, urlPath]]),
    ],
  }));
  urls.push({ loc: urlPath });
}

// ---- German edition (/de) ----
const author = { "@type": "Person", "@id": `${SITE_URL}/#person`, name: "Shane Ruddle", url: SITE_URL };
const deCrumbs = (items) => crumbs([["Startseite", ssr.DE_HOME], ...items]);
const deFaq = (faqs) => ({ ...faqSchema(faqs), inLanguage: "de" });
const writeDe = (urlPath, meta, schemas = [], extra = {}) => {
  write(urlPath, page({ urlPath, ...meta, body: ssr.renderDe(urlPath), schemas, lang: "de", ...extra }));
  urls.push({ loc: urlPath, ...(extra.lastmod ? { lastmod: extra.lastmod } : {}) });
};
writeDe(ssr.DE_HOME, ssr.DE_PAGE_META[ssr.DE_HOME], [{ ...websiteSchema(), inLanguage: "de" }]);
writeDe(ssr.DE_ARTICLES, ssr.DE_PAGE_META[ssr.DE_ARTICLES], [deCrumbs([["Artikel", ssr.DE_ARTICLES]])]);
writeDe(ssr.DE_CALCULATOR, ssr.DE_PAGE_META[ssr.DE_CALCULATOR], [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Lebenshaltungskosten-Rechner Pattaya",
    url: SITE_URL + ssr.DE_CALCULATOR,
    inLanguage: "de",
    description: ssr.DE_PAGE_META[ssr.DE_CALCULATOR].description,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    author,
  },
  deFaq(ssr.CALCULATOR_FAQS_DE),
  deCrumbs([["Lebenshaltungskosten-Rechner", ssr.DE_CALCULATOR]]),
]);
writeDe(ssr.DE_MOVING, ssr.DE_PAGE_META[ssr.DE_MOVING], [
  { "@context": "https://schema.org", "@type": "Article", headline: "Auswandern nach Pattaya: mein Ratgeber nach 20 Jahren", inLanguage: "de", description: ssr.DE_PAGE_META[ssr.DE_MOVING].description, url: SITE_URL + ssr.DE_MOVING, mainEntityOfPage: SITE_URL + ssr.DE_MOVING, image: DEFAULT_OG_IMAGE, author, publisher: author },
  deFaq(ssr.DE_MOVING_FAQS),
  deCrumbs([["Auswandern nach Pattaya", ssr.DE_MOVING]]),
]);
writeDe(ssr.DE_AREAS, ssr.DE_PAGE_META[ssr.DE_AREAS], [
  { "@context": "https://schema.org", "@type": "ItemList", name: "Wohngegenden in Pattaya", inLanguage: "de", itemListElement: ssr.DE_AREA_LIST.map((a, i) => ({ "@type": "ListItem", position: i + 1, name: a.name, url: `${SITE_URL}${ssr.DE_AREAS}#${a.id}` })) },
  deCrumbs([["Wohngegenden", ssr.DE_AREAS]]),
]);
writeDe(ssr.VISAS_PATH_DE, ssr.VISAS_META_DE, [
  { "@context": "https://schema.org", "@type": "WebApplication", name: "Thailand Visum-Finder", url: SITE_URL + ssr.VISAS_PATH_DE, inLanguage: "de", description: ssr.VISAS_META_DE.description, applicationCategory: "TravelApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" }, author },
  deFaq(ssr.VISAS_FAQS_DE),
  deCrumbs([["Thailand-Visum", ssr.VISAS_PATH_DE]]),
]);
for (const v of ssr.VISAS_DE) {
  const urlPath = `${ssr.VISAS_PATH_DE}/${v.slug}`;
  writeDe(urlPath, { title: v.metaTitle, description: v.description }, [
    { "@context": "https://schema.org", "@type": "Article", headline: `${v.name}: ${v.official}`, inLanguage: "de", description: v.description, url: SITE_URL + urlPath, mainEntityOfPage: SITE_URL + urlPath, image: DEFAULT_OG_IMAGE, author, publisher: author },
    deFaq(v.faqs),
    deCrumbs([["Thailand-Visum", ssr.VISAS_PATH_DE], [v.name, urlPath]]),
  ]);
}
for (const a of ssr.DE_ARTICLE_LIST) {
  const urlPath = `${ssr.DE_ARTICLES}/${a.slug}`;
  const image = a.image ? (a.image.startsWith("/") ? SITE_URL + a.image : a.image) : DEFAULT_OG_IMAGE;
  const date = `${a.date}T00:00:00+07:00`;
  writeDe(urlPath, { title: `${a.title} | Shane Ruddle`, description: a.description }, [
    { "@context": "https://schema.org", "@type": "BlogPosting", headline: a.title, inLanguage: "de", description: a.description, url: SITE_URL + urlPath, mainEntityOfPage: SITE_URL + urlPath, image, datePublished: date, dateModified: date, author, publisher: author, ...(a.en ? { translationOfWork: { "@id": `${SITE_URL}/articles/${a.en}` } } : {}) },
    deCrumbs([["Artikel", ssr.DE_ARTICLES], [a.title, urlPath]]),
  ], { ogType: "article", image, lastmod: date });
}

// ---- rss.xml (latest articles, for feed readers and newsletter tools) ----
const rssDate = (iso) => (iso ? new Date(iso).toUTCString() : "");
const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Shane Ruddle — Articles</title>
    <link>${SITE_URL}/articles</link>
    <description>${esc(PAGE_META["/articles"].description)}</description>
    <language>en-gb</language>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
${articles.slice(0, 50).map((a) => `    <item>
      <title>${esc(a.title)}</title>
      <link>${SITE_URL}/articles/${esc(a.slug)}</link>
      <guid isPermaLink="true">${SITE_URL}/articles/${esc(a.slug)}</guid>
      <description>${esc(a.description)}</description>
      ${a.category ? `<category>${esc(a.category)}</category>` : ""}
      ${a.createdAt ? `<pubDate>${rssDate(a.createdAt)}</pubDate>` : ""}
    </item>`).join("\n")}
  </channel>
</rss>
`;
fs.writeFileSync(path.join(DIST, "rss.xml"), rss);

// ---- sitemap.xml + robots.txt ----
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.map((u) => `  <url><loc>${esc(SITE_URL + u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod.slice(0, 10)}</lastmod>` : ""}${alternatesFor(u.loc).map(([hl, p]) => `<xhtml:link rel="alternate" hreflang="${hl}" href="${esc(SITE_URL + (p === "/" ? "/" : p))}"/>`).join("")}</url>`).join("\n")}
</urlset>
`;
fs.writeFileSync(path.join(DIST, "sitemap.xml"), sitemap);
fs.writeFileSync(
  path.join(DIST, "robots.txt"),
  `User-agent: *\nAllow: /\nDisallow: /portal\nDisallow: /api/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`
);

console.log(`prerender: German edition ${5 + ssr.VISAS_DE.length + 1 + ssr.DE_ARTICLE_LIST.length} pages.`);
console.log(`prerender: wrote ${ssr.PAGE_PATHS.length + 3 + ssr.GUIDES.length + ssr.AREAS.length + 1 + ssr.VISAS.length + 1 + ssr.SCHOOLS.length + articles.length} pages, sitemap with ${urls.length} URLs.`);
