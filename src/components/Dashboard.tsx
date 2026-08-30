import React from 'react';
import { ArrowLeft, Car, LogOut, PanelLeft } from 'lucide-react';
import { auth, UserProfile } from '../firebase';
import PracOperations from './PracOperations';
import TaskList from './TaskList';

interface DashboardProps { userProfile: UserProfile; onBack: () => void; onImpersonate?: (profile: UserProfile) => void; }

// Retired modules are intentionally absent: Logs, Finance, Feed, and Extractor Pro.
export default function Dashboard({ userProfile, onBack }: DashboardProps) {
  const canAccessPrac = userProfile.roles?.some((role) => ['admin', 'manager', 'accounts'].includes(role)) || userProfile.company === 'Pattaya Rent a Car';
  return <div className="min-h-screen bg-[#f7f7f8] font-sans text-[#1f1f1f]"><header className="sticky top-0 z-20 border-b border-black/10 bg-[#f7f7f8]/95 px-4 py-3 backdrop-blur"><div className="mx-auto flex max-w-[1600px] items-center justify-between"><div className="flex items-center gap-3"><PanelLeft className="h-5 w-5" /><span className="text-sm font-semibold">Shane OS</span><span className="hidden text-sm text-black/40 sm:block">Internal workspace</span></div><div className="flex items-center gap-3"><span className="hidden text-sm text-black/45 sm:block">{userProfile.name || userProfile.email}</span><button onClick={onBack} className="rounded-lg p-2 text-black/55 hover:bg-black/5" title="Portfolio"><ArrowLeft className="h-4 w-4" /></button><button onClick={() => auth.signOut()} className="rounded-lg p-2 text-black/55 hover:bg-black/5" title="Sign out"><LogOut className="h-4 w-4" /></button></div></div></header><main className="mx-auto max-w-[1600px] p-3 md:p-5"><details className="mb-4 rounded-xl border border-black/10 bg-white"><summary className="cursor-pointer px-4 py-3 text-sm font-medium">Tasks</summary><TaskList /></details>{canAccessPrac ? <PracOperations userProfile={userProfile} /> : <div className="rounded-xl border border-black/10 bg-white p-10 text-center"><Car className="mx-auto mb-4 h-7 w-7 text-black/45" /><h1 className="text-lg font-semibold">Operations access required</h1></div>}</main></div>;
}
