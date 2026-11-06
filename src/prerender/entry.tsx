// Build-time renderer for the public pages (run by scripts/prerender.mjs, never shipped to the browser).
// Produces the HTML that search engines and social crawlers see; the browser app replaces it on load.
import { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import HomePage from "../components/HomePage";
import AboutPage from "../components/AboutPage";
import BusinessesPage from "../components/BusinessesPage";
import NewsletterPage from "../components/NewsletterPage";
import ContactPage from "../components/ContactPage";
import PastVentures from "../components/PastVentures";
import PrivacyPolicy from "../components/PrivacyPolicy";
import TermsOfService from "../components/TermsOfService";
import PageHero from "../components/PageHero";
import ArticleView from "../components/ArticleView";
import GuidePage from "../components/GuidePage";
import CostCalculator from "../components/CostCalculator";
import AreasPage from "../components/AreasPage";
import VisasPage from "../components/VisasPage";
import SchoolsPage from "../components/SchoolsPage";
import MovePlanner from "../components/MovePlanner";
import CountryPage from "../components/CountryPage";
import QuestionsPage from "../components/QuestionsPage";
import BusinessCheck from "../components/BusinessCheck";
import BuyingBusinessPage from "../components/BuyingBusinessPage";
import SellBusinessPage from "../components/SellBusinessPage";
import WorkPage from "../components/WorkPage";
import PricesPage from "../components/PricesPage";
import FuturePage from "../components/FuturePage";
import { fallbackData } from "../types";
import DeSite from "../components/de/DeSite";

export { FILE_ARTICLES } from "../lib/fileArticles";
export { GUIDES, GUIDES_META } from "../lib/guides";
export { CALCULATOR_FAQS, CALCULATOR_PATH } from "../lib/costOfLiving";
export { AREAS, AREAS_META, AREAS_FAQS } from "../lib/areas";
export { VISAS, VISAS_META, VISAS_FAQS, VISAS_PATH } from "../lib/visas";
export { MOVE_PATH, MOVE_META, MOVE_FAQS } from "../lib/movePlan";
export { COUNTRIES, countryPath } from "../lib/countries";
export { QUESTIONS, QUESTIONS_META, QUESTIONS_PATH, ANSWERS_AS_OF, questionMeta } from "../lib/questions";
export { BUSINESS_PATH, BUSINESS_META, BUSINESS_FAQS } from "../lib/businessCheck";
export { BUYING_PATH, BUYING_META, BUYING_FAQS } from "../lib/dealCheck";
export { SELL_PATH, SELL_META, SELL_FAQS } from "../lib/sellBusiness";
export { WORK_PATH, WORK_META, WORK_FAQS } from "../lib/work";
export { PRICES_PATH, PRICES_META, PRICES_FAQS } from "../lib/prices";
export { FUTURE_PATH, FUTURE_META, FUTURE_FAQS } from "../lib/future";
export { SCHOOLS, SCHOOLS_META, SCHOOLS_FAQS, SCHOOLS_PATH, faqsForSchool } from "../lib/schools";
export { PAGE_META, SITE_URL, DEFAULT_OG_IMAGE, personSchema, websiteSchema, fitTitle, fitDescription } from "../seo";
export { EN_TO_DE, DE_TO_EN, DE_ARTICLE_LIST, DE_HOME, DE_ARTICLES, DE_CALCULATOR, DE_MOVING, DE_AREAS } from "../lib/de/site";
export { VISAS_DE, VISAS_META_DE, VISAS_FAQS_DE, VISAS_PATH_DE } from "../lib/de/visas";
export { DE_PAGE_META, DE_MOVING_FAQS, DE_AREA_LIST } from "../lib/de/pages";
export { CALCULATOR_FAQS_DE } from "../components/de/DeCalculator";

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
  ["Start here", "/guides"],
  ["Areas", "/areas"],
  ["Visas", "/thai-visas"],
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
          {[...NAV, ["Plan my move", "/move-to-thailand"], ["Moving from the UK", "/move-to-thailand/from-the-uk"], ["Moving from the USA", "/move-to-thailand/from-the-usa"], ["Moving from Australia", "/move-to-thailand/from-australia"], ["Questions", "/questions"], ["Business check", "/business-in-pattaya"], ["Sell your business", "/business-in-pattaya/sell-your-business"], ["Work in Pattaya", "/work-in-pattaya"], ["Fair prices", "/pattaya-prices"], ["Pattaya's future", "/pattaya-future"], ["Newsletter", "/newsletter"], ["Privacy Policy", "/privacy"], ["Terms of Service", "/terms"]].map(([label, href]) => (
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
  "/cost-of-living-calculator": () => <CostCalculator />,
  "/past-ventures": () => <PastVentures onBack={noop} />,
  "/privacy": () => <PrivacyPolicy onBack={noop} />,
  "/terms": () => <TermsOfService onBack={noop} />,
};

export const PAGE_PATHS = Object.keys(PAGES);

export function renderPage(path: string): string {
  return renderToString(<Shell>{PAGES[path]()}</Shell>);
}

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Bangkok" }) : "";

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
      <ArticleView
        title={a.title}
        body={a.body}
        category={a.category}
        createdAt={a.createdAt ? new Date(a.createdAt) : undefined}
        imageUrl={a.imageUrl}
        slug={a.slug}
      />
    </Shell>
  );
}

/** /guides or /guides/<slug>. */
export function renderGuide(path: string): string {
  return renderToString(<Shell><GuidePage path={path} /></Shell>);
}

/** /areas or /areas/<slug>. */
export function renderAreas(path: string): string {
  return renderToString(<Shell><AreasPage path={path} /></Shell>);
}

/** /thai-visas or /thai-visas/<slug>. */
export function renderVisas(path: string): string {
  return renderToString(<Shell><VisasPage path={path} /></Shell>);
}

/** /international-schools-pattaya or /international-schools-pattaya/<slug>. */
export function renderSchools(path: string): string {
  return renderToString(<Shell><SchoolsPage path={path} /></Shell>);
}

/** /move-to-thailand (the planner's question view and the FAQ). */
export function renderMove(): string {
  return renderToString(<Shell><MovePlanner /></Shell>);
}

/** /questions or /questions/<slug>. */
export function renderQuestions(path: string): string {
  return renderToString(<Shell><QuestionsPage path={path} /></Shell>);
}

/** /business-in-pattaya (the reality check's question view and the FAQ). */
export function renderBusiness(): string {
  return renderToString(<Shell><BusinessCheck /></Shell>);
}

/** /work-in-pattaya (the hire check's first question, the guides, the CV form and the FAQ). */
export function renderWork(): string {
  return renderToString(<Shell><WorkPage /></Shell>);
}

/** /pattaya-prices (the checker, the "when it goes wrong" playbooks, the price sheet and the FAQ). */
export function renderPrices(): string {
  return renderToString(<Shell><PricesPage /></Shell>);
}

/** /move-to-thailand/<from-the-uk|from-the-usa|from-australia>. */
export function renderCountry(path: string): string {
  return renderToString(<Shell><CountryPage path={path} /></Shell>);
}

/** /pattaya-future (the development timeline and new-build projects). */
export function renderFuture(): string {
  return renderToString(<Shell><FuturePage /></Shell>);
}

/** /business-in-pattaya/buying-a-business (the deal checker, the buying chapter and the FAQ). */
export function renderBuying(): string {
  return renderToString(<Shell><BuyingBusinessPage /></Shell>);
}

/** /business-in-pattaya/sell-your-business (landing page for owners selling, plus buyers). */
export function renderSell(): string {
  return renderToString(<Shell><SellBusinessPage /></Shell>);
}

/** Any /de page: the German site renders its own header and footer. */
export function renderDe(path: string): string {
  return renderToString(<DeSite path={path} />);
}
