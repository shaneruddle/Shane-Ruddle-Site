import { useState } from 'react';
import { auth } from '../firebase';
import { Copy, Loader2, Mic } from 'lucide-react';
import { toast } from 'sonner';

// Settings section for "Hey Siri, Shane reminder" (server/inboxSiri.ts). Copies the private link the Apple
// Shortcut posts to, and can replace it if it ever leaks (the old link then stops working).

const getLink = async (reset = false) => {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch('/api/inbox/siri/key', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ reset }) });
  if (!res.ok) throw new Error(String(res.status));
  return (await res.json()).url as string;
};

export function SiriSettings() {
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState('');

  const copy = async (reset = false) => {
    if (reset && !window.confirm('Make a new Siri link? The old one stops working, so paste the new one into the Shortcut.')) return;
    setBusy(true);
    try {
      const url = await getLink(reset);
      setLink(url);
      await navigator.clipboard.writeText(url).then(() => toast.success('Siri link copied'), () => toast('Press and hold the link to copy it'));
    } catch {
      toast.error("Couldn't get the Siri link");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-8">
      <h2 className="text-[13px] uppercase tracking-[0.15em] text-black/45 font-semibold mb-2 flex items-center gap-2"><Mic className="w-3.5 h-3.5" /> Siri</h2>
      <div className="rounded-2xl bg-white border border-black/10 overflow-hidden">
        <div className="px-4 py-3.5 flex items-center gap-3">
          <span className="flex-1 text-[15px] text-black/60">Say "Hey Siri, Shane reminder" on your iPhone or Watch to add one.</span>
          <button disabled={busy} onClick={() => copy()} className="shrink-0 px-3.5 py-2 rounded-xl bg-ink text-white text-[14px] font-semibold disabled:opacity-50 flex items-center gap-1.5">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Copy className="w-4 h-4" /> Copy link</>}
          </button>
        </div>
        {link && <p className="px-4 pb-3.5 text-[12px] font-mono text-black/50 break-all select-all">{link}</p>}
      </div>
      <p className="mt-2 px-1 text-[13px] text-black/45">Paste this link into the Shortcut. Keep it private: anyone with it can add reminders.</p>
      <button disabled={busy} onClick={() => copy(true)} className="mt-1 px-1 text-[13px] text-black/45">Make a new link</button>
    </section>
  );
}
