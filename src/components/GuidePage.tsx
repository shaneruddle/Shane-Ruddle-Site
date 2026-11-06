import { MouseEvent, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { FILE_ARTICLES } from "../lib/fileArticles";
import { GUIDES, GUIDES_META, Guide, guideBySlug } from "../lib/guides";
import { handleLinkClick } from "../lib/navigation";
import { trackEvent } from "../lib/analytics";
import { applyPageMeta } from "../seo";
import AskShane from "./AskShane";
import CalculatorPromo from "./CalculatorPromo";
import AreasPromo from "./AreasPromo";
import VisaPromo from "./VisaPromo";
import SchoolsPromo from "./SchoolsPromo";
import MovePlannerPromo from "./MovePlannerPromo";
import BusinessCheckPromo from "./BusinessCheckPromo";
import WorkPromo from "./WorkPromo";
import FuturePromo from "./FuturePromo";
import NewsletterSignup from "./NewsletterSignup";
import PageHero from "./PageHero";

import Noindex from "./Noindex";
import { GuideTiles } from "./GuideTiles";

export { GuideTiles };
// "Start here" guide hubs (/guides and /guides/<slug>). Shared by the build-time prerender and
// the live app, so the static HTML and the app render the same layout.

const ARTICLES = new Map(FILE_ARTICLES.map((a) => [a.slug, a]));
const readMinutes = (body: string) => Math.max(1, Math.ceil(body.split(/\s+/).length / 200));
const pad = (n: number) => String(n).padStart(2, "0");
const articleCount = (g: Guide) => new Set(g.chapters.flatMap((c) => c.slugs).filter((s) => ARTICLES.has(s))).size;

// In-page links scroll without touching history: the app treats popstate (fired by #hash
// navigation) as a page change and jumps to the top.
const jump = (e: MouseEvent<HTMLAnchorElement>) => {
  const id = e.currentTarget.getAttribute("href")?.slice(1);
  const el = id && document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  el.scrollIntoView({ behavior: "smooth", block: "start" });
};

function GuidesIndex() {
  return (
    <>
      <PageHero
        eyebrow="Start here"
        title={<>What are you <span className="italic text-gold">planning?</span></>}
        intro="Pick the one that fits. Each guide gives you my short answers first, then takes you through everything I've written on it, in order."
      />
      <section className="bg-paper py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <GuideTiles source="guides_index" />
        </div>
      </section>
    </>
  );
}

function GuideView({ guide }: { guide: Guide }) {
  const chapters = guide.chapters
    .map((c) => ({ ...c, articles: c.slugs.map((s) => ARTICLES.get(s)).filter((a): a is NonNullable<typeof a> => !!a) }))
    .filter((c) => c.articles.length);
  const total = articleCount(guide);

  return (
    <>
      <section className="bg-ink text-white pt-28 md:pt-36 pb-14 md:pb-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <a href="/guides" onClick={handleLinkClick} className="block text-[11px] font-medium uppercase tracking-[0.3em] mb-5 text-gold hover:text-white transition-colors">
            Start here · Guide
          </a>
          <h1 className="font-serif font-normal text-[2.6rem] sm:text-6xl lg:text-7xl leading-[1.04] tracking-tight mb-6 max-w-5xl">{guide.title}</h1>
          <p className="text-lg md:text-xl text-white/65 font-light leading-relaxed max-w-2xl mb-10">{guide.intro}</p>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-5">
            <div className="flex items-center gap-3">
              <img src="/images/shane-portrait.webp" alt="" width={44} height={44} className="w-11 h-11 rounded-full object-cover" />
              <span className="text-sm text-white/60">
                By <a href="/about" onClick={handleLinkClick} className="text-white hover:text-gold">Shane Ruddle</a>
                <span className="block text-white/40">{total} articles · {chapters.length} chapters</span>
              </span>
            </div>
            <a href="#ask" onClick={jump} className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-ink text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:bg-white transition-colors">
              Ask me a question <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      <div className="bg-paper px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Contents */}
          <nav aria-label="In this guide" className="lg:col-span-3">
            <div className="lg:sticky lg:top-28">
              <span className="block text-[11px] font-medium uppercase tracking-[0.3em] mb-5 text-gold-deep">In this guide</span>
              <ol className="space-y-3 text-sm">
                <li><a href="#answers" onClick={jump} className="text-black/60 hover:text-gold-deep transition-colors">Short answers</a></li>
                {chapters.map((c, i) => (
                  <li key={c.title}>
                    <a href={`#chapter-${i + 1}`} onClick={jump} className="flex gap-3 text-black/60 hover:text-gold-deep transition-colors">
                      <span className="font-serif text-gold-deep/70 w-5 shrink-0">{pad(i + 1)}</span>{c.title}
                    </a>
                  </li>
                ))}
                <li><a href="#ask" onClick={jump} className="text-black/60 hover:text-gold-deep transition-colors">Ask me</a></li>
              </ol>
            </div>
          </nav>

          <div className="lg:col-span-9 space-y-20 md:space-y-24">
            {/* Short answers (also published as FAQPage structured data) */}
            <section id="answers" className="scroll-mt-28">
              <h2 className="font-serif text-4xl md:text-5xl leading-tight mb-3">Short answers</h2>
              <p className="text-black/55 font-light mb-10">The questions I'm asked most, answered in a sentence or two.</p>
              <div className="grid md:grid-cols-2 gap-4 md:gap-5">
                {guide.faqs.map((f) => (
                  <div key={f.q} className="flex flex-col bg-white border border-black/[0.08] rounded-[1rem] p-6 md:p-7">
                    <h3 className="font-serif text-xl leading-snug text-ink mb-3">{f.q}</h3>
                    <p className="text-black/65 font-light leading-relaxed flex-1">{f.a}</p>
                    {ARTICLES.has(f.slug) && (
                      <a href={`/articles/${f.slug}`} onClick={handleLinkClick} className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium tracking-wide text-gold-deep hover:text-ink transition-colors">
                        Full answer <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
              {guide.slug === "doing-business-in-pattaya" && (
                <div className="mt-8">
                  <BusinessCheckPromo source={`guide_${guide.slug}`} />
                  <div className="mt-5">
                    <BusinessCheckPromo source={`guide_${guide.slug}_buying`} buying />
                  </div>
                  <div className="mt-4">
                    <WorkPromo source={`guide_${guide.slug}`} />
                  </div>
                </div>
              )}
              {guide.slug === "buying-property-in-pattaya" && (
                <div className="mt-8">
                  <FuturePromo source={`guide_${guide.slug}`} />
                </div>
              )}
              {(guide.slug === "moving-to-pattaya" || guide.slug === "pattaya-for-families") && (
                <div className="mt-8">
                  <div className="mb-5">
                    <MovePlannerPromo source={`guide_${guide.slug}`} />
                  </div>
                  {guide.slug === "pattaya-for-families" && (
                    <div className="mb-5">
                      <SchoolsPromo source={`guide_${guide.slug}`} />
                    </div>
                  )}
                  <CalculatorPromo source={`guide_${guide.slug}`} />
                  <div className="mt-5">
                    <AreasPromo source={`guide_${guide.slug}`} />
                  </div>
                  <div className="mt-5">
                    <VisaPromo source={`guide_${guide.slug}`} />
                  </div>
                </div>
              )}
            </section>

            {chapters.map((c, i) => (
              <section key={c.title} id={`chapter-${i + 1}`} className="scroll-mt-28">
                <div className="flex items-baseline gap-5 mb-3">
                  <span className="font-serif text-5xl md:text-6xl text-gold-deep/60 leading-none">{pad(i + 1)}</span>
                  <h2 className="font-serif text-3xl md:text-[2.6rem] leading-tight">{c.title}</h2>
                </div>
                <p className="text-black/55 font-light mb-8 md:pl-[4.75rem]">{c.blurb}</p>
                <div className="grid sm:grid-cols-2 gap-4 md:gap-5 md:pl-[4.75rem]">
                  {c.articles.map((a) => (
                    <a
                      key={a.slug}
                      href={`/articles/${a.slug}`}
                      onClick={handleLinkClick}
                      className="group flex flex-col bg-white border border-black/[0.08] rounded-[1rem] p-6 transition-all duration-300 hover:border-gold/60 hover:shadow-xl hover:shadow-black/[0.06]"
                    >
                      <h3 className="font-serif text-xl leading-snug text-ink mb-2 group-hover:text-gold-deep transition-colors">{a.title}</h3>
                      <p className="text-sm text-black/60 leading-relaxed flex-1">{a.description}</p>
                      <span className="mt-4 text-[11px] uppercase tracking-[0.18em] text-black/40">{readMinutes(a.body)} min read</span>
                    </a>
                  ))}
                </div>
              </section>
            ))}

            <section id="ask" className="scroll-mt-28 p-8 md:p-12 bg-cream border border-cream-line rounded-[2rem]">
              <AskShane source={`guide_${guide.slug}`} initialTopic={guide.askTopic} />
            </section>

            <div className="p-8 md:p-12 bg-ink rounded-[2rem] grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-serif text-white mb-2">Get the next article by email</h2>
                <p className="text-white/60 font-light">One short email a week on property, business and life in Pattaya. Free, no spam.</p>
              </div>
              <NewsletterSignup dark source={`guide_${guide.slug}`} />
            </div>
          </div>
        </div>
      </div>

      <section className="bg-ink text-white py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <span className="block text-[11px] font-medium uppercase tracking-[0.3em] mb-8 text-gold">Other guides</span>
          <GuideTiles dark source={`guide_${guide.slug}`} exclude={guide.slug} />
        </div>
      </section>
    </>
  );
}

/** /guides or /guides/<slug>. */
export default function GuidePage({ path }: { path: string }) {
  const slug = path.replace(/\/+$/, "").split("/")[2] || "";
  const guide = slug ? guideBySlug(slug) : undefined;

  useEffect(() => {
    applyPageMeta(guide ? { title: guide.metaTitle, description: guide.description } : GUIDES_META);
  }, [guide]);

  if (slug && !guide) {
    return (
      <div className="min-h-screen bg-paper pt-40 pb-24 px-6 text-center">
        <Noindex />
        <h1 className="text-4xl font-serif mb-4">Guide not found</h1>
        <a href="/guides" onClick={handleLinkClick} className="text-gold-deep font-bold uppercase tracking-widest text-[11px]">All guides</a>
      </div>
    );
  }
  return guide ? <GuideView guide={guide} /> : <GuidesIndex />;
}
