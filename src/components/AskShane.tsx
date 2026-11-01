import { FormEvent, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { trackEvent } from "../lib/analytics";

// "Ask Shane": a three-step question flow (what are you planning → your question → your details).
// Replaces the plain contact form and sits inside every article. Posts to /api/contact, which
// emails Shane with the visitor's plan and the page they asked from.

export type AskTopic = "family" | "buying" | "renting" | "retiring" | "business" | "visiting" | "other";

const TOPICS: { id: AskTopic; label: string; heading: string; placeholder: string }[] = [
  {
    id: "family",
    label: "Moving with my family",
    heading: "Thinking of bringing your family to Pattaya?",
    placeholder: "e.g. We have two kids aged 7 and 10. Which area and school would you look at first?",
  },
  {
    id: "buying",
    label: "Buying property",
    heading: "Thinking of buying in Pattaya?",
    placeholder: "e.g. I have about 5 million baht. Condo or house, and which area would you pick?",
  },
  {
    id: "renting",
    label: "Renting a home",
    heading: "Looking for a place to rent?",
    placeholder: "e.g. What should I expect to pay for a 2-bed condo in Jomtien on a 12-month lease?",
  },
  {
    id: "retiring",
    label: "Retiring here",
    heading: "Thinking of retiring to Pattaya?",
    placeholder: "e.g. Is 60,000 baht a month enough for a comfortable life, healthcare included?",
  },
  {
    id: "business",
    label: "Business or investment",
    heading: "Thinking of doing business in Pattaya?",
    placeholder: "e.g. I'm looking at buying a bar. What should I check before I sign anything?",
  },
  {
    id: "visiting",
    label: "Visiting or getting around",
    heading: "Planning a trip to Pattaya?",
    placeholder: "e.g. Is it worth renting a car for a two-week family holiday, or should we use Grab?",
  },
  {
    id: "other",
    label: "Something else",
    heading: "Got a question for me?",
    placeholder: "Partnerships, press, speaking, or anything else on your mind.",
  },
];

// Picks the most likely topic for an article so readers start on step 2.
export function topicForArticle(slug = "", category = ""): AskTopic {
  const s = slug.toLowerCase();
  if (/famil|school|kids/.test(s)) return "family";
  if (/retir|healthcare/.test(s)) return "retiring";
  if (/buying-a-(condo|house)|selling|property|renting-out|agent/.test(s)) return "buying";
  if (/renting-a-condo|best-area|living-in|expensive/.test(s)) return "renting";
  if (/business|partner|staff|restaurant|seven|covid|failure|bar-manager|ai-in/.test(s)) return "business";
  if (/car|driving|scooter|airport|visit|beach|things-to-do|nightlife|golf|phuket|hua-hin/.test(s)) return "visiting";
  if (/property/i.test(category)) return "buying";
  if (/car rental/i.test(category)) return "visiting";
  return "other";
}

type Step = 1 | 2 | 3 | "done";

export default function AskShane({
  dark = false,
  source,
  initialTopic,
  showHeading = true,
  context,
  contextNote = "I'll see your calculator result with your question.",
}: {
  dark?: boolean;
  /** Where the form sits, for analytics and the email (e.g. "article", "homepage", "contact_page"). */
  source: string;
  /** Pre-selects a topic and opens on the question step. */
  initialTopic?: AskTopic;
  showHeading?: boolean;
  /** Extra detail sent with the question (e.g. a calculator result), shown to the visitor as a note. */
  context?: string;
  /** Note shown under the question box when `context` is sent. */
  contextNote?: string;
}) {
  const [topic, setTopic] = useState<AskTopic | null>(initialTopic ?? null);
  const [step, setStep] = useState<Step>(initialTopic ? 2 : 1);
  const [question, setQuestion] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [publishOk, setPublishOk] = useState(true);
  const [website, setWebsite] = useState(""); // honeypot, hidden from people
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const started = useRef(false);

  const current = TOPICS.find((t) => t.id === topic);

  const markStarted = () => {
    if (started.current) return;
    started.current = true;
    trackEvent("ask_start", { form_location: source, topic: topic ?? "none" });
  };

  const pickTopic = (id: AskTopic) => {
    setTopic(id);
    markStarted();
    trackEvent("ask_topic", { form_location: source, topic: id });
    setStep(2);
  };

  const toDetails = (e: FormEvent) => {
    e.preventDefault();
    if (question.trim().length < 5) return;
    trackEvent("ask_question", { form_location: source, topic });
    setStep(3);
  };

  const send = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          message: context ? `${question}\n\n---\n${context}` : question,
          topic: current?.label,
          page: window.location.pathname,
          source,
          publishOk,
          website,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Sorry, your question couldn't be sent. Please try again in a moment.");
      trackEvent("generate_lead", { form: "ask_shane", form_location: source, topic });
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sorry, your question couldn't be sent. Please try again in a moment.");
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setQuestion("");
    setStep(initialTopic ? 2 : 1);
    setTopic(initialTopic ?? null);
  };

  const muted = dark ? "text-white/60" : "text-black/60";
  const field = dark
    ? "bg-white/[0.04] border-white/15 text-white placeholder:text-white/35 focus:border-gold"
    : "bg-white border-black/10 text-ink placeholder:text-black/35 focus:border-gold-deep";
  const primary =
    "inline-flex items-center justify-center gap-2 bg-gold text-ink font-semibold px-7 py-3.5 rounded-full text-xs uppercase tracking-[0.18em] hover:bg-gold-dark hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
  const back = `inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] font-semibold ${dark ? "text-white/50 hover:text-gold" : "text-black/45 hover:text-gold-deep"} transition-colors`;

  return (
    <div className={dark ? "text-white" : "text-ink"}>
      {showHeading && (
        <div className="flex items-start sm:items-center gap-4 mb-8">
          <img
            src="/images/shane-portrait.webp"
            alt=""
            width={56}
            height={56}
            loading="lazy"
            className="w-11 h-11 sm:w-14 sm:h-14 rounded-full object-cover shrink-0 ring-2 ring-gold/60"
          />
          <div>
            <p className={`text-[11px] uppercase tracking-[0.25em] font-semibold mb-1 ${dark ? "text-gold" : "text-gold-deep"}`}>Ask Shane</p>
            <h2 className="font-serif text-[1.65rem] sm:text-3xl md:text-4xl leading-tight">
              {step !== "done" && current ? current.heading : "Ask me anything about Pattaya."}
            </h2>
          </div>
        </div>
      )}

      {step !== "done" && (
        <div className="flex items-center gap-2 mb-6" aria-hidden>
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={`h-1 rounded-full transition-all duration-300 ${n <= (step as number) ? "w-10 bg-gold" : `w-6 ${dark ? "bg-white/15" : "bg-black/10"}`}`}
            />
          ))}
          <span className={`ml-2 text-[11px] uppercase tracking-[0.18em] ${dark ? "text-white/40" : "text-black/40"}`}>Step {step} of 3</span>
        </div>
      )}

      <AnimatePresence mode="wait" initial={false}>
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <p className={`mb-5 ${muted}`}>What are you planning? I read every question myself and reply personally.</p>
            <div className="flex flex-wrap gap-2.5">
              {TOPICS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => pickTopic(t.id)}
                  className={`px-5 py-3 rounded-full border text-sm transition-all hover:-translate-y-0.5 ${
                    dark ? "border-white/20 hover:border-gold hover:text-gold" : "border-black/15 bg-white hover:border-gold-deep hover:text-gold-deep"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.form key="s2" onSubmit={toDetails} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <label htmlFor={`ask-q-${source}`} className={`block mb-3 ${muted}`}>
              What would you like to ask? The more detail you give, the more useful my answer will be.
            </label>
            <textarea
              id={`ask-q-${source}`}
              rows={4}
              required
              maxLength={context ? Math.max(500, 4990 - context.length) : 5000}
              value={question}
              onFocus={markStarted}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={current?.placeholder}
              className={`border rounded-2xl px-5 py-4 text-base focus:outline-none transition-colors w-full resize-none ${field}`}
            />
            {context && <p className={`mt-3 text-xs ${dark ? "text-white/45" : "text-black/45"}`}>{contextNote}</p>}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
              <button type="button" onClick={() => setStep(1)} className={back}>
                <ArrowLeft className="w-3.5 h-3.5" /> {current ? `Topic: ${current.label}` : "Back"}
              </button>
              <button type="submit" disabled={question.trim().length < 5} className={primary}>
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.form>
        )}

        {step === 3 && (
          <motion.form key="s3" onSubmit={send} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <p className={`mb-4 ${muted}`}>Where should I send my answer?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                autoComplete="name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`border rounded-xl px-4 py-3.5 text-sm focus:outline-none transition-colors w-full ${field}`}
              />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`border rounded-xl px-4 py-3.5 text-sm focus:outline-none transition-colors w-full ${field}`}
              />
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
            <label className={`mt-4 flex items-start gap-3 text-sm cursor-pointer ${muted}`}>
              <input
                type="checkbox"
                checked={publishOk}
                onChange={(e) => setPublishOk(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#D4AF37] shrink-0"
              />
              <span>You may answer my question in a future article. My name and email will never be shown.</span>
            </label>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <button type="button" onClick={() => setStep(2)} className={back}>
                <ArrowLeft className="w-3.5 h-3.5" /> Edit question
              </button>
              <button type="submit" disabled={sending} className={primary}>
                {sending ? "Sending…" : <>Send my question <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
            {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}
          </motion.form>
        )}

        {step === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-start gap-4 rounded-2xl border p-6 ${dark ? "border-gold/30 bg-white/5" : "border-gold/40 bg-cream"}`}
          >
            <span className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
              <Check className="w-5 h-5 text-gold" />
            </span>
            <div>
              <p className="font-serif text-2xl mb-1">Thanks{name ? `, ${name.split(" ")[0]}` : ""}. I've got your question.</p>
              <p className={`text-sm leading-relaxed ${muted}`}>
                I'll reply to {email || "your email"} personally, usually within a couple of days.
              </p>
              <button type="button" onClick={reset} className={`mt-4 ${back}`}>
                Ask another question
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
