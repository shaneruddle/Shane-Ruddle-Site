import { ArrowRight } from "lucide-react";
import { BusinessInfo, Company } from "../types";
import { SECTORS, CompanyCard } from "./HomePage";
import PageHero from "./PageHero";
import { handleLinkClick } from "../lib/navigation";

// /businesses — the seven companies grouped by sector, each linking out to its own site.

const SECTOR_INTRO: Record<string, string> = {
  "Real Estate":
    "Two agencies covering sales, rentals and investment advice in Pattaya and across the Eastern Seaboard. East Coast Real Estate was named The Best Agent in Pattaya at the Thailand Real Estate Agent Awards 2026.",
  "Hospitality":
    "Three Hemingways venues — Jomtien, central Pattaya and Lakeside — plus Cajun Life Cafe. Places for good food, live sport and a crowd of regulars.",
  "Mobility":
    "Pattaya Rent a Car has rented cars and motorbikes to visitors and residents since 2010, from short trips to long-term rentals.",
};

export default function BusinessesPage({ data }: { data: BusinessInfo }) {
  const companies = Array.isArray(data.companies) ? data.companies : [];
  const byName = new Map(companies.map((c) => [c.name, c]));
  const groups = SECTORS.map((s) => ({ ...s, items: s.names.map((n) => byName.get(n)).filter(Boolean) as Company[] }));

  return (
    <div className="bg-paper text-ink">
      <PageHero
        eyebrow="Businesses"
        title={<>Seven businesses, <span className="italic text-gold">one standard.</span></>}
        intro="Real estate, hospitality and car rental in and around Pattaya — each run with the same focus on people and lasting value."
      />

      <div className="py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto space-y-20 md:space-y-28">
          {groups.filter((g) => g.items.length).map((group) => (
            <section key={group.title} aria-labelledby={`sector-${group.title}`}>
              <div className="grid lg:grid-cols-12 gap-6 mb-8 pb-6 border-b border-black/10">
                <h2 id={`sector-${group.title}`} className="lg:col-span-4 font-serif text-4xl md:text-5xl leading-tight">{group.title}</h2>
                <p className="lg:col-span-8 text-lg text-black/60 font-light leading-relaxed">{SECTOR_INTRO[group.title] || group.blurb}</p>
              </div>
              <div className={`grid gap-5 ${group.items.length >= 3 ? "sm:grid-cols-2 lg:grid-cols-4" : "lg:grid-cols-2"}`}>
                {group.items.map((c) => (
                  <CompanyCard key={c.name} company={c} wide={group.items.length < 3} />
                ))}
              </div>
            </section>
          ))}

          <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between bg-cream border border-cream-line rounded-2xl p-8 md:p-10">
            <div>
              <h2 className="font-serif text-3xl mb-1">Partnerships and investment</h2>
              <p className="text-black/60">Interested in working with one of the businesses? Get in touch directly.</p>
            </div>
            <a
              href="/contact"
              onClick={handleLinkClick}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-ink text-white text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:bg-gold hover:text-ink transition-colors shrink-0"
            >
              Contact Shane <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
