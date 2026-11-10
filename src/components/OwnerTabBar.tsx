import { Inbox, StickyNote, HeartHandshake } from 'lucide-react';

// Shane's sticky bottom menu, shared by the Reminders & Notes app (/inbox) and the Circle tab, so each is one tap from the others.
export type OwnerTab = 'inbox' | 'today' | 'notes' | 'circle';

// Height of the bar above the iPhone home indicator. The Inbox capture dock sits on top of it.
export const OWNER_TAB_BAR_HEIGHT = 58;

const TABS: [OwnerTab, string, typeof Inbox][] = [
  ['inbox', 'Reminders', Inbox],
  ['notes', 'Notes', StickyNote],
  ['circle', 'Circle', HeartHandshake],
];

// `docked` = drawn inside a parent that is already pinned to the bottom (the Inbox stacks its capture bar on top).
export default function OwnerTabBar({ active, onSelect, className = '', docked = false }: { active?: OwnerTab; onSelect: (tab: OwnerTab) => void; className?: string; docked?: boolean }) {
  return (
    <nav className={`${docked ? '' : 'fixed bottom-0 inset-x-0 z-40 '}bg-[#0E0D0C]/95 backdrop-blur-xl border-t border-white/10 font-sans ${className}`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="max-w-xl mx-auto grid grid-cols-3" style={{ height: OWNER_TAB_BAR_HEIGHT }}>
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
