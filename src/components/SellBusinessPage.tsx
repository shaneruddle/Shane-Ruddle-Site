import { ReactNode, useEffect } from "react";
import { ArrowRight, Check, Lock, X } from "lucide-react";
import { BUY_CONTEXT, PROMISE, REASONS, SELL_CONTEXT, SELL_FAQS, SELL_META, STEPS, WHAT_I_BUY, WHAT_TO_SEND } from "../lib/sellBusiness";
import { BUSINESS_PATH } from "../lib/businessCheck";
import { BUYING_PATH } from "../lib/dealCheck";
import { handleLinkClick } from "../lib/navigation";
import { trackEvent } from "../lib/analytics";
import { applyPageMeta } from "../seo";
import AskShane from "./AskShane";
import BusinessTabs from "./BusinessTabs";

// /business-in-pattaya/sell-your-business: landing page for owners thinking of selling. Shane buys
// businesses and so do owners he knows. Main call to action: "I have a business for sale" (#sell);
// second: "I want to buy a business" (#buy). Both use the Ask Shane flow with the enquiry type attached.

const Eyebrow = ({ children, dark = false }: { children: ReactNode; dark?: boolean }) => (
  <span className={`block text-[11px] font-medium uppercase tracking-[0.3em] mb-5 ${dark ? "text-gold" : "text-gold-deep"}`}>{children}</span>
);

const jump = (id: "sell" | "buy", from: string) => {
  trackEvent("select_content", { content_type: id === "sell" ? "sell_business_cta" : "buy_business_cta", source: from });
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
};

export default function SellBusinessPage() {
  useEffect(() => {
    applyPageMeta(SELL_META);
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="bg-ink text-white pt-28 md:pt-36 pb-16 md:pb-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <a href="/guides/doing-business-in-pattaya" onClick={handleLinkClick} className="block text-[11px] font-medium uppercase tracking-[0.3em] mb-5 text-gold hover:text-white transition-colors">
            Doing business in Pattaya
          </a>
          <BusinessTabs active="selling" />
          <h1 className="font-serif font-normal text-[2.6rem] sm:text-6xl lg:text-7xl leading-[1.04] tracking-tight mb-6 max-w-5xl">
            Thinking of selling your business? <span className="italic text-gold">Tell me first.</span>
          </h1>
          <p className="text-lg md:text-xl text-white/65 font-light leading-relaxed max-w-2xl mb-8">
            I buy businesses in Pattaya, and so do owners I know. The best ones here never get advertised: they change hands quietly,
            between people who trust each other. If you're thinking of selling, tell me in confidence and I'll give you a straight answer.
          </p>
          <div className="flex flex-wrap gap-3 mb-10">
            <a
              href="#sell"
              onClick={(e) => {
                e.preventDefault();
                jump("sell", "hero");
              }}
              className="inline-flex items-center gap-2 px-7 py-4 bg-gold text-ink text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:bg-white transition-colors"
            >
              I have a business for sale <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#buy"
              onClick={(e) => {
                e.preventDefault();
                jump("buy", "hero");
              }}
              className="inline-flex items-center gap-2 px-7 py-4 border border-white/25 text-white text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:border-gold hover:text-gold transition-colors"
            >
              I want to buy a business
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <span className="flex items-center gap-3">
              <img src="/images/shane-portrait.webp" alt="" width={44} height={44} className="w-11 h-11 rounded-full object-cover" />
              <span className="text-sm text-white/60">
                <a href="/about" onClick={handleLinkClick} className="text-white hover:text-gold">Shane Ruddle</a>
                <span className="block text-white/40">Owner of 7 Pattaya businesses · 20 years here</span>
              </span>
            </span>
            <span className="flex items-center gap-2 text-sm text-white/60">
              <Lock className="w-4 h-4 text-gold" /> Confidential. Nobody hears about it without your OK.
            </span>
          </div>
        </div>
      </section>

      <div className="bg-paper px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto space-y-16 md:space-y-24">
          {/* Reasons */}
          <section>
            <Eyebrow>Why tell me</Eyebrow>
            <h2 className="font-serif text-3xl md:text-5xl leading-tight mb-10 max-w-3xl">Six reasons to tell me before you list it</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {REASONS.map((r, i) => (
                <div key={r.title} className="bg-white border border-black/[0.08] rounded-[1.25rem] p-7">
                  <span className="font-serif text-3xl text-gold-deep">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="font-serif text-2xl text-ink mt-3 mb-3">{r.title}</h3>
                  <p className="text-black/65 font-light leading-relaxed">{r.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Confidentiality promise */}
          <section className="p-8 md:p-14 bg-ink text-white rounded-[2rem] grid lg:grid-cols-12 gap-10">
            <div className="lg:col-span-5">
              <span className="w-12 h-12 rounded-full bg-gold/15 flex items-center justify-center mb-6">
                <Lock className="w-5 h-5 text-gold" />
              </span>
              <Eyebrow dark>My promise to you</Eyebrow>
              <h2 className="font-serif text-3xl md:text-5xl leading-tight mb-5">What you tell me stays with me</h2>
              <p className="text-white/60 font-light leading-relaxed">
                I know what happens when word gets out that a business is for sale: staff start looking for other jobs, the landlord gets
                ideas and competitors talk. So here's how I handle it.
              </p>
              <p className="mt-8 font-serif italic text-2xl text-gold">Shane</p>
            </div>
            <ul className="lg:col-span-7 space-y-4 self-center">
              {PROMISE.map((p) => (
                <li key={p} className="flex gap-3 text-white/80 leading-relaxed">
                  <Check className="w-5 h-5 text-gold shrink-0 mt-0.5" /> {p}
                </li>
              ))}
            </ul>
          </section>

          {/* What I buy + how it works */}
          <section className="grid lg:grid-cols-2 gap-10 lg:gap-16">
            <div>
              <Eyebrow>What I look for</Eyebrow>
              <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-6">The businesses I buy</h2>
              <ul className="space-y-3 mb-8">
                {WHAT_I_BUY.yes.map((x) => (
                  <li key={x} className="flex gap-3 text-black/70 font-light">
                    <Check className="w-4 h-4 text-gold-deep shrink-0 mt-1" /> {x}
                  </li>
                ))}
              </ul>
              <p className="text-[11px] uppercase tracking-[0.22em] text-black/45 mb-3">What I don't buy</p>
              <ul className="space-y-3">
                {WHAT_I_BUY.no.map((x) => (
                  <li key={x} className="flex gap-3 text-black/55 font-light">
                    <X className="w-4 h-4 text-black/35 shrink-0 mt-1" /> {x}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-black/50">Not sure it fits? Tell me anyway. One of the owners I know may want it.</p>
            </div>
            <div>
              <Eyebrow>How it works</Eyebrow>
              <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-6">Four steps, at your pace</h2>
              <ol className="space-y-6">
                {STEPS.map((s, i) => (
                  <li key={s.title} className="flex gap-5">
                    <span className="w-10 h-10 shrink-0 rounded-full border border-gold-deep/40 flex items-center justify-center font-serif text-lg text-gold-deep">{i + 1}</span>
                    <div>
                      <h3 className="font-serif text-xl text-ink mb-1">{s.title}</h3>
                      <p className="text-black/60 font-light leading-relaxed">{s.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* Main CTA: selling */}
          <section id="sell" className="max-w-4xl mx-auto scroll-mt-28 p-8 md:p-12 bg-cream border border-cream-line rounded-[2rem]">
            <Eyebrow>I have a business for sale</Eyebrow>
            <h2 className="font-serif text-3xl md:text-5xl leading-tight mb-4">Tell me about your business, in confidence</h2>
            <p className="text-black/60 font-light leading-relaxed max-w-2xl mb-6">
              A few lines is enough to start. You don't need to name the business. It helps if you can tell me:
            </p>
            <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2 mb-8 max-w-2xl">
              {WHAT_TO_SEND.map((x) => (
                <li key={x} className="flex gap-2.5 text-sm text-black/65">
                  <Check className="w-4 h-4 text-gold-deep shrink-0 mt-0.5" /> {x}
                </li>
              ))}
            </ul>
            <AskShane
              source="sell_business"
              initialTopic="business"
              showHeading={false}
              allowPublish={false}
              questionLabel="Tell me about the business. A few lines is fine."
              placeholder="e.g. A 60-seat restaurant in Jomtien, trading 6 years, about 1.5 million baht profit a year. 8 years left on the lease. I'm retiring and would like around 4 million."
              context={SELL_CONTEXT}
              contextNote="Only I read this. I won't share it with anyone without your OK."
            />
          </section>

          {/* Second CTA: buying */}
          <section id="buy" className="scroll-mt-28 grid lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-5">
              <Eyebrow>I want to buy a business</Eyebrow>
              <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-5">Looking to buy? Tell me what you want</h2>
              <p className="text-black/60 font-light leading-relaxed mb-6">
                Because owners tell me when they're thinking of selling, I often hear about good businesses before anyone else does. Tell
                me what you're looking for and your budget, and if I hear of something that fits, and the owner agrees, I'll put you in
                touch.
              </p>
              <p className="text-sm text-black/50 mb-3">Already found one?</p>
              <a
                href={BUYING_PATH}
                onClick={(e) => {
                  trackEvent("select_content", { content_type: "deal_check", source: "sell_page" });
                  handleLinkClick(e);
                }}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-ink text-white text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:bg-gold hover:text-ink transition-colors"
              >
                Check the deal <ArrowRight className="w-4 h-4" />
              </a>
              <p className="mt-6 text-sm text-black/50">
                Not sure you should buy one at all?{" "}
                <a href={BUSINESS_PATH} onClick={handleLinkClick} className="text-gold-deep hover:text-ink underline underline-offset-2">
                  Take the reality check
                </a>
                .
              </p>
            </div>
            <div className="lg:col-span-7 p-8 md:p-10 bg-white border border-black/[0.08] rounded-[1.5rem]">
              <AskShane
                source="buy_business"
                questionLabel="What kind of business are you looking for, where, and what's your budget?"
                initialTopic="business"
                showHeading={false}
                placeholder="e.g. I'm looking for a small bar or cafe in Jomtien or Pratumnak, budget around 2 million baht. I'd work in it myself."
                context={BUY_CONTEXT}
                contextNote="I'll keep your details on file and get in touch if something fits."
              />
            </div>
          </section>

          {/* FAQ */}
          <section className="max-w-4xl">
            <Eyebrow>Short answers</Eyebrow>
            <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-8">Selling your business: what owners ask me</h2>
            <div className="divide-y divide-black/10 border-y border-black/10">
              {SELL_FAQS.map((f) => (
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
          </section>

          {/* Closing CTA */}
          <div className="p-8 md:p-12 bg-ink rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif text-white mb-2">Thinking of selling, even one day?</h2>
              <p className="text-white/60 font-light">A short message now costs you nothing and stays between us.</p>
            </div>
            <a
              href="#sell"
              onClick={(e) => {
                e.preventDefault();
                jump("sell", "closing");
              }}
              className="shrink-0 inline-flex items-center gap-2 px-7 py-4 bg-gold text-ink text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:bg-white transition-colors"
            >
              I have a business for sale <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
