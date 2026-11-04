import { FormEvent, useState } from "react";
import { ArrowRight, Check, Mail } from "lucide-react";
import { trackEvent } from "../lib/analytics";

export type LeadSegment = "moving" | "retiring" | "property" | "business" | "visiting" | "work";

// "Email me my result": sits right after a tool's result. Posts to /api/email-result, which emails the
// visitor their result, adds them to the newsletter in Brevo (tagged with the tool and visitor type)
// and starts the welcome emails for their type of visit.
export default function EmailMyResult({
  tool,
  segment,
  title,
  summary,
  link,
  heading,
  blurb,
  dark = false,
}: {
  tool: string;
  segment: LeadSegment;
  title: string; // e.g. "Pattaya budget" -> "Email me my Pattaya budget"
  summary: string; // first line is the headline, the rest are detail lines
  link: string; // full https://shaneruddle.com URL that reopens this result
  heading?: string;
  blurb?: string;
  dark?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/email-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, firstName, tool, segment, title, summary, link, website }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Sorry, that didn't send. Please try again.");
      setStatus("done");
      trackEvent("generate_lead", { form: "email_result", form_location: tool, segment });
      trackEvent("sign_up", { method: "email_result", form_location: tool });
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Sorry, that didn't send. Please try again.");
    }
  };

  const field = dark
    ? "bg-white/[0.06] border-white/15 text-white placeholder:text-white/40 focus:border-gold"
    : "bg-white border-black/10 text-ink placeholder:text-black/35 focus:border-gold-deep";

  return (
    <div className={`rounded-[1.75rem] border p-7 md:p-9 ${dark ? "border-gold/30 bg-white/[0.04] text-white" : "border-gold/40 bg-cream text-ink"}`}>
      <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 items-center">
        <div>
          <span className={`inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] mb-3 ${dark ? "text-gold" : "text-gold-deep"}`}>
            <Mail className="w-3.5 h-3.5" /> Keep this
          </span>
          <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-2">{heading || `Email me my ${title}`}</h2>
          <p className={`font-light leading-relaxed ${dark ? "text-white/60" : "text-black/60"}`}>
            {blurb || "I'll send it to your inbox now, with a link to open it again. You'll also get my weekly email on life, property and business in Pattaya."}
          </p>
        </div>
        {status === "done" ? (
          <div className={`flex items-start gap-3 rounded-xl border p-5 ${dark ? "border-gold/30 bg-white/5 text-white/80" : "border-gold/40 bg-white text-black/70"}`}>
            <Check className="w-5 h-5 mt-0.5 shrink-0 text-gold" />
            <p className="text-sm leading-relaxed">Sent to {email}. It should arrive in a minute. If it doesn't, check your spam folder.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3" aria-label={`Email me my ${title}`}>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.4fr] gap-3">
              <input
                type="text"
                autoComplete="given-name"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={`border rounded-lg px-4 py-3 text-sm focus:outline-none transition-colors w-full ${field}`}
              />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`border rounded-lg px-4 py-3 text-sm focus:outline-none transition-colors w-full ${field}`}
              />
            </div>
            <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} className="hidden" aria-hidden />
            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full inline-flex items-center justify-center gap-2 bg-gold text-ink font-semibold py-3 rounded-lg text-xs uppercase tracking-[0.18em] hover:bg-gold-dark hover:text-white transition-colors disabled:opacity-50"
            >
              {status === "sending" ? "Sending…" : <>Email it to me <ArrowRight className="w-4 h-4" /></>}
            </button>
            {status === "error" && <p role="alert" className="text-sm text-danger">{error}</p>}
            <p className={`text-xs ${dark ? "text-white/40" : "text-black/45"}`}>Free. Unsubscribe any time.</p>
          </form>
        )}
      </div>
    </div>
  );
}
