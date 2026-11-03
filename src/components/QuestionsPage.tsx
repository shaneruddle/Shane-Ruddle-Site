import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, MessageCircleQuestion, Search, X } from "lucide-react";
import { FILE_ARTICLES } from "../lib/fileArticles";
import {
  ANSWERS_AS_OF,
  QUESTIONS,
  QUESTIONS_META,
  QUESTIONS_PATH,
  QUESTION_TOPICS,
  QuestionLink,
  QuestionTopic,
  ShaneQuestion,
  questionBySlug,
  questionMeta,
  topicById,
} from "../lib/questions";
import { handleLinkClick } from "../lib/navigation";
import { trackEvent } from "../lib/analytics";
import { applyPageMeta } from "../seo";
import AskShane from "./AskShane";
import QuestionCard from "./QuestionCard";

// Real questions, answered: /questions (searchable library) and /questions/<slug> (one answer per page).
// Shared by the build-time prerender and the live app.

const ARTICLES = new Map(FILE_ARTICLES.map((a) => [a.slug, a]));

const Eyebrow = ({ children, dark = false }: { children: ReactNode; dark?: boolean }) => (
  <span className={`block text-[11px] font-medium uppercase tracking-[0.3em] mb-5 ${dark ? "text-gold" : "text-gold-deep"}`}>{children}</span>
);


function NextStep({ link, source }: { link: QuestionLink; source: string }) {
  const external = link.href.startsWith("http");
  return (
    <a
      href={link.href}
      {...(external ? { target: "_blank", rel: "noopener" } : {})}
      onClick={(e) => {
        if (external) {
          trackEvent("select_promotion", { promotion_name: link.kind, creative_slot: source });
        } else {
          trackEvent("select_content", { content_type: link.kind, source });
          handleLinkClick(e);
        }
      }}
      className="group flex items-center justify-between gap-6 p-6 md:p-7 rounded-[1.25rem] border border-gold/40 bg-gold/10 hover:bg-gold/20 transition-colors"
    >
      <span>
        <span className="block text-[11px] uppercase tracking-[0.22em] text-gold-deep mb-1.5">Next step</span>
        <span className="block font-serif text-2xl leading-snug text-ink">{link.label}</span>
      </span>
      {external ? (
        <ArrowUpRight className="w-6 h-6 text-gold-deep shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      ) : (
        <ArrowRight className="w-6 h-6 text-gold-deep shrink-0 transition-transform group-hover:translate-x-1" />
      )}
    </a>
  );
}

// ---------------------------------------------------------------------------------------------
// Hub

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9฿ ]+/g, " ");

function matches(q: ShaneQuestion, words: string[]) {
  const hay = norm(`${q.q} ${q.short} ${q.answer.join(" ")} ${topicById(q.topic).label}`);
  return words.every((w) => hay.includes(w));
}

function QuestionsHub() {
  const [topic, setTopic] = useState<QuestionTopic | "all">("all");
  const [query, setQuery] = useState("");
  const searched = useRef<string>("");

  const words = norm(query).split(/\s+/).filter((w) => w.length > 1);
  const list = useMemo(
    () => QUESTIONS.filter((q) => (topic === "all" || q.topic === topic) && (words.length === 0 || matches(q, words))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [topic, query],
  );

  // One search event per settled query.
  useEffect(() => {
    if (words.length === 0) return;
    const t = setTimeout(() => {
      if (searched.current === query) return;
      searched.current = query;
      trackEvent("search", { search_term: query.trim().slice(0, 100), source: "questions_hub", results: list.length });
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const q of QUESTIONS) c[q.topic] = (c[q.topic] ?? 0) + 1;
    return c;
  }, []);

  const pickTopic = (id: QuestionTopic | "all") => {
    setTopic(id);
    trackEvent("select_content", { content_type: "question_topic", item_id: id });
  };

  const noResults = list.length === 0;

  return (
    <>
      <section className="bg-ink text-white pt-32 md:pt-40 pb-16 md:pb-20 px-6 md:px-12 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-10 lg:gap-14 items-end">
          <div className="lg:col-span-7">
            <Eyebrow dark>Real questions, answered</Eyebrow>
            <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl leading-[1.02] mb-7">
              The questions people <span className="italic text-gold">actually</span> ask me.
            </h1>
            <p className="text-lg md:text-xl text-white/65 font-light leading-relaxed max-w-2xl">
              Over 20 years I've had thousands of emails and enquiries about Pattaya through my agencies, my car rental company and this site.
              These are the ones that come up most, reworded so nobody can be identified, with the answer I'd give a friend.
            </p>
          </div>
          <div className="lg:col-span-5">
            <div className="flex items-center gap-4 mb-6">
              <img src="/images/shane-portrait.webp" alt="" width={56} height={56} className="w-14 h-14 rounded-full object-cover ring-2 ring-gold/60" />
              <p className="text-sm text-white/60 leading-relaxed">
                <span className="block text-white">{QUESTIONS.length} questions, every answer by me.</span>
                Don't see yours? Ask it and I'll reply personally.
              </p>
            </div>
            <label className="relative block">
              <span className="sr-only">Search the questions</span>
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search: deposit, dog, retire, quota…"
                className="w-full pl-14 pr-12 py-4 rounded-full bg-white/[0.07] border border-white/15 text-white placeholder:text-white/35 focus:outline-none focus:border-gold"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-white/50 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </label>
          </div>
        </div>
      </section>

      <section className="bg-paper px-6 md:px-12 py-12 md:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 md:mx-0 md:px-0 md:flex-wrap mb-8 md:mb-10 [scrollbar-width:none]">
            {[{ id: "all" as const, label: "All" }, ...QUESTION_TOPICS].map((t) => {
              const active = topic === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => pickTopic(t.id)}
                  aria-pressed={active}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm border transition-colors ${
                    active ? "bg-ink text-white border-ink" : "bg-white text-black/70 border-black/10 hover:border-gold-deep"
                  }`}
                >
                  {t.label}
                  <span className={`ml-1.5 text-xs ${active ? "text-gold" : "text-black/35"}`}>{t.id === "all" ? QUESTIONS.length : counts[t.id] ?? 0}</span>
                </button>
              );
            })}
          </div>

          {noResults ? (
            <div className="p-8 md:p-12 bg-white border border-black/[0.08] rounded-[1.5rem] text-center">
              <MessageCircleQuestion className="w-10 h-10 mx-auto text-gold-deep mb-4" />
              <p className="font-serif text-3xl text-ink mb-2">I haven't answered that one here yet.</p>
              <p className="text-black/60 mb-6">Ask me and I'll reply personally. If it's a good one, it may end up on this page.</p>
              <a
                href="#ask"
                onClick={() => trackEvent("select_content", { content_type: "ask_from_search", search_term: query.trim().slice(0, 100) })}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-ink text-white text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:bg-gold hover:text-ink transition-colors"
              >
                Ask me this <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {list.map((q) => (
                <QuestionCard key={q.slug} q={q} source="questions_hub" />
              ))}
            </div>
          )}

          <p className="mt-10 text-xs text-black/45 leading-relaxed max-w-3xl">
            Answers come from my own experience and articles, and are up to date as of {ANSWERS_AS_OF}. Rules on visas, property and banking in
            Thailand change often, so check the current position before you act on anything here.
          </p>
        </div>
      </section>

      <section id="ask" className="scroll-mt-24 bg-ink text-white py-20 md:py-28 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-10 lg:gap-16">
          <div className="lg:col-span-5">
            <Eyebrow dark>Ask your own</Eyebrow>
            <h2 className="font-serif text-4xl md:text-6xl leading-[1.08] mb-6">
              Don't see <span className="italic text-gold">your question?</span>
            </h2>
            <p className="text-lg text-white/65 font-light leading-relaxed mb-5">
              Ask me. I read every one and reply personally.
            </p>
            <p className="text-sm text-white/45 leading-relaxed">
              If you tick the box, I may answer it here for the next person, without your name or email.
            </p>
          </div>
          <div className="lg:col-span-7">
            <AskShane
              key={noResults ? `q-${query}` : "hub"}
              dark
              source="questions_hub"
              showHeading={false}
              initialQuestion={noResults ? query.trim() : undefined}
            />
          </div>
        </div>
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// One question

function QuestionView({ q }: { q: ShaneQuestion }) {
  const topic = topicById(q.topic);
  const articles = q.articles.map((s) => ARTICLES.get(s)).filter((a): a is NonNullable<typeof a> => !!a);
  const more = QUESTIONS.filter((x) => x.topic === q.topic && x.slug !== q.slug).slice(0, 6);
  const others = more.length < 3 ? [...more, ...QUESTIONS.filter((x) => x.topic !== q.topic).slice(0, 3 - more.length)] : more;
  const source = `question_${q.slug}`;

  return (
    <>
      <section className="bg-ink text-white pt-32 md:pt-40 pb-28 md:pb-20 px-6 md:px-12 overflow-hidden">
        <div className="max-w-4xl mx-auto">
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-10 text-xs uppercase tracking-widest">
            <a href={QUESTIONS_PATH} onClick={handleLinkClick} className="font-bold text-gold hover:text-white transition-colors">
              ← All questions
            </a>
            <span className="text-white/40">{topic.label}</span>
          </nav>
          <span className="block text-[11px] uppercase tracking-[0.3em] text-white/50 mb-5">Asked by {q.askedBy}</span>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl leading-[1.08]">“{q.q}”</h1>
        </div>
      </section>

      <div className="bg-paper px-6 md:px-12 py-14 md:py-20">
        <div className="max-w-4xl mx-auto space-y-12 md:space-y-16">
          <section className="p-7 md:p-12 bg-white border border-black/[0.08] rounded-[1.75rem] -mt-24 md:-mt-28 relative shadow-xl shadow-black/[0.06]">
            <div className="flex items-center gap-4 mb-7">
              <img src="/images/shane-portrait.webp" alt="" width={56} height={56} className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover ring-2 ring-gold/60" />
              <span className="text-sm text-black/55 leading-snug">
                <span className="block text-[11px] uppercase tracking-[0.22em] text-gold-deep mb-0.5">My answer</span>
                <a href="/about" onClick={handleLinkClick} className="text-ink hover:text-gold-deep">Shane Ruddle</a>, 20+ years in Pattaya
              </span>
            </div>
            <p className="font-serif text-2xl md:text-[2rem] leading-snug text-ink mb-6">{q.short}</p>
            <div className="space-y-4 text-lg text-black/70 font-light leading-relaxed">
              {q.answer.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            <p className="mt-8 pt-6 border-t border-black/[0.08] text-xs text-black/45 leading-relaxed">
              Up to date as of {ANSWERS_AS_OF}. Rules in Thailand change often, so check the current position before you act.
            </p>
          </section>

          {q.next && <NextStep link={q.next} source={source} />}

          {articles.length > 0 && (
            <section>
              <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-6">The full story</h2>
              <div className="grid sm:grid-cols-2 gap-4 md:gap-5">
                {articles.map((a) => (
                  <a
                    key={a.slug}
                    href={`/articles/${a.slug}`}
                    onClick={(e) => {
                      trackEvent("select_content", { content_type: "article", item_id: a.slug, source });
                      handleLinkClick(e);
                    }}
                    className="group flex flex-col bg-white border border-black/[0.08] rounded-[1rem] p-6 transition-all duration-300 hover:border-gold/60 hover:shadow-xl hover:shadow-black/[0.06]"
                  >
                    <span className="text-[10px] uppercase tracking-[0.22em] text-black/40 mb-2">Article</span>
                    <h3 className="font-serif text-xl leading-snug text-ink mb-2 group-hover:text-gold-deep transition-colors">{a.title}</h3>
                    <p className="text-sm text-black/60 leading-relaxed">{a.description}</p>
                  </a>
                ))}
              </div>
            </section>
          )}

          <section id="ask" className="scroll-mt-28 p-8 md:p-12 bg-cream border border-cream-line rounded-[2rem]">
            <AskShane
              source={source}
              initialTopic={topic.ask}
              context={`Question page: ${q.q}`}
              contextNote="I'll know which answer you've just read."
            />
          </section>
        </div>
      </div>

      <section className="bg-ink text-white py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <span className="block text-[11px] font-medium uppercase tracking-[0.3em] text-gold">More questions: {topic.label}</span>
            <a href={QUESTIONS_PATH} onClick={handleLinkClick} className="text-sm text-white/60 hover:text-gold">
              All {QUESTIONS.length} questions →
            </a>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {others.map((x) => (
              <QuestionCard key={x.slug} q={x} source={`${source}_more`} dark />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

/** /questions or /questions/<slug>. */
export default function QuestionsPage({ path }: { path: string }) {
  const slug = path.replace(/\/+$/, "").split("/")[2] || "";
  const q = slug ? questionBySlug(slug) : undefined;

  useEffect(() => {
    applyPageMeta(q ? questionMeta(q) : QUESTIONS_META);
  }, [q]);

  if (slug && !q) {
    return (
      <div className="min-h-screen bg-paper pt-40 pb-24 px-6 text-center">
        <h1 className="text-4xl font-serif mb-4">Question not found</h1>
        <a href={QUESTIONS_PATH} onClick={handleLinkClick} className="text-gold-deep font-bold uppercase tracking-widest text-[11px]">
          All questions
        </a>
      </div>
    );
  }
  return q ? <QuestionView key={q.slug} q={q} /> : <QuestionsHub />;
}
