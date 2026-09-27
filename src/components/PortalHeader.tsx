import { ArrowUpRight, LayoutDashboard, LogOut, Ticket } from 'lucide-react';
import { auth } from '../firebase';

export type PortalView = 'dashboard' | 'portal';

// Shared top bar for the logged-in area (Workspace + Discounts) so both pages feel like one product.
export default function PortalHeader({
  active,
  name,
  onNavigate,
  onBack,
}: {
  active: PortalView;
  name?: string;
  onNavigate?: (view: PortalView) => void;
  onBack: () => void;
}) {
  const tab = (view: PortalView, label: string, Icon: typeof Ticket) => (
    <button
      type="button"
      onClick={() => onNavigate?.(view)}
      aria-current={active === view ? 'page' : undefined}
      className={`inline-flex items-center gap-2 h-9 px-3 sm:px-4 rounded-full text-[13px] font-medium transition-colors ${
        active === view ? 'bg-white/10 text-white' : 'text-white/55 hover:text-white hover:bg-white/5'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );

  return (
    <header className="sticky top-0 z-30 bg-ink text-white font-sans">
      <div className="mx-auto max-w-[1600px] h-14 px-3 sm:px-5 flex items-center gap-3 sm:gap-6">
        <button type="button" onClick={onBack} className="flex items-center gap-2.5 shrink-0" title="Back to shaneruddle.com">
          <svg viewBox="0 0 120 120" className="w-8 h-8" aria-hidden="true">
            <defs>
              <linearGradient id="portalGold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#F9F295" />
                <stop offset="45%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#B8860B" />
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r="57" fill="#0A0A0A" />
            <circle cx="60" cy="60" r="53" fill="none" stroke="url(#portalGold)" strokeWidth="3" />
            <text x="60" y="78" textAnchor="middle" fontSize="58" fontWeight="500" letterSpacing="-2" fill="url(#portalGold)" fontFamily="system-ui, sans-serif">SR</text>
          </svg>
          <span className="hidden md:block text-sm font-semibold tracking-wide">Shane OS</span>
        </button>

        <nav className="flex items-center gap-1">
          {tab('dashboard', 'Workspace', LayoutDashboard)}
          {tab('portal', 'Discounts', Ticket)}
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2 min-w-0">
          {name && <span className="hidden lg:block text-[13px] text-white/55 truncate max-w-[180px] mr-2">{name}</span>}
          <button
            type="button"
            onClick={onBack}
            className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-[13px] text-white/55 hover:text-white hover:bg-white/5 transition-colors"
          >
            Website <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => auth.signOut()}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full text-white/55 hover:text-white hover:bg-white/5 transition-colors"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
