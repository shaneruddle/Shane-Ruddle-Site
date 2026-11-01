import { ArrowRight } from "lucide-react";
import { AREAS_PATH } from "../lib/areas";
import { handleLinkClick } from "../lib/navigation";
import { trackEvent } from "../lib/analytics";
import PattayaMap from "./PattayaMap";

// Link card to the /areas map and area finder, used on the homepage, the moving/family guides
// and the cost of living calculator.
export default function AreasPromo({ source }: { source: string }) {
  return (
    <a
      href={AREAS_PATH}
      onClick={(e) => {
        trackEvent("select_content", { content_type: "area_finder", source });
        handleLinkClick(e);
      }}
      className="group grid grid-cols-[88px_1fr] md:grid-cols-[120px_1fr_auto] items-center gap-6 md:gap-8 p-6 md:p-8 rounded-[1.5rem] border bg-ink text-white border-ink transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/20"
    >
      <span className="block rounded-xl overflow-hidden" aria-hidden>
        <PattayaMap active="pratumnak" title="Pattaya areas" interactive={false} />
      </span>
      <span>
        <span className="block text-[11px] uppercase tracking-[0.22em] text-gold mb-1.5">Area finder</span>
        <span className="block font-serif text-2xl md:text-3xl leading-snug text-white">Which part of Pattaya suits you?</span>
        <span className="block mt-1.5 text-sm text-white/55">Tap the map or answer four questions. Six areas, with rents and my honest verdict.</span>
      </span>
      <span className="col-span-2 md:col-span-1 inline-flex items-center gap-2 justify-self-start md:justify-self-auto px-6 py-3 bg-gold text-ink text-xs font-semibold uppercase tracking-[0.18em] rounded-full group-hover:bg-white transition-colors whitespace-nowrap">
        Find my area <ArrowRight className="w-4 h-4" />
      </span>
    </a>
  );
}
