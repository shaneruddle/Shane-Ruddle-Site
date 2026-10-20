import { useEffect, useRef, useState } from 'react';
import { db, storage } from '../firebase';
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { ImagePlus, Trash2, Loader2, Images, Copy } from 'lucide-react';
import { toast } from 'sonner';
import PhotoPlacements from './PhotoPlacements';
import { PhotoSlotsData } from '../lib/photoSlots';

export interface SitePhoto {
  id: string;
  name: string;
  alt: string;
  url: string;
  path: string;
  width: number;
  height: number;
  bytes: number;
  createdAt?: Timestamp;
}

// Longest edge after resizing. Big enough for full-width headers on retina screens.
const MAX_EDGE = 2400;

const slugify = (s: string) =>
  s.toLowerCase().replace(/\.[^.]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'photo';

const formatDate = (t?: Timestamp) =>
  t ? t.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Bangkok' }) : '';

// Resize in the browser and re-encode as WebP (JPEG where the browser can't encode WebP).
async function resizeImage(file: File): Promise<{ blob: Blob; width: number; height: number; ext: string }> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const toBlob = (type: string, q: number) => new Promise<Blob | null>(res => canvas.toBlob(res, type, q));
  let blob = await toBlob('image/webp', 0.85);
  let ext = 'webp';
  if (!blob || blob.type !== 'image/webp') {
    blob = await toBlob('image/jpeg', 0.85);
    ext = 'jpg';
  }
  if (!blob) throw new Error('Could not process image');
  return { blob, width, height, ext };
}

// Admin photo library: upload, describe and delete photos, then choose where each one appears on the site.
export default function PhotosAdmin() {
  const [photos, setPhotos] = useState<SitePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<'library' | 'placements'>('library');
  const [slotsData, setSlotsData] = useState<PhotoSlotsData>({ slots: {}, inline: {} });

  useEffect(() => {
    return onSnapshot(doc(db, 'settings', 'photo_slots'), (snap) => {
      const d = snap.data() || {};
      setSlotsData({ slots: d.slots || {}, inline: d.inline || {} });
    }, (err) => console.error('Error loading photo spots:', err.message));
  }, []);

  // Spots keep a copy of each photo's details, so description edits and deletes are copied across.
  const usageCount = (photoId: string) =>
    Object.values(slotsData.slots).filter(s => s.photoId === photoId).length +
    Object.values(slotsData.inline).reduce((n, l) => n + l.filter(x => x.photoId === photoId).length, 0);

  const syncSlots = async (photoId: string, change: { alt: string } | 'remove') => {
    if (!usageCount(photoId)) return;
    const slots = Object.fromEntries(
      Object.entries(slotsData.slots)
        .filter(([, s]) => !(change === 'remove' && s.photoId === photoId))
        .map(([k, s]) => [k, s.photoId === photoId && change !== 'remove' ? { ...s, alt: change.alt } : s])
    );
    const inline = Object.fromEntries(
      Object.entries(slotsData.inline).map(([slug, l]) => [slug, l
        .filter(x => !(change === 'remove' && x.photoId === photoId))
        .map(x => (x.photoId === photoId && change !== 'remove' ? { ...x, alt: change.alt } : x))])
    );
    await setDoc(doc(db, 'settings', 'photo_slots'), { slots, inline, updatedAt: serverTimestamp() });
  };

  useEffect(() => {
    return onSnapshot(collection(db, 'site_photos'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as SitePhoto));
      list.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setPhotos(list);
      setLoading(false);
    }, (err) => {
      console.error('Error loading photos:', err.message);
      toast.error('Could not load photos');
      setLoading(false);
    });
  }, []);

  const upload = async (files: FileList | File[]) => {
    const images = Array.from(files).filter(f => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name));
    if (!images.length) {
      toast.error('Choose image files (JPG, PNG, WebP or HEIC)');
      return;
    }
    setUploading({ done: 0, total: images.length });
    let ok = 0;
    for (const file of images) {
      try {
        const { blob, width, height, ext } = await resizeImage(file);
        const path = `site-photos/${Date.now()}-${slugify(file.name)}.${ext}`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, blob, { contentType: blob.type, cacheControl: 'public, max-age=31536000' });
        const url = await getDownloadURL(storageRef);
        await addDoc(collection(db, 'site_photos'), {
          name: file.name.replace(/\.[^.]+$/, ''),
          alt: '',
          url,
          path,
          width,
          height,
          bytes: blob.size,
          createdAt: serverTimestamp(),
        });
        ok++;
      } catch (err) {
        console.error('Upload failed:', file.name, err instanceof Error ? err.message : err);
        toast.error(`Could not upload ${file.name}`);
      }
      setUploading(u => (u ? { ...u, done: u.done + 1 } : u));
    }
    setUploading(null);
    if (ok) toast.success(`${ok} photo${ok === 1 ? '' : 's'} uploaded`);
  };

  const saveField = async (p: SitePhoto, field: 'name' | 'alt', value: string) => {
    if ((p[field] || '') === value) return;
    try {
      await updateDoc(doc(db, 'site_photos', p.id), { [field]: value });
      if (field === 'alt') await syncSlots(p.id, { alt: value });
      toast.success(field === 'alt' ? 'Description saved' : 'Name saved');
    } catch (err) {
      console.error('Error saving photo:', err instanceof Error ? err.message : err);
      toast.error('Could not save');
    }
  };

  const remove = async (p: SitePhoto) => {
    const used = usageCount(p.id);
    const where = used ? ` It's used in ${used} spot${used === 1 ? '' : 's'} on the site, which will go back to their default photo.` : '';
    if (!window.confirm(`Delete "${p.name}"?${where} This can't be undone.`)) return;
    setBusyId(p.id);
    try {
      await deleteObject(ref(storage, p.path)).catch(err => {
        if (err?.code !== 'storage/object-not-found') throw err;
      });
      await syncSlots(p.id, 'remove');
      await deleteDoc(doc(db, 'site_photos', p.id));
      toast.success('Photo deleted');
    } catch (err) {
      console.error('Error deleting photo:', err instanceof Error ? err.message : err);
      toast.error('Could not delete photo');
    } finally {
      setBusyId(null);
    }
  };

  const copyUrl = async (p: SitePhoto) => {
    try {
      await navigator.clipboard.writeText(p.url);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const tabs = (
    <div className="flex items-center gap-2 mb-8">
      {([['library', `Library (${photos.length})`], ['placements', 'Where photos go']] as const).map(([key, label]) => (
        <button
          key={key}
          onClick={() => setView(key)}
          className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-widest transition-colors ${view === key ? 'bg-ink text-white' : 'bg-black/5 text-black/50 hover:text-ink'}`}
        >
          {label}
        </button>
      ))}
    </div>
  );

  if (view === 'placements') {
    return (
      <div>
        {tabs}
        <PhotoPlacements photos={photos} data={slotsData} />
      </div>
    );
  }

  return (
    <div>
      {tabs}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); if (!uploading) upload(e.dataTransfer.files); }}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`mb-10 p-10 md:p-12 text-center rounded-3xl border-2 border-dashed cursor-pointer transition-colors ${dragOver ? 'border-gold-deep bg-gold/5' : 'border-black/10 hover:border-gold-deep/50'}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files) upload(e.target.files); e.target.value = ''; }}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-gold-deep" />
            <p className="text-sm text-black/60">Uploading {Math.min(uploading.done + 1, uploading.total)} of {uploading.total}…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <ImagePlus className="w-10 h-10 text-gold-deep" />
            <p className="font-semibold text-ink">Drop photos here, or click to choose</p>
            <p className="text-xs text-black/40">Resized to web size automatically. JPG, PNG, WebP or HEIC.</p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-gold-deep" />
        </div>
      ) : photos.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border-2 border-dashed border-black/5">
          <Images className="w-12 h-12 text-black/10 mx-auto mb-4" />
          <p className="text-sm text-black/40 uppercase tracking-widest font-bold">No photos yet.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-black/40 uppercase tracking-widest font-bold mb-4">{photos.length} photo{photos.length === 1 ? '' : 's'}</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos.map(p => (
              <li key={p.id} className="bg-white border border-black/10 rounded-2xl overflow-hidden flex flex-col">
                <a href={p.url} target="_blank" rel="noreferrer" className="block bg-black/5">
                  <img src={p.url} alt={p.alt} loading="lazy" className="w-full aspect-[4/3] object-cover" />
                </a>
                <div className="p-4 flex flex-col gap-3 flex-1">
                  <input
                    defaultValue={p.name}
                    onBlur={(e) => saveField(p, 'name', e.target.value.trim())}
                    className="font-semibold text-ink bg-transparent border-b border-transparent hover:border-black/10 focus:border-gold-deep outline-none py-1"
                    aria-label="Photo name"
                  />
                  <textarea
                    defaultValue={p.alt}
                    onBlur={(e) => saveField(p, 'alt', e.target.value.trim())}
                    placeholder="Describe the photo (shown to Google and screen readers)"
                    rows={2}
                    className="text-sm text-black/70 bg-black/[0.03] rounded-lg p-2 outline-none focus:ring-1 focus:ring-gold-deep resize-none"
                    aria-label="Photo description"
                  />
                  <div className="flex items-center justify-between text-xs text-black/40 mt-auto">
                    <span>{p.width}×{p.height} · {Math.round(p.bytes / 1024)} KB · {formatDate(p.createdAt)}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyUrl(p)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-black/5 text-black/60 rounded-full text-xs font-semibold hover:text-ink transition-colors"
                    >
                      <Copy className="w-4 h-4" /> Copy link
                    </button>
                    <button
                      onClick={() => remove(p)}
                      disabled={busyId === p.id}
                      className="flex items-center gap-1.5 px-3 py-2 bg-black/5 text-black/60 rounded-full text-xs font-semibold hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
