import { ReactNode, useEffect } from "react";
import { AlertTriangle, ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { FILE_ARTICLES } from "../lib/fileArticles";
import { COUNTRY_RULES_AS_OF, CountryGuide, countryBySlug, sampleBudgets } from "../lib/countries";
import { MOVE_PATH } from "../lib/movePlan";
import { RATES_AS_OF } from "../lib/costOfLiving";
import { handleLinkClick } from "../lib/navigation";
import { trackEvent } from "../lib/analytics";
import { applyPageMeta } from "../seo";
import AskShane from "./AskShane";
import CountryPicker from "./CountryPicker";

// "Moving to Thailand from <country>" (/move-to-thailand/from-the-uk etc.).
// Shared by the build-time prerender and the live app.

const ARTICLES = new Map(FILE_ARTICLES.map((a) => [a.slug, a]));

const Eyebrow = ({ children, dark = false }: { children: ReactNode; dark?: boolean }) => (
  <span className={`block text-[11px] font-medium uppercase tracking-[0.3em] mb-5 ${dark ? "text-gold" : "text-gold-deep"}`}>{children}</span>
);

function CountryView({ c }: { c: CountryGuide }) {
  const budgets = sampleBudgets(c.currency);
  const articles = c.articles.map((s) => ARTICLES.get(s)).filter((a): a is NonNullable<typeof a> => !!a);
  const planHref = `${MOVE_PATH}?from=${c.id}`;
  const toPlanner = (source: string) => trackEvent("select_content", { content_type: "move_planner", source: `country_${c.id}_${source}` });

  return (
    <>
      <section className="bg-ink text-white pt-28 md:pt-36 pb-14 md:pb-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <a href={MOVE_PATH} onClick={handleLinkClick} className="inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.3em] mb-6 text-gold hover:text-white transition-colors">
            <img src={c.flag} alt="" width={36} height={24} className="w-9 h-6 rounded-[3px] object-cover" />
            Moving to Thailand
          </a>
          <h1 className="font-serif font-normal text-[2.6rem] sm:text-6xl lg:text-7xl leading-[1.04] tracking-tight mb-6 max-w-5xl">
            Moving to Thailand from <span className="italic text-gold">{c.name}</span>
          </h1>
          <p className="text-lg md:text-xl text-white/65 font-light leading-relaxed max-w-2xl mb-8">{c.tagline}</p>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-5 mb-12">
            <div className="flex items-center gap-3">
              <img src="/images/shane-portrait.webp" alt="" width={44} height={44} className="w-11 h-11 rounded-full object-cover" />
              <span className="text-sm text-white/60">
                By <a href="/about" onClick={handleLinkClick} className="text-white hover:text-gold">Shane Ruddle</a>
                <span className="block text-white/40">20 years in Pattaya · Rules as of {COUNTRY_RULES_AS_OF}</span>
              </span>
            </div>
            <a
              href={planHref}
              onClick={(e) => {
                toPlanner("hero");
                handleLinkClick(e);
              }}
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-gold text-ink text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:bg-white transition-colors"
            >
              Get my personal move plan <ArrowRight className="w-4 h-4" />
            </a>
          </div>
          <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {c.glance.map((g) => (
              <div key={g.label} className="p-5 rounded-2xl bg-white/[0.05] border border-white/10">
                <dt className="text-[11px] uppercase tracking-[0.18em] text-white/45 mb-2">{g.label}</dt>
                <dd className="font-serif text-xl md:text-2xl text-gold leading-snug">{g.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="bg-paper px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-10 lg:gap-16">
          <nav aria-label="On this page" className="hidden lg:block lg:col-span-3">
            <div className="sticky top-28">
              <Eyebrow>On this page</Eyebrow>
              <ol className="space-y-2.5 text-sm">
                {[...c.sections.map((s) => [s.id, s.title]), ["costs", `What it costs in ${c.currency === "GBP" ? "pounds" : c.currency === "USD" ? "dollars" : "Australian dollars"}`], ["checklist", "Before you leave"], ["faq", "Short answers"], ["ask", "Ask me"]].map(([id, title]) => (
                  <li key={id}>
                    <a href={`#${id}`} className="text-black/55 hover:text-gold-deep transition-colors">{title}</a>
                  </li>
                ))}
              </ol>
            </div>
          </nav>

          <div className="lg:col-span-9 space-y-14 md:space-y-16 min-w-0">
            {c.take && (
              <figure className="flex gap-5 p-7 md:p-9 bg-white border border-black/[0.08] rounded-[1.5rem]">
                <img src="/images/shane-portrait.webp" alt="" width={56} height={56} loading="lazy" className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover shrink-0 ring-2 ring-gold/60" />
                <div>
                  <blockquote className="text-lg text-black/75 leading-relaxed italic mb-3">"{c.take.quote}"</blockquote>
                  <figcaption className="text-[11px] uppercase tracking-[0.2em] text-gold-deep">{c.take.caption}</figcaption>
                </div>
              </figure>
            )}

            {c.sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-28">
                <div className="flex items-baseline gap-4 mb-5">
                  <span className="font-serif text-3xl text-gold-deep/60 leading-none w-8 shrink-0">{i + 1}</span>
                  <h2 className="font-serif text-3xl md:text-4xl leading-tight">{s.title}</h2>
                </div>
                <div className="md:pl-12">
                  {s.paras.map((p) => (
                    <p key={p} className="text-lg text-black/70 font-light leading-relaxed mb-4">{p}</p>
                  ))}
                  {s.points && (
                    <ul className="mt-5 space-y-3 p-6 bg-white border border-black/[0.08] rounded-[1.25rem]">
                      {s.points.map((p) => (
                        <li key={p} className="flex gap-3 text-black/75"><Check className="w-4 h-4 mt-1 text-gold-deep shrink-0" />{p}</li>
                      ))}
                    </ul>
                  )}
                  {s.links && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {s.links.map((l) => (
                        <a
                          key={l.href}
                          href={l.href}
                          onClick={(e) => {
                            trackEvent("select_content", { content_type: "country_link", item: l.href, source: `country_${c.id}_${s.id}` });
                            handleLinkClick(e);
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-black/15 bg-white text-sm text-ink hover:border-gold-deep hover:text-gold-deep transition-colors"
                        >
                          {l.label} <ArrowRight className="w-3.5 h-3.5" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            ))}

            <section id="costs" className="scroll-mt-28 p-8 md:p-12 bg-ink text-white rounded-[2rem]">
              <Eyebrow dark>What Pattaya costs</Eyebrow>
              <h2 className="font-serif text-3xl md:text-4xl leading-snug mb-3">A month in Pattaya, in {c.currency === "GBP" ? "pounds" : c.currency === "USD" ? "dollars" : "Australian dollars"}</h2>
              <p className="text-white/55 font-light mb-8">Everything: rent, food, getting around, bills, health insurance and a social life. Open one to change anything.</p>
              <div className="grid md:grid-cols-3 gap-3">
                {budgets.map((b) => (
                  <a
                    key={b.label}
                    href={b.href}
                    onClick={(e) => {
                      trackEvent("select_content", { content_type: "calculator", source: `country_${c.id}` });
                      handleLinkClick(e);
                    }}
                    className="group flex flex-col p-6 rounded-[1.25rem] bg-white/[0.05] border border-white/10 hover:border-gold/70 transition-colors"
                  >
                    <span className="text-[11px] uppercase tracking-[0.18em] text-white/50 mb-3">{b.label}</span>
                    <span className="font-serif text-4xl text-gold leading-none mb-1">{b.main}</span>
                    <span className="text-sm text-white/45 mb-4">{b.baht} a month</span>
                    <span className="text-sm text-white/60 leading-relaxed flex-1">{b.sub}</span>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-white/70 group-hover:text-gold">Change it <ArrowRight className="w-3.5 h-3.5" /></span>
                  </a>
                ))}
              </div>
              <p className="mt-6 text-xs text-white/40">Exchange rates as of {RATES_AS_OF}. Figures from my cost of living calculator.</p>
            </section>

            <section id="checklist" className="scroll-mt-28 grid md:grid-cols-5 gap-6 md:gap-10 p-8 md:p-12 bg-cream border border-cream-line rounded-[2rem]">
              <div className="md:col-span-2">
                <Eyebrow>Before you leave</Eyebrow>
                <h2 className="font-serif text-3xl leading-tight mb-4">Your checklist for leaving {c.name}</h2>
                <p className="text-black/60 font-light leading-relaxed mb-6">Want it turned into a month-by-month plan with your visa, area and budget?</p>
                <a
                  href={planHref}
                  onClick={(e) => {
                    toPlanner("checklist");
                    handleLinkClick(e);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-ink text-white text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:bg-gold hover:text-ink transition-colors"
                >
                  Make my plan <ArrowRight className="w-4 h-4" />
                </a>
              </div>
              <ul className="md:col-span-3 space-y-3.5">
                {c.checklist.map((item) => (
                  <li key={item} className="flex gap-3 text-black/75 leading-relaxed">
                    <span className="mt-0.5 w-5 h-5 rounded-md border-2 border-gold-deep/60 shrink-0" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section id="faq" className="scroll-mt-28">
              <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-8">Moving from {c.name}: short answers</h2>
              <div className="divide-y divide-black/10 border-y border-black/10">
                {c.faqs.map((f) => (
                  <div key={f.q} className="py-6">
                    <h3 className="font-serif text-xl leading-snug mb-2">{f.q}</h3>
                    <p className="text-black/65 font-light leading-relaxed">{f.a}</p>
                  </div>
                ))}
              </div>
              <p className="mt-6 flex gap-3 text-sm text-black/50 leading-relaxed">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  Pension, tax and visa rules change often, and I'm not a tax adviser. Treat this as a guide and check the official pages before you act:{" "}
                  {c.official.map((o, i) => (
                    <span key={o.url}>
                      {i > 0 && " · "}
                      <a href={o.url} target="_blank" rel="noopener" className="underline underline-offset-4 hover:text-gold-deep">
                        {o.label} <ArrowUpRight className="inline w-3 h-3" />
                      </a>
                    </span>
                  ))}
                </span>
              </p>
            </section>

            {articles.length > 0 && (
              <section>
                <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-8">Read more</h2>
                <div className="grid sm:grid-cols-2 gap-4 md:gap-5">
                  {articles.map((a) => (
                    <a
                      key={a.slug}
                      href={`/articles/${a.slug}`}
                      onClick={handleLinkClick}
                      className="group flex flex-col bg-white border border-black/[0.08] rounded-[1rem] p-6 transition-all duration-300 hover:border-gold/60 hover:shadow-xl hover:shadow-black/[0.06]"
                    >
                      <h3 className="font-serif text-xl leading-snug text-ink mb-2 group-hover:text-gold-deep transition-colors">{a.title}</h3>
                      <p className="text-sm text-black/60 leading-relaxed">{a.description}</p>
                    </a>
                  ))}
                </div>
              </section>
            )}

            <section id="ask" className="scroll-mt-28 p-8 md:p-12 bg-cream border border-cream-line rounded-[2rem]">
              <AskShane
                source={`country_${c.id}`}
                initialTopic={c.askTopic}
                context={`Moving from ${c.name}`}
                contextNote={`I'll know you're moving from ${c.name}.`}
              />
            </section>
          </div>
        </div>
      </div>

      <section className="bg-ink text-white py-14 md:py-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <CountryPicker dark source={`country_${c.id}_others`} exclude={c.id} label="Moving from somewhere else?" />
        </div>
      </section>
    </>
  );
}

/** /move-to-thailand/<from-the-uk|from-the-usa|from-australia>. */
export default function CountryPage({ path }: { path: string }) {
  const slug = path.replace(/\/+$/, "").split("/")[2] || "";
  const c = countryBySlug(slug);

  useEffect(() => {
    if (c) applyPageMeta({ title: c.metaTitle, description: c.description });
  }, [c]);

  if (!c) {
    return (
      <div className="min-h-screen bg-paper pt-40 pb-24 px-6 text-center">
        <h1 className="text-4xl font-serif mb-4">Page not found</h1>
        <a href={MOVE_PATH} onClick={handleLinkClick} className="text-gold-deep font-bold uppercase tracking-widest text-[11px]">Plan my move</a>
      </div>
    );
  }
  return <CountryView key={c.id} c={c} />;
}
