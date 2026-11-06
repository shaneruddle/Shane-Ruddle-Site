import { useEffect, useMemo, useRef, useState } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp, deleteField } from 'firebase/firestore';
import { Loader2, Plus, X, Trash2, Flag, Repeat as RepeatIcon, MapPin, CalendarDays, Sun, Inbox, ChevronLeft, ChevronRight, ListPlus, Check } from 'lucide-react';
import { toast } from 'sonner';
import { bkkToday, bkkNowTime, addDays, nextDue, repeatLabel, type Repeat, type RepeatFreq } from '../../server/reminderDates';

// Shane's private Reminders. Data lives in reminders / reminder_lists, which firestore.rules lock to Shane
// alone (isShane(), not admins). Dates are Pattaya time. Repeating reminders roll forward when ticked,
// like iPhone Reminders. Places are matched by name when an iPhone Shortcuts automation reports arriving.

interface ReminderList { id: string; name: string; color: string; order?: number }
interface Reminder {
  id: string;
  title: string;
  notes?: string;
  listId: string;
  dueDate?: string | null;
  dueTime?: string | null;
  repeat?: Repeat | null;
  place?: string | null;
  placeWhen?: 'arrive' | 'leave';
  flagged?: boolean;
  done?: boolean;
  completedAt?: Timestamp;
  createdAt?: Timestamp;
}

type View = { kind: 'home' } | { kind: 'today' | 'scheduled' | 'flagged' | 'all' | 'places' } | { kind: 'list'; id: string };

const COLORS = ['#D4AF37', '#2563EB', '#16A34A', '#DC2626', '#EA580C', '#9333EA', '#DB2777', '#0891B2', '#57534E'];
const REPEATS: { label: string; value: '' | `${RepeatFreq}:${number}` }[] = [
  { label: 'Never', value: '' },
  { label: 'Daily', value: 'daily:1' },
  { label: 'Weekdays', value: 'weekdays:1' },
  { label: 'Weekly', value: 'weekly:1' },
  { label: 'Fortnightly', value: 'weekly:2' },
  { label: 'Monthly', value: 'monthly:1' },
  { label: 'Every 3 months', value: 'monthly:3' },
  { label: 'Every 6 months', value: 'monthly:6' },
  { label: 'Yearly', value: 'yearly:1' },
];
const repeatValue = (r?: Repeat | null) => (r ? `${r.freq}:${r.interval || 1}` : '');
const parseRepeat = (v: string): Repeat | null => {
  if (!v) return null;
  const [freq, n] = v.split(':');
  return { freq: freq as RepeatFreq, interval: Number(n) || 1 };
};

const inputClass = 'w-full px-4 py-3 rounded-xl bg-black/5 text-[15px] border-0 focus:ring-2 focus:ring-gold-deep/30';

const prettyDue = (r: Reminder, now: string) => {
  if (!r.dueDate) return '';
  const time = r.dueTime ? new Date(`2000-01-01T${r.dueTime}:00`).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(' ', '') : '';
  let day: string;
  if (r.dueDate === now) day = 'Today';
  else if (r.dueDate === addDays(now, 1)) day = 'Tomorrow';
  else if (r.dueDate === addDays(now, -1)) day = 'Yesterday';
  else {
    const d = new Date(`${r.dueDate}T12:00:00+07:00`);
    const sameYear = r.dueDate.slice(0, 4) === now.slice(0, 4);
    day = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }), timeZone: 'Asia/Bangkok' });
  }
  return time ? `${day}, ${time}` : day;
};

const isOverdue = (r: Reminder, now: string, nowTime: string) =>
  !!r.dueDate && (r.dueDate < now || (r.dueDate === now && !!r.dueTime && r.dueTime < nowTime));

const byDue = (a: Reminder, b: Reminder) =>
  (a.dueDate || '9999').localeCompare(b.dueDate || '9999') ||
  (a.dueTime || '99').localeCompare(b.dueTime || '99') ||
  (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0);

export default function RemindersAdmin() {
  const [lists, setLists] = useState<ReminderList[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loaded, setLoaded] = useState({ lists: false, reminders: false });
  const [view, setView] = useState<View>({ kind: 'home' });
  const [showDone, setShowDone] = useState(false);
  const [editing, setEditing] = useState<Partial<Reminder> | null>(null);
  const [editList, setEditList] = useState<Partial<ReminderList> | null>(null);
  const [quick, setQuick] = useState('');
  // Ticked one-off reminders stay on screen briefly (with a filled circle) so a mis-tap is easy to undo.
  const [justDone, setJustDone] = useState<Set<string>>(new Set());
  const [clock, setClock] = useState(() => ({ day: bkkToday(), time: bkkNowTime() }));
  const creatingDefault = useRef(false);
  const quickRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setInterval(() => setClock({ day: bkkToday(), time: bkkNowTime() }), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const offLists = onSnapshot(collection(db, 'reminder_lists'), snap => {
      setLists(snap.docs.map(d => ({ id: d.id, ...d.data() } as ReminderList)).sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name)));
      setLoaded(l => ({ ...l, lists: true }));
    }, err => { console.error('Reminder lists failed:', err.message); toast.error('Could not load lists'); });
    const offReminders = onSnapshot(collection(db, 'reminders'), snap => {
      setReminders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Reminder)));
      setLoaded(l => ({ ...l, reminders: true }));
    }, err => { console.error('Reminders failed:', err.message); toast.error('Could not load reminders'); });
    return () => { offLists(); offReminders(); };
  }, []);

  // First visit: make a default list so a reminder always has somewhere to go.
  useEffect(() => {
    if (loaded.lists && lists.length === 0 && !creatingDefault.current) {
      creatingDefault.current = true;
      addDoc(collection(db, 'reminder_lists'), { name: 'Reminders', color: COLORS[1], order: 0, createdAt: serverTimestamp() }).catch(() => { creatingDefault.current = false; });
    }
  }, [loaded.lists, lists.length]);

  const now = clock.day;
  const listById = useMemo(() => Object.fromEntries(lists.map(l => [l.id, l])), [lists]);
  const open = reminders.filter(r => !r.done);
  const places = useMemo(() => [...new Set(reminders.map(r => r.place?.trim()).filter(Boolean) as string[])].sort(), [reminders]);

  const counts = {
    today: open.filter(r => r.dueDate && r.dueDate <= now).length,
    scheduled: open.filter(r => r.dueDate).length,
    flagged: open.filter(r => r.flagged).length,
    all: open.length,
    places: open.filter(r => r.place).length,
  };

  const inView = (r: Reminder) => {
    switch (view.kind) {
      case 'today': return !!r.dueDate && r.dueDate <= now;
      case 'scheduled': return !!r.dueDate;
      case 'flagged': return !!r.flagged;
      case 'places': return !!r.place;
      case 'list': return r.listId === view.id;
      default: return true;
    }
  };
  const shown = reminders
    .filter(inView)
    .filter(r => !r.done || showDone || justDone.has(r.id))
    .sort((a, b) => Number(!!a.done && !justDone.has(a.id)) - Number(!!b.done && !justDone.has(b.id)) || byDue(a, b));

  const defaultListId = view.kind === 'list' ? view.id : lists[0]?.id;

  const quickAdd = async () => {
    const title = quick.trim();
    if (!title || !defaultListId) return;
    setQuick('');
    const fields: Record<string, unknown> = { title, listId: defaultListId, done: false, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    if (view.kind === 'today' || view.kind === 'scheduled') fields.dueDate = now;
    if (view.kind === 'flagged') fields.flagged = true;
    try {
      await addDoc(collection(db, 'reminders'), fields);
    } catch {
      toast.error('Could not add');
      setQuick(title);
    }
  };

  const toggleDone = async (r: Reminder) => {
    try {
      if (r.done) {
        await updateDoc(doc(db, 'reminders', r.id), { done: false, completedAt: deleteField(), updatedAt: serverTimestamp() });
        setJustDone(s => { const n = new Set(s); n.delete(r.id); return n; });
        return;
      }
      if (r.repeat) {
        // Roll forward to the next date after the due date (or after today if it has no date yet).
        const next = nextDue(r.dueDate || now, r.repeat);
        await updateDoc(doc(db, 'reminders', r.id), { dueDate: next, lastDoneOn: now, updatedAt: serverTimestamp() });
        toast.success(`Done. Next one: ${prettyDue({ ...r, dueDate: next }, now)}`);
        return;
      }
      setJustDone(s => new Set(s).add(r.id));
      await updateDoc(doc(db, 'reminders', r.id), { done: true, completedAt: serverTimestamp(), updatedAt: serverTimestamp() });
      setTimeout(() => setJustDone(s => { const n = new Set(s); n.delete(r.id); return n; }), 1800);
    } catch {
      toast.error('Could not update');
    }
  };

  const toggleFlag = (r: Reminder) =>
    updateDoc(doc(db, 'reminders', r.id), { flagged: !r.flagged, updatedAt: serverTimestamp() }).catch(() => toast.error('Could not update'));

  const save = async () => {
    if (!editing?.title?.trim()) { toast.error('Add a title first'); return; }
    const { id, createdAt, completedAt, ...rest } = editing;
    const data: Record<string, unknown> = {
      title: editing.title.trim(),
      notes: editing.notes?.trim() || '',
      listId: editing.listId || defaultListId,
      dueDate: editing.dueDate || null,
      dueTime: editing.dueDate && editing.dueTime ? editing.dueTime : null,
      repeat: editing.repeat || null,
      place: editing.place?.trim() || null,
      placeWhen: editing.place?.trim() ? editing.placeWhen || 'arrive' : null,
      flagged: !!rest.flagged,
      updatedAt: serverTimestamp(),
    };
    try {
      if (id) await updateDoc(doc(db, 'reminders', id), data);
      else await addDoc(collection(db, 'reminders'), { ...data, done: false, createdAt: serverTimestamp() });
      setEditing(null);
    } catch (err) {
      console.error('Reminder save failed:', err instanceof Error ? err.message : err);
      toast.error('Could not save');
    }
  };

  const remove = async (r: Partial<Reminder>) => {
    if (!r.id) return;
    try {
      await deleteDoc(doc(db, 'reminders', r.id));
      setEditing(null);
      toast.success('Deleted');
    } catch {
      toast.error('Could not delete');
    }
  };

  const saveList = async () => {
    const name = editList?.name?.trim();
    if (!name) { toast.error('Name the list'); return; }
    try {
      if (editList?.id) await updateDoc(doc(db, 'reminder_lists', editList.id), { name, color: editList.color || COLORS[0] });
      else {
        const created = await addDoc(collection(db, 'reminder_lists'), { name, color: editList?.color || COLORS[lists.length % COLORS.length], order: lists.length, createdAt: serverTimestamp() });
        setView({ kind: 'list', id: created.id });
      }
      setEditList(null);
    } catch {
      toast.error('Could not save list');
    }
  };

  const removeList = async (l: Partial<ReminderList>) => {
    if (!l.id) return;
    const inside = reminders.filter(r => r.listId === l.id);
    if (lists.length <= 1) { toast.error('Keep at least one list'); return; }
    if (!confirm(`Delete "${l.name}"${inside.length ? ` and its ${inside.length} reminder${inside.length === 1 ? '' : 's'}` : ''}? This can't be undone.`)) return;
    try {
      await Promise.all(inside.map(r => deleteDoc(doc(db, 'reminders', r.id))));
      await deleteDoc(doc(db, 'reminder_lists', l.id));
      setEditList(null);
      setView({ kind: 'home' });
    } catch {
      toast.error('Could not delete list');
    }
  };

  if (!loaded.lists || !loaded.reminders) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-gold-deep" /></div>;
  }

  const viewTitle = view.kind === 'list' ? listById[view.id]?.name || 'List'
    : { home: 'Reminders', today: 'Today', scheduled: 'Scheduled', flagged: 'Flagged', all: 'All', places: 'Places' }[view.kind];
  const viewColor = view.kind === 'list' ? listById[view.id]?.color : { home: '#0A0A0A', today: '#2563EB', scheduled: '#DC2626', flagged: '#EA580C', all: '#57534E', places: '#16A34A' }[view.kind];

  const tile = (kind: 'today' | 'scheduled' | 'flagged' | 'all', label: string, Icon: typeof Sun, color: string) => (
    <button key={kind} onClick={() => setView({ kind })} className="p-4 rounded-2xl bg-white border border-black/10 text-left active:scale-[0.98] transition-transform">
      <div className="flex items-start justify-between">
        <span className="w-9 h-9 rounded-full flex items-center justify-center text-white" style={{ background: color }}><Icon className="w-[18px] h-[18px]" /></span>
        <span className="text-[26px] font-semibold text-ink leading-none">{counts[kind]}</span>
      </div>
      <div className="mt-3 text-[15px] font-semibold text-black/60">{label}</div>
    </button>
  );

  const row = (r: Reminder) => {
    const ticked = !!r.done || justDone.has(r.id);
    const list = listById[r.listId];
    const overdue = !ticked && isOverdue(r, now, clock.time);
    const meta = [
      r.dueDate && <span key="d" className={overdue ? 'text-danger' : ''}>{prettyDue(r, now)}</span>,
      r.repeat && <span key="r" className="inline-flex items-center gap-1"><RepeatIcon className="w-3 h-3" />{repeatLabel(r.repeat)}</span>,
      r.place && <span key="p" className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{r.placeWhen === 'leave' ? 'Leaving' : 'At'} {r.place}</span>,
      view.kind !== 'list' && list && <span key="l" style={{ color: list.color }}>{list.name}</span>,
    ].filter(Boolean);
    return (
      <li key={r.id} className="flex items-start gap-3 py-3 border-b border-black/[0.07] last:border-0">
        <button
          onClick={() => toggleDone(r)}
          aria-label={ticked ? 'Mark not done' : 'Mark done'}
          className="mt-0.5 w-[22px] h-[22px] shrink-0 rounded-full border-2 flex items-center justify-center transition-colors"
          style={{ borderColor: ticked ? list?.color || '#0A0A0A' : 'rgba(0,0,0,0.25)', background: ticked ? list?.color || '#0A0A0A' : 'transparent' }}
        >
          {ticked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
        </button>
        <button onClick={() => setEditing(r)} className="min-w-0 flex-1 text-left">
          <div className={`text-[15px] leading-snug ${ticked ? 'text-black/35' : 'text-ink'}`}>{r.title}</div>
          {r.notes && <div className="text-[13px] text-black/45 mt-0.5 line-clamp-2">{r.notes}</div>}
          {meta.length > 0 && <div className="mt-1 flex flex-wrap gap-x-2.5 gap-y-0.5 text-[12px] text-black/45">{meta}</div>}
        </button>
        <button onClick={() => toggleFlag(r)} aria-label={r.flagged ? 'Unflag' : 'Flag'} className="p-1 -mr-1 shrink-0">
          <Flag className={`w-4 h-4 ${r.flagged ? 'text-orange-500 fill-orange-500' : 'text-black/15'}`} />
        </button>
      </li>
    );
  };

  // Scheduled view is grouped by day, with overdue first.
  const grouped = () => {
    const groups: { label: string; items: Reminder[] }[] = [];
    for (const r of shown) {
      const label = !r.dueDate ? 'No date' : r.dueDate < now && !r.done ? 'Overdue' : prettyDue({ ...r, dueTime: null }, now);
      const g = groups.find(x => x.label === label);
      if (g) g.items.push(r); else groups.push({ label, items: [r] });
    }
    return groups;
  };

  return (
    <div className="max-w-xl mx-auto pb-28">
      {view.kind === 'home' ? (
        <>
          <div className="mb-5">
            <h2 className="text-2xl font-serif">Your <span className="italic">Reminders</span></h2>
            <p className="text-sm text-black/45 mt-1">Private to your login only.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {tile('today', 'Today', Sun, '#2563EB')}
            {tile('scheduled', 'Scheduled', CalendarDays, '#DC2626')}
            {tile('flagged', 'Flagged', Flag, '#EA580C')}
            {tile('all', 'All', Inbox, '#57534E')}
          </div>
          {counts.places > 0 && (
            <button onClick={() => setView({ kind: 'places' })} className="mt-3 w-full p-4 rounded-2xl bg-white border border-black/10 flex items-center gap-3 text-left">
              <span className="w-9 h-9 rounded-full flex items-center justify-center text-white bg-success"><MapPin className="w-[18px] h-[18px]" /></span>
              <span className="flex-1 text-[15px] font-semibold text-black/60">Places</span>
              <span className="text-[17px] font-semibold text-ink">{counts.places}</span>
            </button>
          )}

          <div className="mt-7 flex items-center justify-between">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/45">My lists</h3>
            <button onClick={() => setEditList({ name: '', color: COLORS[lists.length % COLORS.length] })} className="flex items-center gap-1.5 text-sm text-gold-deep font-medium"><ListPlus className="w-4 h-4" /> Add list</button>
          </div>
          <ul className="mt-2 rounded-2xl bg-white border border-black/10 overflow-hidden">
            {lists.map(l => (
              <li key={l.id} className="border-b border-black/[0.07] last:border-0">
                <button onClick={() => setView({ kind: 'list', id: l.id })} className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
                  <span className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold" style={{ background: l.color }}>{l.name.slice(0, 1).toUpperCase()}</span>
                  <span className="flex-1 text-[15px] text-ink">{l.name}</span>
                  <span className="text-[15px] text-black/40">{open.filter(r => r.listId === l.id).length}</span>
                  <ChevronRight className="w-4 h-4 text-black/25" />
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => { setView({ kind: 'home' }); setShowDone(false); }} className="flex items-center gap-1 -ml-1 text-[15px] text-gold-deep font-medium"><ChevronLeft className="w-5 h-5" /> Lists</button>
            <div className="flex items-center gap-4">
              {view.kind === 'list' && <button onClick={() => setEditList(listById[view.id])} className="text-sm text-black/45">Edit list</button>}
              <button onClick={() => setShowDone(s => !s)} className="text-sm text-black/45">{showDone ? 'Hide completed' : 'Show completed'}</button>
            </div>
          </div>
          <h2 className="text-[32px] font-bold leading-tight mb-2" style={{ color: viewColor }}>{viewTitle}</h2>

          {view.kind === 'scheduled' ? (
            grouped().map(g => (
              <section key={g.label} className="mt-4">
                <h3 className={`text-[13px] font-semibold ${g.label === 'Overdue' ? 'text-danger' : 'text-black/55'}`}>{g.label}</h3>
                <ul>{g.items.map(row)}</ul>
              </section>
            ))
          ) : (
            <ul>{shown.map(row)}</ul>
          )}
          {shown.length === 0 && <p className="py-10 text-center text-black/35 text-[15px]">{view.kind === 'today' ? 'Nothing due today.' : 'No reminders.'}</p>}

          <div className="mt-2 flex items-center gap-3 py-2">
            <span className="w-[22px] h-[22px] shrink-0 rounded-full border-2 border-dashed border-black/20" />
            <input
              ref={quickRef}
              value={quick}
              onChange={e => setQuick(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') quickAdd(); }}
              placeholder="New reminder"
              enterKeyHint="done"
              className="flex-1 bg-transparent border-0 p-0 text-[15px] focus:ring-0 placeholder:text-black/30"
            />
            {quick.trim() && <button onClick={quickAdd} className="text-sm font-semibold text-gold-deep">Add</button>}
          </div>
        </>
      )}

      {/* Floating add button: opens the full editor with sensible defaults for the current view. */}
      <button
        onClick={() => setEditing({ title: '', listId: defaultListId, dueDate: view.kind === 'today' ? now : null, flagged: view.kind === 'flagged', placeWhen: 'arrive' })}
        className="fixed bottom-6 right-5 z-30 flex items-center gap-2 pl-4 pr-5 py-3.5 rounded-full bg-ink text-white shadow-xl shadow-black/20 text-[15px] font-semibold"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        <Plus className="w-5 h-5" /> New reminder
      </button>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={() => setEditing(null)}>
          <div className="w-full sm:max-w-md max-h-[92vh] overflow-y-auto bg-cream rounded-t-3xl sm:rounded-3xl p-5" style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setEditing(null)} className="text-[15px] text-black/50">Cancel</button>
              <span className="text-[15px] font-semibold">{editing.id ? 'Details' : 'New reminder'}</span>
              <button onClick={save} className="text-[15px] font-semibold text-gold-deep">{editing.id ? 'Done' : 'Add'}</button>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl bg-white p-1">
                <input autoFocus={!editing.id} value={editing.title || ''} onChange={e => setEditing({ ...editing, title: e.target.value })} placeholder="Title" className="w-full px-3 py-3 bg-transparent border-0 text-[16px] focus:ring-0" />
                <div className="mx-3 border-t border-black/[0.07]" />
                <textarea value={editing.notes || ''} onChange={e => setEditing({ ...editing, notes: e.target.value })} placeholder="Notes" rows={2} className="w-full px-3 py-3 bg-transparent border-0 text-[15px] focus:ring-0 resize-none" />
              </div>

              <div className="rounded-2xl bg-white p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-danger shrink-0" />
                  <span className="text-[15px] flex-1">Date</span>
                  {editing.dueDate && <button onClick={() => setEditing({ ...editing, dueDate: null, dueTime: null, repeat: null })} className="text-xs text-black/40">Clear</button>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {[['Today', now], ['Tomorrow', addDays(now, 1)], ['Next week', addDays(now, 7)]].map(([label, d]) => (
                    <button key={label} onClick={() => setEditing({ ...editing, dueDate: d })} className={`px-3.5 py-1.5 rounded-full text-[13px] ${editing.dueDate === d ? 'bg-ink text-white' : 'bg-black/5 text-black/60'}`}>{label}</button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={editing.dueDate || ''} onChange={e => setEditing({ ...editing, dueDate: e.target.value || null })} className={inputClass} />
                  <input type="time" value={editing.dueTime || ''} disabled={!editing.dueDate} onChange={e => setEditing({ ...editing, dueTime: e.target.value || null })} className={`${inputClass} disabled:opacity-40`} />
                </div>
                <label className="flex items-center gap-2">
                  <RepeatIcon className="w-5 h-5 text-black/45 shrink-0" />
                  <span className="text-[15px] flex-1">Repeat</span>
                  <select
                    value={repeatValue(editing.repeat)}
                    onChange={e => setEditing({ ...editing, repeat: parseRepeat(e.target.value), dueDate: editing.dueDate || (e.target.value ? now : null) })}
                    className="px-3 py-2 rounded-xl bg-black/5 text-[14px] border-0"
                  >
                    {REPEATS.map(o => <option key={o.label} value={o.value}>{o.label}</option>)}
                  </select>
                </label>
              </div>

              <div className="rounded-2xl bg-white p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-success shrink-0" />
                  <span className="text-[15px] flex-1">Location</span>
                </div>
                <input list="reminder-places" value={editing.place || ''} onChange={e => setEditing({ ...editing, place: e.target.value })} placeholder="e.g. Hemingways Jomtien, Home, Office" className={inputClass} />
                <datalist id="reminder-places">{places.map(p => <option key={p} value={p} />)}</datalist>
                {editing.place?.trim() && (
                  <div className="flex gap-2">
                    {(['arrive', 'leave'] as const).map(w => (
                      <button key={w} onClick={() => setEditing({ ...editing, placeWhen: w })} className={`flex-1 py-2 rounded-full text-[13px] ${(editing.placeWhen || 'arrive') === w ? 'bg-ink text-white' : 'bg-black/5 text-black/60'}`}>{w === 'arrive' ? 'When I arrive' : 'When I leave'}</button>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-white p-4 space-y-3">
                <label className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full shrink-0" style={{ background: listById[editing.listId || defaultListId || '']?.color }} />
                  <span className="text-[15px] flex-1">List</span>
                  <select value={editing.listId || defaultListId} onChange={e => setEditing({ ...editing, listId: e.target.value })} className="px-3 py-2 rounded-xl bg-black/5 text-[14px] border-0 max-w-[60%]">
                    {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </label>
                <label className="flex items-center gap-2">
                  <Flag className="w-5 h-5 text-orange-500 shrink-0" />
                  <span className="text-[15px] flex-1">Flag</span>
                  <input type="checkbox" checked={!!editing.flagged} onChange={e => setEditing({ ...editing, flagged: e.target.checked })} className="w-5 h-5 rounded accent-orange-500" />
                </label>
              </div>

              {editing.id && (
                <button onClick={() => remove(editing)} className="w-full py-3 rounded-2xl bg-white text-danger text-[15px] flex items-center justify-center gap-2"><Trash2 className="w-4 h-4" /> Delete reminder</button>
              )}
            </div>
          </div>
        </div>
      )}

      {editList && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={() => setEditList(null)}>
          <div className="w-full sm:max-w-md bg-cream rounded-t-3xl sm:rounded-3xl p-5" style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setEditList(null)} className="text-[15px] text-black/50">Cancel</button>
              <span className="text-[15px] font-semibold">{editList.id ? 'Edit list' : 'New list'}</span>
              <button onClick={saveList} className="text-[15px] font-semibold text-gold-deep">Done</button>
            </div>
            <div className="rounded-2xl bg-white p-5 space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-semibold" style={{ background: editList.color }}>{(editList.name || '?').slice(0, 1).toUpperCase()}</div>
              <input autoFocus value={editList.name || ''} onChange={e => setEditList({ ...editList, name: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') saveList(); }} placeholder="List name" className={`${inputClass} text-center font-semibold`} />
              <div className="flex flex-wrap justify-center gap-2.5">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setEditList({ ...editList, color: c })} aria-label={`Colour ${c}`} className={`w-8 h-8 rounded-full ${editList.color === c ? 'ring-2 ring-offset-2 ring-black/30' : ''}`} style={{ background: c }} />
                ))}
              </div>
            </div>
            {editList.id && (
              <button onClick={() => removeList(editList)} className="mt-3 w-full py-3 rounded-2xl bg-white text-danger text-[15px] flex items-center justify-center gap-2"><X className="w-4 h-4" /> Delete list</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
