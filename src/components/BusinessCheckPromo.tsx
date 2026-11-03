import { ArrowRight } from "lucide-react";
import { BUSINESS_PATH } from "../lib/businessCheck";
import { handleLinkClick } from "../lib/navigation";
import { trackEvent } from "../lib/analytics";

/** Articles that show the business reality check card above Ask Shane. */
export const BUSINESS_PROMO_ARTICLES = new Set([
  "starting-or-buying-a-business-in-pattaya",
  "running-a-restaurant-and-bar-in-pattaya",
  "business-partners-in-pattaya",
  "my-biggest-business-failure",
  "bar-manager-to-7-businesses",
  "how-i-run-seven-businesses",
  "hiring-foreign-staff-in-pattaya",
  "managing-thai-staff",
]);

// Link card to the /business-in-pattaya reality check, used on the business guide and business articles.
export default function BusinessCheckPromo({ source }: { source: string }) {
  return (
    <a
      href={BUSINESS_PATH}
      onClick={(e) => {
        trackEvent("select_content", { content_type: "business_check", source });
        handleLinkClick(e);
      }}
      className="group flex flex-col md:flex-row md:items-center justify-between gap-6 p-7 md:p-9 rounded-[1.5rem] border bg-gold/15 border-gold/50 text-ink transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/10"
    >
      <div className="flex items-center gap-6">
        <span className="shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-full bg-ink text-gold flex items-center justify-center font-serif text-2xl" aria-hidden>
          ฿
        </span>
        <div>
          <span className="block text-[11px] uppercase tracking-[0.22em] text-gold-deep mb-1.5">Business reality check</span>
          <span className="block font-serif text-2xl md:text-3xl leading-snug">Should you open a business in Pattaya?</span>
          <span className="block mt-1.5 text-sm text-black/55">Six questions, then my honest verdict: what it costs, the red flags, and what to check before you sign.</span>
        </div>
      </div>
      <span className="inline-flex items-center gap-2 self-start md:self-auto px-6 py-3 bg-ink text-white text-xs font-semibold uppercase tracking-[0.18em] rounded-full group-hover:bg-gold group-hover:text-ink transition-colors whitespace-nowrap">
        Check my idea <ArrowRight className="w-4 h-4" />
      </span>
    </a>
  );
}
