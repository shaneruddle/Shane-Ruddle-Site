import React from 'react';
import { ArrowLeft, Car, LogOut } from 'lucide-react';
import { auth, UserProfile } from '../firebase';
import PracOperations from './PracOperations';
import TaskList from './TaskList';

interface DashboardProps { userProfile: UserProfile; onBack: () => void; onImpersonate?: (profile: UserProfile) => void; }

// Retired modules are intentionally absent: Logs, Finance, Feed, and Extractor Pro.
export default function Dashboard({ userProfile, onBack }: DashboardProps) {
  const canAccessPrac = userProfile.roles?.some((role) => ['admin', 'manager', 'accounts'].includes(role)) || userProfile.company === 'Pattaya Rent a Car';
  return <div className="min-h-screen bg-[#FDFDFD]"><header className="sticky top-0 z-20 border-b border-black/5 bg-white/90 px-6 py-4 backdrop-blur md:px-12"><div className="mx-auto flex max-w-6xl items-center justify-between"><button onClick={onBack} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-black/45 hover:text-gold"><ArrowLeft className="w-4 h-4" /> Portfolio</button><div className="flex items-center gap-3"><span className="hidden text-xs text-black/40 sm:block">{userProfile.name || userProfile.email}</span><button onClick={() => auth.signOut()} className="rounded-xl p-2 text-red-500 hover:bg-red-50" title="Sign out"><LogOut className="w-4 h-4" /></button></div></div></header><main className="mx-auto max-w-6xl p-6 md:p-12"><TaskList />{canAccessPrac ? <PracOperations userProfile={userProfile} /> : <div className="rounded-3xl border border-black/5 bg-white p-10 text-center"><Car className="mx-auto mb-4 h-8 w-8 text-gold" /><h1 className="font-serif text-2xl">Operations access required</h1></div>}</main></div>;
}
