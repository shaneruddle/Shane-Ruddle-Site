import { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import { photoByUrl } from "../lib/photoSlots";

export interface ArticleViewProps {
  title: string;
  body: string;
  category?: string;
  createdAt?: Date;
  imageUrl?: string;
  /** Interactive extras rendered after the article (newsletter, comments); browser only. */
  children?: ReactNode;
}

// Pattaya time and British date order, so every visitor sees the publish date as written.
const formatArticleDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Bangkok" });

// One article layout shared by the build-time prerender and the live app, so the page
// doesn't jump when the app takes over from the static HTML.
export default function ArticleView({ title, body, category, createdAt, imageUrl, children }: ArticleViewProps) {
  const readMinutes = Math.max(1, Math.ceil(body.split(/\s+/).length / 200));
  const meta = [category, createdAt ? formatArticleDate(createdAt) : null, `${readMinutes} min read`].filter(Boolean).join(" · ");

  return (
    <article className="min-h-screen bg-white pt-28 md:pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        <a href="/articles" className="text-xs uppercase tracking-widest font-bold text-gold-deep hover:text-ink transition-colors">
          ← All articles
        </a>
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
