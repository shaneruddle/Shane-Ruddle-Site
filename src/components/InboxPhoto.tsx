import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';

// Photo reminders in Reminders (/inbox). The photo is resized on the phone (1600px, like the Photos library,
// which also strips the camera's GPS data), kept in the outbox until it uploads, then stored privately under
// inbox-photos/ (rules: Shane only; shown via its private download link, as getBlob needs bucket CORS, which isn't set). A tiny thumbnail lives on the item
// itself, so the list shows it instantly and offline.

export interface PhotoDraft { full: string; thumb: string; w: number; h: number }
export interface ItemPhoto { path: string; thumb: string; w?: number; h?: number }

const FULL_EDGE = 1600;
const THUMB_EDGE = 160;

const encode = (bitmap: ImageBitmap, edge: number, quality: number) => {
  const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return { url: canvas.toDataURL('image/jpeg', quality), w: canvas.width, h: canvas.height };
};

export async function preparePhoto(file: File): Promise<PhotoDraft> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    const full = encode(bitmap, FULL_EDGE, 0.8);
    return { full: full.url, thumb: encode(bitmap, THUMB_EDGE, 0.6).url, w: full.w, h: full.h };
  } finally {
    bitmap.close();
  }
}

export const photoPath = (id: string) => `inbox-photos/${id}.jpg`;
// Same path every time, so a retried upload just overwrites itself.
export const uploadPhoto = (id: string, dataUrl: string) =>
  uploadString(ref(storage, photoPath(id)), dataUrl, 'data_url', { contentType: 'image/jpeg' });
export const deletePhoto = (path: string) => deleteObject(ref(storage, path)).catch(() => {});

// The thumbnail straight away, then the full photo once it's downloaded. Tap for full screen.
export function PhotoView({ photo, className = '' }: { photo: ItemPhoto; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(false);
  useEffect(() => {
    let cancelled = false;
    getDownloadURL(ref(storage, photo.path))
      .then(u => { if (!cancelled) setUrl(u); })
      .catch(err => console.error('Photo failed to load:', err?.code || err));
    return () => { cancelled = true; };
  }, [photo.path]);
  const src = url || photo.thumb;
  return (
    <>
      <button type="button" onClick={() => setZoom(true)} className={`block w-full overflow-hidden bg-black/5 ${className}`}
        style={photo.w && photo.h ? { aspectRatio: `${photo.w} / ${photo.h}`, maxHeight: '46dvh' } : undefined}>
        <img src={src} alt="" className={`w-full h-full object-cover ${url ? '' : 'blur-sm'}`} />
      </button>
      {zoom && createPortal(
        <div className="fixed inset-0 z-[70] bg-black flex items-center justify-center" onClick={() => setZoom(false)}>
          <img src={src} alt="" className="max-w-full max-h-full object-contain" />
        </div>,
        document.body,
      )}
    </>
  );
}
