import { ArrowRight } from "lucide-react";
import { SCHOOLS_PATH } from "../lib/schools";
import { handleLinkClick } from "../lib/navigation";
import { trackEvent } from "../lib/analytics";

// Link card to the /international-schools-pattaya chooser, used on the homepage, the family guide,
// East Pattaya and school-related articles.
export default function SchoolsPromo({ source }: { source: string }) {
  return (
    <a
      href={SCHOOLS_PATH}
      onClick={(e) => {
        trackEvent("select_content", { content_type: "school_finder", source });
        handleLinkClick(e);
      }}
      className="group flex flex-col md:flex-row md:items-center justify-between gap-6 p-7 md:p-9 rounded-[1.5rem] border bg-cream border-cream-line transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/10"
    >
      <div className="flex items-center gap-6">
        <span className="shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-ink flex items-center justify-center" aria-hidden>
          <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none" stroke="#D4AF37" strokeWidth="1.6" strokeLinejoin="round">
            <path d="M3 12 16 6l13 6-13 6z" />
            <path d="M9 15v6c0 2 3.5 4 7 4s7-2 7-4v-6" />
            <path d="M29 12v8" />
          </svg>
        </span>
        <div>
          <span className="block text-[11px] uppercase tracking-[0.22em] text-gold-deep mb-1.5">School chooser</span>
          <span className="block font-serif text-2xl md:text-3xl leading-snug text-ink">Which international school suits your child?</span>
          <span className="block mt-1.5 text-sm text-black/55">Eight schools compared: 2026/27 fees, curriculum and the school run from your area.</span>
        </div>
      </div>
      <span className="inline-flex items-center gap-2 self-start md:self-auto px-6 py-3 bg-ink text-white text-xs font-semibold uppercase tracking-[0.18em] rounded-full group-hover:bg-gold group-hover:text-ink transition-colors whitespace-nowrap">
        Compare schools <ArrowRight className="w-4 h-4" />
      </span>
    </a>
  );
}
