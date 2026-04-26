import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType, UserProfile, Discount, UsageLog } from '../firebase';
import { collection, onSnapshot, query, where, doc, setDoc, addDoc, serverTimestamp, getDoc, Timestamp, getDocs } from 'firebase/firestore';
import { Tag, History, QrCode, ArrowLeft, Loader2, CheckCircle, Sparkles, Ticket, LogOut, Settings, User, Upload, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';

interface EmployeePortalProps {
  userProfile: UserProfile;
  onBack: () => void;
}

export default function EmployeePortal({ userProfile, onBack }: EmployeePortalProps) {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [myLogs, setMyLogs] = useState<UsageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'offers' | 'profile'>('offers');
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
        const logsQuery = query(collection(db, 'usage_logs'), where('userId', '==', userProfile.uid));
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

  return (
    <div className="min-h-screen bg-[#FDFDFD] py-24 px-6 md:px-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
          <div className="flex items-center justify-between mb-4">
            <button onClick={onBack} className="flex items-center gap-2 text-xs uppercase tracking-widest text-black/40 hover:text-gold transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Portfolio
            </button>
            <button 
              onClick={() => auth.signOut()}
              className="flex items-center gap-2 text-xs uppercase tracking-widest text-black/40 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
            <h1 className="text-4xl font-serif">Employee <span className="italic">Portal</span></h1>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-black/60 font-light">Welcome, <span className="font-bold text-black">{userProfile.name || 'Employee'}</span></p>
              <div className="w-1 h-1 rounded-full bg-gold/40" />
              <p className="text-gold font-serif italic">{userProfile.company || 'My Group of Companies'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveTab('offers')}
              className={`px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'offers' ? 'bg-gold text-white shadow-lg shadow-gold/20' : 'bg-black/5 text-black/40 hover:bg-black/10'}`}
            >
              <Ticket className="w-3 h-3" /> Offers
            </button>
            <button 
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'profile' ? 'bg-gold text-white shadow-lg shadow-gold/20' : 'bg-black/5 text-black/40 hover:bg-black/10'}`}
            >
              <User className="w-3 h-3" /> Profile
            </button>
          </div>

          <div className="glass px-6 py-4 rounded-3xl flex items-center gap-4">
            <div className="p-3 bg-gold/10 rounded-2xl text-gold">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-black/40">Your Discount Code</div>
              <div className="text-xl font-serif text-gold">{userProfile.discountCode || 'SR-EMP-001'}</div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : activeTab === 'offers' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-serif mb-6 flex items-center gap-2">
                <Tag className="w-5 h-5 text-gold" /> Available Offers
              </h3>
              <div className="space-y-6">
                {discounts.length === 0 ? (
                  <div className="p-12 text-center glass rounded-3xl border-2 border-dashed border-black/5">
                    <Ticket className="w-12 h-12 text-black/10 mx-auto mb-4" />
                    <p className="text-sm text-black/40 uppercase tracking-widest font-bold">No discounts assigned to your profile.</p>
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
                          <p className="text-xs text-black/40 mb-4 uppercase tracking-widest font-bold">{discount.restaurantId}</p>
                        </div>
                        <div className="text-3xl font-serif text-gold">{discount.percentage}%</div>
                      </div>
                      <p className="text-sm text-black/60 font-light mb-6">{discount.description}</p>
                      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-gold">
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
                        <QrCode className="w-8 h-8 text-gold" />
                      </div>
                      <h3 className="text-2xl font-serif mb-2">Redeem Discount</h3>
                      <p className="text-sm text-black/40 uppercase tracking-widest font-bold">Show this screen to the cashier</p>
                    </div>

                    <div className="bg-black/5 rounded-3xl p-6 mb-8 text-center border border-black/5">
                      <div className="text-4xl font-serif text-gold mb-2">{selectedDiscount.percentage}% OFF</div>
                      <div className="text-lg font-serif mb-1">{selectedDiscount.name}</div>
                      <div className="text-xs uppercase tracking-widest text-black/40 font-bold">{selectedDiscount.restaurantId}</div>
                    </div>

                    <div className="space-y-4 mb-8">
                      <div className="flex justify-between text-xs uppercase tracking-widest font-bold text-black/40 border-b border-black/5 pb-2">
                        <span>Employee</span>
                        <span className="text-black">{userProfile.name}</span>
                      </div>
                      <div className="flex justify-between text-xs uppercase tracking-widest font-bold text-black/40 border-b border-black/5 pb-2">
                        <span>Company</span>
                        <span className="text-black">{userProfile.company || 'My Group of Companies'}</span>
                      </div>
                      <div className="flex justify-between text-xs uppercase tracking-widest font-bold text-black/40 border-b border-black/5 pb-2">
                        <span>Code</span>
                        <span className="text-gold">{userProfile.discountCode}</span>
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
                      className="w-full mt-4 text-[10px] uppercase tracking-widest font-bold text-black/20 hover:text-black/60 transition-colors"
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
                      <History className="w-5 h-5 text-gold" /> Recent Usage
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
                              <div className="text-[10px] text-black/40 uppercase tracking-widest font-bold">
                                {log.timestamp?.toDate().toLocaleDateString()}
                              </div>
                            </div>
                            <div className="text-xs font-bold text-gold">REDEEMED</div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
                  className="bg-black text-white px-8 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-gold transition-all flex items-center gap-2 disabled:opacity-50"
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
                  <p className="mt-4 text-[10px] text-black/30 italic uppercase tracking-widest font-bold">Change Photo</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-black/40 mb-3">First Name</label>
                    <input 
                      type="text" 
                      value={personalProfile.firstName || ''}
                      onChange={e => setPersonalProfile({...personalProfile, firstName: e.target.value})}
                      className="w-full bg-black/5 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-gold/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-black/40 mb-3">Last Name</label>
                    <input 
                      type="text" 
                      value={personalProfile.lastName || ''}
                      onChange={e => setPersonalProfile({...personalProfile, lastName: e.target.value})}
                      className="w-full bg-black/5 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-gold/20 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-black/40 mb-3">Display Name</label>
                  <input 
                    type="text" 
                    value={personalProfile.name || ''}
                    onChange={e => setPersonalProfile({...personalProfile, name: e.target.value})}
                    className="w-full bg-black/5 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-gold/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-black/40 mb-3">Mobile Number</label>
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

      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] bg-green-500 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-widest">Discount Redeemed Successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
