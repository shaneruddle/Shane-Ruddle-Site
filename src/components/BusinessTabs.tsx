import { BUSINESS_PATH } from "../lib/businessCheck";
import { BUYING_PATH } from "../lib/dealCheck";
import { handleLinkClick } from "../lib/navigation";

// Switches between the two pages of the business chapter: the reality check and buying a business.
export default function BusinessTabs({ active }: { active: "check" | "buying" }) {
  const tabs = [
    { id: "check", label: "Reality check", href: BUSINESS_PATH },
    { id: "buying", label: "Buying a business", href: BUYING_PATH },
  ] as const;
  return (
    <nav aria-label="Doing business in Pattaya" className="inline-flex p-1 mb-10 rounded-full border border-white/15 bg-white/[0.04]">
      {tabs.map((t) => (
        <a
          key={t.id}
          href={t.href}
          onClick={handleLinkClick}
          aria-current={active === t.id ? "page" : undefined}
          className={`px-4 sm:px-5 py-2 rounded-full text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors ${
            active === t.id ? "bg-gold text-ink" : "text-white/60 hover:text-white"
          }`}
        >
          {t.label}
        </a>
      ))}
    </nav>
  );
}
