import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Check, Loader2, Lock, MapPin, Search, X } from 'lucide-react';

// The cashier's staff list (/staff-check). One shared PIN, remembered on this till's phone or tablet,
// plus which venue the till is at. Staff need nothing: the cashier finds them by name or photo.

type Venue = { id: string; name: string; discount: string };
type Person = { id: string; name: string; nickname: string; company: string; position: string; mobileEnd: string; hasPhoto: boolean };

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

export default function StaffCheck() {
  const [pin, setPin] = useState(() => localStorage.getItem(PIN_KEY) || '');
  const [pinInput, setPinInput] = useState('');
  const [venueId, setVenueId] = useState(() => localStorage.getItem(VENUE_KEY) || '');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [staff, setStaff] = useState<Person[]>([]);
  const [loading, setLoading] = useState(!!pin);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState<Person | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState('');

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
  const shown = useMemo(
    () => staff.filter(p => !q || [p.name, p.nickname, p.company, p.position, p.mobileEnd].some(v => v.toLowerCase().includes(q))),
    [staff, q],
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
              <span className="block text-[11px] font-medium uppercase tracking-[0.18em] text-gold-deep">Staff check</span>
              <h1 className="text-2xl sm:text-3xl font-serif text-ink leading-tight">{venue.name}</h1>
              {venue.discount && <p className="text-sm text-black/60">Staff get <span className="font-semibold text-ink">{venue.discount}</span></p>}
            </div>
            <button onClick={() => { setVenueId(''); localStorage.removeItem(VENUE_KEY); }} className="flex items-center gap-1 text-xs text-black/45 hover:text-ink mt-1 whitespace-nowrap">
              <MapPin className="w-3.5 h-3.5" /> Change venue
            </button>
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
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-5">
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
        {shown.length === 0 ? (
          <p className="text-center text-black/45 py-16">{staff.length ? 'Nobody matches. Not on the list means no staff discount.' : 'No staff on the list yet.'}</p>
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
            {open.mobileEnd && <p className="text-sm text-black/60 mt-3">Ask for their mobile: it ends in <span className="font-semibold text-ink tracking-wider">{open.mobileEnd}</span></p>}
            <button onClick={markUsed} disabled={saving} className="w-full mt-6 py-4 rounded-full bg-ink text-white text-sm font-semibold uppercase tracking-[0.15em] disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Used{venue.discount ? `: ${venue.discount}` : ''}
            </button>
          </div>
        </div>
      )}

      {saved && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 bg-emerald-600 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2 text-sm font-semibold">
          <Check className="w-4 h-4" /> Saved for {saved}
        </div>
      )}
    </div>
  );
}
