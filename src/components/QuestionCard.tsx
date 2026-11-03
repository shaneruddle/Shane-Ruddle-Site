import { ArrowRight } from "lucide-react";
import { QUESTIONS_PATH, ShaneQuestion, topicById } from "../lib/questions";
import { handleLinkClick } from "../lib/navigation";
import { trackEvent } from "../lib/analytics";

// One question as a card (question, who asked, one-line answer). Used on /questions, the homepage and articles.

/** A question as a card: the question, who asked, the one-line answer. */
export default function QuestionCard({ q, source, dark = false }: { q: ShaneQuestion; source: string; dark?: boolean }) {
  return (
    <a
      href={`${QUESTIONS_PATH}/${q.slug}`}
      onClick={(e) => {
        trackEvent("select_question", { question: q.slug, topic: q.topic, source });
        handleLinkClick(e);
      }}
      className={`group flex flex-col h-full p-6 md:p-7 rounded-[1.25rem] border transition-all duration-300 ${
        dark
          ? "bg-white/[0.04] border-white/10 hover:border-gold/70"
          : "bg-white border-black/[0.08] hover:border-gold/60 hover:shadow-xl hover:shadow-black/[0.06]"
      }`}
    >
      <span className={`text-[10px] uppercase tracking-[0.22em] mb-3 ${dark ? "text-white/45" : "text-black/45"}`}>
        {topicById(q.topic).label} · Asked by {q.askedBy}
      </span>
      <span className={`font-serif text-[1.45rem] leading-snug mb-3 transition-colors ${dark ? "text-white group-hover:text-gold" : "text-ink group-hover:text-gold-deep"}`}>
        “{q.q}”
      </span>
      <span className={`text-[15px] leading-relaxed font-light mb-5 ${dark ? "text-white/60" : "text-black/60"}`}>{q.short}</span>
      <span className={`mt-auto inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] ${dark ? "text-gold" : "text-gold-deep"}`}>
        My full answer <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
      </span>
    </a>
  );
}

