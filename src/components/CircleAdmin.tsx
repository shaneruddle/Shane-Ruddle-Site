import { useEffect, useMemo, useState } from 'react';
import { db, storage } from '../firebase';
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, setDoc, serverTimestamp, arrayUnion, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getBlob, deleteObject } from 'firebase/storage';
import { Loader2, Plus, Search, X, Camera, Trash2, CalendarClock, Check, Clock, ExternalLink, UserRound, Sparkles, MapPin, Trophy, Target, Flame } from 'lucide-react';
import { toast } from 'sonner';

// Shane's private Circle. Data lives in circle_people / circle_events, which firestore.rules lock to Shane alone
// (not admins). Photos sit under circle/ in Storage and are read with getBlob, so no shareable link is ever made.

type Status = 'contact' | 'suggested' | 'later' | 'skipped';

interface Person {
  id: string;
  name: string;
  status: Status;
  source?: 'mine' | 'suggested';
  business?: string;
  role?: string;
  sinceYear?: number | null;
  whereMet?: string;
  metOn?: string;
  introducedBy?: string;
  whereSeen?: string;
  notes?: string;
  followUpOn?: string;
  lastSeenOn?: string;
  catchUps?: string[];
  photoPath?: string;
  whyMeet?: string;
  wayIn?: string;
  sourceUrl?: string;
  sourceLabel?: string;
  createdAt?: Timestamp;
}

interface CircleEvent {
  id: string;
  title: string;
  when?: string;
  where?: string;
  crowd?: string;
  tip?: string;
  url?: string;
  key?: string;
}

interface Targets { week: number; month: number; year: number }
const DEFAULT_TARGETS: Targets = { week: 2, month: 8, year: 100 };

type View = 'people' | 'suggested' | 'events' | 'playbook';

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
const addDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T12:00:00+07:00`);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
};
// Monday of the week containing iso (Bangkok dates).
const weekStart = (iso: string) => {
  const d = new Date(`${iso}T12:00:00+07:00`);
  const back = (d.getUTCDay() + 6) % 7;
  return addDays(iso, -back);
};
const prettyDate = (iso?: string) =>
  iso ? new Date(`${iso}T12:00:00+07:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Bangkok' }) : '';

const emptyForm = (): Partial<Person> => ({ name: '', business: '', whereMet: '', metOn: today(), introducedBy: '', whereSeen: '', notes: '', followUpOn: addDays(today(), 14) });

const inputClass = 'w-full px-4 py-2.5 rounded-xl bg-black/5 text-sm border-0 focus:ring-2 focus:ring-gold-deep/30';
const pillClass = (on: boolean) => `px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-[0.12em] whitespace-nowrap transition-colors ${on ? 'bg-ink text-white' : 'bg-black/5 text-black/50 hover:text-ink'}`;

// Loads a private photo as a blob URL (Storage rules check Shane's login on every read).
function PrivatePhoto({ path, name }: { path?: string; name: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!path) return;
    let objectUrl = '';
    let cancelled = false;
    getBlob(ref(storage, path))
      .then(b => { if (!cancelled) { objectUrl = URL.createObjectURL(b); setUrl(objectUrl); } })
      .catch(() => {});
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [path]);
  if (url) return <img src={url} alt={name} className="w-14 h-14 rounded-full object-cover shrink-0" />;
  const initials = name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return <div className="w-14 h-14 rounded-full bg-gold/20 text-gold-deep flex items-center justify-center font-serif text-lg shrink-0">{initials || <UserRound className="w-5 h-5" />}</div>;
}

const PLAYBOOK: { title: string; points: string[] }[] = [
  {
    title: 'Where settled people actually are',
    points: [
      'Go to the same thing every week. Regulars trust regulars. The third time you turn up, people start saying hello first.',
      'Pick morning and early-evening things (breakfast meetings, golf, running clubs, quiz nights). Late-night crowds are mostly passing through.',
      'Business owners are easiest to meet at their own business. Become a regular customer, then ask for them by name.',
    ],
  },
  {
    title: 'Starting the conversation',
    points: [
      '"How long have you been here?" is the best opener in Pattaya. Settled people love answering it, and it sorts tourists from residents in one line.',
      'Follow up with "What made you stay?" It gets the real story, and that story is what you write in your notes.',
      'Ask for advice, not favours: "Who do you use for…?" People like being the expert.',
    ],
  },
  {
    title: 'Remembering them',
    points: [
      'Say their name back straight away, and once more before you leave.',
      'Add them here before you get home: where you met, one personal detail (kids, dog, football team, home town) and what you talked about.',
      'Ask for a photo together or use their business page photo. Faces are what you forget first.',
    ],
  },
  {
    title: 'Turning a meeting into a friendship',
    points: [
      'Message within 48 hours with one thing you talked about: "Good to meet you. Here\'s that golf course I mentioned."',
      'Suggest a specific second meeting (day, place). "We should catch up sometime" never happens.',
      'Three to five meetings in the first couple of months is what turns an acquaintance into a friend. The follow-up dates here keep you on that rhythm.',
      'Be the connector: introduce two people who should know each other. They both remember you for it, and you get invited to more.',
    ],
  },
];

export default function CircleAdmin() {
  const [people, setPeople] = useState<Person[]>([]);
  const [events, setEvents] = useState<CircleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('people');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Partial<Person> | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [showSkipped, setShowSkipped] = useState(false);
  const [targets, setTargets] = useState<Targets>(DEFAULT_TARGETS);
  const [editTargets, setEditTargets] = useState<Targets | null>(null);

  useEffect(() => {
    const unsubPeople = onSnapshot(collection(db, 'circle_people'), snap => {
      setPeople(snap.docs.map(d => ({ id: d.id, ...d.data() } as Person)));
      setLoading(false);
    }, err => {
      console.error('Circle people load failed:', err.message);
      toast.error('Could not load your Circle');
      setLoading(false);
    });
    const unsubEvents = onSnapshot(collection(db, 'circle_events'), snap => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as CircleEvent)));
    }, err => console.error('Circle events load failed:', err.message));
    const unsubTargets = onSnapshot(doc(db, 'circle_settings', 'targets'), snap => {
      if (snap.exists()) setTargets({ ...DEFAULT_TARGETS, ...(snap.data() as Partial<Targets>) });
    }, err => console.error('Circle targets load failed:', err.message));
    return () => { unsubPeople(); unsubEvents(); unsubTargets(); };
  }, []);

  const now = today();
  const q = search.trim().toLowerCase();
  const matches = (p: Person) => !q || [p.name, p.business, p.whereMet, p.introducedBy, p.whereSeen, p.notes].some(v => v?.toLowerCase().includes(q));

  const contacts = useMemo(() => people.filter(p => p.status === 'contact'), [people]);
  const due = useMemo(() => contacts.filter(p => p.followUpOn && p.followUpOn <= now).sort((a, b) => (a.followUpOn || '').localeCompare(b.followUpOn || '')), [contacts, now]);
  const suggested = useMemo(() => people.filter(p => p.status === 'suggested' || p.status === 'later' || (showSkipped && p.status === 'skipped'))
    .sort((a, b) => (a.status === 'suggested' ? 0 : 1) - (b.status === 'suggested' ? 0 : 1) || (a.sinceYear || 9999) - (b.sinceYear || 9999)), [people, showSkipped]);

  // Who has introduced Shane to the most people: the best connectors to stay close to.
  const connectors = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of contacts) {
      const by = p.introducedBy?.trim();
      if (by) map.set(by, (map.get(by) || 0) + 1);
    }
    return Array.from(map.entries()).filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [contacts]);

  // Scoreboard: new people met (by "met on" date) against Shane's targets, plus catch-ups.
  const score = useMemo(() => {
    const wk = weekStart(now);
    const month = now.slice(0, 7);
    const year = now.slice(0, 4);
    const metDates = contacts.map(p => p.metOn).filter((d): d is string => !!d && d <= now);
    const catchUps = contacts.flatMap(p => p.catchUps || []);
    // Weeks in a row (ending this week, or last week if this one isn't done yet) that hit the weekly target.
    const perWeek = new Map<string, number>();
    for (const d of metDates) perWeek.set(weekStart(d), (perWeek.get(weekStart(d)) || 0) + 1);
    let streak = 0;
    let w = (perWeek.get(wk) || 0) >= targets.week ? wk : addDays(wk, -7);
    while (targets.week > 0 && (perWeek.get(w) || 0) >= targets.week) { streak++; w = addDays(w, -7); }
    return {
      week: metDates.filter(d => d >= wk).length,
      month: metDates.filter(d => d.startsWith(month)).length,
      year: metDates.filter(d => d.startsWith(year)).length,
      catchUpsMonth: catchUps.filter(d => d.startsWith(month)).length,
      streak,
    };
  }, [contacts, now, targets]);

  const saveTargets = async () => {
    if (!editTargets) return;
    const clean = {
      week: Math.max(0, Math.round(Number(editTargets.week) || 0)),
      month: Math.max(0, Math.round(Number(editTargets.month) || 0)),
      year: Math.max(0, Math.round(Number(editTargets.year) || 0)),
    };
    try {
      await setDoc(doc(db, 'circle_settings', 'targets'), { ...clean, updatedAt: serverTimestamp() });
      setEditTargets(null);
      toast.success('Targets saved');
    } catch {
      toast.error('Could not save targets');
    }
  };

  const peopleAt = (e: CircleEvent) => {
    const key = (e.key || '').toLowerCase();
    if (!key) return [];
    return contacts.filter(p => [p.whereSeen, p.whereMet].some(v => v?.toLowerCase().includes(key)));
  };

  const save = async () => {
    if (!editing?.name?.trim()) { toast.error('Add a name first'); return; }
    setSaving(true);
    try {
      const { id, createdAt, ...fields } = editing;
      const data: Record<string, unknown> = { ...fields, name: editing.name.trim(), updatedAt: serverTimestamp() };
      let docId = id;
      if (docId) {
        await updateDoc(doc(db, 'circle_people', docId), data);
      } else {
        const created = await addDoc(collection(db, 'circle_people'), { ...data, status: 'contact', source: 'mine', createdAt: serverTimestamp() });
        docId = created.id;
      }
      if (photo && docId) {
        const path = `circle/${docId}-${Date.now()}`;
        await uploadBytes(ref(storage, path), photo, { contentType: photo.type });
        if (editing.photoPath) await deleteObject(ref(storage, editing.photoPath)).catch(() => {});
        await updateDoc(doc(db, 'circle_people', docId), { photoPath: path });
      }
      toast.success('Saved');
      setEditing(null);
      setPhoto(null);
    } catch (err) {
      console.error('Circle save failed:', err instanceof Error ? err.message : err);
      toast.error('Could not save');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: Partial<Person>) => {
    if (!p.id || !confirm(`Delete ${p.name}? This can't be undone.`)) return;
    try {
      if (p.photoPath) await deleteObject(ref(storage, p.photoPath)).catch(() => {});
      await deleteDoc(doc(db, 'circle_people', p.id));
      setEditing(null);
      toast.success('Deleted');
    } catch {
      toast.error('Could not delete');
    }
  };

  const update = (p: Person, fields: Partial<Person>) =>
    updateDoc(doc(db, 'circle_people', p.id), { ...fields, updatedAt: serverTimestamp() }).catch(() => toast.error('Could not update'));

  const caughtUp = (p: Person) => {
    updateDoc(doc(db, 'circle_people', p.id), { lastSeenOn: now, followUpOn: addDays(now, 21), catchUps: arrayUnion(now), updatedAt: serverTimestamp() })
      .catch(() => toast.error('Could not update'));
    toast.success(`Next catch-up with ${p.name.split(' ')[0]} set for 3 weeks`);
  };

  const met = (p: Person) => {
    const fields = { status: 'contact' as Status, metOn: now, followUpOn: addDays(now, 14) };
    update(p, fields);
    setEditing({ ...p, ...fields });
    setView('people');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-gold-deep" />
      </div>
    );
  }

  const personCard = (p: Person) => (
    <div key={p.id} className="p-5 bg-white border border-black/10 rounded-2xl flex gap-4">
      <PrivatePhoto path={p.photoPath} name={p.name} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <button onClick={() => { setEditing(p); setPhoto(null); }} className="text-left font-serif text-lg text-ink hover:text-gold-deep">{p.name}</button>
            {p.business && <div className="text-sm text-black/55">{[p.role, p.business].filter(Boolean).join(', ')}</div>}
          </div>
          {p.followUpOn && (
            <span className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full ${p.followUpOn <= now ? 'bg-amber-50 text-amber-800' : 'bg-black/5 text-black/45'}`}>
              {p.followUpOn <= now ? 'Catch up now' : `Catch up ${prettyDate(p.followUpOn)}`}
            </span>
          )}
        </div>
        <div className="mt-2 text-xs text-black/50 space-y-0.5">
          {(p.whereMet || p.metOn) && <div>Met {p.whereMet ? `at ${p.whereMet}` : ''}{p.metOn ? `, ${prettyDate(p.metOn)}` : ''}</div>}
          {p.introducedBy && <div>Introduced by {p.introducedBy}</div>}
          {p.whereSeen && <div>Usually at {p.whereSeen}</div>}
        </div>
        {p.notes && <p className="mt-2 text-sm text-black/70 whitespace-pre-wrap">{p.notes}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => caughtUp(p)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/5 text-xs text-ink hover:bg-black/10"><Check className="w-3.5 h-3.5" /> Caught up today</button>
          <button onClick={() => { setEditing(p); setPhoto(null); }} className="px-3 py-1.5 rounded-full text-xs text-black/50 hover:text-ink">Edit</button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-serif">Your <span className="italic">Circle</span></h2>
        <p className="text-sm text-black/45 mt-1">Private to your login only. Other admins and managers can't open this.</p>
      </div>

      <section className="mb-8 p-5 sm:p-6 rounded-2xl bg-ink text-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold"><Trophy className="w-4 h-4" /> Scoreboard: new people met</h3>
          {!editTargets && (
            <button onClick={() => setEditTargets(targets)} className="flex items-center gap-1.5 text-xs text-white/55 hover:text-white"><Target className="w-3.5 h-3.5" /> Set targets</button>
          )}
        </div>
        {editTargets ? (
          <div>
            <div className="grid grid-cols-3 gap-3">
              {(['week', 'month', 'year'] as (keyof Targets)[]).map(k => (
                <label key={k} className="text-[10px] uppercase tracking-[0.2em] text-white/50">Per {k}
                  <input type="number" min={0} value={editTargets[k]} onChange={e => setEditTargets({ ...editTargets, [k]: Number(e.target.value) })}
                    className="mt-1 w-full px-3 py-2 rounded-xl bg-white/10 text-white text-lg font-serif border-0 focus:ring-2 focus:ring-gold/50" />
                </label>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={saveTargets} className="px-4 py-2 rounded-full bg-gold text-ink text-xs font-semibold uppercase tracking-[0.12em]">Save targets</button>
              <button onClick={() => setEditTargets(null)} className="px-4 py-2 rounded-full text-xs text-white/55 hover:text-white">Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 sm:gap-5">
              {([
                ['This week', score.week, targets.week],
                ['This month', score.month, targets.month],
                ['This year', score.year, targets.year],
              ] as [string, number, number][]).map(([label, value, goal]) => (
                <div key={label}>
                  <div className="text-3xl sm:text-4xl font-serif">{value}<span className="text-base text-white/40"> / {goal}</span></div>
                  <div className="h-1.5 rounded-full bg-white/10 mt-2 overflow-hidden">
                    <div className={`h-full rounded-full ${goal > 0 && value >= goal ? 'bg-emerald-400' : 'bg-gold'}`} style={{ width: `${goal > 0 ? Math.min(100, (value / goal) * 100) : 0}%` }} />
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.1em] sm:tracking-[0.2em] font-semibold text-white/45 mt-2">{label}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 mt-5 pt-4 border-t border-white/10 text-sm text-white/65">
              <span className="flex items-center gap-1.5"><Flame className="w-4 h-4 text-gold" /> {score.streak} week{score.streak === 1 ? '' : 's'} in a row on target</span>
              <span>{score.catchUpsMonth} catch-up{score.catchUpsMonth === 1 ? '' : 's'} this month</span>
              <span>{contacts.length} people in total</span>
              <span>{due.length} catch-up{due.length === 1 ? '' : 's'} due</span>
            </div>
          </>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        {([['people', 'People'], ['suggested', 'Worth meeting'], ['events', "What's on"], ['playbook', 'Playbook']] as [View, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setView(key)} className={pillClass(view === key)}>{label}</button>
        ))}
        {view === 'people' && (
          <button onClick={() => { setEditing(emptyForm()); setPhoto(null); }} className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-full bg-gold-deep text-white text-xs font-semibold uppercase tracking-[0.12em] hover:opacity-90">
            <Plus className="w-3.5 h-3.5" /> Add someone
          </button>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={() => !saving && setEditing(null)}>
          <div className="bg-cream w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-serif">{editing.id ? editing.name : 'Someone new'}</h3>
              <button onClick={() => setEditing(null)} className="p-2 text-black/40 hover:text-ink" aria-label="Close"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-3 text-sm text-black/60 cursor-pointer">
                <span className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center"><Camera className="w-5 h-5" /></span>
                {photo ? photo.name : editing.photoPath ? 'Change photo' : 'Add a photo (optional)'}
                <input type="file" accept="image/*" className="hidden" onChange={e => setPhoto(e.target.files?.[0] || null)} />
              </label>
              {([
                ['name', 'Name'],
                ['business', 'Business or what they do'],
                ['whereMet', 'Where you met'],
                ['introducedBy', 'Who introduced you'],
                ['whereSeen', 'Where they usually are (club, bar, golf day)'],
              ] as [keyof Person, string][]).map(([field, label]) => (
                <input key={field} value={(editing[field] as string) || ''} onChange={e => setEditing({ ...editing, [field]: e.target.value })} placeholder={label} className={inputClass} />
              ))}
              <textarea value={editing.notes || ''} onChange={e => setEditing({ ...editing, notes: e.target.value })} rows={4}
                placeholder="What to remember: family, home town, interests, what you talked about" className={inputClass} />
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-black/45">Met on
                  <input type="date" value={editing.metOn || ''} onChange={e => setEditing({ ...editing, metOn: e.target.value })} className={`${inputClass} mt-1`} />
                </label>
                <label className="text-xs text-black/45">Catch up by
                  <input type="date" value={editing.followUpOn || ''} onChange={e => setEditing({ ...editing, followUpOn: e.target.value })} className={`${inputClass} mt-1`} />
                </label>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button onClick={save} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-ink text-white text-sm font-medium disabled:opacity-50">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save
              </button>
              {editing.id && (
                <button onClick={() => remove(editing)} className="p-3 rounded-full text-red-600 hover:bg-red-50" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
              )}
            </div>
          </div>
        </div>
      )}

      {view === 'people' && (
        <div className="space-y-8">
          {due.length > 0 && (
            <section>
              <h3 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-800 mb-3"><CalendarClock className="w-4 h-4" /> Catch up with</h3>
              <div className="grid gap-3">{due.map(personCard)}</div>
            </section>
          )}
          {connectors.length > 0 && (
            <section className="p-5 rounded-2xl bg-ink text-white">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold mb-2">Your best connectors</h3>
              <p className="text-sm text-white/70">{connectors.map(([name, n]) => `${name} (${n} intros)`).join(' · ')}</p>
              <p className="text-xs text-white/45 mt-2">They keep introducing you to people. Look after them.</p>
            </section>
          )}
          <section>
            {contacts.length > 0 && <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/40 mb-3">Everyone ({contacts.length})</h3>}
            <div className="relative mb-4">
              <Search className="w-4 h-4 text-black/30 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search names, places, notes" className="w-full pl-9 pr-3 py-2 rounded-full bg-black/5 text-sm border-0 focus:ring-2 focus:ring-gold-deep/30" />
            </div>
            {contacts.length === 0 ? (
              <div className="p-10 text-center bg-white border border-dashed border-black/15 rounded-2xl text-sm text-black/50">
                No one yet. Tap <span className="font-semibold">Add someone</span> after you meet a person, or see who's worth meeting.
              </div>
            ) : (
              <div className="grid gap-3">{contacts.filter(matches).sort((a, b) => a.name.localeCompare(b.name)).map(personCard)}</div>
            )}
          </section>
        </div>
      )}

      {view === 'suggested' && (
        <div>
          <p className="text-sm text-black/55 mb-5">Owners who have run a business in Pattaya for 3+ years, found from public sources only (press, clubs, business pages). Tick them off as you go.</p>
          {suggested.length === 0 ? (
            <div className="p-10 text-center bg-white border border-dashed border-black/15 rounded-2xl text-sm text-black/50">No suggestions right now. A new batch is added each month.</div>
          ) : (
            <div className="grid gap-3">
              {suggested.map(p => (
                <div key={p.id} className={`p-5 bg-white border border-black/10 rounded-2xl ${p.status !== 'suggested' ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-serif text-lg text-ink">{p.name}</div>
                      <div className="text-sm text-black/55">{[p.role, p.business].filter(Boolean).join(', ')}{p.sinceYear ? ` · since ${p.sinceYear}` : ''}</div>
                    </div>
                    {p.status !== 'suggested' && <span className="text-[11px] px-2.5 py-1 rounded-full bg-black/5 text-black/45">{p.status === 'later' ? 'Later' : 'Skipped'}</span>}
                  </div>
                  {p.whyMeet && <p className="mt-3 text-sm text-black/70"><Sparkles className="inline w-3.5 h-3.5 text-gold-deep mr-1" />{p.whyMeet}</p>}
                  {p.wayIn && <p className="mt-1.5 text-sm text-black/70"><MapPin className="inline w-3.5 h-3.5 text-gold-deep mr-1" />{p.wayIn}</p>}
                  {p.sourceUrl && (
                    <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-black/40 hover:text-ink">
                      {p.sourceLabel || 'Source'} <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={() => met(p)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ink text-white text-xs"><Check className="w-3.5 h-3.5" /> Met them</button>
                    {p.status !== 'later' && <button onClick={() => update(p, { status: 'later' })} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/5 text-xs text-ink"><Clock className="w-3.5 h-3.5" /> Later</button>}
                    {p.status !== 'skipped' && <button onClick={() => update(p, { status: 'skipped' })} className="px-3 py-1.5 rounded-full text-xs text-black/45 hover:text-ink">Not for me</button>}
                    {p.status !== 'suggested' && <button onClick={() => update(p, { status: 'suggested' })} className="px-3 py-1.5 rounded-full text-xs text-black/45 hover:text-ink">Move back</button>}
                  </div>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => setShowSkipped(s => !s)} className="mt-4 text-xs text-black/40 hover:text-ink">{showSkipped ? 'Hide' : 'Show'} skipped</button>
        </div>
      )}

      {view === 'events' && (
        <div>
          <p className="text-sm text-black/55 mb-5">Regular things where settled residents and business owners go. Turn up to the same one a few weeks running.</p>
          {events.length === 0 ? (
            <div className="p-10 text-center bg-white border border-dashed border-black/15 rounded-2xl text-sm text-black/50">No events loaded yet.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {events.slice().sort((a, b) => a.title.localeCompare(b.title)).map(e => {
                const known = peopleAt(e);
                return (
                  <div key={e.id} className="p-5 bg-white border border-black/10 rounded-2xl">
                    <div className="font-serif text-lg text-ink">{e.title}</div>
                    {e.when && <div className="text-sm text-gold-deep mt-0.5">{e.when}</div>}
                    {e.where && <div className="text-xs text-black/50 mt-1">{e.where}</div>}
                    {e.crowd && <p className="text-sm text-black/70 mt-3">{e.crowd}</p>}
                    {e.tip && <p className="text-xs text-black/55 mt-2 italic">{e.tip}</p>}
                    {known.length > 0 && <p className="text-xs text-emerald-700 mt-2">You know: {known.map(p => p.name).join(', ')}</p>}
                    {e.url && <a href={e.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-black/40 hover:text-ink">Check dates <ExternalLink className="w-3 h-3" /></a>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {view === 'playbook' && (
        <div className="grid gap-4">
          {PLAYBOOK.map(s => (
            <section key={s.title} className="p-6 bg-white border border-black/10 rounded-2xl">
              <h3 className="font-serif text-xl mb-3">{s.title}</h3>
              <ul className="space-y-2">
                {s.points.map(pt => <li key={pt} className="text-sm text-black/70 pl-4 relative before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-gold-deep">{pt}</li>)}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
