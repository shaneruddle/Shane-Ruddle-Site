import { ArrowRight } from "lucide-react";
import { READY_PATH } from "../lib/ready";
import { handleLinkClick } from "../lib/navigation";
import { trackEvent } from "../lib/analytics";

/** Articles that show the readiness score card above Ask Shane. */
export const READY_PROMO_ARTICLES = new Set([
  "retiring-in-pattaya",
  "pattaya-for-digital-nomads",
  "what-i-wish-id-known-before-moving-to-thailand",
  "first-month-in-pattaya",
  "living-in-pattaya",
  "do-retirees-leave-pattaya",
  "healthcare-in-pattaya",
  "your-retirement-is-your-responsibility",
]);

// Link card to the /ready-for-pattaya readiness score, used on moving/retiring/nomad articles,
// the moving and families guides and the country pages.
export default function ReadyPromo({ source }: { source: string }) {
  return (
    <a
      href={READY_PATH}
      onClick={(e) => {
        trackEvent("select_content", { content_type: "readiness_score", source });
        handleLinkClick(e);
      }}
      className="group flex flex-col md:flex-row md:items-center justify-between gap-6 p-7 md:p-9 rounded-[1.5rem] border bg-ink border-ink text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/20"
    >
      <div className="flex items-center gap-6">
        <span className="shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-gold text-gold flex flex-col items-center justify-center leading-none" aria-hidden>
          <span className="font-serif text-xl">?</span>
          <span className="text-[9px] text-white/50 mt-0.5">/100</span>
        </span>
        <div>
          <span className="block text-[11px] uppercase tracking-[0.22em] text-gold mb-1.5">Readiness score</span>
          <span className="block font-serif text-2xl md:text-3xl leading-snug">Are you ready for Pattaya?</span>
          <span className="block mt-1.5 text-sm text-white/55">15 yes/no questions on money, visa, health, home and life. Get your score and what to fix first.</span>
        </div>
      </div>
      <span className="inline-flex items-center gap-2 self-start md:self-auto px-6 py-3 bg-gold text-ink text-xs font-semibold uppercase tracking-[0.18em] rounded-full group-hover:bg-white transition-colors whitespace-nowrap">
        Get my score <ArrowRight className="w-4 h-4" />
      </span>
    </a>
  );
}
