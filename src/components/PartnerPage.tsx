import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Lock } from "lucide-react";
import {
  BRING_OPTIONS,
  CAPITAL_OPTIONS,
  EXPERIENCE_OPTIONS,
  FUNDS_OPTIONS,
  INVOLVEMENT_OPTIONS,
  LOOKING_FOR,
  PARTNER_META,
  PARTNER_PATH,
  PARTNER_STEPS,
  PARTNER_TOPIC,
  TIMING_OPTIONS,
  VENUE_POINTS,
  WHERE_OPTIONS,
} from "../lib/partner";
import { handleLinkClick } from "../lib/navigation";
import { trackEvent } from "../lib/analytics";
import { applyPageMeta } from "../seo";
import Noindex from "./Noindex";

// /partner: landing page for the "Business partnership opportunity" Facebook ad. The venue stays
// anonymous. The form asks enough to screen out people Shane wouldn't go into business with, and
// posts to /api/contact (email to Shane + contact_messages, so it shows in the portal Enquiries tab).

const Eyebrow = ({ children, dark = false }: { children: ReactNode; dark?: boolean }) => (
  <span className={`block text-[11px] font-medium uppercase tracking-[0.3em] mb-5 ${dark ? "text-gold" : "text-gold-deep"}`}>{children}</span>
);

const labelOf = (list: { id: string; label: string }[], id: string) => list.find((o) => o.id === id)?.label ?? id;

const MIN_ABOUT = 80;

function Choice({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-ink mb-3">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            aria-pressed={value === o.id}
            className={`px-4 py-2.5 rounded-full border text-sm transition-colors ${
              value === o.id ? "bg-ink border-ink text-white" : "bg-white border-black/10 text-black/70 hover:border-gold-deep"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function PartnerForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nationality, setNationality] = useState("");
  const [where, setWhere] = useState("");
  const [bring, setBring] = useState<string[]>([]);
  const [capital, setCapital] = useState("");
  const [experience, setExperience] = useState("");
  const [involvement, setInvolvement] = useState("");
  const [timing, setTiming] = useState("");
  const [funds, setFunds] = useState("");
  const [about, setAbout] = useState("");
  const [website, setWebsite] = useState(""); // honeypot, hidden from people
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const started = useRef(false);

  const markStarted = () => {
    if (started.current) return;
    started.current = true;
    trackEvent("partner_form_start", { form_location: "partner_page" });
  };

  const toggleBring = (id: string) => {
    markStarted();
    setBring((b) => (b.includes(id) ? b.filter((x) => x !== id) : [...b, id]));
  };

  const missing = [
    !where && "where you live",
    !bring.length && "what you'd bring",
    !capital && "how much you could invest",
    !experience && "your experience",
    !involvement && "how involved you'd want to be",
    !timing && "your timing",
    !funds && "proof of funds",
    about.trim().length < MIN_ABOUT && "a few lines about you",
  ].filter(Boolean) as string[];

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (missing.length) {
      setError(`Please also tell me ${missing.join(", ")}.`);
      return;
    }
    setSending(true);
    setError("");
    const message = [
      "Enquiry: BUSINESS PARTNER (from the /partner page, Facebook ad)",
      "",
      `Phone / WhatsApp: ${phone || "not given"}`,
      `Nationality: ${nationality || "not given"}`,
      `Lives: ${labelOf(WHERE_OPTIONS, where)}`,
      `Would bring: ${bring.map((b) => labelOf(BRING_OPTIONS, b)).join(", ")}`,
      `Capital to invest: ${labelOf(CAPITAL_OPTIONS, capital)}`,
      `Hospitality experience: ${labelOf(EXPERIENCE_OPTIONS, experience)}`,
      `Involvement: ${labelOf(INVOLVEMENT_OPTIONS, involvement)}`,
      `Timing: ${labelOf(TIMING_OPTIONS, timing)}`,
      `Can show proof of funds / track record: ${labelOf(FUNDS_OPTIONS, funds)}`,
      "",
      "About them and their ideas:",
      about.trim(),
    ].join("\n");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, topic: PARTNER_TOPIC, page: PARTNER_PATH, source: "partner", publishOk: false, website }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Sorry, that didn't send. Please try again.");
      trackEvent("generate_lead", { form: "partner", form_location: "partner_page", capital, involvement });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sorry, that didn't send. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const field = "border border-black/10 bg-white rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-gold-deep transition-colors w-full";

  if (sent) {
    return (
      <div className="flex items-start gap-4 rounded-2xl border border-gold-deep/30 bg-white p-6">
        <span className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
          <Check className="w-5 h-5 text-gold-deep" />
        </span>
        <div>
          <p className="font-serif text-2xl mb-1">Thank you{name ? `, ${name.split(" ")[0]}` : ""}. I've got your details.</p>
          <p className="text-sm text-black/60 leading-relaxed">
            I read every enquiry myself. If it looks like a good fit, I'll contact you at {email} to arrange a private conversation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={send} className="space-y-8">
      <div className="grid sm:grid-cols-2 gap-3">
        <input required autoComplete="name" placeholder="Your full name" value={name} onFocus={markStarted} onChange={(e) => setName(e.target.value)} className={field} />
        <input required type="email" autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
        <input required type="tel" autoComplete="tel" placeholder="WhatsApp or phone" value={phone} onChange={(e) => setPhone(e.target.value)} className={field} />
        <input required placeholder="Nationality" value={nationality} onChange={(e) => setNationality(e.target.value)} className={field} />
      </div>

      <Choice legend="Where do you live?" options={WHERE_OPTIONS} value={where} onChange={(v) => { markStarted(); setWhere(v); }} />

      <fieldset>
        <legend className="text-sm font-medium text-ink mb-3">What would you bring? Tick all that apply.</legend>
        <div className="flex flex-wrap gap-2">
          {BRING_OPTIONS.map((o) => {
            const on = bring.includes(o.id);
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => toggleBring(o.id)}
                aria-pressed={on}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border text-sm transition-colors ${
                  on ? "bg-ink border-ink text-white" : "bg-white border-black/10 text-black/70 hover:border-gold-deep"
                }`}
              >
                {on && <Check className="w-3.5 h-3.5 text-gold" />} {o.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <Choice legend="How much could you invest?" options={CAPITAL_OPTIONS} value={capital} onChange={setCapital} />
      <Choice legend="Your hospitality experience" options={EXPERIENCE_OPTIONS} value={experience} onChange={setExperience} />
      <Choice legend="How involved would you want to be?" options={INVOLVEMENT_OPTIONS} value={involvement} onChange={setInvolvement} />
      <Choice legend="When could you start?" options={TIMING_OPTIONS} value={timing} onChange={setTiming} />
      <Choice
        legend="If we go further, could you show proof of funds or your track record?"
        options={FUNDS_OPTIONS}
        value={funds}
        onChange={setFunds}
      />

      <div>
        <label htmlFor="partner-about" className="block text-sm font-medium text-ink mb-3">
          Tell me about yourself, your background and what you'd do with the business
        </label>
        <textarea
          id="partner-about"
          rows={6}
          maxLength={3000}
          placeholder="e.g. I ran a 120-seat restaurant in Spain for 8 years and sold it last year. I'm moving to Pattaya in March. I'd like to be involved day to day and I see a lot of potential in events and private functions."
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          className={`${field} resize-y`}
        />
        <p className={`mt-2 text-xs ${about.trim().length >= MIN_ABOUT ? "text-black/40" : "text-black/50"}`}>
          {about.trim().length >= MIN_ABOUT ? "Thanks, that's plenty to start with." : `A few proper lines, please (at least ${MIN_ABOUT} characters).`}
        </p>
      </div>

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

      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <p className="flex items-start gap-2 text-xs text-black/45 max-w-sm">
          <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Only I see this. See my{" "}
            <a href="/privacy" onClick={handleLinkClick} className="underline hover:text-ink">privacy policy</a>.
          </span>
        </p>
        <button
          type="submit"
          disabled={sending}
          className="inline-flex items-center justify-center gap-2 bg-gold text-ink font-semibold px-7 py-4 rounded-full text-xs uppercase tracking-[0.18em] hover:bg-ink hover:text-white transition-colors disabled:opacity-40"
        >
          {sending ? "Sending…" : <>Send my details <ArrowRight className="w-4 h-4" /></>}
        </button>
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </form>
  );
}

export default function PartnerPage() {
  useEffect(() => {
    applyPageMeta(PARTNER_META);
  }, []);

  const toForm = (from: string) => {
    trackEvent("select_content", { content_type: "partner_form_cta", source: from });
    document.getElementById("apply")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <Noindex />
      {/* Hero */}
      <section className="bg-ink text-white pt-28 md:pt-36 pb-16 md:pb-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <Eyebrow dark>Business partnership opportunity · Pattaya</Eyebrow>
          <h1 className="font-serif font-normal text-[2.6rem] sm:text-6xl lg:text-7xl leading-[1.04] tracking-tight mb-6 max-w-5xl">
            Looking for a partner to <span className="italic text-gold">move the business forward.</span>
          </h1>
          <p className="text-lg md:text-xl text-white/65 font-light leading-relaxed max-w-2xl mb-8">
            I'm exploring the possibility of bringing a business partner into an established hospitality business in the Pattaya area. I'm
            open to different partnership structures, and I'd like to speak with like-minded entrepreneurs who have the experience, ideas,
            investment capital or resources to help it grow.
          </p>
          <div className="flex flex-wrap gap-3 mb-10">
            <a
              href="#apply"
              onClick={(e) => {
                e.preventDefault();
                toForm("hero");
              }}
              className="inline-flex items-center gap-2 px-7 py-4 bg-gold text-ink text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:bg-white transition-colors"
            >
              Tell me about yourself <ArrowRight className="w-4 h-4" />
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
              <Lock className="w-4 h-4 text-gold" /> Genuine enquiries only. Details shared privately.
            </span>
          </div>
        </div>
      </section>

      <div className="bg-paper px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto space-y-16 md:space-y-24">
          {/* The business */}
          <section>
            <Eyebrow>The business</Eyebrow>
            <h2 className="font-serif text-3xl md:text-5xl leading-tight mb-10 max-w-3xl">An established business, not a start-up</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {VENUE_POINTS.map((p, i) => (
                <div key={p.title} className="bg-white border border-black/[0.08] rounded-[1.25rem] p-7">
                  <span className="font-serif text-3xl text-gold-deep">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="font-serif text-2xl text-ink mt-3 mb-3">{p.title}</h3>
                  <p className="text-black/65 font-light leading-relaxed">{p.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Who + how */}
          <section className="grid lg:grid-cols-2 gap-10 lg:gap-16">
            <div>
              <Eyebrow>Who I'm looking for</Eyebrow>
              <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-6">Someone who brings something valuable to the table</h2>
              <ul className="space-y-3">
                {LOOKING_FOR.map((x) => (
                  <li key={x} className="flex gap-3 text-black/70 font-light">
                    <Check className="w-4 h-4 text-gold-deep shrink-0 mt-1" /> {x}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <Eyebrow>What happens next</Eyebrow>
              <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-6">Three steps</h2>
              <ol className="space-y-6">
                {PARTNER_STEPS.map((s, i) => (
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

          {/* Form */}
          <section id="apply" className="max-w-4xl mx-auto scroll-mt-28 p-8 md:p-12 bg-cream border border-cream-line rounded-[2rem]">
            <Eyebrow>Interested?</Eyebrow>
            <h2 className="font-serif text-3xl md:text-5xl leading-tight mb-4">Tell me about yourself</h2>
            <p className="text-black/60 font-light leading-relaxed max-w-2xl mb-10">
              Please answer every question. It helps me see quickly whether we'd be a good fit, and it means the first conversation can be a
              useful one.
            </p>
            <PartnerForm />
          </section>
        </div>
      </div>
    </>
  );
}
