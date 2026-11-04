import { MouseEvent, ReactNode, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, MapPin, RotateCcw, X } from "lucide-react";
import { FILE_ARTICLES } from "../lib/fileArticles";
import {
  AREAS,
  AREAS_FAQS,
  AREAS_META,
  AreaId,
  MATCH_QUESTIONS,
  MatchAnswers,
  PattayaArea,
  answersSummary,
  areaById,
  areaBySlug,
  ecreUrl,
  matchArea,
} from "../lib/areas";
import { CALCULATOR_PATH, RENT, formatBaht } from "../lib/costOfLiving";
import { handleLinkClick, navigate } from "../lib/navigation";
import { trackEvent } from "../lib/analytics";
import { applyPageMeta } from "../seo";
import AskShane from "./AskShane";
import SchoolsPromo from "./SchoolsPromo";
import FuturePromo from "./FuturePromo";
import NewsletterSignup from "./NewsletterSignup";
import EmailMyResult from "./EmailMyResult";
import PattayaMap from "./PattayaMap";

// Pattaya areas: /areas (interactive map + "which area suits you?" matcher) and /areas/<slug>.
// Shared by the build-time prerender and the live app.

const ARTICLES = new Map(FILE_ARTICLES.map((a) => [a.slug, a]));

const Eyebrow = ({ children, dark = false }: { children: ReactNode; dark?: boolean }) => (
  <span className={`block text-[11px] font-medium uppercase tracking-[0.3em] mb-5 ${dark ? "text-gold" : "text-gold-deep"}`}>{children}</span>
);

// In-page links scroll without touching history (see GuidePage).
const jump = (e: MouseEvent<HTMLAnchorElement>) => {
  const id = e.currentTarget.getAttribute("href")?.slice(1);
  const el = id && document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  el.scrollIntoView({ behavior: "smooth", block: "start" });
};

function RentalsButton({ area, source, dark = false }: { area: PattayaArea; source: string; dark?: boolean }) {
  return (
    <a
      href={ecreUrl(`area_${area.id}`)}
      target="_blank"
      rel="noopener"
      onClick={() => trackEvent("select_promotion", { promotion_name: "ecre_rentals", creative_slot: source, area: area.id })}
      className={`inline-flex items-center gap-2 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] rounded-full transition-colors ${
        dark ? "border border-white/25 text-white hover:border-gold hover:text-gold" : "border border-black/15 text-ink hover:border-gold-deep hover:text-gold-deep"
      }`}
    >
      Rentals in {area.name.split(" & ")[0]} <ArrowUpRight className="w-4 h-4" />
    </a>
  );
}

// ---------------------------------------------------------------------------------------------
// Matcher

function AreaFinder({ source }: { source: string }) {
  const [answers, setAnswers] = useState<MatchAnswers>({});
  const [step, setStep] = useState(0);
  const [asking, setAsking] = useState(false);
  const started = useRef(false);
  const done = step >= MATCH_QUESTIONS.length;
  const result = done ? matchArea(answers) : null;
  const q = MATCH_QUESTIONS[step];

  const answer = (id: string) => {
    if (!started.current) {
      started.current = true;
      trackEvent("area_finder_start", { source });
    }
    const next = { ...answers, [q.id]: id };
    setAnswers(next);
    setStep(step + 1);
    document.getElementById("finder")?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (step + 1 >= MATCH_QUESTIONS.length) {
      const r = matchArea(next);
      trackEvent("area_finder_complete", { source, area: r.area.id, runner_up: r.runnerUp.id, ...next });
    }
  };

  const restart = () => {
    setAnswers({});
    setStep(0);
    setAsking(false);
  };

  if (result) {
    const { area, runnerUp, reasons } = result;
    return (
      <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        <div className="lg:col-span-7">
          <span className="block text-[11px] uppercase tracking-[0.25em] text-gold-deep mb-3">Your best match</span>
          <h3 className="font-serif text-5xl md:text-6xl leading-none text-ink mb-3">{area.name}</h3>
          <p className="text-lg text-black/55 font-light mb-6">{area.tagline}</p>
          {reasons.length > 0 && (
            <p className="text-black/75 leading-relaxed mb-4">
              It fits because {reasons.length > 1 ? `${reasons.slice(0, -1).join(", ")} and ${reasons[reasons.length - 1]}` : reasons[0]}.
            </p>
          )}
          <p className="text-black/75 leading-relaxed mb-6">{area.verdict[0]}</p>
          <div className="flex items-start gap-3 p-5 bg-white border border-black/[0.08] rounded-2xl mb-8">
            <span className="font-serif text-3xl text-gold-deep leading-none">฿</span>
            <p className="text-sm text-black/70 leading-relaxed">
              <span className="block text-[11px] uppercase tracking-[0.2em] text-black/45 mb-1">What ฿20,000 a month rents</span>
              {area.rent20k}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 mb-6">
            <a
              href={`/areas/${area.slug}`}
              onClick={(e) => {
                trackEvent("select_area", { area: area.id, source: `${source}_result` });
                handleLinkClick(e);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-ink text-white text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:bg-gold hover:text-ink transition-colors"
            >
              My {area.name.split(" & ")[0]} guide <ArrowRight className="w-4 h-4" />
            </a>
            <RentalsButton area={area} source={`${source}_result`} />
            <button
              type="button"
              onClick={() => setAsking(true)}
              className="inline-flex items-center gap-2 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] rounded-full border border-gold-deep/40 text-gold-deep hover:bg-gold hover:text-ink hover:border-gold transition-colors"
            >
              Ask me about it
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-black/50">
            <span>
              Runner-up:{" "}
              <a href={`/areas/${runnerUp.slug}`} onClick={handleLinkClick} className="text-ink underline decoration-gold/60 underline-offset-4 hover:text-gold-deep">
                {runnerUp.name}
              </a>
            </span>
            <button type="button" onClick={restart} className="inline-flex items-center gap-1.5 hover:text-ink">
              <RotateCcw className="w-3.5 h-3.5" /> Start again
            </button>
          </div>
        </div>
        <div className="lg:col-span-5 bg-ink rounded-[1.5rem] p-5 md:p-6">
          <PattayaMap active={area.id} matched={[runnerUp.id]} title={`Map of Pattaya showing ${area.name}`} />
        </div>
        <div className="lg:col-span-12">
          <EmailMyResult
            tool="area_finder"
            segment={area.askTopic === "buying" ? "property" : area.askTopic === "retiring" ? "retiring" : "moving"}
            title="Pattaya area match"
            summary={`Your best area: ${area.name} (runner-up: ${runnerUp.name})\n${answersSummary(answers, result).split("\n").slice(1, -1).join("\n")}`}
            link={`https://shaneruddle.com/areas/${area.slug}`}
          />
        </div>

        {asking && (
          <div className="lg:col-span-12 p-7 md:p-10 bg-white border border-black/[0.08] rounded-[1.5rem]">
            <AskShane
              source={`${source}_${area.id}`}
              initialTopic={area.askTopic}
              context={answersSummary(answers, result)}
              contextNote="I'll see your area finder answers with your question."
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 mb-8" aria-hidden>
        {MATCH_QUESTIONS.map((mq, i) => (
          <span key={mq.id} className={`h-1 flex-1 rounded-full transition-colors ${i < step ? "bg-gold" : i === step ? "bg-ink" : "bg-black/10"}`} />
        ))}
      </div>
      <span className="block text-[11px] uppercase tracking-[0.25em] text-black/45 mb-3">
        Question {step + 1} of {MATCH_QUESTIONS.length}
      </span>
      <h3 className="font-serif text-4xl md:text-5xl leading-tight text-ink mb-8">{q.question}</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        {q.options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => answer(o.id)}
            className={`group flex items-center justify-between gap-4 text-left px-6 py-5 rounded-2xl border transition-all ${
              answers[q.id] === o.id ? "border-gold bg-gold/10" : "border-black/10 bg-white hover:border-gold hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/[0.05]"
            }`}
          >
            <span className="text-lg text-ink">{o.label}</span>
            <ArrowRight className="w-4 h-4 text-gold-deep opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </button>
        ))}
      </div>
      {step > 0 && (
        <button type="button" onClick={() => setStep(step - 1)} className="mt-6 inline-flex items-center gap-1.5 text-sm text-black/50 hover:text-ink">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Hub

function AreaPanel({ area, onClose }: { area: PattayaArea; onClose: () => void }) {
  return (
    <div className="relative">
      <button type="button" onClick={onClose} aria-label="Close" className="absolute -top-1 right-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-gold hover:text-ink transition-colors">
        <X className="w-4 h-4" />
      </button>
      <span className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-gold mb-3"><MapPin className="w-3.5 h-3.5" /> {area.tagline}</span>
      <h2 className="font-serif text-4xl md:text-5xl leading-none mb-5 pr-10">{area.name}</h2>
      <p className="text-white/70 font-light leading-relaxed mb-6">{area.verdict[0]}</p>
      <span className="block text-[11px] uppercase tracking-[0.2em] text-white/40 mb-3">Best for</span>
      <ul className="space-y-2 mb-6">
        {area.suits.map((s) => (
          <li key={s} className="flex gap-2.5 text-white/80"><Check className="w-4 h-4 mt-1 text-gold shrink-0" />{s}</li>
        ))}
      </ul>
      <p className="text-sm text-white/60 mb-7"><span className="text-gold font-serif text-lg mr-1.5">฿20k</span>{area.rent20k}</p>
      <div className="flex flex-wrap gap-3">
        <a
          href={`/areas/${area.slug}`}
          onClick={(e) => {
            trackEvent("select_area", { area: area.id, source: "areas_map" });
            handleLinkClick(e);
          }}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-ink text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:bg-white transition-colors"
        >
          Full guide <ArrowRight className="w-4 h-4" />
        </a>
        <RentalsButton dark area={area} source="areas_map" />
      </div>
    </div>
  );
}

function AreasHub() {
  const [selected, setSelected] = useState<AreaId | null>(null);
  const [hovered, setHovered] = useState<PattayaArea | null>(null);
  const area = selected ? areaById(selected) : null;

  return (
    <>
      <section className="bg-ink text-white pt-28 md:pt-36 pb-14 md:pb-20 px-6 md:px-12 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div id="area-panel" className="lg:col-span-6 order-2 lg:order-1 scroll-mt-24">
            {area ? (
              <AreaPanel area={area} onClose={() => setSelected(null)} />
            ) : (
              <>
                <Eyebrow dark>Pattaya areas</Eyebrow>
                <h1 className="font-serif font-normal text-[2.6rem] sm:text-6xl lg:text-7xl leading-[1.04] tracking-tight mb-6">
                  Where should you <span className="italic text-gold">live</span> in Pattaya?
                </h1>
                <p className="text-lg md:text-xl text-white/65 font-light leading-relaxed max-w-xl mb-8">
                  I've lived here for over 20 years and our agencies rent homes right across the city. Tap an area on the map for my verdict, or answer four questions and I'll suggest one.
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <a href="#finder" onClick={jump} className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-ink text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:bg-white transition-colors">
                    Find my area <ArrowRight className="w-4 h-4" />
                  </a>
                  <span className="text-sm text-white/45">{hovered ? `${hovered.name}: ${hovered.tagline}` : "Or tap the map"}</span>
                </div>
              </>
            )}
          </div>
          <div className="lg:col-span-6 order-1 lg:order-2 max-w-[320px] sm:max-w-[400px] lg:max-w-[440px] w-full mx-auto">
            <PattayaMap
              active={selected}
              onHover={setHovered}
              onSelect={(a, e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                e.preventDefault();
                setSelected(a.id);
                trackEvent("select_area", { area: a.id, source: "areas_map_tap" });
                if (window.innerWidth < 1024) setTimeout(() => document.getElementById("area-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
              }}
            />
          </div>
        </div>
      </section>

      <section id="finder" className="bg-cream border-b border-cream-line py-16 md:py-24 px-6 md:px-12 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <Eyebrow>Area finder</Eyebrow>
          <h2 className="font-serif text-4xl md:text-5xl leading-tight mb-3">Which part of Pattaya suits you?</h2>
          <p className="text-black/55 font-light mb-10 md:mb-14 max-w-2xl">Four quick questions. I'll give you the area I'd point you to, and a runner-up.</p>
          <AreaFinder source="area_finder" />
        </div>
      </section>

      <section className="bg-paper py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <Eyebrow>All six areas</Eyebrow>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {AREAS.map((a) => (
              <a
                key={a.id}
                href={`/areas/${a.slug}`}
                onClick={(e) => {
                  trackEvent("select_area", { area: a.id, source: "areas_grid" });
                  handleLinkClick(e);
                }}
                className="group flex flex-col min-h-[15rem] p-7 md:p-8 bg-white border border-black/[0.08] rounded-[1.25rem] transition-all duration-300 hover:-translate-y-1 hover:border-gold/60 hover:shadow-xl hover:shadow-black/[0.06]"
              >
                <span className="text-[11px] uppercase tracking-[0.22em] text-black/45 mb-2">{a.tagline}</span>
                <span className="font-serif text-3xl leading-snug text-ink mb-3 group-hover:text-gold-deep transition-colors">{a.name}</span>
                <span className="text-sm text-black/60 leading-relaxed mb-5">Best for: {a.suits[0].toLowerCase()}.</span>
                <span className="mt-auto flex items-center justify-between text-xs text-black/50">
                  <span>฿20k a month: {a.rent20k.split(/[.,]/)[0].toLowerCase()}</span>
                  <ArrowRight className="w-4 h-4 text-gold-deep transition-transform group-hover:translate-x-1" />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-paper border-t border-black/10 py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7">
            <h2 className="font-serif text-4xl md:text-5xl leading-tight mb-8">Short answers</h2>
            <div className="space-y-4">
              {AREAS_FAQS.map((f) => (
                <div key={f.q} className="bg-white border border-black/[0.08] rounded-[1rem] p-6 md:p-7">
                  <h3 className="font-serif text-xl leading-snug text-ink mb-2">{f.q}</h3>
                  <p className="text-black/65 font-light leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
            <a href="/articles/best-area-to-live-in-pattaya" onClick={handleLinkClick} className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-gold-deep hover:text-ink">
              Read the full article: the best area to live in Pattaya <ArrowRight className="w-4 h-4" />
            </a>
          </div>
          <div id="ask" className="lg:col-span-5 p-7 md:p-10 bg-cream border border-cream-line rounded-[2rem] self-start scroll-mt-28">
            <AskShane source="areas_hub" initialTopic="renting" />
          </div>
        </div>
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// One area

const HOME_LABELS = [
  ["condo1", "1-bed condo"],
  ["condo2", "2-bed condo"],
  ["house", "House, no pool"],
  ["housePool", "House with pool"],
] as const;

function AreaView({ area }: { area: PattayaArea }) {
  const articles = area.articles.map((s) => ARTICLES.get(s)).filter((a): a is NonNullable<typeof a> => !!a);
  const others = AREAS.filter((a) => a.id !== area.id);
  const short = area.name.split(" & ")[0];

  return (
    <>
      <section className="bg-ink text-white pt-28 md:pt-36 pb-14 md:pb-20 px-6 md:px-12 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div className="lg:col-span-7">
            <a href="/areas" onClick={handleLinkClick} className="block text-[11px] font-medium uppercase tracking-[0.3em] mb-5 text-gold hover:text-white transition-colors">
              Pattaya areas · Where to live
            </a>
            <h1 className="font-serif font-normal text-[2.6rem] sm:text-6xl lg:text-7xl leading-[1.04] tracking-tight mb-5">Living in {area.name}</h1>
            <p className="text-lg md:text-xl text-white/65 font-light leading-relaxed max-w-2xl mb-10">{area.tagline}. My honest verdict after 20 years in Pattaya.</p>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-5">
              <div className="flex items-center gap-3">
                <img src="/images/shane-portrait.webp" alt="" width={44} height={44} className="w-11 h-11 rounded-full object-cover" />
                <span className="text-sm text-white/60">
                  By <a href="/about" onClick={handleLinkClick} className="text-white hover:text-gold">Shane Ruddle</a>
                  <span className="block text-white/40">Pattaya resident since 2007</span>
                </span>
              </div>
              <RentalsButton dark area={area} source="area_hero" />
            </div>
          </div>
          <div className="lg:col-span-5 max-w-[340px] w-full mx-auto">
            <PattayaMap
              active={area.id}
              title={`Map of Pattaya showing ${area.name}`}
              onSelect={(a, e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                e.preventDefault();
                trackEvent("select_area", { area: a.id, source: `area_${area.id}_map` });
                navigate(`/areas/${a.slug}`);
              }}
            />
          </div>
        </div>
      </section>

      <div className="bg-paper px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-5xl mx-auto space-y-16 md:space-y-20">
          <section>
            <Eyebrow>My verdict</Eyebrow>
            {area.verdict.map((p) => (
              <p key={p} className="font-serif text-2xl md:text-[1.9rem] leading-snug text-ink mb-5">{p}</p>
            ))}
          </section>

          <section className="grid md:grid-cols-2 gap-4 md:gap-5">
            <div className="p-7 md:p-8 bg-white border border-black/[0.08] rounded-[1.25rem]">
              <h2 className="font-serif text-2xl mb-5">Who it suits</h2>
              <ul className="space-y-3">
                {area.suits.map((s) => (
                  <li key={s} className="flex gap-3 text-black/75"><Check className="w-4 h-4 mt-1 text-gold-deep shrink-0" />{s}</li>
                ))}
              </ul>
            </div>
            <div className="p-7 md:p-8 bg-white border border-black/[0.08] rounded-[1.25rem]">
              <h2 className="font-serif text-2xl mb-5">Who should look elsewhere</h2>
              <ul className="space-y-3">
                {area.notFor.map((s) => (
                  <li key={s} className="flex gap-3 text-black/75"><X className="w-4 h-4 mt-1 text-black/35 shrink-0" />{s}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className="p-8 md:p-12 bg-ink text-white rounded-[2rem]">
            <span className="block text-[11px] uppercase tracking-[0.3em] text-gold mb-4">Rent in {area.name}, 2026</span>
            <h2 className="font-serif text-3xl md:text-4xl leading-snug mb-2">What does ฿20,000 a month get you?</h2>
            <p className="text-white/70 text-lg font-light mb-8">{area.rent20k}</p>
            {area.calcArea && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                  {HOME_LABELS.map(([id, label]) => (
                    <div key={id} className="p-5 rounded-2xl bg-white/[0.05] border border-white/10">
                      <span className="block text-[11px] uppercase tracking-[0.18em] text-white/45 mb-2">{label}</span>
                      <span className="font-serif text-3xl text-gold">{formatBaht(RENT[area.calcArea!][id])}</span>
                      <span className="block text-xs text-white/40 mt-1">a month, roughly</span>
                    </div>
                  ))}
                </div>
                <a
                  href={`${CALCULATOR_PATH}?area=${area.calcArea}`}
                  onClick={(e) => {
                    trackEvent("select_content", { content_type: "cost_calculator", source: `area_${area.id}` });
                    handleLinkClick(e);
                  }}
                  className="inline-flex items-center gap-2 mr-4 mb-3 px-6 py-3 bg-gold text-ink text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:bg-white transition-colors"
                >
                  Full monthly budget for {short} <ArrowRight className="w-4 h-4" />
                </a>
              </>
            )}
            <RentalsButton dark area={area} source="area_rent" />
          </section>

          <section>
            <Eyebrow>Where I'd send you</Eyebrow>
            <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-8">My {short} picks</h2>
            <div className="grid sm:grid-cols-2 gap-4 md:gap-5">
              {area.picks.map((p) => {
                const body = (
                  <>
                    <span className="flex items-center justify-between gap-3 mb-2">
                      <span className="font-serif text-xl text-ink">{p.name}</span>
                      {p.mine && <span className="text-[10px] uppercase tracking-[0.18em] text-gold-deep bg-gold/10 px-2.5 py-1 rounded-full whitespace-nowrap">My business</span>}
                    </span>
                    <span className="text-sm text-black/60 leading-relaxed">{p.note}</span>
                  </>
                );
                return p.url ? (
                  <a
                    key={p.name}
                    href={p.url}
                    target="_blank"
                    rel="noopener"
                    onClick={() => trackEvent("click", { link_url: p.url, outbound: true, source: `area_${area.id}_picks` })}
                    className="flex flex-col p-6 bg-white border border-black/[0.08] rounded-[1rem] hover:border-gold/60 hover:shadow-lg hover:shadow-black/[0.05] transition-all"
                  >
                    {body}
                  </a>
                ) : (
                  <div key={p.name} className="flex flex-col p-6 bg-white border border-black/[0.08] rounded-[1rem]">{body}</div>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-8">Short answers</h2>
            <div className="grid md:grid-cols-3 gap-4 md:gap-5">
              {area.faqs.map((f) => (
                <div key={f.q} className="bg-white border border-black/[0.08] rounded-[1rem] p-6">
                  <h3 className="font-serif text-xl leading-snug text-ink mb-3">{f.q}</h3>
                  <p className="text-black/65 font-light leading-relaxed text-[15px]">{f.a}</p>
                </div>
              ))}
            </div>
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

          {area.id === "east" && <SchoolsPromo source="area_east" />}

          <FuturePromo source={`area_${area.id}`} />

          <section id="ask" className="scroll-mt-28 p-8 md:p-12 bg-cream border border-cream-line rounded-[2rem]">
            <AskShane source={`area_${area.id}`} initialTopic={area.askTopic} context={`Area page: ${area.name}`} contextNote={`I'll know you're asking about ${area.name}.`} />
          </section>

          <div className="p-8 md:p-12 bg-ink rounded-[2rem] grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif text-white mb-2">Get the next article by email</h2>
              <p className="text-white/60 font-light">One short email a week on property, business and life in Pattaya. Free, no spam.</p>
            </div>
            <NewsletterSignup dark source={`area_${area.id}`} />
          </div>
        </div>
      </div>

      <section className="bg-ink text-white py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <span className="block text-[11px] font-medium uppercase tracking-[0.3em] text-gold">Other areas</span>
            <a href="/areas" onClick={handleLinkClick} className="text-sm text-white/60 hover:text-gold">Not sure? Take the area finder →</a>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {others.map((a) => (
              <a
                key={a.id}
                href={`/areas/${a.slug}`}
                onClick={(e) => {
                  trackEvent("select_area", { area: a.id, source: `area_${area.id}_others` });
                  handleLinkClick(e);
                }}
                className="group p-6 rounded-[1rem] bg-white/[0.04] border border-white/10 hover:border-gold/70 transition-colors"
              >
                <span className="block font-serif text-2xl text-white group-hover:text-gold mb-1">{a.name}</span>
                <span className="block text-xs text-white/50">{a.tagline}</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

/** /areas or /areas/<slug>. */
export default function AreasPage({ path }: { path: string }) {
  const slug = path.replace(/\/+$/, "").split("/")[2] || "";
  const area = slug ? areaBySlug(slug) : undefined;

  useEffect(() => {
    applyPageMeta(area ? { title: area.metaTitle, description: area.description } : AREAS_META);
  }, [area]);

  if (slug && !area) {
    return (
      <div className="min-h-screen bg-paper pt-40 pb-24 px-6 text-center">
        <h1 className="text-4xl font-serif mb-4">Area not found</h1>
        <a href="/areas" onClick={handleLinkClick} className="text-gold-deep font-bold uppercase tracking-widest text-[11px]">All areas</a>
      </div>
    );
  }
  return area ? <AreaView key={area.id} area={area} /> : <AreasHub />;
}
