import React, { ReactNode, useState } from 'react';
import { Car, ChevronDown, ClipboardList, Database, Receipt } from 'lucide-react';
import { UserProfile } from '../firebase';
import CostTracker from './CostTracker';
import PracMappingAudit from './PracMappingAudit';
import PracOperations from './PracOperations';
import TaskList from './TaskList';
import PortalHeader, { PortalView } from './PortalHeader';

interface DashboardProps {
  userProfile: UserProfile;
  onBack: () => void;
  onImpersonate?: (profile: UserProfile) => void;
  onNavigate?: (view: PortalView) => void;
}

// Collapsible panel. Content mounts on first open (and stays mounted), so closed panels
// don't fire API calls — Data verification alone took ~4s on every dashboard load.
function Panel({ title, description, icon: Icon, children, defaultOpen = false }: { title: string; description: string; icon: typeof Car; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [mounted, setMounted] = useState(defaultOpen);
  return (
    <section className="rounded-[16px] border border-black/[0.08] bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setMounted(true); }}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-4 sm:px-5 py-4 text-left hover:bg-black/[0.02] transition-colors"
      >
        <span className="flex items-center justify-center w-9 h-9 rounded-[12px] bg-cream text-gold-deep shrink-0">
          <Icon className="w-[18px] h-[18px]" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[15px] font-semibold text-ink">{title}</span>
          <span className="block text-[13px] text-black/50 truncate">{description}</span>
        </span>
        <ChevronDown className={`w-5 h-5 text-black/40 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {mounted && (
        <div className={`portal-panel-body border-t border-black/[0.06] ${open ? '' : 'hidden'}`}>{children}</div>
      )}
    </section>
  );
}

export default function Dashboard({ userProfile, onBack, onNavigate }: DashboardProps) {
  const canAccessPrac = userProfile.roles?.some((role) => ['admin', 'manager', 'accounts'].includes(role)) || userProfile.company === 'Pattaya Rent a Car';
  const firstName = (userProfile.name || '').split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="portal-ui min-h-screen bg-cream font-sans text-ink">
      <PortalHeader active="dashboard" name={userProfile.name || userProfile.email} onNavigate={onNavigate} onBack={onBack} />
      <main className="mx-auto max-w-[1600px] px-3 sm:px-5 py-6 md:py-8 space-y-4">
        <div className="px-1 mb-2">
          <h1 className="text-2xl md:text-[28px] font-semibold tracking-tight">{greeting}{firstName ? `, ${firstName}` : ''}</h1>
          <p className="text-sm text-black/50 mt-1">Your internal workspace — tasks, costs, data checks and the PRAC assistant.</p>
        </div>

        <Panel title="Tasks" description="Capture work and move it through review" icon={ClipboardList}>
          <TaskList />
        </Panel>
        <Panel title="Costs" description="Estimated AI usage costs" icon={Receipt}>
          <div className="p-3 sm:p-4"><CostTracker /></div>
        </Panel>
        <Panel title="Data verification" description="Read-only PRAC schema and relationship audit" icon={Database}>
          <div className="p-3 sm:p-4"><PracMappingAudit /></div>
        </Panel>

        {canAccessPrac ? (
          <PracOperations userProfile={userProfile} />
        ) : (
          <div className="rounded-[16px] border border-black/[0.08] bg-white p-10 text-center">
            <Car className="mx-auto mb-4 h-7 w-7 text-black/40" />
            <h2 className="text-lg font-semibold">Operations access required</h2>
          </div>
        )}
      </main>
    </div>
  );
}
