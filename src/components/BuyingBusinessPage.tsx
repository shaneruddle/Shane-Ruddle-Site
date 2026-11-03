import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, Check, CircleCheck, Link2, MessageSquareText, RotateCcw, XCircle } from "lucide-react";
import {
  ARTICLES,
  BUYING_FAQS,
  BUYING_META,
  BUYING_PATH,
  DEAL_CHOICES,
  DealAnswers,
  DealResult,
  PLAYBOOK,
  Severity,
  answeredCount,
  checkDeal,
  dealFromSearch,
  dealQuery,
  dealSummary,
  thbShort,
  fairRange,
} from "../lib/dealCheck";
import { BUSINESS_PATH } from "../lib/businessCheck";
import { SELL_PATH } from "../lib/sellBusiness";
import { handleLinkClick } from "../lib/navigation";
import { trackEvent } from "../lib/analytics";
import { applyPageMeta } from "../seo";
import AskShane from "./AskShane";
import BusinessTabs from "./BusinessTabs";
import NewsletterSignup from "./NewsletterSignup";

// /business-in-pattaya/buying-a-business: the "Buying a business" chapter. A deal checker scores one
// listing against Shane's buying rules, then "Send me the listing" goes to him with the deal attached.

const Eyebrow = ({ children, dark = false }: { children: ReactNode; dark?: boolean }) => (
  <span className={`block text-[11px] font-medium uppercase tracking-[0.3em] mb-5 ${dark ? "text-gold" : "text-gold-deep"}`}>{children}</span>
);

const SEV: Record<Severity, { icon: ReactNode; text: string; border: string; label: string }> = {
  red: { icon: <XCircle className="w-5 h-5 text-red-300" />, text: "text-red-300", border: "border-red-400/40", label: "Would stop me" },
  amber: { icon: <AlertTriangle className="w-5 h-5 text-gold" />, text: "text-gold", border: "border-gold/40", label: "Ask first" },
  green: { icon: <CircleCheck className="w-5 h-5 text-emerald-300" />, text: "text-emerald-300", border: "border-emerald-400/30", label: "In its favour" },
};

const readDeal = (): DealAnswers => (typeof window === "undefined" ? {} : dealFromSearch(window.location.search));
const TOTAL = DEAL_CHOICES.length + 1;

// ---------------------------------------------------------------------------------------------
// Inputs

function MoneyInput({ label, hint, value, onChange }: { label: string; hint?: string; value?: number; onChange: (n?: number) => void }) {
  return (
    <label className="block">
      <span className="block text-sm text-white/80 mb-2">{label}</span>
      <span className="flex items-center rounded-xl border border-white/15 bg-white/[0.04] focus-within:border-gold">
        <span className="pl-4 text-white/45">฿</span>
        <input
          type="text"
          inputMode="numeric"
          value={value ? value.toLocaleString("en-GB") : ""}
          onChange={(e) => {
            const n = Number(e.target.value.replace(/[^\d]/g, ""));
            onChange(n > 0 ? n : undefined);
          }}
          placeholder="0"
          className="w-full bg-transparent px-2 py-3 text-white placeholder:text-white/25 outline-none"
        />
      </span>
      {hint && <span className="block text-xs text-white/40 mt-1.5">{hint}</span>}
    </label>
  );
}

function ChoiceRow({ choice, value, onPick }: { choice: (typeof DEAL_CHOICES)[number]; value?: string; onPick: (id: string) => void }) {
  return (
    <div role="group" aria-label={choice.label} className="py-5 border-t border-white/10 first:border-t-0">
      <p className="text-white/85 mb-3">{choice.label}</p>
      <div className="flex flex-wrap gap-2">
        {choice.options.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={value === o.id}
            onClick={() => onPick(o.id)}
            className={`px-4 py-2.5 rounded-full border text-sm transition-colors text-left ${
              value === o.id ? "border-gold bg-gold text-ink font-medium" : "border-white/15 text-white/75 hover:border-white/40 hover:text-white"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Result panel

function PriceMeter({ result }: { result: DealResult }) {
  const p = result.price;
  if (!p) return <p className="text-sm text-white/45">Add the asking price and the profit to see what I'd pay.</p>;
  const max = 6;
  const pos = Math.min(p.multiple, max) / max;
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[11px] uppercase tracking-[0.2em] text-white/45">Price vs profit</span>
        <span className="font-serif text-2xl text-white">{p.multiple.toFixed(1)}×</span>
      </div>
      <div className="relative h-2 rounded-full bg-white/10">
        <span className="absolute inset-y-0 rounded-full bg-emerald-400/50" style={{ left: `${(2 / max) * 100}%`, width: `${((p.fairHigh / p.fairLow) * 2 - 2) / max * 100}%` }} />
        <span className="absolute -top-1 w-4 h-4 -ml-2 rounded-full bg-gold ring-4 ring-ink" style={{ left: `${pos * 100}%` }} />
      </div>
      <div className="flex justify-between text-[10px] text-white/35 mt-1.5">
        <span>0×</span><span>2×</span><span>4×</span><span>6×+</span>
      </div>
      <p className="text-sm text-white/65 mt-3">
        What I'd pay: <span className="text-white">{fairRange(p)}</span>
      </p>
    </div>
  );
}

function ResultPanel({ result, answered, onSend, onShare, copied }: { result: DealResult; answered: number; onSend: () => void; onShare: () => void; copied: boolean }) {
  const s = SEV[result.verdict];
  const enough = answered >= 4;
  return (
    <div className="p-6 md:p-8 rounded-[1.5rem] bg-white/[0.05] border border-white/10">
      <span className="block text-[11px] uppercase tracking-[0.25em] text-white/45 mb-3">
        My read on this deal · {answered} of {TOTAL} answered
      </span>
      {enough ? (
        <>
          <h2 className={`font-serif text-3xl leading-tight mb-4 ${s.text}`}>
            {result.verdict === "green" && answered < TOTAL - 2 ? "So far, so good. Answer the rest." : result.headline}
          </h2>
          <div className="flex gap-4 mb-6 text-sm">
            <span className="text-red-300">{result.reds} red</span>
            <span className="text-gold">{result.ambers} amber</span>
            <span className="text-emerald-300">{result.greens} green</span>
          </div>
        </>
      ) : (
        <h2 className="font-serif text-3xl leading-tight mb-6 text-white">Tell me about the deal.</h2>
      )}
      <PriceMeter result={result} />
      <div className="mt-8 pt-6 border-t border-white/10">
        <p className="font-serif text-xl text-white leading-snug mb-4">Send me the listing and I'll tell you what I'd ask.</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={onSend} className="inline-flex items-center gap-2 px-6 py-3.5 bg-gold text-ink text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:bg-white transition-colors">
            Send me the listing <ArrowRight className="w-4 h-4" />
          </button>
          <button type="button" onClick={onShare} className="inline-flex items-center gap-2 px-5 py-3.5 border border-white/25 text-white text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:border-gold hover:text-gold transition-colors">
            {copied ? <><Check className="w-4 h-4" /> Copied</> : <><Link2 className="w-4 h-4" /> Share</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Page

export default function BuyingBusinessPage() {
  const [deal, setDeal] = useState<DealAnswers>(readDeal);
  const [copied, setCopied] = useState(false);
  const started = useRef(false);
  const reported = useRef(false);
  const result = useMemo(() => checkDeal(deal), [deal]);
  const answered = answeredCount(deal);

  useEffect(() => {
    applyPageMeta(BUYING_META);
  }, []);

  const update = (patch: Partial<DealAnswers>) => {
    const next = { ...deal, ...patch };
    setDeal(next);
    window.history.replaceState(null, "", `${BUYING_PATH}${dealQuery(next)}`);
    if (!started.current) {
      started.current = true;
      trackEvent("deal_check_start", { field: Object.keys(patch)[0] });
    }
    if (!reported.current && answeredCount(next) >= 8) {
      reported.current = true;
      const r = checkDeal(next);
      trackEvent("deal_check_complete", { verdict: r.verdict, reds: r.reds, ambers: r.ambers, multiple: r.price ? +r.price.multiple.toFixed(1) : undefined, type: next.type });
    }
  };

  const reset = () => {
    setDeal({});
    window.history.replaceState(null, "", BUYING_PATH);
  };

  const send = () => {
    trackEvent("select_content", { content_type: "deal_check_listing", source: "deal_check_result", verdict: result.verdict });
    document.getElementById("listing")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const share = async () => {
    const url = `https://shaneruddle.com${BUYING_PATH}${dealQuery(deal)}`;
    trackEvent("share", { method: "copy_link", content_type: "deal_check" });
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title: "Pattaya business deal check", text: result.headline, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* user cancelled */
    }
  };

  const visibleFlags = answered >= 2 ? result.flags : [];

  return (
    <>
      <section className="bg-ink text-white pt-28 md:pt-36 pb-16 md:pb-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <a href="/guides/doing-business-in-pattaya" onClick={handleLinkClick} className="block text-[11px] font-medium uppercase tracking-[0.3em] mb-5 text-gold hover:text-white transition-colors">
            Doing business in Pattaya
          </a>
          <BusinessTabs active="buying" />
          <h1 className="font-serif font-normal text-[2.6rem] sm:text-6xl lg:text-7xl leading-[1.04] tracking-tight mb-6 max-w-5xl">
            Buying a business in Pattaya? <span className="italic text-gold">Check the deal first.</span>
          </h1>
          <p className="text-lg md:text-xl text-white/65 font-light leading-relaxed max-w-2xl mb-8">
            I've bought most of my seven businesses rather than starting them. Tell me about the one you're looking at and I'll
            check it against the rules I use myself: the price, the numbers, the lease, the company, the staff and how you pay.
          </p>
          <div className="flex items-center gap-3 mb-12 md:mb-16">
            <img src="/images/shane-portrait.webp" alt="" width={44} height={44} className="w-11 h-11 rounded-full object-cover" />
            <span className="text-sm text-white/60">
              By <a href="/about" onClick={handleLinkClick} className="text-white hover:text-gold">Shane Ruddle</a>
              <span className="block text-white/40">Owner of 7 Pattaya businesses · 20 years here</span>
            </span>
          </div>

          <div id="deal" className="grid lg:grid-cols-12 gap-8 lg:gap-12 scroll-mt-24">
            {/* Form */}
            <div className="lg:col-span-7">
              <Eyebrow dark>The deal checker</Eyebrow>
              <div className="grid sm:grid-cols-3 gap-4 mb-4">
                <MoneyInput label="Asking price" value={deal.price} onChange={(n) => update({ price: n })} />
                <MoneyInput label="Profit a year" hint="What the seller says it makes" value={deal.profit} onChange={(n) => update({ profit: n })} />
                {deal.type === "restaurant" && (
                  <MoneyInput label="Turnover a year" hint="Optional" value={deal.turnover} onChange={(n) => update({ turnover: n })} />
                )}
              </div>
              <div>
                {DEAL_CHOICES.map((c) => (
                  <ChoiceRow key={c.id} choice={c} value={deal[c.id]} onPick={(id) => update({ [c.id]: id } as Partial<DealAnswers>)} />
                ))}
              </div>
              {answered > 0 && (
                <button type="button" onClick={reset} className="mt-4 inline-flex items-center gap-2 text-sm text-white/50 hover:text-white">
                  <RotateCcw className="w-4 h-4" /> Start again
                </button>
              )}
            </div>

            {/* Live result */}
            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-24 space-y-4">
                <ResultPanel result={result} answered={answered} onSend={send} onShare={share} copied={copied} />
              </div>
            </div>
          </div>

          {visibleFlags.length > 0 && (
            <div className="mt-14 grid lg:grid-cols-12 gap-8 lg:gap-12">
              <div className="lg:col-span-7">
                <h2 className="font-serif text-3xl md:text-4xl text-white leading-tight mb-6">What I'd look at</h2>
                <ul className="space-y-3">
                  {visibleFlags.map((f) => (
                    <li key={f.id} className={`p-5 rounded-2xl border bg-white/[0.03] ${SEV[f.severity].border}`}>
                      <div className="flex gap-3">
                        <span className="shrink-0 mt-0.5">{SEV[f.severity].icon}</span>
                        <div>
                          <span className={`block text-[10px] uppercase tracking-[0.2em] mb-1 ${SEV[f.severity].text}`}>{SEV[f.severity].label}</span>
                          <h3 className="font-serif text-xl text-white leading-snug mb-1.5">{f.title}</h3>
                          <p className="text-white/65 leading-relaxed">{f.text}</p>
                          <a href={f.href} onClick={handleLinkClick} className="mt-2 inline-flex items-center gap-1 text-xs text-gold hover:text-white">
                            Why I say this <ArrowRight className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              {result.questions.length > 0 && (
                <div className="lg:col-span-5">
                  <div className="p-6 md:p-8 rounded-[1.5rem] bg-cream text-ink">
                    <span className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-gold-deep mb-4">
                      <MessageSquareText className="w-4 h-4" /> Ask the seller
                    </span>
                    <ol className="space-y-3 list-decimal pl-5 marker:text-gold-deep marker:font-serif">
                      {[...new Set(result.questions)].map((q) => (
                        <li key={q} className="text-black/75 leading-relaxed">{q}</li>
                      ))}
                    </ol>
                    <button type="button" onClick={send} className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-gold-deep hover:text-ink">
                      Send me the listing and I'll tell you what I'd ask <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <p className="mt-14 border-t border-white/10 pt-6 text-xs text-white/40 max-w-2xl leading-relaxed">
            My honest opinion from buying businesses here, not legal or financial advice. Get a Thai lawyer to check the company and the
            paperwork before you sign.
          </p>
        </div>
      </section>

      <div className="bg-paper px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto space-y-16 md:space-y-24">
          <section id="listing" className="max-w-4xl mx-auto scroll-mt-28 p-8 md:p-12 bg-cream border border-cream-line rounded-[2rem]">
            <Eyebrow>Send me the listing</Eyebrow>
            <h2 className="font-serif text-3xl md:text-5xl leading-tight mb-4">Send me the listing and I'll tell you what I'd ask</h2>
            <p className="text-black/60 font-light leading-relaxed max-w-2xl mb-8">
              Paste the link to the listing, or describe the business: where it is, the price and what's worrying you.
              {answered > 0 ? " Your deal check comes with it, so I won't need to ask the basics." : ""} I'll reply personally.
            </p>
            <AskShane
              source="deal_check"
              initialTopic="business"
              showHeading={false}
              context={answered > 0 ? dealSummary(deal, result) : undefined}
              contextNote="I'll see your deal check with your message."
            />
          </section>

          <section>
            <Eyebrow>The chapter</Eyebrow>
            <h2 className="font-serif text-3xl md:text-5xl leading-tight mb-3 max-w-3xl">How I buy a business in Pattaya, in four steps</h2>
            <p className="text-black/55 font-light mb-10 max-w-2xl">The rules behind the deal checker, from my buying series.</p>
            <div className="grid md:grid-cols-2 gap-5">
              {PLAYBOOK.map((p) => (
                <a
                  key={p.n}
                  href={p.href}
                  onClick={(e) => {
                    trackEvent("select_content", { content_type: "buying_playbook", item: p.href });
                    handleLinkClick(e);
                  }}
                  className="group flex flex-col bg-white border border-black/[0.08] rounded-[1.25rem] p-7 md:p-8 transition-all hover:border-gold/60 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/[0.06]"
                >
                  <span className="font-serif text-4xl text-gold-deep mb-3">{p.n}</span>
                  <span className="font-serif text-2xl md:text-3xl text-ink mb-4">{p.title}</span>
                  <ul className="space-y-2.5 flex-1">
                    {p.points.map((pt) => (
                      <li key={pt} className="flex gap-2.5 text-black/65 font-light leading-relaxed">
                        <Check className="w-4 h-4 text-gold-deep shrink-0 mt-1" /> {pt}
                      </li>
                    ))}
                  </ul>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-xs font-medium tracking-wide text-gold-deep group-hover:text-ink">
                    Read: {p.read} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </a>
              ))}
            </div>
            <div className="mt-5 grid md:grid-cols-2 gap-5">
              <div className="p-7 md:p-8 rounded-[1.25rem] bg-ink text-white">
                <span className="block text-[11px] uppercase tracking-[0.22em] text-gold mb-3">Where the good ones are</span>
                <p className="text-white/75 leading-relaxed">
                  The businesses on Facebook or with agents usually aren't the best ones. The best sell quietly, by word of mouth between
                  owners. Of the last five or six I bought, other business people hadn't even known they were for sale.
                </p>
                <a
                  href={SELL_PATH}
                  onClick={(e) => {
                    trackEvent("select_content", { content_type: "sell_business", source: "buying_page" });
                    handleLinkClick(e);
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm text-gold hover:text-white"
                >
                  Selling one? Tell me in confidence <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
              <div className="p-7 md:p-8 rounded-[1.25rem] bg-ink text-white">
                <span className="block text-[11px] uppercase tracking-[0.22em] text-gold mb-3">What I'd never buy</span>
                <p className="text-white/75 leading-relaxed">
                  Walking Street, go-go bars and nightclubs. The risk is very high and you can be at the mercy of the authorities. And a
                  bar bought as a retirement hobby: it can work, but the odds are against you.
                </p>
              </div>
            </div>
          </section>

          <section className="grid lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-5">
              <Eyebrow>Not sure yet?</Eyebrow>
              <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-6">Start with the reality check</h2>
              <p className="text-black/60 font-light leading-relaxed mb-8">
                If you haven't found a business yet, six questions tell you whether your budget, experience and plans give you a fair
                chance, and what it costs to get going.
              </p>
              <a
                href={BUSINESS_PATH}
                onClick={handleLinkClick}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-ink text-white text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:bg-gold hover:text-ink transition-colors"
              >
                Check my idea <ArrowRight className="w-4 h-4" />
              </a>
              <p className="mt-8 text-sm text-black/50">
                The basics, including foreign ownership and work permits:{" "}
                <a href={ARTICLES.basics} onClick={handleLinkClick} className="text-gold-deep hover:text-ink underline underline-offset-2">
                  starting or buying a business in Pattaya
                </a>
                .
              </p>
            </div>
            <div className="lg:col-span-7">
              <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-8">Buying a business: short answers</h2>
              <div className="divide-y divide-black/10 border-y border-black/10">
                {BUYING_FAQS.map((f) => (
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
            <NewsletterSignup dark source="deal_check" />
          </div>
        </div>
      </div>
    </>
  );
}

