import { BUSINESS_PATH } from "../lib/businessCheck";
import { BUYING_PATH } from "../lib/dealCheck";
import { SELL_PATH } from "../lib/sellBusiness";
import { handleLinkClick } from "../lib/navigation";

// Switches between the pages of the business chapter: the reality check, buying and selling a business.
export default function BusinessTabs({ active }: { active: "check" | "buying" | "selling" }) {
  const tabs = [
    { id: "check", label: "Reality check", short: "Reality check", href: BUSINESS_PATH },
    { id: "buying", label: "Buying a business", short: "Buying", href: BUYING_PATH },
    { id: "selling", label: "Selling a business", short: "Selling", href: SELL_PATH },
  ] as const;
  return (
    <nav aria-label="Doing business in Pattaya" className="inline-flex p-1 mb-10 rounded-full border border-white/15 bg-white/[0.04]">
      {tabs.map((t) => (
        <a
          key={t.id}
          href={t.href}
          onClick={handleLinkClick}
          aria-current={active === t.id ? "page" : undefined}
          className={`px-3.5 sm:px-5 py-2 rounded-full text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors ${
            active === t.id ? "bg-gold text-ink" : "text-white/60 hover:text-white"
          }`}
        >
          <span className="sm:hidden">{t.short}</span>
          <span className="hidden sm:inline">{t.label}</span>
        </a>
      ))}
    </nav>
  );
}
