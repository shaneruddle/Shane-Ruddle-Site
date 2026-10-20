import { useState } from 'react';
import { db } from '../firebase';
import { doc, setDoc, updateDoc, deleteField, FieldPath, serverTimestamp } from 'firebase/firestore';
import { ImageOff, X, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { FIXED_SLOTS, articleHeaderSlot, sectionHeadings, PhotoSlotsData, SlotPhoto, InlinePhoto } from '../lib/photoSlots';
import { FILE_ARTICLES } from '../lib/fileArticles';
import type { SitePhoto } from './PhotosAdmin';

const slotsRef = () => doc(db, 'settings', 'photo_slots');

export const toSlotPhoto = (p: SitePhoto): SlotPhoto => ({ photoId: p.id, url: p.url, alt: p.alt || '', width: p.width, height: p.height });

// Headings as written in the article file. FILE_ARTICLES bodies already include inline photos,
// which never add "## " lines, so their headings are the originals.
const ARTICLES = FILE_ARTICLES.map(a => ({ slug: a.slug, title: a.title, headings: sectionHeadings(a.body) }));

function PhotoPicker({ photos, onPick, onClose }: { photos: SitePhoto[]; onPick: (p: SitePhoto) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-y-auto p-6 md:p-8" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif text-2xl">Choose a photo</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5" aria-label="Close"><X className="w-5 h-5" /></button>
        </div>
        {photos.length === 0 ? (
          <p className="text-black/50">Your library is empty. Upload photos in the Library view first.</p>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {photos.map(p => (
              <li key={p.id}>
                <button onClick={() => onPick(p)} className="block w-full text-left group">
                  <img src={p.url} alt={p.alt} loading="lazy" className="w-full aspect-[4/3] object-cover rounded-xl ring-2 ring-transparent group-hover:ring-gold-deep" />
                  <span className="block mt-1 text-xs text-black/60 truncate">{p.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SlotCard({ label, aspect, current, defaultSrc, onChoose, onReset }: {
  label: string; aspect: string; current?: SlotPhoto; defaultSrc?: string; onChoose: () => void; onReset: () => void;
}) {
  const src = current?.url || defaultSrc;
  return (
    <li className="bg-white border border-black/10 rounded-2xl overflow-hidden flex flex-col">
      <div className="bg-black/5 flex items-center justify-center" style={{ aspectRatio: aspect, maxHeight: 260 }}>
        {src ? <img src={src} alt="" loading="lazy" className="w-full h-full object-cover" /> : <ImageOff className="w-8 h-8 text-black/20" />}
      </div>
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <p className="font-semibold text-ink">{label}</p>
          <p className="text-xs text-black/40">{current ? 'Your photo' : defaultSrc ? 'Current site photo (default)' : 'No photo yet'}</p>
        </div>
        <div className="flex gap-2 mt-auto">
          <button onClick={onChoose} className="px-3 py-2 bg-ink text-white rounded-full text-xs font-semibold hover:bg-gold-deep transition-colors">
            {current ? 'Change' : 'Choose photo'}
          </button>
          {current && (
            <button onClick={onReset} className="px-3 py-2 bg-black/5 text-black/60 rounded-full text-xs font-semibold hover:text-ink transition-colors">
              {defaultSrc ? 'Use default' : 'Remove'}
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

// Assign library photos to spots on the site. Choices are saved straight away and go live on the next publish.
export default function PhotoPlacements({ photos, data }: { photos: SitePhoto[]; data: PhotoSlotsData }) {
  const [picker, setPicker] = useState<null | ((p: SitePhoto) => void)>(null);
  const [newInline, setNewInline] = useState<Record<string, { heading: string; caption: string }>>({});

  const stamp = { updatedAt: serverTimestamp() };

  const assign = async (slotId: string, p: SitePhoto) => {
    try {
      await setDoc(slotsRef(), { slots: { [slotId]: toSlotPhoto(p) }, ...stamp }, { merge: true });
      toast.success('Photo placed');
    } catch (err) {
      console.error('Error placing photo:', err instanceof Error ? err.message : err);
      toast.error('Could not save');
    }
  };

  const reset = async (slotId: string) => {
    try {
      await updateDoc(slotsRef(), new FieldPath('slots', slotId), deleteField(), 'updatedAt', serverTimestamp());
      toast.success('Spot reset');
    } catch (err) {
      console.error('Error resetting spot:', err instanceof Error ? err.message : err);
      toast.error('Could not save');
    }
  };

  const saveInline = async (slug: string, list: InlinePhoto[]) => {
    try {
      await setDoc(slotsRef(), { inline: { [slug]: list }, ...stamp }, { merge: true });
    } catch (err) {
      console.error('Error saving in-article photos:', err instanceof Error ? err.message : err);
      toast.error('Could not save');
      throw err;
    }
  };

  const addInline = (slug: string, p: SitePhoto) => {
    const form = newInline[slug];
    if (!form?.heading) return;
    const list = [...(data.inline[slug] || []), { ...toSlotPhoto(p), id: `${Date.now()}`, heading: form.heading, ...(form.caption.trim() ? { caption: form.caption.trim() } : {}) }];
    saveInline(slug, list).then(() => {
      toast.success('Photo added to article');
      setNewInline(s => ({ ...s, [slug]: { heading: '', caption: '' } }));
    }).catch(() => {});
  };

  const removeInline = (slug: string, id: string) => {
    saveInline(slug, (data.inline[slug] || []).filter(x => x.id !== id)).then(() => toast.success('Photo removed from article')).catch(() => {});
  };

  const openPicker = (fn: (p: SitePhoto) => void) => setPicker(() => (p: SitePhoto) => { setPicker(null); fn(p); });

  const groups = Array.from(new Set(FIXED_SLOTS.map(s => s.group)));

  return (
    <div className="space-y-14">
      <p className="text-sm text-black/50 bg-gold/10 border border-gold/30 rounded-2xl px-5 py-4">
        Choices save straight away and show on the site after the next publish.
      </p>

      {groups.map(g => (
        <section key={g}>
          <h3 className="font-serif text-2xl mb-5">{g}</h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FIXED_SLOTS.filter(s => s.group === g).map(s => (
              <SlotCard
                key={s.id}
                label={s.label}
                aspect={s.aspect}
                current={data.slots[s.id]}
                defaultSrc={s.defaultSrc}
                onChoose={() => openPicker(p => assign(s.id, p))}
                onReset={() => reset(s.id)}
              />
            ))}
          </ul>
        </section>
      ))}

      <section>
        <h3 className="font-serif text-2xl mb-2">Articles</h3>
        <p className="text-sm text-black/50 mb-6">The header photo is also the image shown when the article is shared on Facebook, LINE or X.</p>
        <div className="space-y-8">
          {ARTICLES.map(a => {
            const inline = data.inline[a.slug] || [];
            const form = newInline[a.slug] || { heading: '', caption: '' };
            return (
              <div key={a.slug} className="border border-black/10 rounded-3xl p-5 md:p-6 bg-white/50">
                <a href={`/articles/${a.slug}`} target="_blank" rel="noreferrer" className="font-semibold text-ink hover:text-gold-deep">{a.title}</a>
                <div className="grid lg:grid-cols-3 gap-6 mt-5">
                  <ul className="lg:col-span-1">
                    <SlotCard
                      label="Header + share image"
                      aspect="16/9"
                      current={data.slots[articleHeaderSlot(a.slug)]}
                      onChoose={() => openPicker(p => assign(articleHeaderSlot(a.slug), p))}
                      onReset={() => reset(articleHeaderSlot(a.slug))}
                    />
                  </ul>
                  <div className="lg:col-span-2">
                    <p className="text-xs uppercase tracking-widest font-bold text-black/40 mb-3">Photos inside the article</p>
                    {inline.length > 0 && (
                      <ul className="space-y-3 mb-5">
                        {inline.map(x => (
                          <li key={x.id} className="flex items-center gap-4 bg-white border border-black/10 rounded-2xl p-3">
                            <img src={x.url} alt="" className="w-20 h-14 object-cover rounded-lg flex-shrink-0" />
                            <div className="min-w-0 flex-1 text-sm">
                              <p className="text-black/70 truncate">End of “{x.heading}”</p>
                              {x.caption && <p className="text-xs text-black/40 truncate">{x.caption}</p>}
                              {!a.headings.includes(x.heading) && (
                                <p className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> That heading no longer exists, so this photo won't show.</p>
                              )}
                            </div>
                            <button onClick={() => removeInline(a.slug, x.id)} className="p-2 rounded-full text-black/40 hover:bg-red-50 hover:text-red-600" aria-label="Remove photo">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    {a.headings.length === 0 ? (
                      <p className="text-sm text-black/40">This article has no section headings to place photos under.</p>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-3">
                        <select
                          value={form.heading}
                          onChange={e => setNewInline(s => ({ ...s, [a.slug]: { ...form, heading: e.target.value } }))}
                          className="flex-1 min-w-0 bg-white border border-black/10 rounded-full px-4 py-2 text-sm"
                          aria-label="Section"
                        >
                          <option value="">Add a photo at the end of section…</option>
                          {a.headings.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                        <input
                          value={form.caption}
                          onChange={e => setNewInline(s => ({ ...s, [a.slug]: { ...form, caption: e.target.value } }))}
                          placeholder="Caption (optional)"
                          className="flex-1 min-w-0 bg-white border border-black/10 rounded-full px-4 py-2 text-sm"
                        />
                        <button
                          disabled={!form.heading}
                          onClick={() => openPicker(p => addInline(a.slug, p))}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-ink text-white rounded-full text-xs font-semibold hover:bg-gold-deep transition-colors disabled:opacity-30"
                        >
                          <Plus className="w-4 h-4" /> Choose photo
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {picker && <PhotoPicker photos={photos} onPick={picker} onClose={() => setPicker(null)} />}
    </div>
  );
}
