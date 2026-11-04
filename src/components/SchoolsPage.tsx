import { ReactNode, useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, ArrowUpRight, Check, Clock, Link2, RotateCcw, ShieldCheck } from "lucide-react";
import { AREAS, AreaId, areaById } from "../lib/areas";
import {
  FEES_AS_OF,
  SCHOOLS,
  SCHOOLS_FAQS,
  SCHOOLS_META,
  SCHOOLS_PATH,
  SCHOOL_QUESTIONS,
  School,
  SchoolAnswers,
  ageLabel,
  baht,
  faqsForSchool,
  feeRange,
  feeRangeMonthly,
  matchSchools,
  schoolAnswersSummary,
  schoolBySlug,
} from "../lib/schools";
import { handleLinkClick } from "../lib/navigation";
import { trackEvent } from "../lib/analytics";
import { applyPageMeta } from "../seo";
import AskShane from "./AskShane";
import NewsletterSignup from "./NewsletterSignup";
import EmailMyResult from "./EmailMyResult";

// International schools: /international-schools-pattaya (school chooser + comparison table) and
// /international-schools-pattaya/<slug>. Shared by the build-time prerender and the live app.
// Chooser answers live in the URL so a shortlist can be shared.

const Eyebrow = ({ children, dark = false }: { children: ReactNode; dark?: boolean }) => (
  <span className={`block text-[11px] font-medium uppercase tracking-[0.3em] mb-5 ${dark ? "text-gold" : "text-gold-deep"}`}>{children}</span>
);

function SourceBadge({ school, dark = false }: { school: School; dark?: boolean }) {
  return school.fromShane ? (
    <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] px-2.5 py-1 rounded-full whitespace-nowrap ${dark ? "bg-gold/15 text-gold" : "bg-gold/10 text-gold-deep"}`}>
      <ShieldCheck className="w-3 h-3" /> {school.id === "tara" ? "My kids go here" : "Parent's take"}
    </span>
  ) : (
    <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] px-2.5 py-1 rounded-full whitespace-nowrap ${dark ? "bg-white/10 text-white/70" : "bg-black/[0.05] text-black/55"}`}>
      <AlertTriangle className="w-3 h-3" /> Facts only
    </span>
  );
}

const RUN_AREAS: AreaId[] = ["east", "jomtien", "pratumnak", "central", "wongamat", "najomtien"];
const areaShort = (id: AreaId) => (id === "wongamat" ? "Wongamat & Naklua" : id === "najomtien" ? "Na Jomtien" : areaById(id).name);

function readAnswers(): SchoolAnswers {
  if (typeof window === "undefined") return {};
  const q = new URLSearchParams(window.location.search);
  const out: SchoolAnswers = {};
  for (const sq of SCHOOL_QUESTIONS) {
    const v = q.get(sq.id);
    if (v && sq.options.some((o) => o.id === v)) out[sq.id] = v;
  }
  return out;
}

const answersQuery = (a: SchoolAnswers) =>
  "?" + SCHOOL_QUESTIONS.filter((q) => a[q.id]).map((q) => `${q.id}=${a[q.id]}`).join("&");

const schoolHref = (s: School) => `${SCHOOLS_PATH}/${s.slug}`;

// ---------------------------------------------------------------------------------------------
// Chooser

function SchoolChooser({ source }: { source: string }) {
  const [answers, setAnswers] = useState<SchoolAnswers>(readAnswers);
  const [step, setStep] = useState(() => {
    const a = readAnswers();
    return SCHOOL_QUESTIONS.findIndex((q) => !a[q.id]) === -1 ? SCHOOL_QUESTIONS.length : 0;
  });
  const [asking, setAsking] = useState(false);
  const [copied, setCopied] = useState(false);
  const started = useRef(false);
  const done = step >= SCHOOL_QUESTIONS.length;
  const matches = done ? matchSchools(answers) : [];
  const q = SCHOOL_QUESTIONS[step];

  const answer = (id: string) => {
    if (!started.current) {
      started.current = true;
      trackEvent("school_finder_start", { source });
    }
    const next = { ...answers, [q.id]: id };
    setAnswers(next);
    setStep(step + 1);
    document.getElementById("chooser")?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (step + 1 >= SCHOOL_QUESTIONS.length) {
      const m = matchSchools(next);
      trackEvent("school_finder_complete", { source, school: m[0]?.school.id, runner_up: m[1]?.school.id, ...next });
      window.history.replaceState(null, "", `${SCHOOLS_PATH}${answersQuery(next)}`);
    }
  };

  const restart = () => {
    setAnswers({});
    setStep(0);
    setAsking(false);
    window.history.replaceState(null, "", SCHOOLS_PATH);
  };

  const share = async () => {
    const url = `https://shaneruddle.com${SCHOOLS_PATH}${answersQuery(answers)}`;
    trackEvent("share", { method: "copy_link", content_type: "school_finder" });
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title: "My Pattaya international school shortlist", text: `Top pick: ${matches[0]?.school.name}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* user cancelled */
    }
  };

  if (done) {
    const top = matches.slice(0, 3);
    const rest = matches.slice(3);
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="block text-[11px] uppercase tracking-[0.25em] text-gold mb-2">Your shortlist</span>
            <h3 className="font-serif text-3xl md:text-4xl text-white">
              {top.length ? "These are the schools I'd go and see first." : "No school fits every answer."}
            </h3>
          </div>
          <div className="flex items-center gap-5 text-sm text-white/60">
            <button type="button" onClick={share} className="flex items-center gap-2 text-white hover:text-gold">
              {copied ? <><Check className="w-4 h-4" /> Link copied</> : <><Link2 className="w-4 h-4" /> Share</>}
            </button>
            <button type="button" onClick={restart} className="flex items-center gap-2 hover:text-white">
              <RotateCcw className="w-4 h-4" /> Start again
            </button>
          </div>
        </div>

        <ol className="grid lg:grid-cols-3 gap-4 md:gap-5">
          {top.map((m, i) => (
            <li key={m.school.id} className={`flex flex-col rounded-[1.5rem] p-6 md:p-7 ${i === 0 ? "bg-white text-ink" : "bg-white/[0.05] border border-white/15 text-white"}`}>
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className={`font-serif text-4xl leading-none ${i === 0 ? "text-gold-deep" : "text-gold/70"}`}>{i + 1}</span>
                <SourceBadge school={m.school} dark={i !== 0} />
              </div>
              <h4 className={`font-serif text-2xl md:text-[1.7rem] leading-snug mb-2 ${i === 0 ? "text-ink" : "text-white"}`}>{m.school.name}</h4>
              <p className={`text-sm mb-5 ${i === 0 ? "text-black/55" : "text-white/55"}`}>{m.school.tagline}</p>
              <dl className={`grid grid-cols-2 gap-3 mb-5 text-sm ${i === 0 ? "" : "text-white/80"}`}>
                <div className={`p-3 rounded-xl ${i === 0 ? "bg-paper" : "bg-white/[0.04]"}`}>
                  <dt className={`text-[10px] uppercase tracking-[0.18em] mb-1 ${i === 0 ? "text-black/45" : "text-white/45"}`}>Tuition {ageLabel(answers.age) ? "(rough)" : ""}</dt>
                  <dd>{m.fee ? `${baht(m.fee)} a year` : "Not published"}</dd>
                </div>
                <div className={`p-3 rounded-xl ${i === 0 ? "bg-paper" : "bg-white/[0.04]"}`}>
                  <dt className={`text-[10px] uppercase tracking-[0.18em] mb-1 ${i === 0 ? "text-black/45" : "text-white/45"}`}>School run</dt>
                  <dd>{m.minutes ? `About ${m.minutes} min` : m.school.location.split(",")[0]}</dd>
                </div>
              </dl>
              {m.reasons.length > 0 && (
                <ul className="space-y-2 mb-6">
                  {m.reasons.slice(0, 3).map((r) => (
                    <li key={r} className={`flex gap-2 text-sm leading-snug ${i === 0 ? "text-black/70" : "text-white/70"}`}>
                      <Check className={`w-4 h-4 mt-0.5 shrink-0 ${i === 0 ? "text-gold-deep" : "text-gold"}`} />
                      <span>{r.charAt(0).toUpperCase() + r.slice(1)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <a
                href={schoolHref(m.school)}
                onClick={(e) => {
                  trackEvent("select_school", { school: m.school.id, source: `${source}_result_${i + 1}` });
                  handleLinkClick(e);
                }}
                className={`mt-auto inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] ${i === 0 ? "text-gold-deep hover:text-ink" : "text-gold hover:text-white"}`}
              >
                Fees, school run and my take <ArrowRight className="w-4 h-4" />
              </a>
            </li>
          ))}
        </ol>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-7 md:p-9 rounded-[1.5rem] bg-gold text-ink">
          <div className="flex items-center gap-4">
            <img src="/images/shane-portrait.webp" alt="" width={52} height={52} className="w-13 h-13 rounded-full object-cover ring-2 ring-ink/10 shrink-0" style={{ width: 52, height: 52 }} />
            <div>
              <span className="block font-serif text-2xl md:text-3xl leading-snug">Send your shortlist to me</span>
              <span className="block text-sm text-ink/70 mt-1">I've been through this with my own kids. Tell me what you're weighing up and I'll reply personally.</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setAsking(true);
              trackEvent("select_content", { content_type: "school_finder_ask", school: top[0]?.school.id });
              setTimeout(() => document.getElementById("chooser-ask")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
            }}
            className="inline-flex items-center gap-2 self-start md:self-auto px-6 py-3.5 bg-ink text-white text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:bg-white hover:text-ink transition-colors whitespace-nowrap"
          >
            Ask me about these <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <EmailMyResult
          dark
          tool="school_finder"
          segment="moving"
          title="school shortlist"
          summary={`Your school shortlist${top[0] ? `: ${top[0].school.name} first` : ""}\n${schoolAnswersSummary(answers, matches).split("\n").filter((l) => l && !l.endsWith(":")).join("\n")}`}
          link={`https://shaneruddle.com${SCHOOLS_PATH}${answersQuery(answers)}`}
        />

        {asking && (
          <div id="chooser-ask" className="p-7 md:p-10 bg-cream text-ink border border-cream-line rounded-[1.75rem] scroll-mt-28">
            <AskShane
              source={`school_finder_${top[0]?.school.id ?? "none"}`}
              initialTopic="family"
              context={schoolAnswersSummary(answers, matches)}
              contextNote="I'll see your answers and shortlist with your question."
            />
          </div>
        )}

        {rest.length > 0 && (
          <p className="text-sm text-white/50">
            Also worth a look:{" "}
            {rest.map((m, i) => (
              <span key={m.school.id}>
                <a href={schoolHref(m.school)} onClick={handleLinkClick} className="text-white/80 underline underline-offset-4 hover:text-gold">{m.school.short}</a>
                {i < rest.length - 1 ? ", " : "."}
              </span>
            ))}{" "}
            Fees are published {FEES_AS_OF} tuition, estimated for your child's age. School-run times are my estimates outside rush hour.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 mb-8" aria-hidden>
        {SCHOOL_QUESTIONS.map((sq, i) => (
          <span key={sq.id} className={`h-1 flex-1 rounded-full transition-colors ${i < step ? "bg-gold" : i === step ? "bg-white" : "bg-white/15"}`} />
        ))}
      </div>
      <span className="block text-[11px] uppercase tracking-[0.25em] text-white/45 mb-3">
        Question {step + 1} of {SCHOOL_QUESTIONS.length}
      </span>
      <h3 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-tight text-white mb-3">{q.question}</h3>
      {q.hint ? <p className="text-white/50 mb-8">{q.hint}</p> : <div className="mb-8" />}
      <div className="grid sm:grid-cols-2 gap-3">
        {q.options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => answer(o.id)}
            className={`group flex items-center justify-between gap-4 text-left px-6 py-5 rounded-2xl border transition-all ${
              answers[q.id] === o.id ? "border-gold bg-gold/15" : "border-white/15 bg-white/[0.04] hover:border-gold hover:-translate-y-0.5"
            }`}
          >
            <span className="text-lg text-white">{o.label}</span>
            <ArrowRight className="w-4 h-4 text-gold opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>
        ))}
      </div>
      {step > 0 && (
        <button type="button" onClick={() => setStep(step - 1)} className="mt-6 inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Comparison table

type SortKey = "run" | "fees" | "name";

function CompareTable() {
  const [from, setFrom] = useState<AreaId>("east");
  const [sort, setSort] = useState<SortKey>("run");
  const rows = [...SCHOOLS].sort((a, b) =>
    sort === "run" ? a.minutes[from] - b.minutes[from] : sort === "fees" ? (a.fees?.[0] ?? Infinity) - (b.fees?.[0] ?? Infinity) : a.name.localeCompare(b.name)
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-xs uppercase tracking-[0.18em] text-black/45 mr-1">School run from</span>
        {RUN_AREAS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setFrom(id);
              setSort("run");
              trackEvent("select_content", { content_type: "school_table_area", area: id });
            }}
            className={`px-4 py-2 rounded-full text-sm border transition-colors ${from === id ? "bg-ink text-white border-ink" : "bg-white border-black/10 text-black/70 hover:border-gold-deep"}`}
          >
            {areaShort(id)}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
        <table className="w-full min-w-[760px] text-left bg-white border border-black/[0.08] rounded-[1.25rem] overflow-hidden">
          <thead className="bg-paper text-[11px] uppercase tracking-[0.16em] text-black/50">
            <tr>
              {([
                ["name", "School"],
                [null, "Curriculum"],
                [null, "Ages"],
                ["fees", `Tuition a year (${FEES_AS_OF})`],
                ["run", `From ${areaShort(from)}`],
              ] as [SortKey | null, string][]).map(([key, label]) => (
                <th key={label} className="px-5 py-4 font-medium">
                  {key ? (
                    <button type="button" onClick={() => setSort(key)} className={`uppercase tracking-[0.16em] ${sort === key ? "text-gold-deep" : "hover:text-ink"}`}>
                      {label} {sort === key ? "↓" : ""}
                    </button>
                  ) : (
                    label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.06]">
            {rows.map((s) => (
              <tr key={s.id} className="align-top hover:bg-gold/[0.04]">
                <td className="px-5 py-5">
                  <a
                    href={schoolHref(s)}
                    onClick={(e) => {
                      trackEvent("select_school", { school: s.id, source: "school_table" });
                      handleLinkClick(e);
                    }}
                    className="font-serif text-lg text-ink hover:text-gold-deep"
                  >
                    {s.name}
                  </a>
                  <span className="block text-xs text-black/45 mt-1">{s.tagline}</span>
                </td>
                <td className="px-5 py-5 text-sm text-black/70">{s.curriculumLabel}{s.boarding ? <span className="block text-xs text-black/45">Day and boarding</span> : null}</td>
                <td className="px-5 py-5 text-sm text-black/70 whitespace-nowrap">{s.ages[0]} to {s.ages[1]}</td>
                <td className="px-5 py-5 text-sm text-ink whitespace-nowrap">{feeRange(s)}</td>
                <td className="px-5 py-5 text-sm whitespace-nowrap">
                  <span className={`inline-flex items-center gap-1.5 ${s.minutes[from] <= 20 ? "text-ink font-medium" : s.minutes[from] >= 45 ? "text-black/45" : "text-black/70"}`}>
                    <Clock className="w-3.5 h-3.5 text-gold-deep" /> ~{s.minutes[from]} min
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-black/45 leading-relaxed max-w-3xl">
        Tuition is each school's published {FEES_AS_OF} annual fee, youngest to oldest year group, before one-off fees, uniforms, buses and
        boarding. Check the school's current schedule before you commit. School-run times are my estimates one way, outside rush hour; add
        15 to 30 minutes in high season.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Hub

function SchoolsHub() {
  return (
    <>
      <section id="chooser" className="bg-ink text-white pt-28 md:pt-36 pb-16 md:pb-24 px-6 md:px-12 scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <a href="/guides/pattaya-for-families" onClick={handleLinkClick} className="block text-[11px] font-medium uppercase tracking-[0.3em] mb-5 text-gold hover:text-white transition-colors">
            Pattaya for families · School chooser
          </a>
          <h1 className="font-serif font-normal text-[2.6rem] sm:text-6xl lg:text-7xl leading-[1.04] tracking-tight mb-6 max-w-5xl">
            International schools in Pattaya, <span className="italic text-gold">from a parent.</span>
          </h1>
          <p className="text-lg md:text-xl text-white/65 font-light leading-relaxed max-w-2xl mb-8">
            I've been through choosing a school here for my own kids. Answer five questions and I'll give you a shortlist, with the{" "}
            {FEES_AS_OF} fees and how long the school run will really be.
          </p>
          <div className="flex items-center gap-3 mb-12 md:mb-16">
            <img src="/images/shane-portrait.webp" alt="" width={44} height={44} className="w-11 h-11 rounded-full object-cover" />
            <span className="text-sm text-white/60">
              By <a href="/about" onClick={handleLinkClick} className="text-white hover:text-gold">Shane Ruddle</a>
              <span className="block text-white/40">Pattaya parent · {SCHOOLS.length} schools · {FEES_AS_OF} fees</span>
            </span>
          </div>
          <SchoolChooser source="school_hub" />
        </div>
      </section>

      <div className="bg-paper px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto space-y-16 md:space-y-24">
          <section>
            <Eyebrow>Compare them all</Eyebrow>
            <h2 className="font-serif text-4xl md:text-5xl leading-tight mb-4">Every school, side by side</h2>
            <p className="text-black/60 font-light max-w-2xl mb-10">
              Pick where you'll live to see the school run from there. Most of the schools are on the east side of town, which is why most families live in East Pattaya.
            </p>
            <CompareTable />
          </section>

          <section className="grid lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-5">
              <Eyebrow>How I chose</Eyebrow>
              <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-6">Don't underestimate the school run.</h2>
              <div className="space-y-4 text-black/65 font-light leading-relaxed">
                <p>
                  When we chose, we lived close to the centre. All the international schools are quite a way out, and in high season the drive back from
                  some of them would have taken a long time.
                </p>
                <p>
                  So we chose Tara Pattana, mainly on location. At primary age I didn't think it made much difference to go to the very best school. Rugby
                  is arguably the best, and if you've got an older child there, the bill is close to ฿400,000 every term. Plan for it.
                </p>
                <p className="flex flex-wrap gap-x-6 gap-y-2">
                  <a href="/articles/international-schools-in-pattaya" onClick={handleLinkClick} className="text-gold-deep underline underline-offset-4 hover:text-ink">
                    Read my schools article
                  </a>
                  <a href="/areas/east-pattaya" onClick={handleLinkClick} className="text-gold-deep underline underline-offset-4 hover:text-ink">
                    Living in East Pattaya
                  </a>
                </p>
              </div>
            </div>
            <div className="lg:col-span-7">
              <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-8">International schools: short answers</h2>
              <div className="divide-y divide-black/10 border-y border-black/10">
                {SCHOOLS_FAQS.map((f) => (
                  <div key={f.q} className="py-6">
                    <h3 className="font-serif text-xl leading-snug mb-2">{f.q}</h3>
                    <p className="text-black/65 font-light leading-relaxed">{f.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="ask" className="max-w-4xl mx-auto scroll-mt-28 p-8 md:p-12 bg-cream border border-cream-line rounded-[2rem]">
            <AskShane source="school_hub" initialTopic="family" context="International schools page" contextNote="I'll know you're asking about schools." />
          </section>

          <div className="p-8 md:p-12 bg-ink rounded-[2rem] grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif text-white mb-2">Get the next article by email</h2>
              <p className="text-white/60 font-light">One short email a week on property, business and life in Pattaya. Free, no spam.</p>
            </div>
            <NewsletterSignup dark source="school_hub" />
          </div>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// One school

function SchoolView({ school }: { school: School }) {
  const faqs = faqsForSchool(school);
  const others = SCHOOLS.filter((s) => s.id !== school.id);
  const runs = RUN_AREAS.map((id) => ({ id, min: school.minutes[id] })).sort((a, b) => a.min - b.min);
  const maxRun = Math.max(...runs.map((r) => r.min));
  const nearest = AREAS.find((a) => a.id === runs[0].id)!;
  const glance: [string, string][] = [
    ["Tuition a year", feeRange(school)],
    ["Curriculum", school.curriculumLabel],
    ["Ages", school.agesLabel],
    ["From Central", `~${school.minutes.central} min`],
  ];

  return (
    <>
      <section className="bg-ink text-white pt-28 md:pt-36 pb-14 md:pb-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <a href={SCHOOLS_PATH} onClick={handleLinkClick} className="block text-[11px] font-medium uppercase tracking-[0.3em] mb-5 text-gold hover:text-white transition-colors">
            International schools in Pattaya
          </a>
          <h1 className="font-serif font-normal text-[2.4rem] sm:text-6xl lg:text-7xl leading-[1.04] tracking-tight mb-5 max-w-5xl">{school.name}</h1>
          <p className="text-lg md:text-xl text-white/65 font-light leading-relaxed max-w-2xl mb-8">{school.tagline}</p>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-5 mb-12">
            <div className="flex items-center gap-3">
              <img src="/images/shane-portrait.webp" alt="" width={44} height={44} className="w-11 h-11 rounded-full object-cover" />
              <span className="text-sm text-white/60">
                By <a href="/about" onClick={handleLinkClick} className="text-white hover:text-gold">Shane Ruddle</a>
                <span className="block text-white/40">Pattaya parent · {FEES_AS_OF} fees</span>
              </span>
            </div>
            <SourceBadge school={school} dark />
          </div>
          <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {glance.map(([label, value]) => (
              <div key={label} className="p-5 rounded-2xl bg-white/[0.05] border border-white/10">
                <dt className="text-[11px] uppercase tracking-[0.18em] text-white/45 mb-2">{label}</dt>
                <dd className="font-serif text-xl md:text-2xl text-gold leading-snug">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="bg-paper px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-5xl mx-auto space-y-16 md:space-y-20">
          <section>
            <Eyebrow>The school</Eyebrow>
            {school.intro.map((p) => (
              <p key={p} className="font-serif text-2xl md:text-[1.9rem] leading-snug text-ink mb-5">{p}</p>
            ))}
            {school.take && (
              <figure className="mt-10 flex gap-5 p-7 md:p-9 bg-white border border-black/[0.08] rounded-[1.5rem]">
                <img src="/images/shane-portrait.webp" alt="" width={56} height={56} loading="lazy" className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover shrink-0 ring-2 ring-gold/60" />
                <div>
                  <blockquote className="text-lg text-black/75 leading-relaxed italic mb-3">"{school.take}"</blockquote>
                  <figcaption className="text-[11px] uppercase tracking-[0.2em] text-gold-deep">Shane's take, as a Pattaya parent</figcaption>
                </div>
              </figure>
            )}
            <ul className="mt-8 grid md:grid-cols-3 gap-3">
              {school.standouts.map((s) => (
                <li key={s} className="flex gap-3 p-5 bg-white border border-black/[0.08] rounded-[1rem] text-black/75 text-[15px] leading-snug">
                  <Check className="w-4 h-4 mt-0.5 text-gold-deep shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </section>

          <section className="p-8 md:p-12 bg-ink text-white rounded-[2rem] grid lg:grid-cols-2 gap-10 lg:gap-14">
            <div>
              <span className="block text-[11px] uppercase tracking-[0.3em] text-gold mb-4">Fees {FEES_AS_OF}</span>
              <h2 className="font-serif text-3xl leading-snug mb-4">What it costs</h2>
              <p className="font-serif text-4xl md:text-5xl text-gold mb-2">{feeRange(school)}</p>
              <p className="text-white/55 mb-6">a year in tuition, youngest to oldest year group ({feeRangeMonthly(school)}).</p>
              <p className="text-white/70 leading-relaxed mb-6">{school.feeNotes}</p>
              <p className="text-white/70 leading-relaxed">
                Most schools bill term by term, so the money goes out in big chunks. Budget for uniforms, trips and the school bus too.
              </p>
              {school.website && (
                <a href={school.website} target="_blank" rel="noopener" className="mt-6 inline-flex items-center gap-1.5 text-sm text-white/70 underline underline-offset-4 hover:text-gold">
                  Check the school's own fee page <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
            <div>
              <span className="block text-[11px] uppercase tracking-[0.3em] text-gold mb-4">School run</span>
              <h2 className="font-serif text-3xl leading-snug mb-2">How far is it?</h2>
              <p className="text-white/55 mb-6">{school.location}.</p>
              <ul className="space-y-3">
                {runs.map((r) => (
                  <li key={r.id}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <a href={`/areas/${areaById(r.id).slug}`} onClick={handleLinkClick} className="text-white/80 hover:text-gold">{areaShort(r.id)}</a>
                      <span className="text-white/60">~{r.min} min</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className={`h-full rounded-full ${r.min <= 20 ? "bg-gold" : r.min <= 35 ? "bg-gold/60" : "bg-white/30"}`} style={{ width: `${Math.max(8, (r.min / maxRun) * 100)}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-xs text-white/40 leading-relaxed">My estimates, one way, outside rush hour. Add 15 to 30 minutes in high season.</p>
            </div>
          </section>

          <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-7 md:p-9 rounded-[1.5rem] border border-gold/40 bg-gold/10">
            <div>
              <span className="block font-serif text-2xl md:text-3xl text-ink mb-1">Living near {school.short}?</span>
              <span className="text-black/60">The closest area is {nearest.name}. Here's what it's like, and what rent costs.</span>
            </div>
            <a
              href={`/areas/${nearest.slug}`}
              onClick={(e) => {
                trackEvent("select_area", { area: nearest.id, source: `school_${school.id}` });
                handleLinkClick(e);
              }}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-ink text-white text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:bg-gold hover:text-ink transition-colors whitespace-nowrap self-start md:self-auto"
            >
              {nearest.name} guide <ArrowRight className="w-4 h-4" />
            </a>
          </section>

          <section>
            <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-8">Short answers</h2>
            <div className="grid md:grid-cols-3 gap-4 md:gap-5">
              {faqs.map((f) => (
                <div key={f.q} className="bg-white border border-black/[0.08] rounded-[1rem] p-6">
                  <h3 className="font-serif text-xl leading-snug text-ink mb-3">{f.q}</h3>
                  <p className="text-black/65 font-light leading-relaxed text-[15px]">{f.a}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="ask" className="scroll-mt-28 p-8 md:p-12 bg-cream border border-cream-line rounded-[2rem]">
            <AskShane
              source={`school_${school.id}`}
              initialTopic="family"
              context={`School page: ${school.name}`}
              contextNote={`I'll know you're asking about ${school.short}.`}
            />
          </section>
        </div>
      </div>

      <section className="bg-ink text-white py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <span className="block text-[11px] font-medium uppercase tracking-[0.3em] text-gold">Other schools around Pattaya</span>
            <a href={SCHOOLS_PATH} onClick={handleLinkClick} className="text-sm text-white/60 hover:text-gold">Compare them all, or take the chooser →</a>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {others.map((s) => (
              <a
                key={s.id}
                href={schoolHref(s)}
                onClick={(e) => {
                  trackEvent("select_school", { school: s.id, source: `school_${school.id}_others` });
                  handleLinkClick(e);
                }}
                className="group p-6 rounded-[1rem] bg-white/[0.04] border border-white/10 hover:border-gold/70 transition-colors"
              >
                <span className="block font-serif text-xl text-white group-hover:text-gold mb-1">{s.name}</span>
                <span className="block text-xs text-white/50">{s.curriculumLabel} · {feeRange(s)}</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

/** /international-schools-pattaya or /international-schools-pattaya/<slug>. */
export default function SchoolsPage({ path }: { path: string }) {
  const slug = path.replace(/\/+$/, "").split("/")[2] || "";
  const school = slug ? schoolBySlug(slug) : undefined;

  useEffect(() => {
    applyPageMeta(school ? { title: school.metaTitle, description: school.description } : SCHOOLS_META);
  }, [school]);

  if (slug && !school) {
    return (
      <div className="min-h-screen bg-paper pt-40 pb-24 px-6 text-center">
        <h1 className="text-4xl font-serif mb-4">School not found</h1>
        <a href={SCHOOLS_PATH} onClick={handleLinkClick} className="text-gold-deep font-bold uppercase tracking-widest text-[11px]">All international schools</a>
      </div>
    );
  }
  return school ? <SchoolView key={school.id} school={school} /> : <SchoolsHub />;
}
