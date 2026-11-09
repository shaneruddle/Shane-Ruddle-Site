import { createPortal } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement, type ReactNode, type KeyboardEvent as ReactKeyboardEvent, type FormEvent } from 'react';
import { Reorder, useDragControls } from 'motion/react';
import { auth, db } from '../firebase';
import {
  collection, doc, onSnapshot, runTransaction, writeBatch, serverTimestamp, increment, updateDoc, query, where, orderBy, limit, getDocs, setDoc, deleteDoc,
} from 'firebase/firestore';
import {
  Loader2, Sun, Hourglass, Plus, Pin, Settings, Mic, ListChecks, SlidersHorizontal, Search, ArrowUp, Check, Lightbulb, StickyNote, Flag, Repeat as RepeatIcon,
  MapPin, GripVertical, Bell, CalendarDays, User, ChevronLeft, ChevronRight, X, Sparkles, Scissors, RotateCcw, Archive, Trash2, CloudOff, Cloud, Download, LogOut, History,
} from 'lucide-react';
import { toast } from 'sonner';
import { bkkToday, bkkNowTime, addDays, nextDue, repeatLabel, type Repeat, type RepeatFreq } from '../../server/reminderDates';
import {
  computeAlertAt, searchText, statusFor, isOnTodayList, todaySortKey, STATUS_LABEL, DEFAULT_AREAS, type Item, type Kind, type Status, type AiSuggestion,
} from '../../server/inboxShared';
import { Connections } from './InboxConnect';
import { Notifications } from './InboxNotify';
import { NoteEditor, plainPreview, type NoteEditorHandle } from './NoteEditor';
import OwnerTabBar from './OwnerTabBar';

// Shane's private Inbox at /inbox: one place for quick captures, notes, ideas and tasks.
// Data: inbox_items, inbox_history (audit trail), inbox_areas, inbox_settings, all Shane-only in firestore.rules.
// Captures are saved to this phone first (outbox in localStorage) so nothing is lost offline, then written with a
// fixed id inside a transaction, so a retry can never make a duplicate. Claude sorts each capture on the server
// (/api/inbox/process); if that fails the capture stays exactly as written.

interface Area { id: string; name: string; color: string; aliases?: string; order?: number }
interface Pending { id: string; raw: string; area?: string | null; at: number; today?: boolean }
interface HistoryEntry { id: string; by: string; action: string; changes?: Record<string, unknown>; at?: { toMillis(): number } }

// The home screen is a deck of cards: Today, Needs a look, Waiting on, Notes, then one per business.
// Every other screen is one of those cards opened full screen.
type View = 'home' | 'today' | 'inbox' | 'waiting' | 'notes' | 'ideas' | 'done' | 'settings' | 'search' | 'area';
type Screen = { view: View; area?: string; seg?: 'all' | 'todo' | 'notes' };

const OUTBOX_KEY = 'inbox_outbox_v1';
const readOutbox = (): Pending[] => { try { return JSON.parse(localStorage.getItem(OUTBOX_KEY) || '[]'); } catch { return []; } };
const writeOutbox = (p: Pending[]) => localStorage.setItem(OUTBOX_KEY, JSON.stringify(p));

const REPEATS: { label: string; value: string }[] = [
  { label: 'Never', value: '' }, { label: 'Daily', value: 'daily:1' }, { label: 'Weekdays', value: 'weekdays:1' },
  { label: 'Weekly', value: 'weekly:1' }, { label: 'Fortnightly', value: 'weekly:2' }, { label: 'Monthly', value: 'monthly:1' },
  { label: 'Every 3 months', value: 'monthly:3' }, { label: 'Yearly', value: 'yearly:1' },
];
const parseRepeat = (v: string): Repeat | null => (v ? { freq: v.split(':')[0] as RepeatFreq, interval: Number(v.split(':')[1]) || 1 } : null);

const api = async <T,>(path: string, body: unknown): Promise<T> => {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(path, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Error ${res.status}`);
  return json as T;
};

// Firestore rejects undefined; history stores plain values only.
const plain = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v === undefined ? null : v]));

const timeLabel = (t?: string | null) => (t ? new Date(`2000-01-01T${t}:00`).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(' ', '') : '');
const dayLabel = (d: string, now: string) => {
  if (d === now) return 'Today';
  if (d === addDays(now, 1)) return 'Tomorrow';
  if (d === addDays(now, -1)) return 'Yesterday';
  const sameYear = d.slice(0, 4) === now.slice(0, 4);
  return new Date(`${d}T12:00:00+07:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }), timeZone: 'Asia/Bangkok' });
};
const whenLabel = (d?: string | null, t?: string | null, now = bkkToday()) => (d ? [dayLabel(d, now), timeLabel(t)].filter(Boolean).join(', ') : '');
const ago = (ms?: number) => {
  if (!ms) return '';
  const m = Math.round((Date.now() - ms) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (m < 60 * 24) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)}d ago`;
};

const isOpen = (i: Item) => i.status !== 'done' && i.status !== 'archived';
const isTaskOpen = (i: Item) => i.kind === 'task' && isOpen(i);

export default function InboxApp({ onExit, onCircle }: { onExit?: () => void; onCircle?: () => void }) {
  const [items, setItems] = useState<Item[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [ready, setReady] = useState({ items: false, areas: false });
  const [loadError, setLoadError] = useState('');
  const [slow, setSlow] = useState(false);
  const [outbox, setOutbox] = useState<Pending[]>(readOutbox);
  const [online, setOnline] = useState(navigator.onLine);
  // A tapped notification opens /inbox?tab=today or /inbox?item=<id>.
  const [screen, setScreen] = useState<Screen>(() => { const t = new URLSearchParams(window.location.search).get('tab'); return { view: t === 'today' || t === 'notes' ? t : 'home' }; });
  const [open, setOpen] = useState<Item | null>(null);
  const [note, setNote] = useState<{ id: string; version: number; fresh?: boolean } | null>(null);
  const [notesQuery, setNotesQuery] = useState('');
  const [notesFilter, setNotesFilter] = useState('all');
  const [notesShown, setNotesShown] = useState(60);
  const pull = useRef<number | null>(null);
  const [clock, setClock] = useState(() => ({ day: bkkToday(), time: bkkNowTime() }));
  const flushing = useRef(false);
  const sorting = useRef(new Set<string>());
  const seeded = useRef(false);

  // ---- data ----
  useEffect(() => {
    const offItems = onSnapshot(collection(db, 'inbox_items'), snap => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as Item)));
      setReady(r => ({ ...r, items: true }));
    }, err => { console.error('Inbox load failed:', err.code, err.message); setLoadError(err.code === 'permission-denied' ? 'Reminders & Notes is only for Shane\'s account. Sign out and back in with it.' : `Couldn't load your reminders (${err.code}).`); });
    const offAreas = onSnapshot(collection(db, 'inbox_areas'), snap => {
      setAreas(snap.docs.map(d => ({ id: d.id, ...d.data() } as Area)).sort((a, b) => (a.order ?? 99) - (b.order ?? 99)));
      setReady(r => ({ ...r, areas: true }));
    }, err => { console.error('Inbox areas failed:', err.code, err.message); setLoadError(`Couldn't load your reminders (${err.code}).`); });
    const slowTimer = setTimeout(() => setSlow(true), 12_000);
    const tick = setInterval(() => setClock({ day: bkkToday(), time: bkkNowTime() }), 30_000);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { offItems(); offAreas(); clearInterval(tick); clearTimeout(slowTimer); window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  useEffect(() => {
    if (!ready.items) return;
    const params = new URLSearchParams(window.location.search);
    if (!params.has('item') && !params.has('tab')) return;
    const hit = items.find(i => i.id === params.get('item'));
    if (hit) { if (hit.kind === 'task') setOpen(hit); else setNote({ id: hit.id, version: hit.version || 0 }); }
    window.history.replaceState(null, '', '/inbox');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready.items]);

  // First run: create the business/personal areas, then move any reminders from the first version across.
  useEffect(() => {
    if (!ready.areas || !ready.items || seeded.current) return;
    seeded.current = true;
    (async () => {
      let current = areas;
      if (!current.length) {
        const batch = writeBatch(db);
        current = DEFAULT_AREAS.map((a, order) => {
          const ref = doc(collection(db, 'inbox_areas'));
          batch.set(ref, { ...a, order });
          return { id: ref.id, ...a, order };
        });
        await batch.commit();
      }
      const old = await getDocs(collection(db, 'reminders')).catch(() => null);
      if (!old?.size) return;
      const lists = await getDocs(collection(db, 'reminder_lists'));
      const listName = Object.fromEntries(lists.docs.map(d => [d.id, String(d.get('name') || '')]));
      const batch = writeBatch(db);
      old.docs.forEach(d => {
        const r = d.data();
        const name = (listName[r.listId] || '').toLowerCase();
        const area = current.find(a => a.name.toLowerCase() === name || (a.aliases || '').toLowerCase().split(/,\s*/).includes(name));
        const item: Partial<Item> = {
          title: r.title, body: r.notes || '', raw: r.title, kind: 'task', status: r.done ? 'done' : 'next',
          area: area?.id || null, dueDate: r.dueDate || null, dueTime: r.dueTime || null, repeat: r.repeat || null,
          place: r.place || null, placeWhen: r.place ? r.placeWhen || 'arrive' : null, flagged: !!r.flagged,
        };
        batch.set(doc(db, 'inbox_items', `r_${d.id}`), {
          ...item, alertAt: computeAlertAt(item), search: searchText(item, area?.name), ai: { state: 'off' }, version: 1,
          createdBy: 'import', updatedBy: 'import', createdAt: r.createdAt || serverTimestamp(), updatedAt: serverTimestamp(),
        });
        batch.delete(d.ref);
      });
      await batch.commit();
      toast.success(`Moved ${old.size} reminder${old.size === 1 ? '' : 's'} into your inbox`);
    })().catch(err => console.error('Inbox setup failed:', err));
  }, [ready, areas]);

  // The colour behind the status bar and the top bounce follows the open card.
  useEffect(() => {
    const top = screen.view === 'home' ? '#0E0D0C' : screen.view === 'area' ? areas.find(a => a.id === screen.area)?.color || '#0E0D0C'
      : ({ today: '#E9C75A', inbox: '#2A2724', waiting: '#3B3550', notes: '#6B5B45', ideas: '#B45309', done: '#44403C', settings: '#292524', search: '#1E1C1A' } as Record<string, string>)[screen.view] || '#0E0D0C';
    const meta = document.querySelector('meta[name="theme-color"]');
    const was = { meta: meta?.getAttribute('content'), bg: document.body.style.backgroundColor };
    meta?.setAttribute('content', top);
    document.body.style.backgroundColor = top;
    return () => { if (was.meta) meta?.setAttribute('content', was.meta); document.body.style.backgroundColor = was.bg; };
  }, [screen, areas]);

  const areaById = useMemo(() => Object.fromEntries(areas.map(a => [a.id, a])), [areas]);
  const areaName = useCallback((id?: string | null) => (id ? areaById[id]?.name || '' : ''), [areaById]);

  // ---- AI sorting ----
  const sort = useCallback(async (id: string, force = false) => {
    if (sorting.current.has(id)) return;
    sorting.current.add(id);
    try {
      await api('/api/inbox/process', { id, force });
    } catch {
      // The server marks the item as failed; the capture itself is already safe.
    } finally {
      sorting.current.delete(id);
    }
  }, []);

  // Retry sorting anything left pending (app closed mid-sort, network blip).
  useEffect(() => {
    if (!ready.items || !online) return;
    items.filter(i => i.ai?.state === 'pending' && (i.createdAt?.toMillis() || 0) < Date.now() - 20_000).slice(0, 3).forEach(i => sort(i.id));
  }, [ready.items, online]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- capture + outbox ----
  const flush = useCallback(async () => {
    if (flushing.current) return;
    flushing.current = true;
    try {
      for (const p of readOutbox()) {
        const ref = doc(db, 'inbox_items', p.id);
        try {
          await runTransaction(db, async tx => {
            const snap = await tx.get(ref);
            if (snap.exists()) return; // already saved by an earlier try
            const item: Partial<Item> = { title: p.raw.slice(0, 200), raw: p.raw, kind: 'task', status: 'inbox', area: p.area || null, ...(p.today ? { onToday: true, todayRank: p.at } : {}) };
            tx.set(ref, {
              ...item, body: p.raw.length > 200 ? p.raw : '', search: searchText(item, areaName(p.area)), ai: { state: 'pending' },
              version: 1, createdBy: 'shane', updatedBy: 'shane', capturedAt: p.at, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
            });
            tx.set(doc(collection(db, 'inbox_history')), { itemId: p.id, by: 'shane', action: 'captured', changes: { raw: p.raw }, at: serverTimestamp() });
          });
          const rest = readOutbox().filter(x => x.id !== p.id);
          writeOutbox(rest);
          setOutbox(rest);
          sort(p.id);
        } catch {
          break; // offline or server busy: keep it on the phone and try again later
        }
      }
    } finally {
      flushing.current = false;
    }
  }, [areaName, sort]);

  useEffect(() => {
    flush();
    const t = setInterval(() => readOutbox().length && flush(), 15_000);
    window.addEventListener('online', flush);
    return () => { clearInterval(t); window.removeEventListener('online', flush); };
  }, [flush]);

  const capture = (raw: string, area?: string | null, today = false) => {
    const text = raw.trim();
    if (!text) return;
    const next = [...readOutbox(), { id: doc(collection(db, 'inbox_items')).id, raw: text, area: area || null, at: Date.now(), ...(today ? { today: true } : {}) }];
    writeOutbox(next);
    setOutbox(next);
    flush();
  };

  // ---- edits ----
  const save = async (item: Item, changes: Partial<Item>, action = 'edited', expectVersion?: number) => {
    const ref = doc(db, 'inbox_items', item.id);
    const merged = { ...item, ...changes };
    const update = {
      ...plain(changes), alertAt: computeAlertAt(merged), search: searchText(merged, areaName(merged.area)),
      version: increment(1), updatedBy: 'shane', updatedAt: serverTimestamp(),
    };
    const entry = { itemId: item.id, by: 'shane', action, changes: plain(changes), at: serverTimestamp() };
    try {
      if (expectVersion !== undefined) {
        await runTransaction(db, async tx => {
          const snap = await tx.get(ref);
          if ((snap.data()?.version || 0) !== expectVersion) throw new Error('conflict');
          tx.update(ref, update);
          tx.set(doc(collection(db, 'inbox_history')), entry);
        });
      } else {
        const batch = writeBatch(db);
        batch.update(ref, update);
        batch.set(doc(collection(db, 'inbox_history')), entry);
        await batch.commit();
      }
      return true;
    } catch (err) {
      if (err instanceof Error && err.message === 'conflict') toast.error('This changed somewhere else while you were editing. Reopen it to see the latest.');
      else toast.error('Could not save');
      return false;
    }
  };

  // Dragging on the Today list: give the moved item a rank between its new neighbours (highest is at the top).
  // Order isn't content, so it skips the version check and history.
  const moveOnToday = (list: Item[], id: string) => {
    const k = list.findIndex(i => i.id === id);
    if (k < 0) return;
    const above = k > 0 ? todaySortKey(list[k - 1]) : null;
    const below = k < list.length - 1 ? todaySortKey(list[k + 1]) : null;
    const rank = above === null ? (below ?? Date.now()) + 60_000 : below === null ? above - 60_000 : (above + below) / 2;
    updateDoc(doc(db, 'inbox_items', id), { todayRank: rank }).catch(() => toast.error('Could not save the new order'));
  };

  const complete = async (i: Item) => {
    if (i.status === 'done') return save(i, { status: statusFor(i.kind, i.waitingOn), completedAt: null }, 'reopened');
    if (i.repeat) {
      const next = nextDue(i.dueDate || clock.day, i.repeat);
      await save(i, { dueDate: next }, 'completed (repeats)');
      toast.success(`Done. Next one: ${whenLabel(next, i.dueTime, clock.day)}`);
      return;
    }
    await save(i, { status: 'done', completedAt: serverTimestamp() as never }, 'completed');
    toast.success('Done', { action: { label: 'Undo', onClick: () => save({ ...i, status: 'done' }, { status: i.status, completedAt: null }, 'reopened') } });
  };

  const split = async (i: Item, parts: AiSuggestion[]) => {
    const batch = writeBatch(db);
    parts.forEach(s => {
      const ref = doc(collection(db, 'inbox_items'));
      const item: Partial<Item> = {
        title: s.title, body: s.notes || '', raw: i.raw, captureId: i.id, kind: s.kind, status: statusFor(s.kind, s.waitingOn),
        area: s.area || i.area || null, people: s.people || [], place: s.place || null, placeWhen: s.place ? s.placeWhen || 'arrive' : null,
        dueDate: s.dueDate || null, dueTime: s.dueTime || null, remindDate: s.remindDate || null, remindTime: s.remindTime || null,
        waitingOn: s.waitingOn || null, waitingSince: s.waitingOn ? clock.day : null, followUpDate: s.followUpDate || null,
      };
      batch.set(ref, {
        ...plain(item as Record<string, unknown>), alertAt: computeAlertAt(item), search: searchText(item, areaName(item.area)),
        ai: { state: 'done', applied: ['split'] }, version: 1, createdBy: 'shane', updatedBy: 'shane', createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
      batch.set(doc(collection(db, 'inbox_history')), { itemId: ref.id, by: 'shane', action: 'split from capture', changes: { from: i.id }, at: serverTimestamp() });
    });
    batch.update(doc(db, 'inbox_items', i.id), { status: 'archived', ai: { state: 'done', applied: [] }, version: increment(1), updatedAt: serverTimestamp(), updatedBy: 'shane' });
    batch.set(doc(collection(db, 'inbox_history')), { itemId: i.id, by: 'shane', action: `split into ${parts.length}`, changes: {}, at: serverTimestamp() });
    await batch.commit().then(() => toast.success(`Split into ${parts.length}`)).catch(() => toast.error('Could not split'));
  };

  const exportAll = () => {
    const rows = items.map(i => ({ ...i, area: areaName(i.area), createdAt: i.createdAt?.toMillis?.() ? new Date(i.createdAt.toMillis()).toISOString() : '', updatedAt: i.updatedAt?.toMillis?.() ? new Date(i.updatedAt.toMillis()).toISOString() : '', completedAt: i.completedAt?.toMillis?.() ? new Date(i.completedAt.toMillis()).toISOString() : '' }));
    const cols = ['id', 'kind', 'status', 'title', 'body', 'raw', 'area', 'people', 'place', 'dueDate', 'dueTime', 'remindDate', 'remindTime', 'waitingOn', 'followUpDate', 'flagged', 'createdAt', 'updatedAt', 'completedAt'];
    const esc = (v: unknown) => `"${String(Array.isArray(v) ? v.join('; ') : v ?? '').replace(/"/g, '""')}"`;
    const csv = [cols.join(','), ...rows.map(r => cols.map(c => esc((r as Record<string, unknown>)[c])).join(','))].join('\n');
    const stamp = clock.day;
    for (const [name, body, type] of [[`inbox-${stamp}.json`, JSON.stringify({ exportedAt: new Date().toISOString(), areas, items: rows }, null, 2), 'application/json'], [`inbox-${stamp}.csv`, csv, 'text/csv']]) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([body], { type }));
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }
  };

  if (!ready.items || !ready.areas) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 bg-cream px-8 text-center">
        {loadError ? <CloudOff className="w-8 h-8 text-black/40" /> : <Loader2 className="w-8 h-8 animate-spin text-gold-deep" />}
        {(loadError || slow) && (
          <>
            <p className="text-[15px] text-black/60">{loadError || 'Still connecting to your inbox. Check your signal, then try again.'}</p>
            <button onClick={() => window.location.reload()} className="px-5 py-2.5 rounded-full bg-ink text-white text-sm font-semibold">Try again</button>
          </>
        )}
      </div>
    );
  }

  const now = clock.day;
  const pendingIds = new Set(items.map(i => i.id));
  const unsynced = outbox.filter(p => !pendingIds.has(p.id));
  const sortingCount = items.filter(i => i.ai?.state === 'pending').length;

  // ---- shared bits ----
  const row = (i: Item, opts: { showArea?: boolean } = {}) => (
    <li key={i.id} className="flex items-start gap-3 py-3.5 border-b border-black/[0.07] last:border-0">{rowBody(i, opts)}</li>
  );
  const rowBody = (i: Item, opts: { showArea?: boolean } = {}) => {
    const area = areaById[i.area || ''];
    const done = i.status === 'done';
    const overdue = isOpen(i) && !!i.dueDate && (i.dueDate < now || (i.dueDate === now && !!i.dueTime && i.dueTime < clock.time));
    const followUpDue = i.status === 'waiting' && !!i.followUpDate && i.followUpDate <= now;
    const meta = [
      i.dueDate && <span key="due" className={`inline-flex items-center gap-1 ${overdue ? 'text-danger font-medium' : ''}`}><CalendarDays className="w-3 h-3" />{whenLabel(i.dueDate, i.dueTime, now)}</span>,
      i.remindDate && <span key="rem" className="inline-flex items-center gap-1"><Bell className="w-3 h-3" />{whenLabel(i.remindDate, i.remindTime, now)}</span>,
      i.repeat && <span key="rep" className="inline-flex items-center gap-1"><RepeatIcon className="w-3 h-3" />{repeatLabel(i.repeat)}</span>,
      i.waitingOn && <span key="w" className={`inline-flex items-center gap-1 ${followUpDue ? 'text-danger font-medium' : ''}`}><Hourglass className="w-3 h-3" />{i.waitingOn}{i.followUpDate ? `, chase ${dayLabel(i.followUpDate, now)}` : ''}</span>,
      i.place && <span key="pl" className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{i.placeWhen === 'leave' ? 'Leaving' : 'At'} {i.place}</span>,
      !i.waitingOn && i.people?.length ? <span key="pp" className="inline-flex items-center gap-1"><User className="w-3 h-3" />{i.people.join(', ')}</span> : null,
      opts.showArea !== false && area && <span key="a" className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: area.color }} />{area.name}</span>,
    ].filter(Boolean);
    return (
      <>
        {i.kind === 'task' ? (
          <button onClick={() => complete(i)} aria-label={done ? 'Mark not done' : 'Mark done'}
            className={`mt-0.5 w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center ${done ? 'bg-ink border-ink' : 'border-black/25'}`}>
            {done && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
          </button>
        ) : (
          <span className="mt-0.5 w-6 h-6 shrink-0 rounded-full bg-black/5 flex items-center justify-center">
            {i.kind === 'idea' ? <Lightbulb className="w-3.5 h-3.5 text-amber-600" /> : <StickyNote className="w-3.5 h-3.5 text-black/45" />}
          </span>
        )}
        <button onClick={() => (i.kind === 'task' ? setOpen(i) : setNote({ id: i.id, version: i.version || 0 }))} className="min-w-0 flex-1 text-left">
          <div className={`text-[16px] leading-snug ${done ? 'text-black/35 line-through' : 'text-ink'}`}>{i.title}</div>
          {i.body && i.kind !== 'task' && <div className="text-[13px] text-black/45 mt-0.5 line-clamp-2">{plainPreview(i.body)}</div>}
          {meta.length > 0 && <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] text-black/50">{meta}</div>}
          {i.ai?.state === 'pending' && <div className="mt-1 inline-flex items-center gap-1 text-[12px] text-gold-deep"><Loader2 className="w-3 h-3 animate-spin" /> Sorting…</div>}
          {i.ai?.state === 'failed' && i.status === 'inbox' && <div className="mt-1 text-[12px] text-black/45">Saved as written. Couldn't sort it automatically.</div>}
          {i.ai?.split && i.ai.split.length > 1 && i.status === 'inbox' && (
            <div className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gold/15 text-[12px] text-gold-deep font-medium"><Scissors className="w-3 h-3" /> Looks like {i.ai.split.length} things. Tap to split</div>
          )}
        </button>
        {i.flagged && <Flag className="w-4 h-4 mt-1 text-orange-500 fill-orange-500 shrink-0" />}
      </>
    );
  };

  const section = (title: string, list: Item[], opts: { tone?: 'danger'; empty?: string; showArea?: boolean } = {}) =>
    list.length || opts.empty ? (
      <section className="mt-5">
        <h3 className={`text-[12px] font-semibold uppercase tracking-[0.14em] ${opts.tone === 'danger' ? 'text-danger' : 'text-black/45'}`}>{title}{list.length ? ` · ${list.length}` : ''}</h3>
        {list.length ? <ul>{list.map(i => row(i, opts))}</ul> : <p className="py-4 text-[14px] text-black/35">{opts.empty}</p>}
      </section>
    ) : null;

  const byNewest = (a: Item, b: Item) => (b.createdAt?.toMillis() || Date.now()) - (a.createdAt?.toMillis() || Date.now());
  const byDue = (a: Item, b: Item) => `${a.dueDate || '9999'}${a.dueTime || '99'}`.localeCompare(`${b.dueDate || '9999'}${b.dueTime || '99'}`);

  // ---- the deck: shared numbers ----
  const openTasks = items.filter(isTaskOpen);
  const overdue = openTasks.filter(i => i.dueDate && i.dueDate < now).sort(byDue);
  const dueToday = openTasks.filter(i => i.dueDate === now).sort(byDue);
  const remindToday = openTasks.filter(i => i.remindDate && i.remindDate <= now && !(i.dueDate && i.dueDate <= now));
  const chase = items.filter(i => i.status === 'waiting' && i.followUpDate && i.followUpDate <= now);
  const early = new Set([...overdue, ...dueToday, ...remindToday, ...chase].map(i => i.id));
  // The Today list: things Shane put on it (or Apple's TODAY list), newest first unless he dragged them.
  const todayList = items.filter(i => isOpen(i) && isOnTodayList(i) && !early.has(i.id)).sort((a, b) => todaySortKey(b) - todaySortKey(a));
  const shownToday = new Set([...early, ...todayList.map(i => i.id)]);
  // A short pick of next actions with no date: flagged first, then the ones waiting longest.
  const upNext = openTasks.filter(i => i.status === 'next' && !shownToday.has(i.id) && !i.dueDate)
    .sort((a, b) => Number(!!b.flagged) - Number(!!a.flagged) || (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0))
    .slice(0, 5);
  const todayAll = [...new Map([...overdue, ...dueToday, ...todayList, ...remindToday, ...chase].map(i => [i.id, i])).values()];
  const unsorted = items.filter(i => i.status === 'inbox').sort(byNewest);
  // Captured in the last week and already sorted by Claude (shown under "Captured this week").
  const weekAgo = Date.now() - 7 * 86400_000;
  const recent = items.filter(i => i.status !== 'inbox' && i.status !== 'archived' && (i.createdAt?.toMillis() || 0) > weekAgo && i.createdBy !== 'import').sort(byNewest);
  const toSort = unsorted.length + unsynced.length;
  const waiting = items.filter(i => i.status === 'waiting');
  const allNotes = items.filter(i => i.kind === 'note' && isOpen(i));
  const ideas = items.filter(i => i.kind === 'idea' && isOpen(i));
  const byPinned = (a: Item, b: Item) => Number(!!b.pinned) - Number(!!a.pinned) || (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0);
  const areaTasks = (id: string) => openTasks.filter(i => i.area === id && (i.status === 'next' || i.status === 'inbox'));
  const areaNotes = (id: string) => items.filter(i => i.area === id && (i.kind === 'note' || i.kind === 'idea') && isOpen(i));
  const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;

  const go = (s: Screen) => { setScreen(s); window.scrollTo(0, 0); };
  const goHome = () => go({ view: 'home' });

  // A blank note, saved straight away (no AI sorting) and opened as a page. Empty ones are removed on close.
  const newNote = async (area?: string | null) => {
    const ref = doc(collection(db, 'inbox_items'));
    const item = { title: '', body: '', kind: 'note' as Kind, status: 'filed' as Status, area: area || null, pinned: false };
    setNote({ id: ref.id, version: 1, fresh: true });
    await setDoc(ref, {
      ...item, search: searchText(item, areaName(area)), ai: { state: 'off' }, version: 1,
      createdBy: 'shane', updatedBy: 'shane', createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    }).catch(() => { toast.error('Could not start a note'); setNote(null); });
  };

  // Notes and ideas as tiles, like Apple Notes' gallery. Pinned first, then most recently edited.
  const notesGrid = (list: Item[], label: string, opts: { area?: string | null; showArea?: boolean; limit?: number; add?: boolean } = {}) => {
    const sorted = [...list].sort(byPinned);
    const shown = opts.limit ? sorted.slice(0, opts.limit) : sorted;
    if (!sorted.length && !opts.add) return null;
    return (
      <section className="mt-6">
        <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-black/45">{label}{sorted.length ? ` · ${sorted.length}` : ''}</h3>
        <div className="mt-2.5 grid grid-cols-2 gap-2.5">
          {opts.add && (
            <button onClick={() => newNote(opts.area)} className="h-[124px] rounded-[18px] border-2 border-dashed border-black/15 text-black/45 flex flex-col items-center justify-center gap-1.5 text-[14px] font-medium">
              <Plus className="w-6 h-6" /> New note
            </button>
          )}
          {shown.map(i => {
            const area = opts.showArea ? areaById[i.area || ''] : undefined;
            return (
              <button key={i.id} onClick={() => setNote({ id: i.id, version: i.version || 0 })}
                className={`relative h-[124px] rounded-[18px] p-3 text-left flex flex-col justify-start overflow-hidden shadow-[0_1px_0_rgba(0,0,0,0.05),0_4px_14px_rgba(0,0,0,0.05)] ${i.kind === 'idea' ? 'bg-[#FFF7E0]' : 'bg-white'}`}>
                {i.pinned && <Pin className="absolute top-2.5 right-2.5 w-3.5 h-3.5 text-gold-deep fill-gold/40" />}
                <div className="pr-4 text-[14px] font-semibold leading-snug line-clamp-2 text-ink">{i.kind === 'idea' && <Lightbulb className="inline w-3.5 h-3.5 -mt-0.5 mr-1 text-amber-600" />}{i.title || 'Untitled'}</div>
                <div className={`mt-1 text-[12px] leading-snug text-black/50 whitespace-pre-line break-words ${area ? 'line-clamp-3' : 'line-clamp-4'}`}>{plainPreview(i.body || '').slice(0, 220)}</div>
                {area && <span className="absolute left-3 bottom-2.5 inline-flex items-center gap-1 text-[10.5px] text-black/45"><span className="w-1.5 h-1.5 rounded-full" style={{ background: area.color }} />{area.name}</span>}
              </button>
            );
          })}
        </div>
        {opts.limit && sorted.length > opts.limit && (
          <button onClick={() => setNotesShown(n => n + 60)} className="mt-4 w-full py-3 rounded-2xl bg-white border border-black/10 text-[14px] text-black/55">Show more ({sorted.length - opts.limit} left)</button>
        )}
      </section>
    );
  };

  // ---- home: the deck ----
  const greeting = clock.time < '12:00' ? 'Morning' : clock.time < '17:00' ? 'Afternoon' : 'Evening';
  const dateLine = new Date(`${now}T12:00:00+07:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Bangkok' });
  const syncLabel = !online ? `Offline${unsynced.length ? `, ${unsynced.length} on phone` : ''}` : unsynced.length ? `Uploading ${unsynced.length}` : sortingCount ? `Sorting ${sortingCount}` : '';

  const homeView = () => (
    <div className="min-h-[100dvh] bg-[#0E0D0C] text-white" style={{ paddingTop: 'env(safe-area-inset-top)' }}
      onTouchStart={e => { pull.current = window.scrollY <= 0 ? e.touches[0].clientY : null; }}
      onTouchMove={e => { if (pull.current !== null && e.touches[0].clientY - pull.current > 90) { pull.current = null; go({ view: 'search' }); } }}>
      <div className="max-w-xl mx-auto px-[18px] pb-60">
        <header className="flex items-center justify-between pt-4">
          <span className="text-[12px] uppercase tracking-[0.18em] text-white/45 font-semibold">{dateLine}</span>
          <div className="flex items-center gap-3">
            {syncLabel && <span className={`inline-flex items-center gap-1.5 text-[12px] ${online && !unsynced.length ? 'text-white/40' : 'text-amber-400'}`}>
              {online ? <Cloud className="w-3.5 h-3.5" /> : <CloudOff className="w-3.5 h-3.5" />}{syncLabel}
            </span>}
            <button onClick={() => go({ view: 'search' })} aria-label="Search" className="p-1 text-white/60"><Search className="w-5 h-5" /></button>
          </div>
        </header>
        <h1 className="mt-1 mb-4 font-serif text-[40px] leading-tight font-bold text-white">{greeting}, Shane</h1>

        {/* Today card */}
        <div role="button" tabIndex={0} onClick={() => go({ view: 'today' })} onKeyDown={e => { if (e.key === 'Enter') go({ view: 'today' }); }}
          className="rounded-[22px] p-[18px] cursor-pointer text-[#1a1405] bg-[linear-gradient(135deg,#E9C75A,#B8860B)] shadow-[0_10px_30px_rgba(212,175,55,0.22)]">
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] font-bold uppercase tracking-[0.12em]">Today</span>
            <span className="text-[13px] font-semibold">{todayAll.length ? `${todayAll.length} to do` : 'Clear'}{overdue.length ? ` · ${overdue.length} overdue` : ''}</span>
          </div>
          {todayAll.length ? (
            <ul className="mt-2">
              {todayAll.slice(0, 3).map(i => (
                <li key={i.id} className="flex items-center gap-2.5 py-1.5 text-[15.5px] leading-snug">
                  {i.kind === 'task'
                    ? <button onClick={e => { e.stopPropagation(); complete(i); }} aria-label="Mark done" className="w-[19px] h-[19px] shrink-0 rounded-full border-2 border-[#1a1405]/45" />
                    : <Hourglass className="w-4 h-4 shrink-0 opacity-60" />}
                  <span className={`line-clamp-1 ${overdue.includes(i) ? 'font-semibold' : ''}`}>{i.title}</span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-2 text-[15px] opacity-75">{upNext.length ? `Nothing due. Next up: ${upNext[0].title}` : 'Nothing due today.'}</p>}
          {todayAll.length > 3 && <div className="mt-1 text-[12.5px] font-semibold opacity-70">+{todayAll.length - 3} more</div>}
        </div>

        {/* Small cards */}
        <div className="grid grid-cols-3 gap-2.5 my-3">
          {/* Inbox: the number to sort, or (when all sorted) how many were captured this week, so it never reads 0 over a full list. */}
          {([
            ['inbox', toSort || recent.length, 'Reminders', toSort ? 'to sort' : recent.length ? 'new this week' : 'all sorted'],
            ['waiting', waiting.length, 'Waiting on', ''],
            ['notes', allNotes.length, 'Notes', ''],
          ] as const).map(([v, n, label, sub]) => (
            <button key={v} onClick={() => go({ view: v })} className="rounded-[18px] bg-[#1E1C1A] px-3.5 py-3 text-left">
              <div className={`text-[24px] font-bold leading-none ${v === 'inbox' && toSort ? 'text-gold' : ''}`}>{n}</div>
              <div className="mt-1.5 text-[12px] text-white/55 leading-tight">{label}{sub && <span className="block text-white/35">{sub}</span>}</div>
            </button>
          ))}
        </div>

        {/* One card per business, stacked like a wallet */}
        <div className="pt-1">
          {areas.map((a, k) => {
            const t = areaTasks(a.id);
            const n = areaNotes(a.id).length;
            const last = k === areas.length - 1;
            return (
              <button key={a.id} onClick={() => go({ view: 'area', area: a.id })}
                className={`relative flex flex-col justify-start w-full text-left rounded-[22px] px-[18px] pt-4 ${last ? 'pb-6' : 'h-[96px]'} ${k ? '-mt-[36px]' : ''} shadow-[0_-6px_18px_rgba(0,0,0,0.35)]`}
                style={{ background: a.color, zIndex: k }}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[16px] font-semibold truncate">{a.name}</span>
                  <span className="shrink-0 text-[12px] px-2.5 py-[3px] rounded-full bg-white/20">
                    {[t.length && `${t.length} to do`, n && plural(n, 'note')].filter(Boolean).join(' · ') || 'Nothing open'}
                  </span>
                </div>
                {last && t[0] && <div className="mt-1.5 text-[13px] text-white/80 truncate">Next: {t[0].title}</div>}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex gap-2">
          <button onClick={() => go({ view: 'ideas' })} className="flex-1 py-3 rounded-2xl bg-[#1E1C1A] text-[13px] text-white/70 flex items-center justify-center gap-1.5"><Lightbulb className="w-4 h-4" /> Ideas {ideas.length || ''}</button>
          <button onClick={() => go({ view: 'done' })} className="flex-1 py-3 rounded-2xl bg-[#1E1C1A] text-[13px] text-white/70 flex items-center justify-center gap-1.5"><Archive className="w-4 h-4" /> Done</button>
          <button onClick={() => go({ view: 'settings' })} className="flex-1 py-3 rounded-2xl bg-[#1E1C1A] text-[13px] text-white/70 flex items-center justify-center gap-1.5"><Settings className="w-4 h-4" /> Settings</button>
        </div>
        {onExit && <button onClick={onExit} className="mt-4 w-full py-2 text-[12px] text-white/30 flex items-center justify-center gap-1.5"><LogOut className="w-3.5 h-3.5" /> Leave inbox</button>}
        <p className="mt-2 text-center text-[11px] text-white/25">Pull down to search</p>
      </div>
    </div>
  );

  // ---- an opened card: coloured header, cream sheet ----
  const cardScreen = (o: { color: string; dark?: boolean; title: string; meta?: string; seg?: ReactNode }, body: ReactNode) => (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: o.color, paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="w-full max-w-xl mx-auto flex-1 flex flex-col">
        <header className={`px-5 pt-4 pb-5 ${o.dark ? 'text-[#1a1405]' : 'text-white'}`}>
          <div className="flex items-center justify-between">
            <button onClick={goHome} className="flex items-center gap-0.5 -ml-1.5 text-[15px] opacity-80"><ChevronLeft className="w-5 h-5" /> All cards</button>
            {syncLabel && <span className="inline-flex items-center gap-1.5 text-[12px] opacity-60">{online ? <Cloud className="w-3.5 h-3.5" /> : <CloudOff className="w-3.5 h-3.5" />}{syncLabel}</span>}
          </div>
          <h1 className={`mt-3 font-serif text-[42px] leading-[1.02] font-bold ${o.dark ? 'text-[#1a1405]' : 'text-white'}`}>{o.title}</h1>
          {o.meta && <p className="mt-1.5 text-[14px] opacity-75">{o.meta}</p>}
          {o.seg}
        </header>
        <div className="flex-1 bg-cream text-ink rounded-t-[28px] px-4 pt-1 pb-60">{body}</div>
      </div>
    </div>
  );

  const segBar = (color: string) => (
    <div className="mt-4 flex rounded-[14px] bg-black/20 p-1">
      {(['all', 'todo', 'notes'] as const).map(s => (
        <button key={s} onClick={() => setScreen({ ...screen, seg: s })}
          className={`flex-1 py-2 rounded-[10px] text-[14px] font-semibold ${(screen.seg || 'all') === s ? 'bg-white' : 'text-white/75'}`}
          style={(screen.seg || 'all') === s ? { color } : undefined}>
          {{ all: 'Everything', todo: 'To do', notes: 'Notes' }[s]}
        </button>
      ))}
    </div>
  );

  const todayBody = () => {
    const nothing = !todayAll.length && !upNext.length;
    return (
      <>
        {section('Overdue', overdue, { tone: 'danger' })}
        {section('Due today', dueToday)}
        {todayList.length > 0 && (
          <section className="mt-5">
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-black/45">Today list · {todayList.length}</h3>
            <TodayList items={todayList} body={i => rowBody(i)} onMove={moveOnToday} />
          </section>
        )}
        {section('Reminders', remindToday)}
        {section('Chase up', chase, { tone: 'danger' })}
        {section('Up next', upNext)}
        {nothing && <p className="py-12 text-center text-black/35">Nothing for today.</p>}
      </>
    );
  };

  const inboxBody = () => {
    return (
      <>
        {unsynced.length > 0 && (
          <section className="mt-5">
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-black/45">Saved on this phone · {unsynced.length}</h3>
            <ul>{unsynced.map(p => (
              <li key={p.id} className="flex items-start gap-3 py-3.5 border-b border-black/[0.07] last:border-0">
                <CloudOff className="w-5 h-5 mt-0.5 text-black/30 shrink-0" />
                <div className="text-[16px] text-ink">{p.raw}<div className="text-[12px] text-black/45 mt-0.5">Will upload when you're back online</div></div>
              </li>
            ))}</ul>
          </section>
        )}
        {section('To sort', unsorted, { empty: unsynced.length ? undefined : 'Nothing to sort. Claude has already filed what you captured.' })}
        {section('Captured this week', recent)}
      </>
    );
  };

  const waitingBody = () => {
    const people = [...new Set(waiting.map(i => i.waitingOn || 'Someone'))].sort();
    return waiting.length ? <>{people.map(p => <div key={p}>{section(p, waiting.filter(i => (i.waitingOn || 'Someone') === p).sort(byDue))}</div>)}</>
      : <p className="py-12 text-center text-black/35">You're not waiting on anyone.</p>;
  };

  const areaBody = (id: string) => {
    const mine = items.filter(i => i.area === id);
    const seg = screen.seg || 'all';
    return (
      <>
        {seg !== 'notes' && (
          <>
            {section('To do', areaTasks(id).sort(byDue), { showArea: false, empty: 'No open tasks.' })}
            {section('Waiting on', mine.filter(i => i.status === 'waiting'), { showArea: false })}
            {section('Someday', mine.filter(i => i.kind === 'task' && i.status === 'someday'), { showArea: false })}
          </>
        )}
        {seg !== 'todo' && notesGrid(areaNotes(id), 'Notes & ideas', { area: id, add: true })}
      </>
    );
  };

  const notesBody = () => {
    const words = notesQuery.toLowerCase().split(/\s+/).filter(Boolean);
    const hit = (i: Item) => !words.length || words.every(w => ((i as Item & { search?: string }).search || searchText(i, areaName(i.area))).includes(w));
    const list = allNotes.filter(i => (notesFilter === 'all' || (notesFilter === 'none' ? !areaById[i.area || ''] : i.area === notesFilter)) && hit(i));
    return (
      <>
        <input value={notesQuery} onChange={e => { setNotesQuery(e.target.value); setNotesShown(60); }} placeholder="Find a note…" enterKeyHint="search"
          className="mt-4 w-full px-4 py-3 rounded-2xl bg-white border border-black/10 text-[16px] focus:ring-2 focus:ring-gold-deep/30" />
        <div className="mt-3 flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
          {[['all', 'All'], ['none', 'No business'], ...areas.map(a => [a.id, a.name])].map(([v, l]) => (
            <button key={v} onClick={() => { setNotesFilter(v); setNotesShown(60); }} className={`px-3.5 py-1.5 rounded-full text-[13px] whitespace-nowrap ${notesFilter === v ? 'bg-ink text-white' : 'bg-black/5 text-black/55'}`}>{l}</button>
          ))}
        </div>
        {notesGrid(list, words.length ? 'Matching notes' : 'Notes', { showArea: true, limit: notesShown, add: !words.length, area: notesFilter !== 'all' && notesFilter !== 'none' ? notesFilter : null })}
        {!list.length && words.length > 0 && <p className="py-10 text-center text-black/35">No notes match.</p>}
      </>
    );
  };

  const doneBody = () => (
    <>
      {section('Done', items.filter(i => i.status === 'done').sort((a, b) => (b.completedAt?.toMillis?.() || 0) - (a.completedAt?.toMillis?.() || 0)).slice(0, 100), { empty: 'Nothing done yet.' })}
      {section('Archived', items.filter(i => i.status === 'archived' && !(i.ai?.split && i.ai.split.length > 1)).sort(byNewest).slice(0, 100))}
    </>
  );

  const settingsBody = () => (
    <>
      <button onClick={exportAll} className="mt-5 w-full py-3 rounded-2xl bg-white border border-black/10 text-[15px] text-black/60 flex items-center justify-center gap-2"><Download className="w-4 h-4" /> Export everything (JSON + CSV)</button>
      <Notifications />
      <Connections />
    </>
  );

  const view = screen.view;
  const area = screen.area ? areaById[screen.area] : undefined;
  const page = view === 'home' ? homeView()
    : view === 'today' ? cardScreen({ color: 'linear-gradient(160deg,#E9C75A,#B8860B 70%)', dark: true, title: 'Today', meta: todayAll.length ? `${plural(todayAll.length, 'thing')} to do${overdue.length ? `, ${overdue.length} overdue` : ''}` : 'Nothing due' }, todayBody())
    : view === 'inbox' ? cardScreen({ color: '#2A2724', title: 'Reminders', meta: [toSort ? `${plural(toSort, 'capture')} to sort` : 'Nothing to sort', recent.length && `${recent.length} captured this week`].filter(Boolean).join(' · ') }, inboxBody())
    : view === 'waiting' ? cardScreen({ color: '#3B3550', title: 'Waiting on', meta: waiting.length ? `${plural(waiting.length, 'thing')}${chase.length ? `, ${chase.length} to chase` : ''}` : undefined }, waitingBody())
    : view === 'notes' ? cardScreen({ color: '#6B5B45', title: 'Notes', meta: plural(allNotes.length, 'note') }, notesBody())
    : view === 'ideas' ? cardScreen({ color: '#B45309', title: 'Ideas', meta: plural(ideas.length, 'idea') }, notesGrid(ideas, 'Ideas') || <p className="py-12 text-center text-black/35">No ideas saved yet.</p>)
    : view === 'done' ? cardScreen({ color: '#44403C', title: 'Done & archive' }, doneBody())
    : view === 'settings' ? cardScreen({ color: '#292524', title: 'Settings' }, settingsBody())
    : view === 'search' ? cardScreen({ color: '#1E1C1A', title: 'Search & ask' }, <SearchView items={items} areaName={areaName} row={row} />)
    : area ? cardScreen({
        color: area.color, title: area.name,
        meta: `${areaTasks(area.id).length} to do · ${plural(areaNotes(area.id).length, 'note')}`,
        seg: segBar(area.color),
      }, areaBody(area.id))
    : homeView();

  const dockFor = view === 'search' || view === 'settings' || view === 'done' ? null
    : view === 'area' && area ? { placeholder: `Add to ${area.name.replace(/^Hemingways /, '')}…`, accent: area.color }
    : view === 'today' ? { placeholder: 'Add to Today…', accent: '#B8860B' }
    : { placeholder: 'Capture anything…', accent: '#D4AF37' };
  const noteItem = note ? items.find(i => i.id === note.id) : undefined;

  return (
    <div className="min-h-[100dvh] bg-cream text-ink">
      {page}

      {/* Capture bar + bottom menu, pinned together. Mounted on <body> so no animated (transformed) parent
          can turn position:fixed into "fixed to that parent", which left the bar floating mid-page on iPhone. */}
      {createPortal(
        <div className="fixed bottom-0 inset-x-0 z-40">
          {dockFor && <CaptureDock key={view + (screen.area || '')} dark={view === 'home'} placeholder={dockFor.placeholder} accent={dockFor.accent}
            onCapture={raw => capture(raw, view === 'area' ? screen.area : null, view === 'today')} />}
          <OwnerTabBar docked active={view === 'today' ? 'today' : view === 'notes' ? 'notes' : 'inbox'}
            onSelect={t => t === 'circle' ? onCircle?.() : go({ view: t === 'inbox' ? 'home' : t })} />
        </div>,
        document.body,
      )}

      {note && noteItem && (
        <NotePage key={note.id} item={noteItem} openedVersion={note.version} fresh={!!note.fresh} areas={areas}
          onClose={() => setNote(null)}
          onSave={(changes, version) => save(noteItem, changes, 'edited', version)}
          onDetails={() => { setOpen(noteItem); setNote(null); }}
          onArchive={() => { save(noteItem, { status: noteItem.status === 'archived' ? statusFor(noteItem.kind, noteItem.waitingOn) : 'archived' }, noteItem.status === 'archived' ? 'restored' : 'archived'); setNote(null); }}
          onDiscard={() => { deleteDoc(doc(db, 'inbox_items', noteItem.id)).catch(() => {}); setNote(null); }}
        />
      )}

      {open && (
        <ItemSheet
          key={open.id}
          item={items.find(i => i.id === open.id) || open}
          openedVersion={open.version || 0}
          areas={areas}
          now={now}
          onClose={() => setOpen(null)}
          onSave={async (item, changes, version) => { if (await save(item, changes, 'edited', version)) setOpen(null); }}
          onComplete={i => { complete(i); setOpen(null); }}
          onSplit={(i, parts) => { split(i, parts); setOpen(null); }}
          onResort={i => sort(i.id, true)}
          onArchive={i => { save(i, { status: i.status === 'archived' ? statusFor(i.kind, i.waitingOn) : 'archived' }, i.status === 'archived' ? 'restored' : 'archived'); setOpen(null); }}
          onDelete={async i => {
            if (!confirm('Delete this for good? Archive keeps it searchable.')) return;
            await deleteDoc(doc(db, 'inbox_items', i.id)).catch(() => toast.error('Could not delete'));
            await setDoc(doc(collection(db, 'inbox_history')), { itemId: i.id, by: 'shane', action: 'deleted', changes: { title: i.title }, at: serverTimestamp() }).catch(() => {});
            setOpen(null);
          }}
        />
      )}
    </div>
  );
}

// ---- capture dock: pinned to the bottom, within thumb reach, with a mic ----
type SpeechRec = { lang: string; interimResults: boolean; continuous: boolean; start(): void; stop(): void; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null };
const SpeechCtor = (): (new () => SpeechRec) | undefined => (window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec }).SpeechRecognition
  || (window as unknown as { webkitSpeechRecognition?: new () => SpeechRec }).webkitSpeechRecognition;

function CaptureDock({ onCapture, placeholder, accent, dark }: { onCapture: (raw: string) => void; placeholder: string; accent: string; dark: boolean }) {
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const rec = useRef<SpeechRec | null>(null);
  const before = useRef('');
  const latest = useRef('');
  latest.current = text;
  const silence = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const autoSave = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);
  useEffect(() => () => { rec.current?.stop(); clearTimeout(silence.current); clearTimeout(autoSave.current); }, []);
  const save = (raw: string) => {
    clearTimeout(autoSave.current);
    setAutoSaving(false);
    if (!raw.trim()) return;
    onCapture(raw);
    setText('');
    latest.current = '';
  };
  const submit = () => {
    if (!text.trim()) return;
    if (rec.current) { rec.current.onend = null; rec.current.stop(); rec.current = null; setListening(false); }
    save(text);
  };
  // The gold mic: talk, and when you stop (a short pause or tapping the mic again) it's saved. No second tap.
  const mic = () => {
    if (listening) { rec.current?.stop(); return; }
    const Ctor = SpeechCtor();
    if (!Ctor) { ref.current?.focus(); toast('Tap the mic on your keyboard to talk. It saves itself when you stop.'); return; }
    const r = new Ctor();
    r.lang = 'en-GB';
    r.interimResults = true;
    r.continuous = true;
    before.current = text ? `${text.trim()} ` : '';
    r.onresult = e => {
      setText(before.current + Array.from(e.results).map(x => x[0].transcript).join(''));
      clearTimeout(silence.current);
      silence.current = setTimeout(() => r.stop(), 2000);
    };
    r.onend = () => {
      clearTimeout(silence.current);
      setListening(false);
      rec.current = null;
      save(latest.current);
    };
    r.onerror = () => { setListening(false); toast('Could not hear you. Try the keyboard mic.'); };
    rec.current = r;
    try { r.start(); setListening(true); } catch { setListening(false); }
  };
  // The keyboard's own dictation drops in whole phrases at once. When that happens, save after a short pause,
  // unless you carry on typing or editing (any key or change cancels it).
  const onInput = (e: FormEvent<HTMLTextAreaElement>) => {
    const ev = e.nativeEvent as InputEvent;
    clearTimeout(autoSave.current);
    setAutoSaving(false);
    const added = (ev.data || '').trim();
    if (!listening && (ev.inputType === 'insertText' || ev.inputType === 'insertReplacementText') && added.split(/\s+/).length >= 3) {
      setAutoSaving(true);
      autoSave.current = setTimeout(() => save(latest.current), 2500);
    }
  };
  const light = accent === '#D4AF37' || accent === '#B8860B';
  return (
    <div className="px-4 pt-6"
      style={{ paddingBottom: 10, background: dark ? 'linear-gradient(transparent, rgba(14,13,12,0.92) 38%)' : 'linear-gradient(transparent, rgba(249,248,246,0.96) 38%)' }}>
      {autoSaving && (
        <div className="max-w-xl mx-auto mb-2 flex justify-center">
          <button onClick={() => { clearTimeout(autoSave.current); setAutoSaving(false); ref.current?.focus(); }}
            className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium ${dark ? 'bg-white/15 text-white' : 'bg-ink text-white'}`}>
            Saving… tap to keep editing
          </button>
        </div>
      )}
      <div className={`max-w-xl mx-auto flex items-end gap-2 rounded-[28px] p-1.5 pl-[18px] ${dark ? 'bg-white/10 border border-white/15 backdrop-blur-xl' : 'bg-white border border-black/10 shadow-[0_6px_20px_rgba(0,0,0,0.08)]'}`}>
        <textarea
          ref={ref}
          value={text}
          rows={1}
          onChange={e => setText(e.target.value)}
          onInput={onInput}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } else { clearTimeout(autoSave.current); setAutoSaving(false); } }}
          placeholder={listening ? 'Listening… stop talking to save' : placeholder}
          enterKeyHint="send"
          className={`flex-1 resize-none bg-transparent border-0 outline-none focus:outline-none p-0 py-[11px] text-[17px] leading-snug focus:ring-0 ${dark ? 'text-white placeholder:text-white/45' : 'text-ink placeholder:text-black/35'}`}
        />
        <button onClick={text.trim() && !listening ? submit : mic} aria-label={text.trim() && !listening ? 'Save' : listening ? 'Stop listening' : 'Talk'}
          className={`w-[46px] h-[46px] shrink-0 rounded-full flex items-center justify-center ${listening ? 'bg-danger animate-pulse' : ''}`}
          style={listening ? undefined : { background: accent }}>
          {text.trim() && !listening
            ? <ArrowUp className={`w-5 h-5 ${light ? 'text-[#1a1405]' : 'text-white'}`} strokeWidth={2.6} />
            : <Mic className={`w-5 h-5 ${listening || !light ? 'text-white' : 'text-[#1a1405]'}`} strokeWidth={2.4} />}
        </button>
      </div>
    </div>
  );
}

// ---- a note, opened as a page to write on ----
// Lines starting ☐ or ☑ (or markdown "- [ ] " / "- [x] ") are tick boxes. They're tappable when reading; tap the text to edit.
// Saves a moment after you stop typing, and again on close, with the same version check as the item sheet.
const CHECK = /^(?:- \[[ x]\]|☐|☑) ?/;

function NotePage({ item, openedVersion, fresh, areas, onClose, onSave, onDetails, onArchive, onDiscard }: {
  item: Item; openedVersion: number; fresh: boolean; areas: Area[]; onClose: () => void;
  onSave: (changes: Partial<Item>, version: number) => Promise<boolean>; onDetails: () => void; onArchive: () => void; onDiscard: () => void;
}) {
  const [title, setTitle] = useState(item.title || '');
  const [body, setBody] = useState(item.body || '');
  const [pinned, setPinned] = useState(!!item.pinned);
  const [area, setArea] = useState(item.area || '');
  const [typing, setTyping] = useState(false);
  const editor = useRef<NoteEditorHandle>(null);
  const saved = useRef({ title: item.title || '', body: item.body || '', pinned: !!item.pinned, area: item.area || '' });
  const version = useRef(openedVersion);
  const busy = useRef<Promise<boolean> | null>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const areaObj = areas.find(a => a.id === area);
  const color = areaObj?.color || '#8A6D0B';

  const flush = useCallback(async () => {
    if (busy.current) await busy.current;
    const s = saved.current;
    const finalTitle = title.trim() || plainPreview(body.trim().split('\n')[0]).replace(CHECK, '').replace(/^[•\-*]\s+|^\d+[.)]\s+/, '').slice(0, 80);
    const changes: Partial<Item> = {};
    if (finalTitle !== s.title && (finalTitle || s.title)) changes.title = finalTitle || 'Untitled';
    if (body !== s.body) changes.body = body;
    if (pinned !== s.pinned) changes.pinned = pinned;
    if (area !== s.area) changes.area = area || null;
    if (!Object.keys(changes).length) return true;
    busy.current = onSave(changes, version.current);
    const ok = await busy.current;
    busy.current = null;
    if (ok) {
      version.current += 1;
      saved.current = { title: changes.title ?? s.title, body, pinned, area };
    }
    return ok;
  }, [title, body, pinned, area, onSave]);

  // Autosave a moment after typing stops, and when the app goes to the background.
  useEffect(() => {
    if (!title.trim() && !body.trim()) return;
    const t = setTimeout(flush, 1500);
    const hide = () => { if (document.visibilityState === 'hidden') flush(); };
    document.addEventListener('visibilitychange', hide);
    return () => { clearTimeout(t); document.removeEventListener('visibilitychange', hide); };
  }, [flush, title, body]);

  useEffect(() => { const el = titleRef.current; if (el) { el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`; } }, [title]);
  useEffect(() => { if (fresh) titleRef.current?.focus(); }, [fresh]);

  const close = async () => {
    if (!title.trim() && !body.trim()) { if (fresh || !item.title) onDiscard(); else onClose(); return; }
    if (await flush()) onClose();
  };

  const addChecklist = () => editor.current?.addChecklist();

  const edited = item.updatedAt?.toMillis?.();
  const editedLabel = edited ? new Date(edited).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: new Date(edited).getFullYear() === new Date().getFullYear() ? undefined : 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Bangkok' }) : '';

  return (
    <div className="fixed inset-0 z-50 bg-[#FBF8F1] text-[#1b1a17] overflow-y-auto" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="max-w-xl mx-auto px-6 pb-40">
        <div className="sticky top-0 z-10 -mx-6 px-6 py-3 flex items-center justify-between bg-[#FBF8F1]/95 backdrop-blur">
          <button onClick={close} className="flex items-center gap-0.5 -ml-1.5 text-[16px] font-semibold text-gold-deep"><ChevronLeft className="w-5 h-5" /> Back</button>
          <button onClick={close} className="text-[16px] font-semibold text-gold-deep">Done</button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12.5px] font-semibold" style={{ background: `${color}1A`, color }}>
            <span className="w-2 h-2 rounded-full" style={{ background: color }} />{areaObj?.name || 'No business'}
            <select value={area} onChange={e => setArea(e.target.value)} aria-label="Business" className="absolute inset-0 opacity-0">
              <option value="">No business</option>
              {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </label>
          {pinned && <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[12.5px] font-semibold bg-gold/15 text-gold-deep"><Pin className="w-3 h-3" /> Pinned</span>}
          {item.kind === 'idea' && <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[12.5px] font-semibold bg-amber-100 text-amber-700"><Lightbulb className="w-3 h-3" /> Idea</span>}
        </div>
        <textarea ref={titleRef} value={title} rows={1} onChange={e => setTitle(e.target.value.replace(/\n/g, ' '))} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); editor.current?.focusEnd(); } }} placeholder="Title"
          className="mt-3 w-full resize-none overflow-hidden bg-transparent border-0 p-0 font-serif text-[34px] leading-[1.1] font-bold outline-none focus:outline-none focus:ring-0 placeholder:text-black/20" />
        {editedLabel && <div className="mt-1 mb-4 text-[12.5px] text-black/40">Edited {editedLabel}</div>}

        <NoteEditor ref={editor} value={body} onChange={setBody} color={color} placeholder="Tap to write…" onFocusChange={setTyping} />
      </div>

      <div className={`fixed bottom-0 inset-x-0 bg-[#F3EFE6] border-t border-black/[0.06] ${typing ? 'hidden' : ''}`} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-xl mx-auto grid grid-cols-4 text-[12px] font-semibold text-gold-deep">
          <button onClick={addChecklist} className="py-3 flex flex-col items-center gap-1"><ListChecks className="w-5 h-5" /> Checklist</button>
          <button onClick={() => setPinned(p => !p)} className="py-3 flex flex-col items-center gap-1"><Pin className={`w-5 h-5 ${pinned ? 'fill-gold/50' : ''}`} /> {pinned ? 'Unpin' : 'Pin'}</button>
          <button onClick={async () => { if (title.trim() || body.trim()) await flush(); onDetails(); }} className="py-3 flex flex-col items-center gap-1"><SlidersHorizontal className="w-5 h-5" /> Details</button>
          <button onClick={async () => { if (title.trim() || body.trim()) await flush(); onArchive(); }} className="py-3 flex flex-col items-center gap-1"><Archive className="w-5 h-5" /> {item.status === 'archived' ? 'Restore' : 'Archive'}</button>
        </div>
      </div>
    </div>
  );
}

// ---- search & ask ----
function SearchView({ items, areaName, row }: { items: Item[]; areaName: (id?: string | null) => string; row: (i: Item) => ReactElement }) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | Kind | 'done' | 'archived'>('all');
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState<{ q: string; text: string; ids: string[] } | null>(null);
  const byId = useMemo(() => Object.fromEntries(items.map(i => [i.id, i])), [items]);

  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const results = items
    .filter(i => (filter === 'all' ? i.status !== 'archived' : filter === 'done' ? i.status === 'done' : filter === 'archived' ? i.status === 'archived' : i.kind === filter && i.status !== 'archived'))
    .filter(i => {
      if (!words.length) return true;
      const hay = (i as Item & { search?: string }).search || searchText(i, areaName(i.area));
      return words.every(w => hay.includes(w));
    })
    .sort((a, b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0))
    .slice(0, 80);

  const ask = async () => {
    if (!q.trim()) return;
    setAsking(true);
    try {
      const r = await api<{ answer: string; ids: string[] }>('/api/inbox/ask', { question: q });
      setAnswer({ q, text: r.answer, ids: r.ids });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not answer');
    } finally {
      setAsking(false);
    }
  };

  // Renders the answer with [[id]] citations as tappable item names, and the AI's own advice set apart.
  const renderAnswer = (text: string) => {
    const [facts, suggestion] = text.split(/\n?Suggestion:\s*/);
    const withLinks = (t: string) => t.split(/(\[\[[\w-]+\]\])/g).map((part, k) => {
      const m = part.match(/^\[\[([\w-]+)\]\]$/);
      if (!m) return <span key={k}>{part}</span>;
      const it = byId[m[1]];
      return it ? <span key={k} className="inline-block mx-0.5 px-1.5 rounded bg-gold/15 text-gold-deep text-[13px]">{it.title.slice(0, 40)}</span> : null;
    });
    return (
      <>
        <div className="text-[11px] uppercase tracking-[0.14em] text-black/40 font-semibold mb-1">From your items</div>
        <div className="text-[15px] leading-relaxed whitespace-pre-wrap">{withLinks(facts)}</div>
        {suggestion && (
          <div className="mt-3 pt-3 border-t border-black/10">
            <div className="text-[11px] uppercase tracking-[0.14em] text-gold-deep font-semibold mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI suggestion</div>
            <div className="text-[15px] leading-relaxed whitespace-pre-wrap text-black/70">{withLinks(suggestion)}</div>
          </div>
        )}
      </>
    );
  };

  return (
    <>
      <div className="mt-3 flex gap-2">
        <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') ask(); }} enterKeyHint="search"
          placeholder="Search, or ask: what's waiting on Gift?" className="flex-1 px-4 py-3 rounded-2xl bg-white border border-black/10 text-[16px] focus:ring-2 focus:ring-gold-deep/30" />
        <button onClick={ask} disabled={!q.trim() || asking} className="px-4 rounded-2xl bg-ink text-white text-[14px] font-semibold flex items-center gap-1.5 disabled:opacity-30">
          {asking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Ask
        </button>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
        {(['all', 'task', 'note', 'idea', 'done', 'archived'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3.5 py-1.5 rounded-full text-[13px] whitespace-nowrap ${filter === f ? 'bg-ink text-white' : 'bg-black/5 text-black/55'}`}>
            {{ all: 'Everything', task: 'Tasks', note: 'Notes', idea: 'Ideas', done: 'Done', archived: 'Archived' }[f]}
          </button>
        ))}
      </div>
      {answer && (
        <div className="mt-4 p-4 rounded-2xl bg-white border border-gold/40">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="text-[13px] text-black/45 italic">“{answer.q}”</div>
            <button onClick={() => setAnswer(null)} aria-label="Close answer"><X className="w-4 h-4 text-black/30" /></button>
          </div>
          {renderAnswer(answer.text)}
          {answer.ids.length > 0 && <ul className="mt-3 pt-2 border-t border-black/10">{answer.ids.map(id => byId[id]).filter(Boolean).map(i => row(i))}</ul>}
        </div>
      )}
      <ul className="mt-2">{results.map(i => row(i))}</ul>
      {!results.length && <p className="py-10 text-center text-black/35">Nothing matches. Try Ask.</p>}
    </>
  );
}

// ---- item detail ----
function ItemSheet({ item, openedVersion, areas, now, onClose, onSave, onComplete, onSplit, onResort, onArchive, onDelete }: {
  item: Item; openedVersion: number; areas: Area[]; now: string; onClose: () => void;
  onSave: (item: Item, changes: Partial<Item>, version: number) => void; onComplete: (i: Item) => void; onSplit: (i: Item, parts: AiSuggestion[]) => void;
  onResort: (i: Item) => void; onArchive: (i: Item) => void; onDelete: (i: Item) => void;
}) {
  const [f, setF] = useState<Partial<Item>>(item);
  const [more, setMore] = useState(!!(item.remindDate || item.repeat || item.place || item.waitingOn || item.followUpDate));
  const [log, setLog] = useState<HistoryEntry[] | null>(null);
  const set = (c: Partial<Item>) => setF(prev => ({ ...prev, ...c }));
  const changedElsewhere = (item.version || 0) !== openedVersion;

  const showLog = async () => {
    const snap = await getDocs(query(collection(db, 'inbox_history'), where('itemId', '==', item.id), orderBy('at', 'desc'), limit(30))).catch(() => null);
    setLog(snap ? snap.docs.map(d => ({ id: d.id, ...d.data() } as HistoryEntry)) : []);
  };

  const commit = () => {
    const keys: (keyof Item)[] = ['title', 'body', 'kind', 'status', 'area', 'people', 'dueDate', 'dueTime', 'remindDate', 'remindTime', 'repeat', 'place', 'placeWhen', 'waitingOn', 'followUpDate', 'flagged', 'onToday', 'todayRank'];
    const changes: Partial<Item> = {};
    for (const k of keys) {
      if (JSON.stringify(f[k] ?? null) !== JSON.stringify(item[k] ?? null)) (changes as Record<string, unknown>)[k] = f[k] ?? null;
    }
    if (changes.title !== undefined && !String(changes.title).trim()) { toast.error('Add a title'); return; }
    if (changes.waitingOn && !item.waitingOn) changes.waitingSince = now;
    if (changes.status === 'waiting' && !f.waitingOn) { toast.error('Who are you waiting on?'); return; }
    if (!Object.keys(changes).length) { onClose(); return; }
    onSave(item, changes, openedVersion);
  };

  const field = 'w-full px-3.5 py-3 rounded-xl bg-black/5 text-[16px] border-0 focus:ring-2 focus:ring-gold-deep/30';
  const chip = (on: boolean) => `px-3.5 py-2 rounded-full text-[14px] ${on ? 'bg-ink text-white' : 'bg-black/5 text-black/60'}`;
  const statuses: Status[] = f.kind === 'task' ? ['inbox', 'next', 'waiting', 'someday'] : f.kind === 'idea' ? ['inbox', 'someday', 'next'] : ['inbox', 'filed'];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full sm:max-w-md max-h-[94dvh] overflow-y-auto bg-cream rounded-t-[28px] sm:rounded-[28px] p-5" style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <button onClick={onClose} className="text-[16px] text-black/50">Cancel</button>
          <span className="text-[13px] text-black/40">{item.createdBy && item.createdBy !== 'shane' ? `Added by ${item.createdBy}` : ''}</span>
          <button onClick={commit} className="text-[16px] font-semibold text-gold-deep">Save</button>
        </div>
        {changedElsewhere && <div className="mb-3 p-3 rounded-xl bg-amber-50 text-[13px] text-amber-800">This was changed somewhere else since you opened it. Close and reopen to see the latest.</div>}

        {item.ai?.split && item.ai.split.length > 1 && item.status === 'inbox' && (
          <div className="mb-3 p-4 rounded-2xl bg-white border border-gold/40">
            <div className="text-[11px] uppercase tracking-[0.14em] text-gold-deep font-semibold flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI suggestion: split into {item.ai.split.length}</div>
            <ul className="mt-2 space-y-1 text-[15px]">{item.ai.split.map((s, k) => <li key={k}>• {s.title} <span className="text-black/40 text-[12px]">({s.kind})</span></li>)}</ul>
            <button onClick={() => onSplit(item, item.ai!.split!)} className="mt-3 w-full py-2.5 rounded-full bg-ink text-white text-[14px] font-semibold flex items-center justify-center gap-1.5"><Scissors className="w-4 h-4" /> Split it</button>
            <p className="mt-2 text-[12px] text-black/45">Each new item keeps your original words.</p>
          </div>
        )}

        <div className="rounded-2xl bg-white p-1">
          <textarea value={f.title || ''} onChange={e => set({ title: e.target.value })} rows={Math.min(5, Math.max(1, Math.ceil((f.title || '').length / 30)))} className="w-full px-3 py-3 bg-transparent border-0 text-[18px] font-medium leading-snug focus:ring-0 resize-none" />
          <div className="mx-3 border-t border-black/[0.07]" />
          <textarea value={f.body || ''} onChange={e => set({ body: e.target.value })} placeholder="Notes" rows={3} className="w-full px-3 py-3 bg-transparent border-0 text-[15px] focus:ring-0 resize-y" />
        </div>
        {item.raw && item.raw !== f.title && (
          <p className="mt-2 px-1 text-[13px] text-black/45"><span className="font-semibold">You said:</span> “{item.raw}”</p>
        )}

        <div className="mt-3 rounded-2xl bg-white p-4 space-y-3">
          <div className="flex gap-2">
            {(['task', 'note', 'idea'] as Kind[]).map(k => <button key={k} onClick={() => set({ kind: k, status: f.status === 'inbox' ? 'inbox' : statusFor(k, f.waitingOn) })} className={`flex-1 ${chip(f.kind === k)}`}>{k === 'task' ? 'Task' : k === 'note' ? 'Note' : 'Idea'}</button>)}
          </div>
          <div className="flex flex-wrap gap-2">
            {statuses.map(s => <button key={s} onClick={() => set({ status: s })} className={chip(f.status === s)}>{STATUS_LABEL[s]}</button>)}
          </div>
          {f.status === 'waiting' && (
            <div className="grid grid-cols-2 gap-2">
              <input value={f.waitingOn || ''} onChange={e => set({ waitingOn: e.target.value })} placeholder="Waiting on who?" className={field} />
              <label className="text-[12px] text-black/45">Chase on<input type="date" value={f.followUpDate || ''} onChange={e => set({ followUpDate: e.target.value || null })} className={field} /></label>
            </div>
          )}
          <select value={f.area || ''} onChange={e => set({ area: e.target.value || null })} className={field}>
            <option value="">No area</option>
            {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <input value={(f.people || []).join(', ')} onChange={e => set({ people: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="People (comma separated)" className={field} />
        </div>

        {f.kind === 'task' && (
          <div className="mt-3 rounded-2xl bg-white p-4 space-y-3">
            <div className="flex items-center gap-2 text-[15px]"><CalendarDays className="w-5 h-5 text-danger" /> Due <span className="text-black/35 text-[13px]">(when it must be done)</span></div>
            <div className="flex flex-wrap gap-2">
              {[['Today', now], ['Tomorrow', addDays(now, 1)], ['Next week', addDays(now, 7)]].map(([l, d]) => <button key={l} onClick={() => set({ dueDate: d })} className={chip(f.dueDate === d)}>{l}</button>)}
              {f.dueDate && <button onClick={() => set({ dueDate: null, dueTime: null, repeat: null })} className="px-3 text-[13px] text-black/40">Clear</button>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={f.dueDate || ''} onChange={e => set({ dueDate: e.target.value || null })} className={field} />
              <input type="time" value={f.dueTime || ''} disabled={!f.dueDate} onChange={e => set({ dueTime: e.target.value || null })} className={`${field} disabled:opacity-40`} />
            </div>
          </div>
        )}

        {!more ? (
          <button onClick={() => setMore(true)} className="mt-3 w-full py-3 rounded-2xl bg-white text-[15px] text-black/55">Remind me, repeat, place…</button>
        ) : (
          <div className="mt-3 rounded-2xl bg-white p-4 space-y-3">
            <div className="flex items-center gap-2 text-[15px]"><Bell className="w-5 h-5 text-gold-deep" /> Remind me <span className="text-black/35 text-[13px]">(when to nudge you)</span></div>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={f.remindDate || ''} onChange={e => set({ remindDate: e.target.value || null })} className={field} />
              <input type="time" value={f.remindTime || ''} disabled={!f.remindDate} onChange={e => set({ remindTime: e.target.value || null })} className={`${field} disabled:opacity-40`} />
            </div>
            {f.kind === 'task' && (
              <label className="flex items-center gap-2 text-[15px]">
                <RepeatIcon className="w-5 h-5 text-black/45" /><span className="flex-1">Repeat</span>
                <select value={f.repeat ? `${f.repeat.freq}:${f.repeat.interval || 1}` : ''} onChange={e => set({ repeat: parseRepeat(e.target.value), dueDate: f.dueDate || (e.target.value ? now : null) })} className="px-3 py-2 rounded-xl bg-black/5 text-[15px] border-0">
                  {REPEATS.map(r => <option key={r.label} value={r.value}>{r.label}</option>)}
                </select>
              </label>
            )}
            <div className="flex items-center gap-2 text-[15px]"><MapPin className="w-5 h-5 text-success" /> Place</div>
            <input value={f.place || ''} onChange={e => set({ place: e.target.value || null, placeWhen: f.placeWhen || 'arrive' })} placeholder="e.g. Hemingways Lakeside" className={field} />
            {f.place && (
              <div className="flex gap-2">{(['arrive', 'leave'] as const).map(w => <button key={w} onClick={() => set({ placeWhen: w })} className={`flex-1 ${chip((f.placeWhen || 'arrive') === w)}`}>{w === 'arrive' ? 'When I arrive' : 'When I leave'}</button>)}</div>
            )}
          </div>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2">
          {item.kind === 'task' && <button onClick={() => onComplete(item)} className="py-3 rounded-2xl bg-white text-[15px] flex items-center justify-center gap-1.5"><Check className="w-4 h-4" /> {item.status === 'done' ? 'Not done' : 'Done'}</button>}
          <button onClick={() => set({ flagged: !f.flagged })} className="py-3 rounded-2xl bg-white text-[15px] flex items-center justify-center gap-1.5"><Flag className={`w-4 h-4 ${f.flagged ? 'text-orange-500 fill-orange-500' : ''}`} /> {f.flagged ? 'Flagged' : 'Flag'}</button>
          {item.kind === 'task' && <button onClick={() => set(isOnTodayList(f) ? { onToday: false } : { onToday: true, todayRank: Date.now() })} className="py-3 rounded-2xl bg-white text-[15px] flex items-center justify-center gap-1.5"><Sun className={`w-4 h-4 ${isOnTodayList(f) ? 'text-amber-500' : ''}`} /> {isOnTodayList(f) ? 'On Today list' : 'Add to Today'}</button>}
          <button onClick={() => onArchive(item)} className="py-3 rounded-2xl bg-white text-[15px] flex items-center justify-center gap-1.5"><Archive className="w-4 h-4" /> {item.status === 'archived' ? 'Restore' : 'Archive'}</button>
          {item.raw && <button onClick={() => { onResort(item); toast('Sorting again…'); onClose(); }} className="py-3 rounded-2xl bg-white text-[15px] flex items-center justify-center gap-1.5"><RotateCcw className="w-4 h-4" /> Sort again</button>}
        </div>

        <div className="mt-4 flex items-center justify-between px-1">
          <button onClick={log ? () => setLog(null) : showLog} className="text-[13px] text-black/45 flex items-center gap-1"><History className="w-3.5 h-3.5" /> {log ? 'Hide history' : 'History'}</button>
          <button onClick={() => onDelete(item)} className="text-[13px] text-danger/80 flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
        </div>
        {log && (
          <ul className="mt-2 px-1 space-y-1.5 text-[13px] text-black/55">
            {log.length ? log.map(h => <li key={h.id}><span className="font-medium text-black/70">{h.by === 'shane' ? 'You' : h.by === 'ai' ? 'AI' : h.by}</span> {h.action} <span className="text-black/35">{ago(h.at?.toMillis())}</span></li>) : <li>No history yet.</li>}
          </ul>
        )}
      </div>
    </div>
  );
}

// The Today list with drag handles. Drag by the grip so scrolling and tapping still work on a phone.
function TodayList({ items, body, onMove }: { items: Item[]; body: (i: Item) => ReactNode; onMove: (list: Item[], id: string) => void }) {
  const [order, setOrder] = useState(items);
  const dragging = useRef<string | null>(null);
  const latest = useRef(order);
  latest.current = order;
  // Follow live updates, except while a drag is in progress.
  useEffect(() => { if (!dragging.current) setOrder(items); }, [items]);
  return (
    <Reorder.Group as="ul" axis="y" values={order} onReorder={setOrder}>
      {order.map(i => (
        <TodayRow key={i.id} item={i} onStart={() => { dragging.current = i.id; }}
          onEnd={() => { const id = dragging.current; dragging.current = null; if (id) onMove(latest.current, id); }}>
          {body(i)}
        </TodayRow>
      ))}
    </Reorder.Group>
  );
}

function TodayRow({ item, children, onStart, onEnd }: { item: Item; children: ReactNode; onStart: () => void; onEnd: () => void }) {
  const controls = useDragControls();
  return (
    <Reorder.Item value={item} dragListener={false} dragControls={controls} onDragStart={onStart} onDragEnd={onEnd}
      className="relative flex items-start gap-3 py-3.5 border-b border-black/[0.07] last:border-0 bg-cream">
      {children}
      <button aria-label="Drag to reorder" onPointerDown={e => { e.preventDefault(); controls.start(e); }}
        className="-mr-1 px-1 py-0.5 text-black/25 touch-none cursor-grab active:cursor-grabbing shrink-0">
        <GripVertical className="w-5 h-5" />
      </button>
    </Reorder.Item>
  );
}
