import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { db as currentDb } from '../firebase';

const OLD_FIREBASE_CONFIG = {
  projectId: "gen-lang-client-0270104630",
  appId: "1:515356413751:web:48d6b577224553414014b2",
  apiKey: "AIzaSyATtP8Pqsjrg0RjWlhpEeF43HDhhdkYzA0",
  authDomain: "gen-lang-client-0270104630.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-eecc020f-00b9-4462-80cc-f0b3a1babf1f",
  storageBucket: "gen-lang-client-0270104630.firebasestorage.app",
  messagingSenderId: "515356413751",
};

export async function migrateData() {
  console.log("Starting migration...");
  
  // Initialize source app
  const sourceApp = getApps().find(app => app.name === 'source') || initializeApp(OLD_FIREBASE_CONFIG, 'source');
  const sourceDb = getFirestore(sourceApp, OLD_FIREBASE_CONFIG.firestoreDatabaseId);
  const sourceAuth = getAuth(sourceApp);

  // We need to be authenticated on the source app to read data
  // Since we don't have the user's password, we'll try to read as is.
  // If the source DB is locked, we might need to temporarily open it.
  
  const collectionsToMigrate = ['users', 'discounts', 'usage_logs', 'companies'];
  const results: Record<string, number> = {};

  for (const colName of collectionsToMigrate) {
    try {
      console.log(`Step 1: Reading ${colName} from source...`);
      const snapshot = await getDocs(collection(sourceDb, colName));
      let count = 0;

      console.log(`Step 2: Writing ${snapshot.docs.length} documents to destination...`);
      for (const document of snapshot.docs) {
        const data = document.data();
        try {
          // For users, ensure we don't overwrite existing real users if possible
          // But for migration, we usually want a full copy.
          await setDoc(doc(currentDb, colName, document.id), data);
          count++;
        } catch (writeError: any) {
          console.error(`Write error on ${colName}/${document.id}:`, writeError.message);
          // Don't throw here, just log and continue to next doc
        }
      }
      results[colName] = count;
      console.log(`Successfully migrated ${count} documents from ${colName}`);
    } catch (error: any) {
      console.error(`Error migrating ${colName}:`, error.message);
      results[colName + '_error'] = -1;
    }
  }

  return results;
}
