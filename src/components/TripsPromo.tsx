import { ArrowRight } from "lucide-react";
import { TRIPS_PATH } from "../lib/trips";
import { handleLinkClick } from "../lib/navigation";
import { trackEvent } from "../lib/analytics";

/** Articles that show the trips card. */
export const TRIPS_PROMO_ARTICLES = new Set([
  "koh-chang-from-pattaya",
  "kanchanaburi-from-pattaya",
  "khao-yai-from-pattaya",
  "sukhothai-from-pattaya",
  "rayong-from-pattaya",
  "bang-saen-from-pattaya",
  "bang-saray-from-pattaya",
  "best-day-trips-from-pattaya",
  "renting-a-car-in-pattaya",
  "driving-in-pattaya",
  "is-pattaya-good-for-families",
]);

// Link card to /trips-from-pattaya, used on the trip articles, the car articles and the guides.
export default function TripsPromo({ source }: { source: string }) {
  return (
    <a
      href={TRIPS_PATH}
      onClick={(e) => {
        trackEvent("select_content", { content_type: "trip_finder", source });
        handleLinkClick(e);
      }}
      className="group flex flex-col md:flex-row md:items-center justify-between gap-6 p-7 md:p-9 rounded-[1.5rem] border bg-ink border-ink text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/10"
    >
      <div className="flex items-center gap-6">
        <img src="/images/shane-portrait.webp" alt="" width={64} height={64} loading="lazy" className="shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-full object-cover ring-2 ring-gold/60" />
        <div>
          <span className="block text-[11px] uppercase tracking-[0.22em] text-gold mb-1.5">Trips from Pattaya</span>
          <span className="block font-serif text-2xl md:text-3xl leading-snug">Where should we go?</span>
          <span className="block mt-1.5 text-sm text-white/55">My seven road trips, with drive times, how long to stay and what each one costs.</span>
        </div>
      </div>
      <span className="inline-flex items-center gap-2 self-start md:self-auto px-6 py-3 bg-gold text-ink text-xs font-semibold uppercase tracking-[0.18em] rounded-full group-hover:bg-white transition-colors whitespace-nowrap">
        Find a trip <ArrowRight className="w-4 h-4" />
      </span>
    </a>
  );
}
