// Articles stored as markdown files in content/articles/<slug>.md, published by committing to main.
// Each file starts with a frontmatter block:
//
//   ---
//   title: What 15 years running a car rental in Pattaya taught me
//   description: One or two sentences for Google and social previews (max ~155 characters).
//   category: Car Rental            # My Advice | Property | Car Rental | Pattaya News
//   date: 2026-10-19                # publish date, YYYY-MM-DD
//   image: /images/articles/x.webp  # optional
//   draft: true                     # optional: hides the article
//   ---
//
// The filename (without .md) is the URL: /articles/<slug>.

export interface FileArticle {
  slug: string;
  title: string;
  description: string;
  category: string;
  date: string; // YYYY-MM-DD
  image?: string;
  body: string;
}

const files = import.meta.glob("/content/articles/*.md", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

function parse(path: string, raw: string): (FileArticle & { draft: boolean }) | null {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return null;
  const meta: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z]+):\s*(.*?)\s*(#.*)?$/);
    if (m) meta[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  const slug = path.split("/").pop()!.replace(/\.md$/, "");
  if (!meta.title) return null;
  return {
    slug,
    title: meta.title,
    description: meta.description || "",
    category: meta.category || "My Advice",
    date: meta.date || "1970-01-01",
    image: meta.image || undefined,
    body: match[2].trim(),
    draft: meta.draft === "true",
  };
}

export const FILE_ARTICLES: FileArticle[] = Object.entries(files)
  .map(([path, raw]) => parse(path, raw))
  .filter((a): a is FileArticle & { draft: boolean } => !!a && !a.draft)
  .map(({ draft: _draft, ...a }) => a)
  .sort((a, b) => b.date.localeCompare(a.date));
