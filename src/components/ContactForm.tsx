import { FormEvent, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

const THANKS = "Thank you very much for getting in touch, I will get back to you as soon as possible. Thank you! Shane Ruddle";

// Contact form used in the site footer (dark) and on the /contact page (light). Posts to /api/contact.
export default function ContactForm({ dark = true }: { dark?: boolean }) {
  const [formState, setFormState] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      });
      if (!response.ok) throw new Error("Failed to send message");
      setSubmitted(true);
      toast.success(THANKS);
      setFormState({ name: "", email: "", message: "" });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      console.error("Error sending contact form:", err instanceof Error ? err.message : "Unknown error");
      setError("Sorry, your message couldn't be sent. Please try again in a moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const field = dark
    ? "bg-white/[0.04] border-white/15 text-white placeholder:text-white/40 focus:border-gold"
    : "bg-white border-black/10 text-ink placeholder:text-black/35 focus:border-gold-deep";

  return (
    <AnimatePresence mode="wait">
      {submitted ? (
        <motion.div
          key="success-message"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`p-8 border border-gold/30 rounded-2xl text-center ${dark ? "bg-white/5" : "bg-cream"}`}
        >
          <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-6 h-6 text-gold" />
          </div>
          <p className={`text-sm font-light leading-relaxed mb-8 ${dark ? "text-white/70" : "text-black/70"}`}>{THANKS}</p>
          <button
            onClick={() => setSubmitted(false)}
            className="text-[10px] uppercase tracking-widest font-bold text-gold hover:text-gold-dark transition-colors"
          >
            Send another message
          </button>
        </motion.div>
      ) : (
        <motion.form
          key="contact-form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onSubmit={handleFormSubmit}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Name"
              required
              value={formState.name}
              onChange={(e) => setFormState({ ...formState, name: e.target.value })}
              className={`border rounded-lg px-4 py-3 text-sm font-light focus:outline-none transition-colors w-full ${field}`}
            />
            <input
              type="email"
              placeholder="Email"
              required
              value={formState.email}
              onChange={(e) => setFormState({ ...formState, email: e.target.value })}
              className={`border rounded-lg px-4 py-3 text-sm font-light focus:outline-none transition-colors w-full ${field}`}
            />
          </div>
          <textarea
            placeholder="Message"
            required
            rows={4}
            value={formState.message}
            onChange={(e) => setFormState({ ...formState, message: e.target.value })}
            className={`border rounded-lg px-4 py-3 text-sm font-light focus:outline-none transition-colors w-full resize-none ${field}`}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full bg-gold text-black font-bold py-3 rounded-lg text-xs uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed ${dark ? "hover:bg-white" : "hover:bg-gold-dark hover:text-white"}`}
          >
            {isSubmitting ? "Sending..." : "Send Message"}
          </button>
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        </motion.form>
      )}
    </AnimatePresence>
  );
}
