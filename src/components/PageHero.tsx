import { ReactNode } from "react";

// Dark title band used at the top of the public inner pages, matching the homepage hero.
export default function PageHero({ eyebrow, title, intro }: { eyebrow: string; title: ReactNode; intro?: ReactNode }) {
  return (
    <section className="bg-ink text-white pt-28 md:pt-36 pb-14 md:pb-20 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <span className="block text-[11px] font-medium uppercase tracking-[0.3em] mb-5 text-gold">{eyebrow}</span>
        <h1 className="font-serif font-normal text-5xl sm:text-6xl lg:text-7xl leading-[1.04] tracking-tight mb-6 max-w-4xl">{title}</h1>
        {intro && <p className="text-lg md:text-xl text-white/65 font-light leading-relaxed max-w-2xl">{intro}</p>}
      </div>
    </section>
  );
}
