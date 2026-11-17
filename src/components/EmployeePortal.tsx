import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType, UserProfile, Discount, UsageLog } from '../firebase';
import { collection, onSnapshot, query, where, doc, setDoc, addDoc, serverTimestamp, getDoc, Timestamp, getDocs } from 'firebase/firestore';
import { Tag, History, QrCode, ArrowLeft, Loader2, CheckCircle, Sparkles, Ticket, LogOut, Settings, User, Upload, Users, MessageCircle, Images, Activity, HeartHandshake, ListChecks, X, ArrowUpRight, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import PortalHeader, { PortalView } from './PortalHeader';
import { type OwnerTab } from './OwnerTabBar';
import { navItems, PortalDrawer, PortalSidebar, type NavKey } from './PortalNav';
import CommentsAdmin from './CommentsAdmin';
import PhotosAdmin from './PhotosAdmin';
import ActivityAdmin from './ActivityAdmin';
import CircleAdmin from './CircleAdmin';
import EnquiriesAdmin from './EnquiriesAdmin';
import InboxApp from './InboxApp';
import { ConnectScreen } from './InboxConnect';
import SitePulse from './SitePulse';

interface EmployeePortalProps {
  userProfile: UserProfile;
  onBack: () => void;
}

export default function EmployeePortal({ userProfile, onBack, onNavigate, initialTab }: EmployeePortalProps & { onNavigate?: (view: PortalView) => void; initialTab?: 'circle' | 'inbox' }) {
  // Staff discounts are now checked by the cashier on /staff-check, so the portal no longer loads them.
  const loading = false;
  // Matches isAdmin() in firestore.rules, which guards comment moderation.
  const canModerateComments = userProfile.roles?.includes('admin') || userProfile.role === 'admin' || userProfile.email?.toLowerCase() === 'shaneruddle@gmail.com';
  // Matches isOwner() in storage.rules, which guards photo uploads.
  const canManagePhotos = userProfile.uid === 'u7ElWXIkdjVTNTp76LcyXnnq3AM2' || userProfile.email?.toLowerCase() === 'shaneruddle@gmail.com';
  const [activeTab, setActiveTab] = useState<'offers' | 'profile' | 'comments' | 'photos' | 'activity' | 'circle' | 'inbox' | 'enquiries'>(
    () => {
      if (!canManagePhotos) return 'offers';
      if (initialTab === 'circle') return 'circle';
      // /portal?tab=photos etc. (the Reminders menu and top-bar buttons open sections this way).
      const t = new URLSearchParams(window.location.search).get('tab');
      return t === 'photos' || t === 'enquiries' || t === 'profile' || t === 'comments' || t === 'activity' ? t : 'offers';
    });
  // Shane's bottom menu swaps between the Inbox app and the Circle tab in place, no page reload.
  const [inboxOpen, setInboxOpen] = useState(initialTab === 'inbox');
  const ownerGo = (tab: OwnerTab) => {
    if (tab === 'circle') {
      window.history.replaceState(null, '', '/portal?tab=circle');
      setInboxOpen(false);
      setActiveTab('circle');
    } else {
      window.history.replaceState(null, '', tab === 'inbox' ? '/inbox' : `/inbox?tab=${tab}`);
      setInboxOpen(true);
    }
    window.scrollTo(0, 0);
  };
  const portalTabs = navItems({ canModerate: !!canModerateComments, isShane: canManagePhotos });
  // Every section, from the phone menu or the desktop sidebar. Reminders opens in place, no reload.
  const goTab = (key: NavKey) => {
    if (key === 'inbox' || key === 'circle') { ownerGo(key); return; }
    if (key === 'search' || key === 'settings') { window.history.replaceState(null, '', `/inbox?tab=${key}`); setInboxOpen(true); window.scrollTo(0, 0); return; }
    window.history.replaceState(null, '', key === 'offers' ? '/portal' : `/portal?tab=${key}`);
    setActiveTab(key); window.scrollTo(0, 0);
  };
  // Phones get the section list as a slide-out drawer instead of a sideways-scrolling tab row.
  const [drawerOpen, setDrawerOpen] = useState(false);
  const activeLabel = portalTabs.flatMap(g => g.rows).find(r => r.key === activeTab)?.label || 'Dashboard';
  const [personalProfile, setPersonalProfile] = useState<Partial<UserProfile>>(userProfile);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!savingProfile) {
      setPersonalProfile(userProfile);
    }
  }, [userProfile, savingProfile]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      toast.error("Image size must be less than 1MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPersonalProfile(prev => ({ ...prev, profileImage: base64String }));
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async () => {
    if (!auth.currentUser) return;
    setSavingProfile(true);
    try {
      console.log("Updating employee profile. Current state:", personalProfile);
      const updateData = {
        name: personalProfile.name || '',
        firstName: personalProfile.firstName || '',
        lastName: personalProfile.lastName || '',
        mobile: personalProfile.mobile || '',
        profileImage: personalProfile.profileImage || '',
        updatedAt: serverTimestamp()
      };
      
      console.log("Sending update to Firestore:", updateData);
      await updateDoc(doc(db, 'users', auth.currentUser.uid), updateData);
      
      console.log("Firestore update successful. Logging usage...");
      // Log profile update
      await addDoc(collection(db, 'usage_logs'), {
        userId: auth.currentUser.uid,
        userName: userProfile.name || 'Unknown',
        userEmail: auth.currentUser.email || 'Unknown',
        userCompany: userProfile.company || 'Unknown',
        type: 'profile_update',
        details: `User updated their personal profile (Mobile: ${personalProfile.mobile || 'N/A'})`,
        timestamp: serverTimestamp()
      });

      toast.success("Profile updated successfully");
    } catch (err) {
      console.error("Error updating employee profile:", err);
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
      toast.error("Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  // /inbox opens Shane's private Inbox as its own full-screen app (home-screen icon), outside the portal chrome.
  if (inboxOpen && canManagePhotos) {
    return window.location.pathname === '/inbox/connect' ? <ConnectScreen /> : <InboxApp onExit={() => { window.location.href = '/portal'; }} onCircle={() => ownerGo('circle')}
      onPhotos={() => { window.history.replaceState(null, '', '/portal?tab=photos'); setInboxOpen(false); setActiveTab('photos'); window.scrollTo(0, 0); }}
      onEnquiries={() => { window.history.replaceState(null, '', '/portal?tab=enquiries'); setInboxOpen(false); setActiveTab('enquiries'); window.scrollTo(0, 0); }}
      onPortalTab={(tab) => { window.history.replaceState(null, '', tab === 'offers' ? '/portal' : `/portal?tab=${tab}`); setInboxOpen(false); setActiveTab(tab); window.scrollTo(0, 0); }} />;
  }

  // Circle is a full-screen app styled like Reminders, with a way back to Reminders.
  if (activeTab === 'circle' && canManagePhotos) {
    return <CircleAdmin onNav={goTab} />;
  }

  return (
    <div className="min-h-screen bg-cream">
      <PortalHeader active="portal" name={userProfile.name || userProfile.email} onNavigate={onNavigate} onBack={onBack} onMenu={() => setDrawerOpen(true)} section={activeLabel} />

      <PortalDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} items={portalTabs} active={activeTab} onSelect={goTab}
        onWebsite={onBack} name={userProfile.name} company={userProfile.company} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12 md:grid md:grid-cols-[200px_minmax(0,1fr)] md:gap-10 lg:gap-14">
        <aside className="hidden md:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pb-6">
            <PortalSidebar items={portalTabs} active={activeTab} onSelect={goTab} />
          </div>
        </aside>

        <div className="min-w-0">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-end mb-10">
          <div>
            <span className="block text-[11px] font-medium uppercase tracking-[0.18em] text-gold-deep mb-3">Staff dashboard</span>
            <h1 className="text-4xl md:text-5xl font-serif font-normal leading-tight">Welcome, {(userProfile.name || 'Employee').split(' ')[0]}</h1>
            <p className="text-black/55 mt-2">{userProfile.company || 'Shane Ruddle group of companies'}</p>
          </div>
        </div>

        {/* Shane's shortcuts: his private Circle and Inbox (notes and reminders), one tap each. */}
        {canManagePhotos && activeTab === 'offers' && (
          <div className="-mt-4 mb-12">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-xl">
              <button type="button" onClick={() => { setActiveTab('circle'); window.scrollTo(0, 0); }} className="group h-44 sm:h-48 rounded-[20px] bg-ink text-white p-5 flex flex-col justify-between text-left hover:bg-black transition-colors">
                <span className="w-14 h-14 rounded-[16px] bg-white/10 text-gold inline-flex items-center justify-center"><HeartHandshake className="w-7 h-7" /></span>
                <span>
                  <span className="block text-2xl font-serif">Circle</span>
                  <span className="block text-[13px] text-white/55 mt-0.5">People worth knowing</span>
                </span>
              </button>
              <a href="/inbox" className="group h-44 sm:h-48 rounded-[20px] bg-ink text-white p-5 flex flex-col justify-between hover:bg-black transition-colors">
                <span className="w-14 h-14 rounded-[16px] bg-white/10 text-gold inline-flex items-center justify-center"><ListChecks className="w-7 h-7" /></span>
                <span>
                  <span className="block text-2xl font-serif">Reminders</span>
                  <span className="block text-[13px] text-white/55 mt-0.5">Notes and reminders</span>
                </span>
              </a>
            </div>
            <button type="button" onClick={onBack} className="mt-4 inline-flex items-center gap-1.5 text-[13px] text-black/50 hover:text-ink">
              View site <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {canManagePhotos && activeTab === 'offers' && <SitePulse />}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-gold-deep" />
          </div>
        ) : activeTab === 'offers' ? (
          canManagePhotos ? null : (
            <div className="max-w-xl p-6 rounded-2xl bg-white border border-black/10">
              <h3 className="text-xl font-serif mb-2 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-gold-deep" /> Staff discounts
              </h3>
              <p className="text-sm text-black/60">You don't need to log in for your staff discount any more. Just give your name at the counter: the cashier checks the staff list and may ask for the last 3 digits of your mobile.</p>
            </div>
          )
        ) : activeTab === 'comments' && canModerateComments ? (
          <CommentsAdmin />
        ) : activeTab === 'photos' && canManagePhotos ? (
          <PhotosAdmin />
        ) : activeTab === 'activity' && canModerateComments ? (
          <ActivityAdmin />
        ) : activeTab === 'circle' && canManagePhotos ? (
          <CircleAdmin />
        ) : activeTab === 'enquiries' && canManagePhotos ? (
          <EnquiriesAdmin />
        ) : activeTab === 'inbox' && canManagePhotos ? (
          <div className="max-w-xl mx-auto p-8 rounded-2xl bg-white border border-black/10 text-center">
            <h2 className="text-2xl font-serif">Your <span className="italic">Reminders &amp; Notes</span></h2>
            <p className="text-sm text-black/50 mt-2">Notes, ideas and reminders in one place. It opens as its own app so you can add it to your home screen.</p>
            <a href="/inbox" className="inline-block mt-5 px-6 py-3 rounded-full bg-ink text-white text-sm font-semibold">Open Reminders</a>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="glass rounded-[40px] p-10">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-2xl font-serif">Personal <span className="italic">Profile</span></h3>
                  <p className="text-black/40 text-sm">Update your personal information</p>
                </div>
                <button 
                  onClick={handleUpdateProfile}
                  disabled={savingProfile}
                  className="bg-black text-white px-8 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-[0.12em] hover:bg-gold transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {savingProfile ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                  Save Profile
                </button>
              </div>

              <div className="space-y-8">
                <div className="flex flex-col items-center mb-10">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-[2rem] overflow-hidden bg-black/5 border-2 border-dashed border-black/10 flex items-center justify-center">
                      {personalProfile.profileImage ? (
                        <img src={personalProfile.profileImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-10 h-10 text-black/10" />
                      )}
                    </div>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-[2rem]">
                      <Upload className="w-5 h-5 text-white" />
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handlePhotoUpload}
                      />
                    </label>
                  </div>
                  <p className="mt-4 text-[10px] text-black/30 italic uppercase tracking-[0.12em] font-bold">Change Photo</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.12em] font-bold text-black/40 mb-3">First Name</label>
                    <input 
                      type="text" 
                      value={personalProfile.firstName || ''}
                      onChange={e => setPersonalProfile({...personalProfile, firstName: e.target.value})}
                      className="w-full bg-black/5 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-gold/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.12em] font-bold text-black/40 mb-3">Last Name</label>
                    <input 
                      type="text" 
                      value={personalProfile.lastName || ''}
                      onChange={e => setPersonalProfile({...personalProfile, lastName: e.target.value})}
                      className="w-full bg-black/5 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-gold/20 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.12em] font-bold text-black/40 mb-3">Display Name</label>
                  <input 
                    type="text" 
                    value={personalProfile.name || ''}
                    onChange={e => setPersonalProfile({...personalProfile, name: e.target.value})}
                    className="w-full bg-black/5 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-gold/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.12em] font-bold text-black/40 mb-3">Mobile Number</label>
                  <input 
                    type="tel" 
                    value={personalProfile.mobile || ''}
                    onChange={e => setPersonalProfile({...personalProfile, mobile: e.target.value})}
                    className="w-full bg-black/5 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-gold/20 outline-none"
                    placeholder="e.g. 088-445-1577"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
        </div>
      </div>

    </div>
  );
}
