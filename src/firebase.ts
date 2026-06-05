import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  browserLocalPersistence,
  setPersistence
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, onSnapshot, addDoc, serverTimestamp, Timestamp, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || '(default)',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Ensure persistence is set correctly for cross-origin iframe contexts
setPersistence(auth, browserLocalPersistence).catch(err => console.error("Error setting persistence:", err));

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const storage = getStorage(app, `gs://${firebaseConfig.storageBucket}`);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
// Add explicit scopes to improve token acquisition reliability
googleProvider.addScope('profile');
googleProvider.addScope('email');

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const isQuotaError = error instanceof Error && error.message.includes('Quota limit exceeded');
  
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  
  if (isQuotaError) {
    console.warn('Firestore Quota Exceeded for:', path);
    // Return gracefully instead of throwing to prevent application crash
    return;
  }

  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface UserProfile {
  uid: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  nickname?: string;
  role?: 'admin' | 'employee' | 'manager' | 'accounts';
  roles: ('admin' | 'employee' | 'manager' | 'accounts')[];
  active?: boolean;
  employeeId?: string;
  discountCode?: string;
  discountIds?: string[];
  bio?: string;
  birthday?: string;
  company?: string;
  contractLink?: string;
  employedFrom?: string;
  finishWork?: string;
  mobile?: string;
  position?: string;
  preferredLanguage?: string;
  profileImage?: string;
  tempPass?: string;
  companyId?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface DBCompany {
  id: string;
  name: string;
  website?: string;
  logo?: string;
  description?: string;
  createdAt?: Timestamp;
}

export interface Discount {
  id: string;
  name: string;
  description?: string;
  percentage: number;
  restaurantId: string;
  active?: boolean;
}

export interface UsageLog {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  userCompany?: string;
  discountId?: string;
  discountName?: string;
  restaurantId?: string;
  type?: 'redemption' | 'login' | 'finance_create' | 'finance_update' | 'finance_delete' | 'signup' | 'profile_update' | 'employee_update';
  details?: string;
  timestamp: Timestamp;
  source?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  metaDescription?: string;
  keywords?: string;
  body: string;
  category: 'My Advice' | 'Property' | 'Car Rental' | 'Pattaya News';
  imageUrl?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  authorId?: string;
  authorName?: string;
  published?: boolean;
}

export interface FinanceTransaction {
  id: string;
  section: 'ABPC' | 'ECRE';
  type: 'income' | 'expense';
  account: 'trading' | 'savings';
  date: string;
  description: string;
  amount: number;
  agent?: string;
  agentId?: string;
  leadFrom?: string;
  dealType: 'new' | 'renewal' | '-';
  isTransfer?: boolean;
  transferGroupId?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  createdBy?: string;
}

export interface SiteImage {
  id: string;
  name: string;
  url: string;
  storagePath: string;
  uploadedBy: string;
  uploadedAt: Timestamp;
  size?: number;
  type?: string;
}

