import { FormEvent, useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { trackEvent } from "../lib/analytics";

interface PublicComment {
  id: string;
  name: string;
  body: string;
  createdAt?: { toDate: () => Date };
}

const formatCommentDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Bangkok" });

// Public comments under an article. New comments go to /api/comments, where an AI check publishes clearly
// fine ones straight away and holds the rest as "pending" for approval in the portal.
export default function ArticleComments({ slug }: { slug: string }) {
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [website, setWebsite] = useState(""); // honeypot: hidden from people, often filled in by bots
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<false | "approved" | "pending">(false);
  const [error, setError] = useState("");

  // Firebase loads lazily, as on the article list, so the article still renders if it can't start.
  useEffect(() => {
    let unsubscribe = () => {};
    let cancelled = false;
    Promise.all([import("../firebase"), import("firebase/firestore")])
      .then(([{ db }, { collection, query, where, onSnapshot }]) => {
        if (cancelled) return;
        const q = query(collection(db, "comments"), where("articleSlug", "==", slug), where("status", "==", "approved"));
        unsubscribe = onSnapshot(q, (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PublicComment));
          list.sort((a, b) => (a.createdAt?.toDate().getTime() || 0) - (b.createdAt?.toDate().getTime() || 0));
          setComments(list);
        }, (err) => console.error("Error loading comments:", err.message));
      })
      .catch((err) => console.error("Could not load comments:", err instanceof Error ? err.message : err));
    return () => { cancelled = true; unsubscribe(); };
  }, [slug]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (website) { setSubmitted("pending"); return; }
    const trimmedName = name.trim();
    const trimmedBody = body.trim();
    if (!trimmedName || !trimmedBody) return;
    setIsSubmitting(true);
    setError("");
    const comment = { articleSlug: slug, name: trimmedName.slice(0, 60), body: trimmedBody.slice(0, 2000) };
    try {
      let status: "approved" | "pending" = "pending";
      let response: Response | null = null;
      try {
        response = await fetch("/api/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...comment, website }),
        });
      } catch {
        response = null;
      }
      if (response && response.ok) {
        status = (await response.json()).status === "approved" ? "approved" : "pending";
      } else if (response && response.status < 500) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Comment rejected");
      } else {
        // Server unavailable: fall back to saving it straight to the approval queue.
        const [{ db }, { collection, addDoc, serverTimestamp }] = await Promise.all([import("../firebase"), import("firebase/firestore")]);
        await addDoc(collection(db, "comments"), { ...comment, status: "pending", createdAt: serverTimestamp() });
      }
      trackEvent("comment_submitted", { article: slug, status });
      setSubmitted(status);
      setName("");
      setBody("");
    } catch (err) {
      console.error("Error saving comment:", err instanceof Error ? err.message : "Unknown error");
      const message = err instanceof Error && err.message.startsWith("Too many") ? err.message : "Sorry, your comment couldn't be sent. Please try again in a moment.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const field = "w-full bg-white border border-black/10 rounded-xl px-4 py-3 text-ink placeholder:text-black/35 focus:border-gold-deep focus:outline-none transition-colors";

  return (
    <section className="mt-24" aria-labelledby="comments-heading">
      <h4 id="comments-heading" className="text-3xl font-serif mb-8 flex items-center gap-3">
        <MessageCircle className="w-6 h-6 text-gold-deep" />
        {comments.length ? `Comments (${comments.length})` : "Comments"}
      </h4>

      {comments.length > 0 && (
        <ul className="space-y-6 mb-12">
          {comments.map((c) => (
            <li key={c.id} className="p-6 bg-[#F8F8F8] rounded-2xl">
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                <span className="font-semibold text-ink">{c.name}</span>
                {c.createdAt && (
                  <span className="text-[11px] uppercase tracking-widest text-black/40">{formatCommentDate(c.createdAt.toDate())}</span>
                )}
              </div>
              <p className="text-black/70 font-light leading-relaxed whitespace-pre-line break-words">{c.body}</p>
            </li>
          ))}
        </ul>
      )}

      {submitted ? (
        <div className="p-8 border border-gold/30 rounded-2xl bg-cream text-center">
          <p className="text-black/70 font-light leading-relaxed mb-4">
            {submitted === "approved"
              ? "Thanks for your comment. It's now live above."
              : "Thanks for your comment. It will appear here once it has been approved."}
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="text-[10px] uppercase tracking-widest font-bold text-gold-deep hover:text-gold-dark transition-colors"
          >
            Leave another comment
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-black/50 font-light">
            {comments.length ? "Join the conversation." : "Be the first to comment."} Comments are checked before they appear.
          </p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={60}
            required
            aria-label="Your name"
            className={field}
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Your comment"
            maxLength={2000}
            rows={5}
            required
            aria-label="Your comment"
            className={field}
          />
          <input
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
            name="website"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 bg-ink text-white rounded-full text-[11px] uppercase tracking-widest font-bold hover:bg-gold-deep transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Sending…" : "Post comment"}
          </button>
        </form>
      )}
    </section>
  );
}
