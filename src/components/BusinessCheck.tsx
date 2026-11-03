import { ReactNode, useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, BadgeCheck, Check, FileSignature, Link2, RotateCcw, Scale, Stamp, Wallet } from "lucide-react";
import {
  BIZ_QUESTIONS,
  BUSINESS_FAQS,
  BUSINESS_META,
  BUSINESS_PATH,
  BizAnswers,
  BizResult,
  DUE_DILIGENCE,
  START_UP,
  BAHT,
  answersFromSearch,
  answersQuery,
  assess,
  casesFor,
  checkSummary,
  dueDiligenceVerdict,
} from "../lib/businessCheck";
import { handleLinkClick } from "../lib/navigation";
import { trackEvent } from "../lib/analytics";
import { applyPageMeta } from "../seo";
import AskShane from "./AskShane";
import NewsletterSignup from "./NewsletterSignup";
import BusinessTabs from "./BusinessTabs";
import { BUYING_PATH } from "../lib/dealCheck";
import { SELL_PATH } from "../lib/sellBusiness";

// /business-in-pattaya: six questions → an honest verdict on opening or buying a business in
// Pattaya, the money and legal basics, a due-diligence scorecard, and "Swap notes with Shane".
// Answers live in the URL so a result can be shared.

const Eyebrow = ({ children }: { children: ReactNode }) => (
  <span className="block text-[11px] font-medium uppercase tracking-[0.3em] mb-5 text-gold-deep">{children}</span>
);

const readAnswers = (): BizAnswers => (typeof window === "undefined" ? {} : answersFromSearch(window.location.search));

const LEVEL_STYLE: Record<BizResult["level"], { ring: string; text: string; label: string }> = {
  good: { ring: "stroke-emerald-400", text: "text-emerald-300", label: "Good foundations" },
  caution: { ring: "stroke-gold", text: "text-gold", label: "Proceed with care" },
  rethink: { ring: "stroke-red-400", text: "text-red-300", label: "Red flags first" },
};

const ArticleLink = ({ href, label = "Why I say this" }: { href?: string; label?: string }) =>
  href ? (
    <a href={href} onClick={handleLinkClick} className="mt-2 inline-flex items-center gap-1 text-xs text-gold hover:text-white transition-colors">
      {label} <ArrowRight className="w-3 h-3" />
    </a>
  ) : null;

// ---------------------------------------------------------------------------------------------
// Questions

function Questions({ answers, step, onAnswer, onBack }: { answers: BizAnswers; step: number; onAnswer: (id: string) => void; onBack: () => void }) {
  const q = BIZ_QUESTIONS[step];
  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 mb-8" aria-hidden>
        {BIZ_QUESTIONS.map((bq, i) => (
          <span key={bq.id} className={`h-1 flex-1 rounded-full transition-colors ${i < step ? "bg-gold" : i === step ? "bg-white" : "bg-white/15"}`} />
        ))}
      </div>
      <span className="block text-[11px] uppercase tracking-[0.25em] text-white/45 mb-3">
        Question {step + 1} of {BIZ_QUESTIONS.length}
      </span>
      <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-tight text-white mb-3">{q.question}</h2>
      {q.hint ? <p className="text-white/50 mb-8">{q.hint}</p> : <div className="mb-8" />}
      <div className="grid sm:grid-cols-2 gap-3">
        {q.options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onAnswer(o.id)}
            className={`group flex items-center justify-between gap-4 text-left px-6 py-5 rounded-2xl border transition-all ${
              answers[q.id] === o.id ? "border-gold bg-gold/15" : "border-white/15 bg-white/[0.04] hover:border-gold hover:-translate-y-0.5"
            }`}
          >
            <span>
              <span className="block text-lg text-white">{o.label}</span>
              {o.sub && <span className="block text-sm text-white/45 mt-0.5">{o.sub}</span>}
            </span>
            <ArrowRight className="w-4 h-4 text-gold opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>
        ))}
      </div>
      {step > 0 && (
        <button type="button" onClick={onBack} className="mt-6 inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Result

function ScoreRing({ score, level }: { score: number; level: BizResult["level"] }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const s = LEVEL_STYLE[level];
  return (
    <div className="relative w-36 h-36 shrink-0">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90" aria-hidden>
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="8" className="stroke-white/10" />
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="8" strokeLinecap="round" className={s.ring} strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-serif text-4xl text-white">{score}</span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/45">out of 100</span>
      </div>
    </div>
  );
}

function FactCard({ icon, label, title, body, badge, href }: { icon: ReactNode; label: string; title: string; body: string; badge?: string; href?: string }) {
  return (
    <div className="flex flex-col p-6 rounded-[1.25rem] bg-white text-ink">
      <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-gold-deep mb-3">
        {icon} {label}
      </span>
      <span className="font-serif text-2xl leading-snug mb-1.5">{title}</span>
      <span className="text-sm text-black/60 leading-relaxed flex-1">{body}</span>
      {badge && <span className="mt-3 self-start text-[10px] uppercase tracking-[0.18em] px-2.5 py-1 rounded-full bg-black/[0.05] text-black/50">{badge}</span>}
      {href && (
        <a href={href} onClick={handleLinkClick} className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-gold-deep hover:text-ink">
          More <ArrowRight className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
}

function DueDiligence() {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const count = Object.values(done).filter(Boolean).length;
  const toggle = (id: string) => {
    const next = { ...done, [id]: !done[id] };
    setDone(next);
    trackEvent("business_check_diligence", { item: id, checked: next[id], done: Object.values(next).filter(Boolean).length });
  };
  return (
    <section className="mt-14">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <span className="block text-[11px] uppercase tracking-[0.25em] text-gold mb-3">Buying? Check these first</span>
          <h3 className="font-serif text-3xl md:text-4xl text-white leading-tight">Your due-diligence scorecard</h3>
          <a
            href={BUYING_PATH}
            onClick={(e) => {
              trackEvent("select_content", { content_type: "deal_check", source: "business_check_scorecard" });
              handleLinkClick(e);
            }}
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-gold hover:text-white"
          >
            Found one? Check the actual deal <ArrowRight className="w-3.5 h-3.5" />
          </a>
          <a
            href={SELL_PATH}
            onClick={(e) => {
              trackEvent("select_content", { content_type: "sell_business", source: "business_check_scorecard" });
              handleLinkClick(e);
            }}
            className="mt-3 ml-6 inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-gold"
          >
            Selling one? Tell me in confidence <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
        <div className="text-right">
          <span className="block font-serif text-4xl text-gold">{count}/{DUE_DILIGENCE.length}</span>
          <span className="block text-sm text-white/55 max-w-xs">{dueDiligenceVerdict(count)}</span>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {DUE_DILIGENCE.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => toggle(d.id)}
            aria-pressed={!!done[d.id]}
            className={`flex gap-4 text-left p-5 rounded-2xl border transition-colors ${done[d.id] ? "border-gold bg-gold/15" : "border-white/12 bg-white/[0.04] hover:border-white/30"}`}
          >
            <span className={`mt-0.5 w-6 h-6 shrink-0 rounded-full border flex items-center justify-center ${done[d.id] ? "bg-gold border-gold text-ink" : "border-white/30"}`}>
              {done[d.id] && <Check className="w-3.5 h-3.5" />}
            </span>
            <span>
              <span className="block text-white text-lg leading-snug">{d.title}</span>
              <span className="block text-sm text-white/55 mt-1 leading-relaxed">{d.body}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function ResultView({ answers, result, onRestart }: { answers: BizAnswers; result: BizResult; onRestart: () => void }) {
  const [copied, setCopied] = useState(false);
  const s = LEVEL_STYLE[result.level];
  const cases = casesFor(answers);

  const share = async () => {
    const url = `https://shaneruddle.com${BUSINESS_PATH}${answersQuery(answers)}`;
    trackEvent("share", { method: "copy_link", content_type: "business_check" });
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title: "My Pattaya business reality check", text: result.headline, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* user cancelled */
    }
  };

  const goToAsk = () => {
    trackEvent("select_content", { content_type: "business_check_notes", source: "business_check_result" });
    document.getElementById("notes")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div>
      {/* Verdict */}
      <div className="flex flex-col md:flex-row md:items-center gap-8 mb-10">
        <ScoreRing score={result.score} level={result.level} />
        <div className="flex-1">
          <span className={`block text-[11px] uppercase tracking-[0.25em] mb-3 ${s.text}`}>My verdict · {s.label}</span>
          <h2 className="font-serif text-4xl sm:text-5xl leading-[1.05] text-white max-w-3xl mb-3">{result.headline}</h2>
          <p className="text-white/65 text-lg font-light leading-relaxed max-w-2xl">{result.summary}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 mb-12">
        <button type="button" onClick={goToAsk} className="inline-flex items-center gap-2 px-6 py-3.5 bg-gold text-ink text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:bg-white transition-colors">
          Swap notes with me <ArrowRight className="w-4 h-4" />
        </button>
        <button type="button" onClick={share} className="inline-flex items-center gap-2 px-5 py-3.5 border border-white/25 text-white text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:border-gold hover:text-gold transition-colors">
          {copied ? <><Check className="w-4 h-4" /> Link copied</> : <><Link2 className="w-4 h-4" /> Share</>}
        </button>
      </div>

      {/* Flags and strengths */}
      <div className="grid lg:grid-cols-2 gap-6 mb-12">
        <div className="p-6 md:p-8 rounded-[1.5rem] bg-white/[0.04] border border-white/10">
          <h3 className="flex items-center gap-2 font-serif text-2xl text-white mb-5">
            <AlertTriangle className="w-5 h-5 text-red-300" /> What worries me
          </h3>
          {result.flags.length ? (
            <ul className="space-y-5">
              {result.flags.map((f) => (
                <li key={f.id} className="flex gap-3">
                  <img src="/images/shane-portrait.webp" alt="" width={28} height={28} loading="lazy" className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white/80 leading-relaxed">{f.text}</p>
                    <ArticleLink href={f.href} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-white/60">Honestly, not much. Keep it that way by doing your homework.</p>
          )}
        </div>
        <div className="p-6 md:p-8 rounded-[1.5rem] bg-white/[0.04] border border-white/10">
          <h3 className="flex items-center gap-2 font-serif text-2xl text-white mb-5">
            <BadgeCheck className="w-5 h-5 text-emerald-300" /> In your favour
          </h3>
          {result.strengths.length ? (
            <ul className="space-y-5">
              {result.strengths.map((f) => (
                <li key={f.id} className="flex gap-3">
                  <Check className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white/80 leading-relaxed">{f.text}</p>
                    <ArticleLink href={f.href} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-white/60">Not a lot yet. That's fixable: the red flags tell you where to start.</p>
          )}
        </div>
      </div>

      {/* The basics */}
      <span className="block text-[11px] uppercase tracking-[0.25em] text-gold mb-4">The basics for you</span>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <FactCard
          icon={<Wallet className="w-3.5 h-3.5" />}
          label="Your money"
          title={result.money.fit === "short" ? "Short" : result.money.fit === "tight" ? "Tight" : "Comfortable"}
          body={result.money.text}
          badge={result.money.needFromShane ? "My rough figure" : "Rough estimate, varies a lot"}
        />
        <FactCard icon={<Scale className="w-3.5 h-3.5" />} label="Ownership" title="51% Thai partner" body={result.ownership} href="/articles/starting-or-buying-a-business-in-pattaya" />
        <FactCard
          icon={<Stamp className="w-3.5 h-3.5" />}
          label="Work permit"
          title={result.permit.needed ? "You'll need one" : "Maybe not"}
          body={result.permit.text}
          href="/thai-visas/business-visa-work-permit"
        />
        <FactCard icon={<FileSignature className="w-3.5 h-3.5" />} label="Start or buy" title={answers.route === "buy" ? "Buying" : answers.route === "start" ? "Starting" : "Undecided"} body={result.routeNote} />
      </div>

      {result.showDueDiligence && <DueDiligence />}

      {/* Worked examples */}
      <section className="mt-14">
        <span className="block text-[11px] uppercase tracking-[0.25em] text-gold mb-3">How it went for me</span>
        <h3 className="font-serif text-3xl md:text-4xl text-white leading-tight mb-6">Four of my own businesses, honestly</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cases.map((c, i) => (
            <a
              key={c.id}
              href={c.href}
              onClick={(e) => {
                trackEvent("select_content", { content_type: "business_check_case", item: c.id });
                handleLinkClick(e);
              }}
              className={`group flex flex-col p-6 rounded-[1.25rem] border transition-all hover:-translate-y-0.5 ${i === 0 ? "border-gold/60 bg-gold/10" : "border-white/10 bg-white/[0.04]"}`}
            >
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/45 mb-2">{c.tag}</span>
              <span className="font-serif text-2xl text-white mb-1">{c.name}</span>
              <span className="text-sm text-gold mb-3 italic">{c.lesson}</span>
              <span className="text-sm text-white/65 leading-relaxed flex-1">{c.body}</span>
              <span className="mt-4 inline-flex items-center gap-1 text-xs text-gold group-hover:text-white">
                Read the story <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </a>
          ))}
        </div>
      </section>

      <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm text-white/50">
        <p className="text-xs text-white/40 max-w-xl leading-relaxed">
          My honest opinion from 20 years in business here, not legal or financial advice. Rules change, so use a Thai lawyer before you sign.
        </p>
        <button type="button" onClick={onRestart} className="inline-flex items-center gap-2 hover:text-white">
          <RotateCcw className="w-4 h-4" /> Start again
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Page

export default function BusinessCheck() {
  const [answers, setAnswers] = useState<BizAnswers>(readAnswers);
  const [step, setStep] = useState(() => {
    const first = BIZ_QUESTIONS.findIndex((q) => !readAnswers()[q.id]);
    return first === -1 ? BIZ_QUESTIONS.length : 0;
  });
  const started = useRef(false);
  const done = step >= BIZ_QUESTIONS.length;
  const result = done ? assess(answers) : null;

  useEffect(() => {
    applyPageMeta(BUSINESS_META);
  }, []);

  const scrollTop = () => document.getElementById("check")?.scrollIntoView({ behavior: "smooth", block: "start" });

  const answer = (id: string) => {
    const q = BIZ_QUESTIONS[step];
    if (!started.current) {
      started.current = true;
      trackEvent("business_check_start", { type: q.id === "type" ? id : answers.type });
    }
    const next = { ...answers, [q.id]: id };
    setAnswers(next);
    setStep(step + 1);
    scrollTop();
    if (step + 1 >= BIZ_QUESTIONS.length) {
      const r = assess(next);
      trackEvent("business_check_complete", { verdict: r.level, score: r.score, money: r.money.fit, ...next });
      window.history.replaceState(null, "", `${BUSINESS_PATH}${answersQuery(next)}`);
    }
  };

  const restart = () => {
    setAnswers({});
    setStep(0);
    window.history.replaceState(null, "", BUSINESS_PATH);
    scrollTop();
  };

  return (
    <>
      <section id="check" className="bg-ink text-white pt-28 md:pt-36 pb-16 md:pb-24 px-6 md:px-12 scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <a href="/guides/doing-business-in-pattaya" onClick={handleLinkClick} className="block text-[11px] font-medium uppercase tracking-[0.3em] mb-5 text-gold hover:text-white transition-colors">
            Doing business in Pattaya
          </a>
          <BusinessTabs active="check" />
          {!result && (
            <>
              <h1 className="font-serif font-normal text-[2.6rem] sm:text-6xl lg:text-7xl leading-[1.04] tracking-tight mb-6 max-w-5xl">
                Thinking of opening a business in Pattaya? <span className="italic text-gold">Get the honest answer.</span>
              </h1>
              <p className="text-lg md:text-xl text-white/65 font-light leading-relaxed max-w-2xl mb-8">
                I've started, bought, sold and closed more businesses here than I can easily count. Answer six quick questions and
                I'll tell you what I'd tell a friend: what worries me, what it'll cost, and what to check before you sign anything.
              </p>
              <div className="flex items-center gap-3 mb-12 md:mb-16">
                <img src="/images/shane-portrait.webp" alt="" width={44} height={44} className="w-11 h-11 rounded-full object-cover" />
                <span className="text-sm text-white/60">
                  By <a href="/about" onClick={handleLinkClick} className="text-white hover:text-gold">Shane Ruddle</a>
                  <span className="block text-white/40">Owner of 7 Pattaya businesses · 20 years here</span>
                </span>
              </div>
            </>
          )}
          {result ? (
            <ResultView answers={answers} result={result} onRestart={restart} />
          ) : (
            <Questions answers={answers} step={step} onAnswer={answer} onBack={() => setStep(step - 1)} />
          )}
        </div>
      </section>

      <div className="bg-paper px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto space-y-16 md:space-y-24">
          {result && (
            <section id="notes" className="max-w-4xl mx-auto scroll-mt-28 p-8 md:p-12 bg-cream border border-cream-line rounded-[2rem]">
              <Eyebrow>Swap notes with me</Eyebrow>
              <h2 className="font-serif text-3xl md:text-5xl leading-tight mb-4">Tell me about the business you have in mind</h2>
              <p className="text-black/60 font-light leading-relaxed max-w-2xl mb-8">
                The place, the price, what's worrying you. Your answers come with your message, so I won't need to ask the basics,
                and I'll reply personally.
              </p>
              <AskShane
                source="business_check"
                initialTopic="business"
                showHeading={false}
                context={checkSummary(answers, result)}
                contextNote="I'll see your reality check with your message."
              />
            </section>
          )}

          <section className="grid lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-5">
              <Eyebrow>What it costs to get going</Eyebrow>
              <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-6">My rough start-up figures</h2>
              <div className="divide-y divide-black/10 border-y border-black/10 mb-6">
                {(["bar", "restaurant", "guesthouse"] as const).map((t) => (
                  <div key={t} className="flex items-baseline justify-between py-4">
                    <span className="text-lg capitalize">{START_UP[t].label.replace(/^an? /, "")}</span>
                    <span className="font-serif text-2xl text-gold-deep">{BAHT(START_UP[t].amount)}</span>
                  </div>
                ))}
              </div>
              <p className="text-black/60 font-light leading-relaxed">
                These are the figures I'd give a friend, not quotes. Location, size and fit-out change them a lot, and you'll want money
                in reserve on top. Most businesses that fail simply run out of money.
              </p>
              {!result && (
                <button
                  type="button"
                  onClick={scrollTop}
                  className="mt-8 inline-flex items-center gap-2 px-6 py-3.5 bg-ink text-white text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:bg-gold hover:text-ink transition-colors"
                >
                  Check my idea <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="lg:col-span-7">
              <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-8">Business in Pattaya: short answers</h2>
              <div className="divide-y divide-black/10 border-y border-black/10">
                {BUSINESS_FAQS.map((f) => (
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
          </section>

          <div className="p-8 md:p-12 bg-ink rounded-[2rem] grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif text-white mb-2">Get the next article by email</h2>
              <p className="text-white/60 font-light">One short email a week on property, business and life in Pattaya. Free, no spam.</p>
            </div>
            <NewsletterSignup dark source="business_check" />
          </div>
        </div>
      </div>
    </>
  );
}
