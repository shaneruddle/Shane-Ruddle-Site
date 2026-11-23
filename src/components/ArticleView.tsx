import { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { photoByUrl } from "../lib/photoSlots";
import { guideForArticle } from "../lib/guides";
import QuestionCard from "./QuestionCard";
import { QUESTIONS_PATH, questionsForArticle } from "../lib/questions";
import { handleLinkClick } from "../lib/navigation";
import { topicForArticle } from "./AskShane";
import { AskOffer } from "./AskNudge";
import { relatedFor } from "../lib/relatedArticles";
import PosterFigure from "./PosterFigure";
import { POSTER_BY_PATH } from "../lib/posters";

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
  const more = relatedFor(slug);
  const poster = slug ? POSTER_BY_PATH[`/articles/${slug}`] : undefined;
  const updated =
    updatedAt && createdAt && formatArticleDate(updatedAt) !== formatArticleDate(createdAt) && updatedAt > createdAt
      ? `Updated ${formatArticleDate(updatedAt)}`
      : null;
  // Split after the second section so the "ask me" offer sits part-way down, not only at the end.
  const sections = body.split(/\n(?=## )/);
  const [bodyTop, bodyRest] = sections.length >= 4 ? [sections.slice(0, 3).join("\n"), sections.slice(3).join("\n")] : [body, ""];
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
        {poster && <PosterFigure id={poster.id} stacked className="mb-14" />}
        <div className="markdown-body text-black/70 font-light leading-relaxed text-lg">
          <ArticleMarkdown body={bodyTop} />
        </div>
        {bodyRest && (
          <>
            <AskOffer topic={topicForArticle(slug, category)} source={`article_${slug}`} />
            <div className="markdown-body text-black/70 font-light leading-relaxed text-lg">
              <ArticleMarkdown body={bodyRest} />
            </div>
          </>
        )}

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

        {more && (more.related.length > 0 || more.newer || more.older) && (
          <nav aria-label="Keep reading" className="mt-16">
            {more.related.length > 0 && (
              <>
                <h2 className="font-serif text-2xl md:text-3xl mb-5">Keep reading</h2>
                <ul className="grid sm:grid-cols-3 gap-4">
                  {more.related.map((r) => (
                    <li key={r.slug}>
                      <a
                        href={`/articles/${r.slug}`}
                        onClick={handleLinkClick}
                        className="group block h-full p-5 rounded-2xl border border-black/10 hover:border-gold-deep transition-colors"
                      >
                        <span className="block font-serif text-lg leading-snug text-ink group-hover:text-gold-deep transition-colors">{r.title}</span>
                        <span className="block mt-2 text-sm text-black/55 font-light leading-relaxed line-clamp-3">{r.description}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {(more.newer || more.older) && (
              <div className="mt-6 grid sm:grid-cols-2 gap-4 text-sm">
                {more.older ? (
                  <a href={`/articles/${more.older.slug}`} onClick={handleLinkClick} className="group block">
                    <span className="block text-[11px] uppercase tracking-widest text-black/40">← Previous article</span>
                    <span className="block mt-1 text-ink group-hover:text-gold-deep transition-colors">{more.older.title}</span>
                  </a>
                ) : <span />}
                {more.newer && (
                  <a href={`/articles/${more.newer.slug}`} onClick={handleLinkClick} className="group block sm:text-right">
                    <span className="block text-[11px] uppercase tracking-widest text-black/40">Next article →</span>
                    <span className="block mt-1 text-ink group-hover:text-gold-deep transition-colors">{more.newer.title}</span>
                  </a>
                )}
              </div>
            )}
          </nav>
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

function ArticleMarkdown({ body }: { body: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Internal links stay in the app (no full page reload); external ones open in a new tab.
        a: ({ href, children }) =>
          href?.startsWith("/") ? (
            <a href={href} onClick={handleLinkClick}>{children}</a>
          ) : (
            <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
          ),
        // Wide tables scroll sideways on phones instead of squashing.
        table: ({ children }) => (
          <span className="block overflow-x-auto my-8">
            <table>{children}</table>
          </span>
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
  );
}
