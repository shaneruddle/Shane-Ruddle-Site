import { ReactNode, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, GraduationCap, Home, Link2, MapPin, RotateCcw, Stamp, Wallet } from "lucide-react";
import {
  MOVE_FAQS,
  MOVE_META,
  MOVE_PATH,
  MOVE_QUESTIONS,
  MoveAnswers,
  MovePlan,
  answersFromSearch,
  answersQuery,
  budgetLabel,
  buildPlan,
  currencyFor,
  planSummary,
} from "../lib/movePlan";
import { formatBaht, formatMoney } from "../lib/costOfLiving";
import { SCHOOLS_PATH, bahtShort } from "../lib/schools";
import { VISAS_PATH } from "../lib/visas";
import { handleLinkClick } from "../lib/navigation";
import { trackEvent } from "../lib/analytics";
import { applyPageMeta } from "../seo";
import AskShane, { AskTopic } from "./AskShane";
import NewsletterSignup from "./NewsletterSignup";
import EmailMyResult, { type LeadSegment } from "./EmailMyResult";

// /move-to-thailand: six questions → a personal, month-by-month moving plan, ending in
// "Get your plan checked by Shane". Answers live in the URL so a plan can be shared.

const Eyebrow = ({ children, dark = false }: { children: ReactNode; dark?: boolean }) => (
  <span className={`block text-[11px] font-medium uppercase tracking-[0.3em] mb-5 ${dark ? "text-gold" : "text-gold-deep"}`}>{children}</span>
);

const readAnswers = (): MoveAnswers => (typeof window === "undefined" ? {} : answersFromSearch(window.location.search));

function segmentFor(a: MoveAnswers): LeadSegment {
  if (a.why === "retire50" || a.why === "retireEarly") return "retiring";
  if (a.why === "work") return "business";
  if (a.home === "buy") return "property";
  return "moving";
}

function askTopicFor(a: MoveAnswers): AskTopic {
  if (a.who === "family") return "family";
  if (a.why === "retire50" || a.why === "retireEarly") return "retiring";
  if (a.why === "work") return "business";
  if (a.home === "buy") return "buying";
  return "renting";
}

// ---------------------------------------------------------------------------------------------
// Questions

function Questions({ answers, step, onAnswer, onBack }: { answers: MoveAnswers; step: number; onAnswer: (id: string) => void; onBack: () => void }) {
  const q = MOVE_QUESTIONS[step];
  const currency = currencyFor(answers);
  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 mb-8" aria-hidden>
        {MOVE_QUESTIONS.map((mq, i) => (
          <span key={mq.id} className={`h-1 flex-1 rounded-full transition-colors ${i < step ? "bg-gold" : i === step ? "bg-white" : "bg-white/15"}`} />
        ))}
      </div>
      <span className="block text-[11px] uppercase tracking-[0.25em] text-white/45 mb-3">
        Question {step + 1} of {MOVE_QUESTIONS.length}
      </span>
      <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-tight text-white mb-3">{q.question}</h2>
      {q.hint ? <p className="text-white/50 mb-8">{q.hint}</p> : <div className="mb-8" />}
      <div className="grid sm:grid-cols-2 gap-3">
        {q.options.map((o) => {
          const label = q.id === "budget" ? budgetLabel(o.id, currency) : { main: o.label, sub: "" };
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onAnswer(o.id)}
              className={`group flex items-center justify-between gap-4 text-left px-6 py-5 rounded-2xl border transition-all ${
                answers[q.id] === o.id ? "border-gold bg-gold/15" : "border-white/15 bg-white/[0.04] hover:border-gold hover:-translate-y-0.5"
              }`}
            >
              <span>
                <span className="block text-lg text-white">{label.main}</span>
                {label.sub && <span className="block text-sm text-white/45 mt-0.5">{label.sub}</span>}
              </span>
              <ArrowRight className="w-4 h-4 text-gold opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          );
        })}
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
// The plan

function SummaryCard({ icon, label, title, sub, href, onClick, external = false }: { icon: ReactNode; label: string; title: string; sub: string; href: string; onClick?: () => void; external?: boolean }) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      onClick={(e) => {
        onClick?.();
        if (!external) handleLinkClick(e);
      }}
      className="group flex flex-col p-6 rounded-[1.25rem] bg-white text-ink border border-white transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30"
    >
      <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-gold-deep mb-3">
        {icon} {label}
      </span>
      <span className="font-serif text-2xl leading-snug mb-1.5 group-hover:text-gold-deep transition-colors">{title}</span>
      <span className="text-sm text-black/55 leading-relaxed flex-1">{sub}</span>
      <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-gold-deep">
        Details <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </span>
    </a>
  );
}

function PlanView({ answers, plan, onRestart }: { answers: MoveAnswers; plan: MovePlan; onRestart: () => void }) {
  const [copied, setCopied] = useState(false);
  const { visa, area, cost, currency, schools, phases } = plan;
  const moveWhen = phases.find((p) => p.id === "week1")?.when;
  const family = answers.who === "family";

  const share = async () => {
    const url = `https://shaneruddle.com${MOVE_PATH}${answersQuery(answers)}`;
    trackEvent("share", { method: "copy_link", content_type: "move_plan" });
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title: "My plan for moving to Thailand", text: `Visa: ${visa.name}. Area: ${area.name}.`, url });
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
    trackEvent("select_content", { content_type: "move_plan_check", source: "move_planner_result" });
    document.getElementById("check")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-6 mb-8">
        <div>
          <span className="block text-[11px] uppercase tracking-[0.25em] text-gold mb-3">Your plan{moveWhen && moveWhen !== "When you land" ? ` · moving ${moveWhen}` : ""}</span>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl leading-[1.04] text-white max-w-3xl">
            Here's how I'd do it <span className="italic text-gold">in your shoes.</span>
          </h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={goToAsk} className="inline-flex items-center gap-2 px-6 py-3.5 bg-gold text-ink text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:bg-white transition-colors">
            Get it checked by me <ArrowRight className="w-4 h-4" />
          </button>
          <button type="button" onClick={share} className="inline-flex items-center gap-2 px-5 py-3.5 border border-white/25 text-white text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:border-gold hover:text-gold transition-colors">
            {copied ? <><Check className="w-4 h-4" /> Link copied</> : <><Link2 className="w-4 h-4" /> Share</>}
          </button>
        </div>
      </div>

      <div className={`grid sm:grid-cols-2 ${family ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-4 mb-6`}>
        <SummaryCard
          icon={<Stamp className="w-3.5 h-3.5" />}
          label="Your visa"
          title={visa.name}
          sub={`${visa.glance.stay}. Money to show: ${visa.glance.money}.`}
          href={`${VISAS_PATH}/${visa.slug}`}
          onClick={() => trackEvent("select_visa", { visa: visa.id, source: "move_planner" })}
        />
        <SummaryCard
          icon={<MapPin className="w-3.5 h-3.5" />}
          label="Where to live"
          title={area.name}
          sub={`${area.tagline.replace(/\.?$/, ".")} Runner-up: ${plan.areaRunnerUp.name}.`}
          href={`/areas/${area.slug}`}
          onClick={() => trackEvent("select_area", { area: area.id, source: "move_planner" })}
        />
        <SummaryCard
          icon={<Wallet className="w-3.5 h-3.5" />}
          label="Monthly cost"
          title={`${formatMoney(cost.total, currency)} a month`}
          sub={`About ${formatBaht(cost.total)}${plan.overBudget ? ", which is above the budget you picked. Open it to see where to trim." : ", within the budget you picked."}`}
          href={plan.calculatorHref}
          onClick={() => trackEvent("select_content", { content_type: "calculator", source: "move_planner" })}
        />
        {family && schools[0] && (
          <SummaryCard
            icon={<GraduationCap className="w-3.5 h-3.5" />}
            label="Schools to see"
            title={schools[0].school.name}
            sub={[
              schools.length > 1 ? `Then ${schools.slice(1).map((s) => s.school.name).join(" and ")}.` : "",
              schools[0].fee ? `About ${bahtShort(schools[0].fee)} a year at primary age.` : "",
            ].join(" ").trim()}
            href={SCHOOLS_PATH}
            onClick={() => trackEvent("select_school", { school: schools[0].school.id, source: "move_planner" })}
          />
        )}
      </div>

      {plan.visaNotes.length > 0 && (
        <div className="space-y-3 mb-6">
          {plan.visaNotes.map((n) => (
            <div key={n} className="flex gap-3 p-4 rounded-2xl bg-gold/10 border border-gold/30">
              <img src="/images/shane-portrait.webp" alt="" width={32} height={32} loading="lazy" className="w-8 h-8 rounded-full object-cover shrink-0" />
              <p className="text-sm text-white/80 leading-relaxed">{n}</p>
            </div>
          ))}
        </div>
      )}

      {/* Timeline */}
      <ol className="mt-14 relative">
        {phases.map((phase, i) => (
          <li key={phase.id} className="relative grid md:grid-cols-12 gap-4 md:gap-8 pb-12 last:pb-0">
            <span className="hidden md:block absolute left-[calc(25%-1.5rem)] top-3 bottom-0 w-px bg-white/10" aria-hidden />
            <div className="md:col-span-3 md:text-right md:pr-10 relative">
              <span className="hidden md:block absolute right-[1.15rem] top-2 w-3 h-3 rounded-full bg-gold ring-4 ring-ink" aria-hidden />
              <span className="block text-[11px] uppercase tracking-[0.22em] text-white/45 mb-1">{String(i + 1).padStart(2, "0")} · {phase.label}</span>
              <span className="block font-serif text-2xl md:text-3xl text-gold leading-tight">{phase.when}</span>
            </div>
            <div className="md:col-span-9 grid gap-3">
              {phase.tasks.map((task) => (
                <div key={task.id} className="p-5 md:p-6 rounded-2xl bg-white/[0.04] border border-white/10">
                  <h3 className="font-serif text-xl md:text-2xl text-white leading-snug mb-2">{task.title}</h3>
                  <p className={`text-white/65 leading-relaxed ${task.shane ? "italic" : ""}`}>{task.body}</p>
                  {(task.link || task.shane) && (
                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                      {task.link && (
                        <a
                          href={task.link.href}
                          target={task.link.external ? "_blank" : undefined}
                          rel={task.link.external ? "noopener noreferrer" : undefined}
                          onClick={(e) => {
                            trackEvent(task.link!.external ? "select_promotion" : "select_content", {
                              content_type: "move_plan_task",
                              task: task.id,
                              ...(task.link!.external ? { promotion_name: "ecre_rentals", creative_slot: "move_planner" } : {}),
                            });
                            if (!task.link!.external) handleLinkClick(e);
                          }}
                          className="inline-flex items-center gap-1.5 text-sm text-gold hover:text-white transition-colors"
                        >
                          {task.link.label} {task.link.external ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                        </a>
                      )}
                      {task.shane && <span className="text-[10px] uppercase tracking-[0.2em] text-white/35">From my experience</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm text-white/50">
        <p className="text-xs text-white/40 max-w-xl leading-relaxed">
          A starting point, not legal or financial advice. Visa rules and prices change, so check before you act.
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

export default function MovePlanner() {
  const [answers, setAnswers] = useState<MoveAnswers>(readAnswers);
  const [step, setStep] = useState(() => {
    const first = MOVE_QUESTIONS.findIndex((q) => !readAnswers()[q.id]);
    return first === -1 ? MOVE_QUESTIONS.length : 0;
  });
  const started = useRef(false);
  const done = step >= MOVE_QUESTIONS.length;
  const plan = done ? buildPlan(answers) : null;

  useEffect(() => {
    applyPageMeta(MOVE_META);
  }, []);

  const scrollTop = () => document.getElementById("planner")?.scrollIntoView({ behavior: "smooth", block: "start" });

  const answer = (id: string) => {
    const q = MOVE_QUESTIONS[step];
    if (!started.current) {
      started.current = true;
      trackEvent("move_planner_start", { from: q.id === "from" ? id : answers.from });
    }
    const next = { ...answers, [q.id]: id };
    setAnswers(next);
    setStep(step + 1);
    scrollTop();
    if (step + 1 >= MOVE_QUESTIONS.length) {
      const p = buildPlan(next);
      trackEvent("move_planner_complete", { visa: p.visa.id, area: p.area.id, over_budget: p.overBudget, ...next });
      window.history.replaceState(null, "", `${MOVE_PATH}${answersQuery(next)}`);
    }
  };

  const restart = () => {
    setAnswers({});
    setStep(0);
    window.history.replaceState(null, "", MOVE_PATH);
    scrollTop();
  };

  return (
    <>
      <section id="planner" className="bg-ink text-white pt-28 md:pt-36 pb-16 md:pb-24 px-6 md:px-12 scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <a href="/guides/moving-to-pattaya" onClick={handleLinkClick} className="block text-[11px] font-medium uppercase tracking-[0.3em] mb-5 text-gold hover:text-white transition-colors">
            Moving to Thailand{plan ? "" : " · Your plan"}
          </a>
          {!plan && (
            <>
              <h1 className="font-serif font-normal text-[2.6rem] sm:text-6xl lg:text-7xl leading-[1.04] tracking-tight mb-6 max-w-5xl">
                Moving to Thailand? <span className="italic text-gold">Get your plan.</span>
              </h1>
              <p className="text-lg md:text-xl text-white/65 font-light leading-relaxed max-w-2xl mb-8">
                Answer six quick questions and I'll put together a month-by-month plan for your move to Pattaya: the right visa,
                where to live, what it'll cost and what to sort out first. Then, if you like, I'll check it for you personally.
              </p>
              <div className="flex items-center gap-3 mb-12 md:mb-16">
                <img src="/images/shane-portrait.webp" alt="" width={44} height={44} className="w-11 h-11 rounded-full object-cover" />
                <span className="text-sm text-white/60">
                  By <a href="/about" onClick={handleLinkClick} className="text-white hover:text-gold">Shane Ruddle</a>
                  <span className="block text-white/40">20 years in Pattaya · 7 businesses here</span>
                </span>
              </div>
            </>
          )}
          {plan ? (
            <PlanView answers={answers} plan={plan} onRestart={restart} />
          ) : (
            <Questions answers={answers} step={step} onAnswer={answer} onBack={() => setStep(step - 1)} />
          )}
        </div>
      </section>

      <div className="bg-paper px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto space-y-16 md:space-y-24">
          {plan && (
            <div className="max-w-4xl mx-auto">
              <EmailMyResult
                tool="move_planner"
                segment={segmentFor(answers)}
                title="Thailand move plan"
                summary={`Your Thailand move plan\n${planSummary(answers, plan)}`}
                link={`https://shaneruddle.com${MOVE_PATH}${answersQuery(answers)}`}
              />
            </div>
          )}

          {plan && (
            <section id="check" className="max-w-4xl mx-auto scroll-mt-28 p-8 md:p-12 bg-cream border border-cream-line rounded-[2rem]">
              <Eyebrow>Free plan check</Eyebrow>
              <h2 className="font-serif text-3xl md:text-5xl leading-tight mb-4">Want me to check your plan?</h2>
              <p className="text-black/60 font-light leading-relaxed max-w-2xl mb-8">
                Tell me what's worrying you or what doesn't fit. Your plan comes with your question, so I won't need to ask you the
                basics, and I'll reply personally.
              </p>
              <AskShane
                source="move_planner"
                initialTopic={askTopicFor(answers)}
                showHeading={false}
                context={planSummary(answers, plan)}
                contextNote="I'll see your whole plan with your question."
              />
            </section>
          )}

          <section className="grid lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-5">
              <Eyebrow>The short version</Eyebrow>
              <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-6">How to move to Thailand, in the order I'd do it</h2>
              <ol className="space-y-4 text-black/70 font-light leading-relaxed list-decimal pl-5 marker:text-gold-deep marker:font-serif">
                <li>Pick the visa that fits what you'll do here in a few years, not just now.</li>
                <li>Work out a realistic monthly budget, and the savings your visa needs.</li>
                <li>Get health insurance before you need it.</li>
                <li>Choose an area, then rent there below your budget. Don't buy yet.</li>
                <li>In week one, get a Thai SIM. In month one, open a bank account and get a Thai driving licence.</li>
                <li>Check advice for yourself, and get out of holiday mode.</li>
              </ol>
              {!plan && (
                <button
                  type="button"
                  onClick={scrollTop}
                  className="mt-8 inline-flex items-center gap-2 px-6 py-3.5 bg-ink text-white text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:bg-gold hover:text-ink transition-colors"
                >
                  Get my personal plan <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="lg:col-span-7">
              <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-8">Moving to Thailand: short answers</h2>
              <div className="divide-y divide-black/10 border-y border-black/10">
                {MOVE_FAQS.map((f) => (
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

          <section>
            <Eyebrow>Go deeper</Eyebrow>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: <Stamp className="w-5 h-5" />, title: "Visa finder", sub: "Which Thai visa is right for you?", href: VISAS_PATH },
                { icon: <MapPin className="w-5 h-5" />, title: "Area map", sub: "Where to live in Pattaya", href: "/areas" },
                { icon: <Wallet className="w-5 h-5" />, title: "Cost calculator", sub: "Your monthly budget, to the baht", href: "/cost-of-living-calculator" },
                { icon: <Home className="w-5 h-5" />, title: "Moving guide", sub: "Everything I've written on moving here", href: "/guides/moving-to-pattaya" },
              ].map((c) => (
                <a
                  key={c.href}
                  href={c.href}
                  onClick={(e) => {
                    trackEvent("select_content", { content_type: "move_planner_tool", item: c.href });
                    handleLinkClick(e);
                  }}
                  className="group flex flex-col bg-white border border-black/[0.08] rounded-[1.25rem] p-6 transition-all hover:border-gold/60 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/[0.06]"
                >
                  <span className="text-gold-deep mb-4">{c.icon}</span>
                  <span className="font-serif text-2xl text-ink group-hover:text-gold-deep transition-colors">{c.title}</span>
                  <span className="text-sm text-black/55 mt-1">{c.sub}</span>
                </a>
              ))}
            </div>
          </section>

          {!plan && (
            <div className="p-8 md:p-12 bg-ink rounded-[2rem] grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-serif text-white mb-2">Get the next article by email</h2>
                <p className="text-white/60 font-light">One short email a week on property, business and life in Pattaya. Free, no spam.</p>
              </div>
              <NewsletterSignup dark source="move_planner" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
