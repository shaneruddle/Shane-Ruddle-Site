// Build-time renderer for the public pages (run by scripts/prerender.mjs, never shipped to the browser).
// Produces the HTML that search engines and social crawlers see; the browser app replaces it on load.
import { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import HomePage from "../components/HomePage";
import AboutPage from "../components/AboutPage";
import BusinessesPage from "../components/BusinessesPage";
import NewsletterPage from "../components/NewsletterPage";
import ContactPage from "../components/ContactPage";
import PastVentures from "../components/PastVentures";
import PrivacyPolicy from "../components/PrivacyPolicy";
import TermsOfService from "../components/TermsOfService";
import PageHero from "../components/PageHero";
import { fallbackData } from "../types";

export { FILE_ARTICLES } from "../lib/fileArticles";
export { PAGE_META, SITE_URL, DEFAULT_OG_IMAGE, personSchema, websiteSchema } from "../seo";

export interface StaticArticle {
  slug: string;
  title: string;
  description: string;
  body: string;
  category?: string;
  imageUrl?: string;
  authorName?: string;
  createdAt?: string; // ISO
  updatedAt?: string; // ISO
}

const noop = () => {};

const NAV = [
  ["About", "/about"],
  ["Businesses", "/businesses"],
  ["Articles", "/articles"],
  ["Past Ventures", "/past-ventures"],
  ["Contact", "/contact"],
];

// Minimal crawlable header/footer. The live app renders the full interactive versions.
function Shell({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 border-b border-black/10">
        <nav className="max-w-7xl mx-auto h-16 md:h-[72px] px-5 md:px-12 flex items-center justify-between">
          <a href="/" className="font-serif text-xl tracking-[0.18em] uppercase">Shane <span className="font-semibold">Ruddle</span></a>
          <ul className="hidden lg:flex gap-7">
            {NAV.map(([label, href]) => (
              <li key={href}><a href={href} className="text-[11px] uppercase tracking-[0.18em] text-black/60">{label}</a></li>
            ))}
          </ul>
        </nav>
      </header>
      <main>{children}</main>
      <footer className="bg-ink text-white/60 px-6 md:px-12 py-12">
        <ul className="max-w-7xl mx-auto flex flex-wrap gap-6 text-sm">
          {[...NAV, ["Newsletter", "/newsletter"], ["Privacy Policy", "/privacy"], ["Terms of Service", "/terms"]].map(([label, href]) => (
            <li key={href}><a href={href}>{label}</a></li>
          ))}
        </ul>
      </footer>
    </>
  );
}

const PAGES: Record<string, () => ReactNode> = {
  "/": () => <HomePage data={fallbackData} />,
  "/about": () => <AboutPage />,
  "/businesses": () => <BusinessesPage data={fallbackData} />,
  "/newsletter": () => <NewsletterPage />,
  "/contact": () => <ContactPage />,
  "/past-ventures": () => <PastVentures onBack={noop} />,
  "/privacy": () => <PrivacyPolicy onBack={noop} />,
  "/terms": () => <TermsOfService onBack={noop} />,
};

export const PAGE_PATHS = Object.keys(PAGES);

export function renderPage(path: string): string {
  return renderToString(<Shell>{PAGES[path]()}</Shell>);
}

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";

export function renderArticleList(articles: StaticArticle[]): string {
  return renderToString(
    <Shell>
      <PageHero eyebrow="Articles" title={<>Pattaya <span className="italic text-gold">Chronicles</span></>} intro="Property, business and life in Pattaya." />
      <section className="py-16 px-6 md:px-12">
        <ul className="max-w-4xl mx-auto space-y-10">
          {articles.map((a) => (
            <li key={a.slug}>
              <a href={`/articles/${a.slug}`} className="block">
                <span className="text-xs uppercase tracking-widest text-black/40">{[a.category, fmtDate(a.createdAt)].filter(Boolean).join(" · ")}</span>
                <h2 className="font-serif text-3xl mt-1 mb-2">{a.title}</h2>
                <p className="text-black/60">{a.description}</p>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </Shell>
  );
}

export function renderArticle(a: StaticArticle): string {
  return renderToString(
    <Shell>
      <article className="pt-28 pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          <a href="/articles" className="text-xs uppercase tracking-widest text-gold-deep">All articles</a>
          <p className="mt-8 text-xs uppercase tracking-widest text-black/40">{[a.category, fmtDate(a.createdAt)].filter(Boolean).join(" · ")}</p>
          <h1 className="font-serif text-4xl md:text-6xl leading-tight mt-2 mb-6">{a.title}</h1>
          <p className="text-sm text-black/50 mb-10">By {a.authorName || "Shane Ruddle"}</p>
          {a.imageUrl && <img src={a.imageUrl} alt={a.title} className="w-full rounded-3xl mb-10" />}
          <div className="markdown-body text-black/70 font-light leading-relaxed text-lg">
            <ReactMarkdown>{a.body}</ReactMarkdown>
          </div>
        </div>
      </article>
    </Shell>
  );
}
