import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { collection, doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Loader2, ShieldCheck, Eye, PencilLine, Plug } from 'lucide-react';
import { toast } from 'sonner';

// Assistant access to the Inbox (server/inboxMcp.ts).
// ConnectScreen is /inbox/connect: the OAuth consent page an assistant sends Shane to. He is already signed in,
// picks read-only or read-and-change, and is sent back to the assistant with a one-time code.
// Connections lists every assistant that has access, so he can switch any of them off.

export function ConnectScreen() {
  const params = new URLSearchParams(window.location.search);
  const [client, setClient] = useState<{ name: string; redirectHost: string } | null>(null);
  const [error, setError] = useState('');
  const [access, setAccess] = useState<'write' | 'read'>(params.get('scope') && !params.get('scope')!.includes('inbox:write') ? 'read' : 'write');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams({ client_id: params.get('client_id') || '', redirect_uri: params.get('redirect_uri') || '' });
    fetch(`/api/inbox/oauth/client?${q}`).then(r => (r.ok ? r.json() : Promise.reject())).then(setClient)
      .catch(() => setError("This connection link isn't valid any more. Start again from the assistant's app."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const answer = async (allow: boolean) => {
    setBusy(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/inbox/oauth/approve', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...Object.fromEntries(params), allow, access }),
      });
      const data = await res.json();
      if (!res.ok || !data.redirect) throw new Error(data.error || 'failed');
      window.location.href = data.redirect;
    } catch {
      setBusy(false);
      toast.error("Couldn't connect. Try again from the assistant's app.");
    }
  };

  return (
    <div className="min-h-[100dvh] bg-cream px-6 pt-[max(env(safe-area-inset-top),2.5rem)] pb-10 max-w-md mx-auto">
      <p className="text-[12px] uppercase tracking-[0.2em] text-black/40 font-semibold">Reminders & Notes</p>
      {error ? <p className="mt-8 text-[16px] text-black/70">{error}</p> : !client ? <Loader2 className="mt-10 w-7 h-7 animate-spin text-gold-deep" /> : (
        <>
          <h1 className="mt-3 text-[28px] font-bold leading-tight tracking-tight">Let {client.name} use your Reminders & Notes?</h1>
          <p className="mt-2 text-[15px] text-black/55">It will sign in as you through {client.redirectHost}. You can switch it off any time under Areas, Connected assistants.</p>
          <div className="mt-6 space-y-3">
            {([
              ['write', PencilLine, 'Read and change', 'Find, add, edit and complete your tasks and notes. Every change is logged with its name.'],
              ['read', Eye, 'Read only', 'Find and read your tasks and notes. It can’t change anything.'],
            ] as const).map(([key, Icon, label, text]) => (
              <button key={key} onClick={() => setAccess(key)} className={`w-full text-left p-4 rounded-2xl border flex gap-3 ${access === key ? 'bg-white border-gold-deep ring-1 ring-gold-deep' : 'bg-white/60 border-black/10'}`}>
                <Icon className="w-5 h-5 mt-0.5 text-black/50 shrink-0" />
                <span><span className="block text-[16px] font-semibold text-ink">{label}</span><span className="block text-[14px] text-black/55 mt-0.5">{text}</span></span>
              </button>
            ))}
          </div>
          <p className="mt-5 flex gap-2 text-[13px] text-black/45"><ShieldCheck className="w-4 h-4 shrink-0" /> It can only use your Reminders & Notes. It can't send messages, spend money or contact anyone.</p>
          <button disabled={busy} onClick={() => answer(true)} className="mt-6 w-full py-3.5 rounded-2xl bg-ink text-white text-[16px] font-semibold disabled:opacity-50">{busy ? 'Connecting…' : 'Allow'}</button>
          <button disabled={busy} onClick={() => answer(false)} className="mt-2 w-full py-3 rounded-2xl text-[15px] text-black/55">Cancel</button>
        </>
      )}
    </div>
  );
}

interface Connection { id: string; name: string; scope?: string[]; revoked?: boolean; createdAt?: { toMillis(): number }; lastUsedAt?: { toMillis(): number } | null }

const ago = (ms?: number) => {
  if (!ms) return 'never';
  const mins = Math.round((Date.now() - ms) / 60000);
  return mins < 60 ? `${Math.max(1, mins)} min ago` : mins < 48 * 60 ? `${Math.round(mins / 60)} h ago` : new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Bangkok' });
};

export function Connections() {
  const [list, setList] = useState<Connection[]>([]);
  useEffect(() => onSnapshot(collection(db, 'inbox_connections'), snap => {
    setList(snap.docs.map(d => ({ id: d.id, ...d.data() } as Connection)).filter(c => !c.revoked)
      .sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)));
  }, err => console.error('Connections load failed:', err.code)), []);

  const revoke = async (c: Connection) => {
    if (!window.confirm(`Switch off ${c.name}? It will need to connect again to use your Reminders & Notes.`)) return;
    await updateDoc(doc(db, 'inbox_connections', c.id), { revoked: true, revokedAt: serverTimestamp() })
      .then(() => toast.success(`${c.name} switched off`)).catch(() => toast.error('Could not switch it off'));
  };

  return (
    <section className="mt-8">
      <h2 className="text-[13px] uppercase tracking-[0.15em] text-black/45 font-semibold mb-2 flex items-center gap-2"><Plug className="w-3.5 h-3.5" /> Connected assistants</h2>
      {!list.length ? (
        <p className="text-[14px] text-black/50 rounded-2xl bg-white border border-black/10 p-4">None yet. In Claude, add a custom connector with the address <span className="font-mono text-ink">https://shaneruddle.com/mcp</span>.</p>
      ) : (
        <ul className="rounded-2xl bg-white border border-black/10 overflow-hidden">
          {list.map(c => (
            <li key={c.id} className="flex items-center gap-3 px-4 py-3.5 border-b border-black/[0.07] last:border-0">
              <span className="flex-1 min-w-0">
                <span className="block text-[16px] text-ink truncate">{c.name}</span>
                <span className="block text-[13px] text-black/45">{c.scope?.includes('inbox:write') ? 'Read and change' : 'Read only'} · used {ago(c.lastUsedAt?.toMillis())}</span>
              </span>
              <button onClick={() => revoke(c)} className="text-[14px] text-danger font-medium px-2 py-1">Switch off</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
