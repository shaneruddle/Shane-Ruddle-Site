// Fast start for Shane's Reminders app (/inbox, the iPhone home-screen icon).
// This page skips the public website bundle (homepage, menus, animations) and the staff portal: it loads
// Firebase, checks the signed-in account and draws Reminders straight away from the on-device copy of the data.
// Anyone who isn't Shane, or isn't signed in, gets the full site, which shows the login as before.
import { StrictMode, type ComponentType } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Toaster } from 'sonner';
import './index.css';

const SHANE_UID = 'u7ElWXIkdjVTNTp76LcyXnnq3AM2';
const OWNER_KEY = 'sr_owner_dashboard';

const root: Root = createRoot(document.getElementById('root')!);
// Start downloading Reminders alongside Firebase instead of after it.
const inboxModule = import('./components/InboxApp');

let fullSite = false;
// Hand over to the full site at the given address (Circle, Photos, Enquiries, login, the OAuth consent page).
async function openFullSite(url?: string) {
  if (fullSite) return;
  fullSite = true;
  if (url) window.history.replaceState(null, '', url);
  const { default: App } = await import('./App');
  root.render(<StrictMode><App /></StrictMode>);
}

// Keep Reminders' files on the phone so the next open doesn't wait for the network.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/inbox-sw.js', { scope: '/inbox' }).catch(() => {}); });
}

if (window.location.pathname !== '/inbox') {
  openFullSite();
} else {
  (async () => {
    const [{ auth }, { onAuthStateChanged }] = await Promise.all([import('./firebase'), import('firebase/auth')]);
    let rendered = false;
    onAuthStateChanged(auth, async (user) => {
      const isShane = !!user && (user.uid === SHANE_UID || user.email?.toLowerCase() === 'shaneruddle@gmail.com');
      try {
        if (isShane) { localStorage.setItem(OWNER_KEY, '1'); localStorage.setItem('sr_has_session', '1'); }
        else if (!user) localStorage.removeItem(OWNER_KEY);
      } catch { /* ignore */ }
      if (!isShane) { openFullSite(); return; }
      if (rendered || fullSite) return;
      rendered = true;
      const InboxApp = (await inboxModule).default as ComponentType<Record<string, (() => void) | undefined>>;
      root.render(
        <StrictMode>
          <InboxApp
            onExit={() => { window.location.href = '/portal'; }}
            onCircle={() => openFullSite('/portal?tab=circle')}
            onPhotos={() => openFullSite('/portal?tab=photos')}
            onEnquiries={() => openFullSite('/portal?tab=enquiries')}
          />
          <Toaster position="top-center" richColors />
        </StrictMode>,
      );
    });
  })().catch(() => openFullSite());
}
