import { FormEvent, useState } from "react";
import { ArrowRight, Check } from "lucide-react";

// Email sign-up for the newsletter. Posts to /api/newsletter, which adds the contact to Brevo.
export default function NewsletterSignup({
  dark = false,
  source = "website",
}: {
  dark?: boolean;
  source?: string;
}) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, firstName, source }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Could not subscribe right now. Please try again.");
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not subscribe right now. Please try again.");
    }
  };

  const field = dark
    ? "bg-white/[0.04] border-white/15 text-white placeholder:text-white/40 focus:border-gold"
    : "bg-white border-black/10 text-ink placeholder:text-black/35 focus:border-gold-deep";

  if (status === "done") {
    return (
      <div className={`flex items-start gap-3 rounded-xl border p-5 ${dark ? "border-gold/30 bg-white/5 text-white/80" : "border-gold/40 bg-cream text-black/70"}`}>
        <Check className="w-5 h-5 mt-0.5 shrink-0 text-gold" />
        <p className="text-sm leading-relaxed">You're on the list. The next issue will land in your inbox.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3" aria-label="Newsletter sign-up">
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
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full inline-flex items-center justify-center gap-2 bg-gold text-ink font-semibold py-3 rounded-lg text-xs uppercase tracking-[0.18em] hover:bg-gold-dark hover:text-white transition-colors disabled:opacity-50"
      >
        {status === "sending" ? "Subscribing…" : <>Subscribe <ArrowRight className="w-4 h-4" /></>}
      </button>
      {status === "error" && <p role="alert" className="text-sm text-danger">{error}</p>}
      <p className={`text-xs ${dark ? "text-white/40" : "text-black/45"}`}>One email a week. Unsubscribe any time.</p>
    </form>
  );
}
