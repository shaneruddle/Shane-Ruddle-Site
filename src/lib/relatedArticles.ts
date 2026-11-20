import { FILE_ARTICLES } from "./fileArticles";

// "Keep reading" links at the foot of every article. Two jobs:
// 1. Readers get a next article on the same subject.
// 2. Every article gets links from other articles, so Google finds and re-crawls the newer
//    and less-linked ones (many only had a link from /articles).
// Pure and deterministic, so the prerendered HTML and the live app render the same list.

export interface RelatedArticle {
  slug: string;
  title: string;
  description: string;
}

const STOP = new Set(
  "a an and are as at be but by can do does for from get got has have how i i'd i'm i've if in into is it it's its just me my no not of on or our out so than that the their them there they this to up was we what when where which who why will with without you your vs pattaya thailand thai shane ruddle honest really here guide answer own owner business years".split(" "),
);

const words = (s: string) =>
  new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s']/g, " ")
      .split(/\s+/)
      .map((w) => w.replace(/'s$/, "").replace(/s$/, ""))
      .filter((w) => w.length > 2 && !STOP.has(w)),
  );

let cache: Map<string, { related: RelatedArticle[]; newer?: RelatedArticle; older?: RelatedArticle }> | null = null;

function build() {
  const list = FILE_ARTICLES; // newest first
  const toLink = (a: (typeof list)[number]): RelatedArticle => ({ slug: a.slug, title: a.title, description: a.description });
  const bags = list.map((a) => ({ title: words(a.title), all: words(`${a.title} ${a.description}`) }));
  const map = new Map<string, { related: RelatedArticle[]; newer?: RelatedArticle; older?: RelatedArticle }>();
  list.forEach((a, i) => {
    const newer = i > 0 ? list[i - 1] : undefined;
    const older = i < list.length - 1 ? list[i + 1] : undefined;
    const scored = list
      .map((b, j) => {
        if (j === i || b === newer || b === older) return { b, s: 0 };
        let s = 0;
        for (const w of bags[i].all) if (bags[j].all.has(w)) s += bags[i].title.has(w) && bags[j].title.has(w) ? 3 : 1;
        if (a.category === b.category && a.category !== "My Advice") s += 1;
        return { b, s };
      })
      .filter((x) => x.s >= 2)
      .sort((x, y) => y.s - x.s || y.b.date.localeCompare(x.b.date));
    map.set(a.slug, {
      related: scored.slice(0, 3).map((x) => toLink(x.b)),
      newer: newer && toLink(newer),
      older: older && toLink(older),
    });
  });
  return map;
}

export function relatedFor(slug?: string) {
  if (!slug) return undefined;
  cache ??= build();
  return cache.get(slug);
}
