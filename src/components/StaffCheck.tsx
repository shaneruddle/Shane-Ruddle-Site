import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Check, Loader2, Lock, MapPin, Search, UserPlus, X } from 'lucide-react';
import { COMPANIES, shrinkPhoto } from '../lib/staffCheck';

// The cashier's staff list (/staff-check). One shared PIN, remembered on this till's phone or tablet,
// plus which venue the till is at. Staff need nothing: the cashier finds them by name or photo.

type Venue = { id: string; name: string; discount: string };
type Person = { id: string; name: string; nickname: string; company: string; position: string; mobileEnd: string; discount: string; hasPhoto: boolean };

// One-tap company filters. Matched loosely because company names were typed in different ways over the years.
const FILTERS: { label: string; match: RegExp }[] = [
  { label: 'ABPC', match: /alan bolton|abpc/i },
  { label: 'ECRE', match: /east coast|ecre/i },
  { label: 'Cajun', match: /cajun/i },
  { label: 'Hemingways Lakeside', match: /lakeside/i },
  { label: 'Hemingways Jomtien', match: /jomtien/i },
  { label: 'Hemingways Pattaya', match: /hemingways\s*\(?pattaya/i },
  { label: 'PRAC', match: /rent a car|rent-a-car|prac/i },
];

const PIN_KEY = 'sr_staff_check_pin';
const VENUE_KEY = 'sr_staff_check_venue';

const post = async (path: string, body: Record<string, unknown>) => {
  const res = await fetch(`/api/staff-check/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Something went wrong.'), { status: res.status });
  return data;
};

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

// Photos load one by one after the list, and are kept for the visit.
const photoCache = new Map<string, Promise<string>>();

function Photo({ person, pin, big = false }: { person: Person; pin: string; big?: boolean }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    if (!person.hasPhoto) return;
    let live = true;
    if (!photoCache.has(person.id)) photoCache.set(person.id, post('photo', { pin, id: person.id }).then(d => d.photo || '').catch(() => ''));
    photoCache.get(person.id)!.then(p => { if (live) setSrc(p); });
    return () => { live = false; };
  }, [person.id, person.hasPhoto, pin]);
  const size = big ? 'w-40 h-40 text-4xl' : 'w-16 h-16 text-lg';
  return src ? (
    <img src={src} alt={person.name} className={`${size} rounded-2xl object-cover bg-black/5 shrink-0`} />
  ) : (
    <div className={`${size} rounded-2xl bg-ink/5 text-black/40 font-serif flex items-center justify-center shrink-0`}>{initials(person.name)}</div>
  );
}

const fieldClass = 'w-full px-4 py-3 rounded-xl bg-white border border-black/10 text-base focus:outline-none focus:ring-2 focus:ring-gold-deep/30';

// The cashier adds someone who isn't on the list yet. They go on straight away; Shane gets an email.
function AddStaff({ pin, venueId, startName, onClose, onAdded }: { pin: string; venueId: string; startName: string; onClose: () => void; onAdded: (name: string) => void }) {
  const [f, setF] = useState({ name: startName, nickname: '', mobile: '', company: '', position: '', photo: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (k: keyof typeof f, v: string) => setF(x => ({ ...x, [k]: v }));

  const pick = async (file?: File) => {
    if (!file) return;
    try { set('photo', await shrinkPhoto(file)); } catch (err) { setError(err instanceof Error ? err.message : 'Could not read that photo.'); }
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!f.name.trim() || !f.company) { setError('Add their name and pick a company.'); return; }
    setSaving(true);
    setError('');
    try {
      await post('add', { pin, venue: venueId, ...f });
      onAdded(f.name.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add them.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-20 bg-black/40 flex items-end sm:items-center justify-center" onClick={onClose}>
      <form onSubmit={save} className="w-full sm:max-w-md max-h-[92vh] overflow-y-auto bg-cream rounded-t-3xl sm:rounded-3xl p-6 pb-8" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-serif text-ink">Add staff member</h2>
          <button type="button" onClick={onClose} className="p-2 text-black/40 hover:text-ink" aria-label="Close"><X className="w-5 h-5" /></button>
        </div>
        <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-4 mb-5 text-left">
          {f.photo
            ? <img src={f.photo} alt="" className="w-20 h-20 rounded-2xl object-cover" />
            : <span className="w-20 h-20 rounded-2xl bg-ink/5 text-black/40 flex items-center justify-center"><Camera className="w-6 h-6" /></span>}
          <span className="text-sm font-semibold text-gold-deep">{f.photo ? 'Retake photo' : 'Take their photo'}</span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" capture="user" className="hidden" onChange={e => { pick(e.target.files?.[0]); e.target.value = ''; }} />
        <div className="space-y-3">
          <input value={f.name} onChange={e => set('name', e.target.value)} placeholder="Full name" className={fieldClass} />
          <input value={f.nickname} onChange={e => set('nickname', e.target.value)} placeholder="Nickname" className={fieldClass} />
          <input value={f.mobile} onChange={e => set('mobile', e.target.value)} placeholder="Mobile number" inputMode="tel" className={fieldClass} />
          <select value={f.company} onChange={e => set('company', e.target.value)} className={fieldClass}>
            <option value="">Which company do they work for?</option>
            {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input value={f.position} onChange={e => set('position', e.target.value)} placeholder="Position (e.g. waitress, driver)" className={fieldClass} />
        </div>
        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        <button type="submit" disabled={saving} className="w-full mt-6 py-4 rounded-full bg-ink text-white text-sm font-semibold uppercase tracking-[0.15em] disabled:opacity-60 flex items-center justify-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Add to staff list
        </button>
        <p className="text-xs text-black/40 text-center mt-3">Shane gets an email about every new person.</p>
      </form>
    </div>
  );
}

export default function StaffCheck() {
  const [pin, setPin] = useState(() => localStorage.getItem(PIN_KEY) || '');
  const [pinInput, setPinInput] = useState('');
  const [venueId, setVenueId] = useState(() => localStorage.getItem(VENUE_KEY) || '');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [staff, setStaff] = useState<Person[]>([]);
  const [loading, setLoading] = useState(!!pin);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [open, setOpen] = useState<Person | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState('');
  const [adding, setAdding] = useState(false);

  const load = async (p: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await post('list', { pin: p });
      setVenues(data.venues || []);
      setStaff(data.staff || []);
      setPin(p);
      localStorage.setItem(PIN_KEY, p);
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 401) { localStorage.removeItem(PIN_KEY); setPin(''); }
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (pin) load(pin); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const venue = venues.find(v => v.id === venueId);
  const q = search.trim().toLowerCase();
  const filterMatch = FILTERS.find(f => f.label === filter)?.match;
  const shown = useMemo(
    () => staff.filter(p => !filterMatch || filterMatch.test(p.company)).filter(p => !q || [p.name, p.nickname, p.company, p.position, p.mobileEnd].some(v => v.toLowerCase().includes(q))),
    [staff, q, filterMatch],
  );

  const chooseVenue = (id: string) => { setVenueId(id); localStorage.setItem(VENUE_KEY, id); };

  const markUsed = async () => {
    if (!open || !venue) return;
    setSaving(true);
    try {
      await post('used', { pin, venue: venue.id, id: open.id });
      setSaved(open.name);
      setOpen(null);
      setTimeout(() => setSaved(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that.');
    } finally {
      setSaving(false);
    }
  };

  const submitPin = (e: FormEvent) => { e.preventDefault(); if (pinInput.trim()) load(pinInput.trim()); };

  if (loading) {
    return <div className="min-h-screen bg-cream flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gold-deep" /></div>;
  }

  if (!pin) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-6">
        <form onSubmit={submitPin} className="w-full max-w-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-ink text-gold inline-flex items-center justify-center mb-6"><Lock className="w-6 h-6" /></div>
          <h1 className="text-4xl font-serif text-ink">Staff check</h1>
          <p className="text-black/55 mt-2 mb-8">Enter the PIN to see the staff list.</p>
          <input
            value={pinInput}
            onChange={e => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 8))}
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            placeholder="PIN"
            className="w-full text-center text-3xl tracking-[0.4em] py-4 rounded-2xl bg-white border border-black/10 focus:outline-none focus:ring-2 focus:ring-gold-deep/30"
          />
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
          <button type="submit" className="w-full mt-4 py-4 rounded-full bg-ink text-white text-sm font-semibold uppercase tracking-[0.15em]">Open</button>
        </form>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-cream px-6 py-12">
        <div className="max-w-md mx-auto">
          <h1 className="text-4xl font-serif text-ink">Which venue is this?</h1>
          <p className="text-black/55 mt-2 mb-8">This phone or tablet will remember it.</p>
          <div className="space-y-3">
            {venues.map(v => (
              <button key={v.id} onClick={() => chooseVenue(v.id)} className="w-full text-left px-5 py-4 rounded-2xl bg-white border border-black/10 hover:border-gold-deep/40">
                <span className="block text-lg font-serif text-ink">{v.name}</span>
                {v.discount && <span className="block text-sm text-gold-deep">{v.discount}</span>}
              </button>
            ))}
          </div>
          {error && <p className="text-sm text-red-600 mt-4">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-10 bg-cream/95 backdrop-blur border-b border-black/5">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-5 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <a href="/" aria-label="Shane Ruddle — home" className="inline-flex items-center gap-2.5 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" className="w-8 h-8 shrink-0" aria-hidden="true">
                  <defs>
                    <linearGradient id="scGold" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#F9F295" />
                      <stop offset="45%" stopColor="#D4AF37" />
                      <stop offset="100%" stopColor="#B8860B" />
                    </linearGradient>
                  </defs>
                  <circle cx="60" cy="60" r="57" fill="#0A0A0A" />
                  <circle cx="60" cy="60" r="53" fill="none" stroke="url(#scGold)" strokeWidth="1.2" />
                  <text x="60" y="78" textAnchor="middle" fontSize="58" fontWeight="500" letterSpacing="-2" fill="url(#scGold)" fontFamily="system-ui, sans-serif">SR</text>
                </svg>
                <span className="font-serif text-base tracking-[0.18em] uppercase text-ink whitespace-nowrap">Shane <span className="font-semibold">Ruddle</span></span>
              </a>
              <span className="block text-[11px] font-medium uppercase tracking-[0.18em] text-gold-deep">Staff check</span>
              <h1 className="text-2xl sm:text-3xl font-serif text-ink leading-tight">{venue.name}</h1>
            </div>
            <div className="flex flex-col items-end gap-2 mt-1">
              <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-ink text-white text-xs font-semibold whitespace-nowrap">
                <UserPlus className="w-3.5 h-3.5" /> Add staff
              </button>
              <button onClick={() => { setVenueId(''); localStorage.removeItem(VENUE_KEY); }} className="flex items-center gap-1 text-xs text-black/45 hover:text-ink whitespace-nowrap">
                <MapPin className="w-3.5 h-3.5" /> Change venue
              </button>
            </div>
          </div>
          <div className="relative mt-4">
            <Search className="w-4 h-4 text-black/30 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, nickname or last 3 digits"
              className="w-full pl-11 pr-4 py-3 rounded-full bg-white border border-black/10 text-base focus:outline-none focus:ring-2 focus:ring-gold-deep/30"
            />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {FILTERS.map(f => (
              <button key={f.label} onClick={() => setFilter(filter === f.label ? '' : f.label)}
                className={`px-3 py-1.5 rounded-full text-[13px] whitespace-nowrap border transition-colors ${filter === f.label ? 'bg-ink text-white border-ink' : 'bg-white text-black/60 border-black/10'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-5">
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
        {shown.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-black/45">{staff.length ? 'Nobody matches. Not on the list means no staff discount.' : 'No staff on the list yet.'}</p>
            <button onClick={() => setAdding(true)} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-deep">
              <UserPlus className="w-4 h-4" /> New staff member? Add them
            </button>
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {shown.map(p => (
              <li key={p.id}>
                <button onClick={() => setOpen(p)} className="w-full flex items-center gap-4 p-3 rounded-[18px] bg-white border border-black/10 hover:border-gold-deep/40 text-left">
                  <Photo person={p} pin={pin} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-ink truncate">{p.name}{p.nickname && <span className="text-black/45 font-normal"> ({p.nickname})</span>}</span>
                    <span className="block text-sm text-black/55 truncate">{p.company}{p.position && ` · ${p.position}`}</span>
                    {p.mobileEnd && <span className="block text-xs text-black/40 mt-0.5">Mobile ends {p.mobileEnd}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-black/35 text-center mt-8">{staff.length} staff · private list, please don't share</p>
      </main>

      {open && (
        <div className="fixed inset-0 z-20 bg-black/40 flex items-end sm:items-center justify-center" onClick={() => setOpen(null)}>
          <div className="w-full sm:max-w-sm bg-cream rounded-t-3xl sm:rounded-3xl p-6 pb-8 text-center relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setOpen(null)} className="absolute right-4 top-4 p-2 text-black/40 hover:text-ink" aria-label="Close"><X className="w-5 h-5" /></button>
            <div className="flex justify-center mb-4"><Photo person={open} pin={pin} big /></div>
            <h2 className="text-2xl font-serif text-ink">{open.name}</h2>
            {open.nickname && <p className="text-black/55">“{open.nickname}”</p>}
            <p className="text-sm text-black/60 mt-1">{open.company}{open.position && ` · ${open.position}`}</p>
            {(() => {
              const d = open.discount || venue.discount;
              return (
                <div className="mt-5 py-4 px-5 rounded-2xl bg-white border border-gold-deep/30">
                  <div className="text-[10px] uppercase tracking-[0.2em] font-semibold text-black/40">Their discount</div>
                  <div className="text-2xl font-serif text-gold-deep mt-1">{d || 'Not set: ask the manager'}</div>
                </div>
              );
            })()}
            {open.mobileEnd && <p className="text-sm text-black/60 mt-3">Ask for their mobile: it ends in <span className="font-semibold text-ink tracking-wider">{open.mobileEnd}</span></p>}
            <button onClick={markUsed} disabled={saving} className="w-full mt-6 py-4 rounded-full bg-ink text-white text-sm font-semibold uppercase tracking-[0.15em] disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Discount used
            </button>
          </div>
        </div>
      )}

      {adding && (
        <AddStaff pin={pin} venueId={venue.id} startName={/\d/.test(search) ? '' : search.trim()} onClose={() => setAdding(false)}
          onAdded={name => { setAdding(false); setSearch(''); setSaved(`Added ${name}`); setTimeout(() => setSaved(''), 3000); load(pin); }} />
      )}

      {saved && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 bg-emerald-600 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2 text-sm font-semibold">
          <Check className="w-4 h-4" /> {saved.startsWith('Added ') ? saved : `Saved for ${saved}`}
        </div>
      )}
    </div>
  );
}
