// Page titles, descriptions and structured data for the public site.
// Used by the build-time prerender (static HTML for search engines and social previews)
// and by the app at runtime to keep document.title in sync when navigating.

export const SITE_URL = "https://shaneruddle.com";
export const SITE_NAME = "Shane Ruddle";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/og-shane-ruddle.jpg`;

export interface PageMeta {
  title: string;
  description: string;
}

export const PAGE_META: Record<string, PageMeta> = {
  "/": {
    title: "Shane Ruddle — Pattaya Business Owner and Writer",
    description:
      "I own seven businesses in Pattaya across property, hospitality and car rental, and write about what 20 years of doing business in Thailand has taught me.",
  },
  "/about": {
    title: "About Shane Ruddle — Pattaya Entrepreneur Since 2007",
    description:
      "From PGA professional golfer to owner of seven Pattaya businesses across property, hospitality and car rental. Shane Ruddle's story and milestones.",
  },
  "/businesses": {
    title: "Businesses — Real Estate, Hospitality & Car Rental in Pattaya | Shane Ruddle",
    description:
      "Alan Bolton Property Consultants, East Coast Real Estate (The Best Agent in Pattaya 2026), Hemingways Jomtien, Pattaya and Lakeside, Cajun Life Cafe and Pattaya Rent a Car.",
  },
  "/articles": {
    title: "Articles — Property, Business & Life in Pattaya | Shane Ruddle",
    description:
      "Practical articles from Shane Ruddle on buying property in Pattaya, running a business in Thailand, car rental and living on the Eastern Seaboard.",
  },
  "/guides": {
    title: "Pattaya Guides: Moving, Families, Property and Business",
    description:
      "Four guides from 20 years in Pattaya: moving here, raising a family, buying property as a foreigner, and starting or buying a business.",
  },
  "/cost-of-living-calculator": {
    title: "Cost of Living in Pattaya 2026: Calculator for Your Monthly Budget | Shane Ruddle",
    description:
      "How much does it cost to live in Pattaya? Pick your area, home, food and schools and get a monthly budget in baht, £, $, €, A$ or ₽, from a 20-year Pattaya resident.",
  },
  "/newsletter": {
    title: "Newsletter — What Actually Works in Pattaya | Shane Ruddle",
    description:
      "A short weekly email on Pattaya property, business and life from Shane Ruddle, owner of seven Pattaya businesses. Free, no spam.",
  },
  "/contact": {
    title: "Contact Shane Ruddle — Partnerships, Investment & Press",
    description: "Get in touch with Shane Ruddle about partnerships, investment, press or speaking in Pattaya, Thailand.",
  },
  "/past-ventures": {
    title: "Past Ventures — Shane Ruddle",
    description:
      "Every business Shane Ruddle has built in Pattaya since 2007, from Pattaya Guide and Fairways Golf Range to Pattaya Rent a Car and East Coast Real Estate.",
  },
  "/privacy": {
    title: "Privacy Policy — Shane Ruddle",
    description: "How shaneruddle.com collects, uses and protects personal information.",
  },
  "/terms": {
    title: "Terms of Service — Shane Ruddle",
    description: "Terms of use for shaneruddle.com.",
  },
};

export const SAME_AS = [
  "https://www.facebook.com/shane.ruddle",
  "https://www.linkedin.com/in/shaneruddle/",
  "https://x.com/shaneruddle",
];

const ORGANISATIONS: { name: string; url: string }[] = [
  { name: "Alan Bolton Property Consultants", url: "https://www.pattaya-property.net" },
  { name: "East Coast Real Estate", url: "https://www.thaiproperty.com" },
  { name: "Pattaya Rent a Car", url: "https://www.pattayarentacar.com" },
  { name: "Hemingways Jomtien", url: "https://www.hemingwaysjomtien.com" },
  { name: "Hemingways Pattaya", url: "https://www.hemingwayspattaya.com" },
  { name: "Hemingways Lakeside", url: "https://www.hemingwayslakeside.com" },
  { name: "Cajun Life Cafe", url: "https://www.cajunlifecafe.com" },
];

export function personSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE_URL}/#person`,
    name: "Shane Ruddle",
    url: SITE_URL,
    image: `${SITE_URL}/images/shane-portrait.webp`,
    jobTitle: "Entrepreneur",
    description: PAGE_META["/"].description,
    nationality: "British",
    alumniOf: { "@type": "CollegeOrUniversity", name: "Bournemouth University" },
    homeLocation: { "@type": "Place", name: "Pattaya, Chon Buri, Thailand" },
    knowsAbout: [
      "Pattaya",
      "Living in Thailand",
      "Moving to Thailand",
      "Thai visas",
      "Pattaya property",
      "Buying property in Thailand as a foreigner",
      "Car rental in Thailand",
      "Running a business in Thailand",
      "Restaurants and bars in Pattaya",
    ],
    sameAs: SAME_AS,
    worksFor: ORGANISATIONS.map((o) => ({ "@type": "Organization", name: o.name, url: o.url })),
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    publisher: { "@id": `${SITE_URL}/#person` },
  };
}

// Google shows roughly 60 characters of a title and 160 of a description. Long titles drop the
// " | Shane Ruddle" suffix so the keywords show in full; long descriptions end at the last whole
// sentence that fits (left as is when no sentence break leaves a useful length).
const TITLE_SUFFIX = ` | ${SITE_NAME}`;
export function fitTitle(title: string): string {
  return title.length > 60 && title.endsWith(TITLE_SUFFIX) ? title.slice(0, -TITLE_SUFFIX.length) : title;
}
export function fitDescription(description: string): string {
  if (description.length <= 160) return description;
  const head = description.slice(0, 161);
  const cut = Math.max(head.lastIndexOf(". "), head.lastIndexOf("? "), head.lastIndexOf("! "));
  return cut >= 90 ? description.slice(0, cut + 1) : description;
}

// Keeps the browser tab title and meta description in step with client-side navigation.
export function applyPageMeta(meta: PageMeta) {
  if (typeof document === "undefined") return;
  document.title = fitTitle(meta.title);
  document.querySelector('meta[name="description"]')?.setAttribute("content", fitDescription(meta.description));
}
