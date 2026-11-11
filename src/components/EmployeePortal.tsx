import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType, UserProfile, Discount, UsageLog } from '../firebase';
import { collection, onSnapshot, query, where, doc, setDoc, addDoc, serverTimestamp, getDoc, Timestamp, getDocs } from 'firebase/firestore';
import { Tag, History, QrCode, ArrowLeft, Loader2, CheckCircle, Sparkles, Ticket, LogOut, Settings, User, Upload, Users, MessageCircle, Images, Activity, HeartHandshake, ListChecks, X, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import PortalHeader, { PortalView } from './PortalHeader';
import { type OwnerTab } from './OwnerTabBar';
import CommentsAdmin from './CommentsAdmin';
import PhotosAdmin from './PhotosAdmin';
import ActivityAdmin from './ActivityAdmin';
import CircleAdmin from './CircleAdmin';
import InboxApp from './InboxApp';
import { ConnectScreen } from './InboxConnect';

interface EmployeePortalProps {
  userProfile: UserProfile;
  onBack: () => void;
}

export default function EmployeePortal({ userProfile, onBack, onNavigate, initialTab }: EmployeePortalProps & { onNavigate?: (view: PortalView) => void; initialTab?: 'circle' | 'inbox' }) {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [myLogs, setMyLogs] = useState<UsageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  // Matches isAdmin() in firestore.rules, which guards comment moderation.
  const canModerateComments = userProfile.roles?.includes('admin') || userProfile.role === 'admin' || userProfile.email?.toLowerCase() === 'shaneruddle@gmail.com';
  // Matches isOwner() in storage.rules, which guards photo uploads.
  const canManagePhotos = userProfile.uid === 'u7ElWXIkdjVTNTp76LcyXnnq3AM2' || userProfile.email?.toLowerCase() === 'shaneruddle@gmail.com';
  const [activeTab, setActiveTab] = useState<'offers' | 'profile' | 'comments' | 'photos' | 'activity' | 'circle' | 'inbox'>(initialTab === 'circle' && canManagePhotos ? 'circle' : 'offers');
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
  const portalTabs: [typeof activeTab, string, typeof Ticket][] = [
    ['offers', 'Offers', Ticket],
    ['profile', 'Profile', User],
    ...(canModerateComments ? [['comments', 'Comments', MessageCircle] as [typeof activeTab, string, typeof Ticket]] : []),
    ...(canManagePhotos ? [['photos', 'Photos', Images] as [typeof activeTab, string, typeof Ticket]] : []),
    ...(canModerateComments ? [['activity', 'Activity', Activity] as [typeof activeTab, string, typeof Ticket]] : []),
    // Shane only (matches isShane() in firestore.rules), never other admins.
    ...(canManagePhotos ? [['circle', 'Circle', HeartHandshake] as [typeof activeTab, string, typeof Ticket]] : []),
    ...(canManagePhotos ? [['inbox', 'Reminders', ListChecks] as [typeof activeTab, string, typeof Ticket]] : []),
  ];
  // Phones get the section list as a slide-out drawer instead of a sideways-scrolling tab row.
  const [drawerOpen, setDrawerOpen] = useState(false);
  const activeLabel = portalTabs.find(([key]) => key === activeTab)?.[1] || 'Dashboard';
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false);
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [drawerOpen]);
  const [personalProfile, setPersonalProfile] = useState<Partial<UserProfile>>(userProfile);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!savingProfile) {
      setPersonalProfile(userProfile);
    }
  }, [userProfile, savingProfile]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch discounts
        const discountsQuery = query(collection(db, 'discounts'), where('active', '==', true));
        const discountsSnap = await getDocs(discountsQuery);
        const allActiveDiscounts = discountsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Discount));
        
        if (userProfile.discountIds && userProfile.discountIds.length > 0) {
          setDiscounts(allActiveDiscounts.filter(d => userProfile.discountIds?.includes(d.id)));
        } else {
          setDiscounts([]);
        }

        // Fetch logs
        const logsQuery = query(collection(db, 'usage_logs'), where('userId', '==', userProfile.uid), where('type', '==', 'redemption'));
        const logsSnap = await getDocs(logsQuery);
        setMyLogs(logsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as UsageLog)).sort((a, b) => {
          const timeA = a.timestamp?.toMillis?.() || 0;
          const timeB = b.timestamp?.toMillis?.() || 0;
          return timeB - timeA;
        }));
      } catch (err) {
        console.warn("Error fetching portal data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userProfile]);

  const handleRedeem = async () => {
    if (!selectedDiscount) return;
    setRedeeming(selectedDiscount.id);
    try {
      const timestamp = Date.now();
      // 1. Log in Firestore
      await addDoc(collection(db, 'usage_logs'), {
        userId: userProfile.uid,
        userName: userProfile.name || null,
        userCompany: userProfile.company || null,
        discountId: selectedDiscount.id,
        discountName: selectedDiscount.name || null,
        restaurantId: selectedDiscount.restaurantId || null,
        type: 'redemption',
        timestamp: serverTimestamp()
      });

      // 2. Send Email Notification via our server API
      try {
        await fetch('/api/notify-redemption', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeName: userProfile.name,
            company: userProfile.company || 'My Group of Companies',
            discountName: selectedDiscount.name,
            restaurantId: selectedDiscount.restaurantId,
            timestamp
          })
        });
      } catch (emailErr) {
        console.error("Failed to send email notification:", emailErr);
        // We don't block the UI if email fails, as long as Firestore is logged
      }

      setShowSuccess(true);
      setSelectedDiscount(null);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'usage_logs');
    } finally {
      setRedeeming(null);
    }
  };

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
    return window.location.pathname === '/inbox/connect' ? <ConnectScreen /> : <InboxApp onExit={() => { window.location.href = '/portal'; }} onCircle={() => ownerGo('circle')} />;
  }

  // Circle is a full-screen app styled like Reminders, with a way back to Reminders.
  if (activeTab === 'circle' && canManagePhotos) {
    return <CircleAdmin onBack={() => ownerGo('inbox')} />;
  }

  return (
    <div className="min-h-screen bg-cream">
      <PortalHeader active="portal" name={userProfile.name || userProfile.email} onNavigate={onNavigate} onBack={onBack} onMenu={() => setDrawerOpen(true)} section={activeLabel} />

      <AnimatePresence>
        {drawerOpen && (
          <div className="md:hidden fixed inset-0 z-50 font-sans">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/40"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.22 }}
              className="absolute inset-y-0 left-0 w-[80%] max-w-[300px] bg-ink text-white flex flex-col shadow-2xl"
              aria-label="Staff menu"
            >
              <div className="h-14 px-4 flex items-center justify-between border-b border-white/10">
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold truncate">{userProfile.name || 'Staff'}</div>
                  {userProfile.company && <div className="text-[12px] text-white/50 truncate">{userProfile.company}</div>}
                </div>
                <button type="button" onClick={() => setDrawerOpen(false)} className="w-9 h-9 -mr-2 inline-flex items-center justify-center rounded-full text-white/70 hover:bg-white/5" aria-label="Close menu">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                {portalTabs.map(([key, label, Icon]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { if (key === 'inbox') { window.location.href = '/inbox'; return; } setActiveTab(key); setDrawerOpen(false); window.scrollTo(0, 0); }}
                    aria-current={activeTab === key ? 'page' : undefined}
                    className={`w-full flex items-center gap-3 px-4 h-12 rounded-[12px] text-[15px] transition-colors ${activeTab === key ? 'bg-white/10 text-white font-medium' : 'text-white/65 hover:bg-white/5'}`}
                  >
                    <Icon className={`w-[18px] h-[18px] ${activeTab === key ? 'text-gold' : ''}`} /> {label}
                  </button>
                ))}
              </nav>
              <div className="p-3 border-t border-white/10 pb-[max(0.75rem,env(safe-area-inset-bottom))] space-y-1">
                <button type="button" onClick={() => { setDrawerOpen(false); onBack(); }} className="w-full flex items-center gap-3 px-4 h-11 rounded-[12px] text-[14px] text-white/65 hover:bg-white/5">
                  <ArrowUpRight className="w-4 h-4" /> Back to website
                </button>
                <button type="button" onClick={() => auth.signOut()} className="w-full flex items-center gap-3 px-4 h-11 rounded-[12px] text-[14px] text-white/65 hover:bg-white/5">
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12 md:grid md:grid-cols-[200px_minmax(0,1fr)] md:gap-10 lg:gap-14">
        <aside className="hidden md:block">
          <nav className="sticky top-24 flex flex-col gap-1">
            {portalTabs.map(([key, label, Icon]) => (
              <button
                key={key}
                onClick={() => { if (key === 'inbox') { window.location.href = '/inbox'; return; } setActiveTab(key); }}
                aria-current={activeTab === key ? 'page' : undefined}
                className={`shrink-0 flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors rounded-full ${activeTab === key ? 'bg-ink text-white' : 'text-black/50 hover:text-ink hover:bg-black/5'}`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="min-w-0">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-end mb-10">
          <div>
            <span className="block text-[11px] font-medium uppercase tracking-[0.18em] text-gold-deep mb-3">Staff dashboard</span>
            <h1 className="text-4xl md:text-5xl font-serif font-normal leading-tight">Welcome, {(userProfile.name || 'Employee').split(' ')[0]}</h1>
            <p className="text-black/55 mt-2">{userProfile.company || 'Shane Ruddle group of companies'}</p>
          </div>
          <div className="bg-ink text-white rounded-[16px] px-5 py-4 flex items-center gap-4">
            <div className="p-2.5 bg-white/10 rounded-[12px] text-gold">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] font-semibold text-white/55">Your discount code</div>
              <div className="text-2xl font-serif text-gold whitespace-nowrap">{userProfile.discountCode || 'SR-EMP-001'}</div>
            </div>
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

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-gold-deep" />
          </div>
        ) : activeTab === 'offers' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-serif mb-6 flex items-center gap-2">
                <Tag className="w-5 h-5 text-gold-deep" /> Available Offers
              </h3>
              <div className="space-y-6">
                {discounts.length === 0 ? (
                  <div className="p-12 text-center glass rounded-3xl border-2 border-dashed border-black/5">
                    <Ticket className="w-12 h-12 text-black/10 mx-auto mb-4" />
                    <p className="text-sm text-black/40 uppercase tracking-[0.12em] font-bold">No discounts assigned to your profile.</p>
                    <p className="text-[10px] text-black/20 mt-2">Please contact your administrator to assign discounts to your account.</p>
                  </div>
                ) : (
                  discounts.map((discount) => (
                    <motion.div 
                      key={discount.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => setSelectedDiscount(discount)}
                      className={`glass p-6 rounded-3xl relative overflow-hidden group cursor-pointer border-2 transition-all ${selectedDiscount?.id === discount.id ? 'border-gold shadow-lg' : 'border-transparent hover:border-gold/20'}`}
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Sparkles className="w-12 h-12" />
                      </div>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-serif mb-1">{discount.name}</h4>
                          <p className="text-xs text-black/40 mb-4 uppercase tracking-[0.12em] font-bold">{discount.restaurantId}</p>
                        </div>
                        <div className="text-3xl font-serif text-gold-deep">{discount.percentage}%</div>
                      </div>
                      <p className="text-sm text-black/60 font-light mb-6">{discount.description}</p>
                      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] font-bold text-gold-deep">
                        {selectedDiscount?.id === discount.id ? (
                          <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Selected</span>
                        ) : (
                          <span>Click to select</span>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            <div>
              <AnimatePresence mode="wait">
                {selectedDiscount ? (
                  <motion.div 
                    key="redemption"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass p-8 rounded-[40px] border-2 border-gold/30 shadow-2xl sticky top-24"
                  >
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <QrCode className="w-8 h-8 text-gold-deep" />
                      </div>
                      <h3 className="text-2xl font-serif mb-2">Redeem Discount</h3>
                      <p className="text-sm text-black/40 uppercase tracking-[0.12em] font-bold">Show this screen to the cashier</p>
                    </div>

                    <div className="bg-black/5 rounded-3xl p-6 mb-8 text-center border border-black/5">
                      <div className="text-4xl font-serif text-gold-deep mb-2">{selectedDiscount.percentage}% OFF</div>
                      <div className="text-lg font-serif mb-1">{selectedDiscount.name}</div>
                      <div className="text-xs uppercase tracking-[0.12em] text-black/40 font-bold">{selectedDiscount.restaurantId}</div>
                    </div>

                    <div className="space-y-4 mb-8">
                      <div className="flex justify-between text-xs uppercase tracking-[0.12em] font-bold text-black/40 border-b border-black/5 pb-2">
                        <span>Employee</span>
                        <span className="text-black">{userProfile.name}</span>
                      </div>
                      <div className="flex justify-between text-xs uppercase tracking-[0.12em] font-bold text-black/40 border-b border-black/5 pb-2">
                        <span>Company</span>
                        <span className="text-black">{userProfile.company || 'My Group of Companies'}</span>
                      </div>
                      <div className="flex justify-between text-xs uppercase tracking-[0.12em] font-bold text-black/40 border-b border-black/5 pb-2">
                        <span>Code</span>
                        <span className="text-gold-deep">{userProfile.discountCode}</span>
                      </div>
                    </div>

                    <div className="p-4 bg-gold/5 rounded-2xl border border-gold/20 mb-8">
                      <p className="text-[10px] text-center text-gold-dark font-medium leading-relaxed uppercase tracking-wider">
                        Cashier: Please verify the employee's ID and click the button below to complete redemption.
                      </p>
                    </div>

                    <button 
                      onClick={handleRedeem}
                      disabled={redeeming !== null}
                      className="w-full bg-gold text-black py-4 rounded-2xl text-sm font-bold uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-all flex items-center justify-center gap-3 shadow-lg shadow-gold/20"
                    >
                      {redeeming ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle className="w-5 h-5" /> Cashier Redeem</>}
                    </button>
                    
                    <button 
                      onClick={() => setSelectedDiscount(null)}
                      className="w-full mt-4 text-[10px] uppercase tracking-[0.12em] font-bold text-black/20 hover:text-black/60 transition-colors"
                    >
                      Cancel Selection
                    </button>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="history"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    <h3 className="text-xl font-serif mb-6 flex items-center gap-2">
                      <History className="w-5 h-5 text-gold-deep" /> Recent Usage
                    </h3>
                    <div className="space-y-4">
                      {myLogs.length === 0 ? (
                        <div className="p-12 text-center glass rounded-3xl">
                          <p className="text-black/40 italic">You haven't used any discounts yet.</p>
                        </div>
                      ) : (
                        myLogs.map((log) => (
                          <div key={log.id} className="flex items-center justify-between p-4 bg-black/2 rounded-2xl border border-black/5">
                            <div>
                              <div className="text-sm font-medium">{log.restaurantId}</div>
                              <div className="text-[10px] text-black/40 uppercase tracking-[0.12em] font-bold">
                                {log.timestamp?.toDate().toLocaleDateString()}
                              </div>
                            </div>
                            <div className="text-xs font-bold text-gold-deep">REDEEMED</div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : activeTab === 'comments' && canModerateComments ? (
          <CommentsAdmin />
        ) : activeTab === 'photos' && canManagePhotos ? (
          <PhotosAdmin />
        ) : activeTab === 'activity' && canModerateComments ? (
          <ActivityAdmin />
        ) : activeTab === 'circle' && canManagePhotos ? (
          <CircleAdmin />
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

      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] bg-green-500 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-[0.12em]">Discount Redeemed Successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
