import { ReactNode, useEffect, useState } from "react";
import { ArrowRight, BadgeCheck, ExternalLink, History } from "lucide-react";
import {
  AREA_NAMES,
  FUTURE_CATEGORIES,
  FUTURE_CHECKED,
  FUTURE_FAQS,
  FUTURE_META,
  FutureCategory,
  FutureProject,
  LAUNCHES,
  LAUNCH_AREAS,
  PATTAYA_PROPERTY_URL,
  PROJECTS,
  STATUSES,
  Status,
  launchUrl,
  timelineGroups,
} from "../lib/future";
import { handleLinkClick } from "../lib/navigation";
import { trackEvent } from "../lib/analytics";
import { applyPageMeta } from "../seo";
import AskShane from "./AskShane";
import NewsletterSignup from "./NewsletterSignup";

// /pattaya-future: an honest timeline of what's being built around Pattaya. Each big project has a
// status, the official date next to Shane's guess, how the date has moved, his view and sources.
// Then every new-build project, by area, linked to pattayaproperty.com. Data: src/lib/future.ts.

const STATUS_STYLE: Record<Status, { chip: string; dot: string }> = {
  open: { chip: "bg-emerald-500/10 border-emerald-600/30 text-emerald-700", dot: "bg-emerald-500" },
  building: { chip: "bg-sky-500/10 border-sky-600/30 text-sky-700", dot: "bg-sky-500" },
  approved: { chip: "bg-gold/15 border-gold/50 text-gold-deep", dot: "bg-gold" },
  proposed: { chip: "bg-black/[0.04] border-black/15 text-black/55", dot: "bg-zinc-400" },
  stalled: { chip: "bg-red-500/10 border-red-600/30 text-red-700", dot: "bg-red-500" },
};

const STATUS_ORDER: Status[] = ["open", "building", "approved", "proposed", "stalled"];

const Eyebrow = ({ children }: { children: ReactNode }) => (
  <span className="block text-[11px] font-medium uppercase tracking-[0.3em] mb-5 text-gold-deep">{children}</span>
);

const StatusChip = ({ status }: { status: Status }) => (
  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-[0.12em] ${STATUS_STYLE[status].chip}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLE[status].dot}`} />
    {STATUSES[status].label}
  </span>
);

function ProjectCard({ p }: { p: FutureProject }) {
  const category = FUTURE_CATEGORIES.find((c) => c.id === p.category)?.label;
  return (
    <article id={p.id} className="scroll-mt-28 p-6 md:p-8 rounded-[1.5rem] bg-white border border-black/[0.07]">
      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <StatusChip status={p.status} />
        <span className="text-[11px] uppercase tracking-[0.18em] text-black/40">{category}</span>
      </div>
      <h3 className="font-serif text-2xl md:text-3xl leading-snug mb-3">{p.name}</h3>
      <p className="text-black/65 leading-relaxed mb-6">{p.what}</p>

      {p.status !== "open" && (
        <dl className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-4 rounded-xl bg-black/[0.03]">
            <dt className="text-[10px] uppercase tracking-[0.2em] text-black/45 mb-1">Official line</dt>
            <dd className="text-sm font-medium text-ink leading-snug">{p.official}</dd>
          </div>
          <div className="p-4 rounded-xl bg-gold/10">
            <dt className="text-[10px] uppercase tracking-[0.2em] text-gold-deep mb-1">My guess</dt>
            <dd className="text-sm font-medium text-ink leading-snug">{p.myGuess}</dd>
          </div>
        </dl>
      )}

      <div className="mb-6 pl-5 border-l-2 border-gold">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-ink">What it means for you</span>
          <span
            className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] px-2.5 py-0.5 rounded-full ${
              p.fromShane ? "bg-gold/15 text-gold-deep" : "bg-black/[0.05] text-black/50"
            }`}
          >
            {p.fromShane && <BadgeCheck className="w-3 h-3" />}
            {p.fromShane ? "From my articles" : "My take"}
          </span>
        </div>
        <p className="font-serif text-lg leading-relaxed text-ink/90">{p.meaning}</p>
        {p.href && (
          <a href={p.href} onClick={handleLinkClick} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-gold-deep hover:text-ink">
            Read my full view <ArrowRight className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {p.history && p.history.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-semibold text-black/55 mb-3">
            <History className="w-3.5 h-3.5" /> How the promise has moved
          </div>
          <ol className="relative border-l border-dashed border-black/20 ml-1.5 space-y-3">
            {p.history.map((h, i) => (
              <li key={i} className="pl-4 relative">
                <span className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ${i === p.history!.length - 1 ? STATUS_STYLE[p.status].dot : "bg-black/20"}`} />
                <span className="text-xs font-semibold text-black/50 mr-2">{h.when}</span>
                <span className={`text-sm ${i === p.history!.length - 1 ? "text-ink" : "text-black/55"}`}>{h.said}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-4 border-t border-black/[0.07]">
        {p.areas.map((a) => (
          <a key={a} href={`/areas/${a}`} onClick={handleLinkClick} className="text-xs font-medium text-ink hover:text-gold-deep">
            {AREA_NAMES[a]} <ArrowRight className="inline w-3 h-3 -mt-0.5" />
          </a>
        ))}
        {p.sources.length > 0 && (
          <details className="group w-full sm:w-auto sm:ml-auto">
            <summary className="cursor-pointer list-none text-xs text-black/45 hover:text-ink">
              {p.sources.length} source{p.sources.length > 1 ? "s" : ""} · checked {FUTURE_CHECKED}
              <span className="ml-1 group-open:hidden">+</span>
            </summary>
            <ul className="mt-3 space-y-1.5">
              {p.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-black/60 hover:text-gold-deep underline decoration-black/20 underline-offset-2">
                    {s.label} <ExternalLink className="inline w-3 h-3 -mt-0.5" />
                  </a>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </article>
  );
}

function LaunchArea({ id, note }: { id: (typeof LAUNCH_AREAS)[number]["id"]; note: string }) {
  const list = LAUNCHES.filter((l) => l.area === id).sort((a, b) => a.name.localeCompare(b.name));
  const [all, setAll] = useState(false);
  const shown = all ? list : list.slice(0, 8);
  if (!list.length) return null;
  return (
    <div className="p-6 md:p-7 rounded-[1.5rem] bg-white border border-black/[0.07] flex flex-col">
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <h3 className="font-serif text-2xl">{AREA_NAMES[id]}</h3>
        <span className="text-sm text-gold-deep font-semibold whitespace-nowrap">{list.length} project{list.length > 1 ? "s" : ""}</span>
      </div>
      <p className="text-sm text-black/55 mb-4">{note}</p>
      <ul className="divide-y divide-black/[0.07] border-y border-black/[0.07] flex-1">
        {shown.map((l) => (
          <li key={l.slug}>
            <a
              href={launchUrl(l.slug)}
              target="_blank"
              rel="noopener"
              onClick={() => trackEvent("select_promotion", { promotion_name: "pattaya_property", item_id: l.slug, area: id })}
              className="group flex items-center justify-between gap-3 py-2.5"
            >
              <span className="text-sm text-ink group-hover:text-gold-deep transition-colors">{l.name}</span>
              <span className="text-[10px] uppercase tracking-[0.15em] text-black/40 whitespace-nowrap">{l.type}</span>
            </a>
          </li>
        ))}
      </ul>
      {list.length > 8 && (
        <button type="button" onClick={() => setAll((v) => !v)} className="mt-3 self-start text-xs font-medium text-gold-deep hover:text-ink">
          {all ? "Show fewer" : `Show all ${list.length}`}
        </button>
      )}
    </div>
  );
}

export default function FuturePage() {
  const [category, setCategory] = useState<FutureCategory | "all">("all");
  useEffect(() => {
    applyPageMeta(FUTURE_META);
  }, []);

  const list = category === "all" ? PROJECTS : PROJECTS.filter((p) => p.category === category);
  const groups = timelineGroups(list);
  const counts = STATUS_ORDER.map((s) => ({ s, n: PROJECTS.filter((p) => p.status === s).length })).filter((x) => x.n > 0);

  return (
    <>
      <section className="bg-ink text-white pt-28 md:pt-36 pb-14 md:pb-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <span className="block text-[11px] font-medium uppercase tracking-[0.3em] mb-5 text-gold">Pattaya's future · What's being built</span>
          <h1 className="font-serif font-normal text-[2.6rem] sm:text-6xl lg:text-7xl leading-[1.04] tracking-tight mb-6 max-w-5xl">
            What's really being built in Pattaya, <span className="italic text-gold">and what it means for you.</span>
          </h1>
          <p className="text-lg md:text-xl text-white/65 font-light leading-relaxed max-w-2xl mb-8">
            Airports, trains, motorways and new condos. Sales brochures say they're all coming next year. Here's what's actually happening,
            what's stuck, and what I think each one means for prices and daily life.
          </p>
          <div className="flex items-center gap-3 mb-10">
            <img src="/images/shane-portrait.webp" alt="" width={44} height={44} className="w-11 h-11 rounded-full object-cover" />
            <span className="text-sm text-white/60">
              By <a href="/about" onClick={handleLinkClick} className="text-white hover:text-gold">Shane Ruddle</a>
              <span className="block text-white/40">20 years in Pattaya · last checked {FUTURE_CHECKED}</span>
            </span>
          </div>
          <ul className="flex flex-wrap gap-2.5">
            {counts.map(({ s, n }) => (
              <li key={s} title={STATUSES[s].help} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 bg-white/[0.04] text-sm text-white/80">
                <span className={`w-2 h-2 rounded-full ${STATUS_STYLE[s].dot}`} />
                <span className="font-semibold text-white">{n}</span> {STATUSES[s].label.toLowerCase()}
              </li>
            ))}
            <li>
              <a href="#launches" className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/50 text-sm text-gold hover:bg-gold hover:text-ink transition-colors">
                <span className="font-semibold">{LAUNCHES.length}</span> new condo and villa projects <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="bg-paper px-6 md:px-12 py-14 md:py-20">
        <div className="max-w-7xl mx-auto space-y-16 md:space-y-24">
          <section>
            <div className="grid lg:grid-cols-12 gap-8 mb-10">
              <div className="lg:col-span-7">
                <Eyebrow>The timeline</Eyebrow>
                <h2 className="font-serif text-3xl md:text-5xl leading-tight mb-4">The big projects, in the order they'll really arrive</h2>
                <p className="text-black/60 font-light leading-relaxed">
                  I've watched a lot of projects that would have transformed this city never come off. So each one shows the official
                  line next to my own guess, and how the promise has moved over the years.
                </p>
              </div>
              <dl className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 self-end">
                {STATUS_ORDER.map((s) => (
                  <div key={s} className="flex gap-2.5">
                    <span className={`mt-1.5 w-2 h-2 shrink-0 rounded-full ${STATUS_STYLE[s].dot}`} />
                    <div>
                      <dt className="text-sm font-semibold text-ink">{STATUSES[s].label}</dt>
                      <dd className="text-xs text-black/50 leading-snug">{STATUSES[s].help}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </div>

            <div className="flex flex-wrap gap-2 mb-10" role="tablist" aria-label="Filter projects">
              {[{ id: "all" as const, label: "Everything" }, ...FUTURE_CATEGORIES].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={category === c.id}
                  onClick={() => {
                    setCategory(c.id);
                    trackEvent("select_content", { content_type: "future_filter", item_id: c.id });
                  }}
                  className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                    category === c.id ? "bg-ink border-ink text-white" : "bg-white border-black/10 text-black/65 hover:border-black/30"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <ol className="space-y-12 md:space-y-16">
              {groups.map((g) => (
                <li key={g.key} className="grid md:grid-cols-[160px_1fr] gap-4 md:gap-10">
                  <div className="md:text-right">
                    <div className="md:sticky md:top-28">
                      <span className={`font-serif ${/^\d+$/.test(g.label) ? "text-5xl md:text-6xl" : "text-2xl md:text-3xl"} text-gold-deep leading-none`}>{g.label}</span>
                    </div>
                  </div>
                  <div className="relative md:pl-10 md:border-l md:border-black/10 space-y-6">
                    {g.items.map((p) => (
                      <div key={p.id} className="relative">
                        <span className={`hidden md:block absolute -left-[46px] top-9 w-3 h-3 rounded-full ring-4 ring-paper ${STATUS_STYLE[p.status].dot}`} />
                        <ProjectCard p={p} />
                      </div>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section id="launches" className="scroll-mt-24">
            <div className="grid lg:grid-cols-12 gap-8 mb-10">
              <div className="lg:col-span-8">
                <Eyebrow>New condos and villas</Eyebrow>
                <h2 className="font-serif text-3xl md:text-5xl leading-tight mb-4">Every new-build project, by area</h2>
                <p className="text-black/60 font-light leading-relaxed">
                  The steadiest change in Pattaya isn't a train or an airport. It's the condos and villas going up every year. These are
                  the {LAUNCHES.length} projects on Pattaya Property, our off-plan site. Each page has the developer, prices, payment plan
                  and completion date, kept up to date.
                </p>
              </div>
              <div className="lg:col-span-4 self-end p-6 rounded-[1.5rem] bg-cream border border-cream-line">
                <p className="text-sm text-black/70 leading-relaxed mb-3">
                  <strong className="text-ink">Buying off-plan?</strong> You're buying a promise, so stick to reputable developers. These
                  days it's rare for a building not to be finished. More often, some promised features don't turn out as described.
                </p>
                <a href="/articles/buying-a-condo-in-pattaya" onClick={handleLinkClick} className="inline-flex items-center gap-1 text-xs font-medium text-gold-deep hover:text-ink">
                  Off-plan or resale: my advice <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {LAUNCH_AREAS.map((a) => (
                <LaunchArea key={a.id} id={a.id} note={a.note} />
              ))}
            </div>
            <a
              href={PATTAYA_PROPERTY_URL}
              target="_blank"
              rel="noopener"
              onClick={() => trackEvent("select_promotion", { promotion_name: "pattaya_property", item_id: "all_projects" })}
              className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-ink text-white text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:bg-gold hover:text-ink transition-colors"
            >
              Compare them all on Pattaya Property <ExternalLink className="w-4 h-4" />
            </a>
          </section>

          <section className="grid lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-7">
              <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-8">Pattaya's future: short answers</h2>
              <div className="divide-y divide-black/10 border-y border-black/10">
                {FUTURE_FAQS.map((f) => (
                  <div key={f.q} className="py-6">
                    <h3 className="font-serif text-xl leading-snug mb-2">{f.q}</h3>
                    <p className="text-black/65 font-light leading-relaxed">{f.a}</p>
                    {f.href && (
                      <a href={f.href} onClick={handleLinkClick} className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium tracking-wide text-gold-deep hover:text-ink transition-colors">
                        More <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-5">
              <div className="p-8 bg-cream border border-cream-line rounded-[2rem]">
                <Eyebrow>Seen something going up?</Eyebrow>
                <h2 className="font-serif text-3xl leading-tight mb-3">Tell me, or ask what I think</h2>
                <p className="text-black/60 font-light leading-relaxed mb-6">
                  A new road, a hotel, a condo launch, a rumour from your estate agent. Send it over and I'll add it here if it's real, or
                  tell you what I think about buying near it.
                </p>
                <AskShane source="pattaya_future" initialTopic="buying" showHeading={false} context="Pattaya future timeline" />
              </div>
            </div>
          </section>

          <div className="p-8 md:p-12 bg-ink rounded-[2rem] grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif text-white mb-2">Hear when something changes</h2>
              <p className="text-white/60 font-light">One short email a week on property, business and life in Pattaya. Free, no spam.</p>
            </div>
            <NewsletterSignup dark source="pattaya_future" />
          </div>
        </div>
      </div>
    </>
  );
}
