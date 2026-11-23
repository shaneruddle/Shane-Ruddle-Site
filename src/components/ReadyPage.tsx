import { ReactNode, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Link2, RotateCcw, X } from "lucide-react";
import {
  AREAS,
  QUESTIONS,
  READY_FAQS,
  READY_META,
  READY_PATH,
  ReadyAnswers,
  ReadyResult,
  ReadyWho,
  TIERS,
  WHO_OPTIONS,
  areaLabel,
  questionText,
  readyFromSearch,
  readyQuery,
  readySummary,
  scoreReady,
} from "../lib/ready";
import { handleLinkClick } from "../lib/navigation";
import { trackEvent } from "../lib/analytics";
import { applyPageMeta } from "../seo";
import AskShane from "./AskShane";
import NewsletterSignup from "./NewsletterSignup";
import EmailMyResult from "./EmailMyResult";

// /ready-for-pattaya: "Are you ready for Pattaya?" A scorecard in the style of ScoreApp quizzes.
// Pick who's moving, answer 15 yes/no questions (one at a time), get a score out of 100, a bar per
// area, a verdict, and a fix for every "no" that links to the tool or article that sorts it out.
// The score is free; the full report can be emailed (EmailMyResult). Answers live in the URL.

const ECRE_RENTALS = "https://www.thaiproperty.com/?utm_source=shaneruddle.com&utm_medium=referral&utm_campaign=readiness_score";

const Eyebrow = ({ children }: { children: ReactNode }) => (
  <span className="block text-[11px] font-medium uppercase tracking-[0.3em] mb-5 text-gold-deep">{children}</span>
);

const TIER_COLOUR = { ready: "text-emerald-300", nearly: "text-gold", "not-yet": "text-red-300" } as const;
const TIER_STROKE = { ready: "#6ee7b7", nearly: "#c9a961", "not-yet": "#fca5a5" } as const;

function ScoreRing({ score, tier }: { score: number; tier: ReadyResult["tier"] }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative w-40 h-40 md:w-48 md:h-48 shrink-0">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90" aria-hidden>
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={TIER_STROKE[tier]} strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-serif text-5xl md:text-6xl text-white leading-none">{score}</span>
        <span className="text-xs text-white/45 mt-4">out of 100</span>
      </div>
    </div>
  );
}

function Result({ who, answers, onRetake }: { who: ReadyWho; answers: ReadyAnswers; onRetake: () => void }) {
  const r = scoreReady(who, answers);
  const [copied, setCopied] = useState(false);
  const link = `https://shaneruddle.com${READY_PATH}${readyQuery(who, answers)}`;
  const homeGap = r.fixes.some((f) => f.area === "home" && (f.fix.href === "/areas" || f.fix.href.includes("renting-a-condo")));

  const share = async () => {
    trackEvent("share", { method: "copy_link", content_type: "readiness_score", score: r.score });
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title: "Are you ready for Pattaya?", text: `I scored ${r.score}/100 on Shane Ruddle's Pattaya readiness score. What's yours?`, url: `https://shaneruddle.com${READY_PATH}` });
        return;
      }
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* user cancelled */
    }
  };

  return (
    <div className="max-w-4xl" aria-live="polite">
      <div className="p-7 md:p-10 rounded-[1.75rem] border border-white/15 bg-white/[0.04]">
        <div className="flex flex-col sm:flex-row sm:items-center gap-7 md:gap-10">
          <ScoreRing score={r.score} tier={r.tier} />
          <div>
            <span className="block text-[11px] uppercase tracking-[0.22em] text-white/45 mb-2">Your Pattaya readiness score</span>
            <h2 className={`font-serif text-4xl md:text-5xl leading-tight mb-3 ${TIER_COLOUR[r.tier]}`}>{TIERS[r.tier].label}</h2>
            <p className="text-lg text-white/70 font-light leading-relaxed">{TIERS[r.tier].line}</p>
          </div>
        </div>

        <div className="mt-10 space-y-4">
          {r.areas.map((a) => (
            <div key={a.id}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className={a.id === r.weakest && r.fixes.length ? "text-gold" : "text-white/80"}>
                  {a.label}
                  {a.id === r.weakest && r.fixes.length > 0 && <span className="ml-2 text-[10px] uppercase tracking-[0.18em]">Start here</span>}
                </span>
                <span className="text-white/50">{a.score}/20</span>
              </div>
              <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full ${a.yes === a.of ? "bg-emerald-400/80" : a.yes === 0 ? "bg-red-400/70" : "bg-gold/80"}`}
                  style={{ width: `${Math.max(3, (a.score / 20) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap gap-5">
          <button type="button" onClick={share} className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-gold">
            {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />} {copied ? "Link copied" : "Share my score"}
          </button>
          <button type="button" onClick={onRetake} className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-gold">
            <RotateCcw className="w-4 h-4" /> Take it again
          </button>
        </div>
      </div>

      {r.fixes.length > 0 ? (
        <div className="mt-10">
          <span className="block text-[11px] uppercase tracking-[0.22em] text-gold mb-2">What to sort out next</span>
          <h3 className="font-serif text-3xl md:text-4xl text-white leading-tight mb-6">
            {r.fixes.length === 1 ? "One thing to fix" : `${r.fixes.length} things to fix`}, starting with {areaLabel(r.weakest).toLowerCase()}
          </h3>
          <ol className="space-y-3">
            {r.fixes.map((f, i) => (
              <li key={i} className="p-6 rounded-2xl border border-white/12 bg-white/[0.03]">
                <span className="block text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">
                  {i + 1}. {areaLabel(f.area)}
                </span>
                <p className="text-white/85 leading-relaxed mb-4">{f.fix.text}</p>
                <a
                  href={f.fix.href}
                  onClick={(e) => {
                    trackEvent("select_content", { content_type: "ready_fix", item_id: f.fix.href, area: f.area });
                    handleLinkClick(e);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/25 text-white text-xs font-semibold uppercase tracking-[0.16em] rounded-full hover:border-gold hover:text-gold transition-colors"
                >
                  {f.fix.cta} <ArrowRight className="w-4 h-4" />
                </a>
              </li>
            ))}
          </ol>
          {homeGap && (
            <a
              href={ECRE_RENTALS}
              target="_blank"
              rel="noopener"
              onClick={() => trackEvent("select_promotion", { promotion_name: "ecre_rentals", creative_slot: "readiness_score" })}
              className="mt-5 inline-flex items-center gap-2 px-6 py-3 bg-gold text-ink text-xs font-semibold uppercase tracking-[0.16em] rounded-full hover:bg-white transition-colors"
            >
              See rentals at East Coast Real Estate <ArrowRight className="w-4 h-4" />
            </a>
          )}
        </div>
      ) : (
        <p className="mt-8 text-lg text-white/75">You said yes to everything. Book the flight, and say hello at Hemingways when you land.</p>
      )}

      <div className="mt-10">
        <EmailMyResult
          dark
          tool="readiness_score"
          segment={who === "retiring" ? "retiring" : "moving"}
          title="readiness report"
          heading="Email me my full report"
          blurb="Your score, every area, and the step-by-step fixes with links, in your inbox so you can work through them. You'll also get my weekly email on life in Pattaya."
          summary={readySummary(who, r)}
          link={link}
        />
      </div>
    </div>
  );
}

function Quiz() {
  const initial = typeof window === "undefined" ? {} : readyFromSearch(window.location.search);
  const [who, setWho] = useState<ReadyWho | undefined>(initial.who);
  const [answers, setAnswers] = useState<ReadyAnswers>(initial.answers ?? []);
  const [step, setStep] = useState<number>(initial.answers ? QUESTIONS.length + 1 : initial.who ? 1 : 0);
  const done = step > QUESTIONS.length && who && answers.length === QUESTIONS.length;

  const top = () => setTimeout(() => document.getElementById("quiz")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);

  const pickWho = (id: ReadyWho) => {
    setWho(id);
    setAnswers([]);
    setStep(1);
    trackEvent("ready_start", { who: id });
    top();
  };

  const answer = (yes: boolean) => {
    if (!who) return;
    const next = [...answers];
    next[step - 1] = yes;
    setAnswers(next);
    if (step === QUESTIONS.length) {
      const r = scoreReady(who, next);
      trackEvent("ready_complete", { who, score: r.score, tier: r.tier, weakest: r.weakest, answers: next.map((x) => (x ? "1" : "0")).join("") });
      window.history.replaceState(null, "", `${READY_PATH}${readyQuery(who, next)}`);
      top();
    }
    setStep(step + 1);
  };

  const retake = () => {
    setWho(undefined);
    setAnswers([]);
    setStep(0);
    window.history.replaceState(null, "", READY_PATH);
    setTimeout(() => document.getElementById("score")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  if (done) return <Result who={who!} answers={answers} onRetake={retake} />;

  if (step === 0 || !who) {
    return (
      <div className="max-w-4xl">
        <span className="block text-[11px] uppercase tracking-[0.25em] text-white/45 mb-3">First, which sounds most like you?</span>
        <div className="grid sm:grid-cols-2 gap-3">
          {WHO_OPTIONS.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => pickWho(o.id)}
              className="text-left px-6 py-5 rounded-2xl border border-white/15 bg-white/[0.04] hover:border-gold hover:bg-gold/10 transition-all"
            >
              <span className="block font-serif text-2xl text-white">{o.label}</span>
              <span className="block text-sm text-white/50 mt-1">{o.note}</span>
            </button>
          ))}
        </div>
        <p className="mt-5 text-sm text-white/45">15 yes/no questions · about 2 minutes · your score shows straight away, no email needed</p>
      </div>
    );
  }

  const q = QUESTIONS[step - 1];
  const areaIndex = AREAS.findIndex((a) => a.id === q.area);
  const current = answers[step - 1];

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-white/45 mb-3">
        <span>
          {areaLabel(q.area)} · area {areaIndex + 1} of {AREAS.length}
        </span>
        <span>
          {step} / {QUESTIONS.length}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-8" aria-hidden>
        <div className="h-full bg-gold transition-all duration-300" style={{ width: `${((step - 1) / QUESTIONS.length) * 100}%` }} />
      </div>
      <h2 key={q.id} className="font-serif text-2xl sm:text-3xl md:text-4xl text-white leading-snug mb-8 min-h-[4.5rem] md:min-h-[5.5rem]">
        {questionText(q, who)}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => answer(true)}
          className={`inline-flex items-center justify-center gap-2 py-5 rounded-2xl border text-lg transition-all ${
            current === true ? "border-gold bg-gold/20 text-white" : "border-white/20 bg-white/[0.05] text-white hover:border-gold hover:bg-gold/10"
          }`}
        >
          <Check className="w-5 h-5 text-gold" /> Yes
        </button>
        <button
          type="button"
          onClick={() => answer(false)}
          className={`inline-flex items-center justify-center gap-2 py-5 rounded-2xl border text-lg transition-all ${
            current === false ? "border-gold bg-gold/20 text-white" : "border-white/20 bg-white/[0.05] text-white hover:border-gold hover:bg-gold/10"
          }`}
        >
          <X className="w-5 h-5 text-white/50" /> Not yet
        </button>
      </div>
      <button type="button" onClick={() => setStep(step - 1)} className="mt-6 inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-gold">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
    </div>
  );
}

export default function ReadyPage() {
  useEffect(() => {
    applyPageMeta(READY_META);
  }, []);

  return (
    <>
      <section id="score" className="bg-ink text-white pt-28 md:pt-36 pb-16 md:pb-24 px-6 md:px-12 scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <span className="block text-[11px] font-medium uppercase tracking-[0.3em] mb-5 text-gold">Moving to Pattaya · Readiness score</span>
          <h1 className="font-serif font-normal text-[2.6rem] sm:text-6xl lg:text-7xl leading-[1.04] tracking-tight mb-6 max-w-5xl">
            Are you ready for Pattaya? <span className="italic text-gold">Get your score in 2 minutes.</span>
          </h1>
          <p className="text-lg md:text-xl text-white/65 font-light leading-relaxed max-w-2xl mb-8">
            I've watched people move here for 20 years. The ones who stay sorted out the same five things before they came: money,
            visa, health cover, home and a life outside the bar. Answer honestly and I'll show you which ones you've still got to do.
          </p>
          <div className="flex items-center gap-3 mb-12 md:mb-16">
            <img src="/images/shane-portrait.webp" alt="" width={44} height={44} className="w-11 h-11 rounded-full object-cover" />
            <span className="text-sm text-white/60">
              By <a href="/about" onClick={handleLinkClick} className="text-white hover:text-gold">Shane Ruddle</a>
              <span className="block text-white/40">20 years in Pattaya · owner of 7 local businesses</span>
            </span>
          </div>
          <div id="quiz" className="scroll-mt-24">
            <Quiz />
          </div>
        </div>
      </section>

      <div className="bg-paper px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto space-y-16 md:space-y-24">
          <section>
            <Eyebrow>What the score checks</Eyebrow>
            <h2 className="font-serif text-3xl md:text-5xl leading-tight mb-10 max-w-3xl">Five areas, three questions each</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {AREAS.map((a, i) => (
                <div key={a.id} className="p-6 rounded-[1.25rem] bg-white border border-black/[0.06]">
                  <span className="font-serif text-3xl text-gold-deep">{i + 1}</span>
                  <h3 className="font-serif text-xl mt-2 mb-3">{a.label}</h3>
                  <ul className="space-y-2 text-sm text-black/60 leading-relaxed">
                    {QUESTIONS.filter((q) => q.area === a.id).map((q) => (
                      <li key={q.id}>{questionText(q, "other")}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="grid lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-7">
              <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-8">Ready to move: short answers</h2>
              <div className="divide-y divide-black/10 border-y border-black/10">
                {READY_FAQS.map((f) => (
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
                <Eyebrow>Stuck on one?</Eyebrow>
                <h2 className="font-serif text-3xl leading-tight mb-3">Ask me</h2>
                <p className="text-black/60 font-light leading-relaxed mb-6">
                  Not sure how to answer, or how to fix a gap? Tell me where you are and I'll give you a straight answer.
                </p>
                <AskShane source="readiness_score" showHeading={false} />
              </div>
            </div>
          </section>

          <div className="p-8 md:p-12 bg-ink rounded-[2rem] grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif text-white mb-2">Get the next article by email</h2>
              <p className="text-white/60 font-light">One short email a week on property, business and life in Pattaya. Free, no spam.</p>
            </div>
            <NewsletterSignup dark source="readiness_score" />
          </div>
        </div>
      </div>
    </>
  );
}
