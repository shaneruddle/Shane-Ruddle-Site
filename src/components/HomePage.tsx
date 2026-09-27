import { ReactNode, useState } from "react";
import { motion } from "motion/react";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { BusinessInfo, Company } from "../types";

// Public homepage. Content comes from fallbackData in src/types.ts (bundled, no Firestore).

const SECTORS: { title: string; blurb: string; names: string[] }[] = [
  {
    title: "Real Estate",
    blurb: "Sales, rentals and investment advice across Pattaya and the Eastern Seaboard.",
    names: ["Alan Bolton Property Consultants", "East Coast Real Estate"],
  },
  {
    title: "Hospitality",
    blurb: "Restaurants and bars that locals and visitors come back to.",
    names: ["Hemingways Pattaya", "Hemingways Jomtien", "Hemingways Lakeside", "Cajun Life Cafe"],
  },
  {
    title: "Mobility",
    blurb: "Car rental in Pattaya since 2009.",
    names: ["Pattaya Rent a Car"],
  },
];

const LIFESTYLE: { title: string; photoIndex: number }[] = [
  { title: "Family", photoIndex: 4 },
  { title: "Running", photoIndex: 2 },
  { title: "Team", photoIndex: 3 },
  { title: "Friends", photoIndex: 1 },
];

const Reveal = ({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.5, delay, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

const Eyebrow = ({ children, dark = false }: { children: ReactNode; dark?: boolean }) => (
  <span className={`block text-[11px] font-medium uppercase tracking-[0.3em] mb-5 ${dark ? "text-gold" : "text-gold-deep"}`}>
    {children}
  </span>
);

const domainOf = (url?: string) => (url || "").replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");

const CompanyCard = ({ company, wide = false }: { company: Company; wide?: boolean }) => {
  const [logoFailed, setLogoFailed] = useState(false);
  const href = company.url?.startsWith("http") ? company.url : `https://${company.url}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex h-full bg-white border border-black/[0.08] rounded-[16px] overflow-hidden transition-all duration-300 hover:border-gold/60 hover:shadow-xl hover:shadow-black/[0.06] hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-gold ${wide ? "flex-col sm:flex-row" : "flex-col"}`}
    >
      <div className={`bg-cream flex items-center justify-center p-7 ${wide ? "h-36 sm:h-auto sm:w-2/5 shrink-0" : "h-36"}`}>
        {company.logo && !logoFailed ? (
          <img
            src={company.logo}
            alt={`${company.name} logo`}
            className="max-h-full max-w-[75%] object-contain"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setLogoFailed(true)}
          />
        ) : (
          <span className="font-serif text-2xl text-ink/70 text-center leading-tight">{company.name}</span>
        )}
      </div>
      <div className={`flex flex-col flex-1 ${wide ? "p-6 md:p-8" : "p-6"}`}>
        <h4 className="font-serif font-normal text-2xl text-ink leading-snug mb-2">{company.name}</h4>
        <p className="text-sm text-black/60 leading-relaxed flex-1">{company.description}</p>
        <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium tracking-wide text-gold-deep group-hover:text-ink transition-colors">
          {domainOf(company.url)} <ArrowUpRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </a>
  );
};

export default function HomePage({ data }: { data: BusinessInfo }) {
  const photos = data.ownerPhotos || [];
  const companies = Array.isArray(data.companies) ? data.companies : [];
  const byName = new Map(companies.map((c) => [c.name, c]));
  const grouped = SECTORS.map((s) => ({ ...s, items: s.names.map((n) => byName.get(n)).filter(Boolean) as Company[] }));
  const placed = new Set(SECTORS.flatMap((s) => s.names));
  const other = companies.filter((c) => !placed.has(c.name));
  if (other.length) grouped.push({ title: "More", blurb: "", names: [], items: other });

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="bg-paper text-ink">
      {/* Hero */}
      <section className="bg-ink text-white pt-28 md:pt-32 pb-16 md:pb-24 px-6 md:px-12 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-7">
            <Eyebrow dark>Entrepreneur · Pattaya, Thailand</Eyebrow>
            <h1 className="font-serif font-normal text-[3.25rem] leading-[1.02] sm:text-7xl lg:text-[6.5rem] tracking-tight mb-7">
              Shane <span className="text-gold italic">Ruddle</span>
            </h1>
            <p className="text-lg md:text-xl text-white/70 font-light leading-relaxed max-w-xl mb-10">
              {data.tagline}
            </p>
            <div className="flex flex-wrap items-center gap-4 mb-14">
              <button
                onClick={() => scrollTo("companies")}
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-gold text-ink text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:bg-white transition-colors"
              >
                The companies <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollTo("about")}
                className="inline-flex items-center px-7 py-3.5 border border-white/25 text-white text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:border-gold hover:text-gold transition-colors"
              >
                My story
              </button>
            </div>
            <dl className="grid grid-cols-3 gap-6 max-w-lg border-t border-white/15 pt-8">
              {[
                [String(companies.length || 7), "Businesses"],
                ["20+", "Years in Thailand"],
                ["3", "Sectors"],
              ].map(([n, label]) => (
                <div key={label}>
                  <dt className="font-serif text-4xl md:text-5xl text-gold leading-none mb-2">{n}</dt>
                  <dd className="text-[11px] uppercase tracking-[0.18em] text-white/55">{label}</dd>
                </div>
              ))}
            </dl>
          </div>
          {photos[0] && (
            <div className="lg:col-span-5">
              <div className="relative max-w-sm mx-auto lg:max-w-none">
                <div className="hidden md:block absolute -inset-4 border border-gold/40 rounded-[1.75rem] translate-x-4 translate-y-4" aria-hidden />
                <img
                  src={photos[0]}
                  alt="Shane Ruddle"
                  width={768}
                  height={1052}
                  fetchPriority="high"
                  decoding="async"
                  className="relative w-full h-auto aspect-[768/1052] object-cover rounded-3xl"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 md:py-32 px-6 md:px-12 scroll-mt-20">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-10 lg:gap-16">
          <Reveal className="lg:col-span-5">
            <Eyebrow>About</Eyebrow>
            <h2 className="font-serif text-4xl md:text-6xl leading-[1.08]">
              Leading with <span className="italic text-gold-deep">integrity.</span>
            </h2>
          </Reveal>
          <Reveal className="lg:col-span-7" delay={0.1}>
            <p className="text-lg md:text-xl text-black/70 font-light leading-relaxed">{data.about}</p>
          </Reveal>
        </div>
      </section>

      {/* Values */}
      <section id="values" className="bg-cream border-y border-cream-line py-20 md:py-28 px-6 md:px-12 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <Reveal className="mb-12 md:mb-16">
            <Eyebrow>Values</Eyebrow>
            <h2 className="font-serif text-4xl md:text-5xl leading-tight">What every business is built on.</h2>
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-cream-line border border-cream-line rounded-[16px] overflow-hidden">
            {data.values.map((v, i) => (
              <div key={v} className="bg-cream p-6 md:p-10">
                <span className="block font-serif text-lg text-gold-deep mb-3">{String(i + 1).padStart(2, "0")}</span>
                <span className="block font-serif text-2xl md:text-3xl leading-tight">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Companies */}
      <section id="companies" className="py-20 md:py-32 px-6 md:px-12 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <Reveal className="grid lg:grid-cols-12 gap-6 mb-14 md:mb-20 items-end">
            <div className="lg:col-span-7">
              <Eyebrow>The companies</Eyebrow>
              <h2 className="font-serif text-4xl md:text-6xl leading-[1.08]">
                Seven businesses, <span className="italic text-gold-deep">one standard.</span>
              </h2>
            </div>
            <p className="lg:col-span-5 text-black/60 text-lg font-light leading-relaxed">
              Real estate, hospitality and mobility in and around Pattaya — each run with the same focus on people and lasting value.
            </p>
          </Reveal>

          <div className="space-y-16 md:space-y-20">
            {grouped.filter((g) => g.items.length).map((group) => (
              <div key={group.title}>
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 mb-6 pb-4 border-b border-black/10">
                  <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.25em] text-ink">{group.title}</h3>
                  {group.blurb && <p className="text-sm text-black/50">{group.blurb}</p>}
                </div>
                <div className={`grid gap-5 ${group.items.length >= 3 ? "sm:grid-cols-2 lg:grid-cols-4" : "lg:grid-cols-2"}`}>
                  {group.items.map((c) => (
                    <CompanyCard key={c.name} company={c} wide={group.items.length < 3} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Outside of business */}
      <section id="lifestyle" className="bg-cream border-t border-cream-line py-20 md:py-32 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 mb-14 md:mb-16">
            <Reveal className="lg:col-span-5">
              <Eyebrow>Outside of business</Eyebrow>
              <blockquote className="font-serif italic text-2xl md:text-[2rem] leading-snug text-ink">
                “Life isn’t all about business. Staying active and challenging yourself outside of work helps you show up better inside it.”
              </blockquote>
            </Reveal>
            <Reveal className="lg:col-span-7 lg:pt-10 space-y-4 text-black/65 text-lg font-light leading-relaxed" delay={0.1}>
              <p>
                I used to be a PGA professional golfer, and while I don’t play competitively anymore, the game taught me a lot about focus and patience. These days I run half marathons to stay fit and clear my head, and I’ve recently taken up padel — which has quickly become my new obsession.
              </p>
              <p>Whether it’s on the course, the track or the court, I’m always looking for that next challenge.</p>
            </Reveal>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {LIFESTYLE.filter((l) => photos[l.photoIndex]).map((l) => (
              <figure key={l.title}>
                  <div className="aspect-[4/3] rounded-[12px] overflow-hidden bg-cream-line">
                    <img
                      src={photos[l.photoIndex]}
                      alt={l.title}
                      width={600}
                      height={311}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <figcaption className="mt-3 text-xs font-medium uppercase tracking-[0.2em] text-black/55">{l.title}</figcaption>
                </figure>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
