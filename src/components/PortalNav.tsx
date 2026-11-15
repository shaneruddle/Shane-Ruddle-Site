import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { doc, getDoc } from 'firebase/firestore';
import { Ticket, User, MessageCircle, Images, Activity, Mail, HeartHandshake, ListChecks, X, ArrowUpRight, LogOut } from 'lucide-react';
import { auth, db } from '../firebase';
import { useEnquiries } from './EnquiriesAdmin';
import PortalHeader from './PortalHeader';

// The staff dashboard's section menu, shared by every portal page (Offers, Profile, Comments, Photos, Activity,
// Enquiries, Circle, Reminders) so the phone slide-in and the desktop sidebar are the same everywhere.
// No animation library here: Reminders loads this on its fast page.

export type NavKey = 'offers' | 'profile' | 'comments' | 'photos' | 'activity' | 'enquiries' | 'circle' | 'inbox';
export type NavItem = [NavKey, string, typeof Ticket];

export function navItems({ canModerate, isShane }: { canModerate: boolean; isShane: boolean }): NavItem[] {
  return [
    ['offers', 'Offers', Ticket],
    ['profile', 'Profile', User],
    ...(canModerate ? [['comments', 'Comments', MessageCircle] as NavItem] : []),
    ...(isShane ? [['photos', 'Photos', Images] as NavItem] : []),
    ...(canModerate ? [['activity', 'Activity', Activity] as NavItem] : []),
    // Shane only (matches isShane() in firestore.rules), never other admins.
    ...(isShane ? [['enquiries', 'Enquiries', Mail] as NavItem] : []),
    ...(isShane ? [['circle', 'Circle', HeartHandshake] as NavItem] : []),
    ...(isShane ? [['inbox', 'Reminders', ListChecks] as NavItem] : []),
  ];
}

// Shane's menu (Circle and Reminders are his alone, so they always get the full list).
export const SHANE_NAV = navItems({ canModerate: true, isShane: true });

// Site enquiries not yet opened.
export function useUnreadEnquiries() {
  const { all } = useEnquiries();
  return all.filter(e => !e.readAt && !e.replies?.length && e.status !== 'archived' && e.status !== 'replied').length;
}

function UnreadCount() {
  const unread = useUnreadEnquiries();
  return unread > 0 ? <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-gold-deep text-white text-[11px] font-bold leading-5 text-center">{unread}</span> : null;
}

// Name and company for the menu header, read once when the page didn't pass them (Reminders' fast page).
function useMenuProfile(name?: string, company?: string) {
  const [p, setP] = useState<{ name?: string; company?: string }>({ name, company });
  useEffect(() => {
    if (name) { setP({ name, company }); return; }
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    getDoc(doc(db, 'users', uid)).then(s => { const d = s.data(); if (d) setP({ name: d.name, company: d.company }); }).catch(() => {});
  }, [name, company]);
  return p;
}

// Phone slide-in menu.
export function PortalDrawer({ open, onClose, items, active, onSelect, onWebsite, name, company, sub }: {
  open: boolean; onClose: () => void; items: NavItem[]; active: NavKey; onSelect: (key: NavKey) => void;
  onWebsite: () => void; name?: string; company?: string;
  /** Extra rows shown under the current section (Reminders' Search and Settings). */
  sub?: [string, typeof Ticket, () => void][];
}) {
  const who = useMenuProfile(name, company);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [open, onClose]);
  const showEnquiryCount = items.some(([k]) => k === 'enquiries');
  return createPortal(
    <div className={`md:hidden fixed inset-0 z-[70] font-sans select-none ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div onClick={onClose} className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`} />
      <aside aria-label="Staff menu" className={`absolute inset-y-0 left-0 w-[80%] max-w-[300px] bg-ink text-white flex flex-col shadow-2xl transition-transform duration-[220ms] ease-out ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="h-14 px-4 flex items-center justify-between border-b border-white/10">
          <div className="min-w-0">
            <div className="text-[15px] font-semibold truncate">{who.name || 'Staff'}</div>
            {who.company && <div className="text-[12px] text-white/50 truncate">{who.company}</div>}
          </div>
          <button type="button" onClick={onClose} className="w-9 h-9 -mr-2 inline-flex items-center justify-center rounded-full text-white/70 hover:bg-white/5" aria-label="Close menu">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {items.map(([key, label, Icon]) => (
            <div key={key}>
              <button type="button" onClick={() => { onClose(); if (key !== active) onSelect(key); }}
                aria-current={active === key ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-4 h-12 rounded-[12px] text-[15px] transition-colors ${active === key ? 'bg-white/10 text-white font-medium' : 'text-white/65 hover:bg-white/5'}`}>
                <Icon className={`w-[18px] h-[18px] ${active === key ? 'text-gold' : ''}`} /> {label}
                {key === 'enquiries' && showEnquiryCount && open && <UnreadCount />}
              </button>
              {active === key && sub?.map(([l, SubIcon, fn]) => (
                <button key={l} type="button" onClick={() => { onClose(); fn(); }}
                  className="w-full flex items-center gap-3 pl-11 pr-4 h-10 rounded-[12px] text-[14px] text-white/55 hover:bg-white/5">
                  <SubIcon className="w-4 h-4" /> {l}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10 space-y-1" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
          <button type="button" onClick={() => { onClose(); onWebsite(); }} className="w-full flex items-center gap-3 px-4 h-11 rounded-[12px] text-[14px] text-white/65 hover:bg-white/5">
            <ArrowUpRight className="w-4 h-4" /> Back to website
          </button>
          <button type="button" onClick={() => { onClose(); auth.signOut(); }} className="w-full flex items-center gap-3 px-4 h-11 rounded-[12px] text-[14px] text-white/65 hover:bg-white/5">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>
    </div>,
    document.body,
  );
}

// Desktop sidebar (same sections, same order as the phone menu).
export function PortalSidebar({ items, active, onSelect, sub }: {
  items: NavItem[]; active: NavKey; onSelect: (key: NavKey) => void; sub?: [string, typeof Ticket, () => void][];
}) {
  const showEnquiryCount = items.some(([k]) => k === 'enquiries');
  return (
    <nav className="flex flex-col gap-1 font-sans">
      {items.map(([key, label, Icon]) => (
        <div key={key} className="flex flex-col gap-1">
          <button type="button" onClick={() => { if (key !== active) onSelect(key); }}
            aria-current={active === key ? 'page' : undefined}
            className={`shrink-0 flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors rounded-full ${active === key ? 'bg-ink text-white' : 'text-black/50 hover:text-ink hover:bg-black/5'}`}>
            <Icon className="w-4 h-4" /> {label}
            {key === 'enquiries' && showEnquiryCount && <UnreadCount />}
          </button>
          {active === key && sub?.map(([l, SubIcon, fn]) => (
            <button key={l} type="button" onClick={fn}
              className="flex items-center gap-3 pl-11 pr-4 py-2 text-[13px] text-black/50 hover:text-ink rounded-full hover:bg-black/5">
              <SubIcon className="w-3.5 h-3.5" /> {l}
            </button>
          ))}
        </div>
      ))}
    </nav>
  );
}

// Desktop frame for the full-screen apps (Reminders, Circle): the portal's top bar and sidebar around the page.
// On phones it renders the page alone; the page's own burger opens PortalDrawer.
export function PortalFrame({ items, active, onSelect, onWebsite, sub, children }: {
  items: NavItem[]; active: NavKey; onSelect: (key: NavKey) => void; onWebsite: () => void;
  sub?: [string, typeof Ticket, () => void][]; children: ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-cream">
      <div className="hidden md:block sticky top-0 z-30">
        <PortalHeader active="portal" onNavigate={() => onSelect('offers')} onBack={onWebsite} />
      </div>
      {/* Lines up with the dashboard's sidebar (200px column inside the centred 80rem page). */}
      <aside className="hidden md:block fixed top-14 bottom-0 left-[max(0px,calc((100vw-80rem)/2))] w-[248px] px-6 py-12 overflow-y-auto bg-cream z-20">
        <PortalSidebar items={items} active={active} onSelect={onSelect} sub={sub} />
      </aside>
      <div className="md:pl-[calc(max(0px,calc((100vw-80rem)/2))+248px)]">{children}</div>
    </div>
  );
}
