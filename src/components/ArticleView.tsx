import { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import { photoByUrl } from "../lib/photoSlots";
import { guideForArticle } from "../lib/guides";
import QuestionCard from "./QuestionCard";
import { QUESTIONS_PATH, questionsForArticle } from "../lib/questions";
import { handleLinkClick } from "../lib/navigation";

export interface ArticleViewProps {
  title: string;
  body: string;
  category?: string;
  createdAt?: Date;
  /** Shown as "Updated …" when later than createdAt. */
  updatedAt?: Date;
  imageUrl?: string;
  /** Used to link the article to its "Start here" guide. */
  slug?: string;
  /** Interactive extras rendered after the article (newsletter, comments); browser only. */
  children?: ReactNode;
}

// Pattaya time and British date order, so every visitor sees the publish date as written.
const formatArticleDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Bangkok" });

// One article layout shared by the build-time prerender and the live app, so the page
// doesn't jump when the app takes over from the static HTML.
export default function ArticleView({ title, body, category, createdAt, updatedAt, imageUrl, slug, children }: ArticleViewProps) {
  const readMinutes = Math.max(1, Math.ceil(body.split(/\s+/).length / 200));
  const guide = guideForArticle(slug);
  const asked = slug ? questionsForArticle(slug).slice(0, 4) : [];
  const updated =
    updatedAt && createdAt && formatArticleDate(updatedAt) !== formatArticleDate(createdAt) && updatedAt > createdAt
      ? `Updated ${formatArticleDate(updatedAt)}`
      : null;
  const meta = [category, createdAt ? formatArticleDate(createdAt) : null, updated, `${readMinutes} min read`].filter(Boolean).join(" · ");

  return (
    <article className="min-h-screen bg-white pt-28 md:pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        <a href="/articles" className="text-xs uppercase tracking-widest font-bold text-gold-deep hover:text-ink transition-colors">
          ← All articles
        </a>
        {guide && (
          <a href={`/guides/${guide.slug}`} onClick={handleLinkClick} className="ml-5 text-xs uppercase tracking-widest text-black/45 hover:text-gold-deep transition-colors">
            Part of my guide: <span className="font-bold text-ink">{guide.name}</span>
          </a>
        )}
        <p className="mt-8 text-xs uppercase tracking-widest text-black/45">{meta}</p>
        <h1 className="font-serif text-4xl md:text-6xl leading-tight mt-3 mb-6">{title}</h1>
        <div className="flex items-center gap-3 mb-12">
          <img src="/images/shane-portrait.webp" alt="" width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
          <span className="text-sm text-black/60">By <a href="/about" className="text-ink hover:text-gold-deep">Shane Ruddle</a></span>
        </div>
        {imageUrl && (
          <img src={imageUrl} alt={photoByUrl(imageUrl)?.alt || title} width={1600} height={900} decoding="async" className="w-full aspect-[16/9] object-cover rounded-3xl mb-12" referrerPolicy="no-referrer" />
        )}
        <div className="markdown-body text-black/70 font-light leading-relaxed text-lg">
          <ReactMarkdown
            components={{
              // Internal links stay in the app (no full page reload); external ones open in a new tab.
              a: ({ href, children }) =>
                href?.startsWith("/") ? (
                  <a href={href} onClick={handleLinkClick}>{children}</a>
                ) : (
                  <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
                ),
              img: ({ src, alt, title: caption }) => {
                const p = photoByUrl(typeof src === "string" ? src : undefined);
                return (
                  <span className="block my-10">
                    <img src={src as string} alt={alt || ""} width={p?.width} height={p?.height} loading="lazy" decoding="async" className="w-full h-auto rounded-2xl" />
                    {caption && <span className="block mt-3 text-sm text-black/45">{caption}</span>}
                  </span>
                );
              },
            }}
          >
            {body}
          </ReactMarkdown>
        </div>

        {asked.length > 0 && (
          <section className="mt-16">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
              <h2 className="font-serif text-2xl md:text-3xl">Questions readers asked me about this</h2>
              <a href={QUESTIONS_PATH} onClick={handleLinkClick} className="text-xs uppercase tracking-widest font-bold text-gold-deep hover:text-ink">
                All questions →
              </a>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {asked.map((q) => (
                <QuestionCard key={q.slug} q={q} source={`article_${slug}`} />
              ))}
            </div>
          </section>
        )}

        {guide && (
          <a
            href={`/guides/${guide.slug}`}
            onClick={handleLinkClick}
            className="group mt-16 flex items-center justify-between gap-6 p-7 md:p-8 bg-ink rounded-[1.5rem] text-white"
          >
            <span>
              <span className="block text-[11px] uppercase tracking-[0.25em] text-gold mb-2">Part of my guide</span>
              <span className="font-serif text-2xl md:text-3xl group-hover:text-gold transition-colors">{guide.title}</span>
              <span className="block mt-2 text-sm text-white/55 font-light">Short answers and every article on it, in order.</span>
            </span>
            <span aria-hidden className="text-gold text-3xl transition-transform group-hover:translate-x-1">→</span>
          </a>
        )}

        <aside className="mt-20 p-8 md:p-10 bg-[#F8F8F8] rounded-[2rem] flex flex-col sm:flex-row items-start gap-6">
          <img src="/images/shane-portrait.webp" alt="Shane Ruddle" width={88} height={88} className="rounded-full object-cover flex-shrink-0" style={{ width: 88, height: 88 }} />
          <div>
            <h2 className="text-xl font-serif mb-2">About me</h2>
            <p className="text-black/60 font-light leading-relaxed mb-4">
              I'm Shane Ruddle. I came to Pattaya over 20 years ago, started out managing a bar in Soi 13, and now own seven
              businesses here across property, hospitality and car rental. I write about what I've learned along the way,
              including what didn't work.
            </p>
            <a href="/about" className="text-gold-deep font-bold uppercase tracking-widest text-[10px] hover:text-ink transition-colors">
              More about me
            </a>
          </div>
        </aside>

        {children}
      </div>
    </article>
  );
}
