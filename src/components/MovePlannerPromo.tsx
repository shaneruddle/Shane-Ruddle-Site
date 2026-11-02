import { ArrowRight } from "lucide-react";
import { MOVE_PATH } from "../lib/movePlan";
import { handleLinkClick } from "../lib/navigation";
import { trackEvent } from "../lib/analytics";

/** Articles that show the move planner card above Ask Shane. */
export const MOVE_PROMO_ARTICLES = new Set([
  "first-month-in-pattaya",
  "what-i-wish-id-known-before-moving-to-thailand",
  "living-in-pattaya",
  "retiring-in-pattaya",
  "is-pattaya-expensive",
  "best-area-to-live-in-pattaya",
  "renting-a-condo-in-pattaya",
]);

// Link card to the /move-to-thailand planner, used on the moving and family guides and moving articles.
export default function MovePlannerPromo({ source }: { source: string }) {
  return (
    <a
      href={MOVE_PATH}
      onClick={(e) => {
        trackEvent("select_content", { content_type: "move_planner", source });
        handleLinkClick(e);
      }}
      className="group flex flex-col md:flex-row md:items-center justify-between gap-6 p-7 md:p-9 rounded-[1.5rem] border bg-gold/15 border-gold/50 text-ink transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/10"
    >
      <div className="flex items-center gap-6">
        <span className="shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-full bg-ink text-gold flex items-center justify-center font-serif text-2xl" aria-hidden>
          6
        </span>
        <div>
          <span className="block text-[11px] uppercase tracking-[0.22em] text-gold-deep mb-1.5">Move planner</span>
          <span className="block font-serif text-2xl md:text-3xl leading-snug">Get your month-by-month moving plan</span>
          <span className="block mt-1.5 text-sm text-black/55">Six questions: your visa, area, budget and first-week checklist. Then I'll check it for you.</span>
        </div>
      </div>
      <span className="inline-flex items-center gap-2 self-start md:self-auto px-6 py-3 bg-ink text-white text-xs font-semibold uppercase tracking-[0.18em] rounded-full group-hover:bg-gold group-hover:text-ink transition-colors whitespace-nowrap">
        Plan my move <ArrowRight className="w-4 h-4" />
      </span>
    </a>
  );
}
