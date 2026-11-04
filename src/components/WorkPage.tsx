import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Check,
  FileText,
  Link2,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Upload,
} from "lucide-react";
import {
  CV_MAX_BYTES,
  CV_TYPES,
  HireLevel,
  LOOK_FOR,
  OfferKind,
  PLAN,
  PLAN_STORAGE_KEY,
  PermitAnswer,
  ROLES,
  WHERE_OPTIONS,
  WORK_FAQS,
  WORK_META,
  WORK_PATH,
  WORK_QUESTIONS,
  WorkAnswers,
  WorkResult,
  YEARS_OPTIONS,
  assessWork,
  checkOffer,
  roleById,
  workAnswersFromSearch,
  workAnswersQuery,
  workSummary,
} from "../lib/work";
import { handleLinkClick } from "../lib/navigation";
import { trackEvent } from "../lib/analytics";
import { applyPageMeta } from "../seo";
import NewsletterSignup from "./NewsletterSignup";
import EmailMyResult from "./EmailMyResult";

// /work-in-pattaya: the job hunt seen from the employer's side. "Would I hire you?" (six questions,
// answers in the URL so a result can be shared), what I look for, jobs and pay, a job offer checker,
// a 90-day networking plan, and the goal of the page: "Send me your CV" (emails Shane the file).

const Eyebrow = ({ children, dark }: { children: ReactNode; dark?: boolean }) => (
  <span className={`block text-[11px] font-medium uppercase tracking-[0.3em] mb-5 ${dark ? "text-gold" : "text-gold-deep"}`}>{children}</span>
);

const readAnswers = (): WorkAnswers => (typeof window === "undefined" ? {} : workAnswersFromSearch(window.location.search));

const LEVEL_STYLE: Record<HireLevel, { ring: string; text: string; label: string }> = {
  meet: { ring: "stroke-emerald-400", text: "text-emerald-300", label: "Send me your CV" },
  nearly: { ring: "stroke-gold", text: "text-gold", label: "Nearly there" },
  notyet: { ring: "stroke-red-400", text: "text-red-300", label: "Not yet" },
};

const scrollToCv = (source: string) => {
  trackEvent("select_content", { content_type: "work_cv_button", source });
  document.getElementById("cv")?.scrollIntoView({ behavior: "smooth", block: "start" });
};

const MoreLink = ({ href, label = "Why I say this", dark = true }: { href?: string; label?: string; dark?: boolean }) =>
  href ? (
    <a
      href={href}
      onClick={handleLinkClick}
      className={`mt-2 inline-flex items-center gap-1 text-xs transition-colors ${dark ? "text-gold hover:text-white" : "text-gold-deep hover:text-ink"}`}
    >
      {label} <ArrowRight className="w-3 h-3" />
    </a>
  ) : null;

// ---------------------------------------------------------------------------------------------
// "Would I hire you?" questions and result

function Questions({ answers, step, onAnswer, onBack }: { answers: WorkAnswers; step: number; onAnswer: (id: string) => void; onBack: () => void }) {
  const q = WORK_QUESTIONS[step];
  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-2 mb-8" aria-hidden>
        {WORK_QUESTIONS.map((wq, i) => (
          <span key={wq.id} className={`h-1 flex-1 rounded-full transition-colors ${i < step ? "bg-gold" : i === step ? "bg-white" : "bg-white/15"}`} />
        ))}
      </div>
      <span className="block text-[11px] uppercase tracking-[0.25em] text-white/45 mb-3">
        Would I hire you? · Question {step + 1} of {WORK_QUESTIONS.length}
      </span>
      <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-tight text-white mb-3">{q.question}</h2>
      {q.hint ? <p className="text-white/50 mb-8">{q.hint}</p> : <div className="mb-8" />}
      <div className={`grid sm:grid-cols-2 ${q.options.length > 6 ? "lg:grid-cols-3" : ""} gap-3`}>
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

function ScoreRing({ score, level }: { score: number; level: HireLevel }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative w-36 h-36 shrink-0">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90" aria-hidden>
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="8" className="stroke-white/10" />
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="8" strokeLinecap="round" className={LEVEL_STYLE[level].ring} strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-serif text-4xl text-white">{score}</span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/45">out of 100</span>
      </div>
    </div>
  );
}

function RoleCard({ roleId }: { roleId?: string }) {
  const role = roleById(roleId);
  if (!role) return null;
  return (
    <div className="mb-12 p-6 md:p-8 rounded-[1.5rem] bg-white text-ink grid md:grid-cols-3 gap-6">
      <div>
        <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-gold-deep mb-3">
          <Briefcase className="w-3.5 h-3.5" /> Your route
        </span>
        <span className="block font-serif text-3xl leading-snug mb-2">{role.label}</span>
        <span className="block text-sm text-black/60 leading-relaxed">{role.pay}</span>
        {role.payUnverified && (
          <span className="mt-3 inline-block text-[10px] uppercase tracking-[0.18em] px-2.5 py-1 rounded-full bg-black/[0.05] text-black/50">General range, not a quote</span>
        )}
      </div>
      <div>
        <span className="block text-[10px] uppercase tracking-[0.22em] text-black/45 mb-2">How people get in</span>
        <p className="text-sm text-black/70 leading-relaxed">{role.howIn}</p>
      </div>
      <div>
        <span className="block text-[10px] uppercase tracking-[0.22em] text-black/45 mb-2">The catch</span>
        <p className="text-sm text-black/70 leading-relaxed">{role.catch}</p>
        <div className="flex flex-wrap gap-x-4">
          <MoreLink href={role.href} label="Read my article" dark={false} />
          {role.extra && <MoreLink href={role.extra.href} label={role.extra.label} dark={false} />}
        </div>
      </div>
    </div>
  );
}

function PointList({ items, icon }: { items: WorkResult["flags"]; icon: "flag" | "check" }) {
  return (
    <ul className="space-y-5">
      {items.map((f) => (
        <li key={f.id} className="flex gap-3">
          {icon === "flag" ? (
            <img src="/images/shane-portrait.webp" alt="" width={28} height={28} loading="lazy" className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5" />
          ) : (
            <Check className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="text-white/80 leading-relaxed">{f.text}</p>
            <MoreLink href={f.href} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function ResultView({ answers, result, onRestart }: { answers: WorkAnswers; result: WorkResult; onRestart: () => void }) {
  const [copied, setCopied] = useState(false);
  const s = LEVEL_STYLE[result.level];

  const share = async () => {
    const url = `https://shaneruddle.com${WORK_PATH}${workAnswersQuery(answers)}`;
    trackEvent("share", { method: "copy_link", content_type: "work_check" });
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title: "Would Shane hire me?", text: result.headline, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* user cancelled */
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center gap-8 mb-10">
        <ScoreRing score={result.score} level={result.level} />
        <div className="flex-1">
          <span className={`block text-[11px] uppercase tracking-[0.25em] mb-3 ${s.text}`}>Would I hire you? · {s.label}</span>
          <h2 className="font-serif text-4xl sm:text-5xl leading-[1.05] text-white max-w-3xl mb-3">{result.headline}</h2>
          <p className="text-white/65 text-lg font-light leading-relaxed max-w-2xl">{result.summary}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 mb-12">
        <button
          type="button"
          onClick={() => scrollToCv("work_check_result")}
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-gold text-ink text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:bg-white transition-colors"
        >
          Send me your CV <ArrowRight className="w-4 h-4" />
        </button>
        <button type="button" onClick={share} className="inline-flex items-center gap-2 px-5 py-3.5 border border-white/25 text-white text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:border-gold hover:text-gold transition-colors">
          {copied ? <><Check className="w-4 h-4" /> Link copied</> : <><Link2 className="w-4 h-4" /> Share</>}
        </button>
      </div>

      <RoleCard roleId={answers.role} />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="p-6 md:p-8 rounded-[1.5rem] bg-white/[0.04] border border-white/10">
          <h3 className="flex items-center gap-2 font-serif text-2xl text-white mb-5">
            <AlertTriangle className="w-5 h-5 text-red-300" /> What an owner would worry about
          </h3>
          {result.flags.length ? <PointList items={result.flags} icon="flag" /> : <p className="text-white/60">Honestly, not much. You're the kind of person I'd want to meet.</p>}
        </div>
        <div className="p-6 md:p-8 rounded-[1.5rem] bg-white/[0.04] border border-white/10">
          <h3 className="flex items-center gap-2 font-serif text-2xl text-white mb-5">
            <BadgeCheck className="w-5 h-5 text-emerald-300" /> In your favour
          </h3>
          {result.strengths.length ? <PointList items={result.strengths} icon="check" /> : <p className="text-white/60">Not a lot yet. The worries on the left tell you where to start.</p>}
        </div>
      </div>

      <div className="mt-10">
        <EmailMyResult
          dark
          tool="work_check"
          segment="work"
          title="hiring check"
          heading="Email me my result"
          blurb="I'll send your score and what to work on to your inbox, with a link to open it again. You'll also get my weekly email on life and work in Pattaya."
          summary={workSummary(answers, result)}
          link={`https://shaneruddle.com${WORK_PATH}${workAnswersQuery(answers)}`}
        />
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm text-white/50">
        <p className="text-xs text-white/40 max-w-xl leading-relaxed">
          This is how I think when I hire, after 20 years of employing people here. Other owners weigh things differently, and visa and permit rules change.
        </p>
        <button type="button" onClick={onRestart} className="inline-flex items-center gap-2 hover:text-white">
          <RotateCcw className="w-4 h-4" /> Start again
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Job offer checker

const OFFER_KINDS: { id: OfferKind; label: string }[] = [
  { id: "salary", label: "Salaried job" },
  { id: "teacher", label: "Teaching job" },
  { id: "commission", label: "Sales on commission" },
  { id: "agent", label: "Property agent or broker" },
];

const PERMITS: { id: PermitAnswer; label: string }[] = [
  { id: "employer", label: "They sort it out" },
  { id: "me", label: "I pay for it" },
  { id: "none", label: "No permit" },
  { id: "unsure", label: "Not mentioned" },
];

function OfferChecker() {
  const [kind, setKind] = useState<OfferKind>("salary");
  const [pay, setPay] = useState("");
  const [permit, setPermit] = useState<PermitAnswer | null>(null);
  const tracked = useRef("");
  const amount = Number(pay.replace(/[^\d]/g, ""));
  const flags = permit ? checkOffer({ kind, pay: amount, permit }) : [];

  useEffect(() => {
    if (!permit || !amount) return;
    const key = `${kind}|${permit}|${Math.round(amount / 5000)}`;
    if (tracked.current === key) return;
    tracked.current = key;
    trackEvent("work_offer_check", { kind, permit, pay: amount, bad: flags.some((f) => f.tone === "bad") });
  }, [kind, permit, amount, flags]);

  const chip = (active: boolean) =>
    `px-4 py-2.5 rounded-full border text-sm transition-colors ${active ? "bg-ink text-white border-ink" : "border-black/15 bg-white hover:border-gold-deep"}`;

  return (
    <section className="grid lg:grid-cols-12 gap-10 lg:gap-16">
      <div className="lg:col-span-5">
        <Eyebrow>Got an offer?</Eyebrow>
        <h2 className="font-serif text-3xl md:text-5xl leading-tight mb-5">Check it before you say yes</h2>
        <p className="text-black/60 font-light leading-relaxed mb-8">
          Three things tell me most of what I need to know about a job offer here: what kind of role it is, the monthly pay, and who
          sorts out the work permit.
        </p>
        <div className="space-y-6">
          <div>
            <span className="block text-[11px] uppercase tracking-[0.2em] text-black/45 mb-3">The role</span>
            <div className="flex flex-wrap gap-2">
              {OFFER_KINDS.map((k) => (
                <button key={k.id} type="button" onClick={() => setKind(k.id)} className={chip(kind === k.id)} aria-pressed={kind === k.id}>
                  {k.label}
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="block text-[11px] uppercase tracking-[0.2em] text-black/45 mb-3">
              {kind === "commission" || kind === "agent" ? "Basic monthly pay, before commission" : "Monthly pay"}
            </span>
            <span className="flex items-center gap-2 max-w-xs border border-black/10 bg-white rounded-xl px-4 focus-within:border-gold-deep">
              <span className="text-black/40">฿</span>
              <input
                inputMode="numeric"
                value={pay}
                onChange={(e) => setPay(e.target.value)}
                placeholder="e.g. 55,000"
                className="w-full py-3.5 bg-transparent focus:outline-none"
              />
            </span>
          </label>
          <div>
            <span className="block text-[11px] uppercase tracking-[0.2em] text-black/45 mb-3">The work permit</span>
            <div className="flex flex-wrap gap-2">
              {PERMITS.map((p) => (
                <button key={p.id} type="button" onClick={() => setPermit(p.id)} className={chip(permit === p.id)} aria-pressed={permit === p.id}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="lg:col-span-7">
        <div className="h-full p-6 md:p-8 rounded-[1.5rem] bg-cream border border-cream-line" aria-live="polite">
          {flags.length ? (
            <ul className="space-y-5">
              {flags.map((f, i) => (
                <li key={i} className="flex gap-3">
                  {f.tone === "bad" ? (
                    <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  ) : f.tone === "warn" ? (
                    <AlertTriangle className="w-5 h-5 text-gold-deep shrink-0 mt-0.5" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-black/75 leading-relaxed">{f.text}</p>
                    <MoreLink href={f.href} dark={false} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="h-full flex flex-col justify-center text-black/50">
              <ShieldCheck className="w-8 h-8 text-gold-deep mb-4" />
              <p className="font-serif text-2xl text-ink mb-2">Your verdict appears here</p>
              <p className="font-light">Pick the role, add the pay and say who handles the work permit.</p>
            </div>
          )}
          <p className="mt-8 text-xs text-black/40 leading-relaxed">
            My experience as an employer, not legal advice. The work-permit minimum salary depends on your nationality and whether you're married to a Thai.
          </p>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------------------------
// 90-day networking plan

function NetworkingPlan() {
  const [done, setDone] = useState<Record<string, boolean>>({});
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PLAN_STORAGE_KEY);
      if (saved) setDone(JSON.parse(saved));
    } catch {
      /* storage unavailable */
    }
  }, []);
  const count = PLAN.filter((p) => done[p.id]).length;
  const toggle = (id: string) => {
    const next = { ...done, [id]: !done[id] };
    setDone(next);
    try {
      localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable */
    }
    trackEvent("work_plan_tick", { item: id, checked: next[id], done: PLAN.filter((p) => next[p.id]).length });
    if (id === "shane" && next[id]) scrollToCv("work_plan");
  };
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-6 mb-8">
        <div className="max-w-2xl">
          <Eyebrow>How I found work, and most of my staff</Eyebrow>
          <h2 className="font-serif text-3xl md:text-5xl leading-tight mb-4">Your 90-day networking plan</h2>
          <p className="text-black/60 font-light leading-relaxed">
            Don't walk in and ask if they've got any jobs. Do this for a few months and you'll know enough of the right people. If you're
            the type of person they'd hire, I can assure you the phone will ring.
          </p>
        </div>
        <div className="text-right">
          <span className="block font-serif text-5xl text-gold-deep">
            {count}/{PLAN.length}
          </span>
          <span className="block text-sm text-black/50">ticked off (saved on this device)</span>
        </div>
      </div>
      <ol className="grid md:grid-cols-2 gap-3">
        {PLAN.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => toggle(p.id)}
              aria-pressed={!!done[p.id]}
              className={`w-full h-full flex gap-4 text-left p-5 rounded-2xl border transition-colors ${
                done[p.id] ? "border-gold-deep/60 bg-gold/10" : p.id === "shane" ? "border-gold-deep/50 bg-cream hover:border-gold-deep" : "border-black/10 bg-white hover:border-black/25"
              }`}
            >
              <span className={`mt-0.5 w-6 h-6 shrink-0 rounded-full border flex items-center justify-center ${done[p.id] ? "bg-gold border-gold text-ink" : "border-black/25"}`}>
                {done[p.id] && <Check className="w-3.5 h-3.5" />}
              </span>
              <span>
                <span className="block text-[10px] uppercase tracking-[0.2em] text-gold-deep mb-1">{p.when}</span>
                <span className="block text-lg leading-snug">{p.title}</span>
                <span className="block text-sm text-black/55 mt-1 leading-relaxed">{p.body}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

// ---------------------------------------------------------------------------------------------
// CV upload: the page's goal

function readFileBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

function CvSection({ answers, result }: { answers: WorkAnswers; result: WorkResult | null }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState(answers.role && answers.role !== "unsure" ? answers.role : "");
  const [where, setWhere] = useState(answers.where ?? "");
  const [years, setYears] = useState(answers.years ?? "");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [shareOk, setShareOk] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const started = useRef(false);

  // Answers from the check fill the form once they arrive.
  useEffect(() => {
    if (answers.role && answers.role !== "unsure") setRole(answers.role);
    if (answers.where) setWhere(answers.where);
    if (answers.years) setYears(answers.years);
  }, [answers.role, answers.where, answers.years]);

  const markStarted = () => {
    if (started.current) return;
    started.current = true;
    trackEvent("work_cv_start", { has_check: !!result });
  };

  const pickFile = (f: File | null) => {
    setError("");
    if (!f) return setFile(null);
    const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
    if (!CV_TYPES.includes(ext)) return setError("Please attach a PDF or Word document.");
    if (f.size > CV_MAX_BYTES) return setError("That file is over 5 MB. Please send a smaller version.");
    markStarted();
    setFile(f);
  };

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return setError("Please attach your CV.");
    setSending(true);
    setError("");
    try {
      const data = await readFileBase64(file);
      const res = await fetch("/api/cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          role: roleById(role)?.label ?? (role === "other" ? "Something else" : ""),
          location: WHERE_OPTIONS.find((o) => o.id === where)?.label ?? "",
          years: YEARS_OPTIONS.find((o) => o.id === years)?.label ?? "",
          note,
          shareOk,
          context: result ? workSummary(answers, result) : "",
          page: window.location.pathname,
          website,
          file: { name: file.name, type: file.type, data },
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Sorry, that didn't send. Please try again.");
      trackEvent("generate_lead", { form: "cv", form_location: "work_page", role: role || "none", score: result?.score ?? null, share_ok: shareOk });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sorry, that didn't send. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const field = "border border-black/10 bg-white rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-gold-deep transition-colors w-full";

  return (
    <section id="cv" className="scroll-mt-28 p-8 md:p-12 bg-ink text-white rounded-[2rem] grid lg:grid-cols-12 gap-10">
      <div className="lg:col-span-5">
        <Eyebrow dark>Send me your CV</Eyebrow>
        <h2 className="font-serif text-3xl md:text-5xl leading-tight mb-5">I'm always looking for good people</h2>
        <p className="text-white/65 font-light leading-relaxed mb-6">
          I employ foreigners across my restaurants, pubs and property companies, and after 20 years here I know a lot of other owners
          who are often hiring. Most hiring in Pattaya happens through recommendations. If you come recommended, your chances go up a lot.
        </p>
        <ul className="space-y-3 text-sm text-white/60">
          <li className="flex gap-3"><Check className="w-4 h-4 text-gold shrink-0 mt-0.5" /> I read every CV myself.</li>
          <li className="flex gap-3"><Check className="w-4 h-4 text-gold shrink-0 mt-0.5" /> If I don't have the right role, I may know someone who does.</li>
          <li className="flex gap-3"><Check className="w-4 h-4 text-gold shrink-0 mt-0.5" /> Settled here? Say so. It's the first thing I look for.</li>
        </ul>
        {result && (
          <p className="mt-6 text-xs text-white/45 border-l-2 border-gold/60 pl-3">Your "Would I hire you?" answers come with your CV, so I won't need to ask the basics.</p>
        )}
      </div>
      <div className="lg:col-span-7">
        {sent ? (
          <div className="h-full flex items-start gap-4 rounded-2xl border border-gold/30 bg-white/5 p-6">
            <span className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
              <Check className="w-5 h-5 text-gold" />
            </span>
            <div>
              <p className="font-serif text-2xl mb-1">Thanks{name ? `, ${name.split(" ")[0]}` : ""}. I've got your CV.</p>
              <p className="text-sm text-white/60 leading-relaxed">
                I'll be in touch at {email} if I have something, or if I know someone who does. In the meantime, keep working through your
                networking plan.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={send} className="text-ink">
            <div className="grid sm:grid-cols-2 gap-3">
              <input required autoComplete="name" placeholder="Your name" value={name} onFocus={markStarted} onChange={(e) => setName(e.target.value)} className={field} />
              <input required type="email" autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
              <input type="tel" autoComplete="tel" placeholder="WhatsApp or phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} className={field} />
              <select required value={role} onChange={(e) => setRole(e.target.value)} className={field} aria-label="The work you're after">
                <option value="">The work you're after</option>
                {ROLES.filter((r) => r.id !== "remote").map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
                <option value="other">Something else</option>
              </select>
              <select required value={where} onChange={(e) => setWhere(e.target.value)} className={field} aria-label="Where you are now">
                <option value="">Where you are now</option>
                {WHERE_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
              <select required value={years} onChange={(e) => setYears(e.target.value)} className={field} aria-label="Time in Thailand">
                <option value="">Time in Thailand</option>
                {YEARS_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            </div>
            <textarea
              rows={3}
              maxLength={2000}
              placeholder="Anything I should know? Your visa, languages, what ties you to Thailand (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={`${field} mt-3 resize-none`}
            />
            <label
              className={`mt-3 flex items-center gap-4 p-4 rounded-xl border border-dashed cursor-pointer transition-colors ${
                file ? "border-gold bg-gold/10 text-white" : "border-white/30 text-white/70 hover:border-gold"
              }`}
            >
              {file ? <FileText className="w-6 h-6 text-gold shrink-0" /> : <Upload className="w-6 h-6 text-gold shrink-0" />}
              <span className="flex-1 min-w-0">
                <span className="block truncate">{file ? file.name : "Attach your CV"}</span>
                <span className="block text-xs text-white/45">PDF or Word, up to 5 MB</span>
              </span>
              <input type="file" accept=".pdf,.doc,.docx" className="sr-only" onChange={(e) => pickFile(e.target.files?.[0] ?? null)} />
            </label>
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="absolute -left-[9999px] h-0 w-0 opacity-0"
              name="website"
            />
            <label className="mt-4 flex items-start gap-3 text-sm text-white/60 cursor-pointer">
              <input type="checkbox" checked={shareOk} onChange={(e) => setShareOk(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#D4AF37] shrink-0" />
              <span>You can pass my CV to other Pattaya business owners who are hiring.</span>
            </label>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <p className="text-xs text-white/40 max-w-xs">
                Your CV goes to me by email. See my{" "}
                <a href="/privacy" onClick={handleLinkClick} className="underline hover:text-white">privacy policy</a>.
              </p>
              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center justify-center gap-2 bg-gold text-ink font-semibold px-7 py-3.5 rounded-full text-xs uppercase tracking-[0.18em] hover:bg-white transition-colors disabled:opacity-40"
              >
                {sending ? "Sending…" : <>Send my CV <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
            {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
          </form>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------------------------
// Page

export default function WorkPage() {
  const [answers, setAnswers] = useState<WorkAnswers>(readAnswers);
  const [step, setStep] = useState(() => {
    const first = WORK_QUESTIONS.findIndex((q) => !readAnswers()[q.id]);
    return first === -1 ? WORK_QUESTIONS.length : 0;
  });
  const started = useRef(false);
  const done = step >= WORK_QUESTIONS.length;
  const result = done ? assessWork(answers) : null;

  useEffect(() => {
    applyPageMeta(WORK_META);
  }, []);

  const scrollTop = () => document.getElementById("check")?.scrollIntoView({ behavior: "smooth", block: "start" });

  const answer = (id: string) => {
    const q = WORK_QUESTIONS[step];
    if (!started.current) {
      started.current = true;
      trackEvent("work_check_start", { role: q.id === "role" ? id : answers.role });
    }
    const next = { ...answers, [q.id]: id };
    setAnswers(next);
    setStep(step + 1);
    scrollTop();
    if (step + 1 >= WORK_QUESTIONS.length) {
      const r = assessWork(next);
      trackEvent("work_check_complete", { level: r.level, score: r.score, ...next });
      window.history.replaceState(null, "", `${WORK_PATH}${workAnswersQuery(next)}`);
    }
  };

  const restart = () => {
    setAnswers({});
    setStep(0);
    window.history.replaceState(null, "", WORK_PATH);
    scrollTop();
  };

  return (
    <>
      <section id="check" className="bg-ink text-white pt-28 md:pt-36 pb-16 md:pb-24 px-6 md:px-12 scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <span className="block text-[11px] font-medium uppercase tracking-[0.3em] mb-5 text-gold">Working in Pattaya · From the boss's side</span>
          {!result && (
            <>
              <h1 className="font-serif font-normal text-[2.6rem] sm:text-6xl lg:text-7xl leading-[1.04] tracking-tight mb-6 max-w-5xl">
                Want to work in Pattaya? <span className="italic text-gold">See it the way an employer does.</span>
              </h1>
              <p className="text-lg md:text-xl text-white/65 font-light leading-relaxed max-w-2xl mb-8">
                I found my first job here managing a bar in Soi 13. Now I hire foreigners across seven businesses. Answer six quick questions
                and I'll tell you what I'd think if your CV landed on my desk, then send it to me for real.
              </p>
              <div className="flex flex-wrap items-center gap-x-8 gap-y-4 mb-12 md:mb-16">
                <span className="flex items-center gap-3">
                  <img src="/images/shane-portrait.webp" alt="" width={44} height={44} className="w-11 h-11 rounded-full object-cover" />
                  <span className="text-sm text-white/60">
                    By <a href="/about" onClick={handleLinkClick} className="text-white hover:text-gold">Shane Ruddle</a>
                    <span className="block text-white/40">Employer in Pattaya for 20 years</span>
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => scrollToCv("work_hero")}
                  className="inline-flex items-center gap-2 px-5 py-3 border border-gold/60 text-gold text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:bg-gold hover:text-ink transition-colors"
                >
                  Skip to sending your CV <ArrowRight className="w-4 h-4" />
                </button>
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
          {result && <CvSection answers={answers} result={result} />}

          {/* What I look for */}
          <section>
            <div className="max-w-3xl mb-10">
              <Eyebrow>What I look for when I hire</Eyebrow>
              <h2 className="font-serif text-3xl md:text-5xl leading-tight mb-4">Your CV tells me what you did elsewhere. Your life here tells me whether you'll last.</h2>
              <p className="text-black/60 font-light leading-relaxed">
                Finding good foreign staff in Pattaya is easy. Keeping them isn't. So these are the six things I weigh, and I've stopped putting
                much weight on experience back home.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {LOOK_FOR.map((l, i) => (
                <div key={l.id} className="flex flex-col p-6 rounded-[1.25rem] bg-white border border-black/[0.06]">
                  <span className="font-serif text-4xl text-gold-deep/40 mb-3">0{i + 1}</span>
                  <span className="font-serif text-2xl mb-2">{l.title}</span>
                  <span className="text-sm text-black/60 leading-relaxed flex-1">{l.body}</span>
                  <MoreLink href={l.href} label="Read more" dark={false} />
                </div>
              ))}
            </div>
          </section>

          {/* Jobs and pay */}
          <section>
            <div className="flex flex-wrap items-end justify-between gap-6 mb-8">
              <div className="max-w-2xl">
                <Eyebrow>The jobs foreigners actually do</Eyebrow>
                <h2 className="font-serif text-3xl md:text-5xl leading-tight">What they pay, and how people get in</h2>
              </div>
              <p className="text-sm text-black/50 max-w-sm">
                Many occupations are reserved for Thai nationals. These are the roles I see foreigners do most, with the pay I see.
              </p>
            </div>
            <div className="divide-y divide-black/10 border-y border-black/10">
              {ROLES.map((r) => (
                <div key={r.id} className="grid md:grid-cols-12 gap-3 md:gap-8 py-6">
                  <div className="md:col-span-3">
                    <a href={r.href} onClick={handleLinkClick} className="font-serif text-2xl hover:text-gold-deep transition-colors">{r.label}</a>
                    <span className="block text-sm text-black/45 mt-1">{r.short}</span>
                  </div>
                  <div className="md:col-span-4">
                    <span className="block text-[10px] uppercase tracking-[0.2em] text-black/40 mb-1">Pay</span>
                    <p className="text-black/75 leading-relaxed">{r.pay}</p>
                    {r.payUnverified && <span className="mt-2 inline-block text-[10px] uppercase tracking-[0.18em] px-2 py-0.5 rounded-full bg-black/[0.05] text-black/45">General range</span>}
                  </div>
                  <div className="md:col-span-5">
                    <span className="block text-[10px] uppercase tracking-[0.2em] text-black/40 mb-1">The catch</span>
                    <p className="text-black/60 text-sm leading-relaxed">{r.catch}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <OfferChecker />

          <NetworkingPlan />

          {/* Where to look */}
          <section className="grid lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-5">
              <Eyebrow>Where to look</Eyebrow>
              <h2 className="font-serif text-3xl md:text-5xl leading-tight mb-5">Five places jobs actually come from</h2>
              <p className="text-black/60 font-light leading-relaxed">
                Occasionally you'll see an advert saying foreigners can apply. But most jobs here never get advertised at all.
              </p>
            </div>
            <ol className="lg:col-span-7 divide-y divide-black/10 border-y border-black/10">
              {[
                { t: "People you meet", b: "By far the best way. It's how I found most of my staff, and how I found work when I arrived.", href: "/articles/finding-a-job-in-pattaya" },
                { t: "Owners who know owners", b: "Send me your CV. I know a lot of business owners here who are often hiring, and a recommendation goes a long way.", cv: true },
                { t: "Big hotels and international schools", b: "Here a CV and a proper application work. Networking with big hotels is very hard.", href: "/international-schools-pattaya" },
                { t: "My property companies", b: "Alan Bolton Property Consultants and East Coast Real Estate hire Thai and foreign staff for the roles foreigners can legally do.", href: "/articles/working-as-a-property-agent-in-pattaya" },
                {
                  t: "Pattaya Job Centre",
                  b: "I started it over 20 years ago, when there was no central place for Thais looking for work, and handed it over long ago. It's still going, but it's mainly for Thai nationals.",
                  href: "/articles/bar-manager-to-7-businesses",
                },
              ].map((x, i) => (
                <li key={x.t} className="flex gap-5 py-6">
                  <span className="font-serif text-2xl text-gold-deep w-6 shrink-0">{i + 1}</span>
                  <div>
                    <h3 className="font-serif text-xl mb-1">{x.t}</h3>
                    <p className="text-black/60 font-light leading-relaxed">{x.b}</p>
                    {x.cv ? (
                      <button type="button" onClick={() => scrollToCv("work_where")} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-gold-deep hover:text-ink">
                        Send me your CV <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <MoreLink href={x.href} label="More" dark={false} />
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {!result && <CvSection answers={answers} result={null} />}

          {/* FAQ */}
          <section className="grid lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-4">
              <Eyebrow>Short answers</Eyebrow>
              <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-6">Working in Pattaya as a foreigner</h2>
              <p className="text-black/60 font-light leading-relaxed mb-6">
                Running your own business instead? That's a different set of rules.
              </p>
              <a href="/business-in-pattaya" onClick={handleLinkClick} className="inline-flex items-center gap-2 text-sm font-medium text-gold-deep hover:text-ink">
                Try my business reality check <ArrowRight className="w-4 h-4" />
              </a>
              <a href="/thai-visas" onClick={handleLinkClick} className="mt-3 flex items-center gap-2 text-sm font-medium text-gold-deep hover:text-ink">
                Find the right visa <ArrowRight className="w-4 h-4" />
              </a>
              <a href="/move-to-thailand" onClick={handleLinkClick} className="mt-3 flex items-center gap-2 text-sm font-medium text-gold-deep hover:text-ink">
                Plan your move <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <div className="lg:col-span-8 divide-y divide-black/10 border-y border-black/10">
              {WORK_FAQS.map((f) => (
                <div key={f.q} className="py-6">
                  <h3 className="font-serif text-xl leading-snug mb-2">{f.q}</h3>
                  <p className="text-black/65 font-light leading-relaxed">{f.a}</p>
                  <MoreLink href={f.href} label="More" dark={false} />
                </div>
              ))}
            </div>
          </section>

          <div className="p-8 md:p-12 bg-cream border border-cream-line rounded-[2rem] grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif mb-2">Get the next article by email</h2>
              <p className="text-black/60 font-light">One short email a week on property, business and life in Pattaya. Free, no spam.</p>
            </div>
            <NewsletterSignup source="work_page" />
          </div>
        </div>
      </div>
    </>
  );
}
