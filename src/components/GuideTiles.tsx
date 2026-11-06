import { ArrowRight } from "lucide-react";
import { GUIDES, Guide } from "../lib/guides";
import { handleLinkClick } from "../lib/navigation";
import { trackEvent } from "../lib/analytics";

// Split out of GuidePage so the homepage can show the tiles without pulling every article's
// text into the main bundle. The glob is not eager: only the file names are bundled.
const ARTICLE_SLUGS = new Set(
  Object.keys(import.meta.glob("/content/articles/*.md")).map((p) => p.split("/").pop()!.replace(/\.md$/, "")),
);
const pad = (n: number) => String(n).padStart(2, "0");
const articleCount = (g: Guide) => new Set(g.chapters.flatMap((c) => c.slugs).filter((s) => ARTICLE_SLUGS.has(s))).size;

/** One large tile per guide. Used on the homepage, the guides index and at the foot of each guide. */
export function GuideTiles({ source, exclude, dark = false }: { source: string; exclude?: string; dark?: boolean }) {
  const guides = GUIDES.filter((g) => g.slug !== exclude);
  return (
    <div className={`grid gap-4 md:gap-5 sm:grid-cols-2 ${guides.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
      {guides.map((g, i) => (
        <a
          key={g.slug}
          href={`/guides/${g.slug}`}
          onClick={(e) => {
            trackEvent("select_guide", { guide: g.slug, source });
            handleLinkClick(e);
          }}
          className={`group relative flex flex-col min-h-[15rem] md:min-h-[18rem] p-7 md:p-8 rounded-[1.25rem] border transition-all duration-300 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-gold ${
            dark
              ? "bg-white/[0.04] border-white/10 hover:border-gold/70 hover:bg-white/[0.07]"
              : "bg-white border-black/[0.08] hover:border-gold/60 hover:shadow-xl hover:shadow-black/[0.06]"
          }`}
        >
          <span className={`font-serif text-5xl leading-none mb-6 ${dark ? "text-gold/80" : "text-gold-deep/70"}`}>{pad(i + 1)}</span>
          <span className={`text-[11px] uppercase tracking-[0.22em] mb-2 ${dark ? "text-white/50" : "text-black/45"}`}>I'm planning on</span>
          <span className={`font-serif text-2xl md:text-[1.7rem] leading-snug mb-4 transition-colors ${dark ? "text-white group-hover:text-gold" : "text-ink group-hover:text-gold-deep"}`}>
            {g.planning}
          </span>
          <span className={`mt-auto flex items-center justify-between text-xs tracking-wide ${dark ? "text-white/55" : "text-black/50"}`}>
            <span>{articleCount(g)} articles · {g.faqs.length} quick answers</span>
            <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${dark ? "text-gold" : "text-gold-deep"}`} />
          </span>
        </a>
      ))}
    </div>
  );
}
