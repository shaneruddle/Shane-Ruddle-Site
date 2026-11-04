import { ArrowUpRight, Star } from "lucide-react";
import { trackEvent } from "../lib/analytics";

// Google ratings for Shane's businesses: social proof on the homepage.
// Figures from each business's Google Business Profile. Update RATINGS_AS_OF when you refresh them.
export const RATINGS_AS_OF = "November 2026";

const maps = (placeId: string) => `https://www.google.com/maps/place/?q=place_id:${placeId}`;
const cid = (id: string) => `https://www.google.com/maps?cid=${id}`;

const RATINGS: { name: string; kind: string; rating: number; count: number; href: string }[] = [
  { name: "Pattaya Rent a Car", kind: "Car rental", rating: 4.9, count: 1367, href: maps("ChIJz64hZEKWAjER5Tj4QtUkkDU") },
  { name: "Alan Bolton Property", kind: "Property sales", rating: 4.9, count: 394, href: maps("ChIJ4bX_Vg6WAjERZKDkp-uIOH4") },
  { name: "East Coast Real Estate", kind: "Rentals", rating: 4.8, count: 402, href: maps("ChIJX6Txf4aVAjERr8PkyFaIrMI") },
  { name: "Cajun Life Cafe", kind: "Cafe", rating: 4.7, count: 1118, href: maps("ChIJ0SjABVyXAjERlZZWVM_TeKE") },
  { name: "Hemingways Jomtien", kind: "Restaurant & bar", rating: 4.4, count: 1195, href: cid("15726537092181226472") },
  { name: "Hemingways Pattaya", kind: "Sports bar", rating: 4.4, count: 627, href: cid("4935766242541695430") },
  { name: "Hemingways Lakeside", kind: "Restaurant & bar", rating: 4.4, count: 398, href: cid("5062787803008816586") },
];

const TOTAL = RATINGS.reduce((n, r) => n + r.count, 0);
const fmt = (n: number) => n.toLocaleString("en-US");

export default function GoogleRatings() {
  return (
    <div className="rounded-[1.75rem] bg-ink text-white p-7 md:p-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <span className="block text-[11px] uppercase tracking-[0.25em] text-gold mb-3">What customers say</span>
          <p className="font-serif text-3xl md:text-4xl leading-tight">
            {fmt(Math.floor(TOTAL / 100) * 100)}+ Google reviews <span className="italic text-gold">across my businesses.</span>
          </p>
        </div>
        <p className="text-xs text-white/40 md:whitespace-nowrap">Google ratings, {RATINGS_AS_OF}</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {RATINGS.map((r) => (
          <a
            key={r.name}
            href={r.href}
            target="_blank"
            rel="noopener"
            onClick={() => trackEvent("select_content", { content_type: "google_reviews", item_id: r.name })}
            className="group flex flex-col p-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-gold/60 transition-colors"
          >
            <span className="flex items-center gap-1.5 font-serif text-3xl text-gold leading-none mb-2">
              {r.rating.toFixed(1)} <Star className="w-4 h-4 fill-gold text-gold" aria-hidden />
            </span>
            <span className="text-sm text-white leading-snug group-hover:text-gold transition-colors">{r.name}</span>
            <span className="text-xs text-white/45 mt-1">{fmt(r.count)} reviews</span>
            <span className="mt-auto pt-3 inline-flex items-center gap-1 text-[11px] text-white/40 group-hover:text-gold">
              Read them <ArrowUpRight className="w-3 h-3" />
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
