import { ArrowRight } from "lucide-react";
import { WORK_PATH } from "../lib/work";
import { handleLinkClick } from "../lib/navigation";
import { trackEvent } from "../lib/analytics";

/** Articles that show the "Working in Pattaya" card above Ask Shane. */
export const WORK_PROMO_ARTICLES = new Set([
  "finding-a-job-in-pattaya",
  "teaching-english-in-pattaya",
  "working-in-hospitality-in-pattaya",
  "working-as-a-property-agent-in-pattaya",
  "hiring-foreign-staff-in-pattaya",
  "pattaya-for-digital-nomads",
]);

// Link card to /work-in-pattaya, used on the business guide and the work articles.
export default function WorkPromo({ source }: { source: string }) {
  return (
    <a
      href={WORK_PATH}
      onClick={(e) => {
        trackEvent("select_content", { content_type: "work_page", source });
        handleLinkClick(e);
      }}
      className="group flex flex-col md:flex-row md:items-center justify-between gap-6 p-7 md:p-9 rounded-[1.5rem] border bg-ink border-ink text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/10"
    >
      <div className="flex items-center gap-6">
        <img src="/images/shane-portrait.webp" alt="" width={64} height={64} loading="lazy" className="shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-full object-cover ring-2 ring-gold/60" />
        <div>
          <span className="block text-[11px] uppercase tracking-[0.22em] text-gold mb-1.5">Working in Pattaya</span>
          <span className="block font-serif text-2xl md:text-3xl leading-snug">Would I hire you?</span>
          <span className="block mt-1.5 text-sm text-white/55">Six questions from an owner who hires, a job offer checker, and a place to send me your CV.</span>
        </div>
      </div>
      <span className="inline-flex items-center gap-2 self-start md:self-auto px-6 py-3 bg-gold text-ink text-xs font-semibold uppercase tracking-[0.18em] rounded-full group-hover:bg-white transition-colors whitespace-nowrap">
        Check my chances <ArrowRight className="w-4 h-4" />
      </span>
    </a>
  );
}
