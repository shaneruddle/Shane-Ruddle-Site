import { ReactNode, useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, ArrowUpRight, Check, Link2, RotateCcw, ShieldCheck } from "lucide-react";
import { VisaAnswers, visaAnswersSummary } from "../../lib/visas";
import {
  RULES_AS_OF_DE,
  ThaiVisaDe,
  VISAS_DE,
  VISAS_FAQS_DE,
  VISAS_META_DE,
  VISAS_PATH_DE,
  VISA_QUESTIONS_DE,
  recommendVisaDe,
  visaDeBySlug,
} from "../../lib/de/visas";
import { DE_ARTICLES, deArticleBySlug } from "../../lib/de/site";
import { handleLinkClick } from "../../lib/navigation";
import { trackEvent } from "../../lib/analytics";
import { applyPageMeta } from "../../seo";
import AskShane from "../AskShane";

import Noindex from "../Noindex";
// German visa finder: /de/thailand-visum and /de/thailand-visum/<slug>. Mirrors VisasPage.tsx with German
// copy; the recommendation logic is the English finder's, so both always agree. Analytics events carry language: "de".

const Eyebrow = ({ children }: { children: ReactNode }) => (
  <span className="block text-[11px] font-medium uppercase tracking-[0.3em] mb-5 text-gold-deep">{children}</span>
);

function SourceBadge({ visa, dark = false }: { visa: ThaiVisaDe; dark?: boolean }) {
  return visa.fromShane ? (
    <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] px-2.5 py-1 rounded-full whitespace-nowrap ${dark ? "bg-gold/15 text-gold" : "bg-gold/10 text-gold-deep"}`}>
      <ShieldCheck className="w-3 h-3" /> Aus eigener Erfahrung
    </span>
  ) : (
    <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] px-2.5 py-1 rounded-full whitespace-nowrap ${dark ? "bg-white/10 text-white/70" : "bg-black/[0.05] text-black/55"}`}>
      <AlertTriangle className="w-3 h-3" /> Vor dem Antrag prüfen
    </span>
  );
}

const GLANCE: [keyof ThaiVisaDe["glance"], string][] = [
  ["stay", "Wie lange"],
  ["money", "Nachzuweisendes Geld"],
  ["cost", "Kosten"],
  ["work", "Arbeiten erlaubt?"],
];

function readAnswers(): VisaAnswers {
  if (typeof window === "undefined") return {};
  const q = new URLSearchParams(window.location.search);
  const out: VisaAnswers = {};
  for (const vq of VISA_QUESTIONS_DE) {
    const v = q.get(vq.id);
    if (v && vq.options.some((o) => o.id === v)) out[vq.id] = v;
  }
  return out;
}

const answersQuery = (a: VisaAnswers) =>
  "?" + VISA_QUESTIONS_DE.filter((q) => a[q.id]).map((q) => `${q.id}=${a[q.id]}`).join("&");

// ---------------------------------------------------------------------------------------------
// Finder

function VisaFinderDe({ source }: { source: string }) {
  const [answers, setAnswers] = useState<VisaAnswers>(readAnswers);
  const [step, setStep] = useState(() => {
    const a = readAnswers();
    const firstMissing = VISA_QUESTIONS_DE.findIndex((q) => !a[q.id]);
    return firstMissing === -1 ? VISA_QUESTIONS_DE.length : 0;
  });
  const [asking, setAsking] = useState(false);
  const [copied, setCopied] = useState(false);
  const started = useRef(false);
  const done = step >= VISA_QUESTIONS_DE.length;
  const result = done ? recommendVisaDe(answers) : null;
  const q = VISA_QUESTIONS_DE[step];

  const answer = (id: string) => {
    if (!started.current) {
      started.current = true;
      trackEvent("visa_finder_start", { source, language: "de" });
    }
    const next = { ...answers, [q.id]: id };
    setAnswers(next);
    setStep(step + 1);
    document.getElementById("finder")?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (step + 1 >= VISA_QUESTIONS_DE.length) {
      const r = recommendVisaDe(next);
      trackEvent("visa_finder_complete", { source, language: "de", visa: r.best.id, runner_up: r.runnerUp.id, ...next });
      window.history.replaceState(null, "", `${VISAS_PATH_DE}${answersQuery(next)}`);
    }
  };

  const restart = () => {
    setAnswers({});
    setStep(0);
    setAsking(false);
    window.history.replaceState(null, "", VISAS_PATH_DE);
  };

  const share = async () => {
    const url = `https://shaneruddle.com${VISAS_PATH_DE}${answersQuery(answers)}`;
    trackEvent("share", { method: "copy_link", content_type: "visa_finder", language: "de" });
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title: "Welches Thailand-Visum passt zu mir?", text: `Mein Ergebnis: ${result?.best.name}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* user cancelled */
    }
  };

  if (result) {
    const { best, runnerUp, notes } = result;
    return (
      <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        <div className="lg:col-span-8 bg-white text-ink rounded-[1.75rem] p-7 md:p-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <span className="text-[11px] uppercase tracking-[0.25em] text-gold-deep">Passt am besten</span>
            <SourceBadge visa={best} />
          </div>
          <h3 className="font-serif text-4xl sm:text-5xl md:text-6xl leading-[1.02] mb-3 break-words">{best.name}</h3>
          <p className="text-black/50 mb-6">{best.official}</p>
          <p className="text-lg text-black/75 leading-relaxed mb-7">Es passt, weil {best.fit}.</p>
          <dl className="grid grid-cols-2 gap-3 mb-7">
            {GLANCE.map(([k, label]) => (
              <div key={k} className="p-4 rounded-2xl bg-paper border border-black/[0.06]">
                <dt className="text-[10px] uppercase tracking-[0.2em] text-black/45 mb-1.5">{label}</dt>
                <dd className="text-sm md:text-[15px] text-ink leading-snug">{best.glance[k]}</dd>
              </div>
            ))}
          </dl>
          {notes.length > 0 && (
            <div className="space-y-3 mb-7">
              {notes.map((n) => (
                <div key={n} className="flex gap-3 p-4 rounded-2xl bg-gold/10 border border-gold/30">
                  <img src="/images/shane-portrait.webp" alt="" width={32} height={32} loading="lazy" className="w-8 h-8 rounded-full object-cover shrink-0" />
                  <p className="text-sm text-ink/80 leading-relaxed">{n}</p>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setAsking(true);
                trackEvent("select_content", { content_type: "visa_finder_ask", visa: best.id, language: "de" });
                setTimeout(() => document.getElementById("finder-ask")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
              }}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-gold text-ink text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:bg-ink hover:text-white transition-colors"
            >
              Agentur gesucht? Fragen Sie mich <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href={`${VISAS_PATH_DE}/${best.slug}`}
              onClick={(e) => {
                trackEvent("select_visa", { visa: best.id, source: `${source}_result`, language: "de" });
                handleLinkClick(e);
              }}
              className="inline-flex items-center gap-2 px-6 py-3.5 border border-black/15 text-ink text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:border-gold-deep hover:text-gold-deep transition-colors"
            >
              Voraussetzungen und Ablauf <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <a
            href={`${VISAS_PATH_DE}/${runnerUp.slug}`}
            onClick={(e) => {
              trackEvent("select_visa", { visa: runnerUp.id, source: `${source}_runner_up`, language: "de" });
              handleLinkClick(e);
            }}
            className="group block p-6 rounded-[1.5rem] border border-white/15 bg-white/[0.04] hover:border-gold/70 transition-colors"
          >
            <span className="block text-[11px] uppercase tracking-[0.22em] text-white/50 mb-2">Zweitbeste Wahl</span>
            <span className="block font-serif text-2xl text-white group-hover:text-gold mb-1">{runnerUp.name}</span>
            <span className="block text-sm text-white/55 mb-3">{runnerUp.tagline}</span>
            <span className="text-xs text-white/45">{runnerUp.glance.stay} · {runnerUp.glance.money}</span>
          </a>
          <div className="p-6 rounded-[1.5rem] border border-white/15 text-sm text-white/60 space-y-4">
            <button type="button" onClick={share} className="flex items-center gap-2 text-white hover:text-gold">
              {copied ? <><Check className="w-4 h-4" /> Link kopiert</> : <><Link2 className="w-4 h-4" /> Ergebnis teilen</>}
            </button>
            <button type="button" onClick={restart} className="flex items-center gap-2 hover:text-white">
              <RotateCcw className="w-4 h-4" /> Noch einmal
            </button>
            <p className="text-xs text-white/40 leading-relaxed">
              Ein Ausgangspunkt, keine Rechtsberatung. Regeln Stand {RULES_AS_OF_DE}, und sie ändern sich oft.
            </p>
          </div>
        </div>

        {asking && (
          <div id="finder-ask" className="lg:col-span-12 p-7 md:p-10 bg-cream text-ink border border-cream-line rounded-[1.75rem] scroll-mt-28">
            <AskShane
              lang="de"
              source={`visa_finder_${best.id}`}
              initialTopic="visa"
              context={visaAnswersSummary(answers, result.en)}
              contextNote="Ich sehe Ihre Antworten aus dem Visum-Finder zusammen mit Ihrer Frage."
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 mb-8" aria-hidden>
        {VISA_QUESTIONS_DE.map((vq, i) => (
          <span key={vq.id} className={`h-1 flex-1 rounded-full transition-colors ${i < step ? "bg-gold" : i === step ? "bg-white" : "bg-white/15"}`} />
        ))}
      </div>
      <span className="block text-[11px] uppercase tracking-[0.25em] text-white/45 mb-3">
        Frage {step + 1} von {VISA_QUESTIONS_DE.length}
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
          <ArrowLeft className="w-3.5 h-3.5" /> Zurück
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Hub

function VisasHubDe() {
  return (
    <>
      <section id="finder" className="bg-ink text-white pt-28 md:pt-36 pb-16 md:pb-24 px-6 md:px-12 scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <span className="block text-[11px] font-medium uppercase tracking-[0.3em] mb-5 text-gold">Auswandern nach Pattaya · Visum-Finder</span>
          <h1 className="font-serif font-normal text-[2.6rem] sm:text-6xl lg:text-7xl leading-[1.04] tracking-tight mb-6 max-w-5xl">
            Welches Thailand-Visum <span className="italic text-gold">passt zu Ihnen?</span>
          </h1>
          <p className="text-lg md:text-xl text-white/65 font-light leading-relaxed max-w-2xl mb-8">
            Der größte Visa-Fehler, den ich sehe: Menschen landen bei einem Visum, das nicht zu ihrer Situation passt. Beantworten Sie
            sechs Fragen, und ich zeige Ihnen das richtige Visum, und das, das Sie meiden sollten.
          </p>
          <div className="flex items-center gap-3 mb-12 md:mb-16">
            <img src="/images/shane-portrait.webp" alt="" width={44} height={44} className="w-11 h-11 rounded-full object-cover" />
            <span className="text-sm text-white/60">
              Von <a href="/about" onClick={handleLinkClick} className="text-white hover:text-gold">Shane Ruddle</a>
              <span className="block text-white/40">20 Jahre in Pattaya · Regeln Stand {RULES_AS_OF_DE}</span>
            </span>
          </div>
          <VisaFinderDe source="visa_hub_de" />
        </div>
      </section>

      <div className="bg-paper px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto space-y-16 md:space-y-24">
          <section>
            <Eyebrow>Alle im Vergleich</Eyebrow>
            <h2 className="font-serif text-4xl md:text-5xl leading-tight mb-4">Thailand-Visa auf einen Blick</h2>
            <p className="text-black/60 font-light max-w-2xl mb-10">
              Visa mit dem Hinweis „Aus eigener Erfahrung“ kenne ich aus 20 Jahren hier. Die anderen stammen aus offiziellen Quellen,
              prüfen Sie sie also vor dem Antrag.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {VISAS_DE.map((v) => (
                <a
                  key={v.id}
                  href={`${VISAS_PATH_DE}/${v.slug}`}
                  onClick={(e) => {
                    trackEvent("select_visa", { visa: v.id, source: "visa_hub_de_grid", language: "de" });
                    handleLinkClick(e);
                  }}
                  className="group flex flex-col bg-white border border-black/[0.08] rounded-[1.25rem] p-6 transition-all duration-300 hover:border-gold/60 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/[0.06]"
                >
                  <SourceBadge visa={v} />
                  <h3 className="font-serif text-2xl leading-snug text-ink mt-4 mb-1 group-hover:text-gold-deep transition-colors">{v.name}</h3>
                  <p className="text-sm text-black/55 mb-5">{v.tagline}</p>
                  <dl className="mt-auto space-y-2 text-sm border-t border-black/[0.06] pt-4">
                    {GLANCE.map(([k, label]) => (
                      <div key={k} className="flex flex-col">
                        <dt className="text-[10px] uppercase tracking-[0.18em] text-black/40">{label}</dt>
                        <dd className="text-ink/80">{v.glance[k]}</dd>
                      </div>
                    ))}
                  </dl>
                </a>
              ))}
            </div>
          </section>

          <section className="grid lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-5">
              <Eyebrow>Der teure Fehler</Eyebrow>
              <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-6">Wählen Sie für die nächsten Jahre, nicht nur für jetzt.</h2>
              <div className="space-y-4 text-black/65 font-light leading-relaxed">
                <p>
                  Ein Bekannter von mir hat ein Elite-Visum gekauft, heute heißt es Thailand Privilege. Es hat ihn fast eine Million Baht
                  gekostet. Dann wollte er arbeiten. Es ist kein Arbeitsvisum, und es gab keine Möglichkeit, es umzuwandeln. Er musste es aufgeben.
                </p>
                <p>Heute hat er ein Non-Immigrant-B-Visum mit Arbeitserlaubnis, wie ich.</p>
                <p>
                  <a href={`${DE_ARTICLES}/visum-thailand-erfahrungen`} onClick={handleLinkClick} className="text-gold-deep underline underline-offset-4 hover:text-ink">
                    Meinen ganzen Artikel zum Visum lesen
                  </a>
                </p>
              </div>
            </div>
            <div className="lg:col-span-7">
              <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-8">Visum Thailand: kurze Antworten</h2>
              <div className="divide-y divide-black/10 border-y border-black/10">
                {VISAS_FAQS_DE.map((f) => (
                  <div key={f.q} className="py-6">
                    <h3 className="font-serif text-xl leading-snug mb-2">{f.q}</h3>
                    <p className="text-black/65 font-light leading-relaxed">{f.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="ask" className="max-w-4xl mx-auto scroll-mt-28 p-8 md:p-12 bg-cream border border-cream-line rounded-[2rem]">
            <AskShane lang="de" source="visa_hub_de" initialTopic="visa" context="German visa hub page" contextNote="Ich weiß dann, dass Sie zum Visum fragen." />
          </section>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// One visa

function VisaViewDe({ visa }: { visa: ThaiVisaDe }) {
  const articles = visa.articles.map(deArticleBySlug).filter((a): a is NonNullable<typeof a> => !!a);
  const others = VISAS_DE.filter((v) => v.id !== visa.id);

  return (
    <>
      <section className="bg-ink text-white pt-28 md:pt-36 pb-14 md:pb-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <a href={VISAS_PATH_DE} onClick={handleLinkClick} className="block text-[11px] font-medium uppercase tracking-[0.3em] mb-5 text-gold hover:text-white transition-colors">
            Thailand-Visum · {visa.official}
          </a>
          <h1 className="font-serif font-normal text-[2.6rem] sm:text-6xl lg:text-7xl leading-[1.04] tracking-tight mb-5 max-w-5xl break-words">{visa.name}</h1>
          <p className="text-lg md:text-xl text-white/65 font-light leading-relaxed max-w-2xl mb-8">{visa.tagline}.</p>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-5 mb-12">
            <div className="flex items-center gap-3">
              <img src="/images/shane-portrait.webp" alt="" width={44} height={44} className="w-11 h-11 rounded-full object-cover" />
              <span className="text-sm text-white/60">
                Von <a href="/about" onClick={handleLinkClick} className="text-white hover:text-gold">Shane Ruddle</a>
                <span className="block text-white/40">Regeln Stand {RULES_AS_OF_DE}</span>
              </span>
            </div>
            <SourceBadge visa={visa} dark />
          </div>
          <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {GLANCE.map(([k, label]) => (
              <div key={k} className="p-5 rounded-2xl bg-white/[0.05] border border-white/10">
                <dt className="text-[11px] uppercase tracking-[0.18em] text-white/45 mb-2">{label}</dt>
                <dd className="font-serif text-xl md:text-2xl text-gold leading-snug">{visa.glance[k]}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="bg-paper px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-5xl mx-auto space-y-16 md:space-y-20">
          <section>
            <Eyebrow>Was es ist</Eyebrow>
            {visa.intro.map((p) => (
              <p key={p} className="font-serif text-2xl md:text-[1.9rem] leading-snug text-ink mb-5">{p}</p>
            ))}
            {visa.take && (
              <figure className="mt-10 flex gap-5 p-7 md:p-9 bg-white border border-black/[0.08] rounded-[1.5rem]">
                <img src="/images/shane-portrait.webp" alt="" width={56} height={56} loading="lazy" className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover shrink-0 ring-2 ring-gold/60" />
                <div>
                  <blockquote className="text-lg text-black/75 leading-relaxed italic mb-3">„{visa.take}“</blockquote>
                  <figcaption className="text-[11px] uppercase tracking-[0.2em] text-gold-deep">Shanes Einschätzung</figcaption>
                </div>
              </figure>
            )}
          </section>

          <section className="grid md:grid-cols-2 gap-4 md:gap-5">
            <div className="p-7 md:p-8 bg-white border border-black/[0.08] rounded-[1.25rem]">
              <h2 className="font-serif text-2xl mb-5">Für wen es passt</h2>
              <ul className="space-y-3">
                {visa.suits.map((s) => (
                  <li key={s} className="flex gap-3 text-black/75"><Check className="w-4 h-4 mt-1 text-gold-deep shrink-0" />{s}</li>
                ))}
              </ul>
            </div>
            <div className="p-7 md:p-8 bg-white border border-black/[0.08] rounded-[1.25rem]">
              <h2 className="font-serif text-2xl mb-5">Worauf Sie achten sollten</h2>
              <ul className="space-y-3">
                {visa.watch.map((s) => (
                  <li key={s} className="flex gap-3 text-black/75"><AlertTriangle className="w-4 h-4 mt-1 text-black/35 shrink-0" />{s}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className="p-8 md:p-12 bg-ink text-white rounded-[2rem] grid lg:grid-cols-2 gap-10 lg:gap-14">
            <div>
              <span className="block text-[11px] uppercase tracking-[0.3em] text-gold mb-4">Voraussetzungen</span>
              <h2 className="font-serif text-3xl leading-snug mb-6">Was Sie brauchen</h2>
              <ul className="space-y-4">
                {visa.requirements.map((r) => (
                  <li key={r} className="flex gap-3 text-white/75 leading-relaxed"><Check className="w-4 h-4 mt-1.5 text-gold shrink-0" />{r}</li>
                ))}
              </ul>
            </div>
            <div>
              <span className="block text-[11px] uppercase tracking-[0.3em] text-gold mb-4">Schritt für Schritt</span>
              <h2 className="font-serif text-3xl leading-snug mb-6">So läuft es von Pattaya aus</h2>
              <ol className="space-y-4">
                {visa.steps.map((s, i) => (
                  <li key={s} className="flex gap-4 text-white/75 leading-relaxed">
                    <span className="font-serif text-2xl text-gold/70 leading-none w-6 shrink-0">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
            <p className="lg:col-span-2 text-xs text-white/40 leading-relaxed border-t border-white/10 pt-6">
              Die Visabestimmungen in Thailand ändern sich oft. Sehen Sie dies als Orientierung, nicht als Regelwerk, und prüfen Sie vor dem
              Antrag die aktuellen Anforderungen.
              {visa.officialUrl && (
                <>
                  {" "}
                  <a href={visa.officialUrl.url} target="_blank" rel="noopener" className="text-white/70 underline underline-offset-4 hover:text-gold">
                    {visa.officialUrl.label} <ArrowUpRight className="inline w-3 h-3" />
                  </a>
                </>
              )}
            </p>
          </section>

          <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-7 md:p-9 rounded-[1.5rem] border border-gold/40 bg-gold/10">
            <div>
              <span className="block font-serif text-2xl md:text-3xl text-ink mb-1">Unsicher, ob es das richtige ist?</span>
              <span className="text-black/60">Sechs Fragen, und ich sage Ihnen, welches Visum am besten passt.</span>
            </div>
            <a
              href={VISAS_PATH_DE}
              onClick={(e) => {
                trackEvent("select_content", { content_type: "visa_finder", source: `visa_${visa.id}_de`, language: "de" });
                handleLinkClick(e);
              }}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-ink text-white text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:bg-gold hover:text-ink transition-colors whitespace-nowrap self-start md:self-auto"
            >
              Zum Visum-Finder <ArrowRight className="w-4 h-4" />
            </a>
          </section>

          <section>
            <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-8">Kurze Antworten</h2>
            <div className="grid md:grid-cols-3 gap-4 md:gap-5">
              {visa.faqs.map((f) => (
                <div key={f.q} className="bg-white border border-black/[0.08] rounded-[1rem] p-6">
                  <h3 className="font-serif text-xl leading-snug text-ink mb-3">{f.q}</h3>
                  <p className="text-black/65 font-light leading-relaxed text-[15px]">{f.a}</p>
                </div>
              ))}
            </div>
          </section>

          {articles.length > 0 && (
            <section>
              <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-8">Weiterlesen</h2>
              <div className="grid sm:grid-cols-2 gap-4 md:gap-5">
                {articles.map((a) => (
                  <a
                    key={a.slug}
                    href={`${DE_ARTICLES}/${a.slug}`}
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
              lang="de"
              source={`visa_${visa.id}_de`}
              initialTopic={visa.askTopic === "retiring" || visa.askTopic === "business" || visa.askTopic === "family" ? visa.askTopic : "visa"}
              context={`German visa page: ${visa.id}`}
              contextNote="Ich weiß dann, zu welchem Visum Sie fragen."
            />
          </section>
        </div>
      </div>

      <section className="bg-ink text-white py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <span className="block text-[11px] font-medium uppercase tracking-[0.3em] text-gold">Weitere Thailand-Visa</span>
            <a href={VISAS_PATH_DE} onClick={handleLinkClick} className="text-sm text-white/60 hover:text-gold">Alle vergleichen →</a>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {others.map((v) => (
              <a
                key={v.id}
                href={`${VISAS_PATH_DE}/${v.slug}`}
                onClick={(e) => {
                  trackEvent("select_visa", { visa: v.id, source: `visa_${visa.id}_de_others`, language: "de" });
                  handleLinkClick(e);
                }}
                className="group p-6 rounded-[1rem] bg-white/[0.04] border border-white/10 hover:border-gold/70 transition-colors"
              >
                <span className="block font-serif text-2xl text-white group-hover:text-gold mb-1">{v.name}</span>
                <span className="block text-xs text-white/50">{v.tagline}</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

/** /de/thailand-visum or /de/thailand-visum/<slug>. */
export default function DeVisas({ path }: { path: string }) {
  const slug = path.replace(/\/+$/, "").split("/")[3] || "";
  const visa = slug ? visaDeBySlug(slug) : undefined;

  useEffect(() => {
    applyPageMeta(visa ? { title: visa.metaTitle, description: visa.description } : VISAS_META_DE);
  }, [visa]);

  if (slug && !visa) {
    return (
      <div className="min-h-screen bg-paper pt-40 pb-24 px-6 text-center">
        <Noindex />
        <h1 className="text-4xl font-serif mb-4">Visum nicht gefunden</h1>
        <a href={VISAS_PATH_DE} onClick={handleLinkClick} className="text-gold-deep font-bold uppercase tracking-widest text-[11px]">Alle Thailand-Visa</a>
      </div>
    );
  }
  return visa ? <VisaViewDe key={visa.id} visa={visa} /> : <VisasHubDe />;
}
