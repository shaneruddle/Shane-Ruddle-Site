import { ArrowRight } from "lucide-react";
import { VISAS_PATH } from "../lib/visas";
import { handleLinkClick } from "../lib/navigation";
import { trackEvent } from "../lib/analytics";

// Link card to the /thai-visas finder, used on the homepage, the moving guide and visa-related articles.
export default function VisaPromo({ source }: { source: string }) {
  return (
    <a
      href={VISAS_PATH}
      onClick={(e) => {
        trackEvent("select_content", { content_type: "visa_finder", source });
        handleLinkClick(e);
      }}
      className="group flex flex-col md:flex-row md:items-center justify-between gap-6 p-7 md:p-9 rounded-[1.5rem] border bg-ink text-white border-ink transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/20"
    >
      <div className="flex items-center gap-6">
        <span className="shrink-0 w-14 h-[4.5rem] md:w-16 md:h-20 rounded-lg border-2 border-gold/70 flex flex-col items-center justify-center gap-1" aria-hidden>
          <span className="w-6 h-6 rounded-full border-2 border-gold/70" />
          <span className="text-[8px] font-semibold tracking-[0.2em] text-gold">VISA</span>
        </span>
        <div>
          <span className="block text-[11px] uppercase tracking-[0.22em] text-gold mb-1.5">Visa finder</span>
          <span className="block font-serif text-2xl md:text-3xl leading-snug text-white">Which Thai visa is right for you?</span>
          <span className="block mt-1.5 text-sm text-white/55">Six questions. Retirement, DTV, Privilege, LTR, business, marriage or education.</span>
        </div>
      </div>
      <span className="inline-flex items-center gap-2 self-start md:self-auto px-6 py-3 bg-gold text-ink text-xs font-semibold uppercase tracking-[0.18em] rounded-full group-hover:bg-white transition-colors whitespace-nowrap">
        Find my visa <ArrowRight className="w-4 h-4" />
      </span>
    </a>
  );
}
