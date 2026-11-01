// German edition of shaneruddle.com, served under /de. German articles are markdown files in
// content/articles-de/<slug>.md with the same frontmatter as content/articles plus `en: <english-slug>`,
// which links the two versions (hreflang, language switch) and reuses the English header photo.
//
// EN_TO_DE maps every English page that has a German twin, so both the prerender (hreflang tags)
// and the app (language switch, "auf Deutsch" banner) stay in step from one list.

import { PHOTO_SLOTS, articleHeaderSlot } from "../photoSlots";
import { VISAS } from "../visas";
import { VISAS_DE, VISAS_PATH_DE } from "./visas";

export const DE_HOME = "/de";
export const DE_ARTICLES = "/de/artikel";
export const DE_CALCULATOR = "/de/lebenshaltungskosten-rechner";
export const DE_MOVING = "/de/auswandern-nach-pattaya";
export const DE_AREAS = "/de/wohngegenden-pattaya";
export { VISAS_PATH_DE };

export interface DeArticle {
  slug: string;
  en: string;
  title: string;
  description: string;
  category: string;
  date: string;
  image?: string;
  body: string;
}

const files = import.meta.glob("/content/articles-de/*.md", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

function parse(path: string, raw: string): DeArticle | null {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return null;
  const meta: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z]+):\s*(.*?)\s*(#.*)?$/);
    if (m) meta[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  if (!meta.title || meta.draft === "true") return null;
  const slug = path.split("/").pop()!.replace(/\.md$/, "");
  const en = meta.en || "";
  return {
    slug,
    en,
    title: meta.title,
    description: meta.description || "",
    category: meta.category || "Ratgeber",
    date: meta.date || "1970-01-01",
    image: (en && PHOTO_SLOTS.slots[articleHeaderSlot(en)]?.url) || meta.image || undefined,
    body: match[2].trim(),
  };
}

export const DE_ARTICLE_LIST: DeArticle[] = Object.entries(files)
  .map(([p, raw]) => parse(p, raw))
  .filter((a): a is DeArticle => !!a)
  .sort((a, b) => a.title.localeCompare(b.title, "de"));

export const deArticleBySlug = (slug: string) => DE_ARTICLE_LIST.find((a) => a.slug === slug);

/** English path → German path, for every page with a German twin. */
export const EN_TO_DE: Record<string, string> = {
  "/": DE_HOME,
  "/articles": DE_ARTICLES,
  "/cost-of-living-calculator": DE_CALCULATOR,
  "/guides/moving-to-pattaya": DE_MOVING,
  "/areas": DE_AREAS,
  "/thai-visas": VISAS_PATH_DE,
  ...Object.fromEntries(VISAS.map((v) => [`/thai-visas/${v.slug}`, `${VISAS_PATH_DE}/${VISAS_DE.find((d) => d.id === v.id)!.slug}`])),
  ...Object.fromEntries(DE_ARTICLE_LIST.filter((a) => a.en).map((a) => [`/articles/${a.en}`, `${DE_ARTICLES}/${a.slug}`])),
};

export const DE_TO_EN: Record<string, string> = Object.fromEntries(Object.entries(EN_TO_DE).map(([en, de]) => [de, en]));

const clean = (p: string) => p.replace(/\/+$/, "") || "/";
export const germanPathFor = (enPath: string) => EN_TO_DE[clean(enPath)];
export const englishPathFor = (dePath: string) => DE_TO_EN[clean(dePath)] ?? "/";
export const isGermanPath = (p: string) => p === DE_HOME || p.startsWith(`${DE_HOME}/`);

/** German number formatting for baht amounts: ฿50.000 */
export const bahtDe = (n: number) => `฿${Math.round(n).toLocaleString("de-DE")}`;
