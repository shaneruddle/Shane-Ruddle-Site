import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, BadgeCheck, Check, Link2, RotateCcw, Search, ShieldAlert } from "lucide-react";
import {
  BAHT,
  CATEGORIES,
  ITEMS,
  PRICES_AS_OF,
  PRICES_FAQS,
  PRICES_META,
  PRICES_PATH,
  PriceCategory,
  PriceItem,
  QUOTE_CURRENCIES,
  SITUATIONS,
  VERDICTS,
  Verdict,
  approx,
  checkFromSearch,
  checkQuery,
  itemById,
  range,
  verdictFor,
} from "../lib/prices";
import { CURRENCIES } from "../lib/costOfLiving";
import { handleLinkClick } from "../lib/navigation";
import { trackEvent } from "../lib/analytics";
import { applyPageMeta } from "../seo";
import AskShane from "./AskShane";
import NewsletterSignup from "./NewsletterSignup";
import EmailMyResult from "./EmailMyResult";

// /pattaya-prices: "Am I paying too much?" Pick what you were quoted for, type the price, and get
// a straight verdict with what locals pay and Shane's tip. Then "when it goes wrong" playbooks,
// the full price sheet and FAQs. The item and quote live in the URL so a check can be shared.

const PROMOS = {
  prac: { label: "Rent from Pattaya Rent a Car", href: "https://pattayarentacar.com/?utm_source=shaneruddle.com&utm_medium=referral&utm_campaign=pattaya_prices", name: "prac" },
  ecre: { label: "See rentals at East Coast Real Estate", href: "https://www.thaiproperty.com/?utm_source=shaneruddle.com&utm_medium=referral&utm_campaign=pattaya_prices", name: "ecre_rentals" },
};

const VERDICT_STYLE: Record<Verdict, { chip: string; text: string }> = {
  cheap: { chip: "bg-emerald-400/15 border-emerald-400/40 text-emerald-300", text: "text-emerald-300" },
  fair: { chip: "bg-emerald-400/15 border-emerald-400/40 text-emerald-300", text: "text-emerald-300" },
  high: { chip: "bg-gold/15 border-gold/50 text-gold", text: "text-gold" },
  walk: { chip: "bg-red-400/15 border-red-400/40 text-red-300", text: "text-red-300" },
};

const Eyebrow = ({ children }: { children: ReactNode }) => (
  <span className="block text-[11px] font-medium uppercase tracking-[0.3em] mb-5 text-gold-deep">{children}</span>
);

const SourceBadge = ({ fromShane, dark }: { fromShane: boolean; dark?: boolean }) => (
  <span
    className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] px-2.5 py-1 rounded-full ${
      fromShane ? (dark ? "bg-gold/15 text-gold" : "bg-gold/15 text-gold-deep") : dark ? "bg-white/10 text-white/55" : "bg-black/[0.05] text-black/50"
    }`}
  >
    {fromShane ? <BadgeCheck className="w-3 h-3" /> : null}
    {fromShane ? "From my articles" : "My estimate"}
  </span>
);

const readInitial = () => (typeof window === "undefined" ? {} : checkFromSearch(window.location.search));

// ---------------------------------------------------------------------------------------------
// The scale: fair zone, "a bit high" zone, walk-away zone, and where the quote lands.

function PriceScale({ item, quote }: { item: PriceItem; quote: number }) {
  const max = Math.max(item.walkAway * 1.35, quote * 1.08);
  const pct = (n: number) => `${Math.min(100, (n / max) * 100)}%`;
  return (
    <div className="mt-8" aria-hidden>
      <div className="relative h-3 rounded-full bg-red-400/30 overflow-hidden">
        <div className="absolute inset-y-0 left-0 bg-emerald-400/25" style={{ width: pct(item.fair[0]) }} />
        <div className="absolute inset-y-0 bg-emerald-400/70" style={{ left: pct(item.fair[0]), width: `calc(${pct(item.fair[1])} - ${pct(item.fair[0])})` }} />
        <div className="absolute inset-y-0 bg-gold/70" style={{ left: pct(item.fair[1]), width: `calc(${pct(item.walkAway)} - ${pct(item.fair[1])})` }} />
      </div>
      <div className="relative h-10">
        <div className="absolute -top-5 -translate-x-1/2 flex flex-col items-center" style={{ left: pct(quote) }}>
          <span className="w-0.5 h-7 bg-white rounded-full" />
          <span className="mt-1 text-xs font-semibold text-white whitespace-nowrap">You: {BAHT(quote)}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] uppercase tracking-[0.15em] text-white/45">
        <span><span className="inline-block w-2 h-2 rounded-full bg-emerald-400/70 mr-1.5" />Fair {range(item)}</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-gold/70 mr-1.5" />A bit high to {BAHT(item.walkAway)}</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-red-400/50 mr-1.5" />Walk away</span>
      </div>
    </div>
  );
}

function Result({ item, quote, currency, onReset }: { item: PriceItem; quote: number; currency: string; onReset: () => void }) {
  const v = verdictFor(item, quote);
  const s = VERDICT_STYLE[v];
  const [copied, setCopied] = useState(false);
  const promo = item.promo ? PROMOS[item.promo] : null;

  const share = async () => {
    const url = `https://shaneruddle.com${PRICES_PATH}${checkQuery(item.id, quote)}`;
    trackEvent("share", { method: "copy_link", content_type: "price_check", item_id: item.id });
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title: "Am I paying too much in Pattaya?", text: `${item.label}: ${BAHT(quote)}. ${VERDICTS[v].label}.`, url });
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
    <div className="mt-8 p-7 md:p-10 rounded-[1.75rem] border border-white/15 bg-white/[0.04]" aria-live="polite">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-semibold ${s.chip}`}>
          {v === "walk" ? <AlertTriangle className="w-4 h-4" /> : v === "high" ? <ShieldAlert className="w-4 h-4" /> : <Check className="w-4 h-4" />}
          {VERDICTS[v].label}
        </span>
        <SourceBadge fromShane={item.fromShane} dark />
      </div>
      <h3 className="font-serif text-3xl md:text-4xl leading-tight text-white mb-2">
        {item.label}: <span className={s.text}>{BAHT(quote)}</span>
        {currency !== "THB" && <span className="text-white/40 text-xl md:text-2xl"> ({approx(quote, currency)})</span>}
      </h3>
      <p className="text-lg text-white/70 font-light">{VERDICTS[v].line}</p>

      <PriceScale item={item} quote={quote} />

      <div className="mt-8 grid md:grid-cols-2 gap-6">
        <div>
          <span className="block text-[11px] uppercase tracking-[0.22em] text-gold mb-2">What locals pay</span>
          <p className="font-serif text-3xl text-white">{range(item)}</p>
          <p className="text-sm text-white/50 mt-1">{item.unit}{currency !== "THB" ? `, ${approx(item.fair[0], currency)} to ${approx(item.fair[1], currency).replace("about ", "")}` : ""}</p>
          <p className="mt-5 text-white/75 leading-relaxed">{item.tip}</p>
        </div>
        <div>
          {item.haggle && v !== "cheap" && v !== "fair" ? (
            <>
              <span className="block text-[11px] uppercase tracking-[0.22em] text-gold mb-2">What I'd do</span>
              <p className="text-white/75 leading-relaxed">{item.haggle}</p>
            </>
          ) : item.haggle ? (
            <>
              <span className="block text-[11px] uppercase tracking-[0.22em] text-gold mb-2">Good to know</span>
              <p className="text-white/75 leading-relaxed">{item.haggle}</p>
            </>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            {promo && (
              <a
                href={promo.href}
                target="_blank"
                rel="noopener"
                onClick={() => trackEvent("select_promotion", { promotion_name: promo.name, creative_slot: `price_check_${item.id}` })}
                className="inline-flex items-center gap-2 px-5 py-3 bg-gold text-ink text-xs font-semibold uppercase tracking-[0.16em] rounded-full hover:bg-white transition-colors"
              >
                {promo.label} <ArrowRight className="w-4 h-4" />
              </a>
            )}
            {item.href && (
              <a href={item.href} onClick={handleLinkClick} className="inline-flex items-center gap-2 px-5 py-3 border border-white/25 text-white text-xs font-semibold uppercase tracking-[0.16em] rounded-full hover:border-gold hover:text-gold transition-colors">
                Why I say this <ArrowRight className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap gap-5">
        <button type="button" onClick={share} className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-gold">
          {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />} {copied ? "Link copied" : "Share this check"}
        </button>
        <button type="button" onClick={onReset} className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-gold">
          <RotateCcw className="w-4 h-4" /> Check another price
        </button>
      </div>

      <div className="mt-8">
        <EmailMyResult
          dark
          tool="price_checker"
          segment="visiting"
          title="price check"
          heading="Email me this price check"
          summary={`${item.label}: ${BAHT(quote)}. ${VERDICTS[v].label}\nWhat locals pay: ${range(item)} (${item.unit})\n${item.tip}${item.haggle ? `\n${item.haggle}` : ""}`}
          link={`https://shaneruddle.com${PRICES_PATH}${checkQuery(item.id, quote)}`}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------

function Checker({ request }: { request: { id: string; n: number } | null }) {
  const initial = readInitial();
  const [itemId, setItemId] = useState<string | undefined>(initial.itemId);
  const [category, setCategory] = useState<PriceCategory>(() => itemById(initial.itemId)?.category ?? "transport");
  const [amount, setAmount] = useState(initial.quote ? String(initial.quote) : "");
  const [currency, setCurrency] = useState("THB");
  const [checked, setChecked] = useState<{ id: string; baht: number; currency: string } | null>(
    initial.itemId && initial.quote ? { id: initial.itemId, baht: initial.quote, currency: "THB" } : null,
  );
  const started = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const item = itemById(itemId);

  const pick = (id: string) => {
    setItemId(id);
    setChecked(null);
    if (!started.current) {
      started.current = true;
      trackEvent("price_check_start", { item_id: id });
    }
    setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
  };

  const check = (e: FormEvent) => {
    e.preventDefault();
    const n = Number(amount.replace(/[^\d.]/g, ""));
    if (!item || !(n > 0)) return;
    const perUnit = CURRENCIES.find((c) => c.id === currency)?.perUnit ?? 1;
    const baht = Math.round(n * perUnit);
    setChecked({ id: item.id, baht, currency });
    const v = verdictFor(item, baht);
    trackEvent("price_check", { item_id: item.id, category: item.category, quote_thb: baht, currency, verdict: v });
    window.history.replaceState(null, "", `${PRICES_PATH}${checkQuery(item.id, baht)}`);
  };

  const reset = () => {
    setChecked(null);
    setAmount("");
    setItemId(undefined);
    window.history.replaceState(null, "", PRICES_PATH);
    document.getElementById("check")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // A tap on the price sheet loads that item into the checker.
  useEffect(() => {
    if (!request) return;
    const it = itemById(request.id);
    if (!it) return;
    setCategory(it.category);
    setAmount("");
    pick(it.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);

  const checkedItem = checked ? itemById(checked.id) : undefined;

  return (
    <div className="max-w-4xl">
      <span className="block text-[11px] uppercase tracking-[0.25em] text-white/45 mb-3">1. What were you quoted for?</span>
      <div className="flex flex-wrap gap-2 mb-4" role="tablist">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={category === c.id}
            onClick={() => setCategory(c.id)}
            className={`px-4 py-2 rounded-full text-sm border transition-colors ${
              category === c.id ? "bg-white text-ink border-white" : "border-white/20 text-white/70 hover:border-gold hover:text-white"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 gap-2.5 mb-8">
        {ITEMS.filter((i) => i.category === category).map((i) => (
          <button
            key={i.id}
            type="button"
            onClick={() => pick(i.id)}
            className={`text-left px-5 py-4 rounded-2xl border transition-all ${
              itemId === i.id ? "border-gold bg-gold/15" : "border-white/15 bg-white/[0.04] hover:border-gold"
            }`}
          >
            <span className="block text-white">{i.label}</span>
            <span className="block text-xs text-white/45 mt-0.5">{i.unit}</span>
          </button>
        ))}
      </div>

      <form onSubmit={check}>
        <label htmlFor="quote" className="block text-[11px] uppercase tracking-[0.25em] text-white/45 mb-3">
          2. What price were you given?{item ? ` (${item.label.toLowerCase()})` : ""}
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex flex-1 rounded-full border border-white/20 bg-white/[0.06] focus-within:border-gold overflow-hidden">
            <select
              aria-label="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-transparent text-white pl-5 pr-2 py-4 text-lg outline-none border-r border-white/15 [&>option]:text-ink"
            >
              <option value="THB">฿ THB</option>
              {QUOTE_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {CURRENCIES.find((x) => x.id === c)?.symbol} {c}
                </option>
              ))}
            </select>
            <input
              ref={inputRef}
              id="quote"
              inputMode="decimal"
              autoComplete="off"
              placeholder={item ? `e.g. ${item.walkAway}` : "Pick something above first"}
              disabled={!item}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 min-w-0 bg-transparent px-5 py-4 text-lg text-white placeholder:text-white/30 outline-none disabled:cursor-not-allowed"
            />
          </div>
          <button
            type="submit"
            disabled={!item || !amount}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gold text-ink text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:bg-white transition-colors disabled:opacity-40 disabled:hover:bg-gold"
          >
            <Search className="w-4 h-4" /> Check it
          </button>
        </div>
      </form>

      {checked && checkedItem && <Result item={checkedItem} quote={checked.baht} currency={checked.currency} onReset={reset} />}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------

export default function PricesPage() {
  const [request, setRequest] = useState<{ id: string; n: number } | null>(null);
  useEffect(() => {
    applyPageMeta(PRICES_META);
  }, []);

  const loadItem = (id: string) => {
    trackEvent("select_content", { content_type: "price_sheet_item", item_id: id });
    setRequest((r) => ({ id, n: (r?.n ?? 0) + 1 }));
    document.getElementById("check")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <section id="check" className="bg-ink text-white pt-28 md:pt-36 pb-16 md:pb-24 px-6 md:px-12 scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <span className="block text-[11px] font-medium uppercase tracking-[0.3em] mb-5 text-gold">Visiting Pattaya · Fair price checker</span>
          <h1 className="font-serif font-normal text-[2.6rem] sm:text-6xl lg:text-7xl leading-[1.04] tracking-tight mb-6 max-w-5xl">
            Am I paying too much? <span className="italic text-gold">Check any Pattaya price.</span>
          </h1>
          <p className="text-lg md:text-xl text-white/65 font-light leading-relaxed max-w-2xl mb-8">
            I set prices for a living here: car rental, bars, restaurants and property. Tell me what you were quoted and I'll tell you
            straight whether it's fair, a bit high, or time to walk away.
          </p>
          <div className="flex items-center gap-3 mb-12 md:mb-16">
            <img src="/images/shane-portrait.webp" alt="" width={44} height={44} className="w-11 h-11 rounded-full object-cover" />
            <span className="text-sm text-white/60">
              By <a href="/about" onClick={handleLinkClick} className="text-white hover:text-gold">Shane Ruddle</a>
              <span className="block text-white/40">Owner of 7 Pattaya businesses · prices checked {PRICES_AS_OF}</span>
            </span>
          </div>
          <Checker request={request} />
        </div>
      </section>

      <div className="bg-paper px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto space-y-16 md:space-y-24">
          <section>
            <Eyebrow>When it goes wrong</Eyebrow>
            <h2 className="font-serif text-3xl md:text-5xl leading-tight mb-4 max-w-3xl">What I'd do in the six situations visitors ask me about</h2>
            <p className="text-black/60 font-light leading-relaxed max-w-2xl mb-10">
              Most visits go without a hitch, and Pattaya is a lot more professional than its old reputation. But if something does
              happen, this is what I'd tell a friend.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {SITUATIONS.map((s) => (
                <article key={s.id} id={`if-${s.id}`} className="flex flex-col p-7 rounded-[1.5rem] bg-white border border-black/[0.06]">
                  <div className="mb-3"><SourceBadge fromShane={s.fromShane} /></div>
                  <h3 className="font-serif text-2xl leading-snug mb-3">{s.title}</h3>
                  <p className="text-sm text-black/65 leading-relaxed mb-4">{s.body}</p>
                  <ol className="space-y-2 mb-4 flex-1">
                    {s.steps.map((step, i) => (
                      <li key={i} className="flex gap-3 text-sm text-black/75 leading-relaxed">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-gold/20 text-gold-deep text-[11px] font-semibold flex items-center justify-center mt-0.5">{i + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                  {s.href && (
                    <a href={s.href} onClick={handleLinkClick} className="inline-flex items-center gap-1 text-xs font-medium text-gold-deep hover:text-ink">
                      More from me <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  )}
                </article>
              ))}
            </div>
            <p className="mt-6 text-sm text-black/50">Emergency: Tourist Police 1155 (English spoken) · Ambulance 1669 · Police 191</p>
          </section>

          <section id="price-sheet" className="scroll-mt-24">
            <Eyebrow>The price sheet</Eyebrow>
            <h2 className="font-serif text-3xl md:text-5xl leading-tight mb-4">Fair prices in Pattaya, {PRICES_AS_OF}</h2>
            <p className="text-black/60 font-light leading-relaxed max-w-2xl mb-10">
              Screenshot this before you go out. Prices marked <em>from my articles</em> are ones I've written about; the rest are my
              estimates of what a local or a regular would pay. Tap any row to check a quote.
            </p>
            <div className="grid lg:grid-cols-2 gap-x-12 gap-y-10">
              {CATEGORIES.map((c) => (
                <div key={c.id}>
                  <h3 className="font-serif text-2xl mb-3">{c.label}</h3>
                  <div className="divide-y divide-black/10 border-y border-black/10">
                    {ITEMS.filter((i) => i.category === c.id).map((i) => (
                      <a
                        key={i.id}
                        href={`${PRICES_PATH}?item=${i.id}`}
                        onClick={(e) => {
                          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                          e.preventDefault();
                          loadItem(i.id);
                        }}
                        className="group flex items-baseline justify-between gap-4 py-3.5 hover:bg-black/[0.02]"
                      >
                        <span>
                          <span className="block group-hover:text-gold-deep transition-colors">
                            {i.label}
                            {i.fromShane && <BadgeCheck className="inline w-3.5 h-3.5 ml-1.5 text-gold-deep -mt-0.5" aria-label="From my articles" />}
                          </span>
                          <span className="block text-xs text-black/45">{i.unit}</span>
                        </span>
                        <span className="font-serif text-xl text-gold-deep whitespace-nowrap">{range(i)}</span>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-7">
              <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-8">Pattaya prices: short answers</h2>
              <div className="divide-y divide-black/10 border-y border-black/10">
                {PRICES_FAQS.map((f) => (
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
                <Eyebrow>Not on the list?</Eyebrow>
                <h2 className="font-serif text-3xl leading-tight mb-3">Ask me about a price</h2>
                <p className="text-black/60 font-light leading-relaxed mb-6">
                  A tour, a boat trip, a quote from a builder or a landlord. Tell me what you were offered and I'll tell you what I think.
                </p>
                <AskShane source="price_checker" initialTopic="visiting" showHeading={false} />
              </div>
            </div>
          </section>

          <div className="p-8 md:p-12 bg-ink rounded-[2rem] grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif text-white mb-2">Get the next article by email</h2>
              <p className="text-white/60 font-light">One short email a week on property, business and life in Pattaya. Free, no spam.</p>
            </div>
            <NewsletterSignup dark source="price_checker" />
          </div>
        </div>
      </div>
    </>
  );
}
