import { ArrowRight, ArrowUpRight } from "lucide-react";
import PageHero from "./PageHero";
import { handleLinkClick } from "../lib/navigation";

// /about — Shane's story in his own voice. Facts come from the homepage copy and Past Ventures.

const MILESTONES: { year: string; title: string; text: string }[] = [
  { year: "2007", title: "First businesses in Pattaya", text: "Pattaya Job Centre, connecting Thai job seekers with employers, and Pattaya Guide, a pocket guide for visitors that I ran for ten years." },
  { year: "2009", title: "Fairways Golf Range", text: "A golf driving range and resort — a natural fit after my years as a PGA professional." },
  { year: "2010", title: "Pattaya Rent a Car", text: "Car and motorbike rental for visitors and residents. Still running, and still the business I've owned the longest." },
  { year: "2015", title: "Birdie Thailand", text: "Co-founded a golf handicap system to keep my tournament fair. It grew to members across Thailand before I handed it over to a golf charity." },
  { year: "2018", title: "Hemingways Jomtien", text: "The first Hemingways restaurant and bar, followed by Hemingways Pattaya in 2022 and Hemingways Lakeside in 2023." },
  { year: "2022", title: "Alan Bolton Property Consultants", text: "Took ownership of an established Pattaya real estate consultancy." },
  { year: "2024", title: "Cajun Life Cafe", text: "Added a Cajun kitchen to the hospitality group." },
  { year: "2025", title: "East Coast Real Estate", text: "A second real estate agency covering the Eastern Seaboard." },
  { year: "2026", title: "The Best Agent in Pattaya", text: "East Coast Real Estate won The Best Agent in Pattaya at the Thailand Real Estate Agent Awards 2026 by Dot Property." },
];

export default function AboutPage() {
  return (
    <div className="bg-paper text-ink">
      <PageHero
        eyebrow="About"
        title={<>Shane <span className="italic text-gold">Ruddle</span></>}
        intro="Over twenty years in Thailand. Seven businesses in Pattaya across property, hospitality and car rental — built to last, not to flip."
      />

      <section className="py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-10 lg:gap-16">
          <div className="lg:col-span-5">
            <img
              src="/images/shane-portrait.webp"
              alt="Shane Ruddle"
              width={768}
              height={1052}
              decoding="async"
              className="w-full max-w-sm h-auto aspect-[768/1052] object-cover rounded-3xl"
            />
          </div>
          <div className="lg:col-span-7 space-y-6 text-lg md:text-xl text-black/70 font-light leading-relaxed">
            <p>
              I'm originally from the UK. I studied at Bournemouth University and spent my early career as a PGA
              professional golfer. Golf taught me focus and patience — two things that turn out to matter a lot in business.
            </p>
            <p>
              I came to Thailand over twenty years ago and made Pattaya home. My first businesses here were small and
              practical: a job centre, a visitor guide, a golf range. Some lasted a decade, some didn't. All of them taught
              me how this city actually works.
            </p>
            <p>
              Today I own seven businesses: two real estate agencies, four restaurants and bars, and a car rental company
              that has been running since 2010. I'm hands-on with all of them, and increasingly I build our own tools —
              booking, pricing and listing systems — with AI.
            </p>
            <p>
              I'm also a vocal advocate for professionalising Thai real estate through national licensing and ethical
              standards. Buyers here deserve the same protection they'd get at home.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-cream border-y border-cream-line py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <span className="block text-[11px] font-medium uppercase tracking-[0.3em] mb-5 text-gold-deep">The journey</span>
          <h2 className="font-serif text-4xl md:text-5xl leading-tight mb-12">Nearly two decades of building in Pattaya.</h2>
          <ol className="relative border-l border-cream-line ml-2 space-y-10">
            {MILESTONES.map((m) => (
              <li key={m.year + m.title} className="pl-8 relative">
                <span className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-gold" aria-hidden />
                <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-gold-deep mb-1">{m.year}</span>
                <h3 className="font-serif text-2xl md:text-3xl mb-2">{m.title}</h3>
                <p className="text-black/60 leading-relaxed">{m.text}</p>
              </li>
            ))}
          </ol>
          <a
            href="/past-ventures"
            onClick={handleLinkClick}
            className="mt-12 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-gold-deep hover:text-ink transition-colors"
          >
            Full list of past ventures <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      <section className="py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-10 lg:gap-16">
          <div className="lg:col-span-5">
            <span className="block text-[11px] font-medium uppercase tracking-[0.3em] mb-5 text-gold-deep">Outside of business</span>
            <h2 className="font-serif text-4xl md:text-5xl leading-tight">Golf, running, padel and family.</h2>
          </div>
          <div className="lg:col-span-7 text-lg text-black/65 font-light leading-relaxed space-y-4">
            <p>
              I don't play golf competitively any more, but these days I run half marathons to stay fit and clear my head,
              and padel has quickly become my new obsession. Staying active outside work helps me show up better inside it.
            </p>
            <a
              href="https://thaiproperty.com/blog/east-coast-real-estate-wins-best-agent-in-pattaya-2026"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-gold-deep hover:text-ink transition-colors"
            >
              Read about the 2026 award <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
