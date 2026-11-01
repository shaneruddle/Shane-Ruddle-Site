import { ArrowRight } from "lucide-react";
import { CALCULATOR_PATH } from "../lib/costOfLiving";
import { handleLinkClick } from "../lib/navigation";
import { trackEvent } from "../lib/analytics";

// Link card to the cost of living calculator, used on the homepage and the moving/family guides.
export default function CalculatorPromo({ source, dark = false }: { source: string; dark?: boolean }) {
  return (
    <a
      href={CALCULATOR_PATH}
      onClick={(e) => {
        trackEvent("select_content", { content_type: "cost_calculator", source });
        handleLinkClick(e);
      }}
      className={`group flex flex-col md:flex-row md:items-center justify-between gap-6 p-7 md:p-9 rounded-[1.5rem] border transition-all duration-300 hover:-translate-y-0.5 ${
        dark ? "bg-white/[0.04] border-white/10 hover:border-gold/70" : "bg-ink text-white border-ink hover:shadow-xl hover:shadow-black/20"
      }`}
    >
      <div className="flex items-center gap-6">
        <span className="font-serif text-5xl md:text-6xl text-gold leading-none shrink-0">฿</span>
        <div>
          <span className="block text-[11px] uppercase tracking-[0.22em] text-gold mb-1.5">Cost of living calculator</span>
          <span className="block font-serif text-2xl md:text-3xl leading-snug text-white">What would it cost you to live in Pattaya?</span>
          <span className="block mt-1.5 text-sm text-white/55">Your monthly budget in under a minute, in baht, £, $, €, A$ or ₽.</span>
        </div>
      </div>
      <span className="inline-flex items-center gap-2 self-start md:self-auto px-6 py-3 bg-gold text-ink text-xs font-semibold uppercase tracking-[0.18em] rounded-full group-hover:bg-white transition-colors whitespace-nowrap">
        Work it out <ArrowRight className="w-4 h-4" />
      </span>
    </a>
  );
}
