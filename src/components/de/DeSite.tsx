import { ReactNode, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ArrowRight, ArrowUpRight, Calculator, Check, Compass, FileText, MapPin, Menu, Stamp, X } from "lucide-react";
import { handleLinkClick } from "../../lib/navigation";
import { trackEvent } from "../../lib/analytics";
import { applyPageMeta } from "../../seo";
import { photoByUrl } from "../../lib/photoSlots";
import { RENT } from "../../lib/costOfLiving";
import { ecreUrl } from "../../lib/areas";
import {
  DE_AREAS,
  DE_ARTICLES,
  DE_ARTICLE_LIST,
  DE_CALCULATOR,
  DE_HOME,
  DE_MOVING,
  VISAS_PATH_DE,
  DeArticle,
  bahtDe,
  deArticleBySlug,
  englishPathFor,
} from "../../lib/de/site";
import { DE_PAGE_META, DE_AREA_LIST, DE_MOVING_FAQS, DE_MOVING_CHAPTERS } from "../../lib/de/pages";
import AskShane from "../AskShane";
import DeVisas from "./DeVisas";
import DeCalculator from "./DeCalculator";

import Noindex from "../Noindex";
// German edition of the public site (/de/...). Own header and footer in German; shared by the
// build-time prerender and the live app. Rendered instead of the English chrome when the path starts with /de.

const NAV: [string, string][] = [
  ["Visum-Finder", VISAS_PATH_DE],
  ["Lebenshaltungskosten", DE_CALCULATOR],
  ["Auswandern", DE_MOVING],
  ["Wohngegenden", DE_AREAS],
  ["Artikel", DE_ARTICLES],
];

const Eyebrow = ({ children, dark = false }: { children: ReactNode; dark?: boolean }) => (
  <span className={`block text-[11px] font-medium uppercase tracking-[0.3em] mb-5 ${dark ? "text-gold" : "text-gold-deep"}`}>{children}</span>
);

const Byline = ({ note }: { note: string }) => (
  <div className="flex items-center gap-3">
    <img src="/images/shane-portrait.webp" alt="" width={44} height={44} className="w-11 h-11 rounded-full object-cover" />
    <span className="text-sm text-white/60">
      Von <a href="/about" onClick={handleLinkClick} className="text-white hover:text-gold">Shane Ruddle</a>
      <span className="block text-white/40">{note}</span>
    </span>
  </div>
);

const readMinutes = (body: string) => Math.max(1, Math.ceil(body.split(/\s+/).length / 200));
const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00+07:00`).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Bangkok" });

// ---------------------------------------------------------------------------------------------
// Chrome

function Logo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" className="w-9 h-9 shrink-0" aria-hidden="true">
      <defs>
        <linearGradient id="deNavGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F9F295" />
          <stop offset="45%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#B8860B" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="57" fill="#0A0A0A" />
      <circle cx="60" cy="60" r="53" fill="none" stroke="url(#deNavGold)" strokeWidth="1.2" />
      <text x="60" y="78" textAnchor="middle" fontSize="58" fontWeight="500" letterSpacing="-2" fill="url(#deNavGold)" fontFamily="system-ui, sans-serif">SR</text>
    </svg>
  );
}

function LanguageSwitch({ path, className = "" }: { path: string; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border border-black/15 text-[11px] font-semibold tracking-[0.16em] overflow-hidden ${className}`}>
      <span className="px-3 py-1.5 bg-ink text-white" aria-current="true">DE</span>
      <a
        href={englishPathFor(path)}
        hrefLang="en"
        lang="en"
        onClick={(e) => {
          trackEvent("select_content", { content_type: "language_switch", language: "en", source: path });
          handleLinkClick(e);
        }}
        className="px-3 py-1.5 text-black/55 hover:text-ink"
        title="Read this in English"
      >
        EN
      </a>
    </span>
  );
}

function DeHeader({ path }: { path: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[10000] bg-white/95 backdrop-blur-md border-b border-black/10">
        <div className="max-w-7xl mx-auto h-16 md:h-[72px] px-5 md:px-12 flex items-center justify-between gap-6">
          <a href={DE_HOME} onClick={handleLinkClick} aria-label="Shane Ruddle, Startseite" className="flex items-center gap-3 shrink-0">
            <Logo />
            <span className="hidden sm:block font-serif text-xl tracking-[0.18em] uppercase whitespace-nowrap">
              Shane <span className="font-semibold">Ruddle</span>
            </span>
          </a>
          <div className="hidden xl:flex items-center gap-6">
            {NAV.map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={handleLinkClick}
                aria-current={path.startsWith(href) ? "page" : undefined}
                className={`text-[11px] font-medium uppercase tracking-[0.18em] whitespace-nowrap transition-colors ${path.startsWith(href) ? "text-gold-deep" : "text-black/60 hover:text-ink"}`}
              >
                {label}
              </a>
            ))}
            <LanguageSwitch path={path} />
          </div>
          <div className="flex xl:hidden items-center gap-3">
            <LanguageSwitch path={path} />
            <button aria-label={open ? "Menü schließen" : "Menü öffnen"} className="text-ink p-2 -mr-2 hover:bg-black/5 rounded-full" onClick={() => setOpen(!open)}>
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>
      {open && (
        <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center gap-7 py-20">
          {[["Startseite", DE_HOME] as [string, string], ...NAV].map(([label, href]) => (
            <a key={href} href={href} onClick={handleLinkClick} className="font-serif text-3xl text-ink hover:text-gold-deep">
              {label}
            </a>
          ))}
        </div>
      )}
    </>
  );
}

function DeFooter({ path }: { path: string }) {
  return (
    <footer className="pt-20 md:pt-24 pb-10 px-6 md:px-12 bg-ink text-white">
      <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-12 mb-16">
        <div className="md:col-span-6">
          <span className="font-serif text-2xl tracking-[0.18em] uppercase">Shane <span className="font-semibold">Ruddle</span></span>
          <p className="mt-5 text-white/55 font-light leading-relaxed max-w-md">
            Seit über 20 Jahren in Pattaya, Inhaber von sieben Unternehmen in Immobilien, Gastronomie und Autovermietung. Ich schreibe
            darüber, was funktioniert und was nicht.
          </p>
        </div>
        <div className="md:col-span-3">
          <h5 className="text-[11px] uppercase tracking-[0.25em] font-semibold text-gold mb-6">Auf Deutsch</h5>
          <ul className="space-y-4">
            {[["Startseite", DE_HOME] as [string, string], ...NAV].map(([label, href]) => (
              <li key={href}><a href={href} onClick={handleLinkClick} className="text-sm text-white/60 hover:text-white font-light">{label}</a></li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-3">
          <h5 className="text-[11px] uppercase tracking-[0.25em] font-semibold text-gold mb-6">In English</h5>
          <ul className="space-y-4" lang="en">
            {[["This page in English", englishPathFor(path)], ["About Shane", "/about"], ["All articles", "/articles"], ["International schools", "/international-schools-pattaya"], ["Privacy policy", "/privacy"]].map(([label, href]) => (
              <li key={label}><a href={href} hrefLang="en" onClick={handleLinkClick} className="text-sm text-white/60 hover:text-white font-light">{label}</a></li>
            ))}
          </ul>
        </div>
      </div>
      <p className="max-w-7xl mx-auto border-t border-white/10 pt-8 text-xs text-white/35">
        © {new Date().getFullYear()} Shane Ruddle · Pattaya, Thailand. Die Artikel sind Übersetzungen meiner englischen Originale.
      </p>
    </footer>
  );
}

// ---------------------------------------------------------------------------------------------
// Shared blocks

function AskBlock({ source, topic = "other" as const, context }: { source: string; topic?: Parameters<typeof AskShane>[0]["initialTopic"]; context?: string }) {
  return (
    <section id="ask" className="scroll-mt-28 p-8 md:p-12 bg-cream border border-cream-line rounded-[2rem]">
      <AskShane lang="de" source={source} initialTopic={topic === "other" ? undefined : topic} context={context} contextNote="Ich weiß dann, von welcher Seite Sie fragen." />
    </section>
  );
}

function ArticleCards({ articles, source }: { articles: DeArticle[]; source: string }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4 md:gap-5">
      {articles.map((a) => (
        <a
          key={a.slug}
          href={`${DE_ARTICLES}/${a.slug}`}
          onClick={(e) => {
            trackEvent("select_content", { content_type: "article_de", item_id: a.slug, source });
            handleLinkClick(e);
          }}
          className="group flex flex-col bg-white border border-black/[0.08] rounded-[1rem] p-6 transition-all duration-300 hover:border-gold/60 hover:shadow-xl hover:shadow-black/[0.06]"
        >
          <span className="text-[10px] uppercase tracking-[0.2em] text-black/40 mb-2">{a.category} · {readMinutes(a.body)} Min. Lesezeit</span>
          <h3 className="font-serif text-xl leading-snug text-ink mb-2 group-hover:text-gold-deep transition-colors">{a.title}</h3>
          <p className="text-sm text-black/60 leading-relaxed">{a.description}</p>
        </a>
      ))}
    </div>
  );
}

const TOOLS = [
  { href: VISAS_PATH_DE, icon: Stamp, label: "Visum-Finder", title: "Welches Visum passt zu mir?", text: "Sechs Fragen, eine klare Empfehlung, und das Visum, das Sie meiden sollten." },
  { href: DE_CALCULATOR, icon: Calculator, label: "Rechner", title: "Was kostet das Leben in Pattaya?", text: "Ihr Monatsbudget in Euro, Franken oder Baht, mit meinen echten Zahlen." },
  { href: DE_MOVING, icon: Compass, label: "Ratgeber", title: "Auswandern nach Pattaya", text: "Kosten, Visum, Gesundheit, Bank und Wohnen: alles in der richtigen Reihenfolge." },
  { href: DE_AREAS, icon: MapPin, label: "Wohngegenden", title: "Wo sollte ich wohnen?", text: "Sechs Gegenden, für wen sie passen und was ฿20.000 Miete dort bringen." },
];

function ToolTiles({ source, exclude }: { source: string; exclude?: string }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {TOOLS.filter((t) => t.href !== exclude).map((t) => (
        <a
          key={t.href}
          href={t.href}
          onClick={(e) => {
            trackEvent("select_content", { content_type: "de_tool", item_id: t.href, source });
            handleLinkClick(e);
          }}
          className="group flex flex-col min-h-[14rem] p-7 rounded-[1.25rem] border bg-white/[0.04] border-white/10 hover:border-gold/70 hover:bg-white/[0.07] transition-all hover:-translate-y-1"
        >
          <t.icon className="w-7 h-7 text-gold mb-6" />
          <span className="text-[11px] uppercase tracking-[0.22em] text-white/50 mb-2">{t.label}</span>
          <span className="font-serif text-2xl leading-snug text-white group-hover:text-gold mb-3">{t.title}</span>
          <span className="text-sm text-white/55 leading-relaxed">{t.text}</span>
          <ArrowRight className="mt-auto pt-4 w-9 h-9 text-gold/70 group-hover:translate-x-1 transition-transform" />
        </a>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Pages

function DeHome() {
  const popular = ["leben-in-pattaya", "ist-pattaya-teuer", "als-rentner-nach-pattaya", "beste-wohngegend-pattaya"]
    .map(deArticleBySlug)
    .filter((a): a is DeArticle => !!a);
  return (
    <>
      <section className="bg-ink text-white pt-28 md:pt-40 pb-16 md:pb-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center mb-16 md:mb-20">
            <div className="lg:col-span-7">
              <Eyebrow dark>Unternehmer · Pattaya, Thailand</Eyebrow>
              <h1 className="font-serif font-normal text-[2.6rem] sm:text-6xl lg:text-7xl leading-[1.04] tracking-tight mb-6">
                Pattaya, ehrlich erklärt. <span className="italic text-gold">Von jemandem, der hier lebt.</span>
              </h1>
              <p className="text-lg md:text-xl text-white/65 font-light leading-relaxed max-w-2xl mb-8">
                Ich bin vor über 20 Jahren nach Pattaya gekommen und besitze heute sieben Unternehmen hier. Auf diesen Seiten
                finden Sie, was ich einem Freund erzählen würde, der über den Umzug nachdenkt: Visum, Kosten, Wohnen und Alltag.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href={VISAS_PATH_DE} onClick={handleLinkClick} className="inline-flex items-center gap-2 px-7 py-4 bg-gold text-ink text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:bg-white transition-colors">
                  Visum-Finder starten <ArrowRight className="w-4 h-4" />
                </a>
                <a href="#ask" onClick={(e) => { e.preventDefault(); document.getElementById("ask")?.scrollIntoView({ behavior: "smooth" }); }} className="inline-flex items-center gap-2 px-7 py-4 border border-white/25 text-white text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:border-gold hover:text-gold transition-colors">
                  Frage stellen
                </a>
              </div>
            </div>
            <div className="lg:col-span-5">
              <img src="/images/shane-portrait.webp" alt="Shane Ruddle" width={800} height={1000} className="w-full max-w-sm mx-auto aspect-[4/5] object-cover rounded-[2rem]" />
            </div>
          </div>
          <ToolTiles source="de_home" />
        </div>
      </section>

      <div className="bg-paper px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-6xl mx-auto space-y-16 md:space-y-24">
          <section className="grid lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4">
              <Eyebrow>Zum Einstieg</Eyebrow>
              <h2 className="font-serif text-4xl md:text-5xl leading-tight mb-4">Die meistgelesenen Artikel</h2>
              <p className="text-black/60 font-light leading-relaxed mb-6">
                Aus meinen englischen Artikeln übersetzt, mit denselben Zahlen. Alle Beträge in Baht; ฿10.000 sind etwa 260 €.
              </p>
              <a href={DE_ARTICLES} onClick={handleLinkClick} className="inline-flex items-center gap-1.5 text-sm text-gold-deep hover:text-ink">
                Alle deutschen Artikel <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <div className="lg:col-span-8"><ArticleCards articles={popular} source="de_home" /></div>
          </section>

          <section className="grid md:grid-cols-3 gap-4">
            {[
              ["20+", "Jahre in Thailand", "Ich kam mit 23 und habe als Barmanager in der Soi 13 angefangen."],
              ["7", "Unternehmen", "Zwei Maklerbüros, drei Hemingways, das Cajun Life Cafe und Pattaya Rent a Car."],
              ["1", "Rat vorweg", "Erst mieten, dann kaufen. Probieren Sie Pattaya aus, bevor Sie sich festlegen."],
            ].map(([n, label, text]) => (
              <div key={label} className="p-7 bg-white border border-black/[0.08] rounded-[1.25rem]">
                <span className="block font-serif text-5xl text-gold-deep mb-2">{n}</span>
                <span className="block text-[11px] uppercase tracking-[0.22em] text-black/45 mb-3">{label}</span>
                <p className="text-black/65 font-light leading-relaxed">{text}</p>
              </div>
            ))}
          </section>

          <AskBlock source="de_home" />
        </div>
      </div>
    </>
  );
}

function DeArticleList() {
  return (
    <>
      <section className="bg-ink text-white pt-28 md:pt-36 pb-14 md:pb-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <Eyebrow dark>Artikel auf Deutsch</Eyebrow>
          <h1 className="font-serif font-normal text-[2.6rem] sm:text-6xl lg:text-7xl leading-[1.04] tracking-tight mb-6 max-w-4xl">
            Leben, Wohnen und Visum in <span className="italic text-gold">Pattaya</span>
          </h1>
          <p className="text-lg md:text-xl text-white/65 font-light leading-relaxed max-w-2xl">
            {DE_ARTICLE_LIST.length} meiner Artikel auf Deutsch, für alle, die über einen Umzug nach Thailand nachdenken. Über 50 weitere
            gibt es <a href="/articles" hrefLang="en" onClick={handleLinkClick} className="text-white underline underline-offset-4 hover:text-gold">auf Englisch</a>.
          </p>
        </div>
      </section>
      <div className="bg-paper px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-5xl mx-auto space-y-16">
          <ArticleCards articles={DE_ARTICLE_LIST} source="de_articles" />
          <AskBlock source="de_articles" />
        </div>
      </div>
    </>
  );
}

function DeArticleView({ article }: { article: DeArticle }) {
  const more = DE_ARTICLE_LIST.filter((a) => a.slug !== article.slug).slice(0, 4);
  const topic = /visum/.test(article.slug) ? "visa" : /rentner|krankenhaus/.test(article.slug) ? "retiring" : /kaufen/.test(article.slug) ? "buying" : /mieten|wohngegend|teuer|leben/.test(article.slug) ? "renting" : "other";
  return (
    <article className="min-h-screen bg-white pt-28 md:pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        <a href={DE_ARTICLES} onClick={handleLinkClick} className="text-xs uppercase tracking-widest font-bold text-gold-deep hover:text-ink transition-colors">← Alle Artikel</a>
        <a href={`/articles/${article.en}`} hrefLang="en" onClick={handleLinkClick} className="ml-5 text-xs uppercase tracking-widest text-black/45 hover:text-gold-deep">English original</a>
        <p className="mt-8 text-xs uppercase tracking-widest text-black/45">{article.category} · {fmtDate(article.date)} · {readMinutes(article.body)} Min. Lesezeit</p>
        <h1 className="font-serif text-4xl md:text-6xl leading-tight mt-3 mb-6">{article.title}</h1>
        <div className="flex items-center gap-3 mb-12">
          <img src="/images/shane-portrait.webp" alt="" width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
          <span className="text-sm text-black/60">Von <a href="/about" onClick={handleLinkClick} className="text-ink hover:text-gold-deep">Shane Ruddle</a> · aus dem Englischen übersetzt</span>
        </div>
        {article.image && (
          <img src={article.image} alt={photoByUrl(article.image)?.alt || article.title} width={1600} height={900} decoding="async" className="w-full aspect-[16/9] object-cover rounded-3xl mb-12" referrerPolicy="no-referrer" />
        )}
        <div className="markdown-body text-black/70 font-light leading-relaxed text-lg">
          <ReactMarkdown
            components={{
              a: ({ href, children }) =>
                href?.startsWith("/") ? (
                  <a href={href} onClick={handleLinkClick}>{children}</a>
                ) : (
                  <a href={href} target="_blank" rel="noopener">{children}</a>
                ),
            }}
          >
            {article.body}
          </ReactMarkdown>
        </div>

        <a href={DE_MOVING} onClick={handleLinkClick} className="group mt-16 flex items-center justify-between gap-6 p-7 md:p-8 bg-ink rounded-[1.5rem] text-white">
          <span>
            <span className="block text-[11px] uppercase tracking-[0.25em] text-gold mb-2">Teil meines Ratgebers</span>
            <span className="font-serif text-2xl md:text-3xl group-hover:text-gold transition-colors">Auswandern nach Pattaya</span>
            <span className="block mt-2 text-sm text-white/55 font-light">Kurze Antworten und alle Artikel dazu, in der richtigen Reihenfolge.</span>
          </span>
          <span aria-hidden className="text-gold text-3xl transition-transform group-hover:translate-x-1">→</span>
        </a>

        <div className="mt-16"><AskBlock source={`de_article_${article.slug}`} topic={topic} /></div>

        <section className="mt-16">
          <h2 className="font-serif text-3xl mb-6">Weiterlesen</h2>
          <ArticleCards articles={more} source={`de_article_${article.slug}`} />
        </section>

        <aside className="mt-16 p-8 md:p-10 bg-[#F8F8F8] rounded-[2rem] flex flex-col sm:flex-row items-start gap-6">
          <img src="/images/shane-portrait.webp" alt="Shane Ruddle" width={88} height={88} className="rounded-full object-cover flex-shrink-0" style={{ width: 88, height: 88 }} />
          <div>
            <h2 className="text-xl font-serif mb-2">Über mich</h2>
            <p className="text-black/60 font-light leading-relaxed">
              Ich bin Shane Ruddle. Ich kam vor über 20 Jahren nach Pattaya, habe als Barmanager in der Soi 13 angefangen und besitze
              heute sieben Unternehmen hier, in Immobilien, Gastronomie und Autovermietung. Ich schreibe darüber, was ich dabei gelernt
              habe, auch über das, was nicht funktioniert hat.
            </p>
          </div>
        </aside>
      </div>
    </article>
  );
}

function DeMoving() {
  return (
    <>
      <section className="bg-ink text-white pt-28 md:pt-36 pb-14 md:pb-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <Eyebrow dark>Ratgeber · Auswandern</Eyebrow>
          <h1 className="font-serif font-normal text-[2.6rem] sm:text-6xl lg:text-7xl leading-[1.04] tracking-tight mb-6 max-w-5xl">
            Auswandern nach Pattaya: <span className="italic text-gold">mein Ratgeber nach 20 Jahren</span>
          </h1>
          <p className="text-lg md:text-xl text-white/65 font-light leading-relaxed max-w-2xl mb-8">
            Ich kam vor über 20 Jahren nach Pattaya und bin geblieben. Hier steht alles, was ich einem Freund erzählen würde, der
            über den Umzug nachdenkt, in der Reihenfolge, in der ich es erzählen würde.
          </p>
          <Byline note="Stand 2026 · aus dem Englischen übersetzt" />
        </div>
      </section>
      <div className="bg-paper px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-6xl mx-auto space-y-16 md:space-y-24">
          <section className="grid lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-4">
              <Eyebrow>Kurze Antworten</Eyebrow>
              <h2 className="font-serif text-4xl leading-tight mb-4">Was die meisten zuerst wissen wollen</h2>
              <p className="text-black/60 font-light">Jede Antwort verlinkt den Artikel, in dem ich es ausführlich erkläre.</p>
            </div>
            <div className="lg:col-span-8 divide-y divide-black/10 border-y border-black/10">
              {DE_MOVING_FAQS.map((f) => (
                <div key={f.q} className="py-6">
                  <h3 className="font-serif text-xl leading-snug mb-2">{f.q}</h3>
                  <p className="text-black/65 font-light leading-relaxed">{f.a}</p>
                  <a href={f.href} onClick={handleLinkClick} className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium tracking-wide text-gold-deep hover:text-ink">
                    Mehr dazu <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </section>

          {DE_MOVING_CHAPTERS.map((c, i) => (
            <section key={c.title} className="grid lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4">
                <span className="font-serif text-5xl text-gold-deep/70 leading-none">{String(i + 1).padStart(2, "0")}</span>
                <h2 className="font-serif text-3xl leading-tight mt-4 mb-3">{c.title}</h2>
                <p className="text-black/60 font-light leading-relaxed">{c.blurb}</p>
              </div>
              <div className="lg:col-span-8">
                <ArticleCards articles={c.slugs.map(deArticleBySlug).filter((a): a is DeArticle => !!a)} source="de_moving" />
              </div>
            </section>
          ))}

          <section className="p-8 md:p-12 bg-ink rounded-[2rem]">
            <span className="block text-[11px] uppercase tracking-[0.3em] text-gold mb-6">Werkzeuge</span>
            <ToolTiles source="de_moving" exclude={DE_MOVING} />
          </section>

          <AskBlock source="de_moving" topic="retiring" context="German moving guide" />
        </div>
      </div>
    </>
  );
}

function DeAreas() {
  const [active, setActive] = useState<string | null>(null);
  return (
    <>
      <section className="bg-ink text-white pt-28 md:pt-36 pb-14 md:pb-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <Eyebrow dark>Wohnen in Pattaya</Eyebrow>
          <h1 className="font-serif font-normal text-[2.6rem] sm:text-6xl lg:text-7xl leading-[1.04] tracking-tight mb-6 max-w-5xl">
            Wo sollten Sie in Pattaya <span className="italic text-gold">wohnen?</span>
          </h1>
          <p className="text-lg md:text-xl text-white/65 font-light leading-relaxed max-w-2xl mb-8">
            Die beste Gegend hängt von Ihrer Lebensphase ab. Unsere Maklerbüros vermieten und verkaufen in der ganzen Stadt. So würde
            ich die sechs wichtigsten Wohngegenden 2026 einordnen.
          </p>
          <Byline note="Mieten aus unseren Maklerbüros · Stand 2026" />
        </div>
      </section>
      <div className="bg-paper px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-6xl mx-auto space-y-16 md:space-y-20">
          <section className="grid md:grid-cols-2 gap-5">
            {DE_AREA_LIST.map((a) => {
              const rent = a.calcArea ? RENT[a.calcArea] : null;
              return (
                <div
                  key={a.id}
                  id={a.id}
                  onMouseEnter={() => setActive(a.id)}
                  className={`scroll-mt-28 flex flex-col p-7 md:p-8 bg-white border rounded-[1.5rem] transition-colors ${active === a.id ? "border-gold/70" : "border-black/[0.08]"}`}
                >
                  <span className="text-[11px] uppercase tracking-[0.22em] text-gold-deep mb-2">{a.tagline}</span>
                  <h2 className="font-serif text-3xl mb-4">{a.name}</h2>
                  <p className="text-black/70 leading-relaxed mb-5">{a.verdict}</p>
                  <div className="grid sm:grid-cols-2 gap-5 mb-6 text-sm">
                    <div>
                      <h3 className="text-[10px] uppercase tracking-[0.2em] text-black/45 mb-2">Passt zu</h3>
                      <ul className="space-y-1.5">{a.suits.map((s) => <li key={s} className="flex gap-2 text-black/75"><Check className="w-3.5 h-3.5 mt-1 text-gold-deep shrink-0" />{s}</li>)}</ul>
                    </div>
                    <div>
                      <h3 className="text-[10px] uppercase tracking-[0.2em] text-black/45 mb-2">Eher nicht für</h3>
                      <ul className="space-y-1.5">{a.notFor.map((s) => <li key={s} className="flex gap-2 text-black/60"><X className="w-3.5 h-3.5 mt-1 text-black/30 shrink-0" />{s}</li>)}</ul>
                    </div>
                  </div>
                  <div className="mt-auto p-4 rounded-xl bg-paper border border-black/[0.06] text-sm">
                    <span className="block text-[10px] uppercase tracking-[0.2em] text-black/45 mb-1">Für ฿20.000 Monatsmiete</span>
                    <span className="text-ink">{a.rent20k}</span>
                    {rent && (
                      <span className="block mt-2 text-black/50">Typische Miete: 1-Zimmer-Condo {bahtDe(rent.condo1)}, Haus {bahtDe(rent.house)} im Monat</span>
                    )}
                  </div>
                  <a href={`/areas/${a.enSlug}`} hrefLang="en" onClick={handleLinkClick} className="mt-4 inline-flex items-center gap-1.5 text-xs text-black/50 hover:text-gold-deep">
                    Ausführlicher Gebietsführer (Englisch) <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              );
            })}
          </section>

          <section className="grid lg:grid-cols-12 gap-10 items-center p-8 md:p-12 bg-ink text-white rounded-[2rem]">
            <div className="lg:col-span-7">
              <span className="block text-[11px] uppercase tracking-[0.3em] text-gold mb-4">Mein wichtigster Rat</span>
              <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-4">Laufen Sie die Gegend einen ganzen Tag ab.</h2>
              <p className="text-white/65 font-light leading-relaxed">
                Rucksack auf, Sonnencreme und Sonnenbrille einpacken, und schauen Sie, welche Restaurants es gibt und wer dort wohnt.
                East Pattaya fahren Sie besser mit dem Auto ab. Und rechnen Sie damit, mehr als einmal umzuziehen: Die meisten wechseln
                die Gegend, wenn sich ihr Leben ändert.
              </p>
            </div>
            <div className="lg:col-span-5 flex flex-col gap-3">
              <a href={`${DE_ARTICLES}/beste-wohngegend-pattaya`} onClick={handleLinkClick} className="inline-flex items-center justify-between gap-2 px-6 py-4 bg-gold text-ink text-xs font-semibold uppercase tracking-[0.16em] rounded-full hover:bg-white">
                Den ganzen Artikel lesen <ArrowRight className="w-4 h-4" />
              </a>
              <a href={DE_CALCULATOR} onClick={handleLinkClick} className="inline-flex items-center justify-between gap-2 px-6 py-4 border border-white/25 text-xs font-semibold uppercase tracking-[0.16em] rounded-full hover:border-gold hover:text-gold">
                Monatsbudget berechnen <Calculator className="w-4 h-4" />
              </a>
              <a
                href={ecreUrl("de_areas")}
                target="_blank"
                rel="noopener"
                onClick={() => trackEvent("select_promotion", { promotion_name: "ecre_rentals", creative_slot: "de_areas" })}
                className="inline-flex items-center justify-between gap-2 px-6 py-4 border border-white/25 text-xs font-semibold uppercase tracking-[0.16em] rounded-full hover:border-gold hover:text-gold"
              >
                Mietwohnungen ansehen (East Coast) <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </section>

          <AskBlock source="de_areas" topic="renting" />
        </div>
      </div>
    </>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen bg-paper pt-40 pb-24 px-6 text-center">
      <FileText className="w-10 h-10 mx-auto text-gold-deep mb-6" />
      <Noindex />
      <h1 className="text-4xl font-serif mb-4">Seite nicht gefunden</h1>
      <a href={DE_HOME} onClick={handleLinkClick} className="text-gold-deep font-bold uppercase tracking-widest text-[11px]">Zur Startseite</a>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Router

/** Page body for a /de path (no header or footer). */
export function DePage({ path }: { path: string }) {
  const p = path.replace(/\/+$/, "") || DE_HOME;
  if (p === DE_HOME) return <DeHome />;
  if (p === VISAS_PATH_DE || p.startsWith(`${VISAS_PATH_DE}/`)) return <DeVisas path={p} />;
  if (p === DE_CALCULATOR) return <DeCalculator />;
  if (p === DE_MOVING) return <DeMoving />;
  if (p === DE_AREAS) return <DeAreas />;
  if (p === DE_ARTICLES) return <DeArticleList />;
  if (p.startsWith(`${DE_ARTICLES}/`)) {
    const a = deArticleBySlug(p.slice(DE_ARTICLES.length + 1));
    return a ? <DeArticleView article={a} /> : <NotFound />;
  }
  return <NotFound />;
}

/** Title and description for a /de path (visa pages set their own). */
export function deMetaFor(path: string) {
  const p = path.replace(/\/+$/, "") || DE_HOME;
  if (p.startsWith(`${DE_ARTICLES}/`)) {
    const a = deArticleBySlug(p.slice(DE_ARTICLES.length + 1));
    if (a) return { title: `${a.title} | Shane Ruddle`, description: a.description };
  }
  return DE_PAGE_META[p];
}

/** The whole German site: header, page, footer. */
export default function DeSite({ path }: { path: string }) {
  useEffect(() => {
    document.documentElement.lang = "de";
    return () => {
      document.documentElement.lang = "en";
    };
  }, []);
  useEffect(() => {
    const meta = deMetaFor(path);
    if (meta) applyPageMeta(meta);
  }, [path]);
  return (
    <div lang="de">
      <DeHeader path={path} />
      <main>
        <DePage path={path} />
      </main>
      <DeFooter path={path} />
    </div>
  );
}
