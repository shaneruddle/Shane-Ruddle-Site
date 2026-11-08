import { Inbox, CalendarCheck, StickyNote, HeartHandshake } from 'lucide-react';

// Shane's sticky bottom menu, shared by the Inbox app and the Circle tab, so each is one tap from the others.
export type OwnerTab = 'inbox' | 'today' | 'notes' | 'circle';

// Height of the bar above the iPhone home indicator. The Inbox capture dock sits on top of it.
export const OWNER_TAB_BAR_HEIGHT = 58;

const TABS: [OwnerTab, string, typeof Inbox][] = [
  ['inbox', 'Inbox', Inbox],
  ['today', 'Reminders', CalendarCheck],
  ['notes', 'Notes', StickyNote],
  ['circle', 'Circle', HeartHandshake],
];

export default function OwnerTabBar({ active, onSelect, className = '' }: { active?: OwnerTab; onSelect: (tab: OwnerTab) => void; className?: string }) {
  return (
    <nav className={`fixed bottom-0 inset-x-0 z-40 bg-[#0E0D0C]/95 backdrop-blur-xl border-t border-white/10 font-sans ${className}`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="max-w-xl mx-auto grid grid-cols-4" style={{ height: OWNER_TAB_BAR_HEIGHT }}>
        {TABS.map(([id, label, Icon]) => {
          const on = id === active;
          return (
            <button key={id} type="button" onClick={() => onSelect(id)} aria-current={on ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium ${on ? 'text-gold' : 'text-white/50 active:text-white'}`}>
              <Icon className="w-[22px] h-[22px]" strokeWidth={on ? 2.2 : 1.8} />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
