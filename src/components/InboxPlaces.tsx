import { useEffect, useRef, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { Loader2, LocateFixed, MapPin, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '../firebase';

// Location reminders for Reminders (/inbox). Shane saves the places he cares about (Terminal 21, Hemingways Lakeside…)
// in inbox_settings/places. A web app can't watch location in the background on iPhone, so when the app opens (or
// comes back to the screen) it takes ONE location reading, and only if a saved place has open reminders on it.
// Reminders tagged with the place you're at are shown at the top of the list. Nothing is tracked or stored.

export interface SavedPlace { id: string; name: string; lat: number; lng: number; radius: number }

const RADII = [150, 300, 600, 1000];
const RECHECK_MS = 60_000;

export function useSavedPlaces(): SavedPlace[] {
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  useEffect(() => onSnapshot(doc(db, 'inbox_settings', 'places'), snap => setPlaces((snap.get('list') as SavedPlace[]) || []), () => {}), []);
  return places;
}

const savePlaces = (list: SavedPlace[]) => setDoc(doc(db, 'inbox_settings', 'places'), { list }, { merge: true });

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9ก-๙]+/g, ' ').trim();
// A reminder's place is free text ("at Terminal 21", "Lakeside"), so match loosely on the saved name.
export const placeMatches = (itemPlace: string | null | undefined, p: SavedPlace) => {
  if (!itemPlace) return false;
  const a = norm(itemPlace), b = norm(p.name);
  return !!a && !!b && (a === b || a.includes(b) || b.includes(a));
};

const metres = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371e3, r = Math.PI / 180;
  const dLat = (lat2 - lat1) * r, dLng = (lng2 - lng1) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const getPosition = (fresh = false) => new Promise<GeolocationPosition>((resolve, reject) => {
  if (!navigator.geolocation) { reject(new Error('unavailable')); return; }
  navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: fresh, maximumAge: fresh ? 0 : 120_000, timeout: 15_000 });
});

// One reading when the app opens or returns to the screen (at most once a minute). Returns the saved place you're at.
export function useNearbyPlace(places: SavedPlace[], enabled: boolean): SavedPlace | null {
  const [here, setHere] = useState<SavedPlace | null>(null);
  const last = useRef(0);
  const placesRef = useRef(places);
  placesRef.current = places;
  useEffect(() => {
    if (!enabled) { setHere(null); return; }
    const check = () => {
      if (document.visibilityState !== 'visible' || Date.now() - last.current < RECHECK_MS) return;
      last.current = Date.now();
      getPosition().then(pos => {
        const { latitude, longitude, accuracy } = pos.coords;
        const near = placesRef.current
          .map(p => ({ p, d: metres(latitude, longitude, p.lat, p.lng) }))
          .filter(x => x.d <= x.p.radius + Math.min(accuracy || 0, 300))
          .sort((a, b) => a.d - b.d)[0];
        setHere(near?.p || null);
      }).catch(() => {});
    };
    check();
    document.addEventListener('visibilitychange', check);
    window.addEventListener('focus', check);
    return () => { document.removeEventListener('visibilitychange', check); window.removeEventListener('focus', check); };
  }, [enabled]);
  return here;
}

interface Found { name: string; full: string; lat: number; lng: number }
// OpenStreetMap search, nudged to Pattaya and Thailand. No key needed.
const searchPlaces = async (q: string): Promise<Found[]> => {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&countrycodes=th&viewbox=100.75,13.05,101.05,12.75&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  if (!res.ok) throw new Error(String(res.status));
  const rows = await res.json() as { name?: string; display_name: string; lat: string; lon: string }[];
  return rows.map(r => ({ name: r.name || r.display_name.split(',')[0], full: r.display_name, lat: +r.lat, lng: +r.lon }));
};

export function PlacesSettings({ places, unsaved }: { places: SavedPlace[]; unsaved: string[] }) {
  const [name, setName] = useState('');
  const [found, setFound] = useState<Found[] | null>(null);
  const [busy, setBusy] = useState<'search' | 'here' | null>(null);

  const add = (p: Omit<SavedPlace, 'id' | 'radius'>) => {
    const n = (name.trim() || p.name).slice(0, 60);
    savePlaces([...places, { ...p, name: n, id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, radius: 300 }])
      .then(() => { toast.success(`Saved ${n}`); setName(''); setFound(null); })
      .catch(() => toast.error('Could not save'));
  };
  const update = (id: string, c: Partial<SavedPlace>) => savePlaces(places.map(p => (p.id === id ? { ...p, ...c } : p))).catch(() => toast.error('Could not save'));
  const remove = (p: SavedPlace) => { if (window.confirm(`Remove ${p.name}?`)) savePlaces(places.filter(x => x.id !== p.id)).catch(() => toast.error('Could not remove it')); };

  const search = async (q = name) => {
    if (!q.trim()) return;
    setBusy('search');
    try { setFound(await searchPlaces(q.trim())); } catch { toast.error('Search failed. Try "Use where I am".'); }
    setBusy(null);
  };
  const useHere = async () => {
    if (!name.trim()) { toast.error('Type a name for this place first'); return; }
    setBusy('here');
    try { const { coords } = await getPosition(true); add({ name: name.trim(), lat: coords.latitude, lng: coords.longitude }); }
    catch { toast.error('Could not get your location. Allow location for this app in iPhone Settings.'); }
    setBusy(null);
  };

  return (
    <section className="mt-5">
      <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-black/45">Places</h3>
      <div className="mt-2 rounded-2xl bg-white border border-black/10 divide-y divide-black/[0.07]">
        {places.map(p => (
          <div key={p.id} className="flex items-center gap-2 px-3 py-2.5">
            <MapPin className="w-5 h-5 shrink-0 text-success" />
            <input defaultValue={p.name} onBlur={e => { const v = e.target.value.trim(); if (v && v !== p.name) update(p.id, { name: v }); }}
              aria-label="Place name" className="min-w-0 flex-1 px-2 py-1.5 rounded-lg bg-black/[0.04] text-[15px] font-semibold" />
            <select value={p.radius} onChange={e => update(p.id, { radius: +e.target.value })} aria-label="How close counts"
              className="shrink-0 px-2 py-1.5 rounded-lg bg-black/[0.04] text-[13px] border-0">
              {RADII.map(r => <option key={r} value={r}>{r < 1000 ? `${r} m` : '1 km'}</option>)}
            </select>
            <button onClick={() => remove(p)} aria-label="Remove" className="p-1 text-black/30"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        <div className="px-3 py-2.5 space-y-2">
          <div className="flex items-center gap-2">
            <input value={name} onChange={e => { setName(e.target.value); setFound(null); }} onKeyDown={e => { if (e.key === 'Enter') search(); }}
              placeholder="e.g. Terminal 21 Pattaya" className="min-w-0 flex-1 px-2 py-1.5 rounded-lg bg-black/[0.04] text-[15px]" />
            <button onClick={() => search()} disabled={!name.trim() || !!busy} aria-label="Find on map"
              className="px-3 py-1.5 rounded-lg bg-ink text-white text-[14px] font-medium disabled:opacity-30 inline-flex items-center gap-1">
              {busy === 'search' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Find</button>
          </div>
          <button onClick={useHere} disabled={!!busy} className="w-full py-2 rounded-lg bg-black/[0.04] text-[14px] text-black/60 inline-flex items-center justify-center gap-1.5 disabled:opacity-40">
            {busy === 'here' ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />} Use where I am now</button>
          {found && (found.length ? (
            <ul className="rounded-xl border border-black/10 divide-y divide-black/[0.07]">
              {found.map((r, k) => (
                <li key={k}><button onClick={() => add(r)} className="w-full text-left px-3 py-2">
                  <span className="block text-[15px] font-semibold">{r.name}</span>
                  <span className="block text-[12px] text-black/45 truncate">{r.full}</span>
                </button></li>
              ))}
            </ul>
          ) : <p className="text-[13px] text-black/45 px-1">Nothing found. Go there and tap "Use where I am now".</p>)}
        </div>
      </div>
      {unsaved.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[12px] text-black/40">In your reminders:</span>
          {unsaved.map(u => <button key={u} onClick={() => { setName(u); search(u); }} className="px-2.5 py-1 rounded-full bg-white border border-black/10 text-[13px] text-black/60">+ {u}</button>)}
        </div>
      )}
      <p className="mt-1.5 text-[12px] text-black/40">When you open Reminders near one of these, its reminders show at the top. Location is checked once on opening, never in the background.</p>
    </section>
  );
}
