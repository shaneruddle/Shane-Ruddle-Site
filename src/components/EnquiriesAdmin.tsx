import { useEffect, useMemo, useRef, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, serverTimestamp, Timestamp, query, orderBy, limit } from 'firebase/firestore';
import { Loader2, Inbox, ArrowLeft, Sparkles, Send, Archive, ArchiveRestore, ExternalLink, FileText, Mail, Phone, AlertTriangle, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

// Shane-only Enquiries tab: every Ask Shane question (contact_messages) and CV (cv_submissions) sent through
// the site. Claude drafts a reply from the site's own articles (server/enquiries.ts); Shane edits and sends it.

type Kind = 'question' | 'cv';
interface Reply { subject: string; body: string; to?: string; sentAt?: string }
interface Draft { subject: string; body: string; english?: string; sources?: string[]; read?: { title: string; url: string }[]; instructions?: string; createdAt?: string }
interface Enquiry {
  id: string;
  kind: Kind;
  name: string;
  email: string;
  createdAt?: Timestamp;
  status?: 'new' | 'replied' | 'archived';
  readAt?: Timestamp;
  draft?: Draft;
  replies?: Reply[];
  // questions
  message?: string;
  translation?: string | null;
  topic?: string | null;
  page?: string | null;
  lang?: string;
  publishOk?: boolean;
  // CVs
  phone?: string | null;
  role?: string | null;
  location?: string | null;
  years?: string | null;
  note?: string | null;
  context?: string | null;
  shareOk?: boolean;
  fileName?: string;
}

type View = 'open' | 'replied' | 'archived';

const when = (t?: Timestamp) =>
  t ? t.toDate().toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' }) : '';
const sentWhen = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' }) : '';
const statusOf = (e: Enquiry): View => (e.status === 'archived' ? 'archived' : e.status === 'replied' || e.replies?.length ? 'replied' : 'open');
const COLLECTION: Record<Kind, string> = { question: 'contact_messages', cv: 'cv_submissions' };

const api = async (path: string, body?: unknown) => {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(path, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
};

// Live list of both collections, newest first. Exported so the Reminders top bar can show a count.
export function useEnquiries() {
  const [questions, setQuestions] = useState<Enquiry[] | null>(null);
  const [cvs, setCvs] = useState<Enquiry[] | null>(null);
  useEffect(() => {
    const listen = (kind: Kind, set: (e: Enquiry[]) => void) =>
      onSnapshot(
        query(collection(db, COLLECTION[kind]), orderBy('createdAt', 'desc'), limit(200)),
        snap => set(snap.docs.map(d => ({ id: d.id, kind, ...d.data() } as Enquiry))),
        err => { console.error(`Error loading ${kind}s:`, err.message); set([]); },
      );
    const a = listen('question', setQuestions);
    const b = listen('cv', setCvs);
    return () => { a(); b(); };
  }, []);
  const all = useMemo(
    () => [...(questions || []), ...(cvs || [])].sort((x, y) => (y.createdAt?.toMillis() || Date.now()) - (x.createdAt?.toMillis() || Date.now())),
    [questions, cvs],
  );
  return { all, loading: questions === null || cvs === null };
}

const TOPIC_LABEL: Record<string, string> = {
  moving: 'Moving', retiring: 'Retiring', buying: 'Buying', renting: 'Renting', family: 'Family', visa: 'Visa', business: 'Business', work: 'Work', visiting: 'Visiting', other: 'Other',
};

export default function EnquiriesAdmin() {
  const { all, loading } = useEnquiries();
  const [view, setView] = useState<View>('open');
  const [openId, setOpenId] = useState<string | null>(null);
  const [sender, setSender] = useState<{ email: string; verified: boolean | null } | null>(null);

  useEffect(() => {
    api('/api/enquiries/sender').then(setSender).catch(() => setSender(null));
  }, []);

  const counts = { open: 0, replied: 0, archived: 0 } as Record<View, number>;
  all.forEach(e => counts[statusOf(e)]++);
  const shown = all.filter(e => statusOf(e) === view);
  const current = all.find(e => `${e.kind}:${e.id}` === openId);

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-gold-deep" /></div>;
  }

  return (
    <div className="max-w-3xl">
      {sender && sender.verified === false && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-sm text-amber-900 flex gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>Replies go out from <strong>{sender.email}</strong>, which isn't a verified sender in Brevo yet, so sending will fail. In Brevo, open Senders, domains &amp; IPs, add {sender.email} and click the link Brevo emails you.</p>
        </div>
      )}

      {current ? (
        <EnquiryDetail key={openId!} e={current} onBack={() => setOpenId(null)} />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {(['open', 'replied', 'archived'] as const).map(key => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-[0.12em] whitespace-nowrap transition-colors ${view === key ? 'bg-ink text-white' : 'bg-black/5 text-black/50 hover:text-ink'}`}
              >
                {key === 'open' ? `To answer (${counts.open})` : key === 'replied' ? `Replied (${counts.replied})` : `Archived (${counts.archived})`}
              </button>
            ))}
          </div>

          {shown.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border-2 border-dashed border-black/5">
              <Inbox className="w-12 h-12 text-black/10 mx-auto mb-4" />
              <p className="text-sm text-black/40 uppercase tracking-[0.12em] font-bold">
                {view === 'open' ? 'Nothing waiting for a reply.' : view === 'replied' ? 'No replies sent yet.' : 'Nothing archived.'}
              </p>
            </div>
          ) : (
            <ul className="bg-white border border-black/10 rounded-2xl divide-y divide-black/5 overflow-hidden">
              {shown.map(e => {
                const unread = !e.readAt && statusOf(e) === 'open';
                const text = e.kind === 'cv' ? [e.role, e.note].filter(Boolean).join(' · ') || 'CV attached' : e.translation || e.message || '';
                return (
                  <li key={`${e.kind}:${e.id}`}>
                    <button onClick={() => setOpenId(`${e.kind}:${e.id}`)} className="w-full text-left px-5 py-4 hover:bg-black/[0.02] transition-colors flex gap-3">
                      <span className={`mt-2 w-2 h-2 rounded-full shrink-0 ${unread ? 'bg-gold-deep' : 'bg-transparent'}`} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline gap-2">
                          <span className={`truncate ${unread ? 'font-semibold text-ink' : 'text-ink/80'}`}>{e.name || e.email}</span>
                          <span className="ml-auto text-xs text-black/40 shrink-0">{when(e.createdAt)}</span>
                        </span>
                        <span className="flex flex-wrap gap-1.5 mt-1">
                          <Badge>{e.kind === 'cv' ? 'CV' : 'Question'}</Badge>
                          {e.lang === 'de' && <Badge>German</Badge>}
                          {e.topic && <Badge>{TOPIC_LABEL[e.topic] || e.topic}</Badge>}
                          {e.draft && statusOf(e) === 'open' && <Badge gold>Draft ready</Badge>}
                        </span>
                        <span className="block mt-1.5 text-sm text-black/55 line-clamp-2 break-words">{text}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function Badge({ children, gold }: { children: React.ReactNode; gold?: boolean }) {
  return <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${gold ? 'bg-gold/15 text-gold-deep' : 'bg-black/5 text-black/50'}`}>{children}</span>;
}

function EnquiryDetail({ e, onBack }: { e: Enquiry; onBack: () => void }) {
  const ref = doc(db, COLLECTION[e.kind], e.id);
  const [instructions, setInstructions] = useState(e.draft?.instructions || '');
  const [subject, setSubject] = useState(e.draft?.subject || '');
  const [body, setBody] = useState(e.draft?.body || '');
  const [drafting, setDrafting] = useState(false);
  const [sending, setSending] = useState(false);
  const [showEnglish, setShowEnglish] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const status = statusOf(e);
  const [fresh, setFresh] = useState<Draft | null>(null);
  const draft = fresh && (!e.draft?.createdAt || fresh.createdAt! >= e.draft.createdAt) ? fresh : e.draft;
  const dirty = !!draft && (subject !== draft.subject || body !== draft.body);

  useEffect(() => {
    if (!e.readAt) updateDoc(ref, { readAt: serverTimestamp() }).catch(err => console.error('Mark read failed:', err.message));
    window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A fresh draft from Claude replaces the editor contents.
  useEffect(() => {
    if (draft?.createdAt) { setSubject(draft.subject); setBody(draft.body); }
  }, [draft?.createdAt]);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = `${el.scrollHeight + 4}px`; }
  }, [body]);

  const makeDraft = async () => {
    if (dirty && !window.confirm('Replace your edited reply with a new draft?')) return;
    setDrafting(true);
    try {
      const { draft: d } = await api('/api/enquiries/draft', { kind: e.kind, id: e.id, instructions });
      setFresh(d); setSubject(d.subject); setBody(d.body);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not draft a reply');
    } finally {
      setDrafting(false);
    }
  };

  const send = async () => {
    if (!subject.trim() || !body.trim()) return toast.error('Add a subject and a message first.');
    if (!window.confirm(`Send this reply to ${e.email}?`)) return;
    setSending(true);
    try {
      await api('/api/enquiries/send', { kind: e.kind, id: e.id, subject, body });
      toast.success(`Reply sent to ${e.name || e.email}`);
      onBack();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'The email did not send');
    } finally {
      setSending(false);
    }
  };

  const setArchived = async (archived: boolean) => {
    try {
      await updateDoc(ref, { status: archived ? 'archived' : e.replies?.length ? 'replied' : 'new' });
      toast.success(archived ? 'Archived' : 'Moved back');
      onBack();
    } catch (err) {
      toast.error('Could not update it');
      console.error('Archive failed:', err instanceof Error ? err.message : err);
    }
  };

  const rows: [string, React.ReactNode][] = e.kind === 'cv'
    ? [
        ['Work wanted', e.role], ['Where now', e.location], ['Time in Thailand', e.years],
        ['OK to pass on', e.shareOk ? 'Yes, to other owners' : 'No'],
        ['CV file', e.fileName ? `${e.fileName} (attached to the email you got)` : null],
      ]
    : [
        ['Planning', e.topic ? TOPIC_LABEL[e.topic] || e.topic : null],
        ['Asked from', e.page ? <a href={e.page} target="_blank" rel="noreferrer" className="text-gold-deep hover:underline inline-flex items-center gap-1">{e.page} <ExternalLink className="w-3 h-3" /></a> : null],
        ['OK for an article', e.topic ? (e.publishOk ? 'Yes, anonymously' : 'No') : null],
      ];

  return (
    <div>
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-black/50 hover:text-ink mb-5"><ArrowLeft className="w-4 h-4" /> All enquiries</button>

      <div className="p-6 bg-white border border-black/10 rounded-2xl">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-serif text-2xl text-ink">{e.name}</h2>
          <span className="text-xs text-black/40">{when(e.createdAt)}</span>
        </div>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-black/55">
          <a href={`mailto:${e.email}`} className="inline-flex items-center gap-1.5 hover:text-ink"><Mail className="w-3.5 h-3.5" /> {e.email}</a>
          {e.phone && <a href={`tel:${e.phone}`} className="inline-flex items-center gap-1.5 hover:text-ink"><Phone className="w-3.5 h-3.5" /> {e.phone}</a>}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          <Badge>{e.kind === 'cv' ? 'CV' : 'Ask Shane question'}</Badge>
          {e.lang === 'de' && <Badge>German site</Badge>}
        </div>
        <dl className="mt-4 grid grid-cols-[auto,1fr] gap-x-4 gap-y-1.5 text-sm">
          {rows.filter(([, v]) => v).map(([k, v]) => (
            <div key={k} className="contents"><dt className="text-black/40">{k}</dt><dd className="text-ink/80 break-words">{v}</dd></div>
          ))}
        </dl>

        {e.kind === 'question' && e.translation && (
          <div className="mt-5">
            <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-black/40 mb-1.5">English translation</p>
            <p className="text-ink/85 leading-relaxed whitespace-pre-line break-words">{e.translation}</p>
          </div>
        )}
        {(e.message || e.note || e.context) && (
          <div className="mt-5">
            <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-black/40 mb-1.5">{e.translation ? 'Original (German)' : e.kind === 'cv' ? 'Their note' : 'Their message'}</p>
            <p className={`leading-relaxed whitespace-pre-line break-words ${e.translation ? 'text-black/50 text-sm' : 'text-ink/85'}`}>{e.message || e.note}</p>
            {e.kind === 'cv' && e.context && <p className="mt-3 text-sm text-black/50 whitespace-pre-line break-words">{e.context}</p>}
          </div>
        )}
      </div>

      {e.replies?.map((r, i) => (
        <div key={i} className="mt-4 p-6 bg-gold/5 border border-gold/20 rounded-2xl">
          <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-gold-deep mb-1">You replied {sentWhen(r.sentAt)}</p>
          <p className="font-semibold text-ink text-sm mb-2">{r.subject}</p>
          <p className="text-sm text-ink/80 leading-relaxed whitespace-pre-line break-words">{r.body}</p>
        </div>
      ))}

      {status !== 'archived' && (
        <div className="mt-4 p-6 bg-white border border-black/10 rounded-2xl">
          <h3 className="font-serif text-xl text-ink">{e.replies?.length ? 'Send another reply' : 'Reply'}</h3>
          <label className="block mt-4 text-[11px] uppercase tracking-[0.14em] font-semibold text-black/40">Tell Claude what to say (optional)</label>
          <textarea
            value={instructions}
            onChange={ev => setInstructions(ev.target.value)}
            rows={2}
            placeholder="e.g. Suggest a call next week, mention our long-term rentals"
            className="mt-1.5 w-full px-4 py-3 rounded-xl border border-black/10 bg-cream/50 text-sm focus:outline-none focus:border-gold"
          />
          <button
            onClick={makeDraft}
            disabled={drafting || sending}
            className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-ink text-white text-sm font-semibold hover:bg-gold-deep transition-colors disabled:opacity-60"
          >
            {drafting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {drafting ? 'Reading your articles…' : draft || body ? 'Redraft with Claude' : 'Draft reply with Claude'}
          </button>

          {(draft || body) && (
            <div className="mt-6">
              <label className="block text-[11px] uppercase tracking-[0.14em] font-semibold text-black/40">Subject</label>
              <input value={subject} onChange={ev => setSubject(ev.target.value)} className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:border-gold" />
              <label className="block mt-4 text-[11px] uppercase tracking-[0.14em] font-semibold text-black/40">Message to {e.name?.split(' ')[0] || e.email}</label>
              <textarea
                ref={bodyRef}
                value={body}
                onChange={ev => setBody(ev.target.value)}
                className="mt-1.5 w-full min-h-[220px] px-4 py-3 rounded-xl border border-black/10 text-[15px] leading-relaxed focus:outline-none focus:border-gold resize-none"
              />
              <p className="mt-1 text-xs text-black/40">Links are written as [text](address) and become normal links in the email.</p>

              {draft?.english && (
                <div className="mt-4">
                  <button onClick={() => setShowEnglish(s => !s)} className="inline-flex items-center gap-1 text-sm text-gold-deep font-medium">
                    <ChevronDown className={`w-4 h-4 transition-transform ${showEnglish ? 'rotate-180' : ''}`} /> {showEnglish ? 'Hide' : 'Show'} English version of the draft
                  </button>
                  {showEnglish && <p className="mt-2 p-4 rounded-xl bg-black/[0.03] text-sm text-ink/80 leading-relaxed whitespace-pre-line break-words">{draft.english}{dirty ? '\n\n(This is the English of Claude\'s draft, before your edits.)' : ''}</p>}
                </div>
              )}

              {!!draft?.read?.length && (
                <div className="mt-4">
                  <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-black/40 mb-1.5">Claude read</p>
                  <ul className="flex flex-wrap gap-1.5">
                    {draft.read.map(s => (
                      <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/5 text-xs text-black/60 hover:text-ink"><FileText className="w-3 h-3" /> {s.title}</a></li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={send}
                disabled={sending || drafting || !body.trim()}
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gold-deep text-white text-sm font-semibold hover:bg-ink transition-colors disabled:opacity-60"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send to {e.email}
              </button>
              <p className="mt-2 text-xs text-black/40">Their reply comes back to your Gmail, and you get a copy of what you send.</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-4">
        <button
          onClick={() => setArchived(status !== 'archived')}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-black/5 text-black/60 rounded-full text-xs font-semibold hover:text-ink transition-colors"
        >
          {status === 'archived' ? <><ArchiveRestore className="w-4 h-4" /> Move back</> : <><Archive className="w-4 h-4" /> Archive, no reply needed</>}
        </button>
      </div>
    </div>
  );
}
