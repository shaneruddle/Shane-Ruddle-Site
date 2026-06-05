import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { auth, googleProvider } from '../firebase';
import { 
  signInWithPopup, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { LogIn, LogOut, User, Mail, Lock, Loader2, X, ChevronRight, AlertCircle, Phone, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthProps {
  user: any;
  loading: boolean;
  key?: string;
}

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
    confirmationResult: ConfirmationResult;
  }
}

export default function Auth({ user, loading }: AuthProps) {
  const [showModal, setShowModal] = useState(false);
  console.log("Auth rendering. User:", user?.uid, "Loading:", loading, "ShowModal:", showModal);
  const [mode, setMode] = useState<'login' | 'register' | 'reset' | 'phone'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState<ConfirmationResult | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    console.log("Auth Component Mounted. Instance:", user ? 'Logged In' : 'Logged Out');
    return () => console.log("Auth Component Unmounted. Instance:", user ? 'Logged In' : 'Logged Out');
  }, []);

  useEffect(() => {
    console.log("Auth Modal State Changed:", showModal, "Instance:", user ? 'Logged In' : 'Logged Out');
    
    if (showModal && mode === 'phone') {
      // Ensure we have a fresh recaptcha verifier every time we enter phone mode
      // This prevents the "reCAPTCHA client element has been removed" error
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          console.error("Error clearing recaptcha:", e);
        }
      }
      // Small delay to ensure the DOM element 'recaptcha-container' is rendered
      const timer = setTimeout(() => {
        setupRecaptcha();
      }, 100);
      return () => clearTimeout(timer);
    }

    if (!showModal) {
      // Reset state when modal closes
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = undefined as any;
        } catch (e) {
          console.error("Error clearing recaptcha on close:", e);
        }
      }
      setMode('login');
      setAuthError(null);
      setResetSent(false);
      setEmail('');
      setPassword('');
      setDisplayName('');
      setPhoneNumber('');
      setVerificationCode('');
      setVerificationId(null);
    }
  }, [showModal, mode]);

  const setupRecaptcha = () => {
    try {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => {
          console.log('Recaptcha resolved');
        }
      });
    } catch (error) {
      console.error('Recaptcha setup error:', error);
    }
  };

  const handleGoogleLogin = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setAuthError(null);
    console.log('Google Login clicked');
    try {
      await signInWithPopup(auth, googleProvider);
      setShowModal(false);
    } catch (error: any) {
      console.error('Google Login full error:', error);
      const errorCode = error.code;
      const errorMessage = error.message;
      
      // Gracefully handle specific error codes
      if (errorCode === 'auth/popup-closed-by-user') {
        console.log('Login popup closed by user');
      } else if (errorCode === 'auth/popup-blocked') {
        setAuthError('Sign-in popup blocked. Please enable popups for this site or try a different browser.');
      } else if (errorCode === 'auth/internal-error') {
        setAuthError('A technical problem occurred during login. This usually happens if cookies are disabled or if your browser is blocking authentication. Try opening this app in a new tab.');
      } else if (errorCode === 'auth/unauthorized-domain') {
        setAuthError('This domain is not authorized for Google Login. Please contact the administrator.');
      } else {
        setAuthError(errorMessage || 'An unexpected error occurred during Google Login.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);

    try {
      if (!verificationId) {
        // Send OTP
        const appVerifier = window.recaptchaVerifier;
        const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
        setVerificationId(confirmationResult);
      } else {
        // Verify OTP
        await verificationId.confirm(verificationCode);
        setShowModal(false);
        setVerificationId(null);
        setVerificationCode('');
      }
    } catch (error: any) {
      console.error('Phone auth error:', error instanceof Error ? error.message : 'Unknown error');
      setAuthError(error.message);
      // Reset recaptcha if it fails
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        setupRecaptcha();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else if (mode === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName) {
          await updateProfile(userCredential.user, { displayName });
        }
      } else if (mode === 'reset') {
        await sendPasswordResetEmail(auth, email, {
          url: 'https://shaneruddle.com',
          handleCodeInApp: false,
        });
        setResetSent(true);
        return;
      }
      setShowModal(false);
      // Reset form
      setEmail('');
      setPassword('');
      setDisplayName('');
    } catch (error: any) {
      console.error('Auth error:', error instanceof Error ? error.message : 'Unknown error');
      let message = error.message;
      if (error.code === 'auth/user-not-found') message = "No account found with this email.";
      if (error.code === 'auth/wrong-password') message = "Incorrect password.";
      if (error.code === 'auth/email-already-in-use') message = "An account already exists with this email.";
      setAuthError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const toggleModal = (val: boolean) => {
    console.log("--- TOGGLING MODAL ---", val);
    setShowModal(val);
  };

  if (loading) return (
    <button 
      disabled 
      className="flex items-center gap-2 px-6 py-2 bg-gold/50 text-black/20 text-xs font-bold uppercase tracking-widest rounded-full cursor-wait relative z-[110]"
    >
      <Loader2 className="w-3 h-3 animate-spin" />
      Loading...
    </button>
  );

  if (user) {
    return (
      <div className="flex items-center gap-4 relative z-[110]">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-black/5 rounded-full">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || 'User'} className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center text-gold text-[10px] font-bold">
              {user.displayName?.[0] || user.email?.[0]?.toUpperCase() || user.phoneNumber?.[user.phoneNumber.length - 1]}
            </div>
          )}
          <span className="text-xs font-medium text-black/60 truncate max-w-[100px]">
            {user.displayName || user.email || user.phoneNumber}
          </span>
        </div>
        <button 
          onClick={handleLogout}
          className="p-2 text-black/40 hover:text-red-500 transition-colors cursor-pointer"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative z-[10001] pointer-events-auto">
      <button 
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          const target = e.currentTarget as HTMLElement;
          console.log('--- EMPLOYEE LOGIN CLICKED ---', target?.tagName, "Loading:", loading);
          if (!loading) toggleModal(true);
        }}
        className="flex items-center gap-2 px-6 py-2 bg-gold text-black text-xs font-bold uppercase tracking-widest rounded-full hover:bg-gold-dark transition-all shadow-lg shadow-gold/20 cursor-pointer"
      >
        <LogIn className="w-4 h-4" />
        Employee Login
      </button>

      {document.body && createPortal(
        <AnimatePresence>
          {showModal && (
            <motion.div 
              key="auth-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[20000] flex items-center justify-center p-4 md:p-6 overflow-y-auto bg-black/40 backdrop-blur-sm"
              onClick={() => {
                console.log('--- MODAL OVERLAY CLICKED ---');
                toggleModal(false);
              }}
            >
              <motion.div 
                key="auth-modal-content"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => {
                  console.log('--- MODAL CONTENT CLICKED ---');
                  e.stopPropagation();
                }}
                className="relative w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl my-auto"
              >
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-6 right-6 p-2 text-black/20 hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <LogIn className="w-8 h-8 text-gold" />
                </div>
                <h3 className="text-2xl font-serif">
                  {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Create Account' : mode === 'phone' ? 'Phone Sign In' : 'Reset Password'}
                </h3>
                <p className="text-sm text-black/40 font-light mt-2">
                  {mode === 'login' ? 'Access your employee portal' : mode === 'register' ? 'Join my group of companies' : mode === 'phone' ? 'Enter your mobile number' : 'Enter your email to receive a reset link'}
                </p>
              </div>

              {authError && (
                <div className="mb-6 p-4 bg-red-50 rounded-2xl flex items-start gap-3 text-red-600 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <div id="recaptcha-container"></div>

              {mode === 'reset' && resetSent ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <p className="text-sm text-black/60 mb-6">Reset link sent! Please check your inbox.</p>
                  <button 
                    onClick={() => { setMode('login'); setResetSent(false); }}
                    className="text-xs uppercase tracking-widest font-bold text-gold hover:underline"
                  >
                    Back to Login
                  </button>
                </div>
              ) : mode === 'phone' ? (
                <form onSubmit={handlePhoneSignIn} className="space-y-4">
                  {!verificationId ? (
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                      <input 
                        type="tel" 
                        placeholder="+66 81 234 5678"
                        required
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value)}
                        className="w-full bg-black/[0.02] border border-black/5 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-gold transition-colors"
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                      <input 
                        type="text" 
                        placeholder="6-digit code"
                        required
                        maxLength={6}
                        value={verificationCode}
                        onChange={e => setVerificationCode(e.target.value)}
                        className="w-full bg-black/[0.02] border border-black/5 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-gold transition-colors"
                      />
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-black text-white py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-gold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {!verificationId ? 'Send Code' : 'Verify Code'}
                  </button>

                  {verificationId && (
                    <div className="text-center">
                      <button 
                        type="button"
                        onClick={() => { setVerificationId(null); setVerificationCode(''); }}
                        className="text-[10px] uppercase tracking-widest font-bold text-black/40 hover:text-gold transition-colors"
                      >
                        Change Phone Number
                      </button>
                    </div>
                  )}
                </form>
              ) : (
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  {mode === 'register' && (
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                      <input 
                        type="text" 
                        placeholder="Full Name"
                        required
                        value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        className="w-full bg-black/[0.02] border border-black/5 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-gold transition-colors"
                      />
                    </div>
                  )}
                  
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                    <input 
                      type="email" 
                      placeholder="Email Address"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-black/[0.02] border border-black/5 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-gold transition-colors"
                    />
                  </div>

                  {mode !== 'reset' && (
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                      <input 
                        type="password" 
                        placeholder="Password"
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-black/[0.02] border border-black/5 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-gold transition-colors"
                      />
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-black text-white py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-gold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {mode === 'login' ? 'Sign In' : mode === 'register' ? 'Register' : 'Send Link'}
                  </button>

                  {mode === 'login' && (
                    <div className="text-right">
                      <button 
                        type="button"
                        onClick={() => setMode('reset')}
                        className="text-[10px] uppercase tracking-widest font-bold text-black/40 hover:text-gold transition-colors"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}
                </form>
              )}

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-black/5"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                  <span className="bg-white px-4 text-black/20">Or continue with</span>
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting}
                  className="w-full border border-black/5 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-black/[0.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-gold" />
                  ) : (
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
                  )}
                  Google Account
                </button>
                
                {mode !== 'phone' && (
                  <button 
                    onClick={() => { setMode('phone'); setAuthError(null); }}
                    className="w-full border border-black/5 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-black/[0.02] transition-all flex items-center justify-center gap-3"
                  >
                    <Phone className="w-4 h-4 text-black/40" />
                    Phone Number
                  </button>
                )}
              </div>

              <div className="mt-8 text-center text-[10px] uppercase tracking-widest font-bold text-black/40">
                {mode === 'login' || mode === 'phone' ? (
                  <>
                    Don't have an account?{' '}
                    <button onClick={() => setMode('register')} className="text-gold hover:underline">Register</button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button onClick={() => setMode('login')} className="text-gold hover:underline">Sign In</button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    )}
  </div>
  );
}

function CheckCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
