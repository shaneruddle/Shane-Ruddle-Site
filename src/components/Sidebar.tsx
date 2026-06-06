import React from 'react';
import { motion } from 'motion/react';
import { auth } from '../firebase';
import { cn } from '@src/lib/utils';
import {
  Users, Database, FileText, History, DollarSign, Wrench,
  User, Settings, LogOut, ArrowLeft, ChevronDown, ChevronLeft, ChevronRight
} from 'lucide-react';
import { UserProfile } from '../types';

type ActiveTab = 'employees' | 'logs' | 'companies' | 'profile' | 'blog' | 'finance' | 'settings' | 'tools';
type FinanceSubTab = 'ABPC' | 'ECRE' | 'ABPC Agents' | 'ECRE Agents' | 'ABPC Reports' | 'ECRE Reports';
type ToolsSubTab = 'extractor-pro' | 'general';

interface SidebarProps {
  userProfile: UserProfile;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (v: boolean) => void;
  isImpersonating: boolean;
  // Finance
  isFinanceExpanded: boolean;
  setIsFinanceExpanded: (v: boolean) => void;
  financeSubTab: FinanceSubTab;
  setFinanceSubTab: (v: FinanceSubTab) => void;
  // Tools
  isToolsExpanded: boolean;
  setIsToolsExpanded: (v: boolean) => void;
  toolsSubTab: ToolsSubTab;
  setToolsSubTab: (v: ToolsSubTab) => void;
  // Settings
  isSettingsExpanded: boolean;
  setIsSettingsExpanded: (v: boolean) => void;
  settingsSubTab: 'general' | 'privacy';
  setSettingsSubTab: (v: 'general' | 'privacy') => void;
  // Permissions
  canAccessTools: boolean;
  onBack: () => void;
}

function Tooltip({ label }: { label: string }) {
  return (
    <div className="absolute left-full ml-4 px-3 py-2 bg-black text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[60]">
      {label}
    </div>
  );
}

export default function Sidebar({
  userProfile,
  activeTab,
  setActiveTab,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  isImpersonating,
  isFinanceExpanded,
  setIsFinanceExpanded,
  financeSubTab,
  setFinanceSubTab,
  isToolsExpanded,
  setIsToolsExpanded,
  toolsSubTab,
  setToolsSubTab,
  isSettingsExpanded,
  setIsSettingsExpanded,
  settingsSubTab,
  setSettingsSubTab,
  canAccessTools,
  onBack,
}: SidebarProps) {
  const hasRole = (role: string) =>
    userProfile.roles?.includes(role as any) || (userProfile as any).role === role;

  const navItemClass = (isActive: boolean) =>
    cn(
      'flex items-center gap-3 px-4 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all relative group',
      isActive
        ? 'bg-gold text-white shadow-lg shadow-gold/20'
        : 'text-black/40 hover:bg-black/5 hover:text-black'
    );

  const labelClass = cn(
    'transition-all duration-300 whitespace-nowrap',
    isSidebarCollapsed ? 'opacity-0 translate-x-4 absolute' : 'opacity-100 translate-x-0'
  );

  const chevron = (expanded: boolean) => (
    <ChevronDown
      className={cn('w-3 h-3 transition-transform duration-300', expanded ? 'rotate-180' : '')}
    />
  );

  return (
    <motion.aside
      initial={false}
      animate={{
        width: isSidebarCollapsed ? 80 : 288,
        padding: isSidebarCollapsed ? '24px 12px' : '32px',
      }}
      className={cn(
        'hidden md:flex bg-white border-r border-black/5 flex-col h-screen sticky z-50 relative overflow-visible transition-all duration-500',
        isImpersonating ? 'top-[38px]' : 'top-0'
      )}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        className="absolute -right-3 top-24 w-6 h-6 bg-white border border-black/5 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all z-[60] text-black/40 hover:text-black hover:scale-110"
        title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      >
        {isSidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Header - expanded */}
      <div
        className={cn(
          'mb-12 transition-all duration-300',
          isSidebarCollapsed ? 'opacity-0 invisible h-0 mb-0' : 'opacity-100 visible'
        )}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-black/40 hover:text-gold transition-colors mb-8 whitespace-nowrap"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Portfolio
        </button>
        <h1 className="text-3xl font-serif leading-tight whitespace-nowrap">
          Admin <br />
          <span className="italic">Dashboard</span>
        </h1>
        <p className="text-[10px] uppercase tracking-widest font-bold text-black/20 mt-4 whitespace-nowrap">
          Management Suite
        </p>
      </div>

      {/* Header - collapsed */}
      <div
        className={cn(
          'mb-8 flex justify-center transition-all duration-300',
          isSidebarCollapsed ? 'opacity-100 visible' : 'opacity-0 invisible h-0 mb-0'
        )}
      >
        <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold font-serif text-xl">
          A
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-2 flex-grow overflow-y-auto pr-2 custom-scrollbar overflow-x-hidden">

        {/* Staff Management */}
        {(hasRole('admin') || hasRole('manager') || hasRole('accounts')) && (
          <button onClick={() => setActiveTab('employees')} className={navItemClass(activeTab === 'employees')}>
            <Users className="w-4 h-4 shrink-0" />
            <span className={labelClass}>Staff Management</span>
            {isSidebarCollapsed && <Tooltip label="Staff Management" />}
          </button>
        )}

        {/* Admin-only items */}
        {userProfile.roles?.includes('admin') && (
          <>
            <button onClick={() => setActiveTab('companies')} className={navItemClass(activeTab === 'companies')}>
              <Database className="w-4 h-4 shrink-0" />
              <span className={labelClass}>Companies</span>
              {isSidebarCollapsed && <Tooltip label="Companies" />}
            </button>

            <button onClick={() => setActiveTab('blog')} className={navItemClass(activeTab === 'blog')}>
              <FileText className="w-4 h-4 shrink-0" />
              <span className={labelClass}>Blog</span>
              {isSidebarCollapsed && <Tooltip label="Blog" />}
            </button>

            <button onClick={() => setActiveTab('logs')} className={navItemClass(activeTab === 'logs')}>
              <History className="w-4 h-4 shrink-0" />
              <span className={labelClass}>System Logs</span>
              {isSidebarCollapsed && <Tooltip label="System Logs" />}
            </button>
          </>
        )}

        {/* Finance */}
        {(hasRole('admin') || hasRole('accounts')) && (
          <div className="flex flex-col">
            <button
              onClick={() => {
                if (activeTab === 'finance') {
                  setIsFinanceExpanded(!isFinanceExpanded);
                } else {
                  setActiveTab('finance');
                  setIsFinanceExpanded(true);
                }
              }}
              className={navItemClass(activeTab === 'finance')}
            >
              <DollarSign className="w-4 h-4 shrink-0" />
              <span className={cn(labelClass, 'flex-grow text-left')}>Finance</span>
              {!isSidebarCollapsed && chevron(isFinanceExpanded)}
              {isSidebarCollapsed && <Tooltip label="Finance" />}
            </button>

            {!isSidebarCollapsed && isFinanceExpanded && (
              <div className="ml-11 flex flex-col gap-1 mt-1 mb-4">
                {(hasRole('admin') || userProfile.company === 'Alan Bolton Property Consultants') && (
                  <>
                    {(['ABPC', 'ABPC Agents', 'ABPC Reports'] as FinanceSubTab[]).map((sub) => (
                      <button
                        key={sub}
                        onClick={() => setFinanceSubTab(sub)}
                        className={cn(
                          'text-left px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all',
                          financeSubTab === sub
                            ? 'text-gold bg-gold/5'
                            : 'text-black/30 hover:text-black/60 hover:bg-black/2'
                        )}
                      >
                        {sub}
                      </button>
                    ))}
                  </>
                )}
                {(hasRole('admin') || userProfile.company === 'East Coast Real Estate') && (
                  <>
                    {(['ECRE', 'ECRE Agents', 'ECRE Reports'] as FinanceSubTab[]).map((sub) => (
                      <button
                        key={sub}
                        onClick={() => setFinanceSubTab(sub)}
                        className={cn(
                          'text-left px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all',
                          financeSubTab === sub
                            ? 'text-gold bg-gold/5'
                            : 'text-black/30 hover:text-black/60 hover:bg-black/2'
                        )}
                      >
                        {sub}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tools */}
        {canAccessTools && (
          <div className="flex flex-col">
            <button
              onClick={() => {
                if (activeTab === 'tools') {
                  setIsToolsExpanded(!isToolsExpanded);
                } else {
                  setActiveTab('tools');
                  setIsToolsExpanded(true);
                }
              }}
              className={cn(
                'flex items-center gap-3 px-4 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all relative group',
                activeTab === 'tools'
                  ? isToolsExpanded && !isSidebarCollapsed
                    ? 'bg-gold/10 text-gold'
                    : 'bg-gold text-white shadow-lg shadow-gold/20'
                  : 'text-black/40 hover:bg-black/5 hover:text-black'
              )}
            >
              <Wrench className="w-4 h-4 shrink-0" />
              <span className={cn(labelClass, 'flex-grow text-left')}>Tools</span>
              {!isSidebarCollapsed && chevron(isToolsExpanded)}
              {isSidebarCollapsed && <Tooltip label="Tools" />}
            </button>

            {!isSidebarCollapsed && isToolsExpanded && (
              <div className="ml-11 flex flex-col gap-1 mt-1 mb-4">
                <button
                  onClick={() => setToolsSubTab('extractor-pro')}
                  className={cn(
                    'text-left px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all',
                    toolsSubTab === 'extractor-pro'
                      ? 'bg-gold text-white shadow-md shadow-gold/20 translate-x-1'
                      : 'text-black/30 hover:text-black/60 hover:bg-black/2'
                  )}
                >
                  Extractor Pro
                </button>
              </div>
            )}
          </div>
        )}

        {/* My Profile */}
        <button onClick={() => setActiveTab('profile')} className={navItemClass(activeTab === 'profile')}>
          <User className="w-4 h-4 shrink-0" />
          <span className={labelClass}>My Profile</span>
          {isSidebarCollapsed && <Tooltip label="My Profile" />}
        </button>

        {/* Settings */}
        {userProfile.roles?.includes('admin') && (
          <div className="flex flex-col">
            <button
              onClick={() => {
                if (activeTab === 'settings') {
                  setIsSettingsExpanded(!isSettingsExpanded);
                } else {
                  setActiveTab('settings');
                  setIsSettingsExpanded(true);
                }
              }}
              className={navItemClass(activeTab === 'settings')}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span className={cn(labelClass, 'flex-grow text-left')}>Site Settings</span>
              {!isSidebarCollapsed && chevron(isSettingsExpanded)}
              {isSidebarCollapsed && <Tooltip label="Site Settings" />}
            </button>

            {!isSidebarCollapsed && isSettingsExpanded && (
              <div className="ml-11 flex flex-col gap-1 mt-1 mb-4">
                {(['general', 'privacy'] as const).map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setSettingsSubTab(sub)}
                    className={cn(
                      'text-left px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all capitalize',
                      settingsSubTab === sub
                        ? 'text-gold bg-gold/5'
                        : 'text-black/30 hover:text-black/60 hover:bg-black/2'
                    )}
                  >
                    {sub === 'privacy' ? 'Privacy Settings' : 'General'}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-8 border-t border-black/5 flex flex-col gap-2">
        <button
          onClick={() => auth.signOut()}
          className="flex items-center gap-3 px-4 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all w-full relative group"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className={cn('transition-all duration-300 whitespace-nowrap', isSidebarCollapsed ? 'opacity-0 translate-x-4 absolute' : 'opacity-100 translate-x-0')}>
            Sign Out
          </span>
          {isSidebarCollapsed && (
            <div className="absolute left-full ml-4 px-3 py-2 bg-red-500 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[60]">
              Sign Out
            </div>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
