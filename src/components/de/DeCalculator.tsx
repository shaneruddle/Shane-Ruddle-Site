import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Check, Link2, Minus, Plus } from "lucide-react";
import {
  AREAS,
  CostInputs,
  DEFAULT_INPUTS,
  FOODS,
  HEALTHS,
  HOMES,
  HOUSEHOLDS,
  RATES_AS_OF,
  SCHOOLS,
  TRANSPORTS,
  calculate,
  formatBaht,
  inputsFromQuery,
  inputsToQuery,
  verdict,
} from "../../lib/costOfLiving";
import { DE_ARTICLES, DE_CALCULATOR, DE_MOVING, bahtDe } from "../../lib/de/site";
import { handleLinkClick } from "../../lib/navigation";
import { trackEvent } from "../../lib/analytics";
import AskShane from "../AskShane";

// German cost of living calculator (/de/lebenshaltungskosten-rechner). Same figures and maths as
// CostCalculator.tsx (calculate() from costOfLiving.ts); German labels, and euro / Swiss franc / baht.

const ECRE_URL = "https://www.thaiproperty.com/?utm_source=shaneruddle.com&utm_medium=referral&utm_campaign=cost_calculator_de";
const BAR_COLOURS = ["#D4AF37", "#B8860B", "#8A6D0B", "#E9D27A", "#5C4A10", "#C9B26B", "#3A3A3A"];

type CurDe = "EUR" | "CHF" | "THB";
// Approximate baht per unit. EUR matches costOfLiving.ts; CHF is an estimate for the same period.
const CURRENCIES_DE: { id: CurDe; perUnit: number }[] = [
  { id: "EUR", perUnit: 38.1 },
  { id: "CHF", perUnit: 40.8 },
  { id: "THB", perUnit: 1 },
];
const RATES_AS_OF_DE = RATES_AS_OF; // month names are the same in German for the current value

function money(baht: number, cur: CurDe) {
  if (cur === "THB") return bahtDe(Math.round(baht / 100) * 100);
  const c = CURRENCIES_DE.find((x) => x.id === cur)!;
  const v = Math.round(baht / c.perUnit / 10) * 10;
  return cur === "EUR" ? `${v.toLocaleString("de-DE")} €` : `CHF ${v.toLocaleString("de-CH")}`;
}

const L: Record<string, string> = {
  single: "Nur ich",
  couple: "Ein Paar",
  central: "Central Pattaya",
  jomtien: "Jomtien",
  pratumnak: "Pratumnak",
  wongamat: "Wongamat / Naklua",
  east: "East Pattaya",
  condo1: "Condo, 1 Schlafzimmer",
  condo2: "Condo, 2 Schlafzimmer",
  house: "Haus ohne Pool",
  housePool: "Haus mit Pool",
  out: "Jede Mahlzeit auswärts",
  mix: "Gemischt",
  cook: "Meist selbst kochen",
  grab: "Grab und Baht-Busse",
  bikeRent: "Motorrad mieten",
  bikeOwn: "Eigenes Motorrad",
  carRent: "Langzeit-Mietwagen",
  carOwn: "Eigenes Auto",
  none: "Keine internationale Schule",
  lower: "Internationale Schule, günstiger",
  top: "Internationale Schule, Spitzenklasse",
  insured: "Versicherung (unter 50)",
  insured50: "Versicherung (ab 50)",
  payg: "Selbst zahlen",
};
const HINTS: Record<string, string> = {
  central: "Mitten im Geschehen, kleinere Wohnungen",
  jomtien: "Strand, ältere Gebäude, mehr Platz fürs Geld",
  pratumnak: "Ruhiger Hügel zwischen Stadt und Jomtien",
  wongamat: "Neuere Hochhäuser, eine der teureren Gegenden",
  east: "Häuser, Schulen, hier wohnen die meisten Familien",
};
const LINE_DE: Record<string, string> = {
  rent: "Miete",
  food: "Essen und Trinken",
  transport: "Fortbewegung",
  bills: "Strom, Wasser, Handy und Internet",
  health: "Gesundheit",
  school: "Schulgebühren",
  life: "Ausgehen, Fitness und Sport",
};
const VERDICT_DE: Record<string, string> = {
  "That's a very comfortable family life here, and the school fees are doing most of the heavy lifting.":
    "Damit führen Sie hier ein sehr angenehmes Familienleben, und die Schulgebühren machen den größten Teil aus.",
  "That's a realistic family budget. The big swing is schooling, so visit the schools before you decide.":
    "Das ist ein realistisches Familienbudget. Der große Unterschied ist die Schule, besuchen Sie also die Schulen, bevor Sie sich entscheiden.",
  "That's a lean budget. It's doable, but you'll be cooking and watching what you spend.":
    "Das ist ein knappes Budget. Machbar, aber Sie werden selbst kochen und auf Ihre Ausgaben achten.",
  "That's about what I'd tell a friend they need to live comfortably here, going out once a week.":
    "Das ist ungefähr das, was ich einem Freund sagen würde, um hier gut zu leben, mit einmal Ausgehen pro Woche.",
  "That's a very comfortable life in Pattaya. You won't be going without much.":
    "Damit leben Sie in Pattaya sehr angenehm. Auf viel verzichten müssen Sie nicht.",
};

const FAQS_DE: { q: string; a: string; href?: string }[] = [
  {
    q: "Wie viel Geld braucht man im Monat, um in Pattaya zu leben?",
    a: "Stand 2026 lebt eine alleinstehende Person mit etwa ฿50.000 bis ฿60.000 im Monat gut (rund 1.300 bis 1.600 €), ein Paar mit ฿70.000 bis ฿80.000, mit einmal Ausgehen pro Woche statt jeden Abend.",
    href: `${DE_ARTICLES}/leben-in-pattaya`,
  },
  {
    q: "Was kostet eine Wohnung in Pattaya?",
    a: "Planen Sie rund ฿18.000 bis ฿20.000 im Monat für ein Condo mit einem Schlafzimmer und 30 bis 45 Quadratmetern ein. Das ist der historische Durchschnitt bei East Coast Real Estate und Alan Bolton Property Consultants.",
    href: `${DE_ARTICLES}/wohnung-mieten-pattaya`,
  },
  {
    q: "Was kostet Essen in Pattaya?",
    a: "Eine Mahlzeit auswärts kostet ein paar hundert Baht, mit Getränk etwa ฿300. Jede Mahlzeit auswärts kommt für eine Person auf rund ฿30.000 im Monat, deutlich weniger, wenn Sie zum Teil selbst kochen.",
    href: `${DE_ARTICLES}/ist-pattaya-teuer`,
  },
  {
    q: "Was kostet eine Familie in Pattaya?",
    a: "Der große Kostenpunkt ist die Schule. Rechnen Sie mit rund ฿30.000 im Monat pro Kind an den günstigeren internationalen Schulen, und bis zu ฿100.000 an den teuersten.",
  },
  {
    q: "Ist Pattaya teuer?",
    a: "Nein. Es ist teurer als viele andere Orte in Thailand und günstiger als Phuket, aber verglichen mit fast jedem anderen lebenswerten Ort der Welt überhaupt nicht teuer.",
    href: `${DE_ARTICLES}/ist-pattaya-teuer`,
  },
];
export { FAQS_DE as CALCULATOR_FAQS_DE };

function Chips<T extends string>({ label, options, value, onChange }: { label: string; options: { id: T }[]; value: T; onChange: (v: T) => void }) {
  const hint = HINTS[value];
  return (
    <fieldset>
      <legend className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-deep mb-3">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = o.id === value;
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(o.id)}
              className={`px-4 py-2.5 rounded-full border text-sm transition-colors ${on ? "bg-ink text-white border-ink" : "bg-white border-black/15 text-ink hover:border-gold-deep hover:text-gold-deep"}`}
            >
              {L[o.id] ?? o.id}
            </button>
          );
        })}
      </div>
      {hint && options.some((o) => o.id === value) && <p className="mt-2 text-xs text-black/45">{hint}</p>}
    </fieldset>
  );
}

const readCur = (): CurDe => {
  if (typeof window === "undefined") return "EUR";
  const w = new URLSearchParams(window.location.search).get("waehrung");
  return w === "CHF" || w === "THB" ? w : "EUR";
};

export default function DeCalculator() {
  const [inputs, setInputs] = useState<CostInputs>(() =>
    typeof window === "undefined" ? DEFAULT_INPUTS : { ...inputsFromQuery(window.location.search), currency: DEFAULT_INPUTS.currency }
  );
  const [cur, setCur] = useState<CurDe>(readCur);
  const [copied, setCopied] = useState(false);
  const [resultInView, setResultInView] = useState(false);
  const touched = useRef(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const { lines, total, adults, kids } = useMemo(() => calculate(inputs), [inputs]);
  const rent = lines.find((l) => l.id === "rent")?.amount ?? 0;

  const query = () => {
    const q = inputsToQuery(inputs);
    const w = cur === "EUR" ? "" : `waehrung=${cur}`;
    return q ? `${q}${w ? `&${w}` : ""}` : w ? `?${w}` : "";
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = `${DE_CALCULATOR}${query()}`;
    if (window.location.pathname + window.location.search !== url) window.history.replaceState(null, "", url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputs, cur]);

  useEffect(() => {
    const el = resultRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setResultInView(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const markTouched = () => {
    if (!touched.current) {
      touched.current = true;
      trackEvent("calculator_start", { calculator: "cost_of_living", language: "de" });
    }
  };
  const set = <K extends keyof CostInputs>(key: K, value: CostInputs[K]) => {
    markTouched();
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  // Sent to Shane in English, with the same wording as the English calculator.
  const summary = useMemo(() => {
    const who = `${adults === 1 ? "single" : "couple"}${kids ? ` + ${kids} ${kids === 1 ? "child" : "children"}` : ""}`;
    const pick = <T extends string>(opts: { id: T; label: string }[], v: T) => opts.find((o) => o.id === v)?.label;
    return [
      `German calculator result: ${formatBaht(total)} a month (${money(total, cur === "THB" ? "EUR" : cur)})`,
      `${who} · ${pick(AREAS, inputs.area)} · ${pick(HOMES, inputs.home)} · ${pick(FOODS, inputs.food)} · ${pick(TRANSPORTS, inputs.transport)}`,
      ...lines.map((l) => `${l.label}: ${formatBaht(l.amount)}`),
    ].join("\n");
  }, [adults, kids, total, cur, inputs, lines]);

  const share = async () => {
    const url = `https://shaneruddle.com${DE_CALCULATOR}${query()}`;
    trackEvent("share", { method: "copy_link", content_type: "cost_calculator", language: "de" });
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title: "Meine Lebenshaltungskosten in Pattaya", text: `${money(total, cur)} im Monat in Pattaya`, url });
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
    <div className="bg-paper text-ink">
      <section className="bg-ink text-white pt-28 md:pt-36 pb-14 md:pb-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <a href={DE_MOVING} onClick={handleLinkClick} className="block text-[11px] font-medium uppercase tracking-[0.3em] mb-5 text-gold hover:text-white transition-colors">
            Auswandern nach Pattaya · Rechner
          </a>
          <h1 className="font-serif font-normal text-[2.6rem] sm:text-6xl lg:text-7xl leading-[1.04] tracking-tight mb-6 max-w-5xl">
            Was kostet das Leben in Thailand, <span className="italic text-gold">für Sie?</span>
          </h1>
          <p className="text-lg md:text-xl text-white/65 font-light leading-relaxed max-w-2xl mb-8">
            Wählen Sie, wie Sie in Pattaya leben würden, und erhalten Sie Ihr Monatsbudget in Euro, Franken oder Baht. Die Zahlen sind
            meine eigenen, aus 20 Jahren vor Ort und aus den Mieten, die unsere Maklerbüros jede Woche sehen.
          </p>
          <div className="flex items-center gap-3">
            <img src="/images/shane-portrait.webp" alt="" width={44} height={44} className="w-11 h-11 rounded-full object-cover" />
            <span className="text-sm text-white/60">
              Von <a href="/about" onClick={handleLinkClick} className="text-white hover:text-gold">Shane Ruddle</a>
              <span className="block text-white/40">Zahlen 2026 · kostenlos, ohne Anmeldung</span>
            </span>
          </div>
        </div>
      </section>

      <section className="px-6 md:px-12 py-14 md:py-20">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-10 lg:gap-14">
          <div className="lg:col-span-7 space-y-9">
            <Chips label="Wer zieht um?" options={HOUSEHOLDS} value={inputs.household} onChange={(v) => set("household", v)} />
            <fieldset>
              <legend className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-deep mb-3">Kinder</legend>
              <div className="flex items-center gap-4">
                <button type="button" aria-label="Weniger Kinder" onClick={() => set("kids", Math.max(0, inputs.kids - 1))} className="w-11 h-11 rounded-full border border-black/15 bg-white flex items-center justify-center hover:border-gold-deep disabled:opacity-30" disabled={inputs.kids === 0}>
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-serif text-3xl w-8 text-center" aria-live="polite">{inputs.kids}</span>
                <button type="button" aria-label="Mehr Kinder" onClick={() => set("kids", Math.min(4, inputs.kids + 1))} className="w-11 h-11 rounded-full border border-black/15 bg-white flex items-center justify-center hover:border-gold-deep disabled:opacity-30" disabled={inputs.kids === 4}>
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </fieldset>
            {inputs.kids > 0 && <Chips label="Schule" options={SCHOOLS} value={inputs.school} onChange={(v) => set("school", v)} />}
            <Chips label="Wo?" options={AREAS} value={inputs.area} onChange={(v) => set("area", v)} />
            <Chips label="Wohnung" options={HOMES} value={inputs.home} onChange={(v) => set("home", v)} />
            <Chips label="Essen" options={FOODS} value={inputs.food} onChange={(v) => set("food", v)} />
            <Chips label="Fortbewegung" options={TRANSPORTS} value={inputs.transport} onChange={(v) => set("transport", v)} />
            <Chips label="Gesundheit" options={HEALTHS} value={inputs.health} onChange={(v) => set("health", v)} />
            <label className="flex items-center gap-3 text-sm text-black/70 cursor-pointer">
              <input type="checkbox" checked={inputs.goingOut} onChange={(e) => set("goingOut", e.target.checked)} className="w-4 h-4 accent-[#D4AF37]" />
              Einmal pro Woche ausgehen (Bars, Restaurants, eine Show)
            </label>
          </div>

          <div className="lg:col-span-5" ref={resultRef} id="result">
            <div className="lg:sticky lg:top-28 bg-ink text-white rounded-[2rem] p-7 md:p-9 scroll-mt-24">
              <div className="flex flex-wrap gap-1.5 mb-6" role="group" aria-label="Währung">
                {CURRENCIES_DE.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={cur === c.id}
                    onClick={() => { markTouched(); setCur(c.id); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-colors ${cur === c.id ? "bg-gold text-ink" : "text-white/55 hover:text-white"}`}
                  >
                    {c.id}
                  </button>
                ))}
              </div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/50 mb-2">Ihr Monatsbudget</p>
              <p className="font-serif text-5xl sm:text-6xl md:text-7xl leading-none text-gold mb-2 break-words" aria-live="polite">{money(total, cur)}</p>
              {cur !== "THB" ? <p className="text-white/55 mb-6">{bahtDe(total)} im Monat</p> : <div className="mb-6" />}

              <div className="flex h-3 rounded-full overflow-hidden mb-5" aria-hidden>
                {lines.map((l, i) => (
                  <span key={l.id} style={{ width: `${(l.amount / total) * 100}%`, background: BAR_COLOURS[i % BAR_COLOURS.length] }} />
                ))}
              </div>
              <ul className="space-y-2.5 text-sm mb-7">
                {lines.map((l, i) => (
                  <li key={l.id} className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-2.5 text-white/70">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: BAR_COLOURS[i % BAR_COLOURS.length] }} />
                      {LINE_DE[l.id] ?? l.label}
                    </span>
                    <span className="tabular-nums">{money(l.amount, cur)}</span>
                  </li>
                ))}
              </ul>

              <div className="flex gap-3 items-start border-t border-white/10 pt-6 mb-7">
                <img src="/images/shane-portrait.webp" alt="" width={36} height={36} loading="lazy" className="w-9 h-9 rounded-full object-cover shrink-0" />
                <p className="text-sm text-white/75 leading-relaxed italic">„{VERDICT_DE[verdict(total, adults, kids)] ?? verdict(total, adults, kids)}“</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <a
                  href={ECRE_URL}
                  target="_blank"
                  rel="noopener"
                  onClick={() => trackEvent("select_promotion", { promotion_name: "ecre_rentals", creative_slot: "cost_calculator_de", value: rent })}
                  className="inline-flex items-center justify-center gap-2 bg-gold text-ink font-semibold px-5 py-3.5 rounded-full text-[11px] uppercase tracking-[0.16em] hover:bg-white transition-colors"
                >
                  Wohnungen um {bahtDe(rent)} <ArrowUpRight className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={share}
                  className="inline-flex items-center justify-center gap-2 border border-white/25 text-white font-semibold px-5 py-3.5 rounded-full text-[11px] uppercase tracking-[0.16em] hover:border-gold hover:text-gold transition-colors"
                >
                  {copied ? <><Check className="w-4 h-4" /> Link kopiert</> : <><Link2 className="w-4 h-4" /> Ergebnis teilen</>}
                </button>
              </div>
              <a href="#ask" onClick={(e) => { e.preventDefault(); document.getElementById("ask")?.scrollIntoView({ behavior: "smooth" }); }} className="mt-5 inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-gold transition-colors">
                Unsicher bei einer Zahl? Fragen Sie mich zu Ihrem Budget <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <p className="mt-5 text-[11px] text-white/35 leading-relaxed">
                Eine Orientierung, kein Angebot. Ungefähre Wechselkurse, Stand {RATES_AS_OF_DE}.
              </p>
            </div>
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
        aria-hidden={resultInView}
        tabIndex={resultInView ? -1 : 0}
        className={`lg:hidden fixed bottom-4 transition-all duration-300 ${resultInView ? "opacity-0 translate-y-4 pointer-events-none" : "opacity-100"} left-4 right-20 z-40 flex items-center justify-between bg-ink text-white rounded-full pl-6 pr-4 py-3 shadow-2xl shadow-black/30`}
      >
        <span className="text-[11px] uppercase tracking-[0.18em] text-white/60">Pro Monat</span>
        <span className="flex items-center gap-2 font-serif text-2xl text-gold">{money(total, cur)} <ArrowRight className="w-4 h-4 text-white/60" /></span>
      </button>

      <section className="px-6 md:px-12 pb-16 md:pb-24">
        <div id="ask" className="max-w-4xl mx-auto p-8 md:p-12 bg-cream border border-cream-line rounded-[2rem] scroll-mt-24">
          <AskShane lang="de" key={kids ? "family" : "renting"} source="cost_calculator_de" initialTopic={kids ? "family" : "renting"} context={summary} />
        </div>
      </section>

      <section className="bg-white border-t border-black/10 px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-5">
            <span className="block text-[11px] font-medium uppercase tracking-[0.3em] mb-5 text-gold-deep">So habe ich gerechnet</span>
            <h2 className="font-serif text-4xl md:text-5xl leading-tight mb-6">Echte Zahlen, kein Landesdurchschnitt.</h2>
            <div className="space-y-4 text-black/65 font-light leading-relaxed">
              <p>
                Die Mieten stammen aus dem, was East Coast Real Estate und Alan Bolton Property Consultants in jeder Gegend tatsächlich
                vermieten. Unser historischer Durchschnitt für ein Condo mit einem Schlafzimmer liegt bei knapp über ฿18.000 im Monat.
              </p>
              <p>
                Essen, Fortbewegung, Nebenkosten und Gesundheit sind das, was ich einem Freund zu planen raten würde, aus 20 Jahren vor
                Ort und als Betreiber von Restaurants, Bars und einer Autovermietung. Schulgebühren sind Monatsdurchschnitte der Jahresgebühren.
              </p>
              <p>
                Alles sind Monatswerte für 2026, ohne einmalige Kosten wie Kaution, Flüge, Autokauf oder Visagebühren. Dafür lesen Sie
                meinen Ratgeber <a href={DE_MOVING} onClick={handleLinkClick} className="text-gold-deep underline underline-offset-4 hover:text-ink">Auswandern nach Pattaya</a>.
              </p>
            </div>
          </div>
          <div className="lg:col-span-7">
            <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-8">Lebenshaltungskosten in Pattaya: kurze Antworten</h2>
            <div className="divide-y divide-black/10 border-y border-black/10">
              {FAQS_DE.map((f) => (
                <div key={f.q} className="py-6">
                  <h3 className="font-serif text-xl leading-snug mb-2">{f.q}</h3>
                  <p className="text-black/65 font-light leading-relaxed">{f.a}</p>
                  {f.href && (
                    <a href={f.href} onClick={handleLinkClick} className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium tracking-wide text-gold-deep hover:text-ink transition-colors">
                      Mehr dazu <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
