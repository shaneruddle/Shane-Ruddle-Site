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
    title: "Shane Ruddle — Entrepreneur, Pattaya",
    description:
      "Shane Ruddle owns seven businesses in Pattaya, Thailand: Alan Bolton Property Consultants, East Coast Real Estate, Pattaya Rent a Car, three Hemingways venues and Cajun Life Cafe.",
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

// Keeps the browser tab title and meta description in step with client-side navigation.
export function applyPageMeta(meta: PageMeta) {
  if (typeof document === "undefined") return;
  document.title = meta.title;
  document.querySelector('meta[name="description"]')?.setAttribute("content", meta.description);
}
