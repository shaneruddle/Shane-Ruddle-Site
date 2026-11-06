import { ArrowRight } from "lucide-react";
import { COUNTRY_PICKS } from "../lib/countries";
import { handleLinkClick } from "../lib/navigation";
import { trackEvent } from "../lib/analytics";

/** "Where are you moving from?" flag chips linking to each country guide (and the German edition). */
export default function CountryPicker({ source, dark = false, exclude, label = "Where are you moving from?" }: { source: string; dark?: boolean; exclude?: string; label?: string }) {
  const picks = COUNTRY_PICKS.filter((p) => p.id !== exclude);
  return (
    <div>
      <span className={`block text-[11px] uppercase tracking-[0.25em] mb-3 ${dark ? "text-white/55" : "text-black/50"}`}>{label}</span>
      <div className="flex flex-wrap gap-2.5">
        {picks.map((p) => (
          <a
            key={p.id}
            href={p.href}
            onClick={(e) => {
              trackEvent("select_content", { content_type: "country_guide", item: p.id, source });
              handleLinkClick(e);
            }}
            className={`group inline-flex items-center gap-2.5 pl-2 pr-4 py-2 rounded-full border text-sm transition-colors ${
              dark ? "border-white/20 text-white hover:border-gold hover:text-gold" : "border-black/15 bg-white text-ink hover:border-gold-deep hover:text-gold-deep"
            }`}
          >
            <img src={p.flag} alt="" width={28} height={20} className="w-7 h-5 rounded-[3px] object-cover shadow-sm" />
            {p.label}
            <ArrowRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </a>
        ))}
      </div>
    </div>
  );
}
