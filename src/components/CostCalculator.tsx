import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Check, Link2, Minus, Plus } from "lucide-react";
import {
  AREAS,
  CALCULATOR_FAQS,
  CALCULATOR_PATH,
  CURRENCIES,
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
  formatMoney,
  inputsFromQuery,
  inputsToQuery,
  verdict,
} from "../lib/costOfLiving";
import { handleLinkClick } from "../lib/navigation";
import { trackEvent } from "../lib/analytics";
import AskShane from "./AskShane";
import EmailMyResult from "./EmailMyResult";

// /cost-of-living-calculator: interactive monthly budget for living in Pattaya. Shared by the
// build-time prerender (default inputs) and the live app (inputs read from the URL, so results can be shared).

const ECRE_URL = "https://www.thaiproperty.com/?utm_source=shaneruddle.com&utm_medium=referral&utm_campaign=cost_calculator";
const BAR_COLOURS = ["#D4AF37", "#B8860B", "#8A6D0B", "#E9D27A", "#5C4A10", "#C9B26B", "#3A3A3A"];

function Chips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: T; label: string; hint?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const hint = options.find((o) => o.id === value)?.hint;
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
              className={`px-4 py-2.5 rounded-full border text-sm transition-colors ${
                on ? "bg-ink text-white border-ink" : "bg-white border-black/15 text-ink hover:border-gold-deep hover:text-gold-deep"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {hint && <p className="mt-2 text-xs text-black/45">{hint}</p>}
    </fieldset>
  );
}

export default function CostCalculator() {
  const [inputs, setInputs] = useState<CostInputs>(() =>
    typeof window === "undefined" ? DEFAULT_INPUTS : inputsFromQuery(window.location.search)
  );
  const [copied, setCopied] = useState(false);
  const [resultInView, setResultInView] = useState(false);
  const touched = useRef(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const { lines, total, adults, kids } = useMemo(() => calculate(inputs), [inputs]);
  const rent = lines.find((l) => l.id === "rent")?.amount ?? 0;
  const cur = inputs.currency;

  // Keep the URL in step so the result can be shared. replaceState doesn't fire popstate.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = `${CALCULATOR_PATH}${inputsToQuery(inputs)}`;
    if (window.location.pathname + window.location.search !== url) window.history.replaceState(null, "", url);
  }, [inputs]);

  // Hide the mobile total bar while the full result card is on screen.
  useEffect(() => {
    const el = resultRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setResultInView(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const set = <K extends keyof CostInputs>(key: K, value: CostInputs[K]) => {
    if (!touched.current) {
      touched.current = true;
      trackEvent("calculator_start", { calculator: "cost_of_living" });
    }
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const summary = useMemo(() => {
    const who = `${adults === 1 ? "single" : "couple"}${kids ? ` + ${kids} ${kids === 1 ? "child" : "children"}` : ""}`;
    const pick = <T extends string>(opts: { id: T; label: string }[], v: T) => opts.find((o) => o.id === v)?.label;
    return [
      `Calculator result: ${formatBaht(total)} a month (${formatMoney(total, cur === "THB" ? "GBP" : cur)})`,
      `${who} · ${pick(AREAS, inputs.area)} · ${pick(HOMES, inputs.home)} · ${pick(FOODS, inputs.food)} · ${pick(TRANSPORTS, inputs.transport)}`,
      ...lines.map((l) => `${l.label}: ${formatBaht(l.amount)}`),
    ].join("\n");
  }, [adults, kids, total, cur, inputs, lines]);

  const share = async () => {
    const url = `https://shaneruddle.com${CALCULATOR_PATH}${inputsToQuery(inputs)}`;
    trackEvent("share", { method: "copy_link", content_type: "cost_calculator" });
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title: "My Pattaya cost of living", text: `${formatMoney(total, cur)} a month in Pattaya`, url });
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
      {/* Hero */}
      <section className="bg-ink text-white pt-28 md:pt-36 pb-14 md:pb-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <a href="/guides/moving-to-pattaya" onClick={handleLinkClick} className="block text-[11px] font-medium uppercase tracking-[0.3em] mb-5 text-gold hover:text-white transition-colors">
            Moving to Pattaya · Calculator
          </a>
          <h1 className="font-serif font-normal text-[2.6rem] sm:text-6xl lg:text-7xl leading-[1.04] tracking-tight mb-6 max-w-5xl">
            What would it cost <span className="italic text-gold">you</span> to live in Pattaya?
          </h1>
          <p className="text-lg md:text-xl text-white/65 font-light leading-relaxed max-w-2xl mb-8">
            Pick how you'd live and get a monthly budget in baht, pounds, dollars, euros, Australian dollars or roubles. The
            figures are mine, from 20 years of living here and from what our agencies see in rents every week.
          </p>
          <div className="flex items-center gap-3">
            <img src="/images/shane-portrait.webp" alt="" width={44} height={44} className="w-11 h-11 rounded-full object-cover" />
            <span className="text-sm text-white/60">
              By <a href="/about" onClick={handleLinkClick} className="text-white hover:text-gold">Shane Ruddle</a>
              <span className="block text-white/40">2026 figures · free, no sign-up</span>
            </span>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="px-6 md:px-12 py-14 md:py-20">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-10 lg:gap-14">
          <div className="lg:col-span-7 space-y-9">
            <Chips label="Who's moving?" options={HOUSEHOLDS} value={inputs.household} onChange={(v) => set("household", v)} />
            <fieldset>
              <legend className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-deep mb-3">Children</legend>
              <div className="flex items-center gap-4">
                <button type="button" aria-label="Fewer children" onClick={() => set("kids", Math.max(0, inputs.kids - 1))} className="w-11 h-11 rounded-full border border-black/15 bg-white flex items-center justify-center hover:border-gold-deep disabled:opacity-30" disabled={inputs.kids === 0}>
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-serif text-3xl w-8 text-center" aria-live="polite">{inputs.kids}</span>
                <button type="button" aria-label="More children" onClick={() => set("kids", Math.min(4, inputs.kids + 1))} className="w-11 h-11 rounded-full border border-black/15 bg-white flex items-center justify-center hover:border-gold-deep disabled:opacity-30" disabled={inputs.kids === 4}>
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </fieldset>
            {inputs.kids > 0 && <Chips label="School" options={SCHOOLS} value={inputs.school} onChange={(v) => set("school", v)} />}
            <Chips label="Where?" options={AREAS} value={inputs.area} onChange={(v) => set("area", v)} />
            <Chips label="Home" options={HOMES} value={inputs.home} onChange={(v) => set("home", v)} />
            <Chips label="Food" options={FOODS} value={inputs.food} onChange={(v) => set("food", v)} />
            <Chips label="Getting around" options={TRANSPORTS} value={inputs.transport} onChange={(v) => set("transport", v)} />
            <Chips label="Healthcare" options={HEALTHS} value={inputs.health} onChange={(v) => set("health", v)} />
            <label className="flex items-center gap-3 text-sm text-black/70 cursor-pointer">
              <input type="checkbox" checked={inputs.goingOut} onChange={(e) => set("goingOut", e.target.checked)} className="w-4 h-4 accent-[#D4AF37]" />
              Going out once a week (bars, restaurants, a show)
            </label>
          </div>

          {/* Result */}
          <div className="lg:col-span-5" ref={resultRef} id="result">
            <div className="lg:sticky lg:top-28 bg-ink text-white rounded-[2rem] p-7 md:p-9 scroll-mt-24">
              <div className="flex flex-wrap gap-1.5 mb-6" role="group" aria-label="Currency">
                {CURRENCIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={cur === c.id}
                    onClick={() => set("currency", c.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-colors ${cur === c.id ? "bg-gold text-ink" : "text-white/55 hover:text-white"}`}
                  >
                    {c.id}
                  </button>
                ))}
              </div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/50 mb-2">Your monthly budget</p>
              <p className="font-serif text-5xl sm:text-6xl md:text-7xl leading-none text-gold mb-2 break-words" aria-live="polite">{formatMoney(total, cur)}</p>
              {cur !== "THB" && <p className="text-white/55 mb-6">{formatBaht(total)} a month</p>}
              {cur === "THB" && <div className="mb-6" />}

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
                      {l.label}
                    </span>
                    <span className="tabular-nums">{formatMoney(l.amount, cur)}</span>
                  </li>
                ))}
              </ul>

              <div className="flex gap-3 items-start border-t border-white/10 pt-6 mb-7">
                <img src="/images/shane-portrait.webp" alt="" width={36} height={36} loading="lazy" className="w-9 h-9 rounded-full object-cover shrink-0" />
                <p className="text-sm text-white/75 leading-relaxed italic">"{verdict(total, adults, kids)}"</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <a
                  href={ECRE_URL}
                  target="_blank"
                  rel="noopener"
                  onClick={() => trackEvent("select_promotion", { promotion_name: "ecre_rentals", creative_slot: "cost_calculator", value: rent })}
                  className="inline-flex items-center justify-center gap-2 bg-gold text-ink font-semibold px-5 py-3.5 rounded-full text-[11px] uppercase tracking-[0.16em] hover:bg-white transition-colors"
                >
                  Rentals near {formatBaht(rent)} <ArrowUpRight className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={share}
                  className="inline-flex items-center justify-center gap-2 border border-white/25 text-white font-semibold px-5 py-3.5 rounded-full text-[11px] uppercase tracking-[0.16em] hover:border-gold hover:text-gold transition-colors"
                >
                  {copied ? <><Check className="w-4 h-4" /> Link copied</> : <><Link2 className="w-4 h-4" /> Share my result</>}
                </button>
              </div>
              <a href="#ask" onClick={(e) => { e.preventDefault(); document.getElementById("ask")?.scrollIntoView({ behavior: "smooth" }); }} className="mt-5 inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-gold transition-colors">
                Not sure about a number? Ask me about your budget <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <p className="mt-5 text-[11px] text-white/35 leading-relaxed">
                A guide, not a quote. Approximate exchange rates from {RATES_AS_OF}.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile: total always in view while choosing */}
      <button
        type="button"
        onClick={() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
        aria-hidden={resultInView}
        tabIndex={resultInView ? -1 : 0}
        className={`lg:hidden fixed bottom-4 transition-all duration-300 ${resultInView ? "opacity-0 translate-y-4 pointer-events-none" : "opacity-100"} left-4 right-20 z-40 flex items-center justify-between bg-ink text-white rounded-full pl-6 pr-4 py-3 shadow-2xl shadow-black/30`}
      >
        <span className="text-[11px] uppercase tracking-[0.18em] text-white/60">Per month</span>
        <span className="flex items-center gap-2 font-serif text-2xl text-gold">{formatMoney(total, cur)} <ArrowRight className="w-4 h-4 text-white/60" /></span>
      </button>

      {/* Email the result (lead capture right after the value) */}
      <section className="px-6 md:px-12 pb-10 md:pb-12">
        <div className="max-w-4xl mx-auto">
          <EmailMyResult
            tool="cost_calculator"
            segment="moving"
            title="Pattaya budget"
            summary={summary.replace("Calculator result: ", "Your monthly budget: ")}
            link={`https://shaneruddle.com${CALCULATOR_PATH}${inputsToQuery(inputs)}`}
          />
        </div>
      </section>

      {/* Ask Shane with the result attached */}
      <section className="px-6 md:px-12 pb-16 md:pb-24">
        <div id="ask" className="max-w-4xl mx-auto p-8 md:p-12 bg-cream border border-cream-line rounded-[2rem] scroll-mt-24">
          <AskShane key={kids ? "family" : "renting"} source="cost_calculator" initialTopic={kids ? "family" : "renting"} context={summary} />
        </div>
      </section>

      {/* How the numbers work + FAQ (FAQ also published as structured data) */}
      <section className="bg-white border-t border-black/10 px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-5">
            <span className="block text-[11px] font-medium uppercase tracking-[0.3em] mb-5 text-gold-deep">How I worked this out</span>
            <h2 className="font-serif text-4xl md:text-5xl leading-tight mb-6">Real numbers, not a national average.</h2>
            <div className="space-y-4 text-black/65 font-light leading-relaxed">
              <p>
                Rents come from what East Coast Real Estate and Alan Bolton Property Consultants actually let in each area. Our
                historical average for a one-bed condo is just over ฿18,000 a month.
              </p>
              <p>
                Food, transport, bills and healthcare are what I'd tell a friend to budget, from 20 years of living here and
                running restaurants, bars and a car rental company. School fees are monthly averages of the yearly fees.
              </p>
              <p>
                Everything is a monthly figure for 2026. It doesn't include one-off costs like deposits, flights, a car purchase or
                visa fees. For those, read my guide to <a href="/guides/moving-to-pattaya" onClick={handleLinkClick} className="text-gold-deep underline underline-offset-4 hover:text-ink">moving to Pattaya</a>.
              </p>
            </div>
          </div>
          <div className="lg:col-span-7">
            <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-8">Pattaya cost of living: short answers</h2>
            <div className="divide-y divide-black/10 border-y border-black/10">
              {CALCULATOR_FAQS.map((f) => (
                <div key={f.q} className="py-6">
                  <h3 className="font-serif text-xl leading-snug mb-2">{f.q}</h3>
                  <p className="text-black/65 font-light leading-relaxed">{f.a}</p>
                  {f.slug && (
                    <a href={`/articles/${f.slug}`} onClick={handleLinkClick} className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium tracking-wide text-gold-deep hover:text-ink transition-colors">
                      Read more <ArrowRight className="w-3.5 h-3.5" />
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
