import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { doc, getDoc } from 'firebase/firestore';
import { Ticket, User, MessageCircle, Images, Activity, Mail, HeartHandshake, ListChecks, X, ArrowUpRight, LogOut, Search, Settings, LayoutDashboard, Globe, BookOpen, MessageCircleQuestion, Building2 } from 'lucide-react';
import { auth, db } from '../firebase';
import { useEnquiries, statusOf } from './EnquiriesAdmin';
import PortalHeader from './PortalHeader';

// The staff dashboard's menu, shared by every portal page (Reminders, Circle, Enquiries, Photos, Offers, Profile,
// Comments, Activity) so the phone slide-in and the desktop sidebar are the same everywhere. Styled like the
// Reminders menu. No animation library here: Reminders loads this on its fast page.

export type NavKey = 'offers' | 'profile' | 'comments' | 'photos' | 'activity' | 'enquiries' | 'circle' | 'inbox' | 'search' | 'settings';
type Row = { key?: NavKey; label: string; Icon: typeof Ticket; href?: string };
export type NavGroup = { title: string; rows: Row[] };

export function navItems({ canModerate, isShane }: { canModerate: boolean; isShane: boolean }): NavGroup[] {
  const r = (key: NavKey, label: string, Icon: typeof Ticket): Row => ({ key, label, Icon });
  const groups: NavGroup[] = [];
  // Shane's own apps (matches isShane() in firestore.rules), never other admins.
  if (isShane) groups.push({ title: '', rows: [r('inbox', 'Reminders', ListChecks), r('circle', 'Circle', HeartHandshake), r('enquiries', 'Enquiries', Mail), r('photos', 'Photos', Images), r('search', 'Search & ask', Search)] });
  groups.push({ title: 'Dashboard', rows: [
    r('offers', 'Dashboard', LayoutDashboard),
    ...(canModerate ? [r('comments', 'Comments', MessageCircle), r('activity', 'Activity', Activity)] : []),
    r('profile', 'Profile', User),
    ...(isShane ? [r('settings', 'Reminder settings', Settings)] : []),
  ] });
  groups.push({ title: 'Website', rows: [
    // ?home stops the homepage sending Shane straight back to Reminders.
    { label: 'Homepage', Icon: Globe, href: '/?home' },
    { label: 'Articles', Icon: BookOpen, href: '/articles' },
    { label: 'Questions', Icon: MessageCircleQuestion, href: '/questions' },
    { label: 'Businesses', Icon: Building2, href: '/businesses' },
  ] });
  return groups;
}

// Shane's menu (Circle and Reminders are his alone, so they always get the full list).
export const SHANE_NAV = navItems({ canModerate: true, isShane: true });

const SITES: [string, string][] = [
  ['Hemingways Jomtien', 'https://www.hemingwaysjomtien.com'], ['Hemingways Pattaya', 'https://www.hemingwayspattaya.com'],
  ['Hemingways Lakeside', 'https://www.hemingwayslakeside.com'], ['Cajun Life Cafe', 'https://www.cajunlifecafe.com'],
  ['Pattaya Rent a Car', 'https://www.pattayarentacar.com'], ['Alan Bolton Property', 'https://www.pattaya-property.net'],
  ['East Coast Real Estate', 'https://www.thaiproperty.com'],
];

// Site enquiries (or their email replies) not yet opened.
export function useUnreadEnquiries() {
  const { all } = useEnquiries();
  return all.filter(e => !e.readAt && statusOf(e) === 'open').length;
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

// The groups and rows, used by both the phone slide-in and the desktop sidebar.
function MenuList({ items, active, onSelect, onPicked, showCount, sites }: {
  items: NavGroup[]; active: NavKey; onSelect: (key: NavKey) => void; onPicked?: () => void; showCount: boolean; sites: boolean;
}) {
  const hasEnquiries = items.some(g => g.rows.some(r => r.key === 'enquiries'));
  return (
    <>
      {items.map(({ title, rows }) => (
        <div key={title || 'apps'} className={title ? 'mt-4' : 'mt-1'}>
          {title && <div className="px-3 pb-1 text-[11px] uppercase tracking-[0.16em] text-black/40 font-semibold">{title}</div>}
          {rows.map(({ key, label, Icon, href }) => {
            const current = !!key && key === active;
            const cls = `w-full flex items-center gap-3 px-3 h-11 rounded-xl text-[16px] md:text-[15px] text-left ${current ? 'bg-white shadow-sm font-semibold' : 'text-ink/80 hover:bg-black/[0.04] active:bg-black/[0.05]'}`;
            const inner = <><Icon className={`w-[18px] h-[18px] ${current ? 'text-gold-deep' : 'text-black/45'}`} /> {label}
              {key === 'enquiries' && hasEnquiries && showCount && <UnreadCount />}</>;
            return href
              ? <a key={label} href={href} onClick={onPicked} className={cls}>{inner}</a>
              : <button key={label} type="button" aria-current={current ? 'page' : undefined} className={cls}
                  onClick={() => { onPicked?.(); if (key && !current) onSelect(key); }}>{inner}</button>;
          })}
        </div>
      ))}
      {sites && (
        <div className="mt-4">
          <div className="px-3 pb-1 text-[11px] uppercase tracking-[0.16em] text-black/40 font-semibold">My businesses</div>
          {SITES.map(([label, href]) => (
            <a key={href} href={href} target="_blank" rel="noopener noreferrer" onClick={onPicked}
              className="flex items-center justify-between px-3 h-10 rounded-xl text-[15px] md:text-[14px] text-ink/75 hover:bg-black/[0.04] active:bg-black/[0.05]">
              {label} <ArrowUpRight className="w-4 h-4 text-black/30" />
            </a>
          ))}
        </div>
      )}
    </>
  );
}

const isShaneMenu = (items: NavGroup[]) => items.some(g => g.rows.some(r => r.key === 'inbox'));

// Phone slide-in menu.
export function PortalDrawer({ open, onClose, items, active, onSelect, name, company }: {
  open: boolean; onClose: () => void; items: NavGroup[]; active: NavKey; onSelect: (key: NavKey) => void;
  name?: string; company?: string; onWebsite?: () => void;
}) {
  const who = useMenuProfile(name, company);
  const shane = isShaneMenu(items);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [open, onClose]);
  return createPortal(
    <div className={`md:hidden fixed inset-0 z-[70] font-sans select-none ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div onClick={onClose} className={`absolute inset-0 bg-black/35 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`} />
      <aside aria-label="Menu" className={`absolute inset-y-0 left-0 w-[82%] max-w-[320px] bg-cream text-ink shadow-2xl flex flex-col transition-transform duration-[250ms] ease-out ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <div className="min-w-0">
            <div className="font-serif text-[24px] font-bold leading-tight truncate">{who.name || 'Staff'}</div>
            <div className="text-[12px] uppercase tracking-[0.18em] text-black/40 font-semibold truncate">{shane ? 'shaneruddle.com' : who.company || 'shaneruddle.com'}</div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close menu" className="p-1.5 -mr-1.5 text-black/45"><X className="w-5 h-5" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-3">
          <MenuList items={items} active={active} onSelect={onSelect} onPicked={onClose} showCount={open} sites={shane} />
        </nav>
        <div className="px-3 pt-2 border-t border-black/[0.08]" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
          <button type="button" onClick={() => { onClose(); auth.signOut(); }} className="w-full flex items-center gap-3 px-3 h-11 rounded-xl text-[15px] text-black/55 active:bg-black/[0.05]">
            <LogOut className="w-[18px] h-[18px]" /> Sign out
          </button>
        </div>
      </aside>
    </div>,
    document.body,
  );
}

// Desktop sidebar (same groups, same order as the phone menu).
export function PortalSidebar({ items, active, onSelect }: { items: NavGroup[]; active: NavKey; onSelect: (key: NavKey) => void }) {
  return (
    <nav className="font-sans -mx-3">
      <MenuList items={items} active={active} onSelect={onSelect} showCount sites={isShaneMenu(items)} />
    </nav>
  );
}

// Desktop frame for the full-screen apps (Reminders, Circle): the portal's top bar and sidebar around the page.
// On phones it renders the page alone; the page's own burger opens PortalDrawer.
export function PortalFrame({ items, active, onSelect, onWebsite, children }: {
  items: NavGroup[]; active: NavKey; onSelect: (key: NavKey) => void; onWebsite: () => void; children: ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-cream">
      <div className="hidden md:block sticky top-0 z-30">
        <PortalHeader active="portal" onNavigate={() => onSelect('offers')} onBack={onWebsite} />
      </div>
      {/* Lines up with the dashboard's sidebar (200px column inside the centred 80rem page). */}
      <aside className="hidden md:block fixed top-14 bottom-0 left-[max(0px,calc((100vw-80rem)/2))] w-[248px] px-6 py-8 overflow-y-auto bg-cream z-20">
        <PortalSidebar items={items} active={active} onSelect={onSelect} />
      </aside>
      <div className="md:pl-[calc(max(0px,calc((100vw-80rem)/2))+248px)]">{children}</div>
    </div>
  );
}
