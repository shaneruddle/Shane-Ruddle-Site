import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { NOTIFY_DEFAULTS, type NotifySettings } from '../../server/inboxShared';

// Notification settings under Areas (server/inboxPush.ts sends them). iPhone only allows web push from the
// home-screen app, so in Safari this explains how to add it first. Settings live in inbox_settings/profile.notify.

type State = 'checking' | 'unsupported' | 'needs-home-screen' | 'blocked' | 'off' | 'on';

const post = async (path: string, body: unknown = {}) => {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(path, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
};

const keyBytes = (base64: string) => {
  const raw = atob((base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
};

const standalone = () => window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
const isIos = () => /iPhone|iPad|iPod/.test(navigator.userAgent);

const registration = () => navigator.serviceWorker.register('/inbox-sw.js', { scope: '/inbox' });

export function Notifications() {
  const [state, setState] = useState<State>('checking');
  const [busy, setBusy] = useState(false);
  const [settings, setSettings] = useState<NotifySettings>(NOTIFY_DEFAULTS);

  useEffect(() => onSnapshot(doc(db, 'inbox_settings', 'profile'), snap => setSettings({ ...NOTIFY_DEFAULTS, ...(snap.get('notify') || {}) })), []);

  useEffect(() => {
    (async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        setState(isIos() && !standalone() ? 'needs-home-screen' : 'unsupported');
        return;
      }
      if (Notification.permission === 'denied') { setState('blocked'); return; }
      const reg = await navigator.serviceWorker.getRegistration('/inbox');
      const sub = await reg?.pushManager.getSubscription();
      setState(sub && Notification.permission === 'granted' ? 'on' : 'off');
    })().catch(() => setState('off'));
  }, []);

  // A tapped notification may ask an open app to go to an item.
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const onMessage = (e: MessageEvent) => { if (e.data?.type === 'open' && typeof e.data.url === 'string') window.location.href = e.data.url; };
    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, []);

  const turnOn = async () => {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { setState(permission === 'denied' ? 'blocked' : 'off'); return; }
      const reg = await registration();
      await navigator.serviceWorker.ready;
      const { publicKey } = await fetch('/api/inbox/push/key').then(r => r.json());
      const sub = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) });
      await post('/api/inbox/push/subscribe', { subscription: sub.toJSON(), device: navigator.userAgent.slice(0, 120) });
      if (!settings.enabled) await save({ enabled: true });
      setState('on');
      toast.success('Notifications on');
    } catch (err) {
      console.error('Push setup failed:', err);
      toast.error("Couldn't turn notifications on");
    } finally {
      setBusy(false);
    }
  };

  const turnOff = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration('/inbox');
      const sub = await reg?.pushManager.getSubscription();
      if (sub) { await post('/api/inbox/push/unsubscribe', { endpoint: sub.endpoint }).catch(() => {}); await sub.unsubscribe(); }
      setState('off');
    } finally {
      setBusy(false);
    }
  };

  const test = async () => {
    setBusy(true);
    try {
      const r = await post('/api/inbox/push/test');
      if (r.sent) toast.success('Sent. It should arrive in a few seconds.');
      else toast.error('No phone is set up for notifications yet');
    } catch { toast.error("Couldn't send a test"); } finally { setBusy(false); }
  };

  const save = (patch: Partial<NotifySettings>) =>
    setDoc(doc(db, 'inbox_settings', 'profile'), { notify: { ...settings, ...patch } }, { merge: true }).catch(() => toast.error('Could not save'));

  const timeRow = (label: string, key: 'briefingTime' | 'quietStart' | 'quietEnd', disabled = false) => (
    <label className={`flex items-center justify-between px-4 py-3 border-b border-black/[0.07] last:border-0 ${disabled ? 'opacity-40' : ''}`}>
      <span className="text-[16px] text-ink">{label}</span>
      <input type="time" disabled={disabled} value={settings[key]} onChange={e => e.target.value && save({ [key]: e.target.value })} className="bg-transparent text-[16px] text-black/60 text-right" />
    </label>
  );

  return (
    <section className="mt-8">
      <h2 className="text-[13px] uppercase tracking-[0.15em] text-black/45 font-semibold mb-2 flex items-center gap-2"><Bell className="w-3.5 h-3.5" /> Notifications</h2>
      <div className="rounded-2xl bg-white border border-black/10 overflow-hidden">
        <div className="px-4 py-3.5 border-b border-black/[0.07] flex items-center gap-3">
          <span className="flex-1 text-[15px] text-black/60">
            {state === 'checking' ? 'Checking…'
              : state === 'on' ? 'On for this phone. Reminders arrive at their time.'
              : state === 'needs-home-screen' ? 'On iPhone, open the Inbox from its home-screen icon to turn these on (Share, Add to Home Screen).'
              : state === 'blocked' ? 'Blocked. Turn them on in iPhone Settings, Notifications, Inbox.'
              : state === 'unsupported' ? "This browser can't receive notifications."
              : 'Off for this phone.'}
          </span>
          {state === 'off' && <button disabled={busy} onClick={turnOn} className="shrink-0 px-3.5 py-2 rounded-xl bg-ink text-white text-[14px] font-semibold disabled:opacity-50">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Turn on'}</button>}
          {state === 'on' && <button disabled={busy} onClick={test} className="shrink-0 px-3 py-2 rounded-xl border border-black/15 text-[14px] text-ink disabled:opacity-50">Test</button>}
        </div>
        <label className="flex items-center justify-between px-4 py-3 border-b border-black/[0.07]">
          <span className="text-[16px] text-ink">Morning briefing</span>
          <input type="checkbox" checked={settings.briefing} onChange={e => save({ briefing: e.target.checked })} className="w-5 h-5 accent-black" />
        </label>
        {timeRow('Briefing at', 'briefingTime', !settings.briefing)}
        {timeRow('Quiet from', 'quietStart')}
        {timeRow('Quiet until', 'quietEnd')}
      </div>
      <p className="mt-2 px-1 text-[13px] text-black/45">In quiet hours only reminders you gave an exact time come through. Everything else waits until they end.</p>
      {state === 'on' && <button disabled={busy} onClick={turnOff} className="mt-2 px-1 text-[13px] text-black/45 flex items-center gap-1"><BellOff className="w-3.5 h-3.5" /> Turn off for this phone</button>}
    </section>
  );
}
