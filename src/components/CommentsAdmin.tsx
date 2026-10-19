import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Check, Trash2, Loader2, MessageCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface ArticleComment {
  id: string;
  articleSlug: string;
  name: string;
  body: string;
  status: 'pending' | 'approved';
  createdAt?: Timestamp;
  moderation?: { decision: string; reason: string; by: string };
}

const formatDateTime = (t?: Timestamp) =>
  t ? t.toDate().toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' }) : '';

// Admin-only moderation for article comments: approve pending ones, delete any.
export default function CommentsAdmin() {
  const [comments, setComments] = useState<ArticleComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [view, setView] = useState<'pending' | 'approved'>('pending');

  useEffect(() => {
    return onSnapshot(collection(db, 'comments'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ArticleComment));
      list.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setComments(list);
      setLoading(false);
    }, (err) => {
      console.error('Error loading comments:', err.message);
      toast.error('Could not load comments');
      setLoading(false);
    });
  }, []);

  const approve = async (c: ArticleComment) => {
    setBusyId(c.id);
    try {
      await updateDoc(doc(db, 'comments', c.id), { status: 'approved', approvedAt: serverTimestamp() });
      toast.success('Comment approved');
    } catch (err) {
      console.error('Error approving comment:', err instanceof Error ? err.message : err);
      toast.error('Could not approve comment');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (c: ArticleComment) => {
    if (!window.confirm(`Delete this comment from ${c.name}? This can't be undone.`)) return;
    setBusyId(c.id);
    try {
      await deleteDoc(doc(db, 'comments', c.id));
      toast.success('Comment deleted');
    } catch (err) {
      console.error('Error deleting comment:', err instanceof Error ? err.message : err);
      toast.error('Could not delete comment');
    } finally {
      setBusyId(null);
    }
  };

  const pendingCount = comments.filter(c => c.status === 'pending').length;
  const shown = comments.filter(c => c.status === view);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-gold-deep" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-8">
        {(['pending', 'approved'] as const).map(key => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-widest transition-colors ${view === key ? 'bg-ink text-white' : 'bg-black/5 text-black/50 hover:text-ink'}`}
          >
            {key === 'pending' ? `Awaiting approval (${pendingCount})` : 'Approved'}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border-2 border-dashed border-black/5">
          <MessageCircle className="w-12 h-12 text-black/10 mx-auto mb-4" />
          <p className="text-sm text-black/40 uppercase tracking-widest font-bold">
            {view === 'pending' ? 'No comments waiting for approval.' : 'No approved comments yet.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {shown.map(c => (
            <li key={c.id} className="p-6 bg-white border border-black/10 rounded-2xl">
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                <span className="font-semibold text-ink">{c.name}</span>
                <span className="text-xs text-black/40">{formatDateTime(c.createdAt)}</span>
              </div>
              <a
                href={`/articles/${c.articleSlug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-gold-deep hover:underline mb-3"
              >
                /articles/{c.articleSlug} <ExternalLink className="w-3 h-3" />
              </a>
              <p className="text-black/70 font-light leading-relaxed whitespace-pre-line break-words mb-4">{c.body}</p>
              {c.moderation?.reason && (
                <p className="text-xs text-black/40 mb-4">
                  {c.moderation.decision === 'approved' ? 'Auto-approved' : 'Held by AI check'}: {c.moderation.reason}
                </p>
              )}
              <div className="flex gap-2">
                {c.status === 'pending' && (
                  <button
                    onClick={() => approve(c)}
                    disabled={busyId === c.id}
                    className="flex items-center gap-1.5 px-4 py-2 bg-ink text-white rounded-full text-xs font-semibold hover:bg-gold-deep transition-colors disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" /> Approve
                  </button>
                )}
                <button
                  onClick={() => remove(c)}
                  disabled={busyId === c.id}
                  className="flex items-center gap-1.5 px-4 py-2 bg-black/5 text-black/60 rounded-full text-xs font-semibold hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
