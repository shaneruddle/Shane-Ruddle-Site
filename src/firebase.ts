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
  signInWithPhoneNumber
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, onSnapshot, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

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
  discountId: string;
  restaurantId: string;
  timestamp: Timestamp;
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
  agent: string;
  dealType: 'new' | 'renewal' | '-';
  isTransfer?: boolean;
  transferGroupId?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  createdBy?: string;
}
