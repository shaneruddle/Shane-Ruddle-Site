import { ArrowRight } from "lucide-react";
import { FUTURE_PATH } from "../lib/future";
import { handleLinkClick } from "../lib/navigation";
import { trackEvent } from "../lib/analytics";

/** Articles that show the "what's being built" card. */
export const FUTURE_PROMO_ARTICLES = new Set([
  "where-pattaya-is-heading",
  "pattaya-property-market",
  "buying-a-condo-in-pattaya",
  "best-area-to-live-in-pattaya",
  "renting-out-your-condo-in-pattaya",
  "pattaya-traffic",
]);

// Link card to /pattaya-future, used on the area pages, the buying guide and property articles.
export default function FuturePromo({ source }: { source: string }) {
  return (
    <a
      href={FUTURE_PATH}
      onClick={(e) => {
        trackEvent("select_content", { content_type: "pattaya_future", source });
        handleLinkClick(e);
      }}
      className="group flex flex-col md:flex-row md:items-center justify-between gap-6 p-7 md:p-9 rounded-[1.5rem] border bg-ink border-ink text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/10"
    >
      <div className="flex items-center gap-6">
        <img src="/images/shane-portrait.webp" alt="" width={64} height={64} loading="lazy" className="shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-full object-cover ring-2 ring-gold/60" />
        <div>
          <span className="block text-[11px] uppercase tracking-[0.22em] text-gold mb-1.5">Pattaya's future</span>
          <span className="block font-serif text-2xl md:text-3xl leading-snug">What's really being built?</span>
          <span className="block mt-1.5 text-sm text-white/55">U-Tapao, the rail link, the monorail and every new condo: honest status and what each one means.</span>
        </div>
      </div>
      <span className="inline-flex items-center gap-2 self-start md:self-auto px-6 py-3 bg-gold text-ink text-xs font-semibold uppercase tracking-[0.18em] rounded-full group-hover:bg-white transition-colors whitespace-nowrap">
        See the timeline <ArrowRight className="w-4 h-4" />
      </span>
    </a>
  );
}
