/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useRef, FormEvent, ReactNode, lazy, Suspense, Component } from "react";
import { preloaded } from "./lib/preload";
import { motion, AnimatePresence } from "motion/react";
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
  Ticket,
  ShieldCheck,
  ArrowUp,
  ExternalLink,
  Calendar,
  MapPin,
  FileText,
  LogIn,
  LogOut,
  LayoutDashboard,
  Compass,
  Calculator,
  Stamp,
  Scale,
  Briefcase,
  MessageCircleQuestion
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { BusinessInfo, fallbackData } from "@/src/types";
import ErrorBoundary from "./components/ErrorBoundary";
import NewsletterSignup from "./components/NewsletterSignup";
import { SOCIAL_LINKS } from "./components/socialLinks";
import { handleLinkClick } from "./lib/navigation";
import { PAGE_META, applyPageMeta } from "./seo";
import { trackPageView } from "./lib/analytics";
import HomePage from "./components/HomePage";
// Lazy so every article's text stays out of the main bundle; main.tsx preloads it on /guides
// pages to avoid a blank frame over the prerendered guide.
const GuidePageLazy = lazy(() => import("./components/GuidePage"));
const GuidePage = (props: { path: string }) => {
  const Preloaded = preloaded.GuidePage;
  return Preloaded ? <Preloaded {...props} /> : <GuidePageLazy {...props} />;
};
const PastVentures = lazy(() => import("./components/PastVentures"));
const AboutPage = lazy(() => import("./components/AboutPage"));
const BusinessesPage = lazy(() => import("./components/BusinessesPage"));
const NewsletterPage = lazy(() => import("./components/NewsletterPage"));
const ContactPage = lazy(() => import("./components/ContactPage"));
const CostCalculator = lazy(() => import("./components/CostCalculator"));
const AreasPage = lazy(() => import("./components/AreasPage"));
const VisasPage = lazy(() => import("./components/VisasPage"));
const SchoolsPage = lazy(() => import("./components/SchoolsPage"));
const MovePlanner = lazy(() => import("./components/MovePlanner"));
const CountryPage = lazy(() => import("./components/CountryPage"));
const QuestionsPage = lazy(() => import("./components/QuestionsPage"));
const BusinessCheck = lazy(() => import("./components/BusinessCheck"));
const BuyingBusinessPage = lazy(() => import("./components/BuyingBusinessPage"));
const SellBusinessPage = lazy(() => import("./components/SellBusinessPage"));
const WorkPage = lazy(() => import("./components/WorkPage"));
const PricesPage = lazy(() => import("./components/PricesPage"));
const FuturePage = lazy(() => import("./components/FuturePage"));
const TripsPage = lazy(() => import("./components/TripsPage"));
const DeSite = lazy(() => import("./components/de/DeSite"));
const GermanBanner = lazy(() => import("./components/de/GermanBanner"));
const EmployeePortal = lazy(() => import("./components/EmployeePortal"));
const BlogPage = lazy(() => import("./components/BlogPage"));
// Use the copy main.tsx preloaded on article pages, so there is no blank loading frame.
const BlogPageView = (props: { onBack: () => void }) => {
  const Preloaded = preloaded.BlogPage;
  return Preloaded ? <Preloaded {...props} /> : <BlogPage {...props} />;
};
const PrivacyPolicy = lazy(() => import("./components/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./components/TermsOfService"));
const Auth = lazy(() => import("./components/Auth"));
// Types only - erased at compile time, so these don't pull the Firebase SDKs into the bundle.
import type { UserProfile } from "./firebase";
import type { User as FirebaseUser } from "firebase/auth";
import { Toaster, toast } from "sonner";

// Firebase (auth + Firestore) and the business-info service are loaded on demand rather than
// imported at the top of this file. Together they're ~1MB of the production bundle, and
// pulling them in eagerly blocks the very first paint of the homepage. Kicking off the import
// here (module load time) lets the browser fetch/parse them in the background while React
// renders the initial UI from cached/fallback data; every use below awaits this same promise,
// which resolves instantly after the first time.
let firebaseReady: Promise<any> | null = null;

// Homepage content is bundled (see fallbackData in types.ts). The old Firestore-backed cache
// held ~770KB of base64 images; remove it so it stops costing localStorage/parse time.
try { localStorage.removeItem('shane_ruddle_business_info_v3'); } catch { /* ignore */ }

// Firebase (~700KB) is only loaded for people who have signed in before on this device, or
// when someone clicks "Employee Login". Anonymous visitors never download it.
const SESSION_HINT_KEY = 'sr_has_session';
function hasSessionHint(): boolean {
  try {
    if (localStorage.getItem(SESSION_HINT_KEY)) return true;
    return Object.keys(localStorage).some(k => k.startsWith('last_login_'));
  } catch {
    return false;
  }
}

function loadFirebase() {
  // This starts only after React has painted the fallback homepage, keeping the
  // first visit responsive even on slower mobile connections.
  firebaseReady ??= Promise.all([
    import("./firebase"),
    import("firebase/auth"),
    import("firebase/firestore"),
  ]).then(([fb, fbAuth, fbFirestore]) => ({
    auth: fb.auth,
    db: fb.db,
    handleFirestoreError: fb.handleFirestoreError,
    OperationType: fb.OperationType,
    onAuthStateChanged: fbAuth.onAuthStateChanged,
    doc: fbFirestore.doc,
    setDoc: fbFirestore.setDoc,
    onSnapshot: fbFirestore.onSnapshot,
    query: fbFirestore.query,
    collection: fbFirestore.collection,
    where: fbFirestore.where,
    getDocs: fbFirestore.getDocs,
    serverTimestamp: fbFirestore.serverTimestamp,
    updateDoc: fbFirestore.updateDoc,
    deleteDoc: fbFirestore.deleteDoc,
    addDoc: fbFirestore.addDoc,
  }));
  return firebaseReady;
}

// If the lazy-loaded Auth widget fails to load (e.g. a network hiccup, an ad-blocker, or a
// genuine Firebase outage), this keeps that failure contained to the login button instead of
// letting it bubble up through Suspense and take down the whole homepage via the top-level
// ErrorBoundary.
// Lightweight stand-in for the Auth widget so the homepage doesn't load Firebase up front.
const LoginButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex items-center gap-2 px-6 py-2 bg-gold text-black text-xs font-bold uppercase tracking-widest rounded-full hover:bg-gold-dark transition-all shadow-lg shadow-gold/20 cursor-pointer whitespace-nowrap"
  >
    <LogIn className="w-4 h-4" />
    Employee Login
  </button>
);

class SilentErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.error('Auth widget failed to load:', error?.message || String(error));
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

const icons = {
  Home,
  Car,
  Hotel,
  Sparkles
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

// URL routing. Each view has a real path so pages can be linked, shared and indexed.
// Firebase Hosting rewrites every path to index.html, so the app resolves the view here.
type View = 'home' | 'about' | 'businesses' | 'newsletter' | 'contact' | 'cost-calculator' | 'past-ventures' | 'portal' | 'blog' | 'guides' | 'areas' | 'visas' | 'schools' | 'move' | 'country' | 'questions' | 'business' | 'work' | 'prices' | 'future' | 'trips' | 'de' | 'privacy-policy' | 'terms-of-service';

const VIEW_PATHS: Record<View, string> = {
  'home': '/',
  'about': '/about',
  'businesses': '/businesses',
  'newsletter': '/newsletter',
  'contact': '/contact',
  'cost-calculator': '/cost-of-living-calculator',
  'past-ventures': '/past-ventures',
  'portal': '/portal',
  'blog': '/articles',
  'guides': '/guides',
  'areas': '/areas',
  'visas': '/thai-visas',
  'schools': '/international-schools-pattaya',
  'move': '/move-to-thailand',
  'country': '/move-to-thailand/from-the-uk',
  'questions': '/questions',
  'business': '/business-in-pattaya',
  'work': '/work-in-pattaya',
  'prices': '/pattaya-prices',
  'future': '/pattaya-future',
  'trips': '/trips-from-pattaya',
  'de': '/de',
  'privacy-policy': '/privacy',
  'terms-of-service': '/terms',
};

// Public navigation (header, mobile menu, footer).
// Quick tools shown as tiles in the mobile menu (the desktop bar has no room for them).
const MENU_TOOLS: { label: string; href: string; Icon: typeof Home }[] = [
  { label: 'Plan my move', href: '/move-to-thailand', Icon: Compass },
  { label: 'Cost of living', href: '/cost-of-living-calculator', Icon: Calculator },
  { label: 'Visa finder', href: '/thai-visas', Icon: Stamp },
  { label: 'Fair prices', href: '/pattaya-prices', Icon: Scale },
  { label: 'Work here', href: '/work-in-pattaya', Icon: Briefcase },
  { label: 'Questions', href: '/questions', Icon: MessageCircleQuestion },
];
const MENU_COUNTRIES: { label: string; href: string }[] = [
  { label: 'UK', href: '/move-to-thailand/from-the-uk' },
  { label: 'USA', href: '/move-to-thailand/from-the-usa' },
  { label: 'Australia', href: '/move-to-thailand/from-australia' },
];

const NAV_LINKS: { label: string; view: View }[] = [
  { label: 'Start here', view: 'guides' },
  { label: 'Areas', view: 'areas' },
  { label: 'Visas', view: 'visas' },
  { label: 'About', view: 'about' },
  { label: 'Businesses', view: 'businesses' },
  { label: 'Articles', view: 'blog' },
  { label: 'Past Ventures', view: 'past-ventures' },
  { label: 'Contact', view: 'contact' },
];

// Footer link columns. The desktop top bar is full, so every public page is linked from here.
const FOOTER_COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  { title: 'Moving here', links: [
    { label: 'Start here', href: '/guides' },
    { label: 'Plan my move', href: '/move-to-thailand' },
    { label: 'From the UK', href: '/move-to-thailand/from-the-uk' },
    { label: 'From the USA', href: '/move-to-thailand/from-the-usa' },
    { label: 'From Australia', href: '/move-to-thailand/from-australia' },
    { label: 'Areas', href: '/areas' },
    { label: 'Visas', href: '/thai-visas' },
    { label: 'Schools', href: '/international-schools-pattaya' },
    { label: 'Cost of living', href: '/cost-of-living-calculator' },
  ] },
  { title: 'Tools & answers', links: [
    { label: 'Questions', href: '/questions' },
    { label: 'Fair prices', href: '/pattaya-prices' },
    { label: 'Trips from Pattaya', href: '/trips-from-pattaya' },
    { label: "Pattaya's future", href: '/pattaya-future' },
    { label: 'Work in Pattaya', href: '/work-in-pattaya' },
    { label: 'Articles', href: '/articles' },
  ] },
  { title: 'Business', links: [
    { label: 'Business check', href: '/business-in-pattaya' },
    { label: 'Buying a business', href: '/business-in-pattaya/buying-a-business' },
    { label: 'Sell your business', href: '/business-in-pattaya/sell-your-business' },
    { label: 'Businesses', href: '/businesses' },
    { label: 'Past Ventures', href: '/past-ventures' },
  ] },
  { title: 'Shane', links: [
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Newsletter', href: '/newsletter' },
    { label: 'Deutsch', href: '/de' },
  ] },
];

const FOOTER_BUSINESSES: { label: string; href: string }[] = [
  { label: 'Hemingways Jomtien', href: 'https://www.hemingwaysjomtien.com' },
  { label: 'Hemingways Pattaya', href: 'https://www.hemingwayspattaya.com' },
  { label: 'Hemingways Lakeside', href: 'https://www.hemingwayslakeside.com' },
  { label: 'Cajun Life Cafe', href: 'https://www.cajunlifecafe.com' },
  { label: 'Pattaya Rent a Car', href: 'https://www.pattayarentacar.com' },
  { label: 'Alan Bolton Property Consultants', href: 'https://www.pattaya-property.net' },
  { label: 'East Coast Real Estate', href: 'https://www.thaiproperty.com' },
];

function routeFromPath(pathname: string): { view: View } {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path.startsWith('/articles')) return { view: 'blog' };
  if (path === '/de' || path.startsWith('/de/')) return { view: 'de' };
  if (path === '/guides' || path.startsWith('/guides/')) return { view: 'guides' };
  if (path === '/areas' || path.startsWith('/areas/')) return { view: 'areas' };
  if (path === '/thai-visas' || path.startsWith('/thai-visas/')) return { view: 'visas' };
  if (path === '/international-schools-pattaya' || path.startsWith('/international-schools-pattaya/')) return { view: 'schools' };
  if (path.startsWith('/move-to-thailand/')) return { view: 'country' };
  if (path === '/inbox' || path.startsWith('/inbox/') || path === '/portal') return { view: 'portal' };
  if (path === '/questions' || path.startsWith('/questions/')) return { view: 'questions' };
  if (path === '/business-in-pattaya/buying-a-business' || path === '/business-in-pattaya/sell-your-business') return { view: 'business' };
  const view = (Object.keys(VIEW_PATHS) as View[]).find(v => VIEW_PATHS[v] === path);
  return { view: view || 'home' };
}

const initialRoute = routeFromPath(window.location.pathname);
const startsOnPortal = initialRoute.view === 'portal';
// Shane, when signed in, lands on his dashboard instead of the homepage. The hint is set once his
// account has loaded on this device, so the homepage doesn't flash first on later visits.
const OWNER_HOME_KEY = 'sr_owner_dashboard';
const SHANE_UID = 'u7ElWXIkdjVTNTp76LcyXnnq3AM2';
const startsOnHome = window.location.pathname === '/';
const ownerHomeHint = (() => { try { return startsOnHome && !!localStorage.getItem(OWNER_HOME_KEY); } catch { return false; } })();
// Home-screen shortcuts for Shane's private areas: /portal?tab=circle and the Inbox app at /inbox. Swap in that
// manifest and icon so "Add to Home Screen" saves an icon that opens straight to it. Both only open for Shane's account.
// /portal?tab=reminders was the Inbox's first address, so old home-screen icons are sent to /inbox.
if (window.location.pathname === '/portal' && new URLSearchParams(window.location.search).get('tab') === 'reminders') {
  window.history.replaceState(null, '', '/inbox');
}
const LAUNCH_TABS = {
  circle: { manifest: '/circle.webmanifest', title: 'Circle', icon: '/apple-touch-icon.png' },
  inbox: { manifest: '/inbox.webmanifest', title: 'Reminders', icon: '/inbox-touch-icon.png' },
} as const;
const launchTab: keyof typeof LAUNCH_TABS | undefined = window.location.pathname === '/inbox' || window.location.pathname.startsWith('/inbox/') ? 'inbox'
  : startsOnPortal && new URLSearchParams(window.location.search).get('tab') === 'circle' ? 'circle' : undefined;
if (launchTab) {
  const t = LAUNCH_TABS[launchTab];
  document.querySelector('link[rel="manifest"]')?.setAttribute('href', t.manifest);
  document.querySelector('meta[name="apple-mobile-web-app-title"]')?.setAttribute('content', t.title);
  document.querySelector('link[rel="apple-touch-icon"]')?.setAttribute('href', t.icon);
}

export default function App() {
  const [data, setData] = useState<BusinessInfo>(fallbackData);
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [view, setViewState] = useState<View>(initialRoute.view);
  // Current URL path; changes drive analytics page views.
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);
  const setView = (next: View) => {
    setViewState(next);
    if (window.location.pathname !== VIEW_PATHS[next]) {
      window.history.pushState(null, '', VIEW_PATHS[next]);
    }
    setCurrentPath(VIEW_PATHS[next]);
  };
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [impersonatedProfile, setImpersonatedProfile] = useState<UserProfile | null>(null);
  const displayProfile = impersonatedProfile || userProfile;
  // Public nav/footer show everywhere except inside the signed-in portal (they also carry the login button).
  // The German edition (/de) brings its own German header and footer.
  const showPublicChrome = view !== 'de' && (view !== 'portal' || !displayProfile);
  // Offer the German version to visitors whose browser prefers German (only on pages that have one).
  const [prefersGerman] = useState(() => typeof navigator !== 'undefined' && /^de\b/i.test(navigator.language || ''));
  const isAdmin = displayProfile?.roles?.includes('admin') || 
                  displayProfile?.roles?.includes('accounts') || 
                  displayProfile?.roles?.includes('manager') || 
                  (user?.email && ['shaneruddle@gmail.com', 'alexstein530@gmail.com'].includes(user.email));
  const isWhitelisted = isAdmin ||
                        !!(displayProfile?.company?.trim()) ||
                        !!(displayProfile?.roles?.length);
  // Landing directly on /portal starts auth straight away and, for first-time visitors, opens the login.
  const [authActive, setAuthActive] = useState<boolean>(() => hasSessionHint() || startsOnPortal);
  const [openLoginOnReady, setOpenLoginOnReady] = useState(() => startsOnPortal && !hasSessionHint());
  const [authLoading, setAuthLoading] = useState<boolean>(authActive);
  // True until we know whether this homepage visit should jump to Shane's dashboard.
  const [ownerRedirectPending, setOwnerRedirectPending] = useState(startsOnHome);
  // Which private area the portal opens on: a home-screen shortcut, or Reminders when Shane lands from the homepage.
  const [portalTab, setPortalTab] = useState<typeof launchTab>(launchTab);
  useEffect(() => { if (view !== 'portal') setPortalTab(undefined); }, [view]);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const loginLogged = useRef(false);
  const lastLoginAtUpdated = useRef(false);
  const discountsChecked = useRef(false);

  // Stop the page behind the mobile menu from scrolling while it's open.
  useEffect(() => {
    if (!isMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isMenuOpen]);

  // One analytics page view per URL (skipped on the staff portal and outside production).
  useEffect(() => {
    trackPageView();
  }, [currentPath]);

  // Keep the tab title and meta description in step with the current page (articles set their own).
  useEffect(() => {
    const meta = PAGE_META[VIEW_PATHS[view]];
    if (meta && view !== 'guides' && !(view === 'blog' && window.location.pathname !== '/articles')) applyPageMeta(meta);
  }, [view]);

  // Browser back/forward, and in-app links (they push a path and dispatch popstate).
  useEffect(() => {
    const handlePopState = () => {
      setViewState(routeFromPath(window.location.pathname).view);
      setCurrentPath(window.location.pathname);
      setIsMenuOpen(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      setShowBackToTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      isMounted = false;
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Start the Firebase auth listener only when needed (returning user or login click).
  useEffect(() => {
    if (!authActive) return;
    let isMounted = true;
    let unsubscribeAuth = () => {};
    setAuthLoading(true);
    const start = () => {
      loadFirebase().then(({ auth, onAuthStateChanged }) => {
        if (!isMounted) return;
        unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
          setUser(firebaseUser);
          try {
            if (firebaseUser) localStorage.setItem(SESSION_HINT_KEY, '1');
            else { localStorage.removeItem(SESSION_HINT_KEY); localStorage.removeItem(OWNER_HOME_KEY); }
          } catch { /* ignore */ }
          if (!firebaseUser) {
            setUserProfile(null);
            setAuthLoading(false);
            loginLogged.current = false;
          }
        });
      }).catch(() => isMounted && setAuthLoading(false));
    };
    // Returning users: wait until the page is idle so the homepage paints first.
    const w = window as any;
    const idleId = (openLoginOnReady || startsOnPortal || ownerHomeHint) ? (start(), 0) : (w.requestIdleCallback ? w.requestIdleCallback(start, { timeout: 2000 }) : window.setTimeout(start, 800));
    const authTimeout = window.setTimeout(() => isMounted && setAuthLoading(false), 5000);
    return () => {
      isMounted = false;
      unsubscribeAuth();
      if (idleId) (w.cancelIdleCallback ? w.cancelIdleCallback(idleId) : clearTimeout(idleId));
      clearTimeout(authTimeout);
    };
  }, [authActive]);

  // Opening shaneruddle.com while signed in as Shane goes straight to his Reminders app (once per page load,
  // and only if he's still on the homepage, so "Website" from the dashboard still shows the public site).
  useEffect(() => {
    if (!ownerRedirectPending) return;
    const isShane = !!userProfile && (userProfile.uid === SHANE_UID || userProfile.email?.toLowerCase() === 'shaneruddle@gmail.com');
    if (isShane) {
      try { localStorage.setItem(OWNER_HOME_KEY, '1'); } catch { /* ignore */ }
      if (view === 'home' && window.location.pathname === '/') {
        setPortalTab('inbox');
        setViewState('portal');
        window.history.replaceState(null, '', '/inbox');
        setCurrentPath('/inbox');
      }
      setOwnerRedirectPending(false);
    } else if (userProfile || !authLoading || view !== 'home') {
      if (userProfile) { try { localStorage.removeItem(OWNER_HOME_KEY); } catch { /* ignore */ } }
      setOwnerRedirectPending(false);
    }
  }, [ownerRedirectPending, userProfile, authLoading, view]);

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

    let isMounted = true;
    let unsubProfile = () => {};

    setAuthLoading(true);

    (async () => {
      const { doc, db, onSnapshot, query, collection, where, getDocs, updateDoc, addDoc, setDoc, deleteDoc, serverTimestamp, auth, handleFirestoreError, OperationType } = await loadFirebase();
      if (!isMounted) return;

      const userRef = doc(db, "users", user.uid);

      // Use onSnapshot for real-time profile updates
      unsubProfile = onSnapshot(userRef,
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

        // Check if we need to merge seeded data (if no discounts assigned yet) - only run once
        if (!discountsChecked.current && (!data.discountIds || data.discountIds.length === 0)) {
          discountsChecked.current = true;
          console.log("Profile has no discounts, checking for seeded data...");
          let q;
          if (user.email) {
            q = query(collection(db, "users"), where("email", "==", user.email));
          } else if (user.phoneNumber) {
            q = query(collection(db, "users"), where("mobile", "==", user.phoneNumber));
          }

          // Runs in the background so the profile shows straight away; a merge triggers a fresh snapshot.
          if (q) {
            getDocs(q).then((querySnap) => {
              const seededDoc = querySnap.docs.find(d => d.id !== user.uid);
              const seededData = seededDoc?.data() as UserProfile | undefined;
              if (seededData?.discountIds && seededData.discountIds.length > 0) {
                console.log("Merging seeded discounts for:", user.email || user.phoneNumber);
                return updateDoc(userRef, {
                  discountIds: seededData.discountIds,
                  updatedAt: serverTimestamp()
                });
              }
            }).catch((err) => console.error("Error checking for seeded discounts:", err));
          }
        }

        // Update lastLoginAt once per session to keep Staff Directory sort current
        if (!lastLoginAtUpdated.current) {
          lastLoginAtUpdated.current = true;
          updateDoc(userRef, { lastLoginAt: serverTimestamp() }).catch(() => {});
        }

        // Log login event throttled to once every 15 mins (to avoid spam in usage_logs)
        const lastLoginTime = localStorage.getItem(`last_login_${user.uid}`);
        const now = Date.now();
        const isThrottled = lastLoginTime && (now - parseInt(lastLoginTime) < 15 * 60 * 1000);

        if (!loginLogged.current && !isThrottled) {
          loginLogged.current = true;
          localStorage.setItem(`last_login_${user.uid}`, now.toString());
          console.log("Logging login for:", user.email || user.phoneNumber);
          const name = data.name || (data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : data.firstName || data.lastName) || user.email || user.phoneNumber || 'Unknown';
          // Not awaited: the dashboard shouldn't wait on a log write.
          addDoc(collection(db, 'usage_logs'), {
            userId: user.uid,
            userName: name,
            userEmail: user.email || null,
            userCompany: data.company || null,
            type: 'login',
            timestamp: serverTimestamp()
          }).catch((err) => {
            console.error("Error logging login:", err);
            loginLogged.current = false; // Reset on failure to allow retry
            localStorage.removeItem(`last_login_${user.uid}`); // Allow retry on next update
            try { handleFirestoreError(err, OperationType.WRITE, 'usage_logs'); } catch { /* logged */ }
          });
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
    })();

    return () => {
      isMounted = false;
      unsubProfile();
    };
  }, [user]);

  // Login toast notifications removed

  return (
    <ErrorBoundary>
      <Toaster position="top-center" richColors />
      
      {/* Back to Top Button */}
      <AnimatePresence>
        {showBackToTop && view !== 'portal' && (
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
              {showPublicChrome && (
                <>
                  <nav
                    className={cn(
                      "fixed left-0 right-0 z-[10000] transition-shadow duration-300 bg-white/95 backdrop-blur-md border-b",
                      impersonatedProfile ? "top-[38px]" : "top-0",
                      isScrolled ? "border-black/10 shadow-sm" : "border-transparent"
                    )}
                  >
                    <div className="max-w-7xl mx-auto h-16 md:h-[72px] px-5 md:px-12 flex items-center justify-between gap-6">
                    <a
                      href="/"
                      aria-label="Shane Ruddle — home"
                      className="flex items-center gap-3 shrink-0"
                      onClick={handleLinkClick}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" className="w-9 h-9 shrink-0" aria-hidden="true">
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
                      <span className="hidden sm:block font-serif text-xl tracking-[0.18em] uppercase whitespace-nowrap">
                        Shane <span className="font-semibold">Ruddle</span>
                      </span>
                    </a>

                    <div className="hidden xl:flex items-center gap-6 min-w-0">
                      {/* Past Ventures stays in the mobile menu and footer; the desktop bar has no room for it. */}
                      {NAV_LINKS.filter((link) => link.view !== 'past-ventures').map((link) => (
                        <a
                          key={link.view}
                          href={VIEW_PATHS[link.view]}
                          onClick={handleLinkClick}
                          aria-current={view === link.view ? 'page' : undefined}
                          className={`text-[11px] font-medium uppercase tracking-[0.18em] transition-colors whitespace-nowrap ${view === link.view ? 'text-gold-deep' : 'text-black/60 hover:text-ink'}`}
                        >
                          {link.label}
                        </a>
                      ))}

                      {isWhitelisted && (
                        <>
                          <span className="w-px h-5 bg-black/10" aria-hidden />
                          <button
                            onClick={() => { setView('portal'); window.scrollTo(0, 0); }}
                            className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-deep hover:text-ink transition-colors whitespace-nowrap"
                          >
                            <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                          </button>
                        </>
                      )}

                      <SilentErrorBoundary>
                        <Suspense fallback={null}>
                          {authActive ? (
                              <Auth key="desktop-auth" user={user} loading={authLoading} autoOpen={openLoginOnReady} onAutoOpened={() => setOpenLoginOnReady(false)} />
                            ) : (
                              <LoginButton onClick={() => { setOpenLoginOnReady(true); setAuthActive(true); setIsMenuOpen(false); }} />
                            )}
                        </Suspense>
                      </SilentErrorBoundary>
                    </div>

                    <button
                      aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                      className="xl:hidden text-ink p-2 -mr-2 hover:bg-black/5 rounded-full transition-colors"
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                      {isMenuOpen ? <X /> : <Menu />}
                    </button>
                    </div>
                  </nav>

                  {/* Mobile Menu: a compact sheet under the top bar */}
                  <AnimatePresence>
                    {isMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                        className={cn(
                          "xl:hidden fixed inset-x-0 bottom-0 z-[9999] bg-white flex flex-col font-sans",
                          impersonatedProfile ? "top-[102px]" : "top-16 md:top-[72px]"
                        )}
                      >
                        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pt-2 pb-6">
                          <nav aria-label="Main" className="divide-y divide-black/[0.06]">
                            {NAV_LINKS.map((link) => (
                              <a
                                key={link.view}
                                href={VIEW_PATHS[link.view]}
                                onClick={handleLinkClick}
                                aria-current={view === link.view ? 'page' : undefined}
                                className={`flex items-center justify-between py-[11px] text-[16px] transition-colors ${view === link.view ? 'text-gold-deep font-medium' : 'text-ink'}`}
                              >
                                {link.label}
                                <ChevronRight className="w-4 h-4 text-black/25" />
                              </a>
                            ))}
                          </nav>

                          <div className="mt-5">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/40 mb-3">Popular tools</p>
                            <div className="grid grid-cols-2 gap-2">
                              {MENU_TOOLS.map(({ label, href, Icon }) => (
                                <a
                                  key={href}
                                  href={href}
                                  onClick={handleLinkClick}
                                  className="flex items-center gap-2.5 rounded-[12px] border border-black/[0.08] bg-cream/60 px-3 py-2.5 text-[14px] text-ink active:bg-black/5"
                                >
                                  <Icon className="w-4 h-4 shrink-0 text-gold-deep" />
                                  <span className="truncate">{label}</span>
                                </a>
                              ))}
                            </div>
                          </div>

                          <div className="mt-5">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/40 mb-3">Moving from</p>
                            <div className="flex gap-2">
                              {MENU_COUNTRIES.map(({ label, href }) => (
                                <a
                                  key={href}
                                  href={href}
                                  onClick={handleLinkClick}
                                  className="flex-1 text-center rounded-full border border-black/10 py-2 text-[14px] text-ink active:bg-black/5"
                                >
                                  {label}
                                </a>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Staff area. Signed-in staff get Dashboard straight away, so it never sits on "Loading...". */}
                        <div className="border-t border-black/[0.08] px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white">
                          {user ? (
                            <div className="flex items-center gap-2">
                              {isWhitelisted && (
                                <button
                                  type="button"
                                  onClick={() => { setView('portal'); setIsMenuOpen(false); window.scrollTo(0, 0); }}
                                  className="flex-1 flex items-center justify-center gap-2 h-11 rounded-full bg-ink text-white text-[14px] font-medium"
                                >
                                  <LayoutDashboard className="w-4 h-4 text-gold" /> Staff dashboard
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => { setIsMenuOpen(false); loadFirebase().then(({ auth }) => auth.signOut()); }}
                                className={cn("flex items-center justify-center gap-2 h-11 rounded-full border border-black/10 text-[14px] text-black/60", isWhitelisted ? "px-4" : "flex-1")}
                              >
                                <LogOut className="w-4 h-4" /> Sign out
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => { setOpenLoginOnReady(true); setAuthActive(true); setIsMenuOpen(false); }}
                              className="w-full flex items-center justify-center gap-2 h-11 rounded-full border border-black/10 text-[14px] text-black/70"
                            >
                              <LogIn className="w-4 h-4 text-gold-deep" /> Staff login
                            </button>
                          )}
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
                <Suspense fallback={<div className="fixed inset-0 z-[100] bg-white flex items-center justify-center"><div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>}>
                <AnimatePresence mode="wait">
                  {view === 'about' ? (
                    <motion.div key="about" initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}>
                      <AboutPage />
                    </motion.div>
                  ) : view === 'businesses' ? (
                    <motion.div key="businesses" initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}>
                      <BusinessesPage data={data} />
                    </motion.div>
                  ) : view === 'newsletter' ? (
                    <motion.div key="newsletter" initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}>
                      <NewsletterPage />
                    </motion.div>
                  ) : view === 'contact' ? (
                    <motion.div key="contact" initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}>
                      <ContactPage />
                    </motion.div>
                  ) : view === 'cost-calculator' ? (
                    <motion.div key="cost-calculator" initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}>
                      <CostCalculator />
                    </motion.div>
                  ) : view === 'past-ventures' ? (
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
                  ) : view === 'portal' && displayProfile ? (
                    <motion.div
                      key="portal"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <EmployeePortal userProfile={displayProfile} onBack={() => setView('home')} initialTab={portalTab} />
                    </motion.div>
                  ) : (view === 'portal' && authLoading) || (view === 'home' && ownerHomeHint && ownerRedirectPending) ? (
                    <div key="portal-loading" className="fixed inset-0 z-[100] bg-white flex items-center justify-center">
                      <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : view === 'blog' ? (
                    <motion.div
                      key="blog"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                    >
                      <BlogPageView onBack={() => {
                        setView('home');
                        window.scrollTo(0, 0);
                      }} />
                    </motion.div>
                  ) : view === 'guides' ? (
                    <motion.div key={currentPath} initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}>
                      <GuidePage path={currentPath} />
                    </motion.div>
                  ) : view === 'areas' ? (
                    <motion.div key={currentPath} initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}>
                      <AreasPage path={currentPath} />
                    </motion.div>
                  ) : view === 'visas' ? (
                    <motion.div key={currentPath} initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}>
                      <VisasPage path={currentPath} />
                    </motion.div>
                  ) : view === 'schools' ? (
                    <motion.div key={currentPath} initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}>
                      <SchoolsPage path={currentPath} />
                    </motion.div>
                  ) : view === 'questions' ? (
                    <motion.div key={currentPath} initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}>
                      <QuestionsPage path={currentPath} />
                    </motion.div>
                  ) : view === 'move' ? (
                    <motion.div key="move" initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}>
                      <MovePlanner />
                    </motion.div>
                  ) : view === 'country' ? (
                    <motion.div key={currentPath} initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}>
                      <CountryPage path={currentPath} />
                    </motion.div>
                  ) : view === 'business' ? (
                    <motion.div key={currentPath} initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}>
                      {currentPath.startsWith('/business-in-pattaya/buying-a-business') ? <BuyingBusinessPage /> : currentPath.startsWith('/business-in-pattaya/sell-your-business') ? <SellBusinessPage /> : <BusinessCheck />}
                    </motion.div>
                  ) : view === 'work' ? (
                    <motion.div key="work" initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}>
                      <WorkPage />
                    </motion.div>
                  ) : view === 'prices' ? (
                    <motion.div key="prices" initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}>
                      <PricesPage />
                    </motion.div>
                  ) : view === 'future' ? (
                    <motion.div key="future" initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}>
                      <FuturePage />
                    </motion.div>
                  ) : view === 'trips' ? (
                    <motion.div key="trips" initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}>
                      <TripsPage />
                    </motion.div>
                  ) : view === 'de' ? (
                    <motion.div key={currentPath} initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}>
                      <DeSite path={currentPath} />
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
                      initial={false}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <HomePage data={data} />
                    </motion.div>
                  )}
                </AnimatePresence>
                </Suspense>
              </main>

              <AnimatePresence>
                {selectedCompany && (
                  <CompanyModal 
                    company={selectedCompany} 
                    onClose={() => setSelectedCompany(null)} 
                  />
                )}
              </AnimatePresence>

              {/* Shared footer - all public pages */}
              {showPublicChrome && prefersGerman && (
                <SilentErrorBoundary><Suspense fallback={null}><GermanBanner path={currentPath} /></Suspense></SilentErrorBoundary>
              )}
              {showPublicChrome && (
                <footer id="contact" className="pt-20 md:pt-28 pb-10 px-6 md:px-12 bg-ink text-white scroll-mt-16">
                  <div className="max-w-7xl mx-auto">
                    {/* Newsletter band */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center pb-12 md:pb-16 mb-12 md:mb-16 border-b border-white/10">
                      <div className="lg:col-span-5">
                        <h5 className="font-sans text-[11px] uppercase tracking-[0.25em] font-semibold text-gold mb-3">Newsletter</h5>
                        <p className="text-xl md:text-2xl font-serif text-white/90 leading-snug">
                          One email a week on property, business and life in Pattaya.
                        </p>
                      </div>
                      <div className="lg:col-span-7">
                        {view === 'newsletter' ? (
                          <a href="/newsletter" className="text-sm text-gold">Sign up above ↑</a>
                        ) : (
                          <NewsletterSignup dark source="footer" />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-12 gap-x-6 gap-y-10 md:gap-12 mb-12 md:mb-16">
                      <div className="col-span-2 md:col-span-12 lg:col-span-4">
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
                          <div className="text-2xl font-serif tracking-[0.18em] uppercase">
                            Shane <span className="font-semibold text-gold">Ruddle</span>
                          </div>
                        </div>
                        <p className="text-white/55 font-light max-w-sm mb-6 leading-relaxed">
                          Real estate, hospitality and mobility businesses in Pattaya, Thailand.
                        </p>
                        <p className="flex items-center gap-2 text-sm text-white/55 font-light mb-6">
                          <MapPin className="w-4 h-4 text-gold shrink-0" />
                          Pattaya City, Chon Buri, Thailand
                        </p>
                        <div className="flex flex-wrap items-center gap-4">
                          <a href={VIEW_PATHS['contact']} onClick={handleLinkClick} className="inline-flex items-center gap-2 rounded-full bg-gold text-ink px-5 h-10 text-[11px] uppercase tracking-[0.2em] font-semibold hover:bg-white transition-colors">
                            Ask Shane a question <ArrowUpRight className="w-4 h-4" />
                          </a>
                          <div className="flex gap-4">
                          {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                            <a key={label} href={href} aria-label={label} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:border-gold hover:text-gold transition-all">
                              <Icon className="w-4 h-4" />
                            </a>
                          ))}
                          </div>
                        </div>
                      </div>

                      {FOOTER_COLUMNS.map(col => (
                        <div key={col.title} className="md:col-span-3 lg:col-span-2">
                          <h5 className="font-sans text-[11px] uppercase tracking-[0.25em] font-semibold text-gold mb-5">{col.title}</h5>
                          <ul className="space-y-3">
                            {col.links.map(link => (
                              <li key={link.href}>
                                <a
                                  href={link.href}
                                  hrefLang={link.href === '/de' ? 'de' : undefined}
                                  onClick={handleLinkClick}
                                  className="text-sm text-white/60 hover:text-white transition-colors font-light"
                                >
                                  {link.label}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>

                    {/* Shane's businesses */}
                    <div className="flex flex-col md:flex-row md:items-baseline gap-3 md:gap-6 pb-10 md:pb-12">
                      <h5 className="font-sans text-[11px] uppercase tracking-[0.25em] font-semibold text-gold shrink-0">My businesses</h5>
                      <ul className="flex flex-wrap gap-x-5 gap-y-2">
                        {FOOTER_BUSINESSES.map(b => (
                          <li key={b.href}>
                            <a href={b.href} target="_blank" rel="noopener" className="text-sm text-white/45 hover:text-gold transition-colors font-light">{b.label}</a>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center pt-8 md:pt-12 border-t border-white/10 gap-6">
                      <div className="text-[10px] uppercase tracking-widest text-white/40">
                        © 2026 Shane Ruddle. All Rights Reserved.
                      </div>
                      <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-[10px] uppercase tracking-widest text-white/40">
                        {(displayProfile?.roles?.includes('admin') ||
                          displayProfile?.roles?.includes('accounts') ||
                          displayProfile?.roles?.includes('manager') ||
                          (user?.email && ['shaneruddle@gmail.com', 'alexstein530@gmail.com'].includes(user?.email)) ||
                          !!(displayProfile?.company?.trim())) && (
                          <button
                            onClick={() => { setView('portal'); window.scrollTo(0, 0); }}
                            className="flex items-center gap-1.5 text-gold/80 hover:text-gold transition-colors uppercase tracking-widest"
                          >
                            <Ticket className="w-3 h-3" />
                            Staff discounts
                          </button>
                        )}
                        <a href={VIEW_PATHS['privacy-policy']} onClick={handleLinkClick} className="hover:text-gold transition-colors">
                          Privacy Policy
                        </a>
                        <a href={VIEW_PATHS['terms-of-service']} onClick={handleLinkClick} className="hover:text-gold transition-colors">
                          Terms of Service
                        </a>
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
