import React, { useEffect, useMemo, useState } from 'react';
import { db, storage } from '../firebase';
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, setDoc, serverTimestamp, arrayUnion, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getBlob, deleteObject } from 'firebase/storage';
import { Loader2, Plus, Search, X, Camera, Trash2, Check, Clock, ExternalLink, UserRound, MapPin, Flame, ChevronLeft } from 'lucide-react';
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

const emptyForm = (): Partial<Person> => ({ name: '', business: '', whereMet: '', metOn: today(), introducedBy: '', whereSeen: '', notes: '' });

const inputClass = 'w-full px-4 py-2.5 rounded-xl bg-white border border-black/10 text-[15px] focus:ring-2 focus:ring-black/10';

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
  if (url) return <img src={url} alt={name} className="w-10 h-10 rounded-full object-cover shrink-0" />;
  const initials = name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return <div className="w-10 h-10 rounded-full bg-black/[0.06] text-black/50 flex items-center justify-center text-[13px] font-semibold shrink-0">{initials || <UserRound className="w-5 h-5" />}</div>;
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
      'Three to five meetings in the first couple of months is what turns an acquaintance into a friend.',
      'Be the connector: introduce two people who should know each other. They both remember you for it, and you get invited to more.',
    ],
  },
];

export default function CircleAdmin({ onBack }: { onBack?: () => void }) {
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
    updateDoc(doc(db, 'circle_people', p.id), { lastSeenOn: now, catchUps: arrayUnion(now), updatedAt: serverTimestamp() })
      .catch(() => toast.error('Could not update'));
    toast.success(`Caught up with ${p.name.split(' ')[0]}`);
  };

  const met = (p: Person) => {
    const fields = { status: 'contact' as Status, metOn: now };
    update(p, fields);
    setEditing({ ...p, ...fields });
    setView('people');
  };

  // Same look as Reminders: cream page, big serif title, segmented filter, plain divided rows.
  const shell = (body: React.ReactNode) => (
    <div className="min-h-[100dvh] bg-cream text-ink font-sans" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="max-w-xl mx-auto px-4 pb-24">{body}</div>
    </div>
  );

  if (loading) {
    return shell(
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-7 h-7 animate-spin text-black/30" />
      </div>
    );
  }

  const rowClass = 'flex items-start gap-3 py-3.5 border-b border-black/[0.07] last:border-0';
  const linkBtn = 'text-[13px] font-semibold text-black/50 hover:text-ink';
  const groupTitle = 'font-sans text-[20px] font-bold tracking-normal normal-case text-ink';

  const personRow = (p: Person) => (
    <li key={p.id} className={rowClass}>
      <PrivatePhoto path={p.photoPath} name={p.name} />
      <button onClick={() => { setEditing(p); setPhoto(null); }} className="min-w-0 flex-1 text-left">
        <div className="text-[16px] leading-snug text-ink">{p.name}</div>
        {(p.business || p.role) && <div className="text-[13px] text-black/50 mt-0.5">{[p.role, p.business].filter(Boolean).join(', ')}</div>}
        {p.notes && <div className="text-[13px] text-black/45 mt-0.5 line-clamp-2">{p.notes}</div>}
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] text-black/45">
          {(p.whereMet || p.metOn) && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{p.whereMet || 'Met'}{p.metOn ? `, ${prettyDate(p.metOn)}` : ''}</span>}
          {p.introducedBy && <span className="inline-flex items-center gap-1"><UserRound className="w-3 h-3" />via {p.introducedBy}</span>}
          {p.whereSeen && <span>Usually at {p.whereSeen}</span>}
        </div>
      </button>
      <button onClick={() => caughtUp(p)} aria-label={`Caught up with ${p.name} today`} title="Caught up today"
        className={`mt-0.5 w-7 h-7 shrink-0 rounded-full border-2 flex items-center justify-center ${p.lastSeenOn === now ? 'bg-ink border-ink' : 'border-black/20'}`}>
        <Check className={`w-3.5 h-3.5 ${p.lastSeenOn === now ? 'text-white' : 'text-black/30'}`} strokeWidth={3} />
      </button>
    </li>
  );

  const metLine = `week ${score.week}/${targets.week} · month ${score.month}/${targets.month} · year ${score.year}/${targets.year}`;

  return shell(
    <>
      <header className="flex items-center justify-between pt-4">
        {onBack
          ? <button onClick={onBack} className="flex items-center gap-0.5 -ml-1.5 text-[15px] text-black/55"><ChevronLeft className="w-5 h-5" /> Reminders</button>
          : <span className="text-[12px] uppercase tracking-[0.18em] text-black/45 font-semibold">Private to you</span>}
        <button onClick={() => { setView('people'); setEditing(emptyForm()); setPhoto(null); }} aria-label="Add someone" className="p-1 text-black/50"><Plus className="w-6 h-6" /></button>
      </header>
      <h1 className="mt-1 font-serif text-[36px] leading-tight font-bold text-ink">Circle</h1>
      <p className="mt-0.5 text-[14px] text-black/50">
        {contacts.length} {contacts.length === 1 ? 'person' : 'people'}
        {score.streak > 0 && <> · <Flame className="inline w-3.5 h-3.5 -mt-0.5 text-amber-600" /> {score.streak} week{score.streak === 1 ? '' : 's'} on target</>}
        {score.catchUpsMonth > 0 && <> · {score.catchUpsMonth} catch-up{score.catchUpsMonth === 1 ? '' : 's'} this month</>}
      </p>
      {editTargets ? (
        <div className="mt-3 p-4 rounded-2xl bg-white border border-black/10">
          <div className="text-[13px] font-semibold text-black/55 mb-2">New people to meet</div>
          <div className="grid grid-cols-3 gap-2">
            {(['week', 'month', 'year'] as (keyof Targets)[]).map(k => (
              <label key={k} className="text-[12px] text-black/45">Per {k}
                <input type="number" min={0} value={editTargets[k]} onChange={e => setEditTargets({ ...editTargets, [k]: Number(e.target.value) })} className={`${inputClass} mt-1`} />
              </label>
            ))}
          </div>
          <div className="flex gap-4 mt-3">
            <button onClick={saveTargets} className="px-4 py-1.5 rounded-full bg-ink text-white text-[13px] font-semibold">Save</button>
            <button onClick={() => setEditTargets(null)} className={linkBtn}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setEditTargets(targets)} className="mt-0.5 text-left text-[14px] text-black/50">
          New people met: {metLine}
        </button>
      )}

      <div className="sticky top-0 z-10 bg-cream -mx-4 px-4 pt-3 pb-1.5">
        <div className="flex rounded-[10px] bg-black/[0.06] p-0.5">
          {([['people', 'People'], ['suggested', 'To meet'], ['events', "What's on"], ['playbook', 'Tips']] as [View, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setView(key)}
              className={`flex-1 py-1 rounded-[8px] text-[13px] font-semibold ${view === key ? 'bg-white text-ink shadow-sm' : 'text-black/50'}`}>{label}</button>
          ))}
        </div>
        {view === 'people' && contacts.length > 0 && (
          <div className="relative mt-2">
            <Search className="w-4 h-4 text-black/30 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search names, places, notes"
              className="w-full pl-9 pr-3 py-1.5 rounded-[10px] bg-black/[0.06] text-[14px] border-0 focus:ring-2 focus:ring-black/10" />
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={() => !saving && setEditing(null)}>
          <div className="bg-cream w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-6 font-sans" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-serif text-[28px] leading-tight font-bold">{editing.id ? editing.name : 'Someone new'}</h3>
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
        <>
          {contacts.length === 0
            ? <p className="py-14 text-center text-black/35">No one yet. Tap + after you meet someone.</p>
            : <ul className="mt-1">{contacts.filter(matches).sort((a, b) => a.name.localeCompare(b.name)).map(personRow)}</ul>}
          {connectors.length > 0 && (
            <p className="mt-6 text-[13px] text-black/45">Best connectors: {connectors.map(([name, n]) => `${name} (${n} intros)`).join(', ')}. Look after them.</p>
          )}
        </>
      )}

      {view === 'suggested' && (
        <>
          <p className="mt-2 text-[13px] text-black/45">Owners running a Pattaya business for 3+ years, from public sources only.</p>
          {suggested.length === 0 ? (
            <p className="py-14 text-center text-black/35">No suggestions right now.</p>
          ) : (
            <ul className="mt-1">
              {suggested.map(p => (
                <li key={p.id} className={`${rowClass} ${p.status !== 'suggested' ? 'opacity-55' : ''}`}>
                  <div className="min-w-0 flex-1">
                    <div className="text-[16px] leading-snug text-ink">{p.name}{p.status !== 'suggested' && <span className="ml-2 text-[12px] text-black/40">{p.status === 'later' ? 'Later' : 'Skipped'}</span>}</div>
                    <div className="text-[13px] text-black/50 mt-0.5">{[p.role, p.business].filter(Boolean).join(', ')}{p.sinceYear ? ` · since ${p.sinceYear}` : ''}</div>
                    {p.whyMeet && <div className="text-[13px] text-black/60 mt-1">{p.whyMeet}</div>}
                    {p.wayIn && <div className="text-[13px] text-black/45 mt-0.5"><MapPin className="inline w-3 h-3 -mt-0.5 mr-1" />{p.wayIn}</div>}
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <button onClick={() => met(p)} className="text-[13px] font-semibold text-ink">Met them</button>
                      {p.status !== 'later' && <button onClick={() => update(p, { status: 'later' })} className={linkBtn}>Later</button>}
                      {p.status !== 'skipped' && <button onClick={() => update(p, { status: 'skipped' })} className={linkBtn}>Not for me</button>}
                      {p.status !== 'suggested' && <button onClick={() => update(p, { status: 'suggested' })} className={linkBtn}>Move back</button>}
                      {p.sourceUrl && <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12px] text-black/35">{p.sourceLabel || 'Source'} <ExternalLink className="w-3 h-3" /></a>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <button onClick={() => setShowSkipped(s => !s)} className={`mt-4 ${linkBtn}`}>{showSkipped ? 'Hide' : 'Show'} skipped</button>
        </>
      )}

      {view === 'events' && (
        <>
          <p className="mt-2 text-[13px] text-black/45">Regular things settled residents go to. Turn up to the same one a few weeks running.</p>
          {events.length === 0 ? (
            <p className="py-14 text-center text-black/35">No events loaded yet.</p>
          ) : (
            <ul className="mt-1">
              {events.slice().sort((a, b) => a.title.localeCompare(b.title)).map(e => {
                const known = peopleAt(e);
                return (
                  <li key={e.id} className={rowClass}>
                    <div className="min-w-0 flex-1">
                      <div className="text-[16px] leading-snug text-ink">{e.title}</div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] text-black/50">
                        {e.when && <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{e.when}</span>}
                        {e.where && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{e.where}</span>}
                      </div>
                      {e.crowd && <div className="text-[13px] text-black/60 mt-1">{e.crowd}</div>}
                      {e.tip && <div className="text-[13px] text-black/45 mt-0.5">{e.tip}</div>}
                      {known.length > 0 && <div className="text-[12px] font-semibold text-emerald-700 mt-1">You know {known.map(p => p.name).join(', ')}</div>}
                      {e.url && <a href={e.url} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-[12px] text-black/35">Check dates <ExternalLink className="w-3 h-3" /></a>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {view === 'playbook' && PLAYBOOK.map(s => (
        <section key={s.title} className="mt-5">
          <h3 className={groupTitle}>{s.title}</h3>
          <ul className="mt-1">
            {s.points.map(pt => <li key={pt} className={`${rowClass} text-[15px] leading-snug text-black/75`}>{pt}</li>)}
          </ul>
        </section>
      ))}
    </>
  );
}
