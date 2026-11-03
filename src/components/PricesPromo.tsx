import { ArrowRight } from "lucide-react";
import { PRICES_PATH } from "../lib/prices";
import { handleLinkClick } from "../lib/navigation";
import { trackEvent } from "../lib/analytics";

/** Articles that show the fair price checker card above Ask Shane. */
export const PRICES_PROMO_ARTICLES = new Set([
  "getting-around-pattaya",
  "bangkok-airport-to-pattaya",
  "is-pattaya-expensive",
  "nightlife-in-pattaya",
  "walking-street-pattaya",
  "things-to-do-in-pattaya",
  "best-beaches-in-pattaya",
  "best-day-trips-from-pattaya",
  "scooter-or-car-in-pattaya",
  "renting-a-car-in-pattaya",
  "is-pattaya-safe",
  "where-to-stay-in-pattaya",
  "best-time-to-visit-pattaya",
  "first-month-in-pattaya",
]);

// Link card to /pattaya-prices, used on the visitor and getting-around articles.
export default function PricesPromo({ source }: { source: string }) {
  return (
    <a
      href={PRICES_PATH}
      onClick={(e) => {
        trackEvent("select_content", { content_type: "price_checker", source });
        handleLinkClick(e);
      }}
      className="group flex flex-col md:flex-row md:items-center justify-between gap-6 p-7 md:p-9 rounded-[1.5rem] border bg-ink border-ink text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/10"
    >
      <div className="flex items-center gap-6">
        <img src="/images/shane-portrait.webp" alt="" width={64} height={64} loading="lazy" className="shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-full object-cover ring-2 ring-gold/60" />
        <div>
          <span className="block text-[11px] uppercase tracking-[0.22em] text-gold mb-1.5">Fair price checker</span>
          <span className="block font-serif text-2xl md:text-3xl leading-snug">Am I paying too much?</span>
          <span className="block mt-1.5 text-sm text-white/55">Type in a quote for a taxi, a beer, a massage or a rental and get a straight answer.</span>
        </div>
      </div>
      <span className="inline-flex items-center gap-2 self-start md:self-auto px-6 py-3 bg-gold text-ink text-xs font-semibold uppercase tracking-[0.18em] rounded-full group-hover:bg-white transition-colors whitespace-nowrap">
        Check a price <ArrowRight className="w-4 h-4" />
      </span>
    </a>
  );
}
