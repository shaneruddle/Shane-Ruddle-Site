import { useEffect, useRef, useState } from 'react';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db, UserProfile } from '../firebase';
import { Camera, ExternalLink, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

// Admin side of the cashier's staff list (/staff-check): the shared PIN, each venue's discount,
// and editing a staff member's photo, mobile, company and whether they're on the list.

export const COMPANIES = [
  'Hemingways Jomtien', 'Hemingways Lakeside', 'Hemingways Pattaya', 'Cajun Life Cafe',
  'Pattaya Rent a Car', 'Alan Bolton Property Consultants', 'East Coast Real Estate',
];

type Venue = { id: string; name: string; discount: string };

const api = async (method: 'GET' | 'POST', body?: unknown) => {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch('/api/staff-check/settings', {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
};

// Shrinks a photo to 480px so the cashier's list loads fast on a phone.
const shrinkPhoto = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 480 / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => reject(new Error('Could not read that photo.'));
    img.src = URL.createObjectURL(file);
  });

const inputClass = 'w-full px-3 py-2 rounded-xl bg-black/5 text-sm border-0 focus:ring-2 focus:ring-gold-deep/30';

export function StaffCheckSettings() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [pinSet, setPinSet] = useState(false);
  const [pin, setPin] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api('GET').then(d => { setVenues(d.venues || []); setPinSet(!!d.pinSet); setOpen(!d.pinSet); })
      .catch(err => console.error('Staff check settings:', err instanceof Error ? err.message : err));
  }, []);

  const save = async () => {
    if (pin && !/^\d{4,8}$/.test(pin)) { toast.error('The PIN must be 4 to 8 digits.'); return; }
    if (!pinSet && !pin) { toast.error('Set a PIN first.'); return; }
    setSaving(true);
    try {
      await api('POST', { pin, discounts: Object.fromEntries(venues.map(v => [v.id, v.discount])) });
      if (pin) setPinSet(true);
      setPin('');
      toast.success('Staff check saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-6 p-5 bg-white border border-black/10 rounded-2xl">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <div className="font-serif text-lg text-ink">Cashier staff check</div>
          <div className="text-xs text-black/50">Cashiers open the list with one PIN. Only staff marked Active show up, with the last 3 digits of their mobile.</div>
        </div>
        <a href="/staff-check" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-semibold text-gold-deep hover:underline">
          Open the list <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <button onClick={() => setOpen(o => !o)} className="px-3 py-1.5 rounded-full bg-black/5 text-xs font-semibold text-black/60 hover:text-ink">
          {open ? 'Close' : 'PIN and discounts'}
        </button>
      </div>
      {open && (
        <div className="mt-5 grid sm:grid-cols-2 gap-4">
          <label className="block sm:col-span-2">
            <span className="block text-[10px] uppercase tracking-[0.2em] font-semibold text-black/40 mb-1">{pinSet ? 'New PIN (leave empty to keep the current one)' : 'PIN for cashiers (4 to 8 digits)'}</span>
            <input value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))} inputMode="numeric" className={`${inputClass} max-w-[200px] tracking-[0.3em]`} />
          </label>
          {venues.map(v => (
            <label key={v.id} className="block">
              <span className="block text-[10px] uppercase tracking-[0.2em] font-semibold text-black/40 mb-1">{v.name}</span>
              <input value={v.discount} placeholder="e.g. 20% off food"
                onChange={e => setVenues(vs => vs.map(x => x.id === v.id ? { ...x, discount: e.target.value } : x))} className={inputClass} />
            </label>
          ))}
          <div className="sm:col-span-2">
            <button onClick={save} disabled={saving} className="px-5 py-2 rounded-full bg-ink text-white text-xs font-semibold uppercase tracking-[0.12em] disabled:opacity-60">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

type Editable = Partial<UserProfile> & { id?: string };

export function StaffEditSheet({ person, onClose, onSaved }: { person: Editable; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Editable>(person);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (k: keyof UserProfile, v: unknown) => setForm(f => ({ ...f, [k]: v }));
  const isNew = !person.id;

  const pickPhoto = async (file?: File) => {
    if (!file) return;
    try { set('profileImage', await shrinkPhoto(file)); } catch (err) { toast.error(err instanceof Error ? err.message : 'Could not read that photo.'); }
  };

  const save = async () => {
    if (!form.name?.trim()) { toast.error('Add a name'); return; }
    if (!form.company) { toast.error('Pick a company'); return; }
    setSaving(true);
    const data = {
      name: form.name.trim(),
      nickname: form.nickname?.trim() || '',
      mobile: form.mobile?.trim() || '',
      company: form.company,
      position: form.position?.trim() || '',
      profileImage: form.profileImage || '',
      active: form.active !== false,
      updatedAt: serverTimestamp(),
    };
    try {
      if (isNew) await addDoc(collection(db, 'users'), { ...data, role: 'employee', roles: ['employee'], createdAt: serverTimestamp() });
      else await updateDoc(doc(db, 'users', person.id!), data);
      if (auth.currentUser) {
        addDoc(collection(db, 'usage_logs'), {
          userId: auth.currentUser.uid,
          userName: auth.currentUser.displayName || auth.currentUser.email || 'Admin',
          type: 'employee_update',
          details: `${isNew ? 'Added' : 'Updated'} ${data.name} (${data.company})${data.active ? '' : ', off the staff list'}`,
          timestamp: serverTimestamp(),
        }).catch(() => {});
      }
      toast.success(isNew ? 'Staff member added' : 'Saved');
      onSaved();
    } catch (err) {
      console.error('Staff save failed:', err instanceof Error ? err.message : err);
      toast.error('Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/40 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="w-full sm:max-w-md max-h-[92vh] overflow-y-auto bg-cream rounded-t-3xl sm:rounded-3xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-serif text-ink">{isNew ? 'Add staff member' : 'Edit staff member'}</h3>
          <button onClick={onClose} className="p-2 text-black/40 hover:text-ink" aria-label="Close"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex items-center gap-4 mb-5">
          {form.profileImage
            ? <img src={form.profileImage} alt="" className="w-20 h-20 rounded-2xl object-cover" />
            : <div className="w-20 h-20 rounded-2xl bg-black/5 flex items-center justify-center text-black/30"><Camera className="w-6 h-6" /></div>}
          <div className="flex flex-col gap-1.5 items-start">
            <button onClick={() => fileRef.current?.click()} className="px-3 py-1.5 rounded-full bg-ink text-white text-xs font-semibold">{form.profileImage ? 'Change photo' : 'Add photo'}</button>
            {form.profileImage && <button onClick={() => set('profileImage', '')} className="text-xs text-black/45 hover:text-red-600">Remove photo</button>}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { pickPhoto(e.target.files?.[0]); e.target.value = ''; }} />
          </div>
        </div>
        <div className="space-y-3">
          {([['name', 'Full name'], ['nickname', 'Nickname'], ['mobile', 'Mobile'], ['position', 'Position']] as const).map(([k, label]) => (
            <label key={k} className="block">
              <span className="block text-[10px] uppercase tracking-[0.2em] font-semibold text-black/40 mb-1">{label}</span>
              <input value={(form[k] as string) || ''} onChange={e => set(k, e.target.value)} inputMode={k === 'mobile' ? 'tel' : undefined} className={inputClass} />
            </label>
          ))}
          <label className="block">
            <span className="block text-[10px] uppercase tracking-[0.2em] font-semibold text-black/40 mb-1">Company</span>
            <select value={form.company || ''} onChange={e => set('company', e.target.value)} className={inputClass}>
              <option value="">Choose…</option>
              {[...COMPANIES, ...(form.company && !COMPANIES.includes(form.company) ? [form.company] : [])].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-3 pt-2">
            <input type="checkbox" checked={form.active !== false} onChange={e => set('active', e.target.checked)} className="w-5 h-5 accent-[#0A0A0A]" />
            <span className="text-sm text-ink">Active: on the cashiers' staff list<span className="block text-xs text-black/45">Untick when someone leaves.</span></span>
          </label>
        </div>
        <button onClick={save} disabled={saving} className="w-full mt-6 py-3 rounded-full bg-ink text-white text-sm font-semibold uppercase tracking-[0.12em] disabled:opacity-60 flex items-center justify-center gap-2">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save
        </button>
      </div>
    </div>
  );
}
