/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useRef, FormEvent, ReactNode } from "react";
import { motion, useScroll, useTransform, AnimatePresence, useSpring, useMotionValue, useVelocity } from "motion/react";
import { 
  Home, 
  Car, 
  Hotel, 
  Sparkles, 
  ChevronRight, 
  ArrowUpRight, 
  Menu, 
  X,
  Linkedin,
  History,
  LayoutDashboard,
  Ticket,
  ShieldCheck,
  ArrowUp,
  ExternalLink,
  Calendar,
  MapPin,
  FileText
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { BusinessInfo, fallbackData } from "@/src/types";
import { getBusinessInfo } from "@/src/services/businessService";
import PastVentures from "./components/PastVentures";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";
import EmployeePortal from "./components/EmployeePortal";
import BlogPage from "./components/BlogPage";
import PrivacyPolicy from "./components/PrivacyPolicy";
import TermsOfService from "./components/TermsOfService";
import ErrorBoundary from "./components/ErrorBoundary";
import { auth, db, handleFirestoreError, OperationType, UserProfile } from "./firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot, query, collection, where, getDocs, serverTimestamp, updateDoc, deleteDoc, addDoc, Timestamp, orderBy, limit } from "firebase/firestore";
import { Toaster, toast } from "sonner";

const icons = {
  Home,
  Car,
  Hotel,
  Sparkles
};

const RevealText = ({ children, className = "" }: { children: ReactNode, className?: string }) => {
  return (
    <div className={cn("overflow-hidden", className)}>
      <motion.span
        initial={{ y: "100%" }}
        whileInView={{ y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.6, 0.01, -0.05, 0.95] }}
        className="block"
      >
        {children}
      </motion.span>
    </div>
  );
};

const CompanyModal = ({ company, onClose }: { company: any, onClose: () => void }) => {
  if (!company) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center px-6 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white w-full max-w-2xl rounded-[2rem] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-64 bg-black flex items-center justify-center p-12">
          {company.logo ? (
            <img 
              src={company.logo} 
              alt={company.name} 
              className="max-w-full max-h-full object-contain brightness-0 invert"
              referrerPolicy="no-referrer"
            />
          ) : (
            <h2 className="text-4xl font-serif text-white uppercase tracking-widest">{company.name}</h2>
          )}
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-gold transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-12">
          <div className="flex items-center gap-4 mb-6">
            <span className="px-3 py-1 bg-gold/10 text-gold text-[10px] font-bold uppercase tracking-widest rounded-full">
              Portfolio Asset
            </span>
          </div>
          <h3 className="text-3xl font-serif mb-6">{company.name}</h3>
          <p className="text-black/60 text-lg font-light leading-relaxed mb-8">
            {company.description || "A key part of the Shane Ruddle portfolio, focused on delivering excellence and innovation in its sector."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a 
              href={company.url?.startsWith('http') ? company.url : `https://${company.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-black text-white text-xs uppercase tracking-widest font-bold rounded-full hover:bg-gold transition-all"
            >
              Visit Website <ExternalLink className="w-4 h-4" />
            </a>
            <button 
              onClick={onClose}
              className="flex-1 px-8 py-4 border border-black/10 text-xs uppercase tracking-widest font-bold rounded-full hover:bg-black hover:text-white transition-all"
            >
              Close Details
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const FounderSection = ({ data }: { data: BusinessInfo }) => {
  const founderRef = useRef(null);
  const { scrollYProgress: founderScroll } = useScroll({
    target: founderRef,
    offset: ["start end", "end start"]
  });
  const founderY = useTransform(founderScroll, [0, 1], [0, -100]);

  if (!data.ownerPhotos || data.ownerPhotos.length === 0) return null;

  return (
    <section ref={founderRef} id="about" className="pt-10 pb-16 md:pb-48 px-6 md:px-12 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <motion.div 
              style={{ y: founderY }}
              className="relative aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl"
            >
              <img 
                src={data.ownerPhotos[0]} 
                alt={data.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-12 left-12">
                <h3 className="text-3xl font-serif text-white mb-2">{data.name}</h3>
                <p className="text-white/60 text-sm uppercase tracking-widest">Founder & CEO</p>
              </div>
            </motion.div>
            
            {/* Decorative elements */}
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-gold/5 rounded-full blur-3xl -z-10" />
            <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-gold/10 rounded-full blur-3xl -z-10" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-gold mb-6 block">The Visionary</span>
            <RevealText className="text-3xl sm:text-5xl md:text-7xl font-serif leading-tight mb-12">
              Leading with <span className="italic">Integrity</span>.
            </RevealText>
            <div className="space-y-8 text-black/60 text-lg font-light leading-relaxed">
              <p>{data.about}</p>
            </div>

          </motion.div>
        </div>
      </div>
    </section>
  );
};

const LifeOutsideSection = ({ data }: { data: BusinessInfo }) => {
  const photos = data.ownerPhotos || [];
  return (
    <section id="lifestyle" className="py-16 md:py-32 px-6 md:px-12 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 mb-16">
          <div className="lg:w-1/3">
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-2xl sm:text-4xl font-bold text-black"
            >
              Outside of Business
            </motion.h2>
          </div>
          <div className="lg:w-2/3">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex gap-4 mb-6"
            >
              <span className="text-4xl text-red-600 font-serif leading-none">"</span>
              <p className="text-lg md:text-xl font-light italic text-black/80 leading-relaxed">
                Life isn't all about business. I've always believed that staying active and challenging yourself outside of work helps you show up better inside it.
              </p>
              <span className="text-4xl text-red-600 font-serif leading-none self-end">"</span>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-black/70 text-base font-light leading-relaxed space-y-4"
            >
              <p>
                I used to be a PGA professional golfer, and while I don't play competitively anymore, the game taught me a lot about focus and patience. These days, I run half marathons to stay fit and clear my head, and I've recently started playing padelâwhich has quickly become my new obsession.
              </p>
              <p>
                Whether it's on the course, the track, or the court, I'm always looking for that next challenge.
              </p>
            </motion.div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "Family", img: photos[4] || "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=2070&auto=format&fit=crop" },
            { title: "Sports", img: photos[2] || "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=2070&auto=format&fit=crop" },
            { title: "Team", img: photos[3] || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop" },
            { title: "Friends", img: photos[1] || "https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=2070&auto=format&fit=crop" }
          ].map((item, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="flex flex-col"
            >
              <div className="aspect-[16/9] rounded-lg overflow-hidden mb-3 shadow-sm">
                <img 
                  src={item.img} 
                  alt={item.title} 
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h4 className="text-lg font-bold text-black">{item.title}</h4>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default function App() {
  const [data, setData] = useState<BusinessInfo>(fallbackData);
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [view, setView] = useState<'home' | 'past-ventures' | 'dashboard' | 'portal' | 'blog' | 'privacy-policy' | 'terms-of-service'>('home');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [impersonatedProfile, setImpersonatedProfile] = useState<UserProfile | null>(null);
  const displayProfile = impersonatedProfile || userProfile;
  const isAdmin = displayProfile?.roles?.includes('admin') || 
                  displayProfile?.roles?.includes('accounts') || 
                  displayProfile?.roles?.includes('manager') || 
                  (user?.email && ['shaneruddle@gmail.com', 'alexstein530@gmail.com'].includes(user.email));
  const isWhitelisted = isAdmin ||
                        !!(displayProfile?.company?.trim()) ||
                        !!(displayProfile?.roles?.length);
  const [authLoading, setAuthLoading] = useState(true);
  console.log("App rendering. AuthLoading:", authLoading);
  const [formState, setFormState] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const loginLogged = useRef(false);

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState),
      });
      if (!response.ok) throw new Error('Failed to send message');
      setSubmitted(true);
      toast.success("Thank you very much for getting in touch, I will get back to you as soon as possible. Thank you! Shane Ruddle");
      setFormState({ name: '', email: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      console.error("Error sending contact form:", error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigateTo = (section: string) => {
    if (view !== 'home') {
      setView('home');
      setTimeout(() => {
        const element = document.getElementById(section.toLowerCase());
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(section.toLowerCase());
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsMenuOpen(false);
  };

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.1], [1, 0.95]);

  useEffect(() => {
    async function fetchData() {
      try {
        console.log("Fetching business info...");
        const result = await getBusinessInfo();
        console.log("Business info fetched:", result);
        setData(result);
      } catch (error) {
        // This should rarely happen now as getBusinessInfo has multiple fallbacks
        console.error("Critical failure fetching business info:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as any;
      // ONLY LOG SAFE PROPERTIES TO PREVENT CIRCULAR STRUCTURE ERROR
      console.log('GLOBAL CLICK AT:', e.clientX, e.clientY, 'TARGET TAG:', target?.tagName, 'ID:', target?.id);
    };
    window.addEventListener('click', handleGlobalClick);

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("Auth state changed. User:", firebaseUser?.uid, "Email:", firebaseUser?.email, "AuthLoading:", authLoading);
      setUser(firebaseUser);
      if (!firebaseUser) {
        setUserProfile(null);
        setAuthLoading(false);
        loginLogged.current = false;
      }
    });

    // Safety timeout to ensure auth loading doesn't get stuck
    const authTimeout = setTimeout(() => {
      setAuthLoading(false);
    }, 5000);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      setShowBackToTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      unsubscribe();
      clearTimeout(authTimeout);
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Real-time companies listener - removed to save quota, using initial fetch only
  useEffect(() => {
    // Initial fetch handled by fetchData above
  }, []);

  // Real-time business info listener - removed to save quota
  useEffect(() => {
    // Initial fetch handled by fetchData above
  }, []);

  // Re-fetch data when returning to home view to ensure latest updates are shown
  useEffect(() => {
    if (view === 'home') {
      // We rely on the initial fetch and snapshots for real-time updates
      // No need to force a full re-fetch every time we switch to home view
    }
  }, [view]);

  useEffect(() => {
    if (!user) return;

    setAuthLoading(true);
    const userRef = doc(db, "users", user.uid);
    
    // Use onSnapshot for real-time profile updates
    const unsubProfile = onSnapshot(userRef, 
      async (docSnap) => {
        if (!auth.currentUser) {
          setAuthLoading(false);
          return;
        }
        const hardcodedAdmins = ['shaneruddle@gmail.com', 'alexstein530@gmail.com'];
        if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile & { role?: string };
        console.log("Real-time profile update for:", user.email || user.phoneNumber, data ? 'Data received' : 'No data');
        
        // Migration: convert singular role to roles array if missing
        if (!data.roles && (data as any).role) {
          console.log("Migrating singular role to roles array for:", user.email);
          const roles = [(data as any).role];
          await updateDoc(userRef, {
            roles: roles,
            active: true,
            updatedAt: serverTimestamp()
          });
          // The next onSnapshot trigger will have the migrated data
          return;
        }

        // Migration: ensure active field exists
        if (data.active === undefined) {
          console.log("Migrating active status for:", user.email);
          await updateDoc(userRef, {
            active: true,
            updatedAt: serverTimestamp()
          });
          return;
        }

        // Check if user is active
        if (data.active === false && !hardcodedAdmins.includes(user.email || '')) {
          console.log("Inactive user attempted login:", user.email);
          
          // Log inactive login attempt if not already logged recently (throttled)
          const lastInactiveLog = localStorage.getItem(`last_inactive_log_${user.uid}`);
          const now = Date.now();
          const oneHour = 60 * 60 * 1000;
          
          if (!lastInactiveLog || (now - parseInt(lastInactiveLog)) > oneHour) {
            try {
              addDoc(collection(db, 'usage_logs'), {
                userId: user.uid,
                userName: data.name || 'Unknown',
                userEmail: user.email || null,
                userCompany: data.company || null,
                type: 'auth_error',
                details: 'Login blocked: Account inactive',
                timestamp: serverTimestamp()
              });
              localStorage.setItem(`last_inactive_log_${user.uid}`, now.toString());
            } catch (err) {
              console.error("Error logging inactive attempt:", err);
            }
          }

          toast.info("Your account is pending approval. An administrator will activate your account shortly.");
          await auth.signOut();
          setAuthLoading(false);
          return;
        }

        // Ensure admin has required roles
        if (hardcodedAdmins.includes(user.email || '')) {
          const currentRoles = data.roles || [];
          const requiredRoles = ['admin', 'accounts', 'manager'];
          const missingRoles = requiredRoles.filter(role => !currentRoles.includes(role as any));
          
          if (missingRoles.length > 0) {
            console.log("Ensuring roles for", user.email, ":", missingRoles);
            await updateDoc(userRef, {
              roles: [...currentRoles, ...missingRoles],
              updatedAt: serverTimestamp()
            });
            // Don't log login yet, wait for the next snapshot with updated roles
            return;
          }
        }

        // Check if we need to merge seeded data (if no discounts assigned yet)
        if (!data.discountIds || data.discountIds.length === 0) {
          console.log("Profile has no discounts, checking for seeded data...");
          let q;
          if (user.email) {
            q = query(collection(db, "users"), where("email", "==", user.email));
          } else if (user.phoneNumber) {
            q = query(collection(db, "users"), where("mobile", "==", user.phoneNumber));
          }

          if (q) {
            try {
              const querySnap = await getDocs(q);
              const seededDoc = querySnap.docs.find(d => d.id !== user.uid);
              
              if (seededDoc) {
                const seededData = seededDoc.data() as UserProfile;
                if (seededData.discountIds && seededData.discountIds.length > 0) {
                  console.log("Merging seeded discounts for:", user.email || user.phoneNumber);
                  await updateDoc(userRef, {
                    discountIds: seededData.discountIds,
                    updatedAt: serverTimestamp()
                  });
                  // The next onSnapshot trigger will have the merged data
                  return;
                }
              }
            } catch (err) {
              console.error("Error checking for seeded discounts:", err);
            }
          }
        }

        // Always update lastLoginAt so Staff Directory sort stays current
        updateDoc(userRef, { lastLoginAt: serverTimestamp() }).catch(() => {});

        // Always update lastLoginAt on every login
        if (!loginLogged.current) {
          updateDoc(userRef, { lastLoginAt: serverTimestamp() }).catch(() => {});
        }

        // Log login event throttled to once every 15 mins (to avoid spam in usage_logs)
        const lastLoginTime = localStorage.getItem(`last_login_${user.uid}`);
        const now = Date.now();
        const isThrottled = lastLoginTime && (now - parseInt(lastLoginTime) < 15 * 60 * 1000);

        if (!loginLogged.current && !isThrottled) {
          loginLogged.current = true;
          localStorage.setItem(`last_login_${user.uid}`, now.toString());
          try {
            console.log("Logging login for:", user.email || user.phoneNumber);
            const name = data.name || (data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : data.firstName || data.lastName) || user.email || user.phoneNumber || 'Unknown';
            await addDoc(collection(db, 'usage_logs'), {
              userId: user.uid,
              userName: name,
              userEmail: user.email || null,
              userCompany: data.company || null,
              type: 'login',
              timestamp: serverTimestamp()
            });
          } catch (err) {
            console.error("Error logging login:", err);
            loginLogged.current = false; // Reset on failure to allow retry
            localStorage.removeItem(`last_login_${user.uid}`); // Allow retry on next update
            handleFirestoreError(err, OperationType.WRITE, 'usage_logs');
          }
        } else if (isThrottled) {
          // Still mark as logged for this session even if throttled by localStorage
          loginLogged.current = true;
        }
        
        // Check if user has a company set  any company employee gets access
        const companyName = data.company?.toLowerCase()?.trim();
        const isWhitelisted = !!(companyName);
        
        // If they are whitelisted but have no roles, give them a default employee role
        if (isWhitelisted && (!data.roles || data.roles.length === 0)) {
          data.roles = ['employee'];
          // Don't wait for the update, just update local state
          updateDoc(doc(db, 'users', user.uid), { roles: ['employee'] });
        }
        
        setUserProfile(data);
        if (impersonatedProfile) {
          // If we are currently impersonating and the real profile changes, 
          // we might want to check if we still have permission to impersonate.
          const isAdmin = data.roles?.includes('admin') || user.email === 'shaneruddle@gmail.com';
          if (!isAdmin) {
            setImpersonatedProfile(null);
            toast.error("Impersonation stopped: You no longer have admin privileges.");
          }
        }
        setAuthLoading(false);
      } else {
        console.log("No profile found for UID:", user.uid, "Creating/Claiming...");
        // Initial creation/claiming logic
        let q;
        if (user.email) {
          q = query(collection(db, "users"), where("email", "==", user.email));
        } else if (user.phoneNumber) {
          q = query(collection(db, "users"), where("mobile", "==", user.phoneNumber));
        }

        let seededDoc = null;
        if (q) {
          try {
            const querySnap = await getDocs(q);
            seededDoc = querySnap.docs.find(d => d.id !== user.uid);
          } catch (err) {
            console.error("Error checking for seeded profile:", err);
          }
        }

        if (seededDoc) {
          const seededData = seededDoc.data() as UserProfile;
          console.log("Claiming seeded profile:", seededDoc.id);
          const newProfile: UserProfile = {
            ...seededData,
            uid: user.uid,
            // Respect seeded active status, or default to true if specified or superadmin
            active: seededData.active !== undefined ? seededData.active : true,
            // Keep roles if they exist, otherwise use migrated role or "employee"
            roles: seededData.roles || (seededData as any).role ? [(seededData as any).role] : ["employee"],
            name: user.displayName || seededData.name || "",
            updatedAt: serverTimestamp() as any
          };
          try {
            await setDoc(userRef, newProfile);
            // Clean up the seeded document
            await deleteDoc(doc(db, "users", seededDoc.id));
            console.log("Successfully claimed and deleted seeded profile:", seededDoc.id);
            
            // Log signup event
            await addDoc(collection(db, 'usage_logs'), {
              userId: user.uid,
              userName: newProfile.name,
              userEmail: user.email || null,
              userCompany: newProfile.company || null,
              type: 'signup',
              details: 'User claimed a seeded profile',
              timestamp: serverTimestamp()
            });

            toast.success("Profile claimed successfully");
          } catch (err) {
            console.error("Error claiming profile:", err);
            handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
            toast.error("Failed to claim profile. Please contact support.");
          }
          // onSnapshot will pick this up
        } else {
          console.log("Creating fresh profile for:", user.email || user.phoneNumber);
          const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email || "",
            mobile: user.phoneNumber || "",
            name: user.displayName || "",
            role: hardcodedAdmins.includes(user.email || '') ? "admin" : "employee",
            roles: hardcodedAdmins.includes(user.email || '') ? ["admin", "accounts", "manager"] : ["employee"],
            // New registrations are inactive until approved by an admin (except hardcoded admins)
            active: hardcodedAdmins.includes(user.email || ''),
            discountCode: `SR-EMP-${Math.floor(1000 + Math.random() * 9000)}`,
            createdAt: serverTimestamp() as any,
            updatedAt: serverTimestamp() as any
          };
          try {
            await setDoc(userRef, newProfile);
            console.log("Successfully created fresh profile for:", user.uid);

            // Log signup event
            await addDoc(collection(db, 'usage_logs'), {
              userId: user.uid,
              userName: newProfile.name,
              userEmail: user.email || null,
              userCompany: newProfile.company || null,
              type: 'signup',
              details: 'New user registered',
              timestamp: serverTimestamp()
            });

            toast.success("Account registered! Your account is pending approval by an administrator.");
          } catch (err) {
            console.error("Error creating profile:", err);
            handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
            toast.error("Failed to create profile. Please contact support.");
          }
          // onSnapshot will pick this up
        }
      }
    }, (error) => {
      // Ignore permission errors if the user is logging out or not authenticated
      if (!auth.currentUser) {
        setAuthLoading(false);
        return;
      }
      
      console.error("Profile snapshot error:", error);
      setAuthLoading(false);
      
      if (error.message?.includes('Quota limit exceeded')) {
        toast.error("Daily Firestore read limit reached. Please try again tomorrow.");
        return;
      }

      try {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      } catch (e) {
        // Error already logged by handleFirestoreError
      }
    });

    return () => unsubProfile();
  }, [user]);

  // Login toast notifications removed

  return (
    <ErrorBoundary>
      <Toaster position="top-center" richColors />
      
      {/* Back to Top Button */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-8 right-8 z-[90] w-12 h-12 rounded-full bg-black text-white flex items-center justify-center shadow-2xl hover:bg-gold transition-all group"
          >
            <ArrowUp className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      <div ref={containerRef} className="relative min-h-screen selection:bg-gold selection:text-black bg-white">
        <AnimatePresence>
          {impersonatedProfile && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="fixed top-0 left-0 right-0 z-[20000] bg-gold text-black px-6 py-2 flex items-center justify-between shadow-lg"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  Previewing as: <span className="italic">{impersonatedProfile.name || impersonatedProfile.email}</span> ({impersonatedProfile.roles?.join(', ')})
                </span>
              </div>
              <button 
                onClick={() => {
                  setImpersonatedProfile(null);
                  toast.success("Exited preview mode");
                }}
                className="bg-black text-white px-4 py-1.5 rounded-full text-[8px] font-bold uppercase tracking-widest hover:bg-black/80 transition-all shadow-md"
              >
                Exit Preview
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              key="loader"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-white flex items-center justify-center"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                <span className="text-xs uppercase tracking-[0.4em] text-gold-dark animate-pulse">Shane Ruddle Portfolio</span>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col min-h-screen">
              {/* Navigation - Visible for home, past-ventures, blog, privacy-policy, and terms-of-service */}
              {(view === 'home' || view === 'past-ventures' || view === 'blog' || view === 'privacy-policy' || view === 'terms-of-service') && (
                <>
                  <nav 
                    onClick={() => console.log('NAV CLICKED')}
                    className={cn(
                      "fixed left-0 right-0 z-[10000] flex items-center justify-between transition-all duration-500 pointer-events-auto",
                      impersonatedProfile ? "top-[38px]" : "top-0",
                      isScrolled 
                        ? "px-6 py-4 md:px-12 md:py-4 bg-white/90 backdrop-blur-xl border-b border-black/5 shadow-sm" 
                        : "px-6 py-6 md:px-12 md:py-8 bg-transparent"
                    )}
                  >
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => {
                        setView('home');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      <div className="relative w-10 h-10 shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" className="w-full h-full" role="img" aria-label="Shane Ruddle">
                          <defs>
                            <linearGradient id="navGold" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#F9F295" />
                              <stop offset="45%" stopColor="#D4AF37" />
                              <stop offset="100%" stopColor="#B8860B" />
                            </linearGradient>
                          </defs>
                          <circle cx="60" cy="60" r="57" fill="#0A0A0A" />
                          <circle cx="60" cy="60" r="53" fill="none" stroke="url(#navGold)" strokeWidth="1.2" />
                          <text x="60" y="78" textAnchor="middle" fontSize="58" fontWeight="500" letterSpacing="-2" fill="url(#navGold)" fontFamily="system-ui, sans-serif">SR</text>
                        </svg>
                      </div>
                      <div className="hidden sm:block text-xl font-serif tracking-widest uppercase">
                        Shane <span className="gold-gradient font-bold">Ruddle</span>
                      </div>
                    </motion.div>

                    <div className="hidden md:flex items-center space-x-8">
                      {["About", "Companies", "Values", "Contact"].map((item) => (
                        <button 
                          key={item} 
                          onClick={() => navigateTo(item)}
                          className="text-xs uppercase tracking-[0.2em] text-black/60 hover:text-gold transition-colors"
                        >
                          {item}
                        </button>
                      ))}
                      <button 
                        onClick={() => {
                          setView('past-ventures');
                          window.scrollTo(0, 0);
                        }}
                        className={`text-xs uppercase tracking-[0.2em] transition-colors flex items-center gap-2 ${view === 'past-ventures' ? 'text-gold font-bold' : 'text-black/60 hover:text-gold'}`}
                      >
                        <History className="w-3 h-3" /> Past Ventures
                      </button>
                      
                      {isWhitelisted && (
                        <>
                          <button
                            onClick={() => setView('dashboard')}
                            className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold hover:text-gold-dark transition-colors"
                          >
                            <LayoutDashboard className="w-3 h-3" /> Dashboard
                          </button>
                          <button 
                            onClick={() => setView('portal')}
                            className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold hover:text-gold-dark transition-colors"
                          >
                            <Ticket className="w-3 h-3" /> Discounts
                          </button>
                        </>
                      )}

                      <Auth key="desktop-auth" user={user} loading={authLoading} />
                    </div>

                    <button 
                      className="md:hidden text-black p-2 hover:bg-black/5 rounded-full transition-colors"
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                      {isMenuOpen ? <X /> : <Menu />}
                    </button>
                  </nav>

                  {/* Mobile Menu */}
                  <AnimatePresence>
                    {isMenuOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center space-y-6 overflow-y-auto py-20"
                      >
                        {["About", "Companies", "Values", "Contact"].map((item) => (
                          <button 
                            key={item} 
                            onClick={() => navigateTo(item)}
                            className="text-xl font-serif tracking-widest uppercase text-black hover:text-gold transition-colors"
                          >
                            {item}
                          </button>
                        ))}
                        <button 
                          onClick={() => {
                            setView('past-ventures');
                            setIsMenuOpen(false);
                            window.scrollTo(0, 0);
                          }}
                          className={`text-xl font-serif tracking-widest uppercase transition-colors ${view === 'past-ventures' ? 'text-gold' : 'text-black hover:text-gold'}`}
                        >
                          Past Ventures
                        </button>

                        {isWhitelisted && (
                          <>
                            <button
                              onClick={() => {
                                setView('dashboard');
                                setIsMenuOpen(false);
                                window.scrollTo(0, 0);
                              }}
                              className="text-xl font-serif tracking-widest uppercase text-gold hover:text-gold-dark transition-colors flex items-center gap-3"
                            >
                              <LayoutDashboard className="w-6 h-6" /> Dashboard
                            </button>
                            <button 
                              onClick={() => {
                                setView('portal');
                                setIsMenuOpen(false);
                                window.scrollTo(0, 0);
                              }}
                              className="text-xl font-serif tracking-widest uppercase text-gold hover:text-gold-dark transition-colors flex items-center gap-3"
                            >
                              <Ticket className="w-6 h-6" /> Employee Discounts
                            </button>
                          </>
                        )}

                        <div className="pt-8 border-t border-black/5 w-full flex justify-center">
                          <Auth key="mobile-auth" user={user} loading={authLoading} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}

              <motion.div
                key="main-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn("flex flex-col flex-1", impersonatedProfile && "pt-[38px]")}
              >
                <main className="flex-grow">
                <AnimatePresence mode="wait">
                  {view === 'past-ventures' ? (
                    <motion.div
                      key="past-ventures"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                    >
                      <PastVentures onBack={() => {
                        setView('home');
                        window.scrollTo(0, 0);
                      }} />
                    </motion.div>
                  ) : view === 'dashboard' && displayProfile ? (
                    <motion.div
                      key="dashboard"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.4 }}
                    >
                      <Dashboard 
                        userProfile={displayProfile} 
                        onBack={() => setView('home')} 
                        onImpersonate={(profile) => {
                          const isRealAdmin = userProfile?.roles?.includes('admin') || user?.email === 'shaneruddle@gmail.com';
                          if (isRealAdmin) {
                            setImpersonatedProfile(profile);
                            toast.success(`Now viewing as ${profile.name || profile.email}`);
                            setIsMenuOpen(false);
                          } else {
                            toast.error("Only administrators can impersonate users.");
                          }
                        }}
                      />
                    </motion.div>
                  ) : view === 'portal' && displayProfile ? (
                    <motion.div
                      key="portal"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.4 }}
                    >
                      <EmployeePortal userProfile={displayProfile} onBack={() => setView('home')} />
                    </motion.div>
                  ) : view === 'blog' ? (
                    <motion.div
                      key="blog"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                    >
                      <BlogPage onBack={() => {
                        setView('home');
                        window.scrollTo(0, 0);
                      }} />
                    </motion.div>
                  ) : view === 'privacy-policy' ? (
                    <motion.div
                      key="privacy-policy"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                    >
                      <PrivacyPolicy onBack={() => {
                        setView('home');
                        window.scrollTo(0, 0);
                      }} />
                    </motion.div>
                  ) : view === 'terms-of-service' ? (
                    <motion.div
                      key="terms-of-service"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                    >
                      <TermsOfService onBack={() => {
                        setView('home');
                        window.scrollTo(0, 0);
                      }} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="home"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8 }}
                    >
                      {/* Background Atmosphere */}
                      <div className="fixed inset-0 -z-10 overflow-hidden">
                        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-gold/5 blur-[120px]" />
                        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-gold/2 blur-[120px]" />
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
                      </div>

                      {/* Hero Section */}
                      <section className="relative h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden">
                        <motion.div style={{ opacity, scale }} className="max-w-4xl">
                          <motion.span 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xs md:text-sm uppercase tracking-[0.4em] text-gold mb-6 block"
                          >
                            Entrepreneurship  WITH HEART & HUSTLE
                          </motion.span>
                          <RevealText className="text-3xl sm:text-5xl md:text-8xl font-serif font-light leading-tight mb-8">
                            {data.name} <br />
                            <span className="italic font-extralight text-black/20">Enterprises</span>
                          </RevealText>
                          <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="text-lg md:text-xl text-black/60 font-light max-w-2xl mx-auto mb-12"
                          >
                            Shane Ruddle companies: investing in people, places, and potential.
                          </motion.p>
                          <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                            className="flex flex-col md:flex-row items-center justify-center gap-6"
                          >
                            <a 
                              href="#companies"
                              className="group flex items-center gap-2 px-8 py-4 bg-black text-white text-xs uppercase tracking-[0.2em] font-bold rounded-full hover:bg-gold transition-all"
                            >
                              Explore Portfolio <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </a>
                            <a 
                              href="#about"
                              className="text-xs uppercase tracking-[0.2em] text-black/40 hover:text-gold transition-colors"
                            >
                              My Story
                            </a>
                          </motion.div>
                        </motion.div>

                        <motion.div 
                          animate={{ y: [0, 10, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                        >
                          <span className="text-[10px] uppercase tracking-[0.3em] text-black/20">Scroll</span>
                          <div className="w-px h-12 bg-gradient-to-b from-black/20 to-transparent" />
                        </motion.div>
                      </section>

                      {/* Founder Section */}
                      {/* Founder Section */}
                      <FounderSection data={data} />

                      {/* Companies Section (Logo Cloud) */}
                      <section id="companies" className="py-16 md:py-48 px-6 md:px-12 bg-[#F8F8F8] overflow-hidden">
                        <div className="max-w-7xl mx-auto">
                          <div className="grid lg:grid-cols-12 gap-12 items-end mb-24">
                            <div className="lg:col-span-8">
                              <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                              >
                                <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-gold mb-6 block">My Portfolio</span>
                                <RevealText className="text-3xl sm:text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9] text-black">
                                  INVESTING IN <br />
                                  <span className="text-black/20">POTENTIAL.</span>
                                </RevealText>
                              </motion.div>
                            </div>
                            <div className="lg:col-span-4">
                              <motion.p 
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 }}
                                className="text-black/60 text-lg font-light leading-relaxed"
                              >
                                A diverse ecosystem of businesses built on the foundation of heart, hustle, and high-performance standards.
                              </motion.p>
                            </div>
                          </div>

                          {/* Logo Grid - "Brand Wall" Style */}
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-black/[0.08] border border-black/[0.08] overflow-hidden rounded-[2.5rem] shadow-2xl shadow-black/5">
                            {(() => {
                              const companies = Array.isArray(data.companies) ? data.companies : [];
                              return companies.map((company, index) => (
                                <motion.div
                                  key={company.name}
                                  initial={{ opacity: 0 }}
                                  whileInView={{ opacity: 1 }}
                                  viewport={{ once: true }}
                                  transition={{ delay: index * 0.05 }}
                                  onClick={() => setSelectedCompany(company)}
                                  className="group relative bg-white aspect-[4/3] flex items-center justify-center p-8 md:p-12 transition-all duration-700 hover:bg-black cursor-pointer"
                                >
                                  <div className="relative z-10 w-full h-full flex items-center justify-center">
                                    {company.logo ? (
                                      <img 
                                        src={(() => {
                                          const logo = company.logo.trim();
                                          if (logo.startsWith('data:')) return logo.replace(/\s/g, '');
                                          if (logo.startsWith('http')) return logo;
                                          return `/${logo}`;
                                        })()} 
                                        alt={company.name} 
                                        className="max-w-full max-h-full object-contain transition-all duration-700 group-hover:invert group-hover:brightness-200 group-hover:scale-110"
                                        referrerPolicy="no-referrer"
                                        onError={(e) => {
                                          console.error(`Failed to load logo for ${company.name}`);
                                          (e.target as HTMLImageElement).style.display = 'none';
                                          const fallback = (e.target as HTMLImageElement).nextElementSibling;
                                          if (fallback) (fallback as HTMLElement).style.display = 'flex';
                                        }}
                                      />
                                    ) : null}
                                    <div className={`${company.logo ? 'hidden' : 'flex'} items-center justify-center w-full h-full text-[9px] font-mono font-bold uppercase tracking-[0.3em] text-black/20 group-hover:text-gold transition-colors text-center leading-relaxed`}>
                                      {company.name}
                                    </div>
                                  </div>
                                  
                                  {/* Hover Info */}
                                  <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                  <div className="absolute bottom-6 left-6 right-6 z-20 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em]">
                                        View Details
                                      </span>
                                      <ArrowUpRight className="w-4 h-4 text-gold" />
                                    </div>
                                  </div>
                                </motion.div>
                              ));
                            })()}
                          </div>
                        </div>
                      </section>

                      {/* Outside of Business Section */}
                      <LifeOutsideSection data={data} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </main>

              <AnimatePresence>
                {selectedCompany && (
                  <CompanyModal 
                    company={selectedCompany} 
                    onClose={() => setSelectedCompany(null)} 
                  />
                )}
              </AnimatePresence>

              {/* Shared Footer - Visible for home, past-ventures, blog, privacy-policy, and terms-of-service */}
              {(view === 'home' || view === 'past-ventures' || view === 'blog' || view === 'privacy-policy' || view === 'terms-of-service') && (
                <footer id="contact" className="pt-16 md:pt-24 pb-12 px-6 md:px-12 border-t border-black/10 bg-white">
                  <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 mb-12 md:mb-24">
                      <div className="md:col-span-3">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="relative w-12 h-12 shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" className="w-full h-full" role="img" aria-label="Shane Ruddle">
                              <defs>
                                <linearGradient id="footerGold" x1="0" y1="0" x2="1" y2="1">
                                  <stop offset="0%" stopColor="#F9F295" />
                                  <stop offset="45%" stopColor="#D4AF37" />
                                  <stop offset="100%" stopColor="#B8860B" />
                                </linearGradient>
                              </defs>
                              <circle cx="60" cy="60" r="57" fill="#0A0A0A" />
                              <circle cx="60" cy="60" r="53" fill="none" stroke="url(#footerGold)" strokeWidth="1.2" />
                              <text x="60" y="78" textAnchor="middle" fontSize="58" fontWeight="500" letterSpacing="-2" fill="url(#footerGold)" fontFamily="system-ui, sans-serif">SR</text>
                            </svg>
                          </div>
                          <div className="text-2xl font-serif tracking-widest uppercase">
                            Shane <span className="gold-gradient font-bold">Ruddle</span>
                          </div>
                        </div>
                        <p className="text-black/40 font-light max-w-sm mb-8">
                          A legacy of trust and excellence in the heart of Pattaya. Connecting global clients with local opportunities.
                        </p>
                        <div className="flex gap-4">
                          {[Linkedin].map((Icon, i) => (
                            <a key={i} href="https://www.linkedin.com/in/shaneruddle/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center hover:border-gold hover:text-gold transition-all">
                              <Icon className="w-4 h-4" />
                            </a>
                          ))}
                        </div>
                      </div>
                      
                      <div className="md:col-span-2">
                        <h5 className="text-xs uppercase tracking-[0.2em] font-bold mb-8">Navigation</h5>
                        <ul className="space-y-4">
                          {["About", "Companies", "Values", "Contact"].map((item) => (
                            <li key={item}>
                              <button 
                                onClick={() => navigateTo(item)} 
                                className="text-sm text-black/40 hover:text-gold transition-colors font-light text-left"
                              >
                                {item}
                              </button>
                            </li>
                          ))}
                          <li>
                            <button 
                              onClick={() => {
                                setView('past-ventures');
                                window.scrollTo(0, 0);
                              }}
                              className="text-sm text-black/40 hover:text-gold transition-colors font-light"
                            >
                              Past Ventures
                            </button>
                          </li>
                          {(displayProfile?.roles?.includes('admin') || 
                            displayProfile?.roles?.includes('accounts') || 
                            displayProfile?.roles?.includes('manager') || 
                            (user?.email && ['shaneruddle@gmail.com', 'alexstein530@gmail.com'].includes(user?.email)) || 
                            !!(displayProfile?.company?.trim())) && (
                            <li>
                              <button 
                                onClick={() => {
                                  setView('dashboard');
                                  window.scrollTo(0, 0);
                                }}
                                className="text-sm text-gold hover:text-gold-dark transition-colors font-bold uppercase tracking-widest mt-4 flex items-center gap-2"
                              >
                                <LayoutDashboard className="w-3 h-3" />
                                Dashboard
                              </button>
                            </li>
                          )}
                        </ul>
                      </div>

                      <div className="md:col-span-2">
                        <h5 className="text-xs uppercase tracking-[0.2em] font-bold mb-8">Contact</h5>
                        <ul className="space-y-4 text-sm text-black/40 font-light">
                          <li>Pattaya City, Chon Buri</li>
                          <li>Thailand</li>
                        </ul>
                      </div>

                      <div className="md:col-span-5">
                        <h5 className="text-xs uppercase tracking-[0.2em] font-bold mb-8">Get in Touch</h5>
                        <AnimatePresence mode="wait">
                          {submitted ? (
                            <motion.div 
                              key="success-message"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="p-8 bg-gold/5 border border-gold/20 rounded-[24px] text-center"
                            >
                              <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Sparkles className="w-6 h-6 text-gold" />
                              </div>
                              <p className="text-sm text-black/60 font-light leading-relaxed mb-8">
                                Thank you very much for getting in touch, I will get back to you as soon as possible. Thank you! Shane Ruddle
                              </p>
                              <button 
                                onClick={() => setSubmitted(false)}
                                className="text-[10px] uppercase tracking-widest font-bold text-gold hover:text-gold-dark transition-colors"
                              >
                                Send another message
                              </button>
                            </motion.div>
                          ) : (
                            <motion.form 
                              key="contact-form"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              onSubmit={handleFormSubmit} 
                              className="space-y-4"
                            >
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <input 
                                  type="text" 
                                  placeholder="Name"
                                  required
                                  value={formState.name}
                                  onChange={(e) => setFormState({...formState, name: e.target.value})}
                                  className="bg-black/[0.02] border border-black/10 rounded-lg px-4 py-3 text-sm font-light focus:outline-none focus:border-gold transition-colors w-full"
                                />
                                <input 
                                  type="email" 
                                  placeholder="Email"
                                  required
                                  value={formState.email}
                                  onChange={(e) => setFormState({...formState, email: e.target.value})}
                                  className="bg-black/[0.02] border border-black/10 rounded-lg px-4 py-3 text-sm font-light focus:outline-none focus:border-gold transition-colors w-full"
                                />
                              </div>
                              <textarea 
                                placeholder="Message"
                                required
                                rows={4}
                                value={formState.message}
                                onChange={(e) => setFormState({...formState, message: e.target.value})}
                                className="bg-black/[0.02] border border-black/10 rounded-lg px-4 py-3 text-sm font-light focus:outline-none focus:border-gold transition-colors w-full resize-none"
                              />
                              <button 
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-gold text-black font-bold py-3 rounded-lg text-xs uppercase tracking-widest hover:bg-black hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isSubmitting ? "Sending..." : "Send Message"}
                              </button>
                            </motion.form>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center pt-8 md:pt-12 border-t border-black/5 gap-6">
                      <div className="text-[10px] uppercase tracking-widest text-black/20">
                        Â© 2026 Shane Ruddle. All Rights Reserved.
                      </div>
                      <div className="flex gap-8 text-[10px] uppercase tracking-widest text-black/20">
                        <button 
                          onClick={() => {
                            setView('privacy-policy');
                            window.scrollTo(0, 0);
                          }}
                          className="hover:text-gold transition-colors"
                        >
                          Privacy Policy
                        </button>
                        <button 
                          onClick={() => {
                            setView('terms-of-service');
                            window.scrollTo(0, 0);
                          }}
                          className="hover:text-gold transition-colors"
                        >
                          Terms of Service
                        </button>
                      </div>
                    </div>
                  </div>
                </footer>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  </ErrorBoundary>
);
}
